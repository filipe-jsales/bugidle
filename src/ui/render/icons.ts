import type { ItemId } from "../../game/data/items";
import { ITEM_ART } from "./itemArt";
import { ICON_ART, type IconName } from "./iconArt";
import { shadeArt } from "./shadedArt";
import { createCanvas } from "./pixels";
import type { BugType } from "../../game/types";
import { TYPE_PALETTES } from "../../sprites/bugSprite";
import { pixelArtUrl } from "./pixels";

export type { IconName };

const shadedCache = new Map<string, string>();

/** Draws flat art with its outline and shading (see shadedArt.ts). */
function shadedUrl(key: string, rows: readonly string[]): string {
  const cached = shadedCache.get(key);
  if (cached) return cached;
  const colors = shadeArt(rows);
  const [canvas, ctx] = createCanvas(colors[0]?.length ?? 16, colors.length);
  colors.forEach((line, y) =>
    line.forEach((color, x) => {
      if (!color) return;
      ctx.fillStyle = color;
      ctx.fillRect(x, y, 1, 1);
    }),
  );
  const url = canvas.toDataURL();
  shadedCache.set(key, url);
  return url;
}

export function itemIconUrl(id: ItemId): string {
  return shadedUrl(`item:${id}`, ITEM_ART[id]);
}

const STONE_ART = [
  "............",
  "....kkkk....",
  "...kLLMMk...",
  "..kLLwMMMk..",
  ".kLLwMMMMDk.",
  ".kLMMMMMMDk.",
  ".kMMMMMMDDk.",
  ".kMMMMMDDDk.",
  "..kMMMDDDk..",
  "...kMDDDk...",
  "....kkkk....",
  "............",
];

/** A gem tinted with the type's colors. */
export function stoneIconUrl(type: BugType): string {
  const palette = TYPE_PALETTES[type];
  return pixelArtUrl(STONE_ART, { k: "#1f1424", w: "#ffffff", L: palette.light, M: palette.body, D: palette.shade });
}

export function iconUrl(name: IconName): string {
  return shadedUrl(`icon:${name}`, ICON_ART[name]);
}
