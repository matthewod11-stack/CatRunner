# Level development guide

How to add or evolve a playable level in Beach Kitty. The live project is Phaser-first: **`App`** selects a level, **`PhaserGame`** boots the genre scene, and **`SceneBridge`** carries shared bridge state back to React. The older **`GameEngine`** path still exists only for the legacy `?dom_runner` fallback.

**Runtime ownership (App vs Phaser bridge, tuning merge, boss coins):** [level-runtime.md](./level-runtime.md).

## Prerequisites

- Read [`types.ts`](../types.ts) for `LevelId`, `LevelConfig`, `ObstacleDefinition`, `PatternStep`, `ThemeConfig`, `BossConfig`, `BackgroundConfig`.
- Reference implementation: [`levels/beach.ts`](../levels/beach.ts), [`levels/beach/obstacles.tsx`](../levels/beach/obstacles.tsx).

## Checklist (new level)

### 1. Extend `LevelId` and obstacle types (if needed)

In [`types.ts`](../types.ts):

- Add the new id to `LevelId` (e.g. `'VOLCANO'`).
- If the level introduces **new hazard types**, extend `ObstacleType` and `EntityType` as needed. Shared pickups (`COIN`, `SHELL`, power-ups) usually stay global.

### 2. Author `LevelConfig` and campaign metadata

Create something like `levels/volcano.ts` exporting `VOLCANO_LEVEL_CONFIG: LevelConfig` that satisfies:

| Section | Purpose |
|--------|---------|
| `obstacles` | `ObstacleDefinition[]`: `type`, `width`, `height`, `behaviors`, `isHarmful`, `spawnWeight`, optional `spawnY`, optional **`stompCollision`** / **`slowCollision`** (see `systems/collisionHandlers.ts`) |
| `patterns` | `PatternStep[][]` — spawn sequences (`type`, `delay`, optional `y`) |
| `theme` | `groundY`, `skyGradient`, optional `skyProgressMode` (`coinsToBoss` default vs `static`), `particleColors`, `speedLineThreshold`, `screenShakeDecay`, optional `groundKickParticles`, optional **`playerAnchorLeftPx`** / **`playerAnchorLeftPxSuperSized`** (see `systems/playerAnchor.ts`) |
| `boss` | Health, hitbox, movement, `projectile`, optional `componentId`, optional `projectileObstacleType` |
| `background` | `entities` + `spawnInterval`; optional **`chaosSpawnTypes`**, **`midLayerSpawnTypes`**, **`cloudSpawnChance`**, **`cloudEntityType`** (see [`systems/backgroundSpawn.ts`](../systems/backgroundSpawn.ts)); per-entity **`spawnYRange`**, **`spawnEdge`**, **`defaultBannerText`** |
| `harmfulTypes` | `EntityType[]` used for damage and spawn safety |
| `magnetAttractTypes` | Optional; default in engine is `['COIN']` |
| `tuningOverrides` | Shallow-merged over dev `useTuningStore` values inside **`GameEngine`** for this run |
| `bossEntryCoinThreshold` | Optional; overrides coin (star) count needed to trigger the boss (else merged tuning `bossThreshold`). App HUD / sky use the same rule via `getBossEntryCoinThreshold` |

Boss shots must target an obstacle type that includes the **`arcProjectile`** behavior (see [`docs/BEHAVIOR_SYSTEM.md`](./BEHAVIOR_SYSTEM.md)).

### `LevelConfig` vs runtime (what the engine actually uses)

- **Patterns, obstacles, harmfulTypes, magnet, boss, background** — read each run from the resolved `LevelConfig` in **`GameEngine`**.
- **`spawnY` on `ObstacleDefinition`** — used when spawning from the weighted pool (e.g. seagull); pattern steps can still pass explicit `y`.
- **`tuningOverrides`** — merged with the global tuning store for all engine physics/spawn tuning on that level.
- **`bossEntryCoinThreshold`** — boss entry coin count for both engine trigger and App HUD / progressive sky (with the same merge as above for the fallback `bossThreshold`).
- **`theme.skyProgressMode` / `skyGradient`** — `App` only: progressive sky/sun vs fixed gradient during play (see `getSkyStyle`).

Then add a `CAMPAIGN_LEVEL_META` entry in [`levels/catalog.ts`](../levels/catalog.ts) in the intended campaign order. `LEVEL_ORDER` now derives from that metadata automatically, so do not maintain a separate manual order list.

### 3. Register the level

In [`levels/index.ts`](../levels/index.ts):

- Import the new config.
- Add it to `LEVEL_REGISTRY`.

### 4. Obstacle rendering

- **Shared entities** (`COIN`, `SHELL`, `SPEED`, `MAGNET`, `SUPER_SIZE`) render in [`components/ObstacleComponent.tsx`](../components/ObstacleComponent.tsx).
- **Level-specific art in the legacy DOM runner path** (today: beach) lives under `levels/<id>/obstacles.tsx` and is selected via [`contexts/LevelContext.tsx`](../contexts/LevelContext.tsx) inside **`GameEngine`**’s `LevelProvider`.

For new Phaser-first genre scenes, prefer scene-local rendering and managers under `scenes/<genre>/` rather than routing new art through the DOM runner component stack.

For the legacy DOM runner path:

1. Add `levels/<id>/obstacles.tsx` exporting a memoized icon component and `is<MyLevel>ObstacleType` (or a generic pattern).
2. In `ObstacleComponent`, branch on `levelId` and the type guard (mirror the `BEACH` + `BeachObstacleIcon` pattern).

### 5. Background parallax (spawn + art)

- **Spawn in the legacy DOM runner path:** [`systems/backgroundSpawn.ts`](../systems/backgroundSpawn.ts) — **`spawnBackgroundEntities`**. **`GameEngine`** passes the resolved `LevelConfig.background` plus `getBgEntityDef`; no `levelId` branch in the engine for spawn logic.
- **Renderer registry:** [`levels/levelBackgroundViews.tsx`](../levels/levelBackgroundViews.tsx) — add your level to **`BACKGROUND_ENTITY_VIEW_BY_LEVEL`**. Implement a `React.FC<{ b: BackgroundEntity }>` (see **`BeachBackgroundEntityView`** in [`levels/beach/backgroundEntities.tsx`](../levels/beach/backgroundEntities.tsx)).
- Ensure every `BackgroundEntityType` you reference in **`entities`** / spawn pools has a matching case in your view component (or a shared default branch).

For Phaser-first scenes, keep parallax/background rendering in the scene module or its managers unless you are explicitly extending the legacy DOM runner path.

### 6. Boss UI (optional new boss)

- Register a lazy component in [`systems/bossComponents.tsx`](../systems/bossComponents.tsx) and extend `BossComponentId` in `types.ts`.
- Set `boss.componentId` on the level config.

### 7. App / selection UI

[`components/LevelSelection.tsx`](../components/LevelSelection.tsx) reads campaign metadata plus registry state; no extra UI wiring is required if the config and `CAMPAIGN_LEVEL_META` entry are registered. Unlock state persists through **`loadCompletedLevels`** / **`saveCompletedLevels`** in [`services/levelProgress.ts`](../services/levelProgress.ts), with one-way migration from the old defeated-bosses key.

### 8. Verify

- `npm run build`
- Play from level select, full run, boss defeat, reload — confirm unlock persistence and no console errors.

## Type vocabulary (multi-level)

Global unions in [`types.ts`](../types.ts) (`ObstacleType`, `BackgroundEntityType`, `LevelId`) should stay **small and shared**. Use this decision guide when adding content:

**Extend `ObstacleType` / include in `LevelConfig.obstacles`** when:

- The hazard participates in the **weighted spawn pool**, **patterns**, **boss projectiles**, or **magnet** lists typed as `EntityType` / `ObstacleType`, or
- Another level might **reuse** the same mechanic with the same collision/behavior semantics.

**Keep level-local instead** (custom component + string literals or a level-local union) when:

- The asset is **purely decorative** or only used inside one level module, or
- You are **experimenting** — promote to a global type once the obstacle is wired into `GameEngine` spawn/collision paths.

**`BackgroundEntityType`** follows the same idea: parallax rows referenced from **`BackgroundConfig.entities`** and spawn pools must use global types so `BackgroundEntity` stays serializable and engine-agnostic. Level-unique deco that never goes through `background.entities` could stay inside a level-only TS module until you need it in config.

**`PatternStep.type` / `harmfulTypes`:** must use `EntityType` members that the engine understands; add to global unions when introducing a new harm/stomp/slow obstacle.

**Registration surfaces for a new level**

| Concern | Where to register |
|--------|-------------------|
| Config + campaign order | `LEVEL_REGISTRY`, `CAMPAIGN_LEVEL_META` |
| Parallax SVG | `BACKGROUND_ENTITY_VIEW_BY_LEVEL` in [`levels/levelBackgroundViews.tsx`](../levels/levelBackgroundViews.tsx) |
| Obstacle art | `ObstacleComponent` + `levels/<id>/obstacles.tsx` |
| Boss face | `bossComponents` + `BossComponentId` |

## Optional splits

[`ROADMAP_V3.md`](../../ROADMAP_V3.md) tracks current work, and the completed multi-level roadmap archive at [`ROADMAP_V1_COMPLETE.md`](../archive/roadmaps/ROADMAP_V1_COMPLETE.md) notes the optional split of a large `beach.ts` into `config.ts` / `patterns.ts` — cosmetic organization only.

## Related

- [`behavior-system.md`](./behavior-system.md) — behaviors and collisions
- [`CLAUDE.md`](../CLAUDE.md) / [`AGENTS.md`](../AGENTS.md) — repo map for agents
