import { useState } from "react";
import { BOSSES } from "../../game/data/world";
import { challengeBoss, chooseStarter } from "../../game/engine";
import { canChallengeBoss, hasBadge } from "../../game/progression";
import { exportSave, SaveError } from "../../game/save";
import { STARTER_IDS } from "../../game/state";
import { getSpecies } from "../../game/data/species";
import { BADGE_NAMES, BOSS_TITLES, REGION_NAMES, SPECIES_DESCRIPTIONS, UI, ERROR_TEXT } from "../../i18n/ptBR";
import { useApp } from "../appContext";
import { LEARN_UI } from "../../i18n/learning.ptBR";
import { REVIEW_BONUS_PER_CORRECT } from "../../game/learning";
import { formatClock, formatDuration, formatNumber } from "../format";
import { BugSprite, Button, Icon, Modal, Tag, TypeTag } from "../components/primitives";
import { store, useGame } from "../store";

export function BossesModal() {
  const state = useGame();
  const { close, report, open } = useApp();
  const fighting = state.activity.kind === "boss" ? state.activity.bossId : null;
  return (
    <Modal title={UI.nav.bosses.toUpperCase()} onClose={close} wide>
      <div className="boss-list">
        {BOSSES.map((boss) => {
          const beaten = hasBadge(state, boss.badgeId);
          const available = canChallengeBoss(state, boss.id);
          return (
            <div key={boss.id} className={`boss-row ${available ? "" : "locked"}`}>
              <div className="boss-head">
                <span className={`boss-trophy ${beaten ? "won" : ""}`} title={beaten ? BADGE_NAMES[boss.badgeId] : undefined}>
                  <Icon name="bosses" size={32} />
                </span>
                <div>
                  <strong>{boss.name}</strong>
                  <div className="muted small">
                    {BOSS_TITLES[boss.id]} · {REGION_NAMES[boss.regionId]}
                  </div>
                </div>
                {beaten && <Tag tone="green">{BADGE_NAMES[boss.badgeId]}</Tag>}
              </div>
              <div className="boss-team">
                {boss.team.map((m, i) => (
                  <div key={i} className="boss-member">
                    <BugSprite speciesId={m.speciesId} size={36} silhouette={!available && !beaten} />
                    <small>
                      {UI.level} {m.level}
                    </small>
                  </div>
                ))}
              </div>
              <div className="boss-meta small">
                <span>
                  {UI.bosses.timeLimit}: {formatClock(boss.timeLimitMs)}
                </span>
                <span>
                  {UI.bosses.reward}: {formatNumber(boss.rewardCoins)}
                </span>
                <span>
                  {UI.bosses.cap}: {boss.levelCap}
                </span>
              </div>
              <div className="boss-review">
                <button type="button" className="btn btn-dark btn-small" onClick={() => open({ kind: "review", bossId: boss.id })}>
                  {LEARN_UI.study.reviewButton}
                </button>
                {(state.bossReview[boss.id] ?? 0) > 0 && (
                  <small className="ok-text">{LEARN_UI.study.reviewStored(Math.round((state.bossReview[boss.id] ?? 0) * REVIEW_BONUS_PER_CORRECT * 100))}</small>
                )}
              </div>
              {fighting === boss.id ? (
                <Tag tone="pink">{UI.bosses.fighting}</Tag>
              ) : available ? (
                <Button
                  variant="gold"
                  disabled={fighting !== null}
                  onClick={() => {
                    if (report(store.run((s) => challengeBoss(s, boss.id)))) close();
                  }}
                >
                  {UI.bosses.challenge}
                </Button>
              ) : (
                <span className="muted small">{UI.bosses.locked}</span>
              )}
            </div>
          );
        })}
      </div>
    </Modal>
  );
}

export function SaveModal() {
  const state = useGame();
  const { close, toast } = useApp();
  const [exported, setExported] = useState("");
  const [importText, setImportText] = useState("");
  const [confirmReset, setConfirmReset] = useState(false);

  const doImport = () => {
    try {
      store.importText(importText);
      toast(UI.save.imported);
      close();
    } catch (error) {
      toast(error instanceof SaveError ? `${ERROR_TEXT.invalidSave} (${error.message})` : ERROR_TEXT.invalidSave);
    }
  };

  return (
    <Modal title={UI.save.title} onClose={close}>
      <div className="form-col">
        <label className="field">
          <span className="field-label">{UI.save.name}</span>
          <input className="input" maxLength={20} value={state.trainer.name} onChange={(e) => store.update((s) => void (s.trainer.name = e.target.value))} />
        </label>
        <p className="muted small">
          {UI.save.playTime}: {formatDuration(state.totals.playTimeMs)} · {UI.save.totals(state.totals.defeats, state.totals.captures)}
        </p>
        <p className="small">{UI.save.autosave}</p>

        <div className="field">
          <span className="field-label">{UI.save.exportHint}</span>
          <div className="button-row">
            <Button onClick={() => setExported(exportSave(store.state))}>{UI.save.export}</Button>
            <Button
              variant="dark"
              disabled={!exported}
              onClick={() => {
                void navigator.clipboard?.writeText(exported).then(() => toast(UI.save.copied));
              }}
            >
              {UI.save.copy}
            </Button>
          </div>
          {exported && <textarea className="input code" readOnly rows={6} value={exported} onFocus={(e) => e.target.select()} />}
        </div>

        <div className="field">
          <span className="field-label">{UI.save.importHint}</span>
          <textarea className="input code" rows={4} value={importText} onChange={(e) => setImportText(e.target.value)} />
          <Button disabled={!importText.trim()} onClick={doImport}>
            {UI.save.import}
          </Button>
        </div>

        <Button
          variant="danger"
          onClick={() => {
            if (!confirmReset) return setConfirmReset(true);
            store.reset();
            close();
          }}
        >
          {confirmReset ? UI.save.resetConfirm : UI.save.reset}
        </Button>
      </div>
    </Modal>
  );
}

export function StarterModal() {
  const { report } = useApp();
  return (
    <div className="modal-backdrop">
      <div className="modal" role="dialog" aria-modal="true">
        <header className="modal-header">
          <h2>{UI.starter.title}</h2>
        </header>
        <div className="modal-body">
          <p className="muted">{UI.starter.subtitle}</p>
          <div className="starter-grid">
            {STARTER_IDS.map((id) => {
              const species = getSpecies(id);
              return (
                <div key={id} className="starter-card">
                  <BugSprite speciesId={id} size={96} className="bob" />
                  <strong>{species.name}</strong>
                  <div className="tag-row center">
                    {species.types.map((t) => (
                      <TypeTag key={t} type={t} />
                    ))}
                  </div>
                  <p className="small muted">{SPECIES_DESCRIPTIONS[id]}</p>
                  <Button variant="gold" onClick={() => report(store.run((s, rng) => chooseStarter(s, id, rng)))}>
                    {UI.starter.pick}
                  </Button>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
