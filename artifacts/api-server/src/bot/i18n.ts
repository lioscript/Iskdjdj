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
  btnReviews: string;
  btnSupport: string;
  btnBack: string;
  btnHome: string;
  pickGame: string;
  pickPubgVariant: string;
  pickPeriod: string;
  pickPayment: string;
  periodLabel: Record<PeriodId, string>;
  periodWithPrice: (period: PeriodId, price: string) => string;
  noPriceYet: string;
  cryptoTitle: string;
  cryptoBody: (addr: string, amount: string) => string;
  remitlyTitle: string;
  remitlyBody: (upi: string, amount: string) => string;
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
  game: Record<GameId, string>;
  paymentLabel: Record<"crypto" | "remitly" | "cryptobot", string>;
  // Admin
  adminOnly: string;
  adminPanel: string;
  adminStats: string;
  adminPrices: string;
  adminAddKeys: string;
  adminViewKeys: string;
  adminSettings: string;
  adminBack: string;
  adminStatsBody: (sales: number, profit: string, users: number) => string;
  adminPickGameForPrice: string;
  adminPickPeriodForPrice: (game: string) => string;
  adminEnterPrice: (game: string, period: string, current: string) => string;
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
    cryptoBotToken: string,
    cryptoBotAssets: string,
  ) => string;
  adminEnterCrypto: string;
  adminEnterUpi: string;
  adminEnterCryptoBotToken: string;
  adminEnterCryptoBotAssets: string;
  adminCryptoUpdated: string;
  adminUpiUpdated: string;
  adminCryptoBotTokenUpdated: string;
  adminCryptoBotAssetsUpdated: string;
  adminBtnSetCrypto: string;
  adminBtnSetUpi: string;
  adminBtnSetCryptoBotToken: string;
  adminBtnSetCryptoBotAssets: string;
  adminInvalidNumber: string;
  adminCancelled: string;
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
  pubg_bgmi: "PUBG Mobile — BGMI",
  pubg_global: "PUBG Mobile — Global",
  pubg_taiwan: "PUBG Mobile — Taiwan",
  pubg_korean: "PUBG Mobile — Korean",
  codm: "Call of Duty GL",
  ml: "Mobile Legends",
  "8bp": "8 Ball Pool",
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
  btnReviews: "💬  Reviews",
  btnSupport: "🛟  Support",
  btnBack: "⬅  Back",
  btnHome: "🏠  Main menu",
  pickGame: "🎮  Choose a game",
  pickPubgVariant: "🌍  PUBG Mobile  •  pick a region",
  pickPeriod: "⏳  Choose a period",
  pickPayment: "💳  Choose a payment method",
  periodLabel: { day: "Day", week: "Week", month: "Month" },
  periodWithPrice: (period, price) =>
    `${period === "day" ? "Day" : period === "week" ? "Week" : "Month"}  —  ${price}`,
  noPriceYet: "Price not set yet. Please contact support.",
  cryptoTitle: "💰  Crypto payment  •  USDT BEP20",
  cryptoBody: (addr, amount) =>
    `Send exactly *${amount}* in *USDT (BEP20)* to the address below:\n\n\`${addr}\`\n\n👆  Tap the address to copy. After paying, press “⚡  I have paid”.`,
  remitlyTitle: "💸  Remitly payment",
  remitlyBody: (upi, amount) =>
    `Send *${amount}* via Remitly to:\n\n\`${upi}\`\n\n👆  Tap to copy. After paying, press “⚡  I have paid”.`,
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
  game: GAME_LABELS,
  paymentLabel: {
    crypto: "💰  Crypto BEP20",
    remitly: "💸  Remitly",
    cryptobot: "🤖  CryptoBot (Telegram)",
  },
  adminOnly: "🔒  This area is restricted.",
  adminPanel: "🛠  *Admin panel*",
  adminStats: "📊  Statistics",
  adminPrices: "💲  Prices",
  adminAddKeys: "➕  Add keys",
  adminViewKeys: "🗂  View / delete keys",
  adminSettings: "⚙  Payment settings",
  adminBack: "⬅  Back",
  adminStatsBody: (sales, profit, users) =>
    `📊  *Statistics*\n\n🔑  Sales delivered: *${sales}*\n💰  Gross revenue: *${profit}*\n👥  Registered users: *${users}*`,
  adminPickGameForPrice: "Pick a game to set its prices",
  adminPickPeriodForPrice: (game) => `${game}\n\nPick a period`,
  adminEnterPrice: (game, period, current) =>
    `${game}  •  ${period}\n\nCurrent: ${current}\n\nSend the new price as a number (USD). Send /cancel to abort.`,
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
  adminSettingsBody: (wallet, upi, cbToken, cbAssets) =>
    `Payment settings\n\nCrypto wallet (BEP20):\n\`${wallet}\`\n\nRemitly UPI:\n\`${upi}\`\n\nCrypto Bot token: ${cbToken ? "✅ set" : "❌ not set"}\nCrypto Bot assets: \`${cbAssets}\``,
  adminEnterCrypto: "Send the new BEP20 wallet address. Send /cancel to abort.",
  adminEnterUpi: "Send the new UPI ID. Send /cancel to abort.",
  adminEnterCryptoBotToken:
    "Send the Crypto Pay API token (get it from @CryptoBot → Crypto Pay → Create App). Send `clear` to remove it. Send /cancel to abort.",
  adminEnterCryptoBotAssets:
    "Send a comma-separated list of accepted assets (e.g. `USDT,TON,BTC,ETH`). Send /cancel to abort.",
  adminCryptoUpdated: "Crypto wallet updated.",
  adminUpiUpdated: "UPI updated.",
  adminCryptoBotTokenUpdated: "Crypto Bot token updated.",
  adminCryptoBotAssetsUpdated: "Crypto Bot assets updated.",
  adminBtnSetCrypto: "💰  Set crypto wallet",
  adminBtnSetUpi: "💸  Set UPI",
  adminBtnSetCryptoBotToken: "🤖  Set Crypto Bot token",
  adminBtnSetCryptoBotAssets: "🪙  Set Crypto Bot assets",
  adminInvalidNumber: "Please send a valid positive number.",
  adminCancelled: "Cancelled.",
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
  btnReviews: "💬  Отзывы",
  btnSupport: "🛟  Поддержка",
  btnBack: "⬅  Назад",
  btnHome: "🏠  Главное меню",
  pickGame: "🎮  Выберите игру",
  pickPubgVariant: "🌍  PUBG Mobile  •  выберите регион",
  pickPeriod: "⏳  Выберите период",
  pickPayment: "💳  Выберите способ оплаты",
  periodLabel: { day: "День", week: "Неделя", month: "Месяц" },
  periodWithPrice: (period, price) =>
    `${period === "day" ? "День" : period === "week" ? "Неделя" : "Месяц"}  —  ${price}`,
  noPriceYet: "Цена ещё не установлена. Свяжитесь с поддержкой.",
  cryptoTitle: "💰  Оплата криптой  •  USDT BEP20",
  cryptoBody: (addr, amount) =>
    `Отправьте ровно *${amount}* в *USDT (BEP20)* на адрес ниже:\n\n\`${addr}\`\n\n👆  Нажмите на адрес, чтобы скопировать. После оплаты нажмите «⚡  Я оплатил».`,
  remitlyTitle: "💸  Оплата через Remitly",
  remitlyBody: (upi, amount) =>
    `Отправьте *${amount}* через Remitly на:\n\n\`${upi}\`\n\n👆  Нажмите, чтобы скопировать. После оплаты нажмите «⚡  Я оплатил».`,
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
  game: GAME_LABELS,
  paymentLabel: {
    crypto: "💰  Crypto BEP20",
    remitly: "💸  Remitly",
    cryptobot: "🤖  CryptoBot (Telegram)",
  },
  adminOnly: "🔒  Эта область только для администраторов.",
  adminPanel: "🛠  *Админ-панель*",
  adminStats: "📊  Статистика",
  adminPrices: "💲  Цены",
  adminAddKeys: "➕  Добавить ключи",
  adminViewKeys: "🗂  Список / удалить ключи",
  adminSettings: "⚙  Реквизиты оплаты",
  adminBack: "⬅  Назад",
  adminStatsBody: (sales, profit, users) =>
    `📊  *Статистика*\n\n🔑  Выдано продаж: *${sales}*\n💰  Выручка: *${profit}*\n👥  Пользователей: *${users}*`,
  adminPickGameForPrice: "Выберите игру для установки цены",
  adminPickPeriodForPrice: (game) => `${game}\n\nВыберите период`,
  adminEnterPrice: (game, period, current) =>
    `${game}  •  ${period}\n\nТекущая цена: ${current}\n\nОтправьте новую цену числом (USD). /cancel — отменить.`,
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
  adminSettingsBody: (wallet, upi, cbToken, cbAssets) =>
    `Реквизиты\n\nКрипто-кошелёк (BEP20):\n\`${wallet}\`\n\nRemitly UPI:\n\`${upi}\`\n\nТокен Crypto Bot: ${cbToken ? "✅ установлен" : "❌ не установлен"}\nАктивы Crypto Bot: \`${cbAssets}\``,
  adminEnterCrypto: "Отправьте новый BEP20 адрес. /cancel — отменить.",
  adminEnterUpi: "Отправьте новый UPI ID. /cancel — отменить.",
  adminEnterCryptoBotToken:
    "Отправьте Crypto Pay API токен (получите в @CryptoBot → Crypto Pay → Create App). Отправьте `clear`, чтобы удалить токен. /cancel — отменить.",
  adminEnterCryptoBotAssets:
    "Отправьте список активов через запятую (например `USDT,TON,BTC,ETH`). /cancel — отменить.",
  adminCryptoUpdated: "Крипто-кошелёк обновлён.",
  adminUpiUpdated: "UPI обновлён.",
  adminCryptoBotTokenUpdated: "Токен Crypto Bot обновлён.",
  adminCryptoBotAssetsUpdated: "Активы Crypto Bot обновлены.",
  adminBtnSetCrypto: "💰  Сменить крипто-кошелёк",
  adminBtnSetUpi: "💸  Сменить UPI",
  adminBtnSetCryptoBotToken: "🤖  Токен Crypto Bot",
  adminBtnSetCryptoBotAssets: "🪙  Активы Crypto Bot",
  adminInvalidNumber: "Введите корректное положительное число.",
  adminCancelled: "Отменено.",
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
  btnReviews: "💬  समीक्षाएँ",
  btnSupport: "🛟  सहायता",
  btnBack: "⬅  वापस",
  btnHome: "🏠  मुख्य मेनू",
  pickGame: "🎮  गेम चुनें",
  pickPubgVariant: "🌍  PUBG Mobile  •  क्षेत्र चुनें",
  pickPeriod: "⏳  अवधि चुनें",
  pickPayment: "💳  भुगतान का तरीका चुनें",
  periodLabel: { day: "दिन", week: "सप्ताह", month: "महीना" },
  periodWithPrice: (period, price) =>
    `${period === "day" ? "दिन" : period === "week" ? "सप्ताह" : "महीना"}  —  ${price}`,
  noPriceYet: "मूल्य अभी तय नहीं है। कृपया सहायता से संपर्क करें।",
  cryptoTitle: "💰  क्रिप्टो भुगतान  •  USDT BEP20",
  cryptoBody: (addr, amount) =>
    `नीचे दिए पते पर ठीक *${amount}* *USDT (BEP20)* में भेजें:\n\n\`${addr}\`\n\n👆  कॉपी करने के लिए पते पर टैप करें। भुगतान के बाद “⚡  मैंने भुगतान किया” दबाएँ।`,
  remitlyTitle: "💸  Remitly भुगतान",
  remitlyBody: (upi, amount) =>
    `Remitly से *${amount}* इस पते पर भेजें:\n\n\`${upi}\`\n\n👆  कॉपी करने के लिए टैप करें। भुगतान के बाद “⚡  मैंने भुगतान किया” दबाएँ।`,
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
  game: GAME_LABELS,
  paymentLabel: {
    crypto: "💰  Crypto BEP20",
    remitly: "💸  Remitly",
    cryptobot: "🤖  CryptoBot (Telegram)",
  },
  adminOnly: "🔒  यह क्षेत्र केवल एडमिन के लिए है।",
  adminPanel: "🛠  *एडमिन पैनल*",
  adminStats: "📊  आँकड़े",
  adminPrices: "💲  कीमतें",
  adminAddKeys: "➕  कीज़ जोड़ें",
  adminViewKeys: "🗂  कीज़ देखें / हटाएँ",
  adminSettings: "⚙  भुगतान सेटिंग्स",
  adminBack: "⬅  वापस",
  adminStatsBody: (sales, profit, users) =>
    `📊  *आँकड़े*\n\n🔑  डिलीवर हुई बिक्री: *${sales}*\n💰  कुल राजस्व: *${profit}*\n👥  पंजीकृत उपयोगकर्ता: *${users}*`,
  adminPickGameForPrice: "कीमत सेट करने के लिए गेम चुनें",
  adminPickPeriodForPrice: (game) => `${game}\n\nअवधि चुनें`,
  adminEnterPrice: (game, period, current) =>
    `${game}  •  ${period}\n\nवर्तमान: ${current}\n\nनई कीमत संख्या में भेजें (USD)। रद्द करने के लिए /cancel भेजें।`,
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
  adminSettingsBody: (wallet, upi, cbToken, cbAssets) =>
    `भुगतान सेटिंग्स\n\nक्रिप्टो वॉलेट (BEP20):\n\`${wallet}\`\n\nRemitly UPI:\n\`${upi}\`\n\nCrypto Bot टोकन: ${cbToken ? "✅ सेट" : "❌ सेट नहीं"}\nCrypto Bot एसेट्स: \`${cbAssets}\``,
  adminEnterCrypto: "नया BEP20 वॉलेट पता भेजें। रद्द करने के लिए /cancel।",
  adminEnterUpi: "नया UPI ID भेजें। रद्द करने के लिए /cancel।",
  adminEnterCryptoBotToken:
    "Crypto Pay API टोकन भेजें (@CryptoBot → Crypto Pay → Create App से लें)। हटाने के लिए `clear` भेजें। रद्द करने के लिए /cancel।",
  adminEnterCryptoBotAssets:
    "अल्पविराम से अलग सूची भेजें (जैसे `USDT,TON,BTC,ETH`)। रद्द करने के लिए /cancel।",
  adminCryptoUpdated: "क्रिप्टो वॉलेट अपडेट हुआ।",
  adminUpiUpdated: "UPI अपडेट हुआ।",
  adminCryptoBotTokenUpdated: "Crypto Bot टोकन अपडेट हुआ।",
  adminCryptoBotAssetsUpdated: "Crypto Bot एसेट्स अपडेट हुए।",
  adminBtnSetCrypto: "💰  क्रिप्टो वॉलेट सेट करें",
  adminBtnSetUpi: "💸  UPI सेट करें",
  adminBtnSetCryptoBotToken: "🤖  Crypto Bot टोकन",
  adminBtnSetCryptoBotAssets: "🪙  Crypto Bot एसेट्स",
  adminInvalidNumber: "कृपया वैध सकारात्मक संख्या भेजें।",
  adminCancelled: "रद्द किया गया।",
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
