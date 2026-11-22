import { buildTrack, midiToFreq, stepSeconds } from "./music";
import { clampVolume, defaultAudioSettings, parseAudioSettings } from "./settings";
import { SOUND_IDS, SOUNDS, soundForEvent, soundLength } from "./sounds";

describe("sound effects", () => {
  it("every sound has tones with sane values", () => {
    for (const id of SOUND_IDS) {
      expect(SOUNDS[id].length).toBeGreaterThan(0);
      for (const tone of SOUNDS[id]) {
        expect(tone.volume).toBeGreaterThan(0);
        expect(tone.volume).toBeLessThanOrEqual(1);
        expect(tone.duration).toBeGreaterThan(0);
        if (tone.wave !== "noise") expect(tone.freq).toBeGreaterThan(20);
      }
      expect(soundLength(id)).toBeLessThan(1.5);
    }
  });

  it("maps events to sounds", () => {
    const attack = { type: "attack", side: "player", attackerUid: "a", defenderUid: "b", moveId: "syntax-1", damage: 5, effectiveness: 1, critical: false } as const;
    expect(soundForEvent(attack)).toBe("hit");
    expect(soundForEvent({ ...attack, effectiveness: 2 })).toBe("hitSuper");
    expect(soundForEvent({ ...attack, critical: true })).toBe("crit");
    expect(soundForEvent({ ...attack, effectiveness: 0 })).toBe("immune");
    expect(soundForEvent({ ...attack, side: "enemy" })).toBe("hurt");
    expect(soundForEvent({ type: "captureAttempt", itemId: "breakpoint", speciesId: "typobit", success: true })).toBe("capture");
    expect(soundForEvent({ type: "badge", badgeId: "badge-localhost", coins: 1 })).toBe("fanfare");
    expect(soundForEvent({ type: "encounter", speciesId: "typobit", level: 2, shiny: false })).toBeNull();
    expect(soundForEvent({ type: "encounter", speciesId: "typobit", level: 2, shiny: true })).toBe("shiny");
    expect(soundForEvent({ type: "outcome", outcome: "won" })).toBeNull();
  });
});

describe("music", () => {
  it("builds a deterministic loop per region", () => {
    expect(buildTrack("localhost")).toEqual(buildTrack("localhost"));
    expect(buildTrack("localhost")).not.toEqual(buildTrack("legacy"));
  });

  it("keeps every note inside the loop and in a playable range", () => {
    for (const name of ["localhost", "staging", "production", "legacy", "cloud", "boss"]) {
      const track = buildTrack(name);
      expect(track.notes.some((n) => n.channel === "lead")).toBe(true);
      expect(track.notes.some((n) => n.channel === "bass")).toBe(true);
      for (const note of track.notes) {
        expect(note.step).toBeGreaterThanOrEqual(0);
        expect(note.step + note.length).toBeLessThanOrEqual(track.steps);
        if (note.channel !== "drum") {
          expect(note.midi).toBeGreaterThan(24);
          expect(note.midi).toBeLessThan(96);
        }
      }
    }
  });

  it("the boss theme is faster", () => {
    expect(buildTrack("boss").bpm).toBeGreaterThan(buildTrack("localhost").bpm);
    expect(stepSeconds(buildTrack("boss"))).toBeLessThan(stepSeconds(buildTrack("localhost")));
  });

  it("converts MIDI to Hz", () => {
    expect(midiToFreq(69)).toBe(440);
    expect(midiToFreq(81)).toBeCloseTo(880);
  });
});

describe("audio settings", () => {
  it("clamps volumes and parses stored values safely", () => {
    expect(clampVolume(2)).toBe(1);
    expect(clampVolume(-1)).toBe(0);
    expect(clampVolume(Number.NaN)).toBe(0);
    expect(parseAudioSettings(null)).toEqual(defaultAudioSettings());
    expect(parseAudioSettings("garbage")).toEqual(defaultAudioSettings());
    expect(parseAudioSettings(JSON.stringify({ master: 0.3, music: 5, sfx: "x", muted: true }))).toEqual({
      ...defaultAudioSettings(),
      master: 0.3,
      music: 1,
      muted: true,
    });
  });
});
