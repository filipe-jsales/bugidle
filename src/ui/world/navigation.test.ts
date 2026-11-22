import { createSeededRng } from "../../game/rng";
import { clearLine, createNav, findPath, freePoint, isBlocked, isRoad, NAV_CELL, pushOut } from "./navigation";
import { createWorld, distance, stepWorld } from "./worldModel";

const W = 2800;
const H = 1700;
const START = { x: W / 2, y: H / 2 };

describe("map navigation", () => {
  it("places obstacles off the roads, apart, and away from the start", () => {
    for (const seed of [1, 2, 3]) {
      const nav = createNav(W, H, createSeededRng(seed), { clearAround: START });
      expect(nav.obstacles.length).toBeGreaterThan(20);
      expect(nav.roads.length).toBeGreaterThanOrEqual(4);
      expect(isRoad(nav, START)).toBe(true);
      for (const o of nav.obstacles) {
        expect(distance(o, START)).toBeGreaterThan(200);
        expect(isRoad(nav, o)).toBe(false);
        for (const other of nav.obstacles) if (other !== o) expect(distance(o, other)).toBeGreaterThan(o.r + other.r);
      }
    }
  });

  it("pushes points out of obstacles and finds free points", () => {
    const nav = createNav(W, H, createSeededRng(4), { clearAround: START });
    const o = nav.obstacles[0]!;
    expect(isBlocked(nav, o)).toBe(true);
    const out = pushOut(nav, { x: o.x + 1, y: o.y });
    expect(isBlocked(nav, out)).toBe(false);
    for (let i = 0; i < 50; i++) expect(isBlocked(nav, freePoint(nav, createSeededRng(i), 48))).toBe(false);
  });

  it("plans a route around obstacles that ends at the goal", () => {
    const nav = createNav(W, H, createSeededRng(5), { clearAround: START });
    const o = nav.obstacles[0]!;
    const from = pushOut(nav, { x: o.x - o.r - 60, y: o.y });
    const to = pushOut(nav, { x: o.x + o.r + 60, y: o.y });
    const path = findPath(nav, from, to);
    expect(distance(path[path.length - 1]!, to)).toBeLessThan(1);
    let previous = from;
    for (const point of path) {
      expect(clearLine(nav, previous, point) || distance(previous, point) < NAV_CELL * 1.5).toBe(true);
      previous = point;
    }
  });

  it("an open map walks straight", () => {
    const nav = createNav(W, H, createSeededRng(6), { obstacles: 0, clearAround: START });
    expect(findPath(nav, { x: 100, y: 100 }, { x: 200, y: 150 })).toEqual([{ x: 200, y: 150 }]);
  });

  it("the trainer, his bug and the wild bugs never stand inside an obstacle", () => {
    const world = createWorld(W, H, ["typobit", "nullit"], createSeededRng(7));
    const rng = createSeededRng(8);
    for (let t = 0; t < 90; t += 1 / 20) {
      stepWorld(world, 1 / 20, { encounterKey: null, viewport: { width: 800, height: 500 } }, rng);
      expect(isBlocked(world.nav, world.trainer.pos)).toBe(false);
      expect(isBlocked(world.nav, world.follower.pos)).toBe(false);
      for (const b of world.wanderers) expect(isBlocked(world.nav, b.pos)).toBe(false);
    }
    expect(distance(world.trainer.pos, START)).toBeGreaterThan(50);
  });
});
