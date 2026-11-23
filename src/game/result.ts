/** Outcome of a player command. `reason` is an error code translated by the UI. */
export type ActionResult = { ok: true } | { ok: false; reason: ActionError };

export type ActionError =
  | "notEnoughCoins"
  | "invalidQuantity"
  | "noItem"
  | "wrongItem"
  | "unknownBug"
  | "teamFull"
  | "lastTeamMember"
  | "alreadyInTeam"
  | "notInTeam"
  | "cannotEvolve"
  | "vitaminMaxed"
  | "hpFull"
  | "fainted"
  | "routeLocked"
  | "bossLocked"
  | "busy"
  | "invalidSave"
  | "housed"
  | "notInHouse"
  | "houseFull"
  | "houseExists"
  | "noHouse"
  | "lotLocked"
  | "maxTier"
  | "statFixed"
  | "refineMaxed"
  | "notEnoughStones"
  | "hatcheryFull"
  | "minLevel"
  | "notFainted"
  | "alreadyOwned"
  | "notOwned"
  | "raidRunning"
  | "raidLocked"
  | "cannotRun"
  | "inCombat"
  | "notInRoute";

export const OK: ActionResult = { ok: true };
export const fail = (reason: ActionError): ActionResult => ({ ok: false, reason });
