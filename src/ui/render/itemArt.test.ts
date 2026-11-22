import { ITEM_IDS } from "../../game/data/items";
import { ITEM_ART, ITEM_COLORS } from "./itemArt";

describe("shop item pixel art", () => {
  it("every item has a 12x12 drawing using known colors", () => {
    for (const id of ITEM_IDS) {
      const art = ITEM_ART[id];
      expect(art, id).toHaveLength(12);
      for (const row of art) {
        expect(row.length, `${id}: "${row}"`).toBe(12);
        for (const ch of row) if (ch !== ".") expect(ITEM_COLORS[ch], `${id} uses "${ch}"`).toBeDefined();
      }
      const filled = art.join("").replace(/\./g, "").length;
      expect(filled, id).toBeGreaterThan(20);
    }
  });

  it("items look different from each other", () => {
    expect(new Set(ITEM_IDS.map((id) => ITEM_ART[id].join("/"))).size).toBe(ITEM_IDS.length);
  });
});
