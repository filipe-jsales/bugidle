import type { TrainerLook } from "./trainerLook";
import { computeStats, MAX_LEVEL, type BugInstance } from "./bug";
import { getSpecies } from "./data/species";

/** XP needed to go from `level` to `level + 1` (medium-fast curve, per level). */
export function xpToNextLevel(level: number): number {
  return Math.floor(Math.pow(level + 1, 3) * 0.8) - Math.floor(Math.pow(level, 3) * 0.8);
}

/** XP gathered since level 1. */
export function totalXp(level: number, xpInLevel: number): number {
  let total = xpInLevel;
  for (let l = 1; l < level; l++) total += xpToNextLevel(l);
  return total;
}

/** Larger means slower leveling. Tuned with `npm run simulate`. */
export const XP_DIVISOR = 115;

/** Below this enemy level a win is worth at least a slice of a level, so the first minutes are not a grind. */
export const EARLY_LEVELS = 12;
/** Share of a level a level-1 win is worth; it fades to zero at EARLY_LEVELS. */
export const EARLY_SHARE = 0.15;

/** Minimum XP for beating a bug of `level`: generous at level 1-3, gone by level 12. */
export function earlyXpFloor(level: number): number {
  if (level >= EARLY_LEVELS) return 0;
  const fade = (EARLY_LEVELS - level) / (EARLY_LEVELS - 1);
  return Math.floor(xpToNextLevel(level) * EARLY_SHARE * fade);
}

/** XP a defeated bug gives. Boss bugs give 50% more. */
export function xpReward(speciesId: string, level: number, isBoss: boolean): number {
  const base = Math.max(Math.floor((getSpecies(speciesId).xpYield * level) / XP_DIVISOR), earlyXpFloor(level));
  return Math.max(1, isBoss ? Math.floor(base * 1.5) : base);
}

export interface XpResult {
  levelsGained: number;
  /** XP actually applied (zero when blocked by the level cap). */
  applied: number;
}

/**
 * Adds XP and levels the bug up. Bugs at or above `levelCap` gain nothing:
 * badges raise the cap. HP grows with max HP so leveling never hurts.
 */
export function gainXp(bug: BugInstance, amount: number, levelCap: number): XpResult {
  const cap = Math.min(levelCap, MAX_LEVEL);
  if (bug.level >= cap || amount <= 0) return { levelsGained: 0, applied: 0 };
  let remaining = amount;
  let levelsGained = 0;
  let applied = 0;
  while (remaining > 0 && bug.level < cap) {
    const needed = xpToNextLevel(bug.level) - bug.xp;
    if (remaining >= needed) {
      const before = computeStats(bug).hp;
      remaining -= needed;
      applied += needed;
      bug.level += 1;
      bug.xp = 0;
      levelsGained += 1;
      bug.currentHp += computeStats(bug).hp - before;
    } else {
      bug.xp += remaining;
      applied += remaining;
      remaining = 0;
    }
  }
  return { levelsGained, applied };
}

// ---- Trainer (the player) ----

export function trainerXpToNext(level: number): number {
  return Math.floor(60 * Math.pow(level, 1.5));
}

export interface Trainer {
  name: string;
  level: number;
  xp: number;
  /** Headwear and colors chosen in the trainer card. */
  look: TrainerLook;
  /** Bug shown on the trainer card; null = the highest level bug. */
  favoriteUid: string | null;
}

/** Returns how many trainer levels were gained. */
export function gainTrainerXp(trainer: Trainer, amount: number): number {
  trainer.xp += amount;
  let gained = 0;
  while (trainer.xp >= trainerXpToNext(trainer.level)) {
    trainer.xp -= trainerXpToNext(trainer.level);
    trainer.level += 1;
    gained += 1;
  }
  return gained;
}
