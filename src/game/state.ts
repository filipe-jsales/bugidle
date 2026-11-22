import type { Battle } from "./battle";
import type { BugInstance } from "./bug";
import type { ItemId } from "./data/items";
import type { Trainer } from "./experience";
import type { House } from "./housing";
import type { StoneWallet } from "./stones";
import { defaultRules, type Rule } from "./rules";
import type { KnowledgeCard } from "./learning";
import { createGuild, type GuildState } from "./guild";

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
  /** Keep throwing traps until the bug is caught (no 3-trap limit). */
  throwUntilCaught: boolean;
  /** Use a Revive when the active bug falls in battle. */
  autoRevive: boolean;
  /** After a team wipe or a reboot, go straight back to hunting. */
  returnToHunt: boolean;
  /** Use the player's IF/THEN rules instead of the simple switches above. */
  useRules: boolean;
  /** Offer "debug to capture" challenges on special encounters. */
  debugChallenges: boolean;
}

/** Lifetime counters, used by achievements and the player card. */
export interface Totals {
  defeats: number;
  captures: number;
  playTimeMs: number;
  shinies: number;
  evolutions: number;
  hatched: number;
  refines: number;
}

export function emptyTotals(): Totals {
  return { defeats: 0, captures: 0, playTimeMs: 0, shinies: 0, evolutions: 0, hatched: 0, refines: 0 };
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
  totals: Totals;
  /** Achievement id -> play time (ms) when it was unlocked. */
  achievements: Record<string, number>;
  /** "From Transistor to Cloud" houses where boxed bugs farm. */
  houses: House[];
  /** Type stones for evolving and refining. */
  stones: StoneWallet;
  /** Play time (ms) when the egg in each hatchery slot started, or null. */
  hatchery: (number | null)[];
  /** Player-written automation rules (used when settings.useRules is on). */
  rules: Rule[];
  /** Spaced-repetition card per species the player has studied. */
  knowledge: Record<string, KnowledgeCard>;
  /** Day number of the last daily challenge done. */
  dailyDay: number | null;
  /** Best boss code review score (0-3), paid out when that boss is beaten. */
  bossReview: Record<string, number>;
  /** Guild of Algorithms: owned champions, the running raid and clears. */
  guild: GuildState;
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
  /** The team waits at the Reboot Center until the player sends it back. */
  atCenter: boolean;
  /** A "debug to capture" challenge waiting for the player; the fight pauses meanwhile. */
  debug: { speciesId: string; remainingMs: number } | null;
  /** Extra capture chance earned in this encounter (0.5 = +50%). */
  captureBonus: number;
  /** Play time when each species last offered a debug challenge. */
  debugOfferedAt: Record<string, number>;
}

export interface GameState extends PersistentState {
  runtime: RuntimeState;
}

export const STARTER_IDS = ["typobit", "leaklet", "pixelmite"] as const;

export function createRuntime(): RuntimeState {
  return { battle: null, spawnTimerMs: 0, recoveryMs: 0, potionCooldownMs: 0, captureAttemptsThisBattle: 0, atCenter: false, debug: null, captureBonus: 0, debugOfferedAt: {} };
}

export function defaultSettings(): Settings {
  return {
    captureMode: "uncaught",
    alwaysCaptureShiny: true,
    preferredTrap: "breakpoint",
    autoPotion: true,
    potionThreshold: 0.4,
    autoEvolve: true,
    throwUntilCaught: false,
    autoRevive: true,
    returnToHunt: true,
    useRules: false,
    debugChallenges: true,
  };
}

export function createInitialState(trainerName = "Hunter"): GameState {
  return {
    version: SAVE_VERSION,
    trainer: { name: trainerName, level: 1, xp: 0 },
    coins: 150,
    bugs: {},
    team: [],
    inventory: { breakpoint: 10, coffee: 5, revive: 2 },
    bugdex: {},
    routeDefeats: {},
    unlockedRoutes: ["port-3000"],
    badges: [],
    activity: { kind: "route", routeId: "port-3000" },
    settings: defaultSettings(),
    totals: emptyTotals(),
    achievements: {},
    houses: [],
    stones: {},
    hatchery: [null, null],
    rules: defaultRules(),
    knowledge: {},
    dailyDay: null,
    bossReview: {},
    guild: createGuild(),
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
