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

- [x] Balance pass for all 5 regions with a headless playthrough (`src/game/simulation.ts`, `npm run simulate`). Result: about 8.5-11 h to finish, each region longer than the last. Pacing is guarded by `simulation.test.ts`. Changes: XP divisor 7 -> 55, bench XP 25% -> 15%, wins to open a route 15 -> 25/80/100/150/200 per region, Legacy and Cloud routes 2-6 levels lower, Legacy and Cloud bosses lower, Root Access 5000 -> 15000, stat upgrades 300 -> 1000, battles 1.5x faster
- [x] Sound: synthesized chiptune effects for battle events, one music loop per region plus a boss theme, volume window (master, music, effects, mute) saved per browser
- [x] Attack animations per type: projectiles (glyphs, blocks, twin arrows, packets, shard, ring, pixels), impact particles, damage numbers on impact, screen shake on crits
- [x] Phone layout: battle first, 5-column menu, smaller scene and sprites, 40px touch targets, full-screen windows
- [x] **From Transistor to Cloud** (houses): 3 lots (the 2nd needs the Staging badge, the 3rd the Legacy badge), 7 eras (vacuum tube, transistor, integrated circuit, microprocessor, internet, cloud, AI), each era more expensive with more slots, a higher multiplier and more storage. Boxed bugs live there and produce coins and XP; coins pile up to the storage cap until collected

## Next (core polish)

- [ ] Offline progress: simulate the time the tab was closed (today the catch-up is capped at 60 s). Houses are the natural first step: compute their production from the save timestamp
- [ ] Final-boss wall: benched bugs fall far behind the lead late in the game (lead 100, others about 80). Consider XP share based on level gap or a "train the weakest" automation
- [ ] Tune house prices with real play (the simulation only builds when it has 4x the cost)
- [ ] Hand-drawn sprites for the legendaries and final evolutions
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
