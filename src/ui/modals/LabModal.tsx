import { useMemo, useState } from "react";
import { labQuestion, labQuestionsOf, type LabQuestion, type LabTopic } from "../../game/data/labs";
import { answerLab, labProgress } from "../../game/labs";
import { LAB_TEXT, LAB_TOPIC_TEXT, LABS_UI } from "../../i18n/labs.ptBR";
import { useApp } from "../appContext";
import { GlossaryText } from "../components/GlossaryText";
import { OrderPuzzle, shuffledOrder } from "../components/OrderPuzzle";
import { Button, Modal, Tag } from "../components/primitives";
import { formatNumber } from "../format";
import { store, useGame } from "../store";

function LabTableView({ question }: { question: LabQuestion }) {
  const table = question.table;
  if (!table) return null;
  return (
    <div className="lab-table-wrap">
      <small className="muted">{LABS_UI.table(table.name)}</small>
      <table className="lab-table">
        <thead>
          <tr>
            {table.columns.map((c) => (
              <th key={c}>{c}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {table.rows.map((row, i) => (
            <tr key={i}>
              {row.map((cell, j) => (
                <td key={j}>{cell}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ChoiceView({ question, onAnswer }: { question: Extract<LabQuestion, { kind: "choice" }>; onAnswer: (right: boolean) => void }) {
  const text = LAB_TEXT[question.id]!;
  const options = question.codeOptions ?? text.options ?? [];
  const order = useMemo(() => shuffledOrder(options.length, question.id), [options.length, question.id]);
  const [picked, setPicked] = useState<number | null>(null);
  return (
    <div className="lab-options">
      {order.map((i) => {
        const state = picked === null ? "" : i === question.answer ? "right" : i === picked ? "wrong" : "dim";
        return (
          <button
            key={i}
            type="button"
            className={`lab-option ${question.codeOptions ? "mono" : ""} ${state}`}
            disabled={picked !== null}
            onClick={() => {
              setPicked(i);
              onAnswer(i === question.answer);
            }}
          >
            {options[i]}
          </button>
        );
      })}
    </div>
  );
}

function QuestionView({ id, onBack }: { id: string; onBack: () => void }) {
  const { toast } = useApp();
  const question = labQuestion(id)!;
  const text = LAB_TEXT[id]!;
  const [result, setResult] = useState<boolean | null>(null);
  const [round, setRound] = useState(0);
  const answer = (right: boolean) => {
    setResult(right);
    store.update((s) => {
      const coins = answerLab(s, id, right);
      if (coins > 0) toast(LABS_UI.reward(formatNumber(coins)));
    });
  };
  return (
    <div className="lab-question">
      <p className="lab-prompt">{text.prompt}</p>
      {question.code && <pre className="lab-code">{question.code.join("\n")}</pre>}
      <LabTableView question={question} />
      {question.kind === "choice" ? (
        <ChoiceView key={round} question={question} onAnswer={answer} />
      ) : (
        <OrderPuzzle
          key={round}
          items={question.codeItems ?? text.items ?? []}
          seed={`${id}-${round}`}
          prompt=""
          mono={Boolean(question.codeItems)}
          check={(order) => order.every((v, i) => v === i)}
          onDone={answer}
        />
      )}
      {result !== null && (
        <>
          {question.kind === "choice" && <p className={result ? "ok-text" : "bad-text"}>{result ? LABS_UI.right : LABS_UI.wrong}</p>}
          <GlossaryText text={text.explain} className="small" />
          <div className="button-row wrap">
            {!result && (
              <Button
                variant="dark"
                onClick={() => {
                  setResult(null);
                  setRound((r) => r + 1);
                }}
              >
                {LABS_UI.tryAgain}
              </Button>
            )}
            <Button variant="gold" onClick={onBack}>
              {LABS_UI.back}
            </Button>
          </div>
        </>
      )}
    </div>
  );
}

export function LabModal({ topic }: { topic: LabTopic }) {
  const state = useGame();
  const { close } = useApp();
  const [open, setOpen] = useState<string | null>(null);
  const info = LAB_TOPIC_TEXT[topic];
  const progress = labProgress(state, topic);
  return (
    <Modal title={info.name.toUpperCase()} onClose={close} wide headerExtra={<Tag tone="gold">{LABS_UI.progress(progress.solved, progress.total)}</Tag>}>
      {open ? (
        <QuestionView key={open} id={open} onBack={() => setOpen(null)} />
      ) : (
        <>
          <p className="muted small">{info.intro}</p>
          <div className="lab-list">
            {labQuestionsOf(topic).map((q, i) => {
              const solved = state.labs[q.id]?.solved;
              return (
                <button key={q.id} type="button" className={`lab-card ${solved ? "solved" : ""}`} onClick={() => setOpen(q.id)}>
                  <strong>{i + 1}</strong>
                  <span>{LAB_TEXT[q.id]!.prompt}</span>
                  {solved ? <Tag tone="green">{LABS_UI.solved}</Tag> : <Tag tone="gold">{LABS_UI.open}</Tag>}
                </button>
              );
            })}
          </div>
        </>
      )}
    </Modal>
  );
}
