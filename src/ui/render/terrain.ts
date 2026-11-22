/**
 * Procedural pixel backgrounds for battles and the region map, one look per region:
 * a circuit board, a server room, a datacenter, a retro mainframe hall and the cloud.
 */
import type { TerrainId } from "../../game/data/world";
import { createSeededRng, hashString, randomInt, type Rng } from "../../game/rng";
import { createCanvas } from "./pixels";

const TILE = 8;

/** Decoration counts were tuned for 320x200; bigger maps get proportionally more. */
function density(w: number, h: number): number {
  return (w * h) / (320 * 200);
}

interface Theme {
  base: string;
  noise: readonly string[];
  draw: (ctx: CanvasRenderingContext2D, rng: Rng, w: number, h: number) => void;
}

function rect(ctx: CanvasRenderingContext2D, color: string, x: number, y: number, w: number, h: number) {
  ctx.fillStyle = color;
  ctx.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h));
}

function circuit(ctx: CanvasRenderingContext2D, rng: Rng, w: number, h: number) {
  const d = density(w, h);
  const copper = "#c9a24a";
  const copperDark = "#8a6a2a";
  for (let i = 0; i < 40 * d; i++) {
    let x = randomInt(rng, 0, w / TILE) * TILE + 3;
    let y = randomInt(rng, 0, h / TILE) * TILE + 3;
    rect(ctx, copperDark, x - 1, y - 1, 4, 4);
    for (let s = 0; s < 6; s++) {
      const horizontal = rng() < 0.5;
      const len = randomInt(rng, 2, 6) * TILE * (rng() < 0.5 ? -1 : 1);
      if (horizontal) {
        rect(ctx, copper, Math.min(x, x + len), y, Math.abs(len), 2);
        x += len;
      } else {
        rect(ctx, copper, x, Math.min(y, y + len), 2, Math.abs(len));
        y += len;
      }
    }
    rect(ctx, copper, x - 1, y - 1, 4, 4);
    rect(ctx, "#1a3b26", x, y, 2, 2);
  }
  for (let i = 0; i < 7 * d; i++) {
    const cw = randomInt(rng, 3, 6) * TILE;
    const ch = randomInt(rng, 2, 4) * TILE;
    const x = randomInt(rng, 0, w - cw);
    const y = randomInt(rng, 0, h - ch);
    for (let p = 4; p < cw - 2; p += 4) {
      rect(ctx, "#b8b8b0", x + p, y - 2, 2, 2);
      rect(ctx, "#b8b8b0", x + p, y + ch, 2, 2);
    }
    rect(ctx, "#1c1c22", x, y, cw, ch);
    rect(ctx, "#2c2c36", x + 1, y + 1, cw - 2, 2);
    rect(ctx, "#3a3a48", x + 3, y + ch - 4, 3, 2);
  }
}

function serverRoom(ctx: CanvasRenderingContext2D, rng: Rng, w: number, h: number) {
  const d = density(w, h);
  for (let y = 0; y < h; y += TILE * 2) rect(ctx, "#252c3a", 0, y, w, 1);
  for (let x = 0; x < w; x += TILE * 2) rect(ctx, "#252c3a", x, 0, 1, h);
  for (let i = 0; i < 9 * d; i++) {
    const rw = TILE * 3;
    const rh = TILE * randomInt(rng, 4, 7);
    const x = randomInt(rng, 0, w - rw);
    const y = randomInt(rng, 0, h - rh);
    rect(ctx, "#0f121a", x + 2, y + 2, rw, rh);
    rect(ctx, "#3a4356", x, y, rw, rh);
    rect(ctx, "#4b566e", x, y, rw, 2);
    for (let s = y + 5; s < y + rh - 3; s += 4) {
      rect(ctx, "#20263a", x + 2, s, rw - 4, 3);
      rect(ctx, rng() < 0.7 ? "#5fe08a" : "#f0b84a", x + rw - 5, s + 1, 1, 1);
    }
  }
}

function datacenter(ctx: CanvasRenderingContext2D, rng: Rng, w: number, h: number) {
  const d = density(w, h);
  for (let y = 0; y < h; y += TILE * 2) {
    for (let x = 0; x < w; x += TILE * 2) {
      rect(ctx, "#8a8f99", x, y, TILE * 2 - 1, TILE * 2 - 1);
      if ((x / TILE + y / TILE) % 4 === 0) for (let p = 3; p < 14; p += 3) for (let q = 3; q < 14; q += 3) rect(ctx, "#6d727c", x + p, y + q, 1, 1);
    }
  }
  for (let i = 0; i < 4 * d; i++) {
    const y = randomInt(rng, 1, h / TILE - 2) * TILE;
    rect(ctx, "#3a3d44", 0, y, w, 4);
    for (let x = 0; x < w; x += 6) rect(ctx, ["#e04a4a", "#4a8ae0", "#e0c34a"][randomInt(rng, 0, 2)]!, x, y + 1, 4, 2);
  }
}

function mainframe(ctx: CanvasRenderingContext2D, rng: Rng, w: number, h: number) {
  const d = density(w, h);
  for (let y = 0; y < h; y += TILE) {
    for (let x = (y / TILE) % 2 === 0 ? 0 : TILE; x < w; x += TILE * 2) rect(ctx, "#8a6f4e", x, y, TILE, TILE);
  }
  for (let i = 0; i < 7 * d; i++) {
    const x = randomInt(rng, 0, w - 34);
    const y = randomInt(rng, 0, h - 44);
    rect(ctx, "#2a2018", x + 2, y + 2, 32, 42);
    rect(ctx, "#d8cba8", x, y, 32, 42);
    rect(ctx, "#b8a982", x, y + 36, 32, 6);
    for (const cx of [x + 9, x + 23]) {
      rect(ctx, "#3a3028", cx - 6, y + 6, 12, 12);
      rect(ctx, "#6a5a48", cx - 4, y + 8, 8, 8);
      rect(ctx, "#3a3028", cx - 1, y + 11, 2, 2);
    }
    rect(ctx, rng() < 0.5 ? "#e05a3a" : "#5ae07a", x + 4, y + 24, 2, 2);
  }
}

function cloud(ctx: CanvasRenderingContext2D, rng: Rng, w: number, h: number) {
  const d = density(w, h);
  const bands = ["#7ec4ef", "#8fcdf2", "#a2d6f4"];
  bands.forEach((c, i) => rect(ctx, c, 0, (h / bands.length) * i, w, h / bands.length));
  for (let i = 0; i < 14 * d; i++) {
    const x = randomInt(rng, -20, w);
    const y = randomInt(rng, 0, h - 20);
    const size = randomInt(rng, 2, 5);
    for (let b = 0; b < size; b++) {
      const bx = x + b * 9;
      const by = y - (b % 2) * 5;
      rect(ctx, "#c9e6f7", bx - 1, by + 2, 14, 12);
      rect(ctx, "#ffffff", bx, by, 12, 10);
    }
    rect(ctx, "#dff0fa", x, y + 8, size * 9 + 4, 4);
  }
}

const THEMES: Record<TerrainId, Theme> = {
  circuit: { base: "#2f7a4a", noise: ["#2a6f43", "#34834f", "#2c7446"], draw: circuit },
  server: { base: "#2f3646", noise: ["#2b3240", "#333b4c"], draw: serverRoom },
  datacenter: { base: "#767b85", noise: ["#70757f"], draw: datacenter },
  mainframe: { base: "#9c8160", noise: ["#957a5a", "#a2876a"], draw: mainframe },
  cloud: { base: "#7ec4ef", noise: [], draw: cloud },
};

const cache = new Map<string, string>();

/** Data URL of a pixel background, deterministic per seed. */
export function terrainUrl(terrain: TerrainId, seed: string, width = 320, height = 200): string {
  const key = `${terrain}|${seed}|${width}x${height}`;
  const cached = cache.get(key);
  if (cached) return cached;
  const theme = THEMES[terrain];
  const rng = createSeededRng(hashString(seed));
  const [canvas, ctx] = createCanvas(width, height);
  rect(ctx, theme.base, 0, 0, width, height);
  if (theme.noise.length > 0) {
    for (let y = 0; y < height; y += 2) {
      for (let x = 0; x < width; x += 2) {
        if (rng() < 0.18) rect(ctx, theme.noise[randomInt(rng, 0, theme.noise.length - 1)]!, x, y, 2, 2);
      }
    }
  }
  theme.draw(ctx, rng, width, height);
  const url = canvas.toDataURL();
  cache.set(key, url);
  return url;
}
