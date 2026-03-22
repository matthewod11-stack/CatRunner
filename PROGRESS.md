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

## Session: 2026-03-19 (V2 completion audit — fixes + doc sync)

**Focus:** Post–V2 audit fixes: boss victory no longer calls `onScoreUpdate` after `onVictoryFinalize` (lives refill preserved). Indexed `handleIndexedSave` guards `putCatSprite`, repairs missing dedup blobs, equips by `assetId` only when blob exists. `stopMusic` closes the correct `AudioContext` and clears pending timers. Beach `SEAGULL` harmful for body collisions. `services/blobContentKey.test.ts` typed for `tsc --noEmit`. Docs: [ROADMAP_V2.md](ROADMAP_V2.md) phase table, [AGENTS.md](AGENTS.md) / [CLAUDE.md](CLAUDE.md) Vitest truth, [docs/QA_CHECKLIST.md](docs/QA_CHECKLIST.md), [KNOWN_ISSUES.md](KNOWN_ISSUES.md) V2-9–12. **`npm run test:run`**, **`npm run build`**, **`npx tsc --noEmit`** pass. **Manual:** run [docs/QA_CHECKLIST.md](docs/QA_CHECKLIST.md) in browser before release.

---

## Session: 2026-03-19 (KNOWN_ISSUES closure — closet delete, migration lock, strict deferral)

**Focus:** Indexed closet **delete** now persists via **`handleClosetLookDelete`** (localStorage + **`deleteCatSprite`** after write); **`CatCustomizer`** async **`deleteLook`** + dirty snapshot. **`migrateCatStorageIfNeeded`** uses **`navigator.locks.request('beach-kitty-cat-migration-v1')`** when available. **[KNOWN_ISSUES.md](KNOWN_ISSUES.md)** open list cleared; V2-6 resolved as already capped; V2-7 closed as documented **`strict`** deferral. `npm test` + `npm run build` pass.

---

## Session: 2026-03-19 (ROADMAP V2 complete — must-fix closure)

**Focus:** **`mergeLevelTuning`** in **`levels/catalog.ts`** — **`App`** and **`GameEngine`** both use it (replacing duplicated `{ ...store, ...tuningOverrides }`). Boss entry / HUD / sky stay tied to **`getBossEntryCoinThreshold(levelConfig, merged)`**. New **[docs/LEVEL_RUNTIME.md](docs/LEVEL_RUNTIME.md)** (authoritative runtime contract); **`levels/catalog.test.ts`** extended; **`ROADMAP_V2.md`** must-fix items + status banner. `npm run build` + `npm test` pass.
