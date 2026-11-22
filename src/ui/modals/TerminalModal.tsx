import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import { T } from "../../i18n/terminal.ptBR";
import { useApp } from "../appContext";
import { Modal } from "../components/primitives";
import { store, useGame } from "../store";
import { complete, promptPath, runCommand, type CommandOutput } from "../terminal";

interface Line {
  id: number;
  text: string;
  input?: boolean;
}

const MAX_LINES = 400;
let nextLine = 1;
/** Kept between openings so the terminal feels like the same session. */
let saved: { lines: Line[]; history: string[] } = { lines: T.welcome.map((text) => ({ id: nextLine++, text })), history: [] };

export function TerminalModal() {
  const state = useGame();
  const { close } = useApp();
  const [lines, setLines] = useState<Line[]>(saved.lines);
  const [history, setHistory] = useState<string[]>(saved.history);
  const [input, setInput] = useState("");
  const [cursor, setCursor] = useState<number | null>(null);
  const screen = useRef<HTMLDivElement>(null);
  const field = useRef<HTMLInputElement>(null);
  const prompt = `${state.trainer.name.toLowerCase().replace(/\s+/g, "")}@bugidle:${promptPath(state)}$`;

  useEffect(() => {
    saved = { lines, history };
    screen.current?.scrollTo({ top: screen.current.scrollHeight });
  }, [lines, history]);
  useEffect(() => field.current?.focus(), []);

  const submit = () => {
    const command = input.trim();
    let out: CommandOutput = { lines: [] };
    store.update((s) => {
      out = runCommand(s, command, { history, now: new Date() });
    });
    const echoed: Line = { id: nextLine++, text: `${prompt} ${input}`, input: true };
    const printed = out.lines.map((text) => ({ id: nextLine++, text }));
    setLines((current) => (out.clear ? [] : [...current, echoed, ...printed]).slice(-MAX_LINES));
    if (command) setHistory((h) => [...h, command]);
    setInput("");
    setCursor(null);
  };

  const onKey = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") submit();
    else if (e.key === "Tab") {
      e.preventDefault();
      setInput(complete(state, input));
    } else if (e.key === "ArrowUp" || e.key === "ArrowDown") {
      e.preventDefault();
      if (history.length === 0) return;
      const next = e.key === "ArrowUp" ? (cursor === null ? history.length - 1 : Math.max(0, cursor - 1)) : cursor === null ? null : cursor + 1;
      if (next === null || next >= history.length) {
        setCursor(null);
        setInput("");
      } else {
        setCursor(next);
        setInput(history[next]!);
      }
    } else if (e.key === "l" && e.ctrlKey) {
      e.preventDefault();
      setLines([]);
    }
  };

  return (
    <Modal title="TERMINAL" onClose={close} wide>
      <div className="terminal" ref={screen} onClick={() => field.current?.focus()}>
        {lines.map((line) => (
          <div key={line.id} className={line.input ? "term-input" : "term-out"}>
            {line.text || " "}
          </div>
        ))}
        <div className="term-prompt">
          <span>{prompt}</span>
          <input ref={field} value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={onKey} spellCheck={false} autoCapitalize="off" autoComplete="off" aria-label="terminal" />
        </div>
      </div>
    </Modal>
  );
}
