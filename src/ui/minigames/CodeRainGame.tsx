import { useEffect, useMemo, useRef, useState } from "react";
import { createRain, rainOver, rainScore, stepRain, typeKey, type RainState } from "../../game/minigames/typeRain";
import { createSeededRng } from "../../game/rng";
import { RAIN_UI, RAIN_WORDS } from "../../i18n/rainWords.ptBR";
import { Button } from "../components/primitives";
import { freshSeed, GameBar, GameResult, useRound, type GameProps } from "./shared";

const POOL = Object.keys(RAIN_WORDS);

export function CodeRainGame({ onExit }: GameProps) {
  const [round, again] = useRound();
  const rain = useRef<RainState>(createRain());
  const rng = useMemo(() => createSeededRng(freshSeed()), [round]);
  const [started, setStarted] = useState(false);
  const [over, setOver] = useState(false);
  const [booms, setBooms] = useState<{ id: number; x: number; y: number }[]>([]);
  const [, setFrame] = useState(0);
  const field = useRef<HTMLDivElement>(null);

  // the rain moves at the screen's frame rate
  useEffect(() => {
    if (!started || over) return;
    let last = performance.now();
    let raf = 0;
    const loop = (now: number) => {
      stepRain(rain.current, Math.min(0.1, (now - last) / 1000), rng, POOL);
      last = now;
      if (rainOver(rain.current)) setOver(true);
      setFrame((f) => (f + 1) % 1_000_000);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [started, over, rng]);

  useEffect(() => {
    if (!started || over) return;
    field.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key.length !== 1 || !/[a-z]/i.test(e.key)) return;
      e.preventDefault();
      const target = rain.current.words.find((w) => w.id === rain.current.target);
      const destroyed = typeKey(rain.current, e.key);
      if (destroyed && target) {
        const boom = { id: target.id, x: target.x, y: target.y };
        setBooms((b) => [...b, boom]);
        window.setTimeout(() => setBooms((b) => b.filter((x) => x !== boom)), 500);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [started, over]);

  const s = rain.current;
  if (over) {
    const words = [...new Set(s.destroyed)];
    return (
      <GameResult key={round} game="codeRain" points={rainScore(s)} onAgain={() => { rain.current = createRain(); setOver(false); setStarted(false); again(); }} onExit={onExit}>
        <section className="explain-box rain-words">
          <h5>{RAIN_UI.learned}</h5>
          {words.length === 0 ? (
            <p>{RAIN_UI.none}</p>
          ) : (
            <dl>
              {words.map((w) => (
                <div key={w}>
                  <dt className="mono">{w}</dt>
                  <dd>{RAIN_WORDS[w]}</dd>
                </div>
              ))}
            </dl>
          )}
        </section>
      </GameResult>
    );
  }

  const target = s.words.find((w) => w.id === s.target);
  return (
    <div className="mini-game">
      <GameBar game="codeRain" score={rainScore(s)} clock={RAIN_UI.lives(s.lives)} />
      {!started ? (
        <>
          <p className="game-help small">{RAIN_UI.intro}</p>
          <Button variant="gold" onClick={() => setStarted(true)}>
            {RAIN_UI.start}
          </Button>
        </>
      ) : (
        <div ref={field} className="rain-field" tabIndex={0} aria-label={RAIN_UI.typeHere}>
          {s.words.map((w) => (
            <span key={w.id} className={`rain-word ${w.id === s.target ? "locked" : ""}`} style={{ left: `${w.x * 100}%`, top: `${w.y * 100}%` }}>
              {w.id === s.target ? (
                <>
                  <b>{w.word.slice(0, s.typed)}</b>
                  {w.word.slice(s.typed)}
                </>
              ) : (
                w.word
              )}
            </span>
          ))}
          {booms.map((b) => (
            <span key={b.id} className="rain-boom" style={{ left: `${b.x * 100}%`, top: `${b.y * 100}%` }} />
          ))}
          {target && <span className="rain-laser" style={{ left: `${target.x * 100}%`, height: `${(1 - target.y) * 100}%` }} />}
          <span className="rain-ship" />
          <div className="rain-ground">
            {Array.from({ length: 3 }, (_, i) => (
              <span key={i} className={`rain-life ${i < s.lives ? "" : "lost"}`} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
