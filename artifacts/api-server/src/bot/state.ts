import type { GameId, PeriodId } from "./catalog";

// Per-chat ephemeral state for free-text input flows (admin only).
// Cleared on /cancel, /start, /adm, or after the input is consumed.

export type AdminState =
  | { kind: "await_price"; game: GameId; period: PeriodId }
  | { kind: "await_keys"; game: GameId; period: PeriodId }
  | { kind: "await_crypto" }
  | { kind: "await_upi" }
  | { kind: "await_binance" }
  | { kind: "await_cbtoken" }
  | { kind: "await_cbassets" }
  | { kind: "await_admin_username" };

const states = new Map<number, AdminState>();

export function setState(chatId: number, state: AdminState): void {
  states.set(chatId, state);
}

export function getState(chatId: number): AdminState | undefined {
  return states.get(chatId);
}

export function clearState(chatId: number): void {
  states.delete(chatId);
}
