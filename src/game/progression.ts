import { BASE_LEVEL_CAP, BOSSES, getBoss, getRegion, getRoute, ROUTES, routesOfRegion, type RouteDef } from "./data/world";
import type { PersistentState } from "./state";

/** RF04: badges raise the level cap bugs grow to (and obey up to). */
export function levelCap(state: PersistentState): number {
  return BOSSES.filter((b) => state.badges.includes(b.badgeId)).reduce((cap, b) => Math.max(cap, b.levelCap), BASE_LEVEL_CAP);
}

export function isRegionUnlocked(state: PersistentState, regionId: string): boolean {
  const badge = getRegion(regionId).requiredBadge;
  return badge === null || state.badges.includes(badge);
}

export function isRouteUnlocked(state: PersistentState, routeId: string): boolean {
  return state.unlockedRoutes.includes(routeId);
}

function meetsUnlock(state: PersistentState, route: RouteDef): boolean {
  switch (route.unlock.kind) {
    case "start":
      return true;
    case "defeats":
      return (state.routeDefeats[route.unlock.routeId] ?? 0) >= route.unlock.count;
    case "badge":
      return state.badges.includes(route.unlock.badgeId);
  }
}

/** RF03: unlocks every route whose requirement is now met. Returns the new route ids. */
export function refreshRouteUnlocks(state: PersistentState): string[] {
  const unlocked: string[] = [];
  for (const route of ROUTES) {
    if (!state.unlockedRoutes.includes(route.id) && meetsUnlock(state, route)) {
      state.unlockedRoutes.push(route.id);
      unlocked.push(route.id);
    }
  }
  return unlocked;
}

/** How close a locked route is to unlocking, for the map UI. */
export function unlockProgress(state: PersistentState, routeId: string): { current: number; required: number } | null {
  const route = getRoute(routeId);
  if (route.unlock.kind !== "defeats") return null;
  return { current: Math.min(route.unlock.count, state.routeDefeats[route.unlock.routeId] ?? 0), required: route.unlock.count };
}

/** A boss can be challenged once every route of its region is unlocked. */
export function canChallengeBoss(state: PersistentState, bossId: string): boolean {
  const boss = getBoss(bossId);
  if (!isRegionUnlocked(state, boss.regionId)) return false;
  return routesOfRegion(boss.regionId).every((r) => state.unlockedRoutes.includes(r.id));
}

export function hasBadge(state: PersistentState, badgeId: string): boolean {
  return state.badges.includes(badgeId);
}

/** Grants a badge and unlocks what it opens. Returns newly unlocked routes. */
export function awardBadge(state: PersistentState, badgeId: string): string[] {
  if (!state.badges.includes(badgeId)) state.badges.push(badgeId);
  return refreshRouteUnlocks(state);
}
