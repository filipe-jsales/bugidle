/** Turns the study numbers into a plain-text report a teacher can read, and downloads it. */
import { getSpecies } from "../game/data/species";
import type { PersistentState } from "../game/state";
import { studyReport } from "../game/studyReport";
import { LAB_TOPIC_TEXT } from "../i18n/labs.ptBR";
import { REGION_TOPICS } from "../i18n/learning.ptBR";
import { REGION_NAMES } from "../i18n/ptBR";
import { TEACHER_UI } from "../i18n/teacher.ptBR";

const pct = (right: number, wrong: number) => (right + wrong === 0 ? "-" : `${Math.round((right / (right + wrong)) * 100)}%`);

export function teacherReportText(state: PersistentState, date: Date): string {
  const T = TEACHER_UI;
  const report = studyReport(state);
  const lines: string[] = [
    T.heading,
    T.player(state.trainer.name, state.trainer.level),
    T.date(date.toLocaleDateString("pt-BR")),
    T.playTime(Math.round(state.totals.playTimeMs / 60_000)),
    "",
    T.totals(report.right, report.wrong, pct(report.right, report.wrong)),
    "",
    T.topicsTitle,
  ];
  for (const t of report.topics) {
    const topic = REGION_TOPICS[t.regionId];
    lines.push(`- ${REGION_NAMES[t.regionId]} (${topic?.title ?? ""}): ${T.topicLine(t.studied, t.total, t.right, t.wrong, pct(t.right, t.wrong))}`);
    lines.push(`  ${T.boxes(t.boxes)}`);
    if (topic) lines.push(`  ${T.covers(topic.topics.join(", "))}`);
    if (t.weakest.length > 0) lines.push(`  ${T.review(t.weakest.map((id) => getSpecies(id).name).join(", "))}`);
  }
  lines.push("", T.labsTitle);
  for (const l of report.labs) lines.push(`- ${LAB_TOPIC_TEXT[l.topic].name}: ${T.labLine(l.solved, l.total, l.tries, l.wrong)}`);
  lines.push("", T.footer);
  return lines.join("\n");
}

/** Saves the report as a .txt file through the browser's download. */
export function downloadTeacherReport(state: PersistentState): void {
  const date = new Date();
  const blob = new Blob([teacherReportText(state, date)], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `bugidle-relatorio-${date.toISOString().slice(0, 10)}.txt`;
  a.click();
  URL.revokeObjectURL(url);
}
