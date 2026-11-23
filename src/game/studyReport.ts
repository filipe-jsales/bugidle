/**
 * Numbers for the teacher report: what the player studied, grouped by the
 * region topics and by lab topic. Pure; the UI turns it into text.
 */
import { LAB_TOPICS, labQuestionsOf, type LabTopic } from "./data/labs";
import { lessonsFor } from "./data/lessons";
import { SPECIES } from "./data/species";
import { REGIONS, routesOfRegion } from "./data/world";
import { MAX_BOX } from "./learning";
import type { PersistentState } from "./state";

export interface TopicSummary {
  regionId: string;
  /** Species of the region the player has studied at least once. */
  studied: number;
  total: number;
  right: number;
  wrong: number;
  /** How many studied species sit in each Leitner box (index 0 = box 1). */
  boxes: number[];
  /** Species still in box 1 (to review). */
  weakest: string[];
}

export interface LabSummary {
  topic: LabTopic;
  solved: number;
  total: number;
  tries: number;
  wrong: number;
}

export interface StudyReport {
  topics: TopicSummary[];
  labs: LabSummary[];
  right: number;
  wrong: number;
}

/** The region where a species first shows up, for grouping. */
function regionOf(speciesId: string): string {
  for (const region of REGIONS) if (routesOfRegion(region.id).some((r) => r.encounters.some((e) => e.speciesId === speciesId))) return region.id;
  return REGIONS[REGIONS.length - 1]!.id;
}

export function studyReport(state: PersistentState): StudyReport {
  const topics: TopicSummary[] = REGIONS.map((region) => {
    const species = SPECIES.filter((s) => lessonsFor(s.id).length > 0 && regionOf(s.id) === region.id);
    const cards = species.map((s) => [s.id, state.knowledge[s.id]] as const).filter(([, c]) => c);
    const boxes = Array.from({ length: MAX_BOX }, (_, i) => cards.filter(([, c]) => c!.box === i + 1).length);
    return {
      regionId: region.id,
      studied: cards.length,
      total: species.length,
      right: cards.reduce((n, [, c]) => n + (c!.right ?? 0), 0),
      wrong: cards.reduce((n, [, c]) => n + (c!.wrong ?? 0), 0),
      boxes,
      weakest: cards.filter(([, c]) => c!.box <= 1).map(([id]) => id),
    };
  });
  const labs: LabSummary[] = LAB_TOPICS.map((topic) => {
    const results = labQuestionsOf(topic).map((q) => state.labs[q.id]);
    return {
      topic,
      solved: results.filter((r) => r?.solved).length,
      total: results.length,
      tries: results.reduce((n, r) => n + (r?.tries ?? 0), 0),
      wrong: results.reduce((n, r) => n + (r?.wrong ?? 0), 0),
    };
  });
  return {
    topics,
    labs,
    right: topics.reduce((n, t) => n + t.right, 0),
    wrong: topics.reduce((n, t) => n + t.wrong, 0),
  };
}
