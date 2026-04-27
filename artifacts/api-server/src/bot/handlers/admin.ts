import type { Bot, Context } from "grammy";
import {
  addKeys,
  countAvailableKeys,
  countUsers,
  deleteKey,
  getBinanceId,
  getCryptoBotAssets,
  getCryptoBotToken,
  getCryptoWallet,
  getOrder,
  getPrice,
  getStats,
  getUpiId,
  getUser,
  rejectOrder,
  reserveKeyForOrder,
  setPrice,
  setSetting,
  upsertUser,
} from "../db";
import { isGameId, isPeriodId, type GameId, type PeriodId } from "../catalog";
import { t, type Lang } from "../i18n";
import {
  adminGamesKb,
  adminPanelKb,
  adminPeriodsKb,
  adminSettingsKb,
  adminViewKeysKb,
  mainMenuKb,
} from "../keyboards";
import { showMenuText } from "../ui";
import { clearState, getState, setState } from "../state";
import { logger } from "../../lib/logger";

function fmtUsd(n: number): string {
  return `$${n.toFixed(n % 1 === 0 ? 0 : 2)}`;
}

function adminIds(): number[] {
  const raw = process.env["ADMIN_TELEGRAM_IDS"] ?? "";
  return raw
    .split(/[,\s]+/)
    .map((s) => Number(s.trim()))
    .filter((n) => Number.isFinite(n) && n > 0);
}

function isAdmin(ctx: Context): boolean {
  const id = ctx.from?.id;
  if (!id) return false;
  return adminIds().includes(id);
}

function getLang(ctx: Context): Lang {
  const u = ctx.from?.id ? getUser(ctx.from.id) : undefined;
  return (u?.language as Lang) ?? "en";
}

async function showAdminHome(ctx: Context): Promise<void> {
  const lang = getLang(ctx);
  const tr = t(lang);
  await showMenuText(ctx, tr.adminPanel, adminPanelKb(lang));
}

async function showStats(ctx: Context): Promise<void> {
  const lang = getLang(ctx);
  const tr = t(lang);
  const s = getStats();
  const text = tr.adminStatsBody(s.sales, fmtUsd(s.revenue), countUsers());
  await showMenuText(ctx, text, adminPanelKb(lang));
}

async function showAdminSettings(ctx: Context): Promise<void> {
  const lang = getLang(ctx);
  const tr = t(lang);
  await showMenuText(
    ctx,
    tr.adminSettingsBody(
      getCryptoWallet(),
      getUpiId(),
      getBinanceId(),
      getCryptoBotToken(),
      getCryptoBotAssets(),
    ),
    adminSettingsKb(lang),
  );
}

export function registerAdminHandlers(bot: Bot): void {
  // Order admin notification button handlers (works in admin DMs only)
  bot.callbackQuery(/^ord:(approve|reject):(\d+)$/, async (ctx) => {
    if (!isAdmin(ctx)) {
      await ctx.answerCallbackQuery({ text: "Admins only" });
      return;
    }
    const action = ctx.match![1] as "approve" | "reject";
    const orderId = Number(ctx.match![2]);
    const order = getOrder(orderId);
    if (!order) {
      await ctx.answerCallbackQuery({ text: "Order not found" });
      return;
    }
    if (order.status !== "pending") {
      await ctx.answerCallbackQuery({ text: "Already processed" });
      try {
        await ctx.editMessageReplyMarkup({ reply_markup: undefined });
      } catch {
        /* ignore */
      }
      return;
    }
    const userLang =
      (getUser(order.user_telegram_id)?.language as Lang) ?? "en";
    const userTr = t(userLang);

    if (action === "reject") {
      rejectOrder(orderId);
      await ctx.answerCallbackQuery({ text: "Rejected" });
      try {
        await ctx.editMessageText(
          `${ctx.callbackQuery.message?.text ?? ""}\n\n— Rejected`,
          { reply_markup: undefined },
        );
      } catch {
        /* ignore */
      }
      try {
        await bot.api.sendMessage(
          order.user_telegram_id,
          userTr.paymentRejected,
          { reply_markup: mainMenuKb(userLang), parse_mode: "Markdown" },
        );
      } catch (err) {
        logger.warn({ err }, "Failed to notify user of rejection");
      }
      return;
    }

    // Approve: assign a key and deliver to user
    const key = reserveKeyForOrder(orderId, order.game, order.period);
    if (!key) {
      await ctx.answerCallbackQuery({ text: "Out of stock" });
      // Mark as rejected so admin doesn't get stuck
      rejectOrder(orderId);
      try {
        await ctx.editMessageText(
          `${ctx.callbackQuery.message?.text ?? ""}\n\n— Out of stock, marked rejected`,
          { reply_markup: undefined },
        );
      } catch {
        /* ignore */
      }
      try {
        await bot.api.sendMessage(order.user_telegram_id, userTr.outOfStock, {
          reply_markup: mainMenuKb(userLang),
          parse_mode: "Markdown",
        });
      } catch (err) {
        logger.warn({ err }, "Failed to notify user of out-of-stock");
      }
      return;
    }

    await ctx.answerCallbackQuery({ text: "Approved & delivered" });
    try {
      await ctx.editMessageText(
        `${ctx.callbackQuery.message?.text ?? ""}\n\n— Approved · key delivered`,
        { reply_markup: undefined },
      );
    } catch {
      /* ignore */
    }
    try {
      await bot.api.sendMessage(
        order.user_telegram_id,
        userTr.yourKey(
          userTr.game[order.game],
          userTr.periodLabel[order.period],
          key.value,
        ),
        { parse_mode: "Markdown", reply_markup: mainMenuKb(userLang) },
      );
    } catch (err) {
      logger.error({ err }, "Failed to deliver key to user");
    }
  });

  // /adm — admin panel entrypoint
  bot.command("adm", async (ctx) => {
    if (!isAdmin(ctx)) {
      const lang = getLang(ctx);
      await showMenuText(ctx, t(lang).adminOnly, mainMenuKb(lang));
      return;
    }
    if (ctx.from) {
      upsertUser({
        telegramId: ctx.from.id,
        username: ctx.from.username ?? null,
        firstName: ctx.from.first_name ?? null,
        defaultLanguage: "en",
      });
    }
    clearState(ctx.chat.id);
    await showAdminHome(ctx);
  });

  bot.command("cancel", async (ctx) => {
    clearState(ctx.chat.id);
    if (isAdmin(ctx)) {
      const lang = getLang(ctx);
      await showMenuText(ctx, t(lang).adminCancelled, adminPanelKb(lang));
    }
  });

  // Admin nav callbacks
  bot.callbackQuery(/^adm:home$/, async (ctx) => {
    if (!isAdmin(ctx)) { await ctx.answerCallbackQuery(); return; }
    await ctx.answerCallbackQuery();
    clearState(ctx.chat?.id ?? 0);
    await showAdminHome(ctx);
  });

  bot.callbackQuery(/^adm:stats$/, async (ctx) => {
    if (!isAdmin(ctx)) { await ctx.answerCallbackQuery(); return; }
    await ctx.answerCallbackQuery();
    await showStats(ctx);
  });

  bot.callbackQuery(/^adm:settings$/, async (ctx) => {
    if (!isAdmin(ctx)) { await ctx.answerCallbackQuery(); return; }
    await ctx.answerCallbackQuery();
    await showAdminSettings(ctx);
  });

  bot.callbackQuery(/^adm:set:(crypto|upi|binance|cbtoken|cbassets)$/, async (ctx) => {
    if (!isAdmin(ctx)) { await ctx.answerCallbackQuery(); return; }
    const which = ctx.match![1] as
      | "crypto"
      | "upi"
      | "binance"
      | "cbtoken"
      | "cbassets";
    const lang = getLang(ctx);
    const tr = t(lang);
    await ctx.answerCallbackQuery();
    if (which === "crypto") {
      setState(ctx.chat!.id, { kind: "await_crypto" });
      await showMenuText(ctx, tr.adminEnterCrypto, adminSettingsKb(lang));
    } else if (which === "upi") {
      setState(ctx.chat!.id, { kind: "await_upi" });
      await showMenuText(ctx, tr.adminEnterUpi, adminSettingsKb(lang));
    } else if (which === "binance") {
      setState(ctx.chat!.id, { kind: "await_binance" });
      await showMenuText(ctx, tr.adminEnterBinance, adminSettingsKb(lang));
    } else if (which === "cbtoken") {
      setState(ctx.chat!.id, { kind: "await_cbtoken" });
      await showMenuText(ctx, tr.adminEnterCryptoBotToken, adminSettingsKb(lang));
    } else {
      setState(ctx.chat!.id, { kind: "await_cbassets" });
      await showMenuText(ctx, tr.adminEnterCryptoBotAssets, adminSettingsKb(lang));
    }
  });

  // Prices
  bot.callbackQuery(/^adm:prices$/, async (ctx) => {
    if (!isAdmin(ctx)) { await ctx.answerCallbackQuery(); return; }
    const lang = getLang(ctx);
    const tr = t(lang);
    await ctx.answerCallbackQuery();
    await showMenuText(ctx, tr.adminPickGameForPrice, adminGamesKb(lang, "price"));
  });

  bot.callbackQuery(/^adm:price:game:(.+)$/, async (ctx) => {
    if (!isAdmin(ctx)) { await ctx.answerCallbackQuery(); return; }
    const g = ctx.match![1]!;
    if (!isGameId(g)) { await ctx.answerCallbackQuery(); return; }
    const lang = getLang(ctx);
    const tr = t(lang);
    await ctx.answerCallbackQuery();
    await showMenuText(
      ctx,
      tr.adminPickPeriodForPrice(tr.game[g]),
      adminPeriodsKb(lang, "price", g),
    );
  });

  bot.callbackQuery(/^adm:price:period:([^:]+):([^:]+)$/, async (ctx) => {
    if (!isAdmin(ctx)) { await ctx.answerCallbackQuery(); return; }
    const g = ctx.match![1]!;
    const p = ctx.match![2]!;
    if (!isGameId(g) || !isPeriodId(p)) { await ctx.answerCallbackQuery(); return; }
    const lang = getLang(ctx);
    const tr = t(lang);
    setState(ctx.chat!.id, { kind: "await_price", game: g, period: p });
    const current = getPrice(g, p);
    await ctx.answerCallbackQuery();
    await showMenuText(
      ctx,
      tr.adminEnterPrice(
        tr.game[g],
        tr.periodLabel[p],
        current !== null ? fmtUsd(current) : "—",
      ),
      adminPanelKb(lang),
    );
  });

  // Add keys
  bot.callbackQuery(/^adm:addkeys$/, async (ctx) => {
    if (!isAdmin(ctx)) { await ctx.answerCallbackQuery(); return; }
    const lang = getLang(ctx);
    const tr = t(lang);
    await ctx.answerCallbackQuery();
    await showMenuText(ctx, tr.adminPickGameForKeys, adminGamesKb(lang, "addkeys"));
  });

  bot.callbackQuery(/^adm:addkeys:game:(.+)$/, async (ctx) => {
    if (!isAdmin(ctx)) { await ctx.answerCallbackQuery(); return; }
    const g = ctx.match![1]!;
    if (!isGameId(g)) { await ctx.answerCallbackQuery(); return; }
    const lang = getLang(ctx);
    const tr = t(lang);
    await ctx.answerCallbackQuery();
    await showMenuText(
      ctx,
      tr.adminPickPeriodForKeys(tr.game[g]),
      adminPeriodsKb(lang, "addkeys", g),
    );
  });

  bot.callbackQuery(/^adm:addkeys:period:([^:]+):([^:]+)$/, async (ctx) => {
    if (!isAdmin(ctx)) { await ctx.answerCallbackQuery(); return; }
    const g = ctx.match![1]!;
    const p = ctx.match![2]!;
    if (!isGameId(g) || !isPeriodId(p)) { await ctx.answerCallbackQuery(); return; }
    const lang = getLang(ctx);
    const tr = t(lang);
    setState(ctx.chat!.id, { kind: "await_keys", game: g, period: p });
    await ctx.answerCallbackQuery();
    await showMenuText(
      ctx,
      tr.adminEnterKeys(tr.game[g], tr.periodLabel[p]),
      adminPanelKb(lang),
    );
  });

  // View / delete keys
  bot.callbackQuery(/^adm:viewkeys$/, async (ctx) => {
    if (!isAdmin(ctx)) { await ctx.answerCallbackQuery(); return; }
    const lang = getLang(ctx);
    const tr = t(lang);
    await ctx.answerCallbackQuery();
    await showMenuText(ctx, tr.adminPickGameForView, adminGamesKb(lang, "viewkeys"));
  });

  bot.callbackQuery(/^adm:viewkeys:game:(.+)$/, async (ctx) => {
    if (!isAdmin(ctx)) { await ctx.answerCallbackQuery(); return; }
    const g = ctx.match![1]!;
    if (!isGameId(g)) { await ctx.answerCallbackQuery(); return; }
    const lang = getLang(ctx);
    const tr = t(lang);
    await ctx.answerCallbackQuery();
    await showMenuText(
      ctx,
      tr.adminPickPeriodForView(tr.game[g]),
      adminPeriodsKb(lang, "viewkeys", g),
    );
  });

  bot.callbackQuery(/^adm:viewkeys:period:([^:]+):([^:]+)$/, async (ctx) => {
    if (!isAdmin(ctx)) { await ctx.answerCallbackQuery(); return; }
    const g = ctx.match![1]!;
    const p = ctx.match![2]!;
    if (!isGameId(g) || !isPeriodId(p)) { await ctx.answerCallbackQuery(); return; }
    const lang = getLang(ctx);
    const tr = t(lang);
    await ctx.answerCallbackQuery();
    const n = countAvailableKeys(g, p);
    const text =
      n === 0
        ? tr.adminNoKeys
        : tr.adminKeysList(tr.game[g], tr.periodLabel[p], n);
    await showMenuText(ctx, text, adminViewKeysKb(lang, g, p));
  });

  bot.callbackQuery(/^adm:delkey:(\d+):([^:]+):([^:]+)$/, async (ctx) => {
    if (!isAdmin(ctx)) { await ctx.answerCallbackQuery(); return; }
    const id = Number(ctx.match![1]);
    const g = ctx.match![2]!;
    const p = ctx.match![3]!;
    if (!isGameId(g) || !isPeriodId(p)) { await ctx.answerCallbackQuery(); return; }
    deleteKey(id);
    const lang = getLang(ctx);
    const tr = t(lang);
    await ctx.answerCallbackQuery({ text: tr.adminKeyDeleted });
    const n = countAvailableKeys(g, p);
    const text =
      n === 0
        ? tr.adminNoKeys
        : tr.adminKeysList(tr.game[g], tr.periodLabel[p], n);
    await showMenuText(ctx, text, adminViewKeysKb(lang, g, p));
  });

  // Free-text input flows for admin (price, keys, settings)
  bot.on("message:text", async (ctx, next) => {
    if (!isAdmin(ctx)) {
      await next();
      return;
    }
    const text = ctx.message.text;
    if (text.startsWith("/")) {
      await next();
      return;
    }
    const state = getState(ctx.chat.id);
    if (!state) {
      await next();
      return;
    }
    const lang = getLang(ctx);
    const tr = t(lang);

    if (state.kind === "await_price") {
      const n = Number(text.replace(",", ".").trim());
      if (!Number.isFinite(n) || n <= 0) {
        await showMenuText(ctx, tr.adminInvalidNumber, adminPanelKb(lang));
        return;
      }
      setPrice(state.game, state.period, n);
      clearState(ctx.chat.id);
      await showMenuText(
        ctx,
        tr.adminPriceUpdated(
          tr.game[state.game],
          tr.periodLabel[state.period],
          fmtUsd(n),
        ),
        adminPanelKb(lang),
      );
      return;
    }

    if (state.kind === "await_keys") {
      const lines = text
        .split(/\r?\n/)
        .map((l) => l.trim())
        .filter((l) => l.length > 0);
      const n = addKeys(state.game, state.period, lines);
      clearState(ctx.chat.id);
      await showMenuText(ctx, tr.adminKeysAdded(n), adminPanelKb(lang));
      return;
    }

    if (state.kind === "await_crypto") {
      setSetting("crypto_wallet", text.trim());
      clearState(ctx.chat.id);
      await showMenuText(ctx, tr.adminCryptoUpdated, adminSettingsKb(lang));
      return;
    }

    if (state.kind === "await_upi") {
      setSetting("upi_id", text.trim());
      clearState(ctx.chat.id);
      await showMenuText(ctx, tr.adminUpiUpdated, adminSettingsKb(lang));
      return;
    }

    if (state.kind === "await_binance") {
      setSetting("binance_id", text.trim());
      clearState(ctx.chat.id);
      await showMenuText(ctx, tr.adminBinanceUpdated, adminSettingsKb(lang));
      return;
    }

    if (state.kind === "await_cbtoken") {
      const trimmed = text.trim();
      const value = trimmed.toLowerCase() === "clear" ? "" : trimmed;
      setSetting("cryptobot_token", value);
      clearState(ctx.chat.id);
      await showMenuText(ctx, tr.adminCryptoBotTokenUpdated, adminSettingsKb(lang));
      return;
    }

    if (state.kind === "await_cbassets") {
      const cleaned = text
        .split(/[,\s]+/)
        .map((s) => s.trim().toUpperCase())
        .filter(Boolean)
        .join(",");
      if (!cleaned) {
        await showMenuText(ctx, tr.adminInvalidNumber, adminSettingsKb(lang));
        return;
      }
      setSetting("cryptobot_assets", cleaned);
      clearState(ctx.chat.id);
      await showMenuText(ctx, tr.adminCryptoBotAssetsUpdated, adminSettingsKb(lang));
      return;
    }
  });
}
