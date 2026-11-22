import { TRAINER_HEIGHT, TRAINER_PALETTE, TRAINER_WIDTH, trainerPixels, Tp, walkFrame, type Facing, type WalkFrame } from "./trainerSprite";

const FACINGS: Facing[] = ["down", "up", "left", "right"];
const FRAMES: WalkFrame[] = [0, 1, 2];
const same = (a: Uint8Array, b: Uint8Array) => a.every((v, i) => v === b[i]);

describe("trainer sprite", () => {
  it("has the right size and is filled for every facing and frame", () => {
    for (const facing of FACINGS) {
      for (const frame of FRAMES) {
        const pixels = trainerPixels(facing, frame);
        expect(pixels.length).toBe(TRAINER_WIDTH * TRAINER_HEIGHT);
        expect(pixels.filter((p) => p !== Tp.Empty).length).toBeGreaterThan(120);
        expect(pixels.includes(Tp.Outline)).toBe(true);
      }
    }
  });

  it("shows the face from the front and the backpack from behind", () => {
    expect(trainerPixels("down", 0).includes(Tp.Eye)).toBe(true);
    expect(trainerPixels("up", 0).includes(Tp.Eye)).toBe(false);
    expect(trainerPixels("up", 0).filter((p) => p === Tp.Backpack).length).toBeGreaterThan(20);
  });

  it("walk frames move the legs", () => {
    for (const facing of FACINGS) {
      expect(same(trainerPixels(facing, 0), trainerPixels(facing, 1))).toBe(false);
      expect(same(trainerPixels(facing, 1), trainerPixels(facing, 2))).toBe(false);
    }
  });

  it("right uses the side sprite (mirrored when drawn)", () => {
    expect(same(trainerPixels("right", 1), trainerPixels("left", 1))).toBe(true);
  });

  it("every pixel kind has a color", () => {
    for (const facing of FACINGS) for (const p of trainerPixels(facing, 0)) if (p !== Tp.Empty) expect(TRAINER_PALETTE[p as Exclude<Tp, Tp.Empty>]).toMatch(/^#/);
  });

  it("cycles frames only while moving", () => {
    expect(walkFrame(false, 3.3)).toBe(0);
    const frames = new Set([0, 0.13, 0.26, 0.39].map((t) => walkFrame(true, t)));
    expect(frames).toEqual(new Set([0, 1, 2]));
  });
});
