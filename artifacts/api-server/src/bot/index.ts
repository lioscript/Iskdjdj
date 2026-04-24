import { Bot, GrammyError, HttpError } from "grammy";
import { logger } from "../lib/logger";
import { registerUserHandlers } from "./handlers/user";
import { registerAdminHandlers } from "./handlers/admin";
import { listPendingCryptobotOrders } from "./db";
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
