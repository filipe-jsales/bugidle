import { ACHIEVEMENTS, achievementProgress, isUnlocked, type AchievementGroup } from "../../game/achievements";
import { ACHIEVEMENT_GROUPS, ACHIEVEMENT_TEXT, ACHIEVEMENTS_UI } from "../../i18n/achievements.ptBR";
import { useApp } from "../appContext";
import { formatNumber } from "../format";
import { Bar, Icon, Modal, Tag } from "../components/primitives";
import { useGame } from "../store";

const GROUPS: AchievementGroup[] = ["collection", "battle", "growth", "world"];

export function AchievementsModal() {
  const state = useGame();
  const { close } = useApp();
  const done = ACHIEVEMENTS.filter((a) => isUnlocked(state, a.id)).length;
  return (
    <Modal title={ACHIEVEMENTS_UI.title} onClose={close} wide headerExtra={<Tag tone="gold">{ACHIEVEMENTS_UI.unlocked(done, ACHIEVEMENTS.length)}</Tag>}>
      <p className="muted small">{ACHIEVEMENTS_UI.intro}</p>
      {GROUPS.map((group) => (
        <section key={group} className="subpanel">
          <h4>{ACHIEVEMENT_GROUPS[group]}</h4>
          <div className="achievement-grid">
            {ACHIEVEMENTS.filter((a) => a.group === group).map((a) => {
              const unlocked = isUnlocked(state, a.id);
              const { value } = achievementProgress(state, a);
              const text = ACHIEVEMENT_TEXT[a.id]!;
              return (
                <div key={a.id} className={`achievement-card ${unlocked ? "unlocked" : ""}`}>
                  <span className="achievement-medal">
                    <Icon name="medal" size={28} />
                  </span>
                  <div className="achievement-info">
                    <strong>{text.name}</strong>
                    <small className="muted">{text.description}</small>
                    {unlocked ? (
                      <Tag tone="green">{ACHIEVEMENTS_UI.done}</Tag>
                    ) : (
                      <Bar kind="xp" value={value} max={a.goal} label={`${formatNumber(value)} / ${formatNumber(a.goal)}`} />
                    )}
                  </div>
                  <Tag tone="gold">{ACHIEVEMENTS_UI.reward(formatNumber(a.reward))}</Tag>
                </div>
              );
            })}
          </div>
        </section>
      ))}
    </Modal>
  );
}
