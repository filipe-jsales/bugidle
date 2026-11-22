/**
 * Type stones. Every defeated bug may drop stones of its own type(s). Stones pay
 * for level evolutions and for refining (raising a species' base stats on one
 * bug). A dual-type bug can spend stones of both of its types.
 */
import { computeStats, type BugInstance } from "./bug";
import { getSpecies, type SpeciesDef } from "./data/species";
import type { StatKey } from "./data/stats";
import { canEvolveByLevel } from "./evolution";
import { fail, OK, type ActionResult } from "./result";
import { chance, type Rng } from "./rng";
import type { PersistentState } from "./state";
import type { BugType } from "./types";

export type StoneWallet = Partial<Record<BugType, number>>;

export const STONE_DROP_CHANCE = 0.3;
export const BOSS_STONES_PER_TYPE = 3;
export const MAX_REFINE = 10;
/** Speed cannot be refined. */
export const REFINABLE_STATS: readonly StatKey[] = ["hp", "atk", "def"];
/** Having +N in a stat costs REFINE_COST_UNIT * N^3 stones in total. */
export const REFINE_COST_UNIT = 3;

export function stoneCount(state: PersistentState, type: BugType): number {
  return state.stones[type] ?? 0;
}

/** Stones a bug can use: the sum over its types. */
export function usableStones(state: PersistentState, bug: BugInstance): number {
  return getSpecies(bug.speciesId).types.reduce((sum, type) => sum + stoneCount(state, type), 0);
}

/** Spends from the primary type first. Returns false (and spends nothing) when short. */
export function spendStones(state: PersistentState, bug: BugInstance, amount: number): boolean {
  if (usableStones(state, bug) < amount) return false;
  let left = amount;
  for (const type of getSpecies(bug.speciesId).types) {
    const take = Math.min(left, stoneCount(state, type));
    state.stones[type] = stoneCount(state, type) - take;
    left -= take;
  }
  return true;
}

export function addStones(state: PersistentState, type: BugType, count: number): void {
  state.stones[type] = stoneCount(state, type) + count;
}

/** Stones needed for a level evolution (item evolutions need none). */
export function evolutionStoneCost(species: SpeciesDef): number {
  if (!species.evolution?.level) return 0;
  return species.stage === 1 ? 3 : 8;
}

/** Level reached and enough stones to pay for it. */
export function canEvolveNow(state: PersistentState, bug: BugInstance): boolean {
  return canEvolveByLevel(bug) && usableStones(state, bug) >= evolutionStoneCost(getSpecies(bug.speciesId));
}

/** Cost of the next refine step when the stat already has `current` steps. */
export function refineCost(current: number): number {
  return REFINE_COST_UNIT * (Math.pow(current + 1, 3) - Math.pow(current, 3));
}

export function refineStat(state: PersistentState, uid: string, stat: StatKey): ActionResult {
  const bug = state.bugs[uid];
  if (!bug) return fail("unknownBug");
  if (!REFINABLE_STATS.includes(stat)) return fail("statFixed");
  const current = bug.refine[stat];
  if (current >= MAX_REFINE) return fail("refineMaxed");
  if (!spendStones(state, bug, refineCost(current))) return fail("notEnoughStones");
  const hpBefore = computeStats(bug).hp;
  bug.refine[stat] = current + 1;
  state.totals.refines += 1;
  if (stat === "hp") bug.currentHp += computeStats(bug).hp - hpBefore;
  return OK;
}

export interface StoneDrop {
  type: BugType;
  count: number;
}

/** Rolls the stones a defeated bug leaves. Bosses always give several. */
export function rollStoneDrops(speciesId: string, isBoss: boolean, rng: Rng): StoneDrop[] {
  const drops: StoneDrop[] = [];
  for (const type of getSpecies(speciesId).types) {
    if (isBoss) drops.push({ type, count: BOSS_STONES_PER_TYPE });
    else if (chance(rng, STONE_DROP_CHANCE)) drops.push({ type, count: 1 });
  }
  return drops;
}
