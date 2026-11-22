import { createBug, type BugInstance } from "./bug";
import { addBug } from "./collection";
import { createSeededRng } from "./rng";
import { createInitialState, nextUid, type GameState } from "./state";

export const FIXED_IVS = { hp: 15, atk: 15, def: 15, spd: 15 };

/** A fresh state with the given bugs (speciesId, level) already in the team/box. */
export function stateWith(...members: [string, number][]): GameState {
  const state = createInitialState();
  const rng = createSeededRng(99);
  for (const [speciesId, level] of members) {
    addBug(state, createBug({ uid: nextUid(state), speciesId, level, rng, origin: "test", shiny: false, ivs: { ...FIXED_IVS } }));
  }
  return state;
}

export function firstBug(state: GameState): BugInstance {
  const uid = state.team[0];
  const bug = uid ? state.bugs[uid] : undefined;
  if (!bug) throw new Error("no bug in team");
  return bug;
}
