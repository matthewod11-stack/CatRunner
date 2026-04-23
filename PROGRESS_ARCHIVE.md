# Progress Archive — Beach Kitty

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

## Session: 2026-03-19 (V2 completion audit — fixes + doc sync)

**Focus:** Post–V2 audit fixes: boss victory no longer calls `onScoreUpdate` after `onVictoryFinalize` (lives refill preserved). Indexed `handleIndexedSave` guards `putCatSprite`, repairs missing dedup blobs, equips by `assetId` only when blob exists. `stopMusic` closes the correct `AudioContext` and clears pending timers. Beach `SEAGULL` harmful for body collisions. `services/blobContentKey.test.ts` typed for `tsc --noEmit`. Docs: [ROADMAP_V2.md](ROADMAP_V2.md) phase table, [AGENTS.md](AGENTS.md) / [CLAUDE.md](CLAUDE.md) Vitest truth, [docs/QA_CHECKLIST.md](docs/QA_CHECKLIST.md), [KNOWN_ISSUES.md](KNOWN_ISSUES.md) V2-9–12. **`npm run test:run`**, **`npm run build`**, **`npx tsc --noEmit`** pass. **Manual:** run [docs/QA_CHECKLIST.md](docs/QA_CHECKLIST.md) in browser before release.

---

## Session: 2026-03-19 (KNOWN_ISSUES closure — closet delete, migration lock, strict deferral)

**Focus:** Indexed closet **delete** now persists via **`handleClosetLookDelete`** (localStorage + **`deleteCatSprite`** after write); **`CatCustomizer`** async **`deleteLook`** + dirty snapshot. **`migrateCatStorageIfNeeded`** uses **`navigator.locks.request('beach-kitty-cat-migration-v1')`** when available. **[KNOWN_ISSUES.md](KNOWN_ISSUES.md)** open list cleared; V2-6 resolved as already capped; V2-7 closed as documented **`strict`** deferral. `npm test` + `npm run build` pass.

---

## Session: 2026-03-19 (ROADMAP V2 complete — must-fix closure)

**Focus:** **`mergeLevelTuning`** in **`levels/catalog.ts`** — **`App`** and **`GameEngine`** both use it (replacing duplicated `{ ...store, ...tuningOverrides }`). Boss entry / HUD / sky stay tied to **`getBossEntryCoinThreshold(levelConfig, merged)`**. New **[docs/LEVEL_RUNTIME.md](docs/LEVEL_RUNTIME.md)** (authoritative runtime contract); **`levels/catalog.test.ts`** extended; **`ROADMAP_V2.md`** must-fix items + status banner. `npm run build` + `npm test` pass.

---

## Session: 2026-03-19 (ROADMAP V2 Phase 2 — API protection)

**Focus:** `/api/cat/*` rate limits, body caps, client/server timeouts, prompt hardening

### Completed
- [x] [`server/catApiProtection.ts`](server/catApiProtection.ts): body byte cap, per-client sliding-window limits (generate vs text routes), `x-forwarded-for` / `x-real-ip` client id
- [x] Dev [`server/devApiMiddleware.ts`](server/devApiMiddleware.ts): bounded JSON read + 400 on invalid JSON; Vercel routes use [`runCatApiVercelPreflight`](server/catApiVercelPreflight.ts)
- [x] [`services/geminiService.ts`](services/geminiService.ts): `AbortController` fetch timeouts; optional `VITE_CAT_API_CLIENT_TIMEOUT_MS`
- [x] [`server/geminiGateway.ts`](server/geminiGateway.ts): `GEMINI_TEXT_TIMEOUT_MS` / `GEMINI_IMAGE_TIMEOUT_MS` via `Promise.race`
- [x] [`server/prompts/customCatSprite.ts`](server/prompts/customCatSprite.ts): sanitization + delimiter isolation + instruction reinforcement; new error codes `RATE_LIMITED`, `REQUEST_TIMEOUT` in [`types/catGenerateApi.ts`](types/catGenerateApi.ts)
- [x] [docs/API_PROTECTION.md](docs/API_PROTECTION.md); Vitest for protection + prompt helpers

### Next
- ROADMAP V2 Phase 3 (gameplay consistency) or stronger production rate limiting (shared store / Edge)

---

## Session: 2026-03-19 (ROADMAP V2 Phase 1 — correctness)

**Focus:** Data integrity, victory score, cat assets, hooks, Vitest scaffold

### Completed
- [x] `VictoryFinalizePayload` + `onVictoryFinalize` in `GameEngine` / `App` (no stale React score on victory); functional `setHighScores` for game over and victory
- [x] `CatCustomizerLegacy` extract (Rules of Hooks); indexed delete resets preview; duplicate closet save guard; static `catAssetStore` import in `blobToDataUrlFromAsset`
- [x] `migrateCatStorageIfNeeded`: legacy keys cleared only after successful writes / matching blob puts; re-read v1 state before write
- [x] `getCatSprite` / `deleteCatSprite` resolve on errors; boot repairs missing equipped blob via `writeCatCharacterState`
- [x] Vitest + `services/catAssetStore.test.ts`, `levels/catalog.test.ts`, `services/migrateCatStorage.test.ts`; `tsconfig` excludes `dist`
- [x] `KNOWN_ISSUES.md` updates; TypeScript `strict` explicitly deferred (large backlog)

### Next
- ROADMAP V2 Phase 2 (API protection) or expand test coverage / strict-mode incremental fixes

---

## Session: 2026-03-19 (Roadmap V2 handoff)

**Focus:** Archive completed roadmap, create active `ROADMAP_V2.md`, and repoint repo docs/scripts

### Completed
- [x] Created [ROADMAP_V2.md](ROADMAP_V2.md) as the new active roadmap based on the post-review action plan
- [x] Archived the completed roadmap to [docs/ROADMAP_V1_COMPLETE.md](docs/ROADMAP_V1_COMPLETE.md)
- [x] Replaced root [ROADMAP.md](ROADMAP.md) with a roadmap index pointing to active and archived roadmap files
- [x] Updated [README.md](README.md), [AGENTS.md](AGENTS.md), [CLAUDE.md](CLAUDE.md), [KNOWN_ISSUES.md](KNOWN_ISSUES.md), [scripts/dev-init.sh](scripts/dev-init.sh), and [docs/ROADMAP.md](docs/ROADMAP.md) to use the new roadmap structure

### Next
- Work from [ROADMAP_V2.md](ROADMAP_V2.md) starting with Phase 1: correctness and data integrity

---

## Session: 2026-03-19 (Phase 8 — Documentation and polish)

**Phase:** 8 — Documentation and polish (final roadmap phase alongside completed Phase 9)
**Focus:** Contributor docs for levels and behaviors; twin agent files + README

### Completed
- [x] [docs/LEVEL_DEVELOPMENT.md](docs/LEVEL_DEVELOPMENT.md) — checklist for new `LevelId`, config, registry, art, boss, verification
- [x] [docs/BEHAVIOR_SYSTEM.md](docs/BEHAVIOR_SYSTEM.md) — `BehaviorType` table, helpers, collision flow, boss projectiles
- [x] [CLAUDE.md](CLAUDE.md), [AGENTS.md](AGENTS.md) — “Documentation for contributors”, `LevelSelection`, roadmap 1–9 note, seagull line sync
- [x] [README.md](README.md) — links to level + behavior docs; roadmap wording
- [x] [ROADMAP.md](ROADMAP.md), [features.json](features.json) — Phase 8 complete, `completedPhases: 9`

### Verified
- [x] `npm run build`

---

## Session: 2026-03-19 (Phase 7 — Level selection + unlock persistence)

**Phase:** 7 — Level Selection UI
**Focus:** `selectedLevel`, persisted `defeatedBosses`, `LevelSelection`, victory unlock messaging

### Completed
- [x] [levels/catalog.ts](levels/catalog.ts): `LEVEL_ORDER`, `isLevelUnlocked`, `getNextLevelId`, `getPreviousLevelId`; re-export from [levels/index.ts](levels/index.ts)
- [x] [services/levelProgress.ts](services/levelProgress.ts): `beach-cat-defeated-bosses-v1`, `loadDefeatedBosses` / `saveDefeatedBosses`
- [x] [components/LevelSelection.tsx](components/LevelSelection.tsx): level cards, lock/copy, cleared trophy, selection ring
- [x] [App.tsx](App.tsx): state, `handleVictory(..., levelBeat)`, `startGame` guard, `GameEngine` `key` + dynamic `levelId`/`levelConfig`, victory banner line
- [x] [ROADMAP.md](ROADMAP.md), [features.json](features.json): Phase 7 complete; next Phase 8

### Verified
- [x] `npm run build`

### Next
- Phase 8 — docs / polish per ROADMAP

---

## Session: 2026-03-19 (Pre–Phase 7 — Config-tighten seagull / magnet / boss shot)

**Focus:** Behavior composition for seagulls, config-driven poop drops and boss projectiles, `magnetAttractTypes`

### Completed
- [x] [types.ts](types.ts): `BehaviorConfig.projectileType`; `LevelConfig.magnetAttractTypes`; `BossConfig.projectileObstacleType`
- [x] [levels/beach.ts](levels/beach.ts): `dropProjectile` + `projectileType: 'SAND_PROJECTILE'`; `magnetAttractTypes: ['COIN']`; boss `projectileObstacleType`
- [x] [systems/levelBehaviorHelpers.ts](systems/levelBehaviorHelpers.ts): `pickSeagullSpawnVariant`, `resolveDropProjectileSpec`
- [x] [systems/behaviors.ts](systems/behaviors.ts): `checkPoopDrop` takes `DropProjectileSpawnSpec | null`
- [x] [systems/bossSystem.ts](systems/bossSystem.ts): `createBossProjectileObstacle` uses `projectileType` param
- [x] [components/GameEngine.tsx](components/GameEngine.tsx): seagull spawn from behaviors; magnet uses set; boss uses `projectileObstacleType`; dive stomp gated on `swoop`
- [x] [KNOWN_ISSUES.md](KNOWN_ISSUES.md): seagull split marked resolved

### Verified
- [x] `npm run build`

### Next
- Phase 7 — level selection UI

---

## Session: 2026-03-19 (Phase 6 — GameEngine abstraction)

**Phase:** 6 — GameEngine Abstraction
**Focus:** Optional `levelConfig` from App; behavior-driven stomp/slow/projectile physics; boss logic + lazy boss UI

### Completed
- [x] [types.ts](types.ts): `BehaviorType` adds `stomp`, `arcProjectile`; `BossComponentId`; `ThemeConfig.groundKickParticles`; `BossConfig.componentId`
- [x] [levels/beach.ts](levels/beach.ts): CRAB `stomp`, SAND_PROJECTILE `arcProjectile`, `groundKickParticles`, `componentId: 'sandMonster'`
- [x] [systems/levelBehaviorHelpers.ts](systems/levelBehaviorHelpers.ts): `obstacleHasBehavior`
- [x] [systems/bossSystem.ts](systems/bossSystem.ts): spawn rate, `createBossProjectileObstacle`, boss pose / facing helpers
- [x] [systems/bossComponents.tsx](systems/bossComponents.tsx): `LA

## Session: 2026-03-19 (Phase 5 — Obstacle refactor + LevelContext)

**Phase:** 5 — Obstacle Component Refactor
**Focus:** Beach visuals in `levels/beach/obstacles.tsx`; shared pickups stay in `ObstacleComponent`

### Completed
- [x] [contexts/LevelContext.tsx](contexts/LevelContext.tsx): `LevelProvider`, `useLevelContext`
- [x] [components/GameEngine.tsx](components/GameEngine.tsx): root wrapped with `LevelProvider levelId={levelId}`
- [x] [levels/beach/obstacles.tsx](levels/beach/obstacles.tsx): `BeachObstacleIcon`, `isBeachObstacleType`, seagull PNG processing + CRAB…PALM_TREE + SAND_PROJECTILE
- [x] [components/ObstacleComponent.tsx](components/ObstacleComponent.tsx): delegates beach types when `levelId === 'BEACH'`; COIN / SHELL / power-ups unchanged; removed dead `REFEREE` yPos branch
- [x] [levels/index.ts](levels/index.ts): re-export `BeachObstacleIcon`, `isBeachObstacleType`
- [x] [ROADMAP.md](ROADMAP.md): Phase 5 complete; next focus Phase 6

### Verified
- [x] `npm run build` passes

### Next Session Should
- **Phase 6** per [ROADMAP.md](ROADMAP.md): GameEngine abstraction / boss system

---

## Session: 2026-03-19 (Phase 4 — GameEngine consumes level config)

**Phase:** 4 — Level Configuration Structure
**Focus:** Single runtime source of truth from `BEACH_LEVEL_CONFIG` / `LEVEL_REGISTRY`

### Completed
- [x] [levels/index.ts](levels/index.ts): `LEVEL_REGISTRY`, `getLevelConfig`
- [x] [components/GameEngine.tsx](components/GameEngine.tsx): `levelConfig` from `LEVEL_REGISTRY[levelId]` — patterns, `harmfulTypes`, `groundY` / theme, boss fight (health, damage, sway/bob, projectiles), background spawn intervals, weighted obstacle pool from `spawnWeight`, obstacle + background entity dimensions from config
- [x] [levels/beach.ts](levels/beach.ts): SEAGULL `spawnY.min` aligned to 350 (doc parity with dive heights)
- [x] [ROADMAP.md](ROADMAP.md), [features.json](features.json) updated; Phase 4 complete

### Verified
- [x] `npm run build` passes

### Next Session Should
- **Phase 5** per [ROADMAP.md](ROADMAP.md): `levels/beach/obstacles.tsx`, `LevelContext`, refactor `ObstacleComponent`

---

## Session: 2026-03-19 (Documentation reconciliation)

**Phase:** N/A — housekeeping
**Focus:** Canonical tracking docs at repo root; align handoff with codebase

### Completed
- [x] Moved **ROADMAP.md**, **PROGRESS.md**, and **KNOWN_ISSUES.md** to **repo root** (single source of truth)
- [x] Replaced `docs/ROADMAP.md`, `docs/PROGRESS.md`, `docs/KNOWN_ISSUES.md` with short stubs linking to root
- [x] Reconciled [ROADMAP.md](./ROADMAP.md): phase table, Phase 2/4/9 checklists, Phase 4 “done vs remaining”
- [x] Merged duplicate progress logs into this file; added [AGENTS.md](./AGENTS.md) mirroring [CLAUDE.md](./CLAUDE.md)
- [x] Refreshed [README.md](./README.md) (dev panel, telemetry, contributor pointers)
- [x] Updated [scripts/dev-init.sh](./scripts/dev-init.sh) to require root tracking files

### Next Session Should
- **Primary:** Wire `components/GameEngine.tsx` to `BEACH_LEVEL_CONFIG` from `levels/beach.ts` (finish Phase 4 — remove duplicated `BEACH_PATTERNS` / `HARMFUL_TYPES`)
- **Then:** Phase 5 (ObstacleComponent + LevelContext) per [ROADMAP.md](./ROADMAP.md)
- Optional: playtest seagull/poop feel; spawn pacing; image import `.d.ts` cleanup

---

## Session: 2026-03-02 (Phase 3 + gameplay fixes)

**Phase:** 3 — Behavior System Library (complete) + play-test fixes
**Focus:** Collision/behavior wiring + projectile and seagull tuning

### Completed
- **Phase 3: Behavior System Library** — complete
  - `systems/behaviors.ts` — `computeSwoopY`, `checkPoopDrop`
  - `systems/collisionHandlers.ts` — `CollisionResult`, `handleBounceCollision`, `handleSlowCollision`, `handleHarmfulCollision`
  - Wired into `GameEngine.tsx` with `applyCollisionResult`; net reduction ~76 lines
- **Bug fixes (play-test):**
  - SAND_PROJECTILE gravity: `vy + gravity` → `vy - gravity` (match player physics)
  - Poop `vy` sign corrected so projectiles fall downward
  - Added `newY < -200` removal for projectiles leaving the top of the screen
  - Seagull spawn heights: dive 220/280 → 350/400; swoop trajectory adjusted; collision Y fallback aligned

### Verified
- [x] Committed as `3c417db` (projectile gravity, seagull heights, session tracking)

### Issues Encountered
- SAND_PROJECTILE gravity was inverted vs player physics (pre-existing)
- Seagull spawn heights were too low relative to the cat (pre-existing tuning)

### Next Session Should
- *(Superseded by later entries — see 2026-03-19 above.)*

---

## Session: 2026-03-01 (Phase 4 config file + Phase 3 behavior library)

**Phase:** 4 (partial) + 3
**Focus:** Declarative `BEACH_LEVEL_CONFIG`; extract behaviors and collision handlers

### Completed — Phase 4 (data-only, no runtime wiring yet)
- [x] `levels/beach.ts` — full `BEACH_LEVEL_CONFIG` (`LevelConfig`: obstacles, patterns, theme, boss, background, harmfulTypes)
- [x] `levels/index.ts` barrel re-export
- [x] Build passes; GameEngine still uses inline `BEACH_PATTERNS` / `HARMFUL_TYPES` until wired

### Completed — Phase 3
- [x] `systems/behaviors.ts` — `computeSwoopY`, `checkPoopDrop`
- [x] `systems/collisionHandlers.ts` — `CollisionResult`, three handlers
- [x] `GameEngine.tsx` — `applyCollisionResult`, ~76 lines net reduction

### Next Session Should
- *(Historical — Phase 9 and further fixes followed.)*

---

## Session: 2026-03-01 (Phase 9 Implementation)

**Phase:** 9 — Live Balancing + Telemetry (implementation)
**Focus:** Implemented all 8 tasks from the Phase 9 plan

### Completed
- [x] Task 1: `systems/tuning/defaultTuning.ts` — TuningProfile, DEFAULT_TUNING, TUNING_RANGES
- [x] Task 2: `systems/tuning/useTuningStore.ts` — React hook, localStorage, presets
- [x] Task 3: `systems/telemetry/runTelemetry.ts` — damage/death/run_summary + JSON export
- [x] Task 4: Wired tuning store into GameEngine — `tuning.*` replaces prior hardcoded constants
- [x] Task 5: Wired telemetry — `onTelemetryReady` callback
- [x] Task 6: `components/dev/BalancePanel.tsx` — sliders, presets, telemetry export
- [x] Task 7: `App.tsx` — backtick toggle, telemetry passthrough
- [x] Task 8: Verification, `features.json` update

### How to Use
- Backtick (`` ` ``) during gameplay toggles the dev balance panel
- Sliders tweak physics, spawning, difficulty, assist, boss parameters
- Named presets in `localStorage`; export telemetry JSON from the panel

### Files Created
```
systems/tuning/defaultTuning.ts
systems/tuning/useTuningStore.ts
systems/telemetry/runTelemetry.ts
components/dev/BalancePanel.tsx
```

### Files Modified
```
components/GameEngine.tsx
App.tsx
```

### Issues Encountered
- Pre-existing TS image import warnings (non-blocking)

### Next Session Should
- *(Superseded — Phase 2 types were already in `types.ts`; next technical work is Phase 4 wiring / Phase 5.)*

---
