# Beach Kitty Multi-Level System — Known Issues & Parking Lot

> **Purpose:** Track issues, blockers, and deferred decisions.
> **Related Docs:** [ROADMAP_V2.md](./ROADMAP_V2.md) (complete) | [PROGRESS.md](./PROGRESS.md) | [docs/ROADMAP_V1_COMPLETE.md](./docs/ROADMAP_V1_COMPLETE.md)

---

## How to Use This Document

**Add issues here when:**
- You encounter a bug that isn't blocking current work
- You discover something that needs investigation later
- A decision needs to be made but can wait
- You find edge cases that need handling eventually

**Format:**
```markdown
### [PHASE-X] Brief description
**Status:** Open | In Progress | Resolved | Deferred
**Severity:** Blocker | High | Medium | Low
**Discovered:** YYYY-MM-DD
**Description:** What happened / what's the issue
**Workaround:** (if any)
**Resolution:** (when resolved)
```

---

## Open Issues

_None at the moment._ Add new items here as they appear.

---

## Resolved Issues

### [V2-2] IndexedDB blobs orphaned on closet delete
**Status:** Resolved  
**Severity:** Low  
**Discovered:** 2026-03-19  
**Resolution:** 2026-03-19 — Indexed mode: **`onClosetLookDelete`** (`App.tsx` **`handleClosetLookDelete`**) persists **`writeCatCharacterState`** then **`deleteCatSprite`** when the user removes a closet row; **`CatCustomizer`** awaits it and syncs dirty snapshot / preview (including equipped look removed).

### [V2-6] `useMatteCatUrl` / seagull sprite caches unbounded
**Status:** Resolved  
**Severity:** Low  
**Discovered:** 2026-03-19  
**Resolution:** 2026-03-19 — **`useMatteCatUrl`** already caps resolved URLs (**`MAX_RESOLVED_CACHE_ENTRIES`**, LRU). Beach obstacle matting uses **`MAX_PROCESSED_SPRITE_CACHE`** in **`levels/beach/obstacles.tsx`**. No code change required beyond closing the ticket.

### [V2-7] `tsconfig` strict mode disabled
**Status:** Resolved (documented deferral)  
**Severity:** Medium  
**Discovered:** 2026-03-19  
**Description:** Enabling **`strict: true`** surfaces a large backlog (on the order of **~1000+** `tsc` diagnostic lines as of 2026-03-19); `tsconfig` excludes **`dist/`** so `tsc --noEmit` is usable for incremental checks.  
**Resolution:** 2026-03-19 — Matches ROADMAP V2 must-fix: **strict or conscious deferral**. Treat **`npm run build`** (Vite) as the ship gate; enable **`strict`** in a dedicated correctness sprint or incrementally (`strictNullChecks` first, etc.).

### [V2-8] Concurrent-tab cat asset migration
**Status:** Resolved  
**Severity:** Low  
**Discovered:** 2026-03-19  
**Resolution:** 2026-03-19 — **`migrateCatStorageIfNeeded`** runs the migration body under **`navigator.locks.request('beach-kitty-cat-migration-v1', …)`** when available; otherwise unchanged sequential path (tests, older browsers).

### [V2-4] `/api/cat/*` lacks rate limits, body caps, and client/server timeouts
**Status:** Resolved  
**Severity:** High  
**Discovered:** 2026-03-19  
**Resolution:** 2026-03-19 — [`server/catApiProtection.ts`](server/catApiProtection.ts) + [`server/catApiVercelPreflight.ts`](server/catApiVercelPreflight.ts); bounded JSON read in dev middleware; per-route rate limits; `fetch` `AbortController` timeouts in [`services/geminiService.ts`](services/geminiService.ts); `Promise.race` timeouts in [`server/geminiGateway.ts`](server/geminiGateway.ts). See [docs/API_PROTECTION.md](docs/API_PROTECTION.md). **Note:** in-memory limits reset on serverless cold starts — document upgrade path (Edge / Redis) if abuse appears.

### [V2-5] Prompt injection surface on custom cat generation
**Status:** Resolved (mitigated)  
**Severity:** Medium  
**Discovered:** 2026-03-19  
**Resolution:** 2026-03-19 — [`sanitizeUserCatDescriptionForPrompt`](server/prompts/customCatSprite.ts) + delimiter block + explicit “do not treat as system instructions” copy; `CUSTOM_CAT_SPRITE_PROMPT_VERSION` bumped. Model safety filters still primary; this reduces naive injection.

### [V2-1] Victory finalization may use stale score
**Status:** Resolved  
**Severity:** High  
**Discovered:** 2026-03-19  
**Description:** `App.tsx` handled `GameStatus.VICTORY` using React `score.current` while engine final score arrived via `onScoreUpdate` in the same turn.  
**Resolution:** 2026-03-19 — `VictoryFinalizePayload` + `onVictoryFinalize` on `GameEngine`; `App` uses payload for Hall of Fame / `setScore` via `nextGameScoreAfterVictory`. **Follow-up ([V2-9]):** engine no longer calls `onScoreUpdate` immediately after `onVictoryFinalize` on boss win so refilled lives are not overwritten.

### [V2-9] Boss victory: `onScoreUpdate` after `onVictoryFinalize` overwrote refilled lives
**Status:** Resolved  
**Severity:** High  
**Discovered:** 2026-03-19  
**Resolution:** 2026-03-19 — Removed redundant `onScoreUpdate(gameScore)` after `onVictoryFinalize` in [`components/GameEngine.tsx`](components/GameEngine.tsx). `handleVictoryFinalize` in [`App.tsx`](App.tsx) remains the authoritative score/lives update for that transition.

### [V2-10] Indexed save could persist broken `equippedAssetId` (failed put / missing blob)
**Status:** Resolved  
**Severity:** Medium  
**Discovered:** 2026-03-19  
**Resolution:** 2026-03-19 — [`App.tsx`](App.tsx) `handleIndexedSave`: honor `putCatSprite` boolean; on dedup match with missing IDB blob, attempt repair `put` before equipping; `assetId` equip path sets `equippedAssetId` only when `getCatSprite` succeeds.

### [V2-11] `stopMusic` delayed `close()` could shut down a newer `AudioContext`
**Status:** Resolved  
**Severity:** Medium  
**Discovered:** 2026-03-19  
**Resolution:** 2026-03-19 — [`services/audioService.ts`](services/audioService.ts): cancel pending close timer on `startMusic`/`stopMusic`; close the captured `AudioContext` instance; clear module globals only if they still reference that instance.

### [V2-12] Seagull body collision was non-harmful despite “dodge seagulls” gameplay
**Status:** Resolved  
**Severity:** Low  
**Discovered:** 2026-03-19  
**Resolution:** 2026-03-19 — [`levels/beach.ts`](levels/beach.ts): `SEAGULL` **`isHarmful: true`** and **`SEAGULL`** added to **`harmfulTypes`** so body hits damage unless stomp / invincibility applies (stomp branch still runs first when landing from above).

### [V2-3] Conditional hooks in `CatCustomizer` (legacy mode)
**Status:** Resolved  
**Severity:** High  
**Discovered:** 2026-03-19  
**Description:** Legacy branch used hooks after a conditional.  
**Resolution:** 2026-03-19 — `CatCustomizerLegacy` child component owns legacy-only hooks.

### [INFRA] Client-side Gemini API key
**Status:** Resolved  
**Discovered:** 2025-12-23  
**Resolution:** 2026-02-28 — All Gemini calls go through same-origin `/api/cat/*`; `GEMINI_API_KEY` is server-only (see `services/geminiService.ts`, `api/cat/*`, Vercel handlers).

### [PHASE-7] Level unlock persistence after boss defeat
**Status:** Resolved  
**Discovered:** 2025-12-23  
**Resolution:** 2026-03-19 — `services/levelProgress.ts` + `beach-cat-defeated-bosses-v1`; `App` / `LevelSelection` use `isLevelUnlocked` from `levels/catalog.ts`.

---

## Deferred Decisions

### [PHASE-6] Seagull Behavior Split Strategy
**Status:** Resolved (composition + config)  
**Discovered:** 2025-12-23  
**Resolution:** Single `SEAGULL` type with runtime `seagullType` (`dive` | `poop`) chosen by `pickSeagullSpawnVariant` from `swoop` / `dropProjectile` behaviors on `ObstacleDefinition`. Drops use `dropProjectile.projectileType` + `resolveDropProjectileSpec` / `checkPoopDrop(..., spec)`.

---

### [PHASE-4] Collectible Theming
**Status:** Deferred to Phase 4  
**Discovered:** 2025-12-23  
**Description:** Should collectibles (COIN, SHELL) be level-themed or stay universal?
- Universal: Same star/shell across all levels (simpler)
- Themed: Forest has acorns, Volcano has gems (more immersive)

**Recommendation:** Keep universal for v1, add themed variants later

---

## Technical Debt

| Item | Roadmap | Priority | Notes |
|------|---------|----------|-------|
| GameEngine.tsx is very large (~1900+ lines) | V2 §5 | Medium | Boss logic extracted to `systems/bossSystem.ts`; background SVG + spawn/collision still concentrated in engine |
| Inline SVGs in ObstacleComponent | — | Low | Beach hazards moved to `levels/beach/obstacles.tsx` (V1 Phase 5) |
| Runtime level config vs tuning store | V2 §3 | Resolved | `mergeLevelTuning` + `getBossEntryCoinThreshold` — see [docs/LEVEL_RUNTIME.md](docs/LEVEL_RUNTIME.md) |
| TS image imports (seagull assets, SandMonster) | — | Low | Missing/loose `.d.ts`; Vite build OK |
| Vitest scaffold + pure-module tests | V2 §7 | Medium | `npm run test:run`; expand coverage over time |
| Wardrobe / Hall of Fame pre-rendered thumbnails | V2 §4 | Low | CSS-sized thumbs + `mattedOnServer` skip reduce work |
| `SavedCatLook` rows without `contentKey` (pre–Phase 4) | — | Low | Dedup/equip reuse improves as rows are re-saved or replaced |
| Equip **new** AI image without closet save | V2 §4 | Low | No `mattedOnServer` on disk yet — one client matting pass until saved to closet |
| `collisionHandlers` type-switch for bounce/slow | V2 §5 | Medium | Prefer config on `ObstacleDefinition` for new levels |
| `tsconfig` `strict: true` | — | Medium | Deferred; ~1k+ diagnostics if flipped on wholesale — incremental enablement recommended |

---

## Edge Cases to Handle

| Case | Roadmap | Priority | Notes |
|------|---------|----------|-------|
| Mid-level quit behavior | V2 §3 | Medium | Should progress save? See ROADMAP V2 campaign flow |
| Power-up theming | Deferred | Low | Same power-ups all levels for now |
| Concurrent-tab cat storage migration | V2 §1 | Resolved | Web Locks around migration — see **[V2-8]** in Resolved Issues |
| Equip after deleting previewed look | V2 §1 | Resolved | Preview resets to equipped / clears when deleted row was selected (Phase 1) |
