import { maxHp } from "./bug";
import { registerCaught } from "./bugdex";
import { captureChance, pickTrap, shouldAttemptCapture } from "./capture";
import { createInitialState } from "./state";
import { firstBug, stateWith } from "./testUtils";

describe("capture filter (RF05)", () => {
  const setup = () => {
    const state = stateWith(["typobit", 5]);
    const bug = firstBug(state);
    return { state, bug };
  };

  it("off never throws (unless shiny is forced)", () => {
    const { state, bug } = setup();
    state.settings.captureMode = "off";
    expect(shouldAttemptCapture(state.settings, bug, state)).toBe(false);
    bug.shiny = true;
    expect(shouldAttemptCapture(state.settings, bug, state)).toBe(true);
    state.settings.alwaysCaptureShiny = false;
    expect(shouldAttemptCapture(state.settings, bug, state)).toBe(false);
  });

  it("all always throws", () => {
    const { state, bug } = setup();
    state.settings.captureMode = "all";
    expect(shouldAttemptCapture(state.settings, bug, state)).toBe(true);
  });

  it("uncaught throws only at species missing from the Bugdex", () => {
    const state = createInitialState();
    const { bug } = setup();
    state.settings.captureMode = "uncaught";
    expect(shouldAttemptCapture(state.settings, bug, state)).toBe(true);
    registerCaught(state, "typobit", false);
    expect(shouldAttemptCapture(state.settings, bug, state)).toBe(false);
  });

  it("shiny mode throws only at shinies", () => {
    const { state, bug } = setup();
    state.settings.captureMode = "shiny";
    state.settings.alwaysCaptureShiny = false;
    expect(shouldAttemptCapture(state.settings, bug, state)).toBe(false);
    bug.shiny = true;
    expect(shouldAttemptCapture(state.settings, bug, state)).toBe(true);
  });
});

describe("capture chance", () => {
  it("is higher at low HP and with better traps", () => {
    const { bug } = { bug: firstBug(stateWith(["typobit", 5])) };
    const full = captureChance(bug, 1);
    bug.currentHp = 1;
    const low = captureChance(bug, 1);
    expect(low).toBeGreaterThan(full);
    bug.currentHp = maxHp(bug);
    expect(captureChance(bug, 2.5)).toBeGreaterThan(full);
  });

  it("is guaranteed with Root Access and capped at 1", () => {
    const bug = firstBug(stateWith(["markmoth", 50]));
    expect(captureChance(bug, 255)).toBe(1);
    expect(captureChance(bug, 1)).toBeLessThan(0.01);
  });
});

describe("trap choice", () => {
  it("uses the preferred trap when available", () => {
    expect(pickTrap({ breakpoint: 3, watchpoint: 1 }, "watchpoint")?.id).toBe("watchpoint");
  });

  it("falls back to the cheapest trap and never spends Root Access implicitly", () => {
    expect(pickTrap({ profiler: 1, watchpoint: 1 }, "breakpoint")?.id).toBe("watchpoint");
    expect(pickTrap({ rootAccess: 1 }, "breakpoint")).toBeNull();
    expect(pickTrap({}, "breakpoint")).toBeNull();
  });
});
