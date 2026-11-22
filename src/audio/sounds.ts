/**
 * Chiptune sound effects as data: each sound is a few short tones. The audio
 * engine turns them into oscillators; this file stays pure and testable.
 */
import type { GameEvent } from "../game/engine";

export type Wave = "square" | "triangle" | "sawtooth" | "sine" | "noise";

export interface Tone {
  /** Seconds after the sound starts. */
  at: number;
  duration: number;
  /** Start frequency in Hz (ignored for noise). */
  freq: number;
  /** Optional end frequency for a pitch slide. */
  slideTo?: number;
  wave: Wave;
  volume: number;
}

export const SOUND_IDS = [
  "hit",
  "hitSuper",
  "crit",
  "immune",
  "hurt",
  "faint",
  "throw",
  "capture",
  "breakFree",
  "levelUp",
  "evolve",
  "coin",
  "item",
  "unlock",
  "fanfare",
  "wipe",
  "shiny",
  "bossStart",
  "heal",
  "click",
] as const;
export type SoundId = (typeof SOUND_IDS)[number];

const t = (at: number, duration: number, freq: number, wave: Wave, volume = 0.5, slideTo?: number): Tone => ({ at, duration, freq, wave, volume, slideTo });

/** Notes of an arpeggio, one after another. */
const arp = (freqs: number[], step: number, wave: Wave, volume = 0.45): Tone[] => freqs.map((f, i) => t(i * step, step * 1.1, f, wave, volume));

export const SOUNDS: Readonly<Record<SoundId, readonly Tone[]>> = {
  hit: [t(0, 0.06, 0, "noise", 0.35), t(0, 0.08, 220, "square", 0.25, 110)],
  hitSuper: [t(0, 0.09, 0, "noise", 0.45), t(0, 0.12, 330, "square", 0.35, 90), t(0.05, 0.08, 660, "square", 0.2, 330)],
  crit: [t(0, 0.1, 0, "noise", 0.5), t(0, 0.05, 880, "square", 0.3), t(0.05, 0.12, 440, "square", 0.35, 110)],
  immune: [t(0, 0.12, 180, "triangle", 0.35, 170)],
  hurt: [t(0, 0.06, 0, "noise", 0.3), t(0, 0.1, 160, "square", 0.25, 80)],
  faint: [t(0, 0.35, 440, "square", 0.3, 60)],
  throw: [t(0, 0.18, 300, "triangle", 0.35, 900)],
  capture: arp([523, 659, 784, 1047], 0.07, "square"),
  breakFree: [t(0, 0.08, 0, "noise", 0.3), t(0.02, 0.15, 500, "square", 0.25, 200)],
  levelUp: arp([392, 523, 659, 784, 1047], 0.06, "square", 0.35),
  evolve: [...arp([262, 330, 392, 523, 659, 784, 1047], 0.08, "square", 0.35), t(0.56, 0.4, 1047, "triangle", 0.4)],
  coin: [t(0, 0.05, 988, "square", 0.2), t(0.05, 0.12, 1319, "square", 0.2)],
  item: arp([659, 880, 1175], 0.06, "triangle", 0.4),
  unlock: arp([392, 494, 587, 784], 0.09, "square", 0.35),
  fanfare: [...arp([523, 523, 523, 659, 784], 0.11, "square", 0.35), t(0.55, 0.5, 1047, "square", 0.35), t(0.55, 0.5, 523, "triangle", 0.4)],
  wipe: [t(0, 0.25, 330, "square", 0.3, 220), t(0.25, 0.25, 262, "square", 0.3, 175), t(0.5, 0.5, 196, "square", 0.3, 98)],
  shiny: arp([1568, 2093, 1568, 2093, 2637], 0.05, "sine", 0.3),
  bossStart: [t(0, 0.15, 110, "sawtooth", 0.35), t(0.18, 0.15, 110, "sawtooth", 0.35), t(0.36, 0.4, 147, "sawtooth", 0.35)],
  heal: arp([523, 659, 784], 0.08, "sine", 0.35),
  click: [t(0, 0.03, 800, "square", 0.15)],
};

/** Total length of a sound in seconds. */
export function soundLength(id: SoundId): number {
  return Math.max(...SOUNDS[id].map((tone) => tone.at + tone.duration));
}

/** Which sound a game event plays (null = silent). */
export function soundForEvent(event: GameEvent): SoundId | null {
  switch (event.type) {
    case "attack":
      if (event.side === "enemy") return "hurt";
      if (event.effectiveness === 0) return "immune";
      if (event.critical) return "crit";
      return event.effectiveness > 1 ? "hitSuper" : "hit";
    case "faint":
      return "faint";
    case "captureAttempt":
      return event.success ? "capture" : "breakFree";
    case "levelUp":
      return "levelUp";
    case "evolved":
      return "evolve";
    case "rewards":
      return "coin";
    case "itemDrop":
      return "item";
    case "routeUnlocked":
      return "unlock";
    case "badge":
      return "fanfare";
    case "teamWiped":
      return "wipe";
    case "encounter":
      return event.shiny ? "shiny" : null;
    case "bossStart":
      return "bossStart";
    case "potionUsed":
    case "recovered":
      return "heal";
    default:
      return null;
  }
}
