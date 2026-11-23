import type { LabTopic } from "../game/data/labs";

/** Bugs that open a lab about what they break (Bugdex page and region map). */
export const SPECIES_LAB: Readonly<Record<string, LabTopic>> = {
  mergefly: "git",
  injectick: "security",
  injecthorn: "security",
  xssquito: "security",
  nplusone: "sql",
  packetfly: "network",
  dnsnail: "network",
};
