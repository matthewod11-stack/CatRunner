# Countertop Chaos (KITCHEN) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Refactor KITCHEN into a manager-based launcher scene with acts, special blocks, critters, spill hazard, power treats, Mixer Mouse boss round, lives-on-fail, SFX, and Vitest coverage for pure logic — matching the City Heights modular pattern.

**Architecture:** `LauncherScene` becomes a thin orchestrator. Six launcher managers (`KitchenBackground`, `StructureBuilder`, `CritterManager`, `HazardManager`, `PowerupManager`, `MixerBoss`) implement the same `SceneManager` contract as platformer (`constructor(scene, config)`, `create()`, `update()`, `destroy()`). Cross-cutting state (score, lives, round index) stays on the scene; managers receive callbacks via a small `LauncherSceneContext` interface passed at `create()`.

**Tech Stack:** Phaser 3 Arcade Physics, TypeScript, Vitest

**Spec:** `docs/superpowers/specs/2026-04-05-countertop-chaos-launcher-design.md`

---

## Repeatable mapping (10-task template)

| Task | Role | KITCHEN deliverable |
|------|------|---------------------|
| 1 | Types + config | `LauncherBlock` kinds, `LauncherLevelConfig` extensions, `levels/kitchen.ts`, pure `explosion.ts` + `actPick.ts` + tests |
| 2 | Terrain / structures | `StructureBuilder` — block sprites, textures, metadata map, special-block hooks |
| 3 | Background / visuals | `KitchenBackground` — gradient, tiles, cabinets, spill drawing |
| 4 | Critters | `CritterManager` — ants, mouse, hit + round-end scoring |
| 5 | Hazards | `HazardManager` — spill damping, boss fan impulse |
| 6 | Powerups | `PowerupManager` — charge queue, pierce/cluster on launch |
| 7 | Boss | `MixerBoss` — boss layout helper + core HP + win detection integration |
| 8 | Scene orchestrator | `LauncherScene.ts` rewrite wiring all managers + input + bridge |
| 9 | SFX | `playSound` / sfxService keys per spec table |
| 10 | Integration + QA | `npm run test:run`, `npm run build`, manual playthrough |

**Dependency graph:** Task 1 blocks 2–7. Task 8 blocks 9–10. Tasks 2–7 parallel after Task 1.

---

## File map

### Create

```
scenes/launcher/types.ts              — DEPTH, SceneManager, LauncherSceneContext interface
scenes/launcher/explosion.ts          — pure neighbor damage for explosive blocks
scenes/launcher/explosion.test.ts
scenes/launcher/actPick.ts            — pure act + structure id from round index
scenes/launcher/actPick.test.ts
scenes/launcher/KitchenBackground.ts
scenes/launcher/StructureBuilder.ts
scenes/launcher/CritterManager.ts
scenes/launcher/HazardManager.ts
scenes/launcher/PowerupManager.ts
scenes/launcher/MixerBoss.ts          — boss structure factory + constants (minimal if logic lives in StructureBuilder)
```

### Modify

```
types.ts                 — LauncherBlock, LauncherLevelConfig
levels/kitchen.ts        — acts, hazards, boss, presets, tuning
scenes/LauncherScene.ts  — orchestrator
```

---

### Task 1: Type extensions + level config + pure logic

**Files:**

- Modify: `types.ts` (`LauncherBlock`, `LauncherLevelConfig`)
- Modify: `levels/kitchen.ts`
- Create: `scenes/launcher/types.ts`
- Create: `scenes/launcher/explosion.ts`, `scenes/launcher/explosion.test.ts`
- Create: `scenes/launcher/actPick.ts`, `scenes/launcher/actPick.test.ts`

- [ ] **Step 1: Extend `LauncherBlock` in `types.ts`**

Add a string-literal kind and optional flag:

```ts
export type LauncherBlockKind =
  | 'normal'
  | 'explosive'
  | 'ice'
  | 'power_crate'
  | 'cheese_ward'
  | 'mixer_core';

export interface LauncherBlock {
  x: number;
  y: number;
  width: number;
  height: number;
  health: number;
  material: 'glass' | 'wood' | 'metal';
  points: number;
  /** Defaults to normal */
  kind?: LauncherBlockKind;
}
```

- [ ] **Step 2: Add launcher level sub-configs in `types.ts`**

Below `LauncherLevelConfig`, add (adjust names to match imports):

```ts
export interface LauncherSpillRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface LauncherHazardConfig {
  spill: LauncherSpillRect | null;
  bossFanEnabled?: boolean;
}

export interface LauncherActConfig {
  id: string;
  roundStart: number;
  roundEnd: number;
  /** Keys into `structurePresets` */
  structurePool: string[];
  /** Same length as pool; defaults to uniform if omitted */
  weights?: number[];
}

export interface LauncherBossConfig {
  /** 1-based round index that triggers boss */
  roundIndex: number;
  structure: LauncherStructure;
  shots: number;
}
```

Extend `LauncherLevelConfig` with:

```ts
  structurePresets: Record<string, LauncherStructure>;
  acts: LauncherActConfig[];
  hazards: LauncherHazardConfig;
  boss: LauncherBossConfig;
  powerupsEnabled?: boolean;
```

Keep existing fields (`structures`, `projectilesPerRound`, `totalRounds`, etc.). **`structures`** can remain as alias: either migrate fully to `structurePresets` + pool keys, or set `structurePresets` to include legacy names (`SIMPLE_TOWER`, …) and derive `acts[].structurePool` from those keys.

- [ ] **Step 3: Create `scenes/launcher/types.ts`**

```ts
import type Phaser from 'phaser';
import type { LauncherLevelConfig, GameScore } from '../../types';

export const DEPTH = {
  BG: 0,
  WALL: 1,
  CABINET: 2,
  COUNTER: 5,
  SPILL: 6,
  BLOCKS: 10,
  CRITTERS: 12,
  PROJECTILE: 15,
  PLAYER: 20,
  AIM_LINE: 25,
  EFFECTS: 30,
  HUD: 50,
} as const;

/** Aligns with platformer `SceneManager` */
export interface SceneManager {
  create(): void;
  update(time: number, delta: number): void;
  destroy(): void;
}

export interface LauncherSceneContext {
  getCounterY(): number;
  getLaunchPoint(): { x: number; y: number };
  addScore(delta: number, worldX: number, worldY: number, label?: string): void;
  getGameScore(): GameScore;
  onPowerCrateBroken(): void;
  loseLife(): void;
  emitLivesChanged(): void;
  playSfx(key: string): void;
  getCurrentRound(): number;
  isBossRound(): boolean;
}
```

- [ ] **Step 4: Pure explosion helper — `scenes/launcher/explosion.ts`**

Represent each block as `{ id: string; cx: number; cy: number; width: number; height: number }`. Destroyed block id excluded. Return ids within **cardinal neighbor** distance: overlap or gap ≤ 4px on shared edge.

```ts
export interface BlockBounds {
  id: string;
  cx: number;
  cy: number;
  width: number;
  height: number;
}

export function findExplosionNeighborIds(
  blocks: BlockBounds[],
  sourceId: string,
  gapTolerance = 4
): string[] {
  const src = blocks.find((b) => b.id === sourceId);
  if (!src) return [];
  const hw = src.width / 2;
  const hh = src.height / 2;
  const out: string[] = [];
  for (const b of blocks) {
    if (b.id === sourceId) continue;
    const dx = Math.abs(b.cx - src.cx);
    const dy = Math.abs(b.cy - src.cy);
    const touchX = dx <= hw + b.width / 2 + gapTolerance;
    const touchY = dy <= hh + b.height / 2 + gapTolerance;
    const cardinal = (dx <= hw + b.width / 2 + gapTolerance && dy <= hh + b.height / 2 + gapTolerance) &&
      (Math.abs(dx - (hw + b.width / 2)) <= gapTolerance + 1 || Math.abs(dy - (hh + b.height / 2)) <= gapTolerance + 1);
    if (cardinal) out.push(b.id);
  }
  return out;
}
```

Refine cardinal test in implementation so only **up/down/left/right** adjacency counts (not diagonal-only). Vitest cases: two boxes side-by-side → neighbor; diagonal corner → no.

- [ ] **Step 5: Test explosion helper**

`scenes/launcher/explosion.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { findExplosionNeighborIds, type BlockBounds } from './explosion';

describe('findExplosionNeighborIds', () => {
  it('returns horizontally adjacent block', () => {
    const blocks: BlockBounds[] = [
      { id: 'a', cx: 50, cy: 50, width: 40, height: 40 },
      { id: 'b', cx: 90, cy: 50, width: 40, height: 40 },
    ];
    const n = findExplosionNeighborIds(blocks, 'a');
    expect(n).toContain('b');
  });
});
```

Run: `npx vitest run scenes/launcher/explosion.test.ts`  
Expected: PASS (after fixing implementation to match).

- [ ] **Step 6: Act + structure pick — `scenes/launcher/actPick.ts`**

```ts
import type { LauncherActConfig } from '../../types';

export function resolveActForRound(roundIndex1Based: number, acts: LauncherActConfig[]): LauncherActConfig {
  const a = acts.find((act) => roundIndex1Based >= act.roundStart && roundIndex1Based <= act.roundEnd);
  if (!a) return acts[acts.length - 1];
  return a;
}

export function pickStructureKey(
  roundIndex1Based: number,
  act: LauncherActConfig,
  rng: () => number
): string {
  const pool = act.structurePool;
  const w = act.weights;
  if (!w || w.length !== pool.length) {
    return pool[Math.floor(rng() * pool.length) % pool.length];
  }
  const total = w.reduce((s, n) => s + n, 0);
  let r = rng() * total;
  for (let i = 0; i < pool.length; i++) {
    r -= w[i];
    if (r <= 0) return pool[i];
  }
  return pool[pool.length - 1];
}
```

- [ ] **Step 7: Test act pick**

`actPick.test.ts`: assert round 1 maps to act 1, boss round picks boss act pool of one key, weighted pick skews distribution (optional statistical smoke).

Run: `npx vitest run scenes/launcher/actPick.test.ts`

- [ ] **Step 8: Populate `levels/kitchen.ts`**

- Move existing structures into `structurePresets: { SIMPLE_TOWER: …, WIDE_WALL: …, … }`.
- Add `acts` for rounds 1–5 with pools; `boss.roundIndex: 6`, `boss.structure` = Mixer layout from spec, `boss.shots: 6`.
- Set `hazards.spill` to a rectangle on the counter surface.
- Set `totalRounds: 6`, `projectilesPerRound` for normal rounds (e.g. 3); scene will override ammo on boss round using `boss.shots`.
- Ensure `KITCHEN_LEVEL_CONFIG` satisfies extended type (fix any App/registry consumers if needed).

- [ ] **Step 9: Run full test suite**

Run: `npm run test:run`  
Expected: all tests pass.

---

### Task 2: StructureBuilder

**Files:**

- Create: `scenes/launcher/StructureBuilder.ts`
- Test (optional): pure texture key / material map in Vitest if extracted

- [ ] **Step 1:** Move block texture generation + static group creation from `LauncherScene.buildStructure` into `StructureBuilder.create()`.
- [ ] **Step 2:** Expose `getBlockGroup()`, `getBlockDataMap(): Map<Phaser.GameObjects.GameObject, LauncherBlockRuntime>`, `clear()`, `buildFromStructure(struct: LauncherStructure, baseX: number, baseY: number)`.
- [ ] **Step 3:** Runtime type includes `kind`, `health`, `maxHealth`, `points`, `material`, stable string `id` for explosion graph.
- [ ] **Step 4:** Tint / visual variants per `kind` (explosive orange, ice cyan, etc.).

---

### Task 3: KitchenBackground

**Files:**

- Create: `scenes/launcher/KitchenBackground.ts`

- [ ] **Step 1:** Move `drawBackground` from scene; add cabinet/window graphics at `DEPTH.CABINET`.
- [ ] **Step 2:** Optional: `drawSpillOutline` callback or graphics object updated by `HazardManager` — if spill is hazard-owned, `KitchenBackground` only reserves depth layer.

---

### Task 4: CritterManager

**Files:**

- Create: `scenes/launcher/CritterManager.ts`

- [ ] **Step 1:** On structure built, attach ant sprites along top edge of designated block (act ≥ 2).
- [ ] **Step 2:** Place mouse sprite on topmost block (act ≥ 3); track `mouseAlive`.
- [ ] **Step 3:** On treat overlap ants → score + destroy ant via context `addScore`.
- [ ] **Step 4:** On treat overlap mouse → +50, clear mouse.
- [ ] **Step 5:** `onRoundEndIfBlocksRemain()` → if mouse alive, `addScore(-25)` with floor at 0.

---

### Task 5: HazardManager

**Files:**

- Create: `scenes/launcher/HazardManager.ts`

- [ ] **Step 1:** Draw spill ellipse/rect from `config.hazards.spill`.
- [ ] **Step 2:** In `update`, if treat exists and overlaps spill AABB, apply velocity damping and extra gravity per spec.
- [ ] **Step 3:** Boss-only: timer every 8s, apply horizontal impulse to treat for 0.5s if `bossFanEnabled`.

---

### Task 6: PowerupManager

**Files:**

- Create: `scenes/launcher/PowerupManager.ts`

- [ ] **Step 1:** Internal queue max length 2 (`piercing` | `cluster`).
- [ ] **Step 2:** `onPowerCrateBroken()` from context pushes charge.
- [ ] **Step 3:** `consumeForNextLaunch()` returns active power for one shot.
- [ ] **Step 4:** Scene applies pierce (second collider pass or overlap ignore once) and cluster (spawn child sprites) in collision handler — **coordinate** with StructureBuilder.

---

### Task 7: MixerBoss

**Files:**

- Create: `scenes/launcher/MixerBoss.ts` (or merge into StructureBuilder with `buildBossStructure`)

- [ ] **Step 1:** Export `BOSS_STRUCTURE` constant or builder from config `boss.structure`.
- [ ] **Step 2:** `cheese_ward` invulnerability: until any adjacent non-ward block is destroyed, ward takes no damage (implement in block hit handler with neighbor query).
- [ ] **Step 3:** `mixer_core` destroyed → scene calls `emitLevelComplete` with +200 score.

---

### Task 8: LauncherScene orchestrator

**Files:**

- Modify: `scenes/LauncherScene.ts`

- [ ] **Step 1:** Instantiate managers in `create()` in order: Background → StructureBuilder → HazardManager → CritterManager → PowerupManager (MixerBoss logic can be scene methods).
- [ ] **Step 2:** Move input handlers, launch, `onProjectileDone`, `checkEndCondition`, lives decrement on round fail, `emitLivesChanged`.
- [ ] **Step 3:** Wire explosive chain: on block destroy, if kind explosive, `findExplosionNeighborIds` + apply damage to neighbors.
- [ ] **Step 4:** Ice: reduce bounce on block body or override in collision callback.
- [ ] **Step 5:** Boss round: use `boss.shots`, `boss.structure`, skip random pick.
- [ ] **Step 6:** Target file length ~300–500 lines; delete duplicated code from old monolith.

---

### Task 9: SFX integration

**Files:**

- Modify: `scenes/LauncherScene.ts` (and managers if they call `playSfx`)

- [ ] **Step 1:** Import or access `playSound` / scene audio bridge same as other Phaser scenes (grep `RunnerScene` or `PlatformerScene` for pattern).
- [ ] **Step 2:** Map events: launch, block break, explosive, ant, mouse steal, powerup, boss hit, victory, game over.

---

### Task 10: Integration + QA

- [ ] **Step 1:** `npm run test:run` — zero failures.
- [ ] **Step 2:** `npm run build` — success.
- [ ] **Step 3:** Manual: start KITCHEN from campaign, complete 6 rounds, verify score ≥ 500 clears, lives decrement on failed round, stars line up with 200/400/600 if wired from React HUD.

---

## Notes for implementers

- **Deferred destroy:** Launcher does not iterate enemy groups like Shooter; block destroy during overlap is fine — mirror existing `LauncherScene` collider pattern.
- **Bridge:** Do not change `LauncherSceneInitData` shape without updating `PhaserGame.tsx` / `App.tsx`.
- **Victory:** Keep `victoryCondition.type: 'score', target: 500` in catalog; boss +200 is score-only.
