# Instructions for AI agents and contributors

## Stack

- **TypeScript (strict)** for everything, **React 18** for the UI, **Vite** for dev/build, **Vitest** for tests.
- No game framework and no external art: sprites, icons and backgrounds are generated in code as pixel art and drawn with `image-rendering: pixelated`.
- Fonts: Pixelify Sans (body) and Silkscreen (titles), bundled through `@fontsource`.

## Rules

1. **All code is in English** (identifiers, comments, file names, commit messages). **All player-facing text is in pt-BR** and lives only in `src/i18n/ptBR.ts`. Data files use ids, never display text (species and move names are proper nouns and are the exception).
2. **No emojis** anywhere in the game, the code or the docs. Icons are pixel art (`src/ui/render/icons.ts`).
3. **Every feature has unit tests.** A feature is not done until its tests pass. Game logic must stay testable without a browser.
4. **The game logic (`src/game`) never imports React, the DOM or `src/ui`.** The UI calls engine commands and reads the state; it never computes game rules itself.
5. **Randomness is injected** (`Rng` type in `src/game/rng.ts`). Tests use `createSeededRng(seed)`, so results are deterministic.
6. Player commands return `ActionResult` (`{ ok: true }` or `{ ok: false, reason }`); they never throw for expected failures. The UI translates `reason` through `ERROR_TEXT`.
7. Keep it plain: small functions, no premature abstractions, no filler comments, no placeholder content. Comments explain *why*, not *what*.
8. When you finish or discover a task, update `docs/backlog.md`.

## Architecture

```
src/
  game/                 pure game logic (no DOM)
    data/               static content: species, moves, items, regions/routes/bosses
    rng.ts              seedable RNG and helpers
    types.ts            bug types and the effectiveness chart (RF02)
    bug.ts              bug instances, IVs, stat formula, power rating
    experience.ts       XP curve, level cap, trainer level
    damage.ts           damage formula and automatic move choice
    battle.ts           speed-gauge turn system (RF01)
    capture.ts          capture filter, chance and trap choice (RF05)
    collection.ts       team (6) and box: move, swap, release, search/filter (RF06)
    evolution.ts        level and item evolutions (RF07)
    bugdex.ts           seen / defeated / caught / shiny records (RF08)
    inventory.ts        shop and item use (RF09)
    progression.ts      route unlocks, badges, level cap, boss access (RF03, RF04)
    save.ts             export/import JSON with validation, local storage (RF10)
    housing.ts          "From Transistor to Cloud" houses: eras, slots, production
    simulation.ts       headless playthrough with a simple player policy, for balancing
    state.ts            GameState = PersistentState + RuntimeState
    engine.ts           the idle loop `tick()` and player commands
  sprites/bugSprite.ts  procedural, mirror-symmetric 24x24 bug sprites
  audio/                chiptune: sounds.ts (effects as data), music.ts (procedural loops),
                        settings.ts (volumes), audioEngine.ts (Web Audio, browser only)
  i18n/ptBR.ts          every string shown to the player
  ui/
    store.ts            GameStore: clock (100 ms), autosave (10 s), event log
    format.ts           turns engine events into log lines
    render/             canvas helpers: sprites, icons, region backgrounds, era art, attack effects data
    components/         layout pieces (sidebar, top nav, battle view, automations, log)
    modals/             windows (bug details, map, Bugdex, box, shop, bag, bosses, save, starter)
```

### State and the loop

- `GameState` is a plain object. `PersistentState` is saved; `runtime` (current battle, timers) is not.
- `tick(state, dtMs, rng)` mutates the state and returns `GameEvent[]`. Long ticks are split into 100 ms steps.
- Loop per step: reboot timer -> spawn timer -> auto potion -> `stepBattle` -> rewards / capture / unlocks.
- The UI store calls `tick` every 100 ms, bumps a version number and React re-renders through `useSyncExternalStore`.

### Key numbers (change in one place)

| What | Where |
|---|---|
| Type chart | `TYPE_CHART` in `types.ts` |
| Stat formula, shiny odds (1/512), IV max (31) | `bug.ts` |
| XP curve, bench XP share (25%) | `experience.ts`, `engine.ts` |
| Turn speed (`GAUGE_DIVISOR`), disobey chance | `battle.ts` |
| Spawn delay, reboot time, drops | `engine.ts` |
| Defeats to unlock a route (15), base level cap (20) | `data/world.ts` |
| Prices, trap multipliers, vitamin limit | `data/items.ts` |
| XP speed (`XP_DIVISOR`) | `experience.ts` |
| Wins to open a route, per region | `DEFEATS_TO_UNLOCK_BY_REGION` in `data/world.ts` |
| House eras (cost, slots, multiplier, storage) and lots | `HOUSE_TIERS`, `HOUSE_LOTS` in `housing.ts` |

### Balancing

Run `npm run simulate` (optionally with seeds: `npm run simulate -- 1 2 3`). It plays the whole game headless in about a second per seed and prints, per region, when the boss was beaten, boss tries, timeouts, wipes, team levels and coins. After changing any number above, run it and keep the pacing inside the bounds of `simulation.test.ts` (6-16 h total, first region 20-120 min, every region slower than the last). Change those bounds only on purpose.

## How to add content

- **New species**: add a line to `RAW` in `data/species.ts`, a description in `SPECIES_DESCRIPTIONS`, and put it in a route's `encounters` (or make it an evolution). `data.test.ts` fails if it cannot be obtained.
- **New route**: add to `ROUTES` with an `unlock`, a map position and a name in `ROUTE_NAMES`.
- **New item**: add the id to `ITEM_IDS`, the definition to `ITEMS` and the text to `ITEM_TEXT`.

## How to verify a feature

1. `npm test` passes (all suites) and `npm run typecheck` is clean.
2. Write or update the test file next to the module (`foo.ts` -> `foo.test.ts`). Test the rule, its edge cases and the failure reasons.
3. Run `npm run dev` and check the feature in the browser: no console errors, text in pt-BR, no emojis, the layout still works at 1500px wide, stacked (under 1100px) and on a phone (375px).
4. Update `docs/backlog.md`.

### Feature checklist (core requirements)

| Req | Feature | Code | Tests |
|---|---|---|---|
| RF01 | Automatic battle by speed, attack and defense | `battle.ts`, `damage.ts` | `battle.test.ts` |
| RF02 | Type effectiveness with immunities | `types.ts` | `types.test.ts`, `battle.test.ts` |
| RF03 | Free route switching, unlock by defeats or badge | `progression.ts`, `engine.ts` | `progression.test.ts`, `engine.test.ts` |
| RF04 | Bosses with fixed teams, time limit, badges, level cap | `engine.ts`, `progression.ts` | `engine.test.ts` |
| RF05 | Automatic capture with filters | `capture.ts`, `engine.ts` | `capture.test.ts`, `engine.test.ts` |
| RF06 | Team of 6 and box with search/filters | `collection.ts` | `collection.test.ts` |
| RF07 | Evolution by level (auto or manual) and by item | `evolution.ts`, `engine.ts` | `inventory.test.ts`, `engine.test.ts` |
| RF08 | Bugdex: seen/caught/shiny, stats, locations | `bugdex.ts`, `BugdexModal.tsx` | `progression.test.ts` |
| RF09 | Shop and inventory | `inventory.ts` | `inventory.test.ts` |
| RF10 | Autosave in the browser, JSON export/import | `save.ts`, `store.ts` | `save.test.ts`, `store.test.ts` |
| - | Houses (From Transistor to Cloud) | `housing.ts`, `HousesModal.tsx` | `housing.test.ts` |
| - | Balance / pacing | `simulation.ts` | `simulation.test.ts` |
| - | Sound and music | `src/audio` | `audio.test.ts` |
| - | Attack effects per type | `render/attackFx.ts`, `AttackLayer.tsx` | `attackFx.test.ts` |
