import { useState } from "react";
import { activeEnemy } from "../../game/battle";
import { maxHp } from "../../game/bug";
import { throwTrapNow } from "../../game/engine";
import { throwAtWanderer } from "../world/roamingThrows";
import { useApp } from "../appContext";
import { isCaught } from "../../game/bugdex";
import { baseCaptureChance, MAX_THROWS_PER_ENCOUNTER, pickTrap } from "../../game/capture";
import { getSpecies } from "../../game/data/species";
import { UI } from "../../i18n/ptBR";
import { store, useGame } from "../store";
import { distance } from "../world/worldModel";
import { currentWorld } from "../world/worldRegistry";
import { Bar, BugSprite, ItemIcon, Tag } from "./primitives";

const P = UI.proximity;
const SHOWN = 4;

const startsOpen = () => typeof window === "undefined" || !window.matchMedia?.("(max-width: 760px)").matches;

/**
 * Wild bugs closest to the trainer, with the chance one trap would catch them.
 * Drawn over the battle map, bottom right, above the zoom buttons; it folds to its title.
 */
export function ProximityPanel() {
  const state = useGame();
  const { report, toast } = useApp();
  const [open, setOpen] = useState(startsOpen);
  const throwNow = () => {
    if (report(store.run(throwTrapNow))) toast(P.thrown);
  };

  const world = currentWorld();
  const trap = pickTrap(state.inventory, state.settings.preferredTrap);
  const multiplier = trap?.captureMultiplier ?? 1;
  const battle = state.runtime.battle;
  const enemy = battle && !battle.outcome ? activeEnemy(battle) : undefined;
  const nearby = world ? [...world.wanderers].sort((a, b) => distance(a.pos, world.trainer.pos) - distance(b.pos, world.trainer.pos)).slice(0, SHOWN) : [];
  const pct = (speciesId: string) => (baseCaptureChance(speciesId, multiplier) * 100).toLocaleString("pt-BR", { maximumFractionDigits: 1 });

  return (
    <div className={`proximity-overlay ${open ? "open" : "folded"}`}>
      <button type="button" className="proximity-head" onClick={() => setOpen((o) => !o)} aria-expanded={open}>
        <span className="proximity-title">{P.title}</span>
        {trap && <ItemIcon id={trap.id} size={18} />}
        <span className={`proximity-caret ${open ? "" : "up"}`} aria-hidden />
      </button>
      {open && (
        <div className="proximity-list">
          {enemy && (
            <button type="button" className="proximity-row fighting" onClick={throwNow} title={P.throwHint}>
              <BugSprite speciesId={enemy.speciesId} shiny={enemy.shiny} size={28} />
              <div className="proximity-info">
                <div className="proximity-name">
                  <strong>{getSpecies(enemy.speciesId).name}</strong>
                  <span>
                    {UI.level} {enemy.level}
                  </span>
                </div>
                <Bar kind="hp" value={enemy.currentHp} max={maxHp(enemy)} label={P.hp(enemy.currentHp, maxHp(enemy))} />
                <small className="muted">
                  {P.chance(pct(enemy.speciesId))} · {P.throwsLeft(Math.max(0, MAX_THROWS_PER_ENCOUNTER - state.runtime.captureAttemptsThisBattle))}
                </small>
              </div>
              {trap && <ItemIcon id={trap.id} size={18} />}
            </button>
          )}
          {nearby.map((w) => (
            <button key={w.id} type="button" className="proximity-row" onClick={() => world && report(throwAtWanderer(world, w))} title={P.roamingHint}>
              <BugSprite speciesId={w.speciesId} size={28} />
              <div className="proximity-info">
                <div className="proximity-name">
                  <strong>{getSpecies(w.speciesId).name}</strong>
                  {!isCaught(state, w.speciesId) && <Tag tone="gold">{P.newTag}</Tag>}
                </div>
                <Bar kind="time" value={baseCaptureChance(w.speciesId, multiplier)} max={0.35} label={P.chance(pct(w.speciesId))} />
              </div>
            </button>
          ))}
          {!enemy && nearby.length === 0 && <p className="muted small">{P.empty}</p>}
        </div>
      )}
    </div>
  );
}
