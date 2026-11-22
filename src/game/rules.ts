/**
 * Player-written automation rules: "IF <conditions> THEN <action>".
 * Conditions in a rule are joined with AND and each can be negated (NOT).
 * Rules are checked top to bottom and the first one that matches wins, like an
 * if / else-if chain. Two kinds of decisions use them: what to throw at a wild
 * bug, and when to heal the active bug.
 */
import { maxHp, type BugInstance } from "./bug";
import { isCaught } from "./bugdex";
import { isItemId, ITEMS, type ItemId } from "./data/items";
import { getSpecies, type Rarity } from "./data/species";
import type { PersistentState } from "./state";

export type ConditionKind = "always" | "hpBelow" | "wildNew" | "wildShiny" | "wildRare" | "wildLevelAtLeast";

export interface Condition {
  kind: ConditionKind;
  /** Percent for hpBelow, level for wildLevelAtLeast. */
  value?: number;
  not?: boolean;
}

export type Action = { kind: "throw"; trap: ItemId } | { kind: "noThrow" } | { kind: "potion" };

export interface Rule {
  id: number;
  enabled: boolean;
  when: Condition[];
  then: Action;
}

export type Decision = "capture" | "heal";

export interface RuleContext {
  state: PersistentState;
  /** Our active bug. */
  active?: BugInstance;
  /** The wild bug being fought. */
  wild?: BugInstance;
}

const RARE: readonly Rarity[] = ["rare", "legendary"];
export const MAX_RULES = 12;

export function decisionOf(action: Action): Decision {
  return action.kind === "potion" ? "heal" : "capture";
}

function test(condition: Condition, ctx: RuleContext): boolean {
  const { wild, active, state } = ctx;
  switch (condition.kind) {
    case "always":
      return true;
    case "hpBelow":
      return active !== undefined && (active.currentHp / maxHp(active)) * 100 < (condition.value ?? 0);
    case "wildNew":
      return wild !== undefined && !isCaught(state, wild.speciesId);
    case "wildShiny":
      return wild?.shiny ?? false;
    case "wildRare":
      return wild !== undefined && RARE.includes(getSpecies(wild.speciesId).rarity);
    case "wildLevelAtLeast":
      return wild !== undefined && wild.level >= (condition.value ?? 0);
  }
}

export function matches(rule: Rule, ctx: RuleContext): boolean {
  return rule.enabled && rule.when.every((c) => test(c, ctx) !== (c.not ?? false));
}

/**
 * First enabled rule of this decision whose conditions hold. A throw rule whose
 * trap is out of stock is skipped, so the next rule can act as a fallback.
 */
export function firstMatch(rules: readonly Rule[], decision: Decision, ctx: RuleContext): Rule | undefined {
  return rules.find((rule) => {
    if (decisionOf(rule.then) !== decision || !matches(rule, ctx)) return false;
    if (rule.then.kind === "throw") return (ctx.state.inventory[rule.then.trap] ?? 0) > 0;
    return true;
  });
}

/** Rules equivalent to the default switches, so turning rules on changes nothing at first. */
export function defaultRules(): Rule[] {
  return [
    { id: 1, enabled: true, when: [{ kind: "wildShiny" }], then: { kind: "throw", trap: "profiler" } },
    { id: 2, enabled: true, when: [{ kind: "wildShiny" }], then: { kind: "throw", trap: "breakpoint" } },
    { id: 3, enabled: true, when: [{ kind: "wildNew" }], then: { kind: "throw", trap: "breakpoint" } },
    { id: 4, enabled: true, when: [{ kind: "hpBelow", value: 40 }], then: { kind: "potion" } },
  ];
}

/** Validates rules coming from a save file; drops anything malformed. */
export function sanitizeRules(raw: unknown): Rule[] {
  if (!Array.isArray(raw)) return defaultRules();
  const kinds: readonly ConditionKind[] = ["always", "hpBelow", "wildNew", "wildShiny", "wildRare", "wildLevelAtLeast"];
  const rules: Rule[] = [];
  for (const r of raw.slice(0, MAX_RULES)) {
    if (typeof r !== "object" || r === null) continue;
    const rec = r as Record<string, unknown>;
    const then = rec.then as Record<string, unknown> | undefined;
    let action: Action | null = null;
    if (then?.kind === "throw" && isItemId(then.trap) && ITEMS[then.trap].category === "trap") action = { kind: "throw", trap: then.trap };
    else if (then?.kind === "noThrow") action = { kind: "noThrow" };
    else if (then?.kind === "potion") action = { kind: "potion" };
    if (!action || typeof rec.id !== "number" || !Array.isArray(rec.when)) continue;
    const when: Condition[] = [];
    for (const c of rec.when as unknown[]) {
      const cond = c as Record<string, unknown>;
      if (typeof cond !== "object" || cond === null || !kinds.includes(cond.kind as ConditionKind)) continue;
      when.push({
        kind: cond.kind as ConditionKind,
        ...(typeof cond.value === "number" ? { value: cond.value } : {}),
        ...(cond.not === true ? { not: true } : {}),
      });
    }
    rules.push({ id: rec.id, enabled: rec.enabled !== false, when, then: action });
  }
  return rules;
}

/** The rule written as code, for the "see as code" view. */
export function ruleAsCode(rule: Rule): string {
  const cond = (c: Condition) => {
    const text = {
      always: "true",
      hpBelow: `active.hpPercent < ${c.value ?? 0}`,
      wildNew: "!bugdex.has(wild)",
      wildShiny: "wild.shiny",
      wildRare: "wild.rarity >= RARE",
      wildLevelAtLeast: `wild.level >= ${c.value ?? 0}`,
    }[c.kind];
    return c.not ? `!(${text})` : text;
  };
  const test = rule.when.length === 0 ? "true" : rule.when.map(cond).join(" && ");
  const action = rule.then.kind === "throw" ? `throwTrap("${rule.then.trap}")` : rule.then.kind === "potion" ? "drinkPotion()" : "return; // não lança";
  return `if (${test}) ${action};`;
}
