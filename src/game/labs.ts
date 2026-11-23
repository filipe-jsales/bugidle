/**
 * Lab results: each challenge pays coins the first time it is answered right
 * (more after each badge, like the daily challenge). Retrying is always allowed.
 */
import { labQuestion, labQuestionsOf, type LabTopic } from "./data/labs";
import type { PersistentState } from "./state";

export const LAB_REWARD = 150;

export interface LabResult {
  /** Solved right at least once. */
  solved: boolean;
  tries: number;
  /** Wrong answers, for the teacher report. */
  wrong: number;
}

/** Records an answer. Returns the coins paid (only the first right answer pays). */
export function answerLab(state: PersistentState, questionId: string, right: boolean): number {
  if (!labQuestion(questionId)) return 0;
  const before = state.labs[questionId] ?? { solved: false, tries: 0, wrong: 0 };
  const firstSolve = right && !before.solved;
  state.labs[questionId] = { solved: before.solved || right, tries: before.tries + 1, wrong: before.wrong + (right ? 0 : 1) };
  if (!firstSolve) return 0;
  const coins = LAB_REWARD * (state.badges.length + 1);
  state.coins += coins;
  return coins;
}

export function labProgress(state: PersistentState, topic: LabTopic): { solved: number; total: number } {
  const questions = labQuestionsOf(topic);
  return { solved: questions.filter((q) => state.labs[q.id]?.solved).length, total: questions.length };
}
