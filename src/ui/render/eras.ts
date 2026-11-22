/** 32x24 pixel illustrations for each house era, drawn with rectangles. */
import { createCanvas } from "./pixels";

type Draw = (r: (color: string, x: number, y: number, w: number, h: number) => void) => void;

const GROUND = "#3a2a20";

const ERAS: readonly Draw[] = [
  // vacuum tubes: wooden cabinet with glowing tubes
  (r) => {
    r("#6b4226", 2, 6, 28, 16);
    r("#8a5a34", 3, 7, 26, 2);
    for (let i = 0; i < 5; i++) {
      r("#c9c3b5", 5 + i * 5, 10, 3, 8);
      r("#ff9a3c", 6 + i * 5, 12, 1, 4);
    }
    r("#2a1a10", 2, 20, 28, 2);
  },
  // transistor: grey board with three-legged parts
  (r) => {
    r("#5d6b5f", 2, 10, 28, 10);
    for (let i = 0; i < 4; i++) {
      r("#1c1c22", 4 + i * 7, 5, 5, 5);
      r("#d8d8d0", 5 + i * 7, 10, 1, 3);
      r("#d8d8d0", 7 + i * 7, 10, 1, 3);
      r("#3a3a48", 5 + i * 7, 6, 3, 1);
    }
  },
  // integrated circuit: chip on a green board
  (r) => {
    r("#2f7a4a", 1, 4, 30, 18);
    r("#c9a24a", 1, 12, 30, 1);
    r("#c9a24a", 15, 4, 1, 18);
    for (let i = 0; i < 6; i++) {
      r("#b8b8b0", 9 + i * 3, 6, 1, 2);
      r("#b8b8b0", 9 + i * 3, 18, 1, 2);
    }
    r("#1c1c22", 8, 8, 18, 10);
    r("#3a3a48", 9, 9, 16, 1);
  },
  // microprocessor: beige PC with a green screen
  (r) => {
    r("#d8cba8", 4, 3, 18, 14);
    r("#1f3a24", 6, 5, 14, 9);
    r("#5fe08a", 7, 6, 6, 1);
    r("#5fe08a", 7, 8, 9, 1);
    r("#5fe08a", 7, 10, 4, 1);
    r("#b8a982", 10, 17, 6, 2);
    r("#d8cba8", 3, 19, 26, 3);
    r("#8a8070", 24, 8, 5, 11);
    r("#e05a3a", 25, 10, 1, 1);
  },
  // internet: server rack and a globe
  (r) => {
    r("#3a4356", 3, 3, 10, 19);
    for (let y = 5; y < 20; y += 3) {
      r("#20263a", 4, y, 8, 2);
      r("#5fe08a", 11, y, 1, 1);
    }
    r("#3a6fb8", 17, 6, 12, 12);
    r("#5fcf7a", 19, 8, 4, 3);
    r("#5fcf7a", 24, 12, 3, 4);
    r("#9ad0ff", 22, 6, 1, 12);
    r("#9ad0ff", 17, 11, 12, 1);
  },
  // cloud: servers floating under a cloud
  (r) => {
    r("#ffffff", 6, 3, 20, 6);
    r("#ffffff", 3, 6, 26, 5);
    r("#dff0fa", 3, 10, 26, 1);
    for (let i = 0; i < 3; i++) {
      r("#4b566e", 5 + i * 8, 14, 6, 8);
      r("#5fe08a", 9 + i * 8, 16, 1, 1);
      r("#9ad0ff", 8 + i * 8, 11, 1, 3);
    }
  },
  // AI: purple chip with a small neural network
  (r) => {
    r("#5a2a7a", 3, 3, 26, 19);
    const nodes: [number, number][] = [
      [7, 7],
      [7, 13],
      [7, 18],
      [16, 10],
      [16, 16],
      [25, 13],
    ];
    for (const [x, y] of nodes) for (const [x2, y2] of nodes) if (x2 === x + 9) for (let s = 0; s <= 9; s++) r("#b98ae0", x + s, Math.round(y + ((y2 - y) * s) / 9), 1, 1);
    for (const [x, y] of nodes) r("#ffe58a", x - 1, y - 1, 3, 3);
  },
];

const cache = new Map<number, string>();

export function eraUrl(tier: number): string {
  const cached = cache.get(tier);
  if (cached) return cached;
  const [canvas, ctx] = createCanvas(32, 24);
  ctx.fillStyle = GROUND;
  ctx.fillRect(0, 22, 32, 2);
  const draw = ERAS[Math.max(0, Math.min(ERAS.length - 1, tier))]!;
  draw((color, x, y, w, h) => {
    ctx.fillStyle = color;
    ctx.fillRect(x, y, w, h);
  });
  const url = canvas.toDataURL();
  cache.set(tier, url);
  return url;
}
