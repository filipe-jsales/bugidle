import { moveToTeam, releaseBug, swapWithBox } from "./collection";
import { tick } from "./engine";
import {
  assignToHouse,
  bugCoinRate,
  buildHouse,
  collectAll,
  collectHouse,
  getHouse,
  highestEra,
  HOUSE_LOTS,
  HOUSE_TIERS,
  houseCoinRate,
  houseOf,
  isLotUnlocked,
  nextCost,
  removeFromHouse,
  storageCap,
  tickHousing,
  upgradeHouse,
} from "./housing";
import { createSeededRng } from "./rng";
import { exportSave, importSave } from "./save";
import type { GameState } from "./state";
import { stateWith } from "./testUtils";

const MINUTE = 60_000;

/** Team of one plus two boxed bugs, house 0 built, plenty of coins. */
function setup(): { state: GameState; boxed: string[] } {
  const state = stateWith(["leaklet", 10], ["nullit", 20], ["typobit", 30]);
  state.team = [state.team[0]!];
  state.coins = 10_000_000;
  expect(buildHouse(state, 0).ok).toBe(true);
  return { state, boxed: Object.keys(state.bugs).filter((uid) => !state.team.includes(uid)) };
}

describe("house eras", () => {
  it("get more expensive, bigger and more productive at every step", () => {
    for (let i = 1; i < HOUSE_TIERS.length; i++) {
      const prev = HOUSE_TIERS[i - 1]!;
      const tier = HOUSE_TIERS[i]!;
      expect(tier.cost).toBeGreaterThan(prev.cost * 2);
      expect(tier.multiplier).toBeGreaterThan(prev.multiplier);
      expect(tier.slots).toBeGreaterThanOrEqual(prev.slots);
      expect(tier.storageHours).toBeGreaterThanOrEqual(prev.storageHours);
    }
  });

  it("follow Moore's law: every era doubles production", () => {
    for (let i = 1; i < HOUSE_TIERS.length; i++) expect(HOUSE_TIERS[i]!.multiplier).toBe(HOUSE_TIERS[i - 1]!.multiplier * 2);
  });

  it("the museum shows the highest era reached", () => {
    const state = stateWith(["leaklet", 10]);
    expect(highestEra(state)).toBe(-1);
    state.coins = 10_000_000;
    buildHouse(state, 0);
    upgradeHouse(state, 0);
    expect(highestEra(state)).toBe(1);
  });

  it("later lots cost more", () => {
    for (let i = 1; i < HOUSE_LOTS.length; i++) expect(HOUSE_LOTS[i]!.costFactor).toBeGreaterThan(HOUSE_LOTS[i - 1]!.costFactor);
  });
});

describe("building and upgrading", () => {
  it("builds the first house for its price", () => {
    const state = stateWith(["leaklet", 10]);
    state.coins = HOUSE_TIERS[0]!.cost;
    expect(buildHouse(state, 0).ok).toBe(true);
    expect(state.coins).toBe(0);
    expect(buildHouse(state, 0)).toEqual({ ok: false, reason: "houseExists" });
  });

  it("refuses without coins or before the lot's badge", () => {
    const state = stateWith(["leaklet", 10]);
    state.coins = 10;
    expect(buildHouse(state, 0)).toEqual({ ok: false, reason: "notEnoughCoins" });
    state.coins = 1_000_000;
    expect(isLotUnlocked(state, 1)).toBe(false);
    expect(buildHouse(state, 1)).toEqual({ ok: false, reason: "lotLocked" });
    state.badges.push("badge-staging");
    expect(buildHouse(state, 1).ok).toBe(true);
    expect(state.coins).toBe(1_000_000 - HOUSE_TIERS[0]!.cost * 3);
  });

  it("upgrades through every era, each one costing more, then stops", () => {
    const { state } = setup();
    let lastCost = 0;
    for (let i = 1; i < HOUSE_TIERS.length; i++) {
      const cost = nextCost(state, 0)!;
      expect(cost).toBeGreaterThan(lastCost);
      lastCost = cost;
      const before = state.coins;
      expect(upgradeHouse(state, 0).ok).toBe(true);
      expect(state.coins).toBe(before - cost);
    }
    expect(getHouse(state, 0)!.tier).toBe(HOUSE_TIERS.length - 1);
    expect(nextCost(state, 0)).toBeNull();
    expect(upgradeHouse(state, 0)).toEqual({ ok: false, reason: "maxTier" });
  });
});

describe("residents", () => {
  it("only accepts boxed bugs, up to the era's slots", () => {
    const { state, boxed } = setup();
    expect(assignToHouse(state, 0, state.team[0]!)).toEqual({ ok: false, reason: "alreadyInTeam" });
    expect(assignToHouse(state, 0, boxed[0]!).ok).toBe(true);
    expect(assignToHouse(state, 0, boxed[0]!)).toEqual({ ok: false, reason: "housed" });
    expect(assignToHouse(state, 0, boxed[1]!)).toEqual({ ok: false, reason: "houseFull" });
    upgradeHouse(state, 0);
    expect(assignToHouse(state, 0, boxed[1]!).ok).toBe(true);
  });

  it("housed bugs cannot join the team until removed", () => {
    const { state, boxed } = setup();
    assignToHouse(state, 0, boxed[0]!);
    expect(moveToTeam(state, boxed[0]!)).toEqual({ ok: false, reason: "housed" });
    expect(swapWithBox(state, state.team[0]!, boxed[0]!)).toEqual({ ok: false, reason: "housed" });
    expect(removeFromHouse(state, boxed[0]!).ok).toBe(true);
    expect(removeFromHouse(state, boxed[0]!)).toEqual({ ok: false, reason: "notInHouse" });
    expect(moveToTeam(state, boxed[0]!).ok).toBe(true);
  });

  it("releasing a bug frees its slot", () => {
    const { state, boxed } = setup();
    assignToHouse(state, 0, boxed[0]!);
    releaseBug(state, boxed[0]!);
    expect(getHouse(state, 0)!.bugs).toEqual([]);
    expect(houseOf(state, boxed[0]!)).toBeUndefined();
  });
});

describe("production", () => {
  it("higher level and higher era produce more", () => {
    const { state, boxed } = setup();
    const low = state.bugs[boxed[0]!]!;
    const high = state.bugs[boxed[1]!]!;
    expect(bugCoinRate(high, HOUSE_TIERS[0]!)).toBeGreaterThan(bugCoinRate(low, HOUSE_TIERS[0]!));
    expect(bugCoinRate(low, HOUSE_TIERS[3]!)).toBeGreaterThan(bugCoinRate(low, HOUSE_TIERS[0]!));
  });

  it("an empty house produces nothing", () => {
    const { state } = setup();
    tickHousing(state, 10 * MINUTE);
    expect(getHouse(state, 0)!.pending).toBe(0);
  });

  it("produces coins over time and they are collected into the wallet", () => {
    const { state, boxed } = setup();
    assignToHouse(state, 0, boxed[0]!);
    const house = getHouse(state, 0)!;
    const rate = houseCoinRate(state, house);
    tickHousing(state, 10 * MINUTE);
    expect(house.pending).toBeCloseTo(rate * 10, 5);
    const coins = state.coins;
    const collected = collectHouse(state, 0);
    expect(collected).toBe(Math.floor(rate * 10));
    expect(state.coins).toBe(coins + collected);
    expect(house.pending).toBeLessThan(1);
    expect(collectAll(state)).toBe(0);
  });

  it("stops at the storage cap", () => {
    const { state, boxed } = setup();
    assignToHouse(state, 0, boxed[0]!);
    const house = getHouse(state, 0)!;
    tickHousing(state, 10 * 60 * MINUTE);
    expect(house.pending).toBeCloseTo(storageCap(state, house), 5);
  });

  it("gives residents XP, respecting the level cap", () => {
    const { state, boxed } = setup();
    const bug = state.bugs[boxed[0]!]!;
    bug.level = 5;
    bug.xp = 0;
    assignToHouse(state, 0, bug.uid);
    const level = bug.level;
    tickHousing(state, 60 * MINUTE);
    expect(bug.level).toBeGreaterThan(level);
    expect(bug.level).toBeLessThanOrEqual(20);
  });

  it("runs as part of the game loop", () => {
    const { state, boxed } = setup();
    assignToHouse(state, 0, boxed[0]!);
    tick(state, 5 * MINUTE, createSeededRng(1));
    expect(getHouse(state, 0)!.pending).toBeGreaterThan(0);
  });
});

describe("saving houses", () => {
  it("round-trips", () => {
    const { state, boxed } = setup();
    assignToHouse(state, 0, boxed[0]!);
    tickHousing(state, 5 * MINUTE);
    expect(importSave(exportSave(state)).houses).toEqual(state.houses);
  });

  it("drops invalid residents and lots", () => {
    const { state } = setup();
    const file = JSON.parse(exportSave(state));
    file.state.houses = [
      { lot: 0, tier: 0, bugs: [state.team[0], "ghost"], pending: 5, xpCarry: 0 },
      { lot: 99, tier: 0, bugs: [] },
    ];
    const loaded = importSave(JSON.stringify(file));
    expect(loaded.houses).toEqual([{ lot: 0, tier: 0, bugs: [], pending: 5, xpCarry: 0 }]);
  });
});
