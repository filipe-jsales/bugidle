import type { Lesson } from "../../game/data/lessons";

/**
 * Code from a lesson with line numbers. `pickable` turns each line into a
 * button (debug challenge); `reveal` marks the bad line and shows the fix.
 */
export function CodeBlock({
  lesson,
  reveal = false,
  pickable = false,
  picked = null,
  onPick,
}: {
  lesson: Lesson;
  reveal?: boolean;
  pickable?: boolean;
  picked?: number | null;
  onPick?: (line: number) => void;
}) {
  return (
    <ol className={`code-block lang-${lesson.language}`}>
      {lesson.lines.map((line, i) => {
        const bad = reveal && i === lesson.badLine;
        const wrongPick = reveal && picked === i && i !== lesson.badLine;
        const content = (
          <>
            <span className="code-num">{i + 1}</span>
            <code>{line || " "}</code>
          </>
        );
        return (
          <li key={i} className={`${bad ? "code-bad" : ""} ${wrongPick ? "code-wrong" : ""}`}>
            {pickable ? (
              <button type="button" className="code-line" onClick={() => onPick?.(i)}>
                {content}
              </button>
            ) : (
              <div className="code-line">{content}</div>
            )}
            {bad && (
              <div className="code-line code-fix">
                <span className="code-num">+</span>
                <code>{lesson.fix}</code>
              </div>
            )}
          </li>
        );
      })}
    </ol>
  );
}
