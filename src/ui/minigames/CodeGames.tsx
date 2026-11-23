import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { LANGUAGE_SNIPPETS, OUTPUT_SNIPPETS, TYPING_LINES } from "../../game/data/gameData";
import { binaryQuestion, isBinaryAnswer, typingScore } from "../../game/minigames/puzzles";
import { createSeededRng } from "../../game/rng";
import { LANGUAGE_NAMES, TRUE_FALSE } from "../../i18n/gameContent.ptBR";
import { GAMES_UI } from "../../i18n/games.ptBR";
import { CODE_UI } from "../../i18n/gamesUi.ptBR";
import { Button } from "../components/primitives";
import { freshSeed, GameBar, GameHelp, GameResult, shuffle, useCountdown, useRound, useStopwatch, type GameProps } from "./shared";

const LANGS = Object.keys(LANGUAGE_NAMES);

// ---------------------------------------------------------------- which language

export function LanguageGame({ onExit }: GameProps) {
  const [round, again] = useRound();
  const snippets = useMemo(() => shuffle(LANGUAGE_SNIPPETS).slice(0, 10), [round]);
  const [index, setIndex] = useState(0);
  const [right, setRight] = useState(0);
  const [picked, setPicked] = useState<string | null>(null);
  const snippet = snippets[index];

  if (!snippet) return <GameResult key={round} game="language" points={right * 10} onAgain={() => { setIndex(0); setRight(0); again(); }} onExit={onExit} />;
  return (
    <div className="mini-game">
      <GameBar game="language" score={right * 10} clock={CODE_UI.question(index + 1, snippets.length)} />
      <p className="lab-prompt">{CODE_UI.whichLanguage}</p>
      <pre className="lab-code">{snippet.code.join("\n")}</pre>
      <div className="choice-grid">
        {LANGS.map((lang) => (
          <button
            key={lang}
            type="button"
            className={`lab-option ${picked === null ? "" : lang === snippet.language ? "right" : lang === picked ? "wrong" : "dim"}`}
            disabled={picked !== null}
            onClick={() => {
              setPicked(lang);
              if (lang === snippet.language) setRight((r) => r + 1);
            }}
          >
            {LANGUAGE_NAMES[lang]}
          </button>
        ))}
      </div>
      {picked && (
        <>
          <p className={picked === snippet.language ? "ok-text" : "bad-text"}>{picked === snippet.language ? CODE_UI.right : CODE_UI.wrongWas(LANGUAGE_NAMES[snippet.language]!)}</p>
          <Button
            variant="gold"
            onClick={() => {
              setPicked(null);
              setIndex((i) => i + 1);
            }}
          >
            {GAMES_UI.next}
          </Button>
        </>
      )}
    </div>
  );
}

// ---------------------------------------------------------------- guess the output

export function OutputGame({ onExit }: GameProps) {
  const [round, again] = useRound();
  const snippets = useMemo(() => shuffle(OUTPUT_SNIPPETS).slice(0, 5), [round]);
  const [index, setIndex] = useState(0);
  const [right, setRight] = useState(0);
  const [answer, setAnswer] = useState<string | null>(null);
  const snippet = snippets[index];

  const submit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const input = e.currentTarget.elements.namedItem("answer") as HTMLInputElement;
    const value = input.value.trim();
    if (!value || !snippet) return;
    setAnswer(value);
    if (value.replace(/\s/g, "") === snippet.output.replace(/\s/g, "")) setRight((r) => r + 1);
  };

  if (!snippet) return <GameResult key={round} game="output" points={right * 20} onAgain={() => { setIndex(0); setRight(0); again(); }} onExit={onExit} />;
  const ok = answer !== null && answer.replace(/\s/g, "") === snippet.output.replace(/\s/g, "");
  return (
    <div className="mini-game">
      <GameBar game="output" score={right * 20} clock={CODE_UI.question(index + 1, snippets.length)} />
      <p className="lab-prompt">{CODE_UI.whatPrints}</p>
      <pre className="lab-code">{snippet.code.join("\n")}</pre>
      {answer === null ? (
        <form className="guess-form" onSubmit={submit}>
          <span className="guess-dot" />
          <input name="answer" className="guess-input mono" placeholder={CODE_UI.typeOutput} autoComplete="off" spellCheck={false} autoFocus />
          <Button variant="purple" type="submit">
            {GAMES_UI.check}
          </Button>
        </form>
      ) : (
        <>
          <p className={ok ? "ok-text" : "bad-text"}>{ok ? CODE_UI.right : CODE_UI.expected(snippet.output)}</p>
          <Button
            variant="gold"
            onClick={() => {
              setAnswer(null);
              setIndex((i) => i + 1);
            }}
          >
            {GAMES_UI.next}
          </Button>
        </>
      )}
    </div>
  );
}

// ---------------------------------------------------------------- binary rush

export function BinaryGame({ onExit }: GameProps) {
  const [round, again] = useRound();
  const rng = useMemo(() => createSeededRng(freshSeed()), [round]);
  const [question, setQuestion] = useState(() => binaryQuestion(rng));
  const [score, setScore] = useState(0);
  const [over, setOver] = useState(false);
  const [last, setLast] = useState<{ ok: boolean; answer: string } | null>(null);
  const left = useCountdown(60, !over, () => setOver(true));

  const submit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const input = e.currentTarget.elements.namedItem("answer") as HTMLInputElement;
    if (!input.value.trim()) return;
    const ok = isBinaryAnswer(question, input.value);
    setScore((s) => Math.max(0, Math.min(100, s + (ok ? 10 : -5))));
    setLast({ ok, answer: question.answer });
    setQuestion(binaryQuestion(rng));
    input.value = "";
  };

  if (over) return <GameResult key={round} game="binary" points={score} onAgain={() => { setScore(0); setOver(false); setLast(null); again(); }} onExit={onExit} />;
  return (
    <div className="mini-game">
      <GameBar game="binary" score={score} clock={GAMES_UI.time(left)} />
      <GameHelp game="binary" />
      <p className="binary-question">{CODE_UI.binaryAsk[question.kind](question.prompt)}</p>
      {last && <p className={last.ok ? "ok-text" : "bad-text"}>{last.ok ? CODE_UI.right : CODE_UI.wasAnswer(last.answer)}</p>}
      <form className="guess-form" onSubmit={submit}>
        <span className="guess-dot" />
        <input name="answer" className="guess-input mono" placeholder={CODE_UI.typeNumber} autoComplete="off" spellCheck={false} autoFocus />
        <Button variant="purple" type="submit">
          {GAMES_UI.check}
        </Button>
      </form>
      <div className="binary-cheat mono small">8 4 2 1 · 1010 = 8+2 = 10 · A=10 B=11 C=12 D=13 E=14 F=15</div>
    </div>
  );
}

// ---------------------------------------------------------------- true or false

export function TrueFalseGame({ onExit }: GameProps) {
  const [round, again] = useRound();
  const statements = useMemo(() => shuffle(TRUE_FALSE), [round]);
  const [index, setIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [over, setOver] = useState(false);
  const [last, setLast] = useState<{ ok: boolean; why: string } | null>(null);
  const left = useCountdown(60, !over, () => setOver(true));
  const statement = statements[index % statements.length]!;

  const answer = (value: boolean) => {
    const ok = value === statement.answer;
    setScore((s) => Math.max(0, Math.min(100, s + (ok ? 10 : -5))));
    setLast({ ok, why: statement.why });
    if (index + 1 >= statements.length) setOver(true);
    setIndex((i) => i + 1);
  };

  if (over) return <GameResult key={round} game="trueFalse" points={score} onAgain={() => { setScore(0); setIndex(0); setOver(false); setLast(null); again(); }} onExit={onExit} />;
  return (
    <div className="mini-game">
      <GameBar game="trueFalse" score={score} clock={GAMES_UI.time(left)} />
      <p className="tf-statement">{statement.text}</p>
      <div className="button-row tf-buttons">
        <Button variant="gold" onClick={() => answer(true)}>
          {CODE_UI.trueLabel}
        </Button>
        <Button variant="danger" onClick={() => answer(false)}>
          {CODE_UI.falseLabel}
        </Button>
      </div>
      {last && <p className={`small ${last.ok ? "ok-text" : "bad-text"}`}>{last.why}</p>}
    </div>
  );
}

// ---------------------------------------------------------------- typing race

const GHOST_KEY = "bugidle.typingGhost";

function readGhost(): number | null {
  try {
    const v = Number(window.localStorage.getItem(GHOST_KEY));
    return v > 0 ? v : null;
  } catch {
    return null;
  }
}

export function TypingGame({ onExit }: GameProps) {
  const [round, again] = useRound();
  const line = useMemo(() => TYPING_LINES[Math.floor(Math.random() * TYPING_LINES.length)]!, [round]);
  const [typed, setTyped] = useState("");
  const [started, setStarted] = useState(false);
  const [done, setDone] = useState(false);
  const seconds = useStopwatch(started && !done);
  const ghostCps = useRef(readGhost());
  const startedAt = useRef(0);
  const [, setTick] = useState(0);

  useEffect(() => {
    if (!started || done) return;
    const id = window.setInterval(() => setTick((t) => t + 1), 200);
    return () => window.clearInterval(id);
  }, [started, done]);

  const elapsed = started ? (performance.now() - startedAt.current) / 1000 : 0;
  const ghost = ghostCps.current ? Math.min(1, (elapsed * ghostCps.current) / line.length) : 0;
  const result = typingScore(line, typed, Math.max(1, done ? seconds || elapsed : elapsed));

  const onChange = (value: string) => {
    if (!started) {
      setStarted(true);
      startedAt.current = performance.now();
    }
    setTyped(value);
    if (value.length >= line.length) {
      setDone(true);
      const cps = line.length / Math.max(1, (performance.now() - startedAt.current) / 1000);
      try {
        if (!ghostCps.current || cps > ghostCps.current) window.localStorage.setItem(GHOST_KEY, String(cps));
      } catch {
        // the ghost is a nicety; without storage there is simply no ghost
      }
    }
  };

  if (done)
    return (
      <GameResult key={round} game="typing" points={result.points} onAgain={() => { setTyped(""); setStarted(false); setDone(false); ghostCps.current = readGhost(); again(); }} onExit={onExit}>
        <p className="small">{CODE_UI.typingStats(Math.round(result.wpm), Math.round(result.accuracy * 100))}</p>
      </GameResult>
    );
  return (
    <div className="mini-game">
      <GameBar game="typing" score={result.points} clock={GAMES_UI.time(Math.floor(elapsed))} />
      <GameHelp game="typing" />
      <pre className="lab-code typing-target">
        {[...line].map((ch, i) => (
          <span key={i} className={i < typed.length ? (typed[i] === ch ? "typed-ok" : "typed-bad") : i === typed.length ? "typed-next" : ""}>
            {ch}
          </span>
        ))}
      </pre>
      <div className="race">
        {ghostCps.current && (
          <div className="race-lane">
            <small>{CODE_UI.ghost}</small>
            <div className="race-bar ghost" style={{ width: `${ghost * 100}%` }} />
          </div>
        )}
        <div className="race-lane">
          <small>{CODE_UI.you}</small>
          <div className="race-bar" style={{ width: `${Math.min(1, typed.length / line.length) * 100}%` }} />
        </div>
      </div>
      <input className="guess-input typing-input mono" value={typed} onChange={(e) => onChange(e.target.value)} placeholder={CODE_UI.typeLine} autoComplete="off" spellCheck={false} autoFocus />
    </div>
  );
}
