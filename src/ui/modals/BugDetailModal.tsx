import { useState } from "react";
import { computeStats, ivGrade, ivTotal, MAX_IV, powerRating } from "../../game/bug";
import { moveToBox, moveToTeam, releaseBug, setLead } from "../../game/collection";
import { ITEMS } from "../../game/data/items";
import { movesFor } from "../../game/data/moves";
import { getSpecies } from "../../game/data/species";
import { STAT_KEYS, type Stats } from "../../game/data/stats";
import { evolveBug } from "../../game/engine";
import { canEvolveByLevel } from "../../game/evolution";
import { xpToNextLevel } from "../../game/experience";
import { MAX_TEAM_SIZE } from "../../game/state";
import { ITEM_TEXT, RARITY_NAMES, ROUTE_NAMES, STAT_NAMES, UI } from "../../i18n/ptBR";
import { useApp } from "../appContext";
import { formatNumber } from "../format";
import { Bar, BugSprite, Button, Modal, Tag, TypeTag } from "../components/primitives";
import { store, useGame } from "../store";

/** Four-axis radar of current stats, drawn as crisp SVG. */
function StatRadar({ stats, scale }: { stats: Stats; scale: number }) {
  const size = 150;
  const c = size / 2;
  const r = 58;
  const angle = (i: number) => (Math.PI * 2 * i) / STAT_KEYS.length - Math.PI / 2;
  const point = (i: number, ratio: number) => `${c + Math.cos(angle(i)) * r * ratio},${c + Math.sin(angle(i)) * r * ratio}`;
  const polygon = (ratio: (i: number) => number) => STAT_KEYS.map((_, i) => point(i, ratio(i))).join(" ");
  return (
    <svg className="radar" viewBox={`0 0 ${size} ${size}`} width={size} height={size} aria-hidden>
      {[1, 0.66, 0.33].map((ring) => (
        <polygon key={ring} points={polygon(() => ring)} className="radar-ring" />
      ))}
      <polygon points={polygon((i) => Math.min(1, stats[STAT_KEYS[i]!] / scale))} className="radar-fill" />
      {STAT_KEYS.map((key, i) => {
        const [x, y] = point(i, 1.22).split(",").map(Number);
        return (
          <text key={key} x={x} y={y} className="radar-label" textAnchor="middle" dominantBaseline="middle">
            {STAT_NAMES[key]}
          </text>
        );
      })}
    </svg>
  );
}

export function BugDetailModal({ uid }: { uid: string }) {
  const state = useGame();
  const { close, report } = useApp();
  const [confirmRelease, setConfirmRelease] = useState(false);
  const bug = state.bugs[uid];
  if (!bug) return null;
  const species = getSpecies(bug.speciesId);
  const stats = computeStats(bug);
  const inTeam = state.team.includes(uid);
  const isLead = state.team[0] === uid;
  const scale = Math.max(60, ...STAT_KEYS.map((k) => stats[k]));
  const evo = species.evolution;

  return (
    <Modal title={species.name.toUpperCase()} onClose={close} wide>
      <div className="detail-top">
        <div className="detail-left">
          <h3 className={bug.shiny ? "shiny-text" : ""}>
            {species.name} {bug.shiny && <Tag tone="gold">SHINY</Tag>}
          </h3>
          <div className="tag-row">
            <Tag>
              {UI.level} {bug.level}
            </Tag>
            {species.types.map((t) => (
              <TypeTag key={t} type={t} />
            ))}
            <Tag tone="pink">{RARITY_NAMES[species.rarity]}</Tag>
          </div>
          <div className="metric-grid">
            <div className="metric metric-green">
              <span>{UI.power}</span>
              <strong>{formatNumber(powerRating(bug))}</strong>
            </div>
            <div className="metric metric-gold">
              <span>{UI.quality}</span>
              <strong>{UI.qualityGrades[ivGrade(bug)]}</strong>
            </div>
            <div className="metric metric-blue">
              <span>{UI.ivSum}</span>
              <strong>
                {ivTotal(bug)}
                <small>/{MAX_IV * 4}</small>
              </strong>
            </div>
          </div>
          <Bar kind="hp" value={bug.currentHp} max={stats.hp} label={`HP ${bug.currentHp} / ${stats.hp}`} />
          <Bar kind="xp" value={bug.xp} max={xpToNextLevel(bug.level)} label={`${formatNumber(bug.xp)} / ${formatNumber(xpToNextLevel(bug.level))} xp`} />
          <p className="muted small">
            {evo ? (evo.level ? UI.evolvesAt(evo.level) : UI.evolvesWith(ITEM_TEXT[evo.item ?? "mutex"].name)) : UI.finalForm}
            {" · "}
            {ROUTE_NAMES[bug.origin] ?? (bug.origin === "starter" ? "Inicial" : bug.origin)}
          </p>
          <div className="button-grid">
            {inTeam && !isLead && <Button onClick={() => report(store.run((s) => setLead(s, uid)))}>{UI.setLead}</Button>}
            {inTeam ? (
              <Button onClick={() => report(store.run((s) => moveToBox(s, uid)))}>{UI.toBox}</Button>
            ) : (
              <Button disabled={state.team.length >= MAX_TEAM_SIZE} onClick={() => report(store.run((s) => moveToTeam(s, uid)))}>
                {UI.toTeam}
              </Button>
            )}
            {canEvolveByLevel(bug) && (
              <Button variant="gold" onClick={() => report(store.run((s) => evolveBug(s, uid)))}>
                {UI.evolve}
              </Button>
            )}
            <Button
              variant="danger"
              onClick={() => {
                if (!confirmRelease) return setConfirmRelease(true);
                if (report(store.run((s) => releaseBug(s, uid)))) close();
              }}
            >
              {confirmRelease ? UI.releaseConfirm : UI.release}
            </Button>
          </div>
        </div>
        <div className="detail-stage">
          <div className="spotlight" />
          <BugSprite speciesId={bug.speciesId} shiny={bug.shiny} size={168} className="bob slow" />
        </div>
      </div>

      <section className="subpanel">
        <h4>{UI.stats}</h4>
        <div className="stats-layout">
          <StatRadar stats={stats} scale={scale} />
          <table className="stat-table">
            <tbody>
              {STAT_KEYS.map((key) => (
                <tr key={key}>
                  <th>{STAT_NAMES[key]}</th>
                  <td className="stat-bar-cell">
                    <Bar kind="stat" value={stats[key]} max={scale} />
                  </td>
                  <td className="num">{stats[key]}</td>
                  <td className="num iv">IV {bug.ivs[key]}</td>
                  <td className="num boost">{bug.boosts[key] > 0 ? `+${bug.boosts[key]}` : ""}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="muted small">{UI.ivExplain}</p>
      </section>

      <section className="subpanel">
        <h4>{UI.moves}</h4>
        <div className="tag-row">
          {movesFor(species.types, bug.level).map((m) => (
            <span key={m.id} className={`move-chip type-${m.type}`}>
              {m.name} <small>{m.power}</small>
            </span>
          ))}
        </div>
      </section>

      <section className="subpanel">
        <h4>{UI.baseStats}</h4>
        <div className="tag-row">
          {STAT_KEYS.map((key) => (
            <Tag key={key}>
              {STAT_NAMES[key]} {species.baseStats[key]}
            </Tag>
          ))}
          {evo?.item && <Tag tone="gold">{ITEM_TEXT[evo.item].name} ({ITEMS[evo.item].price})</Tag>}
        </div>
      </section>
    </Modal>
  );
}
