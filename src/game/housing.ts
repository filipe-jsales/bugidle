/**
 * Houses where boxed bugs farm coins and XP on their own. There is one house per
 * category of computing (history, languages, cloud, databases, networks, security,
 * AI). Each house climbs through its category's 7 milestones; every step costs
 * more and gives more slots, a higher production multiplier and a bigger storage.
 */
import { ivGrade, type BugInstance } from "./bug";
import { gainXp } from "./experience";
import { levelCap } from "./progression";
import { fail, OK, type ActionResult } from "./result";
import type { GameState, PersistentState } from "./state";

/** Numbers of one step, shared by every category (step 1 of history = step 1 of cloud). */
export interface HouseTier {
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
/**
 * Prices are set so each step pays itself back in about 45 minutes with its
 * slots full of bugs at the level a player has when the step is affordable
 * (10, 20, 30, 40, 50, 60, 70). `housing.test.ts` checks this payback.
 */
export const HOUSE_TIERS: readonly HouseTier[] = [
  { slots: 1, multiplier: 1, storageHours: 1, cost: 400 },
  { slots: 2, multiplier: 2, storageHours: 2, cost: 2_000 },
  { slots: 3, multiplier: 4, storageHours: 3, cost: 8_000 },
  { slots: 3, multiplier: 8, storageHours: 4, cost: 28_000 },
  { slots: 4, multiplier: 16, storageHours: 6, cost: 90_000 },
  { slots: 5, multiplier: 32, storageHours: 8, cost: 280_000 },
  { slots: 6, multiplier: 64, storageHours: 12, cost: 900_000 },
];

export type HouseCategory = "history" | "languages" | "cloud" | "databases" | "networks" | "security" | "ai";

export interface HouseLot {
  readonly lot: number;
  readonly category: HouseCategory;
  readonly requiredBadge: string | null;
  readonly costFactor: number;
  /** Milestone ids, oldest first, one per tier. Their text lives in i18n/houses.ptBR.ts. */
  readonly eras: readonly string[];
  /** Small personality per category: coins, XP and storage multipliers. */
  readonly coinMult: number;
  readonly xpMult: number;
  readonly storageMult: number;
}

// prettier-ignore
export const HOUSE_LOTS: readonly HouseLot[] = [
  { lot: 0, category: "history", requiredBadge: null, costFactor: 1, coinMult: 1, xpMult: 1, storageMult: 1,
    eras: ["vacuumTube", "transistor", "integratedCircuit", "microprocessor", "personalComputer", "web", "smartphone"] },
  { lot: 1, category: "languages", requiredBadge: "badge-localhost", costFactor: 1.5, coinMult: 0.8, xpMult: 1.6, storageMult: 1,
    eras: ["assembly", "fortran", "cobol", "c", "python", "javascript", "rust"] },
  { lot: 2, category: "cloud", requiredBadge: "badge-staging", costFactor: 2, coinMult: 1, xpMult: 1, storageMult: 2,
    eras: ["timeSharing", "datacenter", "virtualization", "iaas", "containers", "orchestration", "serverless"] },
  { lot: 3, category: "databases", requiredBadge: "badge-production", costFactor: 3, coinMult: 1.1, xpMult: 1, storageMult: 1.5,
    eras: ["punchedCards", "magneticTape", "hierarchical", "relational", "sql", "nosql", "vectorDb"] },
  { lot: 4, category: "networks", requiredBadge: "badge-production", costFactor: 3, coinMult: 1.25, xpMult: 0.8, storageMult: 1,
    eras: ["arpanet", "ethernet", "tcpip", "dns", "wifi", "cdn", "fiveG"] },
  { lot: 5, category: "security", requiredBadge: "badge-legacy", costFactor: 4, coinMult: 1.15, xpMult: 1.15, storageMult: 1.2,
    eras: ["password", "firstVirus", "publicKey", "firewall", "https", "twoFactor", "zeroTrust"] },
  { lot: 6, category: "ai", requiredBadge: "badge-cloud", costFactor: 6, coinMult: 1.3, xpMult: 1.3, storageMult: 1,
    eras: ["turingTest", "perceptron", "expertSystems", "backprop", "deepBlue", "deepLearning", "transformer"] },
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

export function lotDef(lot: number): HouseLot | undefined {
  return HOUSE_LOTS.find((l) => l.lot === lot);
}

/** The milestone a house is at, e.g. "transistor". */
export function eraOf(house: House): string {
  const def = lotDef(house.lot);
  return def?.eras[Math.min(house.tier, def.eras.length - 1)] ?? "";
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

/** Coins per minute one bug produces in a tier. Level matters most; good IVs add up to 20%. */
export function bugCoinRate(bug: BugInstance, tier: HouseTier): number {
  return (3 + bug.level * 0.6) * tier.multiplier * (1 + ivGrade(bug) * 0.05);
}

function residents(state: PersistentState, house: House): BugInstance[] {
  return house.bugs.map((uid) => state.bugs[uid]).filter((b): b is BugInstance => b !== undefined);
}

export function houseCoinRate(state: PersistentState, house: House): number {
  const tier = tierOf(house);
  const mult = lotDef(house.lot)?.coinMult ?? 1;
  return residents(state, house).reduce((sum, bug) => sum + bugCoinRate(bug, tier), 0) * mult;
}

/** XP per minute shared by the residents. */
export function houseXpRate(state: PersistentState, house: House): number {
  const def = lotDef(house.lot);
  return (houseCoinRate(state, house) / (def?.coinMult ?? 1)) * (def?.xpMult ?? 1) * XP_PER_COIN;
}

export function storageCap(state: PersistentState, house: House): number {
  return houseCoinRate(state, house) * tierOf(house).storageHours * 60 * (lotDef(house.lot)?.storageMult ?? 1);
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
    house.xpCarry += (houseXpRate(state, house) * dtMs) / 60_000 / bugs.length;
    const whole = Math.floor(house.xpCarry);
    if (whole > 0) {
      house.xpCarry -= whole;
      for (const bug of bugs) gainXp(bug, whole, cap);
    }
  }
}
