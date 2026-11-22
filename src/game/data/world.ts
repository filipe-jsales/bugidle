/** Regions, routes and bosses. Display names live in the i18n module, keyed by id. */

export type TerrainId = "circuit" | "server" | "datacenter" | "mainframe" | "cloud";

export interface RegionDef {
  readonly id: string;
  readonly order: number;
  readonly terrain: TerrainId;
  /** Badge needed to enter. The first region has none. */
  readonly requiredBadge: string | null;
}

export interface Encounter {
  readonly speciesId: string;
  readonly weight: number;
}

export type RouteUnlock =
  | { readonly kind: "start" }
  | { readonly kind: "defeats"; readonly routeId: string; readonly count: number }
  | { readonly kind: "badge"; readonly badgeId: string };

export interface RouteDef {
  readonly id: string;
  readonly regionId: string;
  readonly minLevel: number;
  readonly maxLevel: number;
  readonly encounters: readonly Encounter[];
  readonly unlock: RouteUnlock;
  /** Position on the region map, in percent. */
  readonly mapX: number;
  readonly mapY: number;
}

export interface BossMember {
  readonly speciesId: string;
  readonly level: number;
}

export interface BossDef {
  readonly id: string;
  readonly regionId: string;
  readonly name: string;
  readonly team: readonly BossMember[];
  readonly timeLimitMs: number;
  readonly rewardCoins: number;
  readonly badgeId: string;
  /** Level cap granted by the badge. */
  readonly levelCap: number;
}

export const BASE_LEVEL_CAP = 20;
/** Wins needed on a route to open the next one, per region (later regions ask for more). */
export const DEFEATS_TO_UNLOCK_BY_REGION: Readonly<Record<string, number>> = {
  localhost: 25,
  staging: 80,
  production: 100,
  legacy: 150,
  cloud: 200,
};
export const DEFEATS_TO_UNLOCK = DEFEATS_TO_UNLOCK_BY_REGION.localhost!;

export const REGIONS: readonly RegionDef[] = [
  { id: "localhost", order: 1, terrain: "circuit", requiredBadge: null },
  { id: "staging", order: 2, terrain: "server", requiredBadge: "badge-localhost" },
  { id: "production", order: 3, terrain: "datacenter", requiredBadge: "badge-staging" },
  { id: "legacy", order: 4, terrain: "mainframe", requiredBadge: "badge-production" },
  { id: "cloud", order: 5, terrain: "cloud", requiredBadge: "badge-legacy" },
];

const e = (speciesId: string, weight: number): Encounter => ({ speciesId, weight });
const after = (routeId: string, regionId: string): RouteUnlock => ({ kind: "defeats", routeId, count: DEFEATS_TO_UNLOCK_BY_REGION[regionId]! });

// prettier-ignore
export const ROUTES: readonly RouteDef[] = [
  { id: "port-3000", regionId: "localhost", minLevel: 2, maxLevel: 5, unlock: { kind: "start" }, mapX: 18, mapY: 70,
    encounters: [e("typobit", 30), e("nullit", 30), e("pixelmite", 20), e("offbyone", 15), e("leaklet", 5)] },
  { id: "node-modules", regionId: "localhost", minLevel: 5, maxLevel: 9, unlock: after("port-3000", "localhost"), mapX: 42, mapY: 40,
    encounters: [e("typobit", 20), e("leaklet", 20), e("mergefly", 15), e("spinloop", 20), e("timeoutick", 20), e("pixelmite", 5)] },
  { id: "dev-console", regionId: "localhost", minLevel: 8, maxLevel: 13, unlock: after("node-modules", "localhost"), mapX: 72, mapY: 62,
    encounters: [e("nullit", 15), e("offbyone", 15), e("floatfly", 15), e("flickerfly", 15), e("injectick", 20), e("racemite", 20)] },

  { id: "ci-pipeline", regionId: "staging", minLevel: 14, maxLevel: 19, unlock: { kind: "badge", badgeId: "badge-localhost" }, mapX: 15, mapY: 35,
    encounters: [e("mergefly", 20), e("racemite", 20), e("timeoutick", 15), e("corsbee", 15), e("spinloop", 15), e("dnsnail", 15)] },
  { id: "test-suite", regionId: "staging", minLevel: 17, maxLevel: 23, unlock: after("ci-pipeline", "staging"), mapX: 48, mapY: 70,
    encounters: [e("floatfly", 18), e("flickerfly", 18), e("xssquito", 16), e("nplusone", 16), e("cachemoth", 16), e("segfaultula", 16)] },
  { id: "feature-flags", regionId: "staging", minLevel: 21, maxLevel: 27, unlock: after("test-suite", "staging"), mapX: 80, mapY: 30,
    encounters: [e("stackmantis", 20), e("injectick", 20), e("packetfly", 20), e("overflowasp", 20), e("heisenbug", 2), e("regexorpion", 4)] },

  { id: "load-balancer", regionId: "production", minLevel: 28, maxLevel: 34, unlock: { kind: "badge", badgeId: "badge-staging" }, mapX: 20, mapY: 60,
    encounters: [e("packetfly", 25), e("typoworm", 20), e("nullpointer", 20), e("corsbee", 20), e("dnsnail", 15)] },
  { id: "database-cluster", regionId: "production", minLevel: 32, maxLevel: 38, unlock: after("load-balancer", "production"), mapX: 52, mapY: 28,
    encounters: [e("nplusone", 20), e("leakroach", 20), e("cachemoth", 20), e("fencepost", 20), e("segfaultula", 15), e("cachequeen", 5)] },
  { id: "on-call-night", regionId: "production", minLevel: 36, maxLevel: 44, unlock: after("database-cluster", "production"), mapX: 80, mapY: 66,
    encounters: [e("infiniloop", 20), e("injecthorn", 20), e("deadlocust", 15), e("overflowasp", 20), e("heisenbug", 5), e("lagmoth", 5), e("roundrot", 5)] },

  { id: "cobol-vault", regionId: "legacy", minLevel: 42, maxLevel: 48, unlock: { kind: "badge", badgeId: "badge-production" }, mapX: 22, mapY: 30,
    encounters: [e("fencepost", 25), e("leakroach", 25), e("dnsnail", 20), e("roundrot", 15), e("stackmantis", 15)] },
  { id: "mainframe", regionId: "legacy", minLevel: 46, maxLevel: 53, unlock: after("cobol-vault", "legacy"), mapX: 55, mapY: 66,
    encounters: [e("heapocalypse", 15), e("deadlocust", 20), e("infiniloop", 20), e("regexorpion", 20), e("syntaxwyrm", 10), e("nullpointer", 15)] },
  { id: "y2k-bunker", regionId: "legacy", minLevel: 50, maxLevel: 58, unlock: after("mainframe", "legacy"), mapX: 82, mapY: 34,
    encounters: [e("heapocalypse", 25), e("roundrot", 25), e("heisenbug", 15), e("syntaxwyrm", 20), e("y2kbeetle", 1)] },

  { id: "serverless-sky", regionId: "cloud", minLevel: 64, maxLevel: 72, unlock: { kind: "badge", badgeId: "badge-legacy" }, mapX: 18, mapY: 50,
    encounters: [e("lagmoth", 25), e("cachequeen", 25), e("corsbee", 20), e("xssquito", 20), e("heisenbug", 10)] },
  { id: "kubernetes-reef", regionId: "cloud", minLevel: 70, maxLevel: 80, unlock: after("serverless-sky", "cloud"), mapX: 50, mapY: 25,
    encounters: [e("deadlocust", 25), e("infiniloop", 25), e("injecthorn", 25), e("syntaxwyrm", 15), e("heapocalypse", 10)] },
  { id: "zero-day-abyss", regionId: "cloud", minLevel: 77, maxLevel: 88, unlock: after("kubernetes-reef", "cloud"), mapX: 78, mapY: 70,
    encounters: [e("injecthorn", 30), e("lagmoth", 25), e("syntaxwyrm", 25), e("heisenbug", 15), e("zeroday", 1), e("markmoth", 0.3)] },
];

// prettier-ignore
export const BOSSES: readonly BossDef[] = [
  { id: "boss-localhost", regionId: "localhost", name: "Rita Review", badgeId: "badge-localhost", levelCap: 35, timeLimitMs: 90_000, rewardCoins: 600,
    team: [{ speciesId: "offbyone", level: 14 }, { speciesId: "nullit", level: 15 }, { speciesId: "typoworm", level: 17 }] },
  { id: "boss-staging", regionId: "staging", name: "Max Merge", badgeId: "badge-staging", levelCap: 50, timeLimitMs: 100_000, rewardCoins: 1800,
    team: [{ speciesId: "mergefly", level: 27 }, { speciesId: "corsbee", level: 28 }, { speciesId: "segfaultula", level: 29 }, { speciesId: "overflowasp", level: 31 }] },
  { id: "boss-production", regionId: "production", name: "Olga On-Call", badgeId: "badge-production", levelCap: 70, timeLimitMs: 110_000, rewardCoins: 4500,
    team: [{ speciesId: "nplusone", level: 44 }, { speciesId: "cachequeen", level: 45 }, { speciesId: "infiniloop", level: 46 }, { speciesId: "deadlocust", level: 47 }, { speciesId: "heapocalypse", level: 48 }] },
  { id: "boss-legacy", regionId: "legacy", name: "Karl Kernel", badgeId: "badge-legacy", levelCap: 100, timeLimitMs: 120_000, rewardCoins: 9000,
    team: [{ speciesId: "fencepost", level: 60 }, { speciesId: "roundrot", level: 61 }, { speciesId: "regexorpion", level: 62 }, { speciesId: "syntaxwyrm", level: 63 }, { speciesId: "heapocalypse", level: 64 }, { speciesId: "y2kbeetle", level: 66 }] },
  { id: "boss-cloud", regionId: "cloud", name: "Cora Cloud", badgeId: "badge-cloud", levelCap: 100, timeLimitMs: 150_000, rewardCoins: 25000,
    team: [{ speciesId: "lagmoth", level: 85 }, { speciesId: "cachequeen", level: 86 }, { speciesId: "deadlocust", level: 87 }, { speciesId: "injecthorn", level: 88 }, { speciesId: "heisenbug", level: 90 }, { speciesId: "zeroday", level: 92 }] },
];

const byId = <T extends { id: string }>(list: readonly T[], label: string) => {
  const map = new Map(list.map((x) => [x.id, x]));
  return (id: string): T => {
    const found = map.get(id);
    if (!found) throw new Error(`Unknown ${label}: ${id}`);
    return found;
  };
};

export const getRegion = byId(REGIONS, "region");
export const getRoute = byId(ROUTES, "route");
export const getBoss = byId(BOSSES, "boss");

export function routesOfRegion(regionId: string): RouteDef[] {
  return ROUTES.filter((r) => r.regionId === regionId);
}

export function bossOfRegion(regionId: string): BossDef | undefined {
  return BOSSES.find((b) => b.regionId === regionId);
}

/** Routes where a species can be encountered, for the Bugdex. */
export function routesWithSpecies(speciesId: string): RouteDef[] {
  return ROUTES.filter((r) => r.encounters.some((enc) => enc.speciesId === speciesId));
}
