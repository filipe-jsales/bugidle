/**
 * Procedural chiptune loops, one per region plus a boss theme. A track is a
 * list of notes on a 16th-note grid: square lead, triangle bass and noise drums.
 * Deterministic per seed, so every region always plays the same song.
 */
import { createSeededRng, hashString, randomInt } from "../game/rng";

export type Channel = "lead" | "bass" | "drum";

export interface Note {
  /** Position on the 16th-note grid. */
  step: number;
  /** Length in steps. */
  length: number;
  /** MIDI note number (drums: 0 = hat, 1 = snare, 2 = kick). */
  midi: number;
  channel: Channel;
}

export interface Track {
  bpm: number;
  steps: number;
  notes: Note[];
}

interface Style {
  root: number;
  scale: readonly number[];
  bpm: number;
  progression: readonly number[];
}

const MAJOR = [0, 2, 4, 5, 7, 9, 11];
const MINOR = [0, 2, 3, 5, 7, 8, 10];
const DORIAN = [0, 2, 3, 5, 7, 9, 10];

/** Each region gets its own key, mode, tempo and chord progression (scale degrees). */
const STYLES: Readonly<Record<string, Style>> = {
  localhost: { root: 60, scale: MAJOR, bpm: 118, progression: [0, 5, 3, 4] },
  staging: { root: 62, scale: DORIAN, bpm: 124, progression: [0, 3, 6, 4] },
  production: { root: 57, scale: MINOR, bpm: 132, progression: [0, 5, 2, 6] },
  legacy: { root: 55, scale: MINOR, bpm: 104, progression: [0, 3, 4, 0] },
  cloud: { root: 64, scale: MAJOR, bpm: 112, progression: [0, 3, 0, 4] },
  boss: { root: 52, scale: MINOR, bpm: 148, progression: [0, 0, 5, 6] },
};

const BAR = 16;

function degreeToMidi(style: Style, degree: number, octave = 0): number {
  const len = style.scale.length;
  const wrapped = ((degree % len) + len) % len;
  return style.root + style.scale[wrapped]! + 12 * (octave + Math.floor(degree / len));
}

export function buildTrack(name: string): Track {
  const style = STYLES[name] ?? STYLES.localhost!;
  const rng = createSeededRng(hashString(`music-${name}`));
  const notes: Note[] = [];
  const bars = style.progression.length * 2;

  for (let bar = 0; bar < bars; bar++) {
    const chord = style.progression[bar % style.progression.length]!;
    const start = bar * BAR;
    // bass: root on the beat, fifth on the off-beat
    for (let beat = 0; beat < 4; beat++) {
      notes.push({ step: start + beat * 4, length: 2, midi: degreeToMidi(style, chord, -2), channel: "bass" });
      notes.push({ step: start + beat * 4 + 2, length: 2, midi: degreeToMidi(style, chord + 4, -2), channel: "bass" });
    }
    // drums: kick on 1 and 3, snare on 2 and 4, hats on 8ths
    for (let s = 0; s < BAR; s += 2) notes.push({ step: start + s, length: 1, midi: 0, channel: "drum" });
    notes.push({ step: start, length: 2, midi: 2, channel: "drum" }, { step: start + 8, length: 2, midi: 2, channel: "drum" });
    notes.push({ step: start + 4, length: 2, midi: 1, channel: "drum" }, { step: start + 12, length: 2, midi: 1, channel: "drum" });
    // lead: chord tones with passing notes; the second half of the loop answers the first
    let s = 0;
    while (s < BAR) {
      const length = [1, 2, 2, 3, 4][randomInt(rng, 0, 4)]!;
      if (rng() < 0.18) {
        s += length;
        continue;
      }
      const chordTone = [0, 2, 4, 7][randomInt(rng, 0, 3)]!;
      const passing = rng() < 0.25 ? randomInt(rng, -1, 1) : 0;
      const octave = bar >= bars / 2 && rng() < 0.3 ? 1 : 0;
      notes.push({ step: start + s, length: Math.min(length, BAR - s), midi: degreeToMidi(style, chord + chordTone + passing, octave), channel: "lead" });
      s += length;
    }
  }
  return { bpm: style.bpm, steps: bars * BAR, notes };
}

export function midiToFreq(midi: number): number {
  return 440 * Math.pow(2, (midi - 69) / 12);
}

export function stepSeconds(track: Track): number {
  return 60 / track.bpm / 4;
}
