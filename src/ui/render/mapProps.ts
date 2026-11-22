/**
 * Roads and obstacle props for the battle map, drawn per region look.
 * Drawn at half resolution and shown at 2x, like the terrain, so pixels match.
 */
import type { TerrainId } from "../../game/data/world";
import type { Nav, Obstacle } from "../world/navigation";
import { createCanvas } from "./pixels";

type Rect = (color: string, x: number, y: number, w: number, h: number) => void;

interface RoadStyle {
  edge: string;
  fill: string;
  detail: string;
}

const ROADS: Record<TerrainId, RoadStyle> = {
  circuit: { edge: "#6e5422", fill: "#b48f3e", detail: "#d8b35a" },
  server: { edge: "#1c2130", fill: "#454f66", detail: "#5fe08a" },
  datacenter: { edge: "#3a3d44", fill: "#5c616b", detail: "#e0c34a" },
  mainframe: { edge: "#4a1f18", fill: "#8a3a2a", detail: "#b85a3a" },
  cloud: { edge: "#9ccbe8", fill: "#d6eefb", detail: "#ffffff" },
};

const roadCache = new Map<string, string>();

/** Transparent layer with the roads, the size of the map at half resolution. */
export function roadsUrl(nav: Nav, terrain: TerrainId, key: string): string {
  const cacheKey = `${terrain}|${key}|${nav.width}x${nav.height}`;
  const cached = roadCache.get(cacheKey);
  if (cached) return cached;
  const w = Math.ceil(nav.width / 2);
  const h = Math.ceil(nav.height / 2);
  const [canvas, ctx] = createCanvas(w, h);
  const style = ROADS[terrain];
  const half = 11;
  const stamp = (color: string, size: number, every: number) => {
    ctx.fillStyle = color;
    for (const line of nav.roads) {
      for (let i = 0; i < line.length - 1; i++) {
        const a = line[i]!;
        const b = line[i + 1]!;
        const steps = Math.ceil(Math.hypot(b.x - a.x, b.y - a.y) / 2 / every);
        for (let s = 0; s <= steps; s++) {
          const x = (a.x + ((b.x - a.x) * s) / steps) / 2;
          const y = (a.y + ((b.y - a.y) * s) / steps) / 2;
          ctx.fillRect(Math.round(x - size), Math.round(y - size), size * 2, size * 2);
        }
      }
    }
  };
  stamp(style.edge, half + 1, 2);
  stamp(style.fill, half - 1, 2);
  // small marks along the middle: pads, LEDs, safety dashes, carpet weave
  ctx.fillStyle = style.detail;
  for (const line of nav.roads) {
    for (let i = 0; i < line.length - 1; i++) {
      const a = line[i]!;
      const b = line[i + 1]!;
      const steps = Math.ceil(Math.hypot(b.x - a.x, b.y - a.y) / 2 / 12);
      for (let s = 0; s < steps; s += 2) {
        const x = (a.x + ((b.x - a.x) * s) / steps) / 2;
        const y = (a.y + ((b.y - a.y) * s) / steps) / 2;
        ctx.fillRect(Math.round(x - 1), Math.round(y - 1), 2, 2);
      }
    }
  }
  const url = canvas.toDataURL();
  roadCache.set(cacheKey, url);
  return url;
}

// ---- props

/** Each drawer fills a w x h box (half resolution); the footprint is the bottom part. */
type PropDraw = (r: Rect, w: number, h: number) => void;

const chip: PropDraw = (r, w, h) => {
  const top = h - Math.round(w * 0.75);
  for (let x = 3; x < w - 3; x += 3) {
    r("#b8b8b0", x, top - 2, 1, 2);
    r("#b8b8b0", x, h - 3, 1, 2);
  }
  r("#101016", 1, top + 1, w - 2, h - top - 3);
  r("#1c1c22", 1, top, w - 2, h - top - 4);
  r("#2c2c36", 2, top + 1, w - 4, 2);
  r("#3a3a48", 3, h - 9, 3, 2);
};

const capacitor: PropDraw = (r, w, h) => {
  const bodyW = Math.max(8, Math.round(w * 0.7));
  const x0 = Math.round((w - bodyW) / 2);
  r("#1d3d6e", x0, 4, bodyW, h - 6);
  r("#3a6fb8", x0 + 1, 4, bodyW - 3, h - 7);
  r("#5aa2ef", x0 + 2, 5, 2, h - 10);
  r("#c9c9d4", x0, 2, bodyW, 3);
  r("#e8e8f0", x0 + 1, 2, bodyW - 3, 1);
  r("#1d3d6e", x0 + bodyW - 4, 8, 2, h - 14);
};

const rack: PropDraw = (r, w, h) => {
  r("#0f121a", 2, 2, w - 2, h - 2);
  r("#3a4356", 0, 0, w - 2, h - 3);
  r("#4b566e", 0, 0, w - 2, 2);
  for (let y = 4; y < h - 6; y += 4) {
    r("#20263a", 2, y, w - 6, 3);
    r(y % 8 === 0 ? "#5fe08a" : "#f0b84a", w - 6, y + 1, 1, 1);
  }
};

const cooler: PropDraw = (r, w, h) => {
  const top = Math.round(h * 0.25);
  r("#3a3d44", 1, top + 2, w - 1, h - top - 2);
  r("#a8adb6", 0, top, w - 2, h - top - 3);
  r("#c8ccd4", 0, top, w - 2, 2);
  const c = Math.round((w - 2) / 2);
  const rad = Math.max(3, Math.round(w * 0.28));
  const cy = top + Math.round((h - top) / 2);
  r("#4a4f58", c - rad, cy - rad, rad * 2, rad * 2);
  r("#6d727c", c - rad + 1, cy - 1, rad * 2 - 2, 2);
  r("#6d727c", c - 1, cy - rad + 1, 2, rad * 2 - 2);
};

const cabinet: PropDraw = (r, w, h) => {
  r("#2a2018", 2, 2, w - 2, h - 2);
  r("#d8cba8", 0, 0, w - 2, h - 3);
  r("#b8a982", 0, h - 8, w - 2, 5);
  const reel = Math.max(3, Math.round(w * 0.2));
  for (const cx of [Math.round(w * 0.3), Math.round(w * 0.68)]) {
    r("#3a3028", cx - reel, 4, reel * 2, reel * 2);
    r("#6a5a48", cx - reel + 1, 5, reel * 2 - 2, reel * 2 - 2);
    r("#3a3028", cx - 1, 3 + reel, 2, 2);
  }
  r("#e05a3a", 3, h - 12, 2, 2);
};

const puff: PropDraw = (r, w, h) => {
  const base = h - 4;
  r("#9ccbe8", 1, base - 6, w - 2, 6);
  r("#ffffff", 2, base - 10, w - 4, 8);
  r("#ffffff", Math.round(w * 0.2), base - 16, Math.round(w * 0.45), 8);
  r("#ffffff", Math.round(w * 0.45), base - 20, Math.round(w * 0.35), 10);
  r("#e6f4fc", 2, base - 3, w - 4, 2);
};

const PROPS: Record<TerrainId, readonly PropDraw[]> = {
  circuit: [chip, capacitor, chip, capacitor],
  server: [rack, rack, cooler, rack],
  datacenter: [cooler, rack, cooler, cooler],
  mainframe: [cabinet, cabinet, chip, cabinet],
  cloud: [puff, puff, puff, puff],
};

export interface PropSprite {
  url: string;
  /** Size on the map (2x the drawing). */
  width: number;
  height: number;
}

const propCache = new Map<string, PropSprite>();

/** Sprite for an obstacle: as wide as its footprint, a bit taller so it stands up. */
export function propSprite(terrain: TerrainId, obstacle: Obstacle): PropSprite {
  const w = Math.max(10, Math.round(obstacle.r));
  const h = Math.round(w * 1.25) + 4;
  const key = `${terrain}|${obstacle.variant}|${w}`;
  const cached = propCache.get(key);
  if (cached) return cached;
  const [canvas, ctx] = createCanvas(w, h);
  const draws = PROPS[terrain];
  draws[obstacle.variant % draws.length]!((color, x, y, rw, rh) => {
    ctx.fillStyle = color;
    ctx.fillRect(Math.round(x), Math.round(y), Math.round(rw), Math.round(rh));
  }, w, h);
  const sprite = { url: canvas.toDataURL(), width: w * 2, height: h * 2 };
  propCache.set(key, sprite);
  return sprite;
}
