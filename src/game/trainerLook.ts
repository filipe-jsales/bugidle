/**
 * How the trainer looks: a headwear style and a color for each part. Most
 * options are free; a few special ones are earned in play. Pure: ids and
 * rules only; the colors live in sprites/trainerSprite.ts and the names in i18n.
 */
import { BOSSES } from "./data/world";
import { fail, OK, type ActionResult } from "./result";
import type { PersistentState } from "./state";

export const LOOK_PARTS = ["headwear", "headColor", "hair", "skin", "jacket", "pants", "backpack"] as const;
export type LookPart = (typeof LOOK_PARTS)[number];
export type TrainerLook = Record<LookPart, string>;

export const HEADWEAR = ["cap", "beanie", "none"] as const;
export const HEAD_COLORS = ["red", "blue", "green", "black", "purple", "orange", "white", "shiny"] as const;
export const HAIR_COLORS = ["brown", "black", "blond", "red", "blue", "white"] as const;
export const SKIN_TONES = ["tone1", "tone2", "tone3", "tone4", "tone5"] as const;
export const JACKET_COLORS = ["blue", "red", "green", "black", "purple", "orange", "teal", "gold"] as const;
export const PANTS_COLORS = ["navy", "black", "brown", "gray", "green"] as const;
export const BACKPACK_COLORS = ["leather", "red", "black", "green", "legend"] as const;

export const LOOK_OPTIONS: Readonly<Record<LookPart, readonly string[]>> = {
  headwear: HEADWEAR,
  headColor: HEAD_COLORS,
  hair: HAIR_COLORS,
  skin: SKIN_TONES,
  jacket: JACKET_COLORS,
  pants: PANTS_COLORS,
  backpack: BACKPACK_COLORS,
};

export type LookRequirement = "shiny" | "firstBadge" | "allBadges";

/** Special options and what earns them. Everything else is free from the start. */
export const LOOK_REQUIREMENTS: Readonly<Partial<Record<`${LookPart}:${string}`, LookRequirement>>> = {
  "headColor:shiny": "shiny",
  "backpack:legend": "firstBadge",
  "jacket:gold": "allBadges",
};

export function defaultLook(): TrainerLook {
  return { headwear: "cap", headColor: "red", hair: "brown", skin: "tone2", jacket: "blue", pants: "navy", backpack: "leather" };
}

export function requirementMet(state: PersistentState, req: LookRequirement): boolean {
  switch (req) {
    case "shiny":
      return state.totals.shinies > 0 || Object.values(state.bugdex).some((e) => e.shinyCaught);
    case "firstBadge":
      return state.badges.length >= 1;
    case "allBadges":
      return BOSSES.every((b) => state.badges.includes(b.badgeId));
  }
}

export function requirementOf(part: LookPart, option: string): LookRequirement | undefined {
  return LOOK_REQUIREMENTS[`${part}:${option}`];
}

export function isLookOptionOpen(state: PersistentState, part: LookPart, option: string): boolean {
  const req = requirementOf(part, option);
  return !req || requirementMet(state, req);
}

/** Changes one part of the look. Refuses unknown options and specials not earned yet. */
export function setLook(state: PersistentState, part: LookPart, option: string): ActionResult {
  if (!LOOK_OPTIONS[part].includes(option)) return fail("invalidQuantity");
  if (!isLookOptionOpen(state, part, option)) return fail("lookLocked");
  state.trainer.look[part] = option;
  return OK;
}

/** A look read from a save: unknown options fall back to the default; earned specials stay. */
export function sanitizeLook(raw: unknown): TrainerLook {
  const look = defaultLook();
  if (typeof raw !== "object" || raw === null) return look;
  const r = raw as Record<string, unknown>;
  for (const part of LOOK_PARTS) {
    const v = r[part];
    if (typeof v === "string" && LOOK_OPTIONS[part].includes(v)) look[part] = v;
  }
  return look;
}

/** Bug shown on the trainer card: the chosen favorite if it still exists, else the highest level. */
export function favoriteBug(state: PersistentState): string | null {
  const fav = state.trainer.favoriteUid;
  if (fav && state.bugs[fav]) return fav;
  const best = Object.values(state.bugs).sort((a, b) => b.level - a.level || a.uid.localeCompare(b.uid))[0];
  return best?.uid ?? null;
}

export function setFavorite(state: PersistentState, uid: string | null): ActionResult {
  if (uid !== null && !state.bugs[uid]) return fail("unknownBug");
  state.trainer.favoriteUid = uid;
  return OK;
}
