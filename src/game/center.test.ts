import { inCombat, throwAtRoaming, throwTrapNow, tick, visitRebootCenter, type GameEvent } from "./engine";
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
  it("can be used during a fight: the fight is dropped, then everyone is healed and revived", () => {
    const state = stateWith(["leaklet", 10], ["nullit", 10]);
    state.settings.captureMode = "off";
    startFight(state);
    expect(inCombat(state)).toBe(true);
    const [a, b] = state.team.map((uid) => state.bugs[uid]!);
    a!.currentHp = 0;
    b!.currentHp = 1;
    const coins = state.coins;
    expect(visitRebootCenter(state).ok).toBe(true);
    expect(inCombat(state)).toBe(false);
    expect(state.runtime.atCenter).toBe(true);
    const events = tick(state, 3100, createSeededRng(2));
    expect(events.some((e) => e.type === "rewards")).toBe(false);
    expect(state.coins).toBe(coins);
    expect(a!.currentHp).toBeGreaterThan(1);
    expect(b!.currentHp).toBeGreaterThan(1);
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

  it("a trap thrown at a roaming bug catches it or it runs away", () => {
    const state = stateWith(["leaklet", 10]);
    state.settings.captureMode = "off";
    state.inventory = { rootAccess: 1, breakpoint: 3 };
    state.settings.preferredTrap = "rootAccess";
    const before = Object.keys(state.bugs).length;
    expect(throwAtRoaming(state, "nullit").ok).toBe(true);
    const events = tick(state, 100, createSeededRng(6));
    const caught = events.find((e) => e.type === "captured");
    expect(caught && caught.type === "captured" && caught.roaming).toBe(true);
    expect(Object.keys(state.bugs).length).toBe(before + 1);
    state.settings.preferredTrap = "breakpoint";
    let fled = false;
    for (let i = 0; i < 3 && !fled; i++) {
      throwAtRoaming(state, "nullit");
      fled = tick(state, 100, createSeededRng(20 + i)).some((e) => e.type === "fled");
    }
    expect(fled).toBe(true);
    expect(throwAtRoaming(state, "zeroday")).toEqual({ ok: false, reason: "notInRoute" });
    state.inventory = {};
    expect(throwAtRoaming(state, "nullit")).toEqual({ ok: false, reason: "noItem" });
  });
});
