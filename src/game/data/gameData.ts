/**
 * Code used by the mini games: snippets to recognize, snippets whose output is
 * guessed, lines to type, pixel pictures, robot mazes and logic circuits.
 * Language-neutral (code and numbers only).
 */

export interface LanguageSnippet {
  language: "python" | "javascript" | "sql" | "c" | "css" | "html" | "bash";
  code: readonly string[];
}

// prettier-ignore
export const LANGUAGE_SNIPPETS: readonly LanguageSnippet[] = [
  { language: "python", code: ["def soma(a, b):", "    return a + b", "print(soma(2, 3))"] },
  { language: "python", code: ["for nome in nomes:", "    if nome.startswith(\"A\"):", "        print(nome)"] },
  { language: "python", code: ["idades = {\"ana\": 12, \"bia\": 13}", "print(len(idades))"] },
  { language: "javascript", code: ["const soma = (a, b) => a + b;", "console.log(soma(2, 3));"] },
  { language: "javascript", code: ["document.querySelector(\"#botao\")", "  .addEventListener(\"click\", () => alert(\"oi\"));"] },
  { language: "javascript", code: ["let lista = [1, 2, 3];", "lista.push(4);", "console.log(lista.length);"] },
  { language: "sql", code: ["SELECT nome, nota", "FROM alunos", "WHERE nota >= 7", "ORDER BY nota DESC;"] },
  { language: "sql", code: ["INSERT INTO jogadores (nome, nivel)", "VALUES ('Ana', 5);"] },
  { language: "sql", code: ["UPDATE produtos SET preco = 10", "WHERE id = 3;"] },
  { language: "c", code: ["#include <stdio.h>", "int main(void) {", "    printf(\"oi\\n\");", "    return 0;", "}"] },
  { language: "c", code: ["int *p = malloc(10 * sizeof(int));", "p[0] = 42;", "free(p);"] },
  { language: "css", code: [".botao {", "  color: white;", "  background: purple;", "}"] },
  { language: "css", code: ["@media (max-width: 600px) {", "  .menu { display: none; }", "}"] },
  { language: "html", code: ["<ul>", "  <li>Linux</li>", "  <li>Git</li>", "</ul>"] },
  { language: "html", code: ["<a href=\"https://site.com\">Clique aqui</a>"] },
  { language: "bash", code: ["cd projetos", "ls -la", "git status"] },
  { language: "bash", code: ["for f in *.txt; do", "  echo \"$f\"", "done"] },
  { language: "bash", code: ["cat log.txt | grep erro | wc -l"] },
];

export interface OutputSnippet {
  code: readonly string[];
  /** Exactly what is printed (one line). */
  output: string;
}

// prettier-ignore
export const OUTPUT_SNIPPETS: readonly OutputSnippet[] = [
  { code: ["let x = 3;", "x = x * 2;", "console.log(x);"], output: "6" },
  { code: ["let total = 0;", "for (let i = 1; i <= 4; i++) total += i;", "console.log(total);"], output: "10" },
  { code: ["const nome = \"bug\";", "console.log(nome.toUpperCase());"], output: "BUG" },
  { code: ["const lista = [5, 8, 2];", "console.log(lista[1]);"], output: "8" },
  { code: ["let a = 7;", "let b = a;", "a = 1;", "console.log(b);"], output: "7" },
  { code: ["console.log(\"2\" + 3);"], output: "23" },
  { code: ["console.log(10 % 3);"], output: "1" },
  { code: ["const s = \"abc\";", "console.log(s.length);"], output: "3" },
  { code: ["let n = 5;", "if (n > 3) n = n - 3;", "console.log(n);"], output: "2" },
  { code: ["const v = [1, 2, 3].map((x) => x * x);", "console.log(v.join(\",\"));"], output: "1,4,9" },
  { code: ["let i = 0;", "while (i < 3) i++;", "console.log(i);"], output: "3" },
  { code: ["console.log(Math.max(4, 9, 2));"], output: "9" },
];

// prettier-ignore
export const TYPING_LINES: readonly string[] = [
  "const total = itens.reduce((a, b) => a + b, 0);",
  "if (vida <= 0) { equipe.reboot(); }",
  "for (let i = 0; i < lista.length; i++) {}",
  "SELECT nome FROM bugs WHERE nivel > 10;",
  "git commit -m \"corrige o laco infinito\"",
  "def caca(bug): return bug.nivel * 2",
  "document.getElementById(\"mapa\").focus();",
  "ls box | grep shiny | wc -l",
];

export interface PixelPicture {
  id: string;
  /** Hex colours used, in the order the rows refer to them (0 = first). */
  palette: readonly string[];
  /** 8 rows of 8 digits (palette indexes). */
  rows: readonly string[];
}

// prettier-ignore
export const PIXEL_PICTURES: readonly PixelPicture[] = [
  { id: "heart", palette: ["#000", "#F00", "#FFF"], rows: ["00000000", "01100110", "11111111", "11211111", "11111111", "01111110", "00111100", "00011000"] },
  { id: "bug", palette: ["#000", "#0F0", "#FFF", "#F00"], rows: ["30000003", "03011030", "00111100", "01211210", "01111110", "11111111", "01111110", "10000001"] },
  { id: "chip", palette: ["#000", "#888", "#FF0", "#00F"], rows: ["02020200", "11111111", "21333312", "01300310", "21300312", "01333310", "11111111", "02020200"] },
  { id: "smile", palette: ["#000", "#FF0", "#000"], rows: ["00111100", "01111110", "11211211", "11111111", "12111121", "11222211", "01111110", "00111100"] },
  { id: "cloud", palette: ["#0AF", "#FFF", "#888"], rows: ["00000000", "00011000", "00111100", "01111110", "11111111", "11111111", "02222220", "00000000"] },
  { id: "house", palette: ["#0AF", "#F00", "#FF0", "#840"], rows: ["00011000", "00111100", "01111110", "11111111", "02222220", "02332220", "02332220", "00000000"] },
];

export type RobotCommand = "forward" | "left" | "right" | "repeat3";

export interface RobotLevel {
  /** '#' wall, 'R' robot (starts facing right), 'B' the bug to reach, '.' floor. */
  map: readonly string[];
}

// prettier-ignore
export const ROBOT_LEVELS: readonly RobotLevel[] = [
  { map: ["......", ".R..B.", "......"] },
  { map: ["......", ".R....", "....B.", "......"] },
  { map: ["R.....", ".####.", ".#....", ".#.B..", "......"] },
  { map: ["R..#..", ".#.#.#", ".#...B", "......"] },
  { map: ["......", "R....B", "......"] },
  { map: [".....B", ".####.", ".#..#.", "R#..#.", "......"] },
];

export type GateKind = "AND" | "OR" | "XOR" | "NOT";
/** An input letter or the index of an earlier gate. */
export type GateRef = "A" | "B" | "C" | number;

export interface GateSlot {
  inputs: readonly GateRef[];
}

export interface GateLevel {
  inputs: Partial<Record<"A" | "B" | "C", 0 | 1>>;
  /** Gates in order; the last one lights the lamp. */
  gates: readonly GateSlot[];
}

// prettier-ignore
export const GATE_LEVELS: readonly GateLevel[] = [
  { inputs: { A: 1, B: 0 }, gates: [{ inputs: ["A", "B"] }] },
  { inputs: { A: 1, B: 1 }, gates: [{ inputs: ["A", "B"] }] },
  { inputs: { A: 0 }, gates: [{ inputs: ["A"] }] },
  { inputs: { A: 1, B: 1 }, gates: [{ inputs: ["A", "B"] }, { inputs: [0] }] },
  { inputs: { A: 0, B: 1, C: 1 }, gates: [{ inputs: ["A", "B"] }, { inputs: [0, "C"] }] },
  { inputs: { A: 1, B: 0, C: 0 }, gates: [{ inputs: ["B", "C"] }, { inputs: ["A", 0] }] },
  { inputs: { A: 1, B: 1, C: 0 }, gates: [{ inputs: ["A", "B"] }, { inputs: ["C"] }, { inputs: [0, 1] }] },
];
