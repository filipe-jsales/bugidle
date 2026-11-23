import { ITEM_IDS } from "../../game/data/items";
import { ICON_ART } from "./iconArt";
import { CONCEPT_ART } from "./conceptArt";
import { CONCEPTS } from "../../game/data/concepts";
import { ITEM_ART } from "./itemArt";
import { FLAT, RAMPS, shadeArt } from "./shadedArt";

const known = (ch: string) => ch === "." || ch in RAMPS || ch in FLAT;

describe("item and icon pixel art", () => {
  it("every item and icon is a 16x16 drawing with known letters and enough body", () => {
    const all = [...ITEM_IDS.map((id) => [id, ITEM_ART[id]] as const), ...Object.entries(ICON_ART), ...Object.entries(CONCEPT_ART)];
    for (const [id, art] of all) {
      expect(art, id).toHaveLength(16);
      for (const row of art) {
        expect(row.length, `${id}: "${row}"`).toBe(16);
        for (const ch of row) expect(known(ch), `${id} uses "${ch}"`).toBe(true);
      }
      expect(art.join("").replace(/\./g, "").length, id).toBeGreaterThan(40);
    }
  });

  it("items look different from each other", () => {
    expect(new Set(ITEM_IDS.map((id) => ITEM_ART[id].join("/"))).size).toBe(ITEM_IDS.length);
  });

  it("shading adds an outline, a light top-left edge and a dark bottom-right edge", () => {
    const colors = shadeArt(["....", ".rr.", ".rr.", "...."]);
    expect(colors[0]![1]).toBe(FLAT.k);
    expect(colors[1]![1]).toBe(RAMPS.r!.light);
    expect(colors[2]![2]).toBe(RAMPS.r!.dark);
    expect(colors[0]![0]).toBeNull();
  });

  it("every mini game concept has its picture", () => {
    for (const c of CONCEPTS) expect(CONCEPT_ART[c.id], c.id).toBeDefined();
  });
});
