/**
 * Display, sound and performance preferences from the settings window.
 * Kept per browser (localStorage), not in the game save, like the volumes.
 * Pure parsing and decisions here; `usePreferences` is the React hook.
 */
import { useSyncExternalStore } from "react";
import type { GameEvent } from "../game/engine";

export interface Preferences {
  // Audio
  shinySound: boolean;
  captureSound: boolean;
  rareDropSound: boolean;
  achievementSound: boolean;
  // Interactivity
  immersive: boolean;
  sceneTransparency: boolean;
  timeLighting: boolean;
  // HUD
  nameplates: boolean;
  hideAchievementToasts: boolean;
  nightMode: boolean;
  phoneLayout: boolean;
  // Performance
  optimized: boolean;
  economy: boolean;
  keepScreenOn: boolean;
  ultraEconomy: boolean;
}

export type PreferenceKey = keyof Preferences;

export const PREFERENCES_STORAGE_KEY = "bugidle.preferences";

export function defaultPreferences(): Preferences {
  return {
    shinySound: true,
    captureSound: true,
    rareDropSound: true,
    achievementSound: true,
    immersive: false,
    sceneTransparency: true,
    timeLighting: true,
    nameplates: true,
    hideAchievementToasts: false,
    nightMode: false,
    phoneLayout: true,
    optimized: false,
    economy: false,
    keepScreenOn: false,
    ultraEconomy: false,
  };
}

/** Reads saved preferences; unknown or broken values fall back to the defaults. */
export function parsePreferences(text: string | null): Preferences {
  const defaults = defaultPreferences();
  if (!text) return defaults;
  try {
    const raw = JSON.parse(text) as Record<string, unknown>;
    const result = { ...defaults };
    for (const key of Object.keys(defaults) as PreferenceKey[]) {
      if (typeof raw[key] === "boolean") result[key] = raw[key] as boolean;
    }
    return result;
  } catch {
    return defaults;
  }
}

/** Whether a game event's sound should play with these preferences. */
export function soundAllowed(event: GameEvent, prefs: Preferences): boolean {
  switch (event.type) {
    case "encounter":
      return !event.shiny || prefs.shinySound;
    case "captureAttempt":
      return !event.success || prefs.captureSound;
    case "itemDrop":
    case "stoneDrop":
      return prefs.rareDropSound;
    case "achievement":
      return prefs.achievementSound;
    default:
      return true;
  }
}

/** Map frames per second for the performance options. */
export function mapFps(prefs: Preferences): number {
  if (prefs.ultraEconomy) return 4;
  if (prefs.economy) return 20;
  if (prefs.optimized) return 30;
  return 60;
}

/** Map tint for the local hour: night is darker and blue, dusk and dawn are warm. */
export function lightingFor(hour: number): { color: string; opacity: number } {
  if (hour < 5 || hour >= 21) return { color: "#0b1030", opacity: 0.42 };
  if (hour < 7) return { color: "#ff9a5a", opacity: 0.16 };
  if (hour >= 18) return { color: "#ff7a3a", opacity: 0.2 };
  return { color: "#ffffff", opacity: 0 };
}

// ---- browser store

let current: Preferences = defaultPreferences();
const listeners = new Set<() => void>();

function storage(): Storage | null {
  try {
    return typeof window === "undefined" ? null : window.localStorage;
  } catch {
    return null;
  }
}

current = parsePreferences(storage()?.getItem(PREFERENCES_STORAGE_KEY) ?? null);

export function getPreferences(): Preferences {
  return current;
}

export function setPreference<K extends PreferenceKey>(key: K, value: Preferences[K]): void {
  current = { ...current, [key]: value };
  try {
    storage()?.setItem(PREFERENCES_STORAGE_KEY, JSON.stringify(current));
  } catch {
    // private mode or full storage: the choice lasts until the tab closes
  }
  for (const listener of listeners) listener();
}

export function resetPreferences(): void {
  for (const [key, value] of Object.entries(defaultPreferences()) as [PreferenceKey, boolean][]) setPreference(key, value);
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function usePreferences(): Preferences {
  return useSyncExternalStore(subscribe, getPreferences, getPreferences);
}
