import path from "node:path";
import fs from "node:fs";
import { fileURLToPath } from "node:url";
import Database from "better-sqlite3";
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
// SQLite connection
// ---------------------------------------------------------------------------

const DB_PATH =
  process.env["DATABASE_PATH"] ??
  process.env["DATABASE_URL"] ??
  path.join(ARTIFACT_ROOT, "data", "bot.db");
fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });

const db = new Database(DB_PATH);
db.pragma("journal_mode = WAL");
db.pragma("foreign_keys = ON");
db.pragma("synchronous = NORMAL");

export function closeDb(): void {
  try {
    db.pragma("wal_checkpoint(TRUNCATE)");
    db.close();
  } catch {
    // ignore errors during shutdown
  }
}

// ---------------------------------------------------------------------------
// In-memory caches (populated during initDb, kept up-to-date by setters)
// ---------------------------------------------------------------------------

const priceCache = new Map<string, { usd: number | null; inr: number | null }>();
const settingsCache = new Map<string, string>();
const keyCountCache = new Map<string, number>();
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
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      telegram_id INTEGER PRIMARY KEY,
      username    TEXT,
      first_name  TEXT,
      language    TEXT NOT NULL DEFAULT 'en',
      created_at  INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS prices (
      game       TEXT NOT NULL,
      period     TEXT NOT NULL,
      amount_usd REAL,
      amount_inr REAL,
      PRIMARY KEY (game, period)
    );

    CREATE TABLE IF NOT EXISTS keys (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      game       TEXT NOT NULL,
      period     TEXT NOT NULL,
      value      TEXT NOT NULL,
      used       INTEGER NOT NULL DEFAULT 0,
      created_at INTEGER NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_keys_avail ON keys(game, period, used);

    CREATE TABLE IF NOT EXISTS orders (
      id                     INTEGER PRIMARY KEY AUTOINCREMENT,
      user_telegram_id       INTEGER NOT NULL,
      game                   TEXT NOT NULL,
      period                 TEXT NOT NULL,
      payment_method         TEXT NOT NULL,
      amount_usd             REAL NOT NULL DEFAULT 0,
      amount_inr             REAL,
      status                 TEXT NOT NULL DEFAULT 'pending',
      delivered_key_id       INTEGER,
      created_at             INTEGER NOT NULL,
      decided_at             INTEGER,
      cryptobot_invoice_id   TEXT,
      cryptobot_pay_url      TEXT,
      expires_at             INTEGER,
      reminded_3d            INTEGER NOT NULL DEFAULT 0,
      reminded_1d            INTEGER NOT NULL DEFAULT 0,
      reminded_1h            INTEGER NOT NULL DEFAULT 0,
      admin_notified_expired INTEGER NOT NULL DEFAULT 0
    );
    CREATE INDEX IF NOT EXISTS idx_orders_user ON orders(user_telegram_id);
    CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
    CREATE INDEX IF NOT EXISTS idx_orders_cryptobot ON orders(cryptobot_invoice_id) WHERE cryptobot_invoice_id IS NOT NULL;
    CREATE INDEX IF NOT EXISTS idx_orders_expires ON orders(expires_at) WHERE expires_at IS NOT NULL AND status = 'delivered';

    CREATE TABLE IF NOT EXISTS settings (
      key   TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS bot_admins (
      id                   INTEGER PRIMARY KEY AUTOINCREMENT,
      telegram_id          INTEGER UNIQUE,
      username             TEXT,
      added_at             INTEGER NOT NULL,
      added_by_telegram_id INTEGER
    );
    CREATE UNIQUE INDEX IF NOT EXISTS idx_bot_admins_username ON bot_admins(LOWER(username)) WHERE username IS NOT NULL;

    CREATE TABLE IF NOT EXISTS promocodes (
      id           INTEGER PRIMARY KEY AUTOINCREMENT,
      code         TEXT NOT NULL UNIQUE COLLATE NOCASE,
      discount_pct INTEGER NOT NULL,
      max_uses     INTEGER NOT NULL,
      uses_left    INTEGER NOT NULL,
      created_at   INTEGER NOT NULL
    );
    CREATE TABLE IF NOT EXISTS promocode_uses (
      id               INTEGER PRIMARY KEY AUTOINCREMENT,
      promo_id         INTEGER NOT NULL,
      user_telegram_id INTEGER NOT NULL,
      used_at          INTEGER NOT NULL,
      UNIQUE(promo_id, user_telegram_id)
    );
  `);

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

  const insertPrice = db.prepare(`
    INSERT INTO prices (game, period, amount_usd)
    VALUES (?, ?, ?)
    ON CONFLICT (game, period) DO NOTHING
  `);
  for (const p of DEFAULT_PRICES) {
    insertPrice.run(p.game, p.period, p.amount_usd);
  }

  const DEFAULT_SETTINGS: Record<string, string> = {
    crypto_wallet: "0x9c1b4e6d1bcba589be0cddd039d03b3644664551",
    upi_id: "your-upi@bank",
    binance_id: "123456789",
    cryptobot_token: process.env["CRYPTOBOT_TOKEN"] ?? "",
    cryptobot_assets: "USDT,TON,BTC,ETH,BNB,TRX",
    testflight_link: "",
  };
  const insertSetting = db.prepare(`
    INSERT INTO settings (key, value)
    VALUES (?, ?)
    ON CONFLICT (key) DO NOTHING
  `);
  for (const [k, v] of Object.entries(DEFAULT_SETTINGS)) {
    insertSetting.run(k, v);
  }

  const priceRows = db.prepare(`SELECT game, period, amount_usd, amount_inr FROM prices`).all() as {
    game: string; period: string; amount_usd: number | null; amount_inr: number | null;
  }[];
  for (const r of priceRows) {
    priceCache.set(priceCacheKey(r.game, r.period), { usd: r.amount_usd, inr: r.amount_inr });
  }

  const settingRows = db.prepare(`SELECT key, value FROM settings`).all() as { key: string; value: string }[];
  for (const r of settingRows) {
    settingsCache.set(r.key, r.value);
  }

  const keyCountRows = db.prepare(`
    SELECT game, period, COUNT(*) AS n FROM keys WHERE used = 0 GROUP BY game, period
  `).all() as { game: string; period: string; n: number }[];
  for (const r of keyCountRows) {
    keyCountCache.set(priceCacheKey(r.game, r.period), Number(r.n));
  }

  const adminRows = db.prepare(`
    SELECT id, telegram_id, username, added_at, added_by_telegram_id FROM bot_admins ORDER BY added_at ASC
  `).all() as BotAdminRow[];
  botAdminsCache = adminRows;
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
  const row = db.prepare(`
    SELECT telegram_id, username, first_name, language, created_at
    FROM users WHERE telegram_id = ?
  `).get(telegramId) as UserRow | undefined;
  return row;
}

export async function upsertUser(args: {
  telegramId: number;
  username: string | null;
  firstName: string | null;
  defaultLanguage: Lang;
}): Promise<UserRow> {
  db.prepare(`
    INSERT INTO users (telegram_id, username, first_name, language, created_at)
    VALUES (?, ?, ?, ?, ?)
    ON CONFLICT (telegram_id) DO UPDATE
      SET username = excluded.username, first_name = excluded.first_name
  `).run(args.telegramId, args.username, args.firstName, args.defaultLanguage, Date.now());
  const row = db.prepare(`SELECT telegram_id, username, first_name, language, created_at FROM users WHERE telegram_id = ?`).get(args.telegramId) as UserRow;
  userLangCache.set(row.telegram_id, row.language as Lang);
  return row;
}

export async function setUserLanguage(telegramId: number, lang: Lang): Promise<void> {
  db.prepare(`UPDATE users SET language = ? WHERE telegram_id = ?`).run(lang, telegramId);
  userLangCache.set(telegramId, lang);
}

export function getCachedUserLanguage(telegramId: number): Lang {
  return userLangCache.get(telegramId) ?? "en";
}

export async function countUsers(): Promise<number> {
  const row = db.prepare(`SELECT COUNT(*) AS n FROM users`).get() as { n: number };
  return Number(row.n);
}

// ---------------------------------------------------------------------------
// prices
// ---------------------------------------------------------------------------

export type PriceCurrency = "usd" | "inr";

export function getPriceUsd(game: GameId, period: PeriodId): number | null {
  return priceCache.get(priceCacheKey(game, period))?.usd ?? null;
}

export function getPriceInr(game: GameId, period: PeriodId): number | null {
  return priceCache.get(priceCacheKey(game, period))?.inr ?? null;
}

export async function setPriceUsd(game: GameId, period: PeriodId, amount: number): Promise<void> {
  db.prepare(`
    INSERT INTO prices (game, period, amount_usd)
    VALUES (?, ?, ?)
    ON CONFLICT (game, period) DO UPDATE SET amount_usd = excluded.amount_usd
  `).run(game, period, amount);
  const entry = priceCache.get(priceCacheKey(game, period)) ?? { usd: null, inr: null };
  priceCache.set(priceCacheKey(game, period), { ...entry, usd: amount });
}

export async function setPriceInr(game: GameId, period: PeriodId, amount: number): Promise<void> {
  db.prepare(`
    INSERT INTO prices (game, period, amount_inr)
    VALUES (?, ?, ?)
    ON CONFLICT (game, period) DO UPDATE SET amount_inr = excluded.amount_inr
  `).run(game, period, amount);
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
  const insert = db.prepare(`INSERT INTO keys (game, period, value, used, created_at) VALUES (?, ?, ?, 0, ?)`);
  let n = 0;
  const now = Date.now();
  for (const v of values) {
    const trimmed = v.trim();
    if (!trimmed) continue;
    insert.run(game, period, trimmed, now);
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
  return db.prepare(`
    SELECT id, value FROM keys WHERE game = ? AND period = ? AND used = 0 ORDER BY id ASC LIMIT 50
  `).all(game, period) as { id: number; value: string }[];
}

export async function deleteKey(id: number): Promise<void> {
  const row = db.prepare(`SELECT game, period FROM keys WHERE id = ?`).get(id) as { game: string; period: string } | undefined;
  db.prepare(`DELETE FROM keys WHERE id = ?`).run(id);
  if (row) {
    const k = priceCacheKey(row.game, row.period);
    keyCountCache.set(k, Math.max(0, (keyCountCache.get(k) ?? 1) - 1));
  }
}

export async function reserveKeyForOrder(
  orderId: number,
  game: GameId,
  period: PeriodId,
): Promise<{ id: number; value: string } | null> {
  const doReserve = db.transaction((oId: number, g: string, p: string) => {
    const key = db.prepare(`
      SELECT id, value FROM keys
      WHERE game = ? AND period = ? AND used = 0
      ORDER BY id ASC LIMIT 1
    `).get(g, p) as { id: number; value: string } | undefined;

    if (!key) return null;

    const now = Date.now();
    const expiresAt = now + PERIOD_DURATION_MS[p as PeriodId];

    db.prepare(`UPDATE keys SET used = 1 WHERE id = ?`).run(key.id);
    db.prepare(`
      UPDATE orders
      SET delivered_key_id = ?,
          status = 'delivered',
          decided_at = ?,
          expires_at = ?,
          reminded_3d = 0,
          reminded_1d = 0,
          reminded_1h = 0
      WHERE id = ?
    `).run(key.id, now, expiresAt, oId);
    db.prepare(`DELETE FROM keys WHERE id = ?`).run(key.id);

    return key;
  });

  const result = doReserve(orderId, game, period) as { id: number; value: string } | null;
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
  const result = db.prepare(`
    INSERT INTO orders (user_telegram_id, game, period, payment_method, amount_usd, amount_inr, status, created_at)
    VALUES (?, ?, ?, ?, ?, ?, 'pending', ?)
  `).run(
    args.userTelegramId,
    args.game,
    args.period,
    args.paymentMethod,
    args.amountUsd,
    args.amountInr ?? null,
    Date.now(),
  );
  return Number(result.lastInsertRowid);
}

export async function getOrder(id: number): Promise<OrderRow | undefined> {
  return db.prepare(`SELECT * FROM orders WHERE id = ?`).get(id) as OrderRow | undefined;
}

export async function rejectOrder(id: number): Promise<boolean> {
  const result = db.prepare(`
    UPDATE orders SET status = 'rejected', decided_at = ?
    WHERE id = ? AND status = 'pending'
  `).run(Date.now(), id);
  return result.changes > 0;
}

export async function setOrderCryptobotInvoice(
  orderId: number,
  invoiceId: string,
  payUrl: string,
): Promise<void> {
  db.prepare(`
    UPDATE orders SET cryptobot_invoice_id = ?, cryptobot_pay_url = ?
    WHERE id = ?
  `).run(invoiceId, payUrl, orderId);
}

export async function getOrderByCryptobotInvoice(
  invoiceId: string,
): Promise<OrderRow | undefined> {
  return db.prepare(`SELECT * FROM orders WHERE cryptobot_invoice_id = ?`).get(invoiceId) as OrderRow | undefined;
}

export async function listPendingCryptobotOrders(): Promise<OrderRow[]> {
  return db.prepare(`
    SELECT * FROM orders
    WHERE payment_method = 'cryptobot' AND status = 'pending' AND cryptobot_invoice_id IS NOT NULL
    ORDER BY id ASC LIMIT 100
  `).all() as OrderRow[];
}

export async function getStats(): Promise<{
  sales: number;
  revenueUsd: number;
  revenueInr: number;
}> {
  const row = db.prepare(`
    SELECT COUNT(*) AS n,
           COALESCE(SUM(amount_usd), 0) AS ru,
           COALESCE(SUM(amount_inr), 0) AS ri
    FROM orders
    WHERE status = 'delivered'
  `).get() as { n: number; ru: number; ri: number };
  return { sales: Number(row.n), revenueUsd: Number(row.ru), revenueInr: Number(row.ri) };
}

// ---------------------------------------------------------------------------
// expiration reminders
// ---------------------------------------------------------------------------

export async function listOrdersDueForReminder(
  kind: ReminderKind,
  windowMs: number,
): Promise<OrderRow[]> {
  const now = Date.now();
  if (kind === "3d") {
    return db.prepare(`
      SELECT * FROM orders
      WHERE status = 'delivered' AND expires_at IS NOT NULL
        AND reminded_3d = 0
        AND expires_at > ? AND expires_at <= ?
      ORDER BY expires_at ASC LIMIT 200
    `).all(now, now + windowMs) as OrderRow[];
  } else if (kind === "1d") {
    return db.prepare(`
      SELECT * FROM orders
      WHERE status = 'delivered' AND expires_at IS NOT NULL
        AND reminded_1d = 0
        AND expires_at > ? AND expires_at <= ?
      ORDER BY expires_at ASC LIMIT 200
    `).all(now, now + windowMs) as OrderRow[];
  } else {
    return db.prepare(`
      SELECT * FROM orders
      WHERE status = 'delivered' AND expires_at IS NOT NULL
        AND reminded_1h = 0
        AND expires_at > ? AND expires_at <= ?
      ORDER BY expires_at ASC LIMIT 200
    `).all(now, now + windowMs) as OrderRow[];
  }
}

export async function markReminderSent(orderId: number, kind: ReminderKind): Promise<void> {
  if (kind === "3d") {
    db.prepare(`UPDATE orders SET reminded_3d = 1 WHERE id = ?`).run(orderId);
  } else if (kind === "1d") {
    db.prepare(`UPDATE orders SET reminded_1d = 1 WHERE id = ?`).run(orderId);
  } else {
    db.prepare(`UPDATE orders SET reminded_1h = 1 WHERE id = ?`).run(orderId);
  }
}

export async function listOrdersDueForAdminExpired(): Promise<OrderRow[]> {
  const now = Date.now();
  return db.prepare(`
    SELECT * FROM orders
    WHERE status = 'delivered' AND expires_at IS NOT NULL
      AND expires_at <= ? AND admin_notified_expired = 0
    ORDER BY expires_at ASC LIMIT 200
  `).all(now) as OrderRow[];
}

export async function markAdminNotifiedExpired(orderId: number): Promise<void> {
  db.prepare(`UPDATE orders SET admin_notified_expired = 1 WHERE id = ?`).run(orderId);
}

// ---------------------------------------------------------------------------
// settings
// ---------------------------------------------------------------------------

export function getSetting(key: string): string | null {
  return settingsCache.get(key) ?? null;
}

export async function setSetting(key: string, value: string): Promise<void> {
  db.prepare(`
    INSERT INTO settings (key, value) VALUES (?, ?)
    ON CONFLICT (key) DO UPDATE SET value = excluded.value
  `).run(key, value);
  settingsCache.set(key, value);
}

export function getCryptoWallet(): string {
  return settingsCache.get("crypto_wallet") ?? "";
}

export function getUpiId(): string {
  return settingsCache.get("upi_id") ?? "";
}

export function getBinanceId(): string {
  return settingsCache.get("binance_id") ?? "";
}

export function getCryptoBotToken(): string {
  return settingsCache.get("cryptobot_token") ?? "";
}

export function getCryptoBotAssets(): string {
  return settingsCache.get("cryptobot_assets") ?? "USDT,TON,BTC,ETH,BNB,TRX";
}

export function getTestflightLink(): string {
  return settingsCache.get("testflight_link") ?? "";
}

// ---------------------------------------------------------------------------
// bot_admins
// ---------------------------------------------------------------------------

export function getCachedBotAdmins(): BotAdminRow[] {
  return botAdminsCache;
}

export async function addBotAdmin(args: {
  telegramId?: number | null;
  username?: string | null;
  addedByTelegramId?: number | null;
}): Promise<BotAdminRow> {
  const now = Date.now();
  const result = db.prepare(`
    INSERT INTO bot_admins (telegram_id, username, added_at, added_by_telegram_id)
    VALUES (?, ?, ?, ?)
  `).run(args.telegramId ?? null, args.username ?? null, now, args.addedByTelegramId ?? null);
  const row = db.prepare(`SELECT id, telegram_id, username, added_at, added_by_telegram_id FROM bot_admins WHERE id = ?`).get(result.lastInsertRowid) as BotAdminRow;
  botAdminsCache = db.prepare(`SELECT id, telegram_id, username, added_at, added_by_telegram_id FROM bot_admins ORDER BY added_at ASC`).all() as BotAdminRow[];
  return row;
}

export async function removeBotAdmin(id: number): Promise<boolean> {
  const result = db.prepare(`DELETE FROM bot_admins WHERE id = ?`).run(id);
  if (result.changes > 0) {
    botAdminsCache = db.prepare(`SELECT id, telegram_id, username, added_at, added_by_telegram_id FROM bot_admins ORDER BY added_at ASC`).all() as BotAdminRow[];
    return true;
  }
  return false;
}

export async function getBotAdminByTelegramId(telegramId: number): Promise<BotAdminRow | undefined> {
  return db.prepare(`SELECT id, telegram_id, username, added_at, added_by_telegram_id FROM bot_admins WHERE telegram_id = ?`).get(telegramId) as BotAdminRow | undefined;
}

export async function getBotAdminByUsername(username: string): Promise<BotAdminRow | undefined> {
  return db.prepare(`SELECT id, telegram_id, username, added_at, added_by_telegram_id FROM bot_admins WHERE LOWER(username) = LOWER(?)`).get(username) as BotAdminRow | undefined;
}

export async function listPendingOrders(): Promise<OrderRow[]> {
  return db.prepare(`
    SELECT * FROM orders WHERE status = 'pending' ORDER BY created_at ASC
  `).all() as OrderRow[];
}

export async function listDeliveredOrders(limit = 50): Promise<OrderRow[]> {
  return db.prepare(`
    SELECT * FROM orders WHERE status = 'delivered' ORDER BY decided_at DESC LIMIT ?
  `).all(limit) as OrderRow[];
}

// ---------------------------------------------------------------------------
// testflight links (per game+period, stored as settings keys)
// ---------------------------------------------------------------------------

function testflightKey(game: string): string {
  return `testflight:${game}`;
}

export function getTestflightLinkFor(game: GameId): string {
  return settingsCache.get(testflightKey(game)) ?? "";
}

export function hasTestflightLinkFor(game: GameId): boolean {
  const v = settingsCache.get(testflightKey(game));
  return !!v && v.length > 0;
}

export async function setTestflightLinkFor(
  game: GameId,
  value: string,
): Promise<void> {
  const key = testflightKey(game);
  db.prepare(`
    INSERT INTO settings (key, value) VALUES (?, ?)
    ON CONFLICT (key) DO UPDATE SET value = excluded.value
  `).run(key, value);
  settingsCache.set(key, value);
}

// ---------------------------------------------------------------------------
// bot_admins helpers (sync wrappers and additional functions)
// ---------------------------------------------------------------------------

export function listBotAdmins(): BotAdminRow[] {
  return botAdminsCache;
}

export function isBotAdminUser(args: {
  telegramId: number;
  username: string | null;
}): boolean {
  for (const admin of botAdminsCache) {
    if (admin.telegram_id !== null && admin.telegram_id === args.telegramId) return true;
    if (
      admin.username !== null &&
      args.username !== null &&
      admin.username.toLowerCase() === args.username.toLowerCase()
    ) {
      return true;
    }
  }
  return false;
}

export function getResolvedBotAdminTelegramIds(): number[] {
  return botAdminsCache
    .map((a) => a.telegram_id)
    .filter((id): id is number => id !== null);
}

export async function removeBotAdminById(id: number): Promise<boolean> {
  return removeBotAdmin(id);
}

export async function addBotAdminByUsername(
  username: string,
  addedByTelegramId: number | null,
): Promise<{ ok: true; row: BotAdminRow } | { ok: false; reason: "duplicate" | "invalid" }> {
  const clean = username.replace(/^@/, "").trim();
  if (!clean || !/^[a-zA-Z0-9_]{3,32}$/.test(clean)) {
    return { ok: false, reason: "invalid" };
  }
  const existing = await getBotAdminByUsername(clean);
  if (existing) return { ok: false, reason: "duplicate" };
  const row = await addBotAdmin({ username: clean, addedByTelegramId });
  return { ok: true, row };
}

// ---------------------------------------------------------------------------
// Promo codes
// ---------------------------------------------------------------------------

export type PromoCodeRow = {
  id: number;
  code: string;
  discount_pct: number;
  max_uses: number;
  uses_left: number;
  created_at: number;
};

export function listPromoCodes(): PromoCodeRow[] {
  return db.prepare(
    `SELECT id, code, discount_pct, max_uses, uses_left, created_at FROM promocodes ORDER BY created_at DESC`,
  ).all() as PromoCodeRow[];
}

export function getPromoByCode(code: string): PromoCodeRow | undefined {
  return db.prepare(
    `SELECT id, code, discount_pct, max_uses, uses_left, created_at FROM promocodes WHERE LOWER(code) = LOWER(?)`,
  ).get(code) as PromoCodeRow | undefined;
}

export function createPromoCode(
  code: string,
  discountPct: number,
  maxUses: number,
): PromoCodeRow {
  const now = Date.now();
  const result = db.prepare(
    `INSERT INTO promocodes (code, discount_pct, max_uses, uses_left, created_at) VALUES (?, ?, ?, ?, ?)`,
  ).run(code.toUpperCase().trim(), discountPct, maxUses, maxUses, now);
  return db.prepare(
    `SELECT id, code, discount_pct, max_uses, uses_left, created_at FROM promocodes WHERE id = ?`,
  ).get(result.lastInsertRowid) as PromoCodeRow;
}

export function deletePromoCode(id: number): boolean {
  const r = db.prepare(`DELETE FROM promocodes WHERE id = ?`).run(id);
  return r.changes > 0;
}

export function hasUserUsedPromo(promoId: number, userTelegramId: number): boolean {
  const row = db.prepare(
    `SELECT id FROM promocode_uses WHERE promo_id = ? AND user_telegram_id = ?`,
  ).get(promoId, userTelegramId);
  return !!row;
}

export function usePromoCode(promoId: number, userTelegramId: number): boolean {
  try {
    db.prepare(
      `INSERT INTO promocode_uses (promo_id, user_telegram_id, used_at) VALUES (?, ?, ?)`,
    ).run(promoId, userTelegramId, Date.now());
    db.prepare(
      `UPDATE promocodes SET uses_left = uses_left - 1 WHERE id = ? AND uses_left > 0`,
    ).run(promoId);
    return true;
  } catch {
    return false;
  }
}
