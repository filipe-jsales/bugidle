import { LESSON_WHY, REGION_TOPICS } from "../../i18n/learning.ptBR";
import { LESSONS, lessonFor } from "./lessons";
import { SPECIES } from "./species";
import { REGIONS } from "./world";

describe("lessons", () => {
  it("every species has exactly one lesson with an explanation", () => {
    for (const species of SPECIES) {
      expect(lessonFor(species.id), species.id).toBeDefined();
      expect(LESSON_WHY[species.id]?.length, species.id).toBeGreaterThan(20);
    }
    expect(LESSONS).toHaveLength(SPECIES.length);
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
