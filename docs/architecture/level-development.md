# Level Development Guide

How to add or evolve a playable level in Beach Kitty. The only supported gameplay runtime is Phaser-first: **`App`** selects a level, **`PhaserGame`** boots the genre scene, and **`SceneBridge`** carries shared runtime state back to React.

**Runtime ownership (App vs Phaser bridge, tuning merge, boss coins):** [level-runtime.md](./level-runtime.md).

## Prerequisites

- Read [`types.ts`](../types.ts) for `LevelId`, genre config types, `ObstacleDefinition`, `PatternStep`, `ThemeConfig`, `BossConfig`, and `BackgroundConfig`.
- Before starting an art pass, scaffold the level pipeline docs and asset folders with `npm run scaffold:level-art -- --level LEVEL_ID`; see [`level-art-pipeline.md`](./level-art-pipeline.md).
- Reference implementations:
  - Runner: [`levels/beach.ts`](../levels/beach.ts) + [`scenes/RunnerScene.ts`](../scenes/RunnerScene.ts)
  - Non-runner: [`levels/rooftops.ts`](../levels/rooftops.ts) + [`scenes/PlatformerScene.ts`](../scenes/PlatformerScene.ts)

## Checklist

### 1. Extend shared ids only when the runtime truly shares them

In [`types.ts`](../types.ts):

- Add the new id to `LevelId` when you are creating a new campaign level.
- Extend shared unions such as `ObstacleType`, `EntityType`, or `BackgroundEntityType` only when the new concept must flow through level config, bridge payloads, persistence, or shared systems.
- Keep purely scene-local art and manager state local to `scenes/<genre>/` whenever possible.

### 2. Author the level config and campaign metadata

Create something like `levels/volcano.ts` exporting the genre-appropriate config:

| Concern | Where it lives |
|--------|-----------------|
| Runner-specific spawn/config data | `LevelConfig` in `levels/<id>.ts` |
| Other genres | Their genre-specific config types in `types.ts` and `levels/<id>.ts` |
| Campaign name, description, pose, stars, victory copy | `CAMPAIGN_LEVEL_META` in [`levels/catalog.ts`](../levels/catalog.ts) |

Runner configs still own:

- `obstacles`, `patterns`, `harmfulTypes`, `background`, `boss`, `magnetAttractTypes`
- `tuningOverrides`, merged through `mergeLevelTuning`
- `bossEntryCoinThreshold`, resolved through `getBossEntryCoinThreshold`

Non-runner configs should stay honest to their scene needs instead of imitating the runner schema.

### 3. Register the level

In [`levels/index.ts`](../levels/index.ts):

- Import the config.
- Add it to `LEVEL_REGISTRY`.

In [`levels/catalog.ts`](../levels/catalog.ts):

- Add or update the matching `CAMPAIGN_LEVEL_META` entry.
- Let `LEVEL_ORDER` derive from metadata; do not create a separate manual order list.

### 4. Implement or evolve the scene

- Add or update the scene class under `scenes/`.
- Keep the scene rooted in [`scenes/shared/SceneBridge.ts`](../scenes/shared/SceneBridge.ts).
- Pass only the scene init data the genre actually needs through [`scenes/shared/bridgeProtocol.ts`](../scenes/shared/bridgeProtocol.ts).
- Emit score, HUD, game-over, and level-complete events through the bridge instead of mutating React state directly.

### 5. Keep rendering and managers scene-local by default

- Backgrounds, hazards, enemies, bosses, and hit effects should usually live under `scenes/<genre>/` or the scene file itself.
- Promote logic into `systems/` only when multiple scenes truly share it or when the helper is already part of the runner runtime.
- Avoid rebuilding React-side render layers for gameplay entities; gameplay presentation belongs in Phaser now.

### 6. Reuse runner helpers only when you are changing the runner

These shared helpers remain valid because the Phaser runner uses them:

- [`systems/backgroundSpawn.ts`](../systems/backgroundSpawn.ts)
- [`systems/bossSystem.ts`](../systems/bossSystem.ts)
- [`systems/collisionHandlers.ts`](../systems/collisionHandlers.ts)
- [`systems/levelBehaviorHelpers.ts`](../systems/levelBehaviorHelpers.ts)

If you are working on platformer, launcher, shooter, breakout, frogger, whack, snake, or climber flows, prefer genre-local managers instead of bending them into runner abstractions.

### 7. App and selection UI

[`components/LevelSelection.tsx`](../components/LevelSelection.tsx) reads campaign metadata plus registry state; no extra UI wiring is required if the config and `CAMPAIGN_LEVEL_META` entry are registered. Unlock state persists through [`services/levelProgress.ts`](../services/levelProgress.ts), with one-way migration from the old defeated-bosses key.

### 8. Verify

- `npm run test:run`
- `npx tsc --noEmit`
- `npm run build`
- Play from level select, finish or fail a run, reload, and confirm unlock persistence plus Hall of Fame/result behavior.

## Type Vocabulary

Global unions in [`types.ts`](../types.ts) (`ObstacleType`, `BackgroundEntityType`, `LevelId`) should stay **small and shared**. Use this decision guide when adding content:

**Promote to a shared type** when:

- The concept must live in level config, persistence, bridge payloads, or reusable helper systems.
- Another level is likely to reuse the same mechanic with the same behavior semantics.

**Keep it scene-local** when:

- The asset is decorative or presentation-only.
- The mechanic is experimental and only one scene understands it.
- The data never needs to leave that scene’s managers or config file.

## Registration Surfaces

| Concern | Where to register |
|--------|-------------------|
| Config + campaign order | `LEVEL_REGISTRY`, `CAMPAIGN_LEVEL_META` |
| Scene boot | `PhaserGame` scene factory + `SceneBridge` init contract |
| Shared HUD / completion flow | `bridgeProtocol` + `App.tsx` handlers |
| Runner-only helper reuse | `systems/backgroundSpawn.ts`, `bossSystem.ts`, `collisionHandlers.ts`, `levelBehaviorHelpers.ts` |

## Related

- [`level-art-pipeline.md`](./level-art-pipeline.md) — repeatable art, manifest, hero-sheet, and QA pipeline
- [`behavior-system.md`](./behavior-system.md) — runner helper stack
- [`CLAUDE.md`](../CLAUDE.md) / [`AGENTS.md`](../AGENTS.md) — repo map for agents
