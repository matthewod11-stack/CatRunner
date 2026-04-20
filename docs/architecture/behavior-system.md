# Behavior system

This document describes the legacy DOM-runner behavior stack used by **`GameEngine`**. Obstacle **movement** and **collision routing** mix declarative **`ObstacleDefinition.behaviors`** with small pure modules; `GameEngine` applies side effects (sound, particles, refs) while the helper modules stay pure. New Phaser-first genre scenes may use different local managers and do not need to adopt this exact behavior stack unless they are intentionally reusing it.

## `BehaviorType` (`types.ts`)

| Value | Role in engine |
|-------|----------------|
| `swoop` | Seagull dive Y uses `computeSwoopY` while `isSwooping`. Dive stomp requires this on the definition. |
| `dropProjectile` | Poop-variant flyers; optional `projectileType` → spawned entity; timing via `checkPoopDrop`. |
| `bounce` | Stomp-from-above uses `handleBounceCollision` (e.g. beachball). |
| `stomp` | Stomp-from-above with crab-like tuning via same handler. |
| `slowOnContact` | Side hit → `handleSlowCollision` (slowdown, pass). |
| `static` | No special motion in behavior layer (may still scroll with world). |
| `arcProjectile` | Parabolic / aimed motion each frame; boss shots and falling drops use the same physics path when typed. |

## Seagull composition

Spawn variant **`dive` vs `poop`** comes from [`pickSeagullSpawnVariant`](../systems/levelBehaviorHelpers.ts) (`swoop` + `dropProjectile` on the same def → random mix; only one → that mode).

Drops: [`resolveDropProjectileSpec`](../systems/levelBehaviorHelpers.ts) reads `dropProjectile.projectileType` and sizes from `LevelConfig.obstacles`, plus optional delay overrides on the same behavior’s **`config`**: `poopDelayBase`, `poopDelayRange`, `poopDelayBaseLowLives`, `poopDelayRangeLowLives` (defaults in [`checkPoopDrop`](../systems/behaviors.ts)). [`checkPoopDrop`](../systems/behaviors.ts) takes that spec (or `null` if no drops).

## `systems/levelBehaviorHelpers.ts`

- `obstacleHasBehavior(def, behavior)` — used for arc physics, stomp routing, slow collisions.
- `pickSeagullSpawnVariant`, `resolveDropProjectileSpec` — seagull-specific.
- `resolveObstacleSpawnY(spawnY, fallback)` — numeric or `{ min, max }` spawn height; used for seagull pool spawns when no pattern `y` override.
- `resolveSwoopConfig(def)` — reads `swoop` behavior **`config`**: `swoopStartY`, `swoopLowY`, `swoopEndY` (defaults 400 / 170 / 280).

## `systems/behaviors.ts`

- `computeSwoopY(obsX, screenWidth, params?)` — eased dive trajectory; `params` from `resolveSwoopConfig`.
- `checkPoopDrop(obs, now, lowLives, canSpawn, spec)` — returns a new `WorldEntity` or `null`.

## `systems/collisionHandlers.ts`

Pure **`CollisionResult`** builders (points, sounds, `markAs`, bounce force, slow duration):

- `handleBounceCollision(obsType, tuning, obstacleDef?)` — prefers `obstacleDef.stompCollision` when set; else legacy per-type defaults.
- `handleSlowCollision(obsType, obstacleDef?)` — prefers `obstacleDef.slowCollision` when set; else legacy tidepool vs sandcastle tint defaults.
- `handleHarmfulCollision()` — generic hurt (lives handled in engine).

The legacy DOM runner maps results through a local **`applyCollisionResult`** (particles, score popups, refs).

## `harmfulTypes` vs behaviors

- **`harmfulTypes`** in `LevelConfig`: membership in this list drives damage-on-collision (unless stomp / slow / invincibility applies).
- **Behaviors** describe *how* to move and *which* collision branch to prefer (stomp vs slow vs harmful).

Keep them consistent: a stompable hazard can still be in `harmfulTypes` for non-stomp hits.

## Boss projectiles

Spawn rate and pose: [`systems/bossSystem.ts`](../systems/bossSystem.ts). Projectile **type** comes from `BossConfig.projectileObstacleType` (must match an obstacle entry with `arcProjectile`).

## Tuning

Runtime difficulty knobs live in **`useTuningStore`** / [`systems/tuning/defaultTuning.ts`](../systems/tuning/defaultTuning.ts). Per-level **`LevelConfig.tuningOverrides`** are shallow-merged over the store inside the legacy DOM runner (and the same merge is applied in **`App`** for runner boss coin target / HUD alignment).

## Related

- [`level-development.md`](./level-development.md)
- Phase 3 plan (historical): `docs/archive/plans/2026-03-01-phase3-behavior-system-design.md`
