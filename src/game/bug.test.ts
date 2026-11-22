import { computeStats, createBug, healFully, ivGrade, ivTotal, powerRating } from "./bug";
import { EARLY_LEVELS, earlyXpFloor, gainTrainerXp, gainXp, xpReward, xpToNextLevel } from "./experience";
import { createSeededRng } from "./rng";

const ivs = { hp: 31, atk: 31, def: 31, spd: 31 };
const make = (level = 5) =>
  createBug({ uid: "b1", speciesId: "typobit", level, rng: createSeededRng(1), origin: "test", shiny: false, ivs, potency: 1 });

describe("bug instances", () => {
  it("starts with full HP", () => {
    const bug = make();
    expect(bug.currentHp).toBe(computeStats(bug).hp);
  });

  it("computes stats from base, level and IVs", () => {
    const bug = make(50);
    // typobit base hp 40: floor((80 + 31) * 50 / 100) + 50 + 10 = 115
    expect(computeStats(bug).hp).toBe(115);
    // base atk 45: floor((90 + 31) * 50 / 100) + 5 = 65
    expect(computeStats(bug).atk).toBe(65);
  });

  it("adds vitamin boosts", () => {
    const bug = make(10);
    const before = computeStats(bug).spd;
    bug.boosts.spd = 4;
    expect(computeStats(bug).spd).toBe(before + 4);
  });

  it("rolls IVs within range", () => {
    const rng = createSeededRng(9);
    for (let i = 0; i < 50; i++) {
      const bug = createBug({ uid: `b${i}`, speciesId: "nullit", level: 3, rng, origin: "test" });
      for (const v of Object.values(bug.ivs)) {
        expect(v).toBeGreaterThanOrEqual(0);
        expect(v).toBeLessThanOrEqual(31);
      }
    }
  });

  it("reports IV totals, grade and power", () => {
    const bug = make(10);
    expect(ivTotal(bug)).toBe(124);
    expect(ivGrade(bug)).toBe(4);
    expect(powerRating(bug)).toBeGreaterThan(0);
  });

  it("heals fully", () => {
    const bug = make(10);
    bug.currentHp = 1;
    healFully(bug);
    expect(bug.currentHp).toBe(computeStats(bug).hp);
  });
});

describe("experience", () => {
  it("levels up and keeps leftover XP", () => {
    const bug = make(5);
    const needed = xpToNextLevel(5);
    const result = gainXp(bug, needed + 3, 20);
    expect(result.levelsGained).toBe(1);
    expect(bug.level).toBe(6);
    expect(bug.xp).toBe(3);
  });

  it("grows current HP on level up", () => {
    const bug = make(5);
    const hpBefore = bug.currentHp;
    gainXp(bug, xpToNextLevel(5), 20);
    expect(bug.currentHp).toBeGreaterThan(hpBefore);
  });

  it("stops at the level cap", () => {
    const bug = make(19);
    gainXp(bug, 1_000_000, 20);
    expect(bug.level).toBe(20);
    const blocked = gainXp(bug, 500, 20);
    expect(blocked.applied).toBe(0);
    expect(bug.level).toBe(20);
  });

  it("gives more XP for higher levels and bosses", () => {
    expect(xpReward("typobit", 10, false)).toBeGreaterThan(xpReward("typobit", 5, false));
    expect(xpReward("typobit", 10, true)).toBeGreaterThan(xpReward("typobit", 10, false));
  });

  it("levels up the trainer", () => {
    const trainer = { name: "t", level: 1, xp: 0 };
    expect(gainTrainerXp(trainer, 60)).toBe(1);
    expect(trainer.level).toBe(2);
  });
});

describe("early game XP", () => {
  it("a low-level win is worth a real slice of a level, fading out by level 12", () => {
    expect(xpReward("typobit", 2, false)).toBeGreaterThanOrEqual(Math.floor(xpToNextLevel(2) / 10));
    expect(xpReward("typobit", 2, false)).toBeGreaterThan(1);
    const share = (level: number) => earlyXpFloor(level) / xpToNextLevel(level);
    for (let level = 2; level < EARLY_LEVELS - 1; level++) expect(share(level) + 0.01).toBeGreaterThanOrEqual(share(level + 1));
    expect(earlyXpFloor(EARLY_LEVELS)).toBe(0);
    expect(earlyXpFloor(40)).toBe(0);
  });
});
