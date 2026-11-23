/**
 * Mini games. The first one is "Detetive de Conceitos": guess a computing
 * concept from clues that unlock one by one (a wrong guess or the clue timer
 * opens the next one). Fewer clues = more points = more coins. Each concept
 * pays once per day, so the game rewards learning, not farming.
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

export interface MiniGamesState {
  detective: DetectiveRecord;
}

export function createMiniGames(): MiniGamesState {
  return { detective: { day: -1, points: 0, paid: {}, solved: 0 } };
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
