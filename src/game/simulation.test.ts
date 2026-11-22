import { simulatePlaythrough } from "./simulation";

// Pacing guard: if a change makes the game much faster or slower, this fails.
// Tune with `npm run simulate` and update the bounds on purpose.
describe("balance (simulated playthrough)", () => {
  for (const seed of [1, 2]) {
    it(`is completable at a steady pace (seed ${seed})`, () => {
      const report = simulatePlaythrough({ seed });
      expect(report.finished).toBe(true);
      expect(report.minutes).toBeGreaterThan(6 * 60);
      expect(report.minutes).toBeLessThan(16 * 60);
      const first = report.regions[0]!.clearedAtMin!;
      expect(first).toBeGreaterThan(20);
      expect(first).toBeLessThan(120);
      const cleared = report.regions.map((r) => r.clearedAtMin!);
      for (let i = 1; i < cleared.length; i++) expect(cleared[i]).toBeGreaterThan(cleared[i - 1]!);
      expect(report.caught).toBeGreaterThanOrEqual(30);
    }, 30_000);
  }
});
