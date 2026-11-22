/**
 * 32x24 art for each house. History keeps one drawing per era (eras.ts); the other
 * categories get their own building that grows with the tier and carries the
 * category emblem on a sign above the roof.
 */
import type { HouseCategory } from "../../game/housing";
import { eraUrl } from "./eras";
import { createCanvas } from "./pixels";

interface Palette {
  wall: string;
  shade: string;
  light: string;
  window: string;
  accent: string;
}

const PALETTES: Record<Exclude<HouseCategory, "history">, Palette> = {
  languages: { wall: "#d9a441", shade: "#a8762a", light: "#f2cf7a", window: "#fff3c4", accent: "#ffe58a" },
  cloud: { wall: "#7fb4e0", shade: "#4f80b4", light: "#bfe0fa", window: "#ffffff", accent: "#ffffff" },
  databases: { wall: "#4fa36a", shade: "#2f7148", light: "#8fd6a3", window: "#d9ffe3", accent: "#8ff0a4" },
  networks: { wall: "#d9824a", shade: "#a4552c", light: "#f5b183", window: "#ffe0c4", accent: "#ffd25a" },
  security: { wall: "#c0504a", shade: "#86302c", light: "#e98a84", window: "#ffd9d4", accent: "#ffd25a" },
  ai: { wall: "#8a5ac2", shade: "#5a3388", light: "#c19af0", window: "#f0e0ff", accent: "#ffe58a" },
};

/** 7 wide emblems: '#' accent, '+' light, '-' shade, '.' empty. */
const EMBLEMS: Record<Exclude<HouseCategory, "history">, readonly string[]> = {
  languages: [".##.##.", ".#...#.", "#.....#", ".#...#.", ".##.##."],
  cloud: ["..##...", ".####+.", "#######", ".#####."],
  databases: [".+++++.", "+#####+", "#-----#", "#######", "#-----#", ".#####."],
  networks: [".#####.", "#.....#", "..###..", ".#...#.", "...#..."],
  security: ["..###..", ".#...#.", ".#...#.", "#######", "###-###", "#######"],
  ai: ["#..#..#", ".#.#.#.", "..###..", ".#.#.#.", "#..#..#"],
};

export interface BuildingShape {
  x: number;
  y: number;
  width: number;
  height: number;
  floors: number;
}

const GROUND_Y = 22;

/** Size of the building at a tier (0-6): wider and taller each step. Pure, unit tested. */
export function buildingShape(tier: number): BuildingShape {
  const t = Math.max(0, Math.min(6, tier));
  const width = 12 + Math.round(t * 2);
  const height = 7 + Math.round(t * 1.4);
  return { x: 16 - Math.floor(width / 2), y: GROUND_Y - height, width, height, floors: Math.max(1, Math.floor((height - 3) / 3)) };
}

const cache = new Map<string, string>();

export function houseArtUrl(category: HouseCategory, tier: number): string {
  if (category === "history") return eraUrl(tier);
  const key = `${category}:${tier}`;
  const cached = cache.get(key);
  if (cached) return cached;

  const [canvas, ctx] = createCanvas(32, 24);
  const r = (color: string, x: number, y: number, w: number, h: number) => {
    ctx.fillStyle = color;
    ctx.fillRect(x, y, w, h);
  };
  const p = PALETTES[category];
  const b = buildingShape(tier);

  // ground and a small path to the door
  r("#3a2a20", 0, GROUND_Y, 32, 2);
  r("#5a4030", 15, GROUND_Y, 3, 1);

  // body: light left edge, shaded right column, roof with an overhang
  r(p.wall, b.x, b.y, b.width, b.height);
  r(p.light, b.x, b.y, 1, b.height);
  r(p.shade, b.x + b.width - 2, b.y, 2, b.height);
  r(p.shade, b.x - 1, b.y - 1, b.width + 2, 2);
  r(p.light, b.x - 1, b.y - 1, b.width + 2, 1);

  // windows: one row per floor, lit ones in a steady pattern
  for (let f = 0; f < b.floors; f++) {
    const wy = b.y + 2 + f * 3;
    if (wy + 2 > GROUND_Y - 4) break;
    for (let wx = b.x + 2; wx + 2 <= b.x + b.width - 2; wx += 3) {
      const lit = (wx + f * 2) % 4 !== 1;
      r(lit ? p.window : p.shade, wx, wy, 2, 2);
    }
  }

  // door
  r(p.shade, 15, GROUND_Y - 4, 3, 4);
  r("#2a1a10", 16, GROUND_Y - 3, 1, 3);

  // emblem sign above the roof
  const emblem = EMBLEMS[category];
  const ex = 12;
  const ey = Math.max(0, b.y - emblem.length - 3);
  r("#1f1424", ex, ey, 9, emblem.length + 2);
  r(p.shade, ex + 4, ey + emblem.length + 2, 1, Math.max(0, b.y - 1 - (ey + emblem.length + 2)));
  emblem.forEach((row, y) => {
    [...row].forEach((ch, x) => {
      const color = ch === "#" ? p.accent : ch === "+" ? p.light : ch === "-" ? p.shade : null;
      if (color) r(color, ex + 1 + x, ey + 1 + y, 1, 1);
    });
  });

  // the last two tiers get an antenna with a blinking-red tip
  if (tier >= 5) {
    r(p.shade, b.x + b.width - 4, b.y - 4, 1, 3);
    r("#e2574c", b.x + b.width - 4, b.y - 5, 1, 1);
  }

  const url = canvas.toDataURL();
  cache.set(key, url);
  return url;
}
