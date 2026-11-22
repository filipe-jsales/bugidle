import { useState } from "react";
import { audio } from "../../audio/audioEngine";
import { defaultAudioSettings, type AudioSettings } from "../../audio/settings";
import { UI } from "../../i18n/ptBR";
import { PREFERENCE_TEXT, SETTINGS_UI } from "../../i18n/settings.ptBR";
import { useApp, type SettingsTab } from "../appContext";
import { Button, Icon, Modal } from "../components/primitives";
import type { IconName } from "../render/icons";
import { resetPreferences, setPreference, usePreferences, type PreferenceKey } from "../preferences";
import { APP_VERSION } from "../version";

const S = SETTINGS_UI;

const TABS: { id: SettingsTab; icon: IconName }[] = [
  { id: "audio", icon: "sound" },
  { id: "interactivity", icon: "map" },
  { id: "hud", icon: "bugdex" },
  { id: "performance", icon: "reboot" },
  { id: "support", icon: "save" },
];

const KEYS: Record<Exclude<SettingsTab, "support">, PreferenceKey[]> = {
  audio: ["shinySound", "captureSound", "rareDropSound", "achievementSound"],
  interactivity: ["immersive", "sceneTransparency", "timeLighting"],
  hud: ["nameplates", "hideAchievementToasts", "nightMode", "phoneLayout"],
  performance: ["optimized", "economy", "keepScreenOn", "ultraEconomy"],
};

/** The pixel ON/OFF switch used by every row. */
function Switch({ on, label, onToggle }: { on: boolean; label: string; onToggle: () => void }) {
  return (
    <button type="button" role="switch" aria-checked={on} aria-label={label} className={`switch ${on ? "on" : ""}`} onClick={onToggle}>
      <span className="switch-text">{on ? S.on : S.off}</span>
      <span className="switch-knob" />
    </button>
  );
}

/** A row like "Som de shiny  (?)  [ON]"; the "?" opens the explanation under the label. */
function SettingRow({ id }: { id: PreferenceKey }) {
  const prefs = usePreferences();
  const [help, setHelp] = useState(false);
  const on = prefs[id];
  const text = PREFERENCE_TEXT[id];
  return (
    <div className={`setting-row ${on ? "on" : ""}`}>
      <div className="setting-label">
        <span>{text.label}</span>
        <button type="button" className="help-dot" aria-label={S.help} aria-expanded={help} onClick={() => setHelp((h) => !h)}>
          ?
        </button>
      </div>
      <Switch on={on} label={text.label} onToggle={() => setPreference(id, !on)} />
      {help && <p className="setting-help small">{text.help}</p>}
    </div>
  );
}

function VolumeSlider({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) {
  return (
    <label className="slider-row wide">
      <span>{label}</span>
      <input type="range" min={0} max={100} step={5} value={Math.round(value * 100)} onChange={(e) => onChange(Number(e.target.value) / 100)} />
      <span>{Math.round(value * 100)}%</span>
    </label>
  );
}

function Volumes() {
  const [settings, setSettings] = useState<AudioSettings>(audio?.settings ?? defaultAudioSettings());
  const set = (patch: Partial<AudioSettings>) => {
    audio?.update(patch);
    setSettings((s) => ({ ...s, ...patch }));
  };
  return (
    <div className="setting-volumes">
      <div className={`setting-row ${settings.muted ? "on" : ""}`}>
        <div className="setting-label">
          <span>{UI.sound.mute}</span>
        </div>
        <Switch on={settings.muted} label={UI.sound.mute} onToggle={() => set({ muted: !settings.muted })} />
      </div>
      <VolumeSlider label={UI.sound.master} value={settings.master} onChange={(master) => set({ master })} />
      <VolumeSlider label={UI.sound.music} value={settings.music} onChange={(music) => set({ music })} />
      <VolumeSlider label={UI.sound.sfx} value={settings.sfx} onChange={(sfx) => set({ sfx })} />
      <Button variant="dark" small onClick={() => audio?.play("levelUp")}>
        {UI.sound.test}
      </Button>
    </div>
  );
}

function Support() {
  const { open, toast } = useApp();
  return (
    <div className="setting-support">
      <p className="setting-version">{S.support.version(APP_VERSION)}</p>
      <p className="small">{S.support.saveHint}</p>
      <Button variant="gold" onClick={() => open({ kind: "save" })}>
        <Icon name="save" size={14} /> {S.support.openSave}
      </Button>
      <Button
        variant="dark"
        onClick={() => {
          resetPreferences();
          toast(S.support.resetDone);
        }}
      >
        {S.support.reset}
      </Button>
      <p className="small">
        {S.support.report}{" "}
        <a href={`https://${S.support.reportLink}`} target="_blank" rel="noreferrer">
          {S.support.reportLink}
        </a>
      </p>
      <p className="small muted">{S.support.shortcuts}</p>
    </div>
  );
}

export function SettingsModal({ initialTab = "audio" }: { initialTab?: SettingsTab }) {
  const { close } = useApp();
  const [tab, setTab] = useState<SettingsTab>(initialTab);
  return (
    <Modal title={S.title} onClose={close}>
      <div className="settings-tabs" role="tablist">
        {TABS.map((t) => (
          <button key={t.id} type="button" role="tab" aria-selected={tab === t.id} className={`settings-tab ${tab === t.id ? "active" : ""}`} onClick={() => setTab(t.id)}>
            <Icon name={t.icon} size={22} />
            <span>{S.tabs[t.id]}</span>
          </button>
        ))}
      </div>
      <div className="settings-panel">
        {tab === "support" ? (
          <Support />
        ) : (
          <>
            {KEYS[tab].map((key) => (
              <SettingRow key={key} id={key} />
            ))}
            {tab === "audio" && (
              <>
                <h4 className="settings-subtitle">{S.volumes}</h4>
                <Volumes />
              </>
            )}
          </>
        )}
      </div>
    </Modal>
  );
}
