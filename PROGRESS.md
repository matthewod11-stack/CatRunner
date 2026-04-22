# Beach Kitty Multi-Level System — Session Progress Log

> **Purpose:** Track progress across development sessions. Each session adds an entry at the TOP.
> **Related Docs:** [ROADMAP_V3.md](./ROADMAP_V3.md) | [docs/archive/roadmaps/ROADMAP_V1_COMPLETE.md](./docs/archive/roadmaps/ROADMAP_V1_COMPLETE.md)

---

## **ACTIVE ROADMAP**

```
./ROADMAP_V3.md
```

**Start with `ROADMAP_V3.md` for active work.** V2 is complete. V1 archived at `docs/archive/roadmaps/ROADMAP_V1_COMPLETE.md`.

---

## How to Resume

```bash
# 1. Run session init
./scripts/dev-init.sh

# 2. Read the active roadmap:
sed -n '1,100p' ROADMAP_V3.md

# 3. Check the latest session entry below for handoff notes
```

---

<!--
=== ADD NEW SESSIONS AT THE TOP ===
Most recent session should be first.
-->

## Session: 2026-04-21 21:34

### Completed
- Landed the Phaser-only reset execution pass and verified the runtime now boots gameplay only through `PhaserGame`
- Added Playwright browser smoke coverage for campaign boot, Kitty Closet, Phaser scene boot, victory, game over, Hall of Fame persistence, and Hall of Fame ordering/cap behavior
- Verified `npm test`, `npm run test:smoke`, and `npx tsc --noEmit` all pass on the final session snapshot

### In Progress
- Platformer hero-sheet and sprite-matting work remains active WIP and was intentionally left out of this session's changes
- A true `CAMPAIGN_COMPLETE` UI path is still not wired even though the enum exists

### Issues Encountered
- Vitest initially picked up the new Playwright spec; fixed by excluding `playwright/` from the Vite test runner config
- No stored `/tmp` session-start test baseline existed for today, so the comparison step was skipped

### Next Session Should
- Resume the platformer hero-sheet and sprite-matting workstream on top of the now-stable Phaser-only runtime
- Decide whether to wire a real `CAMPAIGN_COMPLETE` surface or keep campaign-complete state implicit through progression and Hall of Fame flows
- Keep bundle-size follow-up visible while `dist/assets/index-*.js` remains oversized

## Session: 2026-04-21 (V4 Phaser-only reset)

### Completed
- [x] Removed the `?dom_runner` gate from `App.tsx`; gameplay now boots only through `PhaserGame`
- [x] Deleted `components/GameEngine.tsx` and the retired DOM-runner support subtree, including legacy React renderers and audio helpers
- [x] Rewrote active architecture/root guidance to describe the Phaser-only runtime and archived the executed reset spec
- [x] Verified `npm run test:run` (42 files, 196 tests), `npx tsc --noEmit`, and `npm run build`
- [x] Ran a headless Chrome smoke pass covering campaign boot, gameplay boot, pause overlay, EJECT back to menu, and Kitty Closet route boot

### Remaining Verification Gap
- [ ] Full interactive browser coverage for victory/game-over/Hall of Fame mutation still needs a deeper playtest pass

### Next Session Should
1. Run a deeper browser playtest across victory/game-over flows once richer browser control is available
2. Continue from the next highest-priority roadmap workstream in `ROADMAP_V3.md`

## Session: 2026-04-19 (repo cleanup and roadmap consolidation)

### Completed
- [x] Rewrote `ROADMAP_V3.md` as the only active roadmap
- [x] Archived `KNOWN_ISSUES.md` and retired it from the workflow
- [x] Reorganized active docs under `docs/`
- [x] Created GitHub issues for surviving actionable repo/product concerns
- [x] Verified `npm run test:run`, `npx tsc --noEmit`, and `npm run build`
- [x] Confirmed the repo now has one active roadmap and one active root progress log

### Next Session Should
1. Start from `ROADMAP_V3.md`
2. Use GitHub Issues for bugs and technical debt
3. Continue from the highest-priority open roadmap workstream

## Session: 2026-04-05 09:00 (City Heights Full Level Build)

### Completed
- [x] **City Heights (ROOFTOPS) full level design** — Brainstormed and specced a 3-zone Mario-style platformer with golden hour cityscape, building-based rooftop platforms, 3 enemy types (pigeon, rat, raccoon), 4 hazards (AC unit, clothesline, satellite dish, neon sign), 3 platformer-specific powerups (triple jump, glide, shield), and Pigeon King boss fight
- [x] **10-task modular implementation** — Built 6 manager modules (BuildingGenerator, CityBackground, EnemyManager, HazardManager, PowerupManager, PigeonKingBoss) + rewrote PlatformerScene as thin orchestrator + SFX integration
- [x] **Testable pure logic** — Extracted `generation.ts` (zone resolution) and `bossPhases.ts` (boss state machine) with full Vitest coverage (12 new tests, 97 total)
- [x] **`/levelbuilder` command** — Created project-level slash command that codifies the repeatable build pipeline for remaining 7 campaign levels
- [x] **Cat sprite sizing fix** — Fixed cat rendering at native texture resolution by computing scale from source image dimensions
- [x] **Visual companion brainstorm** — Used browser-based visual companion for enemy/hazard selection, visual style (golden hour), and building generation model mockups

### In Progress
- [ ] **Visual polish** — Building facades, enemy sprites, hazard art are all placeholder rectangles. Need proper sprite art pass.
- [ ] **Gameplay tuning** — Gap sizes, enemy density, boss timing, powerup durations need playtesting adjustment
- [ ] **Cat sprite size** — Fixed scaling logic but may need size constant adjustment (40x48 might be too small relative to buildings)

### Issues Encountered
- Phaser `setDisplaySize` didn't reliably scale loaded cat sprite textures — switched to computing scale from source image dimensions
- Git worktrees errored on branch conflicts — user prefers working directly on main
- Subagent batching (Tasks 3-6) returned before committing — needed manual commit of created files

### Next Session Should
1. **Playtest City Heights end-to-end** — Verify all 3 zones, enemy behaviors, hazard interactions, boss fight, and victory flow work correctly
2. **Tune difficulty** — Adjust gap sizes, enemy density, boss land durations based on playthrough feel
3. **Use `/levelbuilder` on next level** — Pick Kitchen (launcher), Space (shooter), or another skeleton to validate the repeatable pipeline
4. **Sprite art pass** — Replace placeholder rectangles with proper enemy/hazard art (consider Nanobanana MCP for sprite generation)

---

## Session: 2026-03-30 09:15 (Local Overnight Agent — Desktop Task Setup)

### Completed
- [x] **Local overnight agent** — Adapted morty-v2 pattern for CatRunner as a Claude Desktop local scheduled task
- [x] **`docs/OVERNIGHT_AGENT.md`** — Rewritten from remote trigger to Desktop task version with CatRunner-specific verification gates (build + tsc + Vitest) and safety rails (scenes, .env.local, game logic)
- [x] **`prompts/overnight-agent.md`** — Thin task entry point, writes run log to `state/overnight-agent-log.json`
- [x] **`state/` directory** — Created and gitignored for agent runtime artifacts
- [x] **CLAUDE.md** — Added prompts + state file references to project tracking
- [x] **GitHub labels verified** — All 4 labels confirmed present (tech-debt, needs-design-decision, deferred, in-progress)

### In Progress
- [ ] Desktop task needs to be created manually in Claude Desktop settings

### Issues Encountered
- None

### Next Session Should
1. **Create Desktop task** — Name: `overnight-agent`, Prompt: `Read prompts/overnight-agent.md and execute all instructions in it.`, Daily 2:00 AM, Sonnet, Folder: `/Users/homebase/Desktop/CatRunner`
2. **Run once and approve permissions** — Click "Run now", approve gh/npm/git/file write permissions
3. **Review first run results** — Check `state/overnight-agent-log.json` and GitHub PRs
4. **Consider disabling remote trigger** — `trig_01WdJuhzamc5XsGBm8MAkP5K` now redundant with local task

---

## Session: 2026-03-30 07:45 (Issue-Driven Maintenance & Overnight Agent Setup)

### Completed
- [x] **GitHub Issues strategy** — Shifted from retired `KNOWN_ISSUES.md` tracking to GitHub Issues for all tech-debt tracking
- [x] **Overnight agent trigger** — Created scheduled Claude Code remote trigger (`trig_01WdJuhzamc5XsGBm8MAkP5K`) running nightly at 2am Pacific, targeting issues #3, #4, #10
- [x] **Autonomous agent prompt** — Drafted Level 2 autonomous prompt that triages `tech-debt` labeled issues, respects `needs-design-decision`/`deferred` labels, and uses issue-body-as-instructions pattern
- [x] **Enhanced issue template** — Added `Automation Hints` section (scope, do-not-touch, risk, max-files-changed, blocked-by, bail-if) to all 8 tech-debt issues (#2-#5, #7-#10)
- [x] **Label system** — Created `needs-design-decision` label; applied to design issues #1, #6, #11, #12
- [x] **`docs/OVERNIGHT_AGENT.md`** — Project-specific agent prompt, issue template, label conventions reference
- [x] **`~/.claude/rules/issue-driven-maintenance.md`** — Cross-project global rule for issue-driven maintenance pattern

### In Progress
- [ ] First overnight run scheduled for 2026-03-31 ~2am Pacific — will validate the pipeline

### Issues Encountered
- None — this was a planning/infrastructure session

### Next Session Should
1. **Review overnight agent results** — Check GitHub for PRs and/or issue comments from first run
2. **Swap to autonomous prompt** — If pipeline validates, update trigger prompt from task-list to autonomous version
3. **Retroactively update remaining issues** — Add `Automation Hints` to any new issues filed
4. **Keep `KNOWN_ISSUES.md` retired** — All items migrated to GitHub Issues

---

## Session: 2026-03-24 11:45 (All 9 Campaign Levels — Skeleton Build Sprint)

### Completed
- [x] **Phase 1 audit & roadmap update** — Verified Phase 1 Beach port is COMPLETE (14/16 criteria, 2 minor deferrals). Updated ROADMAP_V3 with audit notes rather than retroactively checking granular sub-steps.
- [x] **Multi-genre architecture** — `AnyLevelConfig` discriminated union, `getAnyLevelConfig()`, genre-keyed scene factory in App.tsx, Arcade Physics added to Phaser game config.
- [x] **Dev unlock all levels** — `DEV_UNLOCK_ALL` flag (active in dev mode) bypasses linear unlock progression.
- [x] **Level 2 — City Heights (Platformer)** — Mario-style L/R/jump, procedural platform generation, parallax city buildings with lit windows, coins, fall death + respawn, distance-based victory (15k px to penthouse).
- [x] **Level 3 — Countertop Chaos (Launcher)** — Angry Birds slingshot aiming with trajectory preview, 3 material types (glass/wood/metal), 4 structure templates, 5 rounds, score-based victory.
- [x] **Level 4 — Cardboard Cosmos (Shooter)** — Galaga-style wave formations, auto-fire, 5 waves + boss wave (Mouse King 20HP), deferred destroy pattern to prevent Phaser iterator corruption.
- [x] **Level 5 — Yarn Ball Bounce (Breakout)** — Paddle + yarn ball, 70 rainbow bricks (7 rows), angle reflection, ball speed escalation, clear-all victory.
- [x] **Level 6 — Busy Crossing (Frogger)** — 4 road lanes + 4 water lanes, discrete grid movement, ride logs, 60s timer, 3 crossings to win.
- [x] **Level 7 — Garden Patrol (Whack-a-Mole)** — 3x3 hole grid, click/tap mice, 3 mouse types, combo multiplier, 60s timer, score-based victory.
- [x] **Level 8 — Garden Snake (Snake)** — Grid movement, grow tail on eat, wall/self collision, speed escalation, survive 2 min to win.
- [x] **Level 9 — The Cat Tree (Climber)** — Doodle Jump-style auto-bounce, solid/spring/breakable platforms, auto-scroll acceleration, sky gradient shift, 10k px to victory.

### Issues Encountered
- **Phaser Arcade Physics missing** — PhaserGame.tsx had no `physics` config (RunnerScene uses custom physics). Added `physics: { default: 'arcade' }` to fix blank screen on platformer.
- **ShooterScene freeze** — Destroying enemies mid-Phaser-Group-iterate corrupted the iterator. Fixed with deferred destroy pattern (mark inactive → flush after all iteration).
- **Wave transition bug** — `checkWaveComplete()` ran every frame while enemies were 0, incrementing wave index repeatedly. Fixed with `waveTransitioning` guard flag.

### Next Session Should
1. **User brain dump** — Matt will test all 9 levels and provide high-level feedback/priorities
2. **Visual polish pass** — All levels use placeholder graphics (colored rectangles). Sprite art, better backgrounds, themed particles needed.
3. **Audio per genre** — Each level needs its own music mood + genre-appropriate SFX
4. **Game feel tuning** — Difficulty curves, scoring balance, victory thresholds per level
5. **Phase 2 (Campaign Screen)** and **Phase 3 (Sprite Pipeline)** still deferred but may become priority depending on feedback

---

### Checkpoint: 2026-03-24 10:35

**Currently Working On:** Level 2 (City Heights) — procedural platformer + multi-genre architecture

**Status:**
- [x] Audited Phase 1 Beach port — marked COMPLETE in ROADMAP_V3 (14/16 done, telemetry + speed lines deferred)
- [x] Added `PlatformerLevelConfig` type system (`types.ts`) — generation params, theme, player config
- [x] Created `levels/rooftops.ts` — night city theme, procedural platform params, double jump, 15k px victory
- [x] Created `scenes/PlatformerScene.ts` — Arcade Physics, Mario-style L/R/jump, procedural platforms + coins, parallax city buildings, fall death + respawn, distance-based victory
- [x] Multi-genre scene routing — `getAnyLevelConfig()`, App.tsx branches sceneFactory by genre
- [x] Added Arcade Physics to Phaser game config (was missing — RunnerScene uses custom physics)
- [x] Dev unlock all levels via `import.meta.env.DEV` flag
- [x] Added ROOFTOPS to `LEVEL_ORDER` in catalog
- [ ] Level 3 (Countertop Chaos) — launcher genre, next up

**If Resuming:**
1. Start Level 3 (KITCHEN / launcher genre) — follow same pattern: config + scene + register
2. All 76 tests passing, 0 type errors as of checkpoint
3. PlatformerScene is playable but bare bones — enemies, moving platforms, boss, art TBD

**Files Modified:**
- `types.ts` — PlatformerLevelConfig, PlatformGenerationConfig, PlatformerThemeConfig, AnyLevelConfig union
- `levels/rooftops.ts` — NEW: rooftops level config
- `scenes/PlatformerScene.ts` — NEW: ~400 line platformer scene
- `scenes/shared/bridgeProtocol.ts` — PlatformerSceneInitData
- `scenes/shared/SceneBridge.ts` — re-export PlatformerSceneInitData
- `levels/index.ts` — ROOFTOPS in registry, getAnyLevelConfig()
- `levels/catalog.ts` — ROOFTOPS in LEVEL_ORDER
- `components/PhaserGame.tsx` — Arcade Physics in game config
- `components/LevelSelection.tsx` — devUnlockAll prop
- `App.tsx` — genre-based scene routing, DEV_UNLOCK_ALL, null guards for non-runner levels
- `ROADMAP_V3.md` — Phase 1 marked COMPLETE with audit notes

## Session: 2026-03-22 17:00 (Phase 1.5 Polish Complete + Merge to Main)

### Completed
- [x] **Character Sprite System** — added shared architecture section to ROADMAP_V3, reworked Phase 3 from programmatic transforms to AI sprite generation pipeline, added sprite stubs to all 9 level phases
- [x] **Phase 0 verified** — confirmed all 49 Phase 0 tasks (Phaser install, V3 types, SceneBridge, PhaserGame, SpriteLoader, persistence migration, levelCompletion) already implemented; checked off in roadmap
- [x] **Background entity rebalancing** — sizes reduced ~50%, Y ranges corrected (clouds/planes in sky band, boats/surfers on ocean band), speeds reduced to convey distance
- [x] **Ground obstacle alignment** — fixed rendering formula: `groundYScreen - (entityY - themeGroundY)` so obstacles sit ON the ground, not 100px above
- [x] **Bidirectional pause** — transport buttons now sync to RunnerScene via `applyRuntimePatch({isPaused})`; keyboard P/ESC already worked via HudUpdatePayload bridge
- [x] **VFD-style HUD** — moved HUD from CRT glass overlay to dark shelf in TV bezel; green VFD score counter, red LED life dots, amber multiplier, CH03 indicator
- [x] **Shell throw fix** — bullets and defeat poop animation used old rendering formula; same groundY offset fix applied
- [x] **Merged `phase-1.5-beach-polish` into `main`** — 24 commits, clean merge

### Issues Encountered
- Rendering coordinate bug was pervasive: every `groundYScreen - entityY` needed `- themeGroundY` offset. The DOM engine uses y=groundY as "at ground" but the Phaser port was treating it as "groundY pixels above ground zero". Fixed in 8 locations across obstacles, boss, bullets, and defeat poops.

### Next Session Should
1. **Visual QA** — run `npm run dev` and play through Beach level to verify all fixes look correct
2. **Begin Phase 1 tasks** from ROADMAP_V3 — RunnerScene skeleton already exists, start porting player physics (Task 1.2)
3. **Consider sprite regeneration** — current Gemini-generated sprites are functional but not great; explore better prompts or tools
4. Phase 3 (sprite generation pipeline) can start any time after Phase 1 Beach port parity

---

## Session: 2026-03-22 16:30 (Character Sprite System — Roadmap Architecture)

### Completed
- [x] Added "Character Sprite System" shared section to ROADMAP_V3 — establishes per-level AI sprite generation architecture, IndexedDB storage model (compound keys: `{catDesignId}:{levelId}:{poseId}`), fallback strategy, and closet evolution
- [x] Added Task 1.14: Beach Sprite Requirements to Phase 1 — defines 5 runner poses (run, jump, duck, hit, idle) with prompt strategy and validation criteria
- [x] Reworked Phase 3 entirely — replaced `catPoseTransforms` (programmatic crop/flip) with "Character Sprite Generation Pipeline" (5 tasks: storage, generator service, PhaserGame integration, closet UI, level config)
- [x] Updated Genre Level Template to include sprite requirements as step 2
- [x] Added preliminary sprite requirement stubs to all 8 level tasks (Tasks 4–11)
- [x] Updated File Map: `catPoseTransforms.ts` → `catSpriteGenerator.ts`

### Design Decisions
- **Per-sprite, not sprite-sheet:** Gemini generates one pose at a time (not a batch sheet) — more reliable for AI generation
- **Lazy generation:** Sprites generate on first level entry, cached for replay. Optional eager "generate all" from closet
- **Fallback always works:** Missing sprites use base equipped sprite — game is always playable with single sprite
- **Movement lists are level-specific:** Can't spec sprites until the level's mechanics are built, so sprite reqs are defined during each level phase, not upfront
- **Base prompt = closet identity:** The existing cat description + reference image becomes the seed for all per-level sprite generation

### Issues Encountered
- None — this was a planning/roadmap session

### Next Session Should
1. **Continue Phase 1.5 visual polish** — obstacle ground alignment, background entity rebalancing, HUD into TV bezel, P/ESC pause wiring (from previous session's list)
2. After Phase 1.5 visual polish → merge `phase-1.5-beach-polish` into main
3. Begin Phase 0 tasks from ROADMAP_V3 (Phaser install, V3 types, SceneBridge)
4. Task 1.14 (Beach sprite validation) can happen any time after sprite generation pipeline exists (Phase 3)

---

## Session: 2026-03-22 16:00 (Phase 1.5: Beach Polish — Implementation + TV Frame Debugging)

### Completed
- [x] All 10 Phase 1.5 plan tasks implemented via subagent-driven development (Tasks 1-9 code, Task 10 verification)
- [x] 15 sprites generated via nanobanana MCP, flood-fill bg removal pipeline established
- [x] Phaser canvas ↔ CRT TV frame integration solved: `parent: null` + manual `appendChild` + `enforceCanvasFill`
- [x] Sky gradient replaced with Phaser Graphics (generated asset had black borders baked in)
- [x] Tile sprites (sand, ocean, foam) restored as fully opaque — tiles should never have bg removal
- [x] Functional TV transport buttons: PLAY (resume), PAUSE, EJECT (main menu)
- [x] All ship checks pass: `tsc --noEmit` clean, 76 tests passing, build clean

### Issues Encountered
- Gemini image gen renders "transparent" as gray/white checkerboard baked into pixels — requires post-processing
- Phaser Scale manager fights with CSS canvas sizing; 6 approaches tried before finding working solution
- `sky-gradient.png` had a small sky window baked into a mostly-black image, looked like a viewport bug
- Tile sprites (sand/ocean/foam) destroyed by threshold bg removal — tiles need to stay fully opaque

### Remaining Visual Issues (pre-Phase 2)
- **Ground obstacles (crab, beachball, sandcastle) not on player baseline** — they float above the ground
- **Birds/planes spawn too low** — should be higher in sky area
- **Boat too high + too large** — floats in sky, oversized for the wider viewport
- **Sand Monster position** — floating high, should be grounded or repositioned
- **Background entity sizes need rebalancing** — sprites sized for old narrow viewport are too big at 960x720
- **Background entity speed too fast** — boats/planes are in the distance, should scroll slower (reduce speedMultiplier)
- **HUD (score/lives) should integrate into TV bezel** — currently floating inside CRT glass
- **Pause overlay gone** — P/ESC keyboard pause lost; needs rewiring or integration into TV buttons

### Next Session Should
1. **Fix obstacle ground alignment** — land obstacles must share cat's baseline (spawnY / render anchor)
2. **Rebalance background entity sizes and Y ranges** for 960x720 viewport (boats/planes/clouds)
3. **Move HUD into TV bezel area** (above CRT glass, part of the TV body, not floating on screen)
4. **Wire P/ESC to PAUSE button** — keyboard pause triggers same handler as TV PAUSE button
5. **Reduce ENTITY_SCALE or obstacle definition sizes** to fit wider viewport proportions
6. **Consider regenerating sprites** with better tools or manual art — Gemini quality is functional but not great
7. After visual polish complete → merge `phase-1.5-beach-polish` into main → begin Phase 2

---
