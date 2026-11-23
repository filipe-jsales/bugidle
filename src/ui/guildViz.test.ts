import { CHAMPIONS } from "../game/guild";
import { frameAt, vizFrames, VIZ_SIZE } from "./guildViz";

const isSorted = (a: number[]) => a.every((v, i) => i === 0 || a[i - 1]! <= v);

describe("guild visualizer", () => {
  it("every sorting champion ends with the bars sorted", () => {
    for (const c of CHAMPIONS.filter((c) => c.kind === "sort")) {
      const frames = vizFrames(c.id, "test");
      expect(frames.length, c.id).toBeGreaterThan(3);
      expect(isSorted(frames[frames.length - 1]!.bars), c.id).toBe(true);
      expect(isSorted(frames[0]!.bars), c.id).toBe(false);
    }
  });

  it("every searching champion ends on the target", () => {
    for (const c of CHAMPIONS.filter((c) => c.kind === "search")) {
      const last = vizFrames(c.id, "test").at(-1)!;
      expect(last.found, c.id).toBeDefined();
      expect(last.bars[last.found!], c.id).toBe(last.target);
    }
  });

  it("shows the Big-O difference: bubble takes many more steps than merge, binary fewer than linear", () => {
    expect(vizFrames("bubbleSort", "x").length).toBeGreaterThan(vizFrames("mergeSort", "x").length * 1.5);
    expect(vizFrames("binarySearch", "x").length).toBeLessThan(vizFrames("linearSearch", "x").length);
  });

  it("picks the frame from the raid progress", () => {
    const frames = vizFrames("quickSort", "y");
    expect(frameAt(frames, 0)).toBe(frames[0]);
    expect(frameAt(frames, 1)).toBe(frames[frames.length - 1]);
    expect(frames[0]!.bars).toHaveLength(VIZ_SIZE);
  });
});
