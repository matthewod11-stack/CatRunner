# Beach Kitty Roadmap V4

## Canonical Status

- `ROADMAP_V4.md` is the only active roadmap.
- `docs/archive/roadmaps/ROADMAP_V3_2026-04-23_phaser-runtime-cleanup.md` archives the Phaser migration / cleanup roadmap that V4 replaces.
- `PROGRESS.md` remains the active root session log.
- `docs/` remains the home for supporting architecture, product, plan, and spec material.
- GitHub Issues remain the active tracker for bugs and technical debt.

## Mission

Finish Level 1 (`BEACH`) as a genuinely fun, readable, visually complete runner while establishing a repeatable asset pipeline for the rest of the campaign.

## Why V4 Exists

- Phaser-only runtime, campaign routing, persistence, and smoke coverage already exist.
- The main blocker is no longer engine migration; it is product quality and asset discipline.
- Level 1 still depends on ad hoc PNG loading, placeholder texture reuse, static-cat presentation, and matting-oriented rescue logic.
- Future levels will keep stalling unless world art, hero animation, and cleanup rules become repeatable instead of improvised.

## Product Principles

- Gameplay first. A fun runner beats a clever generator demo.
- World art is generated or authored ahead of time, reviewed, cleaned, and committed.
- Gameplay cat must be animated; a single static render is not enough for Level 1 completion.
- Live cat generation is optional and off the critical path.
- Asset contracts must be reusable by later levels with minimal rethinking.

## Level 1 Complete Means

- Beach environment, obstacles, collectibles, background entities, and boss all use intentional final art rather than placeholder or reused stand-ins.
- The playable cat uses a proper runner animation sheet wired into `RunnerScene`.
- Visual readability, scale, parallax, hit feedback, and HUD integration feel production-ready in manual play.
- Asset-generation workflow is documented well enough that Level 2 can reuse it without another strategy reset.
- Verification passes on `npm run test:run`, `npm run test:smoke`, `npx tsc --noEmit`, and `npm run build`, plus a focused manual Beach playtest.

## Asset Generation Strategy

### World Art

- Generate or author world art outside the runtime, then commit cleaned finals to the repo.
- Accept only true alpha or intentional opaque full-bleed art. Fake transparency, checkerboard backgrounds, and runtime chroma rescue are not shippable world-art workflows.
- Keep source prompts, selection notes, cleanup rules, and export specs alongside the asset process, not in scattered chat memory.

### Cat Art

- Level 1 assumes a curated animated runner hero sheet as the gameplay baseline.
- The current live cat generator is not required for Beach completion.
- If live cat generation survives, it becomes a closet/reference feature or a later constrained sheet-generation workflow, not the dependency that blocks Beach gameplay quality.
- Any future gameplay cat customization must conform to the same hero-sheet contract as the default hero.

### Repeatability

- Each future level should follow the same loop: art brief -> prompt pack or source generation -> selection -> cleanup -> manifest integration -> runtime QA.
- The Beach level is the proving ground for this pipeline, not a one-off exception.

## Active Sequence

1. Freeze the asset strategy and gameplay-cat approach before producing more Beach art.
2. Build the Beach world-art pack and runner hero sheet.
3. Refactor Level 1 runtime to consume stable art contracts rather than ad hoc individual PNG swaps.
4. Run focused Level 1 feel, readability, and playtest passes.
5. Capture the resulting process as the default art pipeline for the remaining levels.

## Phase 0 - Pipeline Decisions

- [ ] Confirm the Level 1 gameplay-cat strategy: curated animated runner sheet first, live generator optional.
- [ ] Finalize `docs/architecture/asset-pipeline.md` as the operating contract for prompts, exports, cleanup, manifests, and acceptance checks.
- [ ] Build the Level 1 asset inventory covering environment layers, obstacles, collectibles, background entities, boss states, HUD/support art, and FX needs.
- [ ] Decide what stays on the Level 1 critical path versus what becomes deferred:
  - live closet generation
  - gameplay cat customization
  - post-Beach multi-level asset generalization
- [ ] Identify the first runtime integration targets: `scenes/RunnerScene.ts`, Beach asset folders, any new asset manifest module, and related docs.

Acceptance criteria:

- Beach art direction and gameplay-cat strategy are explicit.
- The repo has one documented answer for how art is generated and cleaned.
- No one needs to infer the process from old matting code or chat history.

## Phase 1 - Beach World Art Pack

- [ ] Produce the Beach visual brief covering palette, line style, contrast, horizon treatment, parallax depth, and UI relationship.
- [ ] Generate or author the final environment layer set:
  - sky treatment
  - sun
  - cloud variants
  - ocean tile
  - foam strip
  - sand tile
- [ ] Generate or author the final obstacle and collectible pack:
  - crab variants
  - seagull variants
  - beachball
  - shell
  - sandcastle
  - palm tree
  - projectile / power-up visuals
- [ ] Generate or author the final background entity pack:
  - boat
  - sinking boat
  - airplane
  - airplane-fire
  - surfer
  - jetski
- [ ] Generate or author the Sand Monster art pack with enough readable state coverage for idle, attack, hit, and defeat.

Acceptance criteria:

- No Level 1 world art depends on runtime matting.
- No non-coin gameplay element ships with the coin texture as a stand-in.
- Asset scale, baseline, and transparency rules match the documented pipeline.

## Phase 2 - Runner Hero Animation

- [ ] Define the Beach runner hero-sheet contract:
  - idle
  - run loop
  - jump rise
  - jump apex / fall
  - duck
  - hurt
  - shell throw
  - victory / defeat
- [ ] Produce the default Beach hero sheet and wire it as the Level 1 gameplay baseline.
- [ ] Add animation-state handling to `RunnerScene` for movement, ducking, damage, boss attack, and end-state transitions.
- [ ] Document collision-box alignment, feet placement, and sheet padding so future swaps do not require code archaeology.
- [ ] Defer dynamic per-user animated cat generation unless it can fit the same contract without slowing Beach completion.

Acceptance criteria:

- Gameplay cat is not a single static image during normal play.
- Animation changes map cleanly to runner state.
- Beach remains fun and readable even with live cat generation disabled.

## Phase 3 - Runtime Integration Cleanup

- [ ] Replace `RunnerScene`'s loose hard-coded asset loading with a Beach asset manifest or key registry.
- [ ] Remove placeholder texture reuse for power-ups and projectiles by giving each shipped visual its own deliberate treatment.
- [ ] Audit scale, baseline, hitbox, and parallax tuning against final art rather than placeholder stand-ins.
- [ ] Keep gameplay art loading deterministic and committed; no runtime calls to image models for world building.
- [ ] Preserve current smoke, progression, and persistence behavior while refactoring asset plumbing.

Acceptance criteria:

- Level 1 art ownership is understandable without reading the entire scene file.
- Visual swaps are localized enough that later levels can copy the pattern.
- Runtime behavior stays stable while art plumbing gets cleaned up.

## Phase 4 - Level 1 Polish And Playtest

- [ ] Run targeted Beach manual playtests for jump readability, obstacle recognition, boss clarity, and progression pacing.
- [ ] Polish HUD placement, pause/readability surfaces, hit flashes, particles, and scene transitions against the final art layer.
- [ ] Capture screenshots or short video for docs and future art consistency checks.
- [ ] Confirm victory, game over, Hall of Fame, and replay flows still feel coherent once the final art is in place.

Acceptance criteria:

- Beach looks intentionally art-directed rather than wireframe.
- Manual play feels fair and readable.
- Automated checks remain green after the art pass.

## Phase 5 - Make It Repeatable

- [ ] Turn the Beach process into the default level-art pipeline for future levels.
- [ ] Create reusable templates for:
  - level art brief
  - prompt pack
  - asset manifest
  - QA checklist
- [ ] Apply the same hero-sheet contract approach to the next genre once Beach is stable.
- [ ] Record which steps are model-assisted, which are manual cleanup, and which are runtime integration so later levels do not rediscover the workflow.

Acceptance criteria:

- Moving to Level 2 reuses the same pipeline with a different art brief instead of a new strategy debate.
- The repo has a durable answer for world art, hero sheets, and cleanup expectations.

## Not In Scope

- Shipping dynamic per-user animated gameplay cats before Beach is complete.
- Generating world art on demand inside the game runtime.
- Reopening the Phaser migration / DOM-runner transition as active work.
- Broad full-campaign polish before Beach establishes the final pipeline.
