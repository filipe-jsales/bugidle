import { createContext, useContext } from "react";
import type { ActionResult } from "../game/result";

export type ModalState =
  | { kind: "bug"; uid: string }
  | { kind: "map" }
  | { kind: "bugdex" }
  | { kind: "box" }
  | { kind: "shop" }
  | { kind: "bag" }
  | { kind: "bosses" }
  | { kind: "save" };

export interface AppActions {
  open: (modal: ModalState) => void;
  close: () => void;
  /** Shows an error toast when the result failed. Returns whether it succeeded. */
  report: (result: ActionResult) => boolean;
  toast: (message: string) => void;
}

export const AppContext = createContext<AppActions | null>(null);

export function useApp(): AppActions {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp outside AppContext");
  return ctx;
}
