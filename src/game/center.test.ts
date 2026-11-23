import { CENTER_CALM_MS, huntSpecies, inCombat, throwTrapNow, tick, visitRebootCenter, type GameEvent } from "./engine";
import { createSeededRng } from "./rng";
import { stateWith } from "./testUtils";

/** Ticks until a wild fight is running. */
function startFight(state: ReturnType<typeof stateWith>, seed = 1): GameEvent[] {
  const rng = createSeededRng(seed);
  const events: GameEvent[] = [];
  for (let i = 0; i < 100 && !state.runtime.battle; i++) events.push(...tick(state, 100, rng));
  return events;
}

describe("Reboot Center: a calm place", () => {
  it("cannot be used during a fight or in the first seconds after it", () => {
    const state = stateWith(["leaklet", 10]);
    state.settings.captureMode = "off";
    startFight(state);
    expect(inCombat(state)).toBe(true);
    expect(visitRebootCenter(state)).toEqual({ ok: false, reason: "inCombat" });
    // end the fight and wait less than the calm time
    state.runtime.battle!.outcome = "won";
    tick(state, 100, createSeededRng(2));
    state.runtime.atCenter = true; // keep new fights from starting while we check the clock
    expect(inCombat(state)).toBe(true);
    state.runtime.atCenter = false;
    state.totals.playTimeMs += CENTER_CALM_MS;
    state.runtime.battle = null;
    expect(inCombat(state)).toBe(false);
    expect(visitRebootCenter(state).ok).toBe(true);
    expect(state.runtime.atCenter).toBe(true);
  });

  it("no encounters while the nurse heals; with return to hunt the team leaves after", () => {
    const state = stateWith(["leaklet", 10]);
    state.settings.returnToHunt = true;
    expect(visitRebootCenter(state).ok).toBe(true);
    const during = tick(state, 2500, createSeededRng(3));
    expect(during.some((e) => e.type === "encounter")).toBe(false);
    const after = tick(state, 10_000, createSeededRng(3));
    expect(after.some((e) => e.type === "recovered")).toBe(true);
    expect(state.runtime.atCenter).toBe(false);
  });
});

describe("throwing a trap by hand", () => {
  it("throws on the next step even when the automatic filter would not", () => {
    const state = stateWith(["leaklet", 10]);
    state.settings.captureMode = "off";
    state.inventory = { breakpoint: 5 };
    startFight(state);
    expect(throwTrapNow(state).ok).toBe(true);
    const events = tick(state, 100, createSeededRng(4));
    expect(events.some((e) => e.type === "captureAttempt")).toBe(true);
    expect(state.inventory.breakpoint).toBe(4);
  });

  it("needs a wild fight and a trap", () => {
    const state = stateWith(["leaklet", 10]);
    expect(throwTrapNow(state)).toEqual({ ok: false, reason: "busy" });
    state.settings.captureMode = "off";
    startFight(state);
    state.inventory = {};
    expect(throwTrapNow(state)).toEqual({ ok: false, reason: "noItem" });
  });

  it("picking a roaming bug makes it the next encounter and throws at it", () => {
    const state = stateWith(["leaklet", 10]);
    state.settings.captureMode = "off";
    state.inventory = { breakpoint: 5 };
    expect(huntSpecies(state, "nullit").ok).toBe(true);
    const events = startFight(state, 5);
    tick(state, 100, createSeededRng(6)).forEach((e) => events.push(e));
    const encounter = events.find((e) => e.type === "encounter");
    expect(encounter && encounter.type === "encounter" && encounter.speciesId).toBe("nullit");
    expect(events.some((e) => e.type === "captureAttempt")).toBe(true);
    expect(huntSpecies(state, "zeroday")).toEqual({ ok: false, reason: "notInRoute" });
  });
});
