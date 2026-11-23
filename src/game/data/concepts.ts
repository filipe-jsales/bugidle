/**
 * Computing concepts for the "Detetive de Conceitos" mini game. Language-neutral
 * data only: categories, year, traits, where it is used and seals. Names,
 * accepted answers, the riddle and the explanation are in i18n/concepts.ptBR.ts.
 */
export type ConceptCategory = "os" | "language" | "tool" | "data" | "web" | "security" | "hardware" | "fundamental" | "infra";
export type ConceptUse = "servers" | "phones" | "web" | "games" | "science" | "companies" | "everywhere" | "devices" | "teams" | "cloud";

export interface ConceptTraits {
  /** 0-100 bars shown as the second clue. */
  popularity: number;
  difficulty: number;
  /** How far from the hardware it is (0 = the chip itself, 100 = pure idea). */
  abstraction: number;
  everyday: number;
}

export interface ConceptSeals {
  openSource: boolean;
  language: boolean;
  hardware: boolean;
}

export interface Concept {
  readonly id: string;
  readonly categories: readonly ConceptCategory[];
  /** Year it appeared (or a reference year for old ideas). */
  readonly year: number;
  readonly traits: ConceptTraits;
  readonly uses: readonly ConceptUse[];
  readonly seals: ConceptSeals;
}

const C = (id: string, categories: ConceptCategory[], year: number, [popularity, difficulty, abstraction, everyday]: number[], uses: ConceptUse[], seals: Partial<ConceptSeals> = {}): Concept => ({
  id,
  categories,
  year,
  traits: { popularity: popularity!, difficulty: difficulty!, abstraction: abstraction!, everyday: everyday! },
  uses,
  seals: { openSource: false, language: false, hardware: false, ...seals },
});

// prettier-ignore
export const CONCEPTS: readonly Concept[] = [
  C("linux", ["os"], 1991, [90, 60, 40, 80], ["servers", "phones", "cloud", "devices"], { openSource: true }),
  C("git", ["tool"], 2005, [95, 55, 60, 70], ["teams", "companies"], { openSource: true }),
  C("python", ["language"], 1991, [95, 30, 80, 70], ["science", "web", "companies"], { openSource: true, language: true }),
  C("javascript", ["language", "web"], 1995, [98, 40, 80, 95], ["web", "phones", "servers"], { language: true }),
  C("html", ["web", "language"], 1991, [95, 15, 85, 95], ["web"], { language: true }),
  C("css", ["web", "language"], 1996, [90, 35, 85, 95], ["web"], { language: true }),
  C("sql", ["data", "language"], 1974, [90, 40, 85, 85], ["companies", "web", "science"], { language: true }),
  C("api", ["web", "fundamental"], 1968, [90, 45, 85, 95], ["web", "phones", "companies"]),
  C("docker", ["infra", "tool"], 2013, [80, 60, 70, 40], ["servers", "cloud", "companies"], { openSource: true }),
  C("cloud", ["infra"], 2006, [90, 50, 75, 90], ["cloud", "companies", "phones"]),
  C("firewall", ["security"], 1988, [70, 55, 50, 80], ["servers", "companies", "devices"]),
  C("algorithm", ["fundamental"], 825, [85, 50, 95, 100], ["everywhere"]),
  C("recursion", ["fundamental"], 1958, [60, 75, 95, 40], ["science", "games"]),
  C("variable", ["fundamental"], 1945, [90, 10, 90, 100], ["everywhere"]),
  C("loop", ["fundamental"], 1945, [90, 20, 90, 100], ["everywhere"]),
  C("array", ["fundamental", "data"], 1945, [85, 25, 85, 100], ["everywhere"]),
  C("compiler", ["tool", "fundamental"], 1952, [70, 85, 60, 90], ["companies", "devices"]),
  C("cpu", ["hardware"], 1971, [85, 70, 5, 100], ["everywhere", "devices"], { hardware: true }),
  C("ram", ["hardware"], 1947, [80, 50, 10, 100], ["everywhere", "devices"], { hardware: true }),
  C("encryption", ["security", "fundamental"], 1977, [80, 80, 80, 95], ["web", "phones", "companies"]),
  C("binary", ["fundamental", "data"], 1679, [75, 30, 20, 100], ["everywhere"]),
  C("http", ["web"], 1991, [95, 35, 70, 100], ["web", "phones"]),
  C("terminal", ["tool"], 1965, [70, 55, 50, 30], ["servers", "companies"]),
  C("bug", ["fundamental"], 1947, [99, 40, 70, 100], ["everywhere"]),
];

export function getConcept(id: string): Concept | undefined {
  return CONCEPTS.find((c) => c.id === id);
}
