import { useEffect, useMemo, useState } from "react";
import { GATE_LEVELS, PIXEL_PICTURES, ROBOT_LEVELS, type GateKind, type GateRef, type RobotCommand } from "../../game/data/gameData";
import { buildPipes, evalCircuit, flowFrom, gatesFor, lampOn, MAX_PROGRAM, PIPE_SIZE, pipesScore, robotScore, runRobot, tileMask, type PipeBoard } from "../../game/minigames/machines";
import { pixelScore } from "../../game/minigames/puzzles";
import { GAMES_UI } from "../../i18n/games.ptBR";
import { MACHINE_UI } from "../../i18n/gamesUi.ptBR";
import { Button } from "../components/primitives";
import { pixelArtUrl, trainerSpriteUrl } from "../render/pixels";
import { BugSprite } from "../components/primitives";
import { freshSeed, GameBar, GameHelp, GameResult, useRound, useStopwatch, type GameProps } from "./shared";

/** "#F00" -> "#FF0000" for CSS and comparison. */
const fullHex = (hex: string) => (hex.length === 4 ? `#${hex.slice(1).split("").map((d) => d + d).join("")}` : hex);

// ---------------------------------------------------------------- pixel by code

export function PixelGame({ onExit }: GameProps) {
  const [round, again] = useRound();
  const picture = useMemo(() => PIXEL_PICTURES[Math.floor(Math.random() * PIXEL_PICTURES.length)]!, [round]);
  const [brush, setBrush] = useState(1);
  const [painted, setPainted] = useState<(number | null)[][]>(() => picture.rows.map(() => Array<number | null>(8).fill(null)));
  const [done, setDone] = useState(false);
  // the palette buttons show the colours only, in a shuffled order: the player reads the hex codes
  const order = useMemo(() => picture.palette.map((_, i) => i).sort(() => Math.random() - 0.5), [picture]);

  const paint = (r: number, c: number) => setPainted((p) => p.map((row, y) => (y === r ? row.map((v, x) => (x === c ? brush : v)) : row)));

  if (done)
    return (
      <GameResult key={round} game="pixel" points={pixelScore(picture.rows, painted)} onAgain={() => { setPainted(picture.rows.map(() => Array<number | null>(8).fill(null))); setDone(false); again(); }} onExit={onExit}>
        <img className="pixel pixel-preview" src={pixelArtUrl(picture.rows, Object.fromEntries(picture.palette.map((h, i) => [String(i), fullHex(h)])))} width={96} height={96} alt="" />
      </GameResult>
    );
  return (
    <div className="mini-game">
      <GameBar game="pixel" />
      <GameHelp game="pixel" />
      <div className="pixel-layout">
        <div className="pixel-grid">
          {picture.rows.map((row, r) =>
            [...row].map((ch, c) => {
              const color = painted[r]?.[c] ?? null;
              return (
                <button key={`${r}-${c}`} type="button" className="pixel-cell" style={{ background: color === null ? undefined : fullHex(picture.palette[color]!) }} onClick={() => paint(r, c)}>
                  {color === null && <span>{picture.palette[Number(ch)]}</span>}
                </button>
              );
            }),
          )}
        </div>
        <div className="pixel-palette">
          <small className="muted">{MACHINE_UI.palette}</small>
          {order.map((i) => (
            <button key={i} type="button" className={`swatch ${brush === i ? "active" : ""}`} style={{ background: fullHex(picture.palette[i]!) }} onClick={() => setBrush(i)} aria-label={`cor ${i + 1}`} />
          ))}
        </div>
      </div>
      <Button variant="gold" onClick={() => setDone(true)}>
        {MACHINE_UI.check}
      </Button>
    </div>
  );
}

// ---------------------------------------------------------------- algorithm robot

const COMMANDS: RobotCommand[] = ["forward", "left", "right", "repeat3"];
const COMMAND_GLYPH: Record<RobotCommand, string> = { forward: "^", left: "<", right: ">", repeat3: "x3" };

export function RobotGame({ onExit }: GameProps) {
  const [round, again] = useRound();
  const [levelIndex, setLevelIndex] = useState(() => Math.floor(Math.random() * ROBOT_LEVELS.length));
  const level = ROBOT_LEVELS[levelIndex]!;
  const [program, setProgram] = useState<RobotCommand[]>([]);
  const [step, setStep] = useState<number | null>(null);
  const [finished, setFinished] = useState<number | null>(null);
  const run = useMemo(() => runRobot(level, program), [level, program]);

  // play the run one pose at a time
  useEffect(() => {
    if (step === null || step >= run.path.length - 1) return;
    const id = window.setTimeout(() => setStep((s) => (s === null ? s : s + 1)), 280);
    return () => window.clearTimeout(id);
  }, [step, run.path.length]);
  const playing = step !== null && step < run.path.length - 1;
  const pose = run.path[step ?? 0]!;
  const ended = step !== null && !playing;

  if (finished !== null) return <GameResult key={round} game="robot" points={finished} onAgain={() => { setProgram([]); setStep(null); setFinished(null); setLevelIndex((i) => (i + 1) % ROBOT_LEVELS.length); again(); }} onExit={onExit} />;
  return (
    <div className="mini-game">
      <GameBar game="robot" clock={MACHINE_UI.level(levelIndex + 1, ROBOT_LEVELS.length)} />
      <GameHelp game="robot" />
      <div className="robot-layout">
        <div className="robot-map" style={{ gridTemplateColumns: `repeat(${Math.max(...level.map.map((r) => r.length))}, 36px)` }}>
          {level.map.map((row, r) =>
            [...row].map((ch, c) => (
              <span key={`${r}-${c}`} className={`robot-cell ${ch === "#" ? "wall" : ""}`}>
                {ch === "B" && <BugSprite speciesId="typobit" size={28} />}
                {pose.r === r && pose.c === c && <img className={`pixel robot-bot dir-${pose.dir}`} src={trainerSpriteUrl(pose.dir === 1 ? "down" : pose.dir === 3 ? "up" : "left", 0)} width={20} height={28} alt="" />}
              </span>
            )),
          )}
        </div>
        <div className="robot-panel">
          <small className="muted">{MACHINE_UI.program}</small>
          <div className="robot-program">
            {program.length === 0 ? <small className="muted">{MACHINE_UI.emptyProgram}</small> : program.map((cmd, i) => <span key={i} className={`cmd-chip cmd-${cmd}`}>{COMMAND_GLYPH[cmd]}</span>)}
          </div>
          <div className="robot-buttons">
            {COMMANDS.map((cmd) => (
              <Button key={cmd} variant="dark" small disabled={program.length >= MAX_PROGRAM || playing} onClick={() => { setStep(null); setProgram((p) => [...p, cmd]); }}>
                {COMMAND_GLYPH[cmd]} {MACHINE_UI.commands[cmd]}
              </Button>
            ))}
          </div>
          <div className="button-row wrap">
            <Button variant="purple" disabled={program.length === 0 || playing} onClick={() => setStep(0)}>
              {MACHINE_UI.run}
            </Button>
            <Button variant="dark" small disabled={playing} onClick={() => { setStep(null); setProgram((p) => p.slice(0, -1)); }}>
              {MACHINE_UI.undo}
            </Button>
            <Button variant="dark" small disabled={playing} onClick={() => { setStep(null); setProgram([]); }}>
              {MACHINE_UI.clear}
            </Button>
          </div>
          {ended && <p className={run.success ? "ok-text" : "bad-text"}>{run.success ? MACHINE_UI.reached : run.crashed ? MACHINE_UI.crashed : MACHINE_UI.stopped}</p>}
          {ended && run.success && (
            <Button variant="gold" onClick={() => setFinished(robotScore(level, program, run))}>
              {GAMES_UI.finish}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------- logic gates

const refLabel = (ref: GateRef) => (typeof ref === "number" ? `P${ref + 1}` : ref);

export function GatesGame({ onExit }: GameProps) {
  const [round, again] = useRound();
  const levels = useMemo(() => [...GATE_LEVELS].sort(() => Math.random() - 0.5).slice(0, 5), [round]);
  const [index, setIndex] = useState(0);
  const [choices, setChoices] = useState<(GateKind | null)[]>([]);
  const [score, setScore] = useState(0);
  const [checks, setChecks] = useState(0);
  const [lit, setLit] = useState<boolean | null>(null);
  const level = levels[index];

  if (!level) return <GameResult key={round} game="gates" points={score} onAgain={() => { setIndex(0); setScore(0); setChoices([]); setLit(null); setChecks(0); again(); }} onExit={onExit} />;
  const values = evalCircuit(level, choices);
  const check = () => {
    const on = lampOn(level, choices);
    setLit(on);
    setChecks((c) => c + 1);
    if (on) setScore((s) => s + Math.max(5, 20 - checks * 5));
  };
  const next = () => {
    setIndex((i) => i + 1);
    setChoices([]);
    setLit(null);
    setChecks(0);
  };

  return (
    <div className="mini-game">
      <GameBar game="gates" score={score} clock={MACHINE_UI.level(index + 1, levels.length)} />
      <GameHelp game="gates" />
      <div className="circuit">
        <div className="circuit-inputs">
          {Object.entries(level.inputs).map(([name, v]) => (
            <span key={name} className={`signal ${v ? "on" : "off"}`}>
              {name} = {v}
            </span>
          ))}
        </div>
        {level.gates.map((gate, i) => (
          <div key={i} className="gate-row">
            <span className="gate-inputs mono">{gate.inputs.map(refLabel).join(" , ")}</span>
            <span className="gate-arrow">→</span>
            <span className="gate-name">P{i + 1}</span>
            <div className="segmented small">
              {gatesFor(gate.inputs.length).map((kind) => (
                <button key={kind} type="button" className={choices[i] === kind ? "active" : ""} disabled={lit === true} onClick={() => { setLit(null); setChoices((c) => { const n = [...c]; n[i] = kind; return n; }); }}>
                  {kind}
                </button>
              ))}
            </div>
            <span className={`signal ${values[i] === 1 ? "on" : values[i] === 0 ? "off" : "unknown"}`}>{values[i] ?? "?"}</span>
          </div>
        ))}
        <div className={`lamp ${lit ? "on" : ""}`} aria-label={lit ? MACHINE_UI.lampOn : MACHINE_UI.lampOff} />
      </div>
      {lit !== null && <p className={lit ? "ok-text" : "bad-text"}>{lit ? MACHINE_UI.lampOn : MACHINE_UI.lampOff}</p>}
      <div className="button-row wrap">
        {lit ? (
          <Button variant="gold" onClick={next}>
            {MACHINE_UI.nextLevel}
          </Button>
        ) : (
          <Button variant="purple" disabled={choices.filter(Boolean).length < level.gates.length} onClick={check}>
            {GAMES_UI.check}
          </Button>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------- data pipes

/** Draws a pipe tile from its open sides (1 up, 2 right, 4 down, 8 left). */
function PipeTile({ mask, wet }: { mask: number; wet: boolean }) {
  return (
    <span className={`pipe-tile ${wet ? "wet" : ""}`}>
      <span className="pipe-hub" />
      {mask & 1 ? <span className="pipe-arm up" /> : null}
      {mask & 2 ? <span className="pipe-arm right" /> : null}
      {mask & 4 ? <span className="pipe-arm down" /> : null}
      {mask & 8 ? <span className="pipe-arm left" /> : null}
    </span>
  );
}

export function PipesGame({ onExit }: GameProps) {
  const [round, again] = useRound();
  const [board, setBoard] = useState<PipeBoard>(() => buildPipes(freshSeed()));
  const flow = flowFrom(board);
  const seconds = useStopwatch(!flow.connected);
  const [finished, setFinished] = useState(false);

  const turn = (r: number, c: number) => {
    if (flow.connected) return;
    setBoard((b) => ({ ...b, turns: b.turns.map((row, y) => row.map((t, x) => (y === r && x === c ? (t + 1) % 4 : t))) }));
  };

  if (finished) return <GameResult key={round} game="pipes" points={pipesScore(seconds)} onAgain={() => { setBoard(buildPipes(freshSeed())); setFinished(false); again(); }} onExit={onExit} />;
  return (
    <div className="mini-game">
      <GameBar game="pipes" clock={MACHINE_UI.seconds(seconds)} />
      <GameHelp game="pipes" />
      <div className="pipes-layout">
        <div className="pipes-side">
          {Array.from({ length: PIPE_SIZE }, (_, r) => (
            <span key={r} className={`pipe-end ${r === board.sourceRow ? "source" : ""}`}>
              {r === board.sourceRow ? MACHINE_UI.source : ""}
            </span>
          ))}
        </div>
        <div className="pipes-grid">
          {board.shapes.map((row, r) =>
            row.map((_, c) => (
              <button key={`${r}-${c}`} type="button" className="pipe-button" onClick={() => turn(r, c)}>
                <PipeTile mask={tileMask(board, r, c)} wet={flow.reached.has(`${r},${c}`)} />
              </button>
            )),
          )}
        </div>
        <div className="pipes-side">
          {Array.from({ length: PIPE_SIZE }, (_, r) => (
            <span key={r} className={`pipe-end ${r === board.targetRow ? (flow.connected ? "target lit" : "target") : ""}`}>
              {r === board.targetRow ? MACHINE_UI.target : ""}
            </span>
          ))}
        </div>
      </div>
      {flow.connected && (
        <>
          <p className="ok-text">{MACHINE_UI.connected}</p>
          <Button variant="gold" onClick={() => setFinished(true)}>
            {GAMES_UI.finish}
          </Button>
        </>
      )}
    </div>
  );
}
