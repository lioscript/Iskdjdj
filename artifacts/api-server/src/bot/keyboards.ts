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
  // Back to the variant picker for the group, else games list
  const group = getGameGroup(game);
  const groupPicker = group ? GROUP_PICKER_CALLBACK[group] : undefined;
  kb.text(tr.btnBack, groupPicker ?? "buy:games");
  return kb;
}

export function paymentsKb(
  lang: Lang,
  game: GameId,
  period: PeriodId,
): InlineKeyboard {
  const tr = t(lang);
  return new InlineKeyboard()
    .text(tr.paymentLabel.cryptobot, `buy:pay:${game}:${period}:cryptobot`).row()
    .text(tr.paymentLabel.crypto, `buy:pay:${game}:${period}:crypto`).row()
    .text(tr.paymentLabel.upi, `buy:pay:${game}:${period}:upi`).row()
    .text(tr.paymentLabel.binance, `buy:pay:${game}:${period}:binance`).row()
    .text(tr.btnBack, `buy:game:${game}`);
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
    .text(tr.adminBtnSetBinance, "adm:set:binance").row()
    .text(tr.adminBtnSetCryptoBotToken, "adm:set:cbtoken").row()
    .text(tr.adminBtnSetCryptoBotAssets, "adm:set:cbassets").row()
    .text(tr.adminBack, "adm:home");
}

export function adminOrderKb(orderId: number): InlineKeyboard {
  return new InlineKeyboard()
    .text("✔  Approve", `ord:approve:${orderId}`)
    .text("✖  Reject", `ord:reject:${orderId}`);
}
