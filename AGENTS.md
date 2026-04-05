# AGENTS.md

**Twin:** [CLAUDE.md](./CLAUDE.md) — keep both files in sync when architecture changes.

Guidance for AI coding assistants (Cursor, Copilot, etc.) and Claude Code when working in this repository.

## Project Overview

Beach Kitty is an endless runner game built with React 19 + TypeScript + Vite. A cat runs along a beach dodging obstacles, collecting coins/shells, and fighting a boss (Sand Monster). Gemini AI requests are proxied through server-side API routes for key safety.

## Development Commands

```bash
npm install          # Install dependencies
npm run dev          # Start dev server on port 3000
npm run build        # Production build
npm run preview      # Preview production build
npm run test:run     # Vitest (CI-style single run)
./scripts/dev-init.sh   # Session checklist (expects ROADMAP_V2.md, PROGRESS.md, KNOWN_ISSUES.md at repo root)
```

## Environment Setup

Set `GEMINI_API_KEY` in `.env.local` for AI features (custom cat generation, wisdom quotes, death messages). In production, configure `GEMINI_API_KEY` on the server environment.

## Architecture

### Core Game Loop
- **App.tsx** — Root component: game states (`GameStatus`: LEVEL_SELECTION, PLAYING, BOSS_FIGHT, GAMEOVER, VICTORY, CUSTOMIZE), **`selectedLevel`** / **`LevelSelection`**, **`defeatedBosses`** + **`beach-cat-defeated-bosses-v1`**, unlock helpers in **`levels/catalog.ts`**. Hall of Fame merge + victory score: **`services/runOutcome.ts`**. **dev BalancePanel** toggled with **backtick** during play, telemetry callback from GameEngine. **Custom cat sprites:** metadata in **`beach-cat-cat-state-v1`** (localStorage); PNG blobs in **IndexedDB** (`beach-kitty-assets`). **`migrateCatStorageIfNeeded`** migrates legacy `beach-cat-look` / `beach-cat-outfits` once; clears legacy keys only after successful v1 write and successful **`putCatSprite`** for migrated blobs. Fallback: legacy keys only if IDB unavailable. Missing equipped blob on boot clears persisted **`equippedAssetId`**. Hall of Fame: **`catAssetId`** (new) vs **`catUrl`** (legacy).
- **GameEngine.tsx** — Main loop (`requestAnimationFrame`): physics, collisions, spawning, boss fight. Accepts optional **`levelConfig`** (App passes **`getLevelConfig(levelId)`**); falls back to **`LEVEL_REGISTRY[levelId]`**. Boss defeat calls **`onVictoryFinalize`(`VictoryFinalizePayload`)** before VICTORY status so **`App`** never reads stale score for Hall of Fame. Stomp / slow-on-contact / arc projectile motion from **`ObstacleDefinition.behaviors`** via **`systems/levelBehaviorHelpers.ts`**; stomp/slow outcomes prefer **`stompCollision` / `slowCollision`** on defs when set (**`collisionHandlers`**). Player X layout from **`resolvePlayerAnchor(theme)`** (`systems/playerAnchor.ts`). Background parallax spawn: **`systems/backgroundSpawn.ts`** (`spawnBackgroundEntities` + `BackgroundConfig` pools); renderer registry **`levels/levelBackgroundViews.tsx`** (`BackgroundEntityRenderer`); beach art **`levels/beach/backgroundEntities.tsx`**. Boss logic in **`systems/bossSystem.ts`** (`projectileAimX` from anchor); lazy boss UI in **`systems/bossComponents.tsx`**. Reads **runtime tuning** from `useTuningStore()`. Logs **telemetry** via `runTelemetry`. Uses **`systems/behaviors.ts`** and **`systems/collisionHandlers.ts`**.

### Game Mechanics (tuning + GameEngine)
- **Defaults** (overridable in dev panel): gravity `0.75`, jump force `17`, ground Y `100`, boss entry after **`bossThreshold`** coins (default **50**), power-up spawn cadence via `powerupThreshold` / `streakRequired`, spawn intervals and assist graces in `TuningProfile`.
- **Scoring:** Coins = 1, shells = 5; multiplier scales with streak.
- **Double jump:** `jumpCount`, max 2 before landing.
- **Power-ups:** SPEED (~1.7x), MAGNET, SUPER_SIZE (scale + invincibility) — exact tuning from store.

### Level configuration
- **`levels/beach.ts`** — `BEACH_LEVEL_CONFIG` (`LevelConfig`). **`levels/index.ts`** — `LEVEL_REGISTRY`, `getLevelConfig`. **App** passes **`levelConfig`** into **GameEngine**. **`mergeLevelTuning`** + **`getBossEntryCoinThreshold`** in **`levels/catalog.ts`** keep HUD / sky / engine boss trigger aligned — see **[docs/LEVEL_RUNTIME.md](./docs/LEVEL_RUNTIME.md)**. Roadmap: [ROADMAP_V2.md](./ROADMAP_V2.md) (V2 complete); V1 archive: `docs/ROADMAP_V1_COMPLETE.md`.

### Dev tooling: balance panel and telemetry
- **`components/dev/BalancePanel.tsx`** — Sliders for `TuningProfile`, named presets in **localStorage**, reset to defaults, **export telemetry JSON**.
- **`systems/tuning/useTuningStore.ts`** — Hook for tuning + presets.
- **`systems/telemetry/runTelemetry.ts`** — Factory for run logger; damage / death / run_summary events.

### Component Architecture
- **LevelSelection.tsx** — Level picker on **`LEVEL_SELECTION`**; uses **`LEVEL_ORDER`** / **`getLevelConfig`**.
- **Kitty.tsx** — Player; Canvas API for AI-generated sprite backgrounds.
- **ObstacleComponent.tsx** — Shared pickups; beach art in **`levels/beach/obstacles.tsx`** + **`LevelContext`**.
- **SandMonster.tsx** — Boss.
- **CatCustomizer.tsx** — Gemini-powered custom cats; **`mode: 'indexed'`** vs **`mode: 'legacy'`**. Indexed: **player name** (Hall of Fame) vs **look name** (closet), dirty exit confirm, `contentKey` / `mattedOnServer` on `SavedCatLook`; closet **delete** calls **`onClosetLookDelete`** → **`writeCatCharacterState`** + **`deleteCatSprite`** (no need to Equip & Exit to drop IDB blobs).
- **HallOfFameCatAvatar.tsx** — **`catAssetId`** → blob URL, else **`catUrl`**.
- **AnimatedWater.tsx** — Water background.

### AI Integration (`services/geminiService.ts` + `api/cat/*` + `server/catApiHandlers.ts`)
- Frontend calls same-origin **`/api/cat/*`**; Vercel + Vite `devApiMiddleware` share **`server/catApiHandlers.ts`**, with **`server/catApiProtection.ts`** / **`server/catApiVercelPreflight.ts`** for body caps and per-IP rate limits (see **[docs/API_PROTECTION.md](./docs/API_PROTECTION.md)**).
- Browser **`fetch`** uses **`AbortController`** timeouts (`services/geminiService.ts`); Gemini SDK calls use server-side **`Promise.race`** timeouts (`server/geminiGateway.ts`).
- **`sharp`** + **`catSpriteMattingCore.ts`**: `/api/cat/generate` returns PNGs matte-processed on the server when possible (`meta.mattedOnServer`). Client matting remains for older stored sprites.
- Server uses `GEMINI_API_KEY`; image model `GEMINI_IMAGE_MODEL` (default `gemini-2.5-flash-image`).
- `generateCustomCat` returns **`GenerateCatImageResult`**; prompt in **`server/prompts/customCatSprite.ts`** (`CUSTOM_CAT_SPRITE_PROMPT_VERSION`) with user-text sanitization + delimiter isolation.

### Types (`types.ts`)
- `GameStatus`, obstacle/power-up/entity unions, `WorldEntity`, `Obstacle`, `Bullet`, `Particle`, `PlayerState`, `GameScore`, persistence types.
- **Multi-level scaffolding:** `LevelId`, `BehaviorType`, `ObstacleDefinition`, `LevelConfig`, `ThemeConfig`, `BossConfig`, `BackgroundConfig`, etc.

### Pattern system
- **Runtime:** `levelConfig.patterns` from **`LEVEL_REGISTRY`** (cloned into spawn queue; scaled by score / lives in engine).

### Behavior and collision modules
- **`systems/behaviors.ts`** — `computeSwoopY`, `checkPoopDrop` with level-resolved projectile spec.
- **`systems/levelBehaviorHelpers.ts`** — `pickSeagullSpawnVariant`, `resolveDropProjectileSpec`, `obstacleHasBehavior`.
- **`systems/collisionHandlers.ts`** — `handleBounceCollision`, `handleSlowCollision`, `handleHarmfulCollision`, `CollisionResult`.
- **`LevelConfig.magnetAttractTypes`**, **`BossConfig.projectileObstacleType`** for magnet / boss shots.

### Audio (`services/audioService.ts`, `services/sfxService.ts`)
- **Music:** Web Audio procedural beats; tempo vs game speed; boss mode. Scheduling uses **rAF + lookahead** (`nextBeatTime`) to reduce drift under load.
- **SFX:** `sfxService` — file-backed game sounds + procedural fallbacks; preloaded from `GameEngine`.

### Phaser 3 Integration (V3)
- **`components/PhaserGame.tsx`** — React wrapper that mounts a `Phaser.Game` inside a div. Accepts `sceneFactory` (lazy import), `levelId`, `catSpriteUrl`, `sceneInitData`, and callback props for bridge events. Full Phaser restart on `levelId` change; `applyRuntimePatch` for mid-run tuning updates.
- **`scenes/shared/SceneBridge.ts`** — Abstract base class extending `Phaser.Scene`. All genre scenes extend this. Defines 6 bridge events: `SCORE_UPDATE`, `LIVES_CHANGED`, `LEVEL_COMPLETE`, `GAME_OVER`, `STATUS_CHANGE`, `HUD_UPDATE`. Protocol constants and interfaces live in `scenes/shared/bridgeProtocol.ts` (importable without Phaser browser globals).
- **`scenes/shared/SpriteLoader.ts`** — Loads cat sprite blob URL into Phaser texture cache during `preload()`.
- **Garden Patrol (whack):** `scenes/WhackScene.ts` orchestrates managers under `scenes/whack/` (hole grid, garden background, mole spawning, power-ups, Gopher King boss); pure logic in `waves.ts`, `spawnPick.ts`, `bossState.ts` with Vitest.
- **Rendering rule:** Phaser owns gameplay rendering; React owns UI (menus, HUD, campaign screen, cutscenes).
- **Code splitting rule:** Never statically import all scene classes. Use `sceneFactory: () => import('./scenes/BeachScene')` for lazy loading.
- **`CAMPAIGN_LEVEL_META` vs `LEVEL_REGISTRY`:** `CAMPAIGN_LEVEL_META` (in `levels/catalog.ts`) lists all 9 levels with display metadata for the campaign screen. `LEVEL_REGISTRY` (in `levels/index.ts`) only contains levels with actual runtime configs. The campaign screen reads from meta; `getLevelConfig()` reads from the registry and throws for unimplemented levels.

## Roadmap V2 and known gaps

See **[ROADMAP_V2.md](./ROADMAP_V2.md)** and **[KNOWN_ISSUES.md](./KNOWN_ISSUES.md)** for the active backlog. Short summary for agents:

- **GameEngine.tsx** remains a large monolith: physics, spawning, collisions, HUD, boss wiring. Background parallax SVGs and **`BEACH`** spawn helpers live under **`levels/beach/`**; further extraction (spawn manager, HUD) is optional in V2.
- **`/api/cat/*`:** Shared handlers + **`RATE_LIMITED`** / **`REQUEST_TIMEOUT`** / **`BAD_REQUEST`** JSON errors; production hardening can add Edge/Redis limits beyond in-memory windows (see **docs/API_PROTECTION.md**).
- **TypeScript:** `tsconfig.json` does not enable **`strict`** yet — deferred with rationale in [KNOWN_ISSUES.md](./KNOWN_ISSUES.md); `npm run build` and `npx tsc --noEmit` are used for ship checks.
- **Tests:** **Vitest** — `npm run test:run` (CI-style), `npm test` (watch). Pure-module coverage in `services/`, `systems/`, `server/`, `levels/`; expand over time; UI/game loop remains mostly manual QA ([docs/QA_CHECKLIST.md](./docs/QA_CHECKLIST.md)).
- **Gameplay types:** `GameStatus` trimmed to active flow values; pause is engine-local (`isPaused`). Optional `LevelConfig.bossEntryCoinThreshold`, `theme.skyProgressMode`, behavior `config` keys — see `docs/LEVEL_DEVELOPMENT.md` / `docs/BEHAVIOR_SYSTEM.md`.

## Key Implementation Details

- AABB collision with forgiveness padding.
- Background entities: parallax depth layers.
- Screen shake, hit flash, freeze frames (`triggerFreezeFrame`).
- Seagull: spawn variant from **`swoop` / `dropProjectile`** behaviors; dive stomp requires **`swoop`** on the definition.
- Styling: Tailwind via CDN.

## Game Feel (“Juice”)

Squash/stretch (Kitty), freeze frames, screen shake, hit flash, speed lines, dust trail, coin glow, floating score popups.

## Documentation for contributors

- **[docs/LEVEL_DEVELOPMENT.md](./docs/LEVEL_DEVELOPMENT.md)** — New levels: types, config, registry, art, boss.
- **[docs/LEVEL_RUNTIME.md](./docs/LEVEL_RUNTIME.md)** — App vs `GameEngine` ownership; `mergeLevelTuning`; boss coin contract.
- **[docs/BEHAVIOR_SYSTEM.md](./docs/BEHAVIOR_SYSTEM.md)** — Behaviors, collisions, seagull drops, boss projectiles.
- **[docs/QA_CHECKLIST.md](./docs/QA_CHECKLIST.md)** — Manual / release playtesting (gameplay, customizer, AI routes, a11y spot-check).

## Project tracking

- **[ROADMAP_V2.md](./ROADMAP_V2.md)** — Active roadmap for current work.
- **[docs/ROADMAP_V1_COMPLETE.md](./docs/ROADMAP_V1_COMPLETE.md)** — Completed roadmap archive for phases 1–9.
- **[PROGRESS.md](./PROGRESS.md)** — Session log (newest first).
- **[KNOWN_ISSUES.md](./KNOWN_ISSUES.md)** — Parking lot and technical debt.
