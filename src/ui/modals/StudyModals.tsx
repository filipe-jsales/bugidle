import { LAB_TOPICS } from "../../game/data/labs";
import { labProgress } from "../../game/labs";
import { LAB_TOPIC_TEXT, LABS_UI } from "../../i18n/labs.ptBR";
import { GLOSSARY_UI } from "../../i18n/glossary.ptBR";
import { TEACHER_UI } from "../../i18n/teacher.ptBR";
import { downloadTeacherReport } from "../teacherReport";
import { Button } from "../components/primitives";
import { useState } from "react";
import { getSpecies, SPECIES } from "../../game/data/species";
import { getBoss } from "../../game/data/world";
import { fixedLines } from "../../game/data/lessons";
import { OrderPuzzle } from "../components/OrderPuzzle";
import {
  bossReviewLessons,
  currentStreak,
  dailyOrderLesson,
  streakMultiplier,
  isRightOrder,
  dailyAvailable,
  dailyLessons,
  dayNumber,
  finishDaily,
  intervalFor,
  MAX_BOX,
  REVIEW_BONUS_PER_CORRECT,
  REVIEW_QUESTIONS,
  submitBossReview,
} from "../../game/learning";
import { LEARN_UI } from "../../i18n/learning.ptBR";
import { useApp } from "../appContext";
import { formatNumber } from "../format";
import { BugSprite, Modal, Tag } from "../components/primitives";
import { Quiz } from "../components/Quiz";
import { store, useGame } from "../store";

const S = LEARN_UI.study;

export function StudyModal() {
  const state = useGame();
  const { close, open } = useApp();
  const today = dayNumber(new Date());
  const [lessons] = useState(() => dailyLessons(state, today));
  const [orderLesson] = useState(() => dailyOrderLesson(state, today));
  const [answers, setAnswers] = useState<Record<string, number> | null>(null);
  const [orderRight, setOrderRight] = useState<boolean | null>(null);
  const [result, setResult] = useState<{ correct: number; coins: number; egg: boolean } | null>(null);
  const finish = (picked: Record<string, number>, ordered: boolean) => store.update((s) => setResult(finishDaily(s, picked, today, ordered)));
  const available = dailyAvailable(state, today);
  const cards = SPECIES.filter((s) => state.knowledge[s.id]);
  const perBox = Array.from({ length: MAX_BOX }, (_, i) => cards.filter((s) => state.knowledge[s.id]!.box === i + 1).length);

  return (
    <Modal title={S.title} onClose={close} wide>
      <section className="subpanel">
        <div className="streak-head">
          <h4>{S.dailyTitle}</h4>
          <span className={`streak-pill ${currentStreak(state, today) > 0 ? "on" : ""}`} title={S.streakHint}>
            {S.streak(currentStreak(state, today), Math.round((streakMultiplier(currentStreak(state, today) + 1) - 1) * 100), state.dailyDay === today)}
          </span>
        </div>
        {result ? (
          <>
            <p className="ok-text">{S.dailyResult(result.correct, lessons.length, formatNumber(result.coins), result.egg)}</p>
            {orderRight && <p className="small">{S.orderBonus}</p>}
          </>
        ) : available && answers && orderLesson ? (
          <>
            <h4>{LEARN_UI.order.title}</h4>
            <OrderPuzzle
              items={fixedLines(orderLesson)}
              seed={`order-${today}`}
              prompt={LEARN_UI.order.prompt(getSpecies(orderLesson.speciesId).name)}
              check={(order) => isRightOrder(orderLesson, order)}
              onDone={(right) => {
                setOrderRight(right);
                window.setTimeout(() => finish(answers, right), 1600);
              }}
            />
          </>
        ) : available ? (
          <>
            <p className="muted small">{S.dailyIntro}</p>
            <Quiz
              lessons={lessons}
              onFinish={(picked) => {
                if (orderLesson) setAnswers(picked);
                else finish(picked, false);
              }}
            />
          </>
        ) : (
          <p className="muted small">{state.dailyDay === today ? S.dailyDone : S.dailyNeedsBugs}</p>
        )}
      </section>

      <section className="subpanel">
        <h4>{LABS_UI.title}</h4>
        <p className="muted small">{LABS_UI.intro}</p>
        <div className="lab-topics">
          {LAB_TOPICS.map((topic) => {
            const progress = labProgress(state, topic);
            return (
              <button key={topic} type="button" className="lab-topic" onClick={() => open({ kind: "lab", topic })}>
                <strong>{LAB_TOPIC_TEXT[topic].name}</strong>
                <small className="muted">{LAB_TOPIC_TEXT[topic].intro}</small>
                <Tag tone={progress.solved === progress.total ? "green" : "gold"}>{LABS_UI.progress(progress.solved, progress.total)}</Tag>
              </button>
            );
          })}
        </div>
        <div className="button-row wrap">
          <Button variant="dark" small onClick={() => open({ kind: "glossary" })}>
            {GLOSSARY_UI.open}
          </Button>
          <Button variant="dark" small title={TEACHER_UI.hint} onClick={() => downloadTeacherReport(state)}>
            {TEACHER_UI.button}
          </Button>
        </div>
      </section>

      <section className="subpanel">
        <h4>{S.boxesTitle}</h4>
        <p className="muted small">{S.boxesIntro}</p>
        <div className="box-columns">
          {perBox.map((count, i) => (
            <div key={i} className="box-column">
              <strong>{S.box(i + 1)}</strong>
              <span className="big-number">{count}</span>
              <small className="muted">{S.every(intervalFor(i + 1))}</small>
            </div>
          ))}
        </div>
        <div className="tag-row">
          {cards.map((s) => {
            const card = state.knowledge[s.id]!;
            return (
              <span key={s.id} className="knowledge-chip" title={S.nextReview(card.due - today)}>
                <BugSprite speciesId={s.id} size={24} />
                {s.name}
                <Tag tone={card.due <= today ? "pink" : "green"}>{S.box(card.box)}</Tag>
              </span>
            );
          })}
        </div>
      </section>
    </Modal>
  );
}

export function BossReviewModal({ bossId }: { bossId: string }) {
  const state = useGame();
  const { close } = useApp();
  const [lessons] = useState(() => bossReviewLessons(bossId));
  const [score, setScore] = useState<number | null>(null);
  const boss = getBoss(bossId);
  const stored = state.bossReview[bossId] ?? 0;
  return (
    <Modal title={S.reviewTitle(boss.name)} onClose={close}>
      <p className="muted small">{S.reviewIntro(Math.round(REVIEW_BONUS_PER_CORRECT * 100), lessons.map((l) => getSpecies(l.speciesId).name).join(", "))}</p>
      {score === null ? (
        <Quiz lessons={lessons} onFinish={(answers) => store.update((s) => setScore(submitBossReview(s, bossId, answers, dayNumber(new Date()))))} />
      ) : (
        <p className="ok-text">{S.reviewResult(score, REVIEW_QUESTIONS, Math.round(Math.max(score, stored) * REVIEW_BONUS_PER_CORRECT * 100))}</p>
      )}
    </Modal>
  );
}
