import { BENCH_XP_SHARE, benchShare, MAX_BENCH_SHARE, tick, weakestFirst } from "./engine";
import { totalXp } from "./experience";
import { createSeededRng } from "./rng";
import { stateWith } from "./testUtils";

describe("final-boss wall: benched bugs catch up", () => {
  it("a bug at the top level gets the base share; one far behind gets much more, up to a limit", () => {
    expect(benchShare(50, 50)).toBe(BENCH_XP_SHARE);
    expect(benchShare(40, 50)).toBeGreaterThan(benchShare(48, 50));
    expect(benchShare(1, 100)).toBe(MAX_BENCH_SHARE);
  });

  it("in a fight, the lower benched bug gains more XP than the one close to the lead", () => {
    const state = stateWith(["typobit", 16], ["leaklet", 15], ["nullit", 4]);
    state.settings.captureMode = "off";
    const close = state.bugs[state.team[1]!]!;
    const far = state.bugs[state.team[2]!]!;
    const xpOf = (bug: typeof close) => totalXp(bug.level, bug.xp);
    const before = { close: xpOf(close), far: xpOf(far) };
    tick(state, 60_000, createSeededRng(3));
    expect(xpOf(far) - before.far).toBeGreaterThan(xpOf(close) - before.close);
  });

  it("'train the weakest' puts the lowest healthy bug first", () => {
    const state = stateWith(["typobit", 18], ["leaklet", 5], ["nullit", 10]);
    weakestFirst(state);
    expect(state.bugs[state.team[0]!]!.level).toBe(5);
    state.bugs[state.team[0]!]!.currentHp = 0;
    weakestFirst(state);
    expect(state.bugs[state.team[0]!]!.level).toBe(10);
    expect(state.team).toHaveLength(3);
  });

  it("with the setting on, the weakest bug leads each wild fight", () => {
    const state = stateWith(["typobit", 18], ["leaklet", 6]);
    state.settings.trainWeakest = true;
    state.settings.captureMode = "off";
    const rng = createSeededRng(4);
    for (let i = 0; i < 50 && !state.runtime.battle; i++) tick(state, 100, rng);
    expect(state.bugs[state.team[0]!]!.speciesId).toBe("leaklet");
  });
});
