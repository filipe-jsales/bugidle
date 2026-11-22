/**
 * Hatchery: mystery eggs incubate for a while and hatch into a surprise bug from
 * the regions the player has opened. Hatched bugs have good IVs, a better shot
 * at high potency and a higher shiny chance. Time is counted in play time.
 */
import { createBug, rollIvs, rollPotency, type BugInstance } from "./bug";
import { registerCaught } from "./bugdex";
import { addBug } from "./collection";
import { getSpecies, type Rarity } from "./data/species";
import { ROUTES } from "./data/world";
import { consumeItem, itemCount } from "./inventory";
import { fail, OK, type ActionResult } from "./result";
import { pickWeighted, type Rng } from "./rng";
import { nextUid, type PersistentState } from "./state";

export const HATCHERY_SLOTS = 2;
export const EGG_HATCH_MS = 20 * 60 * 1000;
export const EGG_LEVEL = 5;
export const EGG_MIN_IV = 10;
export const EGG_SHINY_ODDS = 1 / 128;

const RARITY_WEIGHT: Readonly<Record<Rarity, number>> = { common: 6, uncommon: 3, rare: 1, legendary: 0 };

/** Free slot index, or -1. */
function freeSlot(state: PersistentState): number {
  for (let i = 0; i < HATCHERY_SLOTS; i++) if (state.hatchery[i] === null || state.hatchery[i] === undefined) return i;
  return -1;
}

export function incubateEgg(state: PersistentState): ActionResult {
  if (itemCount(state, "mysteryEgg") <= 0) return fail("noItem");
  const slot = freeSlot(state);
  if (slot < 0) return fail("hatcheryFull");
  consumeItem(state, "mysteryEgg");
  state.hatchery[slot] = state.totals.playTimeMs;
  return OK;
}

/** 0..1 progress of the egg in a slot, or null when empty. */
export function eggProgress(state: PersistentState, slot: number): number | null {
  const started = state.hatchery[slot];
  if (started === null || started === undefined) return null;
  return Math.min(1, (state.totals.playTimeMs - started) / EGG_HATCH_MS);
}

/** Species an egg can hatch into: what lives on the routes the player opened. */
export function eggPool(state: PersistentState): { speciesId: string; weight: number }[] {
  const ids = new Set(ROUTES.filter((r) => state.unlockedRoutes.includes(r.id)).flatMap((r) => r.encounters.map((e) => e.speciesId)));
  return [...ids].map((speciesId) => ({ speciesId, weight: RARITY_WEIGHT[getSpecies(speciesId).rarity] })).filter((e) => e.weight > 0);
}

export function hatchEgg(state: PersistentState, rng: Rng): BugInstance {
  const pool = eggPool(state);
  const { speciesId } = pickWeighted(rng, pool.length > 0 ? pool : [{ speciesId: "typobit", weight: 1 }]);
  const potency = Math.max(rollPotency(rng), rollPotency(rng)) as BugInstance["potency"];
  const bug = createBug({
    uid: nextUid(state),
    speciesId,
    level: EGG_LEVEL,
    rng,
    origin: "egg",
    ivs: rollIvs(rng, EGG_MIN_IV),
    shiny: rng() < EGG_SHINY_ODDS,
    potency,
  });
  bug.caughtAt = Date.now();
  bug.caughtBy = state.trainer.name;
  registerCaught(state, speciesId, bug.shiny);
  addBug(state, bug);
  state.totals.captures += 1;
  return bug;
}

/** Hatches every egg that is ready. Returns the new bugs. */
export function tickHatchery(state: PersistentState, rng: Rng): BugInstance[] {
  const hatched: BugInstance[] = [];
  for (let i = 0; i < HATCHERY_SLOTS; i++) {
    if (eggProgress(state, i) === 1) {
      state.hatchery[i] = null;
      hatched.push(hatchEgg(state, rng));
    }
  }
  return hatched;
}
