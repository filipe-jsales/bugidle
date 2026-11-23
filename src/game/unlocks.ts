/**
 * Features open one by one as the player progresses, so a new player is not
 * met by every button and switch at once. Pure: the UI only reads `isUnlocked`
 * and `newFeatures`.
 */
import { itemCount } from "./inventory";
import type { PersistentState } from "./state";

export type FeatureId =
  // windows in the top bar
  | "minigames"
  | "houses"
  | "bosses"
  | "hatchery"
  | "guild"
  // automation switches
  | "alwaysShiny"
  | "throwUntilCaught"
  | "autoEvolve"
  | "debugChallenges"
  | "autoRevive"
  | "returnToHunt"
  | "trainWeakest"
  | "rules";

interface FeatureDef {
  id: FeatureId;
  /** Top-bar windows get a "NOVO" tag until opened; switches only show up. */
  kind: "window" | "automation";
  open: (state: PersistentState) => boolean;
}

const defeats = (s: PersistentState) => s.totals.defeats;
const captures = (s: PersistentState) => s.totals.captures;

/** In the order a typical player meets them. */
export const FEATURES: readonly FeatureDef[] = [
  { id: "minigames", kind: "window", open: (s) => defeats(s) >= 10 },
  { id: "alwaysShiny", kind: "automation", open: (s) => captures(s) >= 1 },
  { id: "debugChallenges", kind: "automation", open: (s) => defeats(s) >= 15 },
  { id: "trainWeakest", kind: "automation", open: (s) => s.team.length >= 2 },
  { id: "autoEvolve", kind: "automation", open: (s) => defeats(s) >= 25 },
  { id: "throwUntilCaught", kind: "automation", open: (s) => captures(s) >= 3 },
  { id: "bosses", kind: "window", open: (s) => defeats(s) >= 40 || s.unlockedRoutes.length >= 2 },
  { id: "houses", kind: "window", open: (s) => Object.keys(s.bugs).length > s.team.length || captures(s) >= 6 },
  { id: "autoRevive", kind: "automation", open: (s) => defeats(s) >= 50 },
  { id: "returnToHunt", kind: "automation", open: (s) => defeats(s) >= 60 },
  { id: "hatchery", kind: "window", open: (s) => defeats(s) >= 80 || s.dailyDay !== null || itemCount(s, "mysteryEgg") > 0 },
  { id: "guild", kind: "window", open: (s) => s.badges.length >= 1 || defeats(s) >= 300 },
  { id: "rules", kind: "automation", open: (s) => s.badges.length >= 1 },
];

export function isUnlocked(state: PersistentState, id: FeatureId): boolean {
  return FEATURES.find((f) => f.id === id)!.open(state);
}

export function unlockedFeatures(state: PersistentState): FeatureId[] {
  return FEATURES.filter((f) => f.open(state)).map((f) => f.id);
}

/** Windows that are open but the player has not visited yet (the "NOVO" tag). */
export function newFeatures(state: PersistentState): FeatureId[] {
  return FEATURES.filter((f) => f.kind === "window" && f.open(state) && !state.seenFeatures.includes(f.id)).map((f) => f.id);
}

export function markSeen(state: PersistentState, id: FeatureId): void {
  if (!state.seenFeatures.includes(id)) state.seenFeatures.push(id);
}

export function isFeatureId(id: unknown): id is FeatureId {
  return typeof id === "string" && FEATURES.some((f) => f.id === id);
}
