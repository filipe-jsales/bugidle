import { useState } from "react";
import { ACHIEVEMENTS } from "../../game/achievements";
import { dexProgress } from "../../game/bugdex";
import { getSpecies } from "../../game/data/species";
import { BOSSES } from "../../game/data/world";
import { trainerXpToNext } from "../../game/experience";
import { defaultLook, favoriteBug, isLookOptionOpen, LOOK_OPTIONS, LOOK_PARTS, requirementOf, setFavorite, setLook, type LookPart } from "../../game/trainerLook";
import { BADGE_NAMES, UI } from "../../i18n/ptBR";
import { HEADWEAR_NAMES, LOOK_OPTION_NAMES, LOOK_PART_NAMES, REQUIREMENT_TEXT, TRAINER_UI as T } from "../../i18n/trainer.ptBR";
import { LOOK_COLORS, type Facing } from "../../sprites/trainerSprite";
import { useApp } from "../appContext";
import { Bar, BugSprite, Button, Icon, Modal } from "../components/primitives";
import { formatDuration, formatNumber } from "../format";
import { trainerSpriteUrl } from "../render/pixels";
import { store, useGame } from "../store";

const FACINGS: Facing[] = ["down", "left", "up", "right"];

/** The trainer in big pixels, breathing, turned to `facing`. */
function TrainerPreview({ facing, onTurn }: { facing: Facing; onTurn: () => void }) {
  const state = useGame();
  return (
    <div className="trainer-stage">
      <div className="trainer-spot" />
      <img className={`pixel idle-bob ${facing === "right" ? "mirror" : ""}`} src={trainerSpriteUrl(facing, 0, state.trainer.look)} width={96} height={132} alt="" draggable={false} />
      <Button variant="dark" small onClick={onTurn}>
        {T.turn}
      </Button>
    </div>
  );
}

function CardTab() {
  const state = useGame();
  const { open } = useApp();
  const [picking, setPicking] = useState(false);
  const dex = dexProgress(state);
  const favUid = favoriteBug(state);
  const fav = favUid ? state.bugs[favUid] : undefined;
  const firstDay = Math.min(...Object.values(state.bugs).map((b) => b.caughtAt ?? Infinity));
  const games = Object.values(state.minigames.games).reduce((sum, g) => sum + (g?.plays ?? 0), 0);
  const stats: [string, string][] = [
    [T.stat.playTime, formatDuration(state.totals.playTimeMs)],
    [T.stat.defeats, formatNumber(state.totals.defeats)],
    [T.stat.captures, formatNumber(state.totals.captures)],
    [T.stat.shinies, formatNumber(state.totals.shinies)],
    [T.stat.evolutions, formatNumber(state.totals.evolutions)],
    [T.stat.hatched, formatNumber(state.totals.hatched)],
    [T.stat.dex, `${dex.caught}/${dex.total}`],
    [T.stat.achievements, `${Object.keys(state.achievements).length}/${ACHIEVEMENTS.length}`],
    [T.stat.streak, String(state.studyStreak.best)],
    [T.stat.games, formatNumber(games)],
  ];
  const bugs = Object.values(state.bugs).sort((a, b) => Number(state.team.includes(b.uid)) - Number(state.team.includes(a.uid)) || b.level - a.level);

  return (
    <div className="trainer-card-body">
      <section className="subpanel">
        <h4>{T.stats}</h4>
        <div className="trainer-stats">
          {stats.map(([label, value]) => (
            <div key={label} className="trainer-stat">
              <small className="muted">{label}</small>
              <strong>{value}</strong>
            </div>
          ))}
        </div>
        {Number.isFinite(firstDay) && <small className="muted">{T.since(new Date(firstDay).toLocaleDateString("pt-BR"))}</small>}
      </section>

      <section className="subpanel">
        <h4>{T.medals}</h4>
        <div className="trainer-medals">
          {BOSSES.map((boss) => {
            const won = state.badges.includes(boss.badgeId);
            return (
              <button key={boss.id} type="button" className={`trainer-medal ${won ? "won" : ""}`} onClick={() => open({ kind: "bosses" })} title={won ? BADGE_NAMES[boss.badgeId] : T.medalLocked}>
                <span className="boss-trophy-icon">
                  <Icon name="bosses" size={28} />
                </span>
                <small>{won ? BADGE_NAMES[boss.badgeId] : "?"}</small>
              </button>
            );
          })}
        </div>
      </section>

      <section className="subpanel">
        <h4>{T.favorite}</h4>
        {fav ? (
          <div className="trainer-fav">
            <BugSprite speciesId={fav.speciesId} shiny={fav.shiny} size={72} className="bob" />
            <div>
              <strong>{getSpecies(fav.speciesId).name}</strong>
              <small className="muted">
                {UI.level} {fav.level}
                {state.trainer.favoriteUid ? "" : ` · ${T.favoriteAuto}`}
              </small>
              <div className="button-row wrap">
                <Button variant="purple" small onClick={() => setPicking((p) => !p)}>
                  {T.pickFavorite}
                </Button>
                {state.trainer.favoriteUid && (
                  <Button variant="dark" small onClick={() => store.update((s) => void setFavorite(s, null))}>
                    {T.autoFavorite}
                  </Button>
                )}
              </div>
            </div>
          </div>
        ) : (
          <p className="muted small">{T.noBugs}</p>
        )}
        {picking && (
          <div className="fav-picker">
            {bugs.map((bug) => (
              <button
                key={bug.uid}
                type="button"
                className={`fav-option ${bug.uid === favUid ? "active" : ""}`}
                title={`${getSpecies(bug.speciesId).name} ${UI.level} ${bug.level}`}
                onClick={() => {
                  store.update((s) => void setFavorite(s, bug.uid));
                  setPicking(false);
                }}
              >
                <BugSprite speciesId={bug.speciesId} shiny={bug.shiny} size={32} />
                <small>{bug.level}</small>
              </button>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

/** A colored square for a color option, or the headwear drawn on the trainer. */
function Swatch({ part, option }: { part: LookPart; option: string }) {
  if (part === "headwear") {
    const state = store.state;
    return <img className="pixel" src={trainerSpriteUrl("down", 0, { ...state.trainer.look, headwear: option })} width={24} height={33} alt="" />;
  }
  const [main, shade] = LOOK_COLORS[part]?.[option] ?? ["#888", "#555"];
  return <span className="swatch" style={{ background: `linear-gradient(135deg, ${main} 60%, ${shade} 60%)` }} />;
}

function LookTab() {
  const state = useGame();
  const { report } = useApp();
  return (
    <div className="look-editor">
      <p className="small muted">{T.lookIntro}</p>
      {LOOK_PARTS.map((part) => (
        <div key={part} className="look-row">
          <span className="field-label">{LOOK_PART_NAMES[part]}</span>
          <div className="look-options">
            {LOOK_OPTIONS[part].map((option) => {
              const openOption = isLookOptionOpen(state, part, option);
              const req = requirementOf(part, option);
              const name = part === "headwear" ? HEADWEAR_NAMES[option] : LOOK_OPTION_NAMES[option];
              return (
                <button
                  key={option}
                  type="button"
                  className={`look-option ${state.trainer.look[part] === option ? "active" : ""} ${openOption ? "" : "locked"}`}
                  title={openOption ? name : `${name}: ${REQUIREMENT_TEXT[req!]}`}
                  aria-label={openOption ? name : `${name} (${T.locked})`}
                  aria-pressed={state.trainer.look[part] === option}
                  onClick={() => report(store.run((s) => setLook(s, part, option)))}
                >
                  <Swatch part={part} option={option} />
                  {part === "headwear" && <small>{name}</small>}
                  {!openOption && <span className="look-lock" aria-hidden />}
                </button>
              );
            })}
          </div>
        </div>
      ))}
      <div className="button-row wrap">
        <Button
          variant="purple"
          small
          onClick={() =>
            store.update((s) => {
              for (const part of LOOK_PARTS) {
                const choices = LOOK_OPTIONS[part].filter((o) => isLookOptionOpen(s, part, o));
                s.trainer.look[part] = choices[Math.floor(Math.random() * choices.length)]!;
              }
            })
          }
        >
          {T.random}
        </Button>
        <Button variant="dark" small onClick={() => store.update((s) => void (s.trainer.look = defaultLook()))}>
          {T.reset}
        </Button>
      </div>
    </div>
  );
}

export function TrainerModal({ initialTab = "card" }: { initialTab?: "card" | "look" }) {
  const state = useGame();
  const { close } = useApp();
  const [tab, setTab] = useState<"card" | "look">(initialTab);
  const [facing, setFacing] = useState(0);
  const next = trainerXpToNext(state.trainer.level);
  return (
    <Modal title={T.title} onClose={close} wide>
      <div className="trainer-layout">
        <aside className="trainer-side">
          <TrainerPreview facing={FACINGS[facing]!} onTurn={() => setFacing((f) => (f + 1) % FACINGS.length)} />
          <label className="field">
            <span className="field-label">{T.name}</span>
            <input className="input" maxLength={20} value={state.trainer.name} onChange={(e) => store.update((s) => void (s.trainer.name = e.target.value))} />
          </label>
          <strong className="trainer-level">{T.level(state.trainer.level)}</strong>
          <Bar kind="xp" value={state.trainer.xp} max={next} label={`${formatNumber(state.trainer.xp)} / ${formatNumber(next)} xp`} />
        </aside>
        <div className="trainer-main">
          <div className="segmented small">
            {(["card", "look"] as const).map((t) => (
              <button key={t} type="button" className={tab === t ? "active" : ""} onClick={() => setTab(t)}>
                {T.tabs[t]}
              </button>
            ))}
          </div>
          {tab === "card" ? <CardTab /> : <LookTab />}
        </div>
      </div>
    </Modal>
  );
}
