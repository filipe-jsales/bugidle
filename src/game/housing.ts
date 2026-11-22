/**
 * "From Transistor to Cloud": houses where boxed bugs farm coins and XP on their own.
 * Each house climbs through eras of computing history; every era costs more and
 * gives more slots, a higher production multiplier and a bigger storage.
 */
import { ivGrade, type BugInstance } from "./bug";
import { gainXp } from "./experience";
import { levelCap } from "./progression";
import { fail, OK, type ActionResult } from "./result";
import type { GameState, PersistentState } from "./state";

export interface HouseTier {
  readonly id: string;
  readonly slots: number;
  /** Production multiplier. */
  readonly multiplier: number;
  /** Hours of production the house can hold before it must be collected. */
  readonly storageHours: number;
  /** Coins to reach this tier (building costs tier 1). Multiplied by the lot's factor. */
  readonly cost: number;
}

/**
 * Moore's law: chips roughly doubled in capacity every couple of years, so every
 * era here doubles production (1x, 2x, 4x ... 64x).
 */
export const HOUSE_TIERS: readonly HouseTier[] = [
  { id: "vacuumTube", slots: 1, multiplier: 1, storageHours: 1, cost: 400 },
  { id: "transistor", slots: 2, multiplier: 2, storageHours: 2, cost: 2_500 },
  { id: "integratedCircuit", slots: 3, multiplier: 4, storageHours: 3, cost: 12_000 },
  { id: "microprocessor", slots: 3, multiplier: 8, storageHours: 4, cost: 45_000 },
  { id: "internet", slots: 4, multiplier: 16, storageHours: 6, cost: 160_000 },
  { id: "cloud", slots: 5, multiplier: 32, storageHours: 8, cost: 550_000 },
  { id: "ai", slots: 6, multiplier: 64, storageHours: 12, cost: 2_000_000 },
];

export interface HouseLot {
  readonly lot: number;
  readonly requiredBadge: string | null;
  readonly costFactor: number;
}

export const HOUSE_LOTS: readonly HouseLot[] = [
  { lot: 0, requiredBadge: null, costFactor: 1 },
  { lot: 1, requiredBadge: "badge-staging", costFactor: 3 },
  { lot: 2, requiredBadge: "badge-legacy", costFactor: 9 },
];

export interface House {
  lot: number;
  /** Index into HOUSE_TIERS. */
  tier: number;
  bugs: string[];
  /** Coins produced and not collected yet (fractional). */
  pending: number;
  /** Fractional XP not yet handed out to each resident. */
  xpCarry: number;
}

const XP_PER_COIN = 0.6;

export function tierOf(house: House): HouseTier {
  return HOUSE_TIERS[Math.min(house.tier, HOUSE_TIERS.length - 1)]!;
}

function lotDef(lot: number): HouseLot | undefined {
  return HOUSE_LOTS.find((l) => l.lot === lot);
}

export function getHouse(state: PersistentState, lot: number): House | undefined {
  return state.houses.find((h) => h.lot === lot);
}

export function houseOf(state: PersistentState, uid: string): House | undefined {
  return state.houses.find((h) => h.bugs.includes(uid));
}

export function isLotUnlocked(state: PersistentState, lot: number): boolean {
  const def = lotDef(lot);
  return def !== undefined && (def.requiredBadge === null || state.badges.includes(def.requiredBadge));
}

/** Cost of building the lot (tier 0) or of the next era, null when maxed. */
export function nextCost(state: PersistentState, lot: number): number | null {
  const def = lotDef(lot);
  if (!def) return null;
  const house = getHouse(state, lot);
  const nextTier = house ? house.tier + 1 : 0;
  const tier = HOUSE_TIERS[nextTier];
  return tier ? tier.cost * def.costFactor : null;
}

/** Highest era reached in any house, or -1 with no house: what the museum shows. */
export function highestEra(state: PersistentState): number {
  return state.houses.reduce((max, h) => Math.max(max, h.tier), -1);
}

/** Coins per minute one bug produces in a tier. Level matters most; good IVs add up to 20%. */
export function bugCoinRate(bug: BugInstance, tier: HouseTier): number {
  return (3 + bug.level * 0.6) * tier.multiplier * (1 + ivGrade(bug) * 0.05);
}

function residents(state: PersistentState, house: House): BugInstance[] {
  return house.bugs.map((uid) => state.bugs[uid]).filter((b): b is BugInstance => b !== undefined);
}

export function houseCoinRate(state: PersistentState, house: House): number {
  const tier = tierOf(house);
  return residents(state, house).reduce((sum, bug) => sum + bugCoinRate(bug, tier), 0);
}

export function storageCap(state: PersistentState, house: House): number {
  return houseCoinRate(state, house) * tierOf(house).storageHours * 60;
}

export function buildHouse(state: PersistentState, lot: number): ActionResult {
  if (!isLotUnlocked(state, lot)) return fail("lotLocked");
  if (getHouse(state, lot)) return fail("houseExists");
  const cost = nextCost(state, lot)!;
  if (state.coins < cost) return fail("notEnoughCoins");
  state.coins -= cost;
  state.houses.push({ lot, tier: 0, bugs: [], pending: 0, xpCarry: 0 });
  state.houses.sort((a, b) => a.lot - b.lot);
  return OK;
}

export function upgradeHouse(state: PersistentState, lot: number): ActionResult {
  const house = getHouse(state, lot);
  if (!house) return fail("noHouse");
  const cost = nextCost(state, lot);
  if (cost === null) return fail("maxTier");
  if (state.coins < cost) return fail("notEnoughCoins");
  state.coins -= cost;
  house.tier += 1;
  return OK;
}

/** Only boxed bugs can live in a house. */
export function assignToHouse(state: PersistentState, lot: number, uid: string): ActionResult {
  const house = getHouse(state, lot);
  if (!house) return fail("noHouse");
  if (!state.bugs[uid]) return fail("unknownBug");
  if (state.team.includes(uid)) return fail("alreadyInTeam");
  if (houseOf(state, uid)) return fail("housed");
  if (house.bugs.length >= tierOf(house).slots) return fail("houseFull");
  house.bugs.push(uid);
  return OK;
}

export function removeFromHouse(state: PersistentState, uid: string): ActionResult {
  const house = houseOf(state, uid);
  if (!house) return fail("notInHouse");
  house.bugs = house.bugs.filter((id) => id !== uid);
  return OK;
}

/** Moves pending coins into the wallet. Returns the amount collected. */
export function collectHouse(state: PersistentState, lot: number): number {
  const house = getHouse(state, lot);
  if (!house) return 0;
  const amount = Math.floor(house.pending);
  state.coins += amount;
  house.pending -= amount;
  return amount;
}

export function collectAll(state: PersistentState): number {
  return state.houses.reduce((sum, h) => sum + collectHouse(state, h.lot), 0);
}

/** Production for `dtMs`: coins pile up to the storage cap, XP goes straight to residents. */
export function tickHousing(state: GameState, dtMs: number): void {
  const cap = levelCap(state);
  for (const house of state.houses) {
    const rate = houseCoinRate(state, house);
    if (rate <= 0) continue;
    const produced = (rate * dtMs) / 60_000;
    house.pending = Math.min(storageCap(state, house), house.pending + produced);
    const bugs = residents(state, house);
    house.xpCarry += (produced * XP_PER_COIN) / bugs.length;
    const whole = Math.floor(house.xpCarry);
    if (whole > 0) {
      house.xpCarry -= whole;
      for (const bug of bugs) gainXp(bug, whole, cap);
    }
  }
}
