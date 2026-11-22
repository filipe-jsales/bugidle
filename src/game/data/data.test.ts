import { ITEMS } from "./items";
import { MOVES } from "./moves";
import { getSpecies, hasSpecies, preEvolutionOf, SPECIES } from "./species";
import { BOSSES, REGIONS, ROUTES } from "./world";
import { BUG_TYPES } from "../types";
import { STARTER_IDS } from "../state";

describe("game data integrity", () => {
  it("has unique ids and dex numbers", () => {
    expect(new Set(SPECIES.map((s) => s.id)).size).toBe(SPECIES.length);
    expect(SPECIES.map((s) => s.dex)).toEqual(SPECIES.map((_, i) => i + 1));
    expect(new Set(ROUTES.map((r) => r.id)).size).toBe(ROUTES.length);
    expect(new Set(MOVES.map((m) => m.id)).size).toBe(MOVES.length);
  });

  it("evolutions point to existing species and need a level or an item", () => {
    for (const s of SPECIES) {
      if (!s.evolution) continue;
      expect(hasSpecies(s.evolution.to)).toBe(true);
      expect(s.evolution.level !== undefined || s.evolution.item !== undefined).toBe(true);
      if (s.evolution.item) expect(ITEMS[s.evolution.item].category).toBe("evolution");
      expect(getSpecies(s.evolution.to).stage).toBeGreaterThan(s.stage);
    }
  });

  it("every species can be obtained (route, evolution or starter)", () => {
    const inRoutes = new Set(ROUTES.flatMap((r) => r.encounters.map((e) => e.speciesId)));
    for (const s of SPECIES) {
      const obtainable = inRoutes.has(s.id) || preEvolutionOf(s.id) !== undefined || (STARTER_IDS as readonly string[]).includes(s.id);
      expect(obtainable, s.id).toBe(true);
    }
  });

  it("routes reference valid species, regions and sane levels", () => {
    for (const r of ROUTES) {
      expect(REGIONS.some((g) => g.id === r.regionId)).toBe(true);
      expect(r.minLevel).toBeLessThanOrEqual(r.maxLevel);
      for (const e of r.encounters) expect(hasSpecies(e.speciesId), `${r.id}:${e.speciesId}`).toBe(true);
      if (r.unlock.kind === "defeats") expect(ROUTES.some((x) => x.id === (r.unlock as { routeId: string }).routeId)).toBe(true);
    }
  });

  it("each region has a boss whose badge opens the next region", () => {
    for (const region of REGIONS) expect(BOSSES.some((b) => b.regionId === region.id)).toBe(true);
    for (const region of REGIONS.filter((g) => g.requiredBadge)) {
      expect(BOSSES.some((b) => b.badgeId === region.requiredBadge)).toBe(true);
    }
    for (const b of BOSSES) for (const m of b.team) expect(hasSpecies(m.speciesId)).toBe(true);
  });

  it("every type has three moves", () => {
    for (const t of BUG_TYPES) expect(MOVES.filter((m) => m.type === t)).toHaveLength(3);
  });
});
