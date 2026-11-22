import { computeStats, type BugInstance } from "./bug";
import { movesFor, type MoveDef } from "./data/moves";
import { getSpecies } from "./data/species";
import type { Rng } from "./rng";
import { typeMultiplier } from "./types";

export const STAB_BONUS = 1.5;
export const CRIT_CHANCE = 1 / 16;
export const CRIT_MULTIPLIER = 1.5;

export interface DamageResult {
  damage: number;
  effectiveness: number;
  critical: boolean;
}

function stab(attacker: BugInstance, move: MoveDef): number {
  return getSpecies(attacker.speciesId).types.includes(move.type) ? STAB_BONUS : 1;
}

export function calculateDamage(attacker: BugInstance, defender: BugInstance, move: MoveDef, rng: Rng): DamageResult {
  const a = computeStats(attacker);
  const d = computeStats(defender);
  const effectiveness = typeMultiplier(move.type, getSpecies(defender.speciesId).types);
  if (effectiveness === 0) return { damage: 0, effectiveness, critical: false };

  const levelFactor = Math.floor((2 * attacker.level) / 5) + 2;
  const base = Math.floor(Math.floor((levelFactor * move.power * a.atk) / Math.max(1, d.def)) / 50) + 2;
  const critical = rng() < CRIT_CHANCE;
  const variance = 0.85 + rng() * 0.15;
  const total = base * stab(attacker, move) * effectiveness * (critical ? CRIT_MULTIPLIER : 1) * variance;
  return { damage: Math.max(1, Math.floor(total)), effectiveness, critical };
}

/** Expected value used to pick the best move automatically (ignores randomness). */
export function moveScore(attacker: BugInstance, defender: BugInstance, move: MoveDef): number {
  return move.power * stab(attacker, move) * typeMultiplier(move.type, getSpecies(defender.speciesId).types);
}

/** Bugs fight on their own: pick the known move with the best expected damage. */
export function chooseMove(attacker: BugInstance, defender: BugInstance): MoveDef {
  const known = movesFor(getSpecies(attacker.speciesId).types, attacker.level);
  let best = known[0];
  if (!best) throw new Error(`Bug ${attacker.uid} knows no moves`);
  for (const move of known) {
    if (moveScore(attacker, defender, move) > moveScore(attacker, defender, best)) best = move;
  }
  return best;
}
