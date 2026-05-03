import type { GameId, PaymentMethod, PeriodId } from "./catalog";

export type AdminState =
  | { kind: "await_price"; game: GameId; period: PeriodId; currency: "usd" | "inr" }
  | { kind: "await_keys"; game: GameId; period: PeriodId }
  | { kind: "await_crypto" }
  | { kind: "await_upi" }
  | { kind: "await_binance" }
  | { kind: "await_cbtoken" }
  | { kind: "await_cbassets" }
  | { kind: "await_testflight"; game: GameId; period: PeriodId }
  | { kind: "await_admin_username" }
  | { kind: "await_promo_name" }
  | { kind: "await_promo_uses"; code: string }
  | { kind: "await_promo_discount"; code: string; maxUses: number };

export type UserPromoState = {
  kind: "await_promo";
  game: GameId;
  method: PaymentMethod;
};

const adminStates = new Map<number, AdminState>();
const userPromoStates = new Map<number, UserPromoState>();

export function setState(chatId: number, state: AdminState): void {
  adminStates.set(chatId, state);
}

export function getState(chatId: number): AdminState | undefined {
  return adminStates.get(chatId);
}

export function clearState(chatId: number): void {
  adminStates.delete(chatId);
  userPromoStates.delete(chatId);
}

export function setUserPromoState(chatId: number, state: UserPromoState): void {
  userPromoStates.set(chatId, state);
}

export function getUserPromoState(chatId: number): UserPromoState | undefined {
  return userPromoStates.get(chatId);
}

export function clearUserPromoState(chatId: number): void {
  userPromoStates.delete(chatId);
}
