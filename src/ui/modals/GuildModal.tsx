import { bestOwned, CHAMPIONS, evaluate, getChampion, getRaid, isRaidUnlocked, raidReward, RAIDS, raidProgress, recruit, startRaid, stopRaid, type RaidTraits } from "../../game/guild";
import { CHAMPION_TEXT, GUILD_UI as G, RAID_TEXT } from "../../i18n/guild.ptBR";
import { useApp } from "../appContext";
import { formatClock, formatDuration, formatNumber } from "../format";

const time = (ms: number) => (ms >= 3_600_000 ? formatDuration(ms) : formatClock(ms));
import { Bar, Button, Modal, Tag, Toggle } from "../components/primitives";
import { pixelArtUrl } from "../render/pixels";
import { store, useGame } from "../store";

const BIG = 1e11;

/** A tiny bar chart (sorting) or magnifier (search) icon, tinted per champion. */
function championIcon(id: string): string {
  const champion = getChampion(id);
  const colors = ["#e2574c", "#f2c14e", "#5fcf7a", "#5aa2ef", "#c477e8", "#ff9bd0", "#6fe0f0", "#ffd25a", "#9df2a8"];
  const color = colors[CHAMPIONS.indexOf(champion) % colors.length]!;
  const rows =
    champion.kind === "sort"
      ? ["............", "..........c.", "........c.c.", "........c.c.", "......c.c.c.", "......c.c.c.", "....c.c.c.c.", "....c.c.c.c.", "..c.c.c.c.c.", "..c.c.c.c.c.", "kkkkkkkkkkkk", "............"]
      : ["............", "...kkkk.....", "..kccccck...", ".kcwccccck..", ".kcwcccccck.", ".kccccccck..", "..kccccck...", "...kkkkkok..", ".......kook.", "........kook", ".........kk.", "............"];
  return pixelArtUrl(rows, { k: "#1f1424", c: color, w: "#ffffff", o: "#8a5a34" });
}

function traitTags(traits: RaidTraits) {
  return (Object.keys(traits) as (keyof RaidTraits)[]).filter((k) => traits[k]).map((k) => <Tag key={k} tone="blue">{G.traits[k]}</Tag>);
}

export function GuildModal() {
  const state = useGame();
  const { close, report } = useApp();
  const guild = state.guild;
  const running = guild.raid;

  return (
    <Modal title={G.title} onClose={close} wide>
      <p className="muted small">{G.intro}</p>

      {running && (
        <section className="subpanel guild-running">
          <strong>{G.running(RAID_TEXT[running.raidId]?.name ?? running.raidId)}</strong>
          <span className="small">
            {CHAMPION_TEXT[running.championId]?.name} · {time(running.durationMs * (1 - raidProgress(state)))}
          </span>
          <Bar kind="xp" value={raidProgress(state)} max={1} />
          <div className="button-row wrap">
            <Toggle checked={guild.autoRepeat} onChange={(v) => store.update((s) => void (s.guild.autoRepeat = v))} label={G.autoRepeat} />
            <Button small variant="danger" onClick={() => report(store.run(stopRaid))}>
              {G.stop}
            </Button>
          </div>
        </section>
      )}

      <section className="subpanel">
        <h4>{G.champions}</h4>
        <div className="champion-grid">
          {CHAMPIONS.map((c) => {
            const owned = guild.owned.includes(c.id);
            return (
              <div key={c.id} className={`champion-card ${owned ? "owned" : ""}`}>
                <div className="champion-head">
                  <img className="pixel" src={championIcon(c.id)} width={36} height={36} alt="" />
                  <strong>{CHAMPION_TEXT[c.id]?.name}</strong>
                </div>
                <p className="small muted">{CHAMPION_TEXT[c.id]?.description}</p>
                <div className="bigo-row">
                  <span>
                    {G.best} <code>{c.bigO[0]}</code>
                  </span>
                  <span>
                    {G.average} <code>{c.bigO[1]}</code>
                  </span>
                  <span>
                    {G.worst} <code>{c.bigO[2]}</code>
                  </span>
                  <span>
                    {G.memory} <code>{c.bigO[3]}</code>
                  </span>
                </div>
                {owned ? (
                  <Tag tone="green">{G.owned}</Tag>
                ) : (
                  <Button small variant="gold" disabled={state.coins < c.cost} onClick={() => report(store.run((s) => recruit(s, c.id)))}>
                    {G.recruit} · {formatNumber(c.cost)}
                  </Button>
                )}
              </div>
            );
          })}
        </div>
      </section>

      <section className="subpanel">
        <h4>{G.raids}</h4>
        <div className="raid-list">
          {RAIDS.map((raid) => {
            const unlocked = isRaidUnlocked(guild, raid.id);
            const suggestion = bestOwned(guild, raid.id);
            const def = getRaid(raid.id);
            return (
              <div key={raid.id} className={`raid-card ${unlocked ? "" : "locked"}`}>
                <div className="raid-head">
                  <strong>{RAID_TEXT[raid.id]?.name}</strong>
                  <Tag>{G.size(formatNumber(def.n))}</Tag>
                  {def.queries && def.queries > 1 && <Tag>{G.queries(formatNumber(def.queries))}</Tag>}
                  {traitTags(def.traits)}
                  <Tag tone="pink">{G.memoryLimit(def.memoryLimit >= BIG ? G.unlimited : formatNumber(def.memoryLimit))}</Tag>
                  <Tag tone="gold">{G.reward(formatNumber(raidReward(def.id)))}</Tag>
                  {(guild.clears[raid.id] ?? 0) === 0 ? <Tag tone="gold">{G.firstClear}</Tag> : <Tag tone="green">{G.clears(guild.clears[raid.id]!)}</Tag>}
                </div>
                <p className="small muted">{RAID_TEXT[raid.id]?.description}</p>
                {unlocked ? (
                  <div className="raid-options">
                    {guild.owned
                      .filter((id) => getChampion(id).kind === raid.kind)
                      .map((id) => {
                        const fit = evaluate(id, raid.id);
                        return (
                          <div key={id} className={`raid-option ${id === suggestion ? "suggested" : ""}`}>
                            <img className="pixel" src={championIcon(id)} width={24} height={24} alt="" />
                            <span className="small">{CHAMPION_TEXT[id]?.name}</span>
                            {fit.ok ? (
                              <>
                                <code className="small">{G.ops(formatNumber(fit.ops))}</code>
                                <span className="small">{time(fit.ms)}</span>
                                {id === suggestion && <Tag tone="green">{G.suggestion}</Tag>}
                                <Button small disabled={running !== null} onClick={() => report(store.run((s) => startRaid(s, raid.id, id)))}>
                                  {G.send}
                                </Button>
                              </>
                            ) : (
                              <span className="small bad-text">{G.reasons[fit.reason]}</span>
                            )}
                          </div>
                        );
                      })}
                  </div>
                ) : (
                  <p className="small muted">{G.locked}</p>
                )}
              </div>
            );
          })}
        </div>
      </section>
    </Modal>
  );
}
