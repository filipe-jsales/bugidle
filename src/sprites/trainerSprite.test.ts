import { LOOK_COLORS, TRAINER_HEIGHT, TRAINER_PALETTE, TRAINER_WIDTH, trainerPalette, trainerPixels, Tp, walkFrame, type Facing, type WalkFrame } from "./trainerSprite";
import { defaultLook, LOOK_OPTIONS } from "../game/trainerLook";

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
    expect(trainerPixels("up", 0).filter((p) => p === Tp.Backpack || p === Tp.BackpackDark).length).toBeGreaterThan(20);
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

describe("trainer look", () => {
  it("every headwear keeps the sprite size and changes only the top of the head", () => {
    for (const facing of FACINGS) {
      for (const frame of FRAMES) {
        const cap = trainerPixels(facing, frame, "cap");
        for (const hw of ["beanie", "none"] as const) {
          const other = trainerPixels(facing, frame, hw);
          expect(other.length).toBe(cap.length);
          // rows 5 and below are the same drawing
          expect(same(other.slice(5 * TRAINER_WIDTH), cap.slice(5 * TRAINER_WIDTH))).toBe(true);
          expect(same(other, cap)).toBe(false);
        }
      }
    }
  });

  it("without a hat the hair shows and there is no cap logo", () => {
    const none = trainerPixels("down", 0, "none");
    expect(none.slice(0, 5 * TRAINER_WIDTH).includes(Tp.Hair)).toBe(true);
    expect(none.includes(Tp.Logo)).toBe(false);
    expect(none.includes(Tp.Cap)).toBe(false);
  });

  it("every color option has a color, and the default look keeps the classic colors", () => {
    for (const part of ["headColor", "hair", "skin", "jacket", "pants", "backpack"] as const) {
      for (const option of LOOK_OPTIONS[part]) expect(LOOK_COLORS[part]?.[option], `${part}:${option}`).toBeDefined();
    }
    const classic = trainerPalette(defaultLook());
    expect(classic[Tp.Cap]).toBe(TRAINER_PALETTE[Tp.Cap]);
    expect(classic[Tp.Jacket]).toBe(TRAINER_PALETTE[Tp.Jacket]);
    expect(trainerPalette({ ...defaultLook(), jacket: "gold" })[Tp.Jacket]).toBe(LOOK_COLORS.jacket!.gold![0]);
  });
});
