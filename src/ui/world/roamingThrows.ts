/**
 * Traps thrown at roaming bugs (clicked on the map or in the proximity panel).
 * The clicked bug leaves the map at once; a small effect stays at its spot until
 * the engine says whether it was caught or ran away. Shared by the map and the panel.
 */
import { throwAtRoaming } from "../../game/engine";
import type { ActionResult } from "../../game/result";
import { store } from "../store";
import type { Vec, Wanderer, WorldModel } from "./worldModel";

export interface RoamingEffect {
  id: number;
  speciesId: string;
  pos: Vec;
  startedAt: number;
  result: "caught" | "fled" | null;
  resultAt: number;
}

/** How long the result stays on screen. */
export const RESULT_MS = 1400;

let effects: RoamingEffect[] = [];
let nextId = 1;

export function throwAtWanderer(world: WorldModel, wanderer: Wanderer): ActionResult {
  const result = store.run((s) => throwAtRoaming(s, wanderer.speciesId));
  if (!result.ok) return result;
  world.wanderers = world.wanderers.filter((w) => w !== wanderer);
  effects.push({ id: nextId++, speciesId: wanderer.speciesId, pos: { ...wanderer.pos }, startedAt: performance.now(), result: null, resultAt: 0 });
  return result;
}

/** Effects still on screen; finished ones are dropped. */
export function roamingEffects(now: number): readonly RoamingEffect[] {
  effects = effects.filter((e) => (e.result ? now - e.resultAt < RESULT_MS : now - e.startedAt < 5000));
  return effects;
}

store.onEvents((events) => {
  for (const event of events) {
    const caught = event.type === "captured" && event.roaming;
    if (!caught && event.type !== "fled") continue;
    const pending = effects.find((e) => e.result === null && e.speciesId === event.speciesId);
    if (pending) {
      pending.result = caught ? "caught" : "fled";
      pending.resultAt = performance.now();
    }
  }
});
