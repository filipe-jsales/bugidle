/**
 * Presentation model for the explorable route map: the trainer walks around,
 * the active bug follows behind, wild bugs roam, and the camera tracks the
 * trainer. The game engine decides *when* encounters happen; this model decides
 * *where* they are drawn. Pure (no DOM), stepped by the UI every frame.
 * Obstacles and roads come from `navigation.ts`: the trainer plans around
 * obstacles and prefers roads; everything else is pushed out of obstacles.
 */
import { randomInt, type Rng } from "../../game/rng";
import type { Facing } from "../../sprites/trainerSprite";
import { createNav, findPath, freePoint, outsideTown, pushOut, TOWN_RADIUS, type Nav } from "./navigation";

export interface Vec {
  x: number;
  y: number;
}

export const TRAINER_SPEED = 85;
export const FOLLOWER_SPEED = 140;
export const WANDER_SPEED = 22;
/** How far behind the trainer the active bug walks. */
export const FOLLOW_DISTANCE = 38;
export const WANDERER_COUNT = 10;
/** A roaming bug this close to the trainer becomes the next encounter. */
export const ENCOUNTER_RANGE = 260;
/** Distance between our bug and the enemy during a fight. */
export const FIGHT_GAP = 130;
/** Distance from our bug back to the trainer during a fight. */
export const TRAINER_BEHIND = 64;
const MARGIN = 48;
const TRAIL_LENGTH = 60;

export interface Wanderer {
  id: number;
  speciesId: string;
  pos: Vec;
  target: Vec;
  pauseS: number;
}

export interface WorldModel {
  width: number;
  height: number;
  trainer: { pos: Vec; facing: Facing; moving: boolean; walkS: number };
  follower: { pos: Vec; moving: boolean };
  /** Trainer positions, newest first, used for the follower path. */
  trail: Vec[];
  waypoint: Vec;
  encounter: { key: string; pos: Vec } | null;
  wanderers: Wanderer[];
  camera: Vec;
  nextId: number;
  speciesPool: readonly string[];
  /** Obstacles and roads of this map. */
  nav: Nav;
  /** Trainer's planned waypoints toward `pathGoal`. */
  path: Vec[];
  pathGoal: Vec | null;
  /** True while the team is at the Reboot Center (the trainer was moved to the door). */
  atCenter: boolean;
  /** Seconds since the trainer appeared at the center, for the warp effect. */
  warpS: number;
}

export interface WorldOptions {
  /** Number of obstacles (default: by map area). 0 gives an open field. */
  obstacles?: number;
}

export interface WorldInput {
  /** Identifies the current enemy (changes when a new one appears); null between fights. */
  encounterKey: string | null;
  /** Species of the current enemy, so a roaming bug of that species becomes it. */
  encounterSpecies?: string;
  /** The team is at the Reboot Center: the trainer stays at the door, nothing fights. */
  atCenter?: boolean;
  viewport: { width: number; height: number };
}

const sub = (a: Vec, b: Vec): Vec => ({ x: a.x - b.x, y: a.y - b.y });
const add = (a: Vec, b: Vec): Vec => ({ x: a.x + b.x, y: a.y + b.y });
const scale = (a: Vec, k: number): Vec => ({ x: a.x * k, y: a.y * k });
export const distance = (a: Vec, b: Vec): number => Math.hypot(a.x - b.x, a.y - b.y);

function normalize(v: Vec, fallback: Vec): Vec {
  const len = Math.hypot(v.x, v.y);
  return len < 0.001 ? fallback : { x: v.x / len, y: v.y / len };
}

export function facingOf(v: Vec, previous: Facing): Facing {
  if (Math.abs(v.x) < 0.001 && Math.abs(v.y) < 0.001) return previous;
  if (Math.abs(v.x) > Math.abs(v.y)) return v.x < 0 ? "left" : "right";
  return v.y < 0 ? "up" : "down";
}

const FACING_VEC: Readonly<Record<Facing, Vec>> = { down: { x: 0, y: 1 }, up: { x: 0, y: -1 }, left: { x: -1, y: 0 }, right: { x: 1, y: 0 } };

function clampToWorld(w: Pick<WorldModel, "width" | "height">, p: Vec): Vec {
  return { x: Math.min(w.width - MARGIN, Math.max(MARGIN, p.x)), y: Math.min(w.height - MARGIN, Math.max(MARGIN, p.y)) };
}

function randomPoint(w: Pick<WorldModel, "nav">, rng: Rng): Vec {
  return outsideTown(w.nav, freePoint(w.nav, rng, MARGIN));
}

/** Inside the map and outside every obstacle. */
function placeable(w: Pick<WorldModel, "width" | "height" | "nav">, p: Vec): Vec {
  return pushOut(w.nav, clampToWorld(w, p), 6);
}

/** Moves `pos` toward `target` by at most `speed * dt`. Returns whether it moved. */
function moveToward(pos: Vec, target: Vec, speed: number, dt: number): boolean {
  const gap = distance(pos, target);
  if (gap < 1.5) return false;
  const step = Math.min(gap, speed * dt);
  const dir = normalize(sub(target, pos), { x: 0, y: 0 });
  pos.x += dir.x * step;
  pos.y += dir.y * step;
  return true;
}

function spawnWanderer(w: WorldModel, rng: Rng, awayFrom: Vec): Wanderer {
  let pos = randomPoint(w, rng);
  for (let tries = 0; tries < 8 && distance(pos, awayFrom) < 220; tries++) pos = randomPoint(w, rng);
  const speciesId = w.speciesPool[randomInt(rng, 0, w.speciesPool.length - 1)] ?? "typobit";
  return { id: w.nextId++, speciesId, pos, target: { ...pos }, pauseS: rng() * 2 };
}

export function createWorld(width: number, height: number, speciesPool: readonly string[], rng: Rng, options: WorldOptions = {}): WorldModel {
  const start = { x: width / 2, y: height / 2 };
  const nav = createNav(width, height, rng, { obstacles: options.obstacles, clearAround: start });
  const w: WorldModel = {
    width,
    height,
    trainer: { pos: { ...start }, facing: "down", moving: false, walkS: 0 },
    follower: { pos: { x: start.x, y: start.y - FOLLOW_DISTANCE }, moving: false },
    trail: [{ ...start }],
    waypoint: { ...start },
    encounter: null,
    wanderers: [],
    camera: { x: 0, y: 0 },
    nextId: 1,
    speciesPool,
    nav,
    path: [],
    pathGoal: null,
    atCenter: false,
    warpS: 99,
  };
  // the trainer starts on the road just outside the calm Reboot square, so the hunt begins at once
  const spawn = placeable(w, { x: start.x + TOWN_RADIUS + 50, y: start.y });
  w.trainer.pos = { ...spawn };
  w.follower.pos = { x: spawn.x - FOLLOW_DISTANCE, y: spawn.y };
  w.trail = [{ ...spawn }];
  w.waypoint = { ...spawn };
  for (let i = 0; i < WANDERER_COUNT; i++) w.wanderers.push(spawnWanderer(w, rng, spawn));
  return w;
}

/** Where our bug and the trainer stand to fight an enemy at `enemy`, approaching from `from`. */
export function fightStands(from: Vec, enemy: Vec, facing: Facing): { bug: Vec; trainer: Vec } {
  const dir = normalize(sub(enemy, from), FACING_VEC[facing]);
  const bug = sub(enemy, scale(dir, FIGHT_GAP));
  return { bug, trainer: sub(bug, scale(dir, TRAINER_BEHIND)) };
}

function nearestWanderer(w: WorldModel, to: Vec, range = Infinity, speciesId?: string): Wanderer | undefined {
  let best: Wanderer | undefined;
  for (const wanderer of w.wanderers) {
    if (speciesId && wanderer.speciesId !== speciesId) continue;
    const d = distance(wanderer.pos, to);
    if (d <= range && (!best || d < distance(best.pos, to))) best = wanderer;
  }
  return best;
}

/** Point on the trainer's trail `dist` px behind them. */
function trailPoint(w: WorldModel, dist: number): Vec {
  let remaining = dist;
  for (let i = 0; i < w.trail.length - 1; i++) {
    const a = w.trail[i]!;
    const b = w.trail[i + 1]!;
    const seg = distance(a, b);
    if (seg >= remaining) return add(a, scale(normalize(sub(b, a), { x: 0, y: 0 }), remaining));
    remaining -= seg;
  }
  return { ...w.trail[w.trail.length - 1]! };
}

export function stepWorld(w: WorldModel, dtS: number, input: WorldInput, rng: Rng): void {
  const dt = Math.min(dtS, 0.1);
  const trainer = w.trainer;

  // 1. keep the drawn encounter in sync with the engine
  if (input.encounterKey && w.encounter?.key !== input.encounterKey) {
    const same = input.encounterSpecies ? nearestWanderer(w, trainer.pos, ENCOUNTER_RANGE * 2.5, input.encounterSpecies) : undefined;
    const near = same ?? nearestWanderer(w, trainer.pos, ENCOUNTER_RANGE);
    let pos: Vec;
    if (near) {
      pos = { ...near.pos };
      w.wanderers = w.wanderers.filter((x) => x !== near);
    } else {
      pos = placeable(w, add(trainer.pos, scale(FACING_VEC[trainer.facing], FIGHT_GAP + TRAINER_BEHIND + 30)));
    }
    w.encounter = { key: input.encounterKey, pos };
  } else if (!input.encounterKey && w.encounter) {
    w.encounter = null;
  }

  // the Reboot Center: the trainer appears at the door (like waking up at a center) and waits there
  if (input.atCenter && !w.atCenter) {
    const door = w.nav.town.door;
    trainer.pos = { ...door };
    trainer.facing = "up";
    w.follower.pos = { x: door.x + 30, y: door.y + 12 };
    w.trail = [{ ...door }];
    w.path = [];
    w.pathGoal = null;
    w.waypoint = { ...door };
    w.warpS = 0;
  }
  w.atCenter = Boolean(input.atCenter);
  w.warpS += dt;

  // 2. where the trainer and the bug want to be
  let bugGoal: Vec | null = null;
  if (w.atCenter) {
    w.waypoint = { ...w.nav.town.door };
    bugGoal = { x: w.nav.town.door.x + 30, y: w.nav.town.door.y + 12 };
  } else if (w.encounter) {
    const stands = fightStands(trainer.pos, w.encounter.pos, trainer.facing);
    w.waypoint = placeable(w, stands.trainer);
    bugGoal = placeable(w, stands.bug);
  } else {
    const prey = nearestWanderer(w, trainer.pos);
    if (prey) w.waypoint = prey.pos;
    else if (distance(trainer.pos, w.waypoint) < 4) w.waypoint = randomPoint(w, rng);
  }

  // 3. move the trainer
  const before = { ...trainer.pos };
  const stopShort = !w.encounter && distance(trainer.pos, w.waypoint) < 70;
  if (!w.pathGoal || distance(w.pathGoal, w.waypoint) > 24) {
    w.path = findPath(w.nav, trainer.pos, w.waypoint);
    w.pathGoal = { ...w.waypoint };
  }
  while (w.path.length > 1 && distance(trainer.pos, w.path[0]!) < 4) w.path.shift();
  trainer.moving = !stopShort && moveToward(trainer.pos, w.path[0] ?? w.waypoint, TRAINER_SPEED, dt);
  if (trainer.moving) {
    trainer.facing = facingOf(sub(trainer.pos, before), trainer.facing);
    trainer.walkS += dt;
  } else if (w.encounter) {
    trainer.facing = facingOf(sub(w.encounter.pos, trainer.pos), trainer.facing);
  }

  // 4. trail for the follower
  if (distance(trainer.pos, w.trail[0]!) > 3) {
    w.trail.unshift({ ...trainer.pos });
    if (w.trail.length > TRAIL_LENGTH) w.trail.length = TRAIL_LENGTH;
  }

  // 5. the active bug follows the trail, or takes its place in the fight
  const followGoal = bugGoal ?? trailPoint(w, FOLLOW_DISTANCE);
  w.follower.moving = moveToward(w.follower.pos, followGoal, FOLLOWER_SPEED, dt);
  Object.assign(w.follower.pos, pushOut(w.nav, w.follower.pos, 2));

  // 6. roaming wild bugs
  for (const wanderer of w.wanderers) {
    if (wanderer.pauseS > 0) {
      wanderer.pauseS -= dt;
      continue;
    }
    if (!moveToward(wanderer.pos, wanderer.target, WANDER_SPEED, dt)) {
      wanderer.pauseS = 1 + rng() * 2.5;
      wanderer.target = outsideTown(w.nav, placeable(w, add(wanderer.pos, { x: randomInt(rng, -120, 120), y: randomInt(rng, -120, 120) })));
    }
    Object.assign(wanderer.pos, outsideTown(w.nav, pushOut(w.nav, wanderer.pos, 2)));
  }
  while (w.wanderers.length < WANDERER_COUNT) w.wanderers.push(spawnWanderer(w, rng, trainer.pos));

  // 7. camera centred on the trainer, kept inside the map
  w.camera = cameraFor(w, input.viewport);
}

export function cameraFor(w: Pick<WorldModel, "width" | "height" | "trainer">, viewport: { width: number; height: number }): Vec {
  const axis = (center: number, view: number, size: number) => (size <= view ? (size - view) / 2 : Math.min(size - view, Math.max(0, center - view / 2)));
  return { x: axis(w.trainer.pos.x, viewport.width, w.width), y: axis(w.trainer.pos.y, viewport.height, w.height) };
}
