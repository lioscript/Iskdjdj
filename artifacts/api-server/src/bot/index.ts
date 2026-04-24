import { Bot, GrammyError, HttpError } from "grammy";
import { logger } from "../lib/logger";
import { registerUserHandlers } from "./handlers/user";
import { registerAdminHandlers } from "./handlers/admin";

let botInstance: Bot | null = null;

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
