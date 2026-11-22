import { ivTotal, powerRating, type BugInstance } from "./bug";
import { getSpecies, type Rarity } from "./data/species";
import { houseOf } from "./housing";
import { addItem } from "./inventory";
import { fail, OK, type ActionResult } from "./result";
import { MAX_TEAM_SIZE, type GameState, type PersistentState } from "./state";
import type { BugType } from "./types";

/** Adds a bug to the team if there is room, otherwise to the box. Returns where it went. */
export function addBug(state: PersistentState, bug: BugInstance): "team" | "box" {
  state.bugs[bug.uid] = bug;
  if (state.team.length < MAX_TEAM_SIZE) {
    state.team.push(bug.uid);
    return "team";
  }
  return "box";
}

export function boxBugs(state: PersistentState): BugInstance[] {
  const inTeam = new Set(state.team);
  return Object.values(state.bugs).filter((b) => !inTeam.has(b.uid));
}

function battleBusy(state: GameState): boolean {
  return state.runtime.battle?.kind === "boss" && !state.runtime.battle.outcome;
}

export function moveToTeam(state: GameState, uid: string): ActionResult {
  if (!state.bugs[uid]) return fail("unknownBug");
  if (state.team.includes(uid)) return fail("alreadyInTeam");
  if (houseOf(state, uid)) return fail("housed");
  if (state.team.length >= MAX_TEAM_SIZE) return fail("teamFull");
  if (battleBusy(state)) return fail("busy");
  state.team.push(uid);
  return OK;
}

export function moveToBox(state: GameState, uid: string): ActionResult {
  if (!state.team.includes(uid)) return fail("notInTeam");
  if (state.team.length <= 1) return fail("lastTeamMember");
  if (battleBusy(state)) return fail("busy");
  state.team = state.team.filter((id) => id !== uid);
  return OK;
}

/** Swap a team member with a boxed bug, keeping the slot position. */
export function swapWithBox(state: GameState, teamUid: string, boxUid: string): ActionResult {
  const index = state.team.indexOf(teamUid);
  if (index < 0) return fail("notInTeam");
  if (!state.bugs[boxUid]) return fail("unknownBug");
  if (state.team.includes(boxUid)) return fail("alreadyInTeam");
  if (houseOf(state, boxUid)) return fail("housed");
  if (battleBusy(state)) return fail("busy");
  state.team[index] = boxUid;
  return OK;
}

/** Moves a team member to the front so it fights first. */
export function setLead(state: GameState, uid: string): ActionResult {
  const index = state.team.indexOf(uid);
  if (index < 0) return fail("notInTeam");
  if (battleBusy(state)) return fail("busy");
  state.team.splice(index, 1);
  state.team.unshift(uid);
  return OK;
}

export const RELEASE_COINS_PER_LEVEL = 2;

/** Releases a bug back into the wild for a few coins. */
export function releaseBug(state: GameState, uid: string): ActionResult {
  const bug = state.bugs[uid];
  if (!bug) return fail("unknownBug");
  if (state.team.includes(uid) && state.team.length <= 1) return fail("lastTeamMember");
  if (state.team.includes(uid) && battleBusy(state)) return fail("busy");
  state.team = state.team.filter((id) => id !== uid);
  const house = houseOf(state, uid);
  if (house) house.bugs = house.bugs.filter((id) => id !== uid);
  if (bug.held) addItem(state, bug.held);
  delete state.bugs[uid];
  state.coins += bug.level * RELEASE_COINS_PER_LEVEL;
  return OK;
}

export type BoxSort = "level" | "dex" | "power" | "iv" | "recent";

export interface BoxFilter {
  text?: string;
  type?: BugType | "any";
  rarity?: Rarity | "any";
  minLevel?: number;
  maxLevel?: number;
  shinyOnly?: boolean;
  sort?: BoxSort;
}

const uidNumber = (uid: string) => Number(uid.replace(/\D/g, "")) || 0;

/** RF06: search, filter and sort bugs in the box. */
export function filterBugs(bugs: readonly BugInstance[], filter: BoxFilter): BugInstance[] {
  const text = filter.text?.trim().toLowerCase() ?? "";
  const result = bugs.filter((bug) => {
    const species = getSpecies(bug.speciesId);
    if (text && !species.name.toLowerCase().includes(text)) return false;
    if (filter.type && filter.type !== "any" && !species.types.includes(filter.type)) return false;
    if (filter.rarity && filter.rarity !== "any" && species.rarity !== filter.rarity) return false;
    if (filter.minLevel !== undefined && bug.level < filter.minLevel) return false;
    if (filter.maxLevel !== undefined && bug.level > filter.maxLevel) return false;
    if (filter.shinyOnly && !bug.shiny) return false;
    return true;
  });
  const sort = filter.sort ?? "recent";
  const key: Record<BoxSort, (b: BugInstance) => number> = {
    level: (b) => -b.level,
    dex: (b) => getSpecies(b.speciesId).dex,
    power: (b) => -powerRating(b),
    iv: (b) => -ivTotal(b),
    recent: (b) => -uidNumber(b.uid),
  };
  return result.sort((a, b) => key[sort](a) - key[sort](b));
}
