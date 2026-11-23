import { bugScore, computeStats, createBug, POTENCY_TABLE, potencyBonus, rollPotency, scoreTier } from "./bug";
import { evolveBug, reduceLevel, tick } from "./engine";
import { totalXp, xpToNextLevel } from "./experience";
import { EGG_HATCH_MS, EGG_MIN_IV, eggPool, eggProgress, HATCHERY_SLOTS, incubateEgg, tickHatchery } from "./hatchery";
import { createSeededRng } from "./rng";
import { exportSave, importSave } from "./save";
import {
  canEvolveNow,
  evolutionStoneCost,
  MAX_REFINE,
  refineCost,
  refineStat,
  rollStoneDrops,
  spendStones,
  usableStones,
} from "./stones";
import { getSpecies } from "./data/species";
import { firstBug, stateWith } from "./testUtils";

describe("potency", () => {
  it("chances add up to 100% and better potency is rarer and stronger", () => {
    expect(POTENCY_TABLE.reduce((s, r) => s + r.chance, 0)).toBeCloseTo(1, 9);
    for (let i = 1; i < POTENCY_TABLE.length; i++) {
      expect(POTENCY_TABLE[i]!.chance).toBeLessThan(POTENCY_TABLE[i - 1]!.chance);
      expect(POTENCY_TABLE[i]!.bonus).toBeGreaterThan(POTENCY_TABLE[i - 1]!.bonus);
    }
  });

  it("rolls mostly P1 and P2", () => {
    const rng = createSeededRng(5);
    const counts = [0, 0, 0, 0, 0, 0];
    for (let i = 0; i < 10_000; i++) counts[rollPotency(rng)]! += 1;
    expect(counts[1]).toBeGreaterThan(7000);
    expect(counts[2]).toBeGreaterThan(1500);
    expect(counts[3]).toBeLessThan(800);
  });

  it("multiplies every stat", () => {
    const make = (potency: 1 | 5) => createBug({ uid: "x", speciesId: "nullit", level: 50, rng: createSeededRng(1), origin: "t", ivs: { hp: 10, atk: 10, def: 10, spd: 10 }, shiny: false, potency });
    expect(computeStats(make(5)).atk).toBe(Math.floor((computeStats(make(1)).atk) * (1 + potencyBonus(5))));
  });

  it("scores luck from 0 to 10", () => {
    expect(bugScore({ ivs: { hp: 0, atk: 0, def: 0, spd: 0 }, potency: 1 })).toBe(0);
    expect(bugScore({ ivs: { hp: 31, atk: 31, def: 31, spd: 31 }, potency: 5 })).toBe(10);
    expect(scoreTier(3.1)).toBe("fair");
    expect(scoreTier(9.9)).toBe("perfect");
  });
});

describe("type stones", () => {
  it("drop sometimes from wild bugs and always from bosses", () => {
    expect(rollStoneDrops("nullit", false, () => 0.1)).toEqual([{ type: "logic", count: 1 }]);
    expect(rollStoneDrops("nullit", false, () => 0.9)).toEqual([]);
    expect(rollStoneDrops("corsbee", true, () => 0.9)).toEqual([
      { type: "network", count: 3 },
      { type: "security", count: 3 },
    ]);
  });

  it("dual-type bugs can spend stones of both types, primary first", () => {
    const state = stateWith(["corsbee", 10]);
    const bug = firstBug(state);
    state.stones = { network: 2, security: 5 };
    expect(usableStones(state, bug)).toBe(7);
    expect(spendStones(state, bug, 4)).toBe(true);
    expect(state.stones).toEqual({ security: 3 });
    expect(spendStones(state, bug, 4)).toBe(false);
    expect(state.stones.security).toBe(3);
  });

  it("level evolutions need stones (more for the second stage)", () => {
    expect(evolutionStoneCost(getSpecies("typobit"))).toBe(3);
    expect(evolutionStoneCost(getSpecies("typoworm"))).toBe(8);
    expect(evolutionStoneCost(getSpecies("racemite"))).toBe(0);
    const state = stateWith(["nullit", 18]);
    const bug = firstBug(state);
    expect(canEvolveNow(state, bug)).toBe(false);
    expect(evolveBug(state, bug.uid).ok).toBe(false);
    state.stones.logic = 3;
    expect(evolveBug(state, bug.uid).ok).toBe(true);
    expect(bug.speciesId).toBe("nullpointer");
    expect(state.stones.logic ?? 0).toBe(0);
  });

  it("refining costs a cubic total and raises the stat", () => {
    expect([0, 1, 2].map(refineCost)).toEqual([3, 21, 57]);
    const state = stateWith(["leaklet", 30]);
    const bug = firstBug(state);
    const atk = computeStats(bug).atk;
    state.stones.memory = 24;
    expect(refineStat(state, bug.uid, "atk").ok).toBe(true);
    expect(refineStat(state, bug.uid, "atk").ok).toBe(true);
    expect(state.stones.memory ?? 0).toBe(0);
    expect(bug.refine.atk).toBe(2);
    expect(computeStats(bug).atk).toBeGreaterThan(atk);
    expect(refineStat(state, bug.uid, "atk")).toEqual({ ok: false, reason: "notEnoughStones" });
    expect(refineStat(state, bug.uid, "spd")).toEqual({ ok: false, reason: "statFixed" });
    bug.refine.def = MAX_REFINE;
    expect(refineStat(state, bug.uid, "def")).toEqual({ ok: false, reason: "refineMaxed" });
  });

  it("are collected in the game loop", () => {
    const state = stateWith(["heapocalypse", 20]);
    state.settings.captureMode = "off";
    state.settings.alwaysCaptureShiny = false;
    const events = tick(state, 120_000, createSeededRng(3));
    expect(events.some((e) => e.type === "stoneDrop")).toBe(true);
    expect(Object.values(state.stones).reduce((a, b) => a + (b ?? 0), 0)).toBeGreaterThan(0);
  });
});

describe("hatchery", () => {
  it("incubates eggs up to the slot limit", () => {
    const state = stateWith(["leaklet", 10]);
    expect(incubateEgg(state)).toEqual({ ok: false, reason: "noItem" });
    state.inventory.mysteryEgg = 3;
    for (let i = 0; i < HATCHERY_SLOTS; i++) expect(incubateEgg(state).ok).toBe(true);
    expect(incubateEgg(state)).toEqual({ ok: false, reason: "hatcheryFull" });
    expect(state.inventory.mysteryEgg).toBe(1);
    expect(eggProgress(state, 0)).toBe(0);
  });

  it("hatches into a good bug from opened regions after the time passes", () => {
    const state = stateWith(["leaklet", 10]);
    state.inventory.mysteryEgg = 1;
    incubateEgg(state);
    state.totals.playTimeMs += EGG_HATCH_MS / 2;
    expect(tickHatchery(state, createSeededRng(1))).toHaveLength(0);
    expect(eggProgress(state, 0)).toBeCloseTo(0.5);
    state.totals.playTimeMs += EGG_HATCH_MS / 2;
    const [bug] = tickHatchery(state, createSeededRng(1));
    expect(bug).toBeDefined();
    expect(eggPool(state).map((e) => e.speciesId)).toContain(bug!.speciesId);
    for (const iv of Object.values(bug!.ivs)) expect(iv).toBeGreaterThanOrEqual(EGG_MIN_IV);
    expect(bug!.origin).toBe("egg");
    expect(state.bugs[bug!.uid]).toBe(bug);
    expect(state.hatchery[0]).toBeNull();
  });

  it("never hatches legendaries", () => {
    const state = stateWith(["leaklet", 10]);
    state.unlockedRoutes = ["y2k-bunker", "zero-day-abyss"];
    expect(eggPool(state).some((e) => getSpecies(e.speciesId).rarity === "legendary")).toBe(false);
  });

  it("hatches during the game loop", () => {
    const state = stateWith(["leaklet", 10]);
    state.inventory.mysteryEgg = 1;
    incubateEgg(state);
    const events = tick(state, EGG_HATCH_MS + 1000, createSeededRng(2));
    expect(events.some((e) => e.type === "hatched")).toBe(true);
  });
});

describe("bug details helpers", () => {
  it("adds up total XP since level 1", () => {
    expect(totalXp(1, 5)).toBe(5);
    expect(totalXp(3, 2)).toBe(xpToNextLevel(1) + xpToNextLevel(2) + 2);
  });

  it("reduces the level by one", () => {
    const state = stateWith(["leaklet", 10]);
    const bug = firstBug(state);
    bug.xp = 7;
    expect(reduceLevel(state, bug.uid).ok).toBe(true);
    expect(bug.level).toBe(9);
    expect(bug.xp).toBe(0);
    expect(bug.currentHp).toBeLessThanOrEqual(computeStats(bug).hp);
    bug.level = 1;
    expect(reduceLevel(state, bug.uid)).toEqual({ ok: false, reason: "minLevel" });
  });

  it("saves potency, refine, stones, eggs and catch info", () => {
    const state = stateWith(["leaklet", 10]);
    const bug = firstBug(state);
    bug.potency = 4;
    bug.refine.atk = 2;
    bug.caughtAt = 123;
    bug.caughtBy = "Ana";
    state.stones = { memory: 5 };
    state.hatchery = [1000, null];
    const loaded = importSave(exportSave(state));
    expect(loaded.bugs[bug.uid]).toMatchObject({ potency: 4, refine: { atk: 2 }, caughtAt: 123, caughtBy: "Ana" });
    expect(loaded.stones).toEqual({ memory: 5 });
    expect(loaded.hatchery).toEqual([1000, null]);
  });

  it("loads old bugs without the new fields", () => {
    const state = stateWith(["leaklet", 10]);
    const file = JSON.parse(exportSave(state));
    const raw = file.state.bugs[state.team[0]!];
    delete raw.potency;
    delete raw.refine;
    delete file.state.stones;
    delete file.state.hatchery;
    const loaded = importSave(JSON.stringify(file));
    expect(loaded.bugs[state.team[0]!]).toMatchObject({ potency: 1, refine: { hp: 0, atk: 0, def: 0, spd: 0 } });
    expect(loaded.stones).toEqual({});
    expect(loaded.hatchery).toEqual([null, null]);
  });
});
