export type GameId =
  | "bgmi"
  | "pubg_global"
  | "pubg_taiwan"
  | "pubg_korean"
  | "codm_global"
  | "codm_garena"
  | "codm_vietnam"
  | "ml_global"
  | "ml_usa"
  | "ml_vietnam"
  | "8bp"
  | "android_root"
  | "android_nonroot";

export type PeriodId = "day" | "week" | "month";

export type PaymentMethod = "crypto" | "remitly" | "cryptobot";

export type GameGroup = "bgmi" | "pubg" | "codm" | "ml" | "8bp" | "android";

export const GAMES: { id: GameId; group: GameGroup; label: string }[] = [
  // BGMI is intentionally first — it's the most popular SKU.
  { id: "bgmi", group: "bgmi", label: "BGMI" },
  { id: "pubg_global", group: "pubg", label: "PUBG Mobile — Global" },
  { id: "pubg_taiwan", group: "pubg", label: "PUBG Mobile — Taiwan" },
  { id: "pubg_korean", group: "pubg", label: "PUBG Mobile — Korean" },
  { id: "codm_global", group: "codm", label: "Call of Duty — Global" },
  { id: "codm_garena", group: "codm", label: "Call of Duty — Garena" },
  { id: "codm_vietnam", group: "codm", label: "Call of Duty — Vietnam" },
  { id: "ml_global", group: "ml", label: "Mobile Legends — Global" },
  { id: "ml_usa", group: "ml", label: "Mobile Legends — USA" },
  { id: "ml_vietnam", group: "ml", label: "Mobile Legends — Vietnam" },
  { id: "8bp", group: "8bp", label: "8 Ball Pool" },
  { id: "android_root", group: "android", label: "Android — Root" },
  { id: "android_nonroot", group: "android", label: "Android — Non-root" },
];

export const PUBG_VARIANTS: { id: GameId; shortLabel: string }[] = [
  { id: "pubg_global", shortLabel: "Global" },
  { id: "pubg_taiwan", shortLabel: "Taiwan" },
  { id: "pubg_korean", shortLabel: "Korean" },
];

export const CODM_VARIANTS: { id: GameId; shortLabel: string }[] = [
  { id: "codm_global", shortLabel: "Global" },
  { id: "codm_garena", shortLabel: "Garena" },
  { id: "codm_vietnam", shortLabel: "Vietnam" },
];

export const MLBB_VARIANTS: { id: GameId; shortLabel: string }[] = [
  { id: "ml_global", shortLabel: "Global" },
  { id: "ml_usa", shortLabel: "USA" },
  { id: "ml_vietnam", shortLabel: "Vietnam" },
];

export const ANDROID_VARIANTS: { id: GameId; shortLabel: string }[] = [
  { id: "android_root", shortLabel: "Root" },
  { id: "android_nonroot", shortLabel: "Non-root" },
];

export const PERIODS: PeriodId[] = ["day", "week", "month"];

export function getGameLabel(id: GameId): string {
  return GAMES.find((g) => g.id === id)?.label ?? id;
}

export function getGameGroup(id: GameId): GameGroup | undefined {
  return GAMES.find((g) => g.id === id)?.group;
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
