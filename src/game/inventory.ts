import { computeStats, isFainted, maxHp } from "./bug";
import { ITEMS, MAX_VITAMIN_BOOST, type ItemId } from "./data/items";
import { canEvolveWithItem, evolve } from "./evolution";
import { fail, OK, type ActionResult } from "./result";
import type { PersistentState } from "./state";

export function itemCount(state: PersistentState, itemId: ItemId): number {
  return state.inventory[itemId] ?? 0;
}

export function addItem(state: PersistentState, itemId: ItemId, quantity = 1): void {
  state.inventory[itemId] = itemCount(state, itemId) + quantity;
}

/** Returns false (and changes nothing) when there is not enough. */
export function consumeItem(state: PersistentState, itemId: ItemId, quantity = 1): boolean {
  const count = itemCount(state, itemId);
  if (count < quantity) return false;
  // an empty slot is removed, like the save loader does, so a reload is identical
  if (count === quantity) delete state.inventory[itemId];
  else state.inventory[itemId] = count - quantity;
  return true;
}

/** RF09: buy items with coins. */
export function buyItem(state: PersistentState, itemId: ItemId, quantity: number): ActionResult {
  if (!Number.isInteger(quantity) || quantity <= 0) return fail("invalidQuantity");
  const cost = ITEMS[itemId].price * quantity;
  if (state.coins < cost) return fail("notEnoughCoins");
  state.coins -= cost;
  addItem(state, itemId, quantity);
  return OK;
}

/** Uses a potion, vitamin or evolution item on a bug. */
export function useItemOnBug(state: PersistentState, itemId: ItemId, uid: string): ActionResult {
  const bug = state.bugs[uid];
  if (!bug) return fail("unknownBug");
  if (itemCount(state, itemId) <= 0) return fail("noItem");
  const item = ITEMS[itemId];

  switch (item.category) {
    case "potion": {
      if (isFainted(bug)) return fail("fainted");
      const max = maxHp(bug);
      if (bug.currentHp >= max) return fail("hpFull");
      bug.currentHp = Math.min(max, bug.currentHp + item.heal);
      break;
    }
    case "revive": {
      if (!isFainted(bug)) return fail("notFainted");
      bug.currentHp = Math.max(1, Math.floor(maxHp(bug) * item.restore));
      break;
    }
    case "vitamin": {
      if (bug.boosts[item.stat] + item.boost > MAX_VITAMIN_BOOST) return fail("vitaminMaxed");
      const hpBefore = computeStats(bug).hp;
      bug.boosts[item.stat] += item.boost;
      if (item.stat === "hp") bug.currentHp += computeStats(bug).hp - hpBefore;
      break;
    }
    case "evolution": {
      if (!canEvolveWithItem(bug, itemId)) return fail("cannotEvolve");
      evolve(state, bug);
      break;
    }
    case "trap":
    case "egg":
      return fail("wrongItem");
  }
  consumeItem(state, itemId);
  return OK;
}
