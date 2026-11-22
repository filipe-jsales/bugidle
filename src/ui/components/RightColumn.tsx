import { itemsOfCategory, type ItemId } from "../../game/data/items";
import { itemCount } from "../../game/inventory";
import type { CaptureMode } from "../../game/state";
import { CAPTURE_MODE_NAMES, ITEM_TEXT, UI } from "../../i18n/ptBR";
import { store, useGame } from "../store";
import { Button, ItemIcon, Panel, Toggle } from "./primitives";
import { LEARN_UI } from "../../i18n/learning.ptBR";
import { useApp } from "../appContext";

const MODES: CaptureMode[] = ["uncaught", "all", "shiny", "off"];

export function AutomationPanel() {
  const state = useGame();
  const { settings } = state;
  const set = (patch: Partial<typeof settings>) => store.update((s) => Object.assign(s.settings, patch));
  const traps = itemsOfCategory("trap");
  const potions = itemsOfCategory("potion");
  const { open } = useApp();

  return (
    <Panel
      title={UI.automations}
      className="automation-panel"
      actions={
        <Button small variant={settings.useRules ? "gold" : "dark"} onClick={() => open({ kind: "rules" })}>
          {LEARN_UI.rules.navLabel}
        </Button>
      }
    >
      {settings.useRules && <p className="small rules-on">{LEARN_UI.rules.useRulesHint}</p>}
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
              <ItemIcon id={trap.id} size={22} />
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
            <ItemIcon id={p.id} size={22} />
            <span>{itemCount(state, p.id)}</span>
            <small>{ITEM_TEXT[p.id].name}</small>
          </div>
        ))}
      </div>

      <Toggle checked={settings.autoEvolve} onChange={(v) => set({ autoEvolve: v })} label={UI.autoEvolve} />
      <Toggle checked={settings.throwUntilCaught} onChange={(v) => set({ throwUntilCaught: v })} label={UI.throwUntilCaught} hint={UI.throwUntilCaughtHint} />
      <Toggle checked={settings.autoRevive} onChange={(v) => set({ autoRevive: v })} label={`${UI.autoRevive} (${itemCount(state, "revive")})`} />
      <Toggle checked={settings.debugChallenges} onChange={(v) => set({ debugChallenges: v })} label={LEARN_UI.debug.setting} hint={LEARN_UI.debug.settingHint} />
      <Toggle checked={settings.returnToHunt} onChange={(v) => set({ returnToHunt: v })} label={UI.returnToHunt} hint={UI.returnToHuntHint} />
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
