import { itemsOfCategory } from "../../game/data/items";
import { equipItem, unequipItem } from "../../game/held";
import { itemCount } from "../../game/inventory";
import { ITEM_TEXT } from "../../i18n/ptBR";
import { HELD_UI } from "../../i18n/held.ptBR";
import { useApp } from "../appContext";
import { Button, ItemIcon } from "../components/primitives";
import { store, useGame } from "../store";

/** The bug's held item and the held items in the bag it can take. */
export function HeldItemSection({ uid }: { uid: string }) {
  const state = useGame();
  const { report, open } = useApp();
  const bug = state.bugs[uid];
  if (!bug) return null;
  const inBag = itemsOfCategory("held").filter((item) => itemCount(state, item.id) > 0);

  return (
    <div className="held-section">
      <div className={`held-slot ${bug.held ? "filled" : ""}`}>
        {bug.held ? (
          <>
            <ItemIcon id={bug.held} size={32} />
            <div className="held-info">
              <strong>{ITEM_TEXT[bug.held].name}</strong>
              <small className="muted">{ITEM_TEXT[bug.held].description}</small>
            </div>
            <Button variant="dark" small onClick={() => report(store.run((s) => unequipItem(s, uid)))}>
              {HELD_UI.remove}
            </Button>
          </>
        ) : (
          <span className="muted small">{HELD_UI.empty}</span>
        )}
      </div>
      {inBag.length > 0 ? (
        <div className="held-choices">
          {inBag.map((item) => (
            <button key={item.id} type="button" className="item-slot" title={ITEM_TEXT[item.id].description} onClick={() => report(store.run((s) => equipItem(s, uid, item.id)))}>
              <ItemIcon id={item.id} size={22} />
              <span>{itemCount(state, item.id)}</span>
              <small>{ITEM_TEXT[item.id].name}</small>
            </button>
          ))}
        </div>
      ) : (
        <p className="muted small">
          {HELD_UI.none}{" "}
          <button type="button" className="link-button" onClick={() => open({ kind: "shop" })}>
            {HELD_UI.toShop}
          </button>
        </p>
      )}
    </div>
  );
}
