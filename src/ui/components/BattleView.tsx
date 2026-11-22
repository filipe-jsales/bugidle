import { activeEnemy, activePlayerBug } from "../../game/battle";
import { maxHp, type BugInstance } from "../../game/bug";
import { getSpecies } from "../../game/data/species";
import { getBoss, getRegion, getRoute } from "../../game/data/world";
import { forfeitBoss, RECOVERY_MS, visitRebootCenter } from "../../game/engine";
import { teamBugs } from "../../game/state";
import { BOSS_TITLES, ROUTE_NAMES, UI } from "../../i18n/ptBR";
import { useApp } from "../appContext";
import { buildAttackFx } from "../render/attackFx";
import { formatClock } from "../format";
import { terrainUrl } from "../render/terrain";
import { store, useGame, type TimedEvent } from "../store";
import { AttackLayer } from "./AttackLayer";
import { Bar, BugSprite, Button, Icon, Tag } from "./primitives";

const FLOAT_MS = 1500;

function Plate({ bug, side }: { bug: BugInstance; side: "player" | "enemy" }) {
  const species = getSpecies(bug.speciesId);
  const max = maxHp(bug);
  return (
    <div className={`battle-plate plate-${side}`}>
      <div className="plate-name">
        <strong className={bug.shiny ? "shiny-text" : ""}>{species.name}</strong>
        <span>
          {UI.level} {bug.level}
        </span>
      </div>
      <Bar kind="hp" value={bug.currentHp} max={max} label={side === "player" ? `${bug.currentHp}/${max}` : undefined} />
    </div>
  );
}

function lastOf(recent: TimedEvent[], predicate: (e: TimedEvent) => boolean): TimedEvent | undefined {
  for (let i = recent.length - 1; i >= 0; i--) if (predicate(recent[i]!)) return recent[i];
  return undefined;
}

export function BattleView() {
  const state = useGame();
  const { report, open } = useApp();
  const now = performance.now();
  const rt = state.runtime;
  const battle = rt.battle;
  const team = teamBugs(state);
  const player = activePlayerBug(team);
  const enemy = battle ? activeEnemy(battle) : undefined;
  const recent = store.recent;

  const activity = state.activity;
  const isBoss = activity.kind === "boss";
  const routeId = activity.kind === "route" ? activity.routeId : activity.returnRouteId;
  const route = getRoute(routeId);
  const region = getRegion(isBoss ? getBoss(activity.bossId).regionId : route.regionId);
  const background = terrainUrl(region.terrain, isBoss ? activity.bossId : routeId);

  const lastPlayerHit = lastOf(recent, (e) => e.event.type === "attack" && e.event.side === "player");
  const lastEnemyHit = lastOf(recent, (e) => e.event.type === "attack" && e.event.side === "enemy");
  const lastThrow = lastOf(recent, (e) => e.event.type === "captureAttempt");
  const throwing = lastThrow && now - lastThrow.at < FLOAT_MS ? lastThrow : undefined;
  const floating = recent.filter((e) => e.event.type === "attack" && now - e.at < FLOAT_MS);
  const lastLine = store.log[0];
  const lastCrit = lastOf(recent, (e) => e.event.type === "attack" && e.event.critical);
  const shaking = lastCrit !== undefined && now - lastCrit.at < 420;

  return (
    <section className="panel battle-panel">
      <div className={`battle-scene pixel ${shaking ? "shake" : ""}`} style={{ backgroundImage: `url(${background})` }}>
        <div className="battle-label">
          {isBoss ? (
            <>
              <strong>{getBoss(activity.bossId).name}</strong>
              <span className="muted">{BOSS_TITLES[activity.bossId]}</span>
              {battle?.timeLimitMs && (
                <Tag tone="pink">
                  {UI.timeLeft} {formatClock(battle.timeLimitMs - battle.elapsedMs)}
                </Tag>
              )}
            </>
          ) : (
            <>
              <strong>{ROUTE_NAMES[route.id]}</strong>
              <span className="muted">
                {UI.level} {route.minLevel}-{route.maxLevel}
              </span>
            </>
          )}
        </div>

        <div className="battle-actions">
          <Button variant="dark" small onClick={() => open({ kind: "sound" })} aria-label={UI.sound.title}>
            <Icon name="sound" size={14} />
          </Button>
          {isBoss ? (
            <Button variant="danger" onClick={() => report(store.run(forfeitBoss))}>
              {UI.forfeit}
            </Button>
          ) : (
            <Button variant="purple" onClick={() => report(store.run(visitRebootCenter))}>
              <Icon name="reboot" size={14} /> <span className="btn-text">{UI.rebootCenter}</span>
            </Button>
          )}
        </div>

        {enemy && battle && !battle.outcome && (
          <>
            <Plate bug={enemy} side="enemy" />
            <div className="fighter fighter-enemy">
              <div className="shadow" />
              <div key={lastEnemyHit?.id ?? 0} className="lunge-enemy">
                <div key={lastPlayerHit?.id ?? 0} className="hit-flash">
                  <BugSprite speciesId={enemy.speciesId} shiny={enemy.shiny} size={120} className="bob" />
                </div>
              </div>
              {throwing && (
                <div key={throwing.id} className={`trap-throw ${throwing.event.type === "captureAttempt" && throwing.event.success ? "success" : "fail"}`}>
                  <Icon name="trap" size={28} />
                </div>
              )}
            </div>
          </>
        )}

        {player && (
          <>
            <Plate bug={player} side="player" />
            <div className="fighter fighter-player">
              <div className="shadow" />
              <div key={lastPlayerHit?.id ?? 0} className="lunge-player">
                <div key={lastEnemyHit?.id ?? 0} className="hit-flash">
                  <BugSprite speciesId={player.speciesId} shiny={player.shiny} size={136} className="bob slow" />
                </div>
              </div>
            </div>
          </>
        )}

        {floating.map((e) =>
          e.event.type === "attack" ? (
            <span
              key={e.id}
              style={{ animationDelay: `${buildAttackFx(e.event, e.id).fx.travelMs}ms` }}
              className={`damage-float ${e.event.side === "player" ? "on-enemy" : "on-player"} ${e.event.effectiveness > 1 ? "super" : e.event.effectiveness < 1 ? "weak" : ""}`}>
              {e.event.damage === 0 ? "imune" : `-${e.event.damage}`}
              {e.event.critical && "!"}
            </span>
          ) : null,
        )}

        <AttackLayer recent={recent} now={now} />

        {rt.recoveryMs > 0 && (
          <div className="scene-overlay">
            <span>{UI.rebooting}</span>
            <div className="overlay-bar">
              <Bar kind="time" value={RECOVERY_MS - rt.recoveryMs} max={RECOVERY_MS} />
            </div>
          </div>
        )}
        {!battle && rt.recoveryMs <= 0 && team.length > 0 && <div className="scene-hint">{UI.searching}</div>}
      </div>
      <div className={`battle-log-line tone-${lastLine?.tone ?? "info"}`}>{lastLine?.text ?? " "}</div>
    </section>
  );
}
