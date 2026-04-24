import path from "node:path";
import fs from "node:fs";
import { fileURLToPath } from "node:url";
import express, { type Express } from "express";
import cors from "cors";
import pinoHttp from "pino-http";
import router from "./routes";
import { logger } from "./lib/logger";
import { verifyWebhookSignature } from "./bot/cryptobot";
import { getBotInstance } from "./bot";
import { deliverPaidOrder } from "./bot/delivery";
import { getOrderByCryptobotInvoice } from "./bot/db";

const app: Express = express();

// Resolve the artifact root so the landing page works in both dev and prod.
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
    if (fs.existsSync(path.join(dir, "package.json"))) return dir;
    const parent = path.dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
  return path.resolve(here, "..");
}
const ARTIFACT_ROOT = findArtifactRoot();
const PUBLIC_DIR = path.join(ARTIFACT_ROOT, "public");
const ASSETS_DIR = path.join(ARTIFACT_ROOT, "assets");

app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return {
          id: req.id,
          method: req.method,
          url: req.url?.split("?")[0],
        };
      },
      res(res) {
        return {
          statusCode: res.statusCode,
        };
      },
    },
  }),
);
app.use(cors());

// Crypto Pay webhook MUST be registered before express.json() so we can
// verify the HMAC signature against the raw request body bytes.
app.post(
  "/cryptobot/webhook",
  express.raw({ type: "*/*", limit: "256kb" }),
  async (req, res) => {
    const raw: Buffer = Buffer.isBuffer(req.body) ? req.body : Buffer.from("");
    const sig = req.header("crypto-pay-api-signature") ?? undefined;
    if (!verifyWebhookSignature(raw, sig)) {
      logger.warn({ sig }, "Crypto Pay webhook: bad signature");
      res.status(401).json({ ok: false, error: "bad_signature" });
      return;
    }
    let payload: { update_type?: string; payload?: { invoice_id?: number } };
    try {
      payload = JSON.parse(raw.toString("utf8"));
    } catch (err) {
      logger.warn({ err }, "Crypto Pay webhook: invalid JSON");
      res.status(400).json({ ok: false, error: "bad_json" });
      return;
    }
    res.json({ ok: true });
    if (payload.update_type !== "invoice_paid") return;
    const invoiceId = payload.payload?.invoice_id;
    if (invoiceId === undefined) return;
    const order = getOrderByCryptobotInvoice(String(invoiceId));
    if (!order) {
      logger.warn({ invoiceId }, "Crypto Pay webhook: no matching order");
      return;
    }
    const bot = getBotInstance();
    if (!bot) {
      logger.warn({ invoiceId }, "Crypto Pay webhook: bot not running yet");
      return;
    }
    deliverPaidOrder(bot, order.id)
      .then((result) => {
        if (result === "delivered") {
          logger.info({ orderId: order.id }, "Crypto Pay order delivered (webhook)");
        }
      })
      .catch((err) =>
        logger.error({ err, orderId: order.id }, "Crypto Pay webhook delivery failed"),
      );
  },
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/api", router);

// Static landing page that redirects users to the Telegram bot.
// We expose the same files at "/" (production root) and "/api"
// (the dev artifact preview path proxies requests under /api/).
const staticOpts = {
  fallthrough: true,
  extensions: ["html"],
  maxAge: "1h",
};
const assetOpts = { fallthrough: true, maxAge: "1d" };

app.use("/assets", express.static(ASSETS_DIR, assetOpts));
app.use("/api/assets", express.static(ASSETS_DIR, assetOpts));
app.use(express.static(PUBLIC_DIR, staticOpts));
app.use("/api", express.static(PUBLIC_DIR, staticOpts));

// Health endpoint for the deployment platform.
app.get("/healthz", (_req, res) => {
  res.json({ ok: true });
});

export default app;
