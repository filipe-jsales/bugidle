import { MOVES } from "../../game/data/moves";
import { BUG_TYPES } from "../../game/types";
import { buildAttackFx, FX_ANCHORS, TYPE_FX } from "./attackFx";

const base = { side: "player", moveId: "syntax-1", effectiveness: 1, critical: false } as const;

describe("attack visuals per type", () => {
  it("every type has its own look", () => {
    for (const type of BUG_TYPES) {
      const fx = TYPE_FX[type];
      expect(fx.count).toBeGreaterThan(0);
      expect(fx.color).toMatch(/^#[0-9a-f]{6}$/);
      if (fx.shape === "glyph") expect(fx.glyphs?.length).toBeGreaterThan(0);
    }
    const looks = new Set(BUG_TYPES.map((t) => `${TYPE_FX[t].shape}|${TYPE_FX[t].color}`));
    expect(looks.size).toBe(BUG_TYPES.length);
  });

  it("uses the move's type", () => {
    for (const move of MOVES) expect(buildAttackFx({ ...base, moveId: move.id }, 1).type).toBe(move.type);
  });

  it("flies from the attacker to the defender", () => {
    expect(buildAttackFx(base, 1)).toMatchObject({ from: FX_ANCHORS.player, to: FX_ANCHORS.enemy });
    expect(buildAttackFx({ ...base, side: "enemy" }, 1)).toMatchObject({ from: FX_ANCHORS.enemy, to: FX_ANCHORS.player });
  });

  it("throws glyphs for syntax and the right number of projectiles", () => {
    const fx = buildAttackFx(base, 3);
    expect(fx.projectiles).toHaveLength(TYPE_FX.syntax.count);
    for (const p of fx.projectiles) expect(TYPE_FX.syntax.glyphs).toContain(p.text);
  });

  it("bursts more on super effective hits, shakes on crits, nothing on immunity", () => {
    const normal = buildAttackFx(base, 1);
    const superHit = buildAttackFx({ ...base, effectiveness: 2 }, 1);
    expect(superHit.particles.length).toBeGreaterThan(normal.particles.length);
    expect(superHit.big).toBe(true);
    expect(buildAttackFx({ ...base, critical: true }, 1).shake).toBe(true);
    expect(buildAttackFx({ ...base, effectiveness: 0 }, 1).particles).toHaveLength(0);
  });

  it("is stable for the same seed", () => {
    expect(buildAttackFx(base, 42)).toEqual(buildAttackFx(base, 42));
  });

  it("particles start when the projectile lands", () => {
    const fx = buildAttackFx({ ...base, moveId: "network-2" }, 5);
    for (const p of fx.particles) expect(p.delayMs).toBe(TYPE_FX.network.travelMs);
  });
});
