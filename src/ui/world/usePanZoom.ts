import { useCallback, useRef, useState, type PointerEvent, type WheelEvent } from "react";
import { centerOn, panBy, ZOOM_STEP, zoomAround, type Size } from "./viewport";
import type { Vec } from "./worldModel";

const DRAG_THRESHOLD = 4;

export interface PanZoom {
  zoom: number;
  /** True while the camera follows a target instead of the player's drag. */
  following: boolean;
  /** Camera for this frame: follows `target` or keeps the dragged position. */
  cameraFor: (target: Vec | null, viewport: Size) => Vec;
  zoomIn: (viewport: Size) => void;
  zoomOut: (viewport: Size) => void;
  recenter: () => void;
  /** Handlers for the element that receives the drag and wheel. */
  bind: (viewport: Size) => {
    onPointerDown: (e: PointerEvent<HTMLElement>) => void;
    onPointerMove: (e: PointerEvent<HTMLElement>) => void;
    onPointerUp: (e: PointerEvent<HTMLElement>) => void;
    onPointerCancel: (e: PointerEvent<HTMLElement>) => void;
    onWheel: (e: WheelEvent<HTMLElement>) => void;
  };
  /** True right after a drag, so a click at the end of a drag can be ignored. */
  wasDragged: () => boolean;
}

/**
 * Drag to move, wheel or buttons to zoom. With `followByDefault` the camera
 * tracks a target until the player drags; `recenter` goes back to following.
 */
export function usePanZoom(content: Size, followByDefault: boolean, initialZoom = 1): PanZoom {
  const [zoom, setZoom] = useState(initialZoom);
  const [following, setFollowing] = useState(followByDefault);
  const camera = useRef<Vec>({ x: 0, y: 0 });
  const drag = useRef<{ id: number; x: number; y: number; moved: number } | null>(null);
  const dragged = useRef(false);

  const cameraFor = useCallback(
    (target: Vec | null, viewport: Size) => {
      if (following && target) camera.current = centerOn(target, zoom, viewport, content);
      else camera.current = panBy(camera.current, 0, 0, zoom, viewport, content);
      return camera.current;
    },
    [following, zoom, content],
  );

  const zoomBy = (factor: number, viewport: Size, anchor?: Vec) => {
    const center = anchor ?? { x: viewport.width / 2, y: viewport.height / 2 };
    const next = zoomAround(camera.current, zoom, zoom * factor, center, viewport, content);
    camera.current = next.camera;
    setZoom(next.zoom);
  };

  return {
    zoom,
    following,
    cameraFor,
    zoomIn: (viewport) => zoomBy(ZOOM_STEP, viewport),
    zoomOut: (viewport) => zoomBy(1 / ZOOM_STEP, viewport),
    recenter: () => setFollowing(followByDefault),
    wasDragged: () => dragged.current,
    bind: (viewport) => ({
      onPointerDown: (e) => {
        if (e.button !== 0 && e.pointerType === "mouse") return;
        drag.current = { id: e.pointerId, x: e.clientX, y: e.clientY, moved: 0 };
        dragged.current = false;
      },
      onPointerMove: (e) => {
        const d = drag.current;
        if (!d || d.id !== e.pointerId) return;
        const dx = e.clientX - d.x;
        const dy = e.clientY - d.y;
        d.moved += Math.abs(dx) + Math.abs(dy);
        d.x = e.clientX;
        d.y = e.clientY;
        if (d.moved < DRAG_THRESHOLD) return;
        if (!dragged.current) {
          dragged.current = true;
          e.currentTarget.setPointerCapture(e.pointerId);
          setFollowing(false);
        }
        camera.current = panBy(camera.current, dx, dy, zoom, viewport, content);
      },
      onPointerUp: (e) => {
        if (drag.current?.id === e.pointerId) drag.current = null;
      },
      onPointerCancel: () => {
        drag.current = null;
      },
      onWheel: (e) => {
        const rect = e.currentTarget.getBoundingClientRect();
        zoomBy(e.deltaY < 0 ? ZOOM_STEP : 1 / ZOOM_STEP, viewport, { x: e.clientX - rect.left, y: e.clientY - rect.top });
      },
    }),
  };
}
