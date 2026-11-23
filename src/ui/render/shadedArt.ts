/**
 * Shaded pixel art for items and menu icons. Art is drawn flat with one
 * letter per color; this pass adds a dark outline around the shape and a
 * three-tone bevel: pixels with open space above or to the left get the light
 * tone, pixels with open space below or to the right get the dark tone.
 * Pure (returns color names per pixel) so it can be tested without a canvas.
 */

export interface Ramp {
  light: string;
  base: string;
  dark: string;
}

const ramp = (light: string, base: string, dark: string): Ramp => ({ light, base, dark });

/** Shaded colors. Letters not listed here are flat (see FLAT). */
export const RAMPS: Readonly<Record<string, Ramp>> = {
  r: ramp("#ff8a7a", "#e2574c", "#a8352f"),
  o: ramp("#ffc07a", "#f08a3c", "#b45a1c"),
  y: ramp("#fff2a8", "#ffd25a", "#c48a22"),
  n: ramp("#a6f2b2", "#5fcf7a", "#2f8a49"),
  c: ramp("#c4f8ff", "#6fe0f0", "#2fa0b8"),
  b: ramp("#acd4ff", "#5aa2ef", "#2f66b0"),
  p: ramp("#ecc2ff", "#c477e8", "#7c35a2"),
  m: ramp("#ffd0e6", "#f08ac0", "#b84a86"),
  w: ramp("#ffffff", "#f4ece0", "#c8bcae"),
  g: ramp("#e6e6ee", "#b8b4bc", "#6d6872"),
  d: ramp("#6e6680", "#40394c", "#26202e"),
  t: ramp("#dca474", "#a8703e", "#6b4423"),
  s: ramp("#fff2d6", "#f0d6a4", "#c4a06a"),
};

/** Flat colors: the outline, pure black details, pure white glints, and sparkles. */
export const FLAT: Readonly<Record<string, string>> = {
  k: "#1f1424",
  e: "#1f1424",
  W: "#ffffff",
  "*": "#fff7c2",
};

/** Turns flat art into rows of colors (null = transparent), with outline and bevel. */
export function shadeArt(rows: readonly string[]): (string | null)[][] {
  const h = rows.length;
  const w = Math.max(...rows.map((r) => r.length));
  const at = (x: number, y: number) => (x < 0 || y < 0 || x >= w || y >= h ? "." : (rows[y]![x] ?? "."));
  const open = (x: number, y: number) => {
    const ch = at(x, y);
    return ch === "." || ch === "k" || ch === "e";
  };
  const out: (string | null)[][] = [];
  for (let y = 0; y < h; y++) {
    const line: (string | null)[] = [];
    for (let x = 0; x < w; x++) {
      const ch = at(x, y);
      if (ch === ".") {
        const touches = [at(x - 1, y), at(x + 1, y), at(x, y - 1), at(x, y + 1)].some((n) => n !== "." && n !== "k");
        line.push(touches ? FLAT.k! : null);
        continue;
      }
      const shaded = RAMPS[ch];
      if (!shaded) {
        line.push(FLAT[ch] ?? null);
        continue;
      }
      const lit = open(x, y - 1) || open(x - 1, y);
      const shade = open(x, y + 1) || open(x + 1, y);
      line.push(lit && !shade ? shaded.light : shade && !lit ? shaded.dark : shaded.base);
    }
    out.push(line);
  }
  return out;
}
