/** Held items: one per bug, bought in the shop, moved between the bag and a bug. */
import { computeStats, type BugInstance } from "./bug";
import { ITEMS, type HeldEffect, type ItemId } from "./data/items";
import { addItem, consumeItem, itemCount } from "./inventory";
import { fail, OK, type ActionResult } from "./result";
import type { PersistentState } from "./state";

export function heldEffect(bug: BugInstance): HeldEffect {
  const item = bug.held ? ITEMS[bug.held] : undefined;
  return item?.category === "held" ? item.effect : {};
}

export function heldXpMult(bug: BugInstance | undefined): number {
  return bug ? (heldEffect(bug).xpMult ?? 1) : 1;
}

export function heldCoinMult(bug: BugInstance | undefined): number {
  return bug ? (heldEffect(bug).coinMult ?? 1) : 1;
}

/** Keeps the missing HP the same when max HP changes (an HP item), never fainting the bug. */
function keepMissingHp(bug: BugInstance, change: () => void): void {
  const missing = computeStats(bug).hp - bug.currentHp;
  change();
  const max = computeStats(bug).hp;
  bug.currentHp = bug.currentHp <= 0 ? 0 : Math.max(1, Math.min(max, max - missing));
}

/** Gives a held item from the bag to a bug; its old item goes back to the bag. */
export function equipItem(state: PersistentState, uid: string, itemId: ItemId): ActionResult {
  const bug = state.bugs[uid];
  if (!bug) return fail("unknownBug");
  if (ITEMS[itemId].category !== "held") return fail("wrongItem");
  if (itemCount(state, itemId) <= 0) return fail("noItem");
  consumeItem(state, itemId);
  if (bug.held) addItem(state, bug.held);
  keepMissingHp(bug, () => {
    bug.held = itemId;
  });
  return OK;
}

export function unequipItem(state: PersistentState, uid: string): ActionResult {
  const bug = state.bugs[uid];
  if (!bug) return fail("unknownBug");
  if (!bug.held) return fail("noItem");
  addItem(state, bug.held);
  keepMissingHp(bug, () => {
    bug.held = null;
  });
  return OK;
}
