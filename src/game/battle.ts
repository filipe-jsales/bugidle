import { computeStats, isFainted, type BugInstance } from "./bug";
import { calculateDamage, chooseMove } from "./damage";
import type { Rng } from "./rng";

/** Gauge needed to act. Each side fills its gauge at `spd / GAUGE_DIVISOR` per ms. */
export const ACTION_GAUGE = 100;
export const GAUGE_DIVISOR = 400;
/** Chance a bug above the level cap ignores its turn. */
export const DISOBEY_CHANCE = 0.25;

export type BattleKind = "wild" | "boss";
export type BattleOutcome = "won" | "lost" | "timeout" | "caught";
export type Side = "player" | "enemy";

export interface Battle {
  kind: BattleKind;
  bossId: string | null;
  enemies: BugInstance[];
  enemyIndex: number;
  playerGauge: number;
  enemyGauge: number;
  elapsedMs: number;
  timeLimitMs: number | null;
  outcome: BattleOutcome | null;
}

export type BattleEvent =
  | {
      type: "attack";
      side: Side;
      attackerUid: string;
      defenderUid: string;
      moveId: string;
      damage: number;
      effectiveness: number;
      critical: boolean;
    }
  | { type: "disobey"; uid: string }
  | { type: "faint"; side: Side; uid: string; speciesId: string; level: number; victorUid: string | null }
  | { type: "switch"; side: Side; uid: string }
  | { type: "outcome"; outcome: BattleOutcome };

export function createBattle(
  kind: BattleKind,
  enemies: BugInstance[],
  options: { bossId?: string; timeLimitMs?: number } = {},
): Battle {
  if (enemies.length === 0) throw new Error("createBattle: no enemies");
  return {
    kind,
    bossId: options.bossId ?? null,
    enemies,
    enemyIndex: 0,
    playerGauge: 0,
    enemyGauge: 0,
    elapsedMs: 0,
    timeLimitMs: options.timeLimitMs ?? null,
    outcome: null,
  };
}

export function activeEnemy(battle: Battle): BugInstance | undefined {
  return battle.enemies[battle.enemyIndex];
}

/** The first bug in team order that can still fight. */
export function activePlayerBug(team: readonly BugInstance[]): BugInstance | undefined {
  return team.find((b) => !isFainted(b));
}

interface StepOptions {
  levelCap: number;
  rng: Rng;
}

/**
 * Advances the battle by `dtMs`. Turn order comes from speed: each side fills an
 * action gauge and acts when it is full. Mutates bugs' HP and the battle.
 */
export function stepBattle(battle: Battle, team: readonly BugInstance[], dtMs: number, options: StepOptions): BattleEvent[] {
  const events: BattleEvent[] = [];
  if (battle.outcome) return events;

  battle.elapsedMs += dtMs;
  if (battle.timeLimitMs !== null && battle.elapsedMs >= battle.timeLimitMs) {
    return finish(battle, "timeout", events);
  }

  let player = activePlayerBug(team);
  let enemy = activeEnemy(battle);
  if (!player) return finish(battle, "lost", events);
  if (!enemy) return finish(battle, "won", events);

  battle.playerGauge += (computeStats(player).spd * dtMs) / GAUGE_DIVISOR;
  battle.enemyGauge += (computeStats(enemy).spd * dtMs) / GAUGE_DIVISOR;

  while (!battle.outcome && (battle.playerGauge >= ACTION_GAUGE || battle.enemyGauge >= ACTION_GAUGE)) {
    const playerActs = battle.playerGauge >= battle.enemyGauge;
    if (playerActs) {
      battle.playerGauge -= ACTION_GAUGE;
      if (player.level > options.levelCap && options.rng() < DISOBEY_CHANCE) {
        events.push({ type: "disobey", uid: player.uid });
        continue;
      }
      attack(player, enemy, "player", options.rng, events);
      if (isFainted(enemy)) {
        events.push({ type: "faint", side: "enemy", uid: enemy.uid, speciesId: enemy.speciesId, level: enemy.level, victorUid: player.uid });
        battle.enemyIndex += 1;
        battle.enemyGauge = 0;
        const next = activeEnemy(battle);
        if (!next) return finish(battle, "won", events);
        enemy = next;
        events.push({ type: "switch", side: "enemy", uid: enemy.uid });
      }
    } else {
      battle.enemyGauge -= ACTION_GAUGE;
      attack(enemy, player, "enemy", options.rng, events);
      if (isFainted(player)) {
        events.push({ type: "faint", side: "player", uid: player.uid, speciesId: player.speciesId, level: player.level, victorUid: enemy.uid });
        battle.playerGauge = 0;
        const next = activePlayerBug(team);
        if (!next) return finish(battle, "lost", events);
        player = next;
        events.push({ type: "switch", side: "player", uid: player.uid });
      }
    }
  }
  return events;
}

function attack(attacker: BugInstance, defender: BugInstance, side: Side, rng: Rng, events: BattleEvent[]): void {
  const move = chooseMove(attacker, defender);
  const result = calculateDamage(attacker, defender, move, rng);
  defender.currentHp = Math.max(0, defender.currentHp - result.damage);
  events.push({
    type: "attack",
    side,
    attackerUid: attacker.uid,
    defenderUid: defender.uid,
    moveId: move.id,
    damage: result.damage,
    effectiveness: result.effectiveness,
    critical: result.critical,
  });
}

function finish(battle: Battle, outcome: BattleOutcome, events: BattleEvent[]): BattleEvent[] {
  battle.outcome = outcome;
  events.push({ type: "outcome", outcome });
  return events;
}
