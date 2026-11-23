/**
 * Map art: each region is a themed place, not a flat color. The battle map is
 * drawn in layers at half resolution (shown at 2x):
 *   1. ground tiles with variations,
 *   2. global details (copper traces, cable runs...),
 *   3. holes (the sky under the clouds),
 *   4. roads with a textured fill and an edge,
 *   5. the Reboot Center square,
 *   6. small decorations that do not block.
 * Obstacles are separate sprites (they stand up and sort by depth with the
 * bugs). The region map reuses the same ground, details and road style.
 */
import type { TerrainId } from "../../game/data/world";
import { createSeededRng, hashString, randomInt, type Rng } from "../../game/rng";
import { isRoad, type Nav, type Obstacle } from "../world/navigation";
import type { Vec } from "../world/worldModel";

type Ctx = CanvasRenderingContext2D;
type R = (color: string, x: number, y: number, w: number, h: number) => void;

const OUTLINE = "#1f1424";
const TILE = 16;

function canvas(w: number, h: number): [HTMLCanvasElement, Ctx] {
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  const ctx = c.getContext("2d");
  if (!ctx) throw new Error("2D canvas not supported");
  return [c, ctx];
}

const rectOf =
  (ctx: Ctx): R =>
  (color, x, y, w, h) => {
    ctx.fillStyle = color;
    ctx.fillRect(Math.round(x), Math.round(y), Math.max(1, Math.round(w)), Math.max(1, Math.round(h)));
  };

/** Filled pixel disc. */
function disc(r: R, color: string, cx: number, cy: number, radius: number): void {
  for (let y = -radius; y <= radius; y++) {
    const half = Math.floor(Math.sqrt(Math.max(0, radius * radius - y * y)));
    r(color, cx - half, cy + y, half * 2 + 1, 1);
  }
}

/** Adds a 1px dark outline around everything drawn on a transparent canvas. */
function outline(ctx: Ctx, w: number, h: number): void {
  const img = ctx.getImageData(0, 0, w, h);
  const a = (x: number, y: number) => (x < 0 || y < 0 || x >= w || y >= h ? 0 : img.data[(y * w + x) * 4 + 3]!);
  const mark: number[] = [];
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) if (a(x, y) === 0 && (a(x - 1, y) || a(x + 1, y) || a(x, y - 1) || a(x, y + 1))) mark.push(x, y);
  ctx.fillStyle = OUTLINE;
  for (let i = 0; i < mark.length; i += 2) ctx.fillRect(mark[i]!, mark[i + 1]!, 1, 1);
}

// ------------------------------------------------------------------ themes

interface Theme {
  /** Draws one 16x16 ground tile. */
  tile: (r: R, x: number, y: number, rng: Rng) => void;
  /** Big details over the ground (under roads). */
  details?: (r: R, w: number, h: number, rng: Rng) => void;
  /** 8x8 road texture. */
  road: (r: R) => void;
  roadEdge: string;
  roadLip: string;
  /** Small drawings that do not block. */
  decor: readonly ((r: R, x: number, y: number, rng: Rng) => void)[];
  /** Standing obstacle drawings; they fill a w x h box. */
  props: readonly ((r: R, w: number, h: number) => void)[];
  /** Obstacle variants drawn as holes in the ground instead of props. */
  holes?: (variant: number) => boolean;
  /** Reboot Center square: edge, base, stone, stone highlight. */
  plaza: readonly [string, string, string, string];
  /** Ground area (half-res px²) per decoration: bigger = fewer. */
  decorEvery: number;
}

// ---- circuit board (Localhost)

const circuit: Theme = {
  tile: (r, x, y, rng) => {
    r("#2f7a4a", x, y, TILE, TILE);
    for (let i = 0; i < 6; i++) r("#2a6f43", x + randomInt(rng, 0, 15), y + randomInt(rng, 0, 15), 1, 1);
    for (let i = 2; i < TILE; i += 4) for (let j = 2; j < TILE; j += 4) r("#34834f", x + i, y + j, 1, 1);
    if (rng() < 0.18) {
      const vx = x + randomInt(rng, 3, 11);
      const vy = y + randomInt(rng, 3, 11);
      r("#c9a24a", vx, vy, 3, 3);
      r("#1a3b26", vx + 1, vy + 1, 1, 1);
    }
  },
  details: (r, w, h, rng) => {
    const n = Math.round((w * h) / 1400);
    for (let i = 0; i < n; i++) {
      let x = randomInt(rng, 0, w);
      let y = randomInt(rng, 0, h);
      r("#e0c070", x - 1, y - 1, 3, 3);
      for (let s = 0; s < 4; s++) {
        const len = randomInt(rng, 6, 26);
        const dir = randomInt(rng, 0, 3);
        for (let k = 0; k < len; k++) {
          if (dir === 0) x++;
          else if (dir === 1) y++;
          else if (dir === 2) {
            x++;
            y++;
          } else {
            x++;
            y--;
          }
          r("#b8913f", x, y, 1, 1);
        }
      }
      r("#e0c070", x - 1, y - 1, 3, 3);
      r("#1a3b26", x, y, 1, 1);
    }
  },
  road: (r) => {
    r("#b48f3e", 0, 0, 8, 8);
    r("#c9a24a", 0, 0, 8, 1);
    r("#e0c070", 1, 2, 2, 2);
    r("#e0c070", 5, 6, 2, 2);
    r("#8a6a2a", 4, 3, 1, 1);
    r("#8a6a2a", 0, 7, 1, 1);
  },
  roadEdge: "#6e5422",
  roadLip: "#1f4a30",
  plaza: ["#6d6872", "#9aa0ad", "#c8ccd4", "#e6e8ee"],
  decorEvery: 1600,
  decor: [
    (r, x, y) => {
      r("#1c1c22", x, y, 5, 2);
      r("#d8d8d0", x - 1, y, 1, 2);
      r("#d8d8d0", x + 5, y, 1, 2);
    },
    (r, x, y) => {
      r("#c4a06a", x, y, 2, 3);
      r("#8a6a2a", x, y + 2, 2, 1);
    },
    (r, x, y, rng) => {
      const c = rng() < 0.5 ? "#e2574c" : "#5fe08a";
      r(c, x, y, 2, 2);
      r("#ffffff", x, y, 1, 1);
    },
    (r, x, y) => {
      r("#e6e6ee", x, y, 1, 3);
      r("#e6e6ee", x + 2, y, 1, 3);
      r("#e6e6ee", x, y, 3, 1);
      r("#e6e6ee", x + 4, y, 1, 3);
      r("#e6e6ee", x + 4, y + 2, 2, 1);
    },
    (r, x, y) => {
      r("#9aa0ad", x, y, 3, 3);
      r("#40394c", x + 1, y + 1, 1, 1);
    },
  ],
  props: [
    (r, w, h) => {
      const top = h - Math.round(w * 0.8);
      for (let x = 3; x < w - 3; x += 3) {
        r("#d8d8d0", x, top - 2, 1, 3);
        r("#d8d8d0", x, h - 4, 1, 3);
      }
      r("#26202e", 1, top + 1, w - 2, h - top - 4);
      r("#40394c", 1, top, w - 2, 3);
      r("#5a5468", 2, top, w - 4, 1);
      r("#e6e6ee", 3, top + 4, 2, 2);
      r("#6e6680", 4, h - 10, w - 8, 1);
    },
    (r, w, h) => {
      const bw = Math.max(8, Math.round(w * 0.72));
      const x0 = Math.round((w - bw) / 2);
      r("#2f66b0", x0, 5, bw, h - 7);
      r("#5aa2ef", x0 + 1, 5, Math.max(2, Math.round(bw * 0.35)), h - 9);
      r("#1d3d6e", x0 + bw - 3, 6, 3, h - 9);
      r("#e6e6ee", x0 + Math.round(bw * 0.55), 6, 2, h - 10);
      r("#c9c9d4", x0, 2, bw, 4);
      r("#ffffff", x0 + 1, 2, bw - 3, 1);
      r("#8a8a96", x0 + Math.round(bw / 2) - 1, 3, 2, 2);
    },
    (r, w, h) => {
      const top = Math.round(h * 0.3);
      r("#6d7280", 1, h - 6, w - 2, 5);
      for (let x = 1; x < w - 1; x += 3) {
        r("#b8bcc6", x, top, 2, h - top - 6);
        r("#e6e8ee", x, top, 1, h - top - 6);
      }
    },
    (r, w, h) => {
      const bw = Math.round(w * 0.8);
      const x0 = Math.round((w - bw) / 2);
      r("#b8b8c0", x0, h - 12, bw, 9);
      r("#e6e6ee", x0 + 1, h - 12, bw - 2, 2);
      r("#8a8a96", x0, h - 5, bw, 2);
      r("#d8d8d0", x0 + 2, h - 3, 1, 3);
      r("#d8d8d0", x0 + bw - 3, h - 3, 1, 3);
    },
    (r, w, h) => {
      const top = h - Math.round(w * 0.5);
      r("#26202e", 1, top, w - 2, h - top - 2);
      for (let x = 3; x < w - 3; x += 3) {
        r("#ffd25a", x, top - 4, 1, 5);
        r("#c48a22", x, top - 4, 1, 1);
      }
    },
    (r, w, h) => {
      const c = Math.round(w / 2);
      r("#3a2a20", 2, h - 6, w - 4, 4);
      for (let y = 6; y < h - 6; y += 3) {
        r("#b8733a", 3, y, w - 6, 2);
        r("#e0a060", 3, y, w - 6, 1);
      }
      r("#26202e", c - 1, 3, 2, h - 8);
    },
  ],
};

// ---- server room (Staging)

const server: Theme = {
  tile: (r, x, y, rng) => {
    r("#3a4256", x, y, TILE, TILE);
    r("#465068", x, y, TILE - 1, 1);
    r("#465068", x, y, 1, TILE - 1);
    r("#262c3a", x + TILE - 1, y, 1, TILE);
    r("#262c3a", x, y + TILE - 1, TILE, 1);
    const kind = rng();
    if (kind < 0.25) for (let i = 3; i < 14; i += 3) for (let j = 3; j < 14; j += 3) r("#262c3a", x + i, y + j, 1, 1);
    else if (kind < 0.33) for (let j = 4; j < 13; j += 2) r("#20263a", x + 3, y + j, 10, 1);
  },
  details: (r, w, h, rng) => {
    const colors = ["#e2574c", "#5aa2ef", "#ffd25a", "#5fcf7a"];
    for (let i = 0; i < Math.round((w * h) / 9000); i++) {
      let x = randomInt(rng, 0, w);
      let y = randomInt(rng, 0, h);
      const c = colors[randomInt(rng, 0, colors.length - 1)]!;
      const horizontal = rng() < 0.5;
      for (let k = 0; k < randomInt(rng, 20, 60); k++) {
        if (horizontal) x++;
        else y++;
        if (k % 9 === 0) horizontal ? (y += rng() < 0.5 ? 1 : -1) : (x += rng() < 0.5 ? 1 : -1);
        r(c, x, y, 1, 1);
        r("#1c2130", x + 1, y + 1, 1, 1);
      }
    }
  },
  road: (r) => {
    r("#5a6478", 0, 0, 8, 8);
    r("#6e7a90", 1, 1, 2, 1);
    r("#6e7a90", 5, 5, 2, 1);
    r("#474f60", 2, 2, 1, 1);
    r("#474f60", 6, 6, 1, 1);
  },
  roadEdge: "#e0c34a",
  roadLip: "#1c2130",
  plaza: ["#1c2130", "#5a6478", "#7a86a0", "#9aa6bc"],
  decorEvery: 2200,
  decor: [
    (r, x, y) => {
      r("#262c3a", x, y, 8, 6);
      for (let j = 1; j < 6; j += 2) r("#5a6478", x + 1, y + j, 6, 1);
    },
    (r, x, y) => {
      r("#ffd25a", x, y, 4, 4);
      r("#c48a22", x, y + 3, 4, 1);
    },
    (r, x, y) => {
      r("#f4ece0", x, y, 3, 3);
      r("#a8703e", x + 1, y + 1, 1, 1);
    },
    (r, x, y) => {
      r("#e2574c", x, y + 2, 7, 4);
      r("#a8352f", x, y + 5, 7, 1);
      r("#40394c", x + 2, y, 3, 2);
    },
  ],
  props: [
    (r, w, h) => {
      r("#26202e", 0, 0, w, h - 1);
      r("#3a4356", 1, 1, w - 3, h - 3);
      r("#4b566e", 1, 1, w - 3, 2);
      for (let y = 5; y < h - 4; y += 4) {
        r("#20263a", 3, y, w - 7, 3);
        r(y % 8 === 1 ? "#5fe08a" : "#ffd25a", w - 6, y + 1, 1, 1);
        r("#5fe08a", w - 8, y + 1, 1, 1);
      }
      r("#6e7a90", 1, 1, 1, h - 3);
    },
    (r, w, h) => {
      const top = Math.round(h * 0.35);
      r("#26202e", 1, top, w - 2, h - top - 1);
      r("#40394c", 2, top + 1, w - 4, h - top - 4);
      r("#5a5468", 2, top + 1, w - 4, 2);
      r("#3fb5c9", 4, top + 5, Math.max(4, w - 12), 4);
      r("#8ae4f0", 4, top + 5, 2, 1);
      r("#5fe08a", w - 6, top + 6, 2, 2);
    },
    (r, w, h) => {
      const c = Math.round(w / 2);
      const rad = Math.round(w / 2) - 1;
      disc(r, "#6b4423", c, h - rad - 2, rad);
      disc(r, "#a8703e", c, h - rad - 3, rad - 1);
      disc(r, "#2f66b0", c, h - rad - 3, Math.max(2, rad - 3));
      disc(r, "#6b4423", c, h - rad - 3, Math.max(1, Math.round(rad / 3)));
    },
    (r, w, h) => {
      r("#26202e", 0, 0, w, h - 1);
      r("#2c3448", 1, 1, w - 3, h - 3);
      const colors = ["#e2574c", "#5aa2ef", "#ffd25a", "#5fcf7a", "#c477e8"];
      for (let y = 4; y < h - 6; y += 5) {
        r("#40394c", 3, y, w - 7, 3);
        for (let x = 4; x < w - 5; x += 2) r(colors[(x + y) % colors.length]!, x, y + 3, 1, 2);
      }
    },
    (r, w, h) => {
      const bw = Math.max(6, Math.round(w * 0.4));
      const x0 = Math.round((w - bw) / 2);
      r("#a8352f", x0, 6, bw, h - 8);
      r("#e2574c", x0 + 1, 6, Math.max(1, bw - 3), h - 10);
      r("#26202e", x0 + 1, 2, bw - 2, 4);
      r("#d8d8d0", x0 + 1, 8, bw - 2, 2);
    },
    (r, w, h) => {
      const top = Math.round(h * 0.4);
      r("#26202e", 1, top, w - 2, h - top - 1);
      r("#6d7280", 2, top + 1, w - 4, h - top - 4);
      r("#9aa0ad", 2, top + 1, w - 4, 2);
      for (let x = 4; x < w - 4; x += 3) r("#26202e", x, top + 5, 2, h - top - 10);
    },
  ],
};

// ---- datacenter floor (Production)

const datacenter: Theme = {
  tile: (r, x, y, rng) => {
    r("#7d828c", x, y, TILE, TILE);
    for (let i = 0; i < 8; i++) r(rng() < 0.5 ? "#737882" : "#878c96", x + randomInt(rng, 0, 15), y + randomInt(rng, 0, 15), 1, 1);
    if (((x / TILE) | 0) % 2 === 0) r("#6a6f78", x, y, 1, TILE);
    if (((y / TILE) | 0) % 2 === 0) r("#6a6f78", x, y, TILE, 1);
    if (rng() < 0.05) {
      r("#4a4f58", x + 4, y + 4, 8, 8);
      for (let j = 5; j < 12; j += 2) r("#2f333a", x + 5, y + j, 6, 1);
    }
  },
  details: (r, w, h, rng) => {
    for (let i = 0; i < Math.round((w * h) / 12000); i++) {
      const x = randomInt(rng, 0, w);
      const y = randomInt(rng, 0, h);
      r("#e0c34a", x, y, 6, 1);
      r("#e0c34a", x, y, 1, 6);
    }
  },
  road: (r) => {
    r("#3a6fb8", 0, 0, 8, 8);
    r("#4a80c8", 0, 0, 8, 1);
    r("#4a80c8", 0, 4, 8, 1);
    r("#2f5ea0", 3, 2, 2, 1);
  },
  roadEdge: "#f4ece0",
  roadLip: "#2a4f88",
  plaza: ["#4a4f58", "#a8adb6", "#c4c8d0", "#e0e2e8"],
  decorEvery: 5200,
  decor: [
    (r, x, y) => {
      r("#ffd25a", x + 2, y, 2, 1);
      r("#ffd25a", x + 1, y + 1, 4, 1);
      r("#ffd25a", x, y + 2, 6, 2);
      r("#26202e", x + 2, y + 1, 2, 2);
    },
    (r, x, y) => {
      r("#f4ece0", x, y + 2, 6, 2);
      r("#f4ece0", x + 4, y, 2, 6);
      r("#f4ece0", x + 6, y + 2, 1, 2);
    },
    (r, x, y) => {
      r("#f08a3c", x + 2, y, 2, 4);
      r("#ffffff", x + 2, y + 2, 2, 1);
      r("#b45a1c", x, y + 4, 6, 2);
    },
    (r, x, y) => {
      r("#6a7f9a", x, y, 9, 4);
      r("#8aa0ba", x + 1, y, 5, 1);
    },
  ],
  props: [
    (r, w, h) => {
      const top = Math.round(h * 0.18);
      r("#26202e", 0, top, w, h - top - 1);
      r("#a8adb6", 1, top + 1, w - 3, h - top - 3);
      r("#d0d4dc", 1, top + 1, w - 3, 2);
      const c = Math.round(w / 2) - 1;
      const rad = Math.max(3, Math.round(w * 0.27));
      const cy = top + Math.round((h - top) * 0.45);
      disc(r, "#4a4f58", c, cy, rad);
      disc(r, "#6d727c", c, cy, rad - 1);
      r("#2f333a", c - rad + 1, cy, rad * 2 - 1, 1);
      r("#2f333a", c, cy - rad + 1, 1, rad * 2 - 1);
      r("#5fe08a", 3, h - 6, 2, 2);
    },
    (r, w, h) => {
      const top = Math.round(h * 0.35);
      r("#26202e", 0, top, w, h - top - 1);
      r("#f08a3c", 1, top + 1, w - 3, h - top - 3);
      r("#ffc07a", 1, top + 1, w - 3, 2);
      r("#b45a1c", 1, h - 5, w - 3, 2);
      for (let x = 3; x < w - 4; x += 3) r("#b45a1c", x, top + 5, 1, h - top - 11);
      r("#40394c", w - 6, top - 4, 3, 5);
    },
    (r, w, h) => {
      const top = Math.round(h * 0.45);
      for (let x = 1; x < w - 2; x += Math.max(4, Math.round(w / 4))) {
        r("#26202e", x, top, Math.max(3, Math.round(w / 4) - 1), h - top - 1);
        r("#40394c", x + 1, top + 1, Math.max(1, Math.round(w / 4) - 3), h - top - 4);
        r("#5fe08a", x + 1, top + 2, 1, 1);
      }
    },
    (r, w, h) => {
      const c = Math.round(w / 2);
      const rad = Math.round(w / 2) - 1;
      r("#6d727c", 1, Math.round(h * 0.35), w - 2, h - Math.round(h * 0.35) - 3);
      r("#9aa0ad", 1, Math.round(h * 0.35), 2, h - Math.round(h * 0.35) - 3);
      disc(r, "#a8adb6", c, Math.round(h * 0.35), rad);
      disc(r, "#4a4f58", c, Math.round(h * 0.35), rad - 2);
      r("#d0d4dc", c - rad + 3, Math.round(h * 0.35), rad * 2 - 5, 1);
    },
    (r, w, h) => {
      const top = Math.round(h * 0.15);
      r("#40394c", 1, top, w - 2, h - top - 2);
      r("#2c3448", 3, top + 2, w - 6, h - top - 6);
      for (let x = 1; x < w - 1; x += 2) r("#b8bcc6", x, top, 1, h - top - 2);
      for (let y = top; y < h - 2; y += 4) r("#b8bcc6", 1, y, w - 2, 1);
    },
    (r, w, h) => {
      const bw = Math.round(w * 0.5);
      const x0 = Math.round((w - bw) / 2);
      r("#e2574c", x0, h - 16, bw, 14);
      r("#ff8a7a", x0 + 1, h - 16, 2, 12);
      r("#f4ece0", x0, h - 11, bw, 2);
      r("#40394c", x0 + Math.round(bw / 2) - 1, h - 20, 2, 4);
    },
  ],
};

// ---- 70s computer hall (Legacy)

const mainframe: Theme = {
  tile: (r, x, y, rng) => {
    for (let j = 0; j < 2; j++) for (let i = 0; i < 2; i++) r((i + j) % 2 === 0 ? "#d8cba8" : "#b89c70", x + i * 8, y + j * 8, 8, 8);
    for (let i = 0; i < 4; i++) r(rng() < 0.5 ? "#c8b890" : "#a88c60", x + randomInt(rng, 0, 15), y + randomInt(rng, 0, 15), 1, 1);
  },
  road: (r) => {
    r("#8a2f2a", 0, 0, 8, 8);
    r("#a84a3a", 3, 1, 2, 1);
    r("#a84a3a", 2, 2, 4, 1);
    r("#a84a3a", 3, 3, 2, 1);
    r("#6e2420", 0, 7, 8, 1);
  },
  roadEdge: "#d8a84a",
  roadLip: "#4a1f18",
  plaza: ["#4a2f18", "#8a5a34", "#b8844a", "#d8a46a"],
  decorEvery: 2600,
  decor: [
    (r, x, y) => {
      r("#f4ece0", x, y, 7, 3);
      for (let i = 1; i < 6; i += 2) r("#40394c", x + i, y + 1, 1, 1);
    },
    (r, x, y) => {
      r("#f4ece0", x, y, 6, 8);
      for (let j = 1; j < 8; j += 2) r("#a6e0b0", x, y + j, 6, 1);
      r("#9aa0ad", x, y, 1, 8);
    },
    (r, x, y) => {
      r("#f4ece0", x, y, 4, 3);
      r("#6b4423", x + 1, y, 2, 1);
      r("#f4ece0", x + 4, y + 1, 1, 1);
    },
    (r, x, y) => {
      r("#40394c", x, y, 5, 5);
      r("#9aa0ad", x + 1, y, 3, 2);
    },
  ],
  props: [
    (r, w, h) => {
      r("#26202e", 0, 0, w, h - 1);
      r("#d8cba8", 1, 1, w - 3, h - 3);
      r("#f0e4c0", 1, 1, w - 3, 2);
      r("#b8a982", 1, h - 9, w - 3, 6);
      const reel = Math.max(3, Math.round(w * 0.18));
      for (const cx of [Math.round(w * 0.3), Math.round(w * 0.68)]) {
        disc(r, "#3a3028", cx, 5 + reel, reel);
        disc(r, "#6a5a48", cx, 5 + reel, reel - 1);
        r("#3a3028", cx - 1, 4 + reel, 2, 2);
      }
      r("#e2574c", 3, h - 14, 2, 2);
      r("#5fe08a", 6, h - 14, 2, 2);
    },
    (r, w, h) => {
      r("#26202e", 0, 0, w, h - 1);
      r("#5a6478", 1, 1, w - 3, h - 3);
      r("#7a86a0", 1, 1, w - 3, 2);
      const colors = ["#e2574c", "#ffd25a", "#5fe08a", "#ffffff"];
      for (let y = 5; y < h - 8; y += 3) for (let x = 3; x < w - 4; x += 3) r(colors[(x * 7 + y * 3) % colors.length]!, x, y, 1, 1);
      r("#40394c", 2, h - 6, w - 5, 3);
    },
    (r, w, h) => {
      const top = Math.round(h * 0.45);
      r("#6b4423", 1, top + 6, w - 2, h - top - 7);
      r("#a8703e", 1, top + 6, w - 2, 2);
      r("#d8cba8", 3, top - 2, w - 6, 8);
      r("#26202e", 5, top - 1, w - 10, 3);
      r("#f4ece0", 6, top - 6, w - 12, 5);
      for (let j = top - 5; j < top - 1; j += 2) r("#9aa0ad", 7, j, w - 14, 1);
    },
    (r, w, h) => {
      r("#26202e", 0, 0, w, h - 1);
      r("#8a7a5a", 1, 1, w - 3, h - 3);
      for (let y = 3; y < h - 4; y += 5) {
        r("#a8987a", 2, y, w - 5, 4);
        r("#40394c", Math.round(w / 2) - 2, y + 1, 4, 1);
      }
    },
    (r, w, h) => {
      const c = Math.round(w / 2);
      r("#a84a3a", c - 5, h - 9, 10, 8);
      r("#d8734a", c - 5, h - 9, 10, 2);
      for (let i = 0; i < 9; i++) {
        const angle = -Math.PI + (i / 8) * Math.PI;
        for (let s = 2; s < Math.round(h * 0.7); s++) r(s % 3 === 0 ? "#2f8a49" : "#5fcf7a", c + Math.cos(angle) * s * 0.55, h - 10 + Math.sin(angle) * s, 2, 1);
      }
    },
    (r, w, h) => {
      const top = Math.round(h * 0.4);
      r("#6b4423", 1, top + 8, w - 2, 4);
      r("#4a2f18", 3, top + 12, 2, h - top - 13);
      r("#4a2f18", w - 5, top + 12, 2, h - top - 13);
      r("#d8cba8", 4, top - 4, w - 8, 12);
      r("#1f3a24", 6, top - 2, w - 12, 7);
      r("#5fe08a", 7, top - 1, Math.max(2, w - 16), 1);
      r("#5fe08a", 7, top + 1, Math.max(1, w - 20), 1);
    },
  ],
};

// ---- sky level (Cloud)

const cloud: Theme = {
  tile: (r, x, y, rng) => {
    r("#dcecf8", x, y, TILE, TILE);
    for (let i = 0; i < 4; i++) {
      const px = x + randomInt(rng, 2, 13);
      const py = y + randomInt(rng, 2, 13);
      r("#eef6fc", px - 3, py - 1, 6, 3);
      r("#ffffff", px - 2, py - 1, 3, 1);
      r("#bcd6ec", px - 3, py + 2, 6, 1);
    }
  },
  details: (r, w, h, rng) => {
    // puffy cloud mounds: shadow, body, highlight
    for (let i = 0; i < Math.round((w * h) / 1800); i++) {
      const x = randomInt(rng, 0, w);
      const y = randomInt(rng, 0, h);
      const size = randomInt(rng, 5, 11);
      disc(r, "#b4cfe6", x + 1, y + 3, size);
      disc(r, "#eef6fc", x, y, size);
      disc(r, "#eef6fc", x + size, y + 1, size - 2);
      disc(r, "#eef6fc", x - size + 1, y + 2, size - 3);
      disc(r, "#ffffff", x - 2, y - 2, Math.max(2, size - 4));
    }
  },
  road: (r) => {
    r("#d8a84a", 0, 0, 8, 8);
    r("#a87a28", 0, 3, 8, 1);
    r("#a87a28", 0, 7, 8, 1);
    r("#a87a28", 3, 0, 1, 3);
    r("#a87a28", 7, 4, 1, 3);
    r("#f0c868", 0, 0, 3, 1);
    r("#f0c868", 4, 4, 3, 1);
  },
  roadEdge: "#7a5a1a",
  roadLip: "#9cc6e4",
  holes: (variant) => variant >= 4,
  plaza: ["#c48a22", "#e8e4dc", "#ffffff", "#fff7c2"],
  decorEvery: 3200,
  decor: [
    (r, x, y) => {
      r("#fff7c2", x + 1, y, 1, 3);
      r("#fff7c2", x, y + 1, 3, 1);
    },
    (r, x, y) => {
      const colors = ["#e2574c", "#f08a3c", "#ffd25a", "#5fcf7a", "#5aa2ef"];
      colors.forEach((c, i) => r(c, x, y + i, 9 - i, 1));
    },
    (r, x, y) => {
      r("#5aa2ef", x, y, 4, 4);
      r("#acd4ff", x, y, 4, 1);
      r("#2f66b0", x + 3, y + 1, 1, 3);
    },
    (r, x, y) => {
      r("#40394c", x, y + 1, 2, 1);
      r("#40394c", x + 3, y + 1, 2, 1);
      r("#40394c", x + 2, y, 1, 1);
    },
  ],
  props: [
    // hot air balloon
    (r, w, h) => {
      const c = Math.round(w / 2);
      const rad = Math.round(w / 2) - 1;
      const cy = rad + 1;
      disc(r, "#e2574c", c, cy, rad);
      for (let x = -rad; x <= rad; x += 4) for (let y = -rad; y <= rad; y++) if (x * x + y * y <= rad * rad) r("#ffd25a", c + x, cy + y, 2, 1);
      disc(r, "#ff8a7a", c - Math.round(rad / 3), cy - Math.round(rad / 3), Math.max(1, Math.round(rad / 4)));
      r("#6b4423", c - 1 - Math.round(rad / 2), cy + rad, 1, h - cy - rad - 6);
      r("#6b4423", c + Math.round(rad / 2), cy + rad, 1, h - cy - rad - 6);
      r("#a8703e", c - 4, h - 8, 8, 6);
      r("#dca474", c - 4, h - 8, 8, 1);
    },
    // a server resting on its own cloud
    (r, w, h) => {
      const c = Math.round(w / 2);
      const bw = Math.max(8, Math.round(w * 0.55));
      r("#40394c", c - bw / 2, Math.round(h * 0.3), bw, Math.round(h * 0.45));
      r("#5a6478", c - bw / 2 + 1, Math.round(h * 0.3) + 1, bw - 2, 2);
      for (let y = Math.round(h * 0.3) + 5; y < Math.round(h * 0.7); y += 4) {
        r("#26202e", c - bw / 2 + 2, y, bw - 4, 2);
        r("#5fe08a", c + bw / 2 - 4, y, 1, 1);
      }
      r("#9aa0ad", c - 1, Math.round(h * 0.3) - 5, 2, 5);
      r("#e6e6ee", c - 6, Math.round(h * 0.3) - 6, 12, 1);
      disc(r, "#b4cfe6", c, h - 6, Math.round(w * 0.42));
      disc(r, "#ffffff", c - 3, h - 8, Math.round(w * 0.3));
      disc(r, "#ffffff", c + 4, h - 7, Math.round(w * 0.26));
    },
    (r, w, h) => {
      const c = Math.round(w / 2);
      r("#d4e9f6", c - 5, h - 6, 10, 4);
      r("#9aa0ad", c - 1, 8, 3, h - 13);
      r("#e6e6ee", c - 1, 8, 1, h - 13);
      for (let y = 12; y < h - 8; y += 6) {
        r("#9aa0ad", c - 4, y, 9, 1);
      }
      r("#e2574c", c - 1, 4, 3, 3);
      r("#ffffff", c - 1, 4, 1, 1);
      disc(r, "#e6e6ee", c + 4, 12, 3);
      disc(r, "#9aa0ad", c + 4, 12, 1);
    },
    (r, w, h) => {
      const cw = Math.max(8, Math.round(w * 0.55));
      const x0 = Math.round((w - cw) / 2);
      r("#d4d0c8", x0 - 2, 3, cw + 4, 4);
      r("#ffffff", x0 - 2, 3, cw + 4, 1);
      r("#e8e4dc", x0, 7, cw, h - 14);
      for (let x = x0 + 2; x < x0 + cw - 1; x += 3) r("#c8c4bc", x, 8, 1, h - 16);
      r("#ffffff", x0, 7, 1, h - 14);
      r("#d4d0c8", x0 - 2, h - 8, cw + 4, 5);
      r("#b8b4ac", x0 - 2, h - 4, cw + 4, 1);
    },
    (r, w, h) => {
      const c = Math.round(w / 2);
      r("#e6e6ee", c - 1, Math.round(h * 0.35), 3, h - Math.round(h * 0.35) - 3);
      r("#b8bcc6", c + 1, Math.round(h * 0.35), 1, h - Math.round(h * 0.35) - 3);
      const hub = Math.round(h * 0.35);
      for (let s = 0; s < Math.round(w * 0.45); s++) {
        r("#ffffff", c - s, hub - Math.round(s * 0.5), 2, 1);
        r("#ffffff", c + s, hub - Math.round(s * 0.5), 2, 1);
        r("#ffffff", c, hub + s * 0.6, 1, 1);
      }
      disc(r, "#9aa0ad", c, hub, 2);
    },
    (r, w, h) => {
      const c = Math.round(w / 2);
      const base = Math.round(h * 0.45);
      disc(r, "#5a6478", c - Math.round(w * 0.2), base, Math.round(w * 0.25));
      disc(r, "#5a6478", c + Math.round(w * 0.18), base + 1, Math.round(w * 0.22));
      disc(r, "#6e7a90", c, base - Math.round(w * 0.12), Math.round(w * 0.27));
      r("#ffd25a", c, base + 4, 3, 3);
      r("#ffd25a", c - 2, base + 7, 3, 3);
      r("#ffd25a", c, base + 10, 2, 4);
      r("#fff2a8", c, base + 4, 1, 1);
    },
  ],
};

const THEMES: Record<TerrainId, Theme> = { circuit, server, datacenter, mainframe, cloud };

// ------------------------------------------------------------------ shared layers

function patternOf(theme: Theme, ctx: Ctx): CanvasPattern | null {
  const [tile, t] = canvas(8, 8);
  theme.road(rectOf(t));
  return ctx.createPattern(tile, "repeat");
}

function drawGround(ctx: Ctx, theme: Theme, w: number, h: number, seed: string): void {
  const r = rectOf(ctx);
  const rng = createSeededRng(hashString(`${seed}:ground`));
  for (let y = 0; y < h; y += TILE) for (let x = 0; x < w; x += TILE) theme.tile(r, x, y, rng);
  theme.details?.(r, w, h, createSeededRng(hashString(`${seed}:details`)));
}

/** Draws thick polylines as a textured road with an edge and a lip. */
function drawRoads(ctx: Ctx, theme: Theme, lines: readonly Vec[][], halfWidth: number, w: number, h: number): void {
  const stamp = (target: Ctx, color: string | CanvasPattern, size: number) => {
    target.fillStyle = color;
    for (const line of lines) {
      for (let i = 0; i < line.length - 1; i++) {
        const a = line[i]!;
        const b = line[i + 1]!;
        const steps = Math.max(1, Math.ceil(Math.hypot(b.x - a.x, b.y - a.y) / 2));
        for (let s = 0; s <= steps; s++) {
          const x = a.x + ((b.x - a.x) * s) / steps;
          const y = a.y + ((b.y - a.y) * s) / steps;
          target.fillRect(Math.round(x - size), Math.round(y - size), size * 2, size * 2);
        }
      }
    }
  };
  stamp(ctx, theme.roadLip, halfWidth + 3);
  stamp(ctx, theme.roadEdge, halfWidth + 1);
  // the textured middle: stamp a mask, then fill it with the road pattern
  const [mask, m] = canvas(w, h);
  stamp(m, "#000", halfWidth - 1);
  m.globalCompositeOperation = "source-in";
  m.fillStyle = patternOf(theme, m) ?? theme.roadEdge;
  m.fillRect(0, 0, w, h);
  ctx.drawImage(mask, 0, 0);
}

function drawPlaza(ctx: Ctx, theme: Theme, cx: number, cy: number, radius: number): void {
  const r = rectOf(ctx);
  const [edge, base, stone, light] = theme.plaza;
  disc(r, edge, cx, cy, radius + 2);
  disc(r, base, cx, cy, radius);
  for (let y = -radius; y <= radius; y += 6) {
    for (let x = -radius; x <= radius; x += 8) {
      const ox = (y / 6) % 2 === 0 ? 0 : 4;
      if ((x + ox) * (x + ox) + y * y > (radius - 3) * (radius - 3)) continue;
      r(stone, cx + x + ox, cy + y, 7, 5);
      r(light, cx + x + ox, cy + y, 7, 1);
    }
  }
  // flower beds and lamps around the edge
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2 + 0.3;
    const fx = cx + Math.cos(a) * (radius - 10);
    const fy = cy + Math.sin(a) * (radius - 10);
    if (Math.sin(a) < -0.5) continue;
    if (i % 2 === 0) {
      r("#2f8a49", fx - 5, fy - 3, 11, 6);
      r("#5fcf7a", fx - 4, fy - 3, 9, 2);
      r("#e2574c", fx - 3, fy - 1, 1, 1);
      r("#ffd25a", fx, fy - 2, 1, 1);
      r("#f08ac0", fx + 3, fy, 1, 1);
    } else {
      r("#40394c", fx, fy - 10, 1, 10);
      r("#ffd25a", fx - 1, fy - 12, 3, 2);
      r("#fff2a8", fx, fy - 12, 1, 1);
    }
  }
}

function drawHole(ctx: Ctx, o: Obstacle): void {
  const r = rectOf(ctx);
  const cx = Math.round(o.x / 2);
  const cy = Math.round(o.y / 2);
  const rad = Math.round(o.r / 2);
  disc(r, "#ffffff", cx, cy - 1, rad + 3);
  disc(r, "#2f66b0", cx, cy, rad);
  disc(r, "#4a86d8", cx, cy + 2, rad - 2);
  disc(r, "#7ec4ef", cx, cy + 4, Math.max(2, rad - 5));
  r("#ffffff", cx - rad / 2, cy + rad / 3, 4, 1);
  r("#ffffff", cx + rad / 4, cy + rad / 2, 3, 1);
  for (let i = 0; i < 10; i++) {
    const a = (i / 10) * Math.PI * 2;
    disc(r, "#ffffff", cx + Math.cos(a) * (rad + 1), cy + Math.sin(a) * (rad + 1) - 1, 3);
    disc(r, "#d4e9f6", cx + Math.cos(a) * (rad + 1), cy + Math.sin(a) * (rad + 1) + 2, 1);
  }
}

function drawDecor(ctx: Ctx, theme: Theme, w: number, h: number, seed: string, free: (x: number, y: number) => boolean): void {
  const r = rectOf(ctx);
  const rng = createSeededRng(hashString(`${seed}:decor`));
  const count = Math.round((w * h) / theme.decorEvery);
  for (let i = 0; i < count; i++) {
    const x = randomInt(rng, 4, w - 12);
    const y = randomInt(rng, 4, h - 12);
    if (!free(x, y)) continue;
    theme.decor[randomInt(rng, 0, theme.decor.length - 1)]!(r, x, y, rng);
  }
}

// ------------------------------------------------------------------ public

const groundCache = new Map<string, string>();

export function isHole(terrain: TerrainId, o: Obstacle): boolean {
  return !o.center && Boolean(THEMES[terrain].holes?.(o.variant));
}

/** The whole battle map floor (half resolution): ground, details, holes, roads, the square, decorations. */
export function battleGroundUrl(terrain: TerrainId, key: string, nav: Nav): string {
  const cacheKey = `${terrain}|${key}|${nav.width}x${nav.height}`;
  const cached = groundCache.get(cacheKey);
  if (cached) return cached;
  const w = Math.ceil(nav.width / 2);
  const h = Math.ceil(nav.height / 2);
  const [c, ctx] = canvas(w, h);
  const theme = THEMES[terrain];
  drawGround(ctx, theme, w, h, key);
  for (const o of nav.obstacles) if (isHole(terrain, o)) drawHole(ctx, o);
  drawRoads(ctx, theme, nav.roads.map((line) => line.map((p) => ({ x: p.x / 2, y: p.y / 2 }))), 13, w, h);
  drawPlaza(ctx, theme, Math.round(nav.town.x / 2), Math.round(nav.town.y / 2), Math.round(nav.town.r / 2) - 30);
  const free = (x: number, y: number) => {
    const p = { x: x * 2, y: y * 2 };
    if (isRoad(nav, p)) return false;
    if (Math.hypot(p.x - nav.town.x, p.y - nav.town.y) < nav.town.r) return false;
    return nav.obstacles.every((o) => Math.hypot(p.x - o.x, p.y - o.y) > o.r + 24);
  };
  drawDecor(ctx, theme, w, h, key, free);
  const url = c.toDataURL();
  groundCache.set(cacheKey, url);
  return url;
}

/** Region map background at the screen's size: same ground and road style, a road through the route points. */
export function regionMapUrl(terrain: TerrainId, seed: string, width: number, height: number, points: readonly Vec[]): string {
  const w = Math.max(16, Math.round(width / 2));
  const h = Math.max(16, Math.round(height / 2));
  const cacheKey = `region|${terrain}|${seed}|${w}x${h}|${points.map((p) => `${Math.round(p.x)},${Math.round(p.y)}`).join(";")}`;
  const cached = groundCache.get(cacheKey);
  if (cached) return cached;
  const [c, ctx] = canvas(w, h);
  const theme = THEMES[terrain];
  drawGround(ctx, theme, w, h, seed);
  const line = points.map((p) => ({ x: (p.x / 100) * w, y: (p.y / 100) * h }));
  drawRoads(ctx, theme, [line], 7, w, h);
  const near = (x: number, y: number) => line.some((p, i) => i < line.length - 1 && segDist({ x, y }, p, line[i + 1]!) < 18) || line.some((p) => Math.hypot(p.x - x, p.y - y) < 26);
  drawDecor(ctx, theme, w, h, seed, (x, y) => !near(x, y));
  const url = c.toDataURL();
  groundCache.set(cacheKey, url);
  return url;
}

function segDist(p: Vec, a: Vec, b: Vec): number {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const len = dx * dx + dy * dy;
  const t = len === 0 ? 0 : Math.max(0, Math.min(1, ((p.x - a.x) * dx + (p.y - a.y) * dy) / len));
  return Math.hypot(p.x - (a.x + t * dx), p.y - (a.y + t * dy));
}

export interface PropSprite {
  url: string;
  /** Size on the map (2x the drawing). */
  width: number;
  height: number;
}

const propCache = new Map<string, PropSprite>();

/** A standing obstacle: as wide as its footprint, taller so it stands up, with an outline. */
export function propSprite(terrain: TerrainId, o: Obstacle): PropSprite {
  const w = Math.max(14, Math.round(o.r * 1.35)) + 2;
  const h = Math.round(w * 1.3) + 6;
  const key = `${terrain}|${o.variant}|${w}`;
  const cached = propCache.get(key);
  if (cached) return cached;
  const [c, ctx] = canvas(w, h);
  const props = THEMES[terrain].props;
  ctx.save();
  ctx.translate(1, 1);
  props[o.variant % props.length]!(rectOf(ctx), w - 2, h - 2);
  ctx.restore();
  outline(ctx, w, h);
  const sprite = { url: c.toDataURL(), width: w * 2, height: h * 2 };
  propCache.set(key, sprite);
  return sprite;
}

let centerCache: PropSprite | null = null;

/** The Reboot Center: white walls, teal roof, a sign with the power symbol and glass doors. */
export function centerSprite(): PropSprite {
  if (centerCache) return centerCache;
  const w = 74;
  const h = 62;
  const [c, ctx] = canvas(w, h);
  const r = rectOf(ctx);
  // roof
  r("#237a8c", 4, 6, w - 8, 14);
  r("#3fb5c9", 6, 6, w - 12, 11);
  r("#8ae4f0", 6, 6, w - 12, 2);
  for (let x = 8; x < w - 8; x += 6) r("#2f9aae", x, 9, 3, 7);
  // walls
  r("#c8bcae", 7, 20, w - 14, 36);
  r("#f4ece0", 8, 20, w - 17, 34);
  r("#ffffff", 8, 20, w - 17, 2);
  // windows
  for (const x of [12, w - 24]) {
    r("#2f66b0", x, 27, 10, 9);
    r("#8ae4f0", x + 1, 28, 8, 7);
    r("#ffffff", x + 1, 28, 3, 1);
    r("#c8bcae", x + 4, 27, 1, 9);
  }
  // sign with the power symbol
  r("#26202e", w / 2 - 9, 1, 18, 12);
  r("#40394c", w / 2 - 8, 2, 16, 10);
  disc(r, "#5fe08a", w / 2, 7, 4);
  disc(r, "#40394c", w / 2, 7, 2);
  r("#40394c", w / 2 - 1, 2, 2, 3);
  r("#5fe08a", w / 2 - 0.5, 2, 1, 5);
  // doors and steps
  r("#26202e", w / 2 - 9, 36, 18, 18);
  r("#8ae4f0", w / 2 - 8, 37, 7, 17);
  r("#8ae4f0", w / 2 + 1, 37, 7, 17);
  r("#ffffff", w / 2 - 7, 38, 2, 6);
  r("#ffffff", w / 2 + 2, 38, 2, 6);
  r("#9aa0ad", w / 2 - 12, 54, 24, 3);
  r("#b8b4bc", w / 2 - 14, 57, 28, 3);
  outline(ctx, w, h);
  centerCache = { url: c.toDataURL(), width: w * 2, height: h * 2 };
  return centerCache;
}
