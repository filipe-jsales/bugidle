import { activeEnemy } from "../../game/battle";
import { isCaught } from "../../game/bugdex";
import { baseCaptureChance, MAX_THROWS_PER_ENCOUNTER, pickTrap } from "../../game/capture";
import { getSpecies } from "../../game/data/species";
import { UI } from "../../i18n/ptBR";
import { useGame } from "../store";
import { distance } from "../world/worldModel";
import { currentWorld } from "../world/worldRegistry";
import { Bar, BugSprite, ItemIcon, Panel, Tag } from "./primitives";

const P = UI.proximity;
const SHOWN = 5;

/** Wild bugs closest to the trainer, with the chance one trap would catch them. */
export function ProximityPanel() {
  const state = useGame();
  const world = currentWorld();
  const trap = pickTrap(state.inventory, state.settings.preferredTrap);
  const multiplier = trap?.captureMultiplier ?? 1;
  const battle = state.runtime.battle;
  const enemy = battle && !battle.outcome ? activeEnemy(battle) : undefined;
  const nearby = world ? [...world.wanderers].sort((a, b) => distance(a.pos, world.trainer.pos) - distance(b.pos, world.trainer.pos)).slice(0, SHOWN) : [];
  const pct = (speciesId: string) => (baseCaptureChance(speciesId, multiplier) * 100).toLocaleString("pt-BR", { maximumFractionDigits: 1 });

  return (
    <Panel title={P.title} actions={trap ? <ItemIcon id={trap.id} size={22} /> : undefined} className="proximity-panel">
      <div className="proximity-list">
        {enemy && (
          <div className="proximity-row fighting">
            <BugSprite speciesId={enemy.speciesId} shiny={enemy.shiny} size={32} />
            <div className="proximity-info">
              <div className="proximity-name">
                <strong>{getSpecies(enemy.speciesId).name}</strong>
                <span>
                  {UI.level} {enemy.level}
                </span>
              </div>
              <Bar kind="hp" value={baseCaptureChance(enemy.speciesId, multiplier)} max={0.35} label={P.chance(pct(enemy.speciesId))} />
              <small className="muted">
                {P.fighting} · {P.throwsLeft(Math.max(0, MAX_THROWS_PER_ENCOUNTER - state.runtime.captureAttemptsThisBattle))}
              </small>
            </div>
          </div>
        )}
        {nearby.map((w) => (
          <div key={w.id} className="proximity-row">
            <BugSprite speciesId={w.speciesId} size={32} />
            <div className="proximity-info">
              <div className="proximity-name">
                <strong>{getSpecies(w.speciesId).name}</strong>
                {!isCaught(state, w.speciesId) && <Tag tone="gold">{P.newTag}</Tag>}
              </div>
              <Bar kind="time" value={baseCaptureChance(w.speciesId, multiplier)} max={0.35} label={P.chance(pct(w.speciesId))} />
            </div>
          </div>
        ))}
        {!enemy && nearby.length === 0 && <p className="muted small">{P.empty}</p>}
      </div>
    </Panel>
  );
}
