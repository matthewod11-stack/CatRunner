# Behavior System

This document describes the shared helper stack used by the **Phaser runner scene**. Other genres can keep their own local managers and do not need to adopt these abstractions unless the mechanic is genuinely shared.

## `BehaviorType` (`types.ts`)

| Value | Role in runner |
|-------|----------------|
| `swoop` | Seagull dive Y uses `computeSwoopY` while `isSwooping`. Dive stomp requires this on the definition. |
| `dropProjectile` | Poop-variant flyers; optional `projectileType` spawns a projectile entity through shared helpers. |
| `bounce` | Stomp-from-above uses `handleBounceCollision` (for example beachball). |
| `stomp` | Stomp-from-above with crab-like tuning via the same collision helper family. |
| `slowOnContact` | Side hit routes through `handleSlowCollision` (slowdown, pass). |
| `static` | No special movement in the behavior layer. |
| `arcProjectile` | Parabolic or aimed motion each frame; boss shots and falling drops use the same physics path when typed. |

## `systems/levelBehaviorHelpers.ts`

- `obstacleHasBehavior(def, behavior)` — used for arc physics, stomp routing, and slow collisions.
- `pickSeagullSpawnVariant`, `resolveDropProjectileSpec` — seagull-specific helper logic.
- `resolveObstacleSpawnY(spawnY, fallback)` — numeric or `{ min, max }` spawn height when no pattern `y` override exists.
- `resolveSwoopConfig(def)` — reads `swoop` behavior config with sensible defaults.

## `systems/behaviors.ts`

- `computeSwoopY(obsX, screenWidth, params?)` — eased dive trajectory for swooping entities.
- `checkPoopDrop(obs, now, lowLives, canSpawn, spec)` — returns a new `WorldEntity` or `null`.

## `systems/backgroundSpawn.ts`

`spawnBackgroundEntities` owns runner background spawn decisions from `LevelConfig.background`. `RunnerScene` consumes those entities and renders them in Phaser.

## `systems/collisionHandlers.ts`

Pure **`CollisionResult`** builders:

- `handleBounceCollision(obsType, tuning, obstacleDef?)`
- `handleSlowCollision(obsType, obstacleDef?)`
- `handleHarmfulCollision()`

`RunnerScene` applies the returned side effects locally: particles, score changes, refs, and status changes.

## `harmfulTypes` vs behaviors

- **`harmfulTypes`** in `LevelConfig` drives damage-on-collision unless stomp, slow, or invincibility logic overrides it.
- **Behaviors** describe motion and preferred collision branches.

Keep them consistent: a stompable hazard can still be in `harmfulTypes` for non-stomp hits.

## Boss projectiles

[`systems/bossSystem.ts`](../systems/bossSystem.ts) owns spawn cadence and projectile specs. Projectile **type** comes from `BossConfig.projectileObstacleType`, which must match an obstacle entry with `arcProjectile`.

## Tuning

Runtime difficulty knobs live in **`useTuningStore`** / [`systems/tuning/defaultTuning.ts`](../systems/tuning/defaultTuning.ts). Per-level **`LevelConfig.tuningOverrides`** are shallow-merged over the store through `mergeLevelTuning`, and both `App` and `RunnerScene` must use the same merged values so boss thresholds, HUD state, and gameplay stay aligned.

## Related

- [`level-development.md`](./level-development.md)
- Historical design notes: `docs/archive/plans/2026-03-01-phase3-behavior-system-design.md`
