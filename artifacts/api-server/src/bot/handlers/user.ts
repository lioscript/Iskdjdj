import type { Bot, Context } from "grammy";
import {
  countAvailableKeys,
  createOrder,
  getBinanceId,
  getCryptoBotAssets,
  getCryptoWallet,
  getOrder,
  getPrice,
  getUpiId,
  getUser,
  reserveKeyForOrder,
  setOrderCryptobotInvoice,
  setUserLanguage,
  upsertUser,
} from "../db";
import {
  isGameId,
  isPeriodId,
  type GameId,
  type PaymentMethod,
  type PeriodId,
} from "../catalog";
import { isLang, LANGUAGE_PICKER_PROMPT, t, type Lang } from "../i18n";
import {
  adminOrderKb,
  androidVariantsKb,
  codmVariantsKb,
  gamesKb,
  languagePickerKb,
  mainMenuKb,
  mlbbVariantsKb,
  payConfirmKb,
  payCryptoBotKb,
  paymentsKb,
  periodsKb,
  pubgVariantsKb,
} from "../keyboards";
import {
  createInvoice as cbCreateInvoice,
  getInvoices as cbGetInvoices,
  isConfigured as cbIsConfigured,
} from "../cryptobot";
import { deliverPaidOrder } from "../delivery";
import { showMenuPhoto, showMenuText } from "../ui";
import { clearState } from "../state";
import { logger } from "../../lib/logger";

function detectInitialLang(ctx: Context): Lang {
  const code = ctx.from?.language_code?.toLowerCase() ?? "";
  if (code.startsWith("ru") || code.startsWith("uk") || code.startsWith("be")) return "ru";
  if (code.startsWith("hi")) return "hi";
  return "en";
}

function getOrCreateUser(ctx: Context): { lang: Lang; firstName: string } {
  const from = ctx.from;
  const fallback: Lang = detectInitialLang(ctx);
  if (!from) return { lang: fallback, firstName: "" };
  const u = upsertUser({
    telegramId: from.id,
    username: from.username ?? null,
    firstName: from.first_name ?? null,
    defaultLanguage: fallback,
  });
  return { lang: u.language, firstName: u.first_name ?? from.first_name ?? "" };
}

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

async function showMain(ctx: Context): Promise<void> {
  const { lang, firstName } = getOrCreateUser(ctx);
  const tr = t(lang);
  await showMenuPhoto(ctx, tr.mainMenuTitle(firstName), mainMenuKb(lang));
}

async function showLangPicker(ctx: Context): Promise<void> {
  // Make sure the user row exists, but always show the prompt in English.
  getOrCreateUser(ctx);
  await showMenuText(ctx, LANGUAGE_PICKER_PROMPT, languagePickerKb());
}

async function showGames(ctx: Context): Promise<void> {
  const { lang } = getOrCreateUser(ctx);
  const tr = t(lang);
  await showMenuText(ctx, tr.pickGame, gamesKb(lang));
}

async function showPubg(ctx: Context): Promise<void> {
  const { lang } = getOrCreateUser(ctx);
  const tr = t(lang);
  await showMenuText(ctx, tr.pickPubgVariant, pubgVariantsKb(lang));
}

async function showCodm(ctx: Context): Promise<void> {
  const { lang } = getOrCreateUser(ctx);
  const tr = t(lang);
  await showMenuText(ctx, tr.pickCodmVariant, codmVariantsKb(lang));
}

async function showMlbb(ctx: Context): Promise<void> {
  const { lang } = getOrCreateUser(ctx);
  const tr = t(lang);
  await showMenuText(ctx, tr.pickMlbbVariant, mlbbVariantsKb(lang));
}

async function showAndroid(ctx: Context): Promise<void> {
  const { lang } = getOrCreateUser(ctx);
  const tr = t(lang);
  await showMenuText(ctx, tr.pickAndroidVariant, androidVariantsKb(lang));
}

async function showPeriods(ctx: Context, game: GameId): Promise<void> {
  const { lang } = getOrCreateUser(ctx);
  const tr = t(lang);
  const header = `${tr.game[game]}\n\n${tr.pickPeriod}`;
  await showMenuText(ctx, header, periodsKb(lang, game));
}

async function showPayments(
  ctx: Context,
  game: GameId,
  period: PeriodId,
): Promise<void> {
  const { lang } = getOrCreateUser(ctx);
  const tr = t(lang);
  const price = getPrice(game, period);
  if (price === null) {
    await showMenuText(ctx, tr.noPriceYet, mainMenuKb(lang));
    return;
  }
  const header = `${tr.game[game]}  •  ${tr.periodLabel[period]}\n${fmtUsd(price)}\n\n${tr.pickPayment}`;
  await showMenuText(ctx, header, paymentsKb(lang, game, period));
}

async function startPayment(
  ctx: Context,
  game: GameId,
  period: PeriodId,
  method: PaymentMethod,
): Promise<void> {
  const from = ctx.from;
  if (!from) return;
  const { lang } = getOrCreateUser(ctx);
  const tr = t(lang);
  const price = getPrice(game, period);
  if (price === null) {
    await showMenuText(ctx, tr.noPriceYet, mainMenuKb(lang));
    return;
  }
  // Check stock upfront for friendlier UX
  if (countAvailableKeys(game, period) === 0) {
    await showMenuText(ctx, tr.outOfStock, mainMenuKb(lang));
    return;
  }

  // Crypto Bot needs a configured token before we even create the order,
  // otherwise the user gets a dangling pending row with no pay link.
  if (method === "cryptobot" && !cbIsConfigured()) {
    await showMenuText(ctx, tr.cryptoBotNotConfigured, paymentsKb(lang, game, period));
    return;
  }

  const orderId = createOrder({
    userTelegramId: from.id,
    game,
    period,
    paymentMethod: method,
    amountUsd: price,
  });

  if (method === "crypto") {
    const addr = getCryptoWallet();
    const text = `${tr.cryptoTitle}\n\n${tr.cryptoBody(addr, fmtUsd(price))}`;
    await showMenuText(ctx, text, payConfirmKb(lang, orderId));
    return;
  }

  if (method === "upi") {
    const upi = getUpiId();
    const text = `${tr.upiTitle}\n\n${tr.upiBody(upi, fmtUsd(price))}`;
    await showMenuText(ctx, text, payConfirmKb(lang, orderId));
    return;
  }

  if (method === "binance") {
    const binanceId = getBinanceId();
    const text = `${tr.binanceTitle}\n\n${tr.binanceBody(binanceId, fmtUsd(price))}`;
    await showMenuText(ctx, text, payConfirmKb(lang, orderId));
    return;
  }

  // method === "cryptobot"
  try {
    const invoice = await cbCreateInvoice({
      amountUsd: price,
      description: `WinStar order #${orderId} — ${tr.game[game]} (${tr.periodLabel[period]})`,
      payload: String(orderId),
    });
    const payUrl =
      invoice.mini_app_invoice_url ||
      invoice.bot_invoice_url ||
      invoice.pay_url ||
      invoice.web_app_invoice_url ||
      "";
    if (!payUrl) {
      logger.warn({ invoice }, "Crypto Pay createInvoice returned no URL");
      await showMenuText(ctx, tr.cryptoBotPaymentFailed, paymentsKb(lang, game, period));
      return;
    }
    setOrderCryptobotInvoice(orderId, String(invoice.invoice_id), payUrl);
    const assets = getCryptoBotAssets();
    const text = `${tr.cryptoBotTitle}\n\n${tr.cryptoBotBody(fmtUsd(price), assets)}`;
    await showMenuText(ctx, text, payCryptoBotKb(lang, orderId, payUrl));
  } catch (err) {
    logger.error({ err, orderId }, "Failed to create Crypto Pay invoice");
    await showMenuText(ctx, tr.cryptoBotPaymentFailed, paymentsKb(lang, game, period));
  }
}

async function checkCryptoBotPayment(
  ctx: Context,
  orderId: number,
  bot: Bot,
): Promise<void> {
  const { lang } = getOrCreateUser(ctx);
  const tr = t(lang);
  const order = getOrder(orderId);
  if (!order || order.user_telegram_id !== ctx.from?.id) {
    await showMenuText(ctx, tr.adminOrderAlreadyProcessed, mainMenuKb(lang));
    return;
  }
  if (order.status === "delivered") {
    // Already delivered — just nudge them home, the key was already sent.
    await showMenuText(ctx, tr.adminOrderAlreadyProcessed, mainMenuKb(lang));
    return;
  }
  if (!order.cryptobot_invoice_id) {
    await showMenuText(ctx, tr.cryptoBotPaymentFailed, mainMenuKb(lang));
    return;
  }
  try {
    const invoices = await cbGetInvoices([order.cryptobot_invoice_id]);
    const inv = invoices[0];
    if (inv && inv.status === "paid") {
      await deliverPaidOrder(bot, orderId);
      return;
    }
  } catch (err) {
    logger.warn({ err, orderId }, "Crypto Pay getInvoices failed");
  }
  await ctx.answerCallbackQuery({ text: tr.cryptoBotNotPaidYet, show_alert: true });
}

async function notifyAdminsOfOrder(
  bot: Bot,
  orderId: number,
): Promise<void> {
  const order = getOrder(orderId);
  if (!order) return;
  const user = getUser(order.user_telegram_id);
  const lang: Lang = (user?.language as Lang) ?? "en";
  const tr = t(lang);
  const userLabel = user?.username
    ? `@${user.username} (${order.user_telegram_id})`
    : `${user?.first_name ?? ""} (${order.user_telegram_id})`.trim();
  const body = `${tr.adminOrderTitle}\n\n${tr.adminOrderBody(
    order.id,
    userLabel,
    tr.game[order.game],
    tr.periodLabel[order.period],
    tr.paymentLabel[order.payment_method],
    fmtUsd(order.amount_usd),
  )}`;
  for (const adminId of adminIds()) {
    try {
      await bot.api.sendMessage(adminId, body, {
        reply_markup: adminOrderKb(orderId),
        parse_mode: "Markdown",
      });
    } catch (err) {
      logger.warn({ err, adminId }, "Failed to notify admin of new order");
    }
  }
}

async function confirmPayment(
  ctx: Context,
  orderId: number,
  bot: Bot,
): Promise<void> {
  const { lang } = getOrCreateUser(ctx);
  const tr = t(lang);
  const order = getOrder(orderId);
  if (!order || order.user_telegram_id !== ctx.from?.id) {
    await showMenuText(ctx, tr.adminOrderAlreadyProcessed, mainMenuKb(lang));
    return;
  }
  if (order.status !== "pending") {
    await showMenuText(ctx, tr.adminOrderAlreadyProcessed, mainMenuKb(lang));
    return;
  }
  await showMenuText(ctx, tr.paymentSubmitted, mainMenuKb(lang));
  await notifyAdminsOfOrder(bot, orderId).catch((err) => {
    logger.warn({ err }, "Failed broadcasting admin notification");
  });
}

export function registerUserHandlers(bot: Bot): void {
  bot.command("start", async (ctx) => {
    clearState(ctx.chat.id);
    const existing = getUser(ctx.from?.id ?? 0);
    if (!existing) {
      // First time — create user (default lang) and show language picker.
      // The prompt is always in English so any new user can read it.
      getOrCreateUser(ctx);
      await showMenuText(ctx, LANGUAGE_PICKER_PROMPT, languagePickerKb());
      return;
    }
    await showMain(ctx);
  });

  bot.command("menu", async (ctx) => {
    clearState(ctx.chat.id);
    await showMain(ctx);
  });

  bot.command("language", async (ctx) => {
    await showLangPicker(ctx);
  });

  bot.callbackQuery(/^lang:pick$/, async (ctx) => {
    await ctx.answerCallbackQuery();
    await showLangPicker(ctx);
  });

  bot.callbackQuery(/^lang:set:(.+)$/, async (ctx) => {
    const code = ctx.match![1]!;
    if (!isLang(code)) {
      await ctx.answerCallbackQuery();
      return;
    }
    if (ctx.from?.id) {
      upsertUser({
        telegramId: ctx.from.id,
        username: ctx.from.username ?? null,
        firstName: ctx.from.first_name ?? null,
        defaultLanguage: code,
      });
      setUserLanguage(ctx.from.id, code);
    }
    await ctx.answerCallbackQuery();
    await showMain(ctx);
  });

  bot.callbackQuery(/^nav:home$/, async (ctx) => {
    await ctx.answerCallbackQuery();
    await showMain(ctx);
  });

  bot.callbackQuery(/^buy:games$/, async (ctx) => {
    await ctx.answerCallbackQuery();
    await showGames(ctx);
  });

  bot.callbackQuery(/^buy:pubg$/, async (ctx) => {
    await ctx.answerCallbackQuery();
    await showPubg(ctx);
  });

  bot.callbackQuery(/^buy:codm$/, async (ctx) => {
    await ctx.answerCallbackQuery();
    await showCodm(ctx);
  });

  bot.callbackQuery(/^buy:ml$/, async (ctx) => {
    await ctx.answerCallbackQuery();
    await showMlbb(ctx);
  });

  bot.callbackQuery(/^buy:android$/, async (ctx) => {
    await ctx.answerCallbackQuery();
    await showAndroid(ctx);
  });

  bot.callbackQuery(/^buy:game:(.+)$/, async (ctx) => {
    const g = ctx.match![1]!;
    if (!isGameId(g)) {
      await ctx.answerCallbackQuery();
      return;
    }
    await ctx.answerCallbackQuery();
    await showPeriods(ctx, g);
  });

  bot.callbackQuery(/^buy:period:([^:]+):([^:]+)$/, async (ctx) => {
    const g = ctx.match![1]!;
    const p = ctx.match![2]!;
    if (!isGameId(g) || !isPeriodId(p)) {
      await ctx.answerCallbackQuery();
      return;
    }
    await ctx.answerCallbackQuery();
    await showPayments(ctx, g, p);
  });

  bot.callbackQuery(/^buy:pay:([^:]+):([^:]+):([^:]+)$/, async (ctx) => {
    const g = ctx.match![1]!;
    const p = ctx.match![2]!;
    const m = ctx.match![3]!;
    if (
      !isGameId(g) ||
      !isPeriodId(p) ||
      (m !== "crypto" && m !== "cryptobot" && m !== "upi" && m !== "binance")
    ) {
      await ctx.answerCallbackQuery();
      return;
    }
    await ctx.answerCallbackQuery();
    await startPayment(ctx, g, p, m);
  });

  bot.callbackQuery(/^pay:confirm:(\d+)$/, async (ctx) => {
    const orderId = Number(ctx.match![1]);
    await ctx.answerCallbackQuery();
    await confirmPayment(ctx, orderId, bot);
  });

  bot.callbackQuery(/^pay:cbcheck:(\d+)$/, async (ctx) => {
    const orderId = Number(ctx.match![1]);
    await checkCryptoBotPayment(ctx, orderId, bot);
  });
}

// Helpers exported for admin handler reuse
export {
  fmtUsd,
  adminIds,
  reserveKeyForOrder,
  showMain,
  showLangPicker,
};
