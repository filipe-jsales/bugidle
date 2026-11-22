import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { activeEnemy, activePlayerBug } from "../../game/battle";
import { maxHp, type BugInstance } from "../../game/bug";
import { getSpecies } from "../../game/data/species";
import { getBoss, getRegion, getRoute } from "../../game/data/world";
import { forfeitBoss, RECOVERY_MS, returnToHunt, visitRebootCenter } from "../../game/engine";
import { defaultRng } from "../../game/rng";
import { teamBugs, type GameState } from "../../game/state";
import { walkFrame } from "../../sprites/trainerSprite";
import { BOSS_TITLES, ROUTE_NAMES, UI } from "../../i18n/ptBR";
import { useApp } from "../appContext";
import { formatClock, formatNumber } from "../format";
import { buildAttackFx } from "../render/attackFx";
import { trainerSpriteUrl } from "../render/pixels";
import { terrainUrl } from "../render/terrain";
import { propSprite, roadsUrl } from "../render/mapProps";
import { store, useGame, type TimedEvent } from "../store";
import { createWorld, stepWorld, type Vec, type WorldModel } from "../world/worldModel";
import { worldFor } from "../world/worldRegistry";
import { centerOn, followZoom, MIN_ZOOM, ZOOM_STEP } from "../world/viewport";
import { ProximityPanel } from "./ProximityPanel";
import { getPreferences, lightingFor, mapFps, setPreference, usePreferences } from "../preferences";
import { SETTINGS_UI } from "../../i18n/settings.ptBR";
import { AttackLayer } from "./AttackLayer";
import { DebugPanel } from "./DebugPanel";
import { Bar, BugSprite, Button, Icon, ItemIcon, Tag } from "./primitives";

/** Map size in screen pixels; the terrain is generated at half and scaled 2x. Big enough to fill a wide screen zoomed out. */
const MAP_W = 2800;
const MAP_H = 1700;
const MAP_SIZE = { width: MAP_W, height: MAP_H };
const BUG_PX = 56;
const WILD_PX = 44;
const TRAINER_SCALE = 2.5;
const FLOAT_MS = 1500;
const FAINT_MS = 600;
/** Height of a bug's body centre above its feet, for projectiles and texts. */
const BODY_Y = BUG_PX * 0.55;

function lastOf(recent: TimedEvent[], predicate: (e: TimedEvent) => boolean): TimedEvent | undefined {
  for (let i = recent.length - 1; i >= 0; i--) if (predicate(recent[i]!)) return recent[i];
  return undefined;
}

function sceneInfo(state: GameState) {
  const activity = state.activity;
  const routeId = activity.kind === "route" ? activity.routeId : activity.returnRouteId;
  if (activity.kind === "boss") {
    const boss = getBoss(activity.bossId);
    return { key: boss.id, regionId: boss.regionId, pool: boss.team.map((m) => m.speciesId), routeId };
  }
  const route = getRoute(routeId);
  return { key: route.id, regionId: route.regionId, pool: route.encounters.flatMap((e) => Array<string>(Math.max(1, Math.round(e.weight / 5))).fill(e.speciesId)), routeId };
}

function encounterKeyOf(state: GameState): string | null {
  const battle = state.runtime.battle;
  if (!battle || battle.outcome) return null;
  return `${battle.bossId ?? "wild"}:${battle.enemies[0]?.uid ?? ""}`;
}

/** Position helper: entities are anchored at their feet. */
const at = (pos: Vec, extra: CSSProperties = {}): CSSProperties => ({ left: pos.x, top: pos.y, zIndex: Math.round(pos.y), ...extra });

function Nameplate({ bug, showHp }: { bug: BugInstance; showHp: boolean }) {
  const max = maxHp(bug);
  return (
    <div className="nameplate">
      <div className="nameplate-name">
        <strong className={bug.shiny ? "shiny-text" : ""}>{getSpecies(bug.speciesId).name}</strong>
        <span>
          {UI.level} {bug.level}
        </span>
      </div>
      <Bar kind="hp" value={bug.currentHp} max={max} label={showHp ? `${bug.currentHp}/${max}` : undefined} />
    </div>
  );
}

/** Four pixel sparkles turning around a shiny bug. */
function ShinySparkles() {
  return (
    <div className="shiny-sparkles" aria-hidden>
      <i />
      <i />
      <i />
      <i />
    </div>
  );
}

interface FloatText {
  id: string;
  text: string;
  tone: string;
  pos: Vec;
  delayMs: number;
}

export function BattleView() {
  const state = useGame();
  const { report, open } = useApp();
  const viewportRef = useRef<HTMLDivElement>(null);
  const [viewport, setViewport] = useState({ width: 640, height: 360 });
  const [, setFrame] = useState(0);
  const scene = sceneInfo(state);
  const region = getRegion(scene.regionId);

  const world = useMemo<WorldModel>(() => worldFor(scene.key, () => createWorld(MAP_W, MAP_H, scene.pool, defaultRng)), [scene.key]);
  const lastEnemy = useRef<{ bug: BugInstance; pos: Vec; endedAt: number | null } | null>(null);
  // The battle camera always follows the trainer; the player only picks the zoom, with the buttons.
  const [zoomChoice, setZoomChoice] = useState(1);

  useEffect(() => {
    const el = viewportRef.current;
    if (!el) return;
    const observer = new ResizeObserver(([entry]) => {
      if (entry) setViewport({ width: entry.contentRect.width, height: entry.contentRect.height });
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // Animation loop: the map moves at the screen's frame rate, independent of the 10 Hz game clock.
  const viewportSize = useRef(viewport);
  viewportSize.current = viewport;
  useEffect(() => {
    let last = performance.now();
    let raf = 0;
    const loop = (now: number) => {
      raf = requestAnimationFrame(loop);
      // performance modes draw fewer frames; the world still advances by the real time passed
      const fps = mapFps(getPreferences());
      if (now - last < 1000 / fps - 2) return;
      stepWorld(world, (now - last) / 1000, { encounterKey: encounterKeyOf(store.state), viewport: viewportSize.current }, defaultRng);
      last = now;
      setFrame((f) => (f + 1) % 1_000_000);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [world]);

  const prefs = usePreferences();
  const lighting = prefs.timeLighting ? lightingFor(new Date().getHours()) : null;
  const now = performance.now();
  const rt = state.runtime;
  const battle = rt.battle;
  const team = teamBugs(state);
  const player = activePlayerBug(team) ?? team[0];
  const enemy = battle && !battle.outcome ? activeEnemy(battle) : undefined;
  const recent = store.recent;

  // remember the last enemy so it can fade out after fainting or being caught
  if (enemy && world.encounter) lastEnemy.current = { bug: enemy, pos: world.encounter.pos, endedAt: null };
  else if (lastEnemy.current && lastEnemy.current.endedAt === null) lastEnemy.current.endedAt = now;
  const ghost = lastEnemy.current && lastEnemy.current.endedAt !== null && now - lastEnemy.current.endedAt < FAINT_MS ? lastEnemy.current : null;
  const caughtRecently = lastOf(recent, (e) => e.event.type === "captured" && now - e.at < FAINT_MS);

  const playerPos = world.follower.pos;
  const enemyPos = world.encounter?.pos ?? lastEnemy.current?.pos ?? playerPos;
  const trainerPos = world.trainer.pos;
  const body = (p: Vec): Vec => ({ x: p.x, y: p.y - BODY_Y });

  const lastPlayerHit = lastOf(recent, (e) => e.event.type === "attack" && e.event.side === "player");
  const lastEnemyHit = lastOf(recent, (e) => e.event.type === "attack" && e.event.side === "enemy");
  const lastThrow = lastOf(recent, (e) => e.event.type === "captureAttempt");
  const throwing = lastThrow && now - lastThrow.at < 900 ? lastThrow : undefined;
  const lastCrit = lastOf(recent, (e) => e.event.type === "attack" && e.event.critical);
  const shaking = lastCrit !== undefined && now - lastCrit.at < 420;
  const lastLine = store.log[0];
  const lastLevelUp = lastOf(recent, (e) => e.event.type === "levelUp" && e.event.uid === player?.uid);
  const levelUp = lastLevelUp && now - lastLevelUp.at < 900 ? lastLevelUp : undefined;

  const floats: FloatText[] = [];
  for (const { id, at: time, event } of recent) {
    if (now - time > FLOAT_MS + 600) continue;
    if (event.type === "attack") {
      const target = event.side === "player" ? enemyPos : playerPos;
      const tone = event.effectiveness > 1 ? "super" : event.effectiveness < 1 ? "weak" : "damage";
      floats.push({ id: `${id}`, text: event.damage === 0 ? "imune" : `-${event.damage}${event.critical ? "!" : ""}`, tone, pos: { x: target.x, y: target.y - BUG_PX - 26 }, delayMs: buildAttackFx(event, id).fx.travelMs });
    } else if (event.type === "rewards") {
      floats.push({ id: `${id}-xp`, text: `+${formatNumber(event.xp)} xp`, tone: "xp", pos: { x: playerPos.x, y: playerPos.y - BUG_PX - 30 }, delayMs: 150 });
      if (event.benchXp > 0 && team.length > 1) floats.push({ id: `${id}-bench`, text: `equipe +${formatNumber(event.benchXp)} xp`, tone: "bench", pos: { x: playerPos.x, y: playerPos.y - BUG_PX - 8 }, delayMs: 350 });
      floats.push({ id: `${id}-tr`, text: `+${formatNumber(event.trainerXp)} xp`, tone: "trainer", pos: { x: trainerPos.x, y: trainerPos.y - 22 * TRAINER_SCALE - 28 }, delayMs: 250 });
      if (event.coins > 0) floats.push({ id: `${id}-coin`, text: `+${formatNumber(event.coins)}`, tone: "coin", pos: { x: trainerPos.x + 34, y: trainerPos.y - 22 * TRAINER_SCALE - 6 }, delayMs: 450 });
    } else if (event.type === "levelUp" && event.uid === player?.uid) {
      floats.push({ id: `${id}-lv`, text: `Nv ${event.level}!`, tone: "level", pos: { x: playerPos.x, y: playerPos.y - BUG_PX - 52 }, delayMs: 300 });
    } else if (event.type === "captured") {
      floats.push({ id: `${id}-cap`, text: "CAPTURADO!", tone: "level", pos: { x: enemyPos.x, y: enemyPos.y - BUG_PX - 30 }, delayMs: 0 });
    }
  }

  const activity = state.activity;
  const isBoss = activity.kind === "boss";
  const trainerFacing = world.trainer.facing;
  const zoom = followZoom(zoomChoice, viewport, MAP_SIZE);
  const camera = centerOn(world.trainer.pos, zoom, viewport, MAP_SIZE);
  const changeZoom = (factor: number) => setZoomChoice(Math.max(MIN_ZOOM, followZoom(zoom * factor, viewport, MAP_SIZE)));

  return (
    <section className="panel battle-panel">
      <div ref={viewportRef} className={`battle-scene ${shaking ? "shake" : ""}`}>
        <div
          className="world pixel"
          style={{
            width: MAP_W,
            height: MAP_H,
            transform: `translate(${-Math.round(camera.x * zoom)}px, ${-Math.round(camera.y * zoom)}px) scale(${zoom})`,
            backgroundImage: `url(${roadsUrl(world.nav, region.terrain, scene.key)}), url(${terrainUrl(region.terrain, scene.key, MAP_W / 2, MAP_H / 2, false)})`,
            backgroundSize: `${MAP_W}px ${MAP_H}px, ${MAP_W}px ${MAP_H}px`,
          }}
        >
          {world.nav.obstacles.map((o) => {
            const prop = propSprite(region.terrain, o);
            // the footprint circle sits at the bottom of the drawing; depth by the footprint's front edge
            return (
              <img
                key={`o${o.id}`}
                className="map-prop pixel"
                src={prop.url}
                width={prop.width}
                height={prop.height}
                alt=""
                draggable={false}
                style={{ left: o.x - prop.width / 2, top: o.y + o.r * 0.55 - prop.height, zIndex: Math.round(o.y + o.r * 0.55) }}
              />
            );
          })}

          {world.wanderers.map((w) => (
            <div key={w.id} className="entity wild" style={at(w.pos)}>
              <div className="shadow" />
              <BugSprite speciesId={w.speciesId} size={WILD_PX} animate phase={w.id * 0.37} />
            </div>
          ))}

          {enemy && world.encounter && (
            <div className="entity" style={at(world.encounter.pos)}>
              {prefs.nameplates && <Nameplate bug={enemy} showHp={false} />}
              <div className="shadow" />
              <div key={lastEnemyHit?.id ?? 0} className="lunge" style={{ "--lx": `${Math.sign(playerPos.x - enemyPos.x) * 14}px`, "--ly": `${Math.sign(playerPos.y - enemyPos.y) * 8}px` } as CSSProperties}>
                <div key={lastPlayerHit?.id ?? 0} className="hit-flash">
                  <div key={world.encounter.key} className="spawn-pop">
                    <BugSprite speciesId={enemy.speciesId} shiny={enemy.shiny} size={BUG_PX} animate phase={0.5} />
                  </div>
                </div>
                {enemy.shiny && <ShinySparkles />}
              </div>
              {throwing && (
                <div key={throwing.id} className={`trap-throw ${throwing.event.type === "captureAttempt" && throwing.event.success ? "success" : "fail"}`}>
                  {throwing.event.type === "captureAttempt" && <ItemIcon id={throwing.event.itemId} size={22} />}
                </div>
              )}
            </div>
          )}

          {!enemy && ghost && (
            <div className={`entity ${caughtRecently ? "caught-out" : "faint-out"}`} style={at(ghost.pos)}>
              <BugSprite speciesId={ghost.bug.speciesId} shiny={ghost.bug.shiny} size={BUG_PX} />
            </div>
          )}

          <div className="entity trainer" style={at(trainerPos)}>
            <div className="shadow" />
            <img
              className={`pixel ${trainerFacing === "right" ? "mirror" : ""}`}
              src={trainerSpriteUrl(trainerFacing, walkFrame(world.trainer.moving, world.trainer.walkS))}
              width={16 * TRAINER_SCALE}
              height={22 * TRAINER_SCALE}
              alt=""
              draggable={false}
            />
          </div>

          {player && (
            <div className="entity" style={at(playerPos)}>
              {prefs.nameplates && <Nameplate bug={player} showHp />}
              <div className="shadow" />
              {levelUp && <div key={levelUp.id} className="levelup-ring" />}
              <div key={lastPlayerHit?.id ?? 0} className="lunge" style={{ "--lx": `${Math.sign(enemyPos.x - playerPos.x) * 14}px`, "--ly": `${Math.sign(enemyPos.y - playerPos.y) * 8}px` } as CSSProperties}>
                <div key={lastEnemyHit?.id ?? 0} className="hit-flash">
                  <BugSprite speciesId={player.speciesId} shiny={player.shiny} size={BUG_PX} className={world.follower.moving ? "hop" : ""} animate />
                </div>
              </div>
            </div>
          )}

          {enemy && !prefs.economy && !prefs.ultraEconomy && <AttackLayer recent={recent} now={now} positions={{ player: body(playerPos), enemy: body(enemyPos) }} />}

          {floats.map((f) => (
            <span key={f.id} className={`float-text float-${f.tone}`} style={{ left: f.pos.x, top: f.pos.y, animationDelay: `${f.delayMs}ms` }}>
              {f.text}
            </span>
          ))}
        </div>

        {lighting && lighting.opacity > 0 && <div className="time-lighting" style={{ background: lighting.color, opacity: lighting.opacity }} />}

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
              <strong>{ROUTE_NAMES[scene.routeId]}</strong>
              <span className="muted">
                {UI.level} {getRoute(scene.routeId).minLevel}-{getRoute(scene.routeId).maxLevel}
              </span>
            </>
          )}
        </div>

        <div className="battle-actions" onPointerDown={(e) => e.stopPropagation()}>
          <Button variant="dark" small onClick={() => open({ kind: "settings", tab: "audio" })} aria-label={UI.sound.title}>
            <Icon name="sound" size={14} />
          </Button>
          {prefs.immersive && (
            <Button variant="dark" small onClick={() => setPreference("immersive", false)}>
              {SETTINGS_UI.immersiveExit}
            </Button>
          )}
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

        <div className="map-controls" onPointerDown={(e) => e.stopPropagation()}>
          <Button variant="dark" small aria-label={UI.mapControls.zoomIn} title={UI.mapControls.zoomIn} onClick={() => changeZoom(ZOOM_STEP)}>
            +
          </Button>
          <Button variant="dark" small aria-label={UI.mapControls.zoomOut} title={UI.mapControls.zoomOut} disabled={zoom <= followZoom(MIN_ZOOM, viewport, MAP_SIZE) + 0.001} onClick={() => changeZoom(1 / ZOOM_STEP)}>
            -
          </Button>
        </div>

        <ProximityPanel />
        <DebugPanel />

        {rt.atCenter && rt.recoveryMs <= 0 && (
          <div className="scene-overlay" onPointerDown={(e) => e.stopPropagation()}>
            <span>{UI.atCenter}</span>
            <Button variant="gold" onClick={() => report(store.run(returnToHunt))}>
              {UI.backToHunt}
            </Button>
          </div>
        )}

        {rt.recoveryMs > 0 && (
          <div className="scene-overlay">
            <span>{UI.rebooting}</span>
            <div className="overlay-bar">
              <Bar kind="time" value={RECOVERY_MS - rt.recoveryMs} max={RECOVERY_MS} />
            </div>
          </div>
        )}
      </div>
      <div className={`battle-log-line tone-${lastLine?.tone ?? "info"}`}>{lastLine?.text ?? " "}</div>
    </section>
  );
}
