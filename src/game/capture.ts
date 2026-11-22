import { maxHp, type BugInstance } from "./bug";
import { isCaught } from "./bugdex";
import { ITEMS, itemsOfCategory, type ItemId, type TrapItem } from "./data/items";
import { getSpecies } from "./data/species";
import type { PersistentState, Settings } from "./state";

export const GUARANTEED_CAPTURE = 255;
/** Global capture difficulty: scales every non-guaranteed chance. Lower = harder. */
export const CAPTURE_DIFFICULTY = 0.3;
/** Traps thrown at most per encounter. */
export const MAX_THROWS_PER_ENCOUNTER = 3;

/** RF05: should a trap be thrown at this wild bug, given the player's filter? */
export function shouldAttemptCapture(settings: Settings, bug: BugInstance, state: PersistentState): boolean {
  if (bug.shiny && settings.alwaysCaptureShiny) return true;
  switch (settings.captureMode) {
    case "off":
      return false;
    case "all":
      return true;
    case "uncaught":
      return !isCaught(state, bug.speciesId);
    case "shiny":
      return bug.shiny;
  }
}

/**
 * Probability of a capture. Lower HP and better traps help:
 * ((3 * max - 2 * current) * catchRate * trap) / (3 * max * 255), scaled by CAPTURE_DIFFICULTY
 */
export function captureChance(bug: BugInstance, captureMultiplier: number): number {
  if (captureMultiplier >= GUARANTEED_CAPTURE) return 1;
  const max = maxHp(bug);
  const current = Math.max(1, bug.currentHp);
  const rate = getSpecies(bug.speciesId).catchRate;
  const value = (((3 * max - 2 * current) * rate * captureMultiplier) / (3 * max * 255)) * CAPTURE_DIFFICULTY;
  return Math.min(1, Math.max(0, value));
}

/** Preferred trap if in stock, otherwise the cheapest trap available (never wastes Root Access). */
export function pickTrap(inventory: PersistentState["inventory"], preferred: ItemId): TrapItem | null {
  const preferredItem = ITEMS[preferred];
  if (preferredItem.category === "trap" && (inventory[preferred] ?? 0) > 0) return preferredItem;
  const fallback = itemsOfCategory("trap")
    .filter((t) => t.captureMultiplier < GUARANTEED_CAPTURE && (inventory[t.id] ?? 0) > 0)
    .sort((a, b) => a.price - b.price);
  return fallback[0] ?? null;
}
