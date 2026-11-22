import { createBattle } from "./battle";
import { registerCaught } from "./bugdex";
import { getRoute } from "./data/world";
import { spawnWild, tick } from "./engine";
import { createSeededRng } from "./rng";
import { defaultRules, firstMatch, matches, ruleAsCode, sanitizeRules, type Rule } from "./rules";
import { exportSave, importSave } from "./save";
import { firstBug, stateWith } from "./testUtils";

function setup() {
  const state = stateWith(["leaklet", 10], ["nullit", 8]);
  const active = firstBug(state);
  const wild = { ...state.bugs[state.team[1]!]!, uid: "wild-1" };
  return { state, active, wild };
}

describe("rule conditions", () => {
  it("AND joins conditions and NOT inverts one", () => {
    const { state, wild } = setup();
    wild.shiny = true;
    const rule: Rule = { id: 1, enabled: true, when: [{ kind: "wildShiny" }, { kind: "wildNew" }], then: { kind: "throw", trap: "breakpoint" } };
    expect(matches(rule, { state, wild })).toBe(true);
    registerCaught(state, wild.speciesId, false);
    expect(matches(rule, { state, wild })).toBe(false);
    rule.when[1]!.not = true;
    expect(matches(rule, { state, wild })).toBe(true);
  });

  it("checks HP percent, rarity and level", () => {
    const { state, active, wild } = setup();
    active.currentHp = 1;
    expect(matches({ id: 1, enabled: true, when: [{ kind: "hpBelow", value: 40 }], then: { kind: "potion" } }, { state, active })).toBe(true);
    expect(matches({ id: 1, enabled: true, when: [{ kind: "wildRare" }], then: { kind: "noThrow" } }, { state, wild })).toBe(false);
    expect(matches({ id: 1, enabled: true, when: [{ kind: "wildLevelAtLeast", value: 8 }], then: { kind: "noThrow" } }, { state, wild })).toBe(true);
  });

  it("disabled rules never match", () => {
    const { state } = setup();
    expect(matches({ id: 1, enabled: false, when: [], then: { kind: "potion" } }, { state })).toBe(false);
  });
});

describe("rule order", () => {
  it("the first match wins and out-of-stock traps fall through", () => {
    const { state, wild } = setup();
    state.inventory = { breakpoint: 5 };
    const rules: Rule[] = [
      { id: 1, enabled: true, when: [], then: { kind: "throw", trap: "profiler" } },
      { id: 2, enabled: true, when: [], then: { kind: "throw", trap: "breakpoint" } },
      { id: 3, enabled: true, when: [], then: { kind: "noThrow" } },
    ];
    expect(firstMatch(rules, "capture", { state, wild })?.id).toBe(2);
    state.inventory = {};
    expect(firstMatch(rules, "capture", { state, wild })?.id).toBe(3);
  });

  it("capture and heal rules are separate decisions", () => {
    const { state, active } = setup();
    active.currentHp = 1;
    expect(firstMatch(defaultRules(), "heal", { state, active })?.then.kind).toBe("potion");
  });
});

describe("rules in the game loop", () => {
  it("a 'never throw' rule stops all traps", () => {
    const state = stateWith(["heapocalypse", 20]);
    state.settings.useRules = true;
    state.rules = [{ id: 1, enabled: true, when: [{ kind: "always" }], then: { kind: "noThrow" } }];
    const traps = state.inventory.breakpoint;
    tick(state, 30_000, createSeededRng(1));
    expect(state.inventory.breakpoint).toBe(traps);
  });

  it("throws the trap the matching rule names", () => {
    const state = stateWith(["heapocalypse", 20]);
    state.settings.useRules = true;
    state.inventory = { watchpoint: 5, breakpoint: 5 };
    state.rules = [{ id: 1, enabled: true, when: [{ kind: "always" }], then: { kind: "throw", trap: "watchpoint" } }];
    state.runtime.battle = createBattle("wild", [spawnWild(getRoute("port-3000"), createSeededRng(2))]);
    state.runtime.battle.enemies[0]!.currentHp = 1_000_000;
    const events = tick(state, 2000, () => 0.99);
    const thrown = events.filter((e) => e.type === "captureAttempt").map((e) => (e.type === "captureAttempt" ? e.itemId : ""));
    expect(thrown.length).toBeGreaterThan(0);
    expect(new Set(thrown)).toEqual(new Set(["watchpoint"]));
  });

  it("a heal rule drinks a potion", () => {
    const state = stateWith(["leaklet", 10]);
    state.settings.useRules = true;
    state.rules = [{ id: 1, enabled: true, when: [{ kind: "hpBelow", value: 90 }], then: { kind: "potion" } }];
    firstBug(state).currentHp = 5;
    state.runtime.battle = createBattle("wild", [spawnWild(getRoute("port-3000"), createSeededRng(3))]);
    expect(tick(state, 100, createSeededRng(1)).some((e) => e.type === "potionUsed")).toBe(true);
  });
});

describe("rules as data and as code", () => {
  it("round-trip through the save and drop malformed rules", () => {
    const state = stateWith(["leaklet", 10]);
    state.rules = defaultRules();
    expect(importSave(exportSave(state)).rules).toEqual(state.rules);
    expect(sanitizeRules([{ id: 1, when: [], then: { kind: "explode" } }, { id: 2, when: [{ kind: "always" }], then: { kind: "potion" } }])).toHaveLength(1);
    expect(sanitizeRules("nope")).toEqual(defaultRules());
  });

  it("can be shown as code", () => {
    expect(ruleAsCode({ id: 1, enabled: true, when: [{ kind: "wildShiny" }, { kind: "wildNew", not: true }], then: { kind: "throw", trap: "profiler" } })).toBe(
      'if (wild.shiny && !(!bugdex.has(wild))) throwTrap("profiler");',
    );
  });
});

describe("debug to capture", () => {
  it("pauses on a new species, and a right answer doubles the capture chance", async () => {
    const { answerDebug, DEBUG_CAPTURE_BONUS } = await import("./engine");
    const { lessonFor } = await import("./data/lessons");
    const state = stateWith(["heapocalypse", 20]);
    state.settings.debugChallenges = true;
    const offered = tick(state, 3000, createSeededRng(1));
    const offer = offered.find((e) => e.type === "debugOffered");
    expect(offer).toBeDefined();
    const species = state.runtime.debug!.speciesId;
    const hpBefore = state.runtime.battle!.enemies[0]!.currentHp;
    tick(state, 5000, createSeededRng(1));
    expect(state.runtime.battle!.enemies[0]!.currentHp).toBe(hpBefore);
    const events = answerDebug(state, lessonFor(species)!.badLine);
    expect(events).toEqual([{ type: "debugAnswered", speciesId: species, correct: true }]);
    expect(state.runtime.captureBonus).toBe(DEBUG_CAPTURE_BONUS);
    expect(state.runtime.debug).toBeNull();
  });

  it("a wrong answer gives no bonus, and the challenge expires on its own", async () => {
    const { answerDebug, DEBUG_TIME_MS } = await import("./engine");
    const { lessonFor } = await import("./data/lessons");
    const state = stateWith(["heapocalypse", 20]);
    state.settings.debugChallenges = true;
    tick(state, 3000, createSeededRng(1));
    const species = state.runtime.debug!.speciesId;
    const wrong = (lessonFor(species)!.badLine + 1) % lessonFor(species)!.lines.length;
    expect(answerDebug(state, wrong)[0]).toMatchObject({ correct: false });
    expect(state.runtime.captureBonus).toBe(0);

    const later = stateWith(["heapocalypse", 20]);
    later.settings.debugChallenges = true;
    tick(later, 3000, createSeededRng(1));
    const events = tick(later, DEBUG_TIME_MS + 500, createSeededRng(1));
    expect(events.some((e) => e.type === "debugExpired")).toBe(true);
  });

  it("is not offered for caught common bugs or when switched off", async () => {
    const state = stateWith(["heapocalypse", 20]);
    state.settings.debugChallenges = false;
    expect(tick(state, 10_000, createSeededRng(1)).some((e) => e.type === "debugOffered")).toBe(false);
  });
});
