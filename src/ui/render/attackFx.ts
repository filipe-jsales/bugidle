/**
 * Per-type attack visuals: what flies from the attacker to the target and the
 * burst of pixel particles on impact. Pure data so it can be tested; the map
 * scene places it between the two fighters and animates it with CSS.
 */
import { getMove } from "../../game/data/moves";
import { createSeededRng, randomInt } from "../../game/rng";
import type { BugType } from "../../game/types";

export type FxShape = "glyph" | "blocks" | "twin" | "packets" | "shard" | "ring" | "pixels";

export interface TypeFx {
  shape: FxShape;
  color: string;
  accent: string;
  /** Characters thrown by glyph-style attacks. */
  glyphs?: readonly string[];
  /** How many projectiles fly per attack. */
  count: number;
  travelMs: number;
}

export const TYPE_FX: Readonly<Record<BugType, TypeFx>> = {
  syntax: { shape: "glyph", color: "#ff8a7a", accent: "#ffd166", glyphs: [";", "{", "}", "(", ")"], count: 3, travelMs: 380 },
  logic: { shape: "glyph", color: "#b5aaff", accent: "#ffe066", glyphs: ["?", "!", "0", "1", "&"], count: 3, travelMs: 420 },
  memory: { shape: "blocks", color: "#9fdc62", accent: "#e8d44d", count: 4, travelMs: 450 },
  concurrency: { shape: "twin", color: "#ffb15a", accent: "#5fd3e0", count: 2, travelMs: 300 },
  network: { shape: "packets", color: "#6fe0f0", accent: "#ff7eb6", count: 5, travelMs: 360 },
  security: { shape: "shard", color: "#f08ac6", accent: "#9df27a", count: 1, travelMs: 280 },
  performance: { shape: "ring", color: "#ffd84a", accent: "#e0533d", count: 1, travelMs: 520 },
  ui: { shape: "pixels", color: "#8fb5ff", accent: "#ff9f43", count: 6, travelMs: 400 },
};

export interface Projectile {
  text: string | null;
  delayMs: number;
  /** Small vertical spread so several projectiles do not overlap (px). */
  offsetY: number;
}

export interface Particle {
  /** Direction and distance in px. */
  dx: number;
  dy: number;
  size: number;
  delayMs: number;
  color: string;
}

export interface AttackFx {
  type: BugType;
  fx: TypeFx;
  projectiles: Projectile[];
  particles: Particle[];
  shake: boolean;
  big: boolean;
}

export interface AttackInput {
  side: "player" | "enemy";
  moveId: string;
  effectiveness: number;
  critical: boolean;
}

/** Builds the visuals for one attack. `seed` keeps them stable across re-renders. */
export function buildAttackFx(attack: AttackInput, seed: number): AttackFx {
  const type = getMove(attack.moveId).type;
  const fx = TYPE_FX[type];
  const rng = createSeededRng(seed);
  const big = attack.effectiveness > 1;

  const projectiles: Projectile[] = Array.from({ length: fx.count }, (_, i) => ({
    text: fx.glyphs ? fx.glyphs[randomInt(rng, 0, fx.glyphs.length - 1)]! : null,
    delayMs: i * (fx.shape === "twin" ? 0 : 55),
    offsetY: fx.count === 1 ? 0 : (i - (fx.count - 1) / 2) * (fx.shape === "twin" ? 14 : 7),
  }));

  const particleCount = attack.effectiveness === 0 ? 0 : big ? 14 : attack.critical ? 11 : 7;
  const particles: Particle[] = Array.from({ length: particleCount }, () => {
    const angle = rng() * Math.PI * 2;
    const distance = (big ? 34 : 22) + rng() * 22;
    return {
      dx: Math.round(Math.cos(angle) * distance),
      dy: Math.round(Math.sin(angle) * distance),
      size: randomInt(rng, 5, big ? 11 : 8),
      delayMs: fx.travelMs,
      color: rng() < 0.7 ? fx.color : fx.accent,
    };
  });

  return { type, fx, projectiles, particles, shake: attack.critical, big };
}
