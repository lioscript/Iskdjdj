import { Bot, GrammyError, HttpError } from "grammy";
import { logger } from "../lib/logger";
import { registerUserHandlers } from "./handlers/user";
import { registerAdminHandlers } from "./handlers/admin";
import {
  getUser,
  listOrdersDueForReminder,
  listPendingCryptobotOrders,
  markReminderSent,
  type ReminderKind,
} from "./db";
import { getGameLabel } from "./catalog";
import { t } from "./i18n";
import {
  getInvoices as cbGetInvoices,
  isConfigured as cbIsConfigured,
} from "./cryptobot";
import { deliverPaidOrder } from "./delivery";

let botInstance: Bot | null = null;

export function getBotInstance(): Bot | null {
  return botInstance;
}

const POLL_INTERVAL_MS = 30_000;
const REMINDER_INTERVAL_MS = 60_000;

// How far ahead each reminder can fire. We use a window slightly larger
// than the marker (e.g. 3 days + 1 hour) so that, if the sweeper missed
// a tick due to downtime, the user still gets the reminder a bit late
// instead of not at all.
const REMINDER_WINDOWS_MS: Record<ReminderKind, number> = {
  "3d": 3 * 24 * 60 * 60 * 1000 + 60 * 60 * 1000,
  "1d": 24 * 60 * 60 * 1000 + 60 * 60 * 1000,
  "1h": 60 * 60 * 1000 + 5 * 60 * 1000,
};

const PERIOD_LABEL_KEY: Record<"day" | "week" | "month", "day" | "week" | "month"> = {
  day: "day",
  week: "week",
  month: "month",
};

async function sweepExpirationReminders(bot: Bot): Promise<void> {
  const kinds: ReminderKind[] = ["3d", "1d", "1h"];
  for (const kind of kinds) {
    const orders = listOrdersDueForReminder(kind, REMINDER_WINDOWS_MS[kind]);
    for (const order of orders) {
      const user = getUser(order.user_telegram_id);
      const lang = user?.language ?? "en";
      const tr = t(lang);
      const gameLabel = getGameLabel(order.game);
      const periodLabel = tr.periodLabel[PERIOD_LABEL_KEY[order.period]];
      const text =
        kind === "3d"
          ? tr.expireReminder3d(gameLabel, periodLabel)
          : kind === "1d"
            ? tr.expireReminder1d(gameLabel, periodLabel)
            : tr.expireReminder1h(gameLabel, periodLabel);
      try {
        await bot.api.sendMessage(order.user_telegram_id, text, {
          parse_mode: "Markdown",
        });
        markReminderSent(order.id, kind);
        logger.info(
          { orderId: order.id, kind, userId: order.user_telegram_id },
          "Expiration reminder sent",
        );
      } catch (err) {
        // Mark as sent even on failure so we don't spam a user whose
        // chat is closed/blocked. Telegram will return 403 in that case.
        const e = err as { error_code?: number; description?: string };
        if (e?.error_code === 403) {
          markReminderSent(order.id, kind);
          logger.warn(
            { orderId: order.id, kind },
            "Reminder skipped — user has blocked the bot",
          );
        } else {
          logger.warn({ err, orderId: order.id, kind }, "Failed to send reminder");
        }
      }
    }
  }
}

async function sweepCryptoBotPayments(bot: Bot): Promise<void> {
  if (!cbIsConfigured()) return;
  const pending = listPendingCryptobotOrders();
  if (pending.length === 0) return;
  const ids = pending
    .map((o) => o.cryptobot_invoice_id)
    .filter((x): x is string => Boolean(x));
  try {
    const invoices = await cbGetInvoices(ids);
    const paidById = new Map(
      invoices.filter((i) => i.status === "paid").map((i) => [String(i.invoice_id), i]),
    );
    for (const order of pending) {
      if (!order.cryptobot_invoice_id) continue;
      if (paidById.has(order.cryptobot_invoice_id)) {
        const result = await deliverPaidOrder(bot, order.id);
        if (result === "delivered") {
          logger.info({ orderId: order.id }, "Crypto Pay order delivered (sweeper)");
        }
      }
    }
  } catch (err) {
    logger.warn({ err }, "Crypto Pay sweeper failed");
  }
}

export async function startBot(): Promise<void> {
  const token = process.env["TELEGRAM_BOT_TOKEN"];
  if (!token) {
    logger.warn("TELEGRAM_BOT_TOKEN not set — Telegram bot will not start");
    return;
  }
  if (botInstance) {
    logger.warn("Telegram bot already started");
    return;
  }

  const bot = new Bot(token);
  botInstance = bot;

  // Register order-action handlers and admin first so generic message
  // handler runs after callbacks. (grammy executes in registration order.)
  registerAdminHandlers(bot);
  registerUserHandlers(bot);

  bot.catch((err) => {
    const e = err.error;
    if (e instanceof GrammyError) {
      logger.error({ err: e.description }, "Telegram API error");
    } else if (e instanceof HttpError) {
      logger.error({ err: e.message }, "Telegram network error");
    } else {
      logger.error({ err: e }, "Bot error");
    }
  });

  // Set bot commands so users see them in the Telegram menu
  await bot.api
    .setMyCommands([
      { command: "start", description: "Start / main menu" },
      { command: "menu", description: "Open main menu" },
      { command: "language", description: "Change language" },
    ])
    .catch((err) => logger.warn({ err }, "Failed to set bot commands"));

  // Use long polling. Drop pending updates to avoid floods on restart.
  bot
    .start({
      drop_pending_updates: true,
      onStart: (info) =>
        logger.info(
          { botUsername: info.username, botId: info.id },
          "Telegram bot started",
        ),
    })
    .catch((err) => logger.error({ err }, "Bot polling stopped"));

  // Periodic sweeper: catches any Crypto Pay payments that the webhook
  // missed (or for setups where no webhook is configured at all).
  setInterval(() => {
    sweepCryptoBotPayments(bot).catch((err) =>
      logger.warn({ err }, "Crypto Pay sweeper crashed"),
    );
  }, POLL_INTERVAL_MS).unref();

  // Periodic sweeper: notify users 3 days / 1 day / 1 hour before their
  // delivered key expires.
  setInterval(() => {
    sweepExpirationReminders(bot).catch((err) =>
      logger.warn({ err }, "Expiration reminder sweeper crashed"),
    );
  }, REMINDER_INTERVAL_MS).unref();

  // Graceful shutdown
  const shutdown = (signal: string) => {
    logger.info({ signal }, "Stopping Telegram bot");
    bot
      .stop()
      .catch((err) => logger.error({ err }, "Error stopping bot"));
  };
  process.once("SIGINT", () => shutdown("SIGINT"));
  process.once("SIGTERM", () => shutdown("SIGTERM"));
}
