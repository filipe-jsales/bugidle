/**
 * Obstacles and paths of the battle map. A coarse grid marks blocked cells
 * (around each obstacle) and road cells (cheaper to walk); the trainer plans
 * with A* so he walks around obstacles and prefers the roads. Pure and seeded.
 */
import { randomInt, type Rng } from "../../game/rng";
import type { Vec } from "./worldModel";

export const NAV_CELL = 40;
/** Walking off-road costs this much more than on a road. */
export const OFF_ROAD_COST = 1.8;
const ROAD_WIDTH = 44;
const OBSTACLE_GAP = 26;

export interface Obstacle {
  id: number;
  x: number;
  y: number;
  /** Footprint radius: nothing walks inside it. */
  r: number;
  /** Picks one of the terrain's prop drawings. */
  variant: number;
  /** The Reboot Center building instead of a regular prop. */
  center?: boolean;
}

/** The calm square around the Reboot Center, at the map start. */
export interface Town {
  x: number;
  y: number;
  /** Wild bugs stay outside this radius. */
  r: number;
  /** Where the trainer stands to be healed, in front of the door. */
  door: Vec;
  /** Where the nurse stands. */
  nurse: Vec;
}

export const TOWN_RADIUS = 230;

export interface Nav {
  width: number;
  height: number;
  cols: number;
  rows: number;
  blocked: Uint8Array;
  road: Uint8Array;
  obstacles: Obstacle[];
  /** Road center lines, for drawing. */
  roads: Vec[][];
  town: Town;
}

export interface NavOptions {
  obstacles?: number;
  /** Keep this point and a circle around it clear (the trainer's start). */
  clearAround?: Vec;
}

const cellOf = (nav: Nav, p: Vec) => ({ c: Math.max(0, Math.min(nav.cols - 1, Math.floor(p.x / NAV_CELL))), r: Math.max(0, Math.min(nav.rows - 1, Math.floor(p.y / NAV_CELL))) });
const centerOf = (c: number, r: number): Vec => ({ x: c * NAV_CELL + NAV_CELL / 2, y: r * NAV_CELL + NAV_CELL / 2 });

function segmentDistance(p: Vec, a: Vec, b: Vec): number {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const len = dx * dx + dy * dy;
  const t = len === 0 ? 0 : Math.max(0, Math.min(1, ((p.x - a.x) * dx + (p.y - a.y) * dy) / len));
  return Math.hypot(p.x - (a.x + t * dx), p.y - (a.y + t * dy));
}

function nearRoad(roads: Vec[][], p: Vec, width: number): boolean {
  for (const line of roads) for (let i = 0; i < line.length - 1; i++) if (segmentDistance(p, line[i]!, line[i + 1]!) <= width) return true;
  return false;
}

/** A wobbly road across the map, horizontal or vertical; its middle point is exactly at `at`. */
function makeRoad(width: number, height: number, horizontal: boolean, at: number, rng: Rng): Vec[] {
  const points: Vec[] = [];
  const length = horizontal ? width : height;
  const across = horizontal ? height : width;
  const steps = 2 * Math.max(2, Math.round(length / 720));
  for (let i = 0; i <= steps; i++) {
    const along = (length * i) / steps;
    const wobble = i === steps / 2 ? 0 : randomInt(rng, -70, 70);
    const offset = Math.max(80, Math.min(across - 80, at + wobble));
    points.push(horizontal ? { x: along, y: offset } : { x: offset, y: along });
  }
  return points;
}

export function createNav(width: number, height: number, rng: Rng, options: NavOptions = {}): Nav {
  const cols = Math.ceil(width / NAV_CELL);
  const rows = Math.ceil(height / NAV_CELL);
  const start = options.clearAround ?? { x: width / 2, y: height / 2 };
  const town: Town = { x: start.x, y: start.y, r: TOWN_RADIUS, door: { x: start.x, y: start.y - 30 }, nurse: { x: start.x - 46, y: start.y - 40 } };
  const nav: Nav = { width, height, cols, rows, blocked: new Uint8Array(cols * rows), road: new Uint8Array(cols * rows), obstacles: [], roads: [], town };
  // the Reboot Center building, north of the square; its door faces the square
  nav.obstacles.push({ id: 0, x: start.x, y: start.y - 110, r: 62, variant: 0, center: true });

  // roads: a loose grid, one through the start so the trainer begins on a path
  nav.roads.push(makeRoad(width, height, true, start.y, rng));
  // the vertical road passes beside the town, not under the Reboot Center
  nav.roads.push(makeRoad(width, height, false, start.x + 190, rng));
  for (const y of [height * 0.2, height * 0.8]) nav.roads.push(makeRoad(width, height, true, y + randomInt(rng, -60, 60), rng));
  for (const x of [width * 0.18, width * 0.82]) nav.roads.push(makeRoad(width, height, false, x + randomInt(rng, -60, 60), rng));
  for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) if (nearRoad(nav.roads, centerOf(c, r), ROAD_WIDTH / 2 + 6)) nav.road[r * cols + c] = 1;

  // obstacles: off the roads, apart from each other and from the start
  const wanted = (options.obstacles ?? Math.round((width * height) / 95_000)) + 1;
  for (let tries = 0; nav.obstacles.length < wanted && tries < wanted * 40; tries++) {
    const r = randomInt(rng, 22, 44);
    const p = { x: randomInt(rng, 60, width - 60), y: randomInt(rng, 60, height - 60) };
    if (Math.hypot(p.x - start.x, p.y - start.y) < TOWN_RADIUS + 40) continue;
    if (nearRoad(nav.roads, p, ROAD_WIDTH / 2 + r + 8)) continue;
    if (nav.obstacles.some((o) => Math.hypot(o.x - p.x, o.y - p.y) < o.r + r + OBSTACLE_GAP * 2)) continue;
    nav.obstacles.push({ id: nav.obstacles.length, x: p.x, y: p.y, r, variant: randomInt(rng, 0, 5) });
  }
  for (const o of nav.obstacles) {
    for (let rr = 0; rr < rows; rr++) {
      for (let c = 0; c < cols; c++) {
        const center = centerOf(c, rr);
        if (Math.hypot(center.x - o.x, center.y - o.y) < o.r + NAV_CELL * 0.45) nav.blocked[rr * cols + c] = 1;
      }
    }
  }
  return nav;
}

export function isBlocked(nav: Nav, p: Vec): boolean {
  return nav.obstacles.some((o) => Math.hypot(p.x - o.x, p.y - o.y) < o.r);
}

export function isRoad(nav: Nav, p: Vec): boolean {
  const { c, r } = cellOf(nav, p);
  return nav.road[r * nav.cols + c] === 1;
}

/** Keeps wild bugs out of the Reboot Center square. */
export function outsideTown(nav: Nav, p: Vec): Vec {
  const { town } = nav;
  const d = Math.hypot(p.x - town.x, p.y - town.y);
  if (d >= town.r) return p;
  const k = d < 0.001 ? { x: 1, y: 0 } : { x: (p.x - town.x) / d, y: (p.y - town.y) / d };
  return { x: town.x + k.x * town.r, y: town.y + k.y * town.r };
}

/** Moves a point that ended up inside an obstacle to its edge (plus a small margin). */
export function pushOut(nav: Nav, p: Vec, margin = 4): Vec {
  let out = { ...p };
  for (const o of nav.obstacles) {
    const dx = out.x - o.x;
    const dy = out.y - o.y;
    const d = Math.hypot(dx, dy);
    if (d >= o.r + margin) continue;
    const k = d < 0.001 ? { x: 1, y: 0 } : { x: dx / d, y: dy / d };
    out = { x: o.x + k.x * (o.r + margin), y: o.y + k.y * (o.r + margin) };
  }
  return out;
}

/** A random point that is not inside an obstacle. */
export function freePoint(nav: Nav, rng: Rng, margin: number): Vec {
  let p = { x: randomInt(rng, margin, nav.width - margin), y: randomInt(rng, margin, nav.height - margin) };
  for (let tries = 0; tries < 20 && isBlocked(nav, p); tries++) p = { x: randomInt(rng, margin, nav.width - margin), y: randomInt(rng, margin, nav.height - margin) };
  return pushOut(nav, p, 8);
}

/** Straight line from a to b crosses no obstacle footprint. */
export function clearLine(nav: Nav, a: Vec, b: Vec): boolean {
  return nav.obstacles.every((o) => segmentDistance({ x: o.x, y: o.y }, a, b) >= o.r + 2);
}

// ---- A*

class MinHeap {
  private items: { node: number; f: number }[] = [];
  get size() {
    return this.items.length;
  }
  push(node: number, f: number) {
    const items = this.items;
    items.push({ node, f });
    let i = items.length - 1;
    while (i > 0) {
      const parent = (i - 1) >> 1;
      if (items[parent]!.f <= items[i]!.f) break;
      [items[parent], items[i]] = [items[i]!, items[parent]!];
      i = parent;
    }
  }
  pop(): number {
    const items = this.items;
    const top = items[0]!.node;
    const last = items.pop()!;
    if (items.length > 0) {
      items[0] = last;
      let i = 0;
      for (;;) {
        const l = i * 2 + 1;
        const r = l + 1;
        let m = i;
        if (l < items.length && items[l]!.f < items[m]!.f) m = l;
        if (r < items.length && items[r]!.f < items[m]!.f) m = r;
        if (m === i) break;
        [items[m], items[i]] = [items[i]!, items[m]!];
        i = m;
      }
    }
    return top;
  }
}

const NEIGHBORS = [
  [1, 0, 1],
  [-1, 0, 1],
  [0, 1, 1],
  [0, -1, 1],
  [1, 1, Math.SQRT2],
  [1, -1, Math.SQRT2],
  [-1, 1, Math.SQRT2],
  [-1, -1, Math.SQRT2],
] as const;

/**
 * Waypoints from `from` to `to` around obstacles, preferring roads. Ends exactly
 * at `to` (pushed out of any obstacle). Falls back to a straight line when no route exists.
 */
export function findPath(nav: Nav, from: Vec, to: Vec): Vec[] {
  const goal = pushOut(nav, to, 6);
  if (clearLine(nav, from, goal) && (isRoad(nav, from) === isRoad(nav, goal) || Math.hypot(goal.x - from.x, goal.y - from.y) < NAV_CELL * 3)) return [goal];
  const { cols, rows, blocked, road } = nav;
  const s = cellOf(nav, from);
  const g = cellOf(nav, goal);
  const start = s.r * cols + s.c;
  const target = g.r * cols + g.c;
  const cost = new Float64Array(cols * rows).fill(Infinity);
  const came = new Int32Array(cols * rows).fill(-1);
  const heap = new MinHeap();
  const h = (n: number) => Math.hypot((n % cols) - g.c, Math.floor(n / cols) - g.r);
  cost[start] = 0;
  heap.push(start, h(start));
  while (heap.size > 0) {
    const node = heap.pop();
    if (node === target) break;
    const c = node % cols;
    const r = Math.floor(node / cols);
    for (const [dc, dr, step] of NEIGHBORS) {
      const nc = c + dc;
      const nr = r + dr;
      if (nc < 0 || nr < 0 || nc >= cols || nr >= rows) continue;
      const next = nr * cols + nc;
      if (blocked[next] && next !== target) continue;
      // no corner cutting between two blocked cells
      if (dc !== 0 && dr !== 0 && (blocked[r * cols + nc] || blocked[nr * cols + c])) continue;
      const total = cost[node]! + step * (road[next] ? 1 : OFF_ROAD_COST);
      if (total >= cost[next]!) continue;
      cost[next] = total;
      came[next] = node;
      heap.push(next, total + h(next));
    }
  }
  if (came[target] === -1 && target !== start) return [goal];
  const cells: number[] = [];
  for (let n = target; n !== start && n !== -1; n = came[n]!) cells.push(n);
  cells.reverse();
  // drop points on a straight run so the walk is smooth, then end at the exact goal
  const points: Vec[] = [];
  let lastDir = "";
  let prev = start;
  for (const n of cells) {
    const dir = `${(n % cols) - (prev % cols)},${Math.floor(n / cols) - Math.floor(prev / cols)}`;
    if (dir !== lastDir && prev !== start) points.push(centerOf(prev % cols, Math.floor(prev / cols)));
    lastDir = dir;
    prev = n;
  }
  points.push(goal);
  return points;
}
