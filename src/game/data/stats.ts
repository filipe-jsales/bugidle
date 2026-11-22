export const STAT_KEYS = ["hp", "atk", "def", "spd"] as const;
export type StatKey = (typeof STAT_KEYS)[number];
export type Stats = Record<StatKey, number>;

export function zeroStats(): Stats {
  return { hp: 0, atk: 0, def: 0, spd: 0 };
}
