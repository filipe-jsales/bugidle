import { BUG_TYPES, typeMultiplier } from "./types";

describe("type chart", () => {
  it("applies advantage", () => {
    expect(typeMultiplier("syntax", ["logic"])).toBe(2);
  });

  it("applies disadvantage", () => {
    expect(typeMultiplier("syntax", ["memory"])).toBe(0.5);
  });

  it("applies immunity", () => {
    expect(typeMultiplier("network", ["memory"])).toBe(0);
    expect(typeMultiplier("ui", ["concurrency"])).toBe(0);
  });

  it("multiplies dual types", () => {
    expect(typeMultiplier("security", ["network", "logic"])).toBe(4);
    expect(typeMultiplier("network", ["security", "memory"])).toBe(0);
    expect(typeMultiplier("syntax", ["logic", "memory"])).toBe(1);
  });

  it("is neutral by default", () => {
    expect(typeMultiplier("logic", ["ui"])).toBe(1);
  });

  it("gives every type exactly two super-effective matchups", () => {
    for (const attack of BUG_TYPES) {
      const strengths = BUG_TYPES.filter((def) => typeMultiplier(attack, [def]) === 2);
      expect(strengths).toHaveLength(2);
    }
  });
});
