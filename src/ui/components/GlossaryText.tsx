import { useState } from "react";
import { splitGlossary } from "../glossary";

/** A text where glossary words are underlined; tapping one shows its definition below. */
export function GlossaryText({ text, className = "" }: { text: string; className?: string }) {
  const [open, setOpen] = useState<string | null>(null);
  const pieces = splitGlossary(text);
  const term = pieces.find((p) => p.term?.id === open)?.term;
  return (
    <div className={`glossary-text ${className}`}>
      <p>
        {pieces.map((piece, i) =>
          piece.term ? (
            <button key={i} type="button" className={`glossary-word ${open === piece.term.id ? "active" : ""}`} title={piece.term.definition} onClick={() => setOpen(open === piece.term!.id ? null : piece.term!.id)}>
              {piece.text}
            </button>
          ) : (
            <span key={i}>{piece.text}</span>
          ),
        )}
      </p>
      {term && (
        <p className="glossary-def">
          <strong>{term.words[0]}</strong>: {term.definition}
        </p>
      )}
    </div>
  );
}
