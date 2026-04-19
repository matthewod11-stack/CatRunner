# The Cat Tree (CAT_TREE) Climber Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Evolve `ClimberScene` into a modular climber level with continuous proc-gen ascent, **sticky paws** power-up, **patrol enemies**, optional **prickle hazard strips**, **parallax background**, a **data-driven summit routing gauntlet** + goal trigger, **PhaserAudio** SFX, and **star tiers** based on deaths + par time (not raw score thresholds).

**Architecture:** `ClimberScene` becomes a thin orchestrator (~350–500 lines) that owns player physics, camera scroll, bridge emissions, `EffectsManager`, and `PhaserAudio`, delegating to `scenes/climber/` managers implementing `SceneManager` from `scenes/climber/types.ts`. Pure logic lives in `platformGen.ts`, `stickyPaws.ts`, `summitTransition.ts`, `climberStars.ts`, `summitLayout.ts` (+ Vitest).

**Tech Stack:** Phaser 3, TypeScript, Vitest, existing `SceneBridge`, `PhaserAudio`, `EffectsManager`.

**Spec:** `docs/superpowers/specs/2026-04-05-cat-tree-climber-design.md`

---

## Repeatable Template Mapping

| Phase | Generic Task | Cat Tree Specific |
|-------|-------------|-------------------|
| 1 | Types + config | `ClimberLevelConfig` extensions, bridge payload, pure modules + tests |
| 2 | Terrain | `PlatformTerrainManager` — platforms + sticky vertical strips |
| 3 | Background | `TreeBackgroundManager` — gradient, stars, parallax rects |
| 4 | Enemies | `PatrolEnemyManager` — patrol on platforms, overlap damage |
| 5 | Hazards | `PrickleHazardManager` — static damage strips on rare platforms |
| 6 | Powerups | `StickyPawsManager` — spawn, pickup, duration |
| 7 | Summit / goal | `SummitGauntletManager` — height trigger, fixed layout, goal collider |
| 8 | Scene rewrite | `ClimberScene` orchestrator |
| 9 | SFX | `PhaserAudio` keys + scene/manager hooks |
| 10 | Integration + QA | `npm run test:run`, `npm run build`, star + App wiring |

Tasks 2–7 can run in parallel after Task 1. Task 8 depends on 2–7; Task 9 on 8; Task 10 on 9.

---

## File Map

### New files

```
scenes/climber/types.ts                 — DEPTH, SceneManager, runtime interfaces
scenes/climber/platformGen.ts           — pure: next platform row, RNG helpers
scenes/climber/platformGen.test.ts
scenes/climber/stickyPaws.ts            — pure: timer state, canGrab, slide delta
scenes/climber/stickyPaws.test.ts
scenes/climber/summitTransition.ts      — pure: shouldEnterSummit, one-shot guard
scenes/climber/summitTransition.test.ts
scenes/climber/summitLayout.ts          — pure: gauntlet segment list → AABBs (world space)
scenes/climber/summitLayout.test.ts
scenes/climber/climberStars.ts          — pure: deaths + time → 1|2|3
scenes/climber/climberStars.test.ts
scenes/climber/PlatformTerrainManager.ts
scenes/climber/TreeBackgroundManager.ts
scenes/climber/PatrolEnemyManager.ts
scenes/climber/PrickleHazardManager.ts
scenes/climber/StickyPawsManager.ts
scenes/climber/SummitGauntletManager.ts
```

### Modified files

```
types.ts                              — extend ClimberLevelConfig; LevelCompletePayload.awardedStars
levels/cattree.ts                     — new tunables (enemy, sticky, summit, prickle, par time)
scenes/shared/bridgeProtocol.ts       — re-export if needed (usually unchanged)
scenes/shared/PhaserAudio.ts          — optional new ProceduralSfxType entries
App.tsx                               — use awardedStars when present
scenes/ClimberScene.ts                — rewrite as orchestrator
services/levelCompletion.test.ts      — optional: document interaction (stars from payload)
```

---

## Dependency Graph

```
Task 1 ──► Tasks 2–7 (parallel)
Tasks 2–7 ──► Task 8 ──► Task 9 ──► Task 10
```

---

### Task 1: Types, Config, and Pure Logic Foundations

**Files:**

- Modify: `types.ts` — extend `ClimberLevelConfig`; extend `LevelCompletePayload`
- Modify: `levels/cattree.ts` — fill new config blocks
- Create: `scenes/climber/types.ts`
- Create: `scenes/climber/platformGen.ts` + `platformGen.test.ts`
- Create: `scenes/climber/stickyPaws.ts` + `stickyPaws.test.ts`
- Create: `scenes/climber/summitTransition.ts` + `summitTransition.test.ts`
- Create: `scenes/climber/summitLayout.ts` + `summitLayout.test.ts`
- Create: `scenes/climber/climberStars.ts` + `climberStars.test.ts`

- [ ] **Step 1: Add `awardedStars` to `LevelCompletePayload`**

In `types.ts`, locate `export interface LevelCompletePayload` and add an optional field:

```ts
export interface LevelCompletePayload {
  levelId: LevelId;
  finalScore: number;
  gameScore: GameScore;
  victoryType: VictoryCondition['type'];
  /** When set, App uses this for `saveLevelResult` instead of score-based `computeStars`. */
  awardedStars?: 1 | 2 | 3;
}
```

- [ ] **Step 2: Extend `ClimberLevelConfig`**

In `types.ts`, after the existing `platformConfig` block inside `ClimberLevelConfig`, add:

```ts
  /** Patrol enemies on platforms */
  enemyConfig: {
    /** Approximate spawns per 1000px of upward world distance */
    spawnDensity: number;
    patrolSpeed: number;
    hitboxWidth: number;
    hitboxHeight: number;
  };
  /** Rare static damage strips on platform tops */
  prickleConfig: {
    /** Chance (0–1) a generated platform row includes a prickle strip */
    chancePerPlatform: number;
    stripWidthFraction: number; // fraction of platform width
  };
  /** Sticky paws pickup */
  stickyPawsConfig: {
    durationMs: number;
    /** Approximate pickups per 1000px climbed */
    spawnDensity: number;
    verticalStripWidth: number;
    verticalStripHeight: number;
    /** Max downward slide speed (px/s) while clinging */
    maxSlideSpeed: number;
    /** Horizontal nudge while sliding (px/s) */
    horizontalSlideAccel: number;
  };
  /** Summit gauntlet + star timing */
  summitConfig: {
    /** World Y (negative = up) at which summit phase begins — must be < -victoryHeight or use offset from victory */
    entryWorldY: number;
    parTimeMs: number;
  };
```

**Note:** Implementers must align `entryWorldY` with existing `victoryHeight` semantics (`highestY` is negative when climbing). Spec: enter summit band before final goal. Example: `entryWorldY: -9200` when `victoryHeight: 10000` so ~800px of gauntlet remains.

- [ ] **Step 3: Update `levels/cattree.ts` with concrete numbers**

Add the new objects with conservative tuning, e.g.:

```ts
  enemyConfig: {
    spawnDensity: 0.35,
    patrolSpeed: 80,
    hitboxWidth: 28,
    hitboxHeight: 24,
  },
  prickleConfig: {
    chancePerPlatform: 0.06,
    stripWidthFraction: 0.35,
  },
  stickyPawsConfig: {
    durationMs: 3200,
    spawnDensity: 0.12,
    verticalStripWidth: 14,
    verticalStripHeight: 72,
    maxSlideSpeed: 120,
    horizontalSlideAccel: 280,
  },
  summitConfig: {
    entryWorldY: -9200,
    parTimeMs: 240000,
  },
```

- [ ] **Step 4: Create `scenes/climber/types.ts`**

```ts
export const DEPTH = {
  BG: 0,
  BG_PARALLAX_1: 1,
  BG_PARALLAX_2: 2,
  PLATFORMS: 10,
  PRICKLE: 11,
  POWERUP: 14,
  ENEMY: 16,
  PLAYER: 20,
  SUMMIT: 18,
  EFFECTS: 30,
  HUD: 50,
} as const;

export interface SceneManager {
  create(): void;
  update(time: number, delta: number): void;
  destroy(): void;
}

export type PlatformKind = 'solid' | 'spring' | 'breakable';

export interface GeneratedPlatformRow {
  worldY: number;
  centerX: number;
  width: number;
  kind: PlatformKind;
  /** If true, a vertical sticky strip exists centered on this platform */
  hasStickyStrip: boolean;
}
```

- [ ] **Step 5: Pure module `climberStars.ts` + test**

`scenes/climber/climberStars.ts`:

```ts
export function computeClimberStars(params: {
  deathCount: number;
  elapsedMs: number;
  parTimeMs: number;
}): 1 | 2 | 3 {
  const { deathCount, elapsedMs, parTimeMs } = params;
  if (deathCount === 0 && elapsedMs <= parTimeMs) return 3;
  if (deathCount === 0) return 2;
  return 1;
}
```

`scenes/climber/climberStars.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { computeClimberStars } from './climberStars';

describe('computeClimberStars', () => {
  it('returns 3 when no deaths and within par time', () => {
    expect(computeClimberStars({ deathCount: 0, elapsedMs: 1000, parTimeMs: 2000 })).toBe(3);
  });
  it('returns 2 when no deaths but over par', () => {
    expect(computeClimberStars({ deathCount: 0, elapsedMs: 9999, parTimeMs: 5000 })).toBe(2);
  });
  it('returns 1 when any death', () => {
    expect(computeClimberStars({ deathCount: 1, elapsedMs: 1000, parTimeMs: 99999 })).toBe(1);
  });
});
```

- [ ] **Step 6: Pure module `summitTransition.ts` + test**

`scenes/climber/summitTransition.ts`:

```ts
export function shouldEnterSummit(params: {
  highestWorldY: number;
  entryWorldY: number;
  alreadyEntered: boolean;
}): boolean {
  if (params.alreadyEntered) return false;
  // highestWorldY is negative when climbing; summit starts when player has climbed past threshold (more negative)
  return params.highestWorldY <= params.entryWorldY;
}
```

`scenes/climber/summitTransition.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { shouldEnterSummit } from './summitTransition';

describe('shouldEnterSummit', () => {
  it('returns false when already entered', () => {
    expect(
      shouldEnterSummit({
        highestWorldY: -99999,
        entryWorldY: -9200,
        alreadyEntered: true,
      }),
    ).toBe(false);
  });
  it('returns false when not yet past entry depth', () => {
    expect(
      shouldEnterSummit({
        highestWorldY: -8000,
        entryWorldY: -9200,
        alreadyEntered: false,
      }),
    ).toBe(false);
  });
  it('returns true when at or past entry depth', () => {
    expect(
      shouldEnterSummit({
        highestWorldY: -9200,
        entryWorldY: -9200,
        alreadyEntered: false,
      }),
    ).toBe(true);
    expect(
      shouldEnterSummit({
        highestWorldY: -9300,
        entryWorldY: -9200,
        alreadyEntered: false,
      }),
    ).toBe(true);
  });
});
```

- [ ] **Step 7: Pure module `stickyPaws.ts` + test**

`scenes/climber/stickyPaws.ts`:

```ts
export interface StickyPawsState {
  activeUntilMs: number | null;
}

export function createStickyState(): StickyPawsState {
  return { activeUntilMs: null };
}

export function activateSticky(
  state: StickyPawsState,
  nowMs: number,
  durationMs: number,
): void {
  const next = nowMs + durationMs;
  if (state.activeUntilMs === null || next > state.activeUntilMs) {
    state.activeUntilMs = next;
  }
}

export function isStickyActive(state: StickyPawsState, nowMs: number): boolean {
  return state.activeUntilMs !== null && nowMs < state.activeUntilMs;
}

export function deactivateSticky(state: StickyPawsState): void {
  state.activeUntilMs = null;
}
```

`scenes/climber/stickyPaws.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import {
  createStickyState,
  activateSticky,
  isStickyActive,
  deactivateSticky,
} from './stickyPaws';

describe('stickyPaws', () => {
  it('activates and expires', () => {
    const s = createStickyState();
    activateSticky(s, 1000, 500);
    expect(isStickyActive(s, 1001)).toBe(true);
    expect(isStickyActive(s, 1500)).toBe(false);
  });
  it('refresh extends duration when later end time', () => {
    const s = createStickyState();
    activateSticky(s, 0, 1000);
    activateSticky(s, 500, 1000);
    expect(isStickyActive(s, 1400)).toBe(true);
    expect(isStickyActive(s, 1600)).toBe(false);
  });
  it('deactivate clears', () => {
    const s = createStickyState();
    activateSticky(s, 0, 5000);
    deactivateSticky(s);
    expect(isStickyActive(s, 100)).toBe(false);
  });
});
```

- [ ] **Step 8: Pure module `platformGen.ts` + test**

Export `rollPlatformRow(rng, screenWidth, prevWorldY, config): GeneratedPlatformRow` using `ClimberLevelConfig['platformConfig']` + chances for sticky strip (from sticky spawn density — can be passed as separate arg). Tests: deterministic seeded RNG produces stable rows.

- [ ] **Step 9: Pure module `summitLayout.ts` + test**

Export a constant `SUMMIT_SEGMENTS` describing ~8–12 platforms (world Y, x, width, kind) **relative to summit anchor** and a function `buildSummitPlatforms(anchorWorldY, screenWidth): Array<{ worldY; centerX; width; kind }>` that returns absolute positions. Tests: monotonic Y, all widths &lt; screenWidth.

- [ ] **Step 10: Run Vitest for new tests**

```bash
npm run test:run -- scenes/climber
```

Expected: all new tests pass.

- [ ] **Step 11: Commit**

```bash
git add types.ts levels/cattree.ts scenes/climber/
git commit -m "feat(cat-tree): climber types, config, and pure logic modules"
```

---

### Task 2: PlatformTerrainManager

**Files:**

- Create: `scenes/climber/PlatformTerrainManager.ts`
- Modify: (none outside folder until Task 8)

**Responsibilities:** Own Phaser rectangles for platforms; `generateStartPlatform`; procedural extension using `platformGen.rollPlatformRow`; `update` syncs `sprite.y` from `worldToScreen`; cleanup below viewport; **expose** iterable platform list for enemies/hazards/powerups; collision query callback for player landing (solid/spring/breakable) matching current `ClimberScene` AABB rules; **sticky vertical strip** rectangles (child or separate rects) with `stickyEligible` flag.

- [ ] **Step 1: Implement class skeleton**

Constructor takes `(scene, config, deps: { worldToScreen(y: number): number; getCameraWorldY(): number; screenWidth: number; screenHeight: number })`.

- [ ] **Step 2: Match existing collision math**

Port `checkPlatformCollisions` logic from current `ClimberScene.ts` (player bottom vs plat top, horizontal overlap). Fire callbacks: `onBounce(kind, springMultiplier)`, `onBreakableDestroyed`.

- [ ] **Step 3: Unit smoke**

No Phaser in tests — platform list generation can be tested via `platformGen` already.

- [ ] **Step 4: Commit**

```bash
git add scenes/climber/PlatformTerrainManager.ts
git commit -m "feat(cat-tree): PlatformTerrainManager for climber"
```

---

### Task 3: TreeBackgroundManager

**Files:**

- Create: `scenes/climber/TreeBackgroundManager.ts`

**Responsibilities:** Own `Phaser.GameObjects.Graphics` or layered rects for gradient + stars; optional 2 parallax layers (slow drift based on `cameraWorldY`). Port `drawBackground` from `ClimberScene` using `highestY` and `victoryHeight` from scene each frame.

- [ ] **Step 1: Implement `create` / `update` / `destroy`**

- [ ] **Step 2: Commit**

```bash
git add scenes/climber/TreeBackgroundManager.ts
git commit -m "feat(cat-tree): TreeBackgroundManager parallax and sky"
```

---

### Task 4: PatrolEnemyManager

**Files:**

- Create: `scenes/climber/PatrolEnemyManager.ts`

**Responsibilities:** Subscribe to new platforms from terrain (or poll terrain each frame); spawn enemy rects on a fraction of new rows per `enemyConfig.spawnDensity`; patrol clamped to platform width; `update` moves X; `testOverlapPlayer(px, py, pw, ph)` → boolean; on hit, invoke scene callback `onEnemyHit()` once per cooldown (e.g. 1s invuln after hit).

- [ ] **Step 1: Implement spawn + patrol**

- [ ] **Step 2: Commit**

```bash
git add scenes/climber/PatrolEnemyManager.ts
git commit -m "feat(cat-tree): PatrolEnemyManager"
```

---

### Task 5: PrickleHazardManager

**Files:**

- Create: `scenes/climber/PrickleHazardManager.ts`

**Responsibilities:** When terrain creates a platform, roll `prickleConfig.chancePerPlatform`; if true, add a narrow rectangle centered on platform top; overlap with player feet/hurtbox calls same `onDamage` path as enemy (scene provides callback). Destroy prickle when platform destroyed.

- [ ] **Step 1: Implement**

- [ ] **Step 2: Commit**

```bash
git add scenes/climber/PrickleHazardManager.ts
git commit -m "feat(cat-tree): PrickleHazardManager static strips"
```

---

### Task 6: StickyPawsManager

**Files:**

- Create: `scenes/climber/StickyPawsManager.ts`

**Responsibilities:** Spawn rare pickup orbs on new platform rows; on overlap, call `stickyPaws.activate`; render HUD hint optional; query `isActive`; while active and player overlaps vertical strip, apply **slide physics** in scene (manager returns suggested `dvy` / horizontal nudge OR scene reads `stickyPaws` pure state — prefer scene owns velocity, manager only pickup + timer).

- [ ] **Step 1: Pickup collision + timer**

- [ ] **Step 2: Commit**

```bash
git add scenes/climber/StickyPawsManager.ts
git commit -m "feat(cat-tree): StickyPawsManager pickup and timer"
```

---

### Task 7: SummitGauntletManager

**Files:**

- Create: `scenes/climber/SummitGauntletManager.ts`

**Responsibilities:** `tryEnterSummit(highestY)` using `summitTransition.shouldEnterSummit`; on first enter: **stop** terrain proc-gen past anchor, **instantiate** platforms from `buildSummitPlatforms`; place **goal** rectangle at end; when player overlaps goal: callback `onGoalReached`. Cleanup old proc-gen platforms optional (or let them scroll off).

- [ ] **Step 1: Wire layout from `summitLayout.ts`**

- [ ] **Step 2: Commit**

```bash
git add scenes/climber/SummitGauntletManager.ts
git commit -m "feat(cat-tree): SummitGauntletManager routing finale"
```

---

### Task 8: ClimberScene Orchestrator Rewrite

**Files:**

- Modify: `scenes/ClimberScene.ts`

**Responsibilities:**

- Keep: `init`, `preload`, `SceneBridge` emissions, `applyRuntimePatch`, pause keys
- Own: player sprite, `playerWorldY`, `playerVy`, horizontal input, wrap, gravity constant, camera scroll formula (from current scene), death/respawn, `deathCount++` on life lost, `runStartMs` from `create`
- Instantiate managers in `create`; call `update` chain; pass `worldToScreen` closure
- **Sticky cling:** when `StickyPawsManager` reports active and player aligned with strip, set mode `CLING`: zero or reduce gravity, apply slide using `stickyPawsConfig`
- **Victory:** on goal: `computeClimberStars({ deathCount, elapsedMs: Date.now() - runStartMs, parTimeMs })`; `emitLevelComplete({ ..., awardedStars: stars })`
- Remove duplicate code now in managers

Target line count: **under 500**.

- [ ] **Step 1: Rewrite `create` / `update`**

- [ ] **Step 2: Manual smoke** — start dev server, select CAT_TREE, climb until summit

- [ ] **Step 3: Commit**

```bash
git add scenes/ClimberScene.ts
git commit -m "refactor(cat-tree): ClimberScene orchestrator with climber managers"
```

---

### Task 9: PhaserAudio SFX Integration

**Files:**

- Modify: `scenes/shared/PhaserAudio.ts` — extend `ProceduralSfxType` if reuse insufficient
- Modify: `scenes/ClimberScene.ts` (and managers if they receive `playSfx` callback)

**Mapping (reuse where possible):**

| Event | SFX type |
|-------|----------|
| Land bounce (solid) | `boing` |
| Spring land | `boing` |
| Breakable crack/break | `brick_break` |
| Enemy / prickle hit | `hit` |
| Sticky pickup | `powerup` |
| Victory goal | `mult` or `coin` |

- [ ] **Step 1: Add `PhaserAudio` to `ClimberScene.create`**

```ts
import { PhaserAudio } from './shared/PhaserAudio';

private audio!: PhaserAudio;
// create():
this.audio = new PhaserAudio(this);
```

- [ ] **Step 2: Call `playSfx` at each event** (pass `audio.playSfx.bind(audio)` into managers or handle in scene callbacks)

- [ ] **Step 3: `shutdown` / destroy** — `this.audio.destroy()` if scene has shutdown hook (match `PlatformerScene`)

- [ ] **Step 4: Commit**

```bash
git add scenes/shared/PhaserAudio.ts scenes/ClimberScene.ts scenes/climber/
git commit -m "feat(cat-tree): PhaserAudio SFX for climber"
```

---

### Task 10: App Integration, Full QA, Documentation Touch

**Files:**

- Modify: `App.tsx` — `handleLevelComplete` star path
- Optional: `levels/catalog.ts` description line clarifying stars (copy only)

- [ ] **Step 1: Use `awardedStars` when provided**

In `App.tsx`, inside `handleLevelComplete`, replace:

```ts
stars: computeStars(finalScore, meta.starThresholds),
```

with:

```ts
stars: payload.awardedStars ?? computeStars(finalScore, meta.starThresholds),
```

- [ ] **Step 2: Run full test suite**

```bash
npm run test:run
```

Expected: exit 0.

- [ ] **Step 3: Production build**

```bash
npm run build
```

Expected: exit 0.

- [ ] **Step 4: Dev playthrough checklist**

1. `npm run dev` → play CAT_TREE from level select.  
2. Verify sticky pickup extends/cling behavior.  
3. Verify enemy + prickle damage.  
4. Reach summit → gauntlet → goal → victory screen.  
5. Win with deaths → 1★; no deaths slow run → 2★; no deaths fast → 3★.

- [ ] **Step 5: Commit**

```bash
git add App.tsx
git commit -m "fix(cat-tree): honor awardedStars from climber LevelCompletePayload"
```

---

## Spec Coverage (self-review)

| Spec section | Task(s) |
|----------------|---------|
| Continuous ascent, same mechanics | Tasks 2, 8 |
| Visual mood (gradient, stars, parallax) | Task 3 |
| Sticky paws on vertical strips | Tasks 1, 2, 6, 8 |
| Light patrol enemies | Tasks 1, 4, 8 |
| Summit routing gauntlet + goal | Tasks 1, 7, 8 |
| No boss HP | Task 7 (goal only) |
| Minimal score; stars from deaths + par | Tasks 1, 8, 10 |
| SFX | Task 9 |
| Manager pattern + pure tests | Tasks 1–8, 10 |
| Prickle hazards (environmental damage) | Task 5 (fills template hazard slot) |

**Placeholder scan:** None intentional; numeric tuning lives in `cattree.ts` and QA.

**Type consistency:** `awardedStars` on `LevelCompletePayload` matches `LevelResult.stars` (`1 | 2 | 3`).

---

## Execution Handoff

**Plan complete and saved to `docs/superpowers/plans/2026-04-05-cat-tree-climber-implementation.md`.**

**Execution options:**

1. **Subagent-driven (recommended)** — Fresh subagent per task with spec + code review between tasks (`superpowers:subagent-driven-development`).
2. **Inline execution** — Run tasks in this session with checkpoints (`superpowers:executing-plans`).

**Which approach do you want?**
