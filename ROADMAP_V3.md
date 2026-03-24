# Beach Kitty V3 — Nine Lives Campaign Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Transform Beach Kitty from a single endless-runner into a nine-level campaign where each level is a distinct game genre, powered by Phaser 3 for rendering and the same custom AI-generated cat character.

**Architecture:** React 19 owns UI (menus, HUD, campaign screen, cutscenes). Phaser 3 owns gameplay (one Scene per genre). A `PhaserGame.tsx` bridge component mounts Phaser inside a div and translates events/callbacks between the two. Each scene is code-split via dynamic `import()`. Levels are TypeScript config objects, not external map files.

**Tech Stack:** React 19, TypeScript, Vite, Phaser 3, Vitest, Vercel, Gemini AI (existing)

**Design decisions:** See [docs/superpowers/specs/2026-03-19-v3-open-questions-design.md](./docs/superpowers/specs/2026-03-19-v3-open-questions-design.md) — all 9 open questions resolved.

**Parent spec:** [ROADMAP_V3_SPEC.md](./ROADMAP_V3_SPEC.md)

---

## Current Baseline (as of 2026-03-20)

The shipped game is a **single BEACH runner**. React owns menus, the customizer (Kitty Closet), and the Hall of Fame. The gameplay monolith lives in:

- `App.tsx` — root state machine (`GameStatus`), score/lives/level selection, Hall of Fame persistence
- `components/GameEngine.tsx` — ~1,630-line `requestAnimationFrame` loop: physics, spawning, collisions, HUD wiring, boss fight
- `types.ts` — `GameStatus`, obstacle/power-up unions, `LevelConfig`, `PlayerState`, etc.
- `levels/beach.ts` — `BEACH_LEVEL_CONFIG` (runner-specific: obstacles, patterns, boss, theme, background)

**All three ship-checks pass today:**
```
npm run build       ✓
npm run test:run    ✓  (56 tests, 14 files)
npx tsc --noEmit    ✓
```

Everything below builds incrementally on this baseline. The BEACH runner must remain playable at every phase boundary.

---

## Shared Phaser Contract

The bridge between React and Phaser must stay **genre-agnostic**. Only these concerns belong in the permanent shared contract:

**Shared (SceneBridge + PhaserGame):**
- Lifecycle: `init`, `create`, `update`, `shutdown`
- Generic events: `statusChange`, `hudUpdate`, `levelComplete`, `gameOver`
- Scene identity: `levelId`, `catSpriteUrl`

**NOT shared — belongs in genre-specific `SceneInitData` subtypes:**
- `initialLives`, `startAtBoss` → `RunnerSceneInitData`
- Runner tuning profile, runner score shape → `RunnerSceneInitData`
- Platform layouts, enemy configs → `PlatformerSceneInitData`
- Wave definitions → `ShooterSceneInitData`
- etc.

The base `SceneInitData` should carry only `levelId` and `catSpriteUrl`. Each genre extends it with its own fields. `PhaserGame.tsx` passes an opaque `initData: Record<string, unknown>` (or a discriminated union keyed on `genre`) that the scene downcasts in `init()`.

---

## React → Phaser Runtime Sync Rules

Props passed to `PhaserGame` during scene boot are **not magically live**. Once Phaser's `init(data)` unpacks the initial values, React re-renders do NOT update those values inside the running scene.

**Any mid-run update requires an explicit sync path:**

1. **`scene.applyRuntimePatch(patch)`** — scene exposes a method; `PhaserGame` calls it via `sceneRef` when relevant props change. Best for tuning/dev panel changes.
2. **Bridge event (React → Phaser)** — `PhaserGame` emits a custom event on the scene's `EventEmitter`; scene listens. Best for pause/resume, status changes.
3. **Deliberate scene remount** — destroy and re-create the Phaser.Game. Only for hard resets (level change, cat appearance change mid-run).

**Current features that depend on runtime sync:**

| Feature | Sync mechanism needed |
|---------|----------------------|
| Tuning / dev BalancePanel sliders | `applyRuntimePatch` — tuning values change mid-run |
| Telemetry hookup | One-time callback in `init` (already handled) |
| Pause / resume | Bridge event or `scene.pause()` / `scene.resume()` |
| Cat appearance change (closet) | Scene remount (rare, only if user swaps mid-game) |
| Status change (PLAYING ↔ BOSS_FIGHT) | Scene emits to React, not the other way |

**`propsRef` is NOT sufficient** for values the scene reads in its update loop. The scene's `update()` reads from its own instance fields, not from React state. `propsRef` only helps for callback identity (so React handlers stay current), not for mutable game state.

---

## Level Config Model

Split campaign metadata from genre-specific runtime config:

**`CampaignLevelMeta`** (shared across all genres):
```typescript
interface CampaignLevelMeta {
  id: LevelId;
  name: string;
  description: string;
  genre: LevelGenre;
  catPose: CatPoseId;
  victoryCondition: VictoryCondition;
  starThresholds: [number, number, number];
  cutscene?: { intro?: CutsceneConfig; outro?: CutsceneConfig };
}
```

**Genre runtime configs** (each genre defines its own):
```typescript
// The existing LevelConfig effectively becomes this:
interface RunnerLevelConfig extends CampaignLevelMeta {
  genre: 'runner';
  obstacles: ObstacleDefinition[];
  patterns: PatternConfig[];
  boss: BossConfig;
  theme: ThemeConfig;
  background: BackgroundConfig;
  tuningOverrides?: Partial<TuningProfile>;
  // ... all current runner-specific fields
}

// Future genres add their own:
interface PlatformerLevelConfig extends CampaignLevelMeta {
  genre: 'platformer';
  platforms: PlatformDef[];
  enemies: EnemyDef[];
  // ...
}
```

**The discriminated union grows incrementally:**
```typescript
type AnyLevelConfig = RunnerLevelConfig | PlatformerLevelConfig | ...;
```

Do NOT absorb all genre fields into a single flattened `LevelConfig`. The current `LevelConfig` is already runner-specific — rename it to `RunnerLevelConfig` and let it be the first variant in the union.

---

## Beach Port Exit Criteria — COMPLETE (2026-03-22)

> **Implementation notes:** The port took a different path than originally scoped — Phase 1.5 (Beach Polish) was done concurrently with the core port, so many items were completed as part of the visual polish pass rather than as discrete Phase 1 tasks. Verified via code audit on 2026-03-24.

- [x] Jump / double-jump: `performJump()` with `jumpCount < 2`, SPACE/UP input
- [x] Duck / shoot behavior: `performDuck()` on ground, duck→`shootShell()` during BOSS_FIGHT
- [x] Scoring: coins = 1, shells = 5, multiplier/streak math in per-frame scoring + collection handlers
- [x] Power-ups: SPEED (1.7×), MAGNET (attract types), SUPER_SIZE (scale + invincibility) — 40/40/20 spawn weights, 7s duration
- [x] Obstacle spawning: weighted pool, pattern queue with `patternEndTime`, life-assist intervals on low lives
- [x] Boss trigger: fires at `bossEntryCoinThreshold` coins via `getBossEntryCoinThreshold()`
- [x] Boss fight: Sand Monster sprite, `computeBossWorldPose()`, arc projectiles, health tracking, defeat animation with poop pyramid
- [x] Seagull variants: swoop variant via `obstacleHasBehavior`, poop drop via `checkPoopDrop()`
- [x] Pause / resume: P or ESC toggles `isPaused`, HudUpdate emitted, React overlay syncs via `applyRuntimePatch()`
- [~] Telemetry: Bridge events (score, lives, game over) emit to React; full `runTelemetry()` analytics logger NOT wired (TODO at RunnerScene ~line 216) — **deferred, non-blocking**
- [x] Balance panel: `applyRuntimePatch()` accepts tuning updates from dev sliders in real time
- [x] Hall of Fame write: `emitLevelComplete()` sends victory payload; React writes to Hall of Fame
- [x] Custom cat rendering: `catSpriteUrl` loaded in `preload()`, fallback sprite if none equipped
- [~] Visual effects: screen shake, hit flash, freeze frames, particles, dust trails, floating scores all working; **speed lines not ported** — deferred, cosmetic only
- [x] Background parallax: `spawnBackgroundEntities()` with depth layers via `BG_DEPTH` map
- [x] Audio: PhaserAudio procedural beat-scheduler, `setBossMode()` transition, SFX throughout

**14/16 fully done, 2 deferred (telemetry analytics, speed lines) — neither blocks gameplay or progression.**

---

## Fallback Policy

The current DOM-based runner (`GameEngine.tsx`, `audioService.ts`, `sfxService.ts`) remains available behind a feature flag until **Phaser BEACH parity is proven**.

**Rules:**
1. Do NOT archive `GameEngine.tsx` or old audio services immediately after the first successful Phaser run.
2. Add a `USE_PHASER_RUNNER` flag (localStorage or env) that defaults to `true` but can be toggled to `false` to fall back to the DOM runner.
3. Archiving happens only after: (a) BEACH parity is confirmed against all exit criteria above, AND (b) at least one additional scene (Level 2) proves the bridge is reusable for a second genre.
4. When archiving, move files to `components/_archive/` and `services/_archive/` — do not delete.

This protects against discovering a bridge limitation mid-Phase 1 that would leave the game unplayable.

---

## Score Semantics

Cross-genre score normalization is **deferred** (not in V3 scope). This has consequences:

1. **Hall of Fame entries MUST include `levelId`.** A bare score like "450" is meaningless without knowing the genre.
2. **UI must present scores as level-scoped** — either grouped by level, or with a clear level label per row.
3. **Scores are NOT directly comparable across genres.** A score of 300 in the runner (coin-based) and 300 in whack-a-mole (hit-based) represent completely different achievements.
4. **`LevelResult.score` is raw, genre-specific.** No normalization, no cross-genre ranking.
5. **Stars ARE comparable** — 3 stars in any level means mastery. The campaign screen uses stars (not scores) for progression display.

---

## Character Sprite System

Each level requires the cat in genre-specific poses and animations. A single static sprite can't convey life across 9 genres. The sprite system generates **per-level sprite sets** from the player's character design.

### Architecture

1. **Character identity = base prompt.** The closet stores the player's cat description and a reference image. This is the seed for all per-level sprite generation.
2. **Each level declares `requiredSprites: SpriteSpec[]`** in its config — the list of poses/animations that level needs (e.g., Beach runner needs: run-cycle, jump, duck, hit, idle).
3. **Generation happens per-sprite, per-level** — not a batch sprite sheet. Gemini generates one pose at a time using the base character description + a pose-specific prompt addendum defined by the level.
4. **Timing: on level start (lazy) or from closet (eager).** Sprites generate the first time a level is entered with a given cat design. Cached in IndexedDB for replay. Optional "generate all" button in closet for players who want everything ready upfront.
5. **Fallback: base sprite always works.** If generation fails or hasn't run yet, the level uses the single equipped sprite. The game is always playable — multi-sprite is enhancement, not gate.

### Storage Model

```
IndexedDB: beach-kitty-assets / sprites
  Key format: {catDesignId}:{levelId}:{poseId}
  Value: PNG Blob

Example keys:
  cat-abc123:BEACH:run
  cat-abc123:BEACH:jump
  cat-abc123:ROOFTOPS:idle
  cat-abc123:ROOFTOPS:walk
```

`SavedCatLook.assetId` remains the base sprite key. Level-specific sprites are keyed as derivatives. Deleting a cat design from the closet cascades to delete all its level sprites (prefix match on `{catDesignId}:`).

### Per-Level Sprite Contract

Each level phase in this roadmap includes a **Sprite Requirements** section that defines:

| Field | Description |
|-------|-------------|
| `requiredSprites` | List of `{ poseId, description }` tuples — what the cat needs to do in this genre |
| `promptAddendum` | Pose-specific prompt text appended to the base character description |
| `fallbackBehavior` | What happens when a sprite is missing (use base sprite, use placeholder, skip animation) |

**These are defined during level implementation, not upfront.** Movement lists emerge from building the level — you can't spec "jump" until you know the jump mechanic.

### Replaces Phase 3: catPoseTransforms

The original Phase 3 proposed programmatic canvas transforms (crop/flip) on a single sprite to produce pose variants. This approach is superseded by AI generation of purpose-built sprites per level. The `catPoseTransforms.ts` service and its tests are no longer needed. Phase 3 becomes: **build the sprite generation pipeline + closet integration for multi-sprite storage**.

### Integration with Closet (Kitty Closet)

The closet evolves from "pick one look" to "manage a character design that spawns level sprites":

- **Closet stores:** base description, reference image, player name — the character identity
- **Closet shows:** generated level sprites as a gallery under each saved cat (expandable)
- **Closet actions:** regenerate a specific level sprite, generate all missing sprites, delete a cat + all derivatives
- **On equip:** the base sprite is immediate; level sprites generate lazily or on demand

---

## File Map

### New files

| File | Responsibility |
|------|---------------|
| `scenes/shared/SceneBridge.ts` | Base class for all Phaser scenes — event protocol, lifecycle hooks, bridge to React callbacks |
| `scenes/shared/SpriteLoader.ts` | Load cat sprite (from IndexedDB blob URL) into Phaser texture |
| `scenes/shared/EffectsManager.ts` | Shared camera shake, flash, particles, freeze frame for Phaser scenes |
| `scenes/shared/PhaserAudio.ts` | Unified audio: music loader + procedural SFX via Phaser's AudioContext |
| `scenes/RunnerScene.ts` | Level 1 — Beach runner (port of GameEngine.tsx) |
| `scenes/PlatformerScene.ts` | Level 2 — Rooftop platformer |
| `scenes/LauncherScene.ts` | Level 3 — Kitchen launcher |
| `scenes/ShooterScene.ts` | Level 4 — Space shooter |
| `scenes/BreakoutScene.ts` | Level 5 — Yarn breaker |
| `scenes/FroggerScene.ts` | Level 6 — Busy whiskers |
| `scenes/WhackScene.ts` | Level 7 — Mouse hunt |
| `scenes/SnakeScene.ts` | Level 8 — Catnip garden |
| `scenes/ClimberScene.ts` | Level 9 — Cat tree climber |
| `components/PhaserGame.tsx` | React wrapper — mounts Phaser.Game, lazy scene registration, bridge callbacks |
| `components/CampaignScreen.tsx` | Nine Lives cat tree level selector (replaces LevelSelection.tsx) |
| `components/CutscenePlayer.tsx` | Between-level story beat player (text frames + DaVinci Resolve video via `demo-video-factory-catrunner/`) |
| `services/levelCompletion.ts` | `LevelCompletePayload`, `LevelResult`, star calculation, best-score merge, persistence |
| `services/catSpriteGenerator.ts` | Per-level sprite generation via Gemini — cache-first, fallback to base sprite |
| `scenes/shared/SpriteLoader.ts` | Load cat sprite from blob URL into a Phaser texture (handles IndexedDB blob URL lifecycle) |
| `levels/rooftops.ts` | Level 2 config |
| `levels/kitchen.ts` | Level 3 config |
| `levels/space.ts` | Level 4 config |
| `levels/yarn.ts` | Level 5 config |
| `levels/street.ts` | Level 6 config |
| `levels/garden-whack.ts` | Level 7 config |
| `levels/garden-snake.ts` | Level 8 config |
| `levels/cattree.ts` | Level 9 config |
| `assets/audio/` | Pre-composed music tracks per level |

### Modified files

| File | Changes |
|------|---------|
| `types.ts` | Add `LevelGenre`, `VictoryCondition`, `LevelCompletePayload`, `CatPoseId`, `CutsceneConfig/Frame`, `starThresholds`; update `GameStatus` enum; add `levelId` to `HighScoreEntry`; expand `LevelId` union |
| `App.tsx` | Replace `GameEngine` mount with `PhaserGame`; replace `LEVEL_SELECTION` with `CAMPAIGN`; add `CUTSCENE`/`CAMPAIGN_COMPLETE` states; replace `handleVictoryFinalize` with `handleLevelComplete`; replace `defeatedBosses` with `completedLevels` |
| `levels/catalog.ts` | Expand `LEVEL_ORDER` to 9 entries; rename `isLevelUnlocked` to use `completedLevels`; add star utilities |
| `levels/index.ts` | Change `LEVEL_REGISTRY` to `Partial<Record<LevelId, LevelConfig>>`; update `getLevelConfig` to handle missing entries; register levels as they are built |
| `levels/beach.ts` | Add V3 fields: `genre: 'runner'`, `catPose: 'runner'`, `victoryCondition`, `starThresholds`, `cutscene` |
| `services/levelProgress.ts` | Rename storage key to `beach-cat-completed-levels-v1`; add migration from `defeatedBosses`; update types |
| `services/runOutcome.ts` | Update Hall of Fame merge to include `levelId`; remove `nextDefeatedBossesAfterVictory` (replaced by `levelCompletion.ts`) |
| `vite.config.ts` | Add Phaser to `optimizeDeps.include`; verify build config |
| `package.json` | Add `phaser` dependency |

### Retired files (CONDITIONAL — see Task 1.13 gate + Fallback Policy)

| File | Reason | Gate |
|------|--------|------|
| `components/GameEngine.tsx` | Replaced by `scenes/RunnerScene.ts` + `components/PhaserGame.tsx` | Beach parity + bridge reuse proven |
| `services/audioService.ts` | Replaced by `scenes/shared/PhaserAudio.ts` (Phaser owns AudioContext) | Beach parity + bridge reuse proven |
| `services/sfxService.ts` | SFX migrated into Phaser audio system | Beach parity + bridge reuse proven |
| `components/LevelSelection.tsx` | Replaced by `components/CampaignScreen.tsx` | CampaignScreen functional |

---

## Chunk 1: Phase 0 — Phaser Integration + Bridge

**Goal:** Add Phaser 3, create the React↔Phaser bridge, verify it works alongside existing UI without breaking anything.

### Task 0.1: Install Phaser and configure Vite

**Files:**
- Modify: `package.json`
- Modify: `vite.config.ts`

- [x] **Step 1: Install Phaser**

```bash
npm install phaser
```

- [x] **Step 2: Update vite.config.ts — add Phaser to optimizeDeps**

In `vite.config.ts`, inside the returned config object, add:

```typescript
optimizeDeps: {
  include: ['phaser'],
},
```

This tells Vite to pre-bundle Phaser during dev (avoids slow on-demand optimization of Phaser's large bundle).

- [x] **Step 3: Verify dev server starts**

```bash
npm run dev
```

Expected: Dev server starts on port 3000. No errors. Existing game works unchanged.

- [x] **Step 4: Verify production build**

```bash
npm run build
```

Expected: Build succeeds. Check output — Phaser chunk should appear in the `dist/assets/` directory. Note its size (~1MB gzipped).

- [x] **Step 5: Verify tests still pass**

```bash
npm run test:run
```

Expected: All existing tests pass.

- [x] **Step 6: Commit**

```bash
git add package.json package-lock.json vite.config.ts
git commit -m "chore: add phaser dependency and configure Vite optimizeDeps"
```

---

### Task 0.2: Define V3 type foundations

**Files:**
- Modify: `types.ts`
- Test: `types.ts` is purely types — verified by `npx tsc --noEmit`

- [x] **Step 1: Add V3 types to types.ts**

At the bottom of `types.ts`, after the existing `LevelConfig` interface, add:

```typescript
// ─── V3: Nine Lives Campaign Types ──────────────────────────────────

export type LevelGenre = 'runner' | 'platformer' | 'launcher' | 'shooter'
                       | 'breakout' | 'frogger' | 'whack' | 'snake' | 'climber';

export type CatPoseId =
  | 'runner'      // side-running, current default
  | 'platformer'  // side-view idle/walk/jump
  | 'pilot'       // forward-facing in cardboard box ship
  | 'launcher'    // sitting, tail-flick for launch
  | 'paddle'      // paw only (breakout)
  | 'hopper'      // top-down-ish (frogger)
  | 'swatter'     // paw with claws (whack)
  | 'slitherer'   // head for snake
  | 'climber';    // side-view arms-up

export type VictoryCondition =
  | { type: 'boss'; bossId: string }
  | { type: 'goal'; description: string }
  | { type: 'score'; target: number }
  | { type: 'survive'; durationMs: number }
  | { type: 'clear'; description: string };

export interface CutsceneFrame {
  type: 'text' | 'video';
  text?: string;
  image?: string;
  /** Path to video file. Produced via demo-video-factory-catrunner/ pipeline
   *  (DaVinci Resolve → export → assets/cutscenes/). */
  videoSrc?: string;
  subtitles?: string;
  durationMs?: number;
  transition?: 'fade' | 'slide' | 'cut';
}

export interface CutsceneConfig {
  frames: CutsceneFrame[];
}

/** Emitted by any Phaser scene when the level is completed. */
export interface LevelCompletePayload {
  levelId: LevelId;
  /** Raw genre-specific score. NOT normalized (0-999 normalization is deferred). */
  finalScore: number;
  gameScore: GameScore;
  victoryType: VictoryCondition['type'];
}

export interface LevelResult {
  levelId: LevelId;
  score: number;
  stars: 1 | 2 | 3;
}
```

- [x] **Step 2: Expand LevelId**

Change the existing `LevelId` type:

```typescript
export type LevelId =
  | 'BEACH'
  | 'ROOFTOPS'
  | 'KITCHEN'
  | 'SPACE'
  | 'YARN'
  | 'STREET'
  | 'GARDEN_WHACK'
  | 'GARDEN_SNAKE'
  | 'CAT_TREE';
```

- [x] **Step 3: Update GameStatus enum**

Replace the existing `GameStatus` enum:

```typescript
export enum GameStatus {
  CAMPAIGN = 'CAMPAIGN',
  CUSTOMIZE = 'CUSTOMIZE',
  CUTSCENE = 'CUTSCENE',
  PLAYING = 'PLAYING',
  BOSS_FIGHT = 'BOSS_FIGHT',
  GAMEOVER = 'GAMEOVER',
  VICTORY = 'VICTORY',
  CAMPAIGN_COMPLETE = 'CAMPAIGN_COMPLETE',
}
```

- [x] **Step 4: Add levelId to HighScoreEntry**

Add `levelId?: LevelId;` to the `HighScoreEntry` interface (optional for backwards compatibility with legacy entries).

- [x] **Step 5: Type-check**

```bash
npx tsc --noEmit
```

Expected: Type errors in files that reference `LEVEL_SELECTION` (now `CAMPAIGN`), and in `levels/index.ts` where `Record<LevelId, LevelConfig>` now requires 9 keys but only has `BEACH`.

- [x] **Step 6: Fix GameStatus references**

Search for `LEVEL_SELECTION` in `App.tsx` and replace with `CAMPAIGN`. This is a rename — same behavior, new name.

- [x] **Step 7: Make LEVEL_REGISTRY partial**

In `levels/index.ts`, change:
```typescript
export const LEVEL_REGISTRY: Record<LevelId, LevelConfig> = { ... };
```
to:
```typescript
export const LEVEL_REGISTRY: Partial<Record<LevelId, LevelConfig>> = { ... };
```

Update `getLevelConfig` to throw a descriptive error if the level is not yet implemented:
```typescript
export function getLevelConfig(id: LevelId): LevelConfig {
  const config = LEVEL_REGISTRY[id];
  if (!config) throw new Error(`Level "${id}" is not yet implemented`);
  return config;
}
```

- [x] **Step 8: Create `CampaignLevelMeta` and rename existing config to `RunnerLevelConfig`**

Do NOT add optional genre fields to the existing `LevelConfig`. Instead, split campaign metadata from genre runtime config now — this prevents the "god config" anti-pattern where one interface absorbs fields from every genre.

**8a. Create `CampaignLevelMeta` in `types.ts`:**

```typescript
/** Shared campaign metadata — every genre implements this. */
export interface CampaignLevelMeta {
  id: LevelId;
  name: string;
  description: string;
  genre: LevelGenre;
  catPose: CatPoseId;
  victoryCondition: VictoryCondition;
  starThresholds: [number, number, number];
  cutscene?: { intro?: CutsceneConfig; outro?: CutsceneConfig };
}
```

**8b. Rename the existing `LevelConfig` to `RunnerLevelConfig` and extend `CampaignLevelMeta`:**

```typescript
/** Runner-specific level config. The existing LevelConfig IS this. */
export interface RunnerLevelConfig extends CampaignLevelMeta {
  genre: 'runner';
  obstacles: ObstacleDefinition[];
  patterns: PatternConfig[];
  boss: BossConfig;
  theme: ThemeConfig;
  background: BackgroundConfig;
  tuningOverrides?: Partial<TuningProfile>;
  magnetAttractTypes?: string[];
  // ... all existing runner-specific fields stay here
}
```

**8c. Create the union type (starts with one variant, grows per genre):**

```typescript
/** Discriminated union — grows as genres are added. */
export type AnyLevelConfig = RunnerLevelConfig; // | PlatformerLevelConfig | ...
```

**8d. Update `BEACH_LEVEL_CONFIG` in `levels/beach.ts`:**

Add the required `CampaignLevelMeta` fields:
```typescript
genre: 'runner',
catPose: 'runner',
victoryCondition: { type: 'boss', bossId: 'sandMonster' },
starThresholds: [100, 300, 500],
```

**8e. Update `LEVEL_REGISTRY` type in `levels/index.ts`:**

Change from `Partial<Record<LevelId, LevelConfig>>` to `Partial<Record<LevelId, AnyLevelConfig>>`. Update `getLevelConfig` return type to `AnyLevelConfig`.

**8f. Add `LevelConfig` as a deprecated alias** to avoid breaking all existing imports at once:

```typescript
/** @deprecated Use RunnerLevelConfig or AnyLevelConfig. Alias kept for migration. */
export type LevelConfig = RunnerLevelConfig;
```

This alias lets existing code compile while the rename propagates incrementally. Remove it when all references are updated.

- [x] **Step 9: Type-check again**

```bash
npx tsc --noEmit
```

Expected: Fewer errors. Remaining errors should be limited to the `GameStatus.LEVEL_SELECTION` rename downstream — those are caught in subsequent commits.

- [x] **Step 10: Commit**

```bash
git add types.ts App.tsx levels/index.ts levels/beach.ts
git commit -m "feat(v3): add V3 type foundations — LevelGenre, VictoryCondition, CutsceneConfig, expanded LevelId/GameStatus"
```

---

### Task 0.3: Create the SceneBridge base class

**Files:**
- Create: `scenes/shared/SceneBridge.ts`
- Test: `scenes/shared/SceneBridge.test.ts`

This is the base class all 9 Phaser scenes extend. It defines the event protocol for Phaser→React communication.

- [x] **Step 1: Write test for SceneBridge event emission**

Create `scenes/shared/SceneBridge.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import { BRIDGE_EVENTS } from './SceneBridge';

describe('SceneBridge event protocol', () => {
  it('defines all required bridge event names', () => {
    expect(BRIDGE_EVENTS).toEqual({
      SCORE_UPDATE: 'scoreUpdate',
      LIVES_CHANGED: 'livesChanged',
      LEVEL_COMPLETE: 'levelComplete',
      GAME_OVER: 'gameOver',
      STATUS_CHANGE: 'statusChange',
      HUD_UPDATE: 'hudUpdate',
    });
  });
});
```

Note: This test uses ESM `import` (the project is `"type": "module"`). On the first "red" run, the import will fail because `SceneBridge.ts` doesn't exist yet — that's the expected TDD failure.

- [x] **Step 2: Run test — verify it fails**

```bash
npm run test:run -- scenes/shared/SceneBridge.test.ts
```

Expected: FAIL — module not found.

- [x] **Step 3: Create SceneBridge (genre-agnostic base)**

Create `scenes/shared/SceneBridge.ts`. **The base class carries ONLY shared concerns.** Runner-specific fields (`initialLives`, `startAtBoss`, `tuning`) do NOT belong here — they go in `RunnerSceneInitData` (see Task 0.3b below).

```typescript
import Phaser from 'phaser';
import type { GameScore, GameStatus, LevelCompletePayload, LevelId } from '../../types';

/** Event names emitted by Phaser scenes, received by PhaserGame React wrapper. */
export const BRIDGE_EVENTS = {
  SCORE_UPDATE: 'scoreUpdate',
  LIVES_CHANGED: 'livesChanged',
  LEVEL_COMPLETE: 'levelComplete',
  GAME_OVER: 'gameOver',
  STATUS_CHANGE: 'statusChange',
  HUD_UPDATE: 'hudUpdate',
} as const;

/** Base init data — shared by ALL genres. Genre scenes extend this. */
export interface SceneInitData {
  levelId: LevelId;
  catSpriteUrl: string | null;
}

/**
 * Base class for all V3 Phaser scenes.
 * Provides typed event emission and shared lifecycle.
 * Genre scenes extend this and define their own init data type.
 *
 * IMPORTANT: This base class is genre-agnostic. Do not add runner-specific
 * fields (lives, tuning, boss flags) here. See RunnerSceneInitData.
 */
export abstract class SceneBridge extends Phaser.Scene {
  protected levelId!: LevelId;
  protected catSpriteUrl: string | null = null;

  init(data: SceneInitData): void {
    this.levelId = data.levelId;
    this.catSpriteUrl = data.catSpriteUrl;
  }

  /** Emit score/HUD update to React */
  protected emitScoreUpdate(score: GameScore): void {
    this.events.emit(BRIDGE_EVENTS.SCORE_UPDATE, score);
  }

  /** Emit level completion to React */
  protected emitLevelComplete(payload: LevelCompletePayload): void {
    this.events.emit(BRIDGE_EVENTS.LEVEL_COMPLETE, payload);
  }

  /** Emit game over to React */
  protected emitGameOver(finalScore: number): void {
    this.events.emit(BRIDGE_EVENTS.GAME_OVER, finalScore);
  }

  /** Emit status change to React */
  protected emitStatusChange(status: GameStatus): void {
    this.events.emit(BRIDGE_EVENTS.STATUS_CHANGE, status);
  }

  /**
   * Apply a runtime patch from React (e.g., tuning slider change).
   * Override in subclasses that support mid-run updates.
   * Default: no-op.
   */
  applyRuntimePatch(_patch: Record<string, unknown>): void {}
}
```

- [x] **Step 3b: Create RunnerSceneInitData (temporary BEACH shim)**

Runner-specific init data lives alongside the scene, not in the shared bridge:

```typescript
// scenes/RunnerScene.types.ts (or inline in RunnerScene.ts)
import type { SceneInitData } from './shared/SceneBridge';
import type { RunnerLevelConfig } from '../types';
import type { TuningProfile } from '../systems/tuning/defaultTuning';
import type { TelemetryEvent } from '../systems/telemetry/runTelemetry';

/** Runner-specific init data — extends the shared base. */
export interface RunnerSceneInitData extends SceneInitData {
  levelConfig: RunnerLevelConfig;
  initialLives: number;
  startAtBoss: boolean;
  tuning: TuningProfile;
  onTelemetryReady?: (getTelemetry: () => TelemetryEvent[]) => void;
}
```

**This is a temporary BEACH shim**, not the long-term shared API. When Level 2 (Platformer) is built, it will define `PlatformerSceneInitData extends SceneInitData` with its own fields.

- [x] **Step 4: Run test — verify it passes**

```bash
npm run test:run -- scenes/shared/SceneBridge.test.ts
```

Expected: PASS.

- [x] **Step 5: Commit**

```bash
git add scenes/shared/SceneBridge.ts scenes/shared/SceneBridge.test.ts
git commit -m "feat(v3): add SceneBridge base class with event protocol"
```

---

### Task 0.4: Create PhaserGame React wrapper

**Files:**
- Create: `components/PhaserGame.tsx`

This component mounts a `Phaser.Game` instance inside a div, handles lazy scene registration, resize, and cleanup. It wires bridge events to React callbacks.

- [x] **Step 1: Create PhaserGame.tsx (genre-agnostic wrapper)**

The wrapper is **generic** — it does not know about runner-specific fields. Genre-specific init data is passed as an opaque bag via `sceneInitData`.

```typescript
import React, { useEffect, useRef } from 'react';
import type { GameScore, GameStatus, LevelCompletePayload, LevelId } from '../types';
import { BRIDGE_EVENTS, type SceneBridge } from '../scenes/shared/SceneBridge';

interface PhaserGameProps {
  levelId: LevelId;
  catSpriteUrl: string | null;
  /** Genre-specific init data — opaque to PhaserGame, consumed by the scene. */
  sceneInitData: Record<string, unknown>;
  sceneFactory: () => Promise<{ default: typeof Phaser.Scene }>;
  onScoreUpdate: (score: GameScore) => void;
  onLevelComplete: (payload: LevelCompletePayload) => void;
  onGameOver: (finalScore: number) => void;
  onStatusChange?: (status: GameStatus) => void;
}

const PhaserGame: React.FC<PhaserGameProps> = (props) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const gameRef = useRef<Phaser.Game | null>(null);
  const sceneRef = useRef<SceneBridge | null>(null);

  // Callbacks go in a ref so the effect closure always sees current values
  // without restarting Phaser.
  const propsRef = useRef(props);
  propsRef.current = props;

  useEffect(() => {
    if (!containerRef.current) return;

    let destroyed = false;

    const boot = async () => {
      const p = propsRef.current;
      const Phaser = (await import('phaser')).default;
      const { default: SceneClass } = await p.sceneFactory();

      if (destroyed) return;

      const sceneKey = `scene-${p.levelId}`;

      // Merge shared fields + genre-specific data into one init payload
      const initData = {
        levelId: p.levelId,
        catSpriteUrl: p.catSpriteUrl,
        ...p.sceneInitData,
      };

      const game = new Phaser.Game({
        type: Phaser.AUTO,
        parent: containerRef.current!,
        width: window.innerWidth,
        height: window.innerHeight,
        backgroundColor: '#000000',
        audio: { disableWebAudio: false },
        physics: {
          default: 'arcade',
          arcade: { gravity: { x: 0, y: 0 }, debug: false },
        },
        scale: {
          mode: Phaser.Scale.RESIZE,
          autoCenter: Phaser.Scale.CENTER_BOTH,
        },
      });

      // Add scene but do NOT auto-start (false). Wire events first, then start.
      game.scene.add(sceneKey, SceneClass, false);

      const scene = game.scene.getScene(sceneKey) as SceneBridge | null;
      if (scene) {
        sceneRef.current = scene;

        // Wire bridge events BEFORE starting the scene.
        scene.events.on(BRIDGE_EVENTS.SCORE_UPDATE, (s: GameScore) => propsRef.current.onScoreUpdate(s));
        scene.events.on(BRIDGE_EVENTS.LEVEL_COMPLETE, (p: LevelCompletePayload) => propsRef.current.onLevelComplete(p));
        scene.events.on(BRIDGE_EVENTS.GAME_OVER, (s: number) => propsRef.current.onGameOver(s));
        scene.events.on(BRIDGE_EVENTS.STATUS_CHANGE, (s: GameStatus) => propsRef.current.onStatusChange?.(s));

        // NOW start the scene — create() runs with listeners already attached
        game.scene.start(sceneKey, initData);
      }

      gameRef.current = game;
    };

    boot();

    return () => {
      destroyed = true;
      sceneRef.current = null;
      if (gameRef.current) {
        gameRef.current.destroy(true);
        gameRef.current = null;
      }
    };
  // ONLY levelId triggers a full Phaser restart.
  }, [props.levelId]);

  return <div ref={containerRef} style={{ width: '100%', height: '100%', position: 'absolute', top: 0, left: 0 }} />;
};

export default PhaserGame;
```

**Key design points:**
- **Genre-agnostic:** `PhaserGame` knows `levelId`, `catSpriteUrl`, and `sceneInitData` (opaque). It does NOT import runner types, tuning types, or telemetry types. Genre scenes downcast `sceneInitData` in their `init()`.
- **No re-render restarts:** The effect depends ONLY on `props.levelId`. Callbacks live in `propsRef`.
- **Events before start:** Scene is added with `autoStart: false`, events are wired, THEN `game.scene.start()` is called.
- **`sceneRef` exposed:** Needed for runtime patches (Step 2b below).
- **Code splitting:** `sceneFactory` is called once during boot, not on every render.
- **Web Audio forced:** `audio: { disableWebAudio: false }` ensures single AudioContext.

- [x] **Step 2: Add runtime update handling**

**`propsRef` is NOT sufficient** for values the scene reads in its update loop (see "React → Phaser Runtime Sync Rules" above). Add a `useEffect` that forwards tuning/config changes to the running scene:

```typescript
// After the boot effect, add a second effect for runtime patches:
useEffect(() => {
  if (sceneRef.current && props.sceneInitData) {
    // Forward changed values to the running scene.
    // Each scene's applyRuntimePatch decides what to accept.
    sceneRef.current.applyRuntimePatch(props.sceneInitData);
  }
  // Depend on the specific values that can change mid-run.
  // For runner: tuning object reference. For other genres: their equivalent.
}, [props.sceneInitData]);
```

This calls `SceneBridge.applyRuntimePatch()` (default no-op). `RunnerScene` overrides it to update tuning values, dev panel state, etc. Other genre scenes override it for their own needs.

**Concrete mechanism for current features:**

| Feature | How it works |
|---------|-------------|
| BalancePanel tuning sliders | App passes updated `sceneInitData.tuning` → `useEffect` fires → `RunnerScene.applyRuntimePatch({tuning})` updates instance fields |
| Pause from React | Call `sceneRef.current.scene.pause()` / `.resume()` directly, or emit a custom bridge event |
| Cat appearance mid-game | Full scene remount (change `levelId` key or add a `sceneKey` prop) |

- [x] **Step 3: Verify type-check**

```bash
npx tsc --noEmit
```

Expected: No new errors from PhaserGame.tsx (some existing errors from the GameStatus rename are expected and will be fixed later).

- [x] **Step 3: Commit**

```bash
git add components/PhaserGame.tsx
git commit -m "feat(v3): add PhaserGame React wrapper with lazy scene loading and bridge events"
```

---

### Task 0.5: Create TestScene and verify end-to-end bridge

**Files:**
- Create: `scenes/TestScene.ts`

A minimal scene that renders a colored rectangle and emits a score event — proving the full React→Phaser→React pipeline works.

- [x] **Step 1: Create TestScene**

Create `scenes/TestScene.ts`:

```typescript
import { SceneBridge } from './shared/SceneBridge';
import { GameStatus } from '../types';
import type { SceneInitData } from './shared/SceneBridge';

export default class TestScene extends SceneBridge {
  private scoreCounter = 0;

  init(data: SceneInitData): void {
    super.init(data);
  }

  create(): void {
    // Draw a colored rectangle to prove Phaser is rendering
    this.add.rectangle(
      this.cameras.main.centerX,
      this.cameras.main.centerY,
      400, 300,
      0x4488ff
    );

    this.add.text(
      this.cameras.main.centerX,
      this.cameras.main.centerY,
      `Phaser bridge test\nLevel: ${this.levelId}`,
      { fontSize: '24px', color: '#ffffff', align: 'center' }
    ).setOrigin(0.5);

    // Emit a score event every second to test the bridge
    this.time.addEvent({
      delay: 1000,
      loop: true,
      callback: () => {
        this.scoreCounter += 10;
        this.emitScoreUpdate({
          current: this.scoreCounter,
          high: this.scoreCounter,
          coins: 0,
          multiplier: 1,
          streak: 0,
          lives: 9,
        });
      },
    });

    this.emitStatusChange(GameStatus.PLAYING);
  }

  update(_time: number, _delta: number): void {
    // No-op for test scene
  }
}
```

- [x] **Step 2: Temporarily wire TestScene into App for manual verification**

In App.tsx, add a temporary test route: when `selectedLevel === 'BEACH'` and a flag is set, render `PhaserGame` with `sceneFactory={() => import('./scenes/TestScene')}` instead of `GameEngine`. This is a manual smoke test — remove after verification.

- [x] **Step 3: Manual verification**

```bash
npm run dev
```

Open browser → Start game → Verify:
1. Blue rectangle renders in the center
2. "Phaser bridge test / Level: BEACH" text appears
3. Score increments by 10 every second in the React HUD (if HUD is still visible)
4. Browser console has no errors
5. Resizing the window resizes the Phaser canvas

- [x] **Step 4: Verify production build works**

```bash
npm run build && npm run preview
```

Expected: Same behavior in production mode. Phaser chunk is a separate file in `dist/assets/`.

- [x] **Step 5: Revert App.tsx test wiring, keep TestScene for future dev use**

- [x] **Step 6: Commit**

```bash
git add scenes/TestScene.ts
git commit -m "feat(v3): add TestScene — verifies Phaser bridge end-to-end"
```

---

### Task 0.6: Update documentation

**Files:**
- Modify: `CLAUDE.md`
- Modify: `AGENTS.md` (twin doc — must stay in sync per `AGENTS.md:3`)

- [x] **Step 1: Add Phaser architecture section to CLAUDE.md and AGENTS.md**

Add a new section after "Architecture" in CLAUDE.md:

```markdown
### Phaser 3 Integration (V3)
- **`components/PhaserGame.tsx`** — React wrapper that mounts a Phaser.Game instance. Lazy-loads Phaser core + scene class via dynamic `import()`. Wires bridge events to React callbacks.
- **`scenes/shared/SceneBridge.ts`** — Base class for all Phaser scenes. Defines typed event protocol (`BRIDGE_EVENTS`), init data unpacking, and emitter helpers.
- **`scenes/<GenreName>Scene.ts`** — One Phaser scene per genre. Plain TypeScript classes (NOT React components). Use Phaser APIs, not React patterns.
- **Rendering rule:** All gameplay rendering is Phaser-native (Graphics, Sprites, Particles). React renders UI only (HUD, menus, cutscenes) overlaid on the Phaser canvas via absolute positioning.
- **Code splitting:** Each scene is a dynamic import. `PhaserGame` receives `sceneFactory: () => Promise<...>`. Never statically import all scene classes.
```

- [x] **Step 2: Mirror the same section into AGENTS.md**

CLAUDE.md and AGENTS.md are twin docs (see `AGENTS.md:3`). Add the same Phaser architecture section to AGENTS.md.

- [x] **Step 3: Commit**

```bash
git add CLAUDE.md AGENTS.md
git commit -m "docs: add Phaser architecture notes to CLAUDE.md and AGENTS.md"
```

---

### Task 0.7: Create SpriteLoader

**Files:**
- Create: `scenes/shared/SpriteLoader.ts`

The custom cat sprite is stored as a blob URL (from IndexedDB). Phaser needs this loaded as a texture.

- [x] **Step 1: Create SpriteLoader.ts**

```typescript
import Phaser from 'phaser';

const CAT_TEXTURE_KEY = 'cat-sprite';

/**
 * Load a blob URL (from IndexedDB cat sprite) into a Phaser texture.
 * Call in scene.preload(). The texture is available as CAT_TEXTURE_KEY in create().
 */
export function loadCatSprite(scene: Phaser.Scene, blobUrl: string | null): void {
  if (!blobUrl) return;
  scene.load.image(CAT_TEXTURE_KEY, blobUrl);
}

export { CAT_TEXTURE_KEY };
```

- [x] **Step 2: Commit**

```bash
git add scenes/shared/SpriteLoader.ts
git commit -m "feat(v3): add SpriteLoader — loads cat blob URL into Phaser texture"
```

---

### Task 0.8: Migrate persistence from defeatedBosses to completedLevels

**Files:**
- Modify: `services/levelProgress.ts`
- Create: `services/levelProgress.test.ts`
- Modify: `services/runOutcome.ts`

This migration is independent of the Phaser port — it updates the persistence layer to use the generic `completedLevels` key.

**Scope note:** This task covers ONLY the `defeatedBosses` → `completedLevels` rename and migration. It does NOT touch Hall of Fame semantics (those still use the existing `HighScoreEntry` shape) or `LevelResult` persistence (that's Task 0.9). These three concerns — unlock state, Hall of Fame, and per-level results — are independent persistence layers with separate storage keys and separate migration paths.

- [x] **Step 1: Write migration tests**

Create `services/levelProgress.test.ts`:

```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { loadCompletedLevels, saveCompletedLevels, COMPLETED_LEVELS_STORAGE_KEY } from './levelProgress';

beforeEach(() => localStorage.clear());

describe('completedLevels migration', () => {
  it('returns empty object when no keys exist', () => {
    expect(loadCompletedLevels()).toEqual({});
  });

  it('migrates from old defeatedBosses key', () => {
    localStorage.setItem('beach-cat-defeated-bosses-v1', JSON.stringify({ BEACH: true }));
    const result = loadCompletedLevels();
    expect(result).toEqual({ BEACH: true });
    // Old key should be removed
    expect(localStorage.getItem('beach-cat-defeated-bosses-v1')).toBeNull();
    // New key should exist
    expect(localStorage.getItem(COMPLETED_LEVELS_STORAGE_KEY)).not.toBeNull();
  });

  it('does not migrate if new key already exists', () => {
    localStorage.setItem('beach-cat-defeated-bosses-v1', JSON.stringify({ BEACH: true }));
    localStorage.setItem(COMPLETED_LEVELS_STORAGE_KEY, JSON.stringify({ BEACH: true, ROOFTOPS: true }));
    const result = loadCompletedLevels();
    expect(result).toEqual({ BEACH: true, ROOFTOPS: true });
  });

  it('handles corrupt old key gracefully', () => {
    localStorage.setItem('beach-cat-defeated-bosses-v1', 'not json');
    expect(loadCompletedLevels()).toEqual({});
  });
});
```

- [x] **Step 2: Run tests — verify they fail**

```bash
npm run test:run -- services/levelProgress.test.ts
```

- [x] **Step 3: Update levelProgress.ts**

Rename functions and add migration:

```typescript
import type { LevelId } from '../types';

const OLD_KEY = 'beach-cat-defeated-bosses-v1';
export const COMPLETED_LEVELS_STORAGE_KEY = 'beach-cat-completed-levels-v1';

export type CompletedLevelsState = Partial<Record<LevelId, boolean>>;

export function loadCompletedLevels(): CompletedLevelsState {
  try {
    // Check new key first
    const raw = localStorage.getItem(COMPLETED_LEVELS_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object') return parsed as CompletedLevelsState;
    }
    // Migrate from old key
    const oldRaw = localStorage.getItem(OLD_KEY);
    if (oldRaw) {
      const parsed = JSON.parse(oldRaw);
      if (parsed && typeof parsed === 'object') {
        const migrated = parsed as CompletedLevelsState;
        saveCompletedLevels(migrated);
        localStorage.removeItem(OLD_KEY);
        return migrated;
      }
    }
    return {};
  } catch {
    return {};
  }
}

export function saveCompletedLevels(state: CompletedLevelsState): void {
  try {
    localStorage.setItem(COMPLETED_LEVELS_STORAGE_KEY, JSON.stringify(state));
  } catch { /* ignore */ }
}
```

- [x] **Step 4: Update runOutcome.ts**

Replace `nextDefeatedBossesAfterVictory` with:

```typescript
export function nextCompletedLevelsAfterWin(
  prev: CompletedLevelsState,
  levelBeat: LevelId
): CompletedLevelsState {
  return { ...prev, [levelBeat]: true };
}
```

Update `mergeHallOfFameAfterRun` calls in App.tsx to pass `levelId`.

- [x] **Step 5: Update App.tsx references**

Replace all `defeatedBosses` state/usage with `completedLevels`. Replace `loadDefeatedBosses` with `loadCompletedLevels`.

- [x] **Step 6: Run all tests**

```bash
npm run test:run
```

- [x] **Step 7: Commit**

```bash
git add services/levelProgress.ts services/levelProgress.test.ts services/runOutcome.ts App.tsx
git commit -m "feat(v3): migrate defeatedBosses to completedLevels with migration path"
```

---

### Task 0.9: Create levelCompletion service

**Files:**
- Create: `services/levelCompletion.ts`
- Create: `services/levelCompletion.test.ts`

This service owns star calculation and per-level result persistence. `runOutcome.ts` continues to own Hall of Fame merge.

- [x] **Step 1: Write tests**

```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { computeStars, loadLevelResult, saveLevelResult } from './levelCompletion';

beforeEach(() => localStorage.clear());

describe('computeStars', () => {
  it('returns 1 star below threshold[1]', () => {
    expect(computeStars(50, [0, 100, 300])).toBe(1);
  });
  it('returns 2 stars at threshold[1]', () => {
    expect(computeStars(100, [0, 100, 300])).toBe(2);
  });
  it('returns 3 stars at threshold[2]', () => {
    expect(computeStars(300, [0, 100, 300])).toBe(3);
  });
  it('returns 3 stars above all thresholds', () => {
    expect(computeStars(999, [0, 100, 300])).toBe(3);
  });
});

describe('saveLevelResult best-of merge', () => {
  it('saves first result', () => {
    saveLevelResult({ levelId: 'BEACH', score: 100, stars: 1 });
    expect(loadLevelResult('BEACH')).toEqual({ levelId: 'BEACH', score: 100, stars: 1 });
  });
  it('keeps higher score', () => {
    saveLevelResult({ levelId: 'BEACH', score: 100, stars: 1 });
    saveLevelResult({ levelId: 'BEACH', score: 50, stars: 1 });
    expect(loadLevelResult('BEACH')!.score).toBe(100);
  });
  it('keeps higher stars independently', () => {
    saveLevelResult({ levelId: 'BEACH', score: 100, stars: 2 });
    saveLevelResult({ levelId: 'BEACH', score: 200, stars: 1 });
    const result = loadLevelResult('BEACH')!;
    expect(result.score).toBe(200); // higher score
    expect(result.stars).toBe(2);   // higher stars (independent)
  });
});
```

- [x] **Step 2: Run tests — verify they fail**

```bash
npm run test:run -- services/levelCompletion.test.ts
```

- [x] **Step 3: Implement levelCompletion.ts**

```typescript
import type { LevelId, LevelResult } from '../types';

function storageKey(levelId: LevelId): string {
  return `beach-cat-level-result-${levelId}-v1`;
}

export function computeStars(
  score: number,
  thresholds: [number, number, number]
): 1 | 2 | 3 {
  if (score >= thresholds[2]) return 3;
  if (score >= thresholds[1]) return 2;
  return 1;
}

export function loadLevelResult(levelId: LevelId): LevelResult | null {
  try {
    const raw = localStorage.getItem(storageKey(levelId));
    if (!raw) return null;
    return JSON.parse(raw) as LevelResult;
  } catch {
    return null;
  }
}

export function saveLevelResult(result: LevelResult): void {
  const existing = loadLevelResult(result.levelId);
  const merged: LevelResult = existing
    ? {
        levelId: result.levelId,
        score: Math.max(existing.score, result.score),
        stars: Math.max(existing.stars, result.stars) as 1 | 2 | 3,
      }
    : result;
  try {
    localStorage.setItem(storageKey(result.levelId), JSON.stringify(merged));
  } catch { /* ignore */ }
}
```

- [x] **Step 4: Run tests — verify they pass**

```bash
npm run test:run -- services/levelCompletion.test.ts
```

- [x] **Step 5: Commit**

```bash
git add services/levelCompletion.ts services/levelCompletion.test.ts
git commit -m "feat(v3): add levelCompletion service — star calculation, best-of result persistence"
```

---

## Chunk 2: Phase 1 — Port Level 1 (Beach Runner) to Phaser — COMPLETE (2026-03-22)

**Goal:** Reimplement the current `GameEngine.tsx` as a Phaser `RunnerScene` with feel-identical gameplay. Physics constants, timing, scoring, and boss mechanics must match. Visuals use Phaser's native renderer.

**Risk:** This is the largest single phase. `GameEngine.tsx` is ~1,630 lines of tightly coupled logic. The port is broken into sub-tasks by system.

> **Completion notes (2026-03-24 audit):** All tasks (1.1–1.12, 1.14) were implemented during Phase 1 + Phase 1.5 sessions. The implementation didn't follow the sub-step order exactly — many systems were built concurrently during the visual polish pass. RunnerScene.ts is the fully working Phaser port (~1,800 lines). Two minor deferrals:
> - **Telemetry** (Task 1.12 area): Bridge events emit to React, but `runTelemetry()` analytics logger not yet wired into RunnerScene (TODO at ~line 216).
> - **Speed lines** (Task 1.8): Not ported. All other visual effects (shake, flash, freeze, particles, dust, floating scores) are working.
> - **Task 1.13** (archive GameEngine): intentionally NOT done yet — fallback policy says to keep it until parity is proven in production.
>
> See "Beach Port Exit Criteria" section above for the full item-by-item status.

### Task 1.1: Create RunnerScene skeleton

**Files:**
- Create: `scenes/RunnerScene.ts`

- [ ] **Step 1: Create the scene file with lifecycle stubs**

```typescript
import { SceneBridge } from './shared/SceneBridge';
import type { SceneInitData } from './shared/SceneBridge';

export default class RunnerScene extends SceneBridge {
  init(data: SceneInitData): void {
    super.init(data);
  }

  preload(): void {
    // Load cat sprite, obstacle textures, audio — filled in later
  }

  create(): void {
    // Set up world, player, spawners, input, HUD bridge — filled in later
    this.add.text(100, 100, 'RunnerScene: skeleton', { color: '#fff' });
  }

  update(time: number, delta: number): void {
    // Main game loop — filled in later
  }
}
```

- [ ] **Step 2: Verify it loads via PhaserGame**

Temporarily wire RunnerScene into the App (same approach as TestScene). Verify the skeleton text renders. Revert.

- [ ] **Step 3: Commit**

```bash
git add scenes/RunnerScene.ts
git commit -m "feat(v3/phase1): add RunnerScene skeleton"
```

---

### Task 1.2: Port player physics

**Files:**
- Modify: `scenes/RunnerScene.ts`

Port gravity, jump, double-jump, ducking from GameEngine. The player is a Phaser sprite with Arcade Physics body.

Key constants to preserve from `GameEngine.tsx` and `defaultTuning.ts`:
- `gravity: 0.75` (per-frame, not Phaser's pixels/sec² — will need conversion)
- `jumpForce: 17` (per-frame impulse)
- `groundY: 100` (from bottom)
- `maxJumps: 2` (double jump)
- Duck: shrinks hitbox height, moves Y down

- [ ] **Step 1: Set up Phaser Arcade Physics for the player**

In `create()`, create a player sprite. Use `this.physics.add.sprite()`. Set gravity, max velocity. The player's ground position is `this.cameras.main.height - groundY`.

The current engine uses per-frame physics (vy += gravity each frame at 60fps). Phaser Arcade uses pixels/sec². Convert:
- Phaser gravity Y = `gravity * 60 * 60` = `0.75 * 3600` = `2700` pixels/sec²
- Phaser jump velocity = `-jumpForce * 60` = `-17 * 60` = `-1020` pixels/sec

**Important:** Phaser Arcade Physics runs at a fixed 60Hz timestep by default. Verify this matches by checking `this.physics.world.fps` equals 60. If not, set it: `this.physics.world.setFPS(60)`. If the timestep drifts, jump heights will not match the DOM version.

- [ ] **Step 2: Implement jump and double-jump**

On spacebar/up arrow press: if `jumpCount < 2`, set `vy = -jumpVelocity`, increment `jumpCount`. On landing (body.touching.down or y >= groundY), reset `jumpCount = 0`.

- [ ] **Step 3: Implement ducking**

On down arrow hold: shrink the physics body height (e.g., from 100 to 60), shift body offset. On release: restore. While ducking, the cat sprite compresses (squash animation).

- [ ] **Step 4: Verify physics feel matches**

Play the current DOM version and the Phaser version side by side. Verify:
- Jump apex height within 5% tolerance of DOM version
- Float time (jump to landing) within 5% tolerance
- Double-jump window feels identical
- Duck response is instant on keydown, restore on keyup

If values drift, check `this.physics.world.fps === 60` and adjust gravity/velocity constants.

- [ ] **Step 5: Commit**

```bash
git add scenes/RunnerScene.ts
git commit -m "feat(v3/phase1): port player physics — gravity, jump, duck"
```

---

### Task 1.3: Port obstacle spawning and scrolling

**Files:**
- Modify: `scenes/RunnerScene.ts`

Port the obstacle spawn system: weighted random pool, pattern queue, life-assist scaling, and auto-scroll movement.

- [ ] **Step 1: Create obstacle graphics**

For each `ObstacleDefinition` in the beach level config, create a Phaser `Graphics` texture or use Gemini-generated sprites. Register each as a texture key (e.g., `'obs-CRAB'`, `'obs-SANDCASTLE'`). Initially, use colored rectangles matching each obstacle's dimensions — art can be refined later.

- [ ] **Step 2: Implement the spawn timer**

Port the spawn interval logic from GameEngine. Use `this.time.addEvent()` with a callback that picks the next obstacle from the weighted pool or pattern queue.

- [ ] **Step 3: Implement pattern queue**

Port pattern logic: when `levelConfig.patterns` exist and a pattern trigger fires, clone a pattern into the spawn queue. Steps execute with their `delay` spacing.

- [ ] **Step 4: Implement auto-scroll movement**

Obstacles move left at `speed`. Use a Phaser group with `setVelocityX(-speed * 60)`. Remove obstacles that scroll off the left edge.

- [ ] **Step 5: Implement life-assist scaling**

Port the logic that reduces spawn difficulty when the player is low on lives (wider gaps, fewer hard obstacles).

- [ ] **Step 6: Verify spawn rates and obstacle variety match**

Play both versions. Obstacle frequency, variety, and pattern timing should feel the same.

- [ ] **Step 7: Commit**

```bash
git add scenes/RunnerScene.ts
git commit -m "feat(v3/phase1): port obstacle spawning — weighted pool, patterns, life-assist"
```

---

### Task 1.4: Port collectibles and scoring

**Files:**
- Modify: `scenes/RunnerScene.ts`

Port coins, shells, power-ups (SPEED, MAGNET, SUPER_SIZE), and the scoring/multiplier system.

- [ ] **Step 1: Add collectible sprites to the spawn pool**

Coins and shells spawn as Phaser sprites. Power-ups spawn on threshold/streak triggers.

- [ ] **Step 2: Port scoring math**

Coins = 1 point, shells = 5, multiplier scales with streak. Port the exact formulas from GameEngine.

- [ ] **Step 3: Port power-up effects**

- SPEED: increase scroll speed by ~1.7x for duration
- MAGNET: attract `magnetAttractTypes` entities toward player
- SUPER_SIZE: scale player sprite up, grant invincibility

- [ ] **Step 4: Emit score updates via bridge**

Call `this.emitScoreUpdate(score)` whenever score changes. Verify React HUD updates.

- [ ] **Step 5: Commit**

```bash
git add scenes/RunnerScene.ts
git commit -m "feat(v3/phase1): port collectibles and scoring — coins, shells, power-ups, multiplier"
```

---

### Task 1.5: Port collision detection

**Files:**
- Modify: `scenes/RunnerScene.ts`

Port AABB collision with forgiveness padding. Wire to `collisionHandlers.ts` logic (bounce, slow, harmful).

- [ ] **Step 1: Set up Phaser overlap/collider groups**

Create groups: `obstacleGroup`, `collectibleGroup`. Add `this.physics.add.overlap(player, collectibleGroup, collectCallback)` and `this.physics.add.overlap(player, obstacleGroup, obstacleCallback)`.

- [ ] **Step 2: Implement forgiveness padding**

Phaser's default overlap uses sprite bounds. To match the current AABB forgiveness, shrink physics bodies by the forgiveness amount (e.g., `body.setSize(w - forgiveness*2, h - forgiveness*2)`).

- [ ] **Step 3: Wire collision handlers**

On obstacle overlap, determine the collision type from `ObstacleDefinition.behaviors`:
- `bounce`/`stomp`: call `handleBounceCollision` logic
- `slowOnContact`: call `handleSlowCollision` logic
- harmful: call `handleHarmfulCollision` logic (lose life, hurt animation)

- [ ] **Step 4: Verify collision feel matches**

Collisions should feel the same — same forgiveness, same stomp/bounce behavior, same damage.

- [ ] **Step 5: Commit**

```bash
git add scenes/RunnerScene.ts
git commit -m "feat(v3/phase1): port collision detection with forgiveness padding"
```

---

### Task 1.6: Port seagull behaviors

**Files:**
- Modify: `scenes/RunnerScene.ts`

Port swoop (dive) and poop-drop seagull variants using `systems/behaviors.ts`.

- [ ] **Step 1: Implement seagull spawn variants**

Use `pickSeagullSpawnVariant()` to determine dive vs poop. Spawn as Phaser sprites with appropriate movement.

- [ ] **Step 2: Port swoop trajectory**

Use `computeSwoopY()` from `systems/behaviors.ts` to calculate Y position per frame. Apply to the seagull sprite.

- [ ] **Step 3: Port poop drop**

Use `checkPoopDrop()` — when triggered, spawn a `SAND_PROJECTILE` sprite that falls with gravity.

- [ ] **Step 4: Commit**

```bash
git add scenes/RunnerScene.ts
git commit -m "feat(v3/phase1): port seagull swoop and poop-drop behaviors"
```

---

### Task 1.7: Port boss fight

**Files:**
- Modify: `scenes/RunnerScene.ts`

Port the Sand Monster boss: spawn trigger, movement (sway + bob), projectile arcs, health, defeat.

- [ ] **Step 1: Implement boss spawn trigger**

When coins >= `bossEntryCoinThreshold`, transition to boss mode. Stop normal obstacle spawning. Emit `GameStatus.BOSS_FIGHT` via bridge.

- [ ] **Step 2: Port boss movement**

Use `computeBossWorldPose()` from `systems/bossSystem.ts` for sway + bob. Render boss as a Phaser sprite with the computed position.

- [ ] **Step 3: Port boss projectiles**

Use `createBossProjectileObstacle()` for arc projectile spawning. Projectiles use `arcProjectile` behavior — parabolic trajectory toward the player.

- [ ] **Step 4: Port boss health and damage**

Player bullets (from jumping/stomping?) damage boss. Track `health`, show health bar. On defeat, emit `LevelCompletePayload` with `victoryType: 'boss'`.

- [ ] **Step 5: Port boss defeat animation**

Screen shake, particles, freeze frame. Boss sprite fades/falls. Transition to victory state.

- [ ] **Step 6: Commit**

```bash
git add scenes/RunnerScene.ts
git commit -m "feat(v3/phase1): port boss fight — Sand Monster, projectiles, health, defeat"
```

---

### Task 1.8: Port visual effects

**Files:**
- Create: `scenes/shared/EffectsManager.ts`
- Modify: `scenes/RunnerScene.ts`

Port particles, screen shake, hit flash, speed lines, freeze frames.

- [ ] **Step 1: Create EffectsManager**

```typescript
import Phaser from 'phaser';

export class EffectsManager {
  constructor(private scene: Phaser.Scene) {}

  shake(intensity: number = 0.01, duration: number = 100): void {
    this.scene.cameras.main.shake(duration, intensity);
  }

  flash(color: number = 0xffffff, duration: number = 100): void {
    this.scene.cameras.main.flash(duration, (color >> 16) & 0xff, (color >> 8) & 0xff, color & 0xff);
  }

  freezeFrame(durationMs: number = 50): void {
    this.scene.physics.pause();
    this.scene.time.delayedCall(durationMs, () => this.scene.physics.resume());
  }

  /** Call once in scene preload to create the shared particle texture */
  static createParticleTexture(scene: Phaser.Scene): void {
    if (!scene.textures.exists('particle')) {
      const g = scene.make.graphics({ add: false });
      g.fillStyle(0xffffff);
      g.fillCircle(4, 4, 4);
      g.generateTexture('particle', 8, 8);
      g.destroy();
    }
  }

  spawnParticles(x: number, y: number, color: number, count: number = 10): void {
    const particles = this.scene.add.particles(x, y, 'particle', {
      speed: { min: 50, max: 200 },
      scale: { start: 0.5, end: 0 },
      lifespan: 500,
      quantity: count,
      tint: color,
      emitting: false,
    });
    particles.explode(count);
    this.scene.time.delayedCall(600, () => particles.destroy());
  }
}
```

- [ ] **Step 2: Wire into RunnerScene**

Create `this.effects = new EffectsManager(this)` in `create()`. Call on collision, boss hits, coin collection, etc.

- [ ] **Step 3: Port speed lines**

When game speed exceeds `theme.speedLineThreshold`, draw semi-transparent horizontal lines moving right-to-left across the viewport.

- [ ] **Step 4: Commit**

```bash
git add scenes/shared/EffectsManager.ts scenes/RunnerScene.ts
git commit -m "feat(v3/phase1): add EffectsManager — shake, flash, freeze, particles"
```

---

### Task 1.9: Port background parallax

**Files:**
- Modify: `scenes/RunnerScene.ts`

Port background entity spawning (boats, surfers, planes, clouds, jetskis) with parallax depth layers.

- [ ] **Step 1: Port background entity system**

Use `spawnBackgroundEntities()` from `systems/backgroundSpawn.ts` to determine what to spawn. Create Phaser sprites at appropriate depths (`far` = back, `near` = front) using `setDepth()`.

- [ ] **Step 2: Implement parallax scroll**

Far entities move slower (speed × 0.3), mid entities at (speed × 0.6), near at (speed × 0.9). Apply as velocity to each group.

- [ ] **Step 3: Port boss-fight chaos spawns**

During boss mode, switch to chaos spawn types (sinking boats, burning planes) per `backgroundConfig.chaosSpawnTypes`.

- [ ] **Step 4: Commit**

```bash
git add scenes/RunnerScene.ts
git commit -m "feat(v3/phase1): port background parallax with depth layers"
```

---

### Task 1.10: Port audio to Phaser's AudioContext

**Files:**
- Create: `scenes/shared/PhaserAudio.ts`
- Modify: `scenes/RunnerScene.ts`

Migrate music and SFX into Phaser's audio system (single AudioContext).

- [ ] **Step 1: Create PhaserAudio service**

```typescript
import Phaser from 'phaser';

/**
 * Unified audio through Phaser's AudioContext.
 * Music: pre-composed tracks loaded via Phaser's audio loader.
 * SFX: procedural Web Audio nodes routed through Phaser's context.
 */
export class PhaserAudio {
  private scene: Phaser.Scene;
  private audioCtx: AudioContext | null = null;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    // Access Phaser's AudioContext for procedural SFX
    this.audioCtx = (scene.sound as any).context ?? null;
  }

  /** Play a procedural SFX (coin, jump, hit, etc.) */
  playSfx(type: string, opts: { isBossFight: boolean } = { isBossFight: false }): void {
    if (!this.audioCtx) return;
    // Port procedural SFX logic from sfxService.ts here
    // (sine/triangle oscillators, gain envelopes, per-type tuning)
    const t0 = this.audioCtx.currentTime;
    const osc = this.audioCtx.createOscillator();
    const gain = this.audioCtx.createGain();
    osc.connect(gain);
    gain.connect(this.audioCtx.destination);

    // Type-specific tuning (port from sfxService.ts)
    if (type === 'coin') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, t0);
      osc.frequency.exponentialRampToValueAtTime(1320, t0 + 0.1);
      gain.gain.setValueAtTime(0.05, t0);
      gain.gain.exponentialRampToValueAtTime(0.001, t0 + 0.2);
      osc.start(t0);
      osc.stop(t0 + 0.2);
    }
    // ... port remaining SFX types
  }

  /** Load and play a music track for a level */
  playMusic(key: string): void {
    if (this.scene.sound.get(key)) {
      this.scene.sound.play(key, { loop: true, volume: 0.3 });
    }
  }

  stopMusic(): void {
    this.scene.sound.stopAll();
  }
}
```

- [ ] **Step 2: Wire PhaserAudio into RunnerScene**

Replace all `playProceduralGameSfx` and `startMusic`/`stopMusic` calls with `PhaserAudio` methods.

- [ ] **Step 3: Verify audio works**

Coin sounds, jump sounds, boss music transition, game over — all audible, no console errors, no dual-context warnings.

- [ ] **Step 4: Commit**

```bash
git add scenes/shared/PhaserAudio.ts scenes/RunnerScene.ts
git commit -m "feat(v3/phase1): migrate audio to Phaser's AudioContext — single context for music + SFX"
```

---

### Task 1.11: Wire input

**Files:**
- Modify: `scenes/RunnerScene.ts`

- [ ] **Step 1: Keyboard input**

```typescript
// In create():
this.cursors = this.input.keyboard!.createCursorKeys();
this.spaceKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
this.pauseKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.P);
this.escKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.ESC);
```

In `update()`: check `Phaser.Input.Keyboard.JustDown(this.spaceKey)` for jump, `this.cursors.down.isDown` for duck, P/Esc for pause.

- [ ] **Step 2: Basic touch input (best-effort)**

Left half of screen = jump, right half = duck. Use `this.input.on('pointerdown', ...)`.

- [ ] **Step 3: Pause/resume**

On P or Esc: toggle `this.scene.pause()` / `this.scene.resume()`. Emit status change so React can overlay a pause screen.

- [ ] **Step 4: Commit**

```bash
git add scenes/RunnerScene.ts
git commit -m "feat(v3/phase1): wire keyboard + touch input for runner"
```

---

### Task 1.12: Wire App.tsx to PhaserGame

**Files:**
- Modify: `App.tsx`

Replace the `GameEngine` component with `PhaserGame` for the BEACH level. The persistence migration (defeatedBosses → completedLevels) was already done in Task 0.8.

- [ ] **Step 1: Replace GameEngine mount**

In the `PLAYING`/`BOSS_FIGHT` render branch of App.tsx, replace:

```tsx
<GameEngine ... />
```

With:

```tsx
<PhaserGame
  levelId={selectedLevel}
  catSpriteUrl={customCatUrl}
  sceneInitData={{
    levelConfig,
    initialLives: score.lives,
    startAtBoss,
    tuning: mergedTuning,
    equippedMattedState,
    onTelemetryReady: handleTelemetryReady,
  }}
  sceneFactory={() => import('./scenes/RunnerScene')}
  onScoreUpdate={handleScoreUpdate}
  onLevelComplete={handleLevelComplete}
  onGameOver={handleGameOver}
  onStatusChange={handleStatusChange}
/>
```

**Note on actual app state:** The roadmap previously referenced `mattedCatUrl`, but the current App.tsx uses `customCatUrl` (raw sprite URL from state) plus `equippedMattedState` (from `useMatteCatUrl`). The scene receives the raw URL and handles matting via `SpriteLoader`, or receives the pre-matted state — whichever approach is cleaner after the `SpriteLoader` is implemented.

**Note on `sceneFactory`:** The inline arrow function `() => import(...)` creates a new function identity on every render, but this is safe — `PhaserGame` reads it from `propsRef.current` inside the boot closure, and the effect depends only on `levelId`. The factory is never compared by reference.

**Note on `sceneInitData`:** This is the runner-specific opaque bag. `PhaserGame` does not type-check its contents — `RunnerScene.init()` downcasts it to `RunnerSceneInitData`.

- [ ] **Step 2: Add handleLevelComplete**

Replace `handleVictoryFinalize` with `handleLevelComplete` that:
1. Updates `completedLevels` via `nextCompletedLevelsAfterWin` (already migrated in Task 0.8)
2. Adds Hall of Fame entry with `levelId`
3. Persists `LevelResult` via `saveLevelResult` (best-of merge from `levelCompletion.ts`)
4. Sets status to `VICTORY`

- [ ] **Step 3: Run tests**

```bash
npm run test:run
```

Fix any test failures caused by renamed functions/types.

- [ ] **Step 7: Full manual QA**

Play through the beach level start-to-finish in the Phaser version. Verify:
- Jump/duck/double-jump feel matches
- Obstacles spawn at correct rates
- Collectibles score correctly
- Power-ups work (speed, magnet, super size)
- Boss triggers at correct coin count
- Boss projectiles arc correctly
- Boss defeat triggers victory
- Hall of Fame entry is created
- Score and lives update in HUD
- Pause/resume works
- No console errors

- [ ] **Step 8: Commit**

```bash
git add App.tsx services/levelProgress.ts services/runOutcome.ts types.ts
git commit -m "feat(v3/phase1): wire App to PhaserGame, replace GameEngine for BEACH level"
```

---

### Task 1.14: Beach Sprite Requirements

> **Sprite contract for Level 1 — Beach Runner.** See "Character Sprite System" section for the shared architecture.

**Required sprites for runner genre:**

| `poseId` | Description | Used for |
|----------|-------------|----------|
| `run` | Side-running with legs in motion cycle (2–4 frames) | Default ground locomotion |
| `jump` | Legs tucked, body arched upward | Jump / double-jump apex |
| `duck` | Crouched low, body compressed horizontally | Duck under seagulls |
| `hit` | Flinch/tumble, expressive pain reaction | Taking damage |
| `idle` | Standing still, tail swish or blink | Pre-game, pause, level intro |

**Prompt strategy:**
- Base prompt = equipped cat's description + "same character, same colors, same art style"
- Pose addendum = per-row description above (e.g., "side view, running with legs mid-stride, 128×128 transparent PNG")
- Art style constraint: pixel-art or clean cartoon at game scale (128×128 or 256×256) — determined during implementation

**Validation criteria:**
- [ ] Each generated sprite reads clearly at 960×720 game resolution
- [ ] Character is recognizably the same cat across all 5 poses
- [ ] Transparent background (server matting pipeline handles cleanup)
- [ ] Sprites load into Phaser texture cache via `SpriteLoader`

**Fallback:** If any pose is missing, the base equipped sprite is used for that animation state. Game is always playable with a single sprite.

**Scope note:** This task defines the sprite list and validates generation quality. The sprite generation pipeline itself (IndexedDB multi-key storage, closet UI for level sprites, lazy generation on level start) is built in Phase 3, which now replaces the old `catPoseTransforms` approach. Beach can ship Phase 1 with single-sprite fallback; multi-sprite enhances it afterward.

---

### Task 1.13: Archive GameEngine and old audio services (CONDITIONAL — do not rush)

> **GATE:** This task is blocked until BOTH conditions are met:
> 1. **BEACH parity proven** — all items in the "Beach Port Exit Criteria" section above are checked off.
> 2. **Bridge reuse proven** — at least one additional scene (Level 2 Platformer skeleton, Phase 4 Task 4.1) successfully loads through `PhaserGame.tsx`, confirming the bridge is not accidentally coupled to runner assumptions.
>
> Until then, the DOM runner remains available behind the `USE_PHASER_RUNNER` feature flag (see Fallback Policy). Do not delete or move these files prematurely.

**Files:**
- Modify: `components/GameEngine.tsx` → move to `components/_archive/GameEngine.tsx`
- Modify: `services/audioService.ts` → move to `services/_archive/audioService.ts`
- Modify: `services/sfxService.ts` → move to `services/_archive/sfxService.ts`

- [ ] **Step 0: Verify gate conditions**

Before proceeding, confirm:
- [ ] All "Beach Port Exit Criteria" items are checked
- [ ] Level 2 skeleton loads and renders via PhaserGame (even just a text label)
- [ ] `USE_PHASER_RUNNER=false` flag still works and falls back to DOM runner

- [ ] **Step 1: Remove the feature flag**

Delete the `USE_PHASER_RUNNER` toggle and the DOM runner code path from `App.tsx`. The Phaser runner is now the only path.

- [ ] **Step 2: Move files to archive directory**

```bash
mkdir -p components/_archive services/_archive
git mv components/GameEngine.tsx components/_archive/GameEngine.tsx
git mv services/audioService.ts services/_archive/audioService.ts
git mv services/sfxService.ts services/_archive/sfxService.ts
```

- [ ] **Step 3: Remove imports of archived files**

Find and remove all imports of `GameEngine`, `audioService`, and `sfxService` from active code.

- [ ] **Step 4: Run tests + build**

```bash
npm run test:run && npm run build
```

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "chore(v3/phase1): archive GameEngine and old audio services — Phaser parity confirmed + bridge reuse proven"
```

---

## Chunk 3: Phase 2 — Campaign Screen + Cutscene System

**Goal:** Replace the flat level-selection UI with the Nine Lives campaign tree. Add a cutscene player.

### Task 2.1: Create CampaignScreen component

**Files:**
- Create: `components/CampaignScreen.tsx`
- Modify: `App.tsx` — replace `LevelSelection` with `CampaignScreen`

- [ ] **Step 1: Create CampaignScreen.tsx**

A vertical cat tree with 9 branches. Each branch shows:
- Ghostly paw print (locked)
- Glowing paw (unlocked but not cleared)
- Trophy paw with stars (cleared — show 1-3 stars from `LevelResult`)

The cat sprite sits on the highest cleared branch.

Props: `completedLevels`, `levelResults`, `equippedCatUrl`, `onSelectLevel`, `onCustomize`.

- [ ] **Step 2: Wire into App.tsx**

Replace `<LevelSelection ... />` with `<CampaignScreen ... />` in the `CAMPAIGN` status branch.

- [ ] **Step 3: Implement level selection**

Clicking an unlocked branch calls `onSelectLevel(levelId)`. Locked branches show a tooltip ("Clear [previous level] to unlock").

- [ ] **Step 4: Wire to levelCompletion service**

Use `loadLevelResult(levelId)` from `services/levelCompletion.ts` (created in Task 0.9) to read star data for each branch.

- [ ] **Step 5: Commit**

```bash
git add components/CampaignScreen.tsx App.tsx
git commit -m "feat(v3/phase2): add CampaignScreen with nine-branch cat tree and per-level star display"
```

---

### Task 2.2: Create CutscenePlayer component

**Files:**
- Create: `components/CutscenePlayer.tsx`
- Modify: `App.tsx` — add `CUTSCENE` status handling

- [ ] **Step 1: Create CutscenePlayer.tsx**

Renders `CutsceneConfig.frames` sequentially:
- `text` frames: display text over a background image with fade/slide transitions
- `video` frames: play video produced via `demo-video-factory-catrunner/` pipeline (DaVinci Resolve → export → `assets/cutscenes/`). Use `<video>` element with `subtitles` as optional `<track>`.
- Each frame auto-advances after `durationMs` (text) or video end (video), or on click/spacebar to skip

Props: `config: CutsceneConfig`, `onComplete: () => void`.

- [ ] **Step 2: Wire CUTSCENE status into App.tsx**

Add to the state machine:
- Before first play of a level: check if `levelConfig.cutscene?.intro` exists → show cutscene
- After level completion (before showing VICTORY): check `levelConfig.cutscene?.outro`
- `CUTSCENE` status renders `<CutscenePlayer config={...} onComplete={...} />`

- [ ] **Step 3: Write placeholder cutscene for Level 1**

Add to `levels/beach.ts`:

```typescript
cutscene: {
  intro: {
    frames: [
      { type: 'text', text: 'A cat falls asleep on the warm sand...', durationMs: 3000, transition: 'fade' },
      { type: 'text', text: 'In its dream, the beach stretches on forever.', durationMs: 3000, transition: 'fade' },
      { type: 'text', text: 'Run, kitty. Run.', durationMs: 2000, transition: 'fade' },
    ],
  },
},
```

- [ ] **Step 4: Verify cutscene plays before Level 1**

```bash
npm run dev
```

Start game → cutscene plays → transitions to gameplay.

- [ ] **Step 5: Commit**

```bash
git add components/CutscenePlayer.tsx App.tsx levels/beach.ts
git commit -m "feat(v3/phase2): add CutscenePlayer and wire CUTSCENE status into App state machine"
```

---

### Task 2.3: Archive LevelSelection

**Files:**
- Move: `components/LevelSelection.tsx` → `components/_archive/LevelSelection.tsx`

- [ ] **Step 1: Move and clean up imports**

```bash
git mv components/LevelSelection.tsx components/_archive/LevelSelection.tsx
```

Remove all active imports of `LevelSelection`.

- [ ] **Step 2: Commit**

```bash
git add -A
git commit -m "chore(v3/phase2): archive LevelSelection — replaced by CampaignScreen"
```

---

## Chunk 4: Phase 3 — Character Sprite Generation Pipeline

**Goal:** Build the infrastructure for AI-generated, per-level sprite sets. Replaces the original `catPoseTransforms` approach (programmatic crop/flip) with purpose-built sprite generation from the player's character design.

### Task 3.1: Extend IndexedDB storage for level sprites

**Files:**
- Modify: `services/catAssetStore.ts`
- Test: `services/catAssetStore.test.ts`

- [ ] **Step 1: Add compound-key sprite storage**

Extend the existing `putCatSprite` / `getCatSprite` / `deleteCatSprite` to support level-scoped keys:

```typescript
// Key format: {catDesignId}:{levelId}:{poseId}
// e.g., "cat-abc123:BEACH:run"
export function levelSpriteKey(catDesignId: string, levelId: string, poseId: string): string {
  return `${catDesignId}:${levelId}:${poseId}`;
}

// Get all level sprites for a cat design (prefix scan)
export async function getLevelSprites(db: IDBDatabase, catDesignId: string, levelId: string): Promise<Map<string, Blob>>;

// Delete all derivatives when a cat design is removed from closet
export async function deleteCatDesignSprites(db: IDBDatabase, catDesignId: string): Promise<void>;
```

- [ ] **Step 2: Write tests for compound-key operations**
- [ ] **Step 3: Commit**

### Task 3.2: Create sprite generation service

**Files:**
- Create: `services/catSpriteGenerator.ts`
- Test: `services/catSpriteGenerator.test.ts`

- [ ] **Step 1: Define SpriteSpec type and generation interface**

```typescript
export interface SpriteSpec {
  poseId: string;
  description: string;       // Human-readable ("side-running with legs mid-stride")
  promptAddendum: string;    // Appended to base character prompt for Gemini
  dimensions?: { width: number; height: number };  // Default: 256×256
}

export interface SpriteGenerationResult {
  poseId: string;
  blob: Blob | null;           // null on failure
  cached: boolean;             // true if loaded from IndexedDB
  error?: string;
}
```

- [ ] **Step 2: Implement generation — one pose at a time through existing `/api/cat/generate` pipeline**

The generator reuses the existing Gemini image generation endpoint. The base cat description + pose-specific prompt addendum form the full prompt. Server matting pipeline applies as usual.

- [ ] **Step 3: Implement cache-first loading** — check IndexedDB before calling Gemini
- [ ] **Step 4: Write tests (mock Gemini calls, verify caching)**
- [ ] **Step 5: Commit**

### Task 3.3: Integrate with PhaserGame bridge

**Files:**
- Modify: `components/PhaserGame.tsx`
- Modify: `scenes/shared/SpriteLoader.ts`

- [ ] **Step 1: SpriteLoader accepts multiple sprite URLs** (keyed by poseId)
- [ ] **Step 2: PhaserGame resolves level sprites before scene boot** — loads from cache or falls back to base sprite
- [ ] **Step 3: Scene receives a sprite map** (`Record<string, string>` of poseId → blob URLs) in init data
- [ ] **Step 4: Commit**

### Task 3.4: Update Closet UI for multi-sprite awareness

**Files:**
- Modify: `components/CatCustomizer.tsx`

- [ ] **Step 1: Show generated level sprites** under each saved cat (collapsible gallery)
- [ ] **Step 2: Add "generate for level" action** — lets player pre-generate sprites for a specific level
- [ ] **Step 3: Cascade delete** — removing a cat design deletes all its level sprites
- [ ] **Step 4: Commit**

### Task 3.5: Level config declares requiredSprites

**Files:**
- Modify: `types.ts` — add `SpriteSpec[]` to level config types
- Modify: `levels/beach.ts` — add Beach runner sprite specs (from Task 1.14)

- [ ] **Step 1: Add `requiredSprites` field to level config type**
- [ ] **Step 2: Populate Beach config with runner sprite specs**
- [ ] **Step 3: Verify Beach level loads with multi-sprite pipeline (sprites generate or fallback)**
- [ ] **Step 4: Run full test suite, commit**

---

## Chunk 5: Phases 4–8 — Genre Levels — SKELETONS COMPLETE (2026-03-24)

**Goal:** Build the remaining 8 genre levels. Each follows the same pattern.

> **Implementation notes (2026-03-24):** All 8 genre levels built as playable skeletons in a single sprint session. Each has core mechanics, scoring, victory conditions, and pause/resume. The implementation skipped the roadmap's granular sub-steps (sprite requirements, boss encounters, cutscenes, detailed QA) — those are polish items for future sessions. What's done per level:
> - **Config + types** — each genre has its own `*LevelConfig` interface in the `AnyLevelConfig` discriminated union
> - **Scene + core mechanic** — each scene extends `SceneBridge`, implements the genre's unique gameplay loop
> - **Wired into App** — genre-keyed scene factory, registered in `LEVEL_REGISTRY` and `LEVEL_ORDER`
> - **Victory/death** — each level has a win condition and death/respawn handling
>
> **Not done yet (per level):** Sprite art (all use colored rectangles), boss encounters (except shooter), cutscenes, audio per genre, difficulty tuning, power-ups, enemies beyond basics. These are Phase 9 polish items or can be addressed incrementally.

### Genre Level Template

Every new level follows this structure:

1. **Create level config** (`levels/<name>.ts`) — define `LevelConfigBase` + genre-specific fields
2. **Define sprite requirements** — what poses/animations does the cat need in this genre? Add `requiredSprites` to config, write prompt addendums, validate generation quality (see "Character Sprite System" section)
3. **Create Phaser scene** (`scenes/<Name>Scene.ts`) — extend `SceneBridge`, implement `preload`/`create`/`update`
4. **Implement core mechanic** — the unique gameplay system for this genre
5. **Add art** — Phaser graphics primitives + Gemini-generated sprites where needed
6. **Add boss/victory condition** — genre-appropriate win state
7. **Wire into App** — add scene factory to `PhaserGame`, add to `LEVEL_ORDER`, register in `LEVEL_REGISTRY`
8. **Write cutscene** — placeholder intro/outro text
9. **QA + commit** — verify sprites load, animations play, fallback works

### Task 4.1: Level 2 config + PlatformerScene skeleton — DONE (2026-03-24)
> Procedural platforms (not static arrays as spec'd). Mario-style L/R/jump, coins, parallax city buildings, distance-based victory. Design diverged from roadmap: procedural generation instead of hand-placed platforms, no enemies/boss yet.

**Sprite Requirements (defined during implementation):**
- `idle` — standing on rooftop, alert posture
- `walk` — side-view walking cycle
- `jump` — mid-air leap between rooftops
- `land` — landing crouch
- `hit` — knocked back by pigeon/obstacle
- _Exact list finalized when platformer mechanics are built._

**Files:**
- Create: `levels/rooftops.ts`
- Create: `scenes/PlatformerScene.ts`

- [ ] **Step 1: Create rooftops level config**

```typescript
// levels/rooftops.ts
import type { LevelId, LevelGenre, VictoryCondition, CatPoseId } from '../types';

export const ROOFTOPS_LEVEL_CONFIG = {
  id: 'ROOFTOPS' as LevelId,
  name: 'Rooftop Prowl',
  description: 'Navigate city rooftops at night',
  genre: 'platformer' as LevelGenre,
  catPose: 'platformer' as CatPoseId,
  victoryCondition: { type: 'boss', bossId: 'raccoon' } as VictoryCondition,
  starThresholds: [500, 1500, 3000] as [number, number, number],
  theme: { /* night city theme */ },
  platforms: [
    { x: 0, y: 500, width: 300, type: 'solid' as const },
    { x: 400, y: 450, width: 200, type: 'one-way' as const },
    { x: 700, y: 400, width: 150, type: 'moving' as const, moveConfig: { axis: 'x', range: 200, speed: 50 } },
    // ... more platforms
  ],
  enemies: [
    { type: 'pigeon', x: 500, y: 440, patrol: { left: 400, right: 600 } },
    // ... more enemies
  ],
  cutscene: {
    intro: {
      frames: [
        { type: 'text' as const, text: 'The cat wakes on a moonlit rooftop...', durationMs: 3000, transition: 'fade' as const },
        { type: 'text' as const, text: 'The city stretches out below. Time to prowl.', durationMs: 3000, transition: 'fade' as const },
      ],
    },
  },
};
```

- [ ] **Step 2: Create PlatformerScene skeleton extending SceneBridge**

- [ ] **Step 3: Register in LEVEL_ORDER and LEVEL_REGISTRY**

- [ ] **Step 4: Add scene factory in App**

```typescript
case 'ROOFTOPS': return () => import('./scenes/PlatformerScene');
```

- [ ] **Step 5: Verify skeleton loads via PhaserGame, commit**

---

### Task 4.2: Platformer player movement + camera — DONE (2026-03-24)
> Implemented in PlatformerScene.ts. Arcade Physics, camera follow, world bounds.

**Files:**
- Modify: `scenes/PlatformerScene.ts`

- [ ] **Step 1: Implement bidirectional player movement**

Left/Right arrow keys move player horizontally (`body.setVelocityX(±speed)`). Jump with Space/Up. Gravity from Phaser Arcade Physics. `setCollideWorldBounds(true)`.

- [ ] **Step 2: Implement camera follow**

```typescript
this.cameras.main.startFollow(this.player);
this.cameras.main.setBounds(0, 0, worldWidth, worldHeight);
```

- [ ] **Step 3: Verify player moves, camera scrolls, commit**

---

### Task 4.3: Platform system — PARTIAL (2026-03-24)
> Solid platforms procedurally generated. Moving/breakable/one-way not yet implemented.

**Files:**
- Modify: `scenes/PlatformerScene.ts`

- [ ] **Step 1: Create static platforms from config**

Read `platforms` array from level config. Create Phaser `StaticGroup` with rectangles at each `{x, y, width}`.

- [ ] **Step 2: Implement one-way platforms**

One-way platforms use Phaser's `body.checkDown` — player passes through from below but lands on top.

- [ ] **Step 3: Implement moving platforms**

Platforms with `moveConfig` use Phaser tweens to oscillate along the specified axis/range.

- [ ] **Step 4: Implement breakable platforms**

Breakable platforms crack on first contact and destroy after a delay.

- [ ] **Step 5: Verify all platform types work, commit**

---

### Task 4.4: Enemy patrol AI + stomp — NOT STARTED

**Files:**
- Modify: `scenes/PlatformerScene.ts`

- [ ] **Step 1: Implement enemy patrol**

Enemies walk between `patrol.left` and `patrol.right` waypoints. Reverse direction at edges. Flip sprite on turn.

- [ ] **Step 2: Implement stomp-to-kill**

When player lands on enemy from above (player.body.velocity.y > 0, overlap from top), destroy enemy and bounce player. Reuse stomp collision concept from runner.

- [ ] **Step 3: Implement player damage from side-hit**

If player collides with enemy from the side, lose a life + hurt animation.

- [ ] **Step 4: Verify enemy behavior, commit**

---

### Task 4.5: Platformer boss + victory — NOT STARTED
> Victory is distance-based (reach penthouse). No boss encounter yet.

**Files:**
- Modify: `scenes/PlatformerScene.ts`

- [ ] **Step 1: Implement boss encounter — Raccoon on water tower**

At the end of the level, trigger boss zone. Raccoon throws trash projectiles, player must dodge and stomp. Health bar.

- [ ] **Step 2: Implement victory condition**

On boss defeat, emit `LevelCompletePayload` with `victoryType: 'boss'`.

- [ ] **Step 3: Full QA — play through Level 2 start-to-finish**

- [ ] **Step 4: Commit**

```bash
git add levels/rooftops.ts scenes/PlatformerScene.ts levels/catalog.ts levels/index.ts App.tsx
git commit -m "feat(v3/phase4): complete Level 2 — Rooftop Prowl platformer"
```

---

### Task 5: Level 3 — Counter Chaos (Launcher) — SKELETON DONE (2026-03-24)
> Slingshot aiming with trajectory preview, 3 materials (glass/wood/metal), 4 structure templates, 5 rounds, score-based victory. No boss, no multiple projectile types yet.

**Files:** `levels/kitchen.ts`, `scenes/LauncherScene.ts`

**Sprite Requirements (defined during implementation):**
- `sit` — sitting on counter, tail curled, ready to launch
- `aim` — leaning back with paw cocked
- `launch` — swatting motion, paw extended
- `celebrate` — happy pose after good hit
- _Exact list finalized when launcher mechanics are built._

**Genre-specific systems:**
- [ ] Drag-to-aim input (mousedown → drag → release fires projectile)
- [ ] Projectile physics (parabolic arc, Arcade Physics gravity)
- [ ] Destructible structures (stacked sprites with health thresholds)
- [ ] Multiple projectile types (different weights/bounce)
- [ ] Level-complete scoring (destruction % × efficiency)
- [ ] Boss: kitchen appliance / guard dog
- [ ] Register, wire, QA, commit

---

### Task 6: Level 4 — Cosmic Kitty (Space Shooter) — SKELETON DONE (2026-03-24)
> 5 enemy waves + boss wave, auto-fire, 3 enemy types, deferred destroy pattern. No power-ups, no bullet patterns beyond aimed shots.

**Files:** `levels/space.ts`, `scenes/ShooterScene.ts`

**Sprite Requirements (defined during implementation):**
- `pilot` — forward-facing in cardboard spaceship
- `shoot` — firing furball (paw flash)
- `hit` — ship damage reaction
- `powerup` — glowing/enhanced after pickup
- _Exact list finalized when shooter mechanics are built._

**Genre-specific systems:**
- [ ] Player horizontal movement at screen bottom
- [ ] Shoot furballs (fire rate, upgrade tiers)
- [ ] Enemy wave system (formation patterns, descent paths)
- [ ] Enemy bullet patterns
- [ ] Power-ups: laser pointer beam, spray bottle, catnip slow-mo
- [ ] Wave-based progression with boss waves
- [ ] Boss: Giant Space Mouse
- [ ] Register, wire, QA, commit

---

### Task 7: Level 5 — Yarn Breaker (Breakout) — SKELETON DONE (2026-03-24)
> Paddle + yarn ball, 70 rainbow bricks (7 rows × 10 cols), angle reflection, speed escalation. No power-ups, no boss row yet.

**Files:** `levels/yarn.ts`, `scenes/BreakoutScene.ts`

**Sprite Requirements (defined during implementation):**
- `paddle` — paw extended as paddle (side view or top-down)
- `stretch` — wide paw for power-up
- `miss` — disappointed reaction when ball is lost
- _Exact list finalized when breakout mechanics are built._

**Genre-specific systems:**
- [ ] Paddle (paw) at bottom, keyboard/mouse controlled
- [ ] Ball (yarn) physics with angle reflection
- [ ] Brick grid with varying hit counts
- [ ] Power-ups: multi-ball, wide paw, sticky paw, fireball
- [ ] Boss: moving indestructible row that shoots back
- [ ] Register, wire, QA, commit

---

### Task 8: Level 6 — Busy Whiskers (Frogger) — SKELETON DONE (2026-03-24)
> 4 road lanes + 4 water lanes, discrete grid movement, ride logs, 60s timer, 3 crossings to win. No boss intersection, no river floating platforms beyond logs.

**Files:** `levels/street.ts`, `scenes/FroggerScene.ts`

**Sprite Requirements (defined during implementation):**
- `hop-up` / `hop-down` / `hop-left` / `hop-right` — directional hop frames
- `idle` — waiting between hops
- `splat` — hit by vehicle
- _Exact list finalized when frogger mechanics are built._

**Genre-specific systems:**
- [ ] Lane system with moving hazards
- [ ] River section with floating platforms
- [ ] Discrete grid movement (one step per input)
- [ ] Timer pressure
- [ ] Boss: increasingly chaotic intersection
- [ ] Register, wire, QA, commit

---

### Task 9: Level 7 — Mouse Hunt (Whack-a-Mole) — SKELETON DONE (2026-03-24)
> 3×3 hole grid, click/tap mice, 3 mouse types (normal/bonus/sneaky), combo multiplier, 60s timer. No armored mice, no boss mouse yet.

**Files:** `levels/garden-whack.ts`, `scenes/WhackScene.ts`

**Sprite Requirements (defined during implementation):**
- `swat` — paw slamming down with claws
- `ready` — paw raised, waiting to strike
- `miss` — whiffed swing
- _Exact list finalized when whack mechanics are built._

**Genre-specific systems:**
- [ ] Grid of holes, mice pop with random timing
- [ ] Click/tap to swat — hit detection
- [ ] Mouse variants (normal, bonus, sneaky, armored)
- [ ] Combo system (sequential hits increase multiplier)
- [ ] Speed escalation
- [ ] Boss: giant mouse with feint patterns
- [ ] Register, wire, QA, commit

---

### Task 10: Level 8 — Catnip Garden (Snake) — SKELETON DONE (2026-03-24)
> Grid movement, grow tail on eat, wall/self collision, speed escalation, survive 2 min. No cucumber scare zones, no special catnip types, no boss dog yet.

**Files:** `levels/garden-snake.ts`, `scenes/SnakeScene.ts`

**Sprite Requirements (defined during implementation):**
- `head-up` / `head-down` / `head-left` / `head-right` — directional head sprites
- `body` — tail segment (may be simpler, repeated)
- `chomp` — eating catnip
- _Exact list finalized when snake mechanics are built._

**Genre-specific systems:**
- [ ] Grid-based continuous movement (head leads, tail follows)
- [ ] Catnip pickups grow tail
- [ ] Self-collision = death
- [ ] Garden obstacles (walls, fences, flower pots)
- [ ] Cucumber scare zones
- [ ] Special catnip: speed boost, invincibility, tail shrink
- [ ] Boss: dog chases you, lead into traps
- [ ] Register, wire, QA, commit

---

### Task 11: Level 9 — The Cat Tree (Vertical Climber) — SKELETON DONE (2026-03-24)
> Doodle Jump auto-bounce, solid/spring/breakable platforms, screen-wrap, auto-scroll acceleration, sky gradient, 10k px to top. No enemies, no Red Dot boss yet.

**Files:** `levels/cattree.ts`, `scenes/ClimberScene.ts`

**Sprite Requirements (defined during implementation):**
- `climb` — arms-up climbing pose
- `jump` — springing upward from platform
- `fall` — tumbling downward
- `cling` — gripping a platform edge
- _Exact list finalized when climber mechanics are built._

**Genre-specific systems:**
- [ ] Vertical auto-scroll upward (camera rises, fall off = death)
- [ ] Platform types: solid, spring, breakable, moving
- [ ] Auto-bounce on platform contact, horizontal control
- [ ] Enemies: birds, toy distractions, rival cats
- [ ] Increasing difficulty with height
- [ ] Boss: The Legendary Red Dot (laser pointer)
- [ ] Thematic climax: ascending through clouds to cat paradise
- [ ] Register, wire, QA, commit

---

## Chunk 6: Phase 9 — Polish, Balancing, and Ship

**Goal:** Make the full campaign feel like a cohesive product.

### Task 12: Campaign Complete flow

- [ ] Detect all 9 levels cleared → set `GameStatus.CAMPAIGN_COMPLETE`
- [ ] Create victory screen: "The Great Ascension" — cat reaches the top of the cat tree
- [ ] Celebrate with particles, music, the cat's custom sprite

### Task 13: Balance pass

- [ ] Play through all 9 levels in order
- [ ] Verify genre ordering provides natural progression (no disproportionate walls)
- [ ] Tune `starThresholds` per level so 1-star is achievable on first try, 3-star requires mastery
- [ ] Verify power-ups / collectibles are balanced per genre

### Task 14: Hall of Fame polish

- [ ] Hall of Fame shows `levelId` tag on each entry (e.g., "Beach", "Rooftops")
- [ ] Legacy entries without `levelId` display as "Beach"
- [ ] Verify best-of merge works across multiple plays

### Task 15: Sound design pass

- [ ] Each level has a distinct pre-composed music track in `assets/audio/`
- [ ] Genre-appropriate SFX added per level via `PhaserAudio`
- [ ] Music crossfade on level transitions works

### Task 16: Write all cutscene scripts + produce videos

**Video production pipeline:** `demo-video-factory-catrunner/` contains a DaVinci Resolve automation workflow. For each cutscene:
1. Write the blueprint in `demo-video-factory-catrunner/blueprint.md` (scenes, text, timing)
2. Generate manifest → extract clips → render cards → optional voiceover → build Resolve timeline
3. Export from Resolve → place in `assets/cutscenes/<levelId>-intro.mp4` / `-outro.mp4`
4. Reference in `CutsceneConfig` as `videoSrc: '/assets/cutscenes/beach-intro.mp4'`

Text-only frames are the fallback for initial development. Video frames layer on top once produced.

- [ ] 9 intro cutscenes (one per level — text first, then video via factory)
- [ ] 8 transition cutscenes (between levels: "the cat lost its life and woke in a new dream")
- [ ] 1 finale (The Great Ascension: eternal catnip)
- [ ] Placeholder art for text frames
- [ ] Produce at least BEACH intro/outro as video via DaVinci Resolve pipeline to prove the workflow

### Task 17: Performance and QA

- [ ] Profile each level — verify 60fps on mid-range hardware
- [ ] Check code splitting — each scene is a separate chunk
- [ ] Keyboard navigation works for all menus
- [ ] Reduced-motion preference is respected
- [ ] Test `npm run build` and Vercel deployment
- [ ] **Deterministic Playwright support for Phaser scenes**
  - Each Phaser scene must expose `window.__GAME_TEST_API` when `import.meta.env.DEV` is true:
    - `window.__GAME_TEST_API.renderToText()` — returns a serialized snapshot of the current game state (player position, score, active entities, status) as a JSON-safe object. This enables Playwright assertions without pixel-matching.
    - `window.__GAME_TEST_API.advanceTime(ms: number)` — advances Phaser's clock by the given duration (pauses real-time, steps the physics/update loop deterministically). This enables frame-precise test scenarios without wall-clock waits.
    - `window.__GAME_TEST_API.sendInput(action: string)` — injects synthetic input events (e.g., `'jump'`, `'duck'`, `'pause'`). This enables input testing without OS-level key simulation.
  - Write at least one Playwright e2e test per genre that: boots the scene, advances time, sends input, and asserts on `renderToText()` output.
  - Gate: this is required for CI confidence before declaring V3 shippable.

### Task 18: Documentation

- [ ] Update CLAUDE.md with complete V3 architecture
- [ ] Update docs/QA_CHECKLIST.md with all 9 levels
- [ ] Update README with V3 description
- [ ] Final `npm run test:run` — all tests pass

### Task 19: Final commit

```bash
git add -A
git commit -m "feat(v3): complete Nine Lives campaign — all 9 genres playable"
```
