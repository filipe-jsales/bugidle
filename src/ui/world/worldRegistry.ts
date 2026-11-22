import type { WorldModel } from "./worldModel";

/**
 * The map currently on screen, shared by the battle scene (which steps it) and
 * the side panels that read it (proximity list). One map per route or boss.
 */
let current: { key: string; world: WorldModel } | null = null;

export function worldFor(key: string, create: () => WorldModel): WorldModel {
  if (!current || current.key !== key) current = { key, world: create() };
  return current.world;
}

export function currentWorld(): WorldModel | null {
  return current?.world ?? null;
}
