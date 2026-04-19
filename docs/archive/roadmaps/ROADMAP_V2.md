# Beach Kitty Roadmap V2 — Stabilization, Campaign Flow, and Polish

> **Purpose:** Active roadmap for the next phase of Beach Kitty after the completed multi-level/tooling push.
> **Related Docs:** [PROGRESS.md](./PROGRESS.md) | [KNOWN_ISSUES.md](./KNOWN_ISSUES.md) | [docs/ROADMAP_V1_COMPLETE.md](./docs/ROADMAP_V1_COMPLETE.md)

---

## Status

**Roadmap V2 is complete** (all [must-fix](#must-fix-before-calling-v2-complete) items done). This file remains the reference for what shipped; new work can start a V3 doc or extend KNOWN_ISSUES / PROGRESS.

Roadmap V1 is complete and archived at [`docs/ROADMAP_V1_COMPLETE.md`](./docs/ROADMAP_V1_COMPLETE.md).

This V2 roadmap focused on:
- fixing correctness and data-integrity issues found during review
- hardening the AI/image pipeline for reliability and abuse resistance
- tightening campaign flow, level-system authority, and gameplay consistency
- improving the customizer, UX, accessibility, and performance
- adding automated tests early (not only at the end of V2)

---

## Quick Reference

```text
SESSION START:  ./scripts/dev-init.sh   (expects ROADMAP_V2.md, PROGRESS.md, KNOWN_ISSUES.md at repo root)
DURING:         Work in small batches; verify after each meaningful change
SESSION END:    Update PROGRESS.md (root), KNOWN_ISSUES.md, and docs if architecture changes
```

---

## Guiding Principles

- Fix correctness before polish.
- Prefer one source of truth for gameplay rules and progression.
- Keep future level authoring config-driven where practical.
- Protect expensive AI endpoints before expanding AI-driven UX.
- Improve delight only after state, storage, and progression are trustworthy.
- Start **Vitest** and regression tests alongside Phase 1 fixes (Phase 7-lite), not only after all other phases.

---

## Phase Overview

| Phase | Focus | Priority | Status |
|-------|-------|----------|--------|
| 1 | Correctness and data integrity | Critical | Complete (`strict` deferred — see [KNOWN_ISSUES.md](./KNOWN_ISSUES.md)) |
| 2 | API protection and reliability | Critical | Complete (baseline — see [docs/API_PROTECTION.md](./docs/API_PROTECTION.md)) |
| 3 | Gameplay consistency and campaign flow | High | Complete |
| 4 | Customizer and asset pipeline | High | Complete (thumbnails deferred — see KNOWN_ISSUES) |
| 5 | Architecture cleanup for future levels | Medium | Complete (optional further engine splits deferred) |
| 6 | UX, accessibility, and game-feel polish | Medium | Complete |
| 7 | Regression net and QA workflow | High | Complete (`vitest`, `npm run test:run`; expand coverage over time) |

---

## Phase 1: Correctness and Data Integrity

**Goal:** Eliminate bugs that can corrupt player-facing state, save incorrect run results, or leave broken asset references behind.

### Tasks
- [x] Fix victory finalization ordering between `components/GameEngine.tsx` and `App.tsx` (avoid reading possibly stale React score when `VICTORY` fires; consider passing final score from engine or a single authoritative `RUN_COMPLETE` payload)
- [x] Make final score, lives, telemetry, and Hall of Fame writes use one authoritative final-run payload
- [x] Fix indexed customizer delete/equip edge cases that can persist missing `assetId` values
- [x] On closet delete, remove the corresponding IndexedDB blob via `deleteCatSprite` (avoid orphaned blobs) — on **Equip & Exit** via `handleIndexedSave` (immediate row delete still defers blob removal until save)
- [x] Fix **React Rules of Hooks** violation in `CatCustomizer` (conditional `useState` in legacy branch — hooks must not be conditional)
- [x] Align `catAssetStore` error contract (`getCatSprite` / `deleteCatSprite` reject vs `putCatSprite` returns `false`) or document and handle consistently
- [x] Guard equip-after-delete and duplicate-blob paths in indexed save flow (`previewAssetId` without `previewDataUrl` re-ingest)
- [x] Validate equipped asset existence on boot and recover gracefully when blobs are missing
- [x] Harden `services/migrateCatStorage.ts` so legacy keys are only cleared after successful IndexedDB persistence; mitigate concurrent-tab migration races where practical
- [x] Enable **`strict: true`** in `tsconfig.json` after fixing surfaced errors, **or** document an explicit deferral in [KNOWN_ISSUES.md](./KNOWN_ISSUES.md)
- [x] Add follow-up notes to `KNOWN_ISSUES.md` for any intentionally deferred edge cases

### Optional architecture (same phase or Phase 5)
- [x] Introduce a lightweight typed **game event** or final-run callback so App never reads stale score for victory (e.g. single payload: final score, lives, outcome, `levelId`) — `VictoryFinalizePayload` + `onVictoryFinalize`

### Key Files
```text
App.tsx
components/GameEngine.tsx
components/CatCustomizer.tsx
components/HallOfFameCatAvatar.tsx
hooks/useCatAssetObjectUrl.ts
services/migrateCatStorage.ts
services/catAssetStore.ts
tsconfig.json
```

---

## Phase 2: API Protection and Reliability

**Goal:** Make `/api/cat/*` safer and more production-ready before expanding the image-generation experience.

**Note:** Structured API error codes already exist in `server/catApiHandlers.ts` (`CONFIG_ERROR`, `PROMPT_BLOCKED`, `NO_IMAGE`, `BAD_REQUEST`, etc.). Extend and document gaps rather than treating normalization as greenfield.

### Tasks
- [x] Add lightweight abuse controls for `/api/cat/generate`
- [x] Add request throttling strategy for `/api/cat/wisdom` and `/api/cat/death-message`
- [x] Add request body size limits (dev middleware and handlers) and clearer malformed-body handling (avoid unbounded `readJsonBody`)
- [x] Add **client** timeouts (`AbortController` / `fetch` abort) in `services/geminiService.ts`
- [x] Add **server** timeout or bounded-wait around Gemini SDK calls in `server/geminiGateway.ts`
- [x] Mitigate **prompt injection** for custom cat generation (sanitize or structurally isolate user `description` in `server/prompts/customCatSprite.ts`; reinforce system instructions)
- [x] Normalize or extend API error responses for any remaining validation, blocked prompts, overload, and server failure paths (`RATE_LIMITED`, `REQUEST_TIMEOUT`, structured `BAD_REQUEST` for body/JSON)
- [x] Decide and document the minimum acceptable protection model for local/dev versus deployed environments ([docs/API_PROTECTION.md](./docs/API_PROTECTION.md))

### Key Files
```text
api/cat/generate.ts
api/cat/wisdom.ts
api/cat/death-message.ts
server/catApiHandlers.ts
server/devApiMiddleware.ts
server/geminiGateway.ts
server/catApiBody.ts
server/prompts/customCatSprite.ts
services/geminiService.ts
```

---

## Phase 3: Gameplay Consistency and Campaign Flow

**Goal:** Align runtime tuning, HUD messaging, progression flow, and level-config behavior.

### Tasks
- [x] Replace hardcoded boss-threshold UI logic with a shared runtime source (avoid divergence from `useTuningStore` / `bossThreshold`, e.g. `BOSS_STARS_THRESHOLD` in `App.tsx`)
- [x] Make HUD stars, boss trigger timing, and sky progression agree under tuning changes
- [x] Make **sky gradient** (`getSkyStyle` in `App.tsx`) level-configurable or clearly scoped to current level theme (today beach/star-based)
- [x] Audit `LevelConfig` fields that claim authority but are not yet enforced consistently
- [x] Move harmfulness and spawn-height behavior toward config-driven runtime rules (`behaviors.ts` still hardcodes swoop Ys and drop timing; seagull spawn Ys partly ignore `spawnY` in engine)
- [x] Decide fate of unused **`GameStatus` values**: `START`, `PAUSED`, `BOSS_INTRO` — implement, remove, or replace with engine-local pause (`isPaused`) and document
- [x] Remove or repurpose dead **`LevelDef`** in `types.ts` if unused; resolve redundant **`Obstacle`** empty extension of `WorldEntity`
- [x] Improve the victory `CONTINUE` flow so it advances campaign momentum
- [x] Reassess the one-level selection UX so the current home screen feels intentional

### Optional architecture
- [ ] Formalize a small **game state machine** (valid transitions, single place for `setStatus`) to prevent impossible status combinations

### Key Files
```text
App.tsx
components/GameEngine.tsx
components/LevelSelection.tsx
levels/beach.ts
levels/catalog.ts
types.ts
systems/levelBehaviorHelpers.ts
systems/behaviors.ts
```

---

## Phase 4: Customizer and Asset Pipeline

**Goal:** Make the closet safer, clearer, and more delightful while reducing unnecessary image work.

### Tasks
- [x] Separate player/cat identity from saved look naming
- [x] Add dirty-state protection before exiting or discarding generated looks
- [x] Prevent duplicate closet rows when saving the same already-stored look
- [x] Make preview, equipped, and saved states visually explicit
- [x] Use `meta.mattedOnServer` end-to-end so already-matted images skip redundant client processing
- [x] Add asset deduplication strategy or reuse path for stored PNGs
- [x] Bound or evict **`useMatteCatUrl`** cache and **`levels/beach/obstacles.tsx`** sprite processing cache to avoid long-session memory growth
- [ ] Consider thumbnail generation for wardrobe and Hall of Fame rendering (deferred — see KNOWN_ISSUES)

### Key Files
```text
App.tsx
components/CatCustomizer.tsx
components/MatteCatImage.tsx
components/HallOfFameCatAvatar.tsx
hooks/useMatteCatUrl.ts
levels/beach/obstacles.tsx
services/geminiService.ts
services/catAssetStore.ts
types/catGenerateApi.ts
```

---

## Phase 5: Architecture Cleanup for Future Levels

**Goal:** Reduce hidden coupling so the next level can be added without more shared-file sprawl.

### Concrete extraction and config targets
- [x] Extract **background entity SVG** (~large inline block in `GameEngine.tsx`) into level-scoped modules (`levels/beach/backgroundEntities.tsx` — `BeachBackgroundEntityView`; mirror `levels/beach/obstacles.tsx`)
- [x] Centralize **player anchor X** and related layout: `ThemeConfig.playerAnchorLeftPx` / `playerAnchorLeftPxSuperSized`, `systems/playerAnchor.ts` (`resolvePlayerAnchor`), `GameEngine` + boss shot param `projectileAimX` on `createBossProjectileObstacle`
- [x] Drive **bounce / slow collision** data from `ObstacleDefinition.stompCollision` / `slowCollision` (handlers prefer config; type switches remain fallback); beach defs populated in `levels/beach.ts`; engine passes `getObstacleDef` into handlers
- [x] Move **swoop / drop timing** into `BehaviorConfig.config` / helpers (`resolveSwoopConfig`, `resolveDropProjectileSpec` + `checkPoopDrop`) — see `docs/BEHAVIOR_SYSTEM.md`
- [x] Extend **background spawning** — `BackgroundEntityDefinition` fields + `BackgroundConfig` pools (`chaosSpawnTypes`, `midLayerSpawnTypes`, `cloudSpawnChance`, `cloudEntityType`); pure **`systems/backgroundSpawn.ts`** (`spawnBackgroundEntities`); Vitest coverage
- [x] Plan **level-scoped obstacle / background type vocabulary** — decision guide in `docs/LEVEL_DEVELOPMENT.md` (when to extend global unions vs level-local helpers)
- [x] Move more runtime behavior to authoritative level config — background spawn pools/chances live on `BackgroundConfig`; engine calls single spawner with `bgCfg`
- [x] Reduce level-specific branching in shared rendering — **`levels/levelBackgroundViews.tsx`**: `BACKGROUND_ENTITY_VIEW_BY_LEVEL` + `BackgroundEntityRenderer`; **`GameEngine`** delegates by `levelId`
- [x] Split engine responsibilities for testability — background spawn extracted to **`systems/backgroundSpawn.ts`** with unit tests (optional larger splits: `SpawnManager`, SFX — deferred)
- [x] Keep docs in sync if the architecture boundary changes (this phase: `LEVEL_DEVELOPMENT`, `BEHAVIOR_SYSTEM`, `PROGRESS`)

### Key Files
```text
components/GameEngine.tsx
components/ObstacleComponent.tsx
levels/index.ts
levels/beach.ts
levels/beach/obstacles.tsx
levels/beach/backgroundEntities.tsx
levels/levelBackgroundViews.tsx
systems/backgroundSpawn.ts
systems/bossSystem.ts
systems/collisionHandlers.ts
systems/behaviors.ts
systems/levelBehaviorHelpers.ts
types.ts
```

---

## Phase 6: UX, Accessibility, and Game-Feel Polish

**Goal:** Make the game feel more deliberate, readable, and rewarding without obscuring core gameplay.

### Tasks
- [x] Improve title-screen hierarchy and campaign messaging
- [x] Make unlocks, victory, and Hall of Fame progression easier to read
- [x] Add better generation feedback and success affordances in the closet
- [x] Improve keyboard/focus behavior, labels, `aria-live`, and target sizes in menu/customizer flows
- [x] Add `prefers-reduced-motion` handling for the most intense animated screens
- [x] Revisit large static asset weight and any avoidable startup cost (Hall of Fame avatars: `loading="lazy"` on `MatteCatImage`; per-level PNG code-split deferred until more levels ship)
- [x] Add a **sound effects** layer (jump, collect, damage, stomp, boss hit, etc.) — `services/sfxService.ts` + `GameEngine` `playSound`
- [x] Improve **music timing** robustness — `audioService` uses rAF + Web Audio lookahead scheduling instead of `setInterval`

### Key Files
```text
App.tsx
index.html
components/LevelSelection.tsx
components/CatCustomizer.tsx
components/HallOfFameCatAvatar.tsx
components/MatteCatImage.tsx
components/GameEngine.tsx
hooks/usePrefersReducedMotion.ts
services/audioService.ts
services/sfxService.ts
README.md
```

---

## Phase 7: Regression Net and QA Workflow

**Goal:** Add enough automated and manual coverage to keep the next roadmap stable.

**Execution note:** Phase 7 is **high priority** — add **Vitest** (or equivalent) and first tests **alongside Phase 1**, not only after Phases 1–6.

### Tasks
- [x] Introduce a lightweight test setup (Vitest + Vite) for pure logic and persistence helpers
- [x] Add regression tests for victory finalization and unlock persistence (`services/runOutcome.ts` + `runOutcome.test.ts`, `levelProgress.test.ts`, wired from `App.tsx`)
- [x] Add regression tests for migration safety and missing-asset recovery (partial: `readCatCharacterState` / v1 round-trip; full `migrateCatStorageIfNeeded` + IndexedDB still manual / future expansion)
- [x] Add tests for config-driven level behavior where practical — existing: `levelBehaviorHelpers.test`, `behaviors.test`, `catalog.test`, `backgroundSpawn.test`; added: `collisionHandlers.test`, `catApiBody.test`, `catSpriteMattingCore.test`
- [x] Document a compact manual QA checklist — [docs/QA_CHECKLIST.md](docs/QA_CHECKLIST.md)
- [x] Treat browser playtesting as part of completion — called out in QA checklist for release candidates

### Key Files
```text
vite.config.ts
package.json
App.tsx
services/runOutcome.ts
services/levelProgress.ts
services/migrateCatStorage.ts
server/catApiBody.ts
systems/levelBehaviorHelpers.ts
systems/collisionHandlers.ts
systems/behaviors.ts
services/catSpriteMattingCore.ts
docs/QA_CHECKLIST.md
PROGRESS.md
KNOWN_ISSUES.md
```

---

## Recommended Execution Batches

```text
Batch 1: Phase 1 (correctness) + Phase 7-lite (Vitest scaffold + tests for fixes you touch)
Batch 2: Phase 2 (API protection, prompt hardening, timeouts, body limits)
Batch 3: Phase 3 (gameplay consistency, dead GameStatus / types cleanup, state machine optional)
Batch 4: Phase 4 (customizer + asset pipeline)
Batch 5: Phase 5 (concrete extractions: backgrounds, collision config, player constants)
Batch 6: Phase 6 (UX/a11y + SFX + music timing)
Batch 7: Phase 7-full (broad regression coverage + QA checklist)
```

---

## Must-Fix Before Calling V2 Complete

- [x] Victory finalization is race-free and saves correct run results
- [x] Migration no longer risks silent custom-cat data loss
- [x] Missing/deleted asset references cannot remain equipped or break Hall of Fame rendering
- [x] Orphaned IndexedDB blobs are not left behind on closet delete (on wardrobe save / removed looks)
- [x] React hooks rules satisfied in `CatCustomizer` (no conditional hooks)
- [x] AI endpoints have at least baseline abuse protection and request guards
- [x] Prompt injection for `/api/cat/generate` is mitigated
- [x] Client and server API calls have timeout boundaries
- [x] Boss-threshold visuals and runtime behavior stay in sync under tuning changes — shared **`mergeLevelTuning`** (`levels/catalog.ts`) in **`App`** and **`GameEngine`**; boss entry via **`getBossEntryCoinThreshold`**; see [docs/LEVEL_RUNTIME.md](docs/LEVEL_RUNTIME.md)
- [x] The level system has a clearer authoritative runtime contract for future levels — [docs/LEVEL_RUNTIME.md](docs/LEVEL_RUNTIME.md) + tests in **`levels/catalog.test.ts`**
- [x] `strict: true` in `tsconfig.json` **or** a documented conscious deferral in KNOWN_ISSUES
- [x] At least one automated test file covers core pure functions (helpers, parsing, catalog, matting core, etc.)

---

## Architectural Enhancements (Reference)

Use these as implementation strategies when executing phases above; they are not a separate release.

| Enhancement | Intent | Typical phase |
|-------------|--------|----------------|
| Typed **final-run / game events** | Single authoritative payload from engine to App; removes score race | 1 or 5 |
| **`ObstacleDefinition.collisionConfig`** (bounce, slow, particles, sound) | New levels without editing `collisionHandlers` switches | 5 |
| **Extract GameEngine subsystems** | Background SVG module, spawn helpers, particles, SFX, input | 5 |
| **Vitest on pure modules** | Fast feedback on behaviors, collisions, migration, API body parsing | 1 + 7 |
| **Level-scoped entity type unions** | Avoid global `ObstacleType` / `BackgroundEntityType` bloat | 5 |
| **Rate limiting + body caps** | Dev: in-memory window; prod: edge/Redis as needed | 2 |

---

## Session Checklist Link

After substantive work, update [PROGRESS.md](./PROGRESS.md) (newest session first) and reconcile [KNOWN_ISSUES.md](./KNOWN_ISSUES.md).
