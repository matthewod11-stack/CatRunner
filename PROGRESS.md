# Beach Kitty Multi-Level System — Session Progress Log

> **Purpose:** Track progress across development sessions. Each session adds an entry at the TOP.
> **Related Docs:** [ROADMAP_V3.md](./ROADMAP_V3.md) | [KNOWN_ISSUES.md](./KNOWN_ISSUES.md) | [docs/ROADMAP_V1_COMPLETE.md](./docs/ROADMAP_V1_COMPLETE.md)

---

## **ACTIVE ROADMAP**

```
./ROADMAP_V3.md
```

**Start with `ROADMAP_V3.md` for active work.** V2 is complete. V1 archived at `docs/ROADMAP_V1_COMPLETE.md`.

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

## Session: 2026-03-22 13:00 (Phase 1.5: Beach Polish — Implementation)

### Completed
- [x] Generated 13 environment sprites via nanobanana MCP (sand, ocean, foam, sky, sun, clouds, boats, planes, surfer, jetski)
- [x] Generated 2 gameplay sprite variants (crab-2, seagull-2) with green-screen chroma key pipeline
- [x] Added PhasedPattern type, maxSpeed tuning (8.5), reduced speedIncrement (0.0003), HudUpdatePayload
- [x] Converted beach patterns to phase-tagged format (early/mid/late/any), boss HP 20, coin threshold 25, cloud Y fix
- [x] Fixed render-anchoring with ENTITY_SCALE 0.6 — sprites 40% smaller, collision hitboxes scaled to match
- [x] Sprite-based environment layers (sky gradient, ocean, waterline foam, textured sand, pulsing sun, cloud variants)
- [x] Background entities now use Image sprites instead of Graphics rectangles (boats bob, planes have variants)
- [x] JVC CRT/VHS combo TV frame restyle (boxy gray plastic, black CRT bezel, scanlines, green OSD, VCR section, speaker grille)
- [x] Shell ammo boss fight system (shells = ammo not coins, 5-hit boss, discoverability hint, HUD counter, boss-phase shell spawns)
- [x] Phase-weighted pattern selection (early <20s, mid <40s, late 40s+), speed clamped at maxSpeed
- [x] All ship checks pass: `tsc --noEmit` clean, 76 tests passing, build clean

### Key Commits (branch: phase-1.5-beach-polish)
1. `4171773` art: add environment sprites for Phase 1.5 beach polish
2. `7311ae9` art: add crab and seagull sprite variants
3. `016275b` types+tuning: PhasedPattern, HudUpdatePayload, maxSpeed 8.5, speedIncrement 0.0003
4. `8f9faa6` config: phase-tagged patterns, boss HP 20, coin threshold 25, cloud Y fix
5. `7a8e7a7` fix: render-anchor ground alignment, ENTITY_SCALE 0.6, speed clamp, wider spawn margin
6. `3078f45` feat: sprite-based environment layers with parallax and entity variants
7. `b13abf9` style: restyle TV frame to JVC CRT/VHS combo aesthetic
8. `85d9f14` feat: shell ammo boss fight system with HUD, 5-hit boss, discoverability hint
9. `324f388` feat: phase-weighted pattern selection, elapsed-time difficulty curve
10. `3da1aa0` fix: catalog test for bossEntryCoinThreshold

### Next Session Should
- Playtest the beach level end-to-end with the new visuals and boss fight
- Merge `phase-1.5-beach-polish` into main after playtesting
- Begin Phase 2: next genre level implementation

---

## Session: 2026-03-22 11:00 (Phase 1.5: Beach Polish — Design & Planning)

### Completed
- [x] Playtested Phaser BEACH runner, identified 8 visual/gameplay issues
- [x] Brainstormed and designed Phase 1.5 polish mini-phase (with visual companion mockups)
- [x] Decided on sprite-based environment art via nanobanana MCP (option C — highest quality)
- [x] Designed JVC CRT/VHS combo TV frame from user-provided reference photo
- [x] Designed shell-ammo boss fight system (5-hit fight, shells as ammo + score)
- [x] Designed composition-based difficulty curve (constant speed, 3 phases: early/mid/late)
- [x] Wrote and reviewed design spec (3 review iterations, all issues resolved)
- [x] Wrote and reviewed implementation plan (2 review iterations, 18 total issues fixed)
- [x] All ship checks pass: `tsc --noEmit` clean, 76 tests passing, build clean

### In Progress
- Nothing in progress — all planning complete, ready for implementation

### Key Files
- **Design spec:** `docs/superpowers/specs/2026-03-22-phase-1.5-beach-polish-design.md`
- **Implementation plan:** `docs/superpowers/plans/2026-03-22-phase-1.5-beach-polish.md`
- **Visual mockups:** `.superpowers/brainstorm/` (gitignored)

### Next Session Should
1. **Start implementation using subagent-driven-development** — invoke `superpowers:subagent-driven-development` skill
2. **Read the plan first:** `docs/superpowers/plans/2026-03-22-phase-1.5-beach-polish.md`
3. **Begin with Task 1:** Generate environment sprites via nanobanana MCP (art-first approach)
4. **Then Task 2:** Generate crab/seagull sprite variants
5. **Then Tasks 3-9:** Code changes (types, tuning, config, coordinate fix, env layers, TV frame, boss fight, pacing)
6. **Task 10:** Final verification and ship check
7. nanobanana MCP is available for image generation — the art pipeline (generate + sharp background removal) is proven from Phase 1

---

## Machine Sync Note: 2026-03-22

> **`npm install` required** — `phaser@^3.90.0` was added as a dependency during the V3 port (Phase 0–1).
> Run `npm install` before `npm run dev`. ROADMAP_V3.md updated with full V3 plan.

---

## Session: 2026-03-21 14:00 (Phase 0 + Phase 1: Phaser port complete)

### Completed
- [x] **Phase 0 complete** — Phaser installed, SceneBridge + PhaserGame bridge, V3 types, campaign 3×3 grid screen, persistence migration, levelCompletion service
- [x] **Phase 1 complete (Tasks 1.1–1.12)** — Full BEACH runner ported to Phaser:
  - Player physics (custom per-frame matching DOM engine ±5%), input (keyboard + touch), pause
  - Obstacle spawning (weighted pool, patterns, life-assist, safe-spawn grace)
  - Collectibles + scoring (coins/shells/power-ups, streak/multiplier)
  - Collision detection (manual AABB with forgiveness padding, stomp/bounce/slow/harmful)
  - Seagull behaviors (swoop via computeSwoopY, poop drops)
  - Boss fight (Sand Monster: movement, arc projectiles, health, defeat animation)
  - Background parallax (depth layers, chaos spawns)
  - EffectsManager (shake, flash, freeze frame, particles)
  - PhaserAudio (12 procedural SFX, music with tempo scaling + boss mode)
- [x] **Sprite art generated** via nanobanana MCP (Gemini): 9 sprites (cat, crab, coin, seagull, beachball, shell, sandcastle, sand-monster, palm-tree)
- [x] Background removal post-processing with sharp (Gemini bakes checkerboard as pixels)
- [x] Retro TV/VCR frame for Phaser canvas with CRT scanlines and screen glare
- [x] HUD moved inside TV screen bezel with dark translucent CRT style
- [x] Phaser runner is now the default (add `?dom_runner` for DOM fallback)
- [x] Campaign screen design spec written: `docs/superpowers/specs/2026-03-21-campaign-screen-design.md`

### Key Learnings
- Nanobanana MCP: use `conversation_id` + `use_image_history` for session consistency; "transparent background" in prompts doesn't produce actual transparency — need sharp post-processing
- Custom per-frame physics (not Phaser Arcade) was the right call for jump/float parity
- SceneBridge split into bridgeProtocol.ts (importable in Node tests) + SceneBridge.ts (needs browser)
- CAMPAIGN_LEVEL_META (display) vs LEVEL_REGISTRY (runtime) split prevents crashes on unimplemented levels

### Stats
- RunnerScene.ts: 1,714 lines (matching GameEngine.tsx's ~1,630)
- Tests: 76 passing (up from 56 baseline), 0 failing
- New files: 12 created (scenes/, assets/sprites/, services/)
- Sprites: 9 generated + cleaned

### Next Session Should
- Playtest Phaser runner thoroughly against the 16 Beach Port Exit Criteria
- Fix remaining visual gaps: background entities (still gray shapes), sprite animations
- Task 1.13 (archive GameEngine) — gated on parity verification + bridge reuse proof
- Consider starting Phase 2 (second level) to prove bridge reuse

---

## Session: 2026-03-21 13:00 (Campaign screen live review + smoke verification)

### Completed
- [x] Started local dev server from current worktree on port 3001 and reviewed the live campaign screen + BEACH gameplay entry flow
- [x] Captured campaign and in-run screenshots:
  - `output/review-direct-menu.png`
  - `output/review-direct-run.png`
- [x] Verified no browser console errors during the smoke flow (`output/review-direct-errors.json`)
- [x] Verified ship checks still pass on current branch:
  - `npm run test:run` → 76/76 tests passing
  - `npx tsc --noEmit` → clean

### Review Findings
- Hall of Fame still stores `levelId` but does not render it or group scores by level; raw-score sort remains cross-genre ambiguous
- Campaign star UI is still placeholder-only (`totalStars = 0`, cleared tiles always show `★★★`) even though `services/levelCompletion.ts` exists
- `handleGameOver` writes `levelId: selectedLevel` but omits `selectedLevel` from the callback dependency list, which will become a stale-closure bug once a second playable level exists
- Campaign progression has two sources of truth (`CAMPAIGN_LEVEL_META` vs `LEVEL_ORDER`), and `LEVEL_ORDER` is still `['BEACH']`, so progression logic is not aligned with the 9-node campaign UI yet

### Next Session Should
1. Fix the Hall of Fame presentation to surface `entry.levelId` before more playable genres land
2. Wire `CampaignScreen` to `services/levelCompletion.ts` so tile stars and footer totals reflect real saved progress
3. Clean up progression state naming (`defeatedBosses` → `completedLevels`) and collapse campaign ordering into one authoritative source
4. Add at least one component/browser test for the campaign screen states (implemented, locked, coming soon, completed)

## Session: 2026-03-20 12:00 (Roadmap V3 hardening + new machine setup)

### Completed
- [x] Set up repo on new machine — installed deps, verified .env.local, started dev server (port 3001)
- [x] Established baseline: 56 tests passing, build clean, tsc clean
- [x] Bootstrapped project memory for this machine (V3 plan, tech stack, video factory reference)
- [x] **Major ROADMAP_V3.md hardening** — 7 new front-matter sections + 7 task modifications:
  - Added: Current Baseline, Shared Phaser Contract, React→Phaser Runtime Sync Rules, Level Config Model, Beach Port Exit Criteria, Fallback Policy, Score Semantics
  - Task 0.2: Replaced "add optional fields to LevelConfig" → `CampaignLevelMeta` + `RunnerLevelConfig` split
  - Task 0.3: Made SceneBridge genre-agnostic (only `levelId` + `catSpriteUrl`); runner fields → `RunnerSceneInitData`
  - Task 0.4: Made PhaserGame generic; added `applyRuntimePatch` effect for post-boot updates
  - Task 0.8: Added scope note — persistence migration independent from Hall of Fame/LevelResult
  - Task 1.12: Fixed `mattedCatUrl` → `customCatUrl` + `equippedMattedState` (matches actual app state)
  - Task 1.13: Made archiving conditional — gated on beach parity + bridge reuse proof
  - Phase 9 Task 17: Added deterministic Playwright support (`__GAME_TEST_API`)
- [x] Integrated DaVinci Resolve video factory (`demo-video-factory-catrunner/`) into cutscene pipeline references

### Issues Encountered
- PROGRESS.md was overwritten by a prior review session on the other machine — restored from git HEAD

### Next Session Should
1. **Execute Phase 0** of ROADMAP_V3.md — the plan is now hardened and ready for implementation
2. Tasks 0.1–0.9 have clear boundaries — ideal for subagent-driven parallel development
3. Start with Task 0.1 (install Phaser, configure Vite) as the unblocking prerequisite
4. Consider using `demo-video-factory-catrunner/` to produce the BEACH intro cutscene video as a proof-of-concept

---

## Session: 2026-03-20 (Roadmap review — live inspection + findings)

**Focus:** Reviewed ROADMAP_V3.md against live codebase via Playwright inspection. Identified 7 categories of drift between the roadmap and current app state: runner-specific concepts baked into "generic" bridge, `propsRef` insufficient for runtime sync, LevelConfig god-config risk, premature archiving, `mattedCatUrl` snippet drift, missing exit criteria, missing test determinism. Findings fed directly into the hardening session above.

---

## Session: 2026-03-19 15:00 (V3 Spec Design + Implementation Plan)

### Completed
- [x] Walked through all 9 open questions in ROADMAP_V3_SPEC.md — decisions validated and documented
- [x] Design spec written: `docs/superpowers/specs/2026-03-19-v3-open-questions-design.md`
  - Spec reviewed twice by automated reviewer (10 issues → 0), then user-reviewed (3 findings → fixed)
  - Key decisions: feel-identical port, Phaser graphics primitives, code-defined levels, hybrid audio, desktop-primary, per-level stars, self-contained difficulty, static cutscenes, code-split scenes
- [x] Generic completion contract: `LevelCompletePayload` replaces boss-specific `VictoryFinalizePayload`
- [x] Persistence model: `completedLevels` replaces `defeatedBosses`, best-of merge for `LevelResult`, Hall of Fame gains `levelId`
- [x] Audio ownership: single AudioContext owned by Phaser, sfxService migrates in Phase 1
- [x] Implementation plan written: `ROADMAP_V3.md` (30 tasks across 10 phases)
  - Plan reviewed twice — fixed PhaserGame instantiation, event race condition, SceneInitData contract, phase ordering, LevelConfig evolution, twin-doc requirement
- [x] Parent spec updated: cutscene shape aligned, bridge language updated to `levelComplete`
- [x] Memory saved: DaVinci Resolve MCP connector for cutscene video production (other machine)

### Issues Encountered
- PhaserGame.tsx scene instantiation required careful design: inline scene config breaks prototype chain, autoStart races with event wiring, inline sceneFactory causes re-renders
- LevelId expansion from 1→9 values breaks `Record<LevelId, LevelConfig>` — needed `Partial<Record<...>>`

### Next Session Should
1. **Execute Phase 0** of ROADMAP_V3.md — install Phaser, define V3 types, create SceneBridge, PhaserGame wrapper, TestScene, docs, SpriteLoader, persistence migration, levelCompletion service
2. **Then Phase 1** — port Beach runner to Phaser RunnerScene (largest phase, ~13 tasks)
3. The plan is designed for subagent-driven development — Phase 0 tasks 0.1–0.9 have clear boundaries

---

*(Sessions older than 10 archived to [PROGRESS_ARCHIVE.md](./PROGRESS_ARCHIVE.md))*
