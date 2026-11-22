import { getSpecies } from "../game/data/species";
import { getBoss } from "../game/data/world";
import type { GameEvent } from "../game/engine";
import type { GameState } from "../game/state";
import { BADGE_NAMES, ITEM_TEXT, ROUTE_NAMES } from "../i18n/ptBR";

export type LogTone = "info" | "good" | "bad" | "rare";

export interface LogLine {
  id: number;
  time: string;
  text: string;
  tone: LogTone;
}

const speciesName = (id: string) => getSpecies(id).name;

function bugName(state: GameState, uid: string): string {
  const bug = state.bugs[uid];
  return bug ? speciesName(bug.speciesId) : "Bug";
}

/** Turns an engine event into a log line, or null for events too frequent to log. */
export function describeEvent(event: GameEvent, state: GameState): { text: string; tone: LogTone } | null {
  switch (event.type) {
    case "encounter":
      return event.shiny ? { text: `Um ${speciesName(event.speciesId)} SHINY apareceu!`, tone: "rare" } : null;
    case "bossStart":
      return { text: `Batalha contra ${getBoss(event.bossId).name} começou!`, tone: "info" };
    case "rewards":
      return {
        text: `${speciesName(event.speciesId)} derrotado! +${event.xp} xp bug, +${event.benchXp} xp equipe, +${event.trainerXp} xp caçador${event.coins ? `, +${event.coins} moedas` : ""}`,
        tone: "info",
      };
    case "captureAttempt":
      return event.success ? null : { text: `${ITEM_TEXT[event.itemId].name} falhou em ${speciesName(event.speciesId)}.`, tone: "info" };
    case "captured":
      return {
        text: `${speciesName(event.speciesId)}${event.shiny ? " SHINY" : ""} capturado${event.newEntry ? " (novo na Bugdex)" : ""}${event.destination === "box" ? ", enviado ao Box" : ""}!`,
        tone: event.shiny ? "rare" : "good",
      };
    case "outOfTraps":
      return { text: "Sem armadilhas! Compre mais na Loja.", tone: "bad" };
    case "levelUp":
      return { text: `${bugName(state, event.uid)} subiu para o nível ${event.level}!`, tone: "good" };
    case "evolved":
      return { text: `${speciesName(event.from)} evoluiu para ${speciesName(event.to)}!`, tone: "rare" };
    case "hatched":
      return { text: `Um ovo chocou: ${speciesName(event.speciesId)}${event.shiny ? " SHINY" : ""}!`, tone: event.shiny ? "rare" : "good" };
    case "stoneDrop":
      return null;
    case "itemDrop":
      return { text: `Encontrou ${ITEM_TEXT[event.itemId].name}!`, tone: "good" };
    case "potionUsed":
      return { text: `${bugName(state, event.uid)} usou ${ITEM_TEXT[event.itemId].name}.`, tone: "info" };
    case "routeUnlocked":
      return { text: `Nova rota liberada: ${ROUTE_NAMES[event.routeId] ?? event.routeId}!`, tone: "rare" };
    case "badge":
      return { text: `Você ganhou o ${BADGE_NAMES[event.badgeId] ?? event.badgeId}! +${event.coins} moedas`, tone: "rare" };
    case "bossFailed":
      return { text: event.outcome === "timeout" ? "O tempo acabou. Tente o chefe de novo." : "O chefe venceu desta vez.", tone: "bad" };
    case "teamWiped":
      return { text: "Sua equipe caiu. Reiniciando...", tone: "bad" };
    case "recovered":
      return { text: "Equipe reiniciada com HP cheio.", tone: "info" };
    case "trainerLevelUp":
      return { text: `Você chegou ao nível ${event.level} de caçador!`, tone: "good" };
    case "faint":
      return event.side === "player" ? { text: `${bugName(state, event.uid)} caiu!`, tone: "bad" } : null;
    case "disobey":
      return { text: `${bugName(state, event.uid)} ignorou a ordem (acima do limite de nível).`, tone: "bad" };
    case "attack":
    case "switch":
    case "outcome":
      return null;
  }
}

export function formatNumber(value: number): string {
  return Math.floor(value).toLocaleString("pt-BR");
}

export function formatDuration(ms: number): string {
  const total = Math.floor(ms / 1000);
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  return h > 0 ? `${h}h ${m}min` : `${m}min ${s}s`;
}

export function formatClock(ms: number): string {
  const total = Math.max(0, Math.ceil(ms / 1000));
  return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, "0")}`;
}
