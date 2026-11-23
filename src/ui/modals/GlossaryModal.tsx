import { useState } from "react";
import { GLOSSARY, GLOSSARY_UI } from "../../i18n/glossary.ptBR";
import { useApp } from "../appContext";
import { Modal } from "../components/primitives";

/** Every technical word of the lessons, with a filter. */
export function GlossaryModal() {
  const { close } = useApp();
  const [filter, setFilter] = useState("");
  const query = filter.trim().toLowerCase();
  const terms = [...GLOSSARY]
    .sort((a, b) => a.words[0]!.localeCompare(b.words[0]!, "pt-BR"))
    .filter((t) => !query || t.words.some((w) => w.includes(query)) || t.definition.toLowerCase().includes(query));
  return (
    <Modal title={GLOSSARY_UI.title} onClose={close} wide>
      <p className="muted small">{GLOSSARY_UI.intro}</p>
      <input className="input" value={filter} onChange={(e) => setFilter(e.target.value)} placeholder="Buscar" aria-label="Buscar" />
      <dl className="glossary-list">
        {terms.map((t) => (
          <div key={t.id} className="glossary-entry">
            <dt>{t.words.join(", ")}</dt>
            <dd>{t.definition}</dd>
          </div>
        ))}
      </dl>
    </Modal>
  );
}
