/**
 * The Reboot Center nurse: a hand-drawn 16x22 front view, two frames (idle and
 * a wave while she heals). Same format as the trainer: one letter per color.
 */
export const NURSE_WIDTH = 16;
export const NURSE_HEIGHT = 22;

export const NURSE_PALETTE: Readonly<Record<string, string>> = {
  k: "#1a1020",
  h: "#3fb5c9",
  H: "#237a8c",
  w: "#fbf4e4",
  W: "#d8cfc4",
  s: "#f0c08e",
  S: "#c98f62",
  e: "#1a1020",
  m: "#e05a9a",
  n: "#5fcf7a",
  N: "#2f8a49",
  g: "#40394c",
  t: "#5aa2ef",
};

// prettier-ignore
const IDLE: readonly string[] = [
  "....kkkkkkkk....",
  "...kwwwwwwwwk...",
  "...kwwwnnwwwk...",
  "..kHkwnnnnwkHk..",
  "..khkwwnnwwkhk..",
  "..khhkkkkkkhhk..",
  "..khsssssssshk..",
  "..khsesssseshk..",
  "..khsesssseshk..",
  "...kSssmmssSk...",
  "....kSSSSSSk....",
  "..kwwwwwwwwwwk..",
  ".kwkwwwnnwwwkwk.",
  ".kwkwwnnnnwwkwk.",
  ".kwkwwwnnwwwkwk.",
  ".kskwwwwwwwwksk.",
  "..kkWWWWWWWWkk..",
  "...kwwwwwwwwk...",
  "...kwwwkkwwwk...",
  "...kgggkkgggk...",
  "..kggggkkggggk..",
  "...kkkk..kkkk...",
];

/** Healing frame: the right arm is up, holding a tablet. */
// prettier-ignore
const WAVE: readonly string[] = [
  "....kkkkkkkk.kk.",
  "...kwwwwwwwwkttk",
  "...kwwwnnwwwkttk",
  "..kHkwnnnnwkHktk",
  "..khkwwnnwwkhkkk",
  "..khhkkkkkkhhksk",
  "..khsssssssshksk",
  "..khsesssseshkwk",
  "..khsesssseshkwk",
  "...kSssmmssSkkwk",
  "....kSSSSSSk.kwk",
  "..kwwwwwwwwwwkwk",
  ".kwkwwwnnwwwwwk.",
  ".kwkwwnnnnwwwk..",
  ".kwkwwwnnwwwk...",
  ".kskwwwwwwwwk...",
  "..kkWWWWWWWWk...",
  "...kwwwwwwwwk...",
  "...kwwwkkwwwk...",
  "...kgggkkgggk...",
  "..kggggkkggggk..",
  "...kkkk..kkkk...",
];

export const NURSE_FRAMES: readonly (readonly string[])[] = [IDLE, WAVE];
