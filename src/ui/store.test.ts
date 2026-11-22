import { chooseStarter } from "../game/engine";
import { createSeededRng } from "../game/rng";
import { exportSave, type KeyValueStorage } from "../game/save";
import { GameStore } from "./store";
import { describeEvent, formatClock, formatDuration } from "./format";

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
