import type { GameId, PeriodId } from "./catalog";

export type Lang = "en" | "ru" | "hi";

export const LANGS: Lang[] = ["en", "ru", "hi"];

export const LANG_LABELS: Record<Lang, string> = {
  en: "🇬🇧  English",
  ru: "🇷🇺  Русский",
  hi: "🇮🇳  हिन्दी",
};

// Always shown in English so a brand-new user can read it regardless of
// what language Telegram thinks they speak.
export const LANGUAGE_PICKER_PROMPT =
  "🌐  Welcome to WinStar!\n\nPlease choose your language to continue:";

export function isLang(s: string): s is Lang {
  return LANGS.includes(s as Lang);
}

type Dict = {
  pickLanguage: string;
  mainMenuTitle: (name: string) => string;
  btnBuy: string;
  btnLanguage: string;
  btnFeedbacks: string;
  btnSupport: string;
  btnBack: string;
  btnHome: string;
  pickGame: string;
  pickPubgVariant: string;
  pickCodmVariant: string;
  pickMlbbVariant: string;
  pickAndroidVariant: string;
  pickPeriod: string;
  pickPayment: string;
  periodLabel: Record<PeriodId, string>;
  periodWithPrice: (period: PeriodId, price: string) => string;
  noPriceYet: string;
  cryptoTitle: string;
  cryptoBody: (addr: string, amount: string) => string;
  upiTitle: string;
  upiBody: (upi: string, amount: string) => string;
  binanceTitle: string;
  binanceBody: (binanceId: string, amount: string) => string;
  cryptoBotTitle: string;
  cryptoBotBody: (amount: string, assets: string) => string;
  cryptoBotPayBtn: string;
  cryptoBotCheckBtn: string;
  cryptoBotNotConfigured: string;
  cryptoBotNotPaidYet: string;
  cryptoBotPaymentFailed: string;
  paidButton: string;
  cancelButton: string;
  paymentSubmitted: string;
  paymentRejected: string;
  outOfStock: string;
  yourKey: (game: string, period: string, value: string) => string;
  postDelivery: (
    testflightLink: string,
    updatesLink: string,
    tutorialLink: string,
  ) => string;
  expireReminder3d: (game: string, period: string) => string;
  expireReminder1d: (game: string, period: string) => string;
  expireReminder1h: (game: string, period: string) => string;
  adminExpiredNotify: (
    user: string,
    game: string,
    period: string,
  ) => string;
  game: Record<GameId, string>;
  paymentLabel: Record<"crypto" | "cryptobot" | "upi" | "binance", string>;
  // Admin
  adminOnly: string;
  adminPanel: string;
  adminStats: string;
  adminPrices: string;
  adminAddKeys: string;
  adminViewKeys: string;
  adminSettings: string;
  adminBack: string;
  adminStatsBody: (
    sales: number,
    revenueUsd: string,
    revenueInr: string,
    users: number,
  ) => string;
  adminPickGameForPrice: string;
  adminPickPeriodForPrice: (game: string) => string;
  adminPickPriceCurrency: (
    game: string,
    period: string,
    currentUsd: string,
    currentInr: string,
  ) => string;
  adminBtnPriceUsd: string;
  adminBtnPriceInr: string;
  adminEnterPriceUsd: (game: string, period: string, current: string) => string;
  adminEnterPriceInr: (game: string, period: string, current: string) => string;
  adminPriceUpdated: (game: string, period: string, price: string) => string;
  adminPickGameForKeys: string;
  adminPickPeriodForKeys: (game: string) => string;
  adminEnterKeys: (game: string, period: string) => string;
  adminKeysAdded: (count: number) => string;
  adminKeysList: (game: string, period: string, count: number) => string;
  adminNoKeys: string;
  adminPickGameForView: string;
  adminPickPeriodForView: (game: string) => string;
  adminKeyDeleted: string;
  adminSettingsBody: (
    wallet: string,
    upi: string,
    binanceId: string,
    cryptoBotToken: string,
    cryptoBotAssets: string,
  ) => string;
  adminEnterCrypto: string;
  adminEnterUpi: string;
  adminEnterBinance: string;
  adminEnterCryptoBotToken: string;
  adminEnterCryptoBotAssets: string;
  adminPickGameForTestflight: string;
  adminPickPeriodForTestflight: (game: string) => string;
  adminEnterTestflightFor: (
    game: string,
    period: string,
    current: string,
  ) => string;
  adminCryptoUpdated: string;
  adminUpiUpdated: string;
  adminBinanceUpdated: string;
  adminCryptoBotTokenUpdated: string;
  adminCryptoBotAssetsUpdated: string;
  adminTestflightUpdated: string;
  adminBtnSetCrypto: string;
  adminBtnSetUpi: string;
  adminBtnSetBinance: string;
  adminBtnSetCryptoBotToken: string;
  adminBtnSetCryptoBotAssets: string;
  adminBtnSetTestflight: string;
  adminInvalidNumber: string;
  adminCancelled: string;
  // Admin management (add/list/remove admins)
  adminBtnAddAdmin: string;
  adminBtnListAdmins: string;
  adminAddAdminPrompt: string;
  adminAddAdminInvalid: string;
  adminAddAdminDuplicate: string;
  adminAddAdminOk: (username: string) => string;
  adminListAdminsTitle: string;
  adminListAdminsEmpty: string;
  adminListAdminsRow: (
    label: string,
    status: string,
  ) => string;
  adminListAdminsSuperBadge: string;
  adminListAdminsResolvedBadge: string;
  adminListAdminsPendingBadge: string;
  adminAdminRemoved: string;
  adminCannotRemoveSuper: string;
  // Order admin notification
  adminOrderTitle: string;
  adminOrderBody: (
    orderId: number,
    user: string,
    game: string,
    period: string,
    method: string,
    amount: string,
  ) => string;
  adminApprove: string;
  adminReject: string;
  adminOrderApproved: string;
  adminOrderRejected: string;
  adminOrderAlreadyProcessed: string;
};

const GAME_LABELS = {
  bgmi: "BGMI",
  pubg_global: "PUBG Mobile — Global",
  pubg_taiwan: "PUBG Mobile — Taiwan",
  pubg_korean: "PUBG Mobile — Korean",
  codm_global: "Call of Duty — Global",
  codm_garena: "Call of Duty — Garena",
  codm_vietnam: "Call of Duty — Vietnam",
  ml_global: "Mobile Legends — Global",
  ml_usa: "Mobile Legends — USA",
  ml_vietnam: "Mobile Legends — Vietnam",
  "8bp": "8 Ball Pool",
  android_root: "Android — Root",
  android_nonroot: "Android — Non-root",
} as const;

const en: Dict = {
  pickLanguage: "🌐  Choose your language",
  mainMenuTitle: (name) =>
    `🎮  *WinStar*  •  Winios cheat keys\n\n` +
    `Hey${name ? ` ${name}` : ""}! 👋  Welcome to the official store.\n\n` +
    `⚡  Premium cheats for the games you actually play.\n` +
    `💎  Instant key delivery — no waiting, no hassle.\n` +
    `🛡  100% safe  •  undetected  •  daily updates.\n` +
    `🔥  PUBG  •  CODM  •  Mobile Legends  •  8 Ball Pool\n\n` +
    `👇  Pick an option below to get started.`,
  btnBuy: "🎮  Buy keys",
  btnLanguage: "🌐  Change language",
  btnFeedbacks: "✅  Feedbacks",
  btnSupport: "🛟  Support",
  btnBack: "⬅  Back",
  btnHome: "🏠  Main menu",
  pickGame: "🎮  Choose a game",
  pickPubgVariant: "🌍  PUBG Mobile  •  pick a region",
  pickCodmVariant: "🌍  Call of Duty  •  pick a version",
  pickMlbbVariant: "🌍  Mobile Legends  •  pick a version",
  pickAndroidVariant: "📱  Android  •  pick a version",
  pickPeriod: "⏳  Choose a period",
  pickPayment: "💳  Choose a payment method",
  periodLabel: { day: "Day", week: "Week", month: "Month" },
  periodWithPrice: (period, price) =>
    `${period === "day" ? "Day" : period === "week" ? "Week" : "Month"}  —  ${price}`,
  noPriceYet: "Price not set yet. Please contact support.",
  cryptoTitle: "💰  Crypto payment  •  USDT BEP20",
  cryptoBody: (addr, amount) =>
    `Send exactly *${amount}* in *USDT (BEP20)* to the address below:\n\n\`${addr}\`\n\n👆  Tap the address to copy. After paying, press “⚡  I have paid”.`,
  upiTitle: "🇮🇳  UPI payment  •  Indian payments",
  upiBody: (upi, amount) =>
    `Send *${amount}* via UPI to:\n\n\`${upi}\`\n\n👆  Tap the UPI ID to copy. After paying, press “⚡  I have paid”.`,
  binanceTitle: "🟡  Binance Pay  •  pay by Binance ID",
  binanceBody: (binanceId, amount) =>
    `Send *${amount}* via *Binance Pay* to this Binance ID:\n\n\`${binanceId}\`\n\n👆  Tap to copy. Open Binance app → *Pay* → *Send* → paste the ID. After paying, press “⚡  I have paid”.`,
  cryptoBotTitle: "🤖  Pay with @CryptoBot",
  cryptoBotBody: (amount, assets) =>
    `Total: *${amount}*\n\nTap *Pay* below — @CryptoBot will open in Telegram and let you pay in any of: ${assets}.\n\nAs soon as the payment is confirmed, your key is delivered here automatically.`,
  cryptoBotPayBtn: "💳  Pay with CryptoBot",
  cryptoBotCheckBtn: "🔄  I have paid — check now",
  cryptoBotNotConfigured:
    "⚠  Crypto Bot payments are not configured yet. Please choose another method or contact support.",
  cryptoBotNotPaidYet:
    "⏳  Payment not received yet. After paying in @CryptoBot, tap “🔄  Check now” again.",
  cryptoBotPaymentFailed:
    "⚠  Could not create the invoice. Please try again or choose another payment method.",
  paidButton: "⚡  I have paid",
  cancelButton: "✖  Cancel",
  paymentSubmitted:
    "⏳  Your payment is being reviewed by an admin.\nYou will receive your key here as soon as it is confirmed. 🔑",
  paymentRejected:
    "⚠  Your payment could not be confirmed.\nIf this looks wrong, please contact support.",
  outOfStock: "😔  Sorry — out of stock for this option.\nPlease choose another period or contact support.",
  yourKey: (game, period, value) =>
    `🎉  *Order delivered!*\n\n🎮  Game: ${game}\n⏳  Period: ${period}\n\n🔑  Your key:\n\n\`${value}\`\n\n👆  Tap to copy.\n\n💎  Thank you for your purchase!`,
  postDelivery: (testflightLink, updatesLink, tutorialLink) => {
    const lines: string[] = ["📦  *What's next?*", ""];
    if (testflightLink) {
      lines.push(`📲  *TestFlight (install the app):*\n${testflightLink}`);
      lines.push("");
    }
    lines.push(`🔔  *Private updates group:*\n${updatesLink}`);
    lines.push("");
    lines.push(`📚  *Installation tutorial channel:*\n${tutorialLink}`);
    return lines.join("\n");
  },
  expireReminder3d: (game, period) =>
    `⏰  *Heads up!*\n\nYour *${game}* (${period}) key will expire in *3 days*.\n\n🔁  Tap “🎮  Buy keys” in the main menu to grab a new one and avoid downtime.`,
  expireReminder1d: (game, period) =>
    `⚠  *Reminder*\n\nOnly *1 day* left on your *${game}* (${period}) key.\n\n🔁  Renew now to keep playing without interruptions.`,
  expireReminder1h: (game, period) =>
    `🚨  *Last hour!*\n\nYour *${game}* (${period}) key expires in *1 hour*.\n\n🔁  Buy a new one now so you don't get kicked mid-match.`,
  adminExpiredNotify: (user, game, period) =>
    `🛑  *Key expired*\n\n👤  User: ${user}\n🎮  Game: ${game}\n⏳  Period: ${period}\n\n⚠  Please remove this user from the private updates group.`,
  game: GAME_LABELS,
  paymentLabel: {
    crypto: "💰  Crypto BEP20",
    cryptobot: "🤖  CryptoBot (Telegram)",
    upi: "🇮🇳  UPI (India)",
    binance: "🟡  Binance ID",
  },
  adminOnly: "🔒  This area is restricted.",
  adminPanel: "🛠  *Admin panel*",
  adminStats: "📊  Statistics",
  adminPrices: "💲  Prices",
  adminAddKeys: "➕  Add keys",
  adminViewKeys: "🗂  View / delete keys",
  adminSettings: "⚙  Payment settings",
  adminBack: "⬅  Back",
  adminStatsBody: (sales, revenueUsd, revenueInr, users) =>
    `📊  *Statistics*\n\n🔑  Sales delivered: *${sales}*\n💵  Revenue (USD): *${revenueUsd}*\n🇮🇳  Revenue (INR): *${revenueInr}*\n👥  Registered users: *${users}*`,
  adminPickGameForPrice: "Pick a game to set its prices",
  adminPickPeriodForPrice: (game) => `${game}\n\nPick a period`,
  adminPickPriceCurrency: (game, period, currentUsd, currentInr) =>
    `${game}  •  ${period}\n\nCurrent USD: ${currentUsd}\nCurrent INR: ${currentInr}\n\nIn which currency do you want to set the price?`,
  adminBtnPriceUsd: "💵  USD",
  adminBtnPriceInr: "🇮🇳  INR",
  adminEnterPriceUsd: (game, period, current) =>
    `${game}  •  ${period}\n\nCurrent USD price: ${current}\n\nSend the new price as a number in *USD*. Send /cancel to abort.`,
  adminEnterPriceInr: (game, period, current) =>
    `${game}  •  ${period}\n\nCurrent INR price: ${current}\n\nSend the new price as a number in *INR (₹)*. Send /cancel to abort.`,
  adminPriceUpdated: (game, period, price) =>
    `Updated  ${game}  •  ${period}  →  ${price}`,
  adminPickGameForKeys: "Pick a game to add keys for",
  adminPickPeriodForKeys: (game) => `${game}\n\nPick a period`,
  adminEnterKeys: (game, period) =>
    `${game}  •  ${period}\n\nSend the keys (one per line). Send /cancel to abort.`,
  adminKeysAdded: (count) => `Added ${count} key${count === 1 ? "" : "s"}.`,
  adminKeysList: (game, period, count) =>
    `${game}  •  ${period}\n\nIn stock: ${count}`,
  adminNoKeys: "No keys available.",
  adminPickGameForView: "Pick a game to view keys",
  adminPickPeriodForView: (game) => `${game}\n\nPick a period`,
  adminKeyDeleted: "Key removed.",
  adminSettingsBody: (wallet, upi, binanceId, cbToken, cbAssets) =>
    `Payment settings\n\nCrypto wallet (BEP20):\n\`${wallet}\`\n\nUPI ID (India):\n\`${upi}\`\n\nBinance ID:\n\`${binanceId}\`\n\nCrypto Bot token: ${cbToken ? "✅ set" : "❌ not set"}\nCrypto Bot assets: \`${cbAssets}\`\n\nTestFlight links: tap “📲  Set TestFlight link” to configure them per game and version.`,
  adminEnterCrypto: "Send the new BEP20 wallet address. Send /cancel to abort.",
  adminEnterUpi: "Send the new UPI ID (India). Send /cancel to abort.",
  adminEnterBinance: "Send the new Binance ID (numeric Pay ID from your Binance app). Send /cancel to abort.",
  adminEnterCryptoBotToken:
    "Send the Crypto Pay API token (get it from @CryptoBot → Crypto Pay → Create App). Send `clear` to remove it. Send /cancel to abort.",
  adminEnterCryptoBotAssets:
    "Send a comma-separated list of accepted assets (e.g. `USDT,TON,BTC,ETH`). Send /cancel to abort.",
  adminPickGameForTestflight: "Pick a game to set its TestFlight link",
  adminPickPeriodForTestflight: (game) => `${game}\n\nPick a version (period)`,
  adminEnterTestflightFor: (game, period, current) =>
    `${game}  •  ${period}\n\nCurrent TestFlight link: ${current}\n\nSend the new TestFlight invite link (e.g. \`https://testflight.apple.com/join/XXXXXX\`). Send \`clear\` to remove it. Send /cancel to abort.`,
  adminCryptoUpdated: "Crypto wallet updated.",
  adminUpiUpdated: "UPI ID updated.",
  adminBinanceUpdated: "Binance ID updated.",
  adminCryptoBotTokenUpdated: "Crypto Bot token updated.",
  adminCryptoBotAssetsUpdated: "Crypto Bot assets updated.",
  adminTestflightUpdated: "TestFlight link updated.",
  adminBtnSetCrypto: "💰  Set crypto wallet",
  adminBtnSetUpi: "🇮🇳  Set UPI ID",
  adminBtnSetBinance: "🟡  Set Binance ID",
  adminBtnSetCryptoBotToken: "🤖  Set Crypto Bot token",
  adminBtnSetCryptoBotAssets: "🪙  Set Crypto Bot assets",
  adminBtnSetTestflight: "📲  Set TestFlight link",
  adminInvalidNumber: "Please send a valid positive number.",
  adminCancelled: "Cancelled.",
  adminBtnAddAdmin: "➕  Add administrator",
  adminBtnListAdmins: "👥  Administrators list",
  adminAddAdminPrompt:
    "Send the @username of the new administrator (e.g. `@johndoe`).\n\nThey will get full access to /adm and to approving payments. Send /cancel to abort.",
  adminAddAdminInvalid:
    "That doesn't look like a valid Telegram username. Send something like `@johndoe`.",
  adminAddAdminDuplicate: "That username is already an administrator.",
  adminAddAdminOk: (username) =>
    `✅  *@${username}* has been added as an administrator.\n\nThey will gain access the next time they message the bot.`,
  adminListAdminsTitle: "👥  *Administrators*",
  adminListAdminsEmpty:
    "👥  *Administrators*\n\nNo administrators have been added yet. Tap “➕  Add administrator” to add one by username.",
  adminListAdminsRow: (label, status) => `• ${label}  —  ${status}`,
  adminListAdminsSuperBadge: "👑 super admin (cannot be removed)",
  adminListAdminsResolvedBadge: "✅ active",
  adminListAdminsPendingBadge: "⏳ pending first message",
  adminAdminRemoved: "Administrator removed.",
  adminCannotRemoveSuper: "The super admin cannot be removed.",
  adminOrderTitle: "🔔  *New payment claim*",
  adminOrderBody: (orderId, user, game, period, method, amount) =>
    `🧾  Order *#${orderId}*\n\n👤  User: ${user}\n🎮  Game: ${game}\n⏳  Period: ${period}\n💳  Method: ${method}\n💰  Amount: *${amount}*`,
  adminApprove: "✔  Approve",
  adminReject: "✖  Reject",
  adminOrderApproved: "✔  Approved. Key delivered to user.",
  adminOrderRejected: "✖  Rejected. User notified.",
  adminOrderAlreadyProcessed: "ℹ  This order is already processed.",
};

const ru: Dict = {
  pickLanguage: "🌐  Выберите язык",
  mainMenuTitle: (name) =>
    `🎮  *WinStar*  •  Winios cheat keys\n\n` +
    `Привет${name ? `, ${name}` : ""}! 👋  Добро пожаловать в официальный магазин.\n\n` +
    `⚡  Премиум-читы для ваших любимых игр.\n` +
    `💎  Мгновенная выдача — без ожиданий и хлопот.\n` +
    `🛡  100% безопасно  •  не обнаруживается  •  ежедневные обновления.\n` +
    `🔥  PUBG  •  CODM  •  Mobile Legends  •  8 Ball Pool\n\n` +
    `👇  Выберите опцию ниже, чтобы начать.`,
  btnBuy: "🎮  Купить ключи",
  btnLanguage: "🌐  Сменить язык",
  btnFeedbacks: "✅  Отзывы",
  btnSupport: "🛟  Поддержка",
  btnBack: "⬅  Назад",
  btnHome: "🏠  Главное меню",
  pickGame: "🎮  Выберите игру",
  pickPubgVariant: "🌍  PUBG Mobile  •  выберите регион",
  pickCodmVariant: "🌍  Call of Duty  •  выберите версию",
  pickMlbbVariant: "🌍  Mobile Legends  •  выберите версию",
  pickAndroidVariant: "📱  Android  •  выберите версию",
  pickPeriod: "⏳  Выберите период",
  pickPayment: "💳  Выберите способ оплаты",
  periodLabel: { day: "День", week: "Неделя", month: "Месяц" },
  periodWithPrice: (period, price) =>
    `${period === "day" ? "День" : period === "week" ? "Неделя" : "Месяц"}  —  ${price}`,
  noPriceYet: "Цена ещё не установлена. Свяжитесь с поддержкой.",
  cryptoTitle: "💰  Оплата криптой  •  USDT BEP20",
  cryptoBody: (addr, amount) =>
    `Отправьте ровно *${amount}* в *USDT (BEP20)* на адрес ниже:\n\n\`${addr}\`\n\n👆  Нажмите на адрес, чтобы скопировать. После оплаты нажмите «⚡  Я оплатил».`,
  upiTitle: "🇮🇳  Оплата UPI  •  для Индии",
  upiBody: (upi, amount) =>
    `Отправьте *${amount}* через UPI на:\n\n\`${upi}\`\n\n👆  Нажмите на UPI ID, чтобы скопировать. После оплаты нажмите «⚡  Я оплатил».`,
  binanceTitle: "🟡  Binance Pay  •  оплата по Binance ID",
  binanceBody: (binanceId, amount) =>
    `Отправьте *${amount}* через *Binance Pay* на этот Binance ID:\n\n\`${binanceId}\`\n\n👆  Нажмите, чтобы скопировать. Откройте Binance → *Pay* → *Send* → вставьте ID. После оплаты нажмите «⚡  Я оплатил».`,
  cryptoBotTitle: "🤖  Оплата через @CryptoBot",
  cryptoBotBody: (amount, assets) =>
    `Сумма: *${amount}*\n\nНажмите *Оплатить* — откроется @CryptoBot в Telegram, где вы сможете оплатить любым из: ${assets}.\n\nКак только оплата подтвердится — ключ придёт сюда автоматически.`,
  cryptoBotPayBtn: "💳  Оплатить через CryptoBot",
  cryptoBotCheckBtn: "🔄  Я оплатил — проверить",
  cryptoBotNotConfigured:
    "⚠  Оплата через Crypto Bot пока не настроена. Выберите другой способ или напишите в поддержку.",
  cryptoBotNotPaidYet:
    "⏳  Оплата ещё не получена. Оплатите в @CryptoBot и нажмите «🔄  Проверить» снова.",
  cryptoBotPaymentFailed:
    "⚠  Не удалось создать счёт. Попробуйте ещё раз или выберите другой способ оплаты.",
  paidButton: "⚡  Я оплатил",
  cancelButton: "✖  Отмена",
  paymentSubmitted:
    "⏳  Ваш платёж проверяется администратором.\nКлюч придёт сюда, как только оплата будет подтверждена. 🔑",
  paymentRejected:
    "⚠  Платёж не подтверждён.\nЕсли это ошибка — напишите в поддержку.",
  outOfStock:
    "😔  К сожалению, ключей по этому варианту нет в наличии.\nВыберите другой период или напишите в поддержку.",
  yourKey: (game, period, value) =>
    `🎉  *Заказ выдан!*\n\n🎮  Игра: ${game}\n⏳  Период: ${period}\n\n🔑  Ваш ключ:\n\n\`${value}\`\n\n👆  Нажмите, чтобы скопировать.\n\n💎  Спасибо за покупку!`,
  postDelivery: (testflightLink, updatesLink, tutorialLink) => {
    const lines: string[] = ["📦  *Что дальше?*", ""];
    if (testflightLink) {
      lines.push(`📲  *TestFlight (установка приложения):*\n${testflightLink}`);
      lines.push("");
    }
    lines.push(`🔔  *Закрытая группа обновлений:*\n${updatesLink}`);
    lines.push("");
    lines.push(`📚  *Канал с инструкциями по установке:*\n${tutorialLink}`);
    return lines.join("\n");
  },
  expireReminder3d: (game, period) =>
    `⏰  *Напоминание*\n\nВаш ключ для *${game}* (${period}) истечёт через *3 дня*.\n\n🔁  Нажмите «🎮  Купить ключи» в главном меню, чтобы продлить без простоя.`,
  expireReminder1d: (game, period) =>
    `⚠  *Напоминание*\n\nДо окончания вашего ключа *${game}* (${period}) остался *1 день*.\n\n🔁  Продлите сейчас, чтобы играть без перерыва.`,
  expireReminder1h: (game, period) =>
    `🚨  *Последний час!*\n\nВаш ключ *${game}* (${period}) истекает через *1 час*.\n\n🔁  Купите новый сейчас, чтобы не вылететь посреди матча.`,
  adminExpiredNotify: (user, game, period) =>
    `🛑  *Ключ истёк*\n\n👤  Пользователь: ${user}\n🎮  Игра: ${game}\n⏳  Период: ${period}\n\n⚠  Удалите этого пользователя из закрытой группы обновлений.`,
  game: GAME_LABELS,
  paymentLabel: {
    crypto: "💰  Crypto BEP20",
    cryptobot: "🤖  CryptoBot (Telegram)",
    upi: "🇮🇳  UPI (Индия)",
    binance: "🟡  Binance ID",
  },
  adminOnly: "🔒  Эта область только для администраторов.",
  adminPanel: "🛠  *Админ-панель*",
  adminStats: "📊  Статистика",
  adminPrices: "💲  Цены",
  adminAddKeys: "➕  Добавить ключи",
  adminViewKeys: "🗂  Список / удалить ключи",
  adminSettings: "⚙  Реквизиты оплаты",
  adminBack: "⬅  Назад",
  adminStatsBody: (sales, revenueUsd, revenueInr, users) =>
    `📊  *Статистика*\n\n🔑  Выдано продаж: *${sales}*\n💵  Выручка (USD): *${revenueUsd}*\n🇮🇳  Выручка (INR): *${revenueInr}*\n👥  Пользователей: *${users}*`,
  adminPickGameForPrice: "Выберите игру для установки цены",
  adminPickPeriodForPrice: (game) => `${game}\n\nВыберите период`,
  adminPickPriceCurrency: (game, period, currentUsd, currentInr) =>
    `${game}  •  ${period}\n\nТекущая цена USD: ${currentUsd}\nТекущая цена INR: ${currentInr}\n\nВ какой валюте установить цену?`,
  adminBtnPriceUsd: "💵  USD",
  adminBtnPriceInr: "🇮🇳  INR",
  adminEnterPriceUsd: (game, period, current) =>
    `${game}  •  ${period}\n\nТекущая цена в USD: ${current}\n\nОтправьте новую цену числом в *USD*. /cancel — отменить.`,
  adminEnterPriceInr: (game, period, current) =>
    `${game}  •  ${period}\n\nТекущая цена в INR: ${current}\n\nОтправьте новую цену числом в *INR (₹)*. /cancel — отменить.`,
  adminPriceUpdated: (game, period, price) =>
    `Обновлено  ${game}  •  ${period}  →  ${price}`,
  adminPickGameForKeys: "Выберите игру, для которой добавить ключи",
  adminPickPeriodForKeys: (game) => `${game}\n\nВыберите период`,
  adminEnterKeys: (game, period) =>
    `${game}  •  ${period}\n\nОтправьте ключи (по одному на строку). /cancel — отменить.`,
  adminKeysAdded: (count) => `Добавлено ключей: ${count}.`,
  adminKeysList: (game, period, count) =>
    `${game}  •  ${period}\n\nВ наличии: ${count}`,
  adminNoKeys: "Ключей нет.",
  adminPickGameForView: "Выберите игру для просмотра ключей",
  adminPickPeriodForView: (game) => `${game}\n\nВыберите период`,
  adminKeyDeleted: "Ключ удалён.",
  adminSettingsBody: (wallet, upi, binanceId, cbToken, cbAssets) =>
    `Реквизиты\n\nКрипто-кошелёк (BEP20):\n\`${wallet}\`\n\nUPI ID (Индия):\n\`${upi}\`\n\nBinance ID:\n\`${binanceId}\`\n\nТокен Crypto Bot: ${cbToken ? "✅ установлен" : "❌ не установлен"}\nАктивы Crypto Bot: \`${cbAssets}\`\n\nСсылки TestFlight: нажмите «📲  Ссылка TestFlight», чтобы задать ссылку отдельно для каждой игры и тарифа.`,
  adminEnterCrypto: "Отправьте новый BEP20 адрес. /cancel — отменить.",
  adminEnterUpi: "Отправьте новый UPI ID (Индия). /cancel — отменить.",
  adminEnterBinance: "Отправьте новый Binance ID (числовой Pay ID из приложения Binance). /cancel — отменить.",
  adminEnterCryptoBotToken:
    "Отправьте Crypto Pay API токен (получите в @CryptoBot → Crypto Pay → Create App). Отправьте `clear`, чтобы удалить токен. /cancel — отменить.",
  adminEnterCryptoBotAssets:
    "Отправьте список активов через запятую (например `USDT,TON,BTC,ETH`). /cancel — отменить.",
  adminPickGameForTestflight: "Выберите игру для настройки ссылки TestFlight",
  adminPickPeriodForTestflight: (game) => `${game}\n\nВыберите тариф (версию)`,
  adminEnterTestflightFor: (game, period, current) =>
    `${game}  •  ${period}\n\nТекущая ссылка TestFlight: ${current}\n\nОтправьте новую ссылку TestFlight (например \`https://testflight.apple.com/join/XXXXXX\`). Отправьте \`clear\`, чтобы удалить. /cancel — отменить.`,
  adminCryptoUpdated: "Крипто-кошелёк обновлён.",
  adminUpiUpdated: "UPI ID обновлён.",
  adminBinanceUpdated: "Binance ID обновлён.",
  adminCryptoBotTokenUpdated: "Токен Crypto Bot обновлён.",
  adminCryptoBotAssetsUpdated: "Активы Crypto Bot обновлены.",
  adminTestflightUpdated: "Ссылка TestFlight обновлена.",
  adminBtnSetCrypto: "💰  Сменить крипто-кошелёк",
  adminBtnSetUpi: "🇮🇳  Сменить UPI ID",
  adminBtnSetBinance: "🟡  Сменить Binance ID",
  adminBtnSetCryptoBotToken: "🤖  Токен Crypto Bot",
  adminBtnSetCryptoBotAssets: "🪙  Активы Crypto Bot",
  adminBtnSetTestflight: "📲  Ссылка TestFlight",
  adminInvalidNumber: "Введите корректное положительное число.",
  adminCancelled: "Отменено.",
  adminBtnAddAdmin: "➕  Добавить администратора",
  adminBtnListAdmins: "👥  Список администраторов",
  adminAddAdminPrompt:
    "Отправьте @username нового администратора (например `@johndoe`).\n\nОн получит полный доступ к /adm и подтверждению оплат. Отправьте /cancel для отмены.",
  adminAddAdminInvalid:
    "Это не похоже на корректный @username. Отправьте что-то вроде `@johndoe`.",
  adminAddAdminDuplicate: "Этот пользователь уже администратор.",
  adminAddAdminOk: (username) =>
    `✅  *@${username}* добавлен в администраторы.\n\nДоступ откроется при следующем сообщении боту.`,
  adminListAdminsTitle: "👥  *Администраторы*",
  adminListAdminsEmpty:
    "👥  *Администраторы*\n\nАдминистраторов пока нет. Нажмите «➕  Добавить администратора», чтобы добавить по @username.",
  adminListAdminsRow: (label, status) => `• ${label}  —  ${status}`,
  adminListAdminsSuperBadge: "👑 супер-админ (нельзя удалить)",
  adminListAdminsResolvedBadge: "✅ активен",
  adminListAdminsPendingBadge: "⏳ ждёт первое сообщение",
  adminAdminRemoved: "Администратор удалён.",
  adminCannotRemoveSuper: "Супер-администратора нельзя удалить.",
  adminOrderTitle: "🔔  *Новая заявка на оплату*",
  adminOrderBody: (orderId, user, game, period, method, amount) =>
    `🧾  Заказ *#${orderId}*\n\n👤  Пользователь: ${user}\n🎮  Игра: ${game}\n⏳  Период: ${period}\n💳  Метод: ${method}\n💰  Сумма: *${amount}*`,
  adminApprove: "✔  Подтвердить",
  adminReject: "✖  Отклонить",
  adminOrderApproved: "✔  Подтверждено. Ключ выдан пользователю.",
  adminOrderRejected: "✖  Отклонено. Пользователь уведомлён.",
  adminOrderAlreadyProcessed: "ℹ  Эта заявка уже обработана.",
};

const hi: Dict = {
  pickLanguage: "🌐  अपनी भाषा चुनें",
  mainMenuTitle: (name) =>
    `🎮  *WinStar*  •  Winios cheat keys\n\n` +
    `नमस्ते${name ? `, ${name}` : ""}! 👋  ऑफिशियल स्टोर में आपका स्वागत है।\n\n` +
    `⚡  आपके पसंदीदा गेम्स के लिए प्रीमियम चीट्स।\n` +
    `💎  तुरंत डिलीवरी — कोई इंतज़ार नहीं।\n` +
    `🛡  100% सुरक्षित  •  अनडिटेक्टेड  •  रोज़ अपडेट।\n` +
    `🔥  PUBG  •  CODM  •  Mobile Legends  •  8 Ball Pool\n\n` +
    `👇  शुरू करने के लिए नीचे एक विकल्प चुनें।`,
  btnBuy: "🎮  कीज़ खरीदें",
  btnLanguage: "🌐  भाषा बदलें",
  btnFeedbacks: "✅  फ़ीडबैक",
  btnSupport: "🛟  सहायता",
  btnBack: "⬅  वापस",
  btnHome: "🏠  मुख्य मेनू",
  pickGame: "🎮  गेम चुनें",
  pickPubgVariant: "🌍  PUBG Mobile  •  क्षेत्र चुनें",
  pickCodmVariant: "🌍  Call of Duty  •  वर्ज़न चुनें",
  pickMlbbVariant: "🌍  Mobile Legends  •  वर्ज़न चुनें",
  pickAndroidVariant: "📱  Android  •  वर्ज़न चुनें",
  pickPeriod: "⏳  अवधि चुनें",
  pickPayment: "💳  भुगतान का तरीका चुनें",
  periodLabel: { day: "दिन", week: "सप्ताह", month: "महीना" },
  periodWithPrice: (period, price) =>
    `${period === "day" ? "दिन" : period === "week" ? "सप्ताह" : "महीना"}  —  ${price}`,
  noPriceYet: "मूल्य अभी तय नहीं है। कृपया सहायता से संपर्क करें।",
  cryptoTitle: "💰  क्रिप्टो भुगतान  •  USDT BEP20",
  cryptoBody: (addr, amount) =>
    `नीचे दिए पते पर ठीक *${amount}* *USDT (BEP20)* में भेजें:\n\n\`${addr}\`\n\n👆  कॉपी करने के लिए पते पर टैप करें। भुगतान के बाद “⚡  मैंने भुगतान किया” दबाएँ।`,
  upiTitle: "🇮🇳  UPI भुगतान  •  भारत के लिए",
  upiBody: (upi, amount) =>
    `इस UPI ID पर *${amount}* भेजें:\n\n\`${upi}\`\n\n👆  UPI ID कॉपी करने के लिए टैप करें। भुगतान के बाद “⚡  मैंने भुगतान किया” दबाएँ।`,
  binanceTitle: "🟡  Binance Pay  •  Binance ID से",
  binanceBody: (binanceId, amount) =>
    `इस Binance ID पर *Binance Pay* से *${amount}* भेजें:\n\n\`${binanceId}\`\n\n👆  कॉपी करने के लिए टैप करें। Binance ऐप खोलें → *Pay* → *Send* → ID पेस्ट करें। भुगतान के बाद “⚡  मैंने भुगतान किया” दबाएँ।`,
  cryptoBotTitle: "🤖  @CryptoBot से भुगतान",
  cryptoBotBody: (amount, assets) =>
    `कुल: *${amount}*\n\nनीचे *Pay* दबाएँ — Telegram में @CryptoBot खुलेगा और आप इनमें से किसी से भी भुगतान कर सकते हैं: ${assets}.\n\nभुगतान कन्फ़र्म होते ही आपकी की यहाँ अपने आप आ जाएगी।`,
  cryptoBotPayBtn: "💳  CryptoBot से भुगतान",
  cryptoBotCheckBtn: "🔄  मैंने भुगतान किया — चेक करें",
  cryptoBotNotConfigured:
    "⚠  Crypto Bot भुगतान अभी सेट नहीं है। कृपया दूसरा तरीका चुनें या सहायता से संपर्क करें।",
  cryptoBotNotPaidYet:
    "⏳  भुगतान अभी प्राप्त नहीं हुआ। @CryptoBot में भुगतान के बाद “🔄  चेक करें” फिर दबाएँ।",
  cryptoBotPaymentFailed:
    "⚠  इनवॉइस नहीं बना सका। कृपया दोबारा कोशिश करें या दूसरा तरीका चुनें।",
  paidButton: "⚡  मैंने भुगतान किया",
  cancelButton: "✖  रद्द करें",
  paymentSubmitted:
    "⏳  आपका भुगतान एडमिन द्वारा जाँचा जा रहा है।\nपुष्टि होते ही आपको आपकी की यहीं मिल जाएगी। 🔑",
  paymentRejected:
    "⚠  आपका भुगतान पुष्ट नहीं हो सका।\nकुछ गलत लगे तो सहायता से संपर्क करें।",
  outOfStock:
    "😔  क्षमा करें — इस विकल्प के लिए स्टॉक में कोई की नहीं है।\nकोई दूसरी अवधि चुनें या सहायता से संपर्क करें।",
  yourKey: (game, period, value) =>
    `🎉  *आपका ऑर्डर पूरा हुआ!*\n\n🎮  गेम: ${game}\n⏳  अवधि: ${period}\n\n🔑  आपकी की:\n\n\`${value}\`\n\n👆  कॉपी करने के लिए टैप करें।\n\n💎  खरीद के लिए धन्यवाद!`,
  postDelivery: (testflightLink, updatesLink, tutorialLink) => {
    const lines: string[] = ["📦  *आगे क्या?*", ""];
    if (testflightLink) {
      lines.push(`📲  *TestFlight (ऐप इंस्टॉल करें):*\n${testflightLink}`);
      lines.push("");
    }
    lines.push(`🔔  *निजी अपडेट ग्रुप:*\n${updatesLink}`);
    lines.push("");
    lines.push(`📚  *इंस्टॉलेशन ट्यूटोरियल चैनल:*\n${tutorialLink}`);
    return lines.join("\n");
  },
  expireReminder3d: (game, period) =>
    `⏰  *सूचना*\n\nआपकी *${game}* (${period}) की *3 दिन* में एक्सपायर हो जाएगी।\n\n🔁  बिना रुकावट खेलते रहने के लिए मुख्य मेनू में «🎮  कीज़ खरीदें» दबाएँ।`,
  expireReminder1d: (game, period) =>
    `⚠  *रिमाइंडर*\n\nआपकी *${game}* (${period}) की में सिर्फ *1 दिन* बाकी है।\n\n🔁  अभी रिन्यू करें ताकि खेल में रुकावट न आए।`,
  expireReminder1h: (game, period) =>
    `🚨  *आखिरी 1 घंटा!*\n\nआपकी *${game}* (${period}) की *1 घंटे* में एक्सपायर हो रही है।\n\n🔁  मैच के बीच में बाहर न हों — अभी नई की खरीदें।`,
  adminExpiredNotify: (user, game, period) =>
    `🛑  *की एक्सपायर हो गई*\n\n👤  यूज़र: ${user}\n🎮  गेम: ${game}\n⏳  अवधि: ${period}\n\n⚠  कृपया इस यूज़र को निजी अपडेट ग्रुप से हटाएँ।`,
  game: GAME_LABELS,
  paymentLabel: {
    crypto: "💰  Crypto BEP20",
    cryptobot: "🤖  CryptoBot (Telegram)",
    upi: "🇮🇳  UPI (भारत)",
    binance: "🟡  Binance ID",
  },
  adminOnly: "🔒  यह क्षेत्र केवल एडमिन के लिए है।",
  adminPanel: "🛠  *एडमिन पैनल*",
  adminStats: "📊  आँकड़े",
  adminPrices: "💲  कीमतें",
  adminAddKeys: "➕  कीज़ जोड़ें",
  adminViewKeys: "🗂  कीज़ देखें / हटाएँ",
  adminSettings: "⚙  भुगतान सेटिंग्स",
  adminBack: "⬅  वापस",
  adminStatsBody: (sales, revenueUsd, revenueInr, users) =>
    `📊  *आँकड़े*\n\n🔑  डिलीवर हुई बिक्री: *${sales}*\n💵  राजस्व (USD): *${revenueUsd}*\n🇮🇳  राजस्व (INR): *${revenueInr}*\n👥  पंजीकृत उपयोगकर्ता: *${users}*`,
  adminPickGameForPrice: "कीमत सेट करने के लिए गेम चुनें",
  adminPickPeriodForPrice: (game) => `${game}\n\nअवधि चुनें`,
  adminPickPriceCurrency: (game, period, currentUsd, currentInr) =>
    `${game}  •  ${period}\n\nवर्तमान USD: ${currentUsd}\nवर्तमान INR: ${currentInr}\n\nकिस मुद्रा में मूल्य सेट करें?`,
  adminBtnPriceUsd: "💵  USD",
  adminBtnPriceInr: "🇮🇳  INR",
  adminEnterPriceUsd: (game, period, current) =>
    `${game}  •  ${period}\n\nवर्तमान USD मूल्य: ${current}\n\nनई कीमत संख्या में *USD* में भेजें। रद्द करने के लिए /cancel।`,
  adminEnterPriceInr: (game, period, current) =>
    `${game}  •  ${period}\n\nवर्तमान INR मूल्य: ${current}\n\nनई कीमत संख्या में *INR (₹)* में भेजें। रद्द करने के लिए /cancel।`,
  adminPriceUpdated: (game, period, price) =>
    `अपडेट हुआ  ${game}  •  ${period}  →  ${price}`,
  adminPickGameForKeys: "कीज़ जोड़ने के लिए गेम चुनें",
  adminPickPeriodForKeys: (game) => `${game}\n\nअवधि चुनें`,
  adminEnterKeys: (game, period) =>
    `${game}  •  ${period}\n\nकीज़ भेजें (हर पंक्ति में एक)। रद्द करने के लिए /cancel।`,
  adminKeysAdded: (count) => `${count} कीज़ जोड़ी गईं।`,
  adminKeysList: (game, period, count) =>
    `${game}  •  ${period}\n\nस्टॉक में: ${count}`,
  adminNoKeys: "कोई की उपलब्ध नहीं है।",
  adminPickGameForView: "कीज़ देखने के लिए गेम चुनें",
  adminPickPeriodForView: (game) => `${game}\n\nअवधि चुनें`,
  adminKeyDeleted: "की हटा दी गई।",
  adminSettingsBody: (wallet, upi, binanceId, cbToken, cbAssets) =>
    `भुगतान सेटिंग्स\n\nक्रिप्टो वॉलेट (BEP20):\n\`${wallet}\`\n\nUPI ID (भारत):\n\`${upi}\`\n\nBinance ID:\n\`${binanceId}\`\n\nCrypto Bot टोकन: ${cbToken ? "✅ सेट" : "❌ सेट नहीं"}\nCrypto Bot एसेट्स: \`${cbAssets}\`\n\nTestFlight लिंक्स: प्रत्येक गेम और अवधि के लिए अलग-अलग सेट करने के लिए “📲  TestFlight लिंक” पर टैप करें।`,
  adminEnterCrypto: "नया BEP20 वॉलेट पता भेजें। रद्द करने के लिए /cancel।",
  adminEnterUpi: "नया UPI ID (भारत) भेजें। रद्द करने के लिए /cancel।",
  adminEnterBinance: "नया Binance ID (Binance ऐप से अंकीय Pay ID) भेजें। रद्द करने के लिए /cancel।",
  adminEnterCryptoBotToken:
    "Crypto Pay API टोकन भेजें (@CryptoBot → Crypto Pay → Create App से लें)। हटाने के लिए `clear` भेजें। रद्द करने के लिए /cancel।",
  adminEnterCryptoBotAssets:
    "अल्पविराम से अलग सूची भेजें (जैसे `USDT,TON,BTC,ETH`)। रद्द करने के लिए /cancel।",
  adminPickGameForTestflight: "TestFlight लिंक सेट करने के लिए गेम चुनें",
  adminPickPeriodForTestflight: (game) => `${game}\n\nअवधि (वर्शन) चुनें`,
  adminEnterTestflightFor: (game, period, current) =>
    `${game}  •  ${period}\n\nवर्तमान TestFlight लिंक: ${current}\n\nनई TestFlight लिंक भेजें (जैसे \`https://testflight.apple.com/join/XXXXXX\`)। हटाने के लिए \`clear\` भेजें। रद्द करने के लिए /cancel।`,
  adminCryptoUpdated: "क्रिप्टो वॉलेट अपडेट हुआ।",
  adminUpiUpdated: "UPI ID अपडेट हुआ।",
  adminBinanceUpdated: "Binance ID अपडेट हुआ।",
  adminCryptoBotTokenUpdated: "Crypto Bot टोकन अपडेट हुआ।",
  adminCryptoBotAssetsUpdated: "Crypto Bot एसेट्स अपडेट हुए।",
  adminTestflightUpdated: "TestFlight लिंक अपडेट हुई।",
  adminBtnSetCrypto: "💰  क्रिप्टो वॉलेट सेट करें",
  adminBtnSetUpi: "🇮🇳  UPI ID सेट करें",
  adminBtnSetBinance: "🟡  Binance ID सेट करें",
  adminBtnSetCryptoBotToken: "🤖  Crypto Bot टोकन",
  adminBtnSetCryptoBotAssets: "🪙  Crypto Bot एसेट्स",
  adminBtnSetTestflight: "📲  TestFlight लिंक",
  adminInvalidNumber: "कृपया वैध सकारात्मक संख्या भेजें।",
  adminCancelled: "रद्द किया गया।",
  adminBtnAddAdmin: "➕  एडमिन जोड़ें",
  adminBtnListAdmins: "👥  एडमिन सूची",
  adminAddAdminPrompt:
    "नए एडमिन का @username भेजें (जैसे `@johndoe`)।\n\nउसे /adm और भुगतान मंज़ूर करने का पूरा एक्सेस मिलेगा। रद्द करने के लिए /cancel।",
  adminAddAdminInvalid:
    "यह सही Telegram @username नहीं लगता। कुछ इस तरह भेजें: `@johndoe`.",
  adminAddAdminDuplicate: "यह यूज़र पहले से एडमिन है।",
  adminAddAdminOk: (username) =>
    `✅  *@${username}* को एडमिन के रूप में जोड़ दिया गया।\n\nजब वे अगली बार बॉट को मैसेज करेंगे तो एक्सेस सक्रिय हो जाएगा।`,
  adminListAdminsTitle: "👥  *एडमिन*",
  adminListAdminsEmpty:
    "👥  *एडमिन*\n\nअभी कोई एडमिन नहीं जोड़ा गया। @username से जोड़ने के लिए «➕  एडमिन जोड़ें» दबाएँ।",
  adminListAdminsRow: (label, status) => `• ${label}  —  ${status}`,
  adminListAdminsSuperBadge: "👑 सुपर एडमिन (हटाया नहीं जा सकता)",
  adminListAdminsResolvedBadge: "✅ सक्रिय",
  adminListAdminsPendingBadge: "⏳ पहले मैसेज का इंतज़ार",
  adminAdminRemoved: "एडमिन हटा दिया गया।",
  adminCannotRemoveSuper: "सुपर एडमिन को हटाया नहीं जा सकता।",
  adminOrderTitle: "🔔  *नई भुगतान दावा*",
  adminOrderBody: (orderId, user, game, period, method, amount) =>
    `🧾  ऑर्डर *#${orderId}*\n\n👤  यूज़र: ${user}\n🎮  गेम: ${game}\n⏳  अवधि: ${period}\n💳  तरीका: ${method}\n💰  राशि: *${amount}*`,
  adminApprove: "✔  मंज़ूर करें",
  adminReject: "✖  अस्वीकृत करें",
  adminOrderApproved: "✔  मंज़ूर। यूज़र को की भेज दी गई।",
  adminOrderRejected: "✖  अस्वीकृत। यूज़र को सूचित किया गया।",
  adminOrderAlreadyProcessed: "ℹ  यह ऑर्डर पहले ही प्रोसेस हो चुका है।",
};

const DICTS: Record<Lang, Dict> = { en, ru, hi };

export function t(lang: Lang): Dict {
  return DICTS[lang] ?? en;
}
