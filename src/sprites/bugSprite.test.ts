import { SPECIES } from "../game/data/species";
import { BUG_TYPES } from "../game/types";
import { colorFor, generateBugSprite, Px, shinyPalette, SPRITE_SIZE, TYPE_PALETTES } from "./bugSprite";

const filled = (pixels: Uint8Array) => pixels.reduce((n, p) => n + (p !== Px.Empty ? 1 : 0), 0);

describe("procedural bug sprites", () => {
  it("is deterministic per species", () => {
    const a = generateBugSprite({ id: "typobit", family: "worm", stage: 1 });
    const b = generateBugSprite({ id: "typobit", family: "worm", stage: 1 });
    expect(Array.from(a.pixels)).toEqual(Array.from(b.pixels));
  });

  it("is mirror-symmetric", () => {
    for (const species of SPECIES) {
      const { pixels } = generateBugSprite(species);
      for (let y = 0; y < SPRITE_SIZE; y++) {
        for (let x = 0; x < SPRITE_SIZE / 2; x++) {
          expect(pixels[y * SPRITE_SIZE + x], `${species.id} at ${x},${y}`).toBe(pixels[y * SPRITE_SIZE + (SPRITE_SIZE - 1 - x)]);
        }
      }
    }
  });

  it("draws something for every species and grows with the stage", () => {
    for (const species of SPECIES) expect(filled(generateBugSprite(species).pixels)).toBeGreaterThan(40);
    const small = filled(generateBugSprite({ id: "leaklet", family: "beetle", stage: 1 }).pixels);
    const big = filled(generateBugSprite({ id: "leaklet", family: "beetle", stage: 3 }).pixels);
    expect(big).toBeGreaterThan(small);
  });

  it("gives different species different shapes", () => {
    const a = generateBugSprite({ id: "nullit", family: "beetle", stage: 1 });
    const b = generateBugSprite({ id: "leaklet", family: "beetle", stage: 1 });
    expect(Array.from(a.pixels)).not.toEqual(Array.from(b.pixels));
  });

  it("has an outline and eyes", () => {
    const { pixels } = generateBugSprite({ id: "corsbee", family: "winged", stage: 1 });
    expect(pixels.includes(Px.Outline)).toBe(true);
    expect(pixels.includes(Px.Pupil)).toBe(true);
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
