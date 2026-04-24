import { InlineKeyboard } from "grammy";
import { GAMES, PERIODS, PUBG_VARIANTS, type GameId, type PeriodId } from "./catalog";
import { LANGS, LANG_LABELS, t, type Lang } from "./i18n";
import { countAvailableKeys, getPrice, listAvailableKeys } from "./db";

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
    .url(tr.btnReviews, "https://t.me/WinStarFeed").row()
    .url(tr.btnSupport, "https://t.me/HermesIX");
}

export function gamesKb(lang: Lang): InlineKeyboard {
  const tr = t(lang);
  const kb = new InlineKeyboard();
  // Show PUBG as a single entry that opens variants
  kb.text("PUBG Mobile", "buy:pubg").row();
  for (const g of GAMES.filter((g) => g.group !== "pubg")) {
    kb.text(tr.game[g.id], `buy:game:${g.id}`).row();
  }
  kb.text(tr.btnHome, "nav:home");
  return kb;
}

export function pubgVariantsKb(lang: Lang): InlineKeyboard {
  const tr = t(lang);
  const kb = new InlineKeyboard();
  for (const v of PUBG_VARIANTS) {
    kb.text(v.shortLabel, `buy:game:${v.id}`).row();
  }
  kb.text(tr.btnBack, "buy:games");
  return kb;
}

function fmtUsd(n: number): string {
  return `$${n.toFixed(n % 1 === 0 ? 0 : 2)}`;
}

export function periodsKb(lang: Lang, game: GameId): InlineKeyboard {
  const tr = t(lang);
  const kb = new InlineKeyboard();
  for (const p of PERIODS) {
    const price = getPrice(game, p);
    const label =
      price !== null
        ? tr.periodWithPrice(p, fmtUsd(price))
        : tr.periodLabel[p];
    kb.text(label, `buy:period:${game}:${p}`).row();
  }
  // Back to PUBG variants if pubg, else games list
  if (game.startsWith("pubg_")) {
    kb.text(tr.btnBack, "buy:pubg");
  } else {
    kb.text(tr.btnBack, "buy:games");
  }
  return kb;
}

export function paymentsKb(
  lang: Lang,
  game: GameId,
  period: PeriodId,
): InlineKeyboard {
  const tr = t(lang);
  return new InlineKeyboard()
    .text(tr.paymentLabel.crypto, `buy:pay:${game}:${period}:crypto`).row()
    .text(tr.paymentLabel.remitly, `buy:pay:${game}:${period}:remitly`).row()
    .text(tr.btnBack, `buy:game:${game}`);
}

export function payConfirmKb(lang: Lang, orderId: number): InlineKeyboard {
  const tr = t(lang);
  return new InlineKeyboard()
    .text(tr.paidButton, `pay:confirm:${orderId}`).row()
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
    .text(tr.btnHome, "nav:home");
}

export function adminGamesKb(lang: Lang, intent: "price" | "addkeys" | "viewkeys"): InlineKeyboard {
  const tr = t(lang);
  const kb = new InlineKeyboard();
  for (const g of GAMES) {
    kb.text(tr.game[g.id], `adm:${intent}:game:${g.id}`).row();
  }
  kb.text(tr.adminBack, "adm:home");
  return kb;
}

export function adminPeriodsKb(
  lang: Lang,
  intent: "price" | "addkeys" | "viewkeys",
  game: GameId,
): InlineKeyboard {
  const tr = t(lang);
  const kb = new InlineKeyboard();
  for (const p of PERIODS) {
    let suffix = "";
    if (intent === "price") {
      const price = getPrice(game, p);
      suffix = price !== null ? `  —  ${fmtUsd(price)}` : "";
    } else {
      const n = countAvailableKeys(game, p);
      suffix = `  —  ${n} in stock`;
    }
    kb.text(`${tr.periodLabel[p]}${suffix}`, `adm:${intent}:period:${game}:${p}`).row();
  }
  kb.text(tr.adminBack, `adm:${intent}`);
  return kb;
}

export function adminViewKeysKb(
  lang: Lang,
  game: GameId,
  period: PeriodId,
): InlineKeyboard {
  const tr = t(lang);
  const kb = new InlineKeyboard();
  const keys = listAvailableKeys(game, period);
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
    .text(tr.adminBack, "adm:home");
}

export function adminOrderKb(orderId: number): InlineKeyboard {
  return new InlineKeyboard()
    .text("✔  Approve", `ord:approve:${orderId}`)
    .text("✖  Reject", `ord:reject:${orderId}`);
}
