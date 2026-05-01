import type { Bot, Context } from "grammy";
import {
  addBotAdminByUsername,
  addKeys,
  countAvailableKeys,
  countUsers,
  deleteKey,
  getBinanceId,
  getCryptoBotAssets,
  getCryptoBotToken,
  getCryptoWallet,
  getOrder,
  getPriceInr,
  getPriceUsd,
  getResolvedBotAdminTelegramIds,
  getStats,
  getCachedUserLanguage,
  getTestflightLinkFor,
  setTestflightLinkFor,
  getUpiId,
  getUser,
  isBotAdminUser,
  listBotAdmins,
  rejectOrder,
  removeBotAdminById,
  reserveKeyForOrder,
  setPriceInr,
  setPriceUsd,
  setSetting,
  upsertUser,
} from "../db";
import { isGameId, isPeriodId, type GameId, type PeriodId } from "../catalog";
import { t, type Lang } from "../i18n";
import {
  adminGamesKb,
  adminListAdminsKb,
  adminPanelKb,
  adminPeriodsKb,
  adminPriceCurrencyKb,
  adminSettingsKb,
  adminViewKeysKb,
  fmtInr,
  mainMenuKb,
} from "../keyboards";
import { showMenuText } from "../ui";
import { clearState, getState, setState } from "../state";
import { sendPostDeliveryInfo } from "../delivery";
import { logger } from "../../lib/logger";

function fmtUsd(n: number): string {
  return `$${n.toFixed(n % 1 === 0 ? 0 : 2)}`;
}

// Hard-coded built-in privileged accounts.
//
// OWNER_ID is the hidden super-super-admin: it has full admin access but
// is intentionally never displayed in the admins list shown via `/adm`.
// SUPER_ADMIN_ID is shown in the list but cannot be removed.
export const OWNER_ID = 5929338019;
export const SUPER_ADMIN_ID = 5136124483;

function envAdminIds(): number[] {
  const raw = process.env["ADMIN_TELEGRAM_IDS"] ?? "";
  return raw
    .split(/[,\s]+/)
    .map((s) => Number(s.trim()))
    .filter((n) => Number.isFinite(n) && n > 0);
}

// Returns every Telegram ID that should receive admin notifications:
// the env-configured admins, the hard-coded OWNER and SUPER_ADMIN, and
// every dynamically-added bot admin whose Telegram ID has been resolved
// (i.e. they have already messaged the bot at least once). Deduplicated.
export function notifyableAdminIds(): number[] {
  const set = new Set<number>([
    OWNER_ID,
    SUPER_ADMIN_ID,
    ...envAdminIds(),
    ...getResolvedBotAdminTelegramIds(),
  ]);
  return Array.from(set);
}

function isAdmin(ctx: Context): boolean {
  const id = ctx.from?.id;
  if (!id) return false;
  if (id === OWNER_ID || id === SUPER_ADMIN_ID) return true;
  if (envAdminIds().includes(id)) return true;
  return isBotAdminUser({
    telegramId: id,
    username: ctx.from?.username ?? null,
  });
}

function getLang(ctx: Context): Lang {
  return ctx.from?.id ? getCachedUserLanguage(ctx.from.id) : "en";
}

async function showAdminHome(ctx: Context): Promise<void> {
  const lang = getLang(ctx);
  const tr = t(lang);
  await showMenuText(ctx, tr.adminPanel, adminPanelKb(lang));
}

async function showStats(ctx: Context): Promise<void> {
  const lang = getLang(ctx);
  const tr = t(lang);
  const [s, users] = await Promise.all([getStats(), countUsers()]);
  const text = tr.adminStatsBody(
    s.sales,
    fmtUsd(s.revenueUsd),
    fmtInr(s.revenueInr),
    users,
  );
  await showMenuText(ctx, text, adminPanelKb(lang));
}

async function showAdminsList(ctx: Context): Promise<void> {
  const lang = getLang(ctx);
  const tr = t(lang);
  const rows = listBotAdmins();
  const lines: string[] = [tr.adminListAdminsTitle, ""];
  // Super admin row first.
  lines.push(
    tr.adminListAdminsRow(
      `\`${SUPER_ADMIN_ID}\``,
      tr.adminListAdminsSuperBadge,
    ),
  );
  if (rows.length === 0 && lines.length > 0) {
    // We still want the empty-state hint when no DB admins are set.
    lines.push("");
    lines.push(tr.adminListAdminsEmpty.split("\n\n").slice(1).join("\n\n"));
  }
  for (const r of rows) {
    const label = r.username
      ? `@${r.username}`
      : r.telegram_id
        ? `\`${r.telegram_id}\``
        : `#${r.id}`;
    const status = r.telegram_id
      ? tr.adminListAdminsResolvedBadge
      : tr.adminListAdminsPendingBadge;
    lines.push(tr.adminListAdminsRow(label, status));
  }
  await showMenuText(ctx, lines.join("\n"), adminListAdminsKb(lang, SUPER_ADMIN_ID));
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
    const order = await getOrder(orderId);
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
      ((await getUser(order.user_telegram_id))?.language as Lang) ?? "en";
    const userTr = t(userLang);

    if (action === "reject") {
      await rejectOrder(orderId);
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
    const key = await reserveKeyForOrder(orderId, order.game, order.period);
    if (!key) {
      await ctx.answerCallbackQuery({ text: "Out of stock" });
      // Mark as rejected so admin doesn't get stuck
      await rejectOrder(orderId);
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
    await sendPostDeliveryInfo(
      bot,
      order.user_telegram_id,
      userLang,
      order.game,
      order.period,
    );
  });

  // /adm — admin panel entrypoint
  bot.command("adm", async (ctx) => {
    if (!isAdmin(ctx)) {
      const lang = getLang(ctx);
      await showMenuText(ctx, t(lang).adminOnly, mainMenuKb(lang));
      return;
    }
    if (ctx.from) {
      await upsertUser({
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

  // ----- Admin management (add / list / remove) -----
  bot.callbackQuery(/^adm:admins$/, async (ctx) => {
    if (!isAdmin(ctx)) { await ctx.answerCallbackQuery(); return; }
    await ctx.answerCallbackQuery();
    await showAdminsList(ctx);
  });

  bot.callbackQuery(/^adm:admins:noop$/, async (ctx) => {
    if (!isAdmin(ctx)) { await ctx.answerCallbackQuery(); return; }
    const lang = getLang(ctx);
    await ctx.answerCallbackQuery({ text: t(lang).adminCannotRemoveSuper });
  });

  bot.callbackQuery(/^adm:admins:add$/, async (ctx) => {
    if (!isAdmin(ctx)) { await ctx.answerCallbackQuery(); return; }
    const lang = getLang(ctx);
    const tr = t(lang);
    setState(ctx.chat!.id, { kind: "await_admin_username" });
    await ctx.answerCallbackQuery();
    await showMenuText(ctx, tr.adminAddAdminPrompt, adminPanelKb(lang));
  });

  bot.callbackQuery(/^adm:admins:del:(\d+)$/, async (ctx) => {
    if (!isAdmin(ctx)) { await ctx.answerCallbackQuery(); return; }
    const id = Number(ctx.match![1]);
    const lang = getLang(ctx);
    const tr = t(lang);
    await removeBotAdminById(id);
    await ctx.answerCallbackQuery({ text: tr.adminAdminRemoved });
    await showAdminsList(ctx);
  });

  bot.callbackQuery(/^adm:set:(crypto|upi|binance|cbtoken|cbassets|testflight)$/, async (ctx) => {
    if (!isAdmin(ctx)) { await ctx.answerCallbackQuery(); return; }
    const which = ctx.match![1] as
      | "crypto"
      | "upi"
      | "binance"
      | "cbtoken"
      | "cbassets"
      | "testflight";
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
    } else if (which === "cbassets") {
      setState(ctx.chat!.id, { kind: "await_cbassets" });
      await showMenuText(ctx, tr.adminEnterCryptoBotAssets, adminSettingsKb(lang));
    } else {
      // TestFlight links are configured per (game, period) — start by
      // letting the admin pick the game.
      await showMenuText(
        ctx,
        tr.adminPickGameForTestflight,
        adminGamesKb(lang, "tf"),
      );
    }
  });

  // Step 2: admin picked a game for the TestFlight link → ask for period.
  bot.callbackQuery(/^adm:tf:game:(.+)$/, async (ctx) => {
    if (!isAdmin(ctx)) { await ctx.answerCallbackQuery(); return; }
    const g = ctx.match![1]!;
    if (!isGameId(g)) { await ctx.answerCallbackQuery(); return; }
    const lang = getLang(ctx);
    const tr = t(lang);
    await ctx.answerCallbackQuery();
    await showMenuText(
      ctx,
      tr.adminPickPeriodForTestflight(tr.game[g]),
      adminPeriodsKb(lang, "tf", g),
    );
  });

  // Step 3: admin picked a period → prompt for the new TestFlight link.
  bot.callbackQuery(/^adm:tf:period:([^:]+):([^:]+)$/, async (ctx) => {
    if (!isAdmin(ctx)) { await ctx.answerCallbackQuery(); return; }
    const g = ctx.match![1]!;
    const p = ctx.match![2]!;
    if (!isGameId(g) || !isPeriodId(p)) {
      await ctx.answerCallbackQuery();
      return;
    }
    const lang = getLang(ctx);
    const tr = t(lang);
    setState(ctx.chat!.id, { kind: "await_testflight", game: g, period: p });
    await ctx.answerCallbackQuery();
    const current = getTestflightLinkFor(g, p);
    await showMenuText(
      ctx,
      tr.adminEnterTestflightFor(
        tr.game[g],
        tr.periodLabel[p],
        current ? `\`${current}\`` : "—",
      ),
      adminSettingsKb(lang),
    );
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

  // Step: pick currency (USD/INR) for the (game, period) being priced.
  bot.callbackQuery(/^adm:price:period:([^:]+):([^:]+)$/, async (ctx) => {
    if (!isAdmin(ctx)) { await ctx.answerCallbackQuery(); return; }
    const g = ctx.match![1]!;
    const p = ctx.match![2]!;
    if (!isGameId(g) || !isPeriodId(p)) { await ctx.answerCallbackQuery(); return; }
    const lang = getLang(ctx);
    const tr = t(lang);
    const currentUsd = getPriceUsd(g, p);
    const currentInr = getPriceInr(g, p);
    await ctx.answerCallbackQuery();
    await showMenuText(
      ctx,
      tr.adminPickPriceCurrency(
        tr.game[g],
        tr.periodLabel[p],
        currentUsd !== null ? fmtUsd(currentUsd) : "—",
        currentInr !== null ? fmtInr(currentInr) : "—",
      ),
      adminPriceCurrencyKb(lang, g, p),
    );
  });

  // Step: now ask for the actual amount in the chosen currency.
  bot.callbackQuery(
    /^adm:price:cur:([^:]+):([^:]+):(usd|inr)$/,
    async (ctx) => {
      if (!isAdmin(ctx)) { await ctx.answerCallbackQuery(); return; }
      const g = ctx.match![1]!;
      const p = ctx.match![2]!;
      const cur = ctx.match![3] as "usd" | "inr";
      if (!isGameId(g) || !isPeriodId(p)) {
        await ctx.answerCallbackQuery();
        return;
      }
      const lang = getLang(ctx);
      const tr = t(lang);
      setState(ctx.chat!.id, {
        kind: "await_price",
        game: g,
        period: p,
        currency: cur,
      });
      await ctx.answerCallbackQuery();
      if (cur === "usd") {
        const current = getPriceUsd(g, p);
        await showMenuText(
          ctx,
          tr.adminEnterPriceUsd(
            tr.game[g],
            tr.periodLabel[p],
            current !== null ? fmtUsd(current) : "—",
          ),
          adminPanelKb(lang),
        );
      } else {
        const current = getPriceInr(g, p);
        await showMenuText(
          ctx,
          tr.adminEnterPriceInr(
            tr.game[g],
            tr.periodLabel[p],
            current !== null ? fmtInr(current) : "—",
          ),
          adminPanelKb(lang),
        );
      }
    },
  );

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
    await showMenuText(ctx, text, await adminViewKeysKb(lang, g, p));
  });

  bot.callbackQuery(/^adm:delkey:(\d+):([^:]+):([^:]+)$/, async (ctx) => {
    if (!isAdmin(ctx)) { await ctx.answerCallbackQuery(); return; }
    const id = Number(ctx.match![1]);
    const g = ctx.match![2]!;
    const p = ctx.match![3]!;
    if (!isGameId(g) || !isPeriodId(p)) { await ctx.answerCallbackQuery(); return; }
    await deleteKey(id);
    const lang = getLang(ctx);
    const tr = t(lang);
    await ctx.answerCallbackQuery({ text: tr.adminKeyDeleted });
    const n = countAvailableKeys(g, p);
    const text =
      n === 0
        ? tr.adminNoKeys
        : tr.adminKeysList(tr.game[g], tr.periodLabel[p], n);
    await showMenuText(ctx, text, await adminViewKeysKb(lang, g, p));
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
      if (state.currency === "inr") {
        await setPriceInr(state.game, state.period, n);
      } else {
        await setPriceUsd(state.game, state.period, n);
      }
      const formatted = state.currency === "inr" ? fmtInr(n) : fmtUsd(n);
      clearState(ctx.chat.id);
      await showMenuText(
        ctx,
        tr.adminPriceUpdated(
          tr.game[state.game],
          tr.periodLabel[state.period],
          formatted,
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
      const n = await addKeys(state.game, state.period, lines);
      clearState(ctx.chat.id);
      await showMenuText(ctx, tr.adminKeysAdded(n), adminPanelKb(lang));
      return;
    }

    if (state.kind === "await_crypto") {
      await setSetting("crypto_wallet", text.trim());
      clearState(ctx.chat.id);
      await showMenuText(ctx, tr.adminCryptoUpdated, adminSettingsKb(lang));
      return;
    }

    if (state.kind === "await_upi") {
      await setSetting("upi_id", text.trim());
      clearState(ctx.chat.id);
      await showMenuText(ctx, tr.adminUpiUpdated, adminSettingsKb(lang));
      return;
    }

    if (state.kind === "await_binance") {
      await setSetting("binance_id", text.trim());
      clearState(ctx.chat.id);
      await showMenuText(ctx, tr.adminBinanceUpdated, adminSettingsKb(lang));
      return;
    }

    if (state.kind === "await_cbtoken") {
      const trimmed = text.trim();
      const value = trimmed.toLowerCase() === "clear" ? "" : trimmed;
      await setSetting("cryptobot_token", value);
      clearState(ctx.chat.id);
      await showMenuText(ctx, tr.adminCryptoBotTokenUpdated, adminSettingsKb(lang));
      return;
    }

    if (state.kind === "await_testflight") {
      const trimmed = text.trim();
      const value = trimmed.toLowerCase() === "clear" ? "" : trimmed;
      await setTestflightLinkFor(state.game, state.period, value);
      clearState(ctx.chat.id);
      await showMenuText(ctx, tr.adminTestflightUpdated, adminSettingsKb(lang));
      return;
    }

    if (state.kind === "await_admin_username") {
      const result = await addBotAdminByUsername(text, ctx.from?.id ?? null);
      if (!result.ok) {
        if (result.reason === "duplicate") {
          await showMenuText(ctx, tr.adminAddAdminDuplicate, adminPanelKb(lang));
        } else {
          await showMenuText(ctx, tr.adminAddAdminInvalid, adminPanelKb(lang));
        }
        return;
      }
      clearState(ctx.chat.id);
      await showMenuText(
        ctx,
        tr.adminAddAdminOk(result.row.username ?? ""),
        adminPanelKb(lang),
      );
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
      await setSetting("cryptobot_assets", cleaned);
      clearState(ctx.chat.id);
      await showMenuText(ctx, tr.adminCryptoBotAssetsUpdated, adminSettingsKb(lang));
      return;
    }
  });
}
