import { defaultPreferences, lightingFor, mapFps, parsePreferences, soundAllowed } from "./preferences";
import { bodyClasses } from "./usePreferenceEffects";

describe("preferences", () => {
  it("fall back to the defaults for missing, broken or wrong-typed values", () => {
    expect(parsePreferences(null)).toEqual(defaultPreferences());
    expect(parsePreferences("{not json")).toEqual(defaultPreferences());
    const parsed = parsePreferences(JSON.stringify({ nightMode: true, economy: "yes", extra: 1 }));
    expect(parsed.nightMode).toBe(true);
    expect(parsed.economy).toBe(false);
    expect("extra" in parsed).toBe(false);
  });

  it("mute only the sounds the player turned off", () => {
    const prefs = { ...defaultPreferences(), shinySound: false, captureSound: false, rareDropSound: false, achievementSound: false };
    expect(soundAllowed({ type: "encounter", speciesId: "typobit", level: 3, shiny: true } as never, prefs)).toBe(false);
    expect(soundAllowed({ type: "encounter", speciesId: "typobit", level: 3, shiny: false } as never, prefs)).toBe(true);
    expect(soundAllowed({ type: "captureAttempt", itemId: "breakpoint", speciesId: "typobit", success: true }, prefs)).toBe(false);
    expect(soundAllowed({ type: "captureAttempt", itemId: "breakpoint", speciesId: "typobit", success: false }, prefs)).toBe(true);
    expect(soundAllowed({ type: "itemDrop", itemId: "coffee" }, prefs)).toBe(false);
    expect(soundAllowed({ type: "achievement", id: "dex5", reward: 500 }, prefs)).toBe(false);
    expect(soundAllowed({ type: "achievement", id: "dex5", reward: 500 }, defaultPreferences())).toBe(true);
  });

  it("performance modes lower the map frame rate, ultra stops it", () => {
    const base = defaultPreferences();
    expect(mapFps(base)).toBe(60);
    expect(mapFps({ ...base, optimized: true })).toBeLessThan(60);
    expect(mapFps({ ...base, economy: true })).toBeLessThan(mapFps({ ...base, optimized: true }));
    expect(mapFps({ ...base, ultraEconomy: true, economy: true })).toBeLessThan(mapFps({ ...base, economy: true }));
  });

  it("lights the map by the hour: clear by day, dark at night", () => {
    expect(lightingFor(12).opacity).toBe(0);
    expect(lightingFor(23).opacity).toBeGreaterThan(lightingFor(19).opacity);
    expect(lightingFor(3).opacity).toBeGreaterThan(0);
  });

  it("turn display preferences into body classes", () => {
    const base = defaultPreferences();
    expect(bodyClasses(base)).toEqual([]);
    expect(bodyClasses({ ...base, nightMode: true, sceneTransparency: false })).toEqual(["night-mode", "solid-scene"]);
    expect(bodyClasses({ ...base, ultraEconomy: true })).toEqual(["reduced-effects", "ultra-economy"]);
    expect(base.phoneLayout).toBe(true);
  });
});
