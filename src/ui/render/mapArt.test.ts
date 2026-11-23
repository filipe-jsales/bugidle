import { createSeededRng } from "../../game/rng";
import { createNav } from "../world/navigation";
import { isHole } from "./mapArt";

describe("map art", () => {
  it("only the Cloud region has holes, and never at the Reboot Center", () => {
    const nav = createNav(2800, 1700, createSeededRng(1));
    const holes = nav.obstacles.filter((o) => isHole("cloud", o));
    expect(holes.length).toBeGreaterThan(0);
    expect(holes.length).toBeLessThan(nav.obstacles.length);
    expect(nav.obstacles.some((o) => o.center && isHole("cloud", o))).toBe(false);
    for (const terrain of ["circuit", "server", "datacenter", "mainframe"] as const) expect(nav.obstacles.some((o) => isHole(terrain, o))).toBe(false);
  });
});
