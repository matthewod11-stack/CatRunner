# V4 Phaser-Only Reset Design

> Archived on 2026-04-21 after the Phaser-only reset landed.

## Summary

Beach Kitty should reset in place around the architecture that is already winning: `App` as the React shell, `PhaserGame` as the gameplay host, and `SceneBridge` as the React/Phaser boundary. The V4 reset is a hard cut, not a gradual migration. `GameEngine`, `?dom_runner`, and the DOM-runner extension path stop being part of the supported runtime.

This is not a rewrite-from-scratch and not a new repo. It is a repo cleanup and architectural reset that preserves the healthy Phaser-first campaign while deleting the half-retired fallback seam that keeps confusing the codebase.

## Goal

Make Beach Kitty a single-runtime project:

- `App` owns campaign flow, save/persistence, Hall of Fame, customizer, and shell UI.
- `PhaserGame` and genre scenes own gameplay for every supported level.
- `SceneBridge` owns runtime event flow back to React.
- There is no supported DOM-runner gameplay path.

## Why This Reset Exists

The repo audit shows one architectural seam creating disproportionate confusion and maintenance cost:

1. `App.tsx` still statically imports `GameEngine`, even though Phaser is the default runtime.
2. The `?dom_runner` switch changes the gameplay runtime at the app level rather than being scoped to a narrow internal tool or a verified compatibility mode.
3. `GameEngine` still resolves its runtime from `LEVEL_REGISTRY[levelId]`, but the legacy renderer stack is not a general multi-genre runtime.
4. The legacy renderer stack is beach-oriented in practice:
   - `ObstacleComponent` has beach-specific rendering logic.
   - `levelBackgroundViews.tsx` only registers `BEACH`.
   - the fallback path has no dedicated verification coverage.
5. Active docs still describe how to extend the DOM-runner path, which teaches contributors to invest in a runtime that should be retiring.

The result is a repo with one good architecture and one confusing shadow architecture. V4 removes the shadow architecture.

## Decision

V4 will use the following approach:

- Hard-cut the DOM-runner path rather than isolating or archiving it first.
- Preserve player data compatibility.
- Defer the platformer hero-sheet and related asset-pipeline WIP until after the reset.
- Keep the current repo and carry forward only the code that matches the Phaser-first architecture.

## Non-Goals

V4 is not intended to:

- rebuild Beach Kitty in a new repository
- redesign the campaign or change level order
- reset local save data or Hall of Fame history
- mix the runtime reset with the platformer hero-sheet / sprite-pipeline WIP
- perform broad aesthetic refactors, renames, or folder reshuffles that are not required for the hard cut
- normalize scores across genres as part of this reset

## Architectural Target

### Supported runtime

The only supported gameplay runtime after V4 is:

`App` -> `PhaserGame` -> genre scene -> `SceneBridge` -> `App`

That flow must handle:

- level selection
- gameplay boot
- HUD updates
- game over
- level completion
- victory progression
- persistence updates

### Unsupported runtime

The following concepts become unsupported after V4:

- `?dom_runner`
- `GameEngine` as an alternate gameplay host
- DOM-rendered obstacle/background/boss runtime extension patterns
- docs that instruct contributors to extend the fallback runtime

## Carry Forward

The reset explicitly preserves these parts of the current project:

### React shell and app state

- `App.tsx` campaign shell
- `components/LevelSelection.tsx`
- `components/CatCustomizer.tsx`
- `components/MatteCatImage.tsx`
- top-level progress, Hall of Fame, and customizer flows

### Phaser runtime

- `components/PhaserGame.tsx`
- `scenes/shared/SceneBridge.ts`
- `scenes/shared/bridgeProtocol.ts`
- `scenes/shared/PhaserAudio.ts`
- all active Phaser scenes under `scenes/`

### Level and campaign model

- `levels/index.ts`
- `levels/catalog.ts`
- campaign ordering and metadata helpers
- level config registry and genre selection

### Persistence and player data

- `services/levelProgress.ts`
- `services/levelCompletion.ts`
- `services/runOutcome.ts`
- `services/hallOfFame.ts`
- cat asset storage and migration services
- compatible local save behavior for completed levels, results, Hall of Fame, and cat assets

### Shared utilities that still serve Phaser

Any utility originally shared with `GameEngine` but still referenced by Phaser scenes remains in place. Likely examples include:

- `systems/backgroundSpawn.ts`
- `systems/collisionHandlers.ts`
- `systems/levelBehaviorHelpers.ts`
- `systems/bossSystem.ts`

These are not legacy by origin alone. They should only be deleted if they become truly unreachable after the hard cut.

## Delete / Remove

The reset is expected to remove the following categories of code.

### Runtime gate and fallback switching

- `?dom_runner` query-param switching in `App.tsx`
- the `GameEngine` render branch in `App.tsx`
- any active code that treats the DOM runner as a valid alternate runtime

### Legacy gameplay host

- `components/GameEngine.tsx`

### DOM-runner-only support subtree

Delete the files that become unreachable after `GameEngine` is removed, including the current legacy-only rendering stack:

- `components/GameCanvas.tsx`
- `components/ObstacleComponent.tsx`
- `components/Kitty.tsx`
- `components/SandMonster.tsx`
- `contexts/LevelContext.tsx`
- `levels/levelBackgroundViews.tsx`
- `systems/bossComponents.tsx`

### DOM-runner-only services

Delete legacy-only services once dependency checks confirm Phaser scenes do not use them:

- `services/audioService.ts`
- `services/sfxService.ts`

### Legacy guidance

Delete or rewrite active docs that still explain how to extend the DOM-runner architecture.

## Data Compatibility

V4 preserves player-facing local data compatibility.

The reset must not intentionally break:

- completed level persistence
- per-level results / star storage
- Hall of Fame entries
- cat asset storage
- migrated cat character state

The runtime may simplify, but the storage model remains continuous.

## Deferred Work

The following stays out of scope during the reset:

- platformer hero-sheet WIP
- sprite matting / asset-pipeline experimentation beyond what is already needed for current cat rendering
- bundle-reduction work not directly caused by the hard cut
- new scene features or gameplay expansion

The reset should reduce noise before that work resumes.

## Execution Shape

V4 should execute in four phases.

### Phase 1: Phaser-only gate

- Remove the `?dom_runner` branch from `App.tsx`.
- Make `PhaserGame` the only gameplay runtime for `PLAYING` and `BOSS_FIGHT`.
- Keep the current scene-factory architecture intact.

Success condition:

- gameplay always boots through `PhaserGame`
- `App` no longer renders `GameEngine`

### Phase 2: Legacy subtree removal

- Delete `GameEngine`.
- Remove the DOM-runner-only support files that become unreachable.
- Keep shared utilities only if Phaser still imports them.

Success condition:

- no active import graph path reaches the DOM-runner subtree

### Phase 3: Docs and source-of-truth rewrite

- Rewrite active docs so Phaser-first is the only supported runtime model.
- Remove guidance that teaches contributors to add new obstacle/background/boss work through the DOM-runner stack.
- Update roadmap/support docs so the reset becomes explicit project truth.

Success condition:

- no active docs describe the DOM runner as an extension path

### Phase 4: Hardening and verification

- verify tests, typecheck, and build
- run a targeted smoke pass on:
  - campaign -> level boot
  - HUD updates
  - level completion / victory
  - game over
  - Hall of Fame updates
  - custom cat rendering

Success condition:

- Phaser-only runtime behaves correctly across normal player flows

## Risks

### Shared-helper false positives

Some modules look legacy because `GameEngine` imports them, but Phaser scenes also use them. Deleting them by association would create regressions.

Mitigation:

- remove only after reference checks
- typecheck after each cleanup wave

### App-state regression

The `App` runtime branch currently touches gameplay boot, runner tuning, pause state, and persistence wiring. Simplifying the branch can break legitimate Phaser flows if done sloppily.

Mitigation:

- keep the Phaser branch structurally intact
- remove the fallback rather than refactoring the healthy path

### Docs drift after code cut

Even after code cleanup, stale docs can keep reintroducing the old mental model.

Mitigation:

- include docs rewrite as a first-class phase, not a follow-up nice-to-have

## Acceptance Criteria

V4 is complete when all of the following are true:

1. `App.tsx` no longer imports or renders `GameEngine`.
2. There is no supported `?dom_runner` gameplay path.
3. `GameEngine` and its DOM-runner-only subtree are removed.
4. Active docs describe only the Phaser-first runtime.
5. Existing player data remains compatible.
6. `npm run test:run`, `npx tsc --noEmit`, and `npm run build` are green.
7. Targeted smoke coverage confirms campaign, gameplay, completion, and custom-cat flows still work.

## Practical Scope Rule

When deciding whether a file stays or goes, use this test:

- If it is required by the Phaser-first runtime, keep it.
- If it exists only to support `GameEngine` or DOM-runner extension patterns, delete it.
- If unclear, prove reachability before deleting.

That keeps the reset strict without turning it into an indiscriminate purge.
