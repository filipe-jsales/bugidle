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
import { COMMAND_HELP, FILTER_HELP, T } from "../i18n/terminal.ptBR";
import { ERROR_TEXT, ITEM_TEXT, ROUTE_NAMES, SPECIES_DESCRIPTIONS, CAPTURE_MODE_NAMES } from "../i18n/ptBR";
import { LESSON_WHY } from "../i18n/learning.ptBR";
import { CHAMPION_TEXT, RAID_TEXT } from "../i18n/guild.ptBR";

export const COMMANDS = [...Object.keys(COMMAND_HELP), ...Object.keys(FILTER_HELP)];

/** Badges needed for each terminal feature: pipes and grep, then text tools, then scripts. */
export const TERMINAL_LEVELS = { pipes: 1, tools: 2, scripts: 3 } as const;

const TOOLS = ["head", "tail", "wc", "sort", "uniq"];

function terminalLevel(state: GameState): number {
  return state.badges.length;
}

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
      return box.length ? box.map((b) => `${getSpecies(b.speciesId).name.padEnd(13)} Nv ${String(b.level).padStart(3)}  ${getSpecies(b.speciesId).types.join("/")}${b.shiny ? "  shiny" : ""}`) : [T.empty];
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

/**
 * Runs a full line: scripts (";" and "&&") and pipes ("|") are unlocked with
 * badges; each piece after a pipe is a text filter over the lines before it.
 */
export function runCommand(state: GameState, input: string, ctx: TerminalContext): CommandOutput {
  const level = terminalLevel(state);
  if (/;|&&/.test(input)) {
    if (level < TERMINAL_LEVELS.scripts) return { lines: [T.lockedFeature("; e &&", TERMINAL_LEVELS.scripts)] };
    const out: CommandOutput = { lines: [] };
    for (const part of input.split(/;|&&/)) {
      const r = runPipeline(state, part, ctx, level);
      if (r.clear) out.lines = [];
      out.lines.push(...r.lines);
    }
    return out;
  }
  return runPipeline(state, input, ctx, level);
}

function runPipeline(state: GameState, input: string, ctx: TerminalContext, level: number): CommandOutput {
  const [first = "", ...filters] = input.split("|");
  if (filters.length > 0 && level < TERMINAL_LEVELS.pipes) return { lines: [T.lockedFeature("|", TERMINAL_LEVELS.pipes)] };
  const head = first.trim().split(/\s+/)[0] ?? "";
  if (head in FILTER_HELP) return { lines: [T.needsPipe(head)] };
  let out = runSingle(state, first, ctx);
  for (const filter of filters) {
    if (out.clear) break;
    out = { lines: applyFilter(filter.trim(), out.lines, level) };
  }
  return out;
}

/** Text tools that read the lines coming from a pipe. */
export function applyFilter(filter: string, lines: string[], level: number): string[] {
  const [name = "", ...args] = filter.split(/\s+/);
  if (TOOLS.includes(name) && level < TERMINAL_LEVELS.tools) return [T.lockedFeature(name, TERMINAL_LEVELS.tools)];
  switch (name) {
    case "grep": {
      const flags = args.filter((a) => a.startsWith("-")).join("");
      const pattern = args.filter((a) => !a.startsWith("-")).join(" ");
      if (!pattern) return [T.usageFilter("grep")];
      const ignoreCase = flags.includes("i");
      const invert = flags.includes("v");
      const needle = ignoreCase ? pattern.toLowerCase() : pattern;
      return lines.filter((l) => (ignoreCase ? l.toLowerCase() : l).includes(needle) !== invert);
    }
    case "head":
      return lines.slice(0, Number(args[0]?.replace("-", "")) || 10);
    case "tail":
      return lines.slice(-(Number(args[0]?.replace("-", "")) || 10));
    case "wc":
      return [String(lines.length)];
    case "sort":
      return [...lines].sort((a, b) => a.localeCompare(b, "pt-BR"));
    case "uniq":
      return lines.filter((l, i) => l !== lines[i - 1]);
    default:
      return [T.unknown(name)];
  }
}

function runSingle(state: GameState, input: string, ctx: TerminalContext): CommandOutput {
  const [cmd = "", ...args] = input.trim().split(/\s+/);
  const arg = args[0] ?? "";
  switch (cmd) {
    case "":
      return { lines: [] };
    case "help":
      return { lines: arg ? [COMMAND_HELP[arg] ?? FILTER_HELP[arg] ?? T.unknown(arg)] : [...Object.values(COMMAND_HELP), "", ...Object.values(FILTER_HELP)] };
    case "levels": {
      const level = terminalLevel(state);
      return { lines: T.levels(level, TERMINAL_LEVELS) };
    }
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
