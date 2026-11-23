import { MAX_IV, type BugInstance } from "./bug";
import { isItemId, ITEMS } from "./data/items";
import { HATCHERY_SLOTS } from "./hatchery";
import { HOUSE_LOTS, HOUSE_TIERS, type House } from "./housing";
import { isBugType } from "./types";
import { sanitizeRules } from "./rules";
import { CHAMPIONS, createGuild, RAIDS } from "./guild";
import { hasSpecies } from "./data/species";
import { labQuestion } from "./data/labs";
import { getConcept } from "./data/concepts";
import { isGameId } from "./minigames";
import { BOSSES, ROUTES } from "./data/world";
import { createInitialState, createRuntime, defaultSettings, SAVE_VERSION, type CaptureMode, type GameState, type PersistentState } from "./state";

export class SaveError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "SaveError";
  }
}

export interface SaveFile {
  game: "bugidle";
  version: number;
  savedAt: string;
  state: PersistentState;
}

/** RF10: everything except runtime data, as pretty JSON text. */
export function exportSave(state: GameState, now: Date = new Date()): string {
  const { runtime: _runtime, ...persistent } = state;
  const file: SaveFile = { game: "bugidle", version: SAVE_VERSION, savedAt: now.toISOString(), state: persistent };
  return JSON.stringify(file, null, 2);
}

type Json = Record<string, unknown>;
const isObject = (v: unknown): v is Json => typeof v === "object" && v !== null && !Array.isArray(v);
const isNumber = (v: unknown): v is number => typeof v === "number" && Number.isFinite(v);
const isStringArray = (v: unknown): v is string[] => Array.isArray(v) && v.every((x) => typeof x === "string");
const CAPTURE_MODES: readonly CaptureMode[] = ["off", "all", "uncaught", "shiny"];
const validRoute = (id: unknown): id is string => typeof id === "string" && ROUTES.some((r) => r.id === id);
const validBoss = (id: unknown): id is string => typeof id === "string" && BOSSES.some((b) => b.id === id);

function isStats(v: unknown): boolean {
  return isObject(v) && ["hp", "atk", "def", "spd"].every((k) => isNumber(v[k]));
}

function isValidBug(v: unknown): v is BugInstance {
  if (!isObject(v)) return false;
  return (
    typeof v.uid === "string" &&
    typeof v.speciesId === "string" &&
    hasSpecies(v.speciesId) &&
    isNumber(v.level) &&
    v.level >= 1 &&
    v.level <= 100 &&
    isNumber(v.xp) &&
    isNumber(v.currentHp) &&
    typeof v.shiny === "boolean" &&
    isStats(v.ivs) &&
    Object.values(v.ivs as Json).every((iv) => (iv as number) >= 0 && (iv as number) <= MAX_IV) &&
    isStats(v.boosts)
  );
}

/**
 * RF10: parses save text, validates it and fills any missing fields with defaults
 * so older saves keep loading. Throws SaveError on bad input.
 */
export function importSave(text: string): GameState {
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new SaveError("Not valid JSON");
  }
  if (!isObject(parsed) || parsed.game !== "bugidle") throw new SaveError("Not a BugIdle save");
  if (!isNumber(parsed.version) || parsed.version > SAVE_VERSION) throw new SaveError("Unsupported save version");
  const raw = parsed.state;
  if (!isObject(raw)) throw new SaveError("Missing state");

  const base = createInitialState();
  const bugs: Record<string, BugInstance> = {};
  if (raw.bugs !== undefined) {
    if (!isObject(raw.bugs)) throw new SaveError("Invalid bugs");
    for (const [uid, bug] of Object.entries(raw.bugs)) {
      if (!isValidBug(bug) || bug.uid !== uid) throw new SaveError(`Invalid bug ${uid}`);
      const raw = bug as unknown as Json;
      const potency = isNumber(raw.potency) && raw.potency >= 1 && raw.potency <= 5 ? (Math.floor(raw.potency) as BugInstance["potency"]) : 1;
      const refine = isStats(raw.refine) ? (raw.refine as unknown as BugInstance["refine"]) : { hp: 0, atk: 0, def: 0, spd: 0 };
      bugs[uid] = {
        ...bug,
        origin: typeof bug.origin === "string" ? bug.origin : "unknown",
        potency,
        refine,
        held: isItemId(raw.held) && ITEMS[raw.held].category === "held" ? raw.held : null,
        caughtAt: isNumber(raw.caughtAt) ? raw.caughtAt : undefined,
        caughtBy: typeof raw.caughtBy === "string" ? raw.caughtBy : undefined,
      };
    }
  }

  const team = isStringArray(raw.team) ? raw.team.filter((uid) => uid in bugs).slice(0, 6) : [];
  const inventory: GameState["inventory"] = {};
  if (isObject(raw.inventory)) {
    for (const [id, count] of Object.entries(raw.inventory)) {
      if (isItemId(id) && isNumber(count) && count > 0) inventory[id] = Math.floor(count);
    }
  }

  const settingsRaw = isObject(raw.settings) ? raw.settings : {};
  const defaults = defaultSettings();
  const settings = {
    captureMode: CAPTURE_MODES.includes(settingsRaw.captureMode as CaptureMode) ? (settingsRaw.captureMode as CaptureMode) : defaults.captureMode,
    alwaysCaptureShiny: typeof settingsRaw.alwaysCaptureShiny === "boolean" ? settingsRaw.alwaysCaptureShiny : defaults.alwaysCaptureShiny,
    preferredTrap: isItemId(settingsRaw.preferredTrap) ? settingsRaw.preferredTrap : defaults.preferredTrap,
    autoPotion: typeof settingsRaw.autoPotion === "boolean" ? settingsRaw.autoPotion : defaults.autoPotion,
    potionThreshold: isNumber(settingsRaw.potionThreshold) ? Math.min(1, Math.max(0, settingsRaw.potionThreshold)) : defaults.potionThreshold,
    autoEvolve: typeof settingsRaw.autoEvolve === "boolean" ? settingsRaw.autoEvolve : defaults.autoEvolve,
    throwUntilCaught: typeof settingsRaw.throwUntilCaught === "boolean" ? settingsRaw.throwUntilCaught : defaults.throwUntilCaught,
    autoRevive: typeof settingsRaw.autoRevive === "boolean" ? settingsRaw.autoRevive : defaults.autoRevive,
    returnToHunt: typeof settingsRaw.returnToHunt === "boolean" ? settingsRaw.returnToHunt : defaults.returnToHunt,
    useRules: typeof settingsRaw.useRules === "boolean" ? settingsRaw.useRules : defaults.useRules,
    debugChallenges: typeof settingsRaw.debugChallenges === "boolean" ? settingsRaw.debugChallenges : defaults.debugChallenges,
  };

  const unlockedRoutes = isStringArray(raw.unlockedRoutes) ? raw.unlockedRoutes.filter(validRoute) : base.unlockedRoutes;
  if (!unlockedRoutes.includes("port-3000")) unlockedRoutes.unshift("port-3000");

  let activity = base.activity;
  if (isObject(raw.activity) && raw.activity.kind === "route" && validRoute(raw.activity.routeId) && unlockedRoutes.includes(raw.activity.routeId)) {
    activity = { kind: "route", routeId: raw.activity.routeId };
  } else if (isObject(raw.activity) && raw.activity.kind === "boss" && validBoss(raw.activity.bossId) && validRoute(raw.activity.returnRouteId)) {
    // Boss fights are not resumed after loading.
    activity = { kind: "route", routeId: raw.activity.returnRouteId };
  }

  const trainerRaw = isObject(raw.trainer) ? raw.trainer : {};
  const totalsRaw = isObject(raw.totals) ? raw.totals : {};
  const numberMap = (v: unknown): Record<string, number> =>
    isObject(v) ? Object.fromEntries(Object.entries(v).filter(([, n]) => isNumber(n))) as Record<string, number> : {};

  const bugdex: GameState["bugdex"] = {};
  if (isObject(raw.bugdex)) {
    for (const [id, e] of Object.entries(raw.bugdex)) {
      if (!hasSpecies(id) || !isObject(e)) continue;
      bugdex[id] = {
        seen: isNumber(e.seen) ? e.seen : 0,
        defeated: isNumber(e.defeated) ? e.defeated : 0,
        caught: isNumber(e.caught) ? e.caught : 0,
        shinyCaught: e.shinyCaught === true,
      };
    }
  }

  const houses: House[] = [];
  if (Array.isArray(raw.houses)) {
    const used = new Set(team);
    for (const h of raw.houses) {
      if (!isObject(h) || !isNumber(h.lot) || !HOUSE_LOTS.some((l) => l.lot === h.lot) || houses.some((x) => x.lot === h.lot)) continue;
      const tier = isNumber(h.tier) ? Math.max(0, Math.min(HOUSE_TIERS.length - 1, Math.floor(h.tier))) : 0;
      const residents = isStringArray(h.bugs) ? h.bugs.filter((uid) => uid in bugs && !used.has(uid)).slice(0, HOUSE_TIERS[tier]!.slots) : [];
      residents.forEach((uid) => used.add(uid));
      houses.push({ lot: h.lot, tier, bugs: residents, pending: isNumber(h.pending) ? Math.max(0, h.pending) : 0, xpCarry: isNumber(h.xpCarry) ? Math.max(0, h.xpCarry) : 0 });
    }
    houses.sort((a, b) => a.lot - b.lot);
  }

  const maxUid = Object.keys(bugs).reduce((max, uid) => Math.max(max, Number(uid.replace(/\D/g, "")) || 0), 0);

  return {
    version: SAVE_VERSION,
    trainer: {
      name: typeof trainerRaw.name === "string" ? trainerRaw.name.slice(0, 20) : base.trainer.name,
      level: isNumber(trainerRaw.level) ? Math.max(1, Math.floor(trainerRaw.level)) : 1,
      xp: isNumber(trainerRaw.xp) ? Math.max(0, trainerRaw.xp) : 0,
    },
    coins: isNumber(raw.coins) ? Math.max(0, Math.floor(raw.coins)) : base.coins,
    bugs,
    team,
    inventory,
    bugdex,
    routeDefeats: numberMap(raw.routeDefeats),
    unlockedRoutes,
    badges: isStringArray(raw.badges) ? raw.badges.filter((b) => BOSSES.some((boss) => boss.badgeId === b)) : [],
    activity,
    settings,
    achievements: isObject(raw.achievements)
      ? Object.fromEntries(Object.entries(raw.achievements).filter((entry): entry is [string, number] => isNumber(entry[1])))
      : {},
    totals: {
      defeats: isNumber(totalsRaw.defeats) ? totalsRaw.defeats : 0,
      captures: isNumber(totalsRaw.captures) ? totalsRaw.captures : 0,
      playTimeMs: isNumber(totalsRaw.playTimeMs) ? totalsRaw.playTimeMs : 0,
      shinies: isNumber(totalsRaw.shinies) ? totalsRaw.shinies : 0,
      evolutions: isNumber(totalsRaw.evolutions) ? totalsRaw.evolutions : 0,
      hatched: isNumber(totalsRaw.hatched) ? totalsRaw.hatched : 0,
      refines: isNumber(totalsRaw.refines) ? totalsRaw.refines : 0,
    },
    houses,
    rules: sanitizeRules(raw.rules),
    labs: Object.fromEntries(
      Object.entries(isObject(raw.labs) ? raw.labs : {})
        .filter(([id, r]) => labQuestion(id) && isObject(r))
        .map(([id, r]) => {
          const x = r as Json;
          const count = (v: unknown) => (isNumber(v) ? Math.max(0, Math.floor(v)) : 0);
          return [id, { solved: x.solved === true, tries: count(x.tries), wrong: count(x.wrong) }];
        }),
    ),
    minigames: (() => {
      const mg = isObject(raw.minigames) ? raw.minigames : {};
      const d = isObject(mg.detective) ? mg.detective : {};
      const paid = isObject(d.paid) ? Object.fromEntries(Object.entries(d.paid).filter(([id, day]) => getConcept(id) && isNumber(day))) : {};
      const games: Record<string, unknown> = {};
      for (const [id, r] of Object.entries(isObject(mg.games) ? mg.games : {})) {
        if (!isGameId(id) || !isObject(r)) continue;
        const ranking = Array.isArray(r.ranking)
          ? r.ranking.filter((e): e is Json => isObject(e) && isNumber(e.score) && isNumber(e.day)).map((e) => ({ score: Math.max(0, Math.min(100, e.score as number)), day: e.day as number })).slice(0, 5)
          : [];
        games[id] = { ranking, day: isNumber(r.day) ? r.day : -1, playsToday: isNumber(r.playsToday) ? r.playsToday : 0, plays: isNumber(r.plays) ? r.plays : 0 };
      }
      return {
        games,
        detective: {
          day: isNumber(d.day) ? d.day : -1,
          points: isNumber(d.points) ? Math.max(0, d.points) : 0,
          paid: paid as Record<string, number>,
          solved: isNumber(d.solved) ? Math.max(0, Math.floor(d.solved)) : 0,
        },
      };
    })(),
    guild: (() => {
      const g = isObject(raw.guild) ? raw.guild : {};
      const base = createGuild();
      const owned = isStringArray(g.owned) ? [...new Set([...base.owned, ...g.owned.filter((id) => CHAMPIONS.some((c) => c.id === id))])] : base.owned;
      const r = isObject(g.raid) ? g.raid : null;
      const raid =
        r && typeof r.raidId === "string" && RAIDS.some((x) => x.id === r.raidId) && typeof r.championId === "string" && owned.includes(r.championId) && isNumber(r.startedAt) && isNumber(r.durationMs)
          ? { raidId: r.raidId, championId: r.championId, startedAt: r.startedAt, durationMs: r.durationMs }
          : null;
      const clears = Object.fromEntries(Object.entries(isObject(g.clears) ? g.clears : {}).filter(([id, n]) => RAIDS.some((x) => x.id === id) && isNumber(n)));
      return { owned, raid, clears: clears as Record<string, number>, autoRepeat: typeof g.autoRepeat === "boolean" ? g.autoRepeat : base.autoRepeat };
    })(),
    knowledge: Object.fromEntries(
      Object.entries(isObject(raw.knowledge) ? raw.knowledge : {})
        .filter(([id, card]) => hasSpecies(id) && isObject(card) && isNumber(card.box) && isNumber(card.due))
        .map(([id, card]) => {
          const c = card as Json;
          const count = (v: unknown) => (isNumber(v) ? Math.max(0, Math.floor(v)) : 0);
          return [id, { box: Math.max(1, Math.min(5, Math.floor(c.box as number))), due: c.due as number, seen: count(c.seen), right: count(c.right), wrong: count(c.wrong) }];
        }),
    ),
    dailyDay: isNumber(raw.dailyDay) ? raw.dailyDay : null,
    bossReview: Object.fromEntries(Object.entries(isObject(raw.bossReview) ? raw.bossReview : {}).filter(([id, n]) => validBoss(id) && isNumber(n)).map(([id, n]) => [id, Math.max(0, Math.min(3, n as number))])),
    stones: Object.fromEntries(Object.entries(isObject(raw.stones) ? raw.stones : {}).filter(([k, v]) => isBugType(k) && isNumber(v) && v > 0).map(([k, v]) => [k, Math.floor(v as number)])),
    hatchery: Array.from({ length: HATCHERY_SLOTS }, (_, i) => {
      const slot = Array.isArray(raw.hatchery) ? raw.hatchery[i] : null;
      return isNumber(slot) ? slot : null;
    }),
    nextUid: Math.max(isNumber(raw.nextUid) ? raw.nextUid : 1, maxUid + 1),
    runtime: createRuntime(),
  };
}

/** Minimal storage interface so tests can use an in-memory fake. */
export interface KeyValueStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

export const STORAGE_KEY = "bugidle.save";

export function saveToStorage(storage: KeyValueStorage, state: GameState): void {
  storage.setItem(STORAGE_KEY, exportSave(state));
}

/** Returns null when there is no save or it is unreadable (the broken save is kept as a backup). */
export function loadFromStorage(storage: KeyValueStorage): GameState | null {
  const text = storage.getItem(STORAGE_KEY);
  if (!text) return null;
  try {
    return importSave(text);
  } catch {
    storage.setItem(`${STORAGE_KEY}.corrupt`, text);
    return null;
  }
}
