# Repo Cleanup And Roadmap Consolidation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Consolidate CatRunner onto one active root roadmap (`ROADMAP_V3.md`), move durable support material into a curated `docs/` structure, archive superseded planning/status files, sunset `KNOWN_ISSUES.md`, and align the repo’s guidance/docs with the actual multi-genre Phaser project.

**Architecture:** Execute the cleanup in a dedicated worktree so the current dirty `main` checkout remains untouched. Treat `ROADMAP_V3.md` and `PROGRESS.md` as the only active root planning artifacts, move active support docs into `docs/architecture/`, `docs/product/`, `docs/plans/`, and `docs/specs/`, and move superseded files into `docs/archive/`. Fold current platformer hero-sheet/matting WIP and the Game Studio workflow into the rewritten roadmap rather than losing that context.

**Tech Stack:** Markdown, git worktrees, shell (`rg`, `mv`, `mkdir`), React/TypeScript repo docs, GitHub issues (`gh` or GitHub app), existing Vitest/Vite build checks

---

## File Structure Map

### Files To Create

- `docs/README.md`
- `docs/archive/README.md`
- `docs/architecture/`
- `docs/product/`
- `docs/archive/roadmaps/`
- `docs/archive/issues/`
- `docs/archive/reports/`
- `docs/archive/process/`
- `docs/archive/plans/`
- `docs/archive/specs/`

### Files To Rewrite Or Modify

- `ROADMAP_V3.md`
- `README.md`
- `AGENTS.md`
- `CLAUDE.md`
- `PROJECT_STATE.md`
- `PROGRESS.md`
- `scripts/dev-init.sh`
- `features.json`
- `docs/LEVEL_DEVELOPMENT.md` or its moved destination
- `docs/LEVEL_RUNTIME.md` or its moved destination
- `docs/BEHAVIOR_SYSTEM.md` or its moved destination
- `docs/API_PROTECTION.md` or its moved destination
- `docs/QA_CHECKLIST.md` or its moved destination

### Files To Move Into Active `docs/`

- `docs/API_PROTECTION.md` → `docs/architecture/api-protection.md`
- `docs/BEHAVIOR_SYSTEM.md` → `docs/architecture/behavior-system.md`
- `docs/LEVEL_DEVELOPMENT.md` → `docs/architecture/level-development.md`
- `docs/LEVEL_RUNTIME.md` → `docs/architecture/level-runtime.md`
- `docs/QA_CHECKLIST.md` → `docs/product/qa-checklist.md`
- `docs/superpowers/plans/2026-04-05-busy-crossing-frogger-implementation.md` → `docs/plans/2026-04-05-busy-crossing-frogger-implementation.md`
- `docs/superpowers/plans/2026-04-05-cat-tree-climber-implementation.md` → `docs/plans/2026-04-05-cat-tree-climber-implementation.md`
- `docs/superpowers/plans/2026-04-05-city-heights-implementation.md` → `docs/plans/2026-04-05-city-heights-implementation.md`
- `docs/superpowers/plans/2026-04-05-countertop-chaos-implementation.md` → `docs/plans/2026-04-05-countertop-chaos-implementation.md`
- `docs/superpowers/plans/2026-04-05-garden-patrol-whack-implementation.md` → `docs/plans/2026-04-05-garden-patrol-whack-implementation.md`
- `docs/superpowers/plans/2026-04-05-garden-snake-implementation.md` → `docs/plans/2026-04-05-garden-snake-implementation.md`
- `docs/superpowers/plans/2026-04-05-yarn-ball-bounce-implementation.md` → `docs/plans/2026-04-05-yarn-ball-bounce-implementation.md`
- `docs/superpowers/plans/2026-04-19-repo-roadmap-consolidation-implementation.md` → `docs/plans/2026-04-19-repo-roadmap-consolidation-implementation.md`
- `docs/superpowers/specs/2026-04-05-busy-crossing-frogger-design.md` → `docs/specs/2026-04-05-busy-crossing-frogger-design.md`
- `docs/superpowers/specs/2026-04-05-cat-tree-climber-design.md` → `docs/specs/2026-04-05-cat-tree-climber-design.md`
- `docs/superpowers/specs/2026-04-05-city-heights-platformer-design.md` → `docs/specs/2026-04-05-city-heights-platformer-design.md`
- `docs/superpowers/specs/2026-04-05-countertop-chaos-launcher-design.md` → `docs/specs/2026-04-05-countertop-chaos-launcher-design.md`
- `docs/superpowers/specs/2026-04-05-garden-patrol-whack-design.md` → `docs/specs/2026-04-05-garden-patrol-whack-design.md`
- `docs/superpowers/specs/2026-04-05-garden-snake-design.md` → `docs/specs/2026-04-05-garden-snake-design.md`
- `docs/superpowers/specs/2026-04-05-yarn-ball-bounce-design.md` → `docs/specs/2026-04-05-yarn-ball-bounce-design.md`
- `docs/superpowers/specs/2026-04-19-repo-roadmap-consolidation-design.md` → `docs/specs/2026-04-19-repo-roadmap-consolidation-design.md`

### Files To Archive

- `ROADMAP.md` → `docs/archive/roadmaps/ROADMAP.md`
- `ROADMAP_V2.md` → `docs/archive/roadmaps/ROADMAP_V2.md`
- `ROADMAP_V3_SPEC.md` → `docs/archive/roadmaps/ROADMAP_V3_SPEC.md`
- `KNOWN_ISSUES.md` → `docs/archive/issues/KNOWN_ISSUES.md`
- `docs/KNOWN_ISSUES.md` → `docs/archive/issues/docs-KNOWN_ISSUES-stub.md`
- `docs/ROADMAP.md` → `docs/archive/roadmaps/docs-ROADMAP-stub.md`
- `docs/PROGRESS.md` → `docs/archive/process/docs-PROGRESS-stub.md`
- `docs/V2_AUDIT_REPORT.md` → `docs/archive/reports/V2_AUDIT_REPORT.md`
- `docs/OVERNIGHT_AGENT.md` → `docs/archive/process/OVERNIGHT_AGENT.md`
- `docs/ROADMAP_V1_COMPLETE.md` → `docs/archive/roadmaps/ROADMAP_V1_COMPLETE.md`
- `docs/plans/2026-03-01-phase3-behavior-system-design.md` → `docs/archive/plans/2026-03-01-phase3-behavior-system-design.md`
- `docs/plans/2026-03-01-phase3-implementation.md` → `docs/archive/plans/2026-03-01-phase3-implementation.md`
- `docs/plans/2026-03-01-phase9-balance-telemetry-design.md` → `docs/archive/plans/2026-03-01-phase9-balance-telemetry-design.md`
- `docs/plans/2026-03-01-phase9-implementation.md` → `docs/archive/plans/2026-03-01-phase9-implementation.md`
- `docs/superpowers/specs/2026-03-19-v3-open-questions-design.md` → `docs/archive/specs/2026-03-19-v3-open-questions-design.md`
- `docs/superpowers/specs/2026-03-21-campaign-screen-design.md` → `docs/archive/specs/2026-03-21-campaign-screen-design.md`
- `docs/superpowers/specs/2026-03-22-phase-1.5-beach-polish-design.md` → `docs/archive/specs/2026-03-22-phase-1.5-beach-polish-design.md`

---

### Task 1: Create A Safe Worktree And Docs Skeleton

**Files:**
- Create: `.worktrees/roadmap-v3-cleanup/` or `/tmp/CatRunner-roadmap-v3-cleanup`
- Create: `docs/README.md`
- Create: `docs/archive/README.md`

- [ ] **Step 1: Create an isolated worktree from clean `main`**

Run:

```bash
git worktree add /tmp/CatRunner-roadmap-v3-cleanup main
cd /tmp/CatRunner-roadmap-v3-cleanup
git switch -c codex/roadmap-v3-cleanup
git status --short --branch
```

Expected:

```text
## codex/roadmap-v3-cleanup
```

- [ ] **Step 2: Create the new docs directories**

Run:

```bash
mkdir -p docs/architecture docs/product docs/plans docs/specs
mkdir -p docs/archive/roadmaps docs/archive/issues docs/archive/reports docs/archive/process docs/archive/plans docs/archive/specs
find docs -maxdepth 2 -type d | sort
```

Expected output includes:

```text
docs/architecture
docs/archive
docs/archive/issues
docs/archive/plans
docs/archive/process
docs/archive/reports
docs/archive/roadmaps
docs/archive/specs
docs/plans
docs/product
docs/specs
```

- [ ] **Step 3: Write `docs/README.md` as the docs index**

Create `docs/README.md` with this content:

```md
# Docs Index

Active documentation lives in:

- `docs/architecture/` — runtime and technical reference
- `docs/product/` — campaign, gameplay, and player-facing semantics
- `docs/plans/` — active implementation plans
- `docs/specs/` — active design specs
- `docs/archive/` — superseded historical material

Canonical root planning files:

- `ROADMAP_V3.md`
- `PROGRESS.md`
```

- [ ] **Step 4: Write `docs/archive/README.md`**

Create `docs/archive/README.md` with this content:

```md
# Archive

This directory stores superseded planning, status, roadmap, issue-tracking, and report documents kept for historical reference.

Nothing in `docs/archive/` is an active source of truth.

Active project truth lives in:

- `ROADMAP_V3.md`
- `PROGRESS.md`
- active documents under `docs/`
- GitHub Issues for bugs and technical debt
```

- [ ] **Step 5: Commit the docs skeleton**

Run:

```bash
git add docs/README.md docs/archive/README.md docs/architecture docs/product docs/plans docs/specs docs/archive
git commit -m "docs: create consolidated docs structure"
```

Expected:

```text
[codex/roadmap-v3-cleanup ...] docs: create consolidated docs structure
```

---

### Task 2: Rewrite `ROADMAP_V3.md` As The Only Active Roadmap

**Files:**
- Modify: `ROADMAP_V3.md`
- Reference: `docs/specs/2026-04-19-repo-roadmap-consolidation-design.md`
- Reference: `App.tsx`, `levels/index.ts`, `components/PhaserGame.tsx`, current dirty-worktree audit notes from the approved spec

- [ ] **Step 1: Capture the old roadmap assumptions that must disappear**

Run:

```bash
rg -n "KNOWN_ISSUES|ROADMAP_V2|ROADMAP_V3_SPEC|single endless-runner|draft spec" ROADMAP_V3.md
```

Expected: matches are present before the rewrite.

- [ ] **Step 2: Replace `ROADMAP_V3.md` with the new canonical structure**

Write `ROADMAP_V3.md` so it contains these top-level sections in order:

```md
# Beach Kitty Roadmap V3

## Canonical Status
## Current Reality Snapshot
## Provenance And Consolidation Notes
## Guardrails
## Execution Model (Game Studio / Phaser / Sprite Pipeline / Game Playtest)
## Workstreams
## Active Sequence
## Deferred / Not In Scope
```

Required content to include:

```md
- `ROADMAP_V3.md` is the only active roadmap.
- `PROGRESS.md` is the active session log.
- GitHub Issues are the only active issue tracker.
- The roadmap absorbs unfinished/active material from `ROADMAP_V2.md`, `ROADMAP_V3_SPEC.md`, active level specs/plans, the 2026-04-19 consolidation design, and the current platformer hero-sheet/matting WIP.
- The repo currently has 9 registered level configs and scene routes.
- The current baseline is green for `npm run test:run`, `npx tsc --noEmit`, and `npm run build`.
- Current carried-forward workstreams: repo/docs normalization; correctness/campaign coherence; QA infrastructure; asset pipeline/tooling; performance/shipping readiness.
- Include the current hero-sheet WIP as active asset-pipeline work.
- Include the audit follow-ups: non-runner victory label bug, hardcoded scene `levelId`s, genre-aware Hall of Fame, oversized main bundle.
```

- [ ] **Step 3: Add the Game Studio execution model**

Ensure `ROADMAP_V3.md` includes this exact workflow language:

```md
Default execution model:

- `game-studio` routes browser-game work
- `phaser-2d-game` is the default implementation path for runtime/gameplay changes
- `sprite-pipeline` is the default path for 2D sprite-sheet and hero-sheet work
- `game-playtest` is the default path for browser smoke tests, screenshots, HUD review, and scene QA
```

- [ ] **Step 4: Verify the new roadmap no longer points at deprecated workflow artifacts**

Run:

```bash
rg -n "KNOWN_ISSUES|ROADMAP_V2|ROADMAP_V3_SPEC" ROADMAP_V3.md
```

Expected:

```text
0 matches
```

- [ ] **Step 5: Commit the roadmap rewrite**

Run:

```bash
git add ROADMAP_V3.md
git commit -m "docs: rewrite roadmap v3 as canonical project plan"
```

---

### Task 3: Move Active Docs And Archive Historical Docs

**Files:**
- Move: all paths listed in the File Structure Map above
- Modify: `docs/README.md` if needed after moves

- [ ] **Step 1: Move active reference docs into curated active folders**

Run:

```bash
mv docs/API_PROTECTION.md docs/architecture/api-protection.md
mv docs/BEHAVIOR_SYSTEM.md docs/architecture/behavior-system.md
mv docs/LEVEL_DEVELOPMENT.md docs/architecture/level-development.md
mv docs/LEVEL_RUNTIME.md docs/architecture/level-runtime.md
mv docs/QA_CHECKLIST.md docs/product/qa-checklist.md
mv docs/superpowers/plans/2026-04-05-busy-crossing-frogger-implementation.md docs/plans/
mv docs/superpowers/plans/2026-04-05-cat-tree-climber-implementation.md docs/plans/
mv docs/superpowers/plans/2026-04-05-city-heights-implementation.md docs/plans/
mv docs/superpowers/plans/2026-04-05-countertop-chaos-implementation.md docs/plans/
mv docs/superpowers/plans/2026-04-05-garden-patrol-whack-implementation.md docs/plans/
mv docs/superpowers/plans/2026-04-05-garden-snake-implementation.md docs/plans/
mv docs/superpowers/plans/2026-04-05-yarn-ball-bounce-implementation.md docs/plans/
mv docs/superpowers/plans/2026-04-19-repo-roadmap-consolidation-implementation.md docs/plans/
mv docs/superpowers/specs/2026-04-05-busy-crossing-frogger-design.md docs/specs/
mv docs/superpowers/specs/2026-04-05-cat-tree-climber-design.md docs/specs/
mv docs/superpowers/specs/2026-04-05-city-heights-platformer-design.md docs/specs/
mv docs/superpowers/specs/2026-04-05-countertop-chaos-launcher-design.md docs/specs/
mv docs/superpowers/specs/2026-04-05-garden-patrol-whack-design.md docs/specs/
mv docs/superpowers/specs/2026-04-05-garden-snake-design.md docs/specs/
mv docs/superpowers/specs/2026-04-05-yarn-ball-bounce-design.md docs/specs/
mv docs/superpowers/specs/2026-04-19-repo-roadmap-consolidation-design.md docs/specs/
```

Expected:

```text
docs/architecture/...
docs/product/...
docs/plans/...
docs/specs/...
```

- [ ] **Step 2: Archive superseded roadmap/issue/report/process material**

Run:

```bash
mv ROADMAP.md docs/archive/roadmaps/
mv ROADMAP_V2.md docs/archive/roadmaps/
mv ROADMAP_V3_SPEC.md docs/archive/roadmaps/
mv KNOWN_ISSUES.md docs/archive/issues/
mv docs/KNOWN_ISSUES.md docs/archive/issues/docs-KNOWN_ISSUES-stub.md
mv docs/ROADMAP.md docs/archive/roadmaps/docs-ROADMAP-stub.md
mv docs/PROGRESS.md docs/archive/process/docs-PROGRESS-stub.md
mv docs/V2_AUDIT_REPORT.md docs/archive/reports/
mv docs/OVERNIGHT_AGENT.md docs/archive/process/
mv docs/ROADMAP_V1_COMPLETE.md docs/archive/roadmaps/
mv docs/plans/2026-03-01-phase3-behavior-system-design.md docs/archive/plans/
mv docs/plans/2026-03-01-phase3-implementation.md docs/archive/plans/
mv docs/plans/2026-03-01-phase9-balance-telemetry-design.md docs/archive/plans/
mv docs/plans/2026-03-01-phase9-implementation.md docs/archive/plans/
mv docs/superpowers/specs/2026-03-19-v3-open-questions-design.md docs/archive/specs/
mv docs/superpowers/specs/2026-03-21-campaign-screen-design.md docs/archive/specs/
mv docs/superpowers/specs/2026-03-22-phase-1.5-beach-polish-design.md docs/archive/specs/
rmdir docs/superpowers/plans docs/superpowers/specs docs/superpowers || true
```

- [ ] **Step 3: Rewrite `docs/README.md` to list real destinations**

Update `docs/README.md` to this content:

```md
# Docs Index

## Active

- `docs/architecture/`
- `docs/product/`
- `docs/plans/`
- `docs/specs/`

## Historical

- `docs/archive/`

## Canonical Root Files

- `ROADMAP_V3.md`
- `PROGRESS.md`
```

- [ ] **Step 4: Verify there are no lingering active docs in the old locations**

Run:

```bash
find docs -maxdepth 3 -type f | sort
```

Expected:

```text
No active roadmap/status files remain at old root-level doc-stub locations.
No `docs/superpowers/` directory remains.
```

- [ ] **Step 5: Commit the docs migration**

Run:

```bash
git add docs ROADMAP.md ROADMAP_V2.md ROADMAP_V3_SPEC.md KNOWN_ISSUES.md
git commit -m "docs: reorganize active docs and archive historical planning files"
```

---

### Task 4: Sunset `KNOWN_ISSUES.md` And Create GitHub Issues

**Files:**
- Modify: `README.md`
- Modify: `AGENTS.md`
- Modify: `CLAUDE.md`
- Modify: `PROGRESS.md`
- Create externally: GitHub issues for surviving actionable items

- [ ] **Step 1: Verify GitHub CLI access**

Run:

```bash
gh auth status
```

Expected:

```text
Logged in to github.com ...
```

If this fails, stop and use the GitHub app/connector before continuing.

- [ ] **Step 2: Create the four carried-forward GitHub issues from the audit**

Run:

```bash
gh issue create --title "Fix victory screen level labels for non-runner levels" --body "The victory UI currently calls runner-only getLevelConfig() when rendering next/current level names. This throws for non-runner levels. Replace those lookups with getAnyLevelConfig() or campaign metadata so victory flow works across all genres."
gh issue create --title "Replace hardcoded scene level IDs with SceneBridge levelId" --body "Several Phaser scenes emit hardcoded level IDs in level-complete payloads even though SceneBridge already initializes this.levelId. Make scenes emit the configured level ID so the bridge remains generic and level cloning/reuse stays safe."
gh issue create --title "Make Hall of Fame genre-aware in campaign UI" --body "High score entries already store levelId, but the campaign sidebar Hall of Fame only shows player name and raw score. Add visible level tags or grouping so scores are interpretable across different genres."
gh issue create --title "Reduce oversized main bundle and tighten scene chunking" --body "The production build still emits an oversized main chunk. Audit scene boundaries, shared imports, and code-splitting behavior so Phaser scenes remain lazy and the main shell bundle shrinks."
```

Expected:

```text
https://github.com/.../issues/...
```

- [ ] **Step 3: Add a PROGRESS entry that `KNOWN_ISSUES.md` is retired**

Prepend a new session note to `PROGRESS.md` with this structure:

```md
## Session: 2026-04-19 (repo cleanup and roadmap consolidation)

### Completed
- [x] Rewrote `ROADMAP_V3.md` as the only active roadmap
- [x] Archived `KNOWN_ISSUES.md` and retired it from the workflow
- [x] Reorganized active docs under `docs/`
- [x] Created GitHub issues for surviving actionable repo/product concerns

### Next Session Should
1. Start from `ROADMAP_V3.md`
2. Use GitHub Issues for bugs and technical debt
3. Continue from the highest-priority open roadmap workstream
```

- [ ] **Step 4: Verify the repo no longer treats `KNOWN_ISSUES.md` as active**

Run:

```bash
rg -n "KNOWN_ISSUES.md" README.md AGENTS.md CLAUDE.md PROJECT_STATE.md scripts/dev-init.sh ROADMAP_V3.md PROGRESS.md features.json
```

Expected:

```text
Only archive references or explicit "retired/archived" wording remain.
```

- [ ] **Step 5: Commit the issue-policy migration**

Run:

```bash
git add PROGRESS.md README.md AGENTS.md CLAUDE.md
git commit -m "docs: retire known issues workflow in favor of github issues"
```

---

### Task 5: Align Top-Level Docs And Workflow Helpers

**Files:**
- Modify: `README.md`
- Modify: `AGENTS.md`
- Modify: `CLAUDE.md`
- Modify: `PROJECT_STATE.md`
- Modify: `scripts/dev-init.sh`
- Modify: `features.json`

- [ ] **Step 1: Rewrite `README.md` to point at the canonical roadmap and docs taxonomy**

Ensure these exact ideas appear in `README.md`:

```md
- The project is a nine-level multi-genre Phaser campaign.
- The active roadmap is `ROADMAP_V3.md`.
- Supporting documentation lives under `docs/`.
- `KNOWN_ISSUES.md` is retired; use GitHub Issues for bugs and debt.
```

- [ ] **Step 2: Rewrite `AGENTS.md` and `CLAUDE.md` so they describe the live repo**

Both files must:

```md
- describe the project as a Phaser-based nine-level campaign
- reference `ROADMAP_V3.md` as the active roadmap
- reference `PROGRESS.md` as the root session log
- remove `KNOWN_ISSUES.md` from active workflow language
- mention Game Studio skill routing (`game-studio`, `phaser-2d-game`, `sprite-pipeline`, `game-playtest`)
```

- [ ] **Step 3: Rewrite `PROJECT_STATE.md` to match the real current state**

Replace the stale summary with:

```md
- multi-genre Phaser runtime exists
- 9 level configs/scenes are registered
- current cleanup is about canonical docs/workflow alignment, not initial Phaser adoption
- current hero-sheet/matting work is active WIP
```

- [ ] **Step 4: Rewrite `scripts/dev-init.sh` and `features.json` away from V2 assumptions**

For `scripts/dev-init.sh`, change:

```bash
REQUIRED_FILES=(
  "ROADMAP_V3.md"
  "PROGRESS.md"
  "features.json"
  "package.json"
  "types.ts"
)
```

Also update:

```bash
echo -e "${GREEN}✓${NC} Active roadmap: ROADMAP_V3.md"
grep -n "\[ \]" ROADMAP_V3.md | head -5
echo -e "${YELLOW}▶ ACTIVE ROADMAP:${NC} ROADMAP_V3.md"
echo -e "  ${YELLOW}sed -n '1,220p' ROADMAP_V3.md${NC} - Read active roadmap"
```

Remove the `KNOWN_ISSUES.md` counting block entirely.

For `features.json`, update `_meta` and any notes that still claim V2 is the active roadmap so they point to `ROADMAP_V3.md` and describe V2 as archived/historical.

- [ ] **Step 5: Commit the top-level alignment**

Run:

```bash
git add README.md AGENTS.md CLAUDE.md PROJECT_STATE.md scripts/dev-init.sh features.json
git commit -m "docs: align root guidance and tooling with roadmap v3"
```

---

### Task 6: Verification, Link Cleanup, And Final Closeout

**Files:**
- Modify: any active docs with broken links after moves
- Verify: entire repo

- [ ] **Step 1: Find and fix broken references introduced by file moves**

Run:

```bash
rg -n "ROADMAP_V2|ROADMAP_V3_SPEC|KNOWN_ISSUES|docs/KNOWN_ISSUES|docs/ROADMAP|docs/PROGRESS|docs/superpowers" -g '!node_modules'
```

Expected:

```text
Matches remain only in archived files, historical notes, or explicit archival references.
```

- [ ] **Step 2: Run the full project verification suite**

Run:

```bash
npm run test:run
npx tsc --noEmit
npm run build
```

Expected:

```text
All tests pass
TypeScript check exits 0
Vite build succeeds
```

- [ ] **Step 3: Verify the root is clean and canonical**

Run:

```bash
ls
find docs -maxdepth 2 -type d | sort
git status --short
```

Expected:

```text
Root contains `ROADMAP_V3.md` and `PROGRESS.md` as the active planning files.
`KNOWN_ISSUES.md`, `ROADMAP.md`, `ROADMAP_V2.md`, and `ROADMAP_V3_SPEC.md` are no longer present at root.
`git status` is clean.
```

- [ ] **Step 4: Add a final PROGRESS note confirming the migration is complete**

Append to the current session entry in `PROGRESS.md`:

```md
- [x] Verified `npm run test:run`, `npx tsc --noEmit`, and `npm run build`
- [x] Confirmed the repo now has one active roadmap and one active root progress log
```

- [ ] **Step 5: Commit the verified final state**

Run:

```bash
git add -A
git commit -m "docs: complete roadmap v3 consolidation and repo cleanup"
```

---

## Self-Review

### Spec Coverage

This plan covers:

- aggressive docs cleanup
- single active root roadmap
- `PROGRESS.md` retained at root
- `KNOWN_ISSUES.md` archived and removed from workflow
- GitHub issue creation for active carried-forward concerns
- docs taxonomy under `docs/`
- current hero-sheet/matting WIP folded into the rewritten roadmap
- Game Studio workflow integration in the canonical roadmap and guidance docs

### Placeholder Scan

The plan uses explicit file paths, concrete move destinations, exact commands, and specific issue titles. No `TODO`/`TBD` placeholders remain.

### Type / Naming Consistency

This plan consistently uses:

- `ROADMAP_V3.md` as the only active roadmap
- `PROGRESS.md` as the active root log
- `docs/archive/` as the historical bucket
- GitHub Issues as the issue tracker

---

## Execution Handoff

Plan complete and saved to `docs/superpowers/plans/2026-04-19-repo-roadmap-consolidation-implementation.md`. Two execution options:

**1. Subagent-Driven (recommended)** - I dispatch a fresh subagent per task, review between tasks, fast iteration

**2. Inline Execution** - Execute tasks in this session using executing-plans, batch execution with checkpoints

**Which approach?**
