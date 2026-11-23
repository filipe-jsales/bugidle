import { useMemo, useState, type FormEvent } from "react";
import {
  buildCrossword,
  buildMemoryDeck,
  buildWordSearch,
  crossCells,
  HANGMAN_LIVES,
  hangmanMask,
  hangmanState,
  lettersOnly,
  memoryScore,
  scramble,
  wordBetween,
  type Cell,
} from "../../game/minigames/puzzles";
import { MEMORY_PAIRS, TERM_CLUES, WORD_POOL } from "../../i18n/gameContent.ptBR";
import { GAMES_UI } from "../../i18n/games.ptBR";
import { WORD_UI } from "../../i18n/gamesUi.ptBR";
import { Button } from "../components/primitives";
import { freshSeed, GameBar, GameHelp, GameResult, useCountdown, useRound, useStopwatch, type GameProps } from "./shared";

// ---------------------------------------------------------------- word search

export function WordSearchGame({ onExit }: GameProps) {
  const [round, again] = useRound();
  const ws = useMemo(() => buildWordSearch(WORD_POOL, 8, 10, freshSeed()), [round]);
  const [found, setFound] = useState<string[]>([]);
  const [start, setStart] = useState<Cell | null>(null);
  const [done, setDone] = useState(false);
  const seconds = useStopwatch(!done);
  const foundCells = new Set(ws.words.filter((w) => found.includes(w.word)).flatMap((w) => w.cells.map((c) => `${c.r},${c.c}`)));

  const click = (cell: Cell) => {
    if (!start) return setStart(cell);
    const word = wordBetween(ws, start, cell);
    setStart(null);
    if (word && !found.includes(word)) {
      const next = [...found, word];
      setFound(next);
      if (next.length === ws.words.length) setDone(true);
    }
  };
  const points = Math.round((found.length / ws.words.length) * 80 + (found.length === ws.words.length ? Math.max(0, 20 - Math.floor(seconds / 15)) : 0));

  if (done) return <GameResult key={round} game="wordSearch" points={points} onAgain={() => { setFound([]); setDone(false); again(); }} onExit={onExit} />;
  return (
    <div className="mini-game">
      <GameBar game="wordSearch" score={points} clock={`${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`} />
      <GameHelp game="wordSearch" />
      <div className="ws-layout">
        <div className="ws-grid" style={{ gridTemplateColumns: `repeat(${ws.size}, 1fr)` }}>
          {ws.grid.map((row, r) =>
            row.map((ch, c) => (
              <button
                key={`${r}-${c}`}
                type="button"
                className={`ws-cell ${foundCells.has(`${r},${c}`) ? "found" : ""} ${start && start.r === r && start.c === c ? "start" : ""}`}
                onClick={() => click({ r, c })}
              >
                {ch}
              </button>
            )),
          )}
        </div>
        <ul className="ws-words">
          {ws.words.map((w) => (
            <li key={w.word} className={found.includes(w.word) ? "found" : ""}>
              {w.word}
            </li>
          ))}
        </ul>
      </div>
      <Button variant="dark" small onClick={() => setDone(true)}>
        {GAMES_UI.finish}
      </Button>
    </div>
  );
}

// ---------------------------------------------------------------- crossword

export function CrosswordGame({ onExit }: GameProps) {
  const [round, again] = useRound();
  const cw = useMemo(() => buildCrossword(TERM_CLUES, 6, freshSeed()), [round]);
  const [typed, setTyped] = useState<Record<string, string>>({});
  const [active, setActive] = useState(0);
  const [done, setDone] = useState(false);
  const cellOwners = new Map<string, number[]>();
  cw.words.forEach((w, i) => crossCells(w).forEach(({ r, c }) => cellOwners.set(`${r},${c}`, [...(cellOwners.get(`${r},${c}`) ?? []), i])));
  const numberAt = new Map(cw.words.map((w) => [`${w.row},${w.col}`, w.number]));
  const wordDone = (i: number) => crossCells(cw.words[i]!).every(({ r, c }, k) => typed[`${r},${c}`] === cw.words[i]!.answer[k]);
  const solved = cw.words.filter((_, i) => wordDone(i)).length;
  const word = cw.words[active]!;
  const points = Math.round((solved / cw.words.length) * 100);

  const typeWord = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const input = e.currentTarget.elements.namedItem("answer") as HTMLInputElement;
    const letters = lettersOnly(input.value).slice(0, word.answer.length);
    const next = { ...typed };
    crossCells(word).forEach(({ r, c }, k) => {
      if (letters[k]) next[`${r},${c}`] = letters[k]!;
    });
    setTyped(next);
    input.value = "";
    const remaining = cw.words.findIndex((_, i) => i !== active && !crossCells(cw.words[i]!).every(({ r, c }, k) => next[`${r},${c}`] === cw.words[i]!.answer[k]));
    if (remaining >= 0) setActive(remaining);
  };

  if (done || solved === cw.words.length) return <GameResult key={round} game="crossword" points={points} onAgain={() => { setTyped({}); setDone(false); setActive(0); again(); }} onExit={onExit} />;
  return (
    <div className="mini-game">
      <GameBar game="crossword" score={points} />
      <GameHelp game="crossword" />
      <div className="cw-layout">
        <div className="cw-grid" style={{ gridTemplateColumns: `repeat(${cw.width}, 28px)` }}>
          {Array.from({ length: cw.height }, (_, r) =>
            Array.from({ length: cw.width }, (_, c) => {
              const k = `${r},${c}`;
              const owners = cellOwners.get(k);
              if (!owners) return <span key={k} className="cw-cell empty" />;
              return (
                <button key={k} type="button" className={`cw-cell ${owners.includes(active) ? "active" : ""} ${owners.some(wordDone) ? "done" : ""}`} onClick={() => setActive(owners.find((o) => o !== active) ?? owners[0]!)}>
                  {numberAt.has(k) && <sup>{numberAt.get(k)}</sup>}
                  {typed[k] ?? ""}
                </button>
              );
            }),
          )}
        </div>
        <ol className="cw-clues">
          {cw.words.map((w, i) => (
            <li key={i} className={`${i === active ? "active" : ""} ${wordDone(i) ? "done" : ""}`}>
              <button type="button" onClick={() => setActive(i)}>
                <b>
                  {w.number} {w.across ? WORD_UI.across : WORD_UI.down}
                </b>{" "}
                {w.clue} ({w.answer.length})
              </button>
            </li>
          ))}
        </ol>
      </div>
      <form className="guess-form" onSubmit={typeWord}>
        <span className="guess-dot" />
        <input name="answer" className="guess-input" placeholder={WORD_UI.typeWord(word.number, word.answer.length)} autoComplete="off" spellCheck={false} />
        <Button variant="purple" type="submit">
          {WORD_UI.write}
        </Button>
      </form>
      <Button variant="dark" small onClick={() => setDone(true)}>
        {GAMES_UI.finish}
      </Button>
    </div>
  );
}

// ---------------------------------------------------------------- hangman

const ABC = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

export function HangmanGame({ onExit }: GameProps) {
  const [round, again] = useRound();
  const entry = useMemo(() => TERM_CLUES[Math.floor(Math.random() * TERM_CLUES.length)]!, [round]);
  const word = lettersOnly(entry.answer);
  const [guessed, setGuessed] = useState<Set<string>>(new Set());
  const status = hangmanState(word, guessed);
  const over = status.solved || status.lost;
  const points = status.solved ? 40 + (HANGMAN_LIVES - status.wrong) * 10 : 0;

  return (
    <div className="mini-game">
      <GameBar game="hangman" />
      <GameHelp game="hangman" />
      <div className="hangman">
        <div className="server-rack" aria-label={WORD_UI.lives(HANGMAN_LIVES - status.wrong)}>
          {Array.from({ length: HANGMAN_LIVES }, (_, i) => (
            <span key={i} className={`rack-unit ${i < status.wrong ? "down" : ""}`} />
          ))}
          <small>{status.lost ? WORD_UI.serverDown : WORD_UI.lives(HANGMAN_LIVES - status.wrong)}</small>
        </div>
        <div className="hangman-word">
          <p className="hangman-clue">{entry.clue}</p>
          <p className="name-mask">{over ? word.split("").join(" ") : hangmanMask(word, guessed)}</p>
        </div>
      </div>
      {over ? (
        <GameResult key={round} game="hangman" points={points} onAgain={() => { setGuessed(new Set()); again(); }} onExit={onExit}>
          <p className={status.solved ? "ok-text" : "bad-text"}>{status.solved ? WORD_UI.saved : WORD_UI.answerWas(word)}</p>
        </GameResult>
      ) : (
        <div className="letter-pad">
          {ABC.map((l) => (
            <button key={l} type="button" className={`letter ${guessed.has(l) ? (word.includes(l) ? "hit" : "miss") : ""}`} disabled={guessed.has(l)} onClick={() => setGuessed(new Set([...guessed, l]))}>
              {l}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------- anagram

export function AnagramGame({ onExit }: GameProps) {
  const [round, again] = useRound();
  const words = useMemo(() => [...WORD_POOL].map(lettersOnly).filter((w) => w.length >= 4).sort(() => Math.random() - 0.5), [round]);
  const [index, setIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [over, setOver] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const left = useCountdown(60, !over, () => setOver(true));
  const word = words[index % words.length]!;
  const shown = useMemo(() => scramble(word, index * 31 + round), [word, index, round]);

  const submit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const input = e.currentTarget.elements.namedItem("answer") as HTMLInputElement;
    if (lettersOnly(input.value) === word) {
      setScore((s) => Math.min(100, s + 10));
      setFeedback(null);
      setIndex((i) => i + 1);
    } else setFeedback(WORD_UI.notIt);
    input.value = "";
  };

  if (over) return <GameResult key={round} game="anagram" points={score} onAgain={() => { setScore(0); setIndex(0); setOver(false); again(); }} onExit={onExit} />;
  return (
    <div className="mini-game">
      <GameBar game="anagram" score={score} clock={GAMES_UI.time(left)} />
      <GameHelp game="anagram" />
      <div className="anagram-tiles">
        {[...shown].map((ch, i) => (
          <span key={i} className="anagram-tile">
            {ch}
          </span>
        ))}
      </div>
      {feedback && <p className="bad-text">{feedback}</p>}
      <form className="guess-form" onSubmit={submit}>
        <span className="guess-dot" />
        <input name="answer" className="guess-input" placeholder={WORD_UI.typeAnswer} autoComplete="off" spellCheck={false} autoFocus />
        <Button variant="purple" type="submit">
          {GAMES_UI.check}
        </Button>
      </form>
      <Button variant="dark" small onClick={() => setIndex((i) => i + 1)}>
        {WORD_UI.skip}
      </Button>
    </div>
  );
}

// ---------------------------------------------------------------- memory

export function MemoryGame({ onExit }: GameProps) {
  const [round, again] = useRound();
  const deck = useMemo(() => buildMemoryDeck(MEMORY_PAIRS, 6, freshSeed()), [round]);
  const [open, setOpen] = useState<number[]>([]);
  const [matched, setMatched] = useState<Set<number>>(new Set());
  const [moves, setMoves] = useState(0);
  const pairs = deck.length / 2;

  const flip = (id: number) => {
    if (open.includes(id) || matched.has(deck[id]!.pair) || open.length === 2) return;
    const next = [...open, id];
    setOpen(next);
    if (next.length < 2) return;
    setMoves((m) => m + 1);
    const [a, b] = next.map((i) => deck[i]!);
    if (a!.pair === b!.pair) {
      setMatched(new Set([...matched, a!.pair]));
      setOpen([]);
    } else window.setTimeout(() => setOpen([]), 900);
  };

  if (matched.size === pairs) return <GameResult key={round} game="memory" points={memoryScore(pairs, moves)} onAgain={() => { setMatched(new Set()); setOpen([]); setMoves(0); again(); }} onExit={onExit} />;
  return (
    <div className="mini-game">
      <GameBar game="memory" score={memoryScore(pairs, moves)} clock={WORD_UI.moves(moves)} />
      <GameHelp game="memory" />
      <div className="memory-grid">
        {deck.map((card) => {
          const shown = open.includes(card.id) || matched.has(card.pair);
          return (
            <button key={card.id} type="button" className={`memory-card ${shown ? "shown" : ""} ${matched.has(card.pair) ? "matched" : ""}`} onClick={() => flip(card.id)}>
              {shown ? <span className={card.text.length <= 12 ? "mono" : ""}>{card.text}</span> : "?"}
            </button>
          );
        })}
      </div>
    </div>
  );
}
