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

## v0.6 - learning computing while playing

Principle: learning is optional, short and rewarded; it never blocks progress.

- [x] Lessons: one short buggy snippet + fix + explanation for each of the 38 bugs (`game/data/lessons.ts`, `i18n/learning.ptBR.ts`)
- [x] 1. Automation rules in blocks: IF conditions (AND, NOT) THEN action, first match wins, shown as code (`game/rules.ts`, `RulesModal`)
- [x] 2. Debug to capture: shiny, rare or new bugs pause up to 12 s for an optional "which line has the bug?"; right answer doubles the capture chance (`answerDebug`, `DebugPanel`)
- [x] 3. Bugdex "Como corrigir": buggy code, fix and explanation after the capture
- [x] 4. Region curriculum on the map, and an optional boss code review (+20% prize per right answer)
- [x] 5. Daily challenge (3 questions, coins, egg for 3/3) with spaced repetition in 5 Leitner boxes (`game/learning.ts`, `StudyModal`)
- [x] 6. Houses museum (timeline of eras) and Moore's law (each era doubles production)
- [x] 7. Guild of Algorithms: 9 champions (sorting and searching), 9 raids; raid time = real operation count, so Big-O, best/worst case and memory decide (`game/guild.ts`, `GuildModal`)
- [x] 8. Optional terminal (F2 or the menu): help, ls, cd, pwd, status, man, dex, catch, trap, buy, use, lead, rules, raid, egg, collect, history, Tab completion (`ui/terminal.ts`, `TerminalModal`)

## v0.7 - houses by category, battle map, art and UI polish

- [x] Houses split by category: Histórica (hardware history), Linguagens, Nuvem, Bancos de Dados, Redes, Cibersegurança, IA. One house each, 7 milestones each with year and a short explanation, a timeline per category, small perks (coins, XP, storage). Replaces the old museum
- [x] Battle map: camera always follows the trainer; only the + / - buttons zoom (no drag, no wheel); zoom never shows the map edge; bigger map (2800x1700)
- [x] "Proximidade para captura" moved inside the battle map (bottom right, above zoom, foldable); "Seguir caçador" removed
- [x] Fixed the log running off the screen (grid row limit, right column scrolls)
- [x] Themed pixel scrollbars; hover, pressed and focus states on buttons, tabs, slots and cards; study screen spacing
- [x] All 38 species hand-drawn (`handDrawnMore.ts`), trainer redrawn by hand (front, back, side, walk cycle)
- [x] Map animations: enemy spawn pop, level-up ring, shiny sparkles
- [x] Simulation player moves strong bugs out of houses into the team (7 houses kept too many good bugs locked)

## v0.8 - pacing, achievements, equipment, map paths, settings

- [x] Faster early game: a win against a level 1-11 bug is worth at least a slice of a level (fades to zero at 12). First region 1.1-1.2 h (was 2.3-3.3 h)
- [x] Simulation plays every system: refines, eggs, held items, houses at 2x the price; reports house return
- [x] House prices re-tuned: each step pays back in about 45 min; later categories cost 1.5x-6x (was up to 16x and never paid back)
- [x] Achievements: 28 goals in 4 groups with coin rewards, toast and sound (both can be turned off), window in the top bar
- [x] Held items: 6 items (Pato de Borracha +25% XP, Linter ATK, Antivírus DEF, SSD VEL, Suíte de Testes HP, Cartão de Cache +20% coins), equipped on the bug screen or from the bag
- [x] Battle map roads and obstacles: A* that prefers roads, props per region, nobody walks through obstacles
- [x] Settings window like PokeIdle: Áudio (4 sound switches and the volumes), Interatividade (immersive, scene transparency, time-of-day lighting), HUD (nameplates, hide achievement toasts, night mode, phone layout), Desempenho (optimized, economy, keep screen on, ULTRA economy), Suporte (version, save, reset, report)

## v0.9 - map design, the Reboot Center, catching by hand

- [x] Region map no longer moves or zooms; it fills the window (no dark border). Battle map vignette removed
- [x] Themed maps for all 5 regions: ground tiles, details, textured roads, decorations, 6 obstacle drawings each; the Cloud is a sky level with holes, golden brick roads, balloons, columns, servers on clouds, storm clouds
- [x] Reboot Center as a calm square with the nurse; needs 3 s out of combat ("Fique 3 segundos fora de combate"); warp to the door, heal, leave
- [x] Proximity panel shows the enemy's live HP; click the enemy (map or panel) to throw a trap; click a roaming bug to hunt it next
- [x] New trap tiers: Logpoint 1.2x, Breakpoint Condicional 2x, Tracepoint 3x, Core Dump 3.6x
- [x] All items and menu icons redrawn at 16x16 with outline and three-tone shading

## v0.10 - learning pack, weather, catching roaming bugs

- [x] Click a roaming bug: a trap flies to it; caught or "FUGIU!", and it leaves the map and the proximity list
- [x] Nameplates (name, level, HP) above everything on the map
- [x] Reboot Center: during a fight a popup warns that the fight's XP and coins are lost; confirming heals and revives the whole team (no more 3 s rule)
- [x] Weather and time of day change encounters (rain, storm, fog, heat; dusk and night bring rare bugs), with effects on the map
- [x] Second lesson for every bug; the daily review alternates them
- [x] "Ordene o código" bonus puzzle in the daily challenge
- [x] Labs: Git (Mergefly), SQL (Bancos de Dados), Networks (Redes), Security (Injectick, Xssquito), 4 challenges each
- [x] Glossary: underlined words in explanations and a Glossário window
- [x] Terminal levels: pipes and grep, then head/tail/wc/sort/uniq, then scripts with ; and &&
- [x] Guild visualizer: the algorithm's bars move while the raid runs
- [x] Teacher report: download a text report of what was studied

## v0.11 - Mini Games: Detetive de Conceitos

- [x] Mini Games window in the top bar, first game: Detetive de Conceitos
- [x] 24 computing concepts (Linux, Git, Python, JavaScript, HTML, CSS, SQL, API, Docker, cloud, firewall, algorithm, recursion, variable, loop, array, compiler, CPU, RAM, encryption, binary, HTTP, terminal, bug)
- [x] 5 clues that open on a wrong guess or after 30 s; 10/8/6/4/2 points paid as coins; each concept pays once a day; today's points shown
- [x] 2D pixel picture of each concept and an explanation after the round (what it is, what it is for, where it is used)

## v0.12 - 14 new mini games and a local ranking

- [x] Mini Games hub with 15 games and a Ranking tab (top 5 per game, saved)
- [x] Shared scoring: 0-100 points, the first 3 plays of each game per day pay coins
- [x] Caça-palavras, Palavras cruzadas (built from glossary terms), Forca do Programador (a server rack falls), Desembaralhe (60 s), Memória (commands and what they do)
- [x] Qual é a linguagem? (7 languages), Adivinhe a saída (checked by running the code in tests), Binário relâmpago (dec/bin/hex, 60 s)
- [x] Pixel por código (paint by hex colours), Robô do Algoritmo (6 mazes, repeat command, score by program length), Portas Lógicas (AND/OR/XOR/NOT circuits)
- [x] Verdadeiro ou falso (60 s), Corrida de digitação (accuracy and speed, ghost of your record), Encanamento de dados (rotate pipes, always solvable)

## v0.13 - catch-up XP, study streak, last two mini games, new HUD

- [x] Final-boss wall: benched bugs get more XP the further they are below the strongest (`benchShare`, 15% + 4% per level behind, up to 90%), plus the "Treinar o mais fraco" switch (weakest healthy bug fights first)
- [x] Study streak: days in a row with the daily challenge add +10% coins each day, up to +100%; a missed day resets it
- [x] Estruturas e Ordenação: watch 5 sorting algorithms order bugs by level, then a stack puzzle, a queue question and a hash table (level % 5) with chained buckets
- [x] Chuva de Código: a typing shooter with computing words; the end screen explains every word destroyed
- [x] HUD: wider left side with an icon rail (Config., Mochila, Conquistas, Terminal, Som, Save), fewer top buttons with no side scroll, "Box" renamed "Equipe", the trainer as the profile picture, idle animation on the trainer, "em campo" and the team list

## v0.14 - bug hunt and polish

- [x] Chaos test (`fuzz.test.ts`): random player actions between ticks, checking after every step that coins, HP, levels, team, houses, items and stones stay valid and that a save loads back identical
- [x] Broken save test: 1500 damaged save files must be refused with SaveError or load into a valid game
- [x] Fixed: a save with bugs but an empty team loaded a stuck game; repeated uids in the team; HP/XP/level out of range in an edited save
- [x] Fixed: a full or blocked browser storage threw an error every autosave; now a red warning asks to export the save. The browser save is compact JSON
- [x] Items and stones that reach 0 are removed (same as after a reload)
- [x] Mochila grouped by category, with a detail panel and "usar como armadilha preferida"
- [x] Houses tabs in one even row; boss trophies are grey until the boss is beaten; study streak label says what you get today or tomorrow; bug score "1,5 / 10"; "Mandar para a reserva" instead of Box

## Next (core polish)



- [ ] Trainer customization (avatar colors, outfits)

- [ ] Rematch bosses at higher levels (daily)
- [ ] English translation (`src/i18n/en.ts` with the same shape)
- [ ] Lint and format setup (ESLint + Prettier) in CI
- [ ] Test on a real phone (only checked in a 375x812 emulated viewport)

## Ideas: mechanics

- [ ] Bug abilities: one passive per species (Heisenbug dodges the first hit, Leaklet drains HP each turn)
- [ ] Team synergies: 3 bugs of the same type give a small bonus; mixed teams get type coverage hints
- [ ] Rival hunter NPC who appears on routes for a short fight, with a weekly team
- [ ] Bug fusion or "merge": two bugs of the same line become one with better IVs
- [ ] Map events: a golden bug that runs away, a supply drop with traps, a "deploy freeze" that doubles XP for 5 minutes
- [ ] Trap crafting with stones (stones + coins = a better trap)
- [ ] Badges case and trainer card to show progress (playtime, shinies, favorite bug)
- [ ] Expeditions: send a boxed team on a timed trip to a cleared route for loot
- [ ] Weather forecast: a small panel with the next 3 weather slots per region, to plan where to hunt
- [ ] Weather-only bugs: a rare species that only appears in storms or at night
- [ ] Bug moods: a bug that wins a lot gets "em chamas" (+speed) for a while; one that loses gets tired
- [ ] Route bosses: a mini-boss every 100 defeats on a route, with a stone reward
- [ ] Bounties: daily board with 3 tasks (catch 5 memory bugs, win 20 fights in the rain...) for coins and eggs
- [ ] Shiny chain: catching the same species in a row slowly raises the shiny chance
- [ ] Photo mode: hide the HUD and save a screenshot of the map with the team

## Ideas: learning

- [ ] Type the fix: instead of picking the line, write the corrected line (checked against a few accepted answers)
- [ ] Code tracing: "what does this print?" questions where the player follows the variables step by step
- [ ] Big-O lab in the Guild: guess which champion finishes first before sending them, and see the real step count
- [ ] Regex lab with Regexorpion: write a pattern that matches the green lines and not the red ones
- [ ] Logic gates lab in the Histórica house: build AND, OR and NOT from transistors
- [ ] Binary and hex: convert numbers to open the Y2Kbeetle chest
- [ ] Debugger mini-game: step through code with breakpoints and watch the variables change
- [ ] Class code: a teacher shares a code and the report groups the students (needs online, later)

## Ideas: mini games (paused: the owner said enough mini games for now)

- [ ] Daily challenge across games: one featured mini game per day with double coins
- [ ] More content per game: more crossword terms, snippets for every language, more pixel pictures and robot mazes
- [ ] Robot loops with conditions ("se parede, vire") as a later level set
- [ ] Gates with a truth table to fill in, and building a half adder
- [ ] Word search themed by the region you are in
- [ ] Achievements for the mini games (play all 17, top score in 5 games)

## Later: other mechanics (not started on purpose)

- [ ] Offline progress (the owner does not want it for now)
- [ ] Online: accounts, cloud save sync, chat, trading, PvP, rankings
