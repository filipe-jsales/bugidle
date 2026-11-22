import { computeStats } from "./bug";
import { releaseBug } from "./collection";
import { itemsOfCategory } from "./data/items";
import { equipItem, heldCoinMult, heldXpMult, unequipItem } from "./held";
import { addItem, itemCount } from "./inventory";
import { exportSave, importSave } from "./save";
import { firstBug, stateWith } from "./testUtils";

describe("held items", () => {
  it("exist in the shop with an effect each", () => {
    const held = itemsOfCategory("held");
    expect(held.length).toBeGreaterThanOrEqual(6);
    for (const item of held) expect(Object.keys(item.effect).length, item.id).toBeGreaterThan(0);
  });

  it("move from the bag to the bug and back, one per bug", () => {
    const state = stateWith(["leaklet", 20]);
    const bug = firstBug(state);
    expect(equipItem(state, bug.uid, "linter")).toEqual({ ok: false, reason: "noItem" });
    addItem(state, "linter");
    addItem(state, "ssd");
    expect(equipItem(state, bug.uid, "coffee")).toEqual({ ok: false, reason: "wrongItem" });
    expect(equipItem(state, bug.uid, "linter").ok).toBe(true);
    expect(itemCount(state, "linter")).toBe(0);
    expect(equipItem(state, bug.uid, "ssd").ok).toBe(true);
    expect(bug.held).toBe("ssd");
    expect(itemCount(state, "linter")).toBe(1);
    expect(unequipItem(state, bug.uid).ok).toBe(true);
    expect(bug.held).toBeNull();
    expect(unequipItem(state, bug.uid)).toEqual({ ok: false, reason: "noItem" });
  });

  it("stat items raise one stat by 10%, and HP items keep the missing HP", () => {
    const state = stateWith(["leaklet", 40]);
    const bug = firstBug(state);
    const before = computeStats(bug);
    addItem(state, "linter");
    equipItem(state, bug.uid, "linter");
    expect(computeStats(bug).atk).toBe(Math.floor(before.atk * 1.1));
    expect(computeStats(bug).def).toBe(before.def);
    bug.currentHp = before.hp - 10;
    addItem(state, "testSuite");
    equipItem(state, bug.uid, "testSuite");
    expect(computeStats(bug).hp - bug.currentHp).toBe(10);
    unequipItem(state, bug.uid);
    expect(bug.currentHp).toBe(before.hp - 10);
  });

  it("XP and coin items report their multipliers", () => {
    const state = stateWith(["leaklet", 10]);
    const bug = firstBug(state);
    expect(heldXpMult(bug)).toBe(1);
    addItem(state, "rubberDuck");
    equipItem(state, bug.uid, "rubberDuck");
    expect(heldXpMult(bug)).toBeGreaterThan(1);
    addItem(state, "cacheCard");
    equipItem(state, bug.uid, "cacheCard");
    expect(heldCoinMult(bug)).toBeGreaterThan(1);
    expect(heldXpMult(bug)).toBe(1);
  });

  it("releasing a bug gives its item back, and the save keeps held items", () => {
    const state = stateWith(["leaklet", 10], ["nullit", 10]);
    const bug = state.bugs[state.team[1]!]!;
    addItem(state, "antivirus");
    equipItem(state, bug.uid, "antivirus");
    const loaded = importSave(exportSave(state));
    expect(loaded.bugs[bug.uid]!.held).toBe("antivirus");
    releaseBug(state, bug.uid);
    expect(itemCount(state, "antivirus")).toBe(1);
  });
});
