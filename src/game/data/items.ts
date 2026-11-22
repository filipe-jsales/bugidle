import type { StatKey } from "./stats";

export type ItemCategory = "trap" | "potion" | "vitamin" | "evolution" | "egg";

interface BaseItem {
  readonly id: ItemId;
  readonly category: ItemCategory;
  readonly price: number;
}
export interface TrapItem extends BaseItem {
  readonly category: "trap";
  /** Multiplies the capture rate. 255 or more always captures. */
  readonly captureMultiplier: number;
}
export interface PotionItem extends BaseItem {
  readonly category: "potion";
  /** Flat HP restored; Infinity restores everything. */
  readonly heal: number;
}
export interface VitaminItem extends BaseItem {
  readonly category: "vitamin";
  readonly stat: StatKey;
  readonly boost: number;
}
export interface EvolutionItem extends BaseItem {
  readonly category: "evolution";
}
export interface EggItem extends BaseItem {
  readonly category: "egg";
}
export type ItemDef = TrapItem | PotionItem | VitaminItem | EvolutionItem | EggItem;

export const ITEM_IDS = [
  "breakpoint",
  "watchpoint",
  "profiler",
  "rootAccess",
  "coffee",
  "energyDrink",
  "rebootDisk",
  "docs",
  "codeReview",
  "unitTest",
  "benchmark",
  "mutex",
  "legacyPatch",
  "cdnToken",
  "mysteryEgg",
] as const;
export type ItemId = (typeof ITEM_IDS)[number];

/** Max total vitamin boost per stat on a single bug. */
export const MAX_VITAMIN_BOOST = 20;

export const ITEMS: Readonly<Record<ItemId, ItemDef>> = {
  breakpoint: { id: "breakpoint", category: "trap", price: 20, captureMultiplier: 1 },
  watchpoint: { id: "watchpoint", category: "trap", price: 60, captureMultiplier: 1.5 },
  profiler: { id: "profiler", category: "trap", price: 150, captureMultiplier: 2.5 },
  rootAccess: { id: "rootAccess", category: "trap", price: 15000, captureMultiplier: 255 },
  coffee: { id: "coffee", category: "potion", price: 15, heal: 30 },
  energyDrink: { id: "energyDrink", category: "potion", price: 45, heal: 90 },
  rebootDisk: { id: "rebootDisk", category: "potion", price: 120, heal: Infinity },
  docs: { id: "docs", category: "vitamin", price: 1000, stat: "hp", boost: 2 },
  codeReview: { id: "codeReview", category: "vitamin", price: 1000, stat: "atk", boost: 2 },
  unitTest: { id: "unitTest", category: "vitamin", price: 1000, stat: "def", boost: 2 },
  benchmark: { id: "benchmark", category: "vitamin", price: 1000, stat: "spd", boost: 2 },
  mutex: { id: "mutex", category: "evolution", price: 800 },
  legacyPatch: { id: "legacyPatch", category: "evolution", price: 800 },
  cdnToken: { id: "cdnToken", category: "evolution", price: 800 },
  mysteryEgg: { id: "mysteryEgg", category: "egg", price: 3000 },
};

export function isItemId(value: unknown): value is ItemId {
  return typeof value === "string" && (ITEM_IDS as readonly string[]).includes(value);
}

export function itemsOfCategory<C extends ItemCategory>(category: C): Extract<ItemDef, { category: C }>[] {
  return Object.values(ITEMS).filter((i): i is Extract<ItemDef, { category: C }> => i.category === category);
}
