import { LESSON_WHY, REGION_TOPICS } from "../../i18n/learning.ptBR";
import { fixedLines, LESSONS, lessonFor, lessonsFor } from "./lessons";
import { SPECIES } from "./species";
import { REGIONS } from "./world";

describe("lessons", () => {
  it("every species has two lessons, each with an explanation, and unique ids", () => {
    for (const species of SPECIES) {
      expect(lessonFor(species.id)?.id, species.id).toBe(species.id);
      expect(lessonsFor(species.id), species.id).toHaveLength(2);
      for (const lesson of lessonsFor(species.id)) expect(LESSON_WHY[lesson.id]?.length, lesson.id).toBeGreaterThan(20);
    }
    expect(LESSONS).toHaveLength(SPECIES.length * 2);
    expect(new Set(LESSONS.map((l) => l.id)).size).toBe(LESSONS.length);
  });

  it("fixedLines replaces only the bad line", () => {
    const lesson = lessonFor("offbyone")!;
    const fixed = fixedLines(lesson);
    expect(fixed[lesson.badLine]).toBe(lesson.fix);
    expect(fixed.filter((line, i) => line !== lesson.lines[i])).toHaveLength(1);
  });

  it("the bad line exists and the fix changes it", () => {
    for (const lesson of LESSONS) {
      expect(lesson.badLine).toBeGreaterThanOrEqual(0);
      expect(lesson.badLine).toBeLessThan(lesson.lines.length);
      expect(lesson.fix.trim(), lesson.speciesId).not.toBe(lesson.lines[lesson.badLine]!.trim());
    }
  });

  it("every region lists what it teaches", () => {
    for (const region of REGIONS) expect(REGION_TOPICS[region.id]?.topics.length).toBeGreaterThan(2);
  });
});
