import { useEffect, useMemo, useState } from "react";
import { getSpecies } from "../../game/data/species";
import { buildQueueQuestion, buildStackPuzzle, HASH_BUCKETS, hashBucket, queueLeavers, stackMove, stackSolved, type StackPuzzle } from "../../game/minigames/structures";
import { CHAMPION_TEXT } from "../../i18n/guild.ptBR";
import { STRUCT_UI } from "../../i18n/rainWords.ptBR";
import { BugSprite, Button } from "../components/primitives";
import { frameAt, vizFrames } from "../guildViz";
import { freshSeed, GameBar, GameResult, shuffle, useRound, type GameProps } from "./shared";

const S = STRUCT_UI;
/** Eight bugs that stand for the values 1..8 (their level is value x 5). */
const SORT_BUGS = ["typobit", "nullit", "leaklet", "offbyone", "pixelmite", "mergefly", "spinloop", "timeoutick"];
const SORT_ALGOS = ["bubbleSort", "insertionSort", "mergeSort", "quickSort", "heapSort"];
const STACK_BUGS = ["typobit", "nullit", "leaklet", "offbyone", "pixelmite"];

const name = (id: string) => getSpecies(id).name;

// ---------------------------------------------------------------- stage 1: sorting

function SortingStage({ seed, onDone }: { seed: number; onDone: (points: number) => void }) {
  const [algo, setAlgo] = useState("bubbleSort");
  const [step, setStep] = useState(0);
  const [playing, setPlaying] = useState(true);
  const [picked, setPicked] = useState<string | null>(null);
  const frames = useMemo(() => vizFrames(algo, `sort-${seed}`, 8), [algo, seed]);
  const counts = useMemo(() => Object.fromEntries(SORT_ALGOS.map((a) => [a, vizFrames(a, `sort-${seed}`, 8).length])), [seed]);
  const options = useMemo(() => shuffle(["bubbleSort", "mergeSort", "insertionSort"]), []);
  const fewest = options.reduce((a, b) => (counts[b]! < counts[a]! ? b : a));

  useEffect(() => setStep(0), [algo]);
  useEffect(() => {
    if (!playing || step >= frames.length - 1) return;
    const id = window.setTimeout(() => setStep((s) => s + 1), 260);
    return () => window.clearTimeout(id);
  }, [playing, step, frames.length]);
  const frame = frameAt(frames, frames.length > 1 ? step / (frames.length - 1) : 1);

  return (
    <div className="struct-stage">
      <p className="small">{S.sortIntro}</p>
      <div className="segmented small">
        {SORT_ALGOS.map((a) => (
          <button key={a} type="button" className={algo === a ? "active" : ""} onClick={() => setAlgo(a)}>
            {CHAMPION_TEXT[a]?.name ?? a}
          </button>
        ))}
      </div>
      <div className="sort-stage">
        {frame.bars.map((value, i) => (
          <div key={i} className={`sort-slot ${frame.active.includes(i) ? "active" : frame.done.includes(i) ? "done" : ""}`}>
            <BugSprite speciesId={SORT_BUGS[value - 1]!} size={36} animate={frame.active.includes(i)} />
            <div className="sort-bar" style={{ height: `${value * 9}px` }} />
            <small>Nv {value * 5}</small>
          </div>
        ))}
      </div>
      <div className="button-row wrap">
        <Button variant="purple" small onClick={() => setPlaying((p) => !p)}>
          {playing ? S.pause : S.play}
        </Button>
        <Button variant="dark" small onClick={() => setStep((s) => Math.min(frames.length - 1, s + 1))}>
          {S.stepBtn}
        </Button>
        <small className="muted">{S.steps(step + 1, frames.length)}</small>
      </div>
      <p className="lab-prompt">{S.sortQuestion}</p>
      <div className="choice-grid">
        {options.map((a) => (
          <button key={a} type="button" disabled={picked !== null} className={`lab-option ${picked === null ? "" : a === fewest ? "right" : a === picked ? "wrong" : "dim"}`} onClick={() => setPicked(a)}>
            {CHAMPION_TEXT[a]?.name ?? a}
          </button>
        ))}
      </div>
      {picked && (
        <>
          <p className="small">{S.sortAnswer(options.map((a) => `${CHAMPION_TEXT[a]?.name ?? a} ${counts[a]}`).join(", "))}</p>
          <Button variant="gold" onClick={() => onDone(picked === fewest ? 25 : 10)}>
            {S.continue}
          </Button>
        </>
      )}
    </div>
  );
}

// ---------------------------------------------------------------- stage 2: stack

function StackStage({ seed, onDone }: { seed: number; onDone: (points: number) => void }) {
  const [puzzle, setPuzzle] = useState<StackPuzzle>(() => buildStackPuzzle(STACK_BUGS, seed));
  const [mistakes, setMistakes] = useState(0);
  const [warn, setWarn] = useState(false);
  const solved = stackSolved(puzzle);
  const move = (m: "push" | "pop") => {
    const r = stackMove(puzzle, m);
    setWarn(!r.ok && m === "pop");
    if (!r.ok) setMistakes((n) => n + 1);
    else setPuzzle(r.puzzle);
  };
  return (
    <div className="struct-stage">
      <p className="small">{S.stackIntro}</p>
      <div className="stack-row">
        <small>{S.target}</small>
        <div className="bug-line">
          {puzzle.target.map((id, i) => (
            <span key={id} className={`bug-chip ${i < puzzle.output.length ? "done" : ""}`}>
              <BugSprite speciesId={id} size={28} />
            </span>
          ))}
        </div>
      </div>
      <div className="stack-scene">
        <div className="stack-col">
          <small>{S.incoming}</small>
          <div className="bug-line">
            {puzzle.incoming.map((id) => (
              <span key={id} className="bug-chip">
                <BugSprite speciesId={id} size={28} animate />
              </span>
            ))}
          </div>
        </div>
        <div className="stack-col">
          <small>{S.stackLabel}</small>
          <div className="stack-tower">
            {[...puzzle.stack].reverse().map((id, i) => (
              <span key={id} className={`bug-chip ${i === 0 ? "top" : ""}`}>
                <BugSprite speciesId={id} size={28} />
              </span>
            ))}
          </div>
        </div>
        <div className="stack-col">
          <small>{S.exit}</small>
          <div className="bug-line">
            {puzzle.output.map((id) => (
              <span key={id} className="bug-chip done">
                <BugSprite speciesId={id} size={28} />
              </span>
            ))}
          </div>
        </div>
      </div>
      {warn && <p className="bad-text small">{S.stackWrong}</p>}
      {solved ? (
        <Button variant="gold" onClick={() => onDone(Math.max(5, 25 - mistakes * 5))}>
          {S.continue}
        </Button>
      ) : (
        <div className="button-row wrap">
          <Button variant="purple" disabled={puzzle.incoming.length === 0} onClick={() => move("push")}>
            {S.push}
          </Button>
          <Button variant="dark" disabled={puzzle.stack.length === 0} onClick={() => move("pop")}>
            {S.pop}
          </Button>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------- stage 3: queue

function QueueStage({ seed, onDone }: { seed: number; onDone: (points: number) => void }) {
  const question = useMemo(() => buildQueueQuestion(STACK_BUGS, seed), [seed]);
  const [picked, setPicked] = useState<string | null>(null);
  const leavers = queueLeavers(question.ops);
  const choices = useMemo(() => shuffle(STACK_BUGS), [seed]);
  return (
    <div className="struct-stage">
      <p className="small">{S.queueIntro}</p>
      <ol className="queue-ops">
        {question.ops.map((op, i) => (
          <li key={i} className={op.kind}>
            {op.kind === "enqueue" ? (
              <>
                <BugSprite speciesId={op.item} size={22} /> {S.enqueue(name(op.item))}
              </>
            ) : (
              S.dequeue
            )}
          </li>
        ))}
      </ol>
      <p className="lab-prompt">{S.queueAsk(question.ask)}</p>
      <div className="bug-line">
        {choices.map((id) => (
          <button key={id} type="button" disabled={picked !== null} className={`bug-pick ${picked === null ? "" : id === question.answer ? "right" : id === picked ? "wrong" : ""}`} onClick={() => setPicked(id)}>
            <BugSprite speciesId={id} size={32} />
            <small>{name(id)}</small>
          </button>
        ))}
      </div>
      {picked && (
        <>
          <p className="small">{leavers.map((id, i) => `${i + 1}º ${name(id)}`).join(" · ")}</p>
          <Button variant="gold" onClick={() => onDone(picked === question.answer ? 25 : 5)}>
            {S.continue}
          </Button>
        </>
      )}
    </div>
  );
}

// ---------------------------------------------------------------- stage 4: hash table

function HashStage({ seed, onDone }: { seed: number; onDone: (points: number) => void }) {
  const bugs = useMemo(() => STACK_BUGS.map((id, i) => ({ id, level: 3 + ((seed >> i) % 37) + i * 7 })), [seed]);
  const [index, setIndex] = useState(0);
  const [buckets, setBuckets] = useState<string[][]>(() => Array.from({ length: HASH_BUCKETS }, () => []));
  const [mistakes, setMistakes] = useState(0);
  const [hint, setHint] = useState<string | null>(null);
  const bug = bugs[index];
  const place = (b: number) => {
    if (!bug) return;
    const right = hashBucket(bug.level);
    if (b !== right) {
      setMistakes((m) => m + 1);
      setHint(S.hashWrong(bug.level, HASH_BUCKETS, right));
      return;
    }
    setHint(null);
    setBuckets((all) => all.map((list, i) => (i === b ? [...list, `${bug.id}:${bug.level}`] : list)));
    setIndex((i) => i + 1);
  };
  return (
    <div className="struct-stage">
      <p className="small">{S.hashIntro(HASH_BUCKETS)}</p>
      {bug && (
        <p className="lab-prompt hash-ask">
          <BugSprite speciesId={bug.id} size={32} animate /> {S.hashAsk(name(bug.id), bug.level)}
        </p>
      )}
      <div className="hash-buckets">
        {buckets.map((list, b) => (
          <button key={b} type="button" className="hash-bucket" disabled={!bug} onClick={() => place(b)}>
            <strong>{S.bucket(b)}</strong>
            {list.map((entry) => {
              const [id, level] = entry.split(":");
              return (
                <span key={entry} className="hash-entry">
                  <BugSprite speciesId={id!} size={22} /> {level}
                </span>
              );
            })}
          </button>
        ))}
      </div>
      {hint && <p className="bad-text small">{hint}</p>}
      {!bug && (
        <Button variant="gold" onClick={() => onDone(Math.max(5, 25 - mistakes * 4))}>
          {S.continue}
        </Button>
      )}
    </div>
  );
}

export function StructuresGame({ onExit }: GameProps) {
  const [round, again] = useRound();
  const seed = useMemo(() => freshSeed(), [round]);
  const [stage, setStage] = useState(0);
  const [points, setPoints] = useState(0);
  const done = (p: number) => {
    setPoints((x) => x + p);
    setStage((s) => s + 1);
  };
  if (stage >= 4) return <GameResult key={round} game="structures" points={points} onAgain={() => { setStage(0); setPoints(0); again(); }} onExit={onExit} />;
  const stages = [SortingStage, StackStage, QueueStage, HashStage];
  const Stage = stages[stage]!;
  return (
    <div className="mini-game">
      <GameBar game="structures" score={points} clock={S.stage(stage + 1, S.stages[stage]!)} />
      <Stage key={`${round}-${stage}`} seed={seed + stage} onDone={done} />
    </div>
  );
}
