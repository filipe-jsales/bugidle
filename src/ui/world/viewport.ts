/**
 * Camera math for pannable, zoomable maps (the route map and the region map).
 * `camera` is the world point at the top-left corner of the screen; screen
 * pixels = (world - camera) * zoom. Pure functions, unit tested.
 */
import type { Vec } from "./worldModel";

export const MIN_ZOOM = 0.5;
export const MAX_ZOOM = 2.5;
export const ZOOM_STEP = 1.25;

export interface Size {
  width: number;
  height: number;
}

export function clampZoom(zoom: number): number {
  return Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, zoom));
}

/** Smallest zoom at which the content still fills the whole screen (no empty border). */
export function coverZoom(viewport: Size, content: Size): number {
  return Math.max(viewport.width / content.width, viewport.height / content.height);
}

/** Zoom for a follow camera: inside the zoom limits and never small enough to show the map's edge. */
export function followZoom(zoom: number, viewport: Size, content: Size): number {
  return Math.max(clampZoom(zoom), coverZoom(viewport, content));
}

/** Keeps the view inside the content; centres it when the content is smaller than the screen. */
export function clampCamera(camera: Vec, zoom: number, viewport: Size, content: Size): Vec {
  const axis = (value: number, view: number, size: number) => {
    const visible = view / zoom;
    if (size <= visible) return (size - visible) / 2;
    return Math.min(size - visible, Math.max(0, value));
  };
  return { x: axis(camera.x, viewport.width, content.width), y: axis(camera.y, viewport.height, content.height) };
}

/** Camera that puts `target` in the middle of the screen. */
export function centerOn(target: Vec, zoom: number, viewport: Size, content: Size): Vec {
  return clampCamera({ x: target.x - viewport.width / zoom / 2, y: target.y - viewport.height / zoom / 2 }, zoom, viewport, content);
}

/** Moves the view by a drag of (dx, dy) screen pixels. */
export function panBy(camera: Vec, dx: number, dy: number, zoom: number, viewport: Size, content: Size): Vec {
  return clampCamera({ x: camera.x - dx / zoom, y: camera.y - dy / zoom }, zoom, viewport, content);
}

/** Changes the zoom keeping the world point under `anchor` (screen px) still. */
export function zoomAround(camera: Vec, zoom: number, nextZoom: number, anchor: Vec, viewport: Size, content: Size): { camera: Vec; zoom: number } {
  const z = clampZoom(nextZoom);
  const world = { x: camera.x + anchor.x / zoom, y: camera.y + anchor.y / zoom };
  return { zoom: z, camera: clampCamera({ x: world.x - anchor.x / z, y: world.y - anchor.y / z }, z, viewport, content) };
}

export function toScreen(point: Vec, camera: Vec, zoom: number): Vec {
  return { x: (point.x - camera.x) * zoom, y: (point.y - camera.y) * zoom };
}
