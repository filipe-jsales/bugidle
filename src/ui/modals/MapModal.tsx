import type { LabTopic } from "../../game/data/labs";
import { SPECIES_LAB } from "../labLinks";
import { LAB_TOPIC_TEXT } from "../../i18n/labs.ptBR";

import { useState } from "react";
import { isCaught } from "../../game/bugdex";
import { bossOfRegion, getRoute, REGIONS, routesOfRegion, type RouteDef } from "../../game/data/world";
import { challengeBoss, selectRoute } from "../../game/engine";
import { canChallengeBoss, isRegionUnlocked, isRouteUnlocked, unlockProgress } from "../../game/progression";
import { BADGE_NAMES, REGION_NAMES, ROUTE_NAMES, UI } from "../../i18n/ptBR";
import { useApp } from "../appContext";
import { BugSprite, Button, Icon, Modal, Tag } from "../components/primitives";
import { regionMapUrl } from "../render/mapArt";
import { store, useGame } from "../store";
import { useElementSize } from "../useElementSize";
import { LEARN_UI, REGION_TOPICS } from "../../i18n/learning.ptBR";

/** The boss node sits at the bottom of every region map. */
const BOSS_POINT = { x: 50, y: 88 };

function lockReason(route: RouteDef): string {
  if (route.unlock.kind === "defeats") return UI.map.unlockHint(route.unlock.count, ROUTE_NAMES[route.unlock.routeId] ?? "");
  if (route.unlock.kind === "badge") return UI.map.badgeHint(BADGE_NAMES[route.unlock.badgeId] ?? "");
  return "";
}

export function MapModal() {
  const state = useGame();
  const { close, report, open } = useApp();
  const currentRouteId = state.activity.kind === "route" ? state.activity.routeId : state.activity.returnRouteId;
  const [regionId, setRegionId] = useState(getRoute(currentRouteId).regionId);
  const [view, setView] = useState<"map" | "list">("map");
  const [viewportRef, viewport] = useElementSize<HTMLDivElement>({ width: 840, height: 420 });
  const region = REGIONS.find((r) => r.id === regionId)!;
  const routes = routesOfRegion(regionId);
  const boss = bossOfRegion(regionId);
  const regionOpen = isRegionUnlocked(state, regionId);
  const regionLabs = [...new Set(routes.flatMap((r) => r.encounters.map((e) => SPECIES_LAB[e.speciesId]).filter((t): t is LabTopic => Boolean(t))))];

  const go = (routeId: string) => {
    if (report(store.run((s) => selectRoute(s, routeId)))) close();
  };
  const fightBoss = () => {
    if (boss && report(store.run((s) => challengeBoss(s, boss.id)))) close();
  };
  // the road goes through every route in order and ends at the boss
  const roadPoints = [...routes.map((r) => ({ x: r.mapX, y: r.mapY })), ...(boss ? [BOSS_POINT] : [])];

  const routeNode = (route: RouteDef) => {
    const unlocked = isRouteUnlocked(state, route.id);
    const here = route.id === currentRouteId;
    const progress = unlockProgress(state, route.id);
    const showcase = route.encounters[0]!.speciesId;
    return { unlocked, here, progress, showcase };
  };

  return (
    <Modal title={UI.nav.map.toUpperCase()} onClose={close} wide>
      <div className="region-tabs">
        {REGIONS.map((r) => {
          const open = isRegionUnlocked(state, r.id);
          return (
            <button key={r.id} type="button" className={`region-tab ${r.id === regionId ? "active" : ""} ${open ? "" : "locked"}`} onClick={() => setRegionId(r.id)}>
              <strong>{REGION_NAMES[r.id]}</strong>
              <small>{open ? `${routesOfRegion(r.id).filter((x) => isRouteUnlocked(state, x.id)).length}/${routesOfRegion(r.id).length}` : (r.requiredBadge && BADGE_NAMES[r.requiredBadge]) ?? ""}</small>
            </button>
          );
        })}
      </div>
      <p className="region-topics small">
        <strong>{LEARN_UI.regionTeaches(REGION_TOPICS[regionId]?.title ?? "")}</strong> · {REGION_TOPICS[regionId]?.topics.join(", ")}
        {regionLabs.map((topic) => (
          <button key={topic} type="button" className="link-button region-lab" onClick={() => open({ kind: "lab", topic })}>
            {LAB_TOPIC_TEXT[topic].name}
          </button>
        ))}
      </p>
      <div className="map-toolbar">
        <span className="muted">{regionOpen ? "" : UI.map.badgeHint(BADGE_NAMES[region.requiredBadge ?? ""] ?? "")}</span>
        <div className="segmented small">
          <button type="button" className={view === "map" ? "active" : ""} onClick={() => setView("map")}>
            {UI.map.map}
          </button>
          <button type="button" className={view === "list" ? "active" : ""} onClick={() => setView("list")}>
            {UI.map.list}
          </button>
        </div>
      </div>

      {view === "map" ? (
        <div ref={viewportRef} className="map-viewport">
        <div
          className="map-canvas pixel"
          style={{
            width: "100%",
            height: "100%",
            backgroundImage: `url(${regionMapUrl(region.terrain, `map-${region.id}`, Math.round(viewport.width / 16) * 16, Math.round(viewport.height / 16) * 16, roadPoints)})`,
            backgroundSize: "100% 100%",
          }}
        >
          {routes.map((route) => {
            const node = routeNode(route);
            return (
              <button
                key={route.id}
                type="button"
                className={`map-node ${node.unlocked ? "" : "locked"} ${node.here ? "here" : ""}`}
                style={{ left: `${route.mapX}%`, top: `${route.mapY}%` }}
                disabled={!node.unlocked}
                onClick={() => go(route.id)}
                title={node.unlocked ? ROUTE_NAMES[route.id] : lockReason(route)}
              >
                <BugSprite speciesId={node.showcase} size={40} silhouette={!isCaught(state, node.showcase)} />
                <span className="map-node-level">{route.maxLevel}</span>
                <span className="map-node-name">{ROUTE_NAMES[route.id]}</span>
                {node.progress && !node.unlocked && (
                  <span className="map-node-progress">
                    {node.progress.current}/{node.progress.required}
                  </span>
                )}
              </button>
            );
          })}
          {boss && (
            <button type="button" className={`map-node boss-node ${canChallengeBoss(state, boss.id) ? "" : "locked"}`} style={{ left: `${BOSS_POINT.x}%`, top: `${BOSS_POINT.y}%` }} onClick={fightBoss} disabled={!canChallengeBoss(state, boss.id)}>
              <Icon name="bosses" size={30} />
              <span className="map-node-name">{boss.name}</span>
            </button>
          )}
        </div>
        </div>
      ) : (
        <div className="route-list">
          {routes.map((route) => {
            const node = routeNode(route);
            return (
              <div key={route.id} className={`route-row ${node.unlocked ? "" : "locked"}`}>
                <div className="route-row-head">
                  <strong>{ROUTE_NAMES[route.id]}</strong>
                  <Tag>{UI.map.levels(route.minLevel, route.maxLevel)}</Tag>
                  {node.here && <Tag tone="green">{UI.map.current}</Tag>}
                  <span className="muted small">
                    {state.routeDefeats[route.id] ?? 0} {UI.map.defeats}
                  </span>
                </div>
                <div className="route-row-bugs">
                  {route.encounters.map((e) => (
                    <BugSprite key={e.speciesId} speciesId={e.speciesId} size={32} silhouette={!isCaught(state, e.speciesId)} />
                  ))}
                </div>
                {node.unlocked ? (
                  <Button small disabled={node.here} onClick={() => go(route.id)}>
                    {node.here ? UI.map.current : "Ir"}
                  </Button>
                ) : (
                  <span className="muted small">
                    {lockReason(route)}
                    {node.progress && ` (${node.progress.current}/${node.progress.required})`}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      )}
      <p className="muted small map-footer">
        {routes.filter((r) => isRouteUnlocked(state, r.id)).length} de {routes.length} rotas em {REGION_NAMES[regionId]} · silhueta = ainda não capturado
      </p>
    </Modal>
  );
}
