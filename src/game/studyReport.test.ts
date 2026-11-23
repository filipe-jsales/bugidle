import { answerLab } from "./labs";
import { recordAnswer } from "./learning";
import { studyReport } from "./studyReport";
import { stateWith } from "./testUtils";
import { teacherReportText } from "../ui/teacherReport";

describe("study report (teacher mode)", () => {
  it("adds up answers by region topic and lab topic", () => {
    const state = stateWith(["leaklet", 5]);
    recordAnswer(state, "typobit", true, 100);
    recordAnswer(state, "typobit", false, 100);
    recordAnswer(state, "nullit", true, 100);
    answerLab(state, "sql-and", false);
    answerLab(state, "sql-and", true);
    const report = studyReport(state);
    expect(report.right).toBe(2);
    expect(report.wrong).toBe(1);
    const localhost = report.topics.find((t) => t.regionId === "localhost")!;
    expect(localhost.studied).toBe(2);
    expect(localhost.boxes[0]).toBe(2); // a first right answer and a wrong one both sit in box 1
    expect(localhost.weakest).toContain("typobit");
    const sql = report.labs.find((l) => l.topic === "sql")!;
    expect(sql).toMatchObject({ solved: 1, tries: 2, wrong: 1 });
  });

  it("writes a readable text report", () => {
    const state = stateWith(["leaklet", 5]);
    recordAnswer(state, "typobit", true, 100);
    const text = teacherReportText(state, new Date(2026, 10, 22));
    expect(text).toContain("RELATÓRIO");
    expect(text).toContain("Localhost");
    expect(text).toContain("Laboratório de SQL");
  });
});
