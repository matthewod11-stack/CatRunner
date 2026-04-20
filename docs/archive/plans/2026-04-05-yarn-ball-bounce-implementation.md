# Yarn Ball Bounce (YARN) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship the approved YARN design: **two waves** with a **skippable interstitial**, **hybrid yarn-knot mini-boss** (anchored → mobile), **slow + multiball** with **pity-guaranteed** drops from **normal** bricks only, **light parallax** background, and **SFX** for wave clear and phase shift—while keeping `BreakoutScene` a thin orchestrator over `scenes/breakout/` managers.

**Architecture:** Extend existing breakout stack (`YarnBackgroundManager`, `BrickFieldManager`, `BallPaddleManager`, `BreakoutPowerupManager`, `BreakoutHazardManager`, `EffectsManager`, `PhaserAudio`). Add **pure modules** (`yarnKnotState.ts`, `powerupPity.ts`, `breakoutWaves.ts`) with Vitest. Add **`YarnKnotManager`** (or equivalent) for Phaser-side mobile phase. **Wave index** and **interstitial** state live in the scene or a small `WaveFlowController` class co-located with the scene.

**Tech Stack:** Phaser 3 (Arcade Physics), TypeScript, Vitest.

**Spec:** `docs/specs/2026-04-05-yarn-ball-bounce-design.md`

**Baseline:** `scenes/breakout/*` and `BreakoutScene.ts` already implement single-wave bricks, multiball/slow/wide/sticky power-ups, carriers, explosive bricks, hazards, yarn floor band, and procedural SFX. This plan is **delta work** to match the signed spec (not a greenfield scene).

**Pinned decisions (from spec):**
- Slow ball: **time-based**; picking up another slow **refreshes** duration (`slowBallDurationMs`, default 8000).
- Multiball: **max 3** concurrent balls (`powerups.maxBalls`, already in config).
- Inter-wave: **skippable with SPACE** after **≥ 300 ms** in interstitial.

---

## File map

### New files (create)

```
scenes/breakout/yarnKnotState.ts          — pure FSM: anchored | mobile | destroyed; phase flip once
scenes/breakout/yarnKnotState.test.ts
scenes/breakout/powerupPity.ts            — pity + optional random roll; guarantees one slow + one multi per stage
scenes/breakout/powerupPity.test.ts
scenes/breakout/breakoutWaves.ts          — resolve active brick list: waves[] vs legacy bricks[]
scenes/breakout/breakoutWaves.test.ts
scenes/breakout/YarnKnotManager.ts        — dynamic sprite patrol after phase B; implements SceneManager
scenes/breakout/WaveInterstitial.ts       — optional small class: timer + SPACE skip (or inline in scene if tiny)
```

### Modified files

```
types.ts                          — BreakoutBrickKind + YARN_KNOT; waves + wave/miniboss/pity config on BreakoutLevelConfig
levels/yarn.ts                    — waves[0], waves[1] layouts; knot placement wave 2; pity thresholds; YARN-only carriers removed or redundant
scenes/breakout/brickLayout.ts    — accept explicit brick[] (already does via config; may add helper per wave)
scenes/breakout/BrickFieldManager.ts — rebuildGrid(bricks[]), miniboss handoff hook
scenes/breakout/YarnBackgroundManager.ts — 2–3 parallax layers + drift in update()
scenes/breakout/BreakoutHazardManager.ts — tune defaults vs spec (optional)
scenes/BreakoutScene.ts           — wave state machine, interstitial, pity on eliminate, yarn knot wiring, call backgrounds.update
scenes/shared/PhaserAudio.ts      — add sfx keys + procedural stubs: wave_clear, miniboss_shift
```

### Dependency graph

```
Task 1 ──► Tasks 2–7 (parallel where noted)
Task 2 ──► Task 8
Task 3 ──► Task 8
Task 4 ──► Task 8
Task 5 ──► Task 8 (optional polish)
Task 6 ──► Task 8
Task 7 ──► Task 8
Task 8 ──► Task 9, 10
Task 9 ──► Task 10
```

---

## Task template → YARN mapping

| Task | Role | YARN deliverable |
|------|------|------------------|
| 1 | Types + config | `waves`, `YARN_KNOT`, pity + wave transition + miniboss patrol config |
| 2 | Terrain | `BrickFieldManager` wave rebuild API |
| 3 | Background | Parallax layers in `YarnBackgroundManager` |
| 4 | “Enemy” slot | `YarnKnotManager` mobile phase |
| 5 | Hazards | `BreakoutHazardManager` vs spec (fluff optional) |
| 6 | Power-ups | `powerupPity` + scene integration; drops from **normal** eliminations |
| 7 | “Boss” slot | Knot anchored phase in brick map + phase transition + bonus points |
| 8 | Scene orchestrator | Wave flow, interstitial, collider rewiring, victory only after wave 2 clear |
| 9 | SFX | `PhaserAudio` new events |
| 10 | Integration + QA | Vitest full run, build, manual checklist |

---

### Task 1: Type extensions + level config + pure wave helper

**Files:**
- Modify: `types.ts` (breakout section ~672+)
- Create: `scenes/breakout/breakoutWaves.ts`
- Create: `scenes/breakout/breakoutWaves.test.ts`
- Modify: `levels/yarn.ts` (prepare for waves — full layout in Task 2 can finalize counts)

- [ ] **Step 1: Extend `BreakoutBrickKind`**

In `types.ts`, add `'YARN_KNOT'` to the union. Document that knot bricks use `health` as max HP; mobile phase begins when `currentHealth <= ceil(initialHealth / 2)` **once**.

- [ ] **Step 2: Add config blocks**

Add to `types.ts` (names can vary slightly but keep semantics):

```ts
export interface BreakoutMinibossConfig {
  patrolSpeedPx: number;
  bonusDestroyPoints: number;
}

export interface BreakoutWaveTransitionConfig {
  minDelayMs: number;
  /** If true, SPACE skips remaining wait after minDelayMs */
  skippableWithSpace: boolean;
  /** Auto-advance after this many ms if player never skips (optional safety) */
  autoAdvanceMs?: number;
}

export interface BreakoutPowerupConfig {
  // ...existing fields...
  /** 0–1 chance per eligible NORMAL elimination to roll a drop (before pity) */
  randomDropChance?: number;
  /** After this many eligible breaks without a slow, next eligible forces slow */
  pitySlowThreshold?: number;
  pityMultiThreshold?: number;
}
```

Extend `BreakoutLevelConfig`:

```ts
  /** When set, length must be ≥ 1. Index 0 = first wave. If omitted, `bricks` is the only wave. */
  waves?: BreakoutBrick[][];
  miniboss?: BreakoutMinibossConfig;
  waveTransition?: BreakoutWaveTransitionConfig;
```

Keep existing `bricks: BreakoutBrick[]` as **authoring convenience**: `levels/yarn.ts` should set `bricks` to equal `waves[0]` (or build helper) so older code paths that read `config.bricks` for metadata still work until Task 2 removes reliance.

- [ ] **Step 3: Pure helper `getBricksForWave`**

Create `scenes/breakout/breakoutWaves.ts`:

```ts
import type { BreakoutBrick, BreakoutLevelConfig } from '../../types';

export function getBricksForWave(config: BreakoutLevelConfig, waveIndex: number): BreakoutBrick[] {
  if (config.waves && config.waves.length > 0) {
    return config.waves[waveIndex] ?? [];
  }
  return waveIndex === 0 ? config.bricks : [];
}

export function waveCount(config: BreakoutLevelConfig): number {
  if (config.waves && config.waves.length > 0) return config.waves.length;
  return 1;
}
```

- [ ] **Step 4: Tests for `breakoutWaves`**

Create `scenes/breakout/breakoutWaves.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { getBricksForWave, waveCount } from './breakoutWaves';
import type { BreakoutLevelConfig } from '../../types';

const base = {
  id: 'YARN',
  name: 't',
  genre: 'breakout' as const,
  description: '',
  catPose: 'paddle' as const,
  victoryCondition: { type: 'clear' as const, description: '' },
  starThresholds: [1, 2, 3],
  gridCols: 1,
  gridRows: 1,
  brickWidth: 10,
  brickHeight: 10,
  paddleConfig: { width: 1, height: 1, speed: 1, y: 1 },
  ballConfig: { radius: 1, speed: 1, speedIncrement: 0, maxSpeed: 1 },
  bgColor: '#000',
  startLives: 3,
};

it('uses waves when present', () => {
  const a: BreakoutBrick = { col: 0, row: 0, health: 1, color: 0xff0000, points: 1 };
  const b: BreakoutBrick = { col: 0, row: 0, health: 2, color: 0x00ff00, points: 2 };
  const cfg = { ...base, bricks: [a], waves: [[a], [b]] } as BreakoutLevelConfig;
  expect(getBricksForWave(cfg, 0)).toEqual([a]);
  expect(getBricksForWave(cfg, 1)).toEqual([b]);
  expect(waveCount(cfg)).toBe(2);
});

it('falls back to bricks for single wave', () => {
  const a: BreakoutBrick = { col: 0, row: 0, health: 1, color: 0xff0000, points: 1 };
  const cfg = { ...base, bricks: [a] } as BreakoutLevelConfig;
  expect(getBricksForWave(cfg, 0)).toEqual([a]);
  expect(getBricksForWave(cfg, 1)).toEqual([]);
  expect(waveCount(cfg)).toBe(1);
});
```

Run: `npx vitest run scenes/breakout/breakoutWaves.test.ts`  
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add types.ts scenes/breakout/breakoutWaves.ts scenes/breakout/breakoutWaves.test.ts levels/yarn.ts
git commit -m "feat(breakout): wave config types and getBricksForWave helper"
```

---

### Task 2: Brick field — wave rebuild API

**Files:**
- Modify: `scenes/breakout/BrickFieldManager.ts`
- Modify: `scenes/breakout/brickLayout.ts` (only if extracting `placeBricksFromBricks(levelWidth, config, bricks)`)

- [ ] **Step 1: Add `rebuildFromBrickList(bricks: BreakoutBrick[])`**

Implementation outline:
- `destroy()` existing group children / clear maps / `pendingDestroys` flush.
- Temporarily override `config.bricks` **or** add optional second parameter to internal `placeBricks` path: use `placeBricks(width, config, bricksOverride)` signature.

Preferred signature for `placeBricks`:

```ts
export function placeBricks(
  levelWidth: number,
  config: BreakoutLevelConfig,
  brickList: BreakoutBrick[] = config.bricks
): PlacedBrick[] {
  const { brickWidth, brickHeight, gridCols } = config;
  // ... same as today but iterate brickList ...
}
```

- [ ] **Step 2: `BrickFieldManager.create`**

On first create, call `rebuildFromBrickList(getBricksForWave(config, 0))`.

- [ ] **Step 3: Expose `rebuildForWave(waveIndex: number)`** that calls `getBricksForWave` + rebuild.

- [ ] **Step 4: Manual smoke**

Run dev server, start YARN — wave 1 should look identical to pre-change if `yarn.ts` maps `waves[0]` to previous grid.

- [ ] **Step 5: Commit**

```bash
git commit -am "feat(breakout): BrickFieldManager rebuild for wave layouts"
```

---

### Task 3: Background — light parallax

**Files:**
- Modify: `scenes/breakout/YarnBackgroundManager.ts`

- [ ] **Step 1: Add 2–3 layers**

Use `scene.add.tileSprite` or `image` + `setScrollFactor` **without** moving the camera—instead offset `tilePositionX` / `x` by `delta * speed` in `update()` for each layer. Depths: all `< DEPTH.BRICKS`.

Suggested layers (procedural rectangles OK):
- Back: wide low-opacity “shelf boards”
- Mid: soft ellipses (yarn hanks)
- Front: subtle bokeh dots

- [ ] **Step 2: Wire `update(time, delta)`**

Must be called from `BreakoutScene.update` (add `this.backgrounds.update(_time, delta)` if missing).

- [ ] **Step 3: Commit**

```bash
git commit -am "feat(breakout): yarn parallax layers in YarnBackgroundManager"
```

---

### Task 4: YarnKnotManager — mobile phase

**Files:**
- Create: `scenes/breakout/yarnKnotState.ts`
- Create: `scenes/breakout/yarnKnotState.test.ts`
- Create: `scenes/breakout/YarnKnotManager.ts`

- [ ] **Step 1: Pure state machine**

`yarnKnotState.ts`:

```ts
export type KnotPhase = 'anchored' | 'mobile' | 'destroyed';

export interface KnotHpState {
  maxHealth: number;
  currentHealth: number;
  phase: KnotPhase;
  hasSplit: boolean;
}

export function createKnotState(maxHealth: number): KnotHpState {
  return { maxHealth, currentHealth: maxHealth, phase: 'anchored', hasSplit: false };
}

/** Call after each hit. Returns whether phase just transitioned to mobile. */
export function applyKnotHit(state: KnotHpState): { state: KnotHpState; becameMobile: boolean } {
  if (state.phase !== 'anchored') return { state, becameMobile: false };
  const next = { ...state, currentHealth: state.currentHealth - 1 };
  const half = Math.ceil(state.maxHealth / 2);
  if (next.currentHealth <= half && !state.hasSplit) {
    return {
      state: { ...next, phase: 'mobile', hasSplit: true },
      becameMobile: true,
    };
  }
  return { state: next, becameMobile: false };
}
```

Tests: single hit above half does not flip; hit that crosses half flips once; second time at half does not re-flip.

- [ ] **Step 2: YarnKnotManager**

Constructor deps: `scene`, `config`, callbacks `{ onDestroyed: (bonusPoints) => void }`.

API:
- `spawnMobileAt(x, y, width, height, textureKey)` — dynamic body, `setImmovable(true)`, `setCollideWorldBounds(true)`, `setBounce(1,0)` or manual velocity reverse on `worldbounds` / clamp.
- `update()` — patrol: `velocity.x = ±patrolSpeed`.
- `getSprite()` for colliders.
- `destroy()`.

- [ ] **Step 3: Commit**

```bash
git add scenes/breakout/yarnKnotState.ts scenes/breakout/yarnKnotState.test.ts scenes/breakout/YarnKnotManager.ts
git commit -m "feat(breakout): yarn knot FSM and mobile YarnKnotManager"
```

---

### Task 5: Hazards — spec alignment

**Files:**
- Modify: `scenes/breakout/BreakoutHazardManager.ts` and/or `levels/yarn.ts`

- [ ] **Step 1:** Spec allows **optional** environmental hazard; drifting fluff is fine. Either **disable** for default YARN (`enableDriftingFluff: false` stays) or enable lightly—pick one in `yarn.ts` for readability (recommend **off** until wave 2 tuned).

- [ ] **Step 2: Commit** if any change; else document “no change” in Task 10 QA notes.

---

### Task 6: Power-up pity + normal-brick drops

**Files:**
- Create: `scenes/breakout/powerupPity.ts`
- Create: `scenes/breakout/powerupPity.test.ts`

- [ ] **Step 1: `powerupPity.ts`**

Hold mutable counters on the scene (or class instance):

```ts
export interface PityCounters {
  sinceSlow: number;
  sinceMulti: number;
  slowSatisfied: boolean;
  multiSatisfied: boolean;
}

export function initPity(): PityCounters {
  return { sinceSlow: 0, sinceMulti: 0, slowSatisfied: false, multiSatisfied: false };
}

/** Eligible = NORMAL brick elimination, not YARN_KNOT, not already carrier-forced */
export function onNormalElimination(
  c: PityCounters,
  opts: {
    pitySlow: number;
    pityMulti: number;
    randomChance: number;
    rnd: () => number;
  }
): { kind: 'SLOW_BALL' | 'MULTI_BALL' | null; next: PityCounters } {
  const next = {
    sinceSlow: c.slowSatisfied ? c.sinceSlow : c.sinceSlow + 1,
    sinceMulti: c.multiSatisfied ? c.sinceMulti : c.sinceMulti + 1,
    slowSatisfied: c.slowSatisfied,
    multiSatisfied: c.multiSatisfied,
  };

  // Order: pity slow → pity multi → random (drops still-missing kind first)
  if (!next.slowSatisfied && next.sinceSlow >= opts.pitySlow) {
    return { kind: 'SLOW_BALL', next: { ...next, sinceSlow: 0, slowSatisfied: true } };
  }
  if (!next.multiSatisfied && next.sinceMulti >= opts.pityMulti) {
    return { kind: 'MULTI_BALL', next: { ...next, sinceMulti: 0, multiSatisfied: true } };
  }
  if (opts.rnd() < opts.randomChance) {
    if (!next.slowSatisfied) {
      return { kind: 'SLOW_BALL', next: { ...next, slowSatisfied: true, sinceSlow: 0 } };
    }
    if (!next.multiSatisfied) {
      return { kind: 'MULTI_BALL', next: { ...next, multiSatisfied: true, sinceMulti: 0 } };
    }
  }
  return { kind: null, next };
}
```

Adjust logic so tests prove: (1) pity forces slow then multi over a sequence of eliminations; (2) `YARN_KNOT` eliminations do not increment pity (handled in scene, not in this function—test scene contract via unit tests on exported helpers if you split `shouldCountForPity(brickKind)`).

- [ ] **Step 2: Scene integration**

In `commitElimination`, when `o.brickKind === 'NORMAL'` (and not miniboss), call pity helper; if `kind`, `powerups.spawn(o.cx, o.cy, kind)`.

Remove reliance on **fixed** `POWERUP_CARRIER` tiles for slow/multi in `yarn.ts` **or** keep carriers as extra flavor—spec says guarantee via pity; carriers can remain for wide/sticky if desired or strip YARN to **slow + multi only** for pickups (align with user choice B from brainstorm).

- [ ] **Step 3: Tests**

Cover pity thresholds and “no drop from non-normal” via a small `eligibleForPity(kind)` export.

Run: `npx vitest run scenes/breakout/powerupPity.test.ts`

- [ ] **Step 4: Commit**

```bash
git commit -am "feat(breakout): pity-based slow and multiball drops"
```

---

### Task 7: Yarn knot — anchored in grid + transition + bonus score

**Files:**
- Modify: `scenes/breakout/BrickFieldManager.ts`
- Modify: `scenes/BreakoutScene.ts` (wiring)
- Modify: `levels/yarn.ts` (one `YARN_KNOT` in wave 2)

- [ ] **Step 1: Anchored behavior**

For `brickKind === 'YARN_KNOT'`, use distinct tint/texture in `BrickFieldManager` (e.g. larger rounded rect or purple outline).

- [ ] **Step 2: On `becameMobile`**

Scene receives signal from hit pipeline:
- `deferDestroy` the static brick; spawn `YarnKnotManager.spawnMobileAt` at same world position; add **ball–knot collider** same as brick (reuse `onBallHitBrick` path with a **sprite tag** or separate handler that decrements knot HP via `yarnKnotState`).

Simpler approach: **one** runtime map `knotSprite → KnotHpState` for mobile sprite; ball hits call shared reducer.

- [ ] **Step 3: Bonus points**

On knot destroy: `gameScore.current += config.miniboss?.bonusDestroyPoints ?? 200`.

- [ ] **Step 4: Commit**

```bash
git commit -am "feat(breakout): yarn knot anchored and mobile phases with bonus score"
```

---

### Task 8: Scene orchestrator — waves + interstitial + victory

**Files:**
- Modify: `scenes/BreakoutScene.ts`
- Optional: `scenes/breakout/WaveInterstitial.ts`

- [ ] **Step 1: State enum**

`wavePhase: 'wave1' | 'interstitial' | 'wave2' | 'done'`.

- [ ] **Step 2: When `wavePhase === 'wave1'` and `bricks.getActiveCount() === 0`**

Enter `interstitial`: show short text (“Wave 2!”); start timer `minDelayMs` from `waveTransition`; listen for SPACE to skip after timer; on advance call `bricks.rebuildForWave(1)` and **rewire ball–brick colliders** for all active balls (same as existing `wireNewBallColliders` loop).

- [ ] **Step 3: Victory**

`checkVictory` only fires when `wavePhase === 'wave2'` and brick group empty **and** knot destroyed if it was spawned (or treat knot as last brick—ensure count reaches 0).

- [ ] **Step 4: `update`**

Call `this.backgrounds.update`.

- [ ] **Step 5: Commit**

```bash
git commit -am "feat(breakout): two-wave flow with skippable interstitial"
```

---

### Task 9: SFX integration

**Files:**
- Modify: `scenes/shared/PhaserAudio.ts`
- Modify: `scenes/BreakoutScene.ts` (play calls)

- [ ] **Step 1: Extend union**

```ts
export type ProceduralSfxType =
  | /* existing */
  | 'wave_clear'
  | 'miniboss_shift';
```

- [ ] **Step 2: Implement in `playSfx` switch**

Short ascending arpeggio for `wave_clear`; short “twang” or pitch drop for `miniboss_shift` (match existing procedural style in file).

- [ ] **Step 3: Call sites**

- Enter interstitial / clear wave 1: `wave_clear`
- Knot becomes mobile: `miniboss_shift`

- [ ] **Step 4: Commit**

```bash
git commit -am "feat(audio): breakout wave_clear and miniboss_shift SFX"
```

---

### Task 10: Integration + QA

- [ ] **Step 1: Full Vitest**

Run: `npm run test:run`  
Expected: all green.

- [ ] **Step 2: Production build**

Run: `npm run build`  
Expected: success.

- [ ] **Step 3: Manual QA** (browser)

- [ ] Wave 1 clears → interstitial → wave 2 spawns.
- [ ] SPACE skips wait after 300 ms.
- [ ] Mini-boss transitions to mobile once; SFX plays.
- [ ] Slow + multiball each obtained before run ends (typical play).
- [ ] Max 3 balls; life lost only when zero balls remain.
- [ ] Win emits `LEVEL_COMPLETE`; pause still works.

- [ ] **Step 4: Final commit** if fixes needed.

---

## Self-review (spec coverage)

| Spec section | Task(s) |
|----------------|---------|
| Two waves + interstitial | 1, 2, 8 |
| Hybrid mini-boss | 1, 4, 7 |
| Slow + multiball, pity guarantee, normal bricks only | 1, 6 |
| Light parallax | 3 |
| Mini-boss bonus score | 1, 7 |
| SFX brick/paddle/powerup/wave/phase/ball lost | 9 (+ existing) |
| Thin orchestrator + managers | 8 (extends existing) |
| Deferred destroy / multiball colliders | 2, 7, 8 |
| Vitest for pure logic | 1, 4, 6 + existing tests |

**Placeholder scan:** None intentional; tune numeric defaults in `yarn.ts` during implementation.

---

## Execution handoff

Plan complete and saved to `docs/plans/2026-04-05-yarn-ball-bounce-implementation.md`.

**1. Subagent-driven (recommended)** — dispatch a fresh subagent per task; review between tasks.  
**2. Inline execution** — run tasks in this session with checkpoints between tasks.

Which approach do you want for Phase 3?
