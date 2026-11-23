import { createBattle } from "./battle";
import { maxHp } from "./bug";
import { getRoute } from "./data/world";
import { returnToHunt, selectRoute, spawnWild, tick, visitRebootCenter, type GameEvent } from "./engine";
import { useItemOnBug } from "./inventory";
import { createSeededRng } from "./rng";
import { firstBug, stateWith } from "./testUtils";

describe("throw until caught", () => {
  it("keeps throwing past the 3-trap limit when enabled", () => {
    const state = stateWith(["heapocalypse", 20]);
    state.settings.captureMode = "all";
    state.settings.throwUntilCaught = true;
    state.inventory = { breakpoint: 100 };
    state.runtime.battle = createBattle("wild", [spawnWild(getRoute("dev-console"), createSeededRng(9))]);
    state.runtime.battle.enemies[0]!.currentHp = 1_000_000;
    const events = tick(state, 20_000, () => 0.99);
    expect(events.filter((e) => e.type === "captureAttempt").length).toBeGreaterThan(3);
  });
});

describe("auto revive", () => {
  function losingFight(autoRevive: boolean, revives: number) {
    const state = stateWith(["typobit", 2]);
    state.settings.captureMode = "off";
    state.settings.alwaysCaptureShiny = false;
    state.settings.autoPotion = false;
    state.settings.autoRevive = autoRevive;
    state.inventory = { revive: revives };
    state.activity = { kind: "route", routeId: "zero-day-abyss" };
    const events: GameEvent[] = [];
    const rng = createSeededRng(4);
    for (let t = 0; t < 30_000; t += 500) events.push(...tick(state, 500, rng));
    return { state, events };
  }

  it("uses a Revive when the active bug falls, delaying the wipe", () => {
    const { state, events } = losingFight(true, 2);
    expect(events.filter((e) => e.type === "revived")).toHaveLength(2);
    expect(state.inventory.revive ?? 0).toBe(0);
    const firstRevive = events.findIndex((e) => e.type === "revived");
    const firstWipe = events.findIndex((e) => e.type === "teamWiped");
    expect(firstRevive).toBeLessThan(firstWipe);
  });

  it("does nothing when disabled", () => {
    const { state, events } = losingFight(false, 2);
    expect(events.some((e) => e.type === "revived")).toBe(false);
    expect(state.inventory.revive).toBe(2);
  });

  it("can be used by hand from the bag, only on fallen bugs", () => {
    const state = stateWith(["leaklet", 10]);
    const bug = firstBug(state);
    expect(useItemOnBug(state, "revive", bug.uid)).toEqual({ ok: false, reason: "notFainted" });
    bug.currentHp = 0;
    expect(useItemOnBug(state, "revive", bug.uid).ok).toBe(true);
    expect(bug.currentHp).toBe(Math.floor(maxHp(bug) / 2));
  });
});

describe("return to the hunt", () => {
  it("goes straight back to hunting after a reboot when enabled", () => {
    const state = stateWith(["leaklet", 10]);
    state.settings.returnToHunt = true;
    visitRebootCenter(state);
    const events = tick(state, 10_000, createSeededRng(1));
    expect(state.runtime.atCenter).toBe(false);
    expect(events.some((e) => e.type === "encounter")).toBe(true);
  });

  it("waits at the Reboot Center when disabled, until sent back", () => {
    const state = stateWith(["leaklet", 10]);
    state.settings.returnToHunt = false;
    visitRebootCenter(state);
    const idle = tick(state, 20_000, createSeededRng(1));
    expect(idle.some((e) => e.type === "recovered")).toBe(true);
    expect(idle.some((e) => e.type === "encounter")).toBe(false);
    expect(state.runtime.atCenter).toBe(true);
    returnToHunt(state);
    expect(tick(state, 10_000, createSeededRng(1)).some((e) => e.type === "encounter")).toBe(true);
  });

  it("also waits after a team wipe, and picking a route sends the team out", () => {
    const state = stateWith(["typobit", 2]);
    state.settings.returnToHunt = false;
    state.inventory = {};
    state.activity = { kind: "route", routeId: "zero-day-abyss" };
    state.unlockedRoutes.push("zero-day-abyss");
    tick(state, 30_000, createSeededRng(2));
    expect(state.runtime.atCenter).toBe(true);
    selectRoute(state, "port-3000");
    expect(state.runtime.atCenter).toBe(false);
  });
});
