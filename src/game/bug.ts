import { getSpecies, type SpeciesDef } from "./data/species";
import { STAT_KEYS, zeroStats, type Stats } from "./data/stats";
import { randomInt, type Rng } from "./rng";

export const MAX_LEVEL = 100;
export const MAX_IV = 31;
export const SHINY_ODDS = 1 / 512;

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
  currentHp: number;
  shiny: boolean;
  /** Route id where it was caught, or "starter". */
  origin: string;
}

export interface CreateBugOptions {
  uid: string;
  speciesId: string;
  level: number;
  rng: Rng;
  origin: string;
  shiny?: boolean;
  ivs?: Stats;
}

export function rollIvs(rng: Rng): Stats {
  return { hp: randomInt(rng, 0, MAX_IV), atk: randomInt(rng, 0, MAX_IV), def: randomInt(rng, 0, MAX_IV), spd: randomInt(rng, 0, MAX_IV) };
}

export function createBug(options: CreateBugOptions): BugInstance {
  const { rng } = options;
  const ivs = options.ivs ?? rollIvs(rng);
  const shiny = options.shiny ?? rng() < SHINY_ODDS;
  const bug: BugInstance = {
    uid: options.uid,
    speciesId: options.speciesId,
    level: clampLevel(options.level),
    xp: 0,
    ivs,
    boosts: zeroStats(),
    currentHp: 0,
    shiny,
    origin: options.origin,
  };
  bug.currentHp = computeStats(bug).hp;
  return bug;
}

export function clampLevel(level: number): number {
  return Math.max(1, Math.min(MAX_LEVEL, Math.floor(level)));
}

/** Pokemon-style stat formula without natures/EVs; vitamins add a flat bonus. */
export function computeStatsFor(species: SpeciesDef, level: number, ivs: Stats, boosts: Stats): Stats {
  const result = zeroStats();
  for (const key of STAT_KEYS) {
    const scaled = Math.floor(((2 * species.baseStats[key] + ivs[key]) * level) / 100);
    result[key] = (key === "hp" ? scaled + level + 10 : scaled + 5) + boosts[key];
  }
  return result;
}

export function computeStats(bug: BugInstance): Stats {
  return computeStatsFor(getSpecies(bug.speciesId), bug.level, bug.ivs, bug.boosts);
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
