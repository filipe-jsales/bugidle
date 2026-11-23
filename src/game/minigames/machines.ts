/**
 * Pure rules of the "machine" mini games: the robot that follows a program,
 * logic gate circuits and data pipes. Everything here is testable without a screen.
 */
import type { GateKind, GateLevel, GateRef, RobotCommand, RobotLevel } from "../data/gameData";
import { createSeededRng } from "../rng";

// ---------------------------------------------------------------- robot

export type Dir = 0 | 1 | 2 | 3; // 0 right, 1 down, 2 left, 3 up
const STEP: readonly [number, number][] = [
  [0, 1],
  [1, 0],
  [0, -1],
  [-1, 0],
];

export const MAX_PROGRAM = 12;

export interface RobotPose {
  r: number;
  c: number;
  dir: Dir;
}

export interface RobotRun {
  /** Every pose the robot goes through, start first. */
  path: RobotPose[];
  success: boolean;
  /** Bumped into a wall or left the map. */
  crashed: boolean;
}

function find(level: RobotLevel, ch: string): { r: number; c: number } {
  for (let r = 0; r < level.map.length; r++) {
    const c = level.map[r]!.indexOf(ch);
    if (c >= 0) return { r, c };
  }
  throw new Error(`robot level without ${ch}`);
}

function free(level: RobotLevel, r: number, c: number): boolean {
  const ch = level.map[r]?.[c];
  return ch !== undefined && ch !== "#";
}

/** Expands "repeat3" into three copies of the command after it. */
export function expandProgram(program: readonly RobotCommand[]): Exclude<RobotCommand, "repeat3">[] {
  const out: Exclude<RobotCommand, "repeat3">[] = [];
  for (let i = 0; i < program.length; i++) {
    const cmd = program[i]!;
    if (cmd !== "repeat3") {
      out.push(cmd);
      continue;
    }
    const next = program[i + 1];
    if (next && next !== "repeat3") out.push(next, next, next);
    i++;
  }
  return out;
}

/** Runs a program; stops at the bug, at a crash, or at the end of the commands. */
export function runRobot(level: RobotLevel, program: readonly RobotCommand[]): RobotRun {
  const start = find(level, "R");
  const bug = find(level, "B");
  let pose: RobotPose = { ...start, dir: 0 };
  const path: RobotPose[] = [pose];
  for (const cmd of expandProgram(program)) {
    if (cmd === "left") pose = { ...pose, dir: ((pose.dir + 3) % 4) as Dir };
    else if (cmd === "right") pose = { ...pose, dir: ((pose.dir + 1) % 4) as Dir };
    else {
      const [dr, dc] = STEP[pose.dir]!;
      const r = pose.r + dr;
      const c = pose.c + dc;
      if (!free(level, r, c)) return { path, success: false, crashed: true };
      pose = { ...pose, r, c };
    }
    path.push(pose);
    if (pose.r === bug.r && pose.c === bug.c) return { path, success: true, crashed: false };
  }
  return { path, success: false, crashed: false };
}

/**
 * Fewest commands that reach the bug. Turns and steps cost 1; "repeat3" plus a
 * step costs 2 and moves three cells. Dijkstra over (cell, direction).
 */
export function shortestProgram(level: RobotLevel): number {
  const start = find(level, "R");
  const bug = find(level, "B");
  const cost = new Map<string, number>();
  const queue: { pose: RobotPose; cost: number }[] = [{ pose: { ...start, dir: 0 }, cost: 0 }];
  cost.set(`${start.r},${start.c},0`, 0);
  while (queue.length > 0) {
    queue.sort((x, y) => x.cost - y.cost);
    const { pose, cost: here } = queue.shift()!;
    if (pose.r === bug.r && pose.c === bug.c) return here;
    const [dr, dc] = STEP[pose.dir]!;
    const moves: { pose: RobotPose; cost: number }[] = [
      { pose: { ...pose, dir: ((pose.dir + 3) % 4) as Dir }, cost: 1 },
      { pose: { ...pose, dir: ((pose.dir + 1) % 4) as Dir }, cost: 1 },
    ];
    if (free(level, pose.r + dr, pose.c + dc)) moves.push({ pose: { ...pose, r: pose.r + dr, c: pose.c + dc }, cost: 1 });
    // three steps in a row, stopping early if the bug is on the way
    let r = pose.r;
    let c = pose.c;
    for (let i = 0; i < 3 && free(level, r + dr, c + dc); i++) {
      r += dr;
      c += dc;
      if ((r === bug.r && c === bug.c) || i === 2) {
        moves.push({ pose: { ...pose, r, c }, cost: 2 });
        break;
      }
    }
    for (const m of moves) {
      const k = `${m.pose.r},${m.pose.c},${m.pose.dir}`;
      const total = here + m.cost;
      if (total < (cost.get(k) ?? Infinity)) {
        cost.set(k, total);
        queue.push({ pose: m.pose, cost: total });
      }
    }
  }
  return MAX_PROGRAM;
}

/** 100 when the program is as short as the plain shortest path, less when longer. */
export function robotScore(level: RobotLevel, program: readonly RobotCommand[], run: RobotRun): number {
  if (!run.success) return 0;
  const best = shortestProgram(level);
  return Math.max(40, Math.min(100, 100 - Math.max(0, program.length - best) * 10));
}

// ---------------------------------------------------------------- logic gates

export function gateOutput(kind: GateKind, a: 0 | 1, b: 0 | 1): 0 | 1 {
  switch (kind) {
    case "AND":
      return (a & b) as 0 | 1;
    case "OR":
      return (a | b) as 0 | 1;
    case "XOR":
      return (a ^ b) as 0 | 1;
    case "NOT":
      return (a ? 0 : 1) as 0 | 1;
  }
}

/** Which gates fit a slot: NOT for one input, the others for two. */
export function gatesFor(inputs: number): GateKind[] {
  return inputs === 1 ? ["NOT"] : ["AND", "OR", "XOR"];
}

/** Value of every gate with the player's choices (null where a gate is not chosen yet). */
export function evalCircuit(level: GateLevel, choices: readonly (GateKind | null)[]): (0 | 1 | null)[] {
  const values: (0 | 1 | null)[] = [];
  const read = (ref: GateRef): 0 | 1 | null => (typeof ref === "number" ? (values[ref] ?? null) : (level.inputs[ref] ?? 0));
  level.gates.forEach((gate, i) => {
    const kind = choices[i];
    const a = read(gate.inputs[0]!);
    const b = gate.inputs[1] !== undefined ? read(gate.inputs[1]) : 0;
    values.push(kind && a !== null && b !== null ? gateOutput(kind, a, b) : null);
  });
  return values;
}

export function lampOn(level: GateLevel, choices: readonly (GateKind | null)[]): boolean {
  return evalCircuit(level, choices).at(-1) === 1;
}

// ---------------------------------------------------------------- data pipes

/** Open sides of a tile as bits: 1 up, 2 right, 4 down, 8 left. */
export type PipeMask = number;
export const PIPE_SIZE = 5;

export interface PipeBoard {
  /** Base shape of each tile (before rotation). */
  shapes: PipeMask[][];
  /** Quarter turns clockwise applied by the player. */
  turns: number[][];
  /** Row where the data enters from the left and where it must leave on the right. */
  sourceRow: number;
  targetRow: number;
}

export function rotateMask(mask: PipeMask, turns: number): PipeMask {
  let m = mask;
  for (let i = 0; i < ((turns % 4) + 4) % 4; i++) m = ((m << 1) | (m >> 3)) & 15;
  return m;
}

const UP = 1;
const RIGHT = 2;
const DOWN = 4;
const LEFT = 8;
const OPPOSITE: Record<number, number> = { [UP]: DOWN, [DOWN]: UP, [LEFT]: RIGHT, [RIGHT]: LEFT };
const MOVE: Record<number, [number, number]> = { [UP]: [-1, 0], [DOWN]: [1, 0], [LEFT]: [0, -1], [RIGHT]: [0, 1] };

export function tileMask(board: PipeBoard, r: number, c: number): PipeMask {
  return rotateMask(board.shapes[r]![c]!, board.turns[r]![c]!);
}

/** Cells the data reaches from the source, and whether it gets out to the user. */
export function flowFrom(board: PipeBoard): { reached: Set<string>; connected: boolean } {
  const reached = new Set<string>();
  const queue: [number, number, number][] = [[board.sourceRow, 0, LEFT]];
  let connected = false;
  while (queue.length > 0) {
    const [r, c, from] = queue.shift()!;
    if (r < 0 || c < 0 || r >= PIPE_SIZE || c >= PIPE_SIZE) continue;
    const mask = tileMask(board, r, c);
    if (!(mask & from)) continue;
    const k = `${r},${c}`;
    if (reached.has(k)) continue;
    reached.add(k);
    for (const side of [UP, RIGHT, DOWN, LEFT]) {
      if (!(mask & side) || side === from) continue;
      if (c === PIPE_SIZE - 1 && side === RIGHT && r === board.targetRow) connected = true;
      const [dr, dc] = MOVE[side]!;
      queue.push([r + dr, c + dc, OPPOSITE[side]!]);
    }
  }
  return { reached, connected };
}

/**
 * A board with a real route from the source to the target (a random walk that
 * never crosses itself), other tiles random, and every tile turned at random.
 */
export function buildPipes(seed: number): PipeBoard {
  const rng = createSeededRng(seed);
  const sourceRow = Math.floor(rng() * PIPE_SIZE);
  const targetRow = Math.floor(rng() * PIPE_SIZE);
  // walk column by column: move vertically inside a column, then step right
  const route: { r: number; c: number; in: number; out: number }[] = [];
  let r = sourceRow;
  let from = LEFT;
  for (let c = 0; c < PIPE_SIZE; c++) {
    const goal = c === PIPE_SIZE - 1 ? targetRow : Math.floor(rng() * PIPE_SIZE);
    while (r !== goal) {
      const side = goal > r ? DOWN : UP;
      route.push({ r, c, in: from, out: side });
      from = OPPOSITE[side]!;
      r += goal > r ? 1 : -1;
    }
    route.push({ r, c, in: from, out: RIGHT });
    from = LEFT;
  }
  const shapes: PipeMask[][] = Array.from({ length: PIPE_SIZE }, () => Array<PipeMask>(PIPE_SIZE).fill(0));
  const random = [UP | DOWN, UP | RIGHT, UP | RIGHT | DOWN, RIGHT | LEFT, DOWN | LEFT];
  for (let y = 0; y < PIPE_SIZE; y++) for (let x = 0; x < PIPE_SIZE; x++) shapes[y]![x] = random[Math.floor(rng() * random.length)]!;
  for (const step of route) shapes[step.r]![step.c] = step.in | step.out;
  const turns = shapes.map((row) => row.map(() => Math.floor(rng() * 4)));
  const board = { shapes, turns, sourceRow, targetRow };
  // never start already solved
  if (flowFrom(board).connected) board.turns[sourceRow]![0] = (board.turns[sourceRow]![0]! + 1) % 4;
  return board;
}

/** 100 for a fast fix, down to 30 for a slow one. */
export function pipesScore(seconds: number): number {
  return Math.max(30, Math.min(100, 110 - seconds));
}
