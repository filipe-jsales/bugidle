/**
 * Achievements: long-term goals read from the state, each paying coins once.
 * Progress is computed from what the save already holds plus a few totals,
 * so old saves unlock what they already earned on the first check.
 */
import { SPECIES } from "./data/species";
import { BOSSES } from "./data/world";
import { HOUSE_LOTS, HOUSE_TIERS } from "./housing";
import type { PersistentState } from "./state";

export type AchievementGroup = "collection" | "battle" | "growth" | "world";

export interface AchievementDef {
  readonly id: string;
  readonly group: AchievementGroup;
  readonly goal: number;
  readonly reward: number;
  readonly value: (state: PersistentState) => number;
}

const species = (s: PersistentState) => Object.values(s.bugdex).filter((e) => e.caught > 0).length;
const housesBuilt = (s: PersistentState) => s.houses.length;
const bestHouseTier = (s: PersistentState) => s.houses.reduce((max, h) => Math.max(max, h.tier + 1), 0);
const holding = (s: PersistentState) => Object.values(s.bugs).filter((b) => b.held).length;
const raidClears = (s: PersistentState) => Object.values(s.guild.clears ?? {}).reduce((n, c) => n + (c > 0 ? 1 : 0), 0);

// prettier-ignore
export const ACHIEVEMENTS: readonly AchievementDef[] = [
  { id: "dex5", group: "collection", goal: 5, reward: 500, value: species },
  { id: "dex15", group: "collection", goal: 15, reward: 2_500, value: species },
  { id: "dex30", group: "collection", goal: 30, reward: 10_000, value: species },
  { id: "dexAll", group: "collection", goal: SPECIES.length, reward: 50_000, value: species },
  { id: "catch50", group: "collection", goal: 50, reward: 1_000, value: (s) => s.totals.captures },
  { id: "catch500", group: "collection", goal: 500, reward: 10_000, value: (s) => s.totals.captures },
  { id: "shiny1", group: "collection", goal: 1, reward: 3_000, value: (s) => s.totals.shinies },
  { id: "shiny5", group: "collection", goal: 5, reward: 20_000, value: (s) => s.totals.shinies },
  { id: "defeat100", group: "battle", goal: 100, reward: 500, value: (s) => s.totals.defeats },
  { id: "defeat1000", group: "battle", goal: 1_000, reward: 5_000, value: (s) => s.totals.defeats },
  { id: "defeat10000", group: "battle", goal: 10_000, reward: 40_000, value: (s) => s.totals.defeats },
  { id: "boss1", group: "battle", goal: 1, reward: 1_000, value: (s) => s.badges.length },
  { id: "bossAll", group: "battle", goal: BOSSES.length, reward: 60_000, value: (s) => s.badges.length },
  { id: "evolve1", group: "growth", goal: 1, reward: 500, value: (s) => s.totals.evolutions },
  { id: "evolve10", group: "growth", goal: 10, reward: 6_000, value: (s) => s.totals.evolutions },
  { id: "refine1", group: "growth", goal: 1, reward: 500, value: (s) => s.totals.refines },
  { id: "refine50", group: "growth", goal: 50, reward: 12_000, value: (s) => s.totals.refines },
  { id: "hatch1", group: "growth", goal: 1, reward: 1_000, value: (s) => s.totals.hatched },
  { id: "hatch20", group: "growth", goal: 20, reward: 15_000, value: (s) => s.totals.hatched },
  { id: "held1", group: "growth", goal: 1, reward: 1_000, value: holding },
  { id: "held6", group: "growth", goal: 6, reward: 8_000, value: holding },
  { id: "trainer10", group: "growth", goal: 10, reward: 2_000, value: (s) => s.trainer.level },
  { id: "trainer30", group: "growth", goal: 30, reward: 20_000, value: (s) => s.trainer.level },
  { id: "house1", group: "world", goal: 1, reward: 500, value: housesBuilt },
  { id: "houseAll", group: "world", goal: HOUSE_LOTS.length, reward: 25_000, value: housesBuilt },
  { id: "houseMax", group: "world", goal: HOUSE_TIERS.length, reward: 60_000, value: bestHouseTier },
  { id: "raid1", group: "world", goal: 1, reward: 1_000, value: raidClears },
  { id: "study10", group: "world", goal: 10, reward: 3_000, value: (s) => Object.keys(s.knowledge).length },
];

export function getAchievement(id: string): AchievementDef | undefined {
  return ACHIEVEMENTS.find((a) => a.id === id);
}

export function isUnlocked(state: PersistentState, id: string): boolean {
  return state.achievements[id] !== undefined;
}

export function achievementProgress(state: PersistentState, def: AchievementDef): { value: number; ratio: number } {
  const value = Math.min(def.goal, def.value(state));
  return { value, ratio: value / def.goal };
}

/** Unlocks every achievement whose goal is met, pays its coins once, returns the new ids. */
export function checkAchievements(state: PersistentState): string[] {
  const unlocked: string[] = [];
  for (const def of ACHIEVEMENTS) {
    if (isUnlocked(state, def.id) || def.value(state) < def.goal) continue;
    state.achievements[def.id] = state.totals.playTimeMs;
    state.coins += def.reward;
    unlocked.push(def.id);
  }
  return unlocked;
}
