/**
 * The bug hunter: a 16x22 pixel trainer with a cap, jacket and backpack.
 * Three facings (down, up, side; "right" is the side sprite mirrored) and
 * three frames each (stand, step A, step B). Pure data, rendered by the UI.
 */
export const TRAINER_WIDTH = 16;
export const TRAINER_HEIGHT = 22;

export type Facing = "down" | "up" | "left" | "right";
export type WalkFrame = 0 | 1 | 2;

export enum Tp {
  Empty = 0,
  Outline,
  Cap,
  CapDark,
  Skin,
  Hair,
  Jacket,
  JacketDark,
  Pants,
  Shoes,
  Eye,
  Logo,
  Backpack,
}

export const TRAINER_PALETTE: Readonly<Record<Exclude<Tp, Tp.Empty>, string>> = {
  [Tp.Outline]: "#1a1020",
  [Tp.Cap]: "#d9473b",
  [Tp.CapDark]: "#8f2a24",
  [Tp.Skin]: "#f0c08e",
  [Tp.Hair]: "#4a2c1c",
  [Tp.Jacket]: "#3b6fd6",
  [Tp.JacketDark]: "#26489a",
  [Tp.Pants]: "#2c3048",
  [Tp.Shoes]: "#5a3a2a",
  [Tp.Eye]: "#1a1020",
  [Tp.Logo]: "#fbf4e4",
  [Tp.Backpack]: "#8a5a34",
};

class Grid {
  readonly pixels = new Uint8Array(TRAINER_WIDTH * TRAINER_HEIGHT);
  rect(x: number, y: number, w: number, h: number, value: Tp): void {
    for (let yy = y; yy < y + h; yy++) {
      for (let xx = x; xx < x + w; xx++) {
        if (xx >= 0 && yy >= 0 && xx < TRAINER_WIDTH && yy < TRAINER_HEIGHT) this.pixels[yy * TRAINER_WIDTH + xx] = value;
      }
    }
  }
  get(x: number, y: number): number {
    if (x < 0 || y < 0 || x >= TRAINER_WIDTH || y >= TRAINER_HEIGHT) return Tp.Empty;
    return this.pixels[y * TRAINER_WIDTH + x]!;
  }
}

/** Front and back views share the legs and arms; `step` is -1, 0 or 1. */
function frontBack(g: Grid, back: boolean, step: number): void {
  g.rect(5, 0, 6, 1, Tp.Cap);
  g.rect(4, 1, 8, 3, Tp.Cap);
  if (back) {
    g.rect(4, 4, 8, 1, Tp.CapDark);
    g.rect(5, 5, 6, 4, Tp.Hair);
  } else {
    g.rect(7, 2, 2, 1, Tp.Logo);
    g.rect(3, 4, 10, 1, Tp.CapDark);
    g.rect(4, 5, 1, 2, Tp.Hair);
    g.rect(11, 5, 1, 2, Tp.Hair);
    g.rect(5, 5, 6, 4, Tp.Skin);
    g.rect(6, 6, 1, 1, Tp.Eye);
    g.rect(9, 6, 1, 1, Tp.Eye);
  }
  g.rect(4, 9, 8, 6, Tp.Jacket);
  if (back) {
    g.rect(5, 9, 6, 5, Tp.Backpack);
    g.rect(5, 9, 6, 1, Tp.CapDark);
  } else {
    g.rect(5, 9, 1, 3, Tp.Backpack);
    g.rect(10, 9, 1, 3, Tp.Backpack);
    g.rect(7, 10, 2, 4, Tp.JacketDark);
  }
  // arms swing opposite to the legs
  g.rect(3, 9 - step, 1, 5, Tp.Jacket);
  g.rect(3, 14 - step, 1, 1, Tp.Skin);
  g.rect(12, 9 + step, 1, 5, Tp.Jacket);
  g.rect(12, 14 + step, 1, 1, Tp.Skin);
  g.rect(4, 15, 8, 1, Tp.JacketDark);
  const leftLen = step === 1 ? 3 : 4;
  const rightLen = step === -1 ? 3 : 4;
  g.rect(5, 16, 2, leftLen, Tp.Pants);
  g.rect(4, 16 + leftLen, 3, 1, Tp.Shoes);
  g.rect(9, 16, 2, rightLen, Tp.Pants);
  g.rect(9, 16 + rightLen, 3, 1, Tp.Shoes);
}

/** Facing left. */
function side(g: Grid, step: number): void {
  g.rect(5, 0, 6, 1, Tp.Cap);
  g.rect(5, 1, 7, 3, Tp.Cap);
  g.rect(2, 4, 7, 1, Tp.CapDark);
  g.rect(9, 4, 3, 4, Tp.Hair);
  g.rect(5, 5, 5, 4, Tp.Skin);
  g.rect(6, 6, 1, 1, Tp.Eye);
  g.rect(5, 9, 6, 6, Tp.Jacket);
  g.rect(10, 9, 3, 5, Tp.Backpack);
  g.rect(5, 15, 6, 1, Tp.JacketDark);
  if (step === 0) {
    g.rect(6, 16, 3, 4, Tp.Pants);
    g.rect(5, 20, 4, 1, Tp.Shoes);
    g.rect(7, 9, 2, 5, Tp.JacketDark);
    g.rect(7, 14, 2, 1, Tp.Skin);
  } else {
    const front = step === 1 ? 4 : 5;
    const backLeg = step === 1 ? 9 : 8;
    g.rect(front, 16, 2, 4, Tp.Pants);
    g.rect(front - 1, 20, 3, 1, Tp.Shoes);
    g.rect(backLeg, 16, 2, 4, Tp.Pants);
    g.rect(backLeg, 20, 3, 1, Tp.Shoes);
    g.rect(step === 1 ? 8 : 6, 9, 2, 5, Tp.JacketDark);
    g.rect(step === 1 ? 8 : 6, 14, 2, 1, Tp.Skin);
  }
}

function outline(g: Grid): void {
  const copy = Uint8Array.from(g.pixels);
  const at = (x: number, y: number) => (x < 0 || y < 0 || x >= TRAINER_WIDTH || y >= TRAINER_HEIGHT ? Tp.Empty : copy[y * TRAINER_WIDTH + x]!);
  for (let y = 0; y < TRAINER_HEIGHT; y++) {
    for (let x = 0; x < TRAINER_WIDTH; x++) {
      if (at(x, y) !== Tp.Empty) continue;
      const near = [at(x - 1, y), at(x + 1, y), at(x, y - 1), at(x, y + 1)].some((v) => v !== Tp.Empty && v !== Tp.Outline);
      if (near) g.rect(x, y, 1, 1, Tp.Outline);
    }
  }
}

const STEP_OF_FRAME: Readonly<Record<WalkFrame, number>> = { 0: 0, 1: 1, 2: -1 };
const cache = new Map<string, Uint8Array>();

/** Pixels for a facing and frame. "right" returns the left sprite; mirror it when drawing. */
export function trainerPixels(facing: Facing, frame: WalkFrame): Uint8Array {
  const view = facing === "right" ? "left" : facing;
  const key = `${view}:${frame}`;
  const cached = cache.get(key);
  if (cached) return cached;
  const g = new Grid();
  if (view === "left") side(g, STEP_OF_FRAME[frame]);
  else frontBack(g, view === "up", STEP_OF_FRAME[frame]);
  outline(g);
  cache.set(key, g.pixels);
  return g.pixels;
}

/** Walk cycle: stand, step A, stand, step B. */
export function walkFrame(moving: boolean, walkSeconds: number): WalkFrame {
  if (!moving) return 0;
  return ([1, 0, 2, 0] as const)[Math.floor(walkSeconds * 8) % 4]!;
}
