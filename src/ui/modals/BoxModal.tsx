import { useState } from "react";
import { filterBugs, type BoxFilter, type BoxSort } from "../../game/collection";
import type { Rarity } from "../../game/data/species";
import { BUG_TYPES, type BugType } from "../../game/types";
import { RARITY_NAMES, TYPE_NAMES, UI } from "../../i18n/ptBR";
import { useApp } from "../appContext";
import { BugSprite, Modal, Tag } from "../components/primitives";
import { useGame } from "../store";
import { ivTotal } from "../../game/bug";
import { houseOf } from "../../game/housing";

const RARITIES: Rarity[] = ["common", "uncommon", "rare", "legendary"];
const SORTS: BoxSort[] = ["recent", "level", "dex", "power", "iv"];

export function BoxModal() {
  const state = useGame();
  const { close, open } = useApp();
  const [filter, setFilter] = useState<BoxFilter>({ text: "", type: "any", rarity: "any", sort: "recent" });
  const all = Object.values(state.bugs);
  const bugs = filterBugs(all, filter);
  const patch = (p: Partial<BoxFilter>) => setFilter((f) => ({ ...f, ...p }));

  return (
    <Modal title={`EQUIPE · ${all.length}`} onClose={close} wide>
      <div className="filter-bar">
        <input className="input" placeholder={UI.box.search} value={filter.text} onChange={(e) => patch({ text: e.target.value })} />
        <select className="input" value={filter.type} onChange={(e) => patch({ type: e.target.value as BugType | "any" })}>
          <option value="any">{UI.box.anyType}</option>
          {BUG_TYPES.map((t) => (
            <option key={t} value={t}>
              {TYPE_NAMES[t]}
            </option>
          ))}
        </select>
        <select className="input" value={filter.rarity} onChange={(e) => patch({ rarity: e.target.value as Rarity | "any" })}>
          <option value="any">{UI.box.anyRarity}</option>
          {RARITIES.map((r) => (
            <option key={r} value={r}>
              {RARITY_NAMES[r]}
            </option>
          ))}
        </select>
        <input
          className="input narrow"
          type="number"
          min={1}
          max={100}
          placeholder="Nv mín"
          value={filter.minLevel ?? ""}
          onChange={(e) => patch({ minLevel: e.target.value ? Number(e.target.value) : undefined })}
        />
        <select className="input" value={filter.sort} onChange={(e) => patch({ sort: e.target.value as BoxSort })}>
          {SORTS.map((s) => (
            <option key={s} value={s}>
              {UI.box.sorts[s]}
            </option>
          ))}
        </select>
        <label className="checkbox">
          <input type="checkbox" checked={filter.shinyOnly ?? false} onChange={(e) => patch({ shinyOnly: e.target.checked })} />
          {UI.box.shinyOnly}
        </label>
      </div>
      {bugs.length === 0 ? (
        <p className="muted">{UI.box.empty}</p>
      ) : (
        <div className="box-grid">
          {bugs.map((bug) => (
            <button key={bug.uid} type="button" className={`box-cell ${state.team.includes(bug.uid) ? "in-team" : ""}`} onClick={() => open({ kind: "bug", uid: bug.uid })}>
              <BugSprite speciesId={bug.speciesId} shiny={bug.shiny} size={48} />
              <span className="box-cell-level">
                {UI.level} {bug.level}
              </span>
              <Tag tone="green">IV {ivTotal(bug)}</Tag>
              {state.team.includes(bug.uid) && <span className="box-cell-badge">{UI.box.inTeam}</span>}
              {houseOf(state, bug.uid) && <span className="box-cell-badge house">{UI.houses.inHouse}</span>}
            </button>
          ))}
        </div>
      )}
    </Modal>
  );
}
