import { GLOSSARY } from "../i18n/glossary.ptBR";
import { LESSON_WHY } from "../i18n/learning.ptBR";
import { splitGlossary } from "./glossary";

describe("glossary", () => {
  it("has unique terms with definitions", () => {
    expect(new Set(GLOSSARY.map((t) => t.id)).size).toBe(GLOSSARY.length);
    for (const t of GLOSSARY) {
      expect(t.definition.length, t.id).toBeGreaterThan(20);
      for (const w of t.words) expect(w, t.id).toBe(w.toLowerCase());
    }
  });

  it("marks whole words only, any case, once per term, and keeps the text intact", () => {
    const text = "O Cache guarda; o cache de novo. Um cachepot não conta.";
    const pieces = splitGlossary(text);
    expect(pieces.map((p) => p.text).join("")).toBe(text);
    const marked = pieces.filter((p) => p.term);
    expect(marked.map((p) => p.text)).toEqual(["Cache"]);
  });

  it("finds terms in most lesson explanations", () => {
    const withTerms = Object.values(LESSON_WHY).filter((why) => splitGlossary(why).some((p) => p.term));
    expect(withTerms.length).toBeGreaterThan(Object.keys(LESSON_WHY).length * 0.4);
  });
});
