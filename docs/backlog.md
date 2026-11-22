# Backlog

Status: `[x]` done, `[ ]` to do. Keep this file current when a task is finished or found.

## Core: Bug Hunter (v0.1)

- [x] Project setup: Vite + React + TypeScript strict + Vitest
- [x] Game data: 38 species in 8 types, 24 moves, 14 items, 5 regions, 15 routes, 5 bosses
- [x] RF01 Automatic battle (speed gauge, automatic move choice, team switching)
- [x] RF02 Type chart with advantage, disadvantage and immunity
- [x] RF03 Route selection and unlocks (15 defeats or a badge)
- [x] RF04 Bosses with fixed teams, time limit, badge, new region and higher level cap; bugs above the cap may disobey
- [x] RF05 Automatic traps with filters (off, all, only new, only shiny, always shiny) and preferred trap
- [x] RF06 Team of 6 + box: move, swap, set lead, release, search, filter, sort
- [x] RF07 Evolution by level (auto or manual button) and by item
- [x] RF08 Bugdex with seen/defeated/caught/shiny, base stats, where it appears and a real-world explanation
- [x] RF09 Shop (traps, potions, stat upgrades, evolution items) and bag
- [x] RF10 Autosave in localStorage, JSON export/import with validation, corrupt-save backup
- [x] Rewards: coins, XP (25% to benched bugs), trainer level, item drops
- [x] Automations: auto potion with threshold, auto evolve, reboot after a team wipe
- [x] Procedural pixel art: bug sprites per species, shiny palette, region backgrounds, icons
- [x] PokeIdle-style layout: player card, active bug, team, top nav, battle scene, automations, log
- [x] Unit tests for every module (engine, data integrity, sprites, store)

## Next (core polish)

- [ ] Offline progress: simulate the time the tab was closed (today the catch-up is capped at 60 s)
- [ ] Balance pass: play through regions 2-5 and tune levels, boss teams and prices
- [ ] Sound effects and music with a volume setting
- [ ] Battle animations per type (projectiles, particles)
- [ ] Hand-drawn sprites for the legendaries and final evolutions
- [ ] Mobile layout pass (touch targets, smaller battle scene)
- [ ] Achievements (catch N, shinies, defeat all bosses)
- [ ] Held items / equipment for bugs
- [ ] Rematch bosses at higher levels (daily)
- [ ] Settings window (animation speed, number format)
- [ ] English translation (`src/i18n/en.ts` with the same shape)
- [ ] Lint and format setup (ESLint + Prettier) in CI

## Later: other mechanics (not started on purpose)

- [ ] **Guild of Algorithms** (guild mechanic): champions are algorithms and data structures that fight on their own; guild members share buffs and raids.
- [ ] **From Transistor to Cloud** (housing mechanic): houses where idle bugs farm resources, upgraded along computing history (vacuum tube, transistor, CPU, internet, cloud, AI).
- [ ] Online: accounts, cloud save sync, chat, trading, PvP, rankings
