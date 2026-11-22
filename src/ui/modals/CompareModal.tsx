import { bugScore, computeStats, ivTotal, powerRating, type BugInstance } from "../../game/bug";
import { getSpecies } from "../../game/data/species";
import { STAT_KEYS } from "../../game/data/stats";
import { STAT_NAMES, UI } from "../../i18n/ptBR";
import { useApp } from "../appContext";
import { formatNumber } from "../format";
import { BugSprite, Modal, Tag, TypeTag } from "../components/primitives";
import { useGame } from "../store";

interface Row {
  label: string;
  a: number;
  b: number;
  format?: (v: number) => string;
}

function rows(a: BugInstance, b: BugInstance): Row[] {
  const sa = computeStats(a);
  const sb = computeStats(b);
  const score = (v: number) => v.toLocaleString("pt-BR", { maximumFractionDigits: 3 });
  return [
    { label: UI.compare.score, a: bugScore(a), b: bugScore(b), format: score },
    { label: UI.detail.power, a: powerRating(a), b: powerRating(b) },
    { label: UI.level, a: a.level, b: b.level },
    { label: UI.detail.potency, a: a.potency, b: b.potency, format: (v) => `P${v}` },
    { label: UI.detail.ivSum, a: ivTotal(a), b: ivTotal(b) },
    ...STAT_KEYS.map((key) => ({ label: STAT_NAMES[key], a: sa[key], b: sb[key] })),
  ];
}

function Side({ bug, slot }: { bug: BugInstance; slot: string }) {
  const species = getSpecies(bug.speciesId);
  return (
    <div className="compare-side">
      <Tag tone="pink">{slot}</Tag>
      <BugSprite speciesId={bug.speciesId} shiny={bug.shiny} size={72} />
      <strong>{species.name}</strong>
      <div className="tag-row center">
        {species.types.map((t) => (
          <TypeTag key={t} type={t} />
        ))}
      </div>
    </div>
  );
}

export function CompareModal({ a, b }: { a: string; b: string }) {
  const state = useGame();
  const { close } = useApp();
  const bugA = state.bugs[a];
  const bugB = state.bugs[b];
  if (!bugA || !bugB) return null;
  return (
    <Modal title={UI.compare.title} onClose={close}>
      <div className="compare-head">
        <Side bug={bugA} slot="A" />
        <span className="compare-vs">x</span>
        <Side bug={bugB} slot="B" />
      </div>
      <table className="compare-table">
        <tbody>
          {rows(bugA, bugB).map((row) => {
            const fmt = row.format ?? formatNumber;
            return (
              <tr key={row.label}>
                <td className={`num ${row.a > row.b ? "win" : ""}`}>{fmt(row.a)}</td>
                <th>{row.label}</th>
                <td className={`num ${row.b > row.a ? "win" : ""}`}>{fmt(row.b)}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </Modal>
  );
}
