import { getSpecies, SPECIES } from "./data/species";
import { getRoute, REGIONS } from "./data/world";
import { spawnWild } from "./engine";
import { createSeededRng } from "./rng";
import { CLEAR_DAY, conditionsAt, encounterBoost, msToNextWeather, timeOfDay, WEATHER_SLOT_MS, weatherFor, type Conditions } from "./weather";

/** Share of `speciesId` among many spawns on a route under some conditions. */
function share(routeId: string, speciesId: string, conditions: Conditions): number {
  const rng = createSeededRng(7);
  let hits = 0;
  const n = 4000;
  for (let i = 0; i < n; i++) if (spawnWild(getRoute(routeId), rng, null, conditions).speciesId === speciesId) hits += 1;
  return hits / n;
}

describe("weather and time of day", () => {
  it("splits the day into day, dusk and night", () => {
    expect(timeOfDay(12)).toBe("day");
    expect(timeOfDay(19)).toBe("dusk");
    expect(timeOfDay(6)).toBe("dusk");
    expect(timeOfDay(23)).toBe("night");
    expect(timeOfDay(3)).toBe("night");
  });

  it("is the same for everyone in a slot and changes over time", () => {
    const date = new Date(2026, 0, 1, 12, 5);
    expect(conditionsAt(date, "staging")).toEqual(conditionsAt(new Date(date.getTime() + 1000), "staging"));
    const seen = new Set<string>();
    for (let slot = 0; slot < 200; slot++) seen.add(weatherFor("staging", slot));
    expect(seen.size).toBeGreaterThanOrEqual(3);
    expect(msToNextWeather(date)).toBeLessThanOrEqual(WEATHER_SLOT_MS);
  });

  it("every region has its own climate (the server room rains more than localhost)", () => {
    const rainy = (regionId: string) => Array.from({ length: 2000 }, (_, slot) => weatherFor(regionId, slot)).filter((w) => w === "rain").length;
    expect(rainy("staging")).toBeGreaterThan(rainy("localhost"));
    for (const region of REGIONS) expect(["clear", "rain", "storm", "fog", "heat"]).toContain(weatherFor(region.id, 1));
  });

  it("rain brings more network bugs and the night brings more rare ones", () => {
    expect(encounterBoost("timeoutick", { weather: "rain", time: "day" })).toBe(2);
    expect(encounterBoost("timeoutick", CLEAR_DAY)).toBe(1);
    expect(encounterBoost("typobit", { weather: "rain", time: "day" })).toBe(1);
    const route = "node-modules";
    expect(share(route, "timeoutick", { weather: "rain", time: "day" })).toBeGreaterThan(share(route, "timeoutick", CLEAR_DAY) * 1.4);
    const rare = SPECIES.find((s) => s.rarity === "rare")!;
    expect(encounterBoost(rare.id, { weather: "clear", time: "night" })).toBe(2);
    expect(encounterBoost(rare.id, { weather: "clear", time: "dusk" })).toBeGreaterThan(1);
    expect(getSpecies("typobit").rarity).toBe("common");
    expect(encounterBoost("typobit", { weather: "clear", time: "night" })).toBe(1);
  });
});
