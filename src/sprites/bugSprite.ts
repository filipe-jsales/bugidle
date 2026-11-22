/**
 * Procedural pixel-art bugs. Each species gets a deterministic, mirror-symmetric
 * 24x24 sprite built from its family (beetle, winged, worm, arachnid), its stage
 * and a seed derived from its id. Pure data: rendering happens in the UI layer.
 */
import type { SpriteFamily } from "../game/data/species";
import { createSeededRng, hashString, type Rng } from "../game/rng";
import type { BugType } from "../game/types";
import { HAND_DRAWN_HALVES as FINAL_FORMS } from "./handDrawn";
import { MORE_HAND_DRAWN_HALVES } from "./handDrawnMore";

/** Every hand-drawn half by species id. */
const HAND_DRAWN_HALVES: Readonly<Record<string, readonly string[]>> = { ...FINAL_FORMS, ...MORE_HAND_DRAWN_HALVES };

export const SPRITE_SIZE = 24;

export enum Px {
  Empty = 0,
  Outline = 1,
  Body = 2,
  Shade = 3,
  Light = 4,
  Accent = 5,
  Eye = 6,
  Pupil = 7,
  Wing = 8,
}

export interface SpriteGrid {
  readonly size: number;
  readonly pixels: Uint8Array;
}

export interface SpriteSpec {
  id: string;
  family: SpriteFamily;
  stage: 1 | 2 | 3;
}

class Canvas {
  readonly pixels = new Uint8Array(SPRITE_SIZE * SPRITE_SIZE);

  get(x: number, y: number): number {
    if (x < 0 || y < 0 || x >= SPRITE_SIZE || y >= SPRITE_SIZE) return Px.Empty;
    return this.pixels[y * SPRITE_SIZE + x]!;
  }

  set(x: number, y: number, value: number): void {
    const xi = Math.round(x);
    const yi = Math.round(y);
    if (xi < 0 || yi < 0 || xi >= SPRITE_SIZE || yi >= SPRITE_SIZE) return;
    this.pixels[yi * SPRITE_SIZE + xi] = value;
  }

  /** Sets a pixel and its mirror across the vertical axis. */
  setSym(x: number, y: number, value: number): void {
    this.set(x, y, value);
    this.set(SPRITE_SIZE - 1 - Math.round(x), y, value);
  }

  ellipse(cx: number, cy: number, rx: number, ry: number, value: number): void {
    for (let y = 0; y < SPRITE_SIZE; y++) {
      for (let x = 0; x < SPRITE_SIZE; x++) {
        const dx = (x + 0.5 - cx) / Math.max(0.5, rx);
        const dy = (y + 0.5 - cy) / Math.max(0.5, ry);
        if (dx * dx + dy * dy <= 1) this.set(x, y, value);
      }
    }
  }

  /** Ellipse on the left side plus its mirror. */
  ellipseSym(cx: number, cy: number, rx: number, ry: number, value: number): void {
    this.ellipse(cx, cy, rx, ry, value);
    this.ellipse(SPRITE_SIZE - cx, cy, rx, ry, value);
  }

  lineSym(x0: number, y0: number, x1: number, y1: number, value: number): void {
    const steps = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0), 1);
    for (let i = 0; i <= steps; i++) {
      this.setSym(x0 + ((x1 - x0) * i) / steps, y0 + ((y1 - y0) * i) / steps, value);
    }
  }
}

const CENTER = SPRITE_SIZE / 2;
const MID = CENTER - 0.5;

function drawEyes(c: Canvas, y: number, spread: number, big: boolean): void {
  const x = Math.round(MID - spread);
  c.setSym(x, y, Px.Eye);
  c.setSym(x, y - 1, Px.Eye);
  if (big) c.setSym(x - 1, y, Px.Eye);
  c.setSym(x, y, Px.Pupil);
}

function drawAntennae(c: Canvas, x: number, y: number, length: number, spread: number): void {
  c.lineSym(x, y, x - spread, y - length, Px.Outline);
  c.setSym(x - spread - 1, y - length, Px.Accent);
}

function beetle(c: Canvas, rng: Rng, s: number, stage: number): void {
  const bodyRy = (6 + rng() * 2) * s;
  const bodyRx = (5 + rng() * 2) * s;
  const cy = 14 + (1 - s) * 2;
  // legs first, the body covers their roots
  for (let i = 0; i < 3; i++) {
    const ly = cy - bodyRy * 0.5 + i * bodyRy * 0.5;
    const lx = MID - bodyRx + 1;
    c.lineSym(lx, ly, lx - 3 * s, ly + (i - 1) * 2 + 1, Px.Outline);
  }
  c.ellipse(CENTER, cy, bodyRx, bodyRy, Px.Body);
  const headY = cy - bodyRy - 1.5 * s + 1;
  c.ellipse(CENTER, headY, 3 * s + 0.5, 2.5 * s + 0.5, Px.Shade);
  for (let y = Math.round(cy - bodyRy + 2); y < cy + bodyRy; y++) {
    if (c.get(11, y) === Px.Body) c.setSym(11, y, Px.Shade);
  }
  const spots = 1 + Math.floor(rng() * 3);
  for (let i = 0; i < spots; i++) {
    const sx = MID - 2 - rng() * (bodyRx - 3);
    const sy = cy - bodyRy * 0.4 + rng() * bodyRy;
    if (c.get(Math.round(sx), Math.round(sy)) === Px.Body) {
      c.setSym(sx, sy, Px.Accent);
      if (stage > 1) c.setSym(sx - 1, sy, Px.Accent);
    }
  }
  drawEyes(c, Math.round(headY), 1.5 * s + 0.5, stage === 1);
  drawAntennae(c, MID - 1, headY - 2 * s, 3 + stage, 2);
  if (stage === 3) {
    c.lineSym(MID - 2, headY + 1, MID - 4, headY - 4, Px.Outline);
    c.setSym(MID - 1, headY + 2, Px.Light);
  }
}

function winged(c: Canvas, rng: Rng, s: number, stage: number): void {
  const upperRx = (4.5 + rng() * 1.5) * s;
  const upperRy = (4 + rng()) * s;
  const lower = 0.6 + rng() * 0.3;
  c.ellipseSym(CENTER - upperRx - 0.5, 10, upperRx, upperRy, Px.Wing);
  c.ellipseSym(CENTER - upperRx * lower - 0.5, 15.5, upperRx * lower, upperRy * 0.8, Px.Wing);
  // wing eye-spots and veins
  const spotX = CENTER - upperRx - 1;
  c.setSym(spotX, 10, Px.Accent);
  if (stage > 1) {
    c.setSym(spotX - 1, 10, Px.Accent);
    c.setSym(spotX, 9, Px.Accent);
  }
  c.lineSym(MID - 1, 11, MID - upperRx * 1.6, 7, Px.Shade);
  c.ellipse(CENTER, 13, 1.5 + stage * 0.3, 7 * s, Px.Body);
  for (let y = 9; y < 20; y += 2) if (c.get(11, y) === Px.Body) c.setSym(11, y, Px.Shade);
  c.ellipse(CENTER, 5.5 + (1 - s) * 4, 2.5, 2, Px.Body);
  drawEyes(c, Math.round(6 + (1 - s) * 4), 1, true);
  drawAntennae(c, MID - 1, 4 + (1 - s) * 4, 3, 2 + Math.floor(rng() * 2));
  if (stage === 3) {
    c.lineSym(MID, 20, MID - 1, 22, Px.Outline);
  }
}

function worm(c: Canvas, rng: Rng, s: number, stage: number): void {
  const segments = 3 + stage;
  const bottom = 21;
  const step = (14 * s) / segments;
  for (let i = 0; i < segments; i++) {
    const cy = bottom - i * step;
    const r = (4.2 - i * 0.25 + rng() * 0.6) * s + 0.5;
    c.ellipse(CENTER, cy, r, step * 0.75 + 0.5, i % 2 === 0 ? Px.Body : Px.Shade);
    c.setSym(MID - r, cy + 1, Px.Outline); // tiny legs
    if (stage === 3 && i % 2 === 1) c.setSym(MID - r - 1, cy - 1, Px.Accent); // spikes
  }
  const headY = bottom - segments * step - 1;
  const headR = 3.5 * s + 0.8;
  c.ellipse(CENTER, headY, headR, headR * 0.85, Px.Body);
  drawEyes(c, Math.round(headY), Math.max(1, headR * 0.45), true);
  c.setSym(MID - 1, headY + headR - 1, Px.Outline); // mandibles
  drawAntennae(c, MID - 1, headY - headR + 1, 2 + stage, 1 + Math.floor(rng() * 2));
  if (stage >= 2) c.setSym(MID - 1, bottom - 1, Px.Accent);
}

function arachnid(c: Canvas, rng: Rng, s: number, stage: number): void {
  const abdomenR = (4.5 + rng() * 1.5) * s;
  const abdomenY = 15 + (1 - s) * 2;
  const headY = abdomenY - abdomenR - 1.5 * s;
  for (let i = 0; i < 4; i++) {
    const ly = headY + i * 1.6;
    const kneeX = MID - 4 - 2.5 * s - (i % 2);
    const kneeY = ly - 2;
    c.lineSym(MID - 1, ly, kneeX, kneeY, Px.Outline);
    c.lineSym(kneeX, kneeY, kneeX - 1, kneeY + 5 + i, Px.Outline);
  }
  c.ellipse(CENTER, abdomenY, abdomenR, abdomenR * 1.05, Px.Body);
  c.ellipse(CENTER, headY, 2.8 * s + 0.6, 2.4 * s + 0.6, Px.Shade);
  // hourglass mark
  c.setSym(11, abdomenY - 1, Px.Accent);
  c.setSym(11, abdomenY + 1, Px.Accent);
  if (stage > 1) c.setSym(10, abdomenY, Px.Accent);
  drawEyes(c, Math.round(headY), 1, false);
  if (stage >= 2) c.setSym(MID - 2, headY - 1, Px.Pupil);
  if (stage >= 2) {
    // pincers
    c.lineSym(MID - 2, headY - 2, MID - 4, headY - 5, Px.Outline);
    c.setSym(MID - 3, headY - 5, Px.Outline);
  }
  if (stage === 3) {
    c.lineSym(MID, abdomenY + abdomenR, MID - 1, 23, Px.Shade);
  }
}

const DRAWERS: Record<SpriteFamily, (c: Canvas, rng: Rng, scale: number, stage: number) => void> = {
  beetle,
  winged,
  worm,
  arachnid,
};

function outlineAndShade(c: Canvas): void {
  const copy = Uint8Array.from(c.pixels);
  const at = (x: number, y: number) => (x < 0 || y < 0 || x >= SPRITE_SIZE || y >= SPRITE_SIZE ? Px.Empty : copy[y * SPRITE_SIZE + x]!);
  const solid = (v: number) => v !== Px.Empty && v !== Px.Outline;
  for (let y = 0; y < SPRITE_SIZE; y++) {
    for (let x = 0; x < SPRITE_SIZE; x++) {
      const v = at(x, y);
      if (v === Px.Empty) {
        if (solid(at(x - 1, y)) || solid(at(x + 1, y)) || solid(at(x, y - 1)) || solid(at(x, y + 1))) c.set(x, y, Px.Outline);
      } else if (v === Px.Body) {
        if (!solid(at(x, y - 1))) c.set(x, y, Px.Light);
        else if (!solid(at(x, y + 1)) || !solid(at(x, y + 2))) c.set(x, y, Px.Shade);
      }
    }
  }
}

const cache = new Map<string, SpriteGrid>();

const HAND_CODES: Readonly<Record<string, Px>> = {
  ".": Px.Empty,
  k: Px.Outline,
  b: Px.Body,
  s: Px.Shade,
  l: Px.Light,
  a: Px.Accent,
  e: Px.Eye,
  p: Px.Pupil,
  w: Px.Wing,
};

export type AnimFrame = 0 | 1;

/** Rows from the top down to here move in the "breathing" frame. */
const BREATH_PIVOT = 15;

export function hasHandDrawnSprite(id: string): boolean {
  return id in HAND_DRAWN_HALVES;
}

function fromHalves(half: readonly string[]): Uint8Array {
  const pixels = new Uint8Array(SPRITE_SIZE * SPRITE_SIZE);
  half.forEach((row, y) => {
    for (let x = 0; x < SPRITE_SIZE / 2; x++) {
      const value = HAND_CODES[row[x] ?? "."] ?? Px.Empty;
      pixels[y * SPRITE_SIZE + x] = value;
      pixels[y * SPRITE_SIZE + (SPRITE_SIZE - 1 - x)] = value;
    }
  });
  return pixels;
}

/** Idle frame 1: the upper body sinks one pixel, like breathing in. */
function breathe(pixels: Uint8Array): Uint8Array {
  const out = Uint8Array.from(pixels);
  for (let y = BREATH_PIVOT; y >= 1; y--) {
    for (let x = 0; x < SPRITE_SIZE; x++) out[y * SPRITE_SIZE + x] = pixels[(y - 1) * SPRITE_SIZE + x]!;
  }
  for (let x = 0; x < SPRITE_SIZE; x++) out[x] = Px.Empty;
  return out;
}

export function generateBugSprite(spec: SpriteSpec, frame: AnimFrame = 0): SpriteGrid {
  const key = `${spec.id}:${spec.family}:${spec.stage}:${frame}`;
  const cached = cache.get(key);
  if (cached) return cached;
  let pixels: Uint8Array;
  if (frame === 1) {
    pixels = breathe(generateBugSprite(spec, 0).pixels);
  } else if (HAND_DRAWN_HALVES[spec.id]) {
    pixels = fromHalves(HAND_DRAWN_HALVES[spec.id]!);
  } else {
    const canvas = new Canvas();
    const rng = createSeededRng(hashString(spec.id));
    const scale = spec.stage === 1 ? 0.72 : spec.stage === 2 ? 0.86 : 1;
    DRAWERS[spec.family](canvas, rng, scale, spec.stage);
    outlineAndShade(canvas);
    pixels = canvas.pixels;
  }
  const grid = { size: SPRITE_SIZE, pixels };
  cache.set(key, grid);
  return grid;
}

export interface Palette {
  outline: string;
  body: string;
  shade: string;
  light: string;
  accent: string;
  wing: string;
}

const EYE = "#f4f1e8";
const PUPIL = "#1a1020";

export const TYPE_PALETTES: Record<BugType, Palette> = {
  syntax: { outline: "#2a1a1f", body: "#e05d5d", shade: "#a63a48", light: "#ff9b8a", accent: "#ffd166", wing: "#f7b2a6" },
  logic: { outline: "#1d1b2e", body: "#7c6ee6", shade: "#5143a8", light: "#b5aaff", accent: "#ffe066", wing: "#c9c0ff" },
  memory: { outline: "#1e2418", body: "#7fb347", shade: "#4f7a2a", light: "#b6e27a", accent: "#e8d44d", wing: "#cfe9a8" },
  concurrency: { outline: "#2a1d12", body: "#e8923a", shade: "#a85f1f", light: "#ffc27a", accent: "#5fd3e0", wing: "#ffd9a8" },
  network: { outline: "#122126", body: "#3fb5c9", shade: "#237a8c", light: "#8ae4f0", accent: "#ff7eb6", wing: "#bdf0f7" },
  security: { outline: "#20121c", body: "#c2408f", shade: "#7d2560", light: "#f08ac6", accent: "#9df27a", wing: "#f5bfe0" },
  performance: { outline: "#24200f", body: "#d9b43a", shade: "#9a7a1c", light: "#ffe58a", accent: "#e0533d", wing: "#fff0b8" },
  ui: { outline: "#14182a", body: "#5b8def", shade: "#3659a8", light: "#a8c6ff", accent: "#ff9f43", wing: "#d1e0ff" },
};

/** Shiny bugs swap to a metallic palette that keeps the type's accent. */
export function shinyPalette(base: Palette): Palette {
  return { outline: "#1f1a10", body: "#e9e4d4", shade: "#a8a08a", light: "#ffffff", accent: base.accent, wing: "#fff7c2" };
}

export function colorFor(px: number, palette: Palette, secondary?: Palette): string | null {
  switch (px) {
    case Px.Outline:
      return palette.outline;
    case Px.Body:
      return palette.body;
    case Px.Shade:
      return palette.shade;
    case Px.Light:
      return palette.light;
    case Px.Accent:
      return secondary?.body ?? palette.accent;
    case Px.Eye:
      return EYE;
    case Px.Pupil:
      return PUPIL;
    case Px.Wing:
      return secondary?.wing ?? palette.wing;
    default:
      return null;
  }
}
