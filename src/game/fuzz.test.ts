/**
 * Chaos test: plays the game with random player actions between ticks and
 * checks after every step that the state still makes sense (no NaN, HP inside
 * its range, no bug in two places, the save loads back the same).
 */
import { describe, expect, it } from "vitest";
import { maxHp, MAX_LEVEL } from "./bug";
import { moveToBox, moveToTeam, releaseBug, setLead, swapWithBox } from "./collection";
import { BOSSES, ROUTES } from "./data/world";
import { ITEMS, type ItemId } from "./data/items";
import { STAT_KEYS } from "./data/stats";
import { challengeBoss, chooseStarter, evolveBug, forfeitBoss, reduceLevel, returnToHunt, selectRoute, throwTrapNow, tick, visitRebootCenter } from "./engine";
import { incubateEgg } from "./hatchery";
import { equipItem, unequipItem } from "./held";
import { assignToHouse, buildHouse, collectAll, HOUSE_LOTS, removeFromHouse, upgradeHouse } from "./housing";
import { buyItem, useItemOnBug } from "./inventory";
import { createSeededRng, type Rng } from "./rng";
import { exportSave, importSave, SaveError } from "./save";
import { createInitialState, MAX_TEAM_SIZE, type GameState } from "./state";
import { addStones, refineStat } from "./stones";

const ITEM_IDS = Object.keys(ITEMS) as ItemId[];
const pick = <T,>(rng: Rng, list: readonly T[]): T | undefined => list[Math.floor(rng() * list.length)];

function randomUid(state: GameState, rng: Rng): string {
  return pick(rng, Object.keys(state.bugs)) ?? "none";
}

/** One random player action; most of them are refused, which is also tested. */
function randomAction(state: GameState, rng: Rng): void {
  const uid = randomUid(state, rng);
  const boxed = Object.keys(state.bugs).filter((u) => !state.team.includes(u));
  const lot = pick(rng, HOUSE_LOTS)!.lot;
  const actions: (() => unknown)[] = [
    () => moveToTeam(state, uid),
    () => moveToBox(state, uid),
    () => swapWithBox(state, pick(rng, state.team) ?? "none", pick(rng, boxed) ?? "none"),
    () => setLead(state, uid),
    () => (rng() < 0.2 ? releaseBug(state, uid) : null),
    () => buyItem(state, pick(rng, ITEM_IDS)!, 1 + Math.floor(rng() * 5)),
    () => useItemOnBug(state, pick(rng, ITEM_IDS)!, uid),
    () => equipItem(state, uid, pick(rng, ITEM_IDS)!),
    () => unequipItem(state, uid),
    () => buildHouse(state, lot),
    () => upgradeHouse(state, lot),
    () => assignToHouse(state, lot, uid),
    () => removeFromHouse(state, uid),
    () => collectAll(state),
    () => incubateEgg(state),
    () => evolveBug(state, uid),
    () => reduceLevel(state, uid),
    () => refineStat(state, uid, pick(rng, STAT_KEYS)!),
    () => selectRoute(state, pick(rng, ROUTES)!.id),
    () => challengeBoss(state, pick(rng, BOSSES)!.id),
    () => forfeitBoss(state),
    () => visitRebootCenter(state),
    () => returnToHunt(state),
    () => throwTrapNow(state),
    () => {
      state.settings.trainWeakest = rng() < 0.5;
    },
    () => {
      state.settings.captureMode = pick(rng, ["off", "all", "uncaught", "shiny"] as const)!;
    },
  ];
  pick(rng, actions)!();
}

/** Paths that differ between two JSON values, for readable failures. */
function jsonDiff(a: unknown, b: unknown, path = ""): string[] {
  if (JSON.stringify(a) === JSON.stringify(b)) return [];
  if (typeof a !== "object" || typeof b !== "object" || a === null || b === null) return [`${path}: ${JSON.stringify(a)} -> ${JSON.stringify(b)}`];
  const ra = a as Record<string, unknown>;
  const rb = b as Record<string, unknown>;
  return [...new Set([...Object.keys(ra), ...Object.keys(rb)])].flatMap((k) => jsonDiff(ra[k], rb[k], `${path}.${k}`));
}

function checkInvariants(state: GameState, where: string): void {
  const fail = (msg: string) => {
    throw new Error(`${where}: ${msg}`);
  };
  if (!Number.isFinite(state.coins) || state.coins < 0) fail(`coins ${state.coins}`);
  if (state.team.length > MAX_TEAM_SIZE) fail(`team size ${state.team.length}`);
  if (new Set(state.team).size !== state.team.length) fail("duplicate uid in team");
  for (const uid of state.team) if (!state.bugs[uid]) fail(`team uid ${uid} has no bug`);
  if (Object.keys(state.bugs).length > 0 && state.team.length === 0) fail("bugs but empty team");
  const housed = new Set<string>();
  for (const house of state.houses) {
    for (const uid of house.bugs) {
      if (!state.bugs[uid]) fail(`house ${house.lot} has missing bug ${uid}`);
      if (state.team.includes(uid)) fail(`bug ${uid} is in the team and in a house`);
      if (housed.has(uid)) fail(`bug ${uid} lives in two houses`);
      housed.add(uid);
    }
    if (!Number.isFinite(house.pending) || house.pending < 0) fail(`house pending ${house.pending}`);
  }
  for (const [id, count] of Object.entries(state.inventory)) {
    if (!Number.isInteger(count) || count! < 0) fail(`inventory ${id} = ${count}`);
  }
  for (const [type, count] of Object.entries(state.stones)) {
    if (!Number.isInteger(count) || count! < 0) fail(`stones ${type} = ${count}`);
  }
  for (const bug of Object.values(state.bugs)) {
    if (bug.uid !== Object.keys(state.bugs).find((k) => state.bugs[k] === bug)) fail(`uid key mismatch ${bug.uid}`);
    if (!Number.isInteger(bug.level) || bug.level < 1 || bug.level > MAX_LEVEL) fail(`${bug.uid} level ${bug.level}`);
    if (!Number.isFinite(bug.xp) || bug.xp < 0) fail(`${bug.uid} xp ${bug.xp}`);
    const hp = maxHp(bug);
    if (!Number.isFinite(bug.currentHp) || bug.currentHp < 0 || bug.currentHp > hp) fail(`${bug.uid} hp ${bug.currentHp}/${hp}`);
    if (bug.held && ITEMS[bug.held]?.category !== "held") fail(`${bug.uid} holds ${bug.held}`);
  }
}

describe("chaos play", () => {
  for (const seed of [1, 2, 3, 4, 5, 6]) {
    it(`keeps a valid state with random actions (seed ${seed})`, () => {
      const rng = createSeededRng(seed);
      const state = createInitialState();
      state.settings.debugChallenges = false;
      chooseStarter(state, "typobit", rng);
      state.coins = 200_000;
      for (const type of ["syntax", "logic", "memory"] as const) addStones(state, type, 200);
      for (let step = 0; step < 2500; step++) {
        if (rng() < 0.3) randomAction(state, rng);
        tick(state, 250 + Math.floor(rng() * 4000), rng);
        checkInvariants(state, `seed ${seed} step ${step}`);
        if (step % 500 === 499) {
          const when = new Date(0);
          const loaded = importSave(exportSave(state, when));
          let diffs = jsonDiff(JSON.parse(exportSave(state, when)), JSON.parse(exportSave(loaded, when)));
          // a boss fight is not saved: loading goes back to the route the player came from
          if (state.activity.kind === "boss") {
            expect(loaded.activity).toEqual({ kind: "route", routeId: state.activity.returnRouteId });
            diffs = diffs.filter((d) => !d.startsWith(".state.activity."));
          }
          expect(diffs).toEqual([]);
          checkInvariants(loaded, `seed ${seed} step ${step} (reloaded)`);
        }
      }
      expect(state.totals.defeats).toBeGreaterThan(0);
    });
  }
});

/** Every path to a value inside a JSON tree. */
function allPaths(value: unknown, path: (string | number)[] = []): (string | number)[][] {
  if (typeof value !== "object" || value === null) return [path];
  const entries = Array.isArray(value) ? value.map((v, i) => [i, v] as const) : Object.entries(value);
  return [path, ...entries.flatMap(([k, v]) => allPaths(v, [...path, k]))];
}

const JUNK: unknown[] = [null, -1, 1e12, Number.NaN, "x", "", [], {}, true, 3.7, -0.5];

describe("broken save files", () => {
  it("are refused with SaveError or load into a valid state, never crash", () => {
    const rng = createSeededRng(7);
    const state = createInitialState();
    state.settings.debugChallenges = false;
    chooseStarter(state, "leaklet", rng);
    state.coins = 50_000;
    for (let i = 0; i < 1500; i++) {
      if (rng() < 0.3) randomAction(state, rng);
      tick(state, 2000, rng);
    }
    const good = JSON.parse(exportSave(state, new Date(0))) as Record<string, unknown>;
    const paths = allPaths(good).filter((p) => p.length > 0);
    let loaded = 0;
    for (let round = 0; round < 1500; round++) {
      const broken = structuredClone(good);
      for (let n = 0; n < 1 + Math.floor(rng() * 3); n++) {
        const path = pick(rng, paths)!;
        let parent = broken as Record<string | number, unknown>;
        for (const key of path.slice(0, -1)) parent = (parent?.[key] ?? {}) as Record<string | number, unknown>;
        if (typeof parent !== "object" || parent === null) continue;
        const last = path[path.length - 1]!;
        if (rng() < 0.3) delete parent[last];
        else parent[last] = pick(rng, JUNK);
      }
      let result: GameState;
      try {
        result = importSave(JSON.stringify(broken));
      } catch (e) {
        if (!(e instanceof SaveError)) throw new Error(`round ${round}: ${String(e)} for ${JSON.stringify(broken).slice(0, 200)}`);
        continue;
      }
      loaded++;
      checkInvariants(result, `broken save round ${round}`);
      // and the game keeps running on it
      for (let t = 0; t < 20; t++) tick(result, 1000, rng);
      checkInvariants(result, `broken save round ${round} after ticks`);
    }
    expect(loaded).toBeGreaterThan(500);
  });
});
