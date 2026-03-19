# Beach Kitty V3 — Nine Lives Campaign Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Transform Beach Kitty from a single endless-runner into a nine-level campaign where each level is a distinct game genre, powered by Phaser 3 for rendering and the same custom AI-generated cat character.

**Architecture:** React 19 owns UI (menus, HUD, campaign screen, cutscenes). Phaser 3 owns gameplay (one Scene per genre). A `PhaserGame.tsx` bridge component mounts Phaser inside a div and translates events/callbacks between the two. Each scene is code-split via dynamic `import()`. Levels are TypeScript config objects, not external map files.

**Tech Stack:** React 19, TypeScript, Vite, Phaser 3, Vitest, Vercel, Gemini AI (existing)

**Design decisions:** See [docs/superpowers/specs/2026-03-19-v3-open-questions-design.md](./docs/superpowers/specs/2026-03-19-v3-open-questions-design.md) — all 9 open questions resolved.

**Parent spec:** [ROADMAP_V3_SPEC.md](./ROADMAP_V3_SPEC.md)

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
| `components/CutscenePlayer.tsx` | Between-level story beat player (text frames, future video support) |
| `services/levelCompletion.ts` | `LevelCompletePayload`, `LevelResult`, star calculation, best-score merge, persistence |
| `services/catPoseTransforms.ts` | Programmatic cat pose variants per genre (canvas crop/rotate/overlay) |
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

### Retired files (Phase 1 complete)

| File | Reason |
|------|--------|
| `components/GameEngine.tsx` | Replaced by `scenes/RunnerScene.ts` + `components/PhaserGame.tsx` |
| `services/audioService.ts` | Replaced by `scenes/shared/PhaserAudio.ts` (Phaser owns AudioContext) |
| `services/sfxService.ts` | SFX migrated into Phaser audio system |
| `components/LevelSelection.tsx` | Replaced by `components/CampaignScreen.tsx` |

---

## Chunk 1: Phase 0 — Phaser Integration + Bridge

**Goal:** Add Phaser 3, create the React↔Phaser bridge, verify it works alongside existing UI without breaking anything.

### Task 0.1: Install Phaser and configure Vite

**Files:**
- Modify: `package.json`
- Modify: `vite.config.ts`

- [ ] **Step 1: Install Phaser**

```bash
npm install phaser
```

- [ ] **Step 2: Update vite.config.ts — add Phaser to optimizeDeps**

In `vite.config.ts`, inside the returned config object, add:

```typescript
optimizeDeps: {
  include: ['phaser'],
},
```

This tells Vite to pre-bundle Phaser during dev (avoids slow on-demand optimization of Phaser's large bundle).

- [ ] **Step 3: Verify dev server starts**

```bash
npm run dev
```

Expected: Dev server starts on port 3000. No errors. Existing game works unchanged.

- [ ] **Step 4: Verify production build**

```bash
npm run build
```

Expected: Build succeeds. Check output — Phaser chunk should appear in the `dist/assets/` directory. Note its size (~1MB gzipped).

- [ ] **Step 5: Verify tests still pass**

```bash
npm run test:run
```

Expected: All existing tests pass.

- [ ] **Step 6: Commit**

```bash
git add package.json package-lock.json vite.config.ts
git commit -m "chore: add phaser dependency and configure Vite optimizeDeps"
```

---

### Task 0.2: Define V3 type foundations

**Files:**
- Modify: `types.ts`
- Test: `types.ts` is purely types — verified by `npx tsc --noEmit`

- [ ] **Step 1: Add V3 types to types.ts**

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

- [ ] **Step 2: Expand LevelId**

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

- [ ] **Step 3: Update GameStatus enum**

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

- [ ] **Step 4: Add levelId to HighScoreEntry**

Add `levelId?: LevelId;` to the `HighScoreEntry` interface (optional for backwards compatibility with legacy entries).

- [ ] **Step 5: Type-check**

```bash
npx tsc --noEmit
```

Expected: Type errors in files that reference `LEVEL_SELECTION` (now `CAMPAIGN`), and in `levels/index.ts` where `Record<LevelId, LevelConfig>` now requires 9 keys but only has `BEACH`.

- [ ] **Step 6: Fix GameStatus references**

Search for `LEVEL_SELECTION` in `App.tsx` and replace with `CAMPAIGN`. This is a rename — same behavior, new name.

- [ ] **Step 7: Make LEVEL_REGISTRY partial**

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

- [ ] **Step 8: Add V3 fields to `LevelConfig` and the existing runner config**

Add these optional fields to the existing `LevelConfig` interface in `types.ts` so runner and future genres coexist during the transition:

```typescript
// Add to existing LevelConfig interface:
genre?: LevelGenre;
catPose?: CatPoseId;
victoryCondition?: VictoryCondition;
starThresholds?: [number, number, number];
cutscene?: { intro?: CutsceneConfig; outro?: CutsceneConfig };
```

All fields are optional so the existing `BEACH_LEVEL_CONFIG` doesn't break. Then add the V3 fields to `BEACH_LEVEL_CONFIG` in `levels/beach.ts`:

```typescript
genre: 'runner',
catPose: 'runner',
victoryCondition: { type: 'boss', bossId: 'sandMonster' },
starThresholds: [100, 300, 500],
```

**Note on LevelConfig evolution:** The existing `LevelConfig` is runner-specific (has `obstacles`, `patterns`, `boss`, etc.). For V3, the plan is to eventually move to a discriminated union (`RunnerLevelConfig | PlatformerLevelConfig | ...`). But that refactor happens incrementally — each new genre adds its own interface. The existing `LevelConfig` effectively becomes `RunnerLevelConfig`. The discriminated union is assembled in `levels/index.ts` as genres are built. For now, adding optional V3 fields to the existing interface is the minimal change that unblocks all phases.

- [ ] **Step 9: Type-check again**

```bash
npx tsc --noEmit
```

Expected: Fewer errors. Remaining errors should be limited to the `GameStatus.LEVEL_SELECTION` rename downstream — those are caught in subsequent commits.

- [ ] **Step 10: Commit**

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

- [ ] **Step 1: Write test for SceneBridge event emission**

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
    });
  });
});
```

Note: This test uses ESM `import` (the project is `"type": "module"`). On the first "red" run, the import will fail because `SceneBridge.ts` doesn't exist yet — that's the expected TDD failure.

- [ ] **Step 2: Run test — verify it fails**

```bash
npm run test:run -- scenes/shared/SceneBridge.test.ts
```

Expected: FAIL — module not found.

- [ ] **Step 3: Create SceneBridge**

Create `scenes/shared/SceneBridge.ts`:

```typescript
import Phaser from 'phaser';
import type { GameScore, GameStatus, LevelCompletePayload, LevelConfig, LevelId } from '../../types';

/** Event names emitted by Phaser scenes, received by PhaserGame React wrapper. */
export const BRIDGE_EVENTS = {
  SCORE_UPDATE: 'scoreUpdate',
  LIVES_CHANGED: 'livesChanged',
  LEVEL_COMPLETE: 'levelComplete',
  GAME_OVER: 'gameOver',
  STATUS_CHANGE: 'statusChange',
} as const;

export interface SceneInitData {
  levelId: LevelId;
  catSpriteUrl: string | null;
  levelConfig: LevelConfig;
  initialLives: number;
  startAtBoss: boolean;
  tuning: TuningProfile;
  /** Optional telemetry hook — scene calls this to hand off its getTelemetry fn */
  onTelemetryReady?: (getTelemetry: () => TelemetryEvent[]) => void;
}

/**
 * Base class for all V3 Phaser scenes.
 * Provides typed event emission, init data unpacking, and lifecycle hooks.
 * Subclasses implement `onSceneCreate()` and `onSceneUpdate(time, delta)`.
 */
export abstract class SceneBridge extends Phaser.Scene {
  protected levelId!: LevelId;
  protected catSpriteUrl: string | null = null;
  protected levelConfig!: LevelConfig;
  protected initialLives!: number;
  protected startAtBoss!: boolean;
  protected tuning!: TuningProfile;

  init(data: SceneInitData): void {
    this.levelId = data.levelId;
    this.catSpriteUrl = data.catSpriteUrl;
    this.levelConfig = data.levelConfig;
    this.initialLives = data.initialLives;
    this.startAtBoss = data.startAtBoss;
    this.tuning = data.tuning;
    if (data.onTelemetryReady) data.onTelemetryReady(this.getTelemetry.bind(this));
  }

  /** Override in subclasses that support telemetry export */
  protected getTelemetry(): TelemetryEvent[] { return []; }

  /** Emit score update to React HUD */
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
}
```

- [ ] **Step 4: Run test — verify it passes**

```bash
npm run test:run -- scenes/shared/SceneBridge.test.ts
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add scenes/shared/SceneBridge.ts scenes/shared/SceneBridge.test.ts
git commit -m "feat(v3): add SceneBridge base class with event protocol"
```

---

### Task 0.4: Create PhaserGame React wrapper

**Files:**
- Create: `components/PhaserGame.tsx`

This component mounts a `Phaser.Game` instance inside a div, handles lazy scene registration, resize, and cleanup. It wires bridge events to React callbacks.

- [ ] **Step 1: Create PhaserGame.tsx**

```typescript
import React, { useEffect, useRef } from 'react';
import type { GameScore, GameStatus, LevelCompletePayload, LevelConfig, LevelId } from '../types';
import type { TuningProfile } from '../systems/tuning/defaultTuning';
import type { TelemetryEvent } from '../systems/telemetry/runTelemetry';
import { BRIDGE_EVENTS, type SceneInitData } from '../scenes/shared/SceneBridge';

interface PhaserGameProps {
  levelId: LevelId;
  levelConfig: LevelConfig;
  catSpriteUrl: string | null;
  initialLives: number;
  startAtBoss: boolean;
  tuning: TuningProfile;
  sceneFactory: () => Promise<{ default: typeof Phaser.Scene }>;
  onScoreUpdate: (score: GameScore) => void;
  onLevelComplete: (payload: LevelCompletePayload) => void;
  onGameOver: (finalScore: number) => void;
  onStatusChange?: (status: GameStatus) => void;
  onTelemetryReady?: (getTelemetry: () => TelemetryEvent[]) => void;
}

const PhaserGame: React.FC<PhaserGameProps> = (props) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const gameRef = useRef<Phaser.Game | null>(null);

  // ALL props go in a ref so the effect closure always sees current values
  // without restarting Phaser. The effect depends ONLY on levelId
  // (new level = new Phaser instance; everything else updates in-place).
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
      const initData: SceneInitData = {
        levelId: p.levelId,
        catSpriteUrl: p.catSpriteUrl,
        levelConfig: p.levelConfig,
        initialLives: p.initialLives,
        startAtBoss: p.startAtBoss,
        tuning: p.tuning,
        onTelemetryReady: p.onTelemetryReady,
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

      const scene = game.scene.getScene(sceneKey);
      if (scene) {
        // Wire bridge events BEFORE starting the scene.
        // This ensures no events emitted during create() are lost.
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
      if (gameRef.current) {
        gameRef.current.destroy(true);
        gameRef.current = null;
      }
    };
  // ONLY levelId triggers a full Phaser restart. Callbacks and config
  // are read from propsRef so React re-renders don't restart the game.
  }, [props.levelId]);

  return <div ref={containerRef} style={{ width: '100%', height: '100%', position: 'absolute', top: 0, left: 0 }} />;
};

export default PhaserGame;
```

**Key design points:**
- **No re-render restarts:** The effect depends ONLY on `props.levelId`. All other props (callbacks, config, sceneFactory) live in `propsRef` — React re-renders from score/lives updates do NOT tear down Phaser.
- **Events before start:** Scene is added with `autoStart: false`, events are wired, THEN `game.scene.start()` is called. Events emitted during `create()` (like the initial `statusChange`) are never lost.
- **Full contract:** `SceneInitData` carries `initialLives`, `startAtBoss`, `tuning`, and `onTelemetryReady` — matching the current `GameEngine` props. Balance panel, boss-practice, persisted lives, and telemetry all work.
- **Code splitting:** `sceneFactory` is called once during boot (read from `propsRef.current`), not on every render.
- **Web Audio forced:** `audio: { disableWebAudio: false }` ensures single AudioContext for music + SFX.

- [ ] **Step 2: Verify type-check**

```bash
npx tsc --noEmit
```

Expected: No new errors from PhaserGame.tsx (some existing errors from the GameStatus rename are expected and will be fixed later).

- [ ] **Step 3: Commit**

```bash
git add components/PhaserGame.tsx
git commit -m "feat(v3): add PhaserGame React wrapper with lazy scene loading and bridge events"
```

---

### Task 0.5: Create TestScene and verify end-to-end bridge

**Files:**
- Create: `scenes/TestScene.ts`

A minimal scene that renders a colored rectangle and emits a score event — proving the full React→Phaser→React pipeline works.

- [ ] **Step 1: Create TestScene**

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

- [ ] **Step 2: Temporarily wire TestScene into App for manual verification**

In App.tsx, add a temporary test route: when `selectedLevel === 'BEACH'` and a flag is set, render `PhaserGame` with `sceneFactory={() => import('./scenes/TestScene')}` instead of `GameEngine`. This is a manual smoke test — remove after verification.

- [ ] **Step 3: Manual verification**

```bash
npm run dev
```

Open browser → Start game → Verify:
1. Blue rectangle renders in the center
2. "Phaser bridge test / Level: BEACH" text appears
3. Score increments by 10 every second in the React HUD (if HUD is still visible)
4. Browser console has no errors
5. Resizing the window resizes the Phaser canvas

- [ ] **Step 4: Verify production build works**

```bash
npm run build && npm run preview
```

Expected: Same behavior in production mode. Phaser chunk is a separate file in `dist/assets/`.

- [ ] **Step 5: Revert App.tsx test wiring, keep TestScene for future dev use**

- [ ] **Step 6: Commit**

```bash
git add scenes/TestScene.ts
git commit -m "feat(v3): add TestScene — verifies Phaser bridge end-to-end"
```

---

### Task 0.6: Update documentation

**Files:**
- Modify: `CLAUDE.md`
- Modify: `AGENTS.md` (twin doc — must stay in sync per `AGENTS.md:3`)

- [ ] **Step 1: Add Phaser architecture section to CLAUDE.md and AGENTS.md**

Add a new section after "Architecture" in CLAUDE.md:

```markdown
### Phaser 3 Integration (V3)
- **`components/PhaserGame.tsx`** — React wrapper that mounts a Phaser.Game instance. Lazy-loads Phaser core + scene class via dynamic `import()`. Wires bridge events to React callbacks.
- **`scenes/shared/SceneBridge.ts`** — Base class for all Phaser scenes. Defines typed event protocol (`BRIDGE_EVENTS`), init data unpacking, and emitter helpers.
- **`scenes/<GenreName>Scene.ts`** — One Phaser scene per genre. Plain TypeScript classes (NOT React components). Use Phaser APIs, not React patterns.
- **Rendering rule:** All gameplay rendering is Phaser-native (Graphics, Sprites, Particles). React renders UI only (HUD, menus, cutscenes) overlaid on the Phaser canvas via absolute positioning.
- **Code splitting:** Each scene is a dynamic import. `PhaserGame` receives `sceneFactory: () => Promise<...>`. Never statically import all scene classes.
```

- [ ] **Step 2: Mirror the same section into AGENTS.md**

CLAUDE.md and AGENTS.md are twin docs (see `AGENTS.md:3`). Add the same Phaser architecture section to AGENTS.md.

- [ ] **Step 3: Commit**

```bash
git add CLAUDE.md AGENTS.md
git commit -m "docs: add Phaser architecture notes to CLAUDE.md and AGENTS.md"
```

---

### Task 0.7: Create SpriteLoader

**Files:**
- Create: `scenes/shared/SpriteLoader.ts`

The custom cat sprite is stored as a blob URL (from IndexedDB). Phaser needs this loaded as a texture.

- [ ] **Step 1: Create SpriteLoader.ts**

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

- [ ] **Step 2: Commit**

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

- [ ] **Step 1: Write migration tests**

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

- [ ] **Step 2: Run tests — verify they fail**

```bash
npm run test:run -- services/levelProgress.test.ts
```

- [ ] **Step 3: Update levelProgress.ts**

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

- [ ] **Step 4: Update runOutcome.ts**

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

- [ ] **Step 5: Update App.tsx references**

Replace all `defeatedBosses` state/usage with `completedLevels`. Replace `loadDefeatedBosses` with `loadCompletedLevels`.

- [ ] **Step 6: Run all tests**

```bash
npm run test:run
```

- [ ] **Step 7: Commit**

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

- [ ] **Step 1: Write tests**

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

- [ ] **Step 2: Run tests — verify they fail**

```bash
npm run test:run -- services/levelCompletion.test.ts
```

- [ ] **Step 3: Implement levelCompletion.ts**

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

- [ ] **Step 4: Run tests — verify they pass**

```bash
npm run test:run -- services/levelCompletion.test.ts
```

- [ ] **Step 5: Commit**

```bash
git add services/levelCompletion.ts services/levelCompletion.test.ts
git commit -m "feat(v3): add levelCompletion service — star calculation, best-of result persistence"
```

---

## Chunk 2: Phase 1 — Port Level 1 (Beach Runner) to Phaser

**Goal:** Reimplement the current `GameEngine.tsx` as a Phaser `RunnerScene` with feel-identical gameplay. Physics constants, timing, scoring, and boss mechanics must match. Visuals use Phaser's native renderer.

**Risk:** This is the largest single phase. `GameEngine.tsx` is ~1,630 lines of tightly coupled logic. The port is broken into sub-tasks by system.

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
  levelConfig={levelConfig}
  catSpriteUrl={mattedCatUrl}
  initialLives={score.lives}
  startAtBoss={startAtBoss}
  tuning={mergedTuning}
  sceneFactory={() => import('./scenes/RunnerScene')}
  onScoreUpdate={handleScoreUpdate}
  onLevelComplete={handleLevelComplete}
  onGameOver={handleGameOver}
  onStatusChange={handleStatusChange}
  onTelemetryReady={handleTelemetryReady}
/>
```

**Note on `sceneFactory`:** The inline arrow function `() => import(...)` creates a new function identity on every render, but this is safe — `PhaserGame` reads it from `propsRef.current` inside the boot closure, and the effect depends only on `levelId`. The factory is never compared by reference.

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

### Task 1.13: Archive GameEngine and old audio services

**Files:**
- Modify: `components/GameEngine.tsx` → move to `components/_archive/GameEngine.tsx`
- Modify: `services/audioService.ts` → move to `services/_archive/audioService.ts`
- Modify: `services/sfxService.ts` → move to `services/_archive/sfxService.ts`

- [ ] **Step 1: Move files to archive directory**

```bash
mkdir -p components/_archive services/_archive
git mv components/GameEngine.tsx components/_archive/GameEngine.tsx
git mv services/audioService.ts services/_archive/audioService.ts
git mv services/sfxService.ts services/_archive/sfxService.ts
```

- [ ] **Step 2: Remove imports of archived files**

Find and remove all imports of `GameEngine`, `audioService`, and `sfxService` from active code. The Phaser scene handles all of this now.

- [ ] **Step 3: Run tests**

```bash
npm run test:run
```

- [ ] **Step 4: Verify build**

```bash
npm run build
```

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "chore(v3/phase1): archive GameEngine and old audio services — Phaser owns gameplay + audio"
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
- `video` frames: (future) play video with subtitles
- Each frame auto-advances after `durationMs` or on click/spacebar

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

## Chunk 4: Phase 3 — Character Pose System

**Goal:** Build infrastructure for genre-specific cat appearances.

### Task 3.1: Create catPoseTransforms service

**Files:**
- Create: `services/catPoseTransforms.ts`
- Test: `services/catPoseTransforms.test.ts`

- [ ] **Step 1: Write test for pose transform**

```typescript
import { describe, it, expect, beforeAll } from 'vitest';
import { transformCatPose } from './catPoseTransforms';

// Create a minimal 2x2 red PNG for testing
let testImageBlob: Blob;
beforeAll(() => {
  // Minimal valid PNG (1x1 red pixel)
  const pngBytes = new Uint8Array([
    0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, // PNG header
    // ... (use a real minimal PNG or generate via OffscreenCanvas in test setup)
  ]);
  testImageBlob = new Blob([pngBytes], { type: 'image/png' });
});

describe('catPoseTransforms', () => {
  it('returns the original image for runner pose', async () => {
    const result = await transformCatPose(testImageBlob, 'runner');
    expect(result).toBe(testImageBlob); // no-op for default pose
  });

  it('returns a blob for non-default poses', async () => {
    const result = await transformCatPose(testImageBlob, 'pilot');
    expect(result).toBeInstanceOf(Blob);
  });
});
```

Note: Full canvas-based pose tests require `OffscreenCanvas` support in the test environment. If Vitest runs in Node without canvas, these tests may need `@napi-rs/canvas` or should be limited to the identity case.

- [ ] **Step 2: Implement catPoseTransforms.ts**

```typescript
import type { CatPoseId } from '../types';

export async function transformCatPose(sourceBlob: Blob, pose: CatPoseId): Promise<Blob> {
  if (pose === 'runner') return sourceBlob; // default, no transform

  const img = await createImageBitmap(sourceBlob);
  const canvas = new OffscreenCanvas(img.width, img.height);
  const ctx = canvas.getContext('2d')!;

  switch (pose) {
    case 'paddle':
    case 'swatter':
      // Crop to bottom-right quadrant (paw region)
      ctx.drawImage(img, img.width/2, img.height/2, img.width/2, img.height/2, 0, 0, img.width, img.height);
      break;
    case 'pilot':
      // Flip horizontally (forward-facing)
      ctx.scale(-1, 1);
      ctx.drawImage(img, -img.width, 0);
      break;
    case 'slitherer':
      // Crop to head (top half)
      ctx.drawImage(img, 0, 0, img.width, img.height/2, 0, 0, img.width, img.height);
      break;
    default:
      // platformer, launcher, hopper, climber — use full sprite, maybe rotated
      ctx.drawImage(img, 0, 0);
      break;
  }

  return canvas.convertToBlob({ type: 'image/png' });
}
```

- [ ] **Step 3: Run tests**

```bash
npm run test:run -- services/catPoseTransforms.test.ts
```

- [ ] **Step 4: Integrate with PhaserGame bridge**

In `PhaserGame.tsx`, before passing `catSpriteUrl` to the scene, apply the pose transform:

```typescript
const posedUrl = await getPosedCatUrl(catSpriteUrl, levelConfig.catPose);
```

The `SceneInitData` receives the transformed URL.

- [ ] **Step 5: Commit**

```bash
git add services/catPoseTransforms.ts services/catPoseTransforms.test.ts components/PhaserGame.tsx
git commit -m "feat(v3/phase3): add catPoseTransforms — programmatic pose variants per genre"
```

---

## Chunk 5: Phases 4–8 — Genre Levels

**Goal:** Build the remaining 8 genre levels. Each follows the same pattern.

### Genre Level Template

Every new level follows this structure:

1. **Create level config** (`levels/<name>.ts`) — define `LevelConfigBase` + genre-specific fields
2. **Create Phaser scene** (`scenes/<Name>Scene.ts`) — extend `SceneBridge`, implement `preload`/`create`/`update`
3. **Implement core mechanic** — the unique gameplay system for this genre
4. **Add art** — Phaser graphics primitives + Gemini-generated sprites where needed
5. **Add boss/victory condition** — genre-appropriate win state
6. **Wire into App** — add scene factory to `PhaserGame`, add to `LEVEL_ORDER`, register in `LEVEL_REGISTRY`
7. **Write cutscene** — placeholder intro/outro text
8. **QA + commit**

### Task 4.1: Level 2 config + PlatformerScene skeleton

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

### Task 4.2: Platformer player movement + camera

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

### Task 4.3: Platform system

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

### Task 4.4: Enemy patrol AI + stomp

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

### Task 4.5: Platformer boss + victory

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

### Task 5: Level 3 — Counter Chaos (Launcher)

**Files:** `levels/kitchen.ts`, `scenes/LauncherScene.ts`

**Genre-specific systems:**
- [ ] Drag-to-aim input (mousedown → drag → release fires projectile)
- [ ] Projectile physics (parabolic arc, Arcade Physics gravity)
- [ ] Destructible structures (stacked sprites with health thresholds)
- [ ] Multiple projectile types (different weights/bounce)
- [ ] Level-complete scoring (destruction % × efficiency)
- [ ] Boss: kitchen appliance / guard dog
- [ ] Register, wire, QA, commit

---

### Task 6: Level 4 — Cosmic Kitty (Space Shooter)

**Files:** `levels/space.ts`, `scenes/ShooterScene.ts`

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

### Task 7: Level 5 — Yarn Breaker (Breakout)

**Files:** `levels/yarn.ts`, `scenes/BreakoutScene.ts`

**Genre-specific systems:**
- [ ] Paddle (paw) at bottom, keyboard/mouse controlled
- [ ] Ball (yarn) physics with angle reflection
- [ ] Brick grid with varying hit counts
- [ ] Power-ups: multi-ball, wide paw, sticky paw, fireball
- [ ] Boss: moving indestructible row that shoots back
- [ ] Register, wire, QA, commit

---

### Task 8: Level 6 — Busy Whiskers (Frogger)

**Files:** `levels/street.ts`, `scenes/FroggerScene.ts`

**Genre-specific systems:**
- [ ] Lane system with moving hazards
- [ ] River section with floating platforms
- [ ] Discrete grid movement (one step per input)
- [ ] Timer pressure
- [ ] Boss: increasingly chaotic intersection
- [ ] Register, wire, QA, commit

---

### Task 9: Level 7 — Mouse Hunt (Whack-a-Mole)

**Files:** `levels/garden-whack.ts`, `scenes/WhackScene.ts`

**Genre-specific systems:**
- [ ] Grid of holes, mice pop with random timing
- [ ] Click/tap to swat — hit detection
- [ ] Mouse variants (normal, bonus, sneaky, armored)
- [ ] Combo system (sequential hits increase multiplier)
- [ ] Speed escalation
- [ ] Boss: giant mouse with feint patterns
- [ ] Register, wire, QA, commit

---

### Task 10: Level 8 — Catnip Garden (Snake)

**Files:** `levels/garden-snake.ts`, `scenes/SnakeScene.ts`

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

### Task 11: Level 9 — The Cat Tree (Vertical Climber)

**Files:** `levels/cattree.ts`, `scenes/ClimberScene.ts`

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

### Task 16: Write all cutscene scripts

- [ ] 9 intro cutscenes (one per level)
- [ ] 8 transition cutscenes (between levels: "the cat lost its life and woke in a new dream")
- [ ] 1 finale (The Great Ascension: eternal catnip)
- [ ] Placeholder art for text frames

### Task 17: Performance and QA

- [ ] Profile each level — verify 60fps on mid-range hardware
- [ ] Check code splitting — each scene is a separate chunk
- [ ] Keyboard navigation works for all menus
- [ ] Reduced-motion preference is respected
- [ ] Test `npm run build` and Vercel deployment

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
