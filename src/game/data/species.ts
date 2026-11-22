import type { BugType } from "../types";
import type { ItemId } from "./items";
import type { Stats } from "./stats";

export type Rarity = "common" | "uncommon" | "rare" | "legendary";
export type SpriteFamily = "beetle" | "winged" | "worm" | "arachnid";

export interface Evolution {
  readonly to: string;
  readonly level?: number;
  readonly item?: ItemId;
}

export interface SpeciesDef {
  readonly id: string;
  readonly dex: number;
  readonly name: string;
  readonly types: readonly [BugType] | readonly [BugType, BugType];
  readonly baseStats: Stats;
  /** 1 (hard) to 255 (easy). */
  readonly catchRate: number;
  readonly rarity: Rarity;
  readonly xpYield: number;
  readonly family: SpriteFamily;
  /** Evolution stage, 1 to 3. Drives sprite size. */
  readonly stage: 1 | 2 | 3;
  readonly evolution?: Evolution;
}

type SpeciesInput = Omit<SpeciesDef, "dex" | "baseStats" | "xpYield"> & {
  /** hp, atk, def, spd */
  readonly stats: readonly [number, number, number, number];
};

// prettier-ignore
const RAW: readonly SpeciesInput[] = [
  { id: "typobit", name: "Typobit", types: ["syntax"], stats: [40, 45, 35, 50], catchRate: 200, rarity: "common", family: "worm", stage: 1, evolution: { to: "typoworm", level: 16 } },
  { id: "typoworm", name: "Typoworm", types: ["syntax"], stats: [60, 65, 55, 60], catchRate: 120, rarity: "uncommon", family: "worm", stage: 2, evolution: { to: "syntaxwyrm", level: 34 } },
  { id: "syntaxwyrm", name: "Syntaxwyrm", types: ["syntax"], stats: [85, 95, 80, 75], catchRate: 45, rarity: "rare", family: "worm", stage: 3 },
  { id: "mergefly", name: "Mergefly", types: ["syntax"], stats: [50, 55, 50, 65], catchRate: 150, rarity: "uncommon", family: "winged", stage: 1 },
  { id: "regexorpion", name: "Regexorpion", types: ["syntax", "performance"], stats: [65, 85, 60, 55], catchRate: 75, rarity: "rare", family: "arachnid", stage: 2 },
  { id: "nullit", name: "Nullit", types: ["logic"], stats: [45, 50, 40, 55], catchRate: 190, rarity: "common", family: "beetle", stage: 1, evolution: { to: "nullpointer", level: 18 } },
  { id: "nullpointer", name: "Nullpointer", types: ["logic"], stats: [70, 80, 60, 70], catchRate: 90, rarity: "uncommon", family: "beetle", stage: 2 },
  { id: "offbyone", name: "Offbyone", types: ["logic"], stats: [42, 48, 46, 44], catchRate: 200, rarity: "common", family: "arachnid", stage: 1, evolution: { to: "fencepost", level: 20 } },
  { id: "fencepost", name: "Fencepost", types: ["logic"], stats: [72, 70, 82, 50], catchRate: 90, rarity: "uncommon", family: "arachnid", stage: 2 },
  { id: "floatfly", name: "Floatfly", types: ["logic"], stats: [48, 52, 40, 62], catchRate: 160, rarity: "uncommon", family: "winged", stage: 1, evolution: { to: "roundrot", item: "legacyPatch" } },
  { id: "roundrot", name: "Roundrot", types: ["logic", "memory"], stats: [75, 85, 65, 70], catchRate: 60, rarity: "rare", family: "winged", stage: 2 },
  { id: "leaklet", name: "Leaklet", types: ["memory"], stats: [50, 40, 45, 35], catchRate: 190, rarity: "common", family: "beetle", stage: 1, evolution: { to: "leakroach", level: 22 } },
  { id: "leakroach", name: "Leakroach", types: ["memory"], stats: [75, 62, 70, 45], catchRate: 90, rarity: "uncommon", family: "beetle", stage: 2, evolution: { to: "heapocalypse", level: 40 } },
  { id: "heapocalypse", name: "Heapocalypse", types: ["memory"], stats: [105, 95, 95, 50], catchRate: 30, rarity: "rare", family: "beetle", stage: 3 },
  { id: "segfaultula", name: "Segfaultula", types: ["memory"], stats: [60, 80, 50, 65], catchRate: 110, rarity: "uncommon", family: "arachnid", stage: 2 },
  { id: "stackmantis", name: "Stackmantis", types: ["memory", "logic"], stats: [65, 85, 55, 75], catchRate: 80, rarity: "uncommon", family: "arachnid", stage: 2 },
  { id: "racemite", name: "Racemite", types: ["concurrency"], stats: [40, 52, 38, 70], catchRate: 170, rarity: "common", family: "arachnid", stage: 1, evolution: { to: "deadlocust", item: "mutex" } },
  { id: "deadlocust", name: "Deadlocust", types: ["concurrency"], stats: [80, 90, 85, 40], catchRate: 60, rarity: "rare", family: "winged", stage: 2 },
  { id: "heisenbug", name: "Heisenbug", types: ["concurrency", "logic"], stats: [60, 75, 60, 95], catchRate: 25, rarity: "rare", family: "beetle", stage: 2 },
  { id: "timeoutick", name: "Timeoutick", types: ["network"], stats: [45, 45, 45, 40], catchRate: 190, rarity: "common", family: "arachnid", stage: 1, evolution: { to: "packetfly", level: 18 } },
  { id: "packetfly", name: "Packetfly", types: ["network"], stats: [65, 65, 55, 80], catchRate: 100, rarity: "uncommon", family: "winged", stage: 2, evolution: { to: "lagmoth", level: 36 } },
  { id: "lagmoth", name: "Lagmoth", types: ["network"], stats: [90, 85, 75, 70], catchRate: 40, rarity: "rare", family: "winged", stage: 3 },
  { id: "dnsnail", name: "Dnsnail", types: ["network"], stats: [80, 55, 90, 25], catchRate: 120, rarity: "uncommon", family: "worm", stage: 2 },
  { id: "corsbee", name: "Corsbee", types: ["network", "security"], stats: [55, 65, 55, 75], catchRate: 110, rarity: "uncommon", family: "winged", stage: 1 },
  { id: "injectick", name: "Injectick", types: ["security"], stats: [42, 55, 40, 55], catchRate: 170, rarity: "common", family: "arachnid", stage: 1, evolution: { to: "injecthorn", level: 24 } },
  { id: "injecthorn", name: "Injecthorn", types: ["security"], stats: [72, 92, 62, 72], catchRate: 70, rarity: "uncommon", family: "beetle", stage: 2 },
  { id: "xssquito", name: "Xssquito", types: ["security", "ui"], stats: [50, 62, 40, 78], catchRate: 130, rarity: "uncommon", family: "winged", stage: 1 },
  { id: "spinloop", name: "Spinloop", types: ["performance"], stats: [50, 50, 45, 45], catchRate: 180, rarity: "common", family: "worm", stage: 1, evolution: { to: "infiniloop", level: 24 } },
  { id: "infiniloop", name: "Infiniloop", types: ["performance"], stats: [80, 88, 70, 55], catchRate: 75, rarity: "uncommon", family: "worm", stage: 2 },
  { id: "nplusone", name: "Nplusone", types: ["performance"], stats: [60, 55, 70, 40], catchRate: 140, rarity: "uncommon", family: "beetle", stage: 1 },
  { id: "cachemoth", name: "Cachemoth", types: ["performance", "memory"], stats: [55, 55, 55, 65], catchRate: 120, rarity: "uncommon", family: "winged", stage: 1, evolution: { to: "cachequeen", item: "cdnToken" } },
  { id: "cachequeen", name: "Cachequeen", types: ["performance", "memory"], stats: [85, 85, 80, 90], catchRate: 45, rarity: "rare", family: "winged", stage: 2 },
  { id: "pixelmite", name: "Pixelmite", types: ["ui"], stats: [38, 42, 38, 58], catchRate: 200, rarity: "common", family: "arachnid", stage: 1, evolution: { to: "overflowasp", level: 15 } },
  { id: "overflowasp", name: "Overflowasp", types: ["ui"], stats: [62, 70, 52, 78], catchRate: 110, rarity: "uncommon", family: "winged", stage: 2 },
  { id: "flickerfly", name: "Flickerfly", types: ["ui"], stats: [48, 52, 40, 72], catchRate: 160, rarity: "uncommon", family: "winged", stage: 1 },
  { id: "y2kbeetle", name: "Y2Kbeetle", types: ["logic", "memory"], stats: [100, 100, 100, 60], catchRate: 10, rarity: "legendary", family: "beetle", stage: 3 },
  { id: "zeroday", name: "Zeroday", types: ["security"], stats: [90, 120, 80, 110], catchRate: 5, rarity: "legendary", family: "arachnid", stage: 3 },
  { id: "markmoth", name: "Markmoth", types: ["syntax", "logic"], stats: [110, 105, 105, 105], catchRate: 3, rarity: "legendary", family: "winged", stage: 3 },
];

export const SPECIES: readonly SpeciesDef[] = RAW.map(({ stats, ...rest }, index) => {
  const [hp, atk, def, spd] = stats;
  return {
    ...rest,
    dex: index + 1,
    baseStats: { hp, atk, def, spd },
    xpYield: Math.round((hp + atk + def + spd) * 0.3),
  };
});

const SPECIES_BY_ID = new Map(SPECIES.map((s) => [s.id, s]));

export function getSpecies(id: string): SpeciesDef {
  const species = SPECIES_BY_ID.get(id);
  if (!species) throw new Error(`Unknown species: ${id}`);
  return species;
}

export function hasSpecies(id: string): boolean {
  return SPECIES_BY_ID.has(id);
}

/** The species this one evolves from, if any. */
export function preEvolutionOf(id: string): SpeciesDef | undefined {
  return SPECIES.find((s) => s.evolution?.to === id);
}
