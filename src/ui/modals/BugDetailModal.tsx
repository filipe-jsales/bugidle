import { useState, type CSSProperties, type ReactNode } from "react";
import { ACTION_GAUGE, GAUGE_DIVISOR } from "../../game/battle";
import {
  bugScore,
  computeStats,
  computeStatsFor,
  ivGrade,
  ivTotal,
  MAX_IV,
  POTENCY_TABLE,
  powerRating,
  REFINE_BASE_BONUS,
  scoreTier,
  type BugInstance,
  type ScoreTier,
} from "../../game/bug";
import { moveToBox, moveToTeam, releaseBug, setLead } from "../../game/collection";
import { getSpecies } from "../../game/data/species";
import { STAT_KEYS, type Stats } from "../../game/data/stats";
import { evolveBug, reduceLevel } from "../../game/engine";
import { totalXp, xpToNextLevel } from "../../game/experience";
import { houseOf } from "../../game/housing";
import { levelCap } from "../../game/progression";
import { MAX_TEAM_SIZE, type GameState } from "../../game/state";
import { canEvolveNow, evolutionStoneCost, MAX_REFINE, REFINABLE_STATS, REFINE_COST_UNIT, refineCost, refineStat, stoneCount, usableStones } from "../../game/stones";
import { ITEM_TEXT, RARITY_NAMES, ROUTE_NAMES, STAT_NAMES, stoneName, UI } from "../../i18n/ptBR";
import { useApp } from "../appContext";
import { formatNumber } from "../format";
import { Bar, BugSprite, Button, ItemIcon, Modal, Tag, TypeTag } from "../components/primitives";
import { stoneIconUrl } from "../render/icons";
import { store, useGame } from "../store";

const D = UI.detail;
const TIER_COLORS: Readonly<Record<ScoreTier, string>> = {
  weak: "#b8b4bc",
  fair: "#5fcf7a",
  good: "#5fcf7a",
  great: "#5aa2ef",
  excellent: "#c477e8",
  perfect: "#ffd25a",
};
const SEGMENT_COLORS = ["#b8b4bc", "#e2574c", "#f08a3c", "#5fcf7a", "#5fcf7a", "#5aa2ef", "#5aa2ef", "#c477e8", "#c477e8", "#ffd25a"];
const POTENCY_COLORS = ["#d8b4bc", "#5fcf7a", "#3fa7ef", "#c477e8", "#ffc43a"];

const decimal = (value: number, digits: number) => value.toLocaleString("pt-BR", { minimumFractionDigits: digits, maximumFractionDigits: digits });

function Section({ title, hint, children }: { title: string; hint?: string; children: ReactNode }) {
  return (
    <section className="detail-section">
      <h4>
        {title}
        {hint && <small>{hint}</small>}
      </h4>
      {children}
    </section>
  );
}

function Metric({ label, value, sub, tone = "dark" }: { label: string; value: ReactNode; sub?: string; tone?: "dark" | "green" | "gold" | "blue" }) {
  return (
    <div className={`metric metric-${tone}`}>
      <span>{label}</span>
      <strong>{value}</strong>
      {sub && <small>{sub}</small>}
    </div>
  );
}

/** Four-axis radar: current stats (solid) and IVs (dashed). */
function StatRadar({ stats, ivs, scale }: { stats: Stats; ivs: Stats; scale: number }) {
  const size = 170;
  const c = size / 2;
  const r = 62;
  const angle = (i: number) => (Math.PI * 2 * i) / STAT_KEYS.length - Math.PI / 2;
  const point = (i: number, ratio: number) => [c + Math.cos(angle(i)) * r * ratio, c + Math.sin(angle(i)) * r * ratio] as const;
  const polygon = (ratio: (i: number) => number) => STAT_KEYS.map((_, i) => point(i, ratio(i)).join(",")).join(" ");
  return (
    <svg className="radar" viewBox={`0 0 ${size} ${size}`} width={size} height={size} aria-hidden>
      {[1, 0.75, 0.5, 0.25].map((ring) => (
        <polygon key={ring} points={polygon(() => ring)} className="radar-ring" />
      ))}
      <polygon points={polygon((i) => Math.min(1, stats[STAT_KEYS[i]!] / scale))} className="radar-fill" />
      <polygon points={polygon((i) => ivs[STAT_KEYS[i]!] / MAX_IV)} className="radar-iv" />
      {STAT_KEYS.map((key, i) => {
        const [x, y] = point(i, 1.24);
        return (
          <text key={key} x={x} y={y} className="radar-label" textAnchor="middle" dominantBaseline="middle">
            {STAT_NAMES[key]}
          </text>
        );
      })}
    </svg>
  );
}

function summaryText(bug: BugInstance, state: GameState): string {
  const species = getSpecies(bug.speciesId);
  const stats = computeStats(bug);
  return [
    `${species.name} Nv ${bug.level}${bug.shiny ? " (shiny)" : ""} - tipos: ${species.types.join("/")}`,
    `Potência P${bug.potency}, IV ${ivTotal(bug)}/124, nota ${decimal(bugScore(bug), 3)}/10`,
    `Stats: ${STAT_KEYS.map((k) => `${STAT_NAMES[k]} ${stats[k]} (IV ${bug.ivs[k]}, refino +${bug.refine[k]})`).join(", ")}`,
    `Poder ${powerRating(bug)}; limite de nível atual ${levelCap(state)}`,
  ].join("\n");
}

export function BugDetailModal({ uid }: { uid: string }) {
  const state = useGame();
  const { close, report, open, toast, markCompare } = useApp();
  const [confirmRelease, setConfirmRelease] = useState(false);
  const [confirmReduce, setConfirmReduce] = useState(false);
  const bug = state.bugs[uid];
  if (!bug) return null;

  const species = getSpecies(bug.speciesId);
  const stats = computeStats(bug);
  const score = bugScore(bug);
  const tier = scoreTier(score);
  const inTeam = state.team.includes(uid);
  const housed = houseOf(state, uid) !== undefined;
  const scale = Math.max(60, ...STAT_KEYS.map((k) => stats[k]));
  const evo = species.evolution;
  const next = evo ? getSpecies(evo.to) : null;
  const all = Object.values(state.bugs).sort((a, b) => powerRating(b) - powerRating(a));
  const rank = all.findIndex((b) => b.uid === uid) + 1;
  const secondsPerAttack = (ACTION_GAUGE * GAUGE_DIVISOR) / stats.spd / 1000;
  const need = xpToNextLevel(bug.level);
  const capped = bug.level >= levelCap(state);
  const stoneTypes = species.types;
  const originText = ROUTE_NAMES[bug.origin] ?? D.origins[bug.origin] ?? bug.origin;

  return (
    <Modal title={species.name.toUpperCase()} onClose={close} wide>
      <div className="detail-hero">
        <div className="spotlight" />
        <BugSprite speciesId={bug.speciesId} shiny={bug.shiny} size={168} className="bob slow" />
        <div className="detail-score">
          <strong style={{ color: TIER_COLORS[tier] }}>{decimal(score, 3)}</strong>
          <span>/ 10,0</span>
        </div>
        <div className="detail-tier" style={{ color: TIER_COLORS[tier] }}>
          {D.tiers[tier]}
        </div>
        <div className="score-bar">
          {SEGMENT_COLORS.map((color, i) => (
            <span key={i} style={{ background: i < Math.floor(score) ? color : undefined }} />
          ))}
          <i style={{ left: `${(score / 10) * 100}%` }} />
        </div>
      </div>

      <div className="detail-name">
        <h3 className={bug.shiny ? "shiny-text" : ""}>{species.name}</h3>
        <div className="tag-row">
          <Tag>
            {UI.level} {bug.level}
          </Tag>
          {species.types.map((t) => (
            <TypeTag key={t} type={t} />
          ))}
          <Tag tone="pink">{RARITY_NAMES[species.rarity]}</Tag>
          {bug.shiny && <Tag tone="gold">SHINY</Tag>}
          {REFINABLE_STATS.some((k) => bug.refine[k] > 0) && <Tag tone="blue">+{REFINABLE_STATS.reduce((s, k) => s + bug.refine[k], 0)} refino</Tag>}
        </div>
      </div>

      <div className="metric-grid">
        <Metric label={D.potency} value={`P${bug.potency}`} tone="green" />
        <Metric label={D.quality} value={UI.qualityGrades[ivGrade(bug)]} tone="gold" />
        <Metric label={D.ivSum} value={<>{ivTotal(bug)}<small>/{MAX_IV * 4}</small></>} tone="blue" />
        <Metric label={D.power} value={formatNumber(powerRating(bug))} sub={D.ranking(rank, all.length)} />
        <Metric label={D.combatHp} value={formatNumber(stats.hp)} />
        <Metric label={D.speed} value={stats.spd} sub={D.attackEvery(decimal(secondsPerAttack, 2))} />
      </div>

      <div className="button-grid three">
        <Button onClick={() => markCompare("A", uid)}>{D.compareA}</Button>
        <Button onClick={() => markCompare("B", uid)}>{D.compareB}</Button>
        <Button
          onClick={() => {
            void navigator.clipboard?.writeText(summaryText(bug, state)).then(() => toast(D.copied));
          }}
        >
          {D.copySummary}
        </Button>
        <Button
          variant="gold"
          onClick={() => {
            if (!confirmReduce) return setConfirmReduce(true);
            report(store.run((s) => reduceLevel(s, uid)));
            setConfirmReduce(false);
          }}
        >
          {confirmReduce ? D.reduceConfirm : D.reduceLevel}
        </Button>
        <Button variant="gold" disabled={!canEvolveNow(state, bug)} onClick={() => report(store.run((s) => evolveBug(s, uid)))}>
          {UI.evolve}
        </Button>
        <Button onClick={() => open({ kind: "bugdex", speciesId: bug.speciesId })}>{D.speciesSheet}</Button>
        {inTeam && state.team[0] !== uid && <Button onClick={() => report(store.run((s) => setLead(s, uid)))}>{UI.setLead}</Button>}
        {inTeam ? (
          <Button onClick={() => report(store.run((s) => moveToBox(s, uid)))}>{UI.toBox}</Button>
        ) : (
          <Button disabled={state.team.length >= MAX_TEAM_SIZE || housed} onClick={() => report(store.run((s) => moveToTeam(s, uid)))}>
            {UI.toTeam}
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

      <Section title={D.stats}>
        <div className="stats-layout">
          <StatRadar stats={stats} ivs={bug.ivs} scale={scale} />
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
        <div className="legend">
          <span className="legend-stats">{D.legendStats}</span>
          <span className="legend-iv">{D.legendIv}</span>
        </div>
        <p className="muted small">{D.ivExplain}</p>
      </Section>

      <Section title={D.baseStats} hint={D.baseHint}>
        <div className="tag-row">
          {stoneTypes.map((type) => (
            <span key={type} className="stone-chip">
              <img className="pixel" src={stoneIconUrl(type)} width={24} height={24} alt="" />
              {stoneName(type)} <strong>x{stoneCount(state, type)}</strong>
            </span>
          ))}
        </div>
        <table className="stat-table refine-table">
          <tbody>
            {STAT_KEYS.map((key) => {
              const refinable = REFINABLE_STATS.includes(key);
              const steps = bug.refine[key];
              const cost = refineCost(steps);
              return (
                <tr key={key}>
                  <th>{STAT_NAMES[key]}</th>
                  <td className="stat-bar-cell">
                    <Bar kind="xp" value={species.baseStats[key] + steps * REFINE_BASE_BONUS} max={150} />
                  </td>
                  <td className="num">
                    {species.baseStats[key]}
                    {steps > 0 && <span className="boost"> +{steps * REFINE_BASE_BONUS}</span>}
                  </td>
                  <td className="num">
                    {refinable ? (
                      <Button
                        small
                        variant="dark"
                        disabled={steps >= MAX_REFINE || usableStones(state, bug) < cost}
                        title={`${cost} pedras`}
                        onClick={() => report(store.run((s) => refineStat(s, uid, key)))}
                      >
                        +1 <small>({cost})</small>
                      </Button>
                    ) : (
                      <span className="muted">{D.fixed}</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        <p className="muted small">{D.refineExplain(REFINE_COST_UNIT)}</p>
      </Section>

      <Section title={D.evolution}>
        <div className="evo-chain">
          <div className="evo-card current">
            <BugSprite speciesId={bug.speciesId} shiny={bug.shiny} size={64} />
            <strong>{species.name}</strong>
            <span className="muted">
              {UI.level} {bug.level}
            </span>
          </div>
          {next && evo ? (
            <>
              <div className="evo-arrow">
                <span>v</span>
                <span>v</span>
                <span>v</span>
              </div>
              <div className="evo-requirements">
                {evo.item ? (
                  <span className="stone-chip">
                    <ItemIcon id={evo.item} size={24} />
                    {D.needsItem(ITEM_TEXT[evo.item].name)}
                  </span>
                ) : (
                  <>
                    <span className="stone-chip">
                      <img className="pixel" src={stoneIconUrl(species.types[0])} width={24} height={24} alt="" />
                      {D.needsStones(stoneName(species.types[0]), evolutionStoneCost(species), usableStones(state, bug))}
                    </span>
                    <span className={bug.level >= (evo.level ?? 0) ? "ok-text" : "muted"}>{D.needsLevel(bug.level, evo.level ?? 0)}</span>
                  </>
                )}
              </div>
              <div className="evo-card">
                <BugSprite speciesId={next.id} size={64} />
                <strong>{next.name}</strong>
                <span className="muted">{evo.level ? `${UI.level} ${evo.level}` : ITEM_TEXT[evo.item!].name}</span>
              </div>
            </>
          ) : (
            <p className="muted small">{D.finalForm}</p>
          )}
        </div>
      </Section>

      <Section title={D.experience}>
        <Bar kind="xp" value={bug.xp} max={need} label={`${formatNumber(bug.xp)} / ${formatNumber(need)} xp`} />
        <div className="metric-grid">
          <Metric label={D.xpTotal} value={formatNumber(totalXp(bug.level, bug.xp))} />
          <Metric label={D.xpMissing} value={capped ? "-" : formatNumber(need - bug.xp)} sub={capped ? D.atCap : undefined} />
          <Metric label={D.nextLevel} value={bug.level + 1} />
        </div>
      </Section>

      <Section title={D.identity}>
        <div className="metric-grid two">
          <Metric label={D.id} value={<span className="pink">#{bug.uid.replace(/\D/g, "").padStart(6, "0")}</span>} />
          <Metric label={D.caughtAt} value={<span className="pink">{bug.caughtAt ? new Date(bug.caughtAt).toLocaleDateString("pt-BR") : D.unknown}</span>} />
          <Metric label={D.caughtBy} value={<span className="pink">{bug.caughtBy ?? state.trainer.name}</span>} />
          <Metric label={D.species} value={`#${species.dex} ${species.name}`} />
          <Metric label={D.origin} value={originText} />
        </div>
      </Section>

      <Section title={D.potencyTitle}>
        <div className="potency-grid">
          {POTENCY_TABLE.map((row, i) => {
            const power = Object.values(computeStatsFor(species, bug.level, bug.ivs, bug.boosts, bug.refine, row.potency)).reduce((a, b) => a + b, 0);
            const mine = row.potency === bug.potency;
            return (
              <div key={row.potency} className={`potency-col ${mine ? "mine" : ""}`} style={{ "--potency-color": POTENCY_COLORS[i], "--potency-h": `${46 + i * 10}px` } as CSSProperties}>
                {mine && <span className="potency-badge">{D.thisOne}</span>}
                <div className="potency-block">P{row.potency}</div>
                <strong>{decimal(row.chance * 100, row.chance < 0.001 ? 4 : row.chance < 0.01 ? 2 : 1)}%</strong>
                <span className="potency-bonus">{row.bonus === 0 ? "-" : `+${Math.round(row.bonus * 100)}%`}</span>
                <small>P {formatNumber(power)}</small>
              </div>
            );
          })}
        </div>
        <p className="muted small">{D.potencyExplain}</p>
      </Section>
    </Modal>
  );
}
