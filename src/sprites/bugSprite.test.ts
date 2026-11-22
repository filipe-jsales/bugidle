import { SPECIES } from "../game/data/species";
import { BUG_TYPES } from "../game/types";
import { colorFor, generateBugSprite, hasHandDrawnSprite, Px, shinyPalette, SPRITE_SIZE, TYPE_PALETTES } from "./bugSprite";
import { HAND_DRAWN_HALVES } from "./handDrawn";
import { MORE_HAND_DRAWN_HALVES } from "./handDrawnMore";

const filled = (pixels: Uint8Array) => pixels.reduce((n, p) => n + (p !== Px.Empty ? 1 : 0), 0);

describe("hand-drawn sprites and animation frames", () => {
  const handDrawn = ["syntaxwyrm", "heapocalypse", "lagmoth", "y2kbeetle", "zeroday", "markmoth"];

  it("final forms and legendaries use hand-drawn art", () => {
    for (const id of handDrawn) {
      expect(hasHandDrawnSprite(id), id).toBe(true);
      const species = SPECIES.find((s) => s.id === id)!;
      expect(species.stage === 3 || species.rarity === "legendary").toBe(true);
    }
    expect(hasHandDrawnSprite("not-a-bug")).toBe(false);
  });

  it("every species is hand-drawn, and each evolution line grows", () => {
    for (const species of SPECIES) expect(hasHandDrawnSprite(species.id), species.id).toBe(true);
    const size = (id: string) => filled(generateBugSprite(SPECIES.find((s) => s.id === id)!).pixels);
    expect(size("typobit")).toBeLessThan(size("typoworm"));
    expect(size("typoworm")).toBeLessThan(size("syntaxwyrm"));
    expect(size("leaklet")).toBeLessThan(size("leakroach"));
    expect(size("leakroach")).toBeLessThan(size("heapocalypse"));
  });

  it("every hand-drawn half is 12x24 and uses known codes", () => {
    for (const [id, rows] of Object.entries({ ...HAND_DRAWN_HALVES, ...MORE_HAND_DRAWN_HALVES })) {
      expect(rows, id).toHaveLength(SPRITE_SIZE);
      for (const row of rows) expect(row, `${id}: ${row}`).toMatch(/^[.kbslaepw]{12}$/);
    }
  });

  it("every bug has a second, different idle frame of the same size", () => {
    for (const species of SPECIES) {
      const a = generateBugSprite(species, 0).pixels;
      const b = generateBugSprite(species, 1).pixels;
      expect(b.length).toBe(a.length);
      expect(Array.from(a), species.id).not.toEqual(Array.from(b));
    }
  });
});

/** The generator is the fallback for a species without a drawing yet; these ids have none. */
describe("procedural bug sprites", () => {
  it("is deterministic per species", () => {
    const a = generateBugSprite({ id: "proc-worm", family: "worm", stage: 1 });
    const b = generateBugSprite({ id: "proc-worm", family: "worm", stage: 1 });
    expect(Array.from(a.pixels)).toEqual(Array.from(b.pixels));
  });

  it("is mirror-symmetric", () => {
    for (const species of SPECIES) {
      for (const frame of [0, 1] as const) {
        const { pixels } = generateBugSprite(species, frame);
        for (let y = 0; y < SPRITE_SIZE; y++) {
          for (let x = 0; x < SPRITE_SIZE / 2; x++) {
            expect(pixels[y * SPRITE_SIZE + x], `${species.id} at ${x},${y}`).toBe(pixels[y * SPRITE_SIZE + (SPRITE_SIZE - 1 - x)]);
          }
        }
      }
    }
  });

  it("draws something for every species and grows with the stage", () => {
    for (const species of SPECIES) expect(filled(generateBugSprite(species).pixels)).toBeGreaterThan(40);
    const small = filled(generateBugSprite({ id: "proc-beetle", family: "beetle", stage: 1 }).pixels);
    const big = filled(generateBugSprite({ id: "proc-beetle", family: "beetle", stage: 3 }).pixels);
    expect(big).toBeGreaterThan(small);
  });

  it("gives different species different shapes", () => {
    const a = generateBugSprite({ id: "proc-a", family: "beetle", stage: 1 });
    const b = generateBugSprite({ id: "proc-b", family: "beetle", stage: 1 });
    expect(Array.from(a.pixels)).not.toEqual(Array.from(b.pixels));
  });

  it("has an outline and eyes", () => {
    for (const spec of [{ id: "proc-fly", family: "winged" as const, stage: 1 as const }, ...SPECIES]) {
      const { pixels } = generateBugSprite(spec);
      expect(pixels.includes(Px.Outline), spec.id).toBe(true);
      expect(pixels.includes(Px.Pupil) || pixels.includes(Px.Eye), spec.id).toBe(true);
    }
  });

  it("maps every pixel kind to a color", () => {
    for (const type of BUG_TYPES) {
      const palette = TYPE_PALETTES[type];
      expect(colorFor(Px.Empty, palette)).toBeNull();
      for (const px of [Px.Outline, Px.Body, Px.Shade, Px.Light, Px.Accent, Px.Eye, Px.Pupil, Px.Wing]) {
        expect(colorFor(px, palette)).toMatch(/^#[0-9a-f]{6}$/);
      }
      expect(shinyPalette(palette).body).not.toBe(palette.body);
    }
  });
});
