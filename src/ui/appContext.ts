export type SettingsTab = "audio" | "interactivity" | "hud" | "performance" | "support";
import type { LabTopic } from "../game/data/labs";
import { createContext, useContext } from "react";
import type { ActionResult } from "../game/result";

export type ModalState =
  | { kind: "bug"; uid: string }
  | { kind: "map" }
  | { kind: "bugdex"; speciesId?: string }
  | { kind: "box" }
  | { kind: "shop" }
  | { kind: "bag" }
  | { kind: "bosses" }
  | { kind: "save" }
  | { kind: "houses" }
  | { kind: "achievements" }
  | { kind: "settings"; tab?: SettingsTab }
  | { kind: "hatchery" }
  | { kind: "rules" }
  | { kind: "study" }
  | { kind: "lab"; topic: LabTopic }
  | { kind: "glossary" }
  | { kind: "minigames" }
  | { kind: "guild" }
  | { kind: "terminal" }
  | { kind: "review"; bossId: string }
  | { kind: "compare"; a: string; b: string }
  | { kind: "trainer"; tab?: "card" | "look" };

export interface AppActions {
  open: (modal: ModalState) => void;
  close: () => void;
  /** Shows an error toast when the result failed. Returns whether it succeeded. */
  report: (result: ActionResult) => boolean;
  toast: (message: string) => void;
  /** Marks a bug as side A or B of a comparison; opens the comparison when both are set. */
  markCompare: (slot: "A" | "B", uid: string) => void;
}

export const AppContext = createContext<AppActions | null>(null);

export function useApp(): AppActions {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp outside AppContext");
  return ctx;
}
