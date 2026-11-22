/**
 * Plays the chiptune data with the Web Audio API. Browser-only.
 * Browsers block audio until the first click/key press, so `unlock()` is wired
 * to the first user gesture.
 */
import { buildTrack, midiToFreq, stepSeconds, type Track } from "./music";
import { AUDIO_STORAGE_KEY, clampVolume, parseAudioSettings, type AudioSettings } from "./settings";
import { SOUNDS, type SoundId, type Tone } from "./sounds";

const LOOKAHEAD_S = 0.25;
const SCHEDULER_MS = 60;
/** Minimum gap between two plays of the same sound, so fast fights do not turn into noise. */
const MIN_GAP_S: Partial<Record<SoundId, number>> = { hit: 0.09, hurt: 0.09, hitSuper: 0.09, crit: 0.09, coin: 0.25, heal: 0.4 };
const CHANNEL_VOLUME = { lead: 0.16, bass: 0.22, drum: 0.12 } as const;

export class AudioEngine {
  settings: AudioSettings;
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private musicBus: GainNode | null = null;
  private sfxBus: GainNode | null = null;
  private noise: AudioBuffer | null = null;
  private lastPlayed = new Map<SoundId, number>();
  private track: Track | null = null;
  private trackName: string | null = null;
  private nextStep = 0;
  private nextStepTime = 0;
  private timer: number | null = null;

  constructor(private readonly storage: Storage | null) {
    this.settings = parseAudioSettings(storage?.getItem(AUDIO_STORAGE_KEY) ?? null);
  }

  /** Creates the AudioContext on the first user gesture. */
  unlock(): void {
    if (this.ctx) {
      void this.ctx.resume();
      return;
    }
    const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctor) return;
    const ctx = new Ctor();
    this.ctx = ctx;
    this.master = ctx.createGain();
    this.musicBus = ctx.createGain();
    this.sfxBus = ctx.createGain();
    this.musicBus.connect(this.master);
    this.sfxBus.connect(this.master);
    this.master.connect(ctx.destination);
    this.noise = this.createNoise(ctx);
    this.applyVolumes();
    if (this.trackName) this.startTrack(this.trackName, true);
  }

  update(patch: Partial<AudioSettings>): void {
    this.settings = {
      ...this.settings,
      ...patch,
      master: clampVolume(patch.master ?? this.settings.master),
      music: clampVolume(patch.music ?? this.settings.music),
      sfx: clampVolume(patch.sfx ?? this.settings.sfx),
    };
    try {
      this.storage?.setItem(AUDIO_STORAGE_KEY, JSON.stringify(this.settings));
    } catch {
      // storage full or blocked: volumes still apply for this session
    }
    this.applyVolumes();
  }

  play(id: SoundId): void {
    const ctx = this.ctx;
    if (!ctx || !this.sfxBus || this.settings.muted || this.settings.sfx === 0) return;
    const now = ctx.currentTime;
    const gap = MIN_GAP_S[id] ?? 0.03;
    if (now - (this.lastPlayed.get(id) ?? -1) < gap) return;
    this.lastPlayed.set(id, now);
    for (const tone of SOUNDS[id]) this.scheduleTone(tone, now + tone.at, this.sfxBus);
  }

  /** Silences the music without touching the saved volume (ULTRA economy mode). */
  musicOff = false;

  /** Switches the background loop ("localhost", ..., "boss"). Same name = no restart. */
  setMusic(name: string): void {
    if (name === this.trackName) return;
    this.trackName = name;
    if (this.ctx) this.startTrack(name, false);
  }

  private startTrack(name: string, force: boolean): void {
    if (!this.ctx) return;
    if (!force && this.track && this.trackName !== name) {
      // short fade between songs
      this.musicBus?.gain.setTargetAtTime(0, this.ctx.currentTime, 0.08);
      window.setTimeout(() => this.applyVolumes(), 250);
    }
    this.track = buildTrack(name);
    this.nextStep = 0;
    this.nextStepTime = this.ctx.currentTime + 0.3;
    if (this.timer === null) this.timer = window.setInterval(() => this.scheduleMusic(), SCHEDULER_MS);
  }

  private scheduleMusic(): void {
    const ctx = this.ctx;
    const track = this.track;
    if (!ctx || !track || !this.musicBus) return;
    const step = stepSeconds(track);
    while (this.nextStepTime < ctx.currentTime + LOOKAHEAD_S) {
      if (!this.settings.muted && this.settings.music > 0 && !this.musicOff) {
        for (const note of track.notes) {
          if (note.step !== this.nextStep) continue;
          const duration = note.length * step * 0.9;
          if (note.channel === "drum") {
            const freq = [8000, 1800, 90][note.midi] ?? 8000;
            this.scheduleTone({ at: 0, duration: note.midi === 0 ? 0.03 : 0.09, freq, wave: note.midi === 2 ? "sine" : "noise", volume: CHANNEL_VOLUME.drum * (note.midi === 2 ? 3 : 1), slideTo: note.midi === 2 ? 40 : undefined }, this.nextStepTime, this.musicBus);
          } else {
            this.scheduleTone({ at: 0, duration, freq: midiToFreq(note.midi), wave: note.channel === "lead" ? "square" : "triangle", volume: CHANNEL_VOLUME[note.channel] }, this.nextStepTime, this.musicBus);
          }
        }
      }
      this.nextStep = (this.nextStep + 1) % track.steps;
      this.nextStepTime += step;
    }
  }

  private scheduleTone(tone: Tone, start: number, bus: GainNode): void {
    const ctx = this.ctx!;
    const gain = ctx.createGain();
    const end = start + tone.duration;
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.exponentialRampToValueAtTime(tone.volume, start + 0.005);
    gain.gain.exponentialRampToValueAtTime(0.0001, end);
    gain.connect(bus);
    let source: AudioScheduledSourceNode;
    if (tone.wave === "noise") {
      const buffer = ctx.createBufferSource();
      buffer.buffer = this.noise;
      const filter = ctx.createBiquadFilter();
      filter.type = "highpass";
      filter.frequency.value = tone.freq > 0 ? tone.freq : 1000;
      buffer.connect(filter);
      filter.connect(gain);
      source = buffer;
    } else {
      const osc = ctx.createOscillator();
      osc.type = tone.wave;
      osc.frequency.setValueAtTime(tone.freq, start);
      if (tone.slideTo) osc.frequency.exponentialRampToValueAtTime(tone.slideTo, end);
      osc.connect(gain);
      source = osc;
    }
    source.start(start);
    source.stop(end + 0.02);
    source.onended = () => gain.disconnect();
  }

  private applyVolumes(): void {
    if (!this.ctx || !this.master || !this.musicBus || !this.sfxBus) return;
    const t = this.ctx.currentTime;
    this.master.gain.setTargetAtTime(this.settings.muted ? 0 : this.settings.master, t, 0.02);
    this.musicBus.gain.setTargetAtTime(this.settings.music, t, 0.02);
    this.sfxBus.gain.setTargetAtTime(this.settings.sfx, t, 0.02);
  }

  private createNoise(ctx: AudioContext): AudioBuffer {
    const buffer = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
    return buffer;
  }
}

function browserStorage(): Storage | null {
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

export const audio: AudioEngine | null = typeof window === "undefined" ? null : new AudioEngine(browserStorage());
