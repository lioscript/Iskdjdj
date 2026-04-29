import type { Bot } from "grammy";
import {
  getOrder,
  getTestflightLinkFor,
  getUser,
  rejectOrder,
  reserveKeyForOrder,
} from "./db";
import { t, type Lang } from "./i18n";
import { mainMenuKb } from "./keyboards";
import { logger } from "../lib/logger";
import type { GameId, PeriodId } from "./catalog";

// Hard-coded private group + tutorial channel links sent to the user
// right after a successful key delivery. The TestFlight invite link is
// admin-configurable per (game, period) — see `getTestflightLinkFor`.
export const UPDATES_GROUP_LINK = "https://t.me/+J8Tx8erRgnY0NmY1";
export const TUTORIAL_CHANNEL_LINK = "https://t.me/WinStarInstallation";

export async function sendPostDeliveryInfo(
  bot: Bot,
  chatId: number,
  lang: Lang,
  game: GameId,
  period: PeriodId,
): Promise<void> {
  const tr = t(lang);
  const text = tr.postDelivery(
    getTestflightLinkFor(game, period),
    UPDATES_GROUP_LINK,
    TUTORIAL_CHANNEL_LINK,
  );
  try {
    await bot.api.sendMessage(chatId, text, {
      parse_mode: "Markdown",
      link_preview_options: { is_disabled: true },
    });
  } catch (err) {
    logger.warn({ err, chatId }, "Failed to send post-delivery info");
  }
}

/**
 * Deliver a key for a paid order. Returns "delivered", "out_of_stock",
 * or "already_processed". Idempotent: safe to call from both webhook
 * and the polling sweeper — only the first caller will actually
 * deliver because `reserveKeyForOrder` flips the order to `delivered`
 * inside a transaction.
 */
export async function deliverPaidOrder(
  bot: Bot,
  orderId: number,
): Promise<"delivered" | "out_of_stock" | "already_processed" | "not_found"> {
  const order = getOrder(orderId);
  if (!order) return "not_found";
  if (order.status !== "pending") return "already_processed";

  const userLang = (getUser(order.user_telegram_id)?.language as Lang) ?? "en";
  const userTr = t(userLang);

  const key = reserveKeyForOrder(orderId, order.game, order.period);
  if (!key) {
    rejectOrder(orderId);
    try {
      await bot.api.sendMessage(order.user_telegram_id, userTr.outOfStock, {
        reply_markup: mainMenuKb(userLang),
        parse_mode: "Markdown",
      });
    } catch (err) {
      logger.warn({ err, orderId }, "Failed to notify user of out-of-stock");
    }
    return "out_of_stock";
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
    logger.error({ err, orderId }, "Failed to deliver key to user");
  }
  await sendPostDeliveryInfo(
    bot,
    order.user_telegram_id,
    userLang,
    order.game,
    order.period,
  );
  return "delivered";
}
