/** Finds glossary words inside a text, for the underlined definitions. Pure. */
import { GLOSSARY, type GlossaryTerm } from "../i18n/glossary.ptBR";

export type GlossaryPiece = { text: string; term?: GlossaryTerm };

const WORDS = GLOSSARY.flatMap((term) => term.words.map((word) => ({ word, term }))).sort((a, b) => b.word.length - a.word.length);
const LETTER = /[\p{L}\p{N}]/u;

/** Splits a text into plain pieces and glossary words (whole words, any case, first hit of each term only). */
export function splitGlossary(text: string): GlossaryPiece[] {
  const lower = text.toLowerCase();
  const pieces: GlossaryPiece[] = [];
  const used = new Set<string>();
  let plain = "";
  let i = 0;
  while (i < text.length) {
    const hit = WORDS.find(({ word, term }) => {
      if (used.has(term.id) || !lower.startsWith(word, i)) return false;
      const before = i > 0 ? text[i - 1]! : " ";
      const after = text[i + word.length] ?? " ";
      return !LETTER.test(before) && !LETTER.test(after);
    });
    if (!hit) {
      plain += text[i];
      i += 1;
      continue;
    }
    if (plain) pieces.push({ text: plain });
    plain = "";
    pieces.push({ text: text.slice(i, i + hit.word.length), term: hit.term });
    used.add(hit.term.id);
    i += hit.word.length;
  }
  if (plain) pieces.push({ text: plain });
  return pieces;
}
