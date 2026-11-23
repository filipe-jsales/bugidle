/**
 * The bug hunter: a hand-drawn 16x22 trainer with a cap, jacket and backpack.
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
  SkinShade,
  Shirt,
  BackpackDark,
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
  [Tp.Backpack]: "#a8703e",
  [Tp.SkinShade]: "#c98f62",
  [Tp.Shirt]: "#fbf4e4",
  [Tp.BackpackDark]: "#6b4423",
};

/**
 * Hand-drawn 16x22 grids. k outline, c cap, C cap shade, L logo, h hair, s skin,
 * S skin shade, e eye, j jacket, J jacket shade, w shirt, b backpack, B backpack
 * shade, p pants, o shoes, . empty.
 */
const CODES: Readonly<Record<string, Tp>> = {
  ".": Tp.Empty,
  k: Tp.Outline,
  c: Tp.Cap,
  C: Tp.CapDark,
  L: Tp.Logo,
  h: Tp.Hair,
  s: Tp.Skin,
  S: Tp.SkinShade,
  e: Tp.Eye,
  j: Tp.Jacket,
  J: Tp.JacketDark,
  w: Tp.Shirt,
  b: Tp.Backpack,
  B: Tp.BackpackDark,
  p: Tp.Pants,
  o: Tp.Shoes,
};

// prettier-ignore
const FRONT: readonly string[] = [
  "....kkkkkkkk....",
  "...kcccccccck...",
  "...kcccLLccck...",
  "..kcccccccccck..",
  ".kCCCCCCCCCCCCk.",
  "..khsssssssshk..",
  "..khsesssseshk..",
  "..khsesssseshk..",
  "...kSsskkssSk...",
  "....kSSSSSSk....",
  "..kjjjjwwjjjjk..",
  ".kjkbjjwwjjbkjk.",
  ".kjkbjjJJjjbkjk.",
  ".kjkjjjJJjjjkjk.",
  ".kskjjjJJjjjksk.",
  "..kkJJJJJJJJkk..",
  "...kppppppppk...",
  "...kpppkkpppk...",
  "...kpppkkpppk...",
  "...kpppkkpppk...",
  "..kookkkkkkook..",
  "...kkk....kkk...",
];

// prettier-ignore
const BACK: readonly string[] = [
  "....kkkkkkkk....",
  "...kcccccccck...",
  "...kcccccccck...",
  "..kcccccccccck..",
  "..kCCCCCCCCCCk..",
  "..khhhhhhhhhhk..",
  "..khhhhhhhhhhk..",
  "..khhhhhhhhhhk..",
  "...khhhhhhhhk...",
  "....kSSSSSSk....",
  "..kjjBBBBBBjjk..",
  ".kjkBbbbbbbBkjk.",
  ".kjkBbbLLbbBkjk.",
  ".kjkBbbbbbbBkjk.",
  ".kskBBBBBBBBksk.",
  "..kkJJJJJJJJkk..",
  "...kppppppppk...",
  "...kpppkkpppk...",
  "...kpppkkpppk...",
  "...kpppkkpppk...",
  "..kookkkkkkook..",
  "...kkk....kkk...",
];

// prettier-ignore
const SIDE: readonly string[] = [
  ".....kkkkkk.....",
  "....kcccccck....",
  "...kcLcccccck...",
  "...kcccccccck...",
  ".kCCCCCChhhhk...",
  "..kssssshhhhk...",
  "..ksesshhhhhk...",
  "..kssssshhhhk...",
  "...kSsssShhk....",
  "....kSSSk.......",
  "...kjjjjjjkBBk..",
  "...kjjjjjjkBbBk.",
  "...kjjJJjjkBbBk.",
  "...kjjJJjjkBbBk.",
  "...kjjssjjkBBBk.",
  "...kkJJJJJJkkk..",
  "....kppppk......",
  "....kppppk......",
  "....kppppk......",
  "....kppppk......",
  "...koooook......",
  "....kkkkkk......",
];

/** Rows 16-21 for a step; the other step of the front/back view is this mirrored. */
// prettier-ignore
const FRONT_STEP_LEGS: readonly string[] = [
  "...kppppppppk...",
  "...kpppkkpppk...",
  "...kpppkkpppk...",
  "..kookkkkpppk...",
  "...kkk..kook....",
  "........kkk.....",
];

// prettier-ignore
const SIDE_STEP_A: readonly string[] = [
  "....kppppk......",
  "...kppkkppk.....",
  "..kppk..kppk....",
  "..kppk..kppk....",
  ".koook..koook...",
  "..kkk....kkk....",
];

// prettier-ignore
const SIDE_STEP_B: readonly string[] = [
  "....kppppk......",
  "....kpkkpk......",
  "...kpk.kppk.....",
  "...kpk..kppk....",
  "..kook..kooook..",
  "...kk....kkkk...",
];

const LEG_ROW = 16;
/** Front/back arms: columns of each arm and the rows they can slide in. */
const LEFT_ARM = [1, 2];
const RIGHT_ARM = [13, 14];
const ARM_ROWS = [11, 15];

const mirror = (row: string) => [...row].reverse().join("");

function toPixels(rows: readonly string[]): Uint8Array {
  const pixels = new Uint8Array(TRAINER_WIDTH * TRAINER_HEIGHT);
  rows.forEach((row, y) => {
    for (let x = 0; x < TRAINER_WIDTH; x++) pixels[y * TRAINER_WIDTH + x] = CODES[row[x] ?? "."] ?? Tp.Empty;
  });
  return pixels;
}

/** Slides one arm up (dy -1) or down (dy 1) inside its rows. */
function slideArm(rows: string[], cols: readonly number[], dy: number): void {
  const [top, bottom] = ARM_ROWS as [number, number];
  const original = rows.map((r) => [...r]);
  for (let y = top; y <= bottom; y++) {
    for (const x of cols) {
      const from = y - dy;
      const value = from >= top && from <= bottom ? original[from]![x]! : ".";
      const chars = [...rows[y]!];
      chars[x] = value;
      rows[y] = chars.join("");
    }
  }
}

/** Grid rows for a view and a step (-1, 0 or 1). */
function viewRows(view: "down" | "up" | "left", step: number): string[] {
  if (view === "left") {
    const rows = [...SIDE];
    if (step !== 0) rows.splice(LEG_ROW, 6, ...(step === 1 ? SIDE_STEP_A : SIDE_STEP_B));
    return rows;
  }
  const rows = [...(view === "down" ? FRONT : BACK)];
  if (step !== 0) {
    rows.splice(LEG_ROW, 6, ...(step === 1 ? FRONT_STEP_LEGS : FRONT_STEP_LEGS.map(mirror)));
    // arms swing opposite to the legs
    slideArm(rows, LEFT_ARM, -step);
    slideArm(rows, RIGHT_ARM, step);
  }
  return rows;
}

export type Headwear = "cap" | "beanie" | "none";

/** Rows 0-4 (the top of the head) for each headwear and view. "cap" is the drawing above. */
// prettier-ignore
const HEAD_ROWS: Readonly<Record<Exclude<Headwear, "cap">, Record<"down" | "up" | "left", readonly string[]>>> = {
  beanie: {
    down: [".....kkkkkk.....", "...kkcccccckk...", "..kcccccccccck..", "..kcccccccccck..", "..kCCCCCCCCCCk.."],
    up: [".....kkkkkk.....", "...kkcccccckk...", "..kcccccccccck..", "..kcccccccccck..", "..kCCCCCCCCCCk.."],
    left: [".....kkkkkk.....", "....kcccccck....", "...kcccccccck...", "...kcccccccck...", "..kCCCCCCCCCk..."],
  },
  none: {
    down: ["................", "....kkkkkkkk....", "...khhhhhhhhk...", "..khhhhhhhhhhk..", "..khhhhhhhhhhk.."],
    up: ["................", "....kkkkkkkk....", "...khhhhhhhhk...", "..khhhhhhhhhhk..", "..khhhhhhhhhhk.."],
    left: ["................", ".....kkkkkk.....", "....khhhhhhk....", "...khhhhhhhhk...", "..khhhhhhhhhk..."],
  },
};

/** Colors of each look option: [main, shade]. Ids match game/trainerLook.ts. */
export const LOOK_COLORS: Readonly<Record<string, Readonly<Record<string, readonly [string, string]>>>> = {
  headColor: {
    red: ["#d9473b", "#8f2a24"],
    blue: ["#3b6fd6", "#26489a"],
    green: ["#3f9a4f", "#26663a"],
    black: ["#3a3346", "#1f1a28"],
    purple: ["#9a4fd6", "#62309a"],
    orange: ["#e8892e", "#a85a1a"],
    white: ["#eee6d8", "#b8ad9c"],
    shiny: ["#f06bd0", "#a3358c"],
  },
  hair: {
    brown: ["#4a2c1c", "#4a2c1c"],
    black: ["#1f1a24", "#1f1a24"],
    blond: ["#e8c25a", "#e8c25a"],
    red: ["#b4462a", "#b4462a"],
    blue: ["#4a6ad6", "#4a6ad6"],
    white: ["#e6e2ea", "#e6e2ea"],
  },
  skin: {
    tone1: ["#f8d8b8", "#d8a888"],
    tone2: ["#f0c08e", "#c98f62"],
    tone3: ["#d49a6a", "#a86e44"],
    tone4: ["#a8704a", "#7a4c30"],
    tone5: ["#6e4630", "#4a2c1e"],
  },
  jacket: {
    blue: ["#3b6fd6", "#26489a"],
    red: ["#d9473b", "#8f2a24"],
    green: ["#3f9a4f", "#26663a"],
    black: ["#3a3346", "#1f1a28"],
    purple: ["#9a4fd6", "#62309a"],
    orange: ["#e8892e", "#a85a1a"],
    teal: ["#2fa8a0", "#1d6e69"],
    gold: ["#f2c14e", "#b4822a"],
  },
  pants: {
    navy: ["#2c3048", "#2c3048"],
    black: ["#1f1a24", "#1f1a24"],
    brown: ["#5a3a2a", "#5a3a2a"],
    gray: ["#6a6a78", "#6a6a78"],
    green: ["#3a5a3a", "#3a5a3a"],
  },
  backpack: {
    leather: ["#a8703e", "#6b4423"],
    red: ["#c0453a", "#7a2620"],
    black: ["#3a3346", "#1f1a28"],
    green: ["#4f8a3f", "#2f5a26"],
    legend: ["#7b4fd6", "#f2c14e"],
  },
};

const pick = (part: string, id: string, fallback: readonly [string, string]) => LOOK_COLORS[part]?.[id] ?? fallback;

/** The palette for a look (any missing option uses the default trainer colors). */
export function trainerPalette(look: Readonly<Record<string, string>>): Record<Exclude<Tp, Tp.Empty>, string> {
  const base = { ...TRAINER_PALETTE };
  const [cap, capDark] = pick("headColor", look.headColor ?? "", [base[Tp.Cap], base[Tp.CapDark]]);
  const [skin, skinShade] = pick("skin", look.skin ?? "", [base[Tp.Skin], base[Tp.SkinShade]]);
  const [jacket, jacketDark] = pick("jacket", look.jacket ?? "", [base[Tp.Jacket], base[Tp.JacketDark]]);
  const [backpack, backpackDark] = pick("backpack", look.backpack ?? "", [base[Tp.Backpack], base[Tp.BackpackDark]]);
  return {
    ...base,
    [Tp.Cap]: cap,
    [Tp.CapDark]: capDark,
    [Tp.Logo]: look.headColor === "white" ? "#d9473b" : base[Tp.Logo],
    [Tp.Hair]: pick("hair", look.hair ?? "", [base[Tp.Hair], base[Tp.Hair]])[0],
    [Tp.Skin]: skin,
    [Tp.SkinShade]: skinShade,
    [Tp.Jacket]: jacket,
    [Tp.JacketDark]: jacketDark,
    [Tp.Pants]: pick("pants", look.pants ?? "", [base[Tp.Pants], base[Tp.Pants]])[0],
    [Tp.Backpack]: backpack,
    [Tp.BackpackDark]: backpackDark,
  };
}

const STEP_OF_FRAME: Readonly<Record<WalkFrame, number>> = { 0: 0, 1: 1, 2: -1 };
const cache = new Map<string, Uint8Array>();

/** Pixels for a facing and frame. "right" returns the left sprite; mirror it when drawing. */
export function trainerPixels(facing: Facing, frame: WalkFrame, headwear: Headwear = "cap"): Uint8Array {
  const view = facing === "right" ? "left" : facing;
  const key = `${view}:${frame}:${headwear}`;
  const cached = cache.get(key);
  if (cached) return cached;
  const rows = viewRows(view, STEP_OF_FRAME[frame]);
  if (headwear !== "cap") rows.splice(0, 5, ...HEAD_ROWS[headwear][view]);
  const pixels = toPixels(rows);
  cache.set(key, pixels);
  return pixels;
}

/** Walk cycle: stand, step A, stand, step B. */
export function walkFrame(moving: boolean, walkSeconds: number): WalkFrame {
  if (!moving) return 0;
  return ([1, 0, 2, 0] as const)[Math.floor(walkSeconds * 8) % 4]!;
}
