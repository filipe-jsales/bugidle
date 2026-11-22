import type { CSSProperties } from "react";
import { buildAttackFx } from "../render/attackFx";
import type { TimedEvent } from "../store";
import type { Vec } from "../world/worldModel";

const MAX_VISIBLE = 3;
const LINGER_MS = 520;

type CssVars = CSSProperties & Record<`--${string}`, string | number>;

/** Projectiles and impact particles for the latest attacks, in map coordinates. */
export function AttackLayer({ recent, now, positions }: { recent: TimedEvent[]; now: number; positions: { player: Vec; enemy: Vec } }) {
  const attacks = recent.filter((e) => e.event.type === "attack" && now - e.at < 1200).slice(-MAX_VISIBLE);
  return (
    <div className="fx-layer" aria-hidden>
      {attacks.map(({ id, at, event }) => {
        if (event.type !== "attack") return null;
        const fx = buildAttackFx(event, id);
        if (now - at > fx.fx.travelMs + LINGER_MS) return null;
        const from = event.side === "player" ? positions.player : positions.enemy;
        const to = event.side === "player" ? positions.enemy : positions.player;
        return (
          <div key={id} className={`fx-attack fx-${fx.fx.shape} ${fx.big ? "fx-big" : ""}`}>
            {fx.projectiles.map((p, i) => {
              const style: CssVars = {
                "--x0": `${from.x}px`,
                "--y0": `${from.y + p.offsetY}px`,
                "--x1": `${to.x}px`,
                "--y1": `${to.y + p.offsetY}px`,
                "--fx-color": fx.fx.color,
                "--fx-accent": fx.fx.accent,
                animationDuration: `${fx.fx.travelMs}ms`,
                animationDelay: `${p.delayMs}ms`,
              };
              return (
                <span key={i} className="fx-projectile" style={style}>
                  {p.text}
                </span>
              );
            })}
            {fx.particles.map((p, i) => {
              const style: CssVars = {
                left: to.x,
                top: to.y,
                width: p.size,
                height: p.size,
                background: p.color,
                "--dx": `${p.dx}px`,
                "--dy": `${p.dy}px`,
                animationDelay: `${p.delayMs}ms`,
              };
              return <span key={`p${i}`} className="fx-particle" style={style} />;
            })}
          </div>
        );
      })}
    </div>
  );
}
