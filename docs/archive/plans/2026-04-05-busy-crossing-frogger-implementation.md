# Busy Crossing (STREET) — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Refactor `FroggerScene` into a modular `scenes/frogger/` manager stack with data-driven **crossing phases** (road → median slow → bike), remove the **water** band, add **Vitest** coverage for pure rules, and wire **PhaserAudio** SFX — delivering the approved design spec end-to-end.

**Architecture:** `FroggerScene` becomes a thin orchestrator (~300–500 lines) that owns bridge wiring, `PhaserAudio`, and `EffectsManager`, then delegates to managers implementing `SceneManager` from `scenes/frogger/types.ts`. Active layout = `config.phases[activePhaseIndex(crossingsCompleted)]`. Moving hazards are rectangles (sprites later). Collision and scoring use **pure** modules tested without Phaser.

**Tech Stack:** Phaser 3, React 19, TypeScript, Vitest

**Spec:** `docs/specs/2026-04-05-busy-crossing-frogger-design.md`

---

## 10-Task Template (STREET mapping)

| Task | Generic | This level |
|------|---------|------------|
| 1 | Types + config | `FroggerLane` kinds, `FroggerCrossingPhase`, `phases[]`, `levels/street.ts`, pure `phaseIndex` / `collisionRules` / `scoring` + tests |
| 2 | Terrain | `FroggerLaneView` — lane strips, road markings, goal label |
| 3 | Background | `FroggerBackground` — sky gradient / simple parallax (no art pipeline) |
| 4 | Moving “enemies” | `FroggerTrafficManager` — spawn + wrap movers per lane |
| 5 | Hazards | `FroggerTimerManager` — countdown, death on timeout, low-time pressure |
| 6 | Powerups → **Scoring row** | `FroggerScoreBridge` or inline in orchestrator using `scoring.ts` — row advance + crossing bonus (no pickups per spec) |
| 7 | Boss → **Crossing / win** | `FroggerCrossingManager` — goal row, increment crossings, reset bottom, `emitLevelComplete` |
| 8 | Scene rewrite | `FroggerScene` wires managers + `FroggerPlayerController` |
| 9 | SFX | `PhaserAudio`: `jump`, `hit`, `coin` (crossing), optional `meow` |
| 10 | Integration + QA | `npm run test:run`, `npm run build`, manual load STREET |

**Note:** Task 6 is **scoring helpers + bridge emissions**, not powerups. Task 7 replaces boss with **goal / crossing progression**.

---

## File Map

### Create
```
scenes/frogger/types.ts                 — SceneManager, DEPTH, runtime lane-object handle type
scenes/frogger/phaseIndex.ts            — activePhaseIndex(crossingsCompleted, phaseCount)
scenes/frogger/phaseIndex.test.ts
scenes/frogger/collisionRules.ts        — overlap player vs mover, per-lane-kind tolerances
scenes/frogger/collisionRules.test.ts
scenes/frogger/scoring.ts               — row advance + crossing bonus constants/helpers
scenes/frogger/scoring.test.ts
scenes/frogger/FroggerLaneView.ts       — graphics for lanes from FroggerLane[]
scenes/frogger/FroggerBackground.ts     — background / parallax-lite
scenes/frogger/FroggerTrafficManager.ts — moving rectangles, wrap, group destroy
scenes/frogger/FroggerTimerManager.ts   — Phaser timer event, timeRemaining
scenes/frogger/FroggerPlayerController.ts — cursor input, grid, hop tween, player sprite
scenes/frogger/FroggerCrossingManager.ts — goal detection, crossingsToWin, reset, victory
```

### Modify
```
types.ts                    — FroggerLane: replace water with medianSlow/bike; add FroggerCrossingPhase; FroggerLevelConfig.phases
levels/street.ts            — three authored phases (0 teach, no bike; 1+ harder); remove water lanes
scenes/FroggerScene.ts      — orchestrator only
levels/index.ts             — only if exports/types need re-export (likely unchanged)
```

### Dependency graph
```
Task 1 ──► Tasks 2–7 (parallel after 1)
Tasks 2–7 ──► Task 8
Task 8 ──► Task 9
Task 9 ──► Task 10
```

---

### Task 1: Types, Config, Pure Logic + Tests

**Files:**
- Modify: `types.ts` (Frogger types block ~672–708)
- Modify: `levels/street.ts` (replace single LANES with `phases`)
- Create: `scenes/frogger/types.ts`
- Create: `scenes/frogger/phaseIndex.ts`, `phaseIndex.test.ts`
- Create: `scenes/frogger/collisionRules.ts`, `collisionRules.test.ts`
- Create: `scenes/frogger/scoring.ts`, `scoring.test.ts`

- [ ] **Step 1: Replace `FroggerLane` water model with four-kind model**

In `types.ts`, replace the `FroggerLane` interface and remove `water` from the lane type union. Use a single discriminant **`kind`** (rename field from `type` for clarity) — update all references in the repo in this task (FroggerScene will be updated in Task 8; grep after Task 1 may still show old scene: that is OK until Task 8).

```ts
/** One horizontal lane band (bottom → top ordering in config arrays). */
export type FroggerLaneKind = 'safe' | 'road' | 'medianSlow' | 'bike';

export interface FroggerLane {
  y: number;
  kind: FroggerLaneKind;
  direction: 1 | -1;
  speed: number;
  objects: {
    width: number;
    height: number;
    color: number;
    gap: number;
  };
}

export interface FroggerCrossingPhase {
  lanes: FroggerLane[];
  /** Optional debug label */
  label?: string;
}

export interface FroggerLevelConfig extends CampaignLevelMeta {
  genre: 'frogger';
  /** Per-crossing layout; index = activePhaseIndex(crossingsCompleted) */
  phases: FroggerCrossingPhase[];
  cellSize: number;
  startCol: number;
  timeLimit: number;
  bgColor: string;
  crossingsToWin: number;
  startLives: number;
}
```

Remove **`lanes`** from `FroggerLevelConfig` if it existed as a top-level duplicate; only **`phases`** holds lane arrays.

- [ ] **Step 2: Add `scenes/frogger/types.ts`**

```ts
import type Phaser from 'phaser';
import type { FroggerLane } from '../../types';

export interface SceneManager {
  create(): void;
  update(time: number, delta: number): void;
  destroy(): void;
}

export const DEPTH = {
  BG: 0,
  LANES: 2,
  OBJECTS: 10,
  PLAYER: 20,
  EFFECTS: 30,
  HUD: 50,
} as const;

/** Runtime handle for one moving hazard rectangle */
export interface TrafficEntry {
  sprite: Phaser.GameObjects.Rectangle;
  lane: FroggerLane;
}
```

- [ ] **Step 3: Implement `phaseIndex.ts`**

```ts
/**
 * crossingsCompleted = number of market goals already achieved this run.
 * First attempt: 0 → phase index 0.
 * After 1st crossing: 1 → phase index 1 (capped).
 */
export function activePhaseIndex(
  crossingsCompleted: number,
  phaseCount: number
): number {
  if (phaseCount <= 0) return 0;
  return Math.min(Math.max(0, crossingsCompleted), phaseCount - 1);
}
```

- [ ] **Step 4: Test `phaseIndex`**

Create `scenes/frogger/phaseIndex.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { activePhaseIndex } from './phaseIndex';

describe('activePhaseIndex', () => {
  it('first crossing uses phase 0', () => {
    expect(activePhaseIndex(0, 3)).toBe(0);
  });
  it('second crossing uses phase 1', () => {
    expect(activePhaseIndex(1, 3)).toBe(1);
  });
  it('caps at last phase', () => {
    expect(activePhaseIndex(99, 3)).toBe(2);
  });
  it('handles single phase', () => {
    expect(activePhaseIndex(5, 1)).toBe(0);
  });
});
```

Run: `npx vitest run scenes/frogger/phaseIndex.test.ts`  
Expected: **PASS**

- [ ] **Step 5: Implement `collisionRules.ts`**

Pure math only — no Phaser types. `kind` determines horizontal overlap tolerance (fraction of cell half-width added to mover half-width).

```ts
import type { FroggerLaneKind } from '../../types';

export interface CircleOrBoxPlayer {
  x: number;
  y: number;
  halfCell: number;
}

export interface MoverBox {
  x: number;
  y: number;
  halfWidth: number;
  halfHeight: number;
}

/** Extra horizontal slack as a fraction of player half-cell (tighter for bikes). */
export function horizontalSlackForKind(kind: FroggerLaneKind): number {
  switch (kind) {
    case 'road':
      return 0.4;
    case 'medianSlow':
      return 0.45;
    case 'bike':
      return 0.25;
    case 'safe':
      return 0.4;
  }
}

export function hazardOverlap(
  player: CircleOrBoxPlayer,
  mover: MoverBox,
  kind: FroggerLaneKind
): boolean {
  if (kind === 'safe') return false;
  const slack = horizontalSlackForKind(kind) * player.halfCell;
  const dx = Math.abs(mover.x - player.x);
  const dy = Math.abs(mover.y - player.y);
  if (dx >= mover.halfWidth + player.halfCell * 0.4 + slack) return false;
  if (dy >= mover.halfHeight + player.halfCell * 0.8) return false;
  return true;
}
```

Export `FroggerLaneKind` from `types.ts` if needed for the import, or import the union via `import type { FroggerLane }` and use `lane.kind`.

- [ ] **Step 6: Test `collisionRules`**

`scenes/frogger/collisionRules.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { hazardOverlap } from './collisionRules';

const P = { x: 100, y: 200, halfCell: 24 };

describe('hazardOverlap', () => {
  it('returns false for safe', () => {
    expect(hazardOverlap(P, { x: 100, y: 200, halfWidth: 40, halfHeight: 20 }, 'safe')).toBe(
      false
    );
  });
  it('detects road hit when aligned', () => {
    expect(hazardOverlap(P, { x: 100, y: 200, halfWidth: 30, halfHeight: 20 }, 'road')).toBe(
      true
    );
  });
  it('misses when mover is far horizontally', () => {
    expect(hazardOverlap(P, { x: 200, y: 200, halfWidth: 10, halfHeight: 20 }, 'road')).toBe(
      false
    );
  });
});
```

Run: `npx vitest run scenes/frogger/collisionRules.test.ts`  
Expected: **PASS**

- [ ] **Step 7: Implement `scoring.ts`**

```ts
export const ROW_ADVANCE_POINTS = 10;
export const CROSSING_BONUS_POINTS = 100;

export function scoreAfterHigherRow(
  previousHighestRow: number,
  newRow: number,
  currentScore: number
): { score: number; highestRow: number } {
  if (newRow <= previousHighestRow) {
    return { score: currentScore, highestRow: previousHighestRow };
  }
  return {
    score: currentScore + ROW_ADVANCE_POINTS,
    highestRow: newRow,
  };
}

export function scoreAfterCrossing(currentScore: number): number {
  return currentScore + CROSSING_BONUS_POINTS;
}
```

- [ ] **Step 8: Test `scoring`**

`scenes/frogger/scoring.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import {
  scoreAfterHigherRow,
  scoreAfterCrossing,
  ROW_ADVANCE_POINTS,
  CROSSING_BONUS_POINTS,
} from './scoring';

describe('scoring', () => {
  it('adds row points once when new highest row is higher', () => {
    const r = scoreAfterHigherRow(0, 3, 0);
    expect(r.highestRow).toBe(3);
    expect(r.score).toBe(ROW_ADVANCE_POINTS);
  });
  it('skips when row not higher', () => {
    const r = scoreAfterHigherRow(5, 3, 100);
    expect(r).toEqual({ score: 100, highestRow: 5 });
  });
  it('crossing bonus', () => {
    expect(scoreAfterCrossing(50)).toBe(50 + CROSSING_BONUS_POINTS);
  });
});
```

Run: `npx vitest run scenes/frogger/scoring.test.ts`  
Expected: **PASS**

- [ ] **Step 9: Rewrite `levels/street.ts` with three phases**

Author **`PHASE_0`** (teach): **no `bike` lanes**. Example structure (tune numbers in playtest):

- Safe start  
- **2** road lanes (slower speeds, wider gaps)  
- **1** `medianSlow` lane  
- **1** extra road OR skip extra — **must not** include `bike`  
- Safe goal  

**PHASE_1:** add **1** `bike` lane OR increase road speeds; include **1–2** `medianSlow`.

**PHASE_2:** full pressure — **2** bike lanes or faster bikes, tighter gaps, more road rows.

Use a helper mirroring the old `lane()` but with `kind: FroggerLaneKind`:

```ts
function lane(
  index: number,
  kind: FroggerLaneKind,
  dir: 1 | -1,
  speed: number,
  objWidth: number,
  color: number,
  gap: number
): FroggerLane {
  const LANE_H = CELL;
  return {
    y: 600 - index * LANE_H,
    kind,
    direction: dir,
    speed,
    objects: { width: objWidth, height: LANE_H - 4, color, gap },
  };
}
```

Export:

```ts
export const STREET_LEVEL_CONFIG: FroggerLevelConfig = {
  id: 'STREET',
  // ... meta fields unchanged from prior file ...
  phases: [
    { label: 'teach', lanes: [ /* ... */ ] },
    { label: 'mid', lanes: [ /* ... */ ] },
    { label: 'hard', lanes: [ /* ... */ ] },
  ],
  cellSize: CELL,
  startCol: 10,
  timeLimit: 60,
  bgColor: '#1a2a1a',
  crossingsToWin: 3,
  startLives: 3,
};
```

Remove any **`water`** lanes and the old single **`LANES`** constant.

- [ ] **Step 10: Commit**

```bash
git add types.ts levels/street.ts scenes/frogger/
git commit -m "feat(frogger): phased level config and pure rules for STREET"
```

---

### Task 2: Terrain — `FroggerLaneView`

**Files:**
- Create: `scenes/frogger/FroggerLaneView.ts`

- [ ] **Step 1: Implement manager**

Constructor takes `(scene: Phaser.Scene, cellSize: number)`. `create(lanes: FroggerLane[], width: number): void` clears prior graphics, fills lane bands by `kind`:

- `safe` — green tint  
- `road` — asphalt + yellow dash loop (same as current `FroggerScene.drawLanes`)  
- `medianSlow` — slightly different green/brown “planter” fill  
- `bike` — bike-lane hint (e.g. lighter gray + border)

Add **goal** text “FISH MARKET” on last safe lane (copy positioning from current scene).

`destroy()`: destroy graphics and text objects.

- [ ] **Step 2: Manual smoke**

Temporarily call from `FroggerScene` with `config.phases[0].lanes` before Task 8 full rewrite — or wait for Task 8. Prefer **wait for Task 8** if intermediate wiring would break build.

- [ ] **Step 3: Commit**

```bash
git add scenes/frogger/FroggerLaneView.ts
git commit -m "feat(frogger): lane view manager for STREET"
```

---

### Task 3: Background — `FroggerBackground`

**Files:**
- Create: `scenes/frogger/FroggerBackground.ts`

- [ ] **Step 1: Implement manager**

`create(width: number, height: number): void` — gradient rectangle or 2–3 wide rectangles at `DEPTH.BG` with subtle vertical gradient (dusk sky / city). Optional: slow parallax offset on `update` using `tilePositionX` if using a TileSprite; **YAGNI:** static gradient is acceptable.

`destroy()`: remove children.

- [ ] **Step 2: Commit**

```bash
git add scenes/frogger/FroggerBackground.ts
git commit -m "feat(frogger): simple street background"
```

---

### Task 4: Traffic — `FroggerTrafficManager`

**Files:**
- Create: `scenes/frogger/FroggerTrafficManager.ts`

- [ ] **Step 1: Implement manager**

Fields: `entries: TrafficEntry[]`, reference to `scene`.

`rebuild(lanes: FroggerLane[], screenWidth: number): void` — `destroy()` prior rectangles, respawn for every non-`safe` lane using the same loop as current `spawnLaneObjects` (while `x < totalSpan`). Stroke style for `medianSlow` optional.

`update(dt: number): void` — move `sprite.x` by `lane.direction * lane.speed * dt`, wrap when off-screen (copy math from `FroggerScene.updateLaneObjects`).

**Remove** all **water riding** / `ridingObject` logic — no longer applicable.

`destroy()`: clear array and destroy sprites.

- [ ] **Step 2: Commit**

```bash
git add scenes/frogger/FroggerTrafficManager.ts
git commit -m "feat(frogger): traffic spawn and wrap manager"
```

---

### Task 5: Timer — `FroggerTimerManager`

**Files:**
- Create: `scenes/frogger/FroggerTimerManager.ts`

- [ ] **Step 1: Implement manager**

Owns `timeRemaining`, `Phaser.Time.TimerEvent | null`, and optional `onTick` / `onExpire` callbacks set by scene.

Methods:

- `start(seconds: number)` — cancel prior event, set `timeRemaining`, add 1s repeat event  
- `stop()` — remove event  
- `destroy()` — `stop()`

On each tick: decrement; if `<= 0`, call `onExpire`.

- [ ] **Step 2: Commit**

```bash
git add scenes/frogger/FroggerTimerManager.ts
git commit -m "feat(frogger): timer manager for crossing time limit"
```

---

### Task 6: Scoring Integration (pure helpers already exist)

**Files:**
- Modify: `scenes/FroggerScene.ts` (partially) **or** small `scenes/frogger/FroggerScoreHelper.ts` — **prefer** keeping emissions in orchestrator in Task 8; this task validates wiring contract.

- [ ] **Step 1: Document the contract**

In a short comment block at top of `scenes/frogger/scoring.ts` (or README in plan only), state:

- On hop to higher row index: `scoreAfterHighestRow` from `scoring.ts` updates `gameScore.current` and `highestRow`.  
- On goal: `scoreAfterCrossing` then `emitScoreUpdate`.

- [ ] **Step 2: No new file required if Task 8 uses imports directly**

If you created no file, commit message can be skipped or fold into Task 8. **Preferred:** skip standalone commit; complete scoring calls in Task 8.

---

### Task 7: Crossing / Goal — `FroggerCrossingManager`

**Files:**
- Create: `scenes/frogger/FroggerCrossingManager.ts`

- [ ] **Step 1: Implement goal + reset API**

This manager does **not** own Phaser objects; it owns **callbacks** and **state**:

```ts
export interface CrossingManagerDeps {
  crossingsToWin: number;
  cellSize: number;
  getLanes: () => FroggerLane[];
  getGridRow: () => number;
  getCrossingsCompleted: () => number;
  onCrossingComplete: (crossingsCompleted: number) => void;
  onVictory: () => void;
  resetPlayerToStart: () => void;
  refreshLayoutForPhase: (phaseIndex: number) => void;
}
```

`checkGoalAfterHop()` — if `gridRow === lanes.length - 1` (top safe goal), invoke scoring (scene passes in), increment crossings, call `onCrossingComplete`. If `crossingsCompleted >= crossingsToWin`, `onVictory()`. Else `resetPlayerToStart()` and `refreshLayoutForPhase(activePhaseIndex(crossingsCompleted))`.

**Alternatively** keep this logic inside `FroggerScene` if the callback web gets too heavy — but **prefer** this class for unit-testable state transitions:

Extract **`crossingStateMachine.ts`** pure:

```ts
export function afterReachingGoal(input: {
  crossingsCompleted: number;
  crossingsToWin: number;
}):
  | { type: 'victory' }
  | { type: 'continue'; nextCrossings: number } {
  const next = input.crossingsCompleted + 1;
  if (next >= input.crossingsToWin) return { type: 'victory' };
  return { type: 'continue', nextCrossings: next };
}
```

Add `scenes/frogger/crossingStateMachine.test.ts` with 2–3 cases.

- [ ] **Step 2: Commit**

```bash
git add scenes/frogger/
git commit -m "feat(frogger): crossing progression and state helper"
```

---

### Task 8: Player + Scene Orchestrator Rewrite

**Files:**
- Create: `scenes/frogger/FroggerPlayerController.ts`
- Modify: `scenes/FroggerScene.ts` (major deletion of inlined systems)

- [ ] **Step 1: `FroggerPlayerController`**

Owns: `gridCol`, `gridRow`, `isMoving`, `player` sprite/rect, cursor keys reference.

Methods: `create(config: FroggerLevelConfig, lanes: FroggerLane[]): void`, `update(): void` (read `JustDown` cursors), `getGridRow()`, `getGridCol()`, `getPosition()`, `isHopInProgress()`, `destroy()`.

On successful hop: tween 120ms to cell center; `onHopComplete` callback to scene for goal check + collision enable.

Use `scoreAfterHigherRow` when `targetRow > highestRow` (scene tracks `highestRow`).

- [ ] **Step 2: Rewrite `FroggerScene`**

Pseudo-structure:

```ts
export default class FroggerScene extends SceneBridge {
  private config!: FroggerLevelConfig;
  private audio!: PhaserAudio;
  private effects!: EffectsManager;
  private bg!: FroggerBackground;
  private laneView!: FroggerLaneView;
  private traffic!: FroggerTrafficManager;
  private timer!: FroggerTimerManager;
  private player!: FroggerPlayerController;
  private managers: SceneManager[] = [];

  private crossingsCompleted = 0;
  private highestRow = 0;
  private lives = 3;
  // ...

  private activeLanes(): FroggerLane[] {
    const pi = activePhaseIndex(this.crossingsCompleted, this.config.phases.length);
    return this.config.phases[pi].lanes;
  }

  private rebuildWorld(): void {
    const lanes = this.activeLanes();
    this.laneView.create(lanes, this.scale.width);
    this.traffic.rebuild(lanes, this.scale.width);
    // player stays at bottom; snap position
  }
}
```

`create()`: load cat, `audio = new PhaserAudio(this)`, instantiate managers, `rebuildWorld()`, wire timer `onExpire` → `handleDeath`, bridge emissions mirror current scene.

`update()`: if game over / won return; `this.timer` internal tick handled by Phaser event; `player.update()`; `traffic.update(dt)`; **collision pass**: if `!player.isHopInProgress()`, get current lane by `gridRow`, if lane `kind !== 'safe'`, loop traffic in that lane, `hazardOverlap(..., lane.kind)` → `handleDeath`.

Remove: water riding, `ridingObject`, old `drawLanes` / `spawnLaneObjects` / inlined methods moved to managers.

- [ ] **Step 3: Run tests + typecheck**

Run: `npm run test:run`  
Expected: **PASS**

Run: `npx tsc --noEmit`  
Expected: **no errors**

- [ ] **Step 4: Commit**

```bash
git add scenes/FroggerScene.ts scenes/frogger/
git commit -m "refactor(frogger): orchestrate STREET with manager modules"
```

---

### Task 9: SFX Integration

**Files:**
- Modify: `scenes/FroggerScene.ts`

- [ ] **Step 1: Instantiate `PhaserAudio`**

Match `PlatformerScene`: `this.audio = new PhaserAudio(this);` in `create`, `this.audio.destroy()` in `shutdown` if applicable (follow other scenes’ lifecycle).

- [ ] **Step 2: Call `playSfx`**

| Event | SFX key |
|-------|---------|
| Successful hop started | `jump` |
| Death | `hit` |
| Crossing / goal | `coin` |
| Optional low-time warning (once) | `meow` or skip |

Use existing `ProceduralSfxType` union in `PhaserAudio.ts` — only **`jump`**, **`hit`**, **`coin`** are required.

- [ ] **Step 3: Commit**

```bash
git add scenes/FroggerScene.ts
git commit -m "feat(frogger): PhaserAudio SFX for STREET"
```

---

### Task 10: Integration + QA

- [ ] **Step 1: Full test suite**

Run: `npm run test:run`  
Expected: **PASS** (all projects)

- [ ] **Step 2: Production build**

Run: `npm run build`  
Expected: **exit 0**

- [ ] **Step 3: Dev playthrough**

Run: `npm run dev`, open campaign, select **Busy Crossing**, complete 3 crossings, confirm victory screen / bridge. Verify **phase 0** has **no bike** lanes in `levels/street.ts`.

- [ ] **Step 4: Final commit** (only if fixes needed)

```bash
git add -A
git commit -m "fix(frogger): QA follow-ups for STREET"
```

---

## Plan Self-Review

| Spec section | Task(s) |
|----------------|---------|
| Three bands, no water | 1, 2, 4, 8 |
| Phase table + selection rule | 1 (`phaseIndex`), 8 (`activeLanes`) |
| Phase 0 no bike | 1 (`street.ts` authoring assertion + tests optional) |
| Bottom reset, timer refresh | 7, 8 (`resetPlayerToStart`, timer restart) |
| Collision per kind | 1, 8 |
| Scoring | 1, 6/8 |
| Manager architecture | 2–5, 7–8 |
| SFX | 9 |
| No boss | 7 uses goal only |
| Out of scope pickups | omitted |

**Placeholder scan:** None intentional. **Naming:** `kind` on `FroggerLane` replaces `type` — grep entire repo for `.type === 'road'` etc. when implementing Task 8.

**Type consistency:** `FroggerLevelConfig.phases` is mandatory; update `FroggerScene.init` data typing in `bridgeProtocol` if it references old fields.

---

## Execution Handoff

**Plan complete and saved to** `docs/plans/2026-04-05-busy-crossing-frogger-implementation.md`.

**Two execution options:**

1. **Subagent-driven (recommended)** — dispatch a fresh subagent per task, review between tasks (`superpowers:subagent-driven-development`).

2. **Inline execution** — run tasks in this session with checkpoints (`superpowers:executing-plans`).

**Which approach do you want?**
