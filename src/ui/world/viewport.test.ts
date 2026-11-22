import { centerOn, clampCamera, clampZoom, coverZoom, followZoom, MAX_ZOOM, MIN_ZOOM, panBy, toScreen, zoomAround } from "./viewport";

const VIEW = { width: 600, height: 400 };
const MAP = { width: 1800, height: 1100 };

describe("map camera", () => {
  it("limits the zoom", () => {
    expect(clampZoom(10)).toBe(MAX_ZOOM);
    expect(clampZoom(0.01)).toBe(MIN_ZOOM);
    expect(clampZoom(1.3)).toBe(1.3);
  });

  it("centres on a point and stays inside the map", () => {
    expect(centerOn({ x: 900, y: 550 }, 1, VIEW, MAP)).toEqual({ x: 600, y: 350 });
    expect(centerOn({ x: 0, y: 0 }, 1, VIEW, MAP)).toEqual({ x: 0, y: 0 });
    expect(centerOn({ x: 1800, y: 1100 }, 2, VIEW, MAP)).toEqual({ x: 1500, y: 900 });
  });

  it("centres small content instead of clamping it to a corner", () => {
    expect(clampCamera({ x: 50, y: 50 }, 1, VIEW, { width: 400, height: 300 })).toEqual({ x: -100, y: -50 });
  });

  it("pans opposite to the drag, slower when zoomed in", () => {
    const start = { x: 600, y: 350 };
    expect(panBy(start, 100, 0, 1, VIEW, MAP)).toEqual({ x: 500, y: 350 });
    expect(panBy(start, 100, 0, 2, VIEW, MAP)).toEqual({ x: 550, y: 350 });
    expect(panBy(start, 10_000, 10_000, 1, VIEW, MAP)).toEqual({ x: 0, y: 0 });
  });

  it("zooms around the cursor, keeping that point still", () => {
    const camera = { x: 600, y: 350 };
    const anchor = { x: 150, y: 100 };
    const before = { x: camera.x + anchor.x, y: camera.y + anchor.y };
    const next = zoomAround(camera, 1, 2, anchor, VIEW, MAP);
    expect(next.zoom).toBe(2);
    expect(toScreen(before, next.camera, next.zoom)).toEqual(anchor);
  });

  it("coverZoom is the smallest zoom that still fills the screen", () => {
    expect(coverZoom({ width: 1000, height: 500 }, { width: 2000, height: 2000 })).toBe(0.5);
    expect(coverZoom({ width: 400, height: 900 }, { width: 2000, height: 1000 })).toBe(0.9);
  });

  it("followZoom never shows the map edge, however far the player zooms out", () => {
    const viewport = { width: 1200, height: 700 };
    const content = { width: 2800, height: 1700 };
    const zoom = followZoom(0.1, viewport, content);
    expect(zoom).toBeGreaterThanOrEqual(MIN_ZOOM);
    expect(content.width * zoom).toBeGreaterThanOrEqual(viewport.width);
    expect(content.height * zoom).toBeGreaterThanOrEqual(viewport.height);
    const camera = centerOn({ x: 0, y: 0 }, zoom, viewport, content);
    expect(camera.x).toBeGreaterThanOrEqual(0);
    expect(camera.y).toBeGreaterThanOrEqual(0);
    const far = centerOn({ x: 2800, y: 1700 }, zoom, viewport, content);
    expect(far.x + viewport.width / zoom).toBeLessThanOrEqual(content.width + 1e-6);
    expect(far.y + viewport.height / zoom).toBeLessThanOrEqual(content.height + 1e-6);
    expect(followZoom(99, viewport, content)).toBe(MAX_ZOOM);
  });
});
