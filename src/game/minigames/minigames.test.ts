import { GATE_LEVELS, LANGUAGE_SNIPPETS, OUTPUT_SNIPPETS, PIXEL_PICTURES, ROBOT_LEVELS, TYPING_LINES } from "../data/gameData";
import { createSeededRng } from "../rng";
import { stateWith } from "../testUtils";
import { exportSave, importSave } from "../save";
import { bestScore, finishGame, GAME_IDS, PAID_PLAYS_PER_DAY, paidPlaysLeft, RANKING_SIZE } from "../minigames";
import {
  binaryQuestion,
  buildCrossword,
  buildMemoryDeck,
  buildWordSearch,
  crossCells,
  hangmanMask,
  hangmanState,
  isBinaryAnswer,
  lettersOnly,
  memoryScore,
  pixelScore,
  scramble,
  typingScore,
  wordBetween,
} from "./puzzles";
import { buildPipes, evalCircuit, flowFrom, gatesFor, lampOn, rotateMask, runRobot, shortestProgram, tileMask, type PipeBoard } from "./machines";
import { LANGUAGE_NAMES, MEMORY_PAIRS, TERM_CLUES, TRUE_FALSE, WORD_POOL } from "../../i18n/gameContent.ptBR";
import { GAME_TEXT } from "../../i18n/games.ptBR";
import type { GateKind } from "../data/gameData";

const TODAY = 20_000;

describe("mini games: scores and local ranking", () => {
  it("every game has a name and help", () => {
    for (const id of GAME_IDS) expect(GAME_TEXT[id].name.length, id).toBeGreaterThan(3);
  });

  it("the first plays of the day pay coins, every play goes to the top 5", () => {
    const state = stateWith(["leaklet", 5]);
    const coins = state.coins;
    for (let i = 0; i < PAID_PLAYS_PER_DAY; i++) expect(finishGame(state, "binary", 50, TODAY).coins).toBeGreaterThan(0);
    expect(paidPlaysLeft(state, "binary", TODAY)).toBe(0);
    expect(finishGame(state, "binary", 90, TODAY)).toMatchObject({ coins: 0, best: true, place: 1 });
    expect(paidPlaysLeft(state, "binary", TODAY + 1)).toBe(PAID_PLAYS_PER_DAY);
    for (let i = 0; i < 5; i++) finishGame(state, "binary", 10 + i, TODAY);
    const ranking = state.minigames.games.binary!.ranking;
    expect(ranking).toHaveLength(RANKING_SIZE);
    expect(ranking[0]!.score).toBe(90);
    expect(bestScore(state, "binary")).toBe(90);
    expect(state.coins).toBeGreaterThan(coins);
    expect(finishGame(state, "pixel", 250, TODAY).place).toBe(1);
    expect(bestScore(state, "pixel")).toBe(100);
    expect(importSave(exportSave(state)).minigames.games.binary!.ranking).toEqual(ranking);
  });
});

describe("word games", () => {
  it("lettersOnly removes accents and symbols", () => {
    expect(lettersOnly("Função!")).toBe("FUNCAO");
  });

  it("word search hides words that can be found from either end", () => {
    const ws = buildWordSearch(WORD_POOL, 8, 10, 42);
    expect(ws.words.length).toBeGreaterThanOrEqual(6);
    for (const w of ws.words) {
      w.cells.forEach((cell, i) => expect(ws.grid[cell.r]![cell.c]).toBe(w.word[i]));
      const first = w.cells[0]!;
      const last = w.cells.at(-1)!;
      expect(wordBetween(ws, first, last)).toBe(w.word);
      expect(wordBetween(ws, last, first)).toBe(w.word);
    }
    expect(ws.grid.flat().every((ch) => /^[A-Z]$/.test(ch))).toBe(true);
  });

  it("crossword words cross each other and agree on shared letters", () => {
    for (const seed of [1, 2, 3, 4]) {
      const cw = buildCrossword(TERM_CLUES, 6, seed);
      expect(cw.words.length, `seed ${seed}`).toBeGreaterThanOrEqual(4);
      const grid = new Map<string, string>();
      for (const w of cw.words) {
        crossCells(w).forEach(({ r, c }, i) => {
          const k = `${r},${c}`;
          if (grid.has(k)) expect(grid.get(k)).toBe(w.answer[i]);
          grid.set(k, w.answer[i]!);
          expect(r).toBeLessThan(cw.height);
          expect(c).toBeLessThan(cw.width);
        });
      }
      const numbers = cw.words.map((w) => w.number);
      expect(Math.min(...numbers)).toBe(1);
    }
  });

  it("hangman: mask, wrong letters, win and loss", () => {
    expect(hangmanMask("BUG", new Set(["B", "G"]))).toBe("B _ G");
    expect(hangmanState("BUG", new Set(["B", "U", "G"])).solved).toBe(true);
    const lost = hangmanState("BUG", new Set(["Q", "W", "E", "R", "T", "Y"]));
    expect(lost).toEqual({ wrong: 6, solved: false, lost: true });
  });

  it("scramble never returns the word itself and keeps its letters", () => {
    for (const w of WORD_POOL.map(lettersOnly)) {
      const s = scramble(w, 7);
      expect([...s].sort().join("")).toBe([...w].sort().join(""));
      if (new Set(w).size > 1) expect(s).not.toBe(w);
    }
  });

  it("memory deck has every pair twice; fewer moves score more", () => {
    const deck = buildMemoryDeck(MEMORY_PAIRS, 6, 3);
    expect(deck).toHaveLength(12);
    for (let p = 0; p < 6; p++) expect(deck.filter((c) => c.pair === p)).toHaveLength(2);
    expect(memoryScore(6, 6)).toBe(100);
    expect(memoryScore(6, 14)).toBeLessThan(memoryScore(6, 8));
  });

  it("true or false statements and language snippets are complete", () => {
    expect(TRUE_FALSE.length).toBeGreaterThanOrEqual(20);
    expect(TRUE_FALSE.some((s) => s.answer) && TRUE_FALSE.some((s) => !s.answer)).toBe(true);
    for (const s of LANGUAGE_SNIPPETS) expect(LANGUAGE_NAMES[s.language], s.language).toBeTruthy();
    expect(new Set(LANGUAGE_SNIPPETS.map((s) => s.language)).size).toBeGreaterThanOrEqual(5);
    expect(OUTPUT_SNIPPETS.length).toBeGreaterThanOrEqual(5);
    expect(TYPING_LINES.length).toBeGreaterThanOrEqual(5);
  });

  it("the output snippets print what they say (checked by running the JavaScript)", () => {
    for (const s of OUTPUT_SNIPPETS) {
      const printed: string[] = [];
      const run = new Function("console", s.code.join("\n"));
      run({ log: (...v: unknown[]) => printed.push(v.join(" ")) });
      expect(printed.join("\n"), s.code.join(" ")).toBe(s.output);
    }
  });
});

describe("number games", () => {
  it("binary questions accept prefixes, zeros and any case", () => {
    const rng = createSeededRng(5);
    for (let i = 0; i < 50; i++) {
      const q = binaryQuestion(rng);
      expect(isBinaryAnswer(q, q.answer)).toBe(true);
      expect(isBinaryAnswer(q, `00${q.answer.toLowerCase()}`)).toBe(true);
    }
    expect(isBinaryAnswer({ kind: "decToBin", value: 5, prompt: "5", answer: "101" }, "0b101")).toBe(true);
    expect(isBinaryAnswer({ kind: "decToHex", value: 255, prompt: "255", answer: "FF" }, "0xff")).toBe(true);
    expect(isBinaryAnswer({ kind: "binToDec", value: 5, prompt: "101", answer: "5" }, "6")).toBe(false);
  });

  it("pixel pictures are 8x8 with valid colours, and the score counts right cells", () => {
    for (const p of PIXEL_PICTURES) {
      expect(p.rows).toHaveLength(8);
      for (const row of p.rows) {
        expect(row).toHaveLength(8);
        for (const ch of row) expect(Number(ch)).toBeLessThan(p.palette.length);
      }
      for (const hex of p.palette) expect(hex).toMatch(/^#[0-9A-F]{3}$/);
    }
    const pic = PIXEL_PICTURES[0]!;
    const perfect = pic.rows.map((row) => [...row].map(Number));
    expect(pixelScore(pic.rows, perfect)).toBe(100);
    expect(pixelScore(pic.rows, pic.rows.map(() => Array(8).fill(null)))).toBe(0);
  });

  it("typing: exact and fast scores high, mistakes lower it", () => {
    const line = TYPING_LINES[0]!;
    const fast = typingScore(line, line, 15);
    expect(fast.accuracy).toBe(1);
    expect(typingScore(line, line.replace("a", "x"), 15).points).toBeLessThan(fast.points);
    expect(typingScore(line, line, 60).points).toBeLessThan(fast.points);
  });
});

describe("machine games", () => {
  it("every robot level can be solved, and the shortest program works", () => {
    for (const level of ROBOT_LEVELS) {
      const best = shortestProgram(level);
      expect(best, level.map.join("/")).toBeLessThan(12);
    }
    const first = ROBOT_LEVELS[0]!;
    expect(runRobot(first, ["forward", "forward", "forward"]).success).toBe(true);
    expect(runRobot(first, ["repeat3", "forward"]).success).toBe(true);
    expect(shortestProgram(first)).toBe(2);
    expect(runRobot(first, ["left", "forward", "forward"]).crashed).toBe(true);
  });

  it("every gate level has a choice that lights the lamp", () => {
    const kinds: GateKind[][] = GATE_LEVELS.map((l) => l.gates.map((g) => gatesFor(g.inputs.length)[0]!));
    GATE_LEVELS.forEach((level, i) => {
      const options = level.gates.map((g) => gatesFor(g.inputs.length));
      let found = false;
      const tryAll = (choice: GateKind[], k: number) => {
        if (k === options.length) {
          if (lampOn(level, choice)) found = true;
          return;
        }
        for (const o of options[k]!) tryAll([...choice, o], k + 1);
      };
      tryAll([], 0);
      expect(found, `level ${i}`).toBe(true);
      expect(evalCircuit(level, kinds[i]!.map(() => null)).every((v) => v === null)).toBe(true);
    });
  });

  it("pipes: rotation, and every board has a route that can be connected", () => {
    expect(rotateMask(1, 1)).toBe(2);
    expect(rotateMask(8, 1)).toBe(1);
    expect(rotateMask(5, 2)).toBe(5);
    for (const seed of [1, 2, 3, 4, 5, 6]) {
      const board = buildPipes(seed);
      expect(flowFrom(board).connected, `seed ${seed} starts solved`).toBe(false);
      // brute force: try the 4 turns of every tile is too much; instead undo the turns of the route tiles
      const solved: PipeBoard = { ...board, turns: board.turns.map((row) => row.map(() => 0)) };
      expect(flowFrom(solved).connected, `seed ${seed}`).toBe(true);
      expect(tileMask(solved, solved.sourceRow, 0) & 8).toBe(8);
    }
  });
});
