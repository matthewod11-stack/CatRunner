# Beach Kitty Multi-Level System + Gameplay Tooling — Implementation Roadmap

> **Purpose:** Actionable checklist for implementing the multi-level template system.
> **Related Docs:** [PROGRESS.md](../PROGRESS.md) | [KNOWN_ISSUES.md](../KNOWN_ISSUES.md)

---

## **FULL IMPLEMENTATION PLAN**

```
~/.claude/plans/compressed-gathering-kite.md
```

This plan file contains the complete 8-phase multi-level implementation details including:
- Type system design with full interface definitions
- Behavior system architecture
- Level configuration structure
- GameEngine abstraction strategy
- Session handoff notes

This roadmap includes **Phase 9** (live balancing + telemetry), which is **complete**.

**Read the plan file at the start of each session for full context.**

---

## Quick Reference

```
SESSION START:  ./scripts/dev-init.sh   (expects ROADMAP.md, PROGRESS.md, KNOWN_ISSUES.md at repo root)
DURING:         Work on ONE task, update docs after completion
SESSION END:    Update PROGRESS.md (root), features.json, commit
```

---

## Project Overview

Transform Beach Kitty from a single-level game into a modular multi-level architecture.

**Design Decisions (Locked In):**
- Level Unlocking: Beat Previous Boss (linear progression)
- Boss Design: Unique Bosses per level
- Behaviors: Reusable behavior library (swoop, drop-projectile, bounce)
- Config Storage: TypeScript files in per-level folders (target); current beach config lives in `levels/beach.ts`)

---

## Current Priority Track

Completed: security hardening, performance pass, gameplay balancing, **Phase 9** (dev balance panel + telemetry).

**Roadmap status:** Phases 1–9 complete. **Phase 8** (docs) and **Phase 9** (balance/telemetry) are done; use [PROGRESS.md](../PROGRESS.md) for session notes.

---

## Phase Overview

| Phase | Focus | Sessions | Status |
|-------|-------|----------|--------|
| 1 | Session Protocol Infrastructure | 1 | **Complete** |
| 2 | Type System Foundation | 1 | **Complete** |
| 3 | Behavior System Library | 1-2 | **Complete** |
| 4 | Level Configuration Structure | 1 | **Complete** |
| 5 | Obstacle Component Refactor | 1-2 | **Complete** |
| 6 | GameEngine Abstraction | 2-3 | **Complete** |
| 7 | Level Selection UI | 1 | **Complete** |
| 8 | Documentation & Polish | 1 | **Complete** |
| 9 | Live Balancing + Telemetry | 1-2 | **Complete** |

---

## Phase 1: Session Protocol Infrastructure

**Goal:** Set up project tracking for long-running development

### Tasks
- [x] Create `docs/` folder (screenshots, archived plans under `docs/plans/`)
- [x] Create `ROADMAP.md` at repo root (this file)
- [x] Create `PROGRESS.md` at repo root
- [x] Create `KNOWN_ISSUES.md` at repo root
- [x] Create `features.json`
- [x] Create `scripts/dev-init.sh`
- [x] Verify dev-init.sh runs successfully
- [x] Commit infrastructure files

### Deliverables
```
ROADMAP.md
PROGRESS.md
KNOWN_ISSUES.md
features.json
scripts/dev-init.sh
```

---

## Phase 2: Type System Foundation

**Goal:** Create extensible type system for multiple levels

**Status:** Complete — see `types.ts` (`LevelId`, `BehaviorType`, `ObstacleDefinition`, `LevelConfig`, `ThemeConfig`, `BossConfig`, `BackgroundConfig`, etc.).

### Tasks
- [x] Extend `LevelId` type to support future levels
- [x] Add `BehaviorType` union
- [x] Add `ObstacleDefinition` interface
- [x] Add `LevelConfig` interface
- [x] Add `ThemeConfig`, `BossConfig`, `BackgroundConfig` interfaces
- [x] Verify TypeScript compiles
- [x] Verify existing game unchanged

### Key File
`types.ts`

---

## Phase 3: Behavior System Library

**Goal:** Extract hardcoded obstacle behaviors into reusable system

### Tasks
- [x] Create `systems/behaviors.ts`
- [x] Extract seagull swoop → `computeSwoopY`
- [x] Extract seagull poop → `checkPoopDrop`
- [x] Extract beachball bounce → `handleBounceCollision`
- [x] Extract slowdown effect → `handleSlowCollision`
- [x] Create `systems/collisionHandlers.ts`
- [x] Verify all behaviors work unchanged

### Key Files
```
systems/behaviors.ts
systems/collisionHandlers.ts
systems/index.ts
```

---

## Phase 4: Level Configuration Structure

**Goal:** Declarative beach level config and registry; engine reads it (no duplicate source of truth).

### Tasks
- [x] Create `levels/` directory
- [x] Add `levels/beach.ts` with `BEACH_LEVEL_CONFIG` (`LevelConfig`: obstacles, patterns, theme, boss, background, harmfulTypes)
- [x] Create `levels/index.ts` with `LEVEL_REGISTRY` / `getLevelConfig` and barrel export
- [x] Wire `components/GameEngine.tsx` to `LEVEL_REGISTRY[levelId]`: patterns, `harmfulTypes`, `theme` (ground Y, particle colors, speed-line threshold, screen-shake decay), boss stats, background spawn intervals, obstacle dimensions, weighted spawn pool, background entity defs
- [x] Runtime tuning remains in `useTuningStore` / `defaultTuning.ts` (orthogonal to level layout)
- [ ] Optional later: split into `levels/beach/config.ts`, `patterns.ts`, `obstacles.tsx` per original plan layout

### Target directory layout (future)
```
levels/
  index.ts
  beach/
    config.ts
    patterns.ts
    obstacles.tsx
    boss/
      SandMonster.tsx
```

---

## Phase 5: Obstacle Component Refactor

**Goal:** Make ObstacleComponent level-aware and modular

### Tasks
- [x] Create `levels/beach/obstacles.tsx` with Beach SVGs
- [x] Create `contexts/LevelContext.tsx`
- [x] Refactor `ObstacleComponent.tsx` to use context
- [x] Keep shared obstacles (COIN, SHELL, power-ups) in base
- [x] Verify no visual regressions (`npm run build`)

### Key Files
```
levels/beach/obstacles.tsx
contexts/LevelContext.tsx
components/ObstacleComponent.tsx
```

---

## Phase 6: GameEngine Abstraction

**Goal:** Make GameEngine level-agnostic (largest refactor)

### Session 6A: Extract Level-Specific State
- [x] Add optional `levelConfig?: LevelConfig` prop; parent passes `getLevelConfig(...)` (falls back to `LEVEL_REGISTRY[levelId]` if omitted)
- [x] Replace inline harmful list with config (Phase 4)
- [x] Replace inline patterns with config (Phase 4)
- [x] Theme particle colors / juice from `LevelConfig.theme` (Phase 4)

### Session 6B: Behavior System Integration
- [x] Stomp / slow-on-contact / arc-projectile movement driven from `ObstacleDefinition.behaviors` via `systems/levelBehaviorHelpers.ts` (`stomp`, `arcProjectile`, `slowOnContact`, etc.)
- [x] Ground kick particles gated by `theme.groundKickParticles` (not `levelId` checks)

### Session 6C: Boss System Abstraction
- [x] Create `systems/bossSystem.ts` (spawn rate, projectile spawn, boss pose / facing helpers)
- [x] Dynamic boss component loading via `systems/bossComponents.tsx` + `BossConfig.componentId`
- [x] Abstract projectile spawning (boss shot creation in `bossSystem`)

### Key Files
`components/GameEngine.tsx`, `systems/bossSystem.ts`, `systems/bossComponents.tsx`, `systems/levelBehaviorHelpers.ts`

---

## Phase 7: Level Selection UI

**Goal:** Add level selection and unlocking logic

### Tasks
- [x] Add `selectedLevel` state to App.tsx
- [x] Add `defeatedBosses` state (persisted via `services/levelProgress.ts`)
- [x] Create `LevelSelection` component
- [x] Level context: satisfied by existing `LevelProvider` inside `GameEngine` (no duplicate App wrapper)
- [x] Update `handleVictory` to record boss defeat and unlock next level in order
- [x] Verify progress persists (`beach-cat-defeated-bosses-v1`)

### Key Files
`App.tsx`, `components/LevelSelection.tsx`, `levels/catalog.ts`, `services/levelProgress.ts`

---

## Phase 8: Documentation & Polish

**Goal:** Document new architecture for future level creation

### Tasks
- [x] Create `docs/LEVEL_DEVELOPMENT.md`
- [x] Create `docs/BEHAVIOR_SYSTEM.md`
- [x] Update `CLAUDE.md` and `AGENTS.md` (architecture + links to docs)
- [x] Final testing and polish (`npm run build`)

### Key files
`docs/LEVEL_DEVELOPMENT.md`, `docs/BEHAVIOR_SYSTEM.md`, `CLAUDE.md`, `AGENTS.md`, `README.md`

---

## Phase 9: Live Balancing + Telemetry

**Goal:** Improve tuning velocity and difficulty quality with in-game controls and structured data.

### Tasks
- [x] Create dev-only balance panel (backtick toggle in `App.tsx`)
- [x] Expose key tuning controls:
  - [x] Spawn interval base/min/jitter
  - [x] Pattern chance scaling
  - [x] Boss projectile rate/speed
  - [x] Low-lives assist multipliers
  - [x] Power-up threshold
- [x] Persist tuning profile to `localStorage`
- [x] Add reset-to-default control
- [x] Add telemetry event logging for:
  - [x] damage taken (obstacle type, speed, lives, timestamp)
  - [x] deaths (context snapshot)
  - [x] run summary (duration, score, coins, boss reached/defeated)
- [x] Add export action for telemetry JSON
- [ ] Add optional import action for replaying telemetry data in analysis (deferred)
- [x] Verify no gameplay behavior change when panel is disabled
- [x] Document usage in `README.md` (dev section)

### Implemented Files
```
components/dev/BalancePanel.tsx
systems/tuning/defaultTuning.ts
systems/tuning/useTuningStore.ts
systems/telemetry/runTelemetry.ts
```

---

## Linear Checklist (Quick Copy)

```
PHASE 1 - INFRASTRUCTURE
[x] Tracking files at repo root (ROADMAP, PROGRESS, KNOWN_ISSUES)
[x] docs/ for plans + assets
[x] features.json
[x] scripts/dev-init.sh
[x] Verify dev-init.sh works
[x] Commit all files

PHASE 2 - TYPES
[x] Extend types.ts with level system types
[x] Verify compilation

PHASE 3 - BEHAVIORS
[x] Create systems/behaviors.ts
[x] Create systems/collisionHandlers.ts
[x] Verify behaviors work

PHASE 4 - LEVEL CONFIG
[x] levels/beach.ts + levels/index.ts + LEVEL_REGISTRY
[x] GameEngine consumes level config (patterns, harmfulTypes, theme, boss, background, obstacle/bg dimensions)

PHASE 5 - OBSTACLES
[x] Extract Beach SVGs to levels/beach/obstacles.tsx
[x] Create LevelContext
[x] Refactor ObstacleComponent

PHASE 6 - GAME ENGINE
[x] Session 6A: Optional levelConfig prop + App wiring
[x] Session 6B: Behaviors drive stomp/slow/arc + theme ground kick
[x] Session 6C: bossSystem + lazy boss + abstract boss projectile spawn

PHASE 7 - LEVEL SELECTION
[x] LevelSelection + selectedLevel + LEVEL_ORDER / isLevelUnlocked
[x] defeatedBosses + victory unlock (linear)
[x] Persistence beach-cat-defeated-bosses-v1

PHASE 8 - DOCUMENTATION
[x] docs/LEVEL_DEVELOPMENT.md + docs/BEHAVIOR_SYSTEM.md
[x] CLAUDE.md + AGENTS.md + README doc links

PHASE 9 - BALANCE + TELEMETRY
[x] Dev balance panel
[x] localStorage tuning profiles
[x] Hit/death/run telemetry logging
[x] Telemetry JSON export
[x] Verify default gameplay unchanged
```
