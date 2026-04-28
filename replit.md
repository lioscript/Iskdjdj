# Workspace

## Overview

pnpm workspace monorepo using TypeScript. Contains a Telegram bot
(WinStar / Winios cheat keys) for selling game cheat keys, served from
the same Node.js process that runs the small Express API.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Bot framework**: grammy (Telegram, long-polling)
- **Bot database**: SQLite via better-sqlite3 (file at
  `artifacts/api-server/data/winstar.db`)
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)

## Telegram Bot — WinStar

- Code lives in `artifacts/api-server/src/bot/`.
- Started from `src/index.ts` alongside the Express server.
- Long-polling — no webhook required.
- Multi-language UX: English, Русский, हिन्दी.
- Main menu shows the WinStar poster (`assets/poster.jpeg`); other
  menus are text-only and old menus are deleted to avoid duplicates.
- Buy flow: Game → (PUBG region) → Payment method
  (Crypto Bot / Crypto BEP20 / UPI / Binance ID) → Period →
- Dual currency: prices per (game, period) can be set in **USD**
  (used for crypto, Crypto Bot, Binance) and/or **INR** (used for
  UPI). Admin sets each currency separately under
  `/adm` → Prices → game → period → currency. Stats show both
  USD and INR revenue side by side.
  - **Crypto Bot (@CryptoBot)**: a fiat-priced (USD) invoice is created
    on the fly via the Crypto Pay API; the user taps a `Pay` button
    that opens the Crypto Bot mini app, then taps `Check payment`.
    Delivery is automatic — no admin approval. Confirmation arrives
    via two paths for robustness:
    1. `POST /cryptobot/webhook` (HMAC-SHA256 verified against the raw
       body using `crypto-pay-api-signature`).
    2. A 30-second background sweeper that polls `getInvoices` for
       pending orders.
    Both paths funnel through `bot/delivery.ts:deliverPaidOrder`,
    which is idempotent via a SQLite transaction.
  - **Crypto BEP20 / UPI (India) / Binance ID**: user taps
    "I have paid" → admin gets the order with Approve / Reject
    buttons → on approve, a key is automatically pulled from
    inventory, hard-deleted from stock, and delivered to the user.
- Admin panel via `/adm`: statistics, prices, add keys (bulk, one per
  line), view/delete keys, set crypto wallet / UPI ID / Binance ID /
  Crypto Pay token / accepted assets list, and runtime admin
  management (add an admin by `@username`, view all admins, remove
  any non-super admin).
- Who counts as an admin (any of the following gets full /adm access
  and order-approval rights, and is notified of new payment claims):
  - **Owner** — hard-coded ID `5929338019`. Hidden from the admins
    list (intentionally secret).
  - **Super admin** — hard-coded ID `5136124483`. Shown in the
    admins list with a 👑 badge but cannot be removed.
  - Telegram IDs listed in the `ADMIN_TELEGRAM_IDS` env variable.
  - Admins added at runtime via "➕ Add administrator" in `/adm`,
    stored in the `bot_admins` table by `@username` and lazy-linked
    to a Telegram ID the first time they message the bot.

### Required secrets

- `TELEGRAM_BOT_TOKEN` — token from @BotFather.
- `ADMIN_TELEGRAM_IDS` — comma-separated Telegram user IDs.
- `CRYPTOBOT_TOKEN` (optional) — Crypto Pay API token from @CryptoBot
  (or @CryptoTestnetBot). Seeds the `cryptobot_token` setting on first
  start; can also be set/changed any time from the admin panel. When
  unset, the Crypto Bot payment option is hidden.

### Crypto Pay webhook

Configure the URL in @CryptoBot → My Apps → Webhook to
`https://<your-domain>/cryptobot/webhook`. The route is mounted before
`express.json()` so the raw body is preserved for signature
verification.

### Deployment note

The bot needs a continuously running process. Use Reserved VM for
deployment so the long-polling loop and the SQLite file persist.

## Key Commands

- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-server run dev` — run API server + bot

See the `pnpm-workspace` skill for workspace structure, TypeScript
setup, and package details.
