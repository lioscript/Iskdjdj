import { InlineKeyboard } from "grammy";
import {
  ANDROID_VARIANTS,
  CODM_VARIANTS,
  GAMES,
  MLBB_VARIANTS,
  PERIODS,
  PUBG_VARIANTS,
  getGameGroup,
  type GameId,
  type PeriodId,
} from "./catalog";
import { LANGS, LANG_LABELS, t, type Lang } from "./i18n";
import {
  countAvailableKeys,
  getPriceForMethod,
  getPriceInr,
  getPriceUsd,
  hasTestflightLinkFor,
  listAvailableKeys,
  listBotAdmins,
  type BotAdminRow,
} from "./db";
import type { PaymentMethod } from "./catalog";

export function languagePickerKb(): InlineKeyboard {
  const kb = new InlineKeyboard();
  for (const l of LANGS) {
    kb.text(LANG_LABELS[l], `lang:set:${l}`).row();
  }
  return kb;
}

export function mainMenuKb(lang: Lang): InlineKeyboard {
  const tr = t(lang);
  return new InlineKeyboard()
    .text(tr.btnBuy, "buy:games").row()
    .text(tr.btnLanguage, "lang:pick").row()
    .url(tr.btnFeedbacks, "https://t.me/WinStarFeed").row()
    .url(tr.btnSupport, "https://t.me/HermesIX");
}

// Maps a multi-variant game group to the callback that opens its picker.
const GROUP_PICKER_CALLBACK: Record<string, string> = {
  pubg: "buy:pubg",
  codm: "buy:codm",
  ml: "buy:ml",
  android: "buy:android",
};

const GROUP_LABEL: Record<string, string> = {
  pubg: "PUBG Mobile",
  codm: "Call of Duty",
  ml: "Mobile Legends",
  android: "Android",
};

export function gamesKb(lang: Lang): InlineKeyboard {
  const tr = t(lang);
  const kb = new InlineKeyboard();
  // Render games in catalog order. Variant groups (PUBG / CODM / MLBB /
  // Android) collapse into a single entry that opens a region/version
  // picker — inserted in place of the first variant of that group so its
  // position respects catalog ordering.
  const seenGroups = new Set<string>();
  for (const g of GAMES) {
    const pickerCb = GROUP_PICKER_CALLBACK[g.group];
    if (pickerCb) {
      if (!seenGroups.has(g.group)) {
        kb.text(GROUP_LABEL[g.group] ?? g.label, pickerCb).row();
        seenGroups.add(g.group);
      }
      continue;
    }
    kb.text(tr.game[g.id], `buy:game:${g.id}`).row();
  }
  kb.text(tr.btnHome, "nav:home");
  return kb;
}

function variantsKb(
  lang: Lang,
  variants: { id: GameId; shortLabel: string }[],
): InlineKeyboard {
  const tr = t(lang);
  const kb = new InlineKeyboard();
  for (const v of variants) {
    kb.text(v.shortLabel, `buy:game:${v.id}`).row();
  }
  kb.text(tr.btnBack, "buy:games");
  return kb;
}

export function pubgVariantsKb(lang: Lang): InlineKeyboard {
  return variantsKb(lang, PUBG_VARIANTS);
}

export function codmVariantsKb(lang: Lang): InlineKeyboard {
  return variantsKb(lang, CODM_VARIANTS);
}

export function mlbbVariantsKb(lang: Lang): InlineKeyboard {
  return variantsKb(lang, MLBB_VARIANTS);
}

export function androidVariantsKb(lang: Lang): InlineKeyboard {
  return variantsKb(lang, ANDROID_VARIANTS);
}

export function fmtUsd(n: number): string {
  return `$${n.toFixed(n % 1 === 0 ? 0 : 2)}`;
}

export function fmtInr(n: number): string {
  return `₹${n.toFixed(n % 1 === 0 ? 0 : 2)}`;
}

// Step 2 of the buy flow: pick a payment method for the chosen game.
// We show every method — even if the price for a particular currency
// hasn't been set, we still let the user open the period list (where
// the missing prices will simply be hidden).
export function paymentsKbForGame(lang: Lang, game: GameId): InlineKeyboard {
  const tr = t(lang);
  const kb = new InlineKeyboard()
    .text(tr.paymentLabel.upi, `buy:method:${game}:upi`).row()
    .text(tr.paymentLabel.binance, `buy:method:${game}:binance`).row()
    .text(tr.paymentLabel.crypto, `buy:method:${game}:crypto`).row()
    .text(tr.paymentLabel.cryptobot, `buy:method:${game}:cryptobot`).row();
  // Back to the variant picker for the group, else games list.
  const group = getGameGroup(game);
  const groupPicker = group ? GROUP_PICKER_CALLBACK[group] : undefined;
  kb.text(tr.btnBack, groupPicker ?? "buy:games");
  return kb;
}

// Step 3 of the buy flow: pick a period. Prices are shown in the
// currency that matches the previously chosen payment method (UPI →
// INR, otherwise USD). Periods with no price set for that currency
// are still listed — the handler will refuse them with `noPriceYet`.
export function periodsKb(
  lang: Lang,
  game: GameId,
  method: PaymentMethod,
  promo?: { code: string; discountPct: number },
): InlineKeyboard {
  const tr = t(lang);
  const kb = new InlineKeyboard();
  for (const p of PERIODS) {
    const { amount, currency } = getPriceForMethod(game, p, method);
    let label: string;
    if (amount !== null && promo) {
      const discounted = Math.round(amount * (1 - promo.discountPct / 100) * 100) / 100;
      const origLabel = currency === "inr" ? fmtInr(amount) : fmtUsd(amount);
      const discLabel = currency === "inr" ? fmtInr(discounted) : fmtUsd(discounted);
      label = tr.periodWithPrice(p, `${origLabel} → ${discLabel}`);
    } else if (amount !== null) {
      label = tr.periodWithPrice(
        p,
        currency === "inr" ? fmtInr(amount) : fmtUsd(amount),
      );
    } else {
      label = tr.periodLabel[p];
    }
    const cbData = promo
      ? `buy:order:${game}:${method}:${p}:${promo.code}`
      : `buy:order:${game}:${method}:${p}`;
    kb.text(label, cbData).row();
  }
  // Promo code button
  if (promo) {
    kb.text(`✅ ${promo.code} (-${promo.discountPct}%)`, `buy:promo:${game}:${method}`).row();
  } else {
    kb.text(tr.promoBtn, `buy:promo:${game}:${method}`).row();
  }
  // Back to the payment-method picker.
  kb.text(tr.btnBack, `buy:game:${game}`);
  return kb;
}

export function payConfirmKb(lang: Lang, orderId: number): InlineKeyboard {
  const tr = t(lang);
  return new InlineKeyboard()
    .text(tr.paidButton, `pay:confirm:${orderId}`).row()
    .text(tr.cancelButton, "nav:home");
}

export function payCryptoBotKb(
  lang: Lang,
  orderId: number,
  payUrl: string,
): InlineKeyboard {
  const tr = t(lang);
  return new InlineKeyboard()
    .url(tr.cryptoBotPayBtn, payUrl).row()
    .text(tr.cryptoBotCheckBtn, `pay:cbcheck:${orderId}`).row()
    .text(tr.cancelButton, "nav:home");
}

export function adminPanelKb(lang: Lang): InlineKeyboard {
  const tr = t(lang);
  return new InlineKeyboard()
    .text(tr.adminStats, "adm:stats").row()
    .text(tr.adminPrices, "adm:prices").row()
    .text(tr.adminAddKeys, "adm:addkeys").row()
    .text(tr.adminViewKeys, "adm:viewkeys").row()
    .text(tr.adminSettings, "adm:settings").row()
    .text(tr.adminBtnPromoCodes, "adm:promos").row()
    .text(tr.adminBtnAddAdmin, "adm:admins:add").row()
    .text(tr.adminBtnListAdmins, "adm:admins").row()
    .text(tr.btnHome, "nav:home");
}

import type { PromoCodeRow } from "./db";

export function adminPromoCodesKb(lang: Lang, promos: PromoCodeRow[]): InlineKeyboard {
  const tr = t(lang);
  const kb = new InlineKeyboard();
  for (const p of promos) {
    const used = p.max_uses - p.uses_left;
    const label = `✕  ${p.code}  (-${p.discount_pct}%)  used ${used}/${p.max_uses}`;
    kb.text(label, `adm:promos:del:${p.id}`).row();
  }
  kb.text(tr.adminPromoCreate, "adm:promos:create").row();
  kb.text(tr.adminBack, "adm:home");
  return kb;
}

export function adminGamesKb(
  lang: Lang,
  intent: "price" | "addkeys" | "viewkeys" | "tf",
): InlineKeyboard {
  const tr = t(lang);
  const kb = new InlineKeyboard();
  for (const g of GAMES) {
    kb.text(tr.game[g.id], `adm:${intent}:game:${g.id}`).row();
  }
  kb.text(tr.adminBack, intent === "tf" ? "adm:settings" : "adm:home");
  return kb;
}

export function adminPeriodsKb(
  lang: Lang,
  intent: "price" | "addkeys" | "viewkeys" | "tf",
  game: GameId,
): InlineKeyboard {
  const tr = t(lang);
  const kb = new InlineKeyboard();
  for (const p of PERIODS) {
    let suffix = "";
    if (intent === "price") {
      // Show both currencies side by side so the admin can see at a
      // glance which ones are missing.
      const u = getPriceUsd(game, p);
      const i = getPriceInr(game, p);
      const parts: string[] = [];
      if (u !== null) parts.push(fmtUsd(u));
      if (i !== null) parts.push(fmtInr(i));
      suffix = parts.length ? `  —  ${parts.join("  /  ")}` : "";
    } else if (intent === "tf") {
      // Show whether a TestFlight link is set for this (game, period)
      // so the admin can see at a glance which ones still need a link.
      suffix = hasTestflightLinkFor(game, p) ? "  —  ✅" : "  —  ❌";
    } else {
      const n = countAvailableKeys(game, p);
      suffix = `  —  ${n} in stock`;
    }
    kb.text(`${tr.periodLabel[p]}${suffix}`, `adm:${intent}:period:${game}:${p}`).row();
  }
  kb.text(tr.adminBack, intent === "tf" ? "adm:settings" : `adm:${intent}`);
  return kb;
}

// After the admin picks a (game, period) for pricing, ask which
// currency they want to set.
export function adminPriceCurrencyKb(
  lang: Lang,
  game: GameId,
  period: PeriodId,
): InlineKeyboard {
  const tr = t(lang);
  return new InlineKeyboard()
    .text(tr.adminBtnPriceUsd, `adm:price:cur:${game}:${period}:usd`).row()
    .text(tr.adminBtnPriceInr, `adm:price:cur:${game}:${period}:inr`).row()
    .text(tr.adminBack, `adm:price:game:${game}`);
}

export async function adminViewKeysKb(
  lang: Lang,
  game: GameId,
  period: PeriodId,
): Promise<InlineKeyboard> {
  const tr = t(lang);
  const kb = new InlineKeyboard();
  const keys = await listAvailableKeys(game, period);
  for (const k of keys) {
    const label = k.value.length > 30 ? k.value.slice(0, 27) + "…" : k.value;
    kb.text(`✕  ${label}`, `adm:delkey:${k.id}:${game}:${period}`).row();
  }
  kb.text(tr.adminBack, `adm:viewkeys:game:${game}`);
  return kb;
}

export function adminSettingsKb(lang: Lang): InlineKeyboard {
  const tr = t(lang);
  return new InlineKeyboard()
    .text(tr.adminBtnSetCrypto, "adm:set:crypto").row()
    .text(tr.adminBtnSetUpi, "adm:set:upi").row()
    .text(tr.adminBtnSetBinance, "adm:set:binance").row()
    .text(tr.adminBtnSetCryptoBotToken, "adm:set:cbtoken").row()
    .text(tr.adminBtnSetCryptoBotAssets, "adm:set:cbassets").row()
    .text(tr.adminBtnSetTestflight, "adm:set:testflight").row()
    .text(tr.adminBack, "adm:home");
}

// Renders the admins list keyboard. The super admin row is shown but
// not deletable. The owner is never passed in here.
export function adminListAdminsKb(
  lang: Lang,
  superAdminId: number,
): InlineKeyboard {
  const tr = t(lang);
  const kb = new InlineKeyboard();
  // Super admin is always at the top, with a non-actionable badge button.
  kb.text(`👑  ${superAdminId}  •  super admin`, "adm:admins:noop").row();
  const rows: BotAdminRow[] = listBotAdmins();
  for (const r of rows) {
    const label = r.username
      ? `@${r.username}`
      : r.telegram_id
        ? String(r.telegram_id)
        : `#${r.id}`;
    kb.text(`✕  ${label}`, `adm:admins:del:${r.id}`).row();
  }
  kb.text(tr.adminBtnAddAdmin, "adm:admins:add").row();
  kb.text(tr.adminBack, "adm:home");
  return kb;
}

export function adminOrderKb(orderId: number): InlineKeyboard {
  return new InlineKeyboard()
    .text("✔  Approve", `ord:approve:${orderId}`)
    .text("✖  Reject", `ord:reject:${orderId}`);
}
