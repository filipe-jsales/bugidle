import { useState } from "react";
import { getSpecies } from "../../game/data/species";
import {
  assignToHouse,
  buildHouse,
  collectAll,
  collectHouse,
  eraOf,
  getHouse,
  HOUSE_LOTS,
  HOUSE_TIERS,
  houseCoinRate,
  houseOf,
  houseXpRate,
  isLotUnlocked,
  nextCost,
  removeFromHouse,
  storageCap,
  tierOf,
  upgradeHouse,
  type House,
  type HouseLot,
} from "../../game/housing";
import { HOUSE_CATEGORY_TEXT, HOUSES_UI } from "../../i18n/houses.ptBR";
import { BADGE_NAMES, UI } from "../../i18n/ptBR";
import { useApp } from "../appContext";
import { formatNumber } from "../format";
import { Bar, BugSprite, Button, Icon, Modal, Tag } from "../components/primitives";
import { houseArtUrl } from "../render/houseArt";
import { store, useGame } from "../store";

function BugPicker({ lot, onDone }: { lot: number; onDone: () => void }) {
  const state = useGame();
  const { report } = useApp();
  const free = Object.values(state.bugs)
    .filter((b) => !state.team.includes(b.uid) && !houseOf(state, b.uid))
    .sort((a, b) => b.level - a.level);
  if (free.length === 0) return <p className="muted small">{UI.houses.noBoxBugs}</p>;
  return (
    <div className="house-picker">
      <p className="small">{UI.houses.addBug}</p>
      <div className="house-picker-grid">
        {free.map((bug) => (
          <button
            key={bug.uid}
            type="button"
            className="box-cell"
            onClick={() => {
              if (report(store.run((s) => assignToHouse(s, lot, bug.uid)))) onDone();
            }}
          >
            <BugSprite speciesId={bug.speciesId} shiny={bug.shiny} size={36} />
            <span className="box-cell-level">
              {UI.level} {bug.level}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}

function Perks({ def }: { def: HouseLot }) {
  const P = HOUSES_UI.perks;
  return (
    <div className="house-perks">
      {def.coinMult !== 1 && <Tag tone={def.coinMult > 1 ? "gold" : "dark"}>{P.coins(def.coinMult)}</Tag>}
      {def.xpMult !== 1 && <Tag tone={def.xpMult > 1 ? "blue" : "dark"}>{P.xp(def.xpMult)}</Tag>}
      {def.storageMult !== 1 && <Tag tone="green">{P.storage(def.storageMult)}</Tag>}
    </div>
  );
}

function HouseCard({ house, def }: { house: House; def: HouseLot }) {
  const state = useGame();
  const { report, toast } = useApp();
  const [picking, setPicking] = useState(false);
  const text = HOUSE_CATEGORY_TEXT[def.category];
  const tier = tierOf(house);
  const era = text.eras[eraOf(house)]!;
  const nextEra = def.eras[house.tier + 1];
  const next = HOUSE_TIERS[house.tier + 1];
  const cost = nextCost(state, house.lot);
  const rate = houseCoinRate(state, house);
  const cap = storageCap(state, house);

  return (
    <div className="house-card">
      <div className="house-head">
        <img className="pixel era-art" src={houseArtUrl(def.category, house.tier)} width={96} height={72} alt="" />
        <div className="house-info">
          <div className="tag-row">
            <strong>{era.name}</strong>
            <Tag tone="gold">{era.year}</Tag>
            <Tag>
              {house.bugs.length}/{tier.slots} {UI.houses.slots}
            </Tag>
          </div>
          <p className="muted small">{era.description}</p>
          <div className="tag-row">
            <Tag tone="green">
              {formatNumber(rate)} {UI.houses.perMinute}
            </Tag>
            <Tag tone="blue">
              {formatNumber(houseXpRate(state, house))} {HOUSES_UI.xpPerMinute}
            </Tag>
            <Tag>{HOUSES_UI.production(tier.multiplier)}</Tag>
          </div>
        </div>
      </div>

      <div className="house-slots">
        {Array.from({ length: tier.slots }, (_, i) => {
          const uid = house.bugs[i];
          const bug = uid ? state.bugs[uid] : undefined;
          return bug ? (
            <button key={uid} type="button" className="house-slot filled" title={UI.houses.remove} onClick={() => report(store.run((s) => removeFromHouse(s, bug.uid)))}>
              <BugSprite speciesId={bug.speciesId} shiny={bug.shiny} size={40} className="bob slow" />
              <small>
                {getSpecies(bug.speciesId).name} {bug.level}
              </small>
            </button>
          ) : (
            <button key={`empty-${i}`} type="button" className="house-slot empty" onClick={() => setPicking((p) => !p)}>
              +
            </button>
          );
        })}
      </div>
      {picking && <BugPicker lot={house.lot} onDone={() => setPicking(false)} />}

      <div className="house-storage">
        <span className="small">
          {UI.houses.stored}: {formatNumber(house.pending)} / {formatNumber(cap)}
        </span>
        <Bar kind="xp" value={house.pending} max={Math.max(1, cap)} />
      </div>
      <div className="button-row wrap">
        <Button variant="gold" disabled={house.pending < 1} onClick={() => store.update((s) => toast(`+${formatNumber(collectHouse(s, house.lot))} moedas`))}>
          <Icon name="coin" size={14} /> {UI.houses.collect}
        </Button>
        {next && nextEra && cost !== null ? (
          <Button disabled={state.coins < cost} onClick={() => report(store.run((s) => upgradeHouse(s, house.lot)))} title={UI.houses.nextEra(next.slots, next.multiplier)}>
            {UI.houses.upgrade(text.eras[nextEra]!.name)} · {formatNumber(cost)}
          </Button>
        ) : (
          <Tag tone="green">{UI.houses.maxed}</Tag>
        )}
      </div>
    </div>
  );
}

/** Every milestone of the category, oldest first, always explained; future ones are greyed out. */
function Timeline({ def, reached }: { def: HouseLot; reached: number }) {
  const text = HOUSE_CATEGORY_TEXT[def.category];
  return (
    <section className="subpanel">
      <h4>{HOUSES_UI.timeline}</h4>
      <p className="muted small">{HOUSES_UI.timelineHint}</p>
      <ol className="era-timeline">
        {def.eras.map((id, i) => {
          const era = text.eras[id]!;
          const status = i < reached ? "reached" : i === reached ? "current" : i === reached + 1 ? "next" : "locked";
          return (
            <li key={id} className={`era-step ${status}`}>
              <img className="pixel era-art" src={houseArtUrl(def.category, i)} width={64} height={48} alt="" />
              <div>
                <div className="era-step-title">
                  <strong>{era.name}</strong>
                  <Tag tone="gold">{era.year}</Tag>
                  {status === "current" && <Tag tone="green">{HOUSES_UI.current}</Tag>}
                  {status === "next" && <Tag tone="pink">{HOUSES_UI.next}</Tag>}
                </div>
                <p className="small muted">{era.description}</p>
              </div>
              <Tag tone={status === "locked" ? "dark" : "blue"}>{HOUSES_UI.production(HOUSE_TIERS[i]!.multiplier)}</Tag>
            </li>
          );
        })}
      </ol>
    </section>
  );
}

function EmptyLot({ def }: { def: HouseLot }) {
  const state = useGame();
  const { report } = useApp();
  const unlocked = isLotUnlocked(state, def.lot);
  const cost = nextCost(state, def.lot) ?? 0;
  return (
    <div className={`house-card empty-lot ${unlocked ? "" : "locked"}`}>
      <img className="pixel era-art faded" src={houseArtUrl(def.category, 0)} width={96} height={72} alt="" />
      <div className="house-info">
        <strong>{UI.houses.emptyLot}</strong>
        <span className="muted small">{unlocked ? HOUSE_CATEGORY_TEXT[def.category].short : UI.houses.lockedLot(BADGE_NAMES[def.requiredBadge ?? ""] ?? "")}</span>
      </div>
      {unlocked && (
        <Button variant="gold" disabled={state.coins < cost} onClick={() => report(store.run((s) => buildHouse(s, def.lot)))}>
          {UI.houses.build} · {formatNumber(cost)}
        </Button>
      )}
    </div>
  );
}

export function HousesModal() {
  const state = useGame();
  const { close, toast } = useApp();
  const [lot, setLot] = useState(0);
  const pending = state.houses.reduce((sum, h) => sum + Math.floor(h.pending), 0);
  const def = HOUSE_LOTS.find((l) => l.lot === lot) ?? HOUSE_LOTS[0]!;
  const house = getHouse(state, def.lot);
  const text = HOUSE_CATEGORY_TEXT[def.category];

  return (
    <Modal
      title={UI.houses.title}
      onClose={close}
      wide
      headerExtra={
        <Button variant="gold" small disabled={pending < 1} onClick={() => store.update((s) => toast(`+${formatNumber(collectAll(s))} moedas`))}>
          {UI.houses.collectAll} ({formatNumber(pending)})
        </Button>
      }
    >
      <p className="muted small">{UI.houses.intro}</p>
      <div className="house-tabs" role="tablist">
        {HOUSE_LOTS.map((l) => {
          const built = getHouse(state, l.lot);
          const unlocked = isLotUnlocked(state, l.lot);
          return (
            <button
              key={l.lot}
              type="button"
              role="tab"
              aria-selected={l.lot === def.lot}
              className={`house-tab ${l.lot === def.lot ? "active" : ""} ${unlocked ? "" : "locked"}`}
              onClick={() => setLot(l.lot)}
              title={unlocked ? HOUSE_CATEGORY_TEXT[l.category].short : HOUSES_UI.tabLocked(BADGE_NAMES[l.requiredBadge ?? ""] ?? "")}
            >
              <img className="pixel era-art" src={houseArtUrl(l.category, built?.tier ?? 0)} width={24} height={18} alt="" />
              {HOUSE_CATEGORY_TEXT[l.category].name}
              {built && <small>{built.tier + 1}/7</small>}
            </button>
          );
        })}
      </div>

      <section className="subpanel">
        <div className="house-category-head">
          <div>
            <h4>{text.name.toUpperCase()}</h4>
            <p className="small">{text.intro}</p>
          </div>
        </div>
        <Perks def={def} />
      </section>

      {house ? <HouseCard house={house} def={def} /> : <EmptyLot def={def} />}
      <Timeline def={def} reached={house ? house.tier : -1} />
    </Modal>
  );
}
