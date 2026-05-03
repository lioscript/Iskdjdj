import app from "./app";
import { logger } from "./lib/logger";
import { startBot } from "./bot";
import { initDb, closeDb } from "./bot/db";

const rawPort = process.env["PORT"];

if (!rawPort) {
  throw new Error(
    "PORT environment variable is required but was not provided.",
  );
}

const port = Number(rawPort);

if (Number.isNaN(port) || port <= 0) {
  throw new Error(`Invalid PORT value: "${rawPort}"`);
}

function shutdown(signal: string) {
  logger.info({ signal }, "Shutting down — checkpointing database");
  closeDb();
  process.exit(0);
}
process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));

// Initialise DB (create tables, warm caches) then start everything.
initDb()
  .then(() => {
    app.listen(port, (err) => {
      if (err) {
        logger.error({ err }, "Error listening on port");
        process.exit(1);
      }
      logger.info({ port }, "Server listening");
    });

    // Start the Telegram bot alongside the HTTP server.
    startBot().catch((err) => {
      logger.error({ err }, "Failed to start Telegram bot");
    });
  })
  .catch((err) => {
    logger.error({ err }, "Failed to initialise database — shutting down");
    process.exit(1);
  });
