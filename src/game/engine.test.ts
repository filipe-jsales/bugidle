import { createBattle } from "./battle";
import { createBug, maxHp } from "./bug";
import { isCaught } from "./bugdex";
import { getRoute } from "./data/world";
import {
  challengeBoss,
  chooseStarter,
  evolveBug,
  forfeitBoss,
  selectRoute,
  spawnWild,
  tick,
  visitRebootCenter,
  type GameEvent,
} from "./engine";
import { xpToNextLevel } from "./experience";
import { levelCap } from "./progression";
import { createSeededRng } from "./rng";
import { createInitialState, type GameState } from "./state";
import { firstBug, stateWith } from "./testUtils";

function run(state: GameState, ms: number, seed = 1): GameEvent[] {
  const rng = createSeededRng(seed);
  const events: GameEvent[] = [];
  for (let t = 0; t < ms; t += 1000) events.push(...tick(state, 1000, rng));
  return events;
}

describe("starter", () => {
  it("gives a level 5 starter and registers it", () => {
    const state = createInitialState();
    expect(chooseStarter(state, "typobit", createSeededRng(1)).ok).toBe(true);
    expect(state.team).toHaveLength(1);
    expect(firstBug(state).level).toBe(5);
    expect(isCaught(state, "typobit")).toBe(true);
  });

  it("rejects non-starters and a second pick", () => {
    const state = createInitialState();
    expect(chooseStarter(state, "zeroday", createSeededRng(1)).ok).toBe(false);
    chooseStarter(state, "leaklet", createSeededRng(1));
    expect(chooseStarter(state, "pixelmite", createSeededRng(1)).ok).toBe(false);
  });

  it("does nothing without a team", () => {
    const state = createInitialState();
    expect(tick(state, 5000, createSeededRng(1))).toEqual([]);
  });
});

describe("idle loop (core loop)", () => {
  it("fights automatically and collects coins and XP", () => {
    const state = stateWith(["leaklet", 10]);
    state.settings.captureMode = "off";
    state.settings.alwaysCaptureShiny = false;
    const coins = state.coins;
    const events = run(state, 60_000);
    expect(events.some((e) => e.type === "encounter")).toBe(true);
    expect(events.some((e) => e.type === "rewards")).toBe(true);
    expect(state.coins).toBeGreaterThan(coins);
    expect(state.totals.defeats).toBeGreaterThan(0);
    expect(state.bugdex["typobit"]?.seen ?? state.bugdex["nullit"]?.seen).toBeGreaterThan(0);
  });

  it("unlocks the next route after enough defeats", () => {
    const state = stateWith(["heapocalypse", 20]);
    state.settings.captureMode = "off";
    state.settings.alwaysCaptureShiny = false;
    const events = run(state, 120_000);
    expect(state.unlockedRoutes).toContain("node-modules");
    expect(events.some((e) => e.type === "routeUnlocked" && e.routeId === "node-modules")).toBe(true);
  });

  it("captures new species with traps", () => {
    const state = stateWith(["leaklet", 6]);
    state.settings.captureMode = "all";
    state.inventory.rootAccess = 3;
    state.settings.preferredTrap = "rootAccess";
    const events = run(state, 10_000);
    expect(events.some((e) => e.type === "captured")).toBe(true);
    expect(state.team.length).toBeGreaterThan(1);
    expect(state.totals.captures).toBeGreaterThan(0);
  });

  it("does not throw when capture is off", () => {
    const state = stateWith(["leaklet", 6]);
    state.settings.captureMode = "off";
    state.settings.alwaysCaptureShiny = false;
    const traps = state.inventory.breakpoint;
    run(state, 20_000);
    expect(state.inventory.breakpoint).toBe(traps);
  });

  it("reports running out of traps", () => {
    const state = stateWith(["leaklet", 6]);
    state.inventory = {};
    state.settings.captureMode = "all";
    const events = run(state, 5_000);
    expect(events.some((e) => e.type === "outOfTraps")).toBe(true);
  });

  it("reboots the team after a wipe", () => {
    const state = stateWith(["typobit", 2]);
    state.inventory = {};
    state.activity = { kind: "route", routeId: "zero-day-abyss" };
    const events = run(state, 20_000);
    expect(events.some((e) => e.type === "teamWiped")).toBe(true);
    expect(events.some((e) => e.type === "recovered")).toBe(true);
  });

  it("auto-uses potions below the threshold", () => {
    const state = stateWith(["leaklet", 10]);
    const bug = firstBug(state);
    bug.currentHp = 1;
    state.runtime.battle = createBattle("wild", [spawnWild(getRoute("port-3000"), createSeededRng(3))]);
    const events = tick(state, 100, createSeededRng(1));
    expect(events.some((e) => e.type === "potionUsed")).toBe(true);
    expect(bug.currentHp).toBeGreaterThan(1);
    expect(state.inventory.coffee).toBe(4);
  });

  it("auto-evolves on level up when enabled", () => {
    const state = stateWith(["pixelmite", 14]);
    firstBug(state).xp = xpToNextLevel(14) - 1;
    state.stones.ui = 3;
    state.settings.captureMode = "off";
    state.settings.alwaysCaptureShiny = false;
    state.activity = { kind: "route", routeId: "port-3000" };
    const events = run(state, 60_000);
    expect(events.some((e) => e.type === "evolved")).toBe(true);
    expect(firstBug(state).speciesId).toBe("overflowasp");
    expect(isCaught(state, "overflowasp")).toBe(true);
  });

  it("splits long ticks into small steps", () => {
    const state = stateWith(["heapocalypse", 20]);
    state.settings.captureMode = "off";
    const events = tick(state, 30_000, createSeededRng(5));
    expect(events.filter((e) => e.type === "encounter").length).toBeGreaterThan(3);
  });
});

describe("route selection", () => {
  it("only allows unlocked routes", () => {
    const state = stateWith(["leaklet", 5]);
    expect(selectRoute(state, "mainframe").ok).toBe(false);
    state.unlockedRoutes.push("node-modules");
    expect(selectRoute(state, "node-modules").ok).toBe(true);
    expect(state.activity).toEqual({ kind: "route", routeId: "node-modules" });
  });

  it("spawns wild bugs inside the route level range", () => {
    const route = getRoute("dev-console");
    const rng = createSeededRng(4);
    for (let i = 0; i < 50; i++) {
      const bug = spawnWild(route, rng);
      expect(bug.level).toBeGreaterThanOrEqual(route.minLevel);
      expect(bug.level).toBeLessThanOrEqual(route.maxLevel);
      expect(route.encounters.map((e) => e.speciesId)).toContain(bug.speciesId);
    }
  });
});

describe("bosses (RF04)", () => {
  const unlockLocalhost = (state: GameState) => state.unlockedRoutes.push("node-modules", "dev-console");

  it("cannot be challenged before the region routes are open", () => {
    const state = stateWith(["leaklet", 5]);
    expect(challengeBoss(state, "boss-localhost").ok).toBe(false);
  });

  it("awards a badge, coins, a new region and a higher cap", () => {
    const state = stateWith(["heapocalypse", 60]);
    unlockLocalhost(state);
    expect(levelCap(state)).toBe(20);
    expect(challengeBoss(state, "boss-localhost").ok).toBe(true);
    const coins = state.coins;
    const events = run(state, 60_000);
    expect(events.some((e) => e.type === "badge")).toBe(true);
    expect(state.badges).toContain("badge-localhost");
    expect(state.unlockedRoutes).toContain("ci-pipeline");
    expect(levelCap(state)).toBe(35);
    expect(state.coins).toBeGreaterThan(coins);
    expect(state.activity.kind).toBe("route");
  });

  it("fails on timeout and returns to the route", () => {
    const state = stateWith(["timeoutick", 5]);
    unlockLocalhost(state);
    const bug = firstBug(state);
    challengeBoss(state, "boss-localhost");
    // make the player unkillable but harmless against the boss team
    const events: GameEvent[] = [];
    const rng = createSeededRng(1);
    for (let t = 0; t < 100_000; t += 1000) {
      bug.currentHp = maxHp(bug);
      events.push(...tick(state, 1000, rng));
      if (events.some((e) => e.type === "bossFailed")) break;
    }
    expect(events.some((e) => e.type === "bossFailed")).toBe(true);
    expect(state.badges).toHaveLength(0);
    expect(state.activity).toEqual({ kind: "route", routeId: "port-3000" });
  });

  it("can be forfeited, and blocks route changes while active", () => {
    const state = stateWith(["leaklet", 5]);
    unlockLocalhost(state);
    challengeBoss(state, "boss-localhost");
    expect(selectRoute(state, "node-modules").ok).toBe(false);
    expect(visitRebootCenter(state).ok).toBe(false);
    expect(forfeitBoss(state).ok).toBe(true);
    expect(state.activity.kind).toBe("route");
  });
});

describe("reboot center and manual evolution", () => {
  it("heals the whole team after the reboot delay", () => {
    const state = stateWith(["leaklet", 5]);
    const bug = firstBug(state);
    bug.currentHp = 1;
    visitRebootCenter(state);
    const events = tick(state, 3000, createSeededRng(1));
    expect(events.some((e) => e.type === "recovered")).toBe(true);
    expect(bug.currentHp).toBe(maxHp(bug));
  });

  it("evolves on command once the level is reached", () => {
    const state = stateWith(["nullit", 17]);
    const bug = firstBug(state);
    state.stones.logic = 3;
    expect(evolveBug(state, bug.uid).ok).toBe(false);
    bug.level = 18;
    expect(evolveBug(state, bug.uid).ok).toBe(true);
    expect(bug.speciesId).toBe("nullpointer");
  });

  it("keeps wild uids distinct from player uids", () => {
    const wild = createBug({ uid: "wild-1", speciesId: "typobit", level: 2, rng: createSeededRng(1), origin: "x" });
    expect(wild.uid.startsWith("wild-")).toBe(true);
  });
});

describe("capture limits and reward split", () => {
  it("throws at most 3 traps per encounter", () => {
    const state = stateWith(["heapocalypse", 20]);
    state.settings.captureMode = "all";
    state.settings.preferredTrap = "breakpoint";
    state.inventory = { breakpoint: 100 };
    state.runtime.battle = createBattle("wild", [spawnWild(getRoute("dev-console"), createSeededRng(9))]);
    // a tough wild bug that cannot faint, so the fight keeps going
    state.runtime.battle.enemies[0]!.currentHp = 1_000_000;
    const events = tick(state, 20_000, () => 0.99);
    expect(events.filter((e) => e.type === "captureAttempt").length).toBe(3);
    expect(state.inventory.breakpoint).toBe(97);
  });

  it("the fighting bug gets more XP than the bench, and the trainer gets XP too", () => {
    const state = stateWith(["heapocalypse", 15], ["leaklet", 10]);
    state.settings.captureMode = "off";
    state.settings.alwaysCaptureShiny = false;
    const events = run(state, 20_000);
    const reward = events.find((e) => e.type === "rewards");
    expect(reward && reward.type === "rewards" && reward.xp > reward.benchXp).toBe(true);
    expect(reward && reward.type === "rewards" && reward.trainerXp).toBeGreaterThan(0);
    expect(reward && reward.type === "rewards" && reward.victorUid).toBe(state.team[0]);
  });
});
