import type { Bot } from "grammy";
import {
  getOrder,
  getUser,
  rejectOrder,
  reserveKeyForOrder,
} from "./db";
import { t, type Lang } from "./i18n";
import { mainMenuKb } from "./keyboards";
import { logger } from "../lib/logger";

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
  return "delivered";
}
