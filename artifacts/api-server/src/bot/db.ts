import path from "node:path";
import fs from "node:fs";
import { fileURLToPath } from "node:url";
import Database from "better-sqlite3";
import { PERIOD_DURATION_MS, type GameId, type PaymentMethod, type PeriodId } from "./catalog";
import type { Lang } from "./i18n";

const here = (() => {
  try {
    return path.dirname(fileURLToPath(import.meta.url));
  } catch {
    return process.cwd();
  }
})();

// In dev/prod, the bundled file lives at artifacts/api-server/dist/index.mjs.
// The source files live at artifacts/api-server/src/bot/*.
// We resolve the data directory relative to the artifact root.
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
const DATA_DIR = path.join(ARTIFACT_ROOT, "data");
fs.mkdirSync(DATA_DIR, { recursive: true });
const DB_PATH = process.env["WINSTAR_DB_PATH"] || path.join(DATA_DIR, "winstar.db");
export const POSTER_PATH = path.join(ARTIFACT_ROOT, "assets", "poster.jpeg");

const db = new Database(DB_PATH);
db.pragma("journal_mode = WAL");
db.pragma("foreign_keys = ON");

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    telegram_id INTEGER PRIMARY KEY,
    username TEXT,
    first_name TEXT,
    language TEXT NOT NULL DEFAULT 'en',
    created_at INTEGER NOT NULL
  );

  CREATE TABLE IF NOT EXISTS prices (
    game TEXT NOT NULL,
    period TEXT NOT NULL,
    amount_usd REAL NOT NULL,
    PRIMARY KEY (game, period)
  );

  CREATE TABLE IF NOT EXISTS keys (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    game TEXT NOT NULL,
    period TEXT NOT NULL,
    value TEXT NOT NULL,
    used INTEGER NOT NULL DEFAULT 0,
    created_at INTEGER NOT NULL
  );
  CREATE INDEX IF NOT EXISTS idx_keys_avail ON keys(game, period, used);

  CREATE TABLE IF NOT EXISTS orders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_telegram_id INTEGER NOT NULL,
    game TEXT NOT NULL,
    period TEXT NOT NULL,
    payment_method TEXT NOT NULL,
    amount_usd REAL NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending',
    delivered_key_id INTEGER,
    created_at INTEGER NOT NULL,
    decided_at INTEGER
  );
  CREATE INDEX IF NOT EXISTS idx_orders_user ON orders(user_telegram_id);
  CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);

  CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL
  );
`);

// Lightweight migration: add Crypto Bot invoice tracking columns and
// expiration / reminder tracking columns to existing `orders` rows on
// already-deployed databases.
{
  const cols = db
    .prepare("PRAGMA table_info(orders)")
    .all() as Array<{ name: string }>;
  const have = new Set(cols.map((c) => c.name));
  if (!have.has("cryptobot_invoice_id")) {
    db.exec("ALTER TABLE orders ADD COLUMN cryptobot_invoice_id TEXT");
  }
  if (!have.has("cryptobot_pay_url")) {
    db.exec("ALTER TABLE orders ADD COLUMN cryptobot_pay_url TEXT");
  }
  if (!have.has("expires_at")) {
    db.exec("ALTER TABLE orders ADD COLUMN expires_at INTEGER");
  }
  if (!have.has("reminded_3d")) {
    db.exec("ALTER TABLE orders ADD COLUMN reminded_3d INTEGER NOT NULL DEFAULT 0");
  }
  if (!have.has("reminded_1d")) {
    db.exec("ALTER TABLE orders ADD COLUMN reminded_1d INTEGER NOT NULL DEFAULT 0");
  }
  if (!have.has("reminded_1h")) {
    db.exec("ALTER TABLE orders ADD COLUMN reminded_1h INTEGER NOT NULL DEFAULT 0");
  }
}
db.exec(
  "CREATE INDEX IF NOT EXISTS idx_orders_cryptobot ON orders(cryptobot_invoice_id) WHERE cryptobot_invoice_id IS NOT NULL",
);
db.exec(
  "CREATE INDEX IF NOT EXISTS idx_orders_expires ON orders(expires_at) WHERE expires_at IS NOT NULL AND status = 'delivered'",
);

// One-time data migrations.
//
// 1. BGMI used to be tracked as a PUBG variant (`pubg_bgmi`); now it is a
//    top-level game with id `bgmi`.
// 2. CODM and MLBB used to be single SKUs (`codm`, `ml`); now each one
//    has region/version variants, with the original SKU mapped onto the
//    `_global` flavour so existing stock/prices/orders are preserved.
{
  const renames: Array<{ from: string; to: string }> = [
    { from: "pubg_bgmi", to: "bgmi" },
    { from: "codm", to: "codm_global" },
    { from: "ml", to: "ml_global" },
  ];
  for (const { from, to } of renames) {
    db.prepare("UPDATE keys SET game = ? WHERE game = ?").run(to, from);
    db.prepare("UPDATE orders SET game = ? WHERE game = ?").run(to, from);
    // For prices we delete duplicates first (in case a destination row
    // was already auto-seeded), then rename the legacy rows.
    db.prepare(
      "DELETE FROM prices WHERE game = ? AND EXISTS (SELECT 1 FROM prices p2 WHERE p2.game = ? AND p2.period = prices.period)",
    ).run(from, to);
    db.prepare("UPDATE prices SET game = ? WHERE game = ?").run(to, from);
  }
}

// ---------- defaults ----------
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

{
  const insertPrice = db.prepare(
    "INSERT OR IGNORE INTO prices (game, period, amount_usd) VALUES (?, ?, ?)",
  );
  for (const p of DEFAULT_PRICES) {
    insertPrice.run(p.game, p.period, p.amount_usd);
  }
}

const DEFAULT_SETTINGS: Record<string, string> = {
  crypto_wallet: "0x9c1b4e6d1bcba589be0cddd039d03b3644664551",
  upi_id: "your-upi@bank",
  binance_id: "123456789",
  // Crypto Pay (https://t.me/CryptoBot) API token. Set via /adm or env.
  cryptobot_token: process.env["CRYPTOBOT_TOKEN"] ?? "",
  // Comma-separated list of crypto assets the user can pay with.
  cryptobot_assets: "USDT,TON,BTC,ETH,BNB,TRX",
};

{
  const insertSetting = db.prepare(
    "INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)",
  );
  for (const [k, v] of Object.entries(DEFAULT_SETTINGS)) {
    insertSetting.run(k, v);
  }
}

// ---------- users ----------
export type UserRow = {
  telegram_id: number;
  username: string | null;
  first_name: string | null;
  language: Lang;
  created_at: number;
};

const getUserStmt = db.prepare<[number], UserRow>(
  "SELECT telegram_id, username, first_name, language, created_at FROM users WHERE telegram_id = ?",
);
const upsertUserStmt = db.prepare(
  `INSERT INTO users (telegram_id, username, first_name, language, created_at)
   VALUES (?, ?, ?, ?, ?)
   ON CONFLICT(telegram_id) DO UPDATE SET username = excluded.username, first_name = excluded.first_name`,
);
const setUserLanguageStmt = db.prepare(
  "UPDATE users SET language = ? WHERE telegram_id = ?",
);

export function getUser(telegramId: number): UserRow | undefined {
  return getUserStmt.get(telegramId) as UserRow | undefined;
}

export function upsertUser(args: {
  telegramId: number;
  username: string | null;
  firstName: string | null;
  defaultLanguage: Lang;
}): UserRow {
  const existing = getUser(args.telegramId);
  if (existing) {
    if (
      existing.username !== args.username ||
      existing.first_name !== args.firstName
    ) {
      upsertUserStmt.run(
        args.telegramId,
        args.username,
        args.firstName,
        existing.language,
        existing.created_at,
      );
    }
    return getUser(args.telegramId)!;
  }
  upsertUserStmt.run(
    args.telegramId,
    args.username,
    args.firstName,
    args.defaultLanguage,
    Date.now(),
  );
  return getUser(args.telegramId)!;
}

export function setUserLanguage(telegramId: number, lang: Lang): void {
  setUserLanguageStmt.run(lang, telegramId);
}

export function countUsers(): number {
  const row = db.prepare("SELECT COUNT(*) as n FROM users").get() as {
    n: number;
  };
  return row.n;
}

// ---------- prices ----------
const getPriceStmt = db.prepare<[string, string], { amount_usd: number }>(
  "SELECT amount_usd FROM prices WHERE game = ? AND period = ?",
);
const setPriceStmt = db.prepare(
  `INSERT INTO prices (game, period, amount_usd) VALUES (?, ?, ?)
   ON CONFLICT(game, period) DO UPDATE SET amount_usd = excluded.amount_usd`,
);

export function getPrice(game: GameId, period: PeriodId): number | null {
  const row = getPriceStmt.get(game, period);
  return row ? row.amount_usd : null;
}

export function setPrice(game: GameId, period: PeriodId, amount: number): void {
  setPriceStmt.run(game, period, amount);
}

// ---------- keys ----------
const insertKeyStmt = db.prepare(
  "INSERT INTO keys (game, period, value, used, created_at) VALUES (?, ?, ?, 0, ?)",
);
const countKeysStmt = db.prepare<
  [string, string],
  { n: number }
>("SELECT COUNT(*) as n FROM keys WHERE game = ? AND period = ? AND used = 0");
const listKeysStmt = db.prepare<
  [string, string],
  { id: number; value: string }
>(
  "SELECT id, value FROM keys WHERE game = ? AND period = ? AND used = 0 ORDER BY id ASC LIMIT 50",
);
const deleteKeyStmt = db.prepare("DELETE FROM keys WHERE id = ?");

export function addKeys(
  game: GameId,
  period: PeriodId,
  values: string[],
): number {
  const txn = db.transaction((vals: string[]) => {
    let n = 0;
    for (const v of vals) {
      const trimmed = v.trim();
      if (!trimmed) continue;
      insertKeyStmt.run(game, period, trimmed, Date.now());
      n++;
    }
    return n;
  });
  return txn(values);
}

export function countAvailableKeys(game: GameId, period: PeriodId): number {
  const row = countKeysStmt.get(game, period) as { n: number };
  return row.n;
}

export function listAvailableKeys(
  game: GameId,
  period: PeriodId,
): { id: number; value: string }[] {
  return listKeysStmt.all(game, period) as { id: number; value: string }[];
}

export function deleteKey(id: number): void {
  deleteKeyStmt.run(id);
}

// Reserve a key for an order atomically: find oldest unused, mark used,
// and link to order. Also stamps the order with `expires_at` so we can
// remind the user before the key expires. Returns key value or null if
// out of stock.
const reserveKeyForOrderTxn = db.transaction(
  (orderId: number, game: GameId, period: PeriodId): { id: number; value: string } | null => {
    const row = db
      .prepare<
        [string, string],
        { id: number; value: string }
      >(
        "SELECT id, value FROM keys WHERE game = ? AND period = ? AND used = 0 ORDER BY id ASC LIMIT 1",
      )
      .get(game, period) as { id: number; value: string } | undefined;
    if (!row) return null;
    db.prepare("UPDATE keys SET used = 1 WHERE id = ?").run(row.id);
    const now = Date.now();
    const expiresAt = now + PERIOD_DURATION_MS[period];
    db.prepare(
      "UPDATE orders SET delivered_key_id = ?, status = 'delivered', decided_at = ?, expires_at = ?, reminded_3d = 0, reminded_1d = 0, reminded_1h = 0 WHERE id = ?",
    ).run(row.id, now, expiresAt, orderId);
    // Hard-delete after assignment per requirement (one-time keys removed from DB after issuance)
    db.prepare("DELETE FROM keys WHERE id = ?").run(row.id);
    return row;
  },
);

export function reserveKeyForOrder(
  orderId: number,
  game: GameId,
  period: PeriodId,
): { id: number; value: string } | null {
  return reserveKeyForOrderTxn(orderId, game, period);
}

// ---------- orders ----------
export type OrderRow = {
  id: number;
  user_telegram_id: number;
  game: GameId;
  period: PeriodId;
  payment_method: PaymentMethod;
  amount_usd: number;
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
};

export type ReminderKind = "3d" | "1d" | "1h";

const insertOrderStmt = db.prepare(
  `INSERT INTO orders (user_telegram_id, game, period, payment_method, amount_usd, status, created_at)
   VALUES (?, ?, ?, ?, ?, 'pending', ?)`,
);
const getOrderStmt = db.prepare<[number], OrderRow>(
  "SELECT * FROM orders WHERE id = ?",
);
const setOrderStatusStmt = db.prepare(
  "UPDATE orders SET status = ?, decided_at = ? WHERE id = ? AND status = 'pending'",
);
const setOrderCryptobotStmt = db.prepare(
  "UPDATE orders SET cryptobot_invoice_id = ?, cryptobot_pay_url = ? WHERE id = ?",
);
const getOrderByInvoiceStmt = db.prepare<[string], OrderRow>(
  "SELECT * FROM orders WHERE cryptobot_invoice_id = ?",
);
const listPendingCryptobotStmt = db.prepare<[], OrderRow>(
  "SELECT * FROM orders WHERE payment_method = 'cryptobot' AND status = 'pending' AND cryptobot_invoice_id IS NOT NULL ORDER BY id ASC LIMIT 100",
);

export function createOrder(args: {
  userTelegramId: number;
  game: GameId;
  period: PeriodId;
  paymentMethod: PaymentMethod;
  amountUsd: number;
}): number {
  const info = insertOrderStmt.run(
    args.userTelegramId,
    args.game,
    args.period,
    args.paymentMethod,
    args.amountUsd,
    Date.now(),
  );
  return Number(info.lastInsertRowid);
}

export function getOrder(id: number): OrderRow | undefined {
  return getOrderStmt.get(id) as OrderRow | undefined;
}

export function rejectOrder(id: number): boolean {
  const info = setOrderStatusStmt.run("rejected", Date.now(), id);
  return info.changes > 0;
}

export function setOrderCryptobotInvoice(
  orderId: number,
  invoiceId: string,
  payUrl: string,
): void {
  setOrderCryptobotStmt.run(invoiceId, payUrl, orderId);
}

export function getOrderByCryptobotInvoice(
  invoiceId: string,
): OrderRow | undefined {
  return getOrderByInvoiceStmt.get(invoiceId) as OrderRow | undefined;
}

export function listPendingCryptobotOrders(): OrderRow[] {
  return listPendingCryptobotStmt.all() as OrderRow[];
}

export function getStats(): { sales: number; revenue: number } {
  const row = db
    .prepare(
      "SELECT COUNT(*) as n, COALESCE(SUM(amount_usd), 0) as r FROM orders WHERE status = 'delivered'",
    )
    .get() as { n: number; r: number };
  return { sales: row.n, revenue: row.r };
}

// ---------- settings ----------
const getSettingStmt = db.prepare<[string], { value: string }>(
  "SELECT value FROM settings WHERE key = ?",
);
const setSettingStmt = db.prepare(
  `INSERT INTO settings (key, value) VALUES (?, ?)
   ON CONFLICT(key) DO UPDATE SET value = excluded.value`,
);

export function getSetting(key: string): string | null {
  const row = getSettingStmt.get(key);
  return row ? row.value : null;
}

export function setSetting(key: string, value: string): void {
  setSettingStmt.run(key, value);
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

// ---------- expiration reminders ----------
const REMINDER_COL: Record<ReminderKind, "reminded_3d" | "reminded_1d" | "reminded_1h"> = {
  "3d": "reminded_3d",
  "1d": "reminded_1d",
  "1h": "reminded_1h",
};

// Returns delivered orders whose key is about to expire within the given
// number of milliseconds and that have not been notified for `kind` yet.
// We exclude orders that already passed their expiration (no point in
// sending a "1 hour left" note 5 hours after the key expired).
export function listOrdersDueForReminder(
  kind: ReminderKind,
  windowMs: number,
): OrderRow[] {
  const now = Date.now();
  const col = REMINDER_COL[kind];
  return db
    .prepare(
      `SELECT * FROM orders
       WHERE status = 'delivered'
         AND expires_at IS NOT NULL
         AND ${col} = 0
         AND expires_at > ?
         AND expires_at <= ?
       ORDER BY expires_at ASC
       LIMIT 200`,
    )
    .all(now, now + windowMs) as OrderRow[];
}

export function markReminderSent(orderId: number, kind: ReminderKind): void {
  const col = REMINDER_COL[kind];
  db.prepare(`UPDATE orders SET ${col} = 1 WHERE id = ?`).run(orderId);
}
