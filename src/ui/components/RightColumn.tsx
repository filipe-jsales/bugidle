import { itemsOfCategory, type ItemId } from "../../game/data/items";
import { itemCount } from "../../game/inventory";
import type { CaptureMode } from "../../game/state";
import { CAPTURE_MODE_NAMES, ITEM_TEXT, UI } from "../../i18n/ptBR";
import { store, useGame } from "../store";
import { Icon, Panel, Toggle } from "./primitives";

const MODES: CaptureMode[] = ["uncaught", "all", "shiny", "off"];

export function AutomationPanel() {
  const state = useGame();
  const { settings } = state;
  const set = (patch: Partial<typeof settings>) => store.update((s) => Object.assign(s.settings, patch));
  const traps = itemsOfCategory("trap");
  const potions = itemsOfCategory("potion");

  return (
    <Panel title={UI.automations} className="automation-panel">
      <div className="field">
        <span className="field-label">{UI.captureFilter}</span>
        <div className="segmented">
          {MODES.map((mode) => (
            <button key={mode} type="button" className={settings.captureMode === mode ? "active" : ""} onClick={() => set({ captureMode: mode })}>
              {CAPTURE_MODE_NAMES[mode]}
            </button>
          ))}
        </div>
      </div>
      <Toggle checked={settings.alwaysCaptureShiny} onChange={(v) => set({ alwaysCaptureShiny: v })} label={UI.alwaysShiny} />

      <div className="field">
        <span className="field-label">{UI.preferredTrap}</span>
        <div className="item-slots">
          {traps.map((trap) => (
            <button
              key={trap.id}
              type="button"
              title={ITEM_TEXT[trap.id].description}
              className={`item-slot ${settings.preferredTrap === trap.id ? "active" : ""}`}
              onClick={() => set({ preferredTrap: trap.id })}
            >
              <Icon name="trap" size={18} />
              <span>{itemCount(state, trap.id)}</span>
              <small>{ITEM_TEXT[trap.id].name}</small>
            </button>
          ))}
        </div>
      </div>

      <Toggle checked={settings.autoPotion} onChange={(v) => set({ autoPotion: v })} label={UI.autoPotion} />
      <div className="slider-row">
        <span className="muted">{UI.useBelow}</span>
        <input
          type="range"
          min={5}
          max={90}
          step={5}
          value={Math.round(settings.potionThreshold * 100)}
          onChange={(e) => set({ potionThreshold: Number(e.target.value) / 100 })}
        />
        <span>{Math.round(settings.potionThreshold * 100)}%</span>
      </div>
      <div className="item-slots">
        {potions.map((p) => (
          <div key={p.id} className="item-slot static" title={ITEM_TEXT[p.id as ItemId].description}>
            <span>{itemCount(state, p.id)}</span>
            <small>{ITEM_TEXT[p.id].name}</small>
          </div>
        ))}
      </div>

      <Toggle checked={settings.autoEvolve} onChange={(v) => set({ autoEvolve: v })} label={UI.autoEvolve} />
    </Panel>
  );
}

export function LogPanel() {
  useGame();
  return (
    <Panel title={UI.log} className="log-panel">
      <ol className="log-list inset">
        {store.log.map((line) => (
          <li key={line.id} className={`tone-${line.tone}`}>
            <span className="log-time">{line.time}</span> {line.text}
          </li>
        ))}
      </ol>
    </Panel>
  );
}
