# Backlog

Status: `[x]` done, `[ ]` to do. Keep this file current when a task is finished or found.

## Core: Bug Hunter (v0.1)

- [x] Project setup: Vite + React + TypeScript strict + Vitest
- [x] Game data: 38 species in 8 types, 24 moves, 14 items, 5 regions, 15 routes, 5 bosses
- [x] RF01 Automatic battle (speed gauge, automatic move choice, team switching)
- [x] RF02 Type chart with advantage, disadvantage and immunity
- [x] RF03 Route selection and unlocks (wins on the previous route, or a badge)
- [x] RF04 Bosses with fixed teams, time limit, badge, new region and higher level cap; bugs above the cap may disobey
- [x] RF05 Automatic traps with filters (off, all, only new, only shiny, always shiny) and preferred trap
- [x] RF06 Team of 6 + box: move, swap, set lead, release, search, filter, sort
- [x] RF07 Evolution by level (auto or manual button) and by item
- [x] RF08 Bugdex with seen/defeated/caught/shiny, base stats, where it appears and a real-world explanation
- [x] RF09 Shop (traps, potions, stat upgrades, evolution items) and bag
- [x] RF10 Autosave in localStorage, JSON export/import with validation, corrupt-save backup
- [x] Rewards: coins, XP (15% to benched bugs), trainer level, item drops
- [x] Automations: auto potion with threshold, auto evolve, reboot after a team wipe
- [x] Procedural pixel art: bug sprites per species, shiny palette, region backgrounds, icons
- [x] PokeIdle-style layout: player card, active bug, team, top nav, battle scene, automations, log
- [x] Unit tests for every module (engine, data integrity, sprites, store)

## v0.2

- [x] Balance pass for all 5 regions with a headless playthrough (`src/game/simulation.ts`, `npm run simulate`). Result then: about 8.5-11 h to finish (see v0.3 for the current pacing), each region longer than the last. Pacing is guarded by `simulation.test.ts`. Changes: XP divisor 7 -> 55, bench XP 25% -> 15%, wins to open a route 15 -> 25/80/100/150/200 per region, Legacy and Cloud routes 2-6 levels lower, Legacy and Cloud bosses lower, Root Access 5000 -> 15000, stat upgrades 300 -> 1000, battles 1.5x faster
- [x] Sound: synthesized chiptune effects for battle events, one music loop per region plus a boss theme, volume window (master, music, effects, mute) saved per browser
- [x] Attack animations per type: projectiles (glyphs, blocks, twin arrows, packets, shard, ring, pixels), impact particles, damage numbers on impact, screen shake on crits
- [x] Phone layout: battle first, 5-column menu, smaller scene and sprites, 40px touch targets, full-screen windows
- [x] **From Transistor to Cloud** (houses): 3 lots (the 2nd needs the Staging badge, the 3rd the Legacy badge), 7 eras (vacuum tube, transistor, integrated circuit, microprocessor, internet, cloud, AI), each era more expensive with more slots, a higher multiplier and more storage. Boxed bugs live there and produce coins and XP; coins pile up to the storage cap until collected

## v0.3

- [x] Explorable route map: 1800x1100 px procedural map per route, camera follows the trainer (`src/ui/world/worldModel.ts`, pure and tested)
- [x] Trainer character (16x22 pixel art, 4 facings, walk cycle) walks toward wild bugs; the active bug follows behind like a pet and steps forward to fight
- [x] Wild bugs roam the map; the engine's next encounter is drawn as the nearest one. Bugs are about half the previous size (56 px, wild 44 px)
- [x] Nameplates (name, level, HP bar) float above the enemy and above our active bug
- [x] Floating texts: damage on hit; on a win "+xp" over the active bug, "equipe +xp" for the bench, "+xp" over the trainer and "+coins"; "Nv N!" on level up; "CAPTURADO!"
- [x] Pixel-art previews for all 14 items in the shop, bag and automation panel
- [x] Harder capture: chance x0.3 (`CAPTURE_DIFFICULTY`) and at most 3 traps per encounter (`MAX_THROWS_PER_ENCOUNTER`)
- [x] Slower leveling: `XP_DIVISOR` 55 -> 100; encounters every 2.2 s (time to walk). Simulated playthrough now about 31 h (first region 1.4-3.3 h)

## v0.4

- [x] Potency P1-P5 rolled at birth (74.5% / 20% / 5% / 0.5% / 0.005%), +0% to +100% on every stat
- [x] Bug score 0-10 (IVs up to 6 points, potency up to 4) with tiers from FRACO to PERFEITO
- [x] Type stones: dropped by defeated bugs (30% per type, bosses 3 per type); level evolutions now cost 3 (first stage) or 8 (second stage) stones
- [x] Refine: +1 on HP/ATK/DEF raises the base stat by 2, cubic cost (3 x N^3 total), up to +10; speed is fixed; dual types spend both stone types
- [x] Hatchery: 2 slots, mystery eggs (shop 3000 or rare drop) hatch in 20 min of play into a bug from opened regions, IV >= 10, better potency odds, shiny 1/128
- [x] Proximity panel: nearest wild bugs with the catch chance of the preferred trap, the current fight and traps left
- [x] Bug screen redesign (PokeIdle style): score hero, potency/quality/IV, power with ranking, combat HP, speed, compare A/B, copy summary, reduce level, species sheet, stats radar with IVs, base stats with refine, evolution path with requirements, experience, identity (id, date, caught by, origin), potency table
- [x] Catch date and catcher saved on every new bug

## v0.5

- [x] Pannable, zoomable maps: drag to move, mouse wheel or +/- to zoom (0.5x-2.5x) on the route map and the region map; "Seguir caçador" re-centres (`world/viewport.ts`, `world/usePanZoom.ts`)
- [x] Automations: "Lançar até capturar" (no 3-trap limit), "Usar Reviver ao cair" (new Reviver item, back at 50% HP, also usable from the bag) and "Voltar à caça após o reboot" (off = the team waits at the Reboot Center)
- [x] Hand-drawn sprites for the stage-3 and legendary bugs: Syntaxwyrm, Heapocalypse, Lagmoth, Y2Kbeetle, Zeroday, Markmoth (`sprites/handDrawn.ts`)
- [x] Two-frame idle ("breathing") animation for every bug, staggered per bug on the map; knockback on hits
- [ ] Better art at scale needs an external tool (see "Art pipeline" in instructions.md)

## Next (core polish)

- [ ] Early game is slow (first region about 3 h in the simulation; a level-2 win gives +1 xp)
- [ ] Simulation policy does not refine or hatch eggs yet

- [ ] Early levels feel slow: a level-2 bug gives +1 xp. Consider a minimum XP per win or a gentler curve for levels 1-10
- [ ] Trainer customization (avatar colors, outfits)
- [ ] Map obstacles and paths (today the trainer walks over everything)

- [ ] Offline progress: simulate the time the tab was closed (today the catch-up is capped at 60 s). Houses are the natural first step: compute their production from the save timestamp
- [ ] Final-boss wall: benched bugs fall far behind the lead late in the game (lead 100, others about 80). Consider XP share based on level gap or a "train the weakest" automation
- [ ] Tune house prices with real play (the simulation only builds when it has 4x the cost)
- [ ] Hand-drawn sprites for the remaining 32 species (today only the 6 stage-3/legendary bugs are hand-drawn)
- [ ] Achievements (catch N, shinies, defeat all bosses)
- [ ] Held items / equipment for bugs
- [ ] Rematch bosses at higher levels (daily)
- [ ] Settings window (animation speed, number format)
- [ ] English translation (`src/i18n/en.ts` with the same shape)
- [ ] Lint and format setup (ESLint + Prettier) in CI
- [ ] Test on a real phone (only checked in a 375x812 emulated viewport)

## Later: other mechanics (not started on purpose)

- [ ] **Guild of Algorithms** (guild mechanic): champions are algorithms and data structures that fight on their own; guild members share buffs and raids.
- [ ] Online: accounts, cloud save sync, chat, trading, PvP, rankings
