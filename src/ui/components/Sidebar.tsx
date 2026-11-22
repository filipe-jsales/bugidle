import { activePlayerBug } from "../../game/battle";
import { dexProgress } from "../../game/bugdex";
import { BOSSES } from "../../game/data/world";
import { evolveBug } from "../../game/engine";
import { canEvolveByLevel } from "../../game/evolution";
import { trainerXpToNext } from "../../game/experience";
import { levelCap } from "../../game/progression";
import { MAX_TEAM_SIZE, teamBugs } from "../../game/state";
import { UI } from "../../i18n/ptBR";
import { useApp } from "../appContext";
import { formatNumber } from "../format";
import { store, useGame } from "../store";
import { BugSummary } from "./BugSummary";
import { Bar, BugSprite, Button, Icon, Panel } from "./primitives";

export function PlayerCard() {
  const state = useGame();
  const { open } = useApp();
  const dex = dexProgress(state);
  const lead = teamBugs(state)[0];
  return (
    <Panel className="player-card">
      <div className="player-head">
        <div className="avatar">{lead && <BugSprite speciesId={lead.speciesId} shiny={lead.shiny} size={44} />}</div>
        <div className="player-info">
          <div className="player-name-row">
            <strong>{state.trainer.name}</strong>
            <span className="muted">
              {UI.level} {state.trainer.level}
            </span>
          </div>
          <Bar kind="xp" value={state.trainer.xp} max={trainerXpToNext(state.trainer.level)} label={`${formatNumber(state.trainer.xp)} / ${formatNumber(trainerXpToNext(state.trainer.level))} xp`} />
        </div>
      </div>
      <div className="stat-grid">
        <div className="stat-chip">
          <Icon name="coin" size={18} />
          <span>{formatNumber(state.coins)}</span>
        </div>
        <button type="button" className="stat-chip clickable" onClick={() => open({ kind: "bugdex" })}>
          <Icon name="bugdex" size={18} />
          <span>
            {dex.caught}/{dex.total}
          </span>
        </button>
        <button type="button" className="stat-chip clickable" onClick={() => open({ kind: "bosses" })}>
          <Icon name="bosses" size={18} />
          <span>
            {state.badges.length}/{BOSSES.length}
          </span>
        </button>
        <div className="stat-chip" title={UI.levelCap}>
          <span className="muted">cap</span>
          <span>{levelCap(state)}</span>
        </div>
      </div>
    </Panel>
  );
}

export function ActiveBugCard() {
  const state = useGame();
  const { open, report } = useApp();
  const active = activePlayerBug(teamBugs(state)) ?? teamBugs(state)[0];
  return (
    <Panel title={UI.inField}>
      {active ? (
        <div className="inset clickable" onClick={() => open({ kind: "bug", uid: active.uid })}>
          <BugSummary bug={active} />
        </div>
      ) : (
        <div className="inset muted">-</div>
      )}
      {active && !state.settings.autoEvolve && canEvolveByLevel(active) && (
        <Button variant="gold" onClick={() => report(store.run((s) => evolveBug(s, active.uid)))}>
          {UI.evolve}
        </Button>
      )}
    </Panel>
  );
}

export function TeamPanel() {
  const state = useGame();
  const { open } = useApp();
  const team = teamBugs(state);
  return (
    <Panel
      title={`${UI.team} ${team.length}/${MAX_TEAM_SIZE}`}
      actions={
        <Button small variant="dark" onClick={() => open({ kind: "box" })}>
          {UI.nav.box}
        </Button>
      }
      className="team-panel"
    >
      <div className="team-list">
        {team.map((bug, index) => (
          <button key={bug.uid} type="button" className={`team-row ${index === 0 ? "lead" : ""}`} onClick={() => open({ kind: "bug", uid: bug.uid })}>
            <BugSummary bug={bug} compact showXp={false} />
          </button>
        ))}
      </div>
    </Panel>
  );
}
