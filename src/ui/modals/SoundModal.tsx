import { useState } from "react";
import { audio } from "../../audio/audioEngine";
import { defaultAudioSettings, type AudioSettings } from "../../audio/settings";
import { UI } from "../../i18n/ptBR";
import { useApp } from "../appContext";
import { Button, Modal, Toggle } from "../components/primitives";

function VolumeSlider({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) {
  return (
    <label className="slider-row wide">
      <span>{label}</span>
      <input type="range" min={0} max={100} step={5} value={Math.round(value * 100)} onChange={(e) => onChange(Number(e.target.value) / 100)} />
      <span>{Math.round(value * 100)}%</span>
    </label>
  );
}

export function SoundModal() {
  const { close } = useApp();
  const [settings, setSettings] = useState<AudioSettings>(audio?.settings ?? defaultAudioSettings());
  const set = (patch: Partial<AudioSettings>) => {
    audio?.update(patch);
    setSettings((s) => ({ ...s, ...patch }));
  };
  return (
    <Modal title={UI.sound.title} onClose={close}>
      <div className="form-col">
        <Toggle checked={settings.muted} onChange={(muted) => set({ muted })} label={UI.sound.mute} />
        <VolumeSlider label={UI.sound.master} value={settings.master} onChange={(master) => set({ master })} />
        <VolumeSlider label={UI.sound.music} value={settings.music} onChange={(music) => set({ music })} />
        <VolumeSlider label={UI.sound.sfx} value={settings.sfx} onChange={(sfx) => set({ sfx })} />
        <Button variant="dark" onClick={() => audio?.play("levelUp")}>
          {UI.sound.test}
        </Button>
        <p className="muted small">{UI.sound.hint}</p>
      </div>
    </Modal>
  );
}
