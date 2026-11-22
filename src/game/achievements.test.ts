import { ACHIEVEMENTS, achievementProgress, checkAchievements, isUnlocked } from "./achievements";
import { tick } from "./engine";
import { createSeededRng } from "./rng";
import { exportSave, importSave } from "./save";
import { stateWith } from "./testUtils";
import { ACHIEVEMENT_GROUPS, ACHIEVEMENT_TEXT } from "../i18n/achievements.ptBR";

describe("achievements", () => {
  it("have unique ids, positive goals and rewards, and text", () => {
    expect(new Set(ACHIEVEMENTS.map((a) => a.id)).size).toBe(ACHIEVEMENTS.length);
    for (const a of ACHIEVEMENTS) {
      expect(a.goal, a.id).toBeGreaterThan(0);
      expect(a.reward, a.id).toBeGreaterThan(0);
      expect(ACHIEVEMENT_TEXT[a.id]?.name, a.id).toBeTruthy();
      expect(ACHIEVEMENT_GROUPS[a.group]).toBeTruthy();
    }
  });

  it("unlock once when the goal is met and pay their coins once", () => {
    const state = stateWith(["leaklet", 10]);
    state.totals.defeats = 99;
    expect(checkAchievements(state)).not.toContain("defeat100");
    state.totals.defeats = 100;
    const coins = state.coins;
    expect(checkAchievements(state)).toContain("defeat100");
    expect(state.coins).toBe(coins + ACHIEVEMENTS.find((a) => a.id === "defeat100")!.reward);
    expect(isUnlocked(state, "defeat100")).toBe(true);
    expect(checkAchievements(state)).not.toContain("defeat100");
    expect(state.coins).toBe(coins + ACHIEVEMENTS.find((a) => a.id === "defeat100")!.reward);
  });

  it("report progress capped at the goal", () => {
    const state = stateWith(["leaklet", 10]);
    const def = ACHIEVEMENTS.find((a) => a.id === "defeat1000")!;
    state.totals.defeats = 250;
    expect(achievementProgress(state, def)).toEqual({ value: 250, ratio: 0.25 });
    state.totals.defeats = 5000;
    expect(achievementProgress(state, def).ratio).toBe(1);
  });

  it("the idle loop emits an event when one unlocks, and the save keeps it", () => {
    const state = stateWith(["typobit", 30]);
    state.totals.defeats = 99;
    const events = tick(state, 120_000, createSeededRng(3));
    expect(events.some((e) => e.type === "achievement" && e.id === "defeat100")).toBe(true);
    const loaded = importSave(exportSave(state));
    expect(isUnlocked(loaded, "defeat100")).toBe(true);
    expect(loaded.totals.defeats).toBe(state.totals.defeats);
  });
});
