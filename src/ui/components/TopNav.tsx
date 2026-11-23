import { isUnlocked, markSeen, newFeatures, type FeatureId } from "../../game/unlocks";
import { UI, UNLOCK_UI } from "../../i18n/ptBR";
import { ACHIEVEMENTS_UI } from "../../i18n/achievements.ptBR";
import { MINIGAMES_UI } from "../../i18n/minigames.ptBR";
import { SETTINGS_UI } from "../../i18n/settings.ptBR";
import { LEARN_UI } from "../../i18n/learning.ptBR";
import { GUILD_UI } from "../../i18n/guild.ptBR";
import { dailyAvailable, dayNumber } from "../../game/learning";
import { featuredGame, paidPlaysLeft } from "../../game/minigames";
import { store, useGame } from "../store";
import type { GameState } from "../../game/state";
import { useApp, type ModalState } from "../appContext";
import type { IconName } from "../render/icons";
import { Icon } from "./primitives";

type Entry = { modal: ModalState; icon: IconName; label: string; feature?: FeatureId; short?: string; key?: string };

/** Big buttons above the battle: where the player goes most. */
const ENTRIES: Entry[] = [
  { modal: { kind: "bugdex" }, icon: "bugdex", label: UI.nav.bugdex, key: "b" },
  { modal: { kind: "study" }, icon: "study", label: LEARN_UI.study.navLabel, key: "e" },
  { modal: { kind: "map" }, icon: "map", label: UI.nav.map, key: "m" },
  { modal: { kind: "box" }, icon: "box", label: UI.nav.box, key: "q" },
  { modal: { kind: "shop" }, icon: "shop", label: UI.nav.shop, key: "l" },
  { modal: { kind: "bosses" }, icon: "bosses", label: UI.nav.bosses, feature: "bosses", key: "c" },
  { modal: { kind: "houses" }, icon: "houses", label: UI.nav.houses, feature: "houses", key: "h" },
  { modal: { kind: "guild" }, icon: "guild", label: GUILD_UI.navLabel, feature: "guild", key: "g" },
  { modal: { kind: "hatchery" }, icon: "hatchery", label: UI.nav.hatchery, feature: "hatchery", key: "o" },
  { modal: { kind: "minigames" }, icon: "minigames", label: MINIGAMES_UI.nav, feature: "minigames", key: "j" },
];

/** Small square buttons in the left rail, next to the player card. */
const RAIL: Entry[] = [
  { modal: { kind: "settings" }, icon: "gear", label: SETTINGS_UI.nav, key: "," },
  { modal: { kind: "bag" }, icon: "bag", label: UI.nav.bag, key: "i" },
  { modal: { kind: "achievements" }, icon: "medal", label: ACHIEVEMENTS_UI.nav, key: "k" },
  { modal: { kind: "terminal" }, icon: "terminal", label: "Terminal (F2)", short: "Terminal" },
  { modal: { kind: "settings", tab: "audio" }, icon: "sound", label: UI.nav.sound },
  { modal: { kind: "save" }, icon: "save", label: UI.nav.save, key: "s" },
];

/** Every entry with a keyboard key, for the shortcuts in App.tsx. */
export const SHORTCUT_ENTRIES: readonly Entry[] = [...ENTRIES, ...RAIL].filter((e) => e.key);

/** The entry a key opens, if the key is a shortcut and that window is unlocked. */
export function shortcutEntry(state: GameState, key: string): Entry | undefined {
  const entry = SHORTCUT_ENTRIES.find((e) => e.key === key.toLowerCase());
  return entry && (!entry.feature || isUnlocked(state, entry.feature)) ? entry : undefined;
}

const withKey = (entry: Entry) => (entry.key ? `${entry.label} (${entry.key === "," ? "vírgula" : entry.key.toUpperCase()})` : entry.label);

export function SideRail() {
  const { open } = useApp();
  return (
    <nav className="panel side-rail" aria-label={UI.rail}>
      {RAIL.map((entry) => (
        <button key={entry.label} type="button" className="rail-button" title={withKey(entry)} aria-label={entry.label} onClick={() => open(entry.modal)}>
          <Icon name={entry.icon} size={24} />
          <span className="rail-label">{entry.short ?? entry.label}</span>
        </button>
      ))}
    </nav>
  );
}

export function TopNav() {
  const { open } = useApp();
  const state = useGame();
  const today = dayNumber(new Date());
  const daily = dailyAvailable(state, today);
  const featuredPays = paidPlaysLeft(state, featuredGame(today), today) > 0;
  const fresh = newFeatures(state);
  const visible = ENTRIES.filter((entry) => !entry.feature || isUnlocked(state, entry.feature));
  return (
    <nav className="panel top-nav">
      {visible.map((entry) => {
        const isNew = entry.feature !== undefined && fresh.includes(entry.feature);
        return (
          <button
            key={entry.label}
            type="button"
            title={withKey(entry)}
            className={`nav-button ${(entry.modal.kind === "study" && daily) || (entry.modal.kind === "minigames" && featuredPays && !isNew) ? "has-news" : ""} ${isNew ? "is-new" : ""}`}
            onClick={() => {
              if (entry.feature) store.update((s) => markSeen(s, entry.feature!));
              open(entry.modal);
            }}
          >
            <Icon name={entry.icon} size={28} />
            <span>{entry.label}</span>
            {isNew && <em className="new-tag">{UNLOCK_UI.newTag}</em>}
          </button>
        );
      })}
    </nav>
  );
}
