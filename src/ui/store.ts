import { useSyncExternalStore } from "react";
import { tick, type GameEvent } from "../game/engine";
import type { ActionResult } from "../game/result";
import { defaultRng, type Rng } from "../game/rng";
import { importSave, loadFromStorage, saveToStorage, STORAGE_KEY, type KeyValueStorage } from "../game/save";
import { createInitialState, type GameState } from "../game/state";
import { describeEvent, type LogLine } from "./format";

const TICK_MS = 100;
const AUTOSAVE_MS = 10_000;
/** Simulate at most this much after the tab was hidden (offline progress is in the backlog). */
const MAX_CATCH_UP_MS = 60_000;
const LOG_LIMIT = 80;

export interface TimedEvent {
  id: number;
  /** performance.now() when the event happened, for animations. */
  at: number;
  event: GameEvent;
}

/**
 * Owns the game state and the clock. The engine mutates the state in place;
 * the store bumps a version number so React re-renders.
 */
export class GameStore {
  state: GameState;
  log: LogLine[] = [];
  /** Recent events for animations (attacks, captures). */
  recent: TimedEvent[] = [];
  private version = 0;
  private nextId = 1;
  private listeners = new Set<() => void>();

  constructor(
    private readonly storage: KeyValueStorage | null,
    private readonly rng: Rng = defaultRng,
  ) {
    this.state = (storage && loadFromStorage(storage)) || createInitialState();
  }

  subscribe = (listener: () => void): (() => void) => {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  };

  getVersion = (): number => this.version;

  private emit(): void {
    this.version += 1;
    this.listeners.forEach((l) => l());
  }

  /** Runs a player command against the state and re-renders. */
  run(command: (state: GameState, rng: Rng) => ActionResult): ActionResult {
    const result = command(this.state, this.rng);
    this.emit();
    return result;
  }

  /** For commands that cannot fail (settings changes). */
  update(mutator: (state: GameState) => void): void {
    mutator(this.state);
    this.emit();
  }

  advance(dtMs: number): void {
    const events = tick(this.state, Math.min(dtMs, MAX_CATCH_UP_MS), this.rng);
    if (events.length > 0) this.record(events);
    this.emit();
  }

  private record(events: GameEvent[]): void {
    const time = new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
    const at = typeof performance === "undefined" ? Date.now() : performance.now();
    for (const event of events) {
      const id = this.nextId++;
      this.recent.push({ id, at, event });
      const line = describeEvent(event, this.state);
      if (line) this.log.unshift({ id, time, ...line });
    }
    if (this.recent.length > 40) this.recent = this.recent.slice(-40);
    if (this.log.length > LOG_LIMIT) this.log.length = LOG_LIMIT;
  }

  save(): void {
    if (this.storage) saveToStorage(this.storage, this.state);
  }

  /** Replaces the whole game from exported text. Throws SaveError on bad input. */
  importText(text: string): void {
    this.state = importSave(text);
    this.log = [];
    this.recent = [];
    this.save();
    this.emit();
  }

  reset(): void {
    this.storage?.removeItem(STORAGE_KEY);
    this.state = createInitialState();
    this.log = [];
    this.recent = [];
    this.emit();
  }

  /** Starts the game clock and autosave. Returns a stop function. */
  start(): () => void {
    let last = performance.now();
    const clock = window.setInterval(() => {
      const now = performance.now();
      this.advance(now - last);
      last = now;
    }, TICK_MS);
    const autosave = window.setInterval(() => this.save(), AUTOSAVE_MS);
    const onHide = () => this.save();
    window.addEventListener("beforeunload", onHide);
    document.addEventListener("visibilitychange", onHide);
    return () => {
      window.clearInterval(clock);
      window.clearInterval(autosave);
      window.removeEventListener("beforeunload", onHide);
      document.removeEventListener("visibilitychange", onHide);
      this.save();
    };
  }
}

function browserStorage(): KeyValueStorage | null {
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

export const store = new GameStore(typeof window === "undefined" ? null : browserStorage());

/** Subscribes the component to every state change and returns the live state. */
export function useGame(): GameState {
  useSyncExternalStore(store.subscribe, store.getVersion);
  return store.state;
}
