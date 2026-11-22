import { SPECIES } from "./data/species";
import type { DexEntry, PersistentState } from "./state";

function entry(state: PersistentState, speciesId: string): DexEntry {
  const existing = state.bugdex[speciesId];
  if (existing) return existing;
  const created: DexEntry = { seen: 0, defeated: 0, caught: 0, shinyCaught: false };
  state.bugdex[speciesId] = created;
  return created;
}

export function registerSeen(state: PersistentState, speciesId: string): void {
  entry(state, speciesId).seen += 1;
}

export function registerDefeated(state: PersistentState, speciesId: string): void {
  entry(state, speciesId).defeated += 1;
}

/** Returns true when this is the first catch of the species. */
export function registerCaught(state: PersistentState, speciesId: string, shiny: boolean): boolean {
  const e = entry(state, speciesId);
  if (e.seen === 0) e.seen = 1;
  const isNew = e.caught === 0;
  e.caught += 1;
  if (shiny) e.shinyCaught = true;
  return isNew;
}

export function isCaught(state: PersistentState, speciesId: string): boolean {
  return (state.bugdex[speciesId]?.caught ?? 0) > 0;
}

export function isSeen(state: PersistentState, speciesId: string): boolean {
  return (state.bugdex[speciesId]?.seen ?? 0) > 0;
}

export interface DexProgress {
  seen: number;
  caught: number;
  shiny: number;
  total: number;
}

export function dexProgress(state: PersistentState): DexProgress {
  let seen = 0;
  let caught = 0;
  let shiny = 0;
  for (const species of SPECIES) {
    const e = state.bugdex[species.id];
    if (!e) continue;
    if (e.seen > 0) seen += 1;
    if (e.caught > 0) caught += 1;
    if (e.shinyCaught) shiny += 1;
  }
  return { seen, caught, shiny, total: SPECIES.length };
}
