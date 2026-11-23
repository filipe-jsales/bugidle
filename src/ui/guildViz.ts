/**
 * Step-by-step frames of each guild algorithm on a small array, for the bars
 * that move while a raid runs. Pure: every frame is a snapshot of the array
 * plus what the algorithm is looking at. Sorting ends sorted; searching ends
 * on the target.
 */
import { createSeededRng, hashString } from "../game/rng";

export interface VizFrame {
  bars: number[];
  /** Indexes being compared or moved now. */
  active: number[];
  /** Indexes already in their final place (sorts) or ruled out (searches). */
  done: number[];
  /** For searches: the value being looked for. */
  target?: number;
  /** For searches: the index where it was found. */
  found?: number;
}

export const VIZ_SIZE = 16;

function shuffled(size: number, seed: string): number[] {
  const rng = createSeededRng(hashString(seed));
  const values = Array.from({ length: size }, (_, i) => i + 1);
  for (let i = values.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [values[i], values[j]] = [values[j]!, values[i]!];
  }
  return values;
}

function recorder() {
  const frames: VizFrame[] = [];
  const push = (bars: number[], active: number[], done: number[], extra: Partial<VizFrame> = {}) => frames.push({ bars: [...bars], active: [...active], done: [...done], ...extra });
  return { frames, push };
}

const range = (from: number, to: number) => Array.from({ length: Math.max(0, to - from) }, (_, i) => from + i);

function bubble(a: number[]): VizFrame[] {
  const { frames, push } = recorder();
  for (let end = a.length - 1; end > 0; end--) {
    for (let i = 0; i < end; i++) {
      push(a, [i, i + 1], range(end + 1, a.length));
      if (a[i]! > a[i + 1]!) [a[i], a[i + 1]] = [a[i + 1]!, a[i]!];
    }
  }
  push(a, [], range(0, a.length));
  return frames;
}

function insertion(a: number[]): VizFrame[] {
  const { frames, push } = recorder();
  for (let i = 1; i < a.length; i++) {
    for (let j = i; j > 0 && a[j - 1]! > a[j]!; j--) {
      push(a, [j - 1, j], []);
      [a[j - 1], a[j]] = [a[j]!, a[j - 1]!];
    }
    push(a, [i], []);
  }
  push(a, [], range(0, a.length));
  return frames;
}

function merge(a: number[]): VizFrame[] {
  const { frames, push } = recorder();
  const sort = (lo: number, hi: number) => {
    if (hi - lo < 2) return;
    const mid = (lo + hi) >> 1;
    sort(lo, mid);
    sort(mid, hi);
    const merged: number[] = [];
    let i = lo;
    let j = mid;
    while (i < mid || j < hi) {
      if (j >= hi || (i < mid && a[i]! <= a[j]!)) merged.push(a[i++]!);
      else merged.push(a[j++]!);
    }
    merged.forEach((v, k) => {
      a[lo + k] = v;
      push(a, [lo + k], []);
    });
  };
  sort(0, a.length);
  push(a, [], range(0, a.length));
  return frames;
}

function quick(a: number[]): VizFrame[] {
  const { frames, push } = recorder();
  const sort = (lo: number, hi: number) => {
    if (lo >= hi) return;
    const pivot = a[hi]!;
    let store = lo;
    for (let i = lo; i < hi; i++) {
      push(a, [i, hi], []);
      if (a[i]! < pivot) {
        [a[i], a[store]] = [a[store]!, a[i]!];
        store++;
      }
    }
    [a[store], a[hi]] = [a[hi]!, a[store]!];
    push(a, [store], []);
    sort(lo, store - 1);
    sort(store + 1, hi);
  };
  sort(0, a.length - 1);
  push(a, [], range(0, a.length));
  return frames;
}

function heap(a: number[]): VizFrame[] {
  const { frames, push } = recorder();
  const n = a.length;
  const sift = (start: number, end: number) => {
    let root = start;
    while (root * 2 + 1 < end) {
      let child = root * 2 + 1;
      if (child + 1 < end && a[child]! < a[child + 1]!) child++;
      push(a, [root, child], range(end, n));
      if (a[root]! >= a[child]!) return;
      [a[root], a[child]] = [a[child]!, a[root]!];
      root = child;
    }
  };
  for (let i = (n >> 1) - 1; i >= 0; i--) sift(i, n);
  for (let end = n - 1; end > 0; end--) {
    [a[0], a[end]] = [a[end]!, a[0]!];
    push(a, [0, end], range(end, n));
    sift(0, end);
  }
  push(a, [], range(0, n));
  return frames;
}

function counting(a: number[]): VizFrame[] {
  const { frames, push } = recorder();
  const counts = new Map<number, number>();
  a.forEach((v, i) => {
    counts.set(v, (counts.get(v) ?? 0) + 1);
    push(a, [i], []);
  });
  const sorted = [...counts.keys()].sort((x, y) => x - y).flatMap((v) => Array<number>(counts.get(v)!).fill(v));
  sorted.forEach((v, i) => {
    a[i] = v;
    push(a, [i], range(0, i));
  });
  push(a, [], range(0, a.length));
  return frames;
}

function linear(a: number[], target: number): VizFrame[] {
  const { frames, push } = recorder();
  for (let i = 0; i < a.length; i++) {
    push(a, [i], range(0, i), { target });
    if (a[i] === target) {
      push(a, [], range(0, i), { target, found: i });
      break;
    }
  }
  return frames;
}

function binary(a: number[], target: number): VizFrame[] {
  const { frames, push } = recorder();
  a.sort((x, y) => x - y);
  let lo = 0;
  let hi = a.length - 1;
  while (lo <= hi) {
    const mid = (lo + hi) >> 1;
    const out = [...range(0, lo), ...range(hi + 1, a.length)];
    push(a, [mid], out, { target });
    if (a[mid] === target) {
      push(a, [], out, { target, found: mid });
      break;
    }
    if (a[mid]! < target) lo = mid + 1;
    else hi = mid - 1;
  }
  return frames;
}

function hash(a: number[], target: number): VizFrame[] {
  const { frames, push } = recorder();
  // building the table touches every item once; the lookup is a single jump
  a.forEach((_, i) => push(a, [i], []));
  const at = a.indexOf(target);
  push(a, [at], [], { target });
  push(a, [], [], { target, found: at });
  return frames;
}

const SORTS: Record<string, (a: number[]) => VizFrame[]> = {
  bubbleSort: bubble,
  insertionSort: insertion,
  mergeSort: merge,
  quickSort: quick,
  heapSort: heap,
  countingSort: counting,
};
const SEARCHES: Record<string, (a: number[], target: number) => VizFrame[]> = {
  linearSearch: linear,
  binarySearch: binary,
  hashTable: hash,
};

const cache = new Map<string, VizFrame[]>();

/** Frames for a champion on a raid; the same raid always shows the same array. */
export function vizFrames(championId: string, seed: string, size = VIZ_SIZE): VizFrame[] {
  const key = `${championId}|${seed}|${size}`;
  const cached = cache.get(key);
  if (cached) return cached;
  const start = shuffled(size, seed);
  const target = start[Math.floor(size * 0.7)]!;
  const frames = SORTS[championId]?.([...start]) ?? SEARCHES[championId]?.([...start], target) ?? [{ bars: start, active: [], done: [] }];
  cache.set(key, frames);
  return frames;
}

/** The frame to show at a raid progress between 0 and 1. */
export function frameAt(frames: readonly VizFrame[], progress: number): VizFrame {
  const index = Math.min(frames.length - 1, Math.floor(Math.max(0, Math.min(1, progress)) * frames.length));
  return frames[index]!;
}
