import { useEffect, useRef, useState, type ReactNode } from "react";
import { dayNumber } from "../../game/learning";
import { finishGame, type GameId } from "../../game/minigames";
import { GAME_TEXT, GAMES_UI } from "../../i18n/games.ptBR";
import { Button } from "../components/primitives";
import { formatNumber } from "../format";
import { store } from "../store";

export interface GameProps {
  /** Back to the games list. */
  onExit: () => void;
}

/** Seconds left on a countdown; calls `onEnd` once when it reaches zero. */
export function useCountdown(seconds: number, running: boolean, onEnd: () => void): number {
  const [left, setLeft] = useState(seconds);
  const ended = useRef(false);
  const end = useRef(onEnd);
  end.current = onEnd;
  useEffect(() => {
    if (!running) return;
    const id = window.setInterval(() => setLeft((s) => s - 1), 1000);
    return () => window.clearInterval(id);
  }, [running]);
  useEffect(() => {
    if (left <= 0 && running && !ended.current) {
      ended.current = true;
      end.current();
    }
  }, [left, running]);
  return Math.max(0, left);
}

/** Seconds since the component started (for speed-based scores). */
export function useStopwatch(running: boolean): number {
  const [elapsed, setElapsed] = useState(0);
  useEffect(() => {
    if (!running) return;
    const start = performance.now() - elapsed * 1000;
    const id = window.setInterval(() => setElapsed(Math.floor((performance.now() - start) / 1000)), 250);
    return () => window.clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [running]);
  return elapsed;
}

/** Header strip of a game: name, a score and an optional clock. */
export function GameBar({ game, score, clock }: { game: GameId; score?: number; clock?: string }) {
  return (
    <div className="game-bar">
      <strong>{GAME_TEXT[game].name.toUpperCase()}</strong>
      {score !== undefined && <span className="today-pill">{GAMES_UI.score(score)}</span>}
      {clock !== undefined && <span className="clue-timer">{clock}</span>}
    </div>
  );
}

export function GameHelp({ game }: { game: GameId }) {
  return <p className="game-help small">{GAME_TEXT[game].help}</p>;
}

/** Saves the play once, then shows points, coins, record and ranking place. */
export function GameResult({ game, points, onAgain, onExit, children }: { game: GameId; points: number; onAgain: () => void; onExit: () => void; children?: ReactNode }) {
  const [result, setResult] = useState<{ coins: number; best: boolean; place: number } | null>(null);
  const saved = useRef(false);
  useEffect(() => {
    if (saved.current) return;
    saved.current = true;
    store.update((s) => setResult(finishGame(s, game, points, dayNumber(new Date()))));
  }, [game, points]);
  const score = Math.max(0, Math.min(100, Math.round(points)));
  return (
    <div className="game-result">
      <span className="reveal-label">{GAMES_UI.result}</span>
      <strong className="reveal-name">{GAMES_UI.points(score)}</strong>
      {result?.best && <span className="new-best">{GAMES_UI.newBest}</span>}
      {result && <span className="reveal-reward">{result.coins > 0 ? GAMES_UI.coins(formatNumber(result.coins)) : GAMES_UI.noCoins}</span>}
      {result && <small className="muted">{GAMES_UI.place(result.place)}</small>}
      {children}
      <section className="explain-box">
        <h5>{GAMES_UI.learned}</h5>
        <p>{GAME_TEXT[game].learn}</p>
      </section>
      <div className="button-row wrap">
        <Button variant="gold" onClick={onAgain}>
          {GAMES_UI.again}
        </Button>
        <Button variant="dark" onClick={onExit}>
          {GAMES_UI.back}
        </Button>
      </div>
    </div>
  );
}

/** Restarts a game by remounting it. */
export function useRound(): [number, () => void] {
  const [round, setRound] = useState(0);
  return [round, () => setRound((r) => r + 1)];
}

/** Shuffles a copy of a list with Math.random (UI-only variety). */
export function shuffle<T>(items: readonly T[]): T[] {
  const out = [...items];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j]!, out[i]!];
  }
  return out;
}

/** A seed that changes every play. */
export const freshSeed = () => Math.floor(Math.random() * 1_000_000_000);
