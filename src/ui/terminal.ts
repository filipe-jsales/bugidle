/**
 * Optional terminal: a tiny shell over the same commands the buttons use.
 * `runCommand` parses one line and returns the lines to print. Pure apart from
 * mutating the game state through the engine's own commands.
 */
import { activeEnemy } from "../game/battle";
import { isCaught } from "../game/bugdex";
import { setLead } from "../game/collection";
import { isItemId, ITEMS, type ItemId } from "../game/data/items";
import { lessonFor } from "../game/data/lessons";
import { getSpecies, SPECIES, type SpeciesDef } from "../game/data/species";
import { getRoute, ROUTES } from "../game/data/world";
import { returnToHunt, selectRoute, visitRebootCenter } from "../game/engine";
import { getRaid, RAIDS, startRaid } from "../game/guild";
import { incubateEgg } from "../game/hatchery";
import { collectAll } from "../game/housing";
import { buyItem, useItemOnBug } from "../game/inventory";
import { levelCap } from "../game/progression";
import type { ActionResult } from "../game/result";
import { ruleAsCode } from "../game/rules";
import { teamBugs, type CaptureMode, type GameState } from "../game/state";
import { BUG_TYPES } from "../game/types";
import { COMMAND_HELP, T } from "../i18n/terminal.ptBR";
import { ERROR_TEXT, ITEM_TEXT, ROUTE_NAMES, SPECIES_DESCRIPTIONS, CAPTURE_MODE_NAMES } from "../i18n/ptBR";
import { LESSON_WHY } from "../i18n/learning.ptBR";
import { CHAMPION_TEXT, RAID_TEXT } from "../i18n/guild.ptBR";

export const COMMANDS = Object.keys(COMMAND_HELP);

export interface CommandOutput {
  lines: string[];
  /** The screen should be cleared before printing. */
  clear?: boolean;
}

export interface TerminalContext {
  history: readonly string[];
  now: Date;
}

const CATCH_MODES: Record<string, CaptureMode> = { off: "off", all: "all", new: "uncaught", shiny: "shiny" };

export function promptPath(state: GameState): string {
  const routeId = state.activity.kind === "route" ? state.activity.routeId : state.activity.returnRouteId;
  return `/${getRoute(routeId).regionId}/${routeId}`;
}

function findSpecies(name: string): SpeciesDef | undefined {
  const n = name.toLowerCase();
  return SPECIES.find((s) => s.id === n || s.name.toLowerCase() === n);
}

function findItem(name: string): ItemId | undefined {
  const n = name.toLowerCase();
  if (isItemId(n)) return n;
  return (Object.keys(ITEMS) as ItemId[]).find((id) => id.toLowerCase() === n || ITEM_TEXT[id].name.toLowerCase() === n);
}

function result(r: ActionResult, ok: string): string[] {
  return [r.ok ? ok : ERROR_TEXT[r.reason]];
}

function list(state: GameState, what: string): string[] {
  switch (what) {
    case "team":
      return teamBugs(state).map((b, i) => `${i + 1}  ${getSpecies(b.speciesId).name.padEnd(13)} Nv ${String(b.level).padStart(3)}  HP ${b.currentHp}`);
    case "box": {
      const box = Object.values(state.bugs).filter((b) => !state.team.includes(b.uid));
      return box.length ? box.map((b) => `${getSpecies(b.speciesId).name.padEnd(13)} Nv ${b.level}`) : [T.empty];
    }
    case "items": {
      const owned = (Object.keys(state.inventory) as ItemId[]).filter((id) => (state.inventory[id] ?? 0) > 0);
      return owned.length ? owned.map((id) => `${id.padEnd(12)} x${state.inventory[id]}`) : [T.empty];
    }
    case "routes":
      return ROUTES.map((r) => `${state.unlockedRoutes.includes(r.id) ? " " : "#"} ${r.id.padEnd(17)} ${ROUTE_NAMES[r.id]} (Nv ${r.minLevel}-${r.maxLevel})`);
    case "stones":
      return BUG_TYPES.map((t) => `${t.padEnd(12)} ${state.stones[t] ?? 0}`);
    case "raids":
      return RAIDS.map((r) => `${r.id.padEnd(14)} ${RAID_TEXT[r.id]?.name ?? ""}`);
    default:
      return [T.usage("ls")];
  }
}

export function runCommand(state: GameState, input: string, ctx: TerminalContext): CommandOutput {
  const [cmd = "", ...args] = input.trim().split(/\s+/);
  const arg = args[0] ?? "";
  switch (cmd) {
    case "":
      return { lines: [] };
    case "help":
      return { lines: arg ? [COMMAND_HELP[arg] ?? T.unknown(arg)] : Object.values(COMMAND_HELP) };
    case "clear":
      return { lines: [], clear: true };
    case "whoami":
      return { lines: [T.whoami(state.trainer.name, state.trainer.level)] };
    case "pwd":
      return { lines: [promptPath(state)] };
    case "date":
      return { lines: [ctx.now.toLocaleString("pt-BR")] };
    case "echo":
      return { lines: [args.join(" ")] };
    case "history":
      return { lines: ctx.history.map((h, i) => `${String(i + 1).padStart(4)}  ${h}`) };
    case "status": {
      const battle = state.runtime.battle;
      const enemy = battle && !battle.outcome ? activeEnemy(battle) : undefined;
      const fight = state.runtime.recoveryMs > 0 ? T.rebooting : state.runtime.atCenter ? T.atCenter : enemy ? T.fighting(getSpecies(enemy.speciesId).name, enemy.level) : T.searching;
      return { lines: T.status(promptPath(state), state.coins.toLocaleString("pt-BR"), state.team.length, levelCap(state), fight) };
    }
    case "ls":
      return { lines: list(state, arg || "team") };
    case "cd": {
      if (!arg) return { lines: [promptPath(state)] };
      const routeId = arg.split("/").filter(Boolean).pop() ?? "";
      if (!ROUTES.some((r) => r.id === routeId)) return { lines: [T.notFound(arg)] };
      if (!state.unlockedRoutes.includes(routeId)) return { lines: [T.locked(routeId)] };
      return { lines: result(selectRoute(state, routeId), T.moved(promptPath(state))) };
    }
    case "man":
    case "dex": {
      const species = findSpecies(arg);
      if (!species) return { lines: [arg ? T.notFound(arg) : T.usage(cmd)] };
      if (cmd === "dex") return { lines: [`#${species.dex} ${species.name}`, SPECIES_DESCRIPTIONS[species.id] ?? ""] };
      const lesson = lessonFor(species.id);
      if (!lesson || !isCaught(state, species.id)) return { lines: [T.lockedFix] };
      return {
        lines: [
          T.manHeader(species.name),
          ...lesson.lines.map((l, i) => `${i === lesson.badLine ? "-" : " "} ${i + 1} | ${l}`),
          `+   | ${lesson.fix}`,
          "",
          LESSON_WHY[species.id] ?? "",
        ],
      };
    }
    case "catch": {
      const mode = CATCH_MODES[arg];
      if (!mode) return { lines: [T.usage("catch")] };
      state.settings.captureMode = mode;
      return { lines: [T.catchSet(CAPTURE_MODE_NAMES[mode])] };
    }
    case "trap": {
      const item = findItem(arg);
      if (!item || ITEMS[item].category !== "trap") return { lines: [T.usage("trap")] };
      state.settings.preferredTrap = item;
      return { lines: [T.trapSet(ITEM_TEXT[item].name)] };
    }
    case "buy": {
      const item = findItem(arg);
      const qty = args[1] ? Number(args[1]) : 1;
      if (!item) return { lines: [T.usage("buy")] };
      return { lines: result(buyItem(state, item, qty), T.bought(qty, ITEM_TEXT[item].name)) };
    }
    case "use": {
      const item = findItem(arg);
      const bug = teamBugs(state)[Number(args[1]) - 1];
      if (!item || !bug) return { lines: [T.usage("use")] };
      return { lines: result(useItemOnBug(state, item, bug.uid), T.used(ITEM_TEXT[item].name, getSpecies(bug.speciesId).name)) };
    }
    case "lead": {
      const bug = teamBugs(state)[Number(arg) - 1];
      if (!bug) return { lines: [T.usage("lead")] };
      return { lines: result(setLead(state, bug.uid), T.lead(getSpecies(bug.speciesId).name)) };
    }
    case "reboot":
      return { lines: result(visitRebootCenter(state), T.ok) };
    case "hunt":
      return { lines: result(returnToHunt(state), T.ok) };
    case "egg":
      return { lines: result(incubateEgg(state), T.eggIn) };
    case "collect":
      return { lines: [T.collected(collectAll(state).toLocaleString("pt-BR"))] };
    case "rules":
      if (arg === "on" || arg === "off") {
        state.settings.useRules = arg === "on";
        return { lines: [arg === "on" ? T.rulesOn : T.rulesOff] };
      }
      return { lines: [T.rulesHeader(state.settings.useRules), ...state.rules.filter((r) => r.enabled).map(ruleAsCode)] };
    case "raid": {
      const raid = RAIDS.find((r) => r.id === arg);
      const champion = args[1];
      if (!raid || !champion) return { lines: [T.usage("raid"), ...list(state, "raids")] };
      return { lines: result(startRaid(state, raid.id, champion), T.raidSent(RAID_TEXT[getRaid(raid.id).id]?.name ?? raid.id, CHAMPION_TEXT[champion]?.name ?? champion)) };
    }
    case "sudo":
      return { lines: [T.sudo] };
    case "rm":
      return { lines: [T.rmrf] };
    default:
      return { lines: [T.unknown(cmd)] };
  }
}

/** Tab completion: commands first, then route, item, species, raid and champion ids. */
export function complete(state: GameState, input: string): string {
  const parts = input.split(" ");
  const last = parts[parts.length - 1] ?? "";
  const pool =
    parts.length === 1
      ? COMMANDS
      : [
          ...state.unlockedRoutes,
          ...(Object.keys(ITEMS) as string[]),
          ...SPECIES.map((s) => s.id),
          ...RAIDS.map((r) => r.id),
          ...state.guild.owned,
          "team",
          "box",
          "items",
          "routes",
          "stones",
          "raids",
          "on",
          "off",
          ...Object.keys(CATCH_MODES),
        ];
  const matches = pool.filter((p) => p.startsWith(last.toLowerCase()));
  if (matches.length !== 1) return input;
  parts[parts.length - 1] = matches[0]!;
  return parts.join(" ") + " ";
}
