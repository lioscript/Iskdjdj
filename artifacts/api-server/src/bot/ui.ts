import { InputFile } from "grammy";
import type { Context } from "grammy";
import { POSTER_PATH } from "./db";
import { logger } from "../lib/logger";

// Strategy for "no duplicate menus":
// Always delete the previous bot message before sending a new one. The bot
// tracks the last menu message id per chat in memory.

const lastMenuMessageByChat = new Map<number, number>();

async function deleteLastMenu(ctx: Context): Promise<void> {
  const chatId = ctx.chat?.id;
  if (chatId === undefined) return;
  const msgId = lastMenuMessageByChat.get(chatId);
  if (msgId === undefined) return;
  try {
    await ctx.api.deleteMessage(chatId, msgId);
  } catch {
    // ignore — message may already be deleted or too old
  } finally {
    lastMenuMessageByChat.delete(chatId);
  }
}

export async function showMenuText(
  ctx: Context,
  text: string,
  keyboard: import("grammy").InlineKeyboard,
): Promise<void> {
  await deleteLastMenu(ctx);
  const sent = await ctx.reply(text, {
    reply_markup: keyboard,
    parse_mode: "Markdown",
    link_preview_options: { is_disabled: true },
  });
  if (ctx.chat?.id) {
    lastMenuMessageByChat.set(ctx.chat.id, sent.message_id);
  }
}

export async function showMenuPhoto(
  ctx: Context,
  caption: string,
  keyboard: import("grammy").InlineKeyboard,
): Promise<void> {
  await deleteLastMenu(ctx);
  try {
    const sent = await ctx.replyWithPhoto(new InputFile(POSTER_PATH), {
      caption,
      reply_markup: keyboard,
      parse_mode: "Markdown",
    });
    if (ctx.chat?.id) {
      lastMenuMessageByChat.set(ctx.chat.id, sent.message_id);
    }
  } catch (err) {
    logger.warn({ err }, "Failed to send poster, falling back to text");
    await showMenuText(ctx, caption, keyboard);
  }
}

export function rememberMenuMessage(chatId: number, messageId: number): void {
  lastMenuMessageByChat.set(chatId, messageId);
}

export function forgetMenuMessage(chatId: number): void {
  lastMenuMessageByChat.delete(chatId);
}
