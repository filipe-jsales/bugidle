/**
 * Weather and time of day on the map. They change which bugs show up: rain in
 * the server room brings network bugs, the night brings rare ones. The weather
 * of each region changes every WEATHER_SLOT_MS and is the same for everyone at
 * the same moment (it comes from the clock, not from randomness), so it can be
 * shown ahead of time and tested. The UI passes the current conditions to the
 * engine through `state.runtime.conditions`; tests and the simulation use clear days.
 */
import { getSpecies, type Rarity } from "./data/species";
import { hashString } from "./rng";
import type { BugType } from "./types";

export type Weather = "clear" | "rain" | "storm" | "fog" | "heat";
export type TimeOfDay = "day" | "dusk" | "night";

export interface Conditions {
  weather: Weather;
  time: TimeOfDay;
}

export const CLEAR_DAY: Conditions = { weather: "clear", time: "day" };

export const WEATHER_SLOT_MS = 20 * 60_000;

/** How likely each weather is in each region (out of the sum). */
// prettier-ignore
const CLIMATE: Record<string, Partial<Record<Weather, number>>> = {
  localhost: { clear: 6, rain: 2, fog: 2, heat: 1 },
  staging: { clear: 4, rain: 4, storm: 1, fog: 1 },
  production: { clear: 4, heat: 3, storm: 2, rain: 1 },
  legacy: { clear: 4, fog: 4, heat: 1, rain: 1 },
  cloud: { clear: 4, storm: 3, rain: 2, fog: 1 },
};

/** Encounter weight multipliers by bug type. */
export const WEATHER_BOOST: Readonly<Record<Weather, Partial<Record<BugType, number>>>> = {
  clear: {},
  rain: { network: 2 },
  storm: { concurrency: 2, network: 1.5 },
  fog: { logic: 2, ui: 1.5 },
  heat: { performance: 2, memory: 1.5 },
};

/** Encounter weight multipliers by rarity at each time of day. */
export const TIME_BOOST: Readonly<Record<TimeOfDay, Partial<Record<Rarity, number>>>> = {
  day: {},
  dusk: { rare: 1.5 },
  night: { rare: 2, legendary: 3 },
};

export function timeOfDay(hour: number): TimeOfDay {
  if (hour >= 21 || hour < 5) return "night";
  if (hour >= 18 || hour < 7) return "dusk";
  return "day";
}

/** The weather of a region in a 20-minute slot. */
export function weatherFor(regionId: string, slot: number): Weather {
  const climate = CLIMATE[regionId] ?? { clear: 1 };
  const entries = Object.entries(climate) as [Weather, number][];
  const total = entries.reduce((sum, [, w]) => sum + w, 0);
  let roll = hashString(`${regionId}:${slot}`) % total;
  for (const [weather, w] of entries) {
    if (roll < w) return weather;
    roll -= w;
  }
  return "clear";
}

export function conditionsAt(date: Date, regionId: string): Conditions {
  return { weather: weatherFor(regionId, Math.floor(date.getTime() / WEATHER_SLOT_MS)), time: timeOfDay(date.getHours()) };
}

/** Milliseconds until the weather changes. */
export function msToNextWeather(date: Date): number {
  return WEATHER_SLOT_MS - (date.getTime() % WEATHER_SLOT_MS);
}

/** How much more likely a species is under these conditions (1 = unchanged). */
export function encounterBoost(speciesId: string, conditions: Conditions): number {
  const species = getSpecies(speciesId);
  const byType = Math.max(1, ...species.types.map((t) => WEATHER_BOOST[conditions.weather][t] ?? 1));
  const byTime = TIME_BOOST[conditions.time][species.rarity] ?? 1;
  return byType * byTime;
}
