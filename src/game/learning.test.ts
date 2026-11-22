import { registerSeen } from "./bugdex";
import { lessonFor } from "./data/lessons";
import { getBoss } from "./data/world";
import { answerDebug, challengeBoss, tick } from "./engine";
import {
  bossReviewLessons,
  claimReviewBonus,
  DAILY_COINS_PER_CORRECT,
  dailyAvailable,
  dailyLessons,
  dayNumber,
  finishDaily,
  intervalFor,
  recordAnswer,
  REVIEW_BONUS_PER_CORRECT,
  submitBossReview,
} from "./learning";
import { createSeededRng } from "./rng";
import { exportSave, importSave } from "./save";
import { stateWith } from "./testUtils";

const TODAY = 20_000;

describe("spaced repetition (Leitner boxes)", () => {
  it("doubles the interval per box", () => {
    expect([1, 2, 3, 4, 5].map(intervalFor)).toEqual([1, 2, 4, 8, 16]);
  });

  it("moves up on a right answer and back to box 1 on a wrong one", () => {
    const state = stateWith(["leaklet", 5]);
    expect(recordAnswer(state, "nullit", true, TODAY)).toEqual({ box: 1, due: TODAY + 1 });
    expect(recordAnswer(state, "nullit", true, TODAY)).toEqual({ box: 2, due: TODAY + 2 });
    expect(recordAnswer(state, "nullit", false, TODAY)).toEqual({ box: 1, due: TODAY + 1 });
  });

  it("counts days in UTC", () => {
    expect(dayNumber(new Date("1970-01-02T12:00:00Z"))).toBe(1);
  });
});

describe("daily challenge", () => {
  function seenState() {
    const state = stateWith(["leaklet", 5]);
    for (const id of ["typobit", "nullit", "offbyone", "pixelmite"]) registerSeen(state, id);
    return state;
  }

  it("asks about bugs the player has seen, due ones first", () => {
    const state = seenState();
    state.knowledge.pixelmite = { box: 1, due: TODAY - 1 };
    state.knowledge.typobit = { box: 3, due: TODAY + 5 };
    const ids = dailyLessons(state, TODAY).map((l) => l.speciesId);
    expect(ids[0]).toBe("pixelmite");
    expect(ids).not.toContain("typobit");
    expect(ids).toHaveLength(3);
  });

  it("pays per right answer, gives an egg for a perfect score and runs once a day", () => {
    const state = seenState();
    const lessons = dailyLessons(state, TODAY);
    const answers = Object.fromEntries(lessons.map((l) => [l.speciesId, l.badLine]));
    const coins = state.coins;
    const result = finishDaily(state, answers, TODAY);
    expect(result).toEqual({ correct: 3, coins: 3 * DAILY_COINS_PER_CORRECT, egg: true });
    expect(state.coins).toBe(coins + result.coins);
    expect(state.inventory.mysteryEgg).toBe(1);
    expect(dailyAvailable(state, TODAY)).toBe(false);
    expect(finishDaily(state, answers, TODAY).coins).toBe(0);
    expect(dailyAvailable(state, TODAY + 1)).toBe(true);
  });

  it("is not available before the player has seen any bug", () => {
    const state = stateWith(["leaklet", 5]);
    state.bugdex = {};
    expect(dailyAvailable(state, TODAY)).toBe(false);
  });
});

describe("boss code review", () => {
  it("uses three lessons from the boss's region", () => {
    const lessons = bossReviewLessons("boss-localhost");
    expect(lessons).toHaveLength(3);
    expect(lessons[0]!.speciesId).toBe(getBoss("boss-localhost").team[0]!.speciesId);
  });

  it("keeps the best score and pays it as a bonus when the boss is beaten", () => {
    const state = stateWith(["heapocalypse", 60]);
    const lessons = bossReviewLessons("boss-localhost");
    const answers = Object.fromEntries(lessons.map((l, i) => [l.speciesId, i === 0 ? l.badLine + 1 : l.badLine]));
    expect(submitBossReview(state, "boss-localhost", answers, TODAY)).toBe(2);
    expect(submitBossReview(state, "boss-localhost", {}, TODAY)).toBe(0);
    expect(state.bossReview["boss-localhost"]).toBe(2);
    expect(claimReviewBonus(state, "boss-localhost", 1000)).toBe(1000 * REVIEW_BONUS_PER_CORRECT * 2);
    expect(state.bossReview["boss-localhost"]).toBeUndefined();
  });

  it("adds the bonus to the badge reward in the game loop", () => {
    const state = stateWith(["heapocalypse", 60]);
    state.unlockedRoutes.push("node-modules", "dev-console");
    state.bossReview["boss-localhost"] = 3;
    challengeBoss(state, "boss-localhost");
    const events = tick(state, 60_000, createSeededRng(1));
    const badge = events.find((e) => e.type === "badge");
    expect(badge && badge.type === "badge" && badge.coins).toBe(getBoss("boss-localhost").rewardCoins * (1 + 3 * REVIEW_BONUS_PER_CORRECT));
  });
});

describe("learning state", () => {
  it("a right debug answer also moves the knowledge card", () => {
    const state = stateWith(["heapocalypse", 20]);
    state.settings.debugChallenges = true;
    tick(state, 3000, createSeededRng(1));
    const species = state.runtime.debug!.speciesId;
    answerDebug(state, lessonFor(species)!.badLine, TODAY);
    expect(state.knowledge[species]).toEqual({ box: 1, due: TODAY + 1 });
  });

  it("is saved", () => {
    const state = stateWith(["leaklet", 5]);
    state.knowledge.nullit = { box: 3, due: TODAY };
    state.dailyDay = TODAY;
    state.bossReview["boss-staging"] = 2;
    const loaded = importSave(exportSave(state));
    expect(loaded.knowledge).toEqual(state.knowledge);
    expect(loaded.dailyDay).toBe(TODAY);
    expect(loaded.bossReview).toEqual({ "boss-staging": 2 });
  });
});
