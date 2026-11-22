export const BUG_TYPES = [
  "syntax",
  "logic",
  "memory",
  "concurrency",
  "network",
  "security",
  "performance",
  "ui",
] as const;

export type BugType = (typeof BUG_TYPES)[number];

export const SUPER_EFFECTIVE = 2;
export const NOT_EFFECTIVE = 0.5;
export const NO_EFFECT = 0;

/**
 * Attacker type -> defender type -> multiplier. Missing entries are neutral (1x).
 * Every type has two strengths; two matchups are immunities.
 */
const TYPE_CHART: Readonly<Record<BugType, Partial<Record<BugType, number>>>> = {
  syntax: { logic: 2, ui: 2, memory: 0.5, syntax: 0.5 },
  logic: { concurrency: 2, performance: 2, syntax: 0.5, logic: 0.5 },
  memory: { syntax: 2, performance: 2, concurrency: 0.5, memory: 0.5 },
  concurrency: { memory: 2, network: 2, logic: 0.5 },
  network: { security: 2, ui: 2, concurrency: 0.5, memory: 0 },
  security: { network: 2, logic: 2, syntax: 0.5, security: 0.5 },
  performance: { ui: 2, concurrency: 2, memory: 0.5, logic: 0.5 },
  ui: { security: 2, memory: 2, syntax: 0.5, performance: 0.5, concurrency: 0 },
};

export function typeMultiplier(attack: BugType, defenders: readonly BugType[]): number {
  return defenders.reduce((acc, defender) => acc * (TYPE_CHART[attack][defender] ?? 1), 1);
}

export function isBugType(value: unknown): value is BugType {
  return typeof value === "string" && (BUG_TYPES as readonly string[]).includes(value);
}
