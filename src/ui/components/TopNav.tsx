import { UI } from "../../i18n/ptBR";
import { useApp, type ModalState } from "../appContext";
import type { IconName } from "../render/icons";
import { Icon } from "./primitives";

const ENTRIES: { modal: ModalState; icon: IconName; label: string }[] = [
  { modal: { kind: "bugdex" }, icon: "bugdex", label: UI.nav.bugdex },
  { modal: { kind: "map" }, icon: "map", label: UI.nav.map },
  { modal: { kind: "box" }, icon: "box", label: UI.nav.box },
  { modal: { kind: "shop" }, icon: "shop", label: UI.nav.shop },
  { modal: { kind: "bag" }, icon: "bag", label: UI.nav.bag },
  { modal: { kind: "bosses" }, icon: "bosses", label: UI.nav.bosses },
  { modal: { kind: "save" }, icon: "save", label: UI.nav.save },
];

export function TopNav() {
  const { open } = useApp();
  return (
    <nav className="panel top-nav">
      {ENTRIES.map((entry) => (
        <button key={entry.label} type="button" className="nav-button" onClick={() => open(entry.modal)}>
          <Icon name={entry.icon} size={28} />
          <span>{entry.label}</span>
        </button>
      ))}
    </nav>
  );
}
