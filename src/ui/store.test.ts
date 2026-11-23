import { chooseStarter } from "../game/engine";
import { createSeededRng } from "../game/rng";
import { exportSave, type KeyValueStorage } from "../game/save";
import { GameStore } from "./store";
import { describeEvent, formatClock, formatDuration, statusLine } from "./format";
import { createBattle } from "../game/battle";
import { createInitialState } from "../game/state";

class MemoryStorage implements KeyValueStorage {
  data = new Map<string, string>();
  getItem = (k: string) => this.data.get(k) ?? null;
  setItem = (k: string, v: string) => void this.data.set(k, v);
  removeItem = (k: string) => void this.data.delete(k);
}

describe("GameStore", () => {
  it("notifies listeners and advances the game", () => {
    const store = new GameStore(new MemoryStorage(), createSeededRng(1));
    let calls = 0;
    store.subscribe(() => calls++);
    store.run((s, rng) => chooseStarter(s, "leaklet", rng));
    store.advance(60_000);
    expect(calls).toBe(2);
    expect(store.state.totals.defeats + store.state.totals.captures).toBeGreaterThan(0);
    expect(store.log.length).toBeGreaterThan(0);
  });

  it("saves to storage and loads it back", () => {
    const storage = new MemoryStorage();
    const a = new GameStore(storage, createSeededRng(1));
    a.run((s, rng) => chooseStarter(s, "pixelmite", rng));
    a.save();
    const b = new GameStore(storage, createSeededRng(2));
    expect(b.state.team).toEqual(a.state.team);
  });

  it("imports and resets", () => {
    const store = new GameStore(new MemoryStorage(), createSeededRng(1));
    store.run((s, rng) => chooseStarter(s, "typobit", rng));
    const text = exportSave(store.state);
    store.reset();
    expect(store.state.team).toHaveLength(0);
    store.importText(text);
    expect(store.state.team).toHaveLength(1);
    expect(() => store.importText("nope")).toThrow();
  });
});

describe("formatting", () => {
  it("formats clocks and durations", () => {
    expect(formatClock(61_000)).toBe("1:01");
    expect(formatDuration(3_720_000)).toBe("1h 2min");
  });

  it("hides noisy events and describes important ones", () => {
    const store = new GameStore(null, createSeededRng(1));
    expect(describeEvent({ type: "outcome", outcome: "won" }, store.state)).toBeNull();
    expect(describeEvent({ type: "routeUnlocked", routeId: "node-modules" }, store.state)?.text).toContain("node_modules");
  });
});

describe("status line under the map", () => {
  it("says what the team is doing", () => {
    const store = new GameStore(new MemoryStorage(), createSeededRng(1));
    store.run((s, rng) => chooseStarter(s, "typobit", rng));
    const s = store.state;
    expect(statusLine(s)).toBe("Procurando bugs...");
    const enemy = { ...s.bugs[s.team[0]!]!, uid: "wild", speciesId: "nullit", level: 4 };
    s.runtime.battle = createBattle("wild", [enemy]);
    expect(statusLine(s)).toBe("Lutando contra Nullit Nv 4");
    s.runtime.atCenter = true;
    expect(statusLine(s)).toContain("Centro de Reboot");
    s.runtime.recoveryMs = 500;
    expect(statusLine(s)).toContain("reiniciando");
  });

  it("hides the team XP when there is no one on the bench", () => {
    const state = createInitialState();
    const base = { type: "rewards" as const, speciesId: "typobit", coins: 3, xp: 5, victorUid: null, trainerXp: 1 };
    expect(describeEvent({ ...base, benchXp: 0 }, state)!.text).not.toContain("xp equipe");
    expect(describeEvent({ ...base, benchXp: 2 }, state)!.text).toContain("+2 xp equipe");
  });

  it("announces a feature in the log when it opens", () => {
    const store = new GameStore(new MemoryStorage(), createSeededRng(1));
    store.run((s, rng) => chooseStarter(s, "typobit", rng));
    store.advance(100);
    store.update((s) => (s.totals.defeats = 10));
    store.advance(100);
    expect(store.log.some((l) => l.text.includes("Liberado: Mini Games"))).toBe(true);
  });
});
