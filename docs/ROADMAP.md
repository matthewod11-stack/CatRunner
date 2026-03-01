# Beach Kitty Multi-Level System + Gameplay Tooling — Implementation Roadmap

> **Purpose:** Actionable checklist for implementing the multi-level template system.
> **Related Docs:** [PROGRESS.md](./PROGRESS.md) | [KNOWN_ISSUES.md](./KNOWN_ISSUES.md)

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

This roadmap now includes an additional **Phase 9** for short-term gameplay tuning tooling.

**Read the plan file at the start of each session for full context.**

---

## Quick Reference

```
SESSION START:  ./scripts/dev-init.sh
DURING:         Work on ONE task, update docs after completion
SESSION END:    Update PROGRESS.md, features.json, commit
```

---

## Project Overview

Transform Beach Kitty from a single-level game into a modular multi-level architecture.

**Design Decisions (Locked In):**
- Level Unlocking: Beat Previous Boss (linear progression)
- Boss Design: Unique Bosses per level
- Behaviors: Reusable behavior library (swoop, drop-projectile, bounce)
- Config Storage: TypeScript files in per-level folders

---

## Current Priority Track (2026-02-28)

Execution order requested and implemented:
1. Security hardening
2. Performance pass
3. Gameplay balancing pass

Immediate next work:
4. Dev Balance Panel
5. Death/Run Telemetry

This is tracked as **Phase 9** below and is intended to be completed before resuming Phase 2+ multi-level architecture work.

---

## Phase Overview

| Phase | Focus | Sessions | Status |
|-------|-------|----------|--------|
| 1 | Session Protocol Infrastructure | 1 | **Complete** |
| 2 | Type System Foundation | 1 | Not Started |
| 3 | Behavior System Library | 1-2 | Not Started |
| 4 | Level Configuration Structure | 1 | Not Started |
| 5 | Obstacle Component Refactor | 1-2 | Not Started |
| 6 | GameEngine Abstraction | 2-3 | Not Started |
| 7 | Level Selection UI | 1 | Not Started |
| 8 | Documentation & Polish | 1 | Not Started |
| 9 | Live Balancing + Telemetry | 1-2 | **Complete** |

---

## Phase 1: Session Protocol Infrastructure

**Goal:** Set up project tracking for long-running development

### Tasks
- [x] Create `docs/` folder
- [x] Create `docs/ROADMAP.md` (this file)
- [x] Create `docs/PROGRESS.md`
- [x] Create `docs/KNOWN_ISSUES.md`
- [x] Create `features.json`
- [x] Create `scripts/dev-init.sh`
- [x] Verify dev-init.sh runs successfully
- [x] Commit infrastructure files

### Deliverables
```
docs/ROADMAP.md
docs/PROGRESS.md
docs/KNOWN_ISSUES.md
features.json
scripts/dev-init.sh
```

---

## Phase 2: Type System Foundation

**Goal:** Create extensible type system for multiple levels

### Tasks
- [ ] Extend `LevelId` type to support future levels
- [ ] Add `BehaviorType` union
- [ ] Add `ObstacleDefinition` interface
- [ ] Add `LevelConfig` interface
- [ ] Add `ThemeConfig`, `BossConfig`, `BackgroundConfig` interfaces
- [ ] Verify TypeScript compiles
- [ ] Verify existing game unchanged

### Key File
`/Users/mattod/Desktop/CatRunner/types.ts`

---

## Phase 3: Behavior System Library

**Goal:** Extract hardcoded obstacle behaviors into reusable system

### Tasks
- [ ] Create `systems/behaviors.ts`
- [ ] Extract seagull swoop → `swoopBehavior`
- [ ] Extract seagull poop → `dropProjectileBehavior`
- [ ] Extract beachball bounce → `bounceableBehavior`
- [ ] Extract slowdown effect → `slowOnContactBehavior`
- [ ] Create `systems/collisionHandlers.ts`
- [ ] Verify all behaviors work unchanged

### Key Files
```
systems/behaviors.ts
systems/collisionHandlers.ts
systems/index.ts
```

---

## Phase 4: Level Configuration Structure

**Goal:** Create per-level folder structure, migrate Beach config

### Tasks
- [ ] Create `levels/` directory structure
- [ ] Create `levels/beach/config.ts`
- [ ] Move `BEACH_PATTERNS` to `levels/beach/patterns.ts`
- [ ] Create `levels/index.ts` with registry
- [ ] Verify Beach config loads correctly

### Directory Structure
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
- [ ] Create `levels/beach/obstacles.tsx` with Beach SVGs
- [ ] Create `contexts/LevelContext.tsx`
- [ ] Refactor `ObstacleComponent.tsx` to use context
- [ ] Keep shared obstacles (COIN, SHELL, power-ups) in base
- [ ] Verify no visual regressions

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
- [ ] Add `levelConfig: LevelConfig` prop
- [ ] Replace `HARMFUL_TYPES` with config
- [ ] Replace `BEACH_PATTERNS` with config
- [ ] Abstract particle colors to theme

### Session 6B: Behavior System Integration
- [ ] Replace inline seagull swoop with behavior call
- [ ] Replace poop drop with behavior call
- [ ] Config-driven collision responses

### Session 6C: Boss System Abstraction
- [ ] Create `systems/bossSystem.ts`
- [ ] Dynamic boss component loading
- [ ] Abstract projectile spawning

### Key File
`/Users/mattod/Desktop/CatRunner/components/GameEngine.tsx` (~1700 lines)

---

## Phase 7: Level Selection UI

**Goal:** Add level selection and unlocking logic

### Tasks
- [ ] Add `selectedLevel` state to App.tsx
- [ ] Add `defeatedBosses` state (persisted)
- [ ] Create `LevelSelection` component
- [ ] Wrap GameEngine with `LevelContext.Provider`
- [ ] Update `handleVictory` to unlock levels
- [ ] Verify progress persists

### Key File
`/Users/mattod/Desktop/CatRunner/App.tsx`

---

## Phase 8: Documentation & Polish

**Goal:** Document new architecture for future level creation

### Tasks
- [ ] Create `docs/LEVEL_DEVELOPMENT.md`
- [ ] Create `docs/BEHAVIOR_SYSTEM.md`
- [ ] Update `CLAUDE.md` with new architecture
- [ ] Final testing and polish

---

## Phase 9: Live Balancing + Telemetry

**Goal:** Improve tuning velocity and difficulty quality with in-game controls and structured data.

### Tasks
- [ ] Create dev-only balance panel (toggle via query param or keybind)
- [ ] Expose key tuning controls:
  - [ ] Spawn interval base/min/jitter
  - [ ] Pattern chance scaling
  - [ ] Boss projectile rate/speed
  - [ ] Low-lives assist multipliers
  - [ ] Power-up threshold
- [ ] Persist tuning profile to `localStorage`
- [ ] Add reset-to-default control
- [ ] Add telemetry event logging for:
  - [ ] damage taken (obstacle type, speed, lives, timestamp)
  - [ ] deaths (context snapshot)
  - [ ] run summary (duration, score, coins, boss reached/defeated)
- [ ] Add export action for telemetry JSON
- [ ] Add optional import action for replaying telemetry data in analysis
- [ ] Verify no gameplay behavior change when panel is disabled
- [ ] Document usage in `README.md` (dev section)

### Suggested Files
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
[x] Create docs/ROADMAP.md
[x] Create docs/PROGRESS.md
[x] Create docs/KNOWN_ISSUES.md
[x] Create features.json
[x] Create scripts/dev-init.sh
[x] Verify dev-init.sh works
[x] Commit all files

PHASE 2 - TYPES
[ ] Extend types.ts with level system types
[ ] Verify compilation

PHASE 3 - BEHAVIORS
[ ] Create systems/behaviors.ts
[ ] Create systems/collisionHandlers.ts
[ ] Verify behaviors work

PHASE 4 - LEVEL CONFIG
[ ] Create levels/beach/ structure
[ ] Move patterns and config
[ ] Create level registry

PHASE 5 - OBSTACLES
[ ] Extract Beach SVGs to levels/beach/obstacles.tsx
[ ] Create LevelContext
[ ] Refactor ObstacleComponent

PHASE 6 - GAME ENGINE
[ ] Session 6A: Extract level state
[ ] Session 6B: Integrate behaviors
[ ] Session 6C: Abstract boss system

PHASE 7 - LEVEL SELECTION
[ ] Add level selection UI
[ ] Add unlock logic
[ ] Test persistence

PHASE 8 - DOCUMENTATION
[ ] Create level dev guide
[ ] Update CLAUDE.md

PHASE 9 - BALANCE + TELEMETRY
[ ] Add dev balance panel
[ ] Add localStorage tuning profiles
[ ] Add hit/death/run telemetry logging
[ ] Add telemetry JSON export
[ ] Verify default gameplay unchanged
```
