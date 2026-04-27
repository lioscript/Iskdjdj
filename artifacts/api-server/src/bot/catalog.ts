export type GameId =
  | "bgmi"
  | "pubg_global"
  | "pubg_taiwan"
  | "pubg_korean"
  | "codm"
  | "ml"
  | "8bp";

export type PeriodId = "day" | "week" | "month";

export type PaymentMethod = "crypto" | "remitly" | "cryptobot";

export const GAMES: { id: GameId; group: "pubg" | "other"; label: string }[] = [
  { id: "bgmi", group: "other", label: "BGMI" },
  { id: "pubg_global", group: "pubg", label: "PUBG Mobile — Global" },
  { id: "pubg_taiwan", group: "pubg", label: "PUBG Mobile — Taiwan" },
  { id: "pubg_korean", group: "pubg", label: "PUBG Mobile — Korean" },
  { id: "codm", group: "other", label: "Call of Duty GL" },
  { id: "ml", group: "other", label: "Mobile Legends" },
  { id: "8bp", group: "other", label: "8 Ball Pool" },
];

export const PUBG_VARIANTS: { id: GameId; shortLabel: string }[] = [
  { id: "pubg_global", shortLabel: "Global" },
  { id: "pubg_taiwan", shortLabel: "Taiwan" },
  { id: "pubg_korean", shortLabel: "Korean" },
];

export const PERIODS: PeriodId[] = ["day", "week", "month"];

export function getGameLabel(id: GameId): string {
  return GAMES.find((g) => g.id === id)?.label ?? id;
}

export function isGameId(s: string): s is GameId {
  return GAMES.some((g) => g.id === s);
}

export function isPeriodId(s: string): s is PeriodId {
  return PERIODS.includes(s as PeriodId);
}

// Duration in milliseconds for a given period — used when computing
// when a delivered key expires so we can send reminders to the user.
export const PERIOD_DURATION_MS: Record<PeriodId, number> = {
  day: 24 * 60 * 60 * 1000,
  week: 7 * 24 * 60 * 60 * 1000,
  month: 30 * 24 * 60 * 60 * 1000,
};
