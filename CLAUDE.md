# CLAUDE.md

**Twin:** [AGENTS.md](./AGENTS.md) — keep both files in sync when architecture changes.

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

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
- **App.tsx** — Root component: game states (`GameStatus`: LEVEL_SELECTION, PLAYING, BOSS_FIGHT, GAMEOVER, VICTORY, CUSTOMIZE), **`selectedLevel`** + **`LevelSelection`**, **`defeatedBosses`** persisted in **`beach-cat-defeated-bosses-v1`** (`services/levelProgress.ts`), linear unlock via **`levels/catalog.ts`** (`LEVEL_ORDER`, `isLevelUnlocked`). Hall of Fame + victory score merges: **`services/runOutcome.ts`**. **dev BalancePanel** toggled with **backtick** during play, telemetry callback from GameEngine. **Custom cat sprites:** metadata in **`beach-cat-cat-state-v1`** (localStorage JSON: `equippedAssetId`, `SavedCatLook[]`); PNG bytes in **IndexedDB** (`beach-kitty-assets` / `sprites`). On boot, **`migrateCatStorageIfNeeded`** migrates legacy `beach-cat-look` + `beach-cat-outfits` once; legacy keys are removed only after successful v1 persistence and successful blob puts for the data being cleared. If IndexedDB is unavailable, the app falls back to legacy keys only. Missing equipped sprite clears persisted **`equippedAssetId`**. New Hall of Fame rows store **`catAssetId`**; legacy rows keep **`catUrl`**.
- **GameEngine.tsx** — Main loop (`requestAnimationFrame`): physics, collisions, spawning, boss fight. Accepts optional **`levelConfig`** (App passes **`getLevelConfig(levelId)`**); falls back to **`LEVEL_REGISTRY[levelId]`**. Boss defeat invokes **`onVictoryFinalize`(`VictoryFinalizePayload`)** before VICTORY so **`App`** Hall of Fame uses authoritative engine score. Stomp / slow-on-contact / arc projectile motion keyed off **`ObstacleDefinition.behaviors`** via **`systems/levelBehaviorHelpers.ts`**; stomp/slow outcomes prefer **`stompCollision` / `slowCollision`** on defs when present (**`collisionHandlers`**, engine passes **`getObstacleDef`**). Player layout from **`resolvePlayerAnchor(theme)`** (**`systems/playerAnchor.ts`**). Background spawn **`systems/backgroundSpawn.ts`**; parallax views **`levels/levelBackgroundViews.tsx`** + **`levels/beach/backgroundEntities.tsx`**. Boss pose and projectile spawn in **`systems/bossSystem.ts`** (`projectileAimX`); boss React UI loaded lazily from **`systems/bossComponents.tsx`** using **`BossConfig.componentId`**. Reads **runtime tuning** from `useTuningStore()`. Logs **telemetry** via `runTelemetry`. Uses **`systems/behaviors.ts`** and **`systems/collisionHandlers.ts`**.

### Game Mechanics (tuning + GameEngine)
- **Defaults** (overridable in dev panel): gravity `0.75`, jump force `17`, ground Y `100`, boss entry after **`bossThreshold`** coins (default **50**), power-up spawn cadence via `powerupThreshold` / `streakRequired`, spawn intervals and assist graces in `TuningProfile`.
- **Scoring:** Coins = 1, shells = 5; multiplier scales with streak.
- **Double jump:** `jumpCount`, max 2 before landing.
- **Power-ups:** SPEED (~1.7x), MAGNET, SUPER_SIZE (scale + invincibility) — exact tuning from store.

### Level configuration
- **`levels/beach.ts`** — `BEACH_LEVEL_CONFIG` (`LevelConfig`). **`levels/index.ts`** — `LEVEL_REGISTRY`, `getLevelConfig`. **App** passes **`levelConfig`** into **GameEngine**. **`mergeLevelTuning`** / **`getBossEntryCoinThreshold`** (`levels/catalog.ts`) shared by App + engine — **[docs/LEVEL_RUNTIME.md](./docs/LEVEL_RUNTIME.md)**. [ROADMAP_V2.md](./ROADMAP_V2.md) (V2 complete); archive: `docs/ROADMAP_V1_COMPLETE.md`.

### Dev tooling: balance panel and telemetry
- **`components/dev/BalancePanel.tsx`** — Sliders for `TuningProfile`, named presets in **localStorage**, reset to defaults, **export telemetry JSON**.
- **`systems/tuning/useTuningStore.ts`** — Hook for tuning + presets.
- **`systems/telemetry/runTelemetry.ts`** — Factory for run logger; damage / death / run_summary events.

### Component Architecture
- **LevelSelection.tsx** — Home-screen level cards; unlock copy from **`levels/catalog.ts`**.
- **Kitty.tsx** — Player; Canvas API for AI-generated sprite backgrounds.
- **ObstacleComponent.tsx** — Shared pickups (COIN, SHELL, power-ups); beach hazards via **`useLevelContext`** + **`levels/beach/obstacles.tsx`** (`BeachObstacleIcon`).
- **contexts/LevelContext.tsx** — `levelId` for level-specific obstacle art (provided by **GameEngine**).
- **SandMonster.tsx** — Boss.
- **CatCustomizer.tsx** — Gemini-powered custom cats; **`mode: 'indexed'`** (asset ids + `ingestClosetDataUrl` w/ `contentKey` dedup, player vs look naming, **`onClosetLookDelete`** persists removals + IDB sprite delete) vs **`mode: 'legacy'`** (data URLs in localStorage).
- **HallOfFameCatAvatar.tsx** — Resolves **`catAssetId`** via blob URL or falls back to **`catUrl`**.
- **AnimatedWater.tsx** — Water background.

### AI Integration (`services/geminiService.ts` + `api/cat/*` + `server/catApiHandlers.ts`)
- Frontend calls same-origin **`/api/cat/*`**; Vercel handlers and Vite `devApiMiddleware` delegate to **`server/catApiHandlers.ts`**, with **`server/catApiProtection.ts`** / **`server/catApiVercelPreflight.ts`** for caps and rate limits (**[docs/API_PROTECTION.md](./docs/API_PROTECTION.md)**). Client **`fetch`** timeouts via **`AbortController`**; server Gemini calls use **`Promise.race`** timeouts in **`server/geminiGateway.ts`**.
- Server uses `GEMINI_API_KEY`; image model `GEMINI_IMAGE_MODEL` (default `gemini-2.5-flash-image`).
- `getCatWisdom`, `getDeathMessage`, `generateCustomCat` (returns **`GenerateCatImageResult`**: success + `meta` or `code`/`message` on failure). Image prompt: **`server/prompts/customCatSprite.ts`** (`CUSTOM_CAT_SPRITE_PROMPT_VERSION`; sanitized user block + injection-mitigation copy).
- **Server matting:** After a successful PNG from Gemini, **`server/matCustomCatSprite.ts`** runs the same flood-fill / chroma-key logic as the client via **`services/catSpriteMattingCore.ts`** and **`sharp`**. Response **`meta.mattedOnServer`** is true when matting applied. On failure or non-PNG input, the raw image is returned. The client still runs **`useMatteCatUrl`** / **`catSpriteMatting.ts`** for legacy IndexedDB sprites and as a safety net.

### Types (`types.ts`)
- `GameStatus`, obstacle/power-up/entity unions, `WorldEntity`, `Obstacle`, `Bullet`, `Particle`, `PlayerState`, `GameScore`, persistence types.
- **Multi-level scaffolding:** `LevelId`, `BehaviorType`, `ObstacleDefinition`, `LevelConfig`, `ThemeConfig`, `BossConfig`, `BackgroundConfig`, etc.

### Pattern system
- **Runtime:** `levelConfig.patterns` from **`LEVEL_REGISTRY`** (cloned into spawn queue; scaled by score / lives in engine).

### Behavior and collision modules
- **`systems/behaviors.ts`** — `computeSwoopY`, `checkPoopDrop(obs, …, spec)` (falling projectile spawn; `spec` from level `dropProjectile.projectileType`).
- **`systems/levelBehaviorHelpers.ts`** — `obstacleHasBehavior`, `pickSeagullSpawnVariant`, `resolveDropProjectileSpec`.
- **`systems/collisionHandlers.ts`** — `handleBounceCollision`, `handleSlowCollision`, `handleHarmfulCollision`, `CollisionResult`.
- **`LevelConfig.magnetAttractTypes`** — entities pulled during MAGNET (default `['COIN']` in engine if omitted).
- **`BossConfig.projectileObstacleType`** — boss shot obstacle type (default `SAND_PROJECTILE`).

### Audio (`services/audioService.ts`, `services/sfxService.ts`)
- **Music:** Web Audio procedural beats; tempo vs game speed; boss mode. **rAF + lookahead** scheduling (`nextBeatTime`) instead of `setInterval`.
- **SFX:** `sfxService` — file-backed + procedural fallbacks; `GameEngine` preloads and routes `playSound` through it.

### Phaser 3 Integration (V3)
- **`components/PhaserGame.tsx`** — React wrapper that mounts a `Phaser.Game` inside a div. Accepts `sceneFactory` (lazy import), `levelId`, `catSpriteUrl`, `sceneInitData`, and callback props for bridge events. Full Phaser restart on `levelId` change; `applyRuntimePatch` for mid-run tuning updates.
- **`scenes/shared/SceneBridge.ts`** — Abstract base class extending `Phaser.Scene`. All genre scenes extend this. Defines 6 bridge events: `SCORE_UPDATE`, `LIVES_CHANGED`, `LEVEL_COMPLETE`, `GAME_OVER`, `STATUS_CHANGE`, `HUD_UPDATE`. Protocol constants and interfaces live in `scenes/shared/bridgeProtocol.ts` (importable without Phaser browser globals).
- **`scenes/shared/SpriteLoader.ts`** — Loads cat sprite blob URL into Phaser texture cache during `preload()`.
- **Rendering rule:** Phaser owns gameplay rendering; React owns UI (menus, HUD, campaign screen, cutscenes).
- **Code splitting rule:** Never statically import all scene classes. Use `sceneFactory: () => import('./scenes/BeachScene')` for lazy loading.
- **`CAMPAIGN_LEVEL_META` vs `LEVEL_REGISTRY`:** `CAMPAIGN_LEVEL_META` (in `levels/catalog.ts`) lists all 9 levels with display metadata for the campaign screen. `LEVEL_REGISTRY` (in `levels/index.ts`) only contains levels with actual runtime configs. The campaign screen reads from meta; `getLevelConfig()` reads from the registry and throws for unimplemented levels.

## Roadmap V2 and known gaps

See **[ROADMAP_V2.md](./ROADMAP_V2.md)** and **[KNOWN_ISSUES.md](./KNOWN_ISSUES.md)** for the active backlog. Short summary for agents:

- **GameEngine.tsx** remains a large monolith: physics, spawning, collisions, HUD, boss wiring. Beach parallax lives in **`levels/beach/backgroundEntities.tsx`** with spawn in **`backgroundSpawn.ts`**; optional further splits in V2.
- **`/api/cat/*`:** Rate limits, body caps, client/server timeouts, and prompt isolation are documented in **docs/API_PROTECTION.md**; upgrade path for serverless is shared-store / Edge limits.
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

- **[docs/LEVEL_DEVELOPMENT.md](./docs/LEVEL_DEVELOPMENT.md)** — Adding a `LevelId`, `LevelConfig`, registry, obstacle art, boss UI.
- **[docs/LEVEL_RUNTIME.md](./docs/LEVEL_RUNTIME.md)** — Runtime contract: tuning merge, boss threshold, ownership table.
- **[docs/BEHAVIOR_SYSTEM.md](./docs/BEHAVIOR_SYSTEM.md)** — `BehaviorType`, `levelBehaviorHelpers`, `behaviors.ts`, `collisionHandlers.ts`, boss shots.
- **[docs/QA_CHECKLIST.md](./docs/QA_CHECKLIST.md)** — Manual QA before releases; browser playthrough + customizer + `/api/cat/*` + reduced motion.

## Project tracking

- **[ROADMAP_V2.md](./ROADMAP_V2.md)** — Active roadmap for current work.
- **[docs/ROADMAP_V1_COMPLETE.md](./docs/ROADMAP_V1_COMPLETE.md)** — Completed roadmap archive for phases 1–9.
- **[PROGRESS.md](./PROGRESS.md)** — Session log (newest first).
- **[KNOWN_ISSUES.md](./KNOWN_ISSUES.md)** — Parking lot and technical debt.
