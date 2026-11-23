import { dexByType } from "./bugdex";
import { BOSSES } from "./data/world";
import { featuredGame, finishGame, FEATURED_MULTIPLIER, GAME_IDS, GAME_COINS_PER_POINT } from "./minigames";
import { exportSave, importSave } from "./save";
import { createInitialState } from "./state";
import { stateWith } from "./testUtils";
import { FEATURES, isUnlocked, markSeen, newFeatures, unlockedFeatures } from "./unlocks";

describe("gradual unlocking", () => {
  it("a new game shows only the basics", () => {
    const state = stateWith(["typobit", 5]);
    expect(unlockedFeatures(state)).toEqual([]);
    expect(newFeatures(state)).toEqual([]);
  });

  it("opens features as the player defeats and catches bugs", () => {
    const state = stateWith(["typobit", 5]);
    state.totals.defeats = 10;
    expect(isUnlocked(state, "minigames")).toBe(true);
    expect(isUnlocked(state, "houses")).toBe(false);
    state.totals.captures = 1;
    expect(isUnlocked(state, "alwaysShiny")).toBe(true);
    state.totals.defeats = 80;
    expect(isUnlocked(state, "hatchery")).toBe(true);
    expect(isUnlocked(state, "guild")).toBe(false);
    state.badges.push(BOSSES[0]!.badgeId);
    expect(isUnlocked(state, "guild")).toBe(true);
    expect(isUnlocked(state, "rules")).toBe(true);
  });

  it("houses open once there is a bug outside the team", () => {
    const state = stateWith(["typobit", 5], ["nullit", 5]);
    expect(isUnlocked(state, "houses")).toBe(false);
    state.team = state.team.slice(0, 1);
    expect(isUnlocked(state, "houses")).toBe(true);
  });

  it("a window is NEW until the player opens it; switches never are", () => {
    const state = stateWith(["typobit", 5]);
    state.totals.defeats = 25;
    state.totals.captures = 3;
    expect(newFeatures(state)).toEqual(["minigames"]);
    markSeen(state, "minigames");
    markSeen(state, "minigames");
    expect(state.seenFeatures).toEqual(["minigames"]);
    expect(newFeatures(state)).toEqual([]);
  });

  it("every feature opens by the end of the game", () => {
    const state = stateWith(["typobit", 5], ["nullit", 5]);
    state.team = state.team.slice(0, 1);
    state.team.push(Object.keys(state.bugs).find((u) => !state.team.includes(u))!);
    state.bugs["extra"] = { ...state.bugs[state.team[0]!]!, uid: "extra" };
    state.totals.defeats = 10_000;
    state.totals.captures = 100;
    state.badges = BOSSES.map((b) => b.badgeId);
    expect(unlockedFeatures(state)).toHaveLength(FEATURES.length);
  });

  it("old saves count everything already open as seen; new saves keep the list", () => {
    const state = stateWith(["typobit", 5]);
    state.totals.defeats = 500;
    const file = JSON.parse(exportSave(state));
    delete file.state.seenFeatures;
    const old = importSave(JSON.stringify(file));
    expect(newFeatures(old)).toEqual([]);
    expect(old.seenFeatures).toContain("guild");

    const fresh = createInitialState();
    fresh.totals.defeats = 500;
    expect(newFeatures(importSave(exportSave(fresh))).length).toBeGreaterThan(0);
  });
});

describe("game of the day", () => {
  it("changes every day, never the detective, and covers every game", () => {
    const days = Array.from({ length: GAME_IDS.length - 1 }, (_, i) => featuredGame(20_000 + i));
    expect(new Set(days).size).toBe(GAME_IDS.length - 1);
    expect(days).not.toContain("detective");
    expect(featuredGame(5)).not.toBe(featuredGame(6));
  });

  it("pays double coins", () => {
    const today = 20_000;
    const game = featuredGame(today);
    const other = GAME_IDS.find((g) => g !== game && g !== "detective")!;
    const a = stateWith(["typobit", 5]);
    const r1 = finishGame(a, game, 50, today);
    const r2 = finishGame(a, other, 50, today);
    expect(r1.featured).toBe(true);
    expect(r2.featured).toBe(false);
    expect(r2.coins).toBe(50 * GAME_COINS_PER_POINT);
    expect(r1.coins).toBe(r2.coins * FEATURED_MULTIPLIER);
  });
});

describe("Bugdex by type", () => {
  it("counts caught species per type", () => {
    const state = stateWith(["typobit", 5]);
    state.bugdex["typobit"] = { seen: 1, defeated: 0, caught: 1, shinyCaught: false };
    const syntax = dexByType(state).find((r) => r.type === "syntax")!;
    expect(syntax.caught).toBe(1);
    expect(syntax.total).toBeGreaterThan(1);
    expect(dexByType(state).every((r) => r.caught <= r.total)).toBe(true);
  });
});
