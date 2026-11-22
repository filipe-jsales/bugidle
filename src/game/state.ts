import type { Battle } from "./battle";
import type { BugInstance } from "./bug";
import type { ItemId } from "./data/items";
import type { Trainer } from "./experience";
import type { House } from "./housing";
import type { StoneWallet } from "./stones";

export const SAVE_VERSION = 1;
export const MAX_TEAM_SIZE = 6;

export type CaptureMode = "off" | "all" | "uncaught" | "shiny";

export interface DexEntry {
  seen: number;
  defeated: number;
  caught: number;
  shinyCaught: boolean;
}

export type Activity =
  | { kind: "route"; routeId: string }
  | { kind: "boss"; bossId: string; returnRouteId: string };

export interface Settings {
  captureMode: CaptureMode;
  /** Always throw at shiny bugs, whatever the mode. */
  alwaysCaptureShiny: boolean;
  preferredTrap: ItemId;
  autoPotion: boolean;
  /** Use a potion when the active bug is below this HP fraction (0..1). */
  potionThreshold: number;
  autoEvolve: boolean;
}

/** Everything that is saved. */
export interface PersistentState {
  version: number;
  trainer: Trainer;
  coins: number;
  bugs: Record<string, BugInstance>;
  /** Ordered uids of the active team. Every other bug in `bugs` is in the box. */
  team: string[];
  inventory: Partial<Record<ItemId, number>>;
  bugdex: Record<string, DexEntry>;
  routeDefeats: Record<string, number>;
  unlockedRoutes: string[];
  badges: string[];
  activity: Activity;
  settings: Settings;
  totals: { defeats: number; captures: number; playTimeMs: number };
  /** "From Transistor to Cloud" houses where boxed bugs farm. */
  houses: House[];
  /** Type stones for evolving and refining. */
  stones: StoneWallet;
  /** Play time (ms) when the egg in each hatchery slot started, or null. */
  hatchery: (number | null)[];
  nextUid: number;
}

/** Transient state, rebuilt on load. */
export interface RuntimeState {
  battle: Battle | null;
  spawnTimerMs: number;
  /** While positive the team is rebooting after a wipe. */
  recoveryMs: number;
  potionCooldownMs: number;
  /** Trap throws in the current encounter. */
  captureAttemptsThisBattle: number;
}

export interface GameState extends PersistentState {
  runtime: RuntimeState;
}

export const STARTER_IDS = ["typobit", "leaklet", "pixelmite"] as const;

export function createRuntime(): RuntimeState {
  return { battle: null, spawnTimerMs: 0, recoveryMs: 0, potionCooldownMs: 0, captureAttemptsThisBattle: 0 };
}

export function defaultSettings(): Settings {
  return {
    captureMode: "uncaught",
    alwaysCaptureShiny: true,
    preferredTrap: "breakpoint",
    autoPotion: true,
    potionThreshold: 0.4,
    autoEvolve: true,
  };
}

export function createInitialState(trainerName = "Hunter"): GameState {
  return {
    version: SAVE_VERSION,
    trainer: { name: trainerName, level: 1, xp: 0 },
    coins: 150,
    bugs: {},
    team: [],
    inventory: { breakpoint: 10, coffee: 5 },
    bugdex: {},
    routeDefeats: {},
    unlockedRoutes: ["port-3000"],
    badges: [],
    activity: { kind: "route", routeId: "port-3000" },
    settings: defaultSettings(),
    totals: { defeats: 0, captures: 0, playTimeMs: 0 },
    houses: [],
    stones: {},
    hatchery: [null, null],
    nextUid: 1,
    runtime: createRuntime(),
  };
}

export function nextUid(state: PersistentState): string {
  const uid = `bug-${state.nextUid}`;
  state.nextUid += 1;
  return uid;
}

export function teamBugs(state: GameState): BugInstance[] {
  return state.team.map((uid) => state.bugs[uid]).filter((b): b is BugInstance => b !== undefined);
}

export function needsStarter(state: GameState): boolean {
  return state.team.length === 0;
}
