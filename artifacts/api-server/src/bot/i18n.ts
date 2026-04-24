import type { GameId, PeriodId } from "./catalog";

export type Lang = "en" | "ru" | "hi";

export const LANGS: Lang[] = ["en", "ru", "hi"];

export const LANG_LABELS: Record<Lang, string> = {
  en: "English",
  ru: "Русский",
  hi: "हिन्दी",
};

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
  paidButton: string;
  cancelButton: string;
  paymentSubmitted: string;
  paymentRejected: string;
  outOfStock: string;
  yourKey: (game: string, period: string, value: string) => string;
  game: Record<GameId, string>;
  paymentLabel: Record<"crypto" | "remitly", string>;
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
  adminSettingsBody: (wallet: string, upi: string) => string;
  adminEnterCrypto: string;
  adminEnterUpi: string;
  adminCryptoUpdated: string;
  adminUpiUpdated: string;
  adminBtnSetCrypto: string;
  adminBtnSetUpi: string;
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
  pickLanguage: "Choose your language",
  mainMenuTitle: (name) =>
    `WinStar  •  Winios cheat keys\n\nWelcome${name ? `, ${name}` : ""}.\nPremium keys for the games you play.`,
  btnBuy: "▸  Buy keys",
  btnLanguage: "◇  Change language",
  btnReviews: "◈  Reviews",
  btnSupport: "◌  Support",
  btnBack: "‹  Back",
  btnHome: "⌂  Main menu",
  pickGame: "Choose a game",
  pickPubgVariant: "PUBG Mobile  •  pick a region",
  pickPeriod: (function () {
    return "Choose a period";
  })(),
  pickPayment: "Choose a payment method",
  periodLabel: { day: "Day", week: "Week", month: "Month" },
  periodWithPrice: (period, price) =>
    `${period === "day" ? "Day" : period === "week" ? "Week" : "Month"}  —  ${price}`,
  noPriceYet: "Price not set yet. Please contact support.",
  cryptoTitle: "Crypto payment  •  BEP20",
  cryptoBody: (addr, amount) =>
    `Send exactly ${amount} (USDT BEP20) to the address below:\n\n\`${addr}\`\n\nTap the address to copy. After paying, press “I have paid”.`,
  remitlyTitle: "Remitly payment",
  remitlyBody: (upi, amount) =>
    `Send ${amount} via Remitly to:\n\n\`${upi}\`\n\nTap to copy. After paying, press “I have paid”.`,
  paidButton: "◉  I have paid",
  cancelButton: "✕  Cancel",
  paymentSubmitted:
    "Your payment is being reviewed by an admin. You will receive your key here as soon as it is confirmed.",
  paymentRejected:
    "Your payment could not be confirmed. If this looks wrong, please contact support.",
  outOfStock: "Sorry — out of stock for this option. Please choose another period or contact support.",
  yourKey: (game, period, value) =>
    `Order delivered\n\nGame: ${game}\nPeriod: ${period}\n\nYour key:\n\n\`${value}\`\n\nTap to copy. Thank you for your purchase.`,
  game: GAME_LABELS,
  paymentLabel: { crypto: "Crypto BEP20", remitly: "Remitly" },
  adminOnly: "This area is restricted.",
  adminPanel: "Admin panel",
  adminStats: "▸  Statistics",
  adminPrices: "▸  Prices",
  adminAddKeys: "▸  Add keys",
  adminViewKeys: "▸  View / delete keys",
  adminSettings: "▸  Payment settings",
  adminBack: "‹  Back",
  adminStatsBody: (sales, profit, users) =>
    `Statistics\n\nSales delivered: ${sales}\nGross revenue: ${profit}\nRegistered users: ${users}`,
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
  adminSettingsBody: (wallet, upi) =>
    `Payment settings\n\nCrypto wallet (BEP20):\n\`${wallet}\`\n\nRemitly UPI:\n\`${upi}\``,
  adminEnterCrypto: "Send the new BEP20 wallet address. Send /cancel to abort.",
  adminEnterUpi: "Send the new UPI ID. Send /cancel to abort.",
  adminCryptoUpdated: "Crypto wallet updated.",
  adminUpiUpdated: "UPI updated.",
  adminBtnSetCrypto: "▸  Set crypto wallet",
  adminBtnSetUpi: "▸  Set UPI",
  adminInvalidNumber: "Please send a valid positive number.",
  adminCancelled: "Cancelled.",
  adminOrderTitle: "New payment claim",
  adminOrderBody: (orderId, user, game, period, method, amount) =>
    `Order  #${orderId}\n\nUser: ${user}\nGame: ${game}\nPeriod: ${period}\nMethod: ${method}\nAmount: ${amount}`,
  adminApprove: "◆  Approve",
  adminReject: "◇  Reject",
  adminOrderApproved: "Approved. Key delivered to user.",
  adminOrderRejected: "Rejected. User notified.",
  adminOrderAlreadyProcessed: "This order is already processed.",
};

const ru: Dict = {
  pickLanguage: "Выберите язык",
  mainMenuTitle: (name) =>
    `WinStar  •  Winios cheat keys\n\nДобро пожаловать${name ? `, ${name}` : ""}.\nПремиум-ключи для ваших любимых игр.`,
  btnBuy: "▸  Купить ключи",
  btnLanguage: "◇  Сменить язык",
  btnReviews: "◈  Отзывы",
  btnSupport: "◌  Поддержка",
  btnBack: "‹  Назад",
  btnHome: "⌂  Главное меню",
  pickGame: "Выберите игру",
  pickPubgVariant: "PUBG Mobile  •  выберите регион",
  pickPeriod: "Выберите период",
  pickPayment: "Выберите способ оплаты",
  periodLabel: { day: "День", week: "Неделя", month: "Месяц" },
  periodWithPrice: (period, price) =>
    `${period === "day" ? "День" : period === "week" ? "Неделя" : "Месяц"}  —  ${price}`,
  noPriceYet: "Цена ещё не установлена. Свяжитесь с поддержкой.",
  cryptoTitle: "Оплата криптой  •  BEP20",
  cryptoBody: (addr, amount) =>
    `Отправьте ровно ${amount} (USDT BEP20) на адрес ниже:\n\n\`${addr}\`\n\nНажмите на адрес, чтобы скопировать. После оплаты нажмите «Я оплатил».`,
  remitlyTitle: "Оплата через Remitly",
  remitlyBody: (upi, amount) =>
    `Отправьте ${amount} через Remitly на:\n\n\`${upi}\`\n\nНажмите, чтобы скопировать. После оплаты нажмите «Я оплатил».`,
  paidButton: "◉  Я оплатил",
  cancelButton: "✕  Отмена",
  paymentSubmitted:
    "Ваш платёж проверяется администратором. Ключ придёт сюда, как только оплата будет подтверждена.",
  paymentRejected:
    "Платёж не подтверждён. Если это ошибка — напишите в поддержку.",
  outOfStock:
    "К сожалению, ключей по этому варианту нет в наличии. Выберите другой период или напишите в поддержку.",
  yourKey: (game, period, value) =>
    `Заказ выдан\n\nИгра: ${game}\nПериод: ${period}\n\nВаш ключ:\n\n\`${value}\`\n\nНажмите, чтобы скопировать. Спасибо за покупку.`,
  game: GAME_LABELS,
  paymentLabel: { crypto: "Crypto BEP20", remitly: "Remitly" },
  adminOnly: "Эта область только для администраторов.",
  adminPanel: "Админ-панель",
  adminStats: "▸  Статистика",
  adminPrices: "▸  Цены",
  adminAddKeys: "▸  Добавить ключи",
  adminViewKeys: "▸  Список / удалить ключи",
  adminSettings: "▸  Реквизиты оплаты",
  adminBack: "‹  Назад",
  adminStatsBody: (sales, profit, users) =>
    `Статистика\n\nВыдано продаж: ${sales}\nВыручка: ${profit}\nПользователей: ${users}`,
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
  adminSettingsBody: (wallet, upi) =>
    `Реквизиты\n\nКрипто-кошелёк (BEP20):\n\`${wallet}\`\n\nRemitly UPI:\n\`${upi}\``,
  adminEnterCrypto: "Отправьте новый BEP20 адрес. /cancel — отменить.",
  adminEnterUpi: "Отправьте новый UPI ID. /cancel — отменить.",
  adminCryptoUpdated: "Крипто-кошелёк обновлён.",
  adminUpiUpdated: "UPI обновлён.",
  adminBtnSetCrypto: "▸  Сменить крипто-кошелёк",
  adminBtnSetUpi: "▸  Сменить UPI",
  adminInvalidNumber: "Введите корректное положительное число.",
  adminCancelled: "Отменено.",
  adminOrderTitle: "Новая заявка на оплату",
  adminOrderBody: (orderId, user, game, period, method, amount) =>
    `Заказ  #${orderId}\n\nПользователь: ${user}\nИгра: ${game}\nПериод: ${period}\nМетод: ${method}\nСумма: ${amount}`,
  adminApprove: "◆  Подтвердить",
  adminReject: "◇  Отклонить",
  adminOrderApproved: "Подтверждено. Ключ выдан пользователю.",
  adminOrderRejected: "Отклонено. Пользователь уведомлён.",
  adminOrderAlreadyProcessed: "Эта заявка уже обработана.",
};

const hi: Dict = {
  pickLanguage: "अपनी भाषा चुनें",
  mainMenuTitle: (name) =>
    `WinStar  •  Winios cheat keys\n\nस्वागत है${name ? `, ${name}` : ""}।\nआपके पसंदीदा गेम्स के लिए प्रीमियम कीज़।`,
  btnBuy: "▸  कीज़ खरीदें",
  btnLanguage: "◇  भाषा बदलें",
  btnReviews: "◈  समीक्षाएँ",
  btnSupport: "◌  सहायता",
  btnBack: "‹  वापस",
  btnHome: "⌂  मुख्य मेनू",
  pickGame: "गेम चुनें",
  pickPubgVariant: "PUBG Mobile  •  क्षेत्र चुनें",
  pickPeriod: "अवधि चुनें",
  pickPayment: "भुगतान का तरीका चुनें",
  periodLabel: { day: "दिन", week: "सप्ताह", month: "महीना" },
  periodWithPrice: (period, price) =>
    `${period === "day" ? "दिन" : period === "week" ? "सप्ताह" : "महीना"}  —  ${price}`,
  noPriceYet: "मूल्य अभी तय नहीं है। कृपया सहायता से संपर्क करें।",
  cryptoTitle: "क्रिप्टो भुगतान  •  BEP20",
  cryptoBody: (addr, amount) =>
    `नीचे दिए पते पर ठीक ${amount} (USDT BEP20) भेजें:\n\n\`${addr}\`\n\nकॉपी करने के लिए पते पर टैप करें। भुगतान के बाद “मैंने भुगतान किया” दबाएँ।`,
  remitlyTitle: "Remitly भुगतान",
  remitlyBody: (upi, amount) =>
    `Remitly से ${amount} इस पते पर भेजें:\n\n\`${upi}\`\n\nकॉपी करने के लिए टैप करें। भुगतान के बाद “मैंने भुगतान किया” दबाएँ।`,
  paidButton: "◉  मैंने भुगतान किया",
  cancelButton: "✕  रद्द करें",
  paymentSubmitted:
    "आपका भुगतान एडमिन द्वारा जाँचा जा रहा है। पुष्टि होते ही आपको आपकी की यहीं मिल जाएगी।",
  paymentRejected:
    "आपका भुगतान पुष्ट नहीं हो सका। कुछ गलत लगे तो सहायता से संपर्क करें।",
  outOfStock:
    "क्षमा करें — इस विकल्प के लिए स्टॉक में कोई की नहीं है। कोई दूसरी अवधि चुनें या सहायता से संपर्क करें।",
  yourKey: (game, period, value) =>
    `आपका ऑर्डर पूरा हुआ\n\nगेम: ${game}\nअवधि: ${period}\n\nआपकी की:\n\n\`${value}\`\n\nकॉपी करने के लिए टैप करें। खरीद के लिए धन्यवाद।`,
  game: GAME_LABELS,
  paymentLabel: { crypto: "Crypto BEP20", remitly: "Remitly" },
  adminOnly: "यह क्षेत्र केवल एडमिन के लिए है।",
  adminPanel: "एडमिन पैनल",
  adminStats: "▸  आँकड़े",
  adminPrices: "▸  कीमतें",
  adminAddKeys: "▸  कीज़ जोड़ें",
  adminViewKeys: "▸  कीज़ देखें / हटाएँ",
  adminSettings: "▸  भुगतान सेटिंग्स",
  adminBack: "‹  वापस",
  adminStatsBody: (sales, profit, users) =>
    `आँकड़े\n\nडिलीवर हुई बिक्री: ${sales}\nकुल राजस्व: ${profit}\nपंजीकृत उपयोगकर्ता: ${users}`,
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
  adminSettingsBody: (wallet, upi) =>
    `भुगतान सेटिंग्स\n\nक्रिप्टो वॉलेट (BEP20):\n\`${wallet}\`\n\nRemitly UPI:\n\`${upi}\``,
  adminEnterCrypto: "नया BEP20 वॉलेट पता भेजें। रद्द करने के लिए /cancel।",
  adminEnterUpi: "नया UPI ID भेजें। रद्द करने के लिए /cancel।",
  adminCryptoUpdated: "क्रिप्टो वॉलेट अपडेट हुआ।",
  adminUpiUpdated: "UPI अपडेट हुआ।",
  adminBtnSetCrypto: "▸  क्रिप्टो वॉलेट सेट करें",
  adminBtnSetUpi: "▸  UPI सेट करें",
  adminInvalidNumber: "कृपया वैध सकारात्मक संख्या भेजें।",
  adminCancelled: "रद्द किया गया।",
  adminOrderTitle: "नई भुगतान दावा",
  adminOrderBody: (orderId, user, game, period, method, amount) =>
    `ऑर्डर  #${orderId}\n\nयूज़र: ${user}\nगेम: ${game}\nअवधि: ${period}\nतरीका: ${method}\nराशि: ${amount}`,
  adminApprove: "◆  मंज़ूर करें",
  adminReject: "◇  अस्वीकृत करें",
  adminOrderApproved: "मंज़ूर। यूज़र को की भेज दी गई।",
  adminOrderRejected: "अस्वीकृत। यूज़र को सूचित किया गया।",
  adminOrderAlreadyProcessed: "यह ऑर्डर पहले ही प्रोसेस हो चुका है।",
};

const DICTS: Record<Lang, Dict> = { en, ru, hi };

export function t(lang: Lang): Dict {
  return DICTS[lang] ?? en;
}
