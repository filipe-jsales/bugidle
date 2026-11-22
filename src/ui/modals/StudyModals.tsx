import { useState } from "react";
import { getSpecies, SPECIES } from "../../game/data/species";
import { getBoss } from "../../game/data/world";
import {
  bossReviewLessons,
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
  const { close } = useApp();
  const today = dayNumber(new Date());
  const [lessons] = useState(() => dailyLessons(state, today));
  const [result, setResult] = useState<{ correct: number; coins: number; egg: boolean } | null>(null);
  const available = dailyAvailable(state, today);
  const cards = SPECIES.filter((s) => state.knowledge[s.id]);
  const perBox = Array.from({ length: MAX_BOX }, (_, i) => cards.filter((s) => state.knowledge[s.id]!.box === i + 1).length);

  return (
    <Modal title={S.title} onClose={close} wide>
      <section className="subpanel">
        <h4>{S.dailyTitle}</h4>
        {result ? (
          <p className="ok-text">{S.dailyResult(result.correct, lessons.length, formatNumber(result.coins), result.egg)}</p>
        ) : available ? (
          <>
            <p className="muted small">{S.dailyIntro}</p>
            <Quiz lessons={lessons} onFinish={(answers) => store.update((s) => setResult(finishDaily(s, answers, today)))} />
          </>
        ) : (
          <p className="muted small">{state.dailyDay === today ? S.dailyDone : S.dailyNeedsBugs}</p>
        )}
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
