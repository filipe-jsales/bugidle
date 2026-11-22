/** Volume preferences. Kept per browser (not in the game save). */
export interface AudioSettings {
  master: number;
  music: number;
  sfx: number;
  muted: boolean;
}

export const AUDIO_STORAGE_KEY = "bugidle.audio";

export function defaultAudioSettings(): AudioSettings {
  return { master: 0.7, music: 0.5, sfx: 0.8, muted: false };
}

export function clampVolume(value: number): number {
  return Number.isFinite(value) ? Math.min(1, Math.max(0, value)) : 0;
}

export function parseAudioSettings(text: string | null): AudioSettings {
  const defaults = defaultAudioSettings();
  if (!text) return defaults;
  try {
    const raw = JSON.parse(text) as Record<string, unknown>;
    const volume = (v: unknown, fallback: number) => (typeof v === "number" ? clampVolume(v) : fallback);
    return {
      master: volume(raw.master, defaults.master),
      music: volume(raw.music, defaults.music),
      sfx: volume(raw.sfx, defaults.sfx),
      muted: typeof raw.muted === "boolean" ? raw.muted : defaults.muted,
    };
  } catch {
    return defaults;
  }
}
