import { ITEMS, type ItemId } from "./data/items";
import { getSpecies, type SpeciesDef } from "./data/species";
import { STAT_KEYS, zeroStats, type Stats } from "./data/stats";
import { randomInt, type Rng } from "./rng";

export const MAX_LEVEL = 100;
export const MAX_IV = 31;
export const SHINY_ODDS = 1 / 512;
/** Each refine step adds this much to the species' base stat. */
export const REFINE_BASE_BONUS = 2;

export type Potency = 1 | 2 | 3 | 4 | 5;

/** Potency is rolled once when a bug is created and multiplies all its stats. */
export const POTENCY_TABLE: readonly { potency: Potency; chance: number; bonus: number }[] = [
  { potency: 1, chance: 0.74495, bonus: 0 },
  { potency: 2, chance: 0.2, bonus: 0.05 },
  { potency: 3, chance: 0.05, bonus: 0.1 },
  { potency: 4, chance: 0.005, bonus: 0.25 },
  { potency: 5, chance: 0.00005, bonus: 1 },
];

/** A concrete bug owned by the player or met in battle. */
export interface BugInstance {
  uid: string;
  speciesId: string;
  level: number;
  /** XP accumulated inside the current level. */
  xp: number;
  /** Individual values, 0..31 per stat, rolled on creation. */
  ivs: Stats;
  /** Permanent boosts from vitamins. */
  boosts: Stats;
  /** Refine steps per stat, paid with type stones (speed cannot be refined). */
  refine: Stats;
  potency: Potency;
  currentHp: number;
  shiny: boolean;
  /** Route id where it was caught, "starter" or "egg". */
  origin: string;
  /** Epoch ms when it joined the player, if it is the player's. */
  caughtAt?: number;
  caughtBy?: string;
  /** Held item (one per bug), or null. */
  held: ItemId | null;
}

export interface CreateBugOptions {
  uid: string;
  speciesId: string;
  level: number;
  rng: Rng;
  origin: string;
  shiny?: boolean;
  ivs?: Stats;
  potency?: Potency;
}

export function rollIvs(rng: Rng, min = 0): Stats {
  return { hp: randomInt(rng, min, MAX_IV), atk: randomInt(rng, min, MAX_IV), def: randomInt(rng, min, MAX_IV), spd: randomInt(rng, min, MAX_IV) };
}

export function rollPotency(rng: Rng): Potency {
  let roll = rng();
  for (const row of POTENCY_TABLE) {
    roll -= row.chance;
    if (roll < 0) return row.potency;
  }
  return 1;
}

export function potencyBonus(potency: Potency): number {
  return POTENCY_TABLE.find((row) => row.potency === potency)?.bonus ?? 0;
}

export function createBug(options: CreateBugOptions): BugInstance {
  const { rng } = options;
  const ivs = options.ivs ?? rollIvs(rng);
  const shiny = options.shiny ?? rng() < SHINY_ODDS;
  const potency = options.potency ?? rollPotency(rng);
  const bug: BugInstance = {
    uid: options.uid,
    speciesId: options.speciesId,
    level: clampLevel(options.level),
    xp: 0,
    ivs,
    boosts: zeroStats(),
    refine: zeroStats(),
    potency,
    currentHp: 0,
    shiny,
    origin: options.origin,
    held: null,
  };
  bug.currentHp = computeStats(bug).hp;
  return bug;
}

export function clampLevel(level: number): number {
  return Math.max(1, Math.min(MAX_LEVEL, Math.floor(level)));
}

/**
 * Pokemon-style stat formula. Refining raises the base stat, potency multiplies
 * the result and vitamins add a flat bonus at the end.
 */
export function computeStatsFor(species: SpeciesDef, level: number, ivs: Stats, boosts: Stats, refine: Stats = zeroStats(), potency: Potency = 1): Stats {
  const result = zeroStats();
  const multiplier = 1 + potencyBonus(potency);
  for (const key of STAT_KEYS) {
    const base = species.baseStats[key] + refine[key] * REFINE_BASE_BONUS;
    const scaled = Math.floor(((2 * base + ivs[key]) * level) / 100);
    const raw = key === "hp" ? scaled + level + 10 : scaled + 5;
    result[key] = Math.floor(raw * multiplier) + boosts[key];
  }
  return result;
}

export function computeStats(bug: BugInstance): Stats {
  const stats = computeStatsFor(getSpecies(bug.speciesId), bug.level, bug.ivs, bug.boosts, bug.refine, bug.potency);
  const item = bug.held ? ITEMS[bug.held] : undefined;
  if (item?.category === "held" && item.effect.stat && item.effect.statMult) {
    stats[item.effect.stat] = Math.floor(stats[item.effect.stat] * item.effect.statMult);
  }
  return stats;
}

export function maxHp(bug: BugInstance): number {
  return computeStats(bug).hp;
}

export function isFainted(bug: BugInstance): boolean {
  return bug.currentHp <= 0;
}

export function healFully(bug: BugInstance): void {
  bug.currentHp = maxHp(bug);
}

export function ivTotal(bug: BugInstance): number {
  return STAT_KEYS.reduce((sum, key) => sum + bug.ivs[key], 0);
}

/** Overall strength number shown in the UI, like a "power" rating. */
export function powerRating(bug: BugInstance): number {
  const stats = computeStats(bug);
  return STAT_KEYS.reduce((sum, key) => sum + stats[key], 0);
}

/** IV quality grade from 0 (worst) to 4 (perfect-ish). */
export function ivGrade(bug: BugInstance): 0 | 1 | 2 | 3 | 4 {
  const ratio = ivTotal(bug) / (MAX_IV * STAT_KEYS.length);
  if (ratio >= 0.9) return 4;
  if (ratio >= 0.7) return 3;
  if (ratio >= 0.5) return 2;
  if (ratio >= 0.3) return 1;
  return 0;
}

/**
 * Score from 0 to 10 for how lucky the roll was: IVs give up to 6 points,
 * potency up to 4 (P1 = 0, P5 = 4). Independent of level.
 */
export function bugScore(bug: Pick<BugInstance, "ivs" | "potency">): number {
  const ivs = STAT_KEYS.reduce((sum, key) => sum + bug.ivs[key], 0);
  return (ivs / (MAX_IV * STAT_KEYS.length)) * 6 + (bug.potency - 1);
}

export type ScoreTier = "weak" | "fair" | "good" | "great" | "excellent" | "perfect";

export function scoreTier(score: number): ScoreTier {
  if (score >= 9.5) return "perfect";
  if (score >= 8) return "excellent";
  if (score >= 6) return "great";
  if (score >= 4) return "good";
  if (score >= 2) return "fair";
  return "weak";
}
