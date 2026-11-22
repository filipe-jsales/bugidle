import { createSeededRng } from "../../game/rng";
import {
  cameraFor,
  createWorld,
  distance,
  facingOf,
  FIGHT_GAP,
  FOLLOW_DISTANCE,
  stepWorld,
  TRAINER_BEHIND,
  WANDERER_COUNT,
  type WorldInput,
  type WorldModel,
} from "./worldModel";

const VIEW = { width: 600, height: 360 };
const idle: WorldInput = { encounterKey: null, viewport: VIEW };

function makeWorld(seed = 1): WorldModel {
  return createWorld(1800, 1100, ["typobit", "nullit"], createSeededRng(seed));
}

function run(w: WorldModel, seconds: number, input: WorldInput, seed = 2) {
  const rng = createSeededRng(seed);
  for (let t = 0; t < seconds; t += 1 / 30) stepWorld(w, 1 / 30, input, rng);
}

describe("world model", () => {
  it("starts with the trainer in the middle and wild bugs on the map", () => {
    const w = makeWorld();
    expect(w.trainer.pos).toEqual({ x: 900, y: 550 });
    expect(w.wanderers).toHaveLength(WANDERER_COUNT);
    for (const b of w.wanderers) expect(["typobit", "nullit"]).toContain(b.speciesId);
  });

  it("walks toward the nearest wild bug between fights, animating the walk", () => {
    const w = makeWorld();
    const start = { ...w.trainer.pos };
    run(w, 2, idle);
    expect(distance(start, w.trainer.pos)).toBeGreaterThan(20);
    expect(w.trainer.walkS).toBeGreaterThan(0);
  });

  it("the active bug follows behind the trainer", () => {
    const w = makeWorld();
    run(w, 6, idle);
    const gap = distance(w.follower.pos, w.trainer.pos);
    expect(gap).toBeGreaterThan(FOLLOW_DISTANCE * 0.5);
    expect(gap).toBeLessThan(FOLLOW_DISTANCE * 2.5);
  });

  it("turns a nearby wild bug into the encounter and lines up for the fight", () => {
    const w = makeWorld();
    const roaming = w.wanderers.length;
    const near = [...w.wanderers].sort((a, b) => distance(a.pos, w.trainer.pos) - distance(b.pos, w.trainer.pos))[0]!;
    near.pos = { x: w.trainer.pos.x + 150, y: w.trainer.pos.y };
    run(w, 4, { ...idle, encounterKey: "enemy-1" });
    expect(w.encounter?.key).toBe("enemy-1");
    expect(w.wanderers.length).toBe(roaming);
    expect(distance(w.follower.pos, w.encounter!.pos)).toBeCloseTo(FIGHT_GAP, -1);
    expect(distance(w.trainer.pos, w.encounter!.pos)).toBeCloseTo(FIGHT_GAP + TRAINER_BEHIND, -1);
    expect(w.trainer.moving).toBe(false);
  });

  it("places the enemy ahead when no wild bug is close", () => {
    const w = makeWorld();
    for (const b of w.wanderers) b.pos = { x: 60, y: 60 };
    stepWorld(w, 0.016, { ...idle, encounterKey: "far" }, createSeededRng(1));
    expect(distance(w.encounter!.pos, w.trainer.pos)).toBeLessThan(300);
  });

  it("clears the encounter when the fight ends and keeps wild bugs inside the map", () => {
    const w = makeWorld();
    run(w, 1, { ...idle, encounterKey: "e" });
    run(w, 1, idle);
    expect(w.encounter).toBeNull();
    run(w, 20, idle);
    for (const b of w.wanderers) {
      expect(b.pos.x).toBeGreaterThanOrEqual(0);
      expect(b.pos.y).toBeGreaterThanOrEqual(0);
      expect(b.pos.x).toBeLessThanOrEqual(w.width);
      expect(b.pos.y).toBeLessThanOrEqual(w.height);
    }
  });

  it("centres the camera on the trainer and clamps it to the map", () => {
    const w = makeWorld();
    expect(cameraFor(w, VIEW)).toEqual({ x: 600, y: 370 });
    w.trainer.pos = { x: 10, y: 10 };
    expect(cameraFor(w, VIEW)).toEqual({ x: 0, y: 0 });
    w.trainer.pos = { x: 1800, y: 1100 };
    expect(cameraFor(w, VIEW)).toEqual({ x: 1200, y: 740 });
    expect(cameraFor({ ...w, width: 400, height: 300 }, VIEW)).toEqual({ x: -100, y: -30 });
  });

  it("picks the facing from the movement", () => {
    expect(facingOf({ x: -3, y: 1 }, "down")).toBe("left");
    expect(facingOf({ x: 0, y: -2 }, "down")).toBe("up");
    expect(facingOf({ x: 0, y: 0 }, "right")).toBe("right");
  });
});
