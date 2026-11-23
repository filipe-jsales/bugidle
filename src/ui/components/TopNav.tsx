import { UI } from "../../i18n/ptBR";
import { ACHIEVEMENTS_UI } from "../../i18n/achievements.ptBR";
import { MINIGAMES_UI } from "../../i18n/minigames.ptBR";
import { SETTINGS_UI } from "../../i18n/settings.ptBR";
import { LEARN_UI } from "../../i18n/learning.ptBR";
import { GUILD_UI } from "../../i18n/guild.ptBR";
import { dailyAvailable, dayNumber } from "../../game/learning";
import { useGame } from "../store";
import { useApp, type ModalState } from "../appContext";
import type { IconName } from "../render/icons";
import { Icon } from "./primitives";

type Entry = { modal: ModalState; icon: IconName; label: string };

/** Big buttons above the battle: where the player goes most. */
const ENTRIES: Entry[] = [
  { modal: { kind: "bugdex" }, icon: "bugdex", label: UI.nav.bugdex },
  { modal: { kind: "study" }, icon: "study", label: LEARN_UI.study.navLabel },
  { modal: { kind: "map" }, icon: "map", label: UI.nav.map },
  { modal: { kind: "box" }, icon: "box", label: UI.nav.box },
  { modal: { kind: "shop" }, icon: "shop", label: UI.nav.shop },
  { modal: { kind: "bosses" }, icon: "bosses", label: UI.nav.bosses },
  { modal: { kind: "houses" }, icon: "houses", label: UI.nav.houses },
  { modal: { kind: "guild" }, icon: "guild", label: GUILD_UI.navLabel },
  { modal: { kind: "hatchery" }, icon: "hatchery", label: UI.nav.hatchery },
  { modal: { kind: "minigames" }, icon: "minigames", label: MINIGAMES_UI.nav },
];

/** Small square buttons in the left rail, next to the player card. */
const RAIL: Entry[] = [
  { modal: { kind: "settings" }, icon: "gear", label: SETTINGS_UI.nav },
  { modal: { kind: "bag" }, icon: "bag", label: UI.nav.bag },
  { modal: { kind: "achievements" }, icon: "medal", label: ACHIEVEMENTS_UI.nav },
  { modal: { kind: "terminal" }, icon: "terminal", label: "Terminal (F2)" },
  { modal: { kind: "settings", tab: "audio" }, icon: "sound", label: UI.nav.sound },
  { modal: { kind: "save" }, icon: "save", label: UI.nav.save },
];

export function SideRail() {
  const { open } = useApp();
  return (
    <nav className="panel side-rail" aria-label={UI.rail}>
      {RAIL.map((entry) => (
        <button key={entry.label} type="button" className="rail-button" title={entry.label} aria-label={entry.label} onClick={() => open(entry.modal)}>
          <Icon name={entry.icon} size={24} />
        </button>
      ))}
    </nav>
  );
}

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
