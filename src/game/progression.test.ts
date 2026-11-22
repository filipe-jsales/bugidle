import { dexProgress, isCaught, isSeen, registerCaught, registerDefeated, registerSeen } from "./bugdex";
import { DEFEATS_TO_UNLOCK } from "./data/world";
import { awardBadge, canChallengeBoss, isRegionUnlocked, levelCap, refreshRouteUnlocks, unlockProgress } from "./progression";
import { createInitialState } from "./state";

describe("route unlocks (RF03)", () => {
  it("starts with only the first route", () => {
    const state = createInitialState();
    expect(state.unlockedRoutes).toEqual(["port-3000"]);
    expect(refreshRouteUnlocks(state)).toEqual([]);
  });

  it("unlocks routes by defeat count", () => {
    const state = createInitialState();
    state.routeDefeats["port-3000"] = DEFEATS_TO_UNLOCK - 1;
    expect(refreshRouteUnlocks(state)).toEqual([]);
    expect(unlockProgress(state, "node-modules")).toEqual({ current: DEFEATS_TO_UNLOCK - 1, required: DEFEATS_TO_UNLOCK });
    state.routeDefeats["port-3000"] = DEFEATS_TO_UNLOCK;
    expect(refreshRouteUnlocks(state)).toEqual(["node-modules"]);
  });

  it("unlocks a new region's first route with the badge", () => {
    const state = createInitialState();
    expect(isRegionUnlocked(state, "staging")).toBe(false);
    expect(awardBadge(state, "badge-localhost")).toContain("ci-pipeline");
    expect(isRegionUnlocked(state, "staging")).toBe(true);
  });
});

describe("bosses and level cap", () => {
  it("needs all region routes before the boss", () => {
    const state = createInitialState();
    expect(canChallengeBoss(state, "boss-localhost")).toBe(false);
    state.unlockedRoutes.push("node-modules", "dev-console");
    expect(canChallengeBoss(state, "boss-localhost")).toBe(true);
    expect(canChallengeBoss(state, "boss-staging")).toBe(false);
  });

  it("raises the level cap with badges", () => {
    const state = createInitialState();
    expect(levelCap(state)).toBe(20);
    awardBadge(state, "badge-localhost");
    expect(levelCap(state)).toBe(35);
    awardBadge(state, "badge-staging");
    expect(levelCap(state)).toBe(50);
    awardBadge(state, "badge-staging");
    expect(state.badges).toHaveLength(2);
  });
});

describe("bugdex (RF08)", () => {
  it("tracks seen, defeated, caught and shiny", () => {
    const state = createInitialState();
    expect(isSeen(state, "nullit")).toBe(false);
    registerSeen(state, "nullit");
    registerDefeated(state, "nullit");
    expect(isSeen(state, "nullit")).toBe(true);
    expect(isCaught(state, "nullit")).toBe(false);
    expect(registerCaught(state, "nullit", false)).toBe(true);
    expect(registerCaught(state, "nullit", true)).toBe(false);
    expect(state.bugdex["nullit"]).toEqual({ seen: 1, defeated: 1, caught: 2, shinyCaught: true });
  });

  it("caught implies seen", () => {
    const state = createInitialState();
    registerCaught(state, "typobit", false);
    expect(isSeen(state, "typobit")).toBe(true);
  });

  it("summarizes progress", () => {
    const state = createInitialState();
    registerSeen(state, "nullit");
    registerCaught(state, "typobit", true);
    const progress = dexProgress(state);
    expect(progress).toMatchObject({ seen: 2, caught: 1, shiny: 1 });
    expect(progress.total).toBeGreaterThan(30);
  });
});
