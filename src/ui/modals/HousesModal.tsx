import { useState } from "react";
import { getSpecies } from "../../game/data/species";
import {
  assignToHouse,
  buildHouse,
  collectAll,
  collectHouse,
  getHouse,
  HOUSE_LOTS,
  HOUSE_TIERS,
  houseCoinRate,
  houseOf,
  isLotUnlocked,
  nextCost,
  removeFromHouse,
  storageCap,
  tierOf,
  upgradeHouse,
  type House,
} from "../../game/housing";
import { BADGE_NAMES, HOUSE_ERAS, UI } from "../../i18n/ptBR";
import { useApp } from "../appContext";
import { formatNumber } from "../format";
import { Bar, BugSprite, Button, Icon, Modal, Tag } from "../components/primitives";
import { eraUrl } from "../render/eras";
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

function HouseCard({ house }: { house: House }) {
  const state = useGame();
  const { report, toast } = useApp();
  const [picking, setPicking] = useState(false);
  const tier = tierOf(house);
  const era = HOUSE_ERAS[tier.id]!;
  const next = HOUSE_TIERS[house.tier + 1];
  const cost = nextCost(state, house.lot);
  const rate = houseCoinRate(state, house);
  const cap = storageCap(state, house);

  return (
    <div className="house-card">
      <div className="house-head">
        <img className="pixel era-art" src={eraUrl(house.tier)} width={96} height={72} alt="" />
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
            <Tag tone="blue">x{tier.multiplier}</Tag>
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
        <Button
          variant="gold"
          disabled={house.pending < 1}
          onClick={() => store.update((s) => toast(`+${formatNumber(collectHouse(s, house.lot))} moedas`))}
        >
          <Icon name="coin" size={14} /> {UI.houses.collect}
        </Button>
        {next && cost !== null ? (
          <Button disabled={state.coins < cost} onClick={() => report(store.run((s) => upgradeHouse(s, house.lot)))} title={UI.houses.nextEra(next.slots, next.multiplier)}>
            {UI.houses.upgrade(HOUSE_ERAS[next.id]!.name)} · {formatNumber(cost)}
          </Button>
        ) : (
          <Tag tone="green">{UI.houses.maxed}</Tag>
        )}
      </div>
    </div>
  );
}

export function HousesModal() {
  const state = useGame();
  const { close, report, toast } = useApp();
  const pending = state.houses.reduce((sum, h) => sum + Math.floor(h.pending), 0);
  return (
    <Modal
      title={UI.houses.title}
      onClose={close}
      wide
      headerExtra={
        <Button
          variant="gold"
          small
          disabled={pending < 1}
          onClick={() => store.update((s) => toast(`+${formatNumber(collectAll(s))} moedas`))}
        >
          {UI.houses.collectAll} ({formatNumber(pending)})
        </Button>
      }
    >
      <p className="muted small">{UI.houses.intro}</p>
      <div className="house-list">
        {HOUSE_LOTS.map((lot) => {
          const house = getHouse(state, lot.lot);
          if (house) return <HouseCard key={lot.lot} house={house} />;
          const unlocked = isLotUnlocked(state, lot.lot);
          const cost = nextCost(state, lot.lot) ?? 0;
          return (
            <div key={lot.lot} className={`house-card empty-lot ${unlocked ? "" : "locked"}`}>
              <img className="pixel era-art faded" src={eraUrl(0)} width={96} height={72} alt="" />
              <div className="house-info">
                <strong>{UI.houses.lot(lot.lot + 1)}</strong>
                <span className="muted small">{unlocked ? UI.houses.emptyLot : UI.houses.lockedLot(BADGE_NAMES[lot.requiredBadge ?? ""] ?? "")}</span>
              </div>
              {unlocked && (
                <Button variant="gold" disabled={state.coins < cost} onClick={() => report(store.run((s) => buildHouse(s, lot.lot)))}>
                  {UI.houses.build} · {formatNumber(cost)}
                </Button>
              )}
            </div>
          );
        })}
      </div>
    </Modal>
  );
}
