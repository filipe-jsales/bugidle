/**
 * Guild of Algorithms. Champions are sorting and searching algorithms; raids
 * are jobs with a size n and traits. A raid takes as long as the champion's
 * real operation count for that input, so picking the right algorithm (Big-O,
 * best and worst cases, memory) is the whole game. Time is play time.
 */
import { fail, OK, type ActionResult } from "./result";
import type { PersistentState } from "./state";

export type JobKind = "sort" | "search";

export interface RaidTraits {
  nearlySorted?: boolean;
  sorted?: boolean;
  /** Values come from a small range (ages, grades). */
  smallRange?: boolean;
}

export interface RaidDef {
  id: string;
  kind: JobKind;
  n: number;
  /** Number of lookups, for search raids. */
  queries?: number;
  traits: RaidTraits;
  /** Extra memory cells the champion may use. */
  memoryLimit: number;
  /** Coins per minute when the best algorithm does the job; sets the reward. */
  ratePerMin: number;
}

export interface ChampionDef {
  id: string;
  kind: JobKind;
  cost: number;
  /** Big-O labels: [best, average, worst, memory]. */
  bigO: readonly [string, string, string, string];
  /** Operations for this raid, or null when the algorithm cannot do it. */
  ops: (raid: RaidDef) => number | null;
  /** Extra memory cells it needs for this raid. */
  memory: (raid: RaidDef) => number;
}

/** Simulated speed of the guild's computer (slow on purpose: raids are idle jobs). */
export const OPS_PER_SECOND = 400;
export const MIN_RAID_MS = 60_000;
const COUNTING_RANGE = 1000;
const log2 = (n: number) => Math.max(1, Math.log2(n));

export const CHAMPIONS: readonly ChampionDef[] = [
  { id: "bubbleSort", kind: "sort", cost: 0, bigO: ["O(n)", "O(n²)", "O(n²)", "O(1)"], ops: (r) => (r.traits.sorted ? r.n : (r.n * r.n) / 2), memory: () => 1 },
  {
    id: "insertionSort",
    kind: "sort",
    cost: 800,
    bigO: ["O(n)", "O(n²)", "O(n²)", "O(1)"],
    ops: (r) => (r.traits.sorted || r.traits.nearlySorted ? 2 * r.n : (r.n * r.n) / 4),
    memory: () => 1,
  },
  { id: "mergeSort", kind: "sort", cost: 3000, bigO: ["O(n log n)", "O(n log n)", "O(n log n)", "O(n)"], ops: (r) => r.n * log2(r.n), memory: (r) => r.n },
  {
    id: "quickSort",
    kind: "sort",
    cost: 5000,
    bigO: ["O(n log n)", "O(n log n)", "O(n²)", "O(log n)"],
    ops: (r) => (r.traits.sorted ? (r.n * r.n) / 2 : 1.4 * r.n * log2(r.n)),
    memory: (r) => Math.ceil(log2(r.n)),
  },
  { id: "heapSort", kind: "sort", cost: 8000, bigO: ["O(n log n)", "O(n log n)", "O(n log n)", "O(1)"], ops: (r) => 2 * r.n * log2(r.n), memory: () => 1 },
  {
    id: "countingSort",
    kind: "sort",
    cost: 12000,
    bigO: ["O(n + k)", "O(n + k)", "O(n + k)", "O(k)"],
    ops: (r) => (r.traits.smallRange ? 2 * r.n + COUNTING_RANGE : null),
    memory: () => COUNTING_RANGE,
  },
  { id: "linearSearch", kind: "search", cost: 0, bigO: ["O(1)", "O(n)", "O(n)", "O(1)"], ops: (r) => (r.queries ?? 1) * (r.n / 2), memory: () => 1 },
  {
    id: "binarySearch",
    kind: "search",
    cost: 2000,
    bigO: ["O(1)", "O(log n)", "O(log n)", "O(1)"],
    ops: (r) => (r.traits.sorted ? (r.queries ?? 1) * log2(r.n) : null),
    memory: () => 1,
  },
  { id: "hashTable", kind: "search", cost: 6000, bigO: ["O(1)", "O(1)", "O(n)", "O(n)"], ops: (r) => r.n + (r.queries ?? 1), memory: (r) => r.n },
];

const BIG = 1e12;

// prettier-ignore
export const RAIDS: readonly RaidDef[] = [
  { id: "sortGrades", kind: "sort", n: 100, traits: {}, memoryLimit: BIG, ratePerMin: 10 },
  { id: "findName", kind: "search", n: 5_000, queries: 1, traits: {}, memoryLimit: BIG, ratePerMin: 12 },
  { id: "almostSorted", kind: "sort", n: 20_000, traits: { nearlySorted: true }, memoryLimit: BIG, ratePerMin: 20 },
  { id: "leaderboard", kind: "sort", n: 50_000, traits: {}, memoryLimit: BIG, ratePerMin: 35 },
  { id: "phoneBook", kind: "search", n: 1_000_000, queries: 200, traits: { sorted: true }, memoryLimit: BIG, ratePerMin: 45 },
  { id: "tinyMemory", kind: "sort", n: 50_000, traits: {}, memoryLimit: 64, ratePerMin: 60 },
  { id: "alreadySorted", kind: "sort", n: 50_000, traits: { sorted: true, nearlySorted: true }, memoryLimit: 64, ratePerMin: 80 },
  { id: "manyLookups", kind: "search", n: 100_000, queries: 100_000, traits: {}, memoryLimit: BIG, ratePerMin: 110 },
  { id: "censusAges", kind: "sort", n: 1_000_000, traits: { smallRange: true }, memoryLimit: 5_000, ratePerMin: 150 },
];

export interface GuildState {
  owned: string[];
  raid: { raidId: string; championId: string; startedAt: number; durationMs: number } | null;
  clears: Record<string, number>;
  autoRepeat: boolean;
}

export function createGuild(): GuildState {
  return { owned: ["bubbleSort", "linearSearch"], raid: null, clears: {}, autoRepeat: true };
}

const byId = <T extends { id: string }>(list: readonly T[], id: string): T => {
  const found = list.find((x) => x.id === id);
  if (!found) throw new Error(`Unknown guild id: ${id}`);
  return found;
};
export const getChampion = (id: string) => byId(CHAMPIONS, id);
export const getRaid = (id: string) => byId(RAIDS, id);

/** A raid opens once the previous one in the list was cleared. */
export function isRaidUnlocked(guild: GuildState, raidId: string): boolean {
  const index = RAIDS.findIndex((r) => r.id === raidId);
  return index <= 0 || (guild.clears[RAIDS[index - 1]!.id] ?? 0) > 0;
}

export type Fit = { ok: true; ops: number; ms: number } | { ok: false; reason: "wrongKind" | "cannot" | "memory" };

/** Whether a champion can run a raid, and how long it would take. */
export function evaluate(championId: string, raidId: string): Fit {
  const champion = getChampion(championId);
  const raid = getRaid(raidId);
  if (champion.kind !== raid.kind) return { ok: false, reason: "wrongKind" };
  const ops = champion.ops(raid);
  if (ops === null) return { ok: false, reason: "cannot" };
  if (champion.memory(raid) > raid.memoryLimit) return { ok: false, reason: "memory" };
  return { ok: true, ops: Math.round(ops), ms: Math.max(MIN_RAID_MS, Math.round((ops / OPS_PER_SECOND) * 1000)) };
}

/** Fastest any champion can finish this raid. */
export function bestPossibleMs(raidId: string): number {
  return Math.min(...CHAMPIONS.map((c) => evaluate(c.id, raidId)).map((f) => (f.ok ? f.ms : Infinity)));
}

/** Coins for one clear: the raid's rate times the best possible time, so a good pick earns the most per minute. */
export function raidReward(raidId: string): number {
  return Math.round((getRaid(raidId).ratePerMin * bestPossibleMs(raidId)) / 60_000);
}

/** The champion the player owns that would finish fastest, for hints. */
export function bestOwned(guild: GuildState, raidId: string): string | null {
  let best: { id: string; ms: number } | null = null;
  for (const id of guild.owned) {
    const fit = evaluate(id, raidId);
    if (fit.ok && (!best || fit.ms < best.ms)) best = { id, ms: fit.ms };
  }
  return best?.id ?? null;
}

export function recruit(state: PersistentState, championId: string): ActionResult {
  const champion = getChampion(championId);
  if (state.guild.owned.includes(championId)) return fail("alreadyOwned");
  if (state.coins < champion.cost) return fail("notEnoughCoins");
  state.coins -= champion.cost;
  state.guild.owned.push(championId);
  return OK;
}

export function startRaid(state: PersistentState, raidId: string, championId: string): ActionResult {
  const guild = state.guild;
  if (guild.raid) return fail("raidRunning");
  if (!guild.owned.includes(championId)) return fail("notOwned");
  if (!isRaidUnlocked(guild, raidId)) return fail("raidLocked");
  const fit = evaluate(championId, raidId);
  if (!fit.ok) return fail("cannotRun");
  guild.raid = { raidId, championId, startedAt: state.totals.playTimeMs, durationMs: fit.ms };
  return OK;
}

export function stopRaid(state: PersistentState): ActionResult {
  state.guild.raid = null;
  return OK;
}

export function raidProgress(state: PersistentState): number {
  const raid = state.guild.raid;
  if (!raid) return 0;
  return Math.min(1, (state.totals.playTimeMs - raid.startedAt) / raid.durationMs);
}

export interface RaidResult {
  raidId: string;
  championId: string;
  coins: number;
  firstClear: boolean;
}

/** Pays finished raids. First clears pay triple. With auto repeat, the same raid starts again. */
export function tickGuild(state: PersistentState): RaidResult | null {
  const guild = state.guild;
  const raid = guild.raid;
  if (!raid || state.totals.playTimeMs - raid.startedAt < raid.durationMs) return null;
  const def = getRaid(raid.raidId);
  const firstClear = (guild.clears[raid.raidId] ?? 0) === 0;
  const coins = raidReward(def.id) * (firstClear ? 3 : 1);
  state.coins += coins;
  guild.clears[raid.raidId] = (guild.clears[raid.raidId] ?? 0) + 1;
  const again = evaluate(raid.championId, raid.raidId);
  guild.raid = guild.autoRepeat && again.ok ? { ...raid, startedAt: state.totals.playTimeMs, durationMs: again.ms } : null;
  return { raidId: raid.raidId, championId: raid.championId, coins, firstClear };
}
