import { chance, createSeededRng, hashString, pickWeighted, randomInt } from "./rng";

describe("rng", () => {
  it("is deterministic for the same seed", () => {
    const a = createSeededRng(42);
    const b = createSeededRng(42);
    expect([a(), a(), a()]).toEqual([b(), b(), b()]);
  });

  it("returns values in [0, 1)", () => {
    const rng = createSeededRng(1);
    for (let i = 0; i < 1000; i++) {
      const v = rng();
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThan(1);
    }
  });

  it("randomInt respects inclusive bounds", () => {
    const rng = createSeededRng(7);
    const seen = new Set<number>();
    for (let i = 0; i < 500; i++) seen.add(randomInt(rng, 2, 4));
    expect([...seen].sort()).toEqual([2, 3, 4]);
  });

  it("chance uses the probability", () => {
    expect(chance(() => 0.2, 0.5)).toBe(true);
    expect(chance(() => 0.7, 0.5)).toBe(false);
  });

  it("pickWeighted honours weights", () => {
    const items = [
      { id: "a", weight: 1 },
      { id: "b", weight: 3 },
    ];
    expect(pickWeighted(() => 0.1, items).id).toBe("a");
    expect(pickWeighted(() => 0.5, items).id).toBe("b");
    expect(() => pickWeighted(() => 0, [])).toThrow();
  });

  it("hashString is stable", () => {
    expect(hashString("typobit")).toBe(hashString("typobit"));
    expect(hashString("typobit")).not.toBe(hashString("nullit"));
  });
});
