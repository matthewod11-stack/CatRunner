# Level development guide

How to add a new playable level to Beach Kitty. The game is built so **data** (config + optional art modules) drives **`GameEngine`**; avoid hardcoding new `levelId` checks in the engine when a config field already exists.

**Runtime ownership (App vs engine, tuning merge, boss coins):** [LEVEL_RUNTIME.md](./LEVEL_RUNTIME.md).

## Prerequisites

- Read [`types.ts`](../types.ts) for `LevelId`, `LevelConfig`, `ObstacleDefinition`, `PatternStep`, `ThemeConfig`, `BossConfig`, `BackgroundConfig`.
- Reference implementation: [`levels/beach.ts`](../levels/beach.ts), [`levels/beach/obstacles.tsx`](../levels/beach/obstacles.tsx).

## Checklist (new level)

### 1. Extend `LevelId` and obstacle types (if needed)

In [`types.ts`](../types.ts):

- Add the new id to `LevelId` (e.g. `'VOLCANO'`).
- If the level introduces **new hazard types**, extend `ObstacleType` and `EntityType` as needed. Shared pickups (`COIN`, `SHELL`, power-ups) usually stay global.

### 2. Author `LevelConfig`

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

### 3. Register the level

In [`levels/index.ts`](../levels/index.ts):

- Import the new config.
- Add it to `LEVEL_REGISTRY`.

In [`levels/catalog.ts`](../levels/catalog.ts):

- Append the id to **`LEVEL_ORDER`** in campaign order (unlocking is linear: beat previous boss).

### 4. Obstacle rendering

- **Shared entities** (`COIN`, `SHELL`, `SPEED`, `MAGNET`, `SUPER_SIZE`) render in [`components/ObstacleComponent.tsx`](../components/ObstacleComponent.tsx).
- **Level-specific art** (today: beach) lives under `levels/<id>/obstacles.tsx` and is selected via [`contexts/LevelContext.tsx`](../contexts/LevelContext.tsx) inside **`GameEngine`**’s `LevelProvider`.

For a new level:

1. Add `levels/<id>/obstacles.tsx` exporting a memoized icon component and `is<MyLevel>ObstacleType` (or a generic pattern).
2. In `ObstacleComponent`, branch on `levelId` and the type guard (mirror the `BEACH` + `BeachObstacleIcon` pattern).

### 5. Background parallax (spawn + art)

- **Spawn (all levels):** [`systems/backgroundSpawn.ts`](../systems/backgroundSpawn.ts) — **`spawnBackgroundEntities`**. **`GameEngine`** passes the resolved `LevelConfig.background` plus `getBgEntityDef`; no `levelId` branch in the engine for spawn logic.
- **Renderer registry:** [`levels/levelBackgroundViews.tsx`](../levels/levelBackgroundViews.tsx) — add your level to **`BACKGROUND_ENTITY_VIEW_BY_LEVEL`**. Implement a `React.FC<{ b: BackgroundEntity }>` (see **`BeachBackgroundEntityView`** in [`levels/beach/backgroundEntities.tsx`](../levels/beach/backgroundEntities.tsx)).
- Ensure every `BackgroundEntityType` you reference in **`entities`** / spawn pools has a matching case in your view component (or a shared default branch).

### 6. Boss UI (optional new boss)

- Register a lazy component in [`systems/bossComponents.tsx`](../systems/bossComponents.tsx) and extend `BossComponentId` in `types.ts`.
- Set `boss.componentId` on the level config.

### 7. App / selection UI

[`components/LevelSelection.tsx`](../components/LevelSelection.tsx) reads **`LEVEL_ORDER`** and `getLevelConfig`; no change required if the registry and order are updated. Unlock state is persisted in **`beach-cat-defeated-bosses-v1`** ([`services/levelProgress.ts`](../services/levelProgress.ts)).

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
| Config + unlock order | `LEVEL_REGISTRY`, `LEVEL_ORDER` |
| Parallax SVG | `BACKGROUND_ENTITY_VIEW_BY_LEVEL` in [`levels/levelBackgroundViews.tsx`](../levels/levelBackgroundViews.tsx) |
| Obstacle art | `ObstacleComponent` + `levels/<id>/obstacles.tsx` |
| Boss face | `bossComponents` + `BossComponentId` |

## Optional splits

[`ROADMAP_V2.md`](../ROADMAP_V2.md) tracks current work, and the completed multi-level roadmap archive at [`ROADMAP_V1_COMPLETE.md`](./ROADMAP_V1_COMPLETE.md) notes the optional split of a large `beach.ts` into `config.ts` / `patterns.ts` — cosmetic organization only.

## Related

- [`docs/BEHAVIOR_SYSTEM.md`](./BEHAVIOR_SYSTEM.md) — behaviors and collisions
- [`CLAUDE.md`](../CLAUDE.md) / [`AGENTS.md`](../AGENTS.md) — repo map for agents
