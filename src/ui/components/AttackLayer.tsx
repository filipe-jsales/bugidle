import type { CSSProperties } from "react";
import { buildAttackFx } from "../render/attackFx";
import type { TimedEvent } from "../store";

const MAX_VISIBLE = 3;
const LINGER_MS = 520;

type CssVars = CSSProperties & Record<`--${string}`, string | number>;

/** Projectiles and impact particles for the latest attacks. */
export function AttackLayer({ recent, now }: { recent: TimedEvent[]; now: number }) {
  const attacks = recent.filter((e) => e.event.type === "attack" && now - e.at < 1200).slice(-MAX_VISIBLE);
  return (
    <div className="fx-layer" aria-hidden>
      {attacks.map(({ id, at, event }) => {
        if (event.type !== "attack") return null;
        const fx = buildAttackFx(event, id);
        if (now - at > fx.fx.travelMs + LINGER_MS) return null;
        return (
          <div key={id} className={`fx-attack fx-${fx.fx.shape} ${fx.big ? "fx-big" : ""}`}>
            {fx.projectiles.map((p, i) => {
              const style: CssVars = {
                "--x0": `${fx.from.x}%`,
                "--y0": `${fx.from.y + p.offsetY}%`,
                "--x1": `${fx.to.x}%`,
                "--y1": `${fx.to.y + p.offsetY}%`,
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
                left: `${fx.to.x}%`,
                top: `${fx.to.y}%`,
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
