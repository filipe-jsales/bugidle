import { useEffect } from "react";
import type { Preferences } from "./preferences";

/** Body classes that CSS reads for each display/performance preference. */
export function bodyClasses(prefs: Preferences): string[] {
  const classes: string[] = [];
  if (prefs.nightMode) classes.push("night-mode");
  if (!prefs.sceneTransparency) classes.push("solid-scene");
  if (prefs.optimized || prefs.economy || prefs.ultraEconomy) classes.push("reduced-effects");
  if (prefs.ultraEconomy) classes.push("ultra-economy");
  return classes;
}

const MANAGED = ["night-mode", "solid-scene", "reduced-effects", "ultra-economy"];
const PHONE_VIEWPORT = "width=device-width, initial-scale=1";
/** Desktop layout on a phone: lay the page out as a 1280px screen and let the browser zoom. */
const DESKTOP_VIEWPORT = "width=1280";

interface WakeLockSentinelLike {
  release: () => Promise<void>;
}
type WakeLockNavigator = Navigator & { wakeLock?: { request: (type: "screen") => Promise<WakeLockSentinelLike> } };

/** Applies the preferences that live outside React: body classes, viewport and the screen wake lock. */
export function usePreferenceEffects(prefs: Preferences): void {
  const classes = bodyClasses(prefs).join(" ");
  useEffect(() => {
    document.body.classList.remove(...MANAGED);
    if (classes) document.body.classList.add(...classes.split(" "));
  }, [classes]);

  useEffect(() => {
    const meta = document.querySelector<HTMLMetaElement>('meta[name="viewport"]');
    if (meta) meta.content = prefs.phoneLayout ? PHONE_VIEWPORT : DESKTOP_VIEWPORT;
  }, [prefs.phoneLayout]);

  useEffect(() => {
    const nav = navigator as WakeLockNavigator;
    if (!prefs.keepScreenOn || !nav.wakeLock) return;
    let lock: WakeLockSentinelLike | null = null;
    let cancelled = false;
    const request = () => {
      if (document.visibilityState !== "visible") return;
      nav.wakeLock
        ?.request("screen")
        .then((l) => {
          if (cancelled) void l.release();
          else lock = l;
        })
        .catch(() => undefined);
    };
    request();
    // the browser drops the lock when the tab is hidden; ask again when it comes back
    document.addEventListener("visibilitychange", request);
    return () => {
      cancelled = true;
      document.removeEventListener("visibilitychange", request);
      void lock?.release();
    };
  }, [prefs.keepScreenOn]);
}
