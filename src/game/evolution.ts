import { computeStats, type BugInstance } from "./bug";
import { registerCaught } from "./bugdex";
import type { ItemId } from "./data/items";
import { getSpecies } from "./data/species";
import type { PersistentState } from "./state";

export function canEvolveByLevel(bug: BugInstance): boolean {
  const evo = getSpecies(bug.speciesId).evolution;
  return evo?.level !== undefined && bug.level >= evo.level;
}

export function canEvolveWithItem(bug: BugInstance, itemId: ItemId): boolean {
  return getSpecies(bug.speciesId).evolution?.item === itemId;
}

/**
 * Turns the bug into its evolution, keeping level, IVs and boosts.
 * HP keeps the same damage taken. Registers the new species in the Bugdex.
 * Returns the previous species id.
 */
export function evolve(state: PersistentState, bug: BugInstance): string {
  const evo = getSpecies(bug.speciesId).evolution;
  if (!evo) throw new Error(`${bug.speciesId} does not evolve`);
  const from = bug.speciesId;
  const missingHp = computeStats(bug).hp - bug.currentHp;
  bug.speciesId = evo.to;
  bug.currentHp = Math.max(bug.currentHp > 0 ? 1 : 0, computeStats(bug).hp - missingHp);
  registerCaught(state, evo.to, bug.shiny);
  return from;
}
