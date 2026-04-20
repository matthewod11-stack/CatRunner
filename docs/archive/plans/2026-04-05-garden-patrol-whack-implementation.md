# Garden Patrol (GARDEN_WHACK) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Evolve the whack skeleton into a three-wave garden patrol with qualifying score gate, power-up moles, Gopher King boss phase, modular `scenes/whack/` managers, pure logic tests, and PhaserAudio SFX — matching the City Heights manager pattern.

**Architecture:** `WhackScene` orchestrates managers (`HoleGridManager`, `GardenBackground`, `MoleSpawnManager`, `WhackPowerupManager`, `WhackHazardManager` stub, `GopherBossManager`) behind a shared `SceneManager` interface. Wave progression, boss hits, and spawn-type picking live in testable pure modules.

**Tech Stack:** Phaser 3, TypeScript, Vitest, existing `PhaserAudio` / `EffectsManager` / `SceneBridge`.

**Spec:** `docs/specs/2026-04-05-garden-patrol-whack-design.md`

---

## File Map

### New files
```
scenes/whack/types.ts              — DEPTH, SceneManager, runtime enums
scenes/whack/waves.ts              — getWaveIndex(elapsedSec, waveDurations[])
scenes/whack/waves.test.ts
scenes/whack/spawnPick.ts          — pickMouseTypeKey(weights), normalizeWeights
scenes/whack/spawnPick.test.ts
scenes/whack/bossState.ts          — BossStateMachine: tryHit(now), emerge, etc.
scenes/whack/bossState.test.ts
scenes/whack/HoleGridManager.ts    — hole layout + graphics
scenes/whack/GardenBackground.ts   — grass, optional accents
scenes/whack/MoleSpawnManager.ts   — active moles, spawn timer, wave config
scenes/whack/WhackPowerupManager.ts — slow-mo / double-score timers (or merged into scene; prefer small manager)
scenes/whack/WhackHazardManager.ts — no-op v1 (implements SceneManager)
scenes/whack/GopherBossManager.ts  — boss sprite, holes, hit detection
```

### Modified files
```
types.ts                 — extend WhackLevelConfig (waves, boss, wavePhaseTimeLimitSec, bossTimeLimitSec, powerup defs)
levels/garden-whack.ts   — full config for waves, boss, powerup mouse types
scenes/WhackScene.ts     — thin orchestrator
```

### Dependency graph
```
Task 1 ──► Tasks 2–7 (parallel) ──► Task 8 ──► Task 9 ──► Task 10
```

---

### Task 1: Type extensions + level config + pure modules

**Files:**
- Modify: `types.ts` (`WhackLevelConfig` block ~726)
- Modify: `levels/garden-whack.ts`
- Create: `scenes/whack/types.ts`
- Create: `scenes/whack/waves.ts`
- Create: `scenes/whack/waves.test.ts`
- Create: `scenes/whack/spawnPick.ts`
- Create: `scenes/whack/spawnPick.test.ts`
- Create: `scenes/whack/bossState.ts`
- Create: `scenes/whack/bossState.test.ts`

- [ ] **Step 1: Extend `WhackLevelConfig` in `types.ts`**

Add interfaces (adjust names to match codebase style):

```ts
export interface WhackWaveConfig {
  /** 0-based wave index */
  index: number;
  /** Seconds this wave lasts */
  durationSec: number;
  /** Spawn interval [maxMs, minMs] for this wave */
  spawnIntervalRange: [number, number];
  /** Relative weights per `mouseTypes` key */
  spawnWeights: Record<string, number>;
}

export interface WhackBossConfig {
  hitsToDefeat: number;
  visibleMs: number;
  hitInvulnMs: number;
  emergeDelayMs: [number, number];
  color: number;
  radiusPx: number;
}

export interface WhackLevelConfig extends CampaignLevelMeta {
  genre: 'whack';
  gridCols: number;
  gridRows: number;
  mouseTypes: Record<string, WhackMouseType>;
  /** Total seconds for waves 1..N before qualify check */
  wavePhaseTimeLimitSec: number;
  waves: WhackWaveConfig[];
  boss: WhackBossConfig;
  /** Boss phase timeout; 0 = no limit */
  bossTimeLimitSec: number;
  bgColor: string;
  /** Retained for bridge compatibility; whack v1 does not use lives for KO */
  startLives: number;
}
```

Extend `WhackMouseType` with optional fields:

```ts
export interface WhackMouseType {
  type: string;
  visibleMs: number;
  points: number;
  color: number;
  /** Applies timed effect when whacked */
  grantsEffect?: 'slow_mo' | 'double_score';
  effectDurationSec?: number;
}
```

Remove duplicate top-level `timeLimit` / `spawnIntervalRange` if replaced by `wavePhaseTimeLimitSec` + per-wave ranges (delete old fields from interface and migrate `garden-whack.ts`).

- [ ] **Step 2: Implement `waves.ts`**

```ts
/** Returns current wave index 0..waves.length-1, or last index if past end. */
export function waveIndexAtElapsed(
  elapsedSec: number,
  waves: { durationSec: number }[],
): number {
  if (waves.length === 0) return 0;
  let t = 0;
  for (let i = 0; i < waves.length; i++) {
    t += waves[i].durationSec;
    if (elapsedSec < t) return i;
  }
  return waves.length - 1;
}

/** True when wave phase timer has ended (all wave durations consumed). */
export function isWavePhaseComplete(elapsedSec: number, waves: { durationSec: number }[]): boolean {
  const total = waves.reduce((s, w) => s + w.durationSec, 0);
  return elapsedSec >= total;
}
```

- [ ] **Step 3: Vitest `waves.test.ts`**

```ts
import { describe, it, expect } from 'vitest';
import { waveIndexAtElapsed, isWavePhaseComplete } from './waves';

describe('waveIndexAtElapsed', () => {
  const waves = [{ durationSec: 10 }, { durationSec: 10 }, { durationSec: 5 }];
  it('wave 0 at start', () => expect(waveIndexAtElapsed(0, waves)).toBe(0));
  it('still 0 before first ends', () => expect(waveIndexAtElapsed(9.9, waves)).toBe(0));
  it('wave 1 after first', () => expect(waveIndexAtElapsed(10, waves)).toBe(1));
  it('clamps to last wave after total', () => expect(waveIndexAtElapsed(999, waves)).toBe(2));
});

describe('isWavePhaseComplete', () => {
  it('false mid-phase', () =>
    expect(isWavePhaseComplete(20, [{ durationSec: 15 }, { durationSec: 15 }])).toBe(false));
  it('true at end', () =>
    expect(isWavePhaseComplete(30, [{ durationSec: 15 }, { durationSec: 15 }])).toBe(true));
});
```

Run: `npx vitest run scenes/whack/waves.test.ts` → PASS

- [ ] **Step 4: Implement `spawnPick.ts`**

```ts
export function normalizeWeights(weights: Record<string, number>): Record<string, number> {
  const entries = Object.entries(weights).filter(([, w]) => w > 0);
  const sum = entries.reduce((s, [, w]) => s + w, 0);
  if (sum <= 0) return {};
  const out: Record<string, number> = {};
  for (const [k, w] of entries) out[k] = w / sum;
  return out;
}

/** `Math.random` injectable for tests */
export function pickWeightedKey(
  weights: Record<string, number>,
  random: () => number = Math.random,
): string | null {
  const n = normalizeWeights(weights);
  const keys = Object.keys(n);
  if (keys.length === 0) return null;
  let r = random();
  for (const k of keys) {
    r -= n[k];
    if (r <= 0) return k;
  }
  return keys[keys.length - 1];
}
```

- [ ] **Step 5: Vitest `spawnPick.test.ts`**

Deterministic: `pickWeightedKey({ a: 1, b: 1 }, () => 0.49)` → `a`; `() => 0.51` → `b`.

- [ ] **Step 6: Implement `bossState.ts`**

```ts
export type BossPhase = 'inactive' | 'emerging' | 'vulnerable' | 'invuln' | 'defeated';

export interface BossStateConfig {
  hitsToDefeat: number;
  hitInvulnMs: number;
}

export class BossStateMachine {
  phase: BossPhase = 'inactive';
  hitsRemaining: number;
  invulnUntil = 0;

  constructor(private cfg: BossStateConfig) {
    this.hitsRemaining = cfg.hitsToDefeat;
  }

  activate(): void {
    this.phase = 'emerging';
    this.hitsRemaining = this.cfg.hitsToDefeat;
    this.invulnUntil = 0;
  }

  /** Call when boss becomes targetable after emerge anim */
  setVulnerable(now: number): void {
    if (this.phase === 'emerging') this.phase = 'vulnerable';
    this.invulnUntil = now;
  }

  tryHit(now: number): 'hit' | 'ignore' | 'defeated' {
    if (this.phase === 'defeated' || this.phase === 'inactive') return 'ignore';
    if (now < this.invulnUntil) return 'ignore';
    if (this.phase !== 'vulnerable' && this.phase !== 'invuln') return 'ignore';

    this.hitsRemaining--;
    if (this.hitsRemaining <= 0) {
      this.phase = 'defeated';
      return 'defeated';
    }
    this.phase = 'invuln';
    this.invulnUntil = now + this.cfg.hitInvulnMs;
    return 'hit';
  }

  endInvuln(now: number): void {
    if (this.phase === 'invuln' && now >= this.invulnUntil) {
      this.phase = 'vulnerable';
    }
  }
}
```

- [ ] **Step 7: Vitest `bossState.test.ts`**

Cover: defeat after N hits, invuln ignores taps, `defeated` ignores further hits.

- [ ] **Step 8: Fill `levels/garden-whack.ts`**

- Three `waves` with `durationSec: 15` each, escalating `spawnIntervalRange`, weighted keys `normal` / `bonus` / `sneaky`.
- `wavePhaseTimeLimitSec: 45` (= sum of wave durations).
- `boss`: `hitsToDefeat: 5`, `visibleMs: 2000`, `hitInvulnMs: 400`, etc.
- `bossTimeLimitSec: 30`.
- Add `mouseTypes` entries for `slow_mo` and `double` (or `power_slow`, `power_double`) with `grantsEffect` + `effectDurationSec`, `points: 0`.

- [ ] **Step 9: `scenes/whack/types.ts`**

```ts
export interface SceneManager {
  create(): void;
  update(time: number, delta: number): void;
  destroy(): void;
}

export const DEPTH = {
  BG: 0,
  HOLES: 5,
  MICE: 10,
  BOSS: 12,
  EFFECTS: 30,
  HUD: 50,
} as const;
```

- [ ] **Step 10: Commit**

`git add types.ts levels/garden-whack.ts scenes/whack/`  
`git commit -m "feat(whack): config, wave/boss/spawn pure logic for Garden Patrol"`

---

### Task 2: Hole grid (terrain)

**Files:**
- Create: `scenes/whack/HoleGridManager.ts`

- [ ] Extract hole layout from current `WhackScene` (padding, gap math) into `HoleGridManager`.
- [ ] Expose `getPositions(): { x: number; y: number }[]` and `getHoleCount()`.
- [ ] Draw mound + ellipse graphics in `create()`, `destroy()` clears children.

---

### Task 3: Garden background / visuals

**Files:**
- Create: `scenes/whack/GardenBackground.ts`

- [ ] Grass fill + stroke texture (from existing scene).
- [ ] Optional top sky band + simple flower dots (low contrast).
- [ ] Method `setWaveTint(waveIndex: number)` for subtle overlay alpha.

---

### Task 4: Mole spawn system

**Files:**
- Create: `scenes/whack/MoleSpawnManager.ts`

- [ ] Owns spawn timer, `activeMice` list, Phaser circle + eyes (same as current).
- [ ] Reads current wave via `waveIndexAtElapsed` + `scene.time.now` origin stored at create.
- [ ] Uses `pickWeightedKey` with active wave’s `spawnWeights`.
- [ ] Applies `WhackPowerupManager` multipliers for slow-mo (stretch intervals).
- [ ] Public API: `handleTap(pointer)`, returns hit result for scene to score; or callback `onWhack`.

---

### Task 5: Hazard system (stub)

**Files:**
- Create: `scenes/whack/WhackHazardManager.ts`

- [ ] Implements `SceneManager` with empty `create` / no-op `update` / `destroy` clears nothing.
- [ ] Comment: reserved for decoys / mud splash.

---

### Task 6: Power-up system

**Files:**
- Create: `scenes/whack/WhackPowerupManager.ts`

- [ ] Tracks `slowMoUntil`, `doubleScoreUntil` (ms timestamps).
- [ ] Methods: `applyEffect(type, now, durationSec)`, `getSpawnIntervalMultiplier(now)`, `getScoreMultiplier(now)`.
- [ ] `update()` only for expiry bookkeeping if needed.

**Scoring rule (lock):** `Math.floor(points * combo * (doubleActive ? 2 : 1))`.

---

### Task 7: Boss system

**Files:**
- Create: `scenes/whack/GopherBossManager.ts`

- [ ] Uses `BossStateMachine` from `bossState.ts`.
- [ ] On `startBossPhase()`, `audio.playSfx('boss_alert')`, `setBossMode(true)` optional.
- [ ] Schedule emerge: pick random hole, tween scale, set vulnerable.
- [ ] Pointer hit uses larger radius + `tryHit(now)`.
- [ ] On `defeated`, notify scene; on boss timer timeout, `emitGameOver`.

---

### Task 8: Scene orchestrator rewrite

**Files:**
- Modify: `scenes/WhackScene.ts`

- [ ] `preload`: particle texture + any assets unchanged.
- [ ] `create`: instantiate managers in order: `GardenBackground`, `HoleGrid`, `MoleSpawn`, `WhackPowerup`, `WhackHazard`, `GopherBoss`; call `create()`.
- [ ] Single `time.addEvent` for **wave phase** countdown (`wavePhaseTimeLimitSec`). When complete: if `score < target` → `emitGameOver`; else → `MoleSpawn` stop + `GopherBoss.startBossPhase()`.
- [ ] Boss phase: start `bossTimeLimitSec` timer if > 0.
- [ ] `update`: delegate to managers; check `isWavePhaseComplete` vs elapsed from wave start.
- [ ] Victory: only after boss defeated → `emitLevelComplete` with `victoryType: 'score'`.
- [ ] Preserve pause (P / Esc) and `applyRuntimePatch`.

---

### Task 9: SFX integration

**Files:**
- Modify: `scenes/WhackScene.ts` (or managers with `PhaserAudio` ref)

- [ ] Construct `PhaserAudio` in `create`, `destroy` in shutdown.
- [ ] Wire: pop `boing`, hit `coin`, combo `mult`, wave `powerup`, boss `boss_alert` / `boss_hit`, game over `hit`.
- [ ] Do **not** add new `ProceduralSfxType` values unless a sound cannot map; prefer reuse.

---

### Task 10: Integration + QA

- [ ] Run `npm run test:run` — all green.
- [ ] Run `npm run build` — no errors.
- [ ] Manual: start `GARDEN_WHACK` from level select (dev unlock), complete three waves, qualify, beat boss, see victory.
- [ ] Manual: verify game over when time expires with low score; boss timeout game over.

---

## Plan self-review

| Spec section | Task coverage |
|--------------|---------------|
| Three waves + HUD | Tasks 1, 4, 8 |
| Qualify + boss | Tasks 1, 7, 8 |
| Power-ups | Tasks 1, 6, 4 |
| Terrain / visuals | Tasks 2, 3 |
| SFX | Task 9 |
| Lives unused | Task 1 types note + Task 8 (no life KO) |
| Hazard stub | Task 5 |

**Placeholder scan:** None intentional; `WhackHazardManager` is explicit no-op.

---

## Execution handoff

**Plan complete and saved to `docs/plans/2026-04-05-garden-patrol-whack-implementation.md`.**

**1. Subagent-driven (recommended)** — fresh subagent per task + review between tasks.  
**2. Inline execution** — run tasks in this session with checkpoints.

Which approach do you want for implementation?
