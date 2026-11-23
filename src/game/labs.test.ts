import { LAB_QUESTIONS, LAB_TOPICS, labQuestionsOf } from "./data/labs";
import { answerLab, LAB_REWARD, labProgress } from "./labs";
import { exportSave, importSave } from "./save";
import { stateWith } from "./testUtils";
import { LAB_TEXT, LAB_TOPIC_TEXT } from "../i18n/labs.ptBR";

describe("labs", () => {
  it("every topic has questions, and every question has text, options or pieces", () => {
    for (const topic of LAB_TOPICS) {
      expect(labQuestionsOf(topic).length, topic).toBeGreaterThanOrEqual(4);
      expect(LAB_TOPIC_TEXT[topic].name).toBeTruthy();
    }
    expect(new Set(LAB_QUESTIONS.map((q) => q.id)).size).toBe(LAB_QUESTIONS.length);
    for (const q of LAB_QUESTIONS) {
      const text = LAB_TEXT[q.id];
      expect(text?.prompt.length, q.id).toBeGreaterThan(10);
      expect(text?.explain.length, q.id).toBeGreaterThan(20);
      if (q.kind === "choice") {
        const options = q.codeOptions ?? text?.options ?? [];
        expect(options.length, q.id).toBeGreaterThanOrEqual(3);
        expect(q.answer).toBeLessThan(options.length);
      } else {
        expect((q.codeItems ?? text?.items ?? []).length, q.id).toBeGreaterThanOrEqual(3);
      }
    }
  });

  it("pay once, on the first right answer, and keep the score in the save", () => {
    const state = stateWith(["leaklet", 5]);
    const coins = state.coins;
    expect(answerLab(state, "sql-and", false)).toBe(0);
    expect(answerLab(state, "sql-and", true)).toBe(LAB_REWARD);
    expect(answerLab(state, "sql-and", true)).toBe(0);
    expect(state.coins).toBe(coins + LAB_REWARD);
    expect(state.labs["sql-and"]).toEqual({ solved: true, tries: 3, wrong: 1 });
    expect(labProgress(state, "sql")).toEqual({ solved: 1, total: labQuestionsOf("sql").length });
    expect(answerLab(state, "nope", true)).toBe(0);
    expect(importSave(exportSave(state)).labs["sql-and"]).toEqual({ solved: true, tries: 3, wrong: 1 });
  });

  it("pay more after badges", () => {
    const state = stateWith(["leaklet", 5]);
    state.badges.push("badge-localhost");
    expect(answerLab(state, "git-branch", true)).toBe(LAB_REWARD * 2);
  });
});
