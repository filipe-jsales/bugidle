import { useState } from "react";
import { lessonFor } from "../../game/data/lessons";
import { getSpecies } from "../../game/data/species";
import { answerDebug, DEBUG_TIME_MS } from "../../game/engine";
import { LEARN_UI, LESSON_WHY } from "../../i18n/learning.ptBR";
import { store, useGame } from "../store";
import { CodeBlock } from "./CodeBlock";
import { Bar, BugSprite, Button } from "./primitives";

const D = LEARN_UI.debug;
const FEEDBACK_MS = 6000;

/** "Debug to capture": pick the line with the bug while the encounter is paused. */
export function DebugPanel() {
  const state = useGame();
  const [result, setResult] = useState<{ speciesId: string; picked: number; correct: boolean; at: number } | null>(null);
  const debug = state.runtime.debug;
  const now = performance.now();
  const showing = result && now - result.at < FEEDBACK_MS ? result : null;
  const speciesId = debug?.speciesId ?? showing?.speciesId;
  const lesson = speciesId ? lessonFor(speciesId) : undefined;
  if (!speciesId || !lesson || (!debug && !showing)) return null;

  const answer = (line: number | null) => {
    store.update((s) => {
      const answered = answerDebug(s, line)[0];
      if (answered?.type === "debugAnswered") setResult({ speciesId, picked: line ?? -1, correct: answered.correct, at: performance.now() });
    });
  };

  return (
    <div className="debug-panel" onPointerDown={(e) => e.stopPropagation()} onWheel={(e) => e.stopPropagation()}>
      <div className="debug-head">
        <BugSprite speciesId={speciesId} size={32} />
        <strong>{D.title}</strong>
      </div>
      {debug ? (
        <>
          <p className="small">{D.question(getSpecies(speciesId).name)}</p>
          <Bar kind="time" value={debug.remainingMs} max={DEBUG_TIME_MS} />
          <CodeBlock lesson={lesson} pickable onPick={(line) => answer(line)} />
          <Button small variant="dark" onClick={() => answer(null)}>
            {D.skip}
          </Button>
        </>
      ) : (
        showing && (
          <>
            <p className={showing.correct ? "ok-text" : "bad-text"}>{showing.correct ? D.right : D.wrong}</p>
            <CodeBlock lesson={lesson} reveal picked={showing.picked} />
            <p className="small">{LESSON_WHY[speciesId]}</p>
          </>
        )
      )}
    </div>
  );
}
