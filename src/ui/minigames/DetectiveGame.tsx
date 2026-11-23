import { useEffect, useRef, useState, type FormEvent, type ReactNode } from "react";
import { getConcept, type Concept, type ConceptSeals, type ConceptTraits } from "../../game/data/concepts";
import { dayNumber } from "../../game/learning";
import { CLUE_COUNT, CLUE_POINTS, CLUE_SECONDS, detectivePointsToday, finishGame, isRightAnswer, pickConcept, solveConcept } from "../../game/minigames";
import { CATEGORY_TEXT, CONCEPT_TEXT, USE_TEXT } from "../../i18n/concepts.ptBR";
import { MINIGAMES_UI } from "../../i18n/minigames.ptBR";
import { GlossaryText } from "../components/GlossaryText";
import { Button, Icon, ItemIcon } from "../components/primitives";
import { formatNumber } from "../format";
import { conceptIconUrl } from "../render/icons";
import { store, useGame } from "../store";

const D = MINIGAMES_UI.detective;
/** Colour of each clue tile, from the most valuable to the last one. */
const TILE_TONES = ["gold", "purple", "blue", "green", "pink"] as const;
const TRAITS: (keyof ConceptTraits)[] = ["popularity", "difficulty", "abstraction", "everyday"];
const SEALS: (keyof ConceptSeals)[] = ["openSource", "language", "hardware"];

interface Ending {
  solved: boolean;
  points: number;
  coins: number;
}

/** A clue box: shows its content once `open`, a lock before. */
function ClueBox({ title, open, children, className = "" }: { title: string; open: boolean; children: ReactNode; className?: string }) {
  return (
    <section className={`clue-box ${open ? "open" : "locked"} ${className}`}>
      <h5>{title}</h5>
      {open ? children : <ItemIcon id="mutex" size={18} />}
    </section>
  );
}

function nameMask(name: string): string {
  return [...name].map((ch, i) => (ch === " " ? " " : i === 0 ? ch.toUpperCase() : "_")).join(" ");
}

function ConceptCard({ concept, clue, tone }: { concept: Concept; clue: number; tone: string }) {
  const text = CONCEPT_TEXT[concept.id]!;
  return (
    <div className={`detective-card tone-${tone}`}>
      <div className="clue-row">
        <ClueBox title={D.category} open={clue >= 0} className="grow">
          <div className="chip-row">
            {concept.categories.map((c) => (
              <span key={c} className={`concept-chip cat-${c}`}>
                {CATEGORY_TEXT[c]}
              </span>
            ))}
          </div>
        </ClueBox>
        <ClueBox title={D.era} open={clue >= 0}>
          <span className="concept-chip era">{D.year(concept.year)}</span>
        </ClueBox>
      </div>

      <ClueBox title={D.traits} open={clue >= 1}>
        <div className="trait-grid">
          {TRAITS.map((t) => (
            <div key={t} className="trait">
              <span>{D.traitNames[t]}</span>
              <div className="trait-bar">
                <div className={`trait-fill trait-${t}`} style={{ width: `${concept.traits[t]}%` }} />
              </div>
              <strong>{concept.traits[t]}</strong>
            </div>
          ))}
        </div>
      </ClueBox>

      <div className="clue-row">
        <ClueBox title={D.uses} open={clue >= 2} className="grow">
          <div className="chip-row">
            {concept.uses.map((u) => (
              <span key={u} className="concept-chip use">
                {USE_TEXT[u]}
              </span>
            ))}
          </div>
        </ClueBox>
        <ClueBox title={D.seals} open={clue >= 2} className="grow">
          <div className="seal-list">
            {SEALS.map((s) => (
              <span key={s} className={`seal ${concept.seals[s] ? "yes" : "no"}`}>
                <b>{concept.seals[s] ? "+" : "x"}</b> {D.sealText[s][concept.seals[s] ? 0 : 1]}
              </span>
            ))}
          </div>
        </ClueBox>
      </div>

      <ClueBox title={D.riddle} open={clue >= 3}>
        <p className="riddle">{text.riddle}</p>
      </ClueBox>

      <ClueBox title={D.nameClue} open={clue >= 4}>
        <p className="name-mask">
          {nameMask(text.name)} <small className="muted">({D.letters(text.name.replace(/\s/g, "").length)})</small>
        </p>
      </ClueBox>
    </div>
  );
}

function Reveal({ concept, ending, onNext }: { concept: Concept; ending: Ending; onNext: () => void }) {
  const text = CONCEPT_TEXT[concept.id]!;
  return (
    <div className="detective-reveal">
      <div className="reveal-hero">
        <div className="reveal-spot" />
        <img className="pixel reveal-icon" src={conceptIconUrl(concept.id)} width={112} height={112} alt="" />
        <span className="reveal-label">{ending.solved ? D.solved : D.revealed}</span>
        <strong className="reveal-name">{text.name}</strong>
        <span className={`reveal-reward ${ending.coins > 0 ? "" : "muted"}`}>
          {ending.coins > 0 ? D.reward(ending.points, formatNumber(ending.coins)) : ending.solved ? D.alreadyPaid : D.gaveUp}
        </span>
      </div>
      <section className="explain-box">
        <h5>{D.whatIs}</h5>
        <GlossaryText text={text.what} />
      </section>
      <section className="explain-box">
        <h5>{D.whyUse}</h5>
        <GlossaryText text={text.why} />
      </section>
      <section className="explain-box">
        <h5>{D.whereUsed}</h5>
        <GlossaryText text={text.where} />
      </section>
      <Button variant="gold" onClick={onNext}>
        {D.next}
      </Button>
    </div>
  );
}

export function DetectiveGame() {
  const state = useGame();
  const today = dayNumber(new Date());
  const [round, setRound] = useState(1);
  const [conceptId, setConceptId] = useState(() => pickConcept(store.state, today, Date.now() % 100_000));
  const [clue, setClue] = useState(0);
  const [guesses, setGuesses] = useState<string[]>([]);
  const [input, setInput] = useState("");
  const [ending, setEnding] = useState<Ending | null>(null);
  const [left, setLeft] = useState(CLUE_SECONDS);
  const [help, setHelp] = useState(false);
  const field = useRef<HTMLInputElement>(null);
  const concept = getConcept(conceptId)!;
  const last = clue >= CLUE_COUNT - 1;
  const tone = TILE_TONES[Math.min(clue, TILE_TONES.length - 1)]!;

  // the clock opens the next clue by itself; the last clue waits for the player
  useEffect(() => {
    if (ending || last) return;
    setLeft(CLUE_SECONDS);
    const id = window.setInterval(() => setLeft((s) => s - 1), 1000);
    return () => window.clearInterval(id);
  }, [clue, ending, last, round]);
  useEffect(() => {
    if (left <= 0 && !ending && !last) setClue((c) => c + 1);
  }, [left, ending, last]);
  useEffect(() => field.current?.focus(), [round, clue]);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const guess = input.trim();
    if (!guess || ending) return;
    setInput("");
    const text = CONCEPT_TEXT[concept.id]!;
    if (isRightAnswer(guess, [text.name, ...text.aliases])) {
      store.update((s) => {
        const result = solveConcept(s, concept.id, clue, today);
        // the ranking keeps 0-100 points; the coins were already paid by the concept rules
        finishGame(s, "detective", result.points * 10, today, false);
        setEnding({ solved: true, ...result });
      });
      return;
    }
    setGuesses((g) => [guess, ...g]);
    if (!last) setClue((c) => c + 1);
  };

  const next = () => {
    setConceptId(pickConcept(store.state, today, round + Date.now() % 1000, conceptId));
    setRound((r) => r + 1);
    setClue(0);
    setGuesses([]);
    setEnding(null);
    setInput("");
  };

  return (
    <div className="detective">
      <div className="detective-head">
        <span className="game-badge">
          <Icon name="minigames" size={22} />
        </span>
        <h4>{D.name}</h4>
        <span className="today-pill">
          {D.today} <strong>{D.pts(detectivePointsToday(state, today))}</strong>
        </span>
        <button type="button" className="help-dot big" aria-expanded={help} onClick={() => setHelp((h) => !h)}>
          ?
        </button>
      </div>
      {help && (
        <ul className="detective-help">
          {D.help.map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ul>
      )}

      <div className="clue-tiles">
        {CLUE_POINTS.map((points, i) => (
          <span key={i} className={`clue-tile tone-${TILE_TONES[i]} ${i < clue ? "used" : i === clue && !ending ? "current" : ""}`}>
            {i === CLUE_COUNT - 1 ? "+" : points}
          </span>
        ))}
        <span className="clue-timer">{ending ? "" : last ? "--" : `0:${String(Math.max(0, left)).padStart(2, "0")}`}</span>
      </div>

      {ending ? <Reveal concept={concept} ending={ending} onNext={next} /> : <ConceptCard concept={concept} clue={clue} tone={tone} />}

      {!ending && (
        <>
          <div className="guess-log">
            {guesses.length === 0 ? (
              <p className="muted">{D.guessesEmpty}</p>
            ) : (
              guesses.map((g, i) => (
                <p key={`${g}-${i}`} className="bad-text">
                  {D.wrong(g)}
                </p>
              ))
            )}
            {last && <p className="small">{D.lastClue}</p>}
          </div>
          <form className="guess-form" onSubmit={submit}>
            <span className={`guess-dot tone-${tone}`} />
            <input ref={field} className="guess-input" value={input} onChange={(e) => setInput(e.target.value)} placeholder={D.placeholder} aria-label={D.placeholder} autoComplete="off" spellCheck={false} />
            <Button variant="purple" type="submit">
              {D.send}
            </Button>
          </form>
          <Button variant="dark" small onClick={() => setEnding({ solved: false, points: 0, coins: 0 })}>
            {D.giveUp}
          </Button>
        </>
      )}
      <p className="muted small detective-total">{D.solvedTotal(state.minigames.detective.solved)}</p>
    </div>
  );
}
