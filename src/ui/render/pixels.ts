import { getSpecies } from "../../game/data/species";
import { colorFor, generateBugSprite, shinyPalette, SPRITE_SIZE, TYPE_PALETTES } from "../../sprites/bugSprite";
import { TRAINER_HEIGHT, TRAINER_PALETTE, TRAINER_WIDTH, trainerPixels, Tp, type Facing, type WalkFrame } from "../../sprites/trainerSprite";

const urlCache = new Map<string, string>();

function createCanvas(width: number, height: number): [HTMLCanvasElement, CanvasRenderingContext2D] {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("2D canvas not supported");
  return [canvas, ctx];
}

/** Data URL of a species sprite at 1 pixel per cell (scale it with CSS, pixelated). */
export function bugSpriteUrl(speciesId: string, shiny: boolean, silhouette = false): string {
  const key = `${speciesId}|${shiny}|${silhouette}`;
  const cached = urlCache.get(key);
  if (cached) return cached;
  const species = getSpecies(speciesId);
  const base = TYPE_PALETTES[species.types[0]];
  const palette = shiny ? shinyPalette(base) : base;
  const secondary = species.types[1] ? TYPE_PALETTES[species.types[1]] : undefined;
  const grid = generateBugSprite(species);
  const [canvas, ctx] = createCanvas(SPRITE_SIZE, SPRITE_SIZE);
  for (let i = 0; i < grid.pixels.length; i++) {
    const color = colorFor(grid.pixels[i]!, palette, shiny ? undefined : secondary);
    if (!color) continue;
    ctx.fillStyle = silhouette ? "#1a1020" : color;
    ctx.fillRect(i % SPRITE_SIZE, Math.floor(i / SPRITE_SIZE), 1, 1);
  }
  const url = canvas.toDataURL();
  urlCache.set(key, url);
  return url;
}

/**
 * Small hand-drawn icons as text rows. Each character maps to a color in `colors`;
 * "." is transparent.
 */
export function pixelArtUrl(rows: readonly string[], colors: Readonly<Record<string, string>>): string {
  const key = rows.join("/") + JSON.stringify(colors);
  const cached = urlCache.get(key);
  if (cached) return cached;
  const width = Math.max(...rows.map((r) => r.length));
  const [canvas, ctx] = createCanvas(width, rows.length);
  rows.forEach((row, y) => {
    [...row].forEach((ch, x) => {
      const color = colors[ch];
      if (!color) return;
      ctx.fillStyle = color;
      ctx.fillRect(x, y, 1, 1);
    });
  });
  const url = canvas.toDataURL();
  urlCache.set(key, url);
  return url;
}

/** Trainer frame as a data URL. "right" is the left sprite: mirror it with CSS. */
export function trainerSpriteUrl(facing: Facing, frame: WalkFrame): string {
  const view = facing === "right" ? "left" : facing;
  const key = `trainer|${view}|${frame}`;
  const cached = urlCache.get(key);
  if (cached) return cached;
  const pixels = trainerPixels(view, frame);
  const [canvas, ctx] = createCanvas(TRAINER_WIDTH, TRAINER_HEIGHT);
  for (let i = 0; i < pixels.length; i++) {
    const p = pixels[i]!;
    if (p === Tp.Empty) continue;
    ctx.fillStyle = TRAINER_PALETTE[p as Exclude<Tp, Tp.Empty>];
    ctx.fillRect(i % TRAINER_WIDTH, Math.floor(i / TRAINER_WIDTH), 1, 1);
  }
  const url = canvas.toDataURL();
  urlCache.set(key, url);
  return url;
}

export { createCanvas };
