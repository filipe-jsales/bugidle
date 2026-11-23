/**
 * Learning features built on the lessons: spaced repetition (Leitner boxes),
 * the daily challenge and the optional code review before a boss.
 * Days are counted as whole UTC days so the rules are easy to test.
 */
import { addItem } from "./inventory";
import { fixedLines, lessonFor, lessonsFor, LESSONS, type Lesson } from "./data/lessons";
import { getSpecies, SPECIES } from "./data/species";
import { getBoss, routesOfRegion } from "./data/world";
import type { PersistentState } from "./state";

export const MAX_BOX = 5;
export const DAILY_QUESTIONS = 3;
export const DAILY_COINS_PER_CORRECT = 60;
/** Each right answer in a boss review adds this share of the boss prize. */
export const REVIEW_BONUS_PER_CORRECT = 0.2;
export const REVIEW_QUESTIONS = 3;

export interface KnowledgeCard {
  /** Leitner box, 1 (new or forgotten) to 5 (well known). */
  box: number;
  /** Day number when it should be reviewed again. */
  due: number;
  /** Answers so far (picks which lesson comes next) and how many were right or wrong. */
  seen?: number;
  right?: number;
  wrong?: number;
}

/** Study streak: each day in a row adds this much to the daily coins, up to STREAK_MAX_BONUS. */
export const STREAK_BONUS_PER_DAY = 0.1;
export const STREAK_MAX_BONUS = 1;

export interface StudyStreak {
  /** Days in a row with the daily challenge done. */
  days: number;
  /** Day number of the last challenge done, or null. */
  lastDay: number | null;
  best: number;
}

/** Current streak as seen today: it is lost after a day without studying. */
export function currentStreak(state: PersistentState, today: number): number {
  const s = state.studyStreak;
  return s.lastDay !== null && today - s.lastDay <= 1 ? s.days : 0;
}

/** Coin multiplier for a streak of `days` (1 day = no bonus). */
export function streakMultiplier(days: number): number {
  return 1 + Math.min(STREAK_MAX_BONUS, Math.max(0, days - 1) * STREAK_BONUS_PER_DAY);
}

/** Points for ordering the fixed code in the daily challenge. */
export const DAILY_ORDER_COINS = 60;

export function dayNumber(date: Date): number {
  return Math.floor(date.getTime() / 86_400_000);
}

/** Days until the next review for a box: 1, 2, 4, 8, 16. */
export function intervalFor(box: number): number {
  return Math.pow(2, Math.max(1, Math.min(MAX_BOX, box)) - 1);
}

/** Moves a species' card after an answer: up one box if right, back to box 1 if wrong. */
export function recordAnswer(state: PersistentState, speciesId: string, correct: boolean, today: number): KnowledgeCard {
  const current = state.knowledge[speciesId] ?? { box: 0, due: today };
  const box = correct ? Math.min(MAX_BOX, current.box + 1) : 1;
  const card: KnowledgeCard = {
    box,
    due: today + intervalFor(box),
    seen: (current.seen ?? 0) + 1,
    right: (current.right ?? 0) + (correct ? 1 : 0),
    wrong: (current.wrong ?? 0) + (correct ? 0 : 1),
  };
  state.knowledge[speciesId] = card;
  return card;
}

/** Lessons for today: due cards first (lowest box first), then seen bugs never studied. */
export function dailyLessons(state: PersistentState, today: number): Lesson[] {
  const seen = SPECIES.filter((s) => (state.bugdex[s.id]?.seen ?? 0) > 0 && lessonFor(s.id));
  const due = seen
    .filter((s) => state.knowledge[s.id] && state.knowledge[s.id]!.due <= today)
    .sort((a, b) => state.knowledge[a.id]!.box - state.knowledge[b.id]!.box || a.dex - b.dex);
  const fresh = seen.filter((s) => !state.knowledge[s.id]);
  return [...due, ...fresh].slice(0, DAILY_QUESTIONS).map((s) => reviewLesson(state, s.id)!);
}

/** The lesson a species shows next: the two lessons take turns. */
export function reviewLesson(state: PersistentState, speciesId: string): Lesson | undefined {
  const all = lessonsFor(speciesId);
  if (all.length === 0) return undefined;
  return all[(state.knowledge[speciesId]?.seen ?? 0) % all.length];
}

/**
 * Today's "put the code in order" puzzle: a fixed lesson of 3 or more lines
 * from a bug the player has seen, picked by the day so it changes daily.
 */
export function dailyOrderLesson(state: PersistentState, today: number): Lesson | undefined {
  const pool = LESSONS.filter((l) => l.lines.length >= 3 && (state.bugdex[l.speciesId]?.seen ?? 0) > 0);
  return pool.length > 0 ? pool[today % pool.length] : undefined;
}

/** True when `order` (indexes into the fixed lines) rebuilds the code exactly. */
export function isRightOrder(lesson: Lesson, order: readonly number[]): boolean {
  const lines = fixedLines(lesson);
  return order.length === lines.length && order.every((index, position) => lines[index] === lines[position]);
}

export function dailyAvailable(state: PersistentState, today: number): boolean {
  return state.dailyDay !== today && dailyLessons(state, today).length > 0;
}

/**
 * Grades the daily challenge. `answers` maps species to the picked line.
 * Coins per right answer, plus a Mystery Egg for a perfect score.
 */
export function finishDaily(state: PersistentState, answers: Record<string, number>, today: number, orderRight = false): { correct: number; coins: number; egg: boolean } {
  if (state.dailyDay === today) return { correct: 0, coins: 0, egg: false };
  const lessons = dailyLessons(state, today);
  let correct = 0;
  for (const lesson of lessons) {
    const right = answers[lesson.speciesId] === lesson.badLine;
    if (right) correct += 1;
    recordAnswer(state, lesson.speciesId, right, today);
  }
  const streak = state.studyStreak;
  streak.days = streak.lastDay === today - 1 ? streak.days + 1 : 1;
  streak.lastDay = today;
  streak.best = Math.max(streak.best, streak.days);
  const coins = Math.round((correct * DAILY_COINS_PER_CORRECT + (orderRight ? DAILY_ORDER_COINS : 0)) * (state.badges.length + 1) * streakMultiplier(streak.days));
  const egg = lessons.length > 0 && correct === lessons.length;
  state.coins += coins;
  if (egg) addItem(state, "mysteryEgg");
  state.dailyDay = today;
  return { correct, coins, egg };
}

/** Three lessons from the boss's own region: its team first, then the region's routes. */
export function bossReviewLessons(bossId: string): Lesson[] {
  const boss = getBoss(bossId);
  const ids = [...boss.team.map((m) => m.speciesId), ...routesOfRegion(boss.regionId).flatMap((r) => r.encounters.map((e) => e.speciesId))];
  const unique = [...new Set(ids)].filter((id) => getSpecies(id).rarity !== "legendary" && lessonFor(id));
  return unique.slice(0, REVIEW_QUESTIONS).map((id) => lessonFor(id)!);
}

/** Grades the review and keeps the best score until the boss is beaten. */
export function submitBossReview(state: PersistentState, bossId: string, answers: Record<string, number>, today: number): number {
  const lessons = bossReviewLessons(bossId);
  let correct = 0;
  for (const lesson of lessons) {
    const right = answers[lesson.speciesId] === lesson.badLine;
    if (right) correct += 1;
    recordAnswer(state, lesson.speciesId, right, today);
  }
  state.bossReview[bossId] = Math.max(state.bossReview[bossId] ?? 0, correct);
  return correct;
}

/** Bonus coins for a boss win, consuming the stored review score. */
export function claimReviewBonus(state: PersistentState, bossId: string, prize: number): number {
  const correct = state.bossReview[bossId] ?? 0;
  delete state.bossReview[bossId];
  return Math.floor(prize * REVIEW_BONUS_PER_CORRECT * correct);
}
