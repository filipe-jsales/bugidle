import { CONCEPTS } from "./data/concepts";
import { CLUE_COUNT, CLUE_POINTS, coinsForPoints, detectivePointsToday, isRightAnswer, normalizeAnswer, pickConcept, pointsForClue, solveConcept } from "./minigames";
import { exportSave, importSave } from "./save";
import { stateWith } from "./testUtils";
import { CATEGORY_TEXT, CONCEPT_TEXT, USE_TEXT } from "../i18n/concepts.ptBR";

const TODAY = 20_000;

describe("Detetive de Conceitos", () => {
  it("every concept has text, a riddle without its name, and valid traits", () => {
    expect(CONCEPTS.length).toBeGreaterThanOrEqual(20);
    expect(new Set(CONCEPTS.map((c) => c.id)).size).toBe(CONCEPTS.length);
    for (const c of CONCEPTS) {
      const text = CONCEPT_TEXT[c.id];
      expect(text, c.id).toBeDefined();
      expect(text!.what.length + text!.why.length + text!.where.length, c.id).toBeGreaterThan(80);
      const words = (t: string) => ` ${t.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, " ")} `;
      expect(words(text!.riddle).includes(words(text!.name)), `${c.id} riddle gives the name away`).toBe(false);
      for (const v of Object.values(c.traits)) expect(v).toBeGreaterThanOrEqual(0);
      for (const v of Object.values(c.traits)) expect(v).toBeLessThanOrEqual(100);
      for (const cat of c.categories) expect(CATEGORY_TEXT[cat]).toBeTruthy();
      for (const use of c.uses) expect(USE_TEXT[use]).toBeTruthy();
    }
  });

  it("no two concepts accept the same answer", () => {
    const seen = new Map<string, string>();
    for (const c of CONCEPTS) {
      for (const answer of [CONCEPT_TEXT[c.id]!.name, ...CONCEPT_TEXT[c.id]!.aliases]) {
        const key = normalizeAnswer(answer);
        expect(seen.get(key) ?? c.id, `"${answer}"`).toBe(c.id);
        seen.set(key, c.id);
      }
    }
  });

  it("accepts answers with any case, accents or spaces", () => {
    expect(normalizeAnswer("  Variável! ")).toBe("variavel");
    expect(isRightAnswer("variavel", ["Variável"])).toBe(true);
    expect(isRightAnswer("JavaScript", ["JavaScript", "JS"])).toBe(true);
    expect(isRightAnswer("java", ["JavaScript", "JS"])).toBe(false);
    expect(isRightAnswer("   ", ["x"])).toBe(false);
  });

  it("fewer clues pay more; the last clue still pays a little", () => {
    expect(CLUE_POINTS).toHaveLength(CLUE_COUNT);
    for (let i = 1; i < CLUE_COUNT; i++) expect(pointsForClue(i)).toBeLessThan(pointsForClue(i - 1));
    expect(pointsForClue(CLUE_COUNT - 1)).toBeGreaterThan(0);
    const state = stateWith(["leaklet", 5]);
    expect(coinsForPoints(state, 10)).toBeGreaterThan(coinsForPoints(state, 2));
  });

  it("each concept pays once a day, and today's points add up", () => {
    const state = stateWith(["leaklet", 5]);
    const coins = state.coins;
    expect(solveConcept(state, "linux", 0, TODAY)).toEqual({ points: 10, coins: coinsForPoints(state, 10) });
    expect(solveConcept(state, "linux", 0, TODAY)).toEqual({ points: 0, coins: 0 });
    expect(solveConcept(state, "git", 3, TODAY).points).toBe(4);
    expect(detectivePointsToday(state, TODAY)).toBe(14);
    expect(detectivePointsToday(state, TODAY + 1)).toBe(0);
    expect(solveConcept(state, "linux", 1, TODAY + 1).points).toBe(8);
    expect(state.coins).toBeGreaterThan(coins);
    expect(state.minigames.detective.solved).toBe(4);
    expect(importSave(exportSave(state)).minigames.detective).toEqual(state.minigames.detective);
  });

  it("picks a concept that has not paid today, never the one just played", () => {
    const state = stateWith(["leaklet", 5]);
    for (const c of CONCEPTS.slice(1)) state.minigames.detective.paid[c.id] = TODAY;
    expect(pickConcept(state, TODAY, 1)).toBe(CONCEPTS[0]!.id);
    expect(pickConcept(state, TODAY, 1, CONCEPTS[0]!.id)).not.toBe(CONCEPTS[0]!.id);
  });
});
