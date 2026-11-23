import { computeStats, ivGrade, ivTotal, powerRating, type BugInstance } from "../../game/bug";
import { getSpecies } from "../../game/data/species";
import { xpToNextLevel } from "../../game/experience";
import { UI } from "../../i18n/ptBR";
import { formatNumber } from "../format";
import { Bar, BugSprite, Tag, TypeTag } from "./primitives";

/** Name, tags and bars of a bug. Used by the team list, the active card and the box. */
/** `idle` makes the sprite breathe and blink between its two frames (team list, "em campo"). */
export function BugSummary({ bug, compact = false, showXp = true, idle = false, idlePhase = 0 }: { bug: BugInstance; compact?: boolean; showXp?: boolean; idle?: boolean; idlePhase?: number }) {
  const awake = idle && bug.currentHp > 0;
  const species = getSpecies(bug.speciesId);
  const max = computeStats(bug).hp;
  return (
    <div className={`bug-summary ${compact ? "compact" : ""}`}>
      <span className={awake ? "idle-bob" : undefined} style={awake ? { animationDelay: `${-idlePhase * 0.37}s` } : undefined}>
        <BugSprite speciesId={bug.speciesId} shiny={bug.shiny} size={compact ? 36 : 56} className={bug.currentHp <= 0 ? "fainted" : ""} animate={awake} phase={idlePhase} />
      </span>
      <div className="bug-summary-info">
        <div className="bug-summary-name">
          <strong className={bug.shiny ? "shiny-text" : ""}>{species.name}</strong>
          <span className="muted">
            {UI.level} {bug.level}
          </span>
        </div>
        <div className="tag-row">
          {!compact && species.types.map((t) => <TypeTag key={t} type={t} />)}
          <Tag tone="green">IV {ivTotal(bug)}</Tag>
          <Tag tone="gold">{UI.qualityGrades[ivGrade(bug)]}</Tag>
          <Tag tone="blue">P {formatNumber(powerRating(bug))}</Tag>
        </div>
        <Bar kind="hp" value={bug.currentHp} max={max} label={`${bug.currentHp} / ${max}`} />
        {showXp && <Bar kind="xp" value={bug.xp} max={xpToNextLevel(bug.level)} label={`${formatNumber(bug.xp)} / ${formatNumber(xpToNextLevel(bug.level))} xp`} />}
      </div>
    </div>
  );
}
