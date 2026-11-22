import { useState } from "react";
import type { Lesson } from "../../game/data/lessons";
import { getSpecies } from "../../game/data/species";
import { LEARN_UI, LESSON_WHY } from "../../i18n/learning.ptBR";
import { CodeBlock } from "./CodeBlock";
import { BugSprite, Button } from "./primitives";

const Q = LEARN_UI.quiz;

/** Asks "which line has the bug?" for each lesson, showing the fix after every answer. */
export function Quiz({ lessons, onFinish }: { lessons: Lesson[]; onFinish: (answers: Record<string, number>) => void }) {
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const lesson = lessons[index];
  if (!lesson) return null;
  const picked = answers[lesson.speciesId];
  const answered = picked !== undefined;
  const last = index === lessons.length - 1;

  return (
    <div className="quiz">
      <div className="quiz-head">
        <BugSprite speciesId={lesson.speciesId} size={40} />
        <div>
          <strong>
            {Q.progress(index + 1, lessons.length)} · {getSpecies(lesson.speciesId).name}
          </strong>
          <p className="muted small">{Q.prompt}</p>
        </div>
      </div>
      <CodeBlock
        lesson={lesson}
        pickable={!answered}
        reveal={answered}
        picked={picked ?? null}
        onPick={(line) => setAnswers((a) => ({ ...a, [lesson.speciesId]: line }))}
      />
      {answered && (
        <>
          <p className={picked === lesson.badLine ? "ok-text" : "bad-text"}>{picked === lesson.badLine ? LEARN_UI.debug.right : LEARN_UI.debug.wrong}</p>
          <p className="small">{LESSON_WHY[lesson.speciesId]}</p>
          <Button variant="gold" onClick={() => (last ? onFinish(answers) : setIndex(index + 1))}>
            {last ? Q.finish : Q.next}
          </Button>
        </>
      )}
    </div>
  );
}
