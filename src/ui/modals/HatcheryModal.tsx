import { ITEMS } from "../../game/data/items";
import { getSpecies } from "../../game/data/species";
import { EGG_HATCH_MS, eggPool, eggProgress, HATCHERY_SLOTS, incubateEgg } from "../../game/hatchery";
import { buyItem, itemCount } from "../../game/inventory";
import { UI } from "../../i18n/ptBR";
import { useApp } from "../appContext";
import { formatClock, formatNumber } from "../format";
import { Bar, BugSprite, Button, ItemIcon, Modal } from "../components/primitives";
import { store, useGame } from "../store";

const H = UI.hatchery;

export function HatcheryModal() {
  const state = useGame();
  const { close, report } = useApp();
  const eggs = itemCount(state, "mysteryEgg");
  const pool = eggPool(state);
  return (
    <Modal title={H.title} onClose={close} wide>
      <p className="muted small">{H.intro}</p>
      <div className="hatchery-slots">
        {Array.from({ length: HATCHERY_SLOTS }, (_, slot) => {
          const progress = eggProgress(state, slot);
          return (
            <div key={slot} className={`hatchery-slot ${progress === null ? "empty" : ""}`}>
              <div className={progress === null ? "egg-empty" : "egg-wobble"}>
                <ItemIcon id="mysteryEgg" size={72} />
              </div>
              {progress === null ? (
                <span className="muted small">{H.emptySlot}</span>
              ) : (
                <>
                  <Bar kind="xp" value={progress} max={1} label={`${Math.floor(progress * 100)}%`} />
                  <span className="small">
                    {H.timeLeft} {formatClock(EGG_HATCH_MS * (1 - progress))}
                  </span>
                </>
              )}
            </div>
          );
        })}
      </div>
      <div className="button-row wrap">
        <Button variant="gold" disabled={eggs === 0} onClick={() => report(store.run(incubateEgg))}>
          {H.incubate} ({eggs})
        </Button>
        <Button disabled={state.coins < ITEMS.mysteryEgg.price} onClick={() => report(store.run((s) => buyItem(s, "mysteryEgg", 1)))}>
          {H.buy} · {formatNumber(ITEMS.mysteryEgg.price)}
        </Button>
      </div>
      <section className="subpanel">
        <h4>{H.poolTitle}</h4>
        <div className="tag-row">
          {pool.map((entry) => (
            <span key={entry.speciesId} className="pool-chip" title={getSpecies(entry.speciesId).name}>
              <BugSprite speciesId={entry.speciesId} size={32} />
            </span>
          ))}
        </div>
        <p className="muted small">{H.poolHint}</p>
      </section>
    </Modal>
  );
}
