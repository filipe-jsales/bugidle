/**
 * Mini games. Every game ends with 0-100 points (`finishGame`): the first plays
 * of the day pay coins and every play goes to the local ranking (top 5 per game).
 * The Detetive de Conceitos also has its own rules below: guess a concept from
 * clues that unlock one by one; each concept pays once per day.
 */
import { CONCEPTS } from "./data/concepts";
import { createSeededRng } from "./rng";
import type { PersistentState } from "./state";

/** Points for a right answer at each clue (index 0 = first clue). */
export const CLUE_POINTS = [10, 8, 6, 4, 2] as const;
export const CLUE_COUNT = CLUE_POINTS.length;
/** Seconds before the next clue opens by itself. */
export const CLUE_SECONDS = 30;
export const COINS_PER_POINT = 15;

export interface DetectiveRecord {
  /** Day number of `points`. */
  day: number;
  /** Points earned today. */
  points: number;
  /** Concept id -> last day it paid. */
  paid: Record<string, number>;
  /** Concepts guessed right, ever. */
  solved: number;
}

export const GAME_IDS = [
  "detective",
  "wordSearch",
  "crossword",
  "hangman",
  "anagram",
  "memory",
  "language",
  "output",
  "binary",
  "pixel",
  "robot",
  "gates",
  "trueFalse",
  "typing",
  "pipes",
  "structures",
  "codeRain",
] as const;
export type GameId = (typeof GAME_IDS)[number];

/** Plays per game and day that pay coins; later plays only count for the ranking. */
export const PAID_PLAYS_PER_DAY = 3;
/** Coins per point of a finished game (times badges + 1). */
export const GAME_COINS_PER_POINT = 3;
export const RANKING_SIZE = 5;

export interface RankEntry {
  score: number;
  /** Day number of the play. */
  day: number;
}

export interface GameRecord {
  /** Best plays, highest first. */
  ranking: RankEntry[];
  /** Day number of `playsToday`. */
  day: number;
  playsToday: number;
  plays: number;
}

export interface MiniGamesState {
  detective: DetectiveRecord;
  games: Partial<Record<GameId, GameRecord>>;
}

export function createMiniGames(): MiniGamesState {
  return { detective: { day: -1, points: 0, paid: {}, solved: 0 }, games: {} };
}

export function isGameId(value: unknown): value is GameId {
  return typeof value === "string" && (GAME_IDS as readonly string[]).includes(value);
}

export function bestScore(state: PersistentState, game: GameId): number | null {
  return state.minigames.games[game]?.ranking[0]?.score ?? null;
}

/** Paid plays left today for a game. */
export function paidPlaysLeft(state: PersistentState, game: GameId, today: number): number {
  const record = state.minigames.games[game];
  return record && record.day === today ? Math.max(0, PAID_PLAYS_PER_DAY - record.playsToday) : PAID_PLAYS_PER_DAY;
}

/**
 * Ends a play with 0-100 points: pays coins while the day still has paid plays,
 * and puts the score in the game's local ranking. Returns the coins, whether it
 * is a new best and its place in the ranking (1-based, 0 when it did not enter).
 */
/** The game of the day pays this many times the coins. */
export const FEATURED_MULTIPLIER = 2;

/** One game per day (never the detective, which has its own daily rule), in turns so it changes every day. */
export function featuredGame(today: number): GameId {
  const pool = GAME_IDS.filter((g) => g !== "detective");
  return pool[((today % pool.length) + pool.length) % pool.length]!;
}

export function finishGame(state: PersistentState, game: GameId, points: number, today: number, pay = true): { coins: number; best: boolean; place: number; featured: boolean } {
  const score = Math.max(0, Math.min(100, Math.round(points)));
  const record = state.minigames.games[game] ?? { ranking: [], day: today, playsToday: 0, plays: 0 };
  if (record.day !== today) {
    record.day = today;
    record.playsToday = 0;
  }
  const paid = pay && record.playsToday < PAID_PLAYS_PER_DAY;
  record.playsToday += 1;
  record.plays += 1;
  const previousBest = record.ranking[0]?.score ?? -1;
  const entry = { score, day: today };
  record.ranking = [...record.ranking, entry].sort((a, b) => b.score - a.score || b.day - a.day).slice(0, RANKING_SIZE);
  state.minigames.games[game] = record;
  const featured = game === featuredGame(today);
  const coins = paid ? score * GAME_COINS_PER_POINT * (state.badges.length + 1) * (featured ? FEATURED_MULTIPLIER : 1) : 0;
  state.coins += coins;
  return { coins, best: score > previousBest, place: record.ranking.indexOf(entry) + 1, featured };
}

/** Lowercase, no accents, letters and digits only: "Variável!" -> "variavel". */
export function normalizeAnswer(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
}

/** True when the guess is the concept's name or one of its accepted answers. */
export function isRightAnswer(guess: string, answers: readonly string[]): boolean {
  const g = normalizeAnswer(guess);
  return g.length > 0 && answers.some((a) => normalizeAnswer(a) === g);
}

export function pointsForClue(clue: number): number {
  return CLUE_POINTS[Math.max(0, Math.min(CLUE_COUNT - 1, clue))]!;
}

export function coinsForPoints(state: PersistentState, points: number): number {
  return points * COINS_PER_POINT * (state.badges.length + 1);
}

/** Today's points (zero on a new day). */
export function detectivePointsToday(state: PersistentState, today: number): number {
  return state.minigames.detective.day === today ? state.minigames.detective.points : 0;
}

/** A concept for the next round: one that has not paid today, if any is left. */
export function pickConcept(state: PersistentState, today: number, seed: number, exclude?: string): string {
  const paid = state.minigames.detective.paid;
  const fresh = CONCEPTS.filter((c) => paid[c.id] !== today && c.id !== exclude);
  const pool = fresh.length > 0 ? fresh : CONCEPTS.filter((c) => c.id !== exclude);
  const rng = createSeededRng(seed * 7919 + today);
  return pool[Math.floor(rng() * pool.length)]!.id;
}

/**
 * A right answer at clue `clue` (0-based). Pays coins and points the first
 * time the concept is solved today; later the same day it only counts as solved.
 */
export function solveConcept(state: PersistentState, conceptId: string, clue: number, today: number): { points: number; coins: number } {
  const record = state.minigames.detective;
  if (record.day !== today) {
    record.day = today;
    record.points = 0;
  }
  record.solved += 1;
  if (record.paid[conceptId] === today) return { points: 0, coins: 0 };
  record.paid[conceptId] = today;
  const points = pointsForClue(clue);
  const coins = coinsForPoints(state, points);
  record.points += points;
  state.coins += coins;
  return { points, coins };
}
