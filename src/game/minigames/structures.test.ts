import { createSeededRng } from "../rng";
import { buildQueueQuestion, buildStackPuzzle, hashBucket, queueLeavers, stackMove, stackSolved, type StackPuzzle } from "./structures";
import { createRain, rainOver, rainScore, spawnInterval, stepRain, typeKey } from "./typeRain";

const BUGS = ["typobit", "nullit", "leaklet", "offbyone", "pixelmite"];

describe("data structures with bugs", () => {
  it("every stack puzzle can be solved by pushing and popping in order", () => {
    for (let seed = 1; seed < 30; seed++) {
      let p: StackPuzzle = buildStackPuzzle(BUGS, seed);
      expect(p.target.join()).not.toBe(BUGS.join());
      for (let guard = 0; guard < 20 && !stackSolved(p); guard++) {
        const popped = stackMove(p, "pop");
        p = popped.ok ? popped.puzzle : stackMove(p, "push").puzzle;
      }
      expect(stackSolved(p), `seed ${seed}`).toBe(true);
      expect(p.output).toEqual(p.target);
    }
  });

  it("a pop that breaks the target order is refused", () => {
    const p = buildStackPuzzle(BUGS, 3);
    const pushed = stackMove(p, "push").puzzle;
    const wrong = pushed.stack[0] !== p.target[0];
    expect(stackMove(pushed, "pop").ok).toBe(!wrong);
    expect(stackMove({ ...p, incoming: [] }, "push").ok).toBe(false);
  });

  it("queue: first in, first out", () => {
    expect(queueLeavers([{ kind: "enqueue", item: "a" }, { kind: "enqueue", item: "b" }, { kind: "dequeue" }, { kind: "enqueue", item: "c" }, { kind: "dequeue" }, { kind: "dequeue" }])).toEqual(["a", "b", "c"]);
    for (let seed = 1; seed < 20; seed++) {
      const q = buildQueueQuestion(BUGS, seed);
      expect(queueLeavers(q.ops)[q.ask - 1]).toBe(q.answer);
      expect(q.ask).toBeGreaterThanOrEqual(2);
    }
  });

  it("hash: level modulo the buckets", () => {
    expect(hashBucket(12)).toBe(2);
    expect(hashBucket(5)).toBe(0);
    expect(hashBucket(7, 3)).toBe(1);
  });
});

describe("Chuva de Código", () => {
  const POOL = ["array", "bug", "cache", "debug"];

  it("words fall and a word that lands costs a life", () => {
    const s = createRain();
    const rng = createSeededRng(1);
    stepRain(s, 0.6, rng, POOL);
    expect(s.words).toHaveLength(1);
    for (let t = 0; t < 30 && s.lives === 3; t++) stepRain(s, 0.5, rng, POOL);
    expect(s.lives).toBe(2);
  });

  it("typing locks onto a word and finishing it destroys it; wrong keys are misses", () => {
    const s = createRain();
    s.words.push({ id: 99, word: "bug", x: 0.5, y: 0.3, speed: 0.1 });
    expect(typeKey(s, "B")).toBeNull();
    expect(s.target).toBe(99);
    expect(typeKey(s, "x")).toBeNull();
    expect(s.misses).toBe(1);
    typeKey(s, "u");
    expect(typeKey(s, "g")).toBe("bug");
    expect(s.destroyed).toEqual(["bug"]);
    expect(s.words).toHaveLength(0);
    expect(rainScore(s)).toBeGreaterThan(0);
  });

  it("speeds up over time and ends with no lives", () => {
    expect(spawnInterval(120)).toBeLessThan(spawnInterval(0));
    const s = createRain();
    s.lives = 0;
    expect(rainOver(s)).toBe(true);
    expect(typeKey(s, "a")).toBeNull();
  });
});
