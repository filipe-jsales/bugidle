import { useState } from "react";
import { dexProgress, isCaught, isSeen } from "../../game/bugdex";
import { getSpecies, preEvolutionOf, SPECIES } from "../../game/data/species";
import { STAT_KEYS } from "../../game/data/stats";
import { routesWithSpecies } from "../../game/data/world";
import { STARTER_IDS } from "../../game/state";
import { ITEM_TEXT, RARITY_NAMES, ROUTE_NAMES, SPECIES_DESCRIPTIONS, STAT_NAMES, UI } from "../../i18n/ptBR";
import { useApp } from "../appContext";
import { BugSprite, Modal, Tag, TypeTag } from "../components/primitives";
import { useGame } from "../store";

function DexEntryView({ speciesId }: { speciesId: string }) {
  const state = useGame();
  const species = getSpecies(speciesId);
  const entry = state.bugdex[speciesId];
  const caught = isCaught(state, speciesId);
  const seen = isSeen(state, speciesId);
  const routes = routesWithSpecies(speciesId);
  const from = preEvolutionOf(speciesId);
  if (!seen) {
    return (
      <div className="dex-entry">
        <BugSprite speciesId={speciesId} size={120} silhouette />
        <h3>
          #{String(species.dex).padStart(3, "0")} {UI.dex.unknown}
        </h3>
      </div>
    );
  }
  return (
    <div className="dex-entry">
      <div className="dex-entry-sprites">
        <BugSprite speciesId={speciesId} size={120} silhouette={!caught} className="bob slow" />
        {entry?.shinyCaught && <BugSprite speciesId={speciesId} size={72} shiny />}
      </div>
      <h3>
        #{String(species.dex).padStart(3, "0")} {species.name}
      </h3>
      <div className="tag-row center">
        {species.types.map((t) => (
          <TypeTag key={t} type={t} />
        ))}
        <Tag tone="pink">{RARITY_NAMES[species.rarity]}</Tag>
      </div>
      <p className="dex-description">{SPECIES_DESCRIPTIONS[speciesId]}</p>
      <div className="tag-row center">
        {STAT_KEYS.map((k) => (
          <Tag key={k}>
            {STAT_NAMES[k]} {species.baseStats[k]}
          </Tag>
        ))}
      </div>
      <dl className="dex-facts">
        <dt>{UI.dex.whereFound}</dt>
        <dd>
          {routes.length > 0
            ? routes.map((r) => ROUTE_NAMES[r.id]).join(", ")
            : (STARTER_IDS as readonly string[]).includes(speciesId)
              ? UI.dex.starter
              : from
                ? `${UI.dex.noWhere} (${from.name}${from.evolution?.item ? `, ${ITEM_TEXT[from.evolution.item].name}` : ""})`
                : UI.dex.noWhere}
        </dd>
        <dt>{UI.dex.catchRate}</dt>
        <dd>{species.catchRate}/255</dd>
        <dt>
          {UI.dex.seen} / {UI.dex.defeated} / {UI.dex.caught}
        </dt>
        <dd>
          {entry?.seen ?? 0} / {entry?.defeated ?? 0} / {entry?.caught ?? 0}
        </dd>
      </dl>
    </div>
  );
}

export function BugdexModal({ initialSpecies }: { initialSpecies?: string }) {
  const state = useGame();
  const { close } = useApp();
  const [selected, setSelected] = useState<string>(initialSpecies ?? SPECIES[0]!.id);
  const progress = dexProgress(state);
  return (
    <Modal
      title="BUGDEX"
      onClose={close}
      wide
      headerExtra={
        <span className="muted small">
          {progress.seen} {UI.dex.seen} · {progress.caught}/{progress.total} {UI.dex.caught} · {progress.shiny} {UI.dex.shiny}
        </span>
      }
    >
      <div className="dex-layout">
        <div className="dex-grid">
          {SPECIES.map((s) => {
            const seen = isSeen(state, s.id);
            const caught = isCaught(state, s.id);
            return (
              <button key={s.id} type="button" className={`dex-cell ${selected === s.id ? "active" : ""} ${caught ? "caught" : ""}`} onClick={() => setSelected(s.id)}>
                <BugSprite speciesId={s.id} size={40} silhouette={!caught} className={seen ? "" : "unseen"} />
                <span>#{String(s.dex).padStart(3, "0")}</span>
                {state.bugdex[s.id]?.shinyCaught && <span className="shiny-dot" />}
              </button>
            );
          })}
        </div>
        <DexEntryView speciesId={selected} />
      </div>
    </Modal>
  );
}
