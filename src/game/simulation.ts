/**
 * Headless playthrough used to balance the game. A simple "reasonable player"
 * policy picks routes, manages the team, shops, builds houses and challenges
 * bosses, while the real engine runs. Used by `npm run simulate` and by tests.
 */
import { powerRating } from "./bug";
import { ITEMS, type ItemId } from "./data/items";
import { getSpecies } from "./data/species";
import { BOSSES, getRoute, REGIONS, ROUTES, routesOfRegion } from "./data/world";
import { challengeBoss, chooseStarter, selectRoute, tick, type GameEvent } from "./engine";
import { assignToHouse, buildHouse, collectAll, getHouse, HOUSE_LOTS, houseOf, isLotUnlocked, nextCost, removeFromHouse, tierOf, upgradeHouse } from "./housing";
import { equipItem } from "./held";
import { incubateEgg, HATCHERY_SLOTS } from "./hatchery";
import { buyItem, itemCount, useItemOnBug } from "./inventory";
import { MAX_REFINE, refineCost, refineStat, REFINABLE_STATS, usableStones } from "./stones";
import { canChallengeBoss, levelCap } from "./progression";
import { createSeededRng } from "./rng";
import { createInitialState, MAX_TEAM_SIZE, teamBugs, type GameState } from "./state";

const MINUTE = 60_000;

export interface RegionReport {
  regionId: string;
  /** Minutes from the start until the boss was beaten (null if never). */
  clearedAtMin: number | null;
  bossAttempts: number;
  bossTimeouts: number;
  wipes: number;
  teamLevelsAtClear: number[];
  coinsAtClear: number;
}

export interface SimulationReport {
  minutes: number;
  finished: boolean;
  regions: RegionReport[];
  caught: number;
  totalCoinsEarned: number;
  finalTeam: { species: string; level: number }[];
  /** Refine steps bought, eggs hatched. */
  refines: number;
  eggsHatched: number;
  /** Coins spent building/upgrading houses and coins collected from them. */
  houseSpent: number;
  houseIncome: number;
}

/** Counters the policy fills while it plays. */
interface Ledger {
  refines: number;
  houseSpent: number;
  houseIncome: number;
}

/** Stones kept aside so a level evolution is never blocked by refining. */
const STONE_RESERVE = 8;
/** A player builds when the price is a fraction of the wallet, not only when rich. */
const HOUSE_BUY_FACTOR = 2;
const EGG_BUY_FACTOR = 5;
const HELD_BUY_FACTOR = 4;

export interface SimulationOptions {
  seed?: number;
  maxMinutes?: number;
  useHouses?: boolean;
  starter?: string;
}

function regionOfActivity(state: GameState): string {
  const routeId = state.activity.kind === "route" ? state.activity.routeId : state.activity.returnRouteId;
  return getRoute(routeId).regionId;
}

/** Keep the six strongest bugs; a strong bug living in a house moves out to join the team. */
function arrangeTeam(state: GameState): void {
  if (state.activity.kind === "boss") return;
  const best = Object.values(state.bugs)
    .sort((a, b) => powerRating(b) - powerRating(a))
    .slice(0, MAX_TEAM_SIZE);
  for (const bug of best) if (houseOf(state, bug.uid)) removeFromHouse(state, bug.uid);
  state.team = best.map((b) => b.uid);
}

function shop(state: GameState, regionOrder: number): void {
  const trap: ItemId = regionOrder >= 3 ? "profiler" : regionOrder >= 2 ? "watchpoint" : "breakpoint";
  state.settings.preferredTrap = trap;
  const topUp = (id: ItemId, target: number, budgetShare: number) => {
    const missing = target - itemCount(state, id);
    if (missing <= 0) return;
    const affordable = Math.floor((state.coins * budgetShare) / ITEMS[id].price);
    const qty = Math.min(missing, affordable);
    if (qty > 0) buyItem(state, id, qty);
  };
  topUp(trap, 15, 0.3);
  topUp(regionOrder >= 3 ? "rebootDisk" : regionOrder >= 2 ? "energyDrink" : "coffee", 10, 0.2);
  for (const bug of Object.values(state.bugs)) {
    const item = getSpecies(bug.speciesId).evolution?.item;
    if (item && state.coins >= ITEMS[item].price * 3) {
      buyItem(state, item, 1);
      useItemOnBug(state, item, bug.uid);
    }
  }
}

function manageHouses(state: GameState, ledger: Ledger): void {
  ledger.houseIncome += collectAll(state);
  for (const lot of HOUSE_LOTS) {
    if (!isLotUnlocked(state, lot.lot)) continue;
    const cost = nextCost(state, lot.lot);
    if (cost !== null && state.coins > cost * HOUSE_BUY_FACTOR) {
      const result = getHouse(state, lot.lot) ? upgradeHouse(state, lot.lot) : buildHouse(state, lot.lot);
      if (result.ok) ledger.houseSpent += cost;
    }
  }
  const spare = Object.values(state.bugs)
    .filter((b) => !state.team.includes(b.uid) && !houseOf(state, b.uid))
    .sort((a, b) => b.level - a.level);
  for (const house of state.houses) {
    while (house.bugs.length < tierOf(house).slots && spare.length > 0) assignToHouse(state, house.lot, spare.shift()!.uid);
  }
}

/** Spends spare stones on the three strongest team bugs, cheapest steps first (ATK, then HP, then DEF). */
function refineTeam(state: GameState, ledger: Ledger): void {
  for (const bug of teamBugs(state).slice(0, 3)) {
    for (const stat of ["atk", "hp", "def"] as const) {
      if (!REFINABLE_STATS.includes(stat)) continue;
      while (bug.refine[stat] < MAX_REFINE && usableStones(state, bug) - refineCost(bug.refine[stat]) >= STONE_RESERVE) {
        if (!refineStat(state, bug.uid, stat).ok) break;
        ledger.refines += 1;
      }
    }
  }
}

/** Gives the lead a Linter and the next bugs an Antivirus, Test Suite or Rubber Duck when affordable. */
function equipTeam(state: GameState): void {
  const plan: ItemId[] = ["linter", "testSuite", "antivirus", "rubberDuck", "rubberDuck", "rubberDuck"];
  teamBugs(state).forEach((bug, i) => {
    const item = plan[i];
    if (!item || bug.held) return;
    if (itemCount(state, item) === 0 && state.coins > ITEMS[item].price * HELD_BUY_FACTOR) buyItem(state, item, 1);
    if (itemCount(state, item) > 0) equipItem(state, bug.uid, item);
  });
}

/** Buys an egg when it is cheap for the wallet and a hatchery slot is free. */
function manageEggs(state: GameState): void {
  const busy = state.hatchery.filter((slot) => slot !== null && slot !== undefined).length;
  if (busy >= HATCHERY_SLOTS) return;
  if (itemCount(state, "mysteryEgg") === 0 && state.coins > ITEMS.mysteryEgg.price * EGG_BUY_FACTOR) buyItem(state, "mysteryEgg", 1);
  if (itemCount(state, "mysteryEgg") > 0) incubateEgg(state);
}

function pickRoute(state: GameState, recentWipes: number): void {
  if (state.activity.kind === "boss") return;
  const unlocked = ROUTES.filter((r) => state.unlockedRoutes.includes(r.id));
  const strongest = Math.max(...teamBugs(state).map((b) => b.level));
  // Newest route the team can handle; step back after repeated wipes.
  let choice = unlocked[unlocked.length - 1]!;
  const index = unlocked.indexOf(choice);
  if ((recentWipes >= 2 || strongest < choice.minLevel - 4) && index > 0) choice = unlocked[index - 1]!;
  if (state.activity.routeId !== choice.id) selectRoute(state, choice.id);
}

export function simulatePlaythrough(options: SimulationOptions = {}): SimulationReport {
  const rng = createSeededRng(options.seed ?? 1);
  const maxMinutes = options.maxMinutes ?? 60 * 40;
  const state = createInitialState("Sim");
  state.settings.debugChallenges = false;
  chooseStarter(state, options.starter ?? "typobit", rng);

  const regions: RegionReport[] = REGIONS.map((r) => ({ regionId: r.id, clearedAtMin: null, bossAttempts: 0, bossTimeouts: 0, wipes: 0, teamLevelsAtClear: [], coinsAtClear: 0 }));
  const wipeTimes: number[] = [];
  const lastBossTry = new Map<string, number>();
  let earned = 0;
  let eggsHatched = 0;
  const ledger: Ledger = { refines: 0, houseSpent: 0, houseIncome: 0 };

  let minute = 0;
  for (; minute < maxMinutes; minute++) {
    const regionId = regionOfActivity(state);
    const region = REGIONS.find((r) => r.id === regionId)!;
    const report = regions.find((r) => r.regionId === regionId)!;

    if (state.activity.kind === "route") {
      arrangeTeam(state);
      shop(state, region.order);
      if (options.useHouses !== false) manageHouses(state, ledger);
      refineTeam(state, ledger);
      manageEggs(state);
      equipTeam(state);
      const recentWipes = wipeTimes.filter((t) => t > minute - 10).length;
      pickRoute(state, recentWipes);

      const boss = BOSSES.find((b) => b.regionId === regionId && !state.badges.includes(b.badgeId));
      if (boss && canChallengeBoss(state, boss.id)) {
        const lead = teamBugs(state)[0]!;
        const bossTop = Math.max(...boss.team.map((m) => m.level));
        const cappedOut = lead.level >= levelCap(state);
        const waited = minute - (lastBossTry.get(boss.id) ?? -999) >= 15;
        if ((lead.level >= bossTop - 2 || cappedOut) && waited) {
          lastBossTry.set(boss.id, minute);
          report.bossAttempts += 1;
          challengeBoss(state, boss.id);
        }
      }
    }

    const coinsBefore = state.coins;
    const events: GameEvent[] = tick(state, MINUTE, rng);
    earned += Math.max(0, state.coins - coinsBefore);
    for (const event of events) {
      if (event.type === "bossFailed" && event.outcome === "timeout") report.bossTimeouts += 1;
      if (event.type === "hatched") eggsHatched += 1;
      if (event.type === "teamWiped") {
        wipeTimes.push(minute);
        report.wipes += 1;
      }
      if (event.type === "badge") {
        const cleared = regions.find((r) => BOSSES.find((b) => b.badgeId === event.badgeId)?.regionId === r.regionId)!;
        if (cleared.clearedAtMin === null) {
          cleared.clearedAtMin = minute + 1;
          cleared.teamLevelsAtClear = teamBugs(state).map((b) => b.level);
          cleared.coinsAtClear = state.coins;
        }
      }
    }
    if (state.badges.includes("badge-cloud")) {
      minute += 1;
      break;
    }
  }

  return {
    minutes: minute,
    finished: state.badges.includes("badge-cloud"),
    regions,
    caught: Object.values(state.bugdex).filter((e) => e.caught > 0).length,
    totalCoinsEarned: earned,
    finalTeam: teamBugs(state).map((b) => ({ species: b.speciesId, level: b.level })),
    refines: ledger.refines,
    eggsHatched,
    houseSpent: ledger.houseSpent,
    houseIncome: ledger.houseIncome,
  };
}

export function formatReport(report: SimulationReport): string {
  const lines = [`finished: ${report.finished} in ${(report.minutes / 60).toFixed(1)} h, caught ${report.caught} species, earned ${report.totalCoinsEarned} coins`];
  let previous = 0;
  for (const r of report.regions) {
    const took = r.clearedAtMin === null ? "-" : `${((r.clearedAtMin - previous) / 60).toFixed(2)} h`;
    lines.push(
      `${r.regionId.padEnd(11)} cleared at ${r.clearedAtMin === null ? "never" : `${(r.clearedAtMin / 60).toFixed(2)} h`} (took ${took}), boss tries ${r.bossAttempts} (${r.bossTimeouts} timeouts), wipes ${r.wipes}, team ${r.teamLevelsAtClear.join("/")}, coins ${r.coinsAtClear}`,
    );
    if (r.clearedAtMin !== null) previous = r.clearedAtMin;
  }
  lines.push(`final team: ${report.finalTeam.map((b) => `${b.species} ${b.level}`).join(", ")}`);
  lines.push(`refines ${report.refines}, eggs hatched ${report.eggsHatched}, houses: spent ${report.houseSpent}, collected ${report.houseIncome} (${report.houseSpent > 0 ? (report.houseIncome / report.houseSpent).toFixed(2) : "-"}x)`);
  lines.push(`routes per region: ${REGIONS.map((r) => routesOfRegion(r.id).length).join("/")}`);
  return lines.join("\n");
}
