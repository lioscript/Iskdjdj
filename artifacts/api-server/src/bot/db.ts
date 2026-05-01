import path from "node:path";
import fs from "node:fs";
import { fileURLToPath } from "node:url";
import postgres from "postgres";
import {
  PERIOD_DURATION_MS,
  type GameId,
  type PaymentMethod,
  type PeriodId,
} from "./catalog";
import type { Lang } from "./i18n";

const here = (() => {
  try {
    return path.dirname(fileURLToPath(import.meta.url));
  } catch {
    return process.cwd();
  }
})();

function findArtifactRoot(): string {
  let dir = here;
  for (let i = 0; i < 6; i++) {
    if (fs.existsSync(path.join(dir, "package.json"))) {
      return dir;
    }
    const parent = path.dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
  return path.resolve(here, "..");
}

const ARTIFACT_ROOT = findArtifactRoot();
export const POSTER_PATH = path.join(ARTIFACT_ROOT, "assets", "poster.jpeg");

// ---------------------------------------------------------------------------
// PostgreSQL connection
// ---------------------------------------------------------------------------

const DATABASE_URL = process.env["DATABASE_URL"];
if (!DATABASE_URL) {
  throw new Error("DATABASE_URL environment variable is not set");
}

const sql = postgres(DATABASE_URL, {
  // Parse BIGINT (pg type 20) as JS number instead of string.
  // Telegram IDs and timestamps comfortably fit in a 64-bit float (< 2^53).
  types: {
    bigint: {
      to: 20,
      from: [20],
      serialize: (v: number | string) => String(v),
      parse: (v: string) => Number(v),
    },
  },
  // Suppress NOTICE messages (from CREATE TABLE IF NOT EXISTS, etc.)
  onnotice: () => {},
});

// ---------------------------------------------------------------------------
// In-memory caches (populated during initDb, kept up-to-date by setters)
// ---------------------------------------------------------------------------

const priceCache = new Map<string, { usd: number | null; inr: number | null }>();
const settingsCache = new Map<string, string>();
const keyCountCache = new Map<string, number>();
// Keeps user languages in memory so getLang() can remain synchronous in handlers.
const userLangCache = new Map<number, Lang>();

function priceCacheKey(game: string, period: string): string {
  return `${game}:${period}`;
}

export type BotAdminRow = {
  id: number;
  telegram_id: number | null;
  username: string | null;
  added_at: number;
  added_by_telegram_id: number | null;
};

let botAdminsCache: BotAdminRow[] = [];

// ---------------------------------------------------------------------------
// initDb — call once at startup before the bot starts
// ---------------------------------------------------------------------------

export async function initDb(): Promise<void> {
  // Create tables
  await sql`
    CREATE TABLE IF NOT EXISTS users (
      telegram_id BIGINT PRIMARY KEY,
      username    TEXT,
      first_name  TEXT,
      language    TEXT NOT NULL DEFAULT 'en',
      created_at  BIGINT NOT NULL
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS prices (
      game       TEXT NOT NULL,
      period     TEXT NOT NULL,
      amount_usd REAL,
      amount_inr REAL,
      PRIMARY KEY (game, period)
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS keys (
      id         SERIAL PRIMARY KEY,
      game       TEXT NOT NULL,
      period     TEXT NOT NULL,
      value      TEXT NOT NULL,
      used       INTEGER NOT NULL DEFAULT 0,
      created_at BIGINT NOT NULL
    )
  `;
  await sql`CREATE INDEX IF NOT EXISTS idx_keys_avail ON keys(game, period, used)`;

  await sql`
    CREATE TABLE IF NOT EXISTS orders (
      id                    SERIAL PRIMARY KEY,
      user_telegram_id      BIGINT NOT NULL,
      game                  TEXT NOT NULL,
      period                TEXT NOT NULL,
      payment_method        TEXT NOT NULL,
      amount_usd            REAL NOT NULL DEFAULT 0,
      amount_inr            REAL,
      status                TEXT NOT NULL DEFAULT 'pending',
      delivered_key_id      INTEGER,
      created_at            BIGINT NOT NULL,
      decided_at            BIGINT,
      cryptobot_invoice_id  TEXT,
      cryptobot_pay_url     TEXT,
      expires_at            BIGINT,
      reminded_3d           INTEGER NOT NULL DEFAULT 0,
      reminded_1d           INTEGER NOT NULL DEFAULT 0,
      reminded_1h           INTEGER NOT NULL DEFAULT 0,
      admin_notified_expired INTEGER NOT NULL DEFAULT 0
    )
  `;
  await sql`CREATE INDEX IF NOT EXISTS idx_orders_user ON orders(user_telegram_id)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_orders_cryptobot ON orders(cryptobot_invoice_id) WHERE cryptobot_invoice_id IS NOT NULL`;
  await sql`CREATE INDEX IF NOT EXISTS idx_orders_expires ON orders(expires_at) WHERE expires_at IS NOT NULL AND status = 'delivered'`;

  await sql`
    CREATE TABLE IF NOT EXISTS settings (
      key   TEXT PRIMARY KEY,
      value TEXT NOT NULL
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS bot_admins (
      id                   SERIAL PRIMARY KEY,
      telegram_id          BIGINT UNIQUE,
      username             TEXT,
      added_at             BIGINT NOT NULL,
      added_by_telegram_id BIGINT
    )
  `;
  await sql`CREATE UNIQUE INDEX IF NOT EXISTS idx_bot_admins_username ON bot_admins(LOWER(username)) WHERE username IS NOT NULL`;

  // Seed default prices (INSERT … ON CONFLICT DO NOTHING = INSERT OR IGNORE)
  const DEFAULT_PRICES: Array<{ game: GameId; period: PeriodId; amount_usd: number }> = [
    { game: "bgmi", period: "day", amount_usd: 5 },
    { game: "bgmi", period: "week", amount_usd: 20 },
    { game: "bgmi", period: "month", amount_usd: 50 },
    { game: "pubg_global", period: "day", amount_usd: 5 },
    { game: "pubg_global", period: "week", amount_usd: 20 },
    { game: "pubg_global", period: "month", amount_usd: 50 },
    { game: "pubg_taiwan", period: "day", amount_usd: 5 },
    { game: "pubg_taiwan", period: "week", amount_usd: 20 },
    { game: "pubg_taiwan", period: "month", amount_usd: 50 },
    { game: "pubg_korean", period: "day", amount_usd: 5 },
    { game: "pubg_korean", period: "week", amount_usd: 20 },
    { game: "pubg_korean", period: "month", amount_usd: 50 },
    { game: "codm_global", period: "day", amount_usd: 5 },
    { game: "codm_global", period: "week", amount_usd: 18 },
    { game: "codm_global", period: "month", amount_usd: 45 },
    { game: "codm_garena", period: "day", amount_usd: 5 },
    { game: "codm_garena", period: "week", amount_usd: 18 },
    { game: "codm_garena", period: "month", amount_usd: 45 },
    { game: "codm_vietnam", period: "day", amount_usd: 5 },
    { game: "codm_vietnam", period: "week", amount_usd: 18 },
    { game: "codm_vietnam", period: "month", amount_usd: 45 },
    { game: "ml_global", period: "day", amount_usd: 4 },
    { game: "ml_global", period: "week", amount_usd: 15 },
    { game: "ml_global", period: "month", amount_usd: 40 },
    { game: "ml_usa", period: "day", amount_usd: 4 },
    { game: "ml_usa", period: "week", amount_usd: 15 },
    { game: "ml_usa", period: "month", amount_usd: 40 },
    { game: "ml_vietnam", period: "day", amount_usd: 4 },
    { game: "ml_vietnam", period: "week", amount_usd: 15 },
    { game: "ml_vietnam", period: "month", amount_usd: 40 },
    { game: "8bp", period: "day", amount_usd: 3 },
    { game: "8bp", period: "week", amount_usd: 10 },
    { game: "8bp", period: "month", amount_usd: 25 },
    { game: "android_root", period: "day", amount_usd: 5 },
    { game: "android_root", period: "week", amount_usd: 18 },
    { game: "android_root", period: "month", amount_usd: 45 },
    { game: "android_nonroot", period: "day", amount_usd: 5 },
    { game: "android_nonroot", period: "week", amount_usd: 18 },
    { game: "android_nonroot", period: "month", amount_usd: 45 },
  ];
  for (const p of DEFAULT_PRICES) {
    await sql`
      INSERT INTO prices (game, period, amount_usd)
      VALUES (${p.game}, ${p.period}, ${p.amount_usd})
      ON CONFLICT (game, period) DO NOTHING
    `;
  }

  const DEFAULT_SETTINGS: Record<string, string> = {
    crypto_wallet: "0x9c1b4e6d1bcba589be0cddd039d03b3644664551",
    upi_id: "your-upi@bank",
    binance_id: "123456789",
    cryptobot_token: process.env["CRYPTOBOT_TOKEN"] ?? "",
    cryptobot_assets: "USDT,TON,BTC,ETH,BNB,TRX",
    testflight_link: "",
  };
  for (const [k, v] of Object.entries(DEFAULT_SETTINGS)) {
    await sql`
      INSERT INTO settings (key, value)
      VALUES (${k}, ${v})
      ON CONFLICT (key) DO NOTHING
    `;
  }

  // Populate in-memory caches from DB
  const priceRows = await sql<{ game: string; period: string; amount_usd: number | null; amount_inr: number | null }[]>`
    SELECT game, period, amount_usd, amount_inr FROM prices
  `;
  for (const r of priceRows) {
    priceCache.set(priceCacheKey(r.game, r.period), {
      usd: r.amount_usd,
      inr: r.amount_inr,
    });
  }

  const settingRows = await sql<{ key: string; value: string }[]>`
    SELECT key, value FROM settings
  `;
  for (const r of settingRows) {
    settingsCache.set(r.key, r.value);
  }

  const keyCountRows = await sql<{ game: string; period: string; n: number }[]>`
    SELECT game, period, COUNT(*) AS n FROM keys WHERE used = 0 GROUP BY game, period
  `;
  for (const r of keyCountRows) {
    keyCountCache.set(priceCacheKey(r.game, r.period), Number(r.n));
  }

  const adminRows = await sql<BotAdminRow[]>`
    SELECT id, telegram_id, username, added_at, added_by_telegram_id FROM bot_admins ORDER BY added_at ASC
  `;
  botAdminsCache = adminRows as BotAdminRow[];
}

// ---------------------------------------------------------------------------
// users
// ---------------------------------------------------------------------------

export type UserRow = {
  telegram_id: number;
  username: string | null;
  first_name: string | null;
  language: Lang;
  created_at: number;
};

export async function getUser(telegramId: number): Promise<UserRow | undefined> {
  const rows = await sql<UserRow[]>`
    SELECT telegram_id, username, first_name, language, created_at
    FROM users WHERE telegram_id = ${telegramId}
  `;
  return rows[0];
}

export async function upsertUser(args: {
  telegramId: number;
  username: string | null;
  firstName: string | null;
  defaultLanguage: Lang;
}): Promise<UserRow> {
  const rows = await sql<UserRow[]>`
    INSERT INTO users (telegram_id, username, first_name, language, created_at)
    VALUES (${args.telegramId}, ${args.username}, ${args.firstName}, ${args.defaultLanguage}, ${Date.now()})
    ON CONFLICT (telegram_id) DO UPDATE
      SET username = EXCLUDED.username, first_name = EXCLUDED.first_name
    RETURNING telegram_id, username, first_name, language, created_at
  `;
  const row = rows[0]!;
  userLangCache.set(row.telegram_id, row.language as Lang);
  return row;
}

export async function setUserLanguage(telegramId: number, lang: Lang): Promise<void> {
  await sql`UPDATE users SET language = ${lang} WHERE telegram_id = ${telegramId}`;
  userLangCache.set(telegramId, lang);
}

// Synchronous language lookup backed by the in-memory cache.
// Falls back to 'en' if the user is not in cache yet (e.g. first message).
export function getCachedUserLanguage(telegramId: number): Lang {
  return userLangCache.get(telegramId) ?? "en";
}

export async function countUsers(): Promise<number> {
  const rows = await sql<{ n: number }[]>`SELECT COUNT(*) AS n FROM users`;
  return Number(rows[0]!.n);
}

// ---------------------------------------------------------------------------
// prices (write functions are async, read functions use the in-memory cache)
// ---------------------------------------------------------------------------

export type PriceCurrency = "usd" | "inr";

export function getPriceUsd(game: GameId, period: PeriodId): number | null {
  return priceCache.get(priceCacheKey(game, period))?.usd ?? null;
}

export function getPriceInr(game: GameId, period: PeriodId): number | null {
  return priceCache.get(priceCacheKey(game, period))?.inr ?? null;
}

export async function setPriceUsd(game: GameId, period: PeriodId, amount: number): Promise<void> {
  await sql`
    INSERT INTO prices (game, period, amount_usd)
    VALUES (${game}, ${period}, ${amount})
    ON CONFLICT (game, period) DO UPDATE SET amount_usd = EXCLUDED.amount_usd
  `;
  const entry = priceCache.get(priceCacheKey(game, period)) ?? { usd: null, inr: null };
  priceCache.set(priceCacheKey(game, period), { ...entry, usd: amount });
}

export async function setPriceInr(game: GameId, period: PeriodId, amount: number): Promise<void> {
  await sql`
    INSERT INTO prices (game, period, amount_inr)
    VALUES (${game}, ${period}, ${amount})
    ON CONFLICT (game, period) DO UPDATE SET amount_inr = EXCLUDED.amount_inr
  `;
  const entry = priceCache.get(priceCacheKey(game, period)) ?? { usd: null, inr: null };
  priceCache.set(priceCacheKey(game, period), { ...entry, inr: amount });
}

export function getPriceForMethod(
  game: GameId,
  period: PeriodId,
  method: PaymentMethod,
): { amount: number | null; currency: PriceCurrency } {
  if (method === "upi") {
    return { amount: getPriceInr(game, period), currency: "inr" };
  }
  return { amount: getPriceUsd(game, period), currency: "usd" };
}

// ---------------------------------------------------------------------------
// keys
// ---------------------------------------------------------------------------

export async function addKeys(
  game: GameId,
  period: PeriodId,
  values: string[],
): Promise<number> {
  let n = 0;
  const now = Date.now();
  for (const v of values) {
    const trimmed = v.trim();
    if (!trimmed) continue;
    await sql`INSERT INTO keys (game, period, value, used, created_at) VALUES (${game}, ${period}, ${trimmed}, 0, ${now})`;
    n++;
  }
  const k = priceCacheKey(game, period);
  keyCountCache.set(k, (keyCountCache.get(k) ?? 0) + n);
  return n;
}

export function countAvailableKeys(game: GameId, period: PeriodId): number {
  return keyCountCache.get(priceCacheKey(game, period)) ?? 0;
}

export async function listAvailableKeys(
  game: GameId,
  period: PeriodId,
): Promise<{ id: number; value: string }[]> {
  const rows = await sql<{ id: number; value: string }[]>`
    SELECT id, value FROM keys WHERE game = ${game} AND period = ${period} AND used = 0 ORDER BY id ASC LIMIT 50
  `;
  return rows;
}

export async function deleteKey(id: number): Promise<void> {
  // Find the key's game+period first so we can update the count cache.
  const rows = await sql<{ game: string; period: string }[]>`
    SELECT game, period FROM keys WHERE id = ${id}
  `;
  await sql`DELETE FROM keys WHERE id = ${id}`;
  if (rows[0]) {
    const k = priceCacheKey(rows[0].game, rows[0].period);
    keyCountCache.set(k, Math.max(0, (keyCountCache.get(k) ?? 1) - 1));
  }
}

// Reserve a key for an order atomically; also stamps expires_at on the order.
export async function reserveKeyForOrder(
  orderId: number,
  game: GameId,
  period: PeriodId,
): Promise<{ id: number; value: string } | null> {
  const result = await sql.begin(async (txSql) => {
    const keyRows = await txSql<{ id: number; value: string }[]>`
      SELECT id, value FROM keys
      WHERE game = ${game} AND period = ${period} AND used = 0
      ORDER BY id ASC LIMIT 1
      FOR UPDATE SKIP LOCKED
    `;
    if (!keyRows[0]) return null;
    const key = keyRows[0];
    const now = Date.now();
    const expiresAt = now + PERIOD_DURATION_MS[period];
    await txSql`UPDATE keys SET used = 1 WHERE id = ${key.id}`;
    await txSql`
      UPDATE orders
      SET delivered_key_id = ${key.id},
          status = 'delivered',
          decided_at = ${now},
          expires_at = ${expiresAt},
          reminded_3d = 0,
          reminded_1d = 0,
          reminded_1h = 0
      WHERE id = ${orderId}
    `;
    // Hard-delete the key after delivery (one-time use)
    await txSql`DELETE FROM keys WHERE id = ${key.id}`;
    return key;
  });
  if (result) {
    const k = priceCacheKey(game, period);
    keyCountCache.set(k, Math.max(0, (keyCountCache.get(k) ?? 1) - 1));
  }
  return result;
}

// ---------------------------------------------------------------------------
// orders
// ---------------------------------------------------------------------------

export type OrderRow = {
  id: number;
  user_telegram_id: number;
  game: GameId;
  period: PeriodId;
  payment_method: PaymentMethod;
  amount_usd: number;
  amount_inr: number | null;
  status: "pending" | "delivered" | "rejected";
  delivered_key_id: number | null;
  created_at: number;
  decided_at: number | null;
  cryptobot_invoice_id: string | null;
  cryptobot_pay_url: string | null;
  expires_at: number | null;
  reminded_3d: number;
  reminded_1d: number;
  reminded_1h: number;
  admin_notified_expired: number;
};

export type ReminderKind = "3d" | "1d" | "1h";

export async function createOrder(args: {
  userTelegramId: number;
  game: GameId;
  period: PeriodId;
  paymentMethod: PaymentMethod;
  amountUsd: number;
  amountInr?: number | null;
}): Promise<number> {
  const rows = await sql<{ id: number }[]>`
    INSERT INTO orders (user_telegram_id, game, period, payment_method, amount_usd, amount_inr, status, created_at)
    VALUES (${args.userTelegramId}, ${args.game}, ${args.period}, ${args.paymentMethod},
            ${args.amountUsd}, ${args.amountInr ?? null}, 'pending', ${Date.now()})
    RETURNING id
  `;
  return rows[0]!.id;
}

export async function getOrder(id: number): Promise<OrderRow | undefined> {
  const rows = await sql<OrderRow[]>`SELECT * FROM orders WHERE id = ${id}`;
  return rows[0];
}

export async function rejectOrder(id: number): Promise<boolean> {
  const rows = await sql<{ id: number }[]>`
    UPDATE orders SET status = 'rejected', decided_at = ${Date.now()}
    WHERE id = ${id} AND status = 'pending'
    RETURNING id
  `;
  return rows.length > 0;
}

export async function setOrderCryptobotInvoice(
  orderId: number,
  invoiceId: string,
  payUrl: string,
): Promise<void> {
  await sql`
    UPDATE orders SET cryptobot_invoice_id = ${invoiceId}, cryptobot_pay_url = ${payUrl}
    WHERE id = ${orderId}
  `;
}

export async function getOrderByCryptobotInvoice(
  invoiceId: string,
): Promise<OrderRow | undefined> {
  const rows = await sql<OrderRow[]>`
    SELECT * FROM orders WHERE cryptobot_invoice_id = ${invoiceId}
  `;
  return rows[0];
}

export async function listPendingCryptobotOrders(): Promise<OrderRow[]> {
  return sql<OrderRow[]>`
    SELECT * FROM orders
    WHERE payment_method = 'cryptobot' AND status = 'pending' AND cryptobot_invoice_id IS NOT NULL
    ORDER BY id ASC LIMIT 100
  `;
}

export async function getStats(): Promise<{
  sales: number;
  revenueUsd: number;
  revenueInr: number;
}> {
  const rows = await sql<{ n: number; ru: number; ri: number }[]>`
    SELECT COUNT(*) AS n,
           COALESCE(SUM(amount_usd), 0) AS ru,
           COALESCE(SUM(amount_inr), 0) AS ri
    FROM orders
    WHERE status = 'delivered'
  `;
  const r = rows[0]!;
  return { sales: Number(r.n), revenueUsd: Number(r.ru), revenueInr: Number(r.ri) };
}

// ---------------------------------------------------------------------------
// expiration reminders
// ---------------------------------------------------------------------------

const REMINDER_COL: Record<ReminderKind, "reminded_3d" | "reminded_1d" | "reminded_1h"> = {
  "3d": "reminded_3d",
  "1d": "reminded_1d",
  "1h": "reminded_1h",
};

export async function listOrdersDueForReminder(
  kind: ReminderKind,
  windowMs: number,
): Promise<OrderRow[]> {
  const now = Date.now();
  const col = REMINDER_COL[kind];
  // postgres.js doesn't support dynamic column identifiers in tagged templates;
  // use separate queries per kind to keep it safe.
  if (kind === "3d") {
    return sql<OrderRow[]>`
      SELECT * FROM orders
      WHERE status = 'delivered' AND expires_at IS NOT NULL
        AND reminded_3d = 0
        AND expires_at > ${now} AND expires_at <= ${now + windowMs}
      ORDER BY expires_at ASC LIMIT 200
    `;
  } else if (kind === "1d") {
    return sql<OrderRow[]>`
      SELECT * FROM orders
      WHERE status = 'delivered' AND expires_at IS NOT NULL
        AND reminded_1d = 0
        AND expires_at > ${now} AND expires_at <= ${now + windowMs}
      ORDER BY expires_at ASC LIMIT 200
    `;
  } else {
    return sql<OrderRow[]>`
      SELECT * FROM orders
      WHERE status = 'delivered' AND expires_at IS NOT NULL
        AND reminded_1h = 0
        AND expires_at > ${now} AND expires_at <= ${now + windowMs}
      ORDER BY expires_at ASC LIMIT 200
    `;
  }
  // col is used for documentation only above; silence the TS warning:
  void col;
}

export async function markReminderSent(orderId: number, kind: ReminderKind): Promise<void> {
  if (kind === "3d") {
    await sql`UPDATE orders SET reminded_3d = 1 WHERE id = ${orderId}`;
  } else if (kind === "1d") {
    await sql`UPDATE orders SET reminded_1d = 1 WHERE id = ${orderId}`;
  } else {
    await sql`UPDATE orders SET reminded_1h = 1 WHERE id = ${orderId}`;
  }
}

export async function listOrdersDueForAdminExpired(): Promise<OrderRow[]> {
  const now = Date.now();
  return sql<OrderRow[]>`
    SELECT * FROM orders
    WHERE status = 'delivered' AND expires_at IS NOT NULL
      AND expires_at <= ${now} AND admin_notified_expired = 0
    ORDER BY expires_at ASC LIMIT 200
  `;
}

export async function markAdminNotifiedExpired(orderId: number): Promise<void> {
  await sql`UPDATE orders SET admin_notified_expired = 1 WHERE id = ${orderId}`;
}

// ---------------------------------------------------------------------------
// settings (write is async + updates cache; read is sync from cache)
// ---------------------------------------------------------------------------

export function getSetting(key: string): string | null {
  return settingsCache.get(key) ?? null;
}

export async function setSetting(key: string, value: string): Promise<void> {
  await sql`
    INSERT INTO settings (key, value) VALUES (${key}, ${value})
    ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value
  `;
  settingsCache.set(key, value);
}

export function getCryptoWallet(): string {
  return getSetting("crypto_wallet") || "";
}

export function getUpiId(): string {
  return getSetting("upi_id") || "";
}

export function getBinanceId(): string {
  return getSetting("binance_id") || "";
}

export function getCryptoBotToken(): string {
  return getSetting("cryptobot_token") || "";
}

export function getCryptoBotAssets(): string {
  return getSetting("cryptobot_assets") || "USDT,TON";
}

export function getTestflightLink(): string {
  return getSetting("testflight_link") || "";
}

function tfKey(game: GameId, period: PeriodId): string {
  return `testflight_link:${game}:${period}`;
}

export function getTestflightLinkFor(game: GameId, period: PeriodId): string {
  const v = getSetting(tfKey(game, period));
  if (v) return v;
  return getTestflightLink();
}

export async function setTestflightLinkFor(
  game: GameId,
  period: PeriodId,
  value: string,
): Promise<void> {
  await setSetting(tfKey(game, period), value);
}

export function hasTestflightLinkFor(game: GameId, period: PeriodId): boolean {
  return Boolean(getSetting(tfKey(game, period)));
}

// ---------------------------------------------------------------------------
// bot admins (write is async + updates cache; read is sync from cache)
// ---------------------------------------------------------------------------

export function listBotAdmins(): BotAdminRow[] {
  return botAdminsCache;
}

export type AddBotAdminResult =
  | { ok: true; row: BotAdminRow }
  | { ok: false; reason: "invalid" | "duplicate" };

function normalizeUsername(raw: string): string {
  let u = raw.trim();
  if (u.startsWith("https://t.me/")) u = u.slice("https://t.me/".length);
  if (u.startsWith("t.me/")) u = u.slice("t.me/".length);
  if (u.startsWith("@")) u = u.slice(1);
  return u;
}

export function isValidUsername(raw: string): boolean {
  const u = normalizeUsername(raw);
  return /^[A-Za-z][A-Za-z0-9_]{4,31}$/.test(u);
}

export async function addBotAdminByUsername(
  rawUsername: string,
  addedByTelegramId: number | null,
): Promise<AddBotAdminResult> {
  if (!isValidUsername(rawUsername)) return { ok: false, reason: "invalid" };
  const username = normalizeUsername(rawUsername);
  const dup = botAdminsCache.find(
    (r) => r.username?.toLowerCase() === username.toLowerCase(),
  );
  if (dup) return { ok: false, reason: "duplicate" };
  const rows = await sql<BotAdminRow[]>`
    INSERT INTO bot_admins (telegram_id, username, added_at, added_by_telegram_id)
    VALUES (NULL, ${username}, ${Date.now()}, ${addedByTelegramId})
    RETURNING id, telegram_id, username, added_at, added_by_telegram_id
  `;
  const row = rows[0]!;
  botAdminsCache = [...botAdminsCache, row];
  return { ok: true, row };
}

export async function removeBotAdminById(id: number): Promise<boolean> {
  const rows = await sql<{ id: number }[]>`
    DELETE FROM bot_admins WHERE id = ${id} RETURNING id
  `;
  if (rows.length > 0) {
    botAdminsCache = botAdminsCache.filter((r) => r.id !== id);
    return true;
  }
  return false;
}

export function isBotAdminUser(args: {
  telegramId: number;
  username: string | null;
}): boolean {
  // Match by numeric telegram_id first (O(n) but n is tiny).
  const byId = botAdminsCache.find((r) => r.telegram_id === args.telegramId);
  if (byId) return true;
  // Fall back to username match; if found, lazily link the telegram_id.
  if (args.username) {
    const uLower = args.username.toLowerCase();
    const byName = botAdminsCache.find(
      (r) => r.username?.toLowerCase() === uLower,
    );
    if (byName) {
      if (byName.telegram_id === null) {
        // Update cache immediately so subsequent sync checks use the id.
        byName.telegram_id = args.telegramId;
        // Persist async in the background (fire-and-forget is intentional).
        sql`
          UPDATE bot_admins SET telegram_id = ${args.telegramId}
          WHERE id = ${byName.id} AND (telegram_id IS NULL OR telegram_id = ${args.telegramId})
        `.catch(() => {
          /* ignore — another concurrent call might have won the race */
        });
      }
      return true;
    }
  }
  return false;
}

export function getResolvedBotAdminTelegramIds(): number[] {
  return botAdminsCache
    .map((r) => r.telegram_id)
    .filter((n): n is number => typeof n === "number" && n > 0);
}
