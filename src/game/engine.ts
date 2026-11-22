/**
 * The idle core loop: spawn encounters on the selected route, fight automatically,
 * throw traps, collect rewards and unlock content. `tick` is called by the UI clock.
 */
import { activeEnemy, activePlayerBug, createBattle, stepBattle, type BattleEvent, type BattleOutcome } from "./battle";
import { createBug, healFully, isFainted, maxHp, type BugInstance } from "./bug";
import { registerCaught, registerDefeated, registerSeen } from "./bugdex";
import { captureChance, pickTrap, shouldAttemptCapture } from "./capture";
import { addBug } from "./collection";
import { ITEMS, itemsOfCategory, type ItemId, type PotionItem } from "./data/items";
import { getBoss, getRoute, type RouteDef } from "./data/world";
import { canEvolveByLevel, evolve } from "./evolution";
import { gainTrainerXp, gainXp, xpReward } from "./experience";
import { addItem, consumeItem, itemCount } from "./inventory";
import { awardBadge, canChallengeBoss, isRouteUnlocked, levelCap, refreshRouteUnlocks } from "./progression";
import { fail, OK, type ActionResult } from "./result";
import { chance, pickWeighted, randomInt, type Rng } from "./rng";
import { nextUid, STARTER_IDS, teamBugs, type GameState } from "./state";

export const SPAWN_DELAY_MS = 700;
export const RECOVERY_MS = 3000;
export const POTION_COOLDOWN_MS = 1200;
export const STARTER_LEVEL = 5;
/** Share of a defeat's XP that benched (non-fighting, healthy) team members receive. */
export const BENCH_XP_SHARE = 0.25;
/** Largest simulated chunk; longer ticks are split so nothing is skipped. */
const MAX_STEP_MS = 100;
const DROP_TABLE: readonly { itemId: ItemId; chance: number; minLevel: number }[] = [
  { itemId: "breakpoint", chance: 0.05, minLevel: 1 },
  { itemId: "coffee", chance: 0.03, minLevel: 1 },
  { itemId: "watchpoint", chance: 0.015, minLevel: 15 },
  { itemId: "energyDrink", chance: 0.01, minLevel: 20 },
  { itemId: "mutex", chance: 0.002, minLevel: 15 },
  { itemId: "legacyPatch", chance: 0.002, minLevel: 15 },
  { itemId: "cdnToken", chance: 0.002, minLevel: 15 },
];

export type GameEvent =
  | BattleEvent
  | { type: "encounter"; speciesId: string; level: number; shiny: boolean }
  | { type: "bossStart"; bossId: string }
  | { type: "captureAttempt"; itemId: ItemId; speciesId: string; success: boolean }
  | { type: "captured"; uid: string; speciesId: string; shiny: boolean; newEntry: boolean; destination: "team" | "box" }
  | { type: "outOfTraps" }
  | { type: "rewards"; speciesId: string; coins: number; xp: number }
  | { type: "levelUp"; uid: string; level: number }
  | { type: "evolved"; uid: string; from: string; to: string }
  | { type: "itemDrop"; itemId: ItemId }
  | { type: "potionUsed"; itemId: ItemId; uid: string }
  | { type: "routeUnlocked"; routeId: string }
  | { type: "badge"; badgeId: string; coins: number }
  | { type: "bossFailed"; bossId: string; outcome: BattleOutcome }
  | { type: "teamWiped" }
  | { type: "recovered" }
  | { type: "trainerLevelUp"; level: number };

// ---------------------------------------------------------------- commands

export function chooseStarter(state: GameState, speciesId: string, rng: Rng): ActionResult {
  if (state.team.length > 0) return fail("busy");
  if (!(STARTER_IDS as readonly string[]).includes(speciesId)) return fail("unknownBug");
  const bug = createBug({ uid: nextUid(state), speciesId, level: STARTER_LEVEL, rng, origin: "starter", shiny: false });
  addBug(state, bug);
  registerCaught(state, speciesId, false);
  return OK;
}

/** RF03: switch freely between unlocked routes. */
export function selectRoute(state: GameState, routeId: string): ActionResult {
  if (!isRouteUnlocked(state, routeId)) return fail("routeLocked");
  if (state.activity.kind === "boss") return fail("busy");
  state.activity = { kind: "route", routeId };
  endBattle(state);
  return OK;
}

/** RF04: challenge a boss with a fixed team and a time limit. */
export function challengeBoss(state: GameState, bossId: string): ActionResult {
  if (!canChallengeBoss(state, bossId)) return fail("bossLocked");
  if (state.activity.kind === "boss") return fail("busy");
  const returnRouteId = state.activity.routeId;
  state.activity = { kind: "boss", bossId, returnRouteId };
  endBattle(state);
  return OK;
}

export function forfeitBoss(state: GameState): ActionResult {
  if (state.activity.kind !== "boss") return fail("busy");
  state.activity = { kind: "route", routeId: state.activity.returnRouteId };
  endBattle(state);
  return OK;
}

/** Full heal for the team. The current encounter is abandoned and there is a short reboot. */
export function visitRebootCenter(state: GameState): ActionResult {
  if (state.activity.kind === "boss") return fail("busy");
  endBattle(state);
  state.runtime.recoveryMs = RECOVERY_MS;
  return OK;
}

/** RF07: manual evolution for bugs that reached their level (when auto-evolve is off). */
export function evolveBug(state: GameState, uid: string): ActionResult {
  const bug = state.bugs[uid];
  if (!bug) return fail("unknownBug");
  if (!canEvolveByLevel(bug)) return fail("cannotEvolve");
  evolve(state, bug);
  return OK;
}

function endBattle(state: GameState): void {
  state.runtime.battle = null;
  state.runtime.spawnTimerMs = SPAWN_DELAY_MS;
  state.runtime.captureAttemptsThisBattle = 0;
}

// ---------------------------------------------------------------- loop

export function tick(state: GameState, dtMs: number, rng: Rng): GameEvent[] {
  const events: GameEvent[] = [];
  let remaining = Math.max(0, dtMs);
  while (remaining > 0) {
    const step = Math.min(MAX_STEP_MS, remaining);
    remaining -= step;
    stepOnce(state, step, rng, events);
  }
  return events;
}

function stepOnce(state: GameState, dtMs: number, rng: Rng, events: GameEvent[]): void {
  state.totals.playTimeMs += dtMs;
  const team = teamBugs(state);
  if (team.length === 0) return;
  const rt = state.runtime;

  if (rt.recoveryMs > 0) {
    rt.recoveryMs -= dtMs;
    if (rt.recoveryMs <= 0) {
      rt.recoveryMs = 0;
      team.forEach(healFully);
      events.push({ type: "recovered" });
    }
    return;
  }

  if (!rt.battle) {
    rt.spawnTimerMs -= dtMs;
    if (rt.spawnTimerMs <= 0) startBattle(state, rng, events);
    return;
  }

  rt.potionCooldownMs = Math.max(0, rt.potionCooldownMs - dtMs);
  maybeUsePotion(state, team, events);

  const battle = rt.battle;
  const battleEvents = stepBattle(battle, team, dtMs, { levelCap: levelCap(state), rng });
  for (const event of battleEvents) {
    events.push(event);
    if (event.type === "faint" && event.side === "enemy") onEnemyDefeated(state, event.speciesId, event.level, event.victorUid, rng, events);
    if (event.type === "attack" && event.side === "player") tryCapture(state, rng, events);
  }
  if (battle.outcome) finishBattle(state, battle.outcome, events);
}

function startBattle(state: GameState, rng: Rng, events: GameEvent[]): void {
  const rt = state.runtime;
  rt.captureAttemptsThisBattle = 0;
  if (state.activity.kind === "boss") {
    const boss = getBoss(state.activity.bossId);
    const enemies = boss.team.map((m, i) =>
      createBug({ uid: `boss-${i}-${m.speciesId}`, speciesId: m.speciesId, level: m.level, rng, origin: boss.id, shiny: false, ivs: { hp: 20, atk: 20, def: 20, spd: 20 } }),
    );
    enemies.forEach((e) => registerSeen(state, e.speciesId));
    rt.battle = createBattle("boss", enemies, { bossId: boss.id, timeLimitMs: boss.timeLimitMs });
    events.push({ type: "bossStart", bossId: boss.id });
    return;
  }
  const route = getRoute(state.activity.routeId);
  const wild = spawnWild(route, rng);
  registerSeen(state, wild.speciesId);
  rt.battle = createBattle("wild", [wild]);
  events.push({ type: "encounter", speciesId: wild.speciesId, level: wild.level, shiny: wild.shiny });
  // Throw before the first hit too, so strong teams can still catch.
  tryCapture(state, rng, events);
}

export function spawnWild(route: RouteDef, rng: Rng): BugInstance {
  const encounter = pickWeighted(rng, route.encounters);
  const level = randomInt(rng, route.minLevel, route.maxLevel);
  return createBug({ uid: `wild-${Math.floor(rng() * 1e9)}`, speciesId: encounter.speciesId, level, rng, origin: route.id });
}

/** RF05: automatic, filter-driven trap throws. */
function tryCapture(state: GameState, rng: Rng, events: GameEvent[]): void {
  const battle = state.runtime.battle;
  if (!battle || battle.kind !== "wild" || battle.outcome) return;
  const wild = activeEnemy(battle);
  if (!wild || isFainted(wild) || !shouldAttemptCapture(state.settings, wild, state)) return;
  const trap = pickTrap(state.inventory, state.settings.preferredTrap);
  if (!trap) {
    if (state.runtime.captureAttemptsThisBattle === 0) events.push({ type: "outOfTraps" });
    state.runtime.captureAttemptsThisBattle += 1;
    return;
  }
  consumeItem(state, trap.id);
  state.runtime.captureAttemptsThisBattle += 1;
  const success = chance(rng, captureChance(wild, trap.captureMultiplier));
  events.push({ type: "captureAttempt", itemId: trap.id, speciesId: wild.speciesId, success });
  if (!success) return;

  const caught: BugInstance = { ...wild, uid: nextUid(state), ivs: { ...wild.ivs }, boosts: { ...wild.boosts }, origin: battle.enemies[0]?.origin ?? wild.origin };
  caught.currentHp = Math.max(1, caught.currentHp);
  const newEntry = registerCaught(state, caught.speciesId, caught.shiny);
  const destination = addBug(state, caught);
  state.totals.captures += 1;
  events.push({ type: "captured", uid: caught.uid, speciesId: caught.speciesId, shiny: caught.shiny, newEntry, destination });
  // Catching also counts as clearing the encounter for route progress.
  addRouteProgress(state, events);
  battle.outcome = "caught";
}

function addRouteProgress(state: GameState, events: GameEvent[]): void {
  if (state.activity.kind !== "route") return;
  const id = state.activity.routeId;
  state.routeDefeats[id] = (state.routeDefeats[id] ?? 0) + 1;
  for (const routeId of refreshRouteUnlocks(state)) events.push({ type: "routeUnlocked", routeId });
}

function onEnemyDefeated(state: GameState, speciesId: string, level: number, victorUid: string | null, rng: Rng, events: GameEvent[]): void {
  const battle = state.runtime.battle;
  const isBoss = battle?.kind === "boss";
  registerDefeated(state, speciesId);
  state.totals.defeats += 1;

  const xp = xpReward(speciesId, level, isBoss);
  const coins = isBoss ? 0 : Math.max(1, Math.floor((4 + level * 1.5) * (0.8 + rng() * 0.4)));
  state.coins += coins;
  events.push({ type: "rewards", speciesId, coins, xp });

  const cap = levelCap(state);
  for (const bug of teamBugs(state)) {
    const share = bug.uid === victorUid ? xp : isFainted(bug) ? 0 : Math.floor(xp * BENCH_XP_SHARE);
    const { levelsGained } = gainXp(bug, share, cap);
    if (levelsGained > 0) {
      events.push({ type: "levelUp", uid: bug.uid, level: bug.level });
      if (state.settings.autoEvolve && canEvolveByLevel(bug)) {
        const from = evolve(state, bug);
        events.push({ type: "evolved", uid: bug.uid, from, to: bug.speciesId });
      }
    }
  }

  const trainerLevels = gainTrainerXp(state.trainer, Math.max(1, Math.floor(level / 2)) + (isBoss ? 20 : 0));
  if (trainerLevels > 0) events.push({ type: "trainerLevelUp", level: state.trainer.level });

  if (!isBoss) {
    for (const drop of DROP_TABLE) {
      if (level >= drop.minLevel && chance(rng, drop.chance)) {
        addItem(state, drop.itemId);
        events.push({ type: "itemDrop", itemId: drop.itemId });
      }
    }
    addRouteProgress(state, events);
  }
}

function finishBattle(state: GameState, outcome: BattleOutcome, events: GameEvent[]): void {
  const battle = state.runtime.battle;
  if (!battle) return;
  if (battle.kind === "boss" && state.activity.kind === "boss") {
    const boss = getBoss(state.activity.bossId);
    const returnRouteId = state.activity.returnRouteId;
    if (outcome === "won") {
      const firstClear = !state.badges.includes(boss.badgeId);
      const coins = firstClear ? boss.rewardCoins : Math.floor(boss.rewardCoins / 5);
      state.coins += coins;
      const unlocked = awardBadge(state, boss.badgeId);
      events.push({ type: "badge", badgeId: boss.badgeId, coins });
      for (const routeId of unlocked) events.push({ type: "routeUnlocked", routeId });
    } else {
      events.push({ type: "bossFailed", bossId: boss.id, outcome });
    }
    state.activity = { kind: "route", routeId: returnRouteId };
  }
  endBattle(state);
  if (outcome === "lost") {
    events.push({ type: "teamWiped" });
    state.runtime.recoveryMs = RECOVERY_MS;
  }
}

/** Automation: drink the smallest potion that is useful when the active bug is low. */
function maybeUsePotion(state: GameState, team: BugInstance[], events: GameEvent[]): void {
  const { settings, runtime } = state;
  if (!settings.autoPotion || runtime.potionCooldownMs > 0) return;
  const active = activePlayerBug(team);
  if (!active) return;
  const max = maxHp(active);
  if (active.currentHp / max >= settings.potionThreshold) return;
  const missing = max - active.currentHp;
  const potions = itemsOfCategory("potion").filter((p) => itemCount(state, p.id) > 0);
  if (potions.length === 0) return;
  const enough = potions.filter((p) => p.heal >= missing).sort((a, b) => a.heal - b.heal);
  const potion: PotionItem = enough[0] ?? potions.sort((a, b) => b.heal - a.heal)[0]!;
  consumeItem(state, potion.id);
  active.currentHp = Math.min(max, active.currentHp + (ITEMS[potion.id] as PotionItem).heal);
  runtime.potionCooldownMs = POTION_COOLDOWN_MS;
  events.push({ type: "potionUsed", itemId: potion.id, uid: active.uid });
}
