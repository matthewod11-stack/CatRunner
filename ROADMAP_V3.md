# Beach Kitty Roadmap V3

## Canonical Status

- `ROADMAP_V3.md` is the only active roadmap.
- `PROGRESS.md` is the active session log and stays at the repo root.
- GitHub Issues are the only active issue tracker for bugs, regressions, and technical debt.
- This roadmap is the canonical project plan for the live nine-level campaign codebase, not a speculative future-state document.

## Current Reality Snapshot

- Beach Kitty is a multi-genre Phaser campaign with React owning shell/UI and Phaser owning gameplay scenes.
- The repo currently has 9 registered level configs and 9 scene routes covering runner, platformer, launcher, shooter, breakout, frogger, whack, snake, and climber.
- `App.tsx` routes genre-specific lazy scene imports through `PhaserGame`, and `levels/index.ts` registers all 9 runtime configs.
- The supported gameplay runtime is Phaser-only; the old DOM-runner fallback is retired.
- Browser smoke coverage now exists for campaign boot, Kitty Closet, Phaser boot/eject, victory/game-over mutation, and Hall of Fame ordering/cap behavior.
- The current baseline is green for `npm run test:run`, `npx tsc --noEmit`, and `npm run build`.
- Current verification baseline on 2026-04-21:
  - `npm run test:run` -> 42 test files passing, 196 tests passing
  - `npm run test:smoke` -> 3 Playwright browser tests passing
  - `npx tsc --noEmit` -> exit 0
  - `npm run build` -> exit 0, with an oversized main bundle warning (`dist/assets/index-*.js` about 1.85 MB minified / 452 kB gzip)
- The codebase is ahead of several repo docs: campaign runtime is real, but some guidance files still describe earlier endless-runner or V2-era assumptions.
- Current active gaps already identified by audit:
  - non-runner victory label bug caused by runner-only level lookup assumptions
  - hardcoded scene `levelId`s in several Phaser scenes despite `SceneBridge` already owning `levelId`
  - Hall of Fame UI needs genre-aware labeling because scores are level-specific
  - the main application bundle is still too large for the intended scene-splitting architecture
- Current asset-pipeline work includes the platformer hero-sheet and sprite-matting WIP that needs to stay visible in active planning.

## Provenance And Consolidation Notes

- This roadmap absorbs unfinished and still-relevant material from the previous V2 roadmap, the previous V3 spec, active level specs and implementation plans, the 2026-04-19 repo-roadmap consolidation design, and the current platformer hero-sheet/matting WIP.
- The intent of this consolidation is simple: one roadmap wins, while older planning artifacts become historical inputs or support docs rather than competing sources of truth.
- Work that remains valid from earlier planning is carried forward here only if it matches live code, current repo shape, or active WIP already present in the project.
- Repo cleanup decisions in this roadmap assume that supporting specs, plans, and architecture references live under `docs/`, while root-level project truth stays limited to the canonical roadmap and the active progress log.
- While repo-entry docs are still being normalized, `ROADMAP_V3.md` and live code win whenever `README.md`, `AGENTS.md`, `CLAUDE.md`, `PROJECT_STATE.md`, or other support docs drift.

## Guardrails

- Keep exactly one active roadmap at the repo root: `ROADMAP_V3.md`.
- Keep `PROGRESS.md` at the repo root as the running session ledger.
- Track new bugs, regressions, and debt in GitHub Issues only.
- Do not recreate a markdown parking-lot issue file.
- Treat `README.md`, `AGENTS.md`, `CLAUDE.md`, and `PROJECT_STATE.md` as secondary guidance that must stay aligned with this roadmap and the live codebase.
- Prefer live-code verification over stale planning language when the two disagree.
- Preserve the existing multi-genre Phaser architecture and scene-splitting direction; cleanup work should clarify and harden it, not collapse it back into runner-only assumptions.

## Execution Model (Game Studio / Phaser / Sprite Pipeline / Game Playtest)

Default execution model:

- `game-studio` routes browser-game work
- `phaser-2d-game` is the default implementation path for runtime/gameplay changes
- `sprite-pipeline` is the default path for 2D sprite-sheet and hero-sheet work
- `game-playtest` is the default path for browser smoke tests, screenshots, HUD review, and scene QA

Operational expectations:

- Runtime changes should preserve the React shell / Phaser scene ownership boundary already established by `PhaserGame` and `SceneBridge`.
- Scene work should keep lazy imports intact and avoid reintroducing static all-scenes bundling.
- Sprite and hero-sheet work should flow through the existing cat asset, matting, and scene-integration pipeline rather than becoming one-off local hacks.
- QA should combine automated checks (`npm run test:run`, `npx tsc --noEmit`, `npm run build`) with browser playtest coverage for HUD, progression, victory, and custom-cat flows.
- QA should keep the Playwright smoke harness (`npm run test:smoke`) aligned with the stable campaign boot and outcome flows.

## Workstreams

### Repo/docs normalization

- Finish the source-of-truth cleanup so the repo has one active roadmap, one active progress log, and a curated `docs/` structure.
- Bring `README.md`, `AGENTS.md`, `CLAUDE.md`, `PROJECT_STATE.md`, and helper scripts into alignment with the live multi-genre Phaser project.
- Remove ambiguity about where active specs, plans, archives, and historical material live.

### Correctness/campaign coherence

- Fix the non-runner victory label bug caused by runner-only config access in victory copy.
- Replace hardcoded scene `levelId`s with `SceneBridge`-derived values so scene payloads stay generic and trustworthy.
- Make Hall of Fame presentation genre-aware so stored `levelId` context is visible in campaign UI.
- Continue tightening campaign-state and level-result flows so per-level semantics remain honest across genres.

### QA infrastructure

- Keep the green baseline on `npm run test:run`, `npx tsc --noEmit`, and `npm run build`.
- Keep the green baseline on `npm run test:run`, `npm run test:smoke`, `npx tsc --noEmit`, and `npm run build`.
- Expand scene-aware smoke coverage and QA checklists around HUD, victory/game-over flow, progression unlocks, and custom-cat rendering.
- Build a durable playtest loop that makes browser verification normal rather than ad hoc.

### Asset pipeline/tooling

- Treat the current platformer hero-sheet and sprite-matting WIP as active roadmap work, not side work.
- Harden the hero-sheet workflow into a repeatable asset-pipeline path for genre-specific cat presentation.
- Align sprite-generation, matting, storage, and scene-consumption docs and tooling around the live Phaser campaign.

### Performance/shipping readiness

- Reduce the oversized main bundle and validate scene chunking remains effective.
- Keep production build, runtime load behavior, and shipping checks aligned with the lazy-scene architecture.
- Use performance cleanup to support shipping readiness, not as isolated benchmark work.

## Active Sequence

1. Complete repo/docs normalization first because it removes execution ambiguity and establishes one trusted planning surface, but do not artificially delay critical player-facing correctness fixes discovered during cleanup.
2. Address correctness and campaign-coherence follow-ups that can mislead players or break genre-agnostic behavior:
   - non-runner victory label bug
   - hardcoded scene `levelId`s
   - genre-aware Hall of Fame presentation
3. Carry the platformer hero-sheet and matting WIP through the asset pipeline/tooling workstream so it becomes the first hardened example of the sprite workflow.
4. Expand QA infrastructure around browser smoke tests, HUD review, scene verification, and release checks.
5. Reduce the oversized main bundle and tighten shipping readiness without breaking lazy scene routing.

## Deferred / Not In Scope

- This roadmap does not reopen older phase-by-phase mega-plans as active execution trackers.
- This roadmap does not use root markdown files as a substitute for GitHub Issues.
- This roadmap does not promise score normalization across all genres before the Hall of Fame is made genre-aware.
- This roadmap does not treat every historical planning document as still active just because it remains archived in the repo.
