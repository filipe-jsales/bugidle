import { activePlayerBug, createBattle, stepBattle, type BattleEvent } from "./battle";
import { createBug, type BugInstance } from "./bug";
import { calculateDamage, chooseMove } from "./damage";
import { getMove } from "./data/moves";
import { createSeededRng } from "./rng";

const ivs = { hp: 15, atk: 15, def: 15, spd: 15 };
let counter = 0;
const bug = (speciesId: string, level: number): BugInstance =>
  createBug({ uid: `u${counter++}`, speciesId, level, rng: createSeededRng(counter), origin: "test", shiny: false, ivs, potency: 1 });

function runToEnd(team: BugInstance[], enemies: BugInstance[], seed = 1, timeLimitMs?: number) {
  const battle = createBattle(timeLimitMs ? "boss" : "wild", enemies, { timeLimitMs });
  const rng = createSeededRng(seed);
  const events: BattleEvent[] = [];
  for (let i = 0; i < 10_000 && !battle.outcome; i++) {
    events.push(...stepBattle(battle, team, 100, { levelCap: 100, rng }));
  }
  return { battle, events };
}

describe("damage", () => {
  it("is zero against immune types", () => {
    const attacker = bug("timeoutick", 20);
    const defender = bug("leaklet", 20);
    const result = calculateDamage(attacker, defender, getMove("network-1"), createSeededRng(1));
    expect(result.damage).toBe(0);
    expect(result.effectiveness).toBe(0);
  });

  it("is higher with type advantage", () => {
    const attacker = bug("mergefly", 20);
    const logic = bug("nullit", 20);
    const memory = bug("leaklet", 20);
    const rng = () => 0.5;
    const strong = calculateDamage(attacker, logic, getMove("syntax-1"), rng).damage;
    const weak = calculateDamage(attacker, memory, getMove("syntax-1"), rng).damage;
    expect(strong).toBeGreaterThan(weak);
  });

  it("always deals at least 1 when not immune", () => {
    const attacker = bug("typobit", 1);
    const defender = bug("heapocalypse", 100);
    expect(calculateDamage(attacker, defender, getMove("syntax-1"), () => 0.99).damage).toBeGreaterThanOrEqual(1);
  });

  it("picks the move with the best expected damage", () => {
    const regex = bug("regexorpion", 30); // syntax + performance
    const ui = bug("pixelmite", 30); // syntax 2x vs ui, performance 2x vs ui
    expect(chooseMove(regex, ui).power).toBe(90);
    const network = bug("timeoutick", 10);
    const memory = bug("leaklet", 10);
    // network is immune-blocked by memory, but it is the only type it knows
    expect(chooseMove(network, memory).type).toBe("network");
  });
});

describe("battle", () => {
  it("a much stronger bug wins", () => {
    const { battle, events } = runToEnd([bug("heapocalypse", 50)], [bug("typobit", 3)]);
    expect(battle.outcome).toBe("won");
    expect(events.some((e) => e.type === "faint" && e.side === "enemy")).toBe(true);
  });

  it("loses when the whole team faints", () => {
    const { battle } = runToEnd([bug("typobit", 2), bug("nullit", 2)], [bug("heapocalypse", 60)]);
    expect(battle.outcome).toBe("lost");
  });

  it("switches to the next team member when one faints", () => {
    const team = [bug("typobit", 3), bug("heapocalypse", 60)];
    const { battle, events } = runToEnd(team, [bug("nullpointer", 25)]);
    expect(events.some((e) => e.type === "switch" && e.side === "player")).toBe(true);
    expect(battle.outcome).toBe("won");
  });

  it("fights a boss team in order", () => {
    const { battle, events } = runToEnd([bug("heapocalypse", 80)], [bug("typobit", 5), bug("nullit", 5)], 2, 60_000);
    expect(battle.outcome).toBe("won");
    expect(events.filter((e) => e.type === "faint" && e.side === "enemy")).toHaveLength(2);
  });

  it("times out", () => {
    const player = bug("timeoutick", 30);
    const enemy = bug("leaklet", 30);
    player.currentHp = 1_000_000;
    enemy.currentHp = 1_000_000;
    const { battle } = runToEnd([player], [enemy], 3, 5_000);
    expect(battle.outcome).toBe("timeout");
  });

  it("faster bugs act more often", () => {
    const fast = bug("flickerfly", 30);
    const slow = bug("dnsnail", 30);
    fast.currentHp = 100000;
    slow.currentHp = 100000;
    const battle = createBattle("wild", [slow]);
    const events = stepBattle(battle, [fast], 10_000, { levelCap: 100, rng: createSeededRng(1) });
    const playerHits = events.filter((e) => e.type === "attack" && e.side === "player").length;
    const enemyHits = events.filter((e) => e.type === "attack" && e.side === "enemy").length;
    expect(playerHits).toBeGreaterThan(enemyHits * 1.5);
  });

  it("over-level bugs may disobey", () => {
    const strong = bug("heapocalypse", 50);
    const battle = createBattle("wild", [bug("typobit", 3)]);
    const events = stepBattle(battle, [strong], 3000, { levelCap: 20, rng: () => 0 });
    expect(events.some((e) => e.type === "disobey")).toBe(true);
  });

  it("activePlayerBug skips fainted bugs", () => {
    const a = bug("typobit", 3);
    const b = bug("nullit", 3);
    a.currentHp = 0;
    expect(activePlayerBug([a, b])).toBe(b);
  });
});
