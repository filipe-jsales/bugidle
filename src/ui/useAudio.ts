import { useEffect } from "react";
import { audio } from "../audio/audioEngine";
import { soundForEvent } from "../audio/sounds";
import { getRoute } from "../game/data/world";
import type { GameState } from "../game/state";
import { getPreferences, soundAllowed, usePreferences } from "./preferences";
import { store } from "./store";

/** Name of the song for what the player is doing now. */
export function musicFor(state: GameState): string {
  if (state.activity.kind === "boss") return "boss";
  return getRoute(state.activity.routeId).regionId;
}

/** Wires game events to sound effects, unlocks audio on the first gesture and follows the region music. */
export function useAudio(state: GameState): void {
  useEffect(() => {
    const engine = audio;
    if (!engine) return;
    const unlock = () => engine.unlock();
    window.addEventListener("pointerdown", unlock);
    window.addEventListener("keydown", unlock);
    const stop = store.onEvents((events) => {
      for (const event of events) {
        const id = soundForEvent(event);
        if (id && soundAllowed(event, getPreferences())) engine.play(id);
      }
    });
    return () => {
      window.removeEventListener("pointerdown", unlock);
      window.removeEventListener("keydown", unlock);
      stop();
    };
  }, []);

  const song = musicFor(state);
  useEffect(() => {
    audio?.setMusic(song);
  }, [song]);

  const ultra = usePreferences().ultraEconomy;
  useEffect(() => {
    if (audio) audio.musicOff = ultra;
  }, [ultra]);
}
