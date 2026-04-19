# Repo Cleanup And Roadmap Consolidation Design

**Date:** 2026-04-19
**Status:** Proposed canonical design for repo cleanup, docs normalization, and roadmap consolidation
**Primary Canonical Artifacts After Cleanup:** `ROADMAP_V3.md`, `PROGRESS.md`

---

## Overview

CatRunner has outgrown its current documentation shape. The codebase now reflects a multi-genre Phaser campaign with nine registered levels, scene-based runtime routing, asset-pipeline work in progress, and a growing QA/performance burden. The repository documentation does not reflect that reality cleanly.

There are too many parallel planning surfaces, too much root-level planning residue, and too much ambiguity about which roadmap or spec is authoritative. `KNOWN_ISSUES.md` is also no longer the right mechanism for tracking active defects or debt. That file should exit the workflow in favor of GitHub issues.

This design establishes:

- one active root roadmap: `ROADMAP_V3.md`
- one active root progress log: `PROGRESS.md`
- a docs-first organization for durable reference material
- archival treatment for superseded planning/status files
- GitHub issues as the only active issue tracker
- a hardened `ROADMAP_V3.md` that absorbs relevant unfinished work from prior plans and current WIP
- explicit integration of the Game Studio plugin/skills into the default development workflow

---

## Goals

- Make it unambiguous which roadmap the project is working from.
- Aggressively clean up the root of the repo while preserving history.
- Reorganize docs into a deliberate information architecture under `docs/`.
- Fold unfinished work from prior roadmap/spec artifacts into one hardened `ROADMAP_V3.md`.
- Remove `KNOWN_ISSUES.md` from the active workflow and archive it.
- Require new defects, regressions, and debt items to be tracked as GitHub issues.
- Preserve `PROGRESS.md` at the repo root as the ongoing session log.
- Incorporate the current uncommitted platformer hero-sheet and matting pipeline work into the canonical roadmap.
- Adopt Game Studio plugin workflows as part of the project’s execution model.

---

## Non-Goals

- This pass does not redesign gameplay systems or re-architect scene internals beyond documenting future work.
- This pass does not resolve every known runtime/product issue during the documentation cleanup itself.
- This pass does not erase historical material; it reclassifies and archives it.
- This pass does not replace GitHub issues with a new markdown-based issue queue.

---

## Current Reality Snapshot

The repo’s live state is ahead of several of its top-level planning documents.

What is true in the codebase now:

- The project is a Phaser-based multi-genre browser game, not just an endless runner.
- All nine campaign levels are represented in `CAMPAIGN_LEVEL_META` and `LEVEL_REGISTRY`.
- `App.tsx` routes levels to genre-specific lazy scene imports.
- The test, typecheck, and build baselines are green.
- The current worktree contains unfinished but coherent platformer hero-sheet and sprite-matting pipeline work.
- Some docs still describe earlier phases of the project or older assumptions about the repo.

This mismatch is the root problem. The cleanup should align docs with the actual codebase and current direction.

---

## Canonical Workflow Decisions

### Root-Level Canonical Files

After cleanup, the active root planning/status surface should be:

- `ROADMAP_V3.md` — the only active roadmap
- `PROGRESS.md` — the only active running progress log

Other root files remain for their distinct roles:

- `README.md` — product/repo overview
- `AGENTS.md` — contributor/agent guidance
- `CLAUDE.md` — twin guidance doc for Claude-oriented workflows
- `PROJECT_STATE.md` — optional cross-surface summary, but must match repo reality

### Removed From Active Workflow

The following should no longer participate in day-to-day planning truth:

- `ROADMAP.md`
- `ROADMAP_V2.md`
- `ROADMAP_V3_SPEC.md`
- `KNOWN_ISSUES.md`

These become archived or supporting historical artifacts under `docs/archive/`.

### Issue Tracking Policy

`KNOWN_ISSUES.md` is sunset.

Going forward:

- bugs become GitHub issues
- technical debt that needs tracking becomes GitHub issues
- regressions become GitHub issues
- roadmap work belongs in `ROADMAP_V3.md`
- session history belongs in `PROGRESS.md`
- durable reference material belongs in `docs/`

There should be no new markdown parking lot for “known issues.”

---

## Target Documentation Information Architecture

The `docs/` directory should be promoted from a mixed stash into a curated structure.

### Active Documentation

#### `docs/architecture/`

Use for durable technical/system references:

- runtime architecture
- Phaser bridge and scene contracts
- asset storage and cat generation architecture
- scene ownership boundaries
- audio/runtime/rendering contracts

Examples likely to live here:

- level runtime behavior docs
- API protection docs
- scene bridge/runtime docs
- asset pipeline reference docs

#### `docs/product/`

Use for gameplay/product truth:

- campaign semantics
- progression model
- scoring/star semantics
- Hall of Fame meaning
- player-facing flow documentation

#### `docs/plans/`

Use for active execution plans that support roadmap work:

- implementation plans
- project-level execution breakdowns
- concrete milestone plans tied to roadmap workstreams

#### `docs/specs/`

Use for active design specs that still inform current work:

- design decisions still relevant to current implementation
- active level/feature specs that remain canonical support documents

### Historical Documentation

#### `docs/archive/`

Use for superseded material only:

- old roadmaps
- old specs/plans that were replaced
- old audit reports if no longer part of the active workflow
- archived `KNOWN_ISSUES.md`
- any obsolete planning docs retained for history

Archive material should be preserved, but visually and structurally separated from current project truth.

---

## Hardened `ROADMAP_V3.md` Design

`ROADMAP_V3.md` becomes the single command center for active project direction.

### Required Sections

#### 1. Canonical Status

State explicitly that:

- `ROADMAP_V3.md` is the only active roadmap
- `PROGRESS.md` is the ongoing progress log
- GitHub Issues are the active issue tracker
- prior roadmap/spec files are historical inputs, not competing sources of truth

#### 2. Current Reality Snapshot

Capture the real repo state at the time of rewrite:

- multi-genre Phaser architecture exists
- 9 level configs and scene routes exist
- current health baseline
- current major risks/gaps
- current WIP status, including hero-sheet/matting work

#### 3. Provenance And Consolidation Notes

Include a short, explicit mapping of what was absorbed from:

- `ROADMAP_V2.md`
- `ROADMAP_V3_SPEC.md`
- active/superseded plan docs
- current uncommitted platformer hero-sheet pipeline work
- audit findings produced during the repo review

This section eliminates ambiguity about “which roadmap won.”

#### 4. Guardrails

Document project rules such as:

- only one active roadmap at the root
- `PROGRESS.md` remains at the root
- no active `KNOWN_ISSUES.md`
- new issues must be filed in GitHub
- supporting docs live under `docs/`

#### 5. Workstreams

The roadmap should group work into a small number of durable workstreams:

- Repo and docs normalization
- Correctness and campaign coherence
- QA and verification infrastructure
- Asset pipeline and content tooling
- Performance and shipping readiness

#### 6. Active Sequence

This section should define execution order, dependencies, and near-term milestones.

Recommended sequence:

1. Repo/docs cleanup and canonical migration
2. Correctness fixes that can break player flow
3. Hero-sheet/asset-pipeline integration
4. Deterministic QA harness and playtest flow
5. Performance/bundle cleanup
6. Ongoing content/campaign polish

#### 7. Deferred / Not In Scope

Use this section only for explicit scope boundaries. It is not a substitute for GitHub issues.

---

## Workstreams To Carry Forward

The hardened roadmap should absorb incomplete work from older materials and current WIP.

### Workstream A: Repo And Docs Normalization

Scope:

- aggressive root cleanup
- archive stale roadmaps/specs/plans
- formalize `docs/` taxonomy
- align `README.md`, `AGENTS.md`, `CLAUDE.md`, and `PROJECT_STATE.md`

Acceptance criteria:

- one active roadmap at root
- one active progress log at root
- no active `KNOWN_ISSUES.md`
- no ambiguous competing planning docs in root
- internal doc links updated

### Workstream B: Correctness And Campaign Coherence

Scope:

- fix the victory-screen non-runner `getLevelConfig()` bug
- remove hardcoded scene-specific `levelId` emissions where `this.levelId` should be authoritative
- make Hall of Fame and progression semantics honest for a multi-genre campaign

Acceptance criteria:

- victory UI works across all genres
- scene bridge payloads honor the configured level id
- campaign progression and Hall of Fame semantics are consistent and visible

### Workstream C: QA And Verification Infrastructure

Scope:

- deterministic scene-level smoke coverage where practical
- campaign/browser verification flow
- screenshot-backed game QA
- formal scene verification expectations

Acceptance criteria:

- repeatable verification path for boot, play, game-over, and victory flows
- documented browser-game QA workflow
- reduced dependence on memory/manual confidence alone

### Workstream D: Asset Pipeline And Content Tooling

Scope:

- fold in current platformer hero-sheet work
- formalize sprite-sheet generation, matting, anchor alignment, and preview validation
- treat asset preparation as a supported toolchain, not one-off local experimentation

Acceptance criteria:

- current platformer hero-sheet work is represented in the roadmap
- sprite generation/matting/normalization steps are documented and reproducible
- asset workflow is consistent with Game Studio plugin expectations

### Workstream E: Performance And Shipping Readiness

Scope:

- investigate oversized chunks
- improve code splitting and scene boundaries where needed
- establish performance/release gates

Acceptance criteria:

- bundle/performance work appears explicitly in the roadmap
- release confidence is tied to concrete checks, not only “build passed”

---

## Game Studio Plugin Integration

The project should adopt Game Studio plugin skills as the default execution grammar for future browser-game work.

### Default Workflow Layer

- `game-studio` — umbrella routing skill for browser-game work
- `phaser-2d-game` — default runtime/gameplay implementation path
- `sprite-pipeline` — default path for 2D sprite-sheet generation, normalization, and alignment work
- `game-playtest` — default path for browser game smoke tests, screenshot QA, HUD review, and scene verification

### Roadmap Integration

`ROADMAP_V3.md` should explicitly tie workstreams to these skills:

- runtime and gameplay work defaults through `game-studio` -> `phaser-2d-game`
- sprite and hero-sheet work defaults through `sprite-pipeline`
- scene and campaign QA defaults through `game-playtest`

### Why This Matters

This prevents the roadmap from being only a task list. It gives the team a consistent workflow model for:

- implementation
- asset production
- browser verification
- playtesting

The current platformer hero-sheet WIP should be positioned as the first concrete example of this integrated workflow.

---

## Current Uncommitted WIP To Fold In

The current dirty worktree reflects a coherent line of work and should be absorbed into the hardened roadmap rather than ignored.

Observed WIP themes:

- platformer hero-sheet integration in `scenes/PlatformerScene.ts`
- new hero-sheet support files under `scenes/platformer/`
- sprite matting/matting-test improvements in `services/catSpriteMattingCore.ts`
- helper scripts for platformer hero generation and matting
- doc updates for dev commands and hero-sheet workflow

This work should be represented in the roadmap as active asset-pipeline and platformer-content/tooling work, not treated as detached local noise.

---

## Migration Plan

The cleanup should happen in one structured pass.

### Phase 1: Inventory And Classification

Classify every planning/status doc as one of:

- canonical active
- active support doc
- historical/archive
- obsolete/remove

Deliverable:

- a migration table used to drive file moves and rewrite decisions

### Phase 2: Rewrite `ROADMAP_V3.md`

Create the canonical active roadmap by folding in:

- unfinished V2/V3 work
- V3 spec decisions that still matter
- active plans/specs that still inform execution
- current hero-sheet/matting WIP
- audit findings and roadmap-worthy follow-ups
- Game Studio execution model

Deliverable:

- a single hardened active roadmap with explicit provenance

### Phase 3: Normalize `docs/`

Move docs into active or archived buckets and update internal links.

Deliverable:

- `docs/architecture/`
- `docs/product/`
- `docs/plans/`
- `docs/specs/`
- `docs/archive/`

### Phase 4: Sunset `KNOWN_ISSUES.md`

Archive the file and remove it from all active references and workflow guidance.

Deliverable:

- archived historical file
- no active references in guidance/docs/scripts
- explicit GitHub-issues policy in canonical docs

### Phase 5: Align Top-Level Surfaces

Rewrite top-level descriptive docs to match actual repo reality.

Deliverable:

- root docs no longer contradict the live codebase

### Phase 6: Preserve Continuity

Make sure the cleaned repo still explains:

- what is active now
- what history was archived
- what current WIP exists
- what work comes next

Deliverable:

- no lost context
- no competing sources of truth

---

## Acceptance Criteria

This design is successful when:

- `ROADMAP_V3.md` is the only active root roadmap
- `PROGRESS.md` remains the active root progress log
- `KNOWN_ISSUES.md` is archived and removed from the workflow
- GitHub Issues are documented as the active issue tracker
- root-level planning clutter is removed
- `docs/` has a clear active/historical structure
- old roadmap/spec ambiguity is eliminated
- the current platformer hero-sheet WIP is represented in the roadmap
- Game Studio plugin workflows are explicitly embedded in the active plan
- top-level docs describe the project as it actually exists today

---

## Risks And Mitigations

### Risk: Over-cleaning could break links or erase useful context

Mitigation:

- archive rather than delete historical planning material
- update links as part of the same pass
- preserve provenance in `ROADMAP_V3.md`

### Risk: The roadmap rewrite becomes a rewrite of every supporting doc

Mitigation:

- keep `ROADMAP_V3.md` authoritative and concise
- use supporting docs for detail, not competing strategy

### Risk: Current WIP gets lost during documentation cleanup

Mitigation:

- explicitly capture it in the roadmap’s current-reality and workstream sections before file moves

### Risk: Team members continue using archived files out of habit

Mitigation:

- remove stale files from root
- add explicit canonical-status language to `ROADMAP_V3.md`, `AGENTS.md`, and `CLAUDE.md`

---

## Recommendation

Proceed with an aggressive cleanup centered on a rewritten `ROADMAP_V3.md`, a docs-first information architecture, archived historical planning materials, and GitHub issues as the only active issue tracker.

This is the right moment to do it because the codebase has already crossed the threshold where documentation drift now creates real execution risk.
