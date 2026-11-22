import { computeStats, maxHp } from "./bug";
import { isCaught } from "./bugdex";
import { canEvolveByLevel, canEvolveWithItem, evolve } from "./evolution";
import { addItem, buyItem, consumeItem, itemCount, useItemOnBug } from "./inventory";
import { firstBug, stateWith } from "./testUtils";

describe("shop (RF09)", () => {
  it("buys items with coins", () => {
    const state = stateWith(["typobit", 5]);
    state.coins = 100;
    expect(buyItem(state, "breakpoint", 3).ok).toBe(true);
    expect(state.coins).toBe(40);
    expect(itemCount(state, "breakpoint")).toBe(13);
  });

  it("refuses when coins are short or the quantity is invalid", () => {
    const state = stateWith(["typobit", 5]);
    state.coins = 10;
    expect(buyItem(state, "breakpoint", 1)).toEqual({ ok: false, reason: "notEnoughCoins" });
    expect(buyItem(state, "breakpoint", 0)).toEqual({ ok: false, reason: "invalidQuantity" });
    expect(buyItem(state, "breakpoint", 1.5)).toEqual({ ok: false, reason: "invalidQuantity" });
    expect(state.coins).toBe(10);
  });

  it("consumes only what exists", () => {
    const state = stateWith(["typobit", 5]);
    state.inventory = {};
    expect(consumeItem(state, "coffee")).toBe(false);
    addItem(state, "coffee", 2);
    expect(consumeItem(state, "coffee", 2)).toBe(true);
    expect(itemCount(state, "coffee")).toBe(0);
  });
});

describe("using items", () => {
  it("potions heal but not past max, and not fainted bugs", () => {
    const state = stateWith(["leaklet", 20]);
    const bug = firstBug(state);
    expect(useItemOnBug(state, "coffee", bug.uid)).toEqual({ ok: false, reason: "hpFull" });
    bug.currentHp = 5;
    expect(useItemOnBug(state, "coffee", bug.uid).ok).toBe(true);
    expect(bug.currentHp).toBe(35);
    addItem(state, "rebootDisk");
    useItemOnBug(state, "rebootDisk", bug.uid);
    expect(bug.currentHp).toBe(maxHp(bug));
    bug.currentHp = 0;
    expect(useItemOnBug(state, "coffee", bug.uid)).toEqual({ ok: false, reason: "fainted" });
  });

  it("vitamins raise a stat up to the limit", () => {
    const state = stateWith(["leaklet", 20]);
    const bug = firstBug(state);
    const atk = computeStats(bug).atk;
    addItem(state, "codeReview", 20);
    expect(useItemOnBug(state, "codeReview", bug.uid).ok).toBe(true);
    expect(computeStats(bug).atk).toBe(atk + 2);
    for (let i = 0; i < 9; i++) useItemOnBug(state, "codeReview", bug.uid);
    expect(useItemOnBug(state, "codeReview", bug.uid)).toEqual({ ok: false, reason: "vitaminMaxed" });
    expect(bug.boosts.atk).toBe(20);
  });

  it("traps cannot be used on bugs", () => {
    const state = stateWith(["leaklet", 20]);
    expect(useItemOnBug(state, "breakpoint", firstBug(state).uid)).toEqual({ ok: false, reason: "wrongItem" });
  });

  it("requires the item", () => {
    const state = stateWith(["leaklet", 20]);
    expect(useItemOnBug(state, "mutex", firstBug(state).uid)).toEqual({ ok: false, reason: "noItem" });
  });
});

describe("evolution (RF07)", () => {
  it("evolves by level", () => {
    const state = stateWith(["leaklet", 21]);
    const bug = firstBug(state);
    expect(canEvolveByLevel(bug)).toBe(false);
    bug.level = 22;
    expect(canEvolveByLevel(bug)).toBe(true);
    expect(evolve(state, bug)).toBe("leaklet");
    expect(bug.speciesId).toBe("leakroach");
    expect(isCaught(state, "leakroach")).toBe(true);
  });

  it("evolves with the right item only", () => {
    const state = stateWith(["racemite", 10]);
    const bug = firstBug(state);
    addItem(state, "cdnToken");
    addItem(state, "mutex");
    expect(canEvolveWithItem(bug, "cdnToken")).toBe(false);
    expect(useItemOnBug(state, "cdnToken", bug.uid)).toEqual({ ok: false, reason: "cannotEvolve" });
    expect(useItemOnBug(state, "mutex", bug.uid).ok).toBe(true);
    expect(bug.speciesId).toBe("deadlocust");
    expect(itemCount(state, "mutex")).toBe(0);
    expect(itemCount(state, "cdnToken")).toBe(1);
  });

  it("keeps damage taken across evolution", () => {
    const state = stateWith(["nullit", 18]);
    const bug = firstBug(state);
    bug.currentHp -= 10;
    evolve(state, bug);
    expect(maxHp(bug) - bug.currentHp).toBe(10);
  });

  it("throws for final forms", () => {
    const state = stateWith(["zeroday", 50]);
    expect(() => evolve(state, firstBug(state))).toThrow();
  });
});
