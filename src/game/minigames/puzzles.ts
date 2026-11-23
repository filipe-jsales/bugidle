/**
 * Pure rules of the word and number mini games: word search, crossword,
 * hangman, anagram, memory deck, binary questions, pixel painting and typing.
 * Seeded randomness so every board can be tested.
 */
import { createSeededRng, type Rng } from "../rng";

export interface Cell {
  r: number;
  c: number;
}

/** Uppercase letters only, no accents: "Função" -> "FUNCAO". */
export function lettersOnly(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toUpperCase()
    .replace(/[^A-Z]/g, "");
}

function pickSome<T>(items: readonly T[], count: number, rng: Rng): T[] {
  const pool = [...items];
  const out: T[] = [];
  while (out.length < count && pool.length > 0) out.push(pool.splice(Math.floor(rng() * pool.length), 1)[0]!);
  return out;
}

// ---------------------------------------------------------------- word search

export interface PlacedSearchWord {
  word: string;
  cells: Cell[];
}

export interface WordSearch {
  size: number;
  grid: string[][];
  words: PlacedSearchWord[];
}

const SEARCH_DIRS: readonly [number, number][] = [
  [0, 1],
  [1, 0],
  [1, 1],
  [-1, 1],
];

/** A square grid with the words hidden in four directions and random letters around. */
export function buildWordSearch(pool: readonly string[], count: number, size: number, seed: number): WordSearch {
  const rng = createSeededRng(seed);
  const grid: string[][] = Array.from({ length: size }, () => Array<string>(size).fill(""));
  const words: PlacedSearchWord[] = [];
  const candidates = pickSome(
    pool.map(lettersOnly).filter((w) => w.length >= 3 && w.length <= size),
    count * 2,
    rng,
  );
  for (const word of candidates) {
    if (words.length >= count) break;
    for (let tries = 0; tries < 120; tries++) {
      const [dr, dc] = SEARCH_DIRS[Math.floor(rng() * SEARCH_DIRS.length)]!;
      const r0 = Math.floor(rng() * size);
      const c0 = Math.floor(rng() * size);
      const cells = [...word].map((_, i) => ({ r: r0 + dr * i, c: c0 + dc * i }));
      if (!cells.every(({ r, c }, i) => r >= 0 && c >= 0 && r < size && c < size && (grid[r]![c] === "" || grid[r]![c] === word[i]))) continue;
      cells.forEach(({ r, c }, i) => (grid[r]![c] = word[i]!));
      words.push({ word, cells });
      break;
    }
  }
  const abc = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  for (const row of grid) for (let c = 0; c < size; c++) if (!row[c]) row[c] = abc[Math.floor(rng() * abc.length)]!;
  return { size, grid, words };
}

/** The hidden word between two clicked cells (either end first), if any. */
export function wordBetween(ws: WordSearch, a: Cell, b: Cell): string | undefined {
  return ws.words.find((w) => {
    const first = w.cells[0]!;
    const last = w.cells[w.cells.length - 1]!;
    const forward = first.r === a.r && first.c === a.c && last.r === b.r && last.c === b.c;
    const backward = first.r === b.r && first.c === b.c && last.r === a.r && last.c === a.c;
    return forward || backward;
  })?.word;
}

// ---------------------------------------------------------------- crossword

export interface CrossWord {
  answer: string;
  clue: string;
  row: number;
  col: number;
  across: boolean;
  number: number;
}

export interface Crossword {
  width: number;
  height: number;
  words: CrossWord[];
}

/** Builds a small crossword where every word after the first crosses another one. */
export function buildCrossword(entries: readonly { answer: string; clue: string }[], count: number, seed: number): Crossword {
  const rng = createSeededRng(seed);
  const chosen = pickSome(
    entries.map((e) => ({ answer: lettersOnly(e.answer), clue: e.clue })),
    count * 3,
    rng,
  );
  const cells = new Map<string, string>();
  const key = (r: number, c: number) => `${r},${c}`;
  const placed: Omit<CrossWord, "number">[] = [];

  const fits = (answer: string, row: number, col: number, across: boolean): boolean => {
    const dr = across ? 0 : 1;
    const dc = across ? 1 : 0;
    if (cells.has(key(row - dr, col - dc)) || cells.has(key(row + dr * answer.length, col + dc * answer.length))) return false;
    let crossings = 0;
    for (let i = 0; i < answer.length; i++) {
      const r = row + dr * i;
      const c = col + dc * i;
      const here = cells.get(key(r, c));
      if (here) {
        if (here !== answer[i]) return false;
        crossings++;
        continue;
      }
      // no letters side by side, except where words cross
      if (cells.has(key(r + dc, c + dr)) || cells.has(key(r - dc, c - dr))) return false;
    }
    return placed.length === 0 || crossings > 0;
  };
  const put = (e: { answer: string; clue: string }, row: number, col: number, across: boolean) => {
    for (let i = 0; i < e.answer.length; i++) cells.set(key(row + (across ? 0 : i), col + (across ? i : 0)), e.answer[i]!);
    placed.push({ ...e, row, col, across });
  };

  for (const e of chosen.sort((a, b) => b.answer.length - a.answer.length)) {
    if (placed.length >= count) break;
    if (placed.length === 0) {
      put(e, 0, 0, true);
      continue;
    }
    let done = false;
    for (const other of [...placed].sort(() => rng() - 0.5)) {
      for (let i = 0; i < other.answer.length && !done; i++) {
        for (let j = 0; j < e.answer.length && !done; j++) {
          if (other.answer[i] !== e.answer[j]) continue;
          const across = !other.across;
          const row = other.across ? other.row - j : other.row + i;
          const col = other.across ? other.col + i : other.col - j;
          if (fits(e.answer, row, col, across)) {
            put(e, row, col, across);
            done = true;
          }
        }
      }
      if (done) break;
    }
  }

  const minR = Math.min(...placed.map((w) => w.row));
  const minC = Math.min(...placed.map((w) => w.col));
  const shifted = placed.map((w) => ({ ...w, row: w.row - minR, col: w.col - minC }));
  const starts = [...new Set(shifted.map((w) => `${w.row},${w.col}`))].sort((a, b) => {
    const [ar, ac] = a.split(",").map(Number);
    const [br, bc] = b.split(",").map(Number);
    return ar! - br! || ac! - bc!;
  });
  const words = shifted
    .map((w) => ({ ...w, number: starts.indexOf(`${w.row},${w.col}`) + 1 }))
    .sort((a, b) => a.number - b.number || Number(b.across) - Number(a.across));
  return {
    width: Math.max(...words.map((w) => w.col + (w.across ? w.answer.length : 1))),
    height: Math.max(...words.map((w) => w.row + (w.across ? 1 : w.answer.length))),
    words,
  };
}

/** Cells of a crossword word. */
export function crossCells(w: CrossWord): Cell[] {
  return [...w.answer].map((_, i) => ({ r: w.row + (w.across ? 0 : i), c: w.col + (w.across ? i : 0) }));
}

// ---------------------------------------------------------------- hangman and anagram

export const HANGMAN_LIVES = 6;

export function hangmanMask(word: string, guessed: ReadonlySet<string>): string {
  return [...word].map((ch) => (guessed.has(ch) ? ch : "_")).join(" ");
}

export function hangmanState(word: string, guessed: ReadonlySet<string>): { wrong: number; solved: boolean; lost: boolean } {
  const wrong = [...guessed].filter((g) => !word.includes(g)).length;
  const solved = [...word].every((ch) => guessed.has(ch));
  return { wrong, solved, lost: !solved && wrong >= HANGMAN_LIVES };
}

/** The letters in another order (never the word itself). */
export function scramble(word: string, seed: number): string {
  const rng = createSeededRng(seed);
  if (new Set(word).size < 2) return word;
  for (let tries = 0; tries < 20; tries++) {
    const letters = [...word];
    for (let i = letters.length - 1; i > 0; i--) {
      const j = Math.floor(rng() * (i + 1));
      [letters[i], letters[j]] = [letters[j]!, letters[i]!];
    }
    const out = letters.join("");
    if (out !== word) return out;
  }
  return [...word].reverse().join("");
}

// ---------------------------------------------------------------- memory

export interface MemoryCard {
  id: number;
  pair: number;
  text: string;
}

export function buildMemoryDeck(pairs: readonly { a: string; b: string }[], count: number, seed: number): MemoryCard[] {
  const rng = createSeededRng(seed);
  const chosen = pickSome(pairs, count, rng);
  const cards = chosen.flatMap((p, pair) => [
    { pair, text: p.a },
    { pair, text: p.b },
  ]);
  return pickSome(cards, cards.length, rng).map((c, id) => ({ ...c, id }));
}

/** 100 for a perfect game (one try per pair), less for every extra pair of flips. */
export function memoryScore(pairs: number, moves: number): number {
  return Math.max(10, 100 - Math.max(0, moves - pairs) * 6);
}

// ---------------------------------------------------------------- binary

export type BinaryKind = "decToBin" | "binToDec" | "decToHex" | "hexToDec";

export interface BinaryQuestion {
  kind: BinaryKind;
  value: number;
  /** What is shown. */
  prompt: string;
  /** The answer, normalized. */
  answer: string;
}

export function binaryQuestion(rng: Rng): BinaryQuestion {
  const kinds: BinaryKind[] = ["decToBin", "binToDec", "decToHex", "hexToDec"];
  const kind = kinds[Math.floor(rng() * kinds.length)]!;
  const value = kind === "decToBin" || kind === "binToDec" ? Math.floor(rng() * 32) : Math.floor(rng() * 256);
  const bin = value.toString(2);
  const hex = value.toString(16).toUpperCase();
  switch (kind) {
    case "decToBin":
      return { kind, value, prompt: String(value), answer: bin };
    case "binToDec":
      return { kind, value, prompt: bin, answer: String(value) };
    case "decToHex":
      return { kind, value, prompt: String(value), answer: hex };
    case "hexToDec":
      return { kind, value, prompt: hex, answer: String(value) };
  }
}

/** Accepts 0b/0x prefixes, leading zeros, spaces and any case. */
export function isBinaryAnswer(q: BinaryQuestion, text: string): boolean {
  const clean = text.trim().toUpperCase().replace(/\s/g, "").replace(/^0[BX]/, "");
  const stripped = clean.replace(/^0+(?=.)/, "");
  return stripped === q.answer;
}

// ---------------------------------------------------------------- pixel

/** Share of cells painted with the right palette index, 0-100. */
export function pixelScore(rows: readonly string[], painted: readonly (number | null)[][]): number {
  let right = 0;
  let total = 0;
  rows.forEach((row, r) =>
    [...row].forEach((ch, c) => {
      total++;
      if (painted[r]?.[c] === Number(ch)) right++;
    }),
  );
  return Math.round((right / total) * 100);
}

// ---------------------------------------------------------------- typing

/** Points from accuracy and speed: about 1.6 points per word per minute, times accuracy. */
export function typingScore(target: string, typed: string, seconds: number): { points: number; accuracy: number; wpm: number } {
  let right = 0;
  for (let i = 0; i < target.length; i++) if (typed[i] === target[i]) right++;
  const accuracy = target.length > 0 ? right / Math.max(target.length, typed.length) : 0;
  const wpm = seconds > 0 ? target.length / 5 / (seconds / 60) : 0;
  return { points: Math.round(Math.min(100, wpm * 1.6) * accuracy), accuracy, wpm };
}
