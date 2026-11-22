import { useEffect, type ButtonHTMLAttributes, type ReactNode } from "react";
import type { BugType } from "../../game/types";
import { TYPE_NAMES, UI } from "../../i18n/ptBR";
import type { ItemId } from "../../game/data/items";
import { iconUrl, itemIconUrl, type IconName } from "../render/icons";
import { bugSpriteUrl } from "../render/pixels";

export function Panel({ title, actions, className = "", children }: { title?: ReactNode; actions?: ReactNode; className?: string; children: ReactNode }) {
  return (
    <section className={`panel ${className}`}>
      {(title || actions) && (
        <header className="panel-header">
          <h2 className="panel-title">{title}</h2>
          {actions}
        </header>
      )}
      {children}
    </section>
  );
}

type ButtonVariant = "purple" | "gold" | "dark" | "danger";

export function Button({ variant = "purple", small = false, className = "", ...props }: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: ButtonVariant; small?: boolean }) {
  return <button type="button" className={`btn btn-${variant} ${small ? "btn-small" : ""} ${className}`} {...props} />;
}

export function Bar({ value, max, kind, label }: { value: number; max: number; kind: "hp" | "xp" | "time" | "stat"; label?: string }) {
  const ratio = max > 0 ? Math.max(0, Math.min(1, value / max)) : 0;
  const tone = kind !== "hp" ? kind : ratio > 0.5 ? "hp" : ratio > 0.2 ? "hp-mid" : "hp-low";
  return (
    <div className="bar" role="progressbar" aria-valuenow={Math.round(value)} aria-valuemax={Math.round(max)}>
      <div className={`bar-fill bar-${tone}`} style={{ width: `${ratio * 100}%` }} />
      {label !== undefined && <span className="bar-label">{label}</span>}
    </div>
  );
}

export function TypeTag({ type }: { type: BugType }) {
  return <span className={`tag type-${type}`}>{TYPE_NAMES[type]}</span>;
}

export function Tag({ children, tone = "dark" }: { children: ReactNode; tone?: "dark" | "green" | "gold" | "blue" | "pink" }) {
  return <span className={`tag tag-${tone}`}>{children}</span>;
}

export function LevelTag({ level }: { level: number }) {
  return (
    <Tag>
      {UI.level} {level}
    </Tag>
  );
}

const FRAME_MS = 420;

/**
 * A bug sprite. With `animate`, it alternates its two idle frames; `phase`
 * offsets the cycle so bugs on screen do not breathe in sync.
 */
export function BugSprite({ speciesId, shiny = false, size = 48, silhouette = false, className = "", animate = false, phase = 0 }: { speciesId: string; shiny?: boolean; size?: number; silhouette?: boolean; className?: string; animate?: boolean; phase?: number }) {
  const frame = animate ? ((Math.floor(performance.now() / FRAME_MS + phase) % 2) as 0 | 1) : 0;
  return <img className={`pixel ${className}`} src={bugSpriteUrl(speciesId, shiny, silhouette, frame)} width={size} height={size} alt="" draggable={false} />;
}

export function Icon({ name, size = 24 }: { name: IconName; size?: number }) {
  return <img className="pixel" src={iconUrl(name)} width={size} height={size} alt="" draggable={false} />;
}

export function ItemIcon({ id, size = 24 }: { id: ItemId; size?: number }) {
  return <img className="pixel item-icon" src={itemIconUrl(id)} width={size} height={size} alt="" draggable={false} />;
}

export function Toggle({ checked, onChange, label, hint }: { checked: boolean; onChange: (value: boolean) => void; label: string; hint?: string }) {
  return (
    <label className="toggle-row">
      <button type="button" role="switch" aria-checked={checked} className={`toggle ${checked ? "on" : ""}`} onClick={() => onChange(!checked)}>
        <span className="toggle-knob" />
      </button>
      <span>
        {label}
        {hint && <small className="hint">{hint}</small>}
      </span>
    </label>
  );
}

export function Modal({ title, onClose, wide = false, children, headerExtra }: { title: ReactNode; onClose: () => void; wide?: boolean; children: ReactNode; headerExtra?: ReactNode }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);
  return (
    <div className="modal-backdrop" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className={`modal ${wide ? "modal-wide" : ""}`} role="dialog" aria-modal="true">
        <header className="modal-header">
          <h2>{title}</h2>
          <div className="modal-header-actions">
            {headerExtra}
            <button type="button" className="btn btn-purple btn-icon" onClick={onClose} aria-label={UI.close}>
              <Icon name="close" size={14} />
            </button>
          </div>
        </header>
        <div className="modal-body">{children}</div>
      </div>
    </div>
  );
}
