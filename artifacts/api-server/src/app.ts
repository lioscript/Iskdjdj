import path from "node:path";
import fs from "node:fs";
import { fileURLToPath } from "node:url";
import express, { type Express } from "express";
import cors from "cors";
import pinoHttp from "pino-http";
import router from "./routes";
import { logger } from "./lib/logger";

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
} as const;
const assetOpts = { fallthrough: true, maxAge: "1d" } as const;

app.use("/assets", express.static(ASSETS_DIR, assetOpts));
app.use("/api/assets", express.static(ASSETS_DIR, assetOpts));
app.use(express.static(PUBLIC_DIR, staticOpts));
app.use("/api", express.static(PUBLIC_DIR, staticOpts));

// Health endpoint for the deployment platform.
app.get("/healthz", (_req, res) => {
  res.json({ ok: true });
});

export default app;
