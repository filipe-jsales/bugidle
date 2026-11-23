/**
 * Data structures played with bugs: a stack puzzle (reach a target exit order
 * with push and pop), a queue question (who leaves k-th?) and a hash table
 * (which bucket does each bug go to?). Pure and seeded.
 */
import { createSeededRng } from "../rng";

// ---------------------------------------------------------------- stack

export interface StackPuzzle {
  /** Bugs waiting to enter, first in line first. */
  incoming: string[];
  stack: string[];
  output: string[];
  /** The exit order the player must produce. */
  target: string[];
}

/** A target that is reachable: made by a random valid sequence of pushes and pops. */
export function buildStackPuzzle(items: readonly string[], seed: number): StackPuzzle {
  const rng = createSeededRng(seed);
  const incoming = [...items];
  const stack: string[] = [];
  const target: string[] = [];
  while (incoming.length > 0 || stack.length > 0) {
    const push = incoming.length > 0 && (stack.length === 0 || rng() < 0.55);
    if (push) stack.push(incoming.shift()!);
    else target.push(stack.pop()!);
  }
  // never the trivial "same order" or "fully reversed" target
  if (target.join() === items.join() || target.join() === [...items].reverse().join()) {
    return buildStackPuzzle(items, seed + 1);
  }
  return { incoming: [...items], stack: [], output: [], target };
}

export type StackMove = "push" | "pop";

/** Applies a move; a pop that does not match the target is refused (returns ok false). */
export function stackMove(p: StackPuzzle, move: StackMove): { puzzle: StackPuzzle; ok: boolean } {
  if (move === "push") {
    if (p.incoming.length === 0) return { puzzle: p, ok: false };
    return { puzzle: { ...p, incoming: p.incoming.slice(1), stack: [...p.stack, p.incoming[0]!] }, ok: true };
  }
  const top = p.stack[p.stack.length - 1];
  if (top === undefined || top !== p.target[p.output.length]) return { puzzle: p, ok: false };
  return { puzzle: { ...p, stack: p.stack.slice(0, -1), output: [...p.output, top] }, ok: true };
}

export function stackSolved(p: StackPuzzle): boolean {
  return p.output.length === p.target.length;
}

// ---------------------------------------------------------------- queue

export type QueueOp = { kind: "enqueue"; item: string } | { kind: "dequeue" };

export interface QueueQuestion {
  ops: QueueOp[];
  /** Which leaver is asked for (1-based). */
  ask: number;
  answer: string;
}

/** A list of arrivals and departures at the Reboot Center; asks who leaves k-th. */
export function buildQueueQuestion(items: readonly string[], seed: number): QueueQuestion {
  const rng = createSeededRng(seed);
  const pending = [...items];
  for (let i = pending.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [pending[i], pending[j]] = [pending[j]!, pending[i]!];
  }
  const queue: string[] = [];
  const ops: QueueOp[] = [];
  const left: string[] = [];
  while (pending.length > 0 || queue.length > 0) {
    if (pending.length > 0 && (queue.length === 0 || rng() < 0.6)) {
      const item = pending.shift()!;
      queue.push(item);
      ops.push({ kind: "enqueue", item });
    } else {
      left.push(queue.shift()!);
      ops.push({ kind: "dequeue" });
    }
  }
  const ask = 2 + Math.floor(rng() * Math.max(1, left.length - 2));
  return { ops, ask, answer: left[ask - 1]! };
}

/** Who leaves, in order, for a list of queue operations (first in, first out). */
export function queueLeavers(ops: readonly QueueOp[]): string[] {
  const queue: string[] = [];
  const left: string[] = [];
  for (const op of ops) {
    if (op.kind === "enqueue") queue.push(op.item);
    else if (queue.length > 0) left.push(queue.shift()!);
  }
  return left;
}

// ---------------------------------------------------------------- hash table

export const HASH_BUCKETS = 5;

/** The hash function of the puzzle: the bug's level modulo the number of buckets. */
export function hashBucket(level: number, buckets = HASH_BUCKETS): number {
  return ((level % buckets) + buckets) % buckets;
}
