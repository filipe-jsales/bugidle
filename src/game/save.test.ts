import { createBattle } from "./battle";
import { exportSave, importSave, loadFromStorage, saveToStorage, SaveError, STORAGE_KEY, type KeyValueStorage } from "./save";
import { createInitialState } from "./state";
import { firstBug, stateWith } from "./testUtils";

class MemoryStorage implements KeyValueStorage {
  data = new Map<string, string>();
  getItem(key: string) {
    return this.data.get(key) ?? null;
  }
  setItem(key: string, value: string) {
    this.data.set(key, value);
  }
  removeItem(key: string) {
    this.data.delete(key);
  }
}

describe("save export/import (RF10)", () => {
  it("round-trips the persistent state", () => {
    const state = stateWith(["typobit", 12], ["nullit", 8]);
    state.coins = 1234;
    state.badges.push("badge-localhost");
    state.inventory.mutex = 2;
    state.bugdex["typobit"] = { seen: 3, defeated: 2, caught: 1, shinyCaught: false };
    state.settings.captureMode = "all";
    const loaded = importSave(exportSave(state));
    const { runtime: _a, ...expected } = state;
    const { runtime: _b, ...actual } = loaded;
    expect(actual).toEqual(expected);
  });

  it("does not save the runtime battle", () => {
    const state = stateWith(["typobit", 12]);
    state.runtime.battle = createBattle("wild", [firstBug(state)]);
    expect(exportSave(state)).not.toContain("runtime");
    expect(importSave(exportSave(state)).runtime.battle).toBeNull();
  });

  it("rejects garbage", () => {
    expect(() => importSave("not json")).toThrow(SaveError);
    expect(() => importSave("{}")).toThrow(SaveError);
    expect(() => importSave(JSON.stringify({ game: "bugidle", version: 999, state: {} }))).toThrow(SaveError);
  });

  it("rejects corrupt bugs", () => {
    const state = stateWith(["typobit", 12]);
    const file = JSON.parse(exportSave(state));
    file.state.bugs[state.team[0]!].speciesId = "pikachu";
    expect(() => importSave(JSON.stringify(file))).toThrow(SaveError);
  });

  it("fills missing fields with defaults (old saves)", () => {
    const loaded = importSave(JSON.stringify({ game: "bugidle", version: 1, state: { coins: 50 } }));
    expect(loaded.coins).toBe(50);
    expect(loaded.unlockedRoutes).toEqual(["port-3000"]);
    expect(loaded.settings).toEqual(createInitialState().settings);
    expect(loaded.team).toEqual([]);
  });

  it("drops unknown items, routes and team members", () => {
    const loaded = importSave(
      JSON.stringify({
        game: "bugidle",
        version: 1,
        state: { inventory: { breakpoint: 2, potion: 9 }, unlockedRoutes: ["mars"], team: ["ghost"] },
      }),
    );
    expect(loaded.inventory).toEqual({ breakpoint: 2 });
    expect(loaded.unlockedRoutes).toEqual(["port-3000"]);
    expect(loaded.team).toEqual([]);
  });

  it("returns to the route if saved mid boss fight", () => {
    const state = stateWith(["typobit", 12]);
    state.activity = { kind: "boss", bossId: "boss-localhost", returnRouteId: "port-3000" };
    expect(importSave(exportSave(state)).activity).toEqual({ kind: "route", routeId: "port-3000" });
  });
});

describe("local storage persistence", () => {
  it("saves and loads", () => {
    const storage = new MemoryStorage();
    expect(loadFromStorage(storage)).toBeNull();
    const state = stateWith(["leaklet", 7]);
    saveToStorage(storage, state);
    expect(loadFromStorage(storage)?.team).toEqual(state.team);
  });

  it("keeps a backup of a corrupt save", () => {
    const storage = new MemoryStorage();
    storage.setItem(STORAGE_KEY, "{broken");
    expect(loadFromStorage(storage)).toBeNull();
    expect(storage.getItem(`${STORAGE_KEY}.corrupt`)).toBe("{broken");
  });
});
