import { UI } from "../../i18n/ptBR";
import { ACHIEVEMENTS_UI } from "../../i18n/achievements.ptBR";
import { SETTINGS_UI } from "../../i18n/settings.ptBR";
import { LEARN_UI } from "../../i18n/learning.ptBR";
import { GUILD_UI } from "../../i18n/guild.ptBR";
import { dailyAvailable, dayNumber } from "../../game/learning";
import { useGame } from "../store";
import { useApp, type ModalState } from "../appContext";
import type { IconName } from "../render/icons";
import { Icon } from "./primitives";

const ENTRIES: { modal: ModalState; icon: IconName; label: string }[] = [
  { modal: { kind: "bugdex" }, icon: "bugdex", label: UI.nav.bugdex },
  { modal: { kind: "study" }, icon: "study", label: LEARN_UI.study.navLabel },
  { modal: { kind: "map" }, icon: "map", label: UI.nav.map },
  { modal: { kind: "box" }, icon: "box", label: UI.nav.box },
  { modal: { kind: "shop" }, icon: "shop", label: UI.nav.shop },
  { modal: { kind: "bag" }, icon: "bag", label: UI.nav.bag },
  { modal: { kind: "bosses" }, icon: "bosses", label: UI.nav.bosses },
  { modal: { kind: "houses" }, icon: "houses", label: UI.nav.houses },
  { modal: { kind: "guild" }, icon: "guild", label: GUILD_UI.navLabel },
  { modal: { kind: "hatchery" }, icon: "hatchery", label: UI.nav.hatchery },
  { modal: { kind: "achievements" }, icon: "medal", label: ACHIEVEMENTS_UI.nav },
  { modal: { kind: "terminal" }, icon: "terminal", label: "Terminal (F2)" },
  { modal: { kind: "settings" }, icon: "gear", label: SETTINGS_UI.nav },
  { modal: { kind: "save" }, icon: "save", label: UI.nav.save },
];

export function TopNav() {
  const { open } = useApp();
  const state = useGame();
  const daily = dailyAvailable(state, dayNumber(new Date()));
  return (
    <nav className="panel top-nav">
      {ENTRIES.map((entry) => (
        <button key={entry.label} type="button" className={`nav-button ${entry.modal.kind === "study" && daily ? "has-news" : ""}`} onClick={() => open(entry.modal)}>
          <Icon name={entry.icon} size={28} />
          <span>{entry.label}</span>
        </button>
      ))}
    </nav>
  );
}
