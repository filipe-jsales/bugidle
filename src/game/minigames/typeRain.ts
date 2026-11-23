/**
 * "Chuva de Código" (a typing shooter): computing words fall; typing a word's
 * first letter locks onto it, finishing it destroys it. A word that reaches
 * the ground costs a life. Words come faster over time. Pure and seeded.
 */
import type { Rng } from "../rng";

export interface FallingWord {
  id: number;
  word: string;
  /** 0 left .. 1 right. */
  x: number;
  /** 0 top .. 1 ground. */
  y: number;
  /** Screen heights per second. */
  speed: number;
}

export interface RainState {
  words: FallingWord[];
  nextId: number;
  /** Seconds until the next word appears. */
  spawnIn: number;
  elapsed: number;
  lives: number;
  /** Words destroyed, in order. */
  destroyed: string[];
  /** Locked word id, and how many of its letters were typed. */
  target: number | null;
  typed: number;
  keys: number;
  misses: number;
}

export const RAIN_LIVES = 3;

export function createRain(): RainState {
  return { words: [], nextId: 1, spawnIn: 0.5, elapsed: 0, lives: RAIN_LIVES, destroyed: [], target: null, typed: 0, keys: 0, misses: 0 };
}

/** Seconds between words: starts slow and speeds up, never below 0.9 s. */
export function spawnInterval(elapsed: number): number {
  return Math.max(0.9, 2.6 - elapsed * 0.025);
}

export function rainOver(s: RainState): boolean {
  return s.lives <= 0;
}

/** Advances the rain: moves words, spawns new ones, takes a life for each that lands. */
export function stepRain(s: RainState, dt: number, rng: Rng, pool: readonly string[]): void {
  if (rainOver(s)) return;
  s.elapsed += dt;
  for (const w of s.words) w.y += w.speed * dt;
  const landed = s.words.filter((w) => w.y >= 1);
  if (landed.length > 0) {
    s.lives = Math.max(0, s.lives - landed.length);
    if (landed.some((w) => w.id === s.target)) {
      s.target = null;
      s.typed = 0;
    }
    s.words = s.words.filter((w) => w.y < 1);
  }
  s.spawnIn -= dt;
  if (s.spawnIn <= 0) {
    const onScreen = new Set(s.words.map((w) => w.word[0]));
    // prefer a word whose first letter is not already falling, so the first key picks one word
    const fresh = pool.filter((w) => !onScreen.has(w[0]));
    const from = fresh.length > 0 ? fresh : pool;
    const word = from[Math.floor(rng() * from.length)]!;
    s.words.push({ id: s.nextId++, word, x: 0.08 + rng() * 0.84, y: 0, speed: 0.07 + Math.min(0.12, s.elapsed * 0.0015) + rng() * 0.02 });
    s.spawnIn = spawnInterval(s.elapsed);
  }
}

/** Types one key. Returns the destroyed word, if this key finished one. */
export function typeKey(s: RainState, key: string): string | null {
  if (rainOver(s)) return null;
  const ch = key.toLowerCase();
  s.keys += 1;
  let target = s.words.find((w) => w.id === s.target);
  if (!target) {
    // lock onto the lowest word starting with this letter
    target = s.words.filter((w) => w.word[0] === ch).sort((a, b) => b.y - a.y)[0];
    if (!target) {
      s.misses += 1;
      return null;
    }
    s.target = target.id;
    s.typed = 1;
  } else if (target.word[s.typed] === ch) {
    s.typed += 1;
  } else {
    s.misses += 1;
    return null;
  }
  if (s.typed >= target.word.length) {
    s.words = s.words.filter((w) => w.id !== target!.id);
    s.destroyed.push(target.word);
    s.target = null;
    s.typed = 0;
    return target.word;
  }
  return null;
}

/** 5 points per word, minus a little for missed keys, 0-100. */
export function rainScore(s: RainState): number {
  const accuracy = s.keys > 0 ? (s.keys - s.misses) / s.keys : 0;
  return Math.max(0, Math.min(100, Math.round(s.destroyed.length * 5 * (0.6 + 0.4 * accuracy))));
}
