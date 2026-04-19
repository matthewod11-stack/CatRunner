# Garden Snake (GARDEN_SNAKE) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Refactor Garden Snake from a monolithic scene into manager-based architecture, replace the 2-minute survive win with a **normal escalation phase (~60–90s)** plus **patrol dog finale (~15–25s)**, update campaign metadata to `goal` victory, add pure-logic tests, and wire Phaser SFX.

**Architecture:** `SnakeScene` becomes a thin orchestrator (~300–500 lines) implementing `SceneBridge`. Managers under `scenes/snake/` each implement `SceneManager` (`create` / `update` / `destroy`). Pure modules (`phaseState.ts`, `patrolPath.ts`, `escalation.ts`) hold timer math, patrol segment selection, and timed wall events for Vitest.

**Tech Stack:** Phaser 3, React 19, TypeScript, Vitest

**Spec:** `docs/specs/2026-04-05-garden-snake-design.md`

---

## Repeatable template mapping

| Template task | Garden Snake deliverable |
|---------------|-------------------------|
| 1 | Types + `SnakeLevelConfig` + `levels/garden-snake.ts` + `catalog` victory copy |
| 2 | `WallManager` — borders, random interior, API for adding cells |
| 3 | `GridRenderManager` — checkerboard garden palette |
| 4 | `FoodManager` — spawn, sprite, clear on finale |
| 5 | `EscalationManager` — speed curve + timed extra walls (hazard-like) |
| 6 | Score/streak — no new powerups; verify eat path + tuning |
| 7 | `PhaseController` + `PatrolDogManager` — finale timers + dog patrol |
| 8 | `SnakeSimManager` + `SnakeScene` orchestrator rewrite |
| 9 | `PhaserAudio` in scene — map events to existing `ProceduralSfxType` |
| 10 | `npm run test:run`, `npm run build`, manual QA |

---

## File map

### New files

```
scenes/snake/types.ts              — DEPTH, SceneManager, shared grid helpers
scenes/snake/phaseState.ts         — pure: phase from elapsed wall-clock ms
scenes/snake/phaseState.test.ts
scenes/snake/patrolPath.ts         — pure: pick segment, step with bounce
scenes/snake/patrolPath.test.ts
scenes/snake/escalation.ts         — pure: move interval after elapsed; wall timestamps
scenes/snake/escalation.test.ts
scenes/snake/GridRenderManager.ts
scenes/snake/WallManager.ts
scenes/snake/FoodManager.ts
scenes/snake/EscalationManager.ts
scenes/snake/PhaseController.ts
scenes/snake/PatrolDogManager.ts
scenes/snake/SnakeSimManager.ts    — body, direction queue, draw snake graphics
```

### Modified files

```
types.ts                    — SnakeLevelConfig: normalPhaseMs, finaleDurationMs, escalation; remove surviveTimeMs
levels/garden-snake.ts      — new fields + victoryCondition goal
levels/catalog.ts           — GARDEN_SNAKE meta victoryCondition + description if needed
scenes/SnakeScene.ts        — orchestrator only; delegate to managers
```

### Dependency graph

```
Task 1 ──► Tasks 2–7, 8
Tasks 2–7 ──► Task 8 (orchestrator)
Task 8 ──► Task 9, 10
Task 9 ──► Task 10
```

Tasks 2–7 can proceed in parallel after Task 1 completes.

---

### Task 1: Type extensions + config + pure phase/patrol/escalation

**Files:**

- Modify: `types.ts` (`SnakeLevelConfig` block ~741–761)
- Modify: `levels/garden-snake.ts`
- Modify: `levels/catalog.ts` (`CAMPAIGN_LEVEL_META` entry for `GARDEN_SNAKE`)
- Create: `scenes/snake/types.ts`
- Create: `scenes/snake/phaseState.ts`
- Create: `scenes/snake/phaseState.test.ts`
- Create: `scenes/snake/patrolPath.ts`
- Create: `scenes/snake/patrolPath.test.ts`
- Create: `scenes/snake/escalation.ts`
- Create: `scenes/snake/escalation.test.ts`

- [ ] **Step 1: Add escalation interface and extend `SnakeLevelConfig`**

In `types.ts`, replace `surviveTimeMs` with:

```ts
/** Optional tuning for normal-phase pressure (speed steps + extra walls). */
export interface SnakeEscalationConfig {
  /** Shave this many ms off move interval every `speedStepEveryMs` of normal phase. */
  speedStepAmount: number;
  /** Wall-clock ms between speed steps during normal phase. */
  speedStepEveryMs: number;
  /** At these elapsed-ms marks during normal phase, add one random interior wall (if cell free). */
  extraWallAtElapsedMs: number[];
}

export interface SnakeLevelConfig extends CampaignLevelMeta {
  genre: 'snake';
  gridCols: number;
  gridRows: number;
  cellSize: number;
  startLength: number;
  baseMoveInterval: number;
  minMoveInterval: number;
  wallCount: number;
  /** Normal garden phase duration (ms) before finale. */
  normalPhaseMs: number;
  /** Survive this long in finale with patrol active to win. */
  finaleDurationMs: number;
  escalation: SnakeEscalationConfig;
  bgColor: string;
  startLives: number;
}
```

Remove the old field:

```ts
  /** @deprecated Removed — use normalPhaseMs + finaleDurationMs */
  // surviveTimeMs: number;
```

Search the repo for `surviveTimeMs` and update all references (expect `SnakeScene.ts` in Task 8).

- [ ] **Step 2: Update `levels/garden-snake.ts`**

```ts
import type { SnakeLevelConfig } from '../types';

export const GARDEN_SNAKE_LEVEL_CONFIG: SnakeLevelConfig = {
  id: 'GARDEN_SNAKE',
  name: 'Garden Snake',
  genre: 'snake',
  description: 'Grow your tail in the garden — then survive the patrol!',
  catPose: 'slitherer',
  victoryCondition: { type: 'goal', description: 'Survive the garden patrol' },
  starThresholds: [200, 500, 900],

  gridCols: 20,
  gridRows: 15,
  cellSize: 36,

  startLength: 3,
  baseMoveInterval: 180,
  minMoveInterval: 70,
  wallCount: 8,
  normalPhaseMs: 75_000,
  finaleDurationMs: 20_000,
  escalation: {
    speedStepAmount: 4,
    speedStepEveryMs: 10_000,
    extraWallAtElapsedMs: [25_000, 50_000],
  },

  bgColor: '#1a2e1a',
  startLives: 3,
};
```

- [ ] **Step 3: Update `levels/catalog.ts` meta for `GARDEN_SNAKE`**

Set `victoryCondition` to `{ type: 'goal', description: 'Survive the garden patrol' }` and align `description` string with `garden-snake.ts` if desired.

- [ ] **Step 4: Create `scenes/snake/types.ts`**

```ts
import type Phaser from 'phaser';

export const DEPTH = {
  BG: 0,
  WALLS: 5,
  FOOD: 8,
  DOG: 9,
  SNAKE: 10,
  EFFECTS: 30,
  HUD: 50,
} as const;

export interface SceneManager {
  create(): void;
  update(time: number, delta: number): void;
  destroy(): void;
}

export function gridKey(col: number, row: number): string {
  return `${col},${row}`;
}
```

- [ ] **Step 5: Create `scenes/snake/phaseState.ts`**

```ts
export type SnakeRunPhase = 'normal' | 'finale' | 'won';

export interface PhaseStateInput {
  elapsedMs: number;
  normalPhaseMs: number;
  finaleDurationMs: number;
  finaleStarted: boolean;
}

/**
 * `elapsedMs` = scene time.now - runStartTime (wall clock, not paused-adjusted in v1).
 * When normal phase ends, caller sets `finaleStarted` true and resets a finale-local timer;
 * this function only needs finale elapsed for win check.
 */
export function resolvePhase(input: PhaseStateInput, finaleElapsedMs: number): SnakeRunPhase {
  if (!input.finaleStarted) {
    return input.elapsedMs >= input.normalPhaseMs ? 'finale' : 'normal';
  }
  if (finaleElapsedMs >= input.finaleDurationMs) return 'won';
  return 'finale';
}
```

**Note:** Orchestrator may use two timers: `runElapsed` from start, and `finaleElapsed` from moment finale began. Export a helper:

```ts
export function shouldEnterFinale(elapsedMs: number, normalPhaseMs: number, finaleStarted: boolean): boolean {
  return !finaleStarted && elapsedMs >= normalPhaseMs;
}
```

Adjust `resolvePhase` in implementation if you prefer a single function with `finaleStartTime` optional — tests must lock the contract.

- [ ] **Step 6: Tests `scenes/snake/phaseState.test.ts`**

```ts
import { describe, it, expect } from 'vitest';
import { resolvePhase, shouldEnterFinale } from './phaseState';

describe('shouldEnterFinale', () => {
  it('false before threshold', () => {
    expect(shouldEnterFinale(1000, 75_000, false)).toBe(false);
  });
  it('true at threshold', () => {
    expect(shouldEnterFinale(75_000, 75_000, false)).toBe(true);
  });
  it('false if already started', () => {
    expect(shouldEnterFinale(80_000, 75_000, true)).toBe(false);
  });
});

describe('resolvePhase', () => {
  it('normal while under normalPhaseMs and finale not started', () => {
    expect(
      resolvePhase(
        { elapsedMs: 10_000, normalPhaseMs: 75_000, finaleDurationMs: 20_000, finaleStarted: false },
        0
      )
    ).toBe('normal');
  });
  it('finale when finale started and under finale duration', () => {
    expect(
      resolvePhase(
        { elapsedMs: 80_000, normalPhaseMs: 75_000, finaleDurationMs: 20_000, finaleStarted: true },
        5_000
      )
    ).toBe('finale');
  });
  it('won when finale elapsed exceeds duration', () => {
    expect(
      resolvePhase(
        { elapsedMs: 80_000, normalPhaseMs: 75_000, finaleDurationMs: 20_000, finaleStarted: true },
        20_000
      )
    ).toBe('won');
  });
});
```

Run: `npx vitest run scenes/snake/phaseState.test.ts` — expect PASS after implementation matches.

- [ ] **Step 7: Create `scenes/snake/patrolPath.ts`**

Define:

```ts
export type PatrolAxis = 'row' | 'col';

export interface PatrolSegment {
  axis: PatrolAxis;
  /** Fixed row index if axis==='row', else fixed col */
  fixed: number;
  /** Inclusive range on the varying axis */
  a: number;
  b: number;
}

export interface PatrolState {
  varying: number;
  direction: 1 | -1;
}

export function pickLongestPatrolSegment(
  gridCols: number,
  gridRows: number,
  wallKeys: Set<string>,
  rng: () => number
): PatrolSegment | null {
  const key = (c: number, r: number) => `${c},${r}`;
  let best: PatrolSegment | null = null;
  let bestLen = 0;

  const consider = (seg: PatrolSegment, len: number) => {
    if (len < 3) return;
    if (len > bestLen || (len === bestLen && rng() < 0.5)) {
      bestLen = len;
      best = seg;
    }
  };

  for (let r = 1; r < gridRows - 1; r++) {
    let runStart: number | null = null;
    for (let c = 1; c < gridCols - 1; c++) {
      if (wallKeys.has(key(c, r))) {
        if (runStart !== null) {
          const runEnd = c - 1;
          consider({ axis: 'row', fixed: r, a: runStart, b: runEnd }, runEnd - runStart + 1);
          runStart = null;
        }
      } else if (runStart === null) {
        runStart = c;
      }
    }
    if (runStart !== null) {
      const runEnd = gridCols - 2;
      consider({ axis: 'row', fixed: r, a: runStart, b: runEnd }, runEnd - runStart + 1);
    }
  }

  for (let c = 1; c < gridCols - 1; c++) {
    let runStart: number | null = null;
    for (let r = 1; r < gridRows - 1; r++) {
      if (wallKeys.has(key(c, r))) {
        if (runStart !== null) {
          const runEnd = r - 1;
          consider({ axis: 'col', fixed: c, a: runStart, b: runEnd }, runEnd - runStart + 1);
          runStart = null;
        }
      } else if (runStart === null) {
        runStart = r;
      }
    }
    if (runStart !== null) {
      const runEnd = gridRows - 2;
      consider({ axis: 'col', fixed: c, a: runStart, b: runEnd }, runEnd - runStart + 1);
    }
  }

  return best;
}

export function stepPatrol(seg: PatrolSegment, state: PatrolState): PatrolState {
  let next = state.varying + state.direction;
  let dir = state.direction;
  if (next > seg.b) {
    next = seg.b;
    dir = -1;
  } else if (next < seg.a) {
    next = seg.a;
    dir = 1;
  }
  return { varying: next, direction: dir };
}

export function patrolCell(seg: PatrolSegment, state: PatrolState): { col: number; row: number } {
  if (seg.axis === 'row') return { col: state.varying, row: seg.fixed };
  return { col: seg.fixed, row: state.varying };
}
```

Implement `pickLongestPatrolSegment` and `stepPatrol` fully (no `null` stub in shipped code).

- [ ] **Step 8: Tests `scenes/snake/patrolPath.test.ts`**

- Empty 5×5 with only borders: pick segment with length ≥ 3 on a middle row.
- Wall blocking middle cell shortens run.
- `stepPatrol` bounces at `a` and `b`.

- [ ] **Step 9: Create `scenes/snake/escalation.ts`**

```ts
export function moveIntervalAfterElapsed(
  base: number,
  min: number,
  elapsedMs: number,
  speedStepEveryMs: number,
  speedStepAmount: number
): number {
  if (speedStepEveryMs <= 0) return base;
  const steps = Math.floor(elapsedMs / speedStepEveryMs);
  return Math.max(min, base - steps * speedStepAmount);
}

export function shouldAddExtraWallNow(
  elapsedMs: number,
  prevElapsedMs: number,
  extraWallAtElapsedMs: number[]
): boolean {
  return extraWallAtElapsedMs.some(
    (t) => t > prevElapsedMs && t <= elapsedMs
  );
}
```

- [ ] **Step 10: Tests `scenes/snake/escalation.test.ts`**

- At 0ms interval equals base; after 10s with step 4 and every 10s, interval is base - 4.
- Clamps at `min`.
- `shouldAddExtraWall` true exactly when crossing a threshold.

- [ ] **Step 11: Run full test suite**

Run: `npm run test:run`  
Expected: all pass.

- [ ] **Step 12: Commit**

```bash
git add types.ts levels/garden-snake.ts levels/catalog.ts scenes/snake/
git commit -m "feat(garden-snake): phase timers, escalation types, pure snake logic tests"
```

---

### Task 2: WallManager

**Files:**

- Create: `scenes/snake/WallManager.ts`

- [ ] **Step 1: Implement `WallManager`**

Constructor: `(scene: Phaser.Scene, config: SnakeLevelConfig)`. Hold `walls: Set<string>`, `graphics: Phaser.GameObjects.Graphics`.

`create()`:

- Build border keys for `0..gridCols-1` / `0..gridRows-1` edges.
- Add `wallCount` interior random cells (avoid center spawn band if needed — match current `SnakeScene` avoidance: `Phaser.Math.Between(3, gridCols-4)`).
- Draw rounded rects with fill `0x5a3a2a` at depth `DEPTH.WALLS`.

Expose:

```ts
getWalls(): Set<string>;
tryAddInteriorWall(exclude: Set<string>): boolean; // picks random free interior, returns false if none
redraw(): void;
```

- [ ] **Step 2: Manual smoke**

Run dev server, load level — walls visible (integrate in Task 8 or temporary patch `SnakeScene` to instantiate manager only for visual check).

- [ ] **Step 3: Commit**

```bash
git add scenes/snake/WallManager.ts
git commit -m "feat(garden-snake): WallManager for borders and interior walls"
```

---

### Task 3: GridRenderManager

**Files:**

- Create: `scenes/snake/GridRenderManager.ts`

- [ ] **Step 1: Implement checkerboard**

Same logic as current `SnakeScene` nested loops: alternating `0x1e3a1e` / `0x1a321a` (or spec-tuned greens). `setDepth(DEPTH.BG)`.

- [ ] **Step 2: Commit**

```bash
git add scenes/snake/GridRenderManager.ts
git commit -m "feat(garden-snake): GridRenderManager garden checkerboard"
```

---

### Task 4: FoodManager

**Files:**

- Create: `scenes/snake/FoodManager.ts`

- [ ] **Step 1: API**

- `spawn(exclude: Set<string>)` — random free cell in interior, create circle sprite, tween pulse.
- `clear()` — destroy sprite, null position.
- `getFood(): { col: number; row: number } | null`
- `onResize` not required for fixed grid.

- [ ] **Step 2: Commit**

```bash
git add scenes/snake/FoodManager.ts
git commit -m "feat(garden-snake): FoodManager spawn and clear"
```

---

### Task 5: EscalationManager

**Files:**

- Create: `scenes/snake/EscalationManager.ts`

- [ ] **Step 1: Wire pure helpers**

Hold `prevElapsed = 0`. Each `update`, read `elapsedMs` from scene time. Call `moveIntervalAfterElapsed` from `escalation.ts`. Call `shouldAddExtraWallNow`; when true, `wallManager.tryAddInteriorWall(occupied)` where `occupied` = walls ∪ snake body keys (orchestrator passes callback).

Expose `getMoveInterval(): number`.

- [ ] **Step 2: Commit**

```bash
git add scenes/snake/EscalationManager.ts
git commit -m "feat(garden-snake): EscalationManager for speed and timed walls"
```

---

### Task 6: Score and streak (no powerups)

**Files:**

- Modify: `scenes/SnakeScene.ts` (temporary) or defer to Task 8

- [ ] **Step 1: Verify spec**

On eat: +10 score, streak increment, multiplier every 5 streak (cap 5) — preserve when moving to orchestrator. No new pickup types.

- [ ] **Step 2: Commit** (empty commit allowed only if no code change — prefer skip commit or merge with Task 8)

If no diff: skip commit; document in Task 8 PR description.

---

### Task 7: PhaseController + PatrolDogManager

**Files:**

- Create: `scenes/snake/PhaseController.ts`
- Create: `scenes/snake/PatrolDogManager.ts`

- [ ] **Step 1: `PhaseController`**

Tracks `runStartTime`, `finaleStartTime | null`, `finaleStarted`. Methods:

- `update()` — compute `shouldEnterFinale`, transition: stop food spawn (`food.clear()`), notify `PatrolDogManager.start()`, play SFX in Task 9.
- `isFinale()`, `getFinaleRemainingSec()`, `getNormalRemainingSec()` for HUD.
- `hasWon(finaleElapsed)` — finale elapsed ≥ `finaleDurationMs`.

Use `phaseState.ts` helpers.

- [ ] **Step 2: `PatrolDogManager`**

On `start()`: `pickLongestPatrolSegment` with `wallManager.getWalls()`, `Phaser.Math.RFloat` or seeded RNG. Initialize `PatrolState`. Draw dog cell (contrasting color, depth `DEPTH.DOG`).

Each snake tick (orchestrator calls `onSnakeTick()`): `stepPatrol`, update graphics position.

`getCell(): { col, row }` for collision.

- [ ] **Step 3: Commit**

```bash
git add scenes/snake/PhaseController.ts scenes/snake/PatrolDogManager.ts
git commit -m "feat(garden-snake): finale phase and patrol dog"
```

---

### Task 8: SnakeSimManager + SnakeScene orchestrator

**Files:**

- Create: `scenes/snake/SnakeSimManager.ts`
- Modify: `scenes/SnakeScene.ts` (major deletion of inlined logic)

- [ ] **Step 1: `SnakeSimManager`**

Owns `snakeBody`, `direction`, `nextDirection`, `moveTimer`, references `moveInterval` from escalation. Methods: `handleInput`, `step` (move head, wall/self/dog collision callbacks), `resetToCenter`, `draw`.

Collision order: after head move, check wall set, self, then dog if finale.

**Death during finale:** reset snake only; do not reset `finaleStartTime` (per spec).

- [ ] **Step 2: Orchestrator `SnakeScene`**

Order in `create()`:

1. `GridRenderManager.create()`
2. `WallManager.create()`
3. `FoodManager` + first spawn
4. `EscalationManager`, `PhaseController`, `PatrolDogManager` (dog inactive)
5. `SnakeSimManager.create()`
6. `EffectsManager`, input, HUD text, `PhaserAudio` (Task 9 can add audio line)

`update()`:

1. If game over / won return
2. `phaseController.update()` — may flip finale
3. `escalationManager.update(elapsed)` → interval
4. Accumulate `moveTimer`; on step: snake step; if finale, `patrolDogManager.onSnakeTick()`; check food eat; check win via `phaseController.hasWon`

`emitLevelComplete`: `victoryType: 'goal'` (cast if needed: `as LevelCompletePayload['victoryType']`).

Remove duplicate grid/wall/food/snake code from old file.

- [ ] **Step 3: Run tests + build**

```bash
npm run test:run
npm run build
```

- [ ] **Step 4: Commit**

```bash
git add scenes/SnakeScene.ts scenes/snake/SnakeSimManager.ts
git commit -m "refactor(garden-snake): SnakeScene orchestrator and SnakeSimManager"
```

---

### Task 9: SFX integration

**Files:**

- Modify: `scenes/SnakeScene.ts`

- [ ] **Step 1: Instantiate audio**

```ts
import { PhaserAudio } from './shared/PhaserAudio';

// in create:
this.audio = new PhaserAudio(this);

// on destroy/shutdown if SceneBridge provides hook, call this.audio.destroy()
```

- [ ] **Step 2: Event mapping (reuse existing types — no PhaserAudio.ts change required)**

| Event | `playSfx` |
|-------|-----------|
| Eat treat | `'coin'` |
| Wall / self / dog hit | `'hit'` |
| Finale begins | `'boss_alert'` |
| Level complete | `'mult'` |

- [ ] **Step 3: Commit**

```bash
git add scenes/SnakeScene.ts
git commit -m "feat(garden-snake): PhaserAudio SFX hooks"
```

---

### Task 10: Integration + QA

- [ ] **Step 1: `npm run test:run`** — expect 0 failures.

- [ ] **Step 2: `npm run build`** — expect success.

- [ ] **Step 3: Manual QA checklist**

- [ ] Level loads from campaign; cat sprite still loads if applicable.
- [ ] Arrows change direction; no 180° instant reverse (preserve existing rules).
- [ ] Normal countdown reaches 0 → finale banner/timer; food disappears.
- [ ] Dog patrols and kills on head overlap.
- [ ] Lose life in finale → snake resets, finale timer continues.
- [ ] Win after finale duration → `LEVEL_COMPLETE` / React flow.
- [ ] Pause (`P` / `ESC`) still works.

- [ ] **Step 4: Final commit** (if only doc/test tweaks)

```bash
git commit --allow-empty -m "chore(garden-snake): QA sign-off" || true
```

---

## Spec coverage (self-review)

| Spec section | Task(s) |
|--------------|---------|
| Two-phase timers | 1, 7, 8 |
| Escalation speed + timed walls | 1, 5, 8 |
| Finale food cleared | 7, 8 |
| Dog grid patrol | 1, 7, 8 |
| Finale life loss = snake reset only | 8 |
| victoryCondition `goal` | 1 |
| Manager architecture | 2–8 |
| Pure logic tests | 1 |
| SFX | 9 |
| Stars/score | 6, 8 |

No placeholder tasks; `pickLongestPatrolSegment` must be fully implemented before merge.

---

## Execution handoff

**Plan saved to** `docs/plans/2026-04-05-garden-snake-implementation.md`.

**1. Subagent-driven (recommended)** — Dispatch a fresh subagent per task with spec + plan context; review after each task.

**2. Inline execution** — Run tasks sequentially in this chat with checkpoints after Tasks 1, 8, and 10.

Which approach do you want for implementation?
