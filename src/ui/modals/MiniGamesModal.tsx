import { useState, type ComponentType } from "react";
import { dayNumber } from "../../game/learning";
import { bestScore, GAME_IDS, paidPlaysLeft, type GameId } from "../../game/minigames";
import type { ItemId } from "../../game/data/items";
import { GAME_TEXT, GAMES_UI } from "../../i18n/games.ptBR";
import { MINIGAMES_UI } from "../../i18n/minigames.ptBR";
import { useApp } from "../appContext";
import { Button, Icon, ItemIcon, Modal, Tag } from "../components/primitives";
import { conceptIconUrl } from "../render/icons";
import { DetectiveGame } from "../minigames/DetectiveGame";
import { BinaryGame, LanguageGame, OutputGame, TrueFalseGame, TypingGame } from "../minigames/CodeGames";
import { GatesGame, PipesGame, PixelGame, RobotGame } from "../minigames/MachineGames";
import { AnagramGame, CrosswordGame, HangmanGame, MemoryGame, WordSearchGame } from "../minigames/WordGames";
import type { GameProps } from "../minigames/shared";
import { useGame } from "../store";

type Art = { item: ItemId } | { concept: string } | { icon: "minigames" };

const GAMES: Record<GameId, { art: Art; component: ComponentType<GameProps> }> = {
  detective: { art: { icon: "minigames" }, component: DetectiveGame },
  wordSearch: { art: { item: "codeReview" }, component: WordSearchGame },
  crossword: { art: { item: "docs" }, component: CrosswordGame },
  hangman: { art: { concept: "bug" }, component: HangmanGame },
  anagram: { art: { item: "logpoint" }, component: AnagramGame },
  memory: { art: { item: "cacheCard" }, component: MemoryGame },
  language: { art: { concept: "python" }, component: LanguageGame },
  output: { art: { concept: "terminal" }, component: OutputGame },
  binary: { art: { concept: "binary" }, component: BinaryGame },
  pixel: { art: { concept: "css" }, component: PixelGame },
  robot: { art: { concept: "algorithm" }, component: RobotGame },
  gates: { art: { concept: "cpu" }, component: GatesGame },
  trueFalse: { art: { item: "conditionalBreak" }, component: TrueFalseGame },
  typing: { art: { item: "linter" }, component: TypingGame },
  pipes: { art: { concept: "api" }, component: PipesGame },
};

function GameArt({ art, size }: { art: Art; size: number }) {
  if ("item" in art) return <ItemIcon id={art.item} size={size} />;
  if ("concept" in art) return <img className="pixel" src={conceptIconUrl(art.concept)} width={size} height={size} alt="" />;
  return <Icon name={art.icon} size={size} />;
}

function Ranking() {
  const state = useGame();
  const today = dayNumber(new Date());
  return (
    <div className="ranking">
      <p className="muted small">{GAMES_UI.rankingIntro}</p>
      {GAME_IDS.map((id) => {
        const ranking = state.minigames.games[id]?.ranking ?? [];
        return (
          <section key={id} className="ranking-game">
            <h5>
              <GameArt art={GAMES[id].art} size={18} /> {GAME_TEXT[id].name}
            </h5>
            {ranking.length === 0 ? (
              <small className="muted">{GAMES_UI.rankingEmpty}</small>
            ) : (
              <ol>
                {ranking.map((entry, i) => (
                  <li key={i} className={i === 0 ? "first" : ""}>
                    <strong>{entry.score}</strong>
                    <small className="muted">{GAMES_UI.rankDay(today - entry.day)}</small>
                  </li>
                ))}
              </ol>
            )}
          </section>
        );
      })}
    </div>
  );
}

export function MiniGamesModal() {
  const state = useGame();
  const { close } = useApp();
  const [game, setGame] = useState<GameId | null>(null);
  const [tab, setTab] = useState<"games" | "ranking">("games");
  const [round, setRound] = useState(0);
  const today = dayNumber(new Date());
  const Game = game ? GAMES[game].component : null;

  return (
    <Modal title={MINIGAMES_UI.title} onClose={close} wide>
      {Game && game ? (
        <>
          <Button variant="dark" small className="games-back" onClick={() => setGame(null)}>
            {GAMES_UI.back}
          </Button>
          <Game key={`${game}-${round}`} onExit={() => setGame(null)} />
        </>
      ) : (
        <>
          <div className="segmented small games-tabs">
            {(["games", "ranking"] as const).map((t) => (
              <button key={t} type="button" className={tab === t ? "active" : ""} onClick={() => setTab(t)}>
                {GAMES_UI.tabs[t]}
              </button>
            ))}
          </div>
          {tab === "ranking" ? (
            <Ranking />
          ) : (
            <div className="games-grid">
              {GAME_IDS.map((id) => (
                <button
                  key={id}
                  type="button"
                  className="game-card"
                  onClick={() => {
                    setGame(id);
                    setRound((r) => r + 1);
                  }}
                >
                  <span className="game-card-art">
                    <GameArt art={GAMES[id].art} size={36} />
                  </span>
                  <strong>{GAME_TEXT[id].name}</strong>
                  <small className="muted">{GAME_TEXT[id].short}</small>
                  <span className="tag-row">
                    <Tag tone="gold">{GAMES_UI.best(bestScore(state, id))}</Tag>
                    {id !== "detective" && <Tag tone={paidPlaysLeft(state, id, today) > 0 ? "green" : "dark"}>{GAMES_UI.paidLeft(paidPlaysLeft(state, id, today))}</Tag>}
                  </span>
                </button>
              ))}
            </div>
          )}
        </>
      )}
    </Modal>
  );
}
