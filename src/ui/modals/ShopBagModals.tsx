import { equipItem } from "../../game/held";
import { useState } from "react";
import { maxHp } from "../../game/bug";
import { ITEMS, itemsOfCategory, type ItemCategory, type ItemId } from "../../game/data/items";
import { getSpecies } from "../../game/data/species";
import { buyItem, itemCount, useItemOnBug } from "../../game/inventory";
import { BUG_TYPES } from "../../game/types";
import { CATEGORY_NAMES, ITEM_TEXT, stoneName, UI } from "../../i18n/ptBR";
import { stoneIconUrl } from "../render/icons";
import { useApp } from "../appContext";
import { formatNumber } from "../format";
import { BugSprite, Button, Icon, ItemIcon, Modal, Tag } from "../components/primitives";
import { store, useGame } from "../store";

const CATEGORIES: ItemCategory[] = ["trap", "potion", "revive", "vitamin", "evolution", "held", "egg"];
const QUANTITIES = [1, 10, 50];

export function ShopModal() {
  const state = useGame();
  const { close, report, toast } = useApp();
  const [category, setCategory] = useState<ItemCategory>("trap");
  return (
    <Modal
      title={UI.nav.shop.toUpperCase()}
      onClose={close}
      wide
      headerExtra={
        <span className="coin-label">
          <Icon name="coin" size={16} /> {formatNumber(state.coins)}
        </span>
      }
    >
      <div className="segmented">
        {CATEGORIES.map((c) => (
          <button key={c} type="button" className={category === c ? "active" : ""} onClick={() => setCategory(c)}>
            {CATEGORY_NAMES[c]}
          </button>
        ))}
      </div>
      <div className="shop-list">
        {itemsOfCategory(category).map((item) => (
          <div key={item.id} className="shop-row">
            <div className="item-preview">
              <ItemIcon id={item.id} size={48} />
            </div>
            <div className="shop-row-info">
              <strong>{ITEM_TEXT[item.id].name}</strong>
              <span className="muted small">{ITEM_TEXT[item.id].description}</span>
              <span className="small">
                {UI.owned}: {itemCount(state, item.id)}
              </span>
            </div>
            <span className="price">
              <Icon name="coin" size={14} /> {formatNumber(item.price)}
            </span>
            <div className="shop-row-buttons">
              {QUANTITIES.map((q) => (
                <Button
                  key={q}
                  small
                  variant="gold"
                  disabled={state.coins < item.price * q}
                  onClick={() => {
                    if (report(store.run((s) => buyItem(s, item.id, q)))) toast(`+${q} ${ITEM_TEXT[item.id].name}`);
                  }}
                >
                  x{q}
                </Button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </Modal>
  );
}

export function BagModal() {
  const state = useGame();
  const { close, report, toast } = useApp();
  const [selected, setSelected] = useState<ItemId | null>(null);
  const owned = (Object.keys(ITEMS) as ItemId[]).filter((id) => itemCount(state, id) > 0);
  const usable = selected && ITEMS[selected].category !== "trap" && ITEMS[selected].category !== "egg";
  const bugs = Object.values(state.bugs).sort((a, b) => Number(state.team.includes(b.uid)) - Number(state.team.includes(a.uid)));

  return (
    <Modal title={UI.nav.bag.toUpperCase()} onClose={close} wide>
      <section className="subpanel">
        <h4>{UI.bagStones}</h4>
        <div className="stone-grid">
          {BUG_TYPES.map((type) => (
            <span key={type} className="stone-chip">
              <img className="pixel" src={stoneIconUrl(type)} width={24} height={24} alt="" />
              {stoneName(type)} <strong>x{state.stones[type] ?? 0}</strong>
            </span>
          ))}
        </div>
      </section>
      {owned.length === 0 ? (
        <p className="muted">{UI.bag.empty}</p>
      ) : (
        <div className="bag-layout">
          <div className="bag-items">
            {CATEGORIES.filter((cat) => owned.some((id) => ITEMS[id].category === cat)).map((cat) => (
              <section key={cat} className="bag-group">
                <h5>{CATEGORY_NAMES[cat]}</h5>
                {owned
                  .filter((id) => ITEMS[id].category === cat)
                  .map((id) => (
                    <button key={id} type="button" className={`bag-item ${selected === id ? "active" : ""}`} onClick={() => setSelected(id)}>
                      <ItemIcon id={id} size={28} />
                      <strong>{ITEM_TEXT[id].name}</strong>
                      <span className="bag-count">x{itemCount(state, id)}</span>
                    </button>
                  ))}
              </section>
            ))}
          </div>
          <div className="bag-targets">
            {!selected ? (
              <div className="bag-placeholder">
                <Icon name="bag" size={48} />
                <p className="muted small">{UI.bag.pick}</p>
              </div>
            ) : (
              <>
                <div className="bag-detail">
                  <ItemIcon id={selected} size={48} />
                  <div>
                    <strong>{ITEM_TEXT[selected].name}</strong>
                    <small className="muted">
                      {CATEGORY_NAMES[ITEMS[selected].category]} · x{itemCount(state, selected)}
                    </small>
                    <p className="small">{ITEM_TEXT[selected].description}</p>
                  </div>
                </div>
                {ITEMS[selected].category === "trap" &&
                  (state.settings.preferredTrap === selected ? (
                    <Tag tone="green">{UI.bag.isPreferred}</Tag>
                  ) : (
                    <Button variant="purple" small onClick={() => store.update((s) => (s.settings.preferredTrap = selected))}>
                      {UI.bag.makePreferred}
                    </Button>
                  ))}
              </>
            )}
            {usable && (
              <>
                <p className="muted small">{UI.bag.chooseBug}</p>
                <div className="bag-bug-list">
                  {bugs.map((bug) => (
                    <button
                      key={bug.uid}
                      type="button"
                      className="bag-bug"
                      onClick={() => {
                        if (report(store.run((s) => (ITEMS[selected].category === "held" ? equipItem(s, bug.uid, selected) : useItemOnBug(s, selected, bug.uid))))) toast(`${ITEM_TEXT[selected].name}: ${getSpecies(bug.speciesId).name}`);
                      }}
                    >
                      <BugSprite speciesId={bug.speciesId} shiny={bug.shiny} size={32} />
                      <span>
                        {getSpecies(bug.speciesId).name} {UI.level} {bug.level}
                      </span>
                      <small className="muted">
                        {bug.currentHp}/{maxHp(bug)}
                      </small>
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </Modal>
  );
}
