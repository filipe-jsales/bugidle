import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { ActionResult } from "../game/result";
import { needsStarter } from "../game/state";
import { ERROR_TEXT, UI } from "../i18n/ptBR";
import { AppContext, type AppActions, type ModalState } from "./appContext";
import { BattleView } from "./components/BattleView";
import { AutomationPanel, LogPanel } from "./components/RightColumn";
import { ActiveBugCard, PlayerCard, TeamPanel } from "./components/Sidebar";
import { TopNav } from "./components/TopNav";
import { BoxModal } from "./modals/BoxModal";
import { BugDetailModal } from "./modals/BugDetailModal";
import { BugdexModal } from "./modals/BugdexModal";
import { CompareModal } from "./modals/CompareModal";
import { HatcheryModal } from "./modals/HatcheryModal";
import { RulesModal } from "./modals/RulesModal";
import { GuildModal } from "./modals/GuildModal";
import { TerminalModal } from "./modals/TerminalModal";
import { BossReviewModal, StudyModal } from "./modals/StudyModals";
import { HousesModal } from "./modals/HousesModal";
import { MapModal } from "./modals/MapModal";
import { BossesModal, SaveModal, StarterModal } from "./modals/MiscModals";
import { BagModal, ShopModal } from "./modals/ShopBagModals";
import { SoundModal } from "./modals/SoundModal";
import { store, useGame } from "./store";
import { useAudio } from "./useAudio";

const TOAST_MS = 2600;

function ModalHost({ modal }: { modal: ModalState | null }) {
  if (!modal) return null;
  switch (modal.kind) {
    case "bug":
      return <BugDetailModal uid={modal.uid} />;
    case "map":
      return <MapModal />;
    case "bugdex":
      return <BugdexModal initialSpecies={modal.speciesId} />;
    case "box":
      return <BoxModal />;
    case "shop":
      return <ShopModal />;
    case "bag":
      return <BagModal />;
    case "bosses":
      return <BossesModal />;
    case "save":
      return <SaveModal />;
    case "sound":
      return <SoundModal />;
    case "houses":
      return <HousesModal />;
    case "hatchery":
      return <HatcheryModal />;
    case "rules":
      return <RulesModal />;
    case "study":
      return <StudyModal />;
    case "guild":
      return <GuildModal />;
    case "terminal":
      return <TerminalModal />;
    case "review":
      return <BossReviewModal bossId={modal.bossId} />;
    case "compare":
      return <CompareModal a={modal.a} b={modal.b} />;
  }
}

export function App() {
  const state = useGame();
  const [stack, setStack] = useState<ModalState[]>([]);
  const [toastText, setToastText] = useState<string | null>(null);
  const toastTimer = useRef<number>();
  const compareSlots = useRef<{ A?: string; B?: string }>({});

  useEffect(() => store.start(), []);

  // F2 (or ` on keyboards where it is not a dead key) opens the terminal from anywhere except text fields.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target instanceof Element ? e.target : null;
      if ((e.key !== "`" && e.key !== "F2") || target?.closest("input, textarea, select")) return;
      e.preventDefault();
      setStack((s) => (s[s.length - 1]?.kind === "terminal" ? s.slice(0, -1) : [...s, { kind: "terminal" }]));
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);
  useAudio(state);

  const toast = useCallback((message: string) => {
    setToastText(message);
    window.clearTimeout(toastTimer.current);
    toastTimer.current = window.setTimeout(() => setToastText(null), TOAST_MS);
  }, []);

  const actions = useMemo<AppActions>(
    () => ({
      // Opening a bug or a species sheet from another window keeps it underneath; closing returns to it.
      open: (modal) => setStack((s) => (modal.kind === "bug" || modal.kind === "compare" || modal.kind === "review" || (modal.kind === "bugdex" && modal.speciesId) ? [...s, modal] : [modal])),
      close: () => setStack((s) => s.slice(0, -1)),
      report: (result: ActionResult) => {
        if (!result.ok) toast(ERROR_TEXT[result.reason]);
        return result.ok;
      },
      toast,
      markCompare: (slot, uid) => {
        compareSlots.current[slot] = uid;
        const { A, B } = compareSlots.current;
        if (A && B && A !== B) {
          compareSlots.current = {};
          setStack((s) => [...s, { kind: "compare", a: A, b: B }]);
        } else {
          toast(UI.compare.pickOther(slot));
        }
      },
    }),
    [toast],
  );

  return (
    <AppContext.Provider value={actions}>
      <div className="layout">
        <aside className="column left-column">
          <PlayerCard />
          <ActiveBugCard />
          <TeamPanel />
        </aside>
        <main className="column center-column">
          <TopNav />
          <BattleView />
        </main>
        <aside className="column right-column">
          <AutomationPanel />
          <LogPanel />
        </aside>
      </div>
      <ModalHost modal={stack[stack.length - 1] ?? null} />
      {needsStarter(state) && <StarterModal />}
      {toastText && (
        <div className="toast" role="status">
          {toastText}
        </div>
      )}
    </AppContext.Provider>
  );
}
