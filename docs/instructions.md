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
9. **Stay inside the visual theme.** Terracotta panels, plum checkerboard, purple/gold pixel buttons, the palette tokens in `styles.css :root`, the two pixel fonts. Hard 2-3px borders, square corners on pixel parts, no blur, no gradients beyond the existing two-tone buttons, motion in `steps()`. Every interactive element has a hover, a pressed and a `:focus-visible` state. Scrollbars use the themed style in `polish.css`; never leave browser defaults. Respect `prefers-reduced-motion`.

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
    housing.ts          houses by category (history, languages, cloud, databases, networks, security, AI): 7 milestones each, slots, production
    stones.ts           type stones: drops, evolution cost, refine
    hatchery.ts         mystery eggs: incubation and hatching
    simulation.ts       headless playthrough with a simple player policy, for balancing
    rules.ts            player IF/THEN automation rules (capture and heal decisions)
    learning.ts         spaced repetition, daily challenge, boss code review
    guild.ts            Guild of Algorithms: champions, raids, Big-O based durations
    achievements.ts     long-term goals read from the state, each pays coins once (checked at the end of every tick)
    held.ts             held items: one per bug, equip/unequip, stat/XP/coin multipliers
    data/lessons.ts     one buggy snippet + fix per species (the base of every learning feature)
    state.ts            GameState = PersistentState + RuntimeState
    engine.ts           the idle loop `tick()` and player commands
  sprites/bugSprite.ts  procedural, mirror-symmetric 24x24 bug sprites
  sprites/trainerSprite.ts  16x22 trainer, 4 facings, walk frames
  audio/                chiptune: sounds.ts (effects as data), music.ts (procedural loops),
                        settings.ts (volumes), audioEngine.ts (Web Audio, browser only)
  i18n/ptBR.ts          every string shown to the player
  ui/
    store.ts            GameStore: clock (100 ms), autosave (10 s), event log
    format.ts           turns engine events into log lines
    render/             canvas helpers: sprites, icons, item art, region backgrounds, era art, house art, attack effects data
    polish.css          loaded last: layout limits, battle overlay, themed scrollbars, hover/press states, spacing
    world/worldModel.ts pure model of the explorable map: trainer walk, follower, roaming bugs, camera
    terminal.ts         the optional shell: parses a line and calls the same commands as the buttons
    preferences.ts      settings window switches (sound, display, performance), per browser in localStorage
    usePreferenceEffects.ts applies them outside React: body classes, viewport, screen wake lock
    world/navigation.ts battle map roads and obstacles: grid, A* (roads are cheaper), push-out
    features.css        settings window, achievements, held items, lighting and preference modes
    components/         layout pieces (sidebar, top nav, battle view, automations, log)
    modals/             windows (bug details, map, Bugdex, box, shop, bag, bosses, save, starter)
```

### The battle scene

The game engine decides *when* an encounter happens and resolves it; `worldModel.ts` decides *where* it is drawn. Every animation frame, `BattleView` steps the world model with the current encounter key: between fights the trainer walks toward the nearest roaming bug and the active bug follows his trail; when the engine starts a fight, the nearest roaming bug becomes the enemy and both line up in front of it. The camera centres on the trainer and is clamped to the map.

Obstacles and roads (`world/navigation.ts`): the map has a few wobbly roads (one through the start) and about 50 obstacles off the roads. The trainer plans with A* on a 40px grid where roads cost less, so he walks around obstacles and along the roads; the follower and the wild bugs are pushed out of obstacles. Obstacles are drawn as props of the region (`render/mapProps.ts`) with depth by their front edge; the terrain is drawn without its big objects on the battle map (`terrainUrl(..., props=false)`).

Battle map rules (keep them):
- The camera **always follows the trainer**. There is no dragging and no mouse-wheel zoom on the battle map; the only control is the zoom **+ / -** buttons (bottom right). Pan and wheel zoom exist only in the region map (Mapa button, `usePanZoom`).
- The zoom can never go below `coverZoom` (`world/viewport.ts`): the map always fills the screen, so no dark border shows. The map is 2800x1700 so even a wide screen zoomed out stays inside it.
- The "Proximidade para captura" panel is an overlay inside the map, bottom right, above the zoom buttons. It folds to its title (starts folded on phones).
- Map animations: `spawn-pop` when an enemy appears, `levelup-ring`, `shiny-sparkles`, plus the attack effects. Never start an animation at opacity 0 for something that must stay visible (a paused animation clock would hide it).

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
| Potency odds and bonuses | `POTENCY_TABLE` in `bug.ts` |
| Stone drops, evolution stone cost, refine cost | `stones.ts` |
| Egg time, slots, IV floor, shiny odds | `hatchery.ts` |
| Capture difficulty, traps per encounter | `CAPTURE_DIFFICULTY`, `MAX_THROWS_PER_ENCOUNTER` in `capture.ts` |
| Walk speeds, fight spacing, roaming bugs | `worldModel.ts` |
| Zoom limits and step | `MIN_ZOOM`, `MAX_ZOOM`, `ZOOM_STEP` in `world/viewport.ts` |
| Wins to open a route, per region | `DEFEATS_TO_UNLOCK_BY_REGION` in `data/world.ts` |
| Early XP floor (levels 1-11) | `EARLY_LEVELS`, `EARLY_SHARE` in `experience.ts` |
| Achievements (goals, rewards) | `ACHIEVEMENTS` in `achievements.ts` |
| Held items (price, effect) | `ITEMS` (category `held`) in `data/items.ts` |
| House tiers (cost, slots, multiplier, storage) and categories (badge, cost factor, coin/XP/storage perks, milestones) | `HOUSE_TIERS`, `HOUSE_LOTS` in `housing.ts` |

### Balancing

Run `npm run simulate` (optionally with seeds: `npm run simulate -- 1 2 3`). It plays the whole game headless in about a second per seed and prints, per region, when the boss was beaten, boss tries, timeouts, wipes, team levels and coins. After changing any number above, run it and keep the pacing inside the bounds of `simulation.test.ts` (20-45 h total, first region 45 min-5 h, every region slower than the last). Change those bounds only on purpose.

The simulated player uses every system: it arranges the team (moving strong bugs out of houses), shops, builds houses when the price is half its wallet, refines the top three bugs keeping 8 stones for evolutions, buys and hatches eggs, and equips held items. It also prints refines, eggs hatched and the house return (coins collected / coins spent). Current results (v0.8): 22-23 h total, first region 1.1-1.2 h, houses return 1.7-3.1x. House prices are set so each step pays itself back in about 45 minutes (`housing.test.ts`).

## Settings and preferences

The settings window (Config. in the top bar, or the sound button on the map) has five tabs: Áudio, Interatividade, HUD, Desempenho, Suporte. Every switch has a "?" with a one-line explanation in `i18n/settings.ptBR.ts`. They are browser preferences (`ui/preferences.ts`), not game state, so they are not in the save. To add one: a key in `Preferences` with its default, its text in `PREFERENCE_TEXT`, its tab in `KEYS` (`SettingsModal.tsx`), and its effect (CSS body class in `usePreferenceEffects.ts`, or read `usePreferences()` where needed). Pure decisions (`soundAllowed`, `mapFps`, `lightingFor`, `bodyClasses`) are unit tested.

## Learning features

Rule: learning is optional, short and rewarded. It never blocks progress, and a wrong answer only loses a bonus. Tests run the idle loop with `debugChallenges` off (see `testUtils.ts`) and the balance simulation does too.

- Every learning feature reads `data/lessons.ts`. To add a bug, add its lesson and its `LESSON_WHY` text; `lessons.test.ts` fails otherwise.
- Player text for these features lives in `i18n/learning.ptBR.ts`, `i18n/guild.ptBR.ts` and `i18n/terminal.ptBR.ts`. Terminal commands stay in English, like a real shell.
- The terminal lives in `src/ui` because it produces text; it only calls game commands.

## Art pipeline

All art is code. **Every species is hand-drawn**: `sprites/handDrawn.ts` (final forms and legendaries) and `sprites/handDrawnMore.ts` (the rest). Write only the left 12 columns of the 24x24 sprite; the code mirrors them. Codes: `k` outline, `b` body, `s` shade, `l` light, `a` accent, `e` eye, `p` pupil, `w` wing. Draw legs with `s`, not `k`, so they stay visible on the dark map. Stage 1 is small (about 14 rows), stage 3 fills the box; `bugSprite.test.ts` checks that each evolution line grows. The procedural generator in `bugSprite.ts` is only the fallback for a new species with no drawing yet.

The trainer (`sprites/trainerSprite.ts`) is hand-drawn too: one 16x22 grid per view (front, back, side; right is the side mirrored), with leg rows swapped for the steps and the arms slid one pixel opposite to the legs. Item art is `render/itemArt.ts`, house art `render/houseArt.ts` (history keeps one drawing per era in `render/eras.ts`; other categories get a building that grows with the tier and carries the category emblem). Colors always come from the palettes, so shiny and dual types keep working.

To review sprites, open the game in the browser and import `/src/sprites/bugSprite.ts` from the console to draw a sheet at 4x.

To go further:
- **Aseprite** (desktop pixel editor) or **Piskel** (free, in the browser) for drawing sprites and animation frames by hand; export PNG sprite sheets into `public/sprites/` and load them in `render/pixels.ts` instead of the generated ones.
- **PixelLab** generates pixel-art characters and animations with AI and offers an MCP server; it is not in the app's connector directory, it needs an account and an API key the owner creates.
- **PixiJS** (WebGL renderer) only if the map gets hundreds of animated objects; today CSS transforms and canvas data URLs are enough.

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
| - | Achievements | `achievements.ts`, `AchievementsModal.tsx` | `achievements.test.ts` |
| - | Held items | `held.ts`, `HeldItemSection.tsx` | `held.test.ts` |
| - | Map obstacles and roads | `world/navigation.ts`, `render/mapProps.ts` | `navigation.test.ts` |
| - | Settings window (5 tabs) | `preferences.ts`, `SettingsModal.tsx`, `usePreferenceEffects.ts` | `preferences.test.ts` |
| - | Houses by category with milestone timelines | `housing.ts`, `HousesModal.tsx`, `i18n/houses.ptBR.ts`, `render/houseArt.ts` | `housing.test.ts` |
| - | Balance / pacing | `simulation.ts` | `simulation.test.ts` |
| - | Sound and music | `src/audio` | `audio.test.ts` |
| - | Attack effects per type | `render/attackFx.ts`, `AttackLayer.tsx` | `attackFx.test.ts` |
| - | Explorable map, trainer and follower | `world/worldModel.ts`, `BattleView.tsx` | `worldModel.test.ts`, `trainerSprite.test.ts` |
| - | Item pixel art | `render/itemArt.ts` | `itemArt.test.ts` |
| - | Potency, score, stones, refine, hatchery, reduce level | `bug.ts`, `stones.ts`, `hatchery.ts`, `engine.ts` | `stones.test.ts` |
| - | Lessons, debug to capture, Bugdex fix | `data/lessons.ts`, `engine.ts`, `DebugPanel.tsx` | `lessons.test.ts`, `rules.test.ts` |
| - | Automation rules | `rules.ts`, `RulesModal.tsx` | `rules.test.ts` |
| - | Daily challenge, Leitner boxes, boss review | `learning.ts`, `StudyModals.tsx` | `learning.test.ts` |
| - | Guild of Algorithms | `guild.ts`, `GuildModal.tsx` | `guild.test.ts` |
| - | Terminal | `ui/terminal.ts`, `TerminalModal.tsx` | `terminal.test.ts` |
| - | Region map pan and zoom; battle map follow + zoom buttons | `world/viewport.ts`, `world/usePanZoom.ts`, `BattleView.tsx` | `viewport.test.ts` |
| - | Automations (throw until caught, auto revive, return to hunt) | `engine.ts` | `automation.test.ts` |
| - | Hand-drawn sprites (all species, trainer) and idle frames | `sprites/handDrawn.ts`, `sprites/handDrawnMore.ts`, `sprites/trainerSprite.ts` | `bugSprite.test.ts`, `trainerSprite.test.ts` |
| - | Bug screen, compare, proximity panel | `BugDetailModal.tsx`, `CompareModal.tsx`, `ProximityPanel.tsx` | manual check in the browser |
