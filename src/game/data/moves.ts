import type { BugType } from "../types";

export interface MoveDef {
  readonly id: string;
  readonly name: string;
  readonly type: BugType;
  readonly power: number;
  /** Level at which a bug of a matching type learns the move. */
  readonly learnLevel: number;
}

const tier = (type: BugType, names: readonly [string, string, string]): MoveDef[] =>
  names.map((name, i) => ({
    id: `${type}-${i + 1}`,
    name,
    type,
    power: [40, 65, 90][i]!,
    learnLevel: [1, 14, 30][i]!,
  }));

export const MOVES: readonly MoveDef[] = [
  ...tier("syntax", ["Typo Jab", "Missing Bracket", "Parse Storm"]),
  ...tier("logic", ["Wrong Branch", "Null Deref", "Paradox"]),
  ...tier("memory", ["Slow Leak", "Dangling Pointer", "Heap Smash"]),
  ...tier("concurrency", ["Race", "Lock Contention", "Deadlock"]),
  ...tier("network", ["Ping", "Packet Flood", "DNS Storm"]),
  ...tier("security", ["Probe", "Injection", "Zero-Day Exploit"]),
  ...tier("performance", ["Busy Wait", "Spin Loop", "Exponential Blowup"]),
  ...tier("ui", ["Flicker", "Layout Shift", "Z-Index War"]),
];

const MOVES_BY_ID = new Map(MOVES.map((m) => [m.id, m]));

export function getMove(id: string): MoveDef {
  const move = MOVES_BY_ID.get(id);
  if (!move) throw new Error(`Unknown move: ${id}`);
  return move;
}

/** Moves a bug knows: every move of its types up to its level. */
export function movesFor(types: readonly BugType[], level: number): MoveDef[] {
  return MOVES.filter((m) => types.includes(m.type) && m.learnLevel <= level);
}
