# Phase 9: Live Balancing + Telemetry — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add a dev-only balance panel (backtick toggle) with runtime tuning sliders, plus per-run telemetry logging with JSON export.

**Architecture:** A `TuningProfile` object replaces hardcoded constants in GameEngine. A React hook (`useTuningStore`) manages reading/writing/persisting tuning values. A separate telemetry module logs damage/death/run events into an array, exportable as JSON. The BalancePanel UI reads and writes the tuning store and triggers telemetry export.

**Tech Stack:** React 19, TypeScript, Tailwind CSS (CDN), localStorage, Web APIs (Blob/URL for export)

---

## Important Context

- This is a Vite + React 19 + TypeScript project. No test framework is configured.
- Styling is Tailwind CSS loaded via CDN — no imports needed, just use className strings.
- The project has no `.d.ts` files for image imports (known TS quirk, non-blocking).
- localStorage keys use prefix `beach-cat-*` (see `App.tsx:37-52`).
- GameEngine is ~1800 lines. All mutable game state uses refs (scoreRef, livesRef, etc.) to avoid re-renders.
- There is ONE damage path at `GameEngine.tsx:1319-1345` — both obstacle and projectile damage flow through the `HARMFUL_TYPES` check.
- There is no `runStartTime` ref yet — Task 3 will add one.

---

## Task 1: Create TuningProfile type and defaults

**Files:**
- Create: `systems/tuning/defaultTuning.ts`

**Step 1: Create directory**

```bash
mkdir -p systems/tuning
```

**Step 2: Write `defaultTuning.ts`**

This file defines the `TuningProfile` interface and the `DEFAULT_TUNING` object. Values must exactly match the current constants in `GameEngine.tsx:20-40`.

```typescript
export interface TuningProfile {
  // Physics
  gravity: number;
  jumpForce: number;
  bounceForce: number;
  initialSpeed: number;
  speedIncrement: number;

  // Spawning
  spawnBaseMs: number;
  spawnMinMs: number;
  spawnJitterMs: number;
  patternEndGapMs: number;
  harmfulCooldownMs: number;

  // Difficulty
  bossThreshold: number;
  powerupThreshold: number;
  streakRequired: number;

  // Assist
  lowLivesThreshold: number;
  criticalLivesThreshold: number;
  hitSpawnGraceMs: number;
  startSpawnGraceMs: number;

  // Boss
  bossIntroEaseMs: number;
  invincibilityDurationMs: number;
}

export const DEFAULT_TUNING: TuningProfile = {
  gravity: 0.75,
  jumpForce: 17,
  bounceForce: 15,
  initialSpeed: 7.5,
  speedIncrement: 0.002,

  spawnBaseMs: 1225,
  spawnMinMs: 520,
  spawnJitterMs: 320,
  patternEndGapMs: 600,
  harmfulCooldownMs: 400,

  bossThreshold: 50,
  powerupThreshold: 20,
  streakRequired: 5,

  lowLivesThreshold: 2,
  criticalLivesThreshold: 1,
  hitSpawnGraceMs: 900,
  startSpawnGraceMs: 1800,

  bossIntroEaseMs: 12000,
  invincibilityDurationMs: 2000,
};

// Slider metadata: [min, max, step] for each tuning key
export const TUNING_RANGES: Record<keyof TuningProfile, [number, number, number]> = {
  gravity:                [0.1, 2.0, 0.05],
  jumpForce:              [5, 30, 0.5],
  bounceForce:            [5, 25, 0.5],
  initialSpeed:           [3, 15, 0.5],
  speedIncrement:         [0, 0.01, 0.0005],

  spawnBaseMs:            [400, 3000, 25],
  spawnMinMs:             [200, 1500, 10],
  spawnJitterMs:          [0, 800, 10],
  patternEndGapMs:        [0, 2000, 50],
  harmfulCooldownMs:      [0, 1500, 25],

  bossThreshold:          [5, 200, 5],
  powerupThreshold:       [5, 50, 1],
  streakRequired:         [2, 15, 1],

  lowLivesThreshold:      [1, 5, 1],
  criticalLivesThreshold: [1, 3, 1],
  hitSpawnGraceMs:        [0, 3000, 50],
  startSpawnGraceMs:      [0, 5000, 100],

  bossIntroEaseMs:        [2000, 30000, 500],
  invincibilityDurationMs:[500, 5000, 100],
};
```

**Step 3: Verify TypeScript compiles**

```bash
npx tsc --noEmit 2>&1 | grep -v "Cannot find module.*assets"
```

Expected: no new errors (only the pre-existing asset import warnings).

**Step 4: Commit**

```bash
git add systems/tuning/defaultTuning.ts
git commit -m "feat: add TuningProfile type and default values"
```

---

## Task 2: Create useTuningStore hook

**Files:**
- Create: `systems/tuning/useTuningStore.ts`

**Step 1: Write the hook**

The hook reads from localStorage on mount, merges with defaults, and exposes setters. Preset management included.

```typescript
import { useState, useCallback } from 'react';
import { TuningProfile, DEFAULT_TUNING } from './defaultTuning';

const STORAGE_KEY = 'beach-cat-dev-tuning';
const PRESETS_KEY = 'beach-cat-dev-tuning-presets';

function loadTuning(): TuningProfile {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return { ...DEFAULT_TUNING, ...JSON.parse(raw) };
  } catch {}
  return { ...DEFAULT_TUNING };
}

function loadPresets(): Record<string, TuningProfile> {
  try {
    const raw = localStorage.getItem(PRESETS_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return {};
}

export function useTuningStore() {
  const [tuning, setTuningState] = useState<TuningProfile>(loadTuning);
  const [presets, setPresetsState] = useState<Record<string, TuningProfile>>(loadPresets);

  const setTuning = useCallback((updates: Partial<TuningProfile>) => {
    setTuningState(prev => {
      const next = { ...prev, ...updates };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  const resetToDefaults = useCallback(() => {
    setTuningState({ ...DEFAULT_TUNING });
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  const savePreset = useCallback((name: string) => {
    setPresetsState(prev => {
      const next = { ...prev, [name]: { ...tuning } };
      localStorage.setItem(PRESETS_KEY, JSON.stringify(next));
      return next;
    });
  }, [tuning]);

  const loadPreset = useCallback((name: string) => {
    const preset = presets[name];
    if (preset) {
      setTuningState({ ...preset });
      localStorage.setItem(STORAGE_KEY, JSON.stringify(preset));
    }
  }, [presets]);

  const deletePreset = useCallback((name: string) => {
    setPresetsState(prev => {
      const next = { ...prev };
      delete next[name];
      localStorage.setItem(PRESETS_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  return { tuning, setTuning, resetToDefaults, presets, savePreset, loadPreset, deletePreset };
}
```

**Step 2: Verify TypeScript compiles**

```bash
npx tsc --noEmit 2>&1 | grep -v "Cannot find module.*assets"
```

**Step 3: Commit**

```bash
git add systems/tuning/useTuningStore.ts
git commit -m "feat: add useTuningStore hook with localStorage persistence"
```

---

## Task 3: Create telemetry module

**Files:**
- Create: `systems/telemetry/runTelemetry.ts`

**Step 1: Create directory**

```bash
mkdir -p systems/telemetry
```

**Step 2: Write the telemetry module**

This is a factory function, not a hook — it returns a plain object with methods. GameEngine will create one instance per run via `useRef`.

```typescript
export interface DamageEvent {
  type: 'damage';
  timestamp: number;
  obstacleType: string;
  speed: number;
  livesRemaining: number;
  score: number;
}

export interface DeathEvent {
  type: 'death';
  timestamp: number;
  score: number;
  coins: number;
  speed: number;
  activePowerUp: string | null;
  damageCount: number;
}

export interface RunSummaryEvent {
  type: 'run_summary';
  timestamp: number;
  durationMs: number;
  finalScore: number;
  coinsCollected: number;
  bossReached: boolean;
  bossDefeated: boolean;
  damageCount: number;
  tuningProfile: string;
}

export type TelemetryEvent = DamageEvent | DeathEvent | RunSummaryEvent;

export function createRunTelemetry() {
  const events: TelemetryEvent[] = [];
  const startTime = Date.now();

  return {
    logDamage(obstacleType: string, speed: number, livesRemaining: number, score: number) {
      events.push({ type: 'damage', timestamp: Date.now(), obstacleType, speed, livesRemaining, score });
    },

    logDeath(score: number, coins: number, speed: number, activePowerUp: string | null) {
      const damageCount = events.filter(e => e.type === 'damage').length;
      events.push({ type: 'death', timestamp: Date.now(), score, coins, speed, activePowerUp, damageCount });
    },

    logRunSummary(finalScore: number, coinsCollected: number, bossReached: boolean, bossDefeated: boolean, tuningProfile: string) {
      const damageCount = events.filter(e => e.type === 'damage').length;
      events.push({
        type: 'run_summary',
        timestamp: Date.now(),
        durationMs: Date.now() - startTime,
        finalScore,
        coinsCollected,
        bossReached,
        bossDefeated,
        damageCount,
        tuningProfile,
      });
    },

    getEvents(): TelemetryEvent[] {
      return [...events];
    },

    clear() {
      events.length = 0;
    },
  };
}

export type RunTelemetry = ReturnType<typeof createRunTelemetry>;

export function exportTelemetryJson(events: TelemetryEvent[]): void {
  const blob = new Blob([JSON.stringify(events, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `beach-kitty-telemetry-${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.json`;
  a.click();
  URL.revokeObjectURL(url);
}
```

**Step 3: Verify TypeScript compiles**

```bash
npx tsc --noEmit 2>&1 | grep -v "Cannot find module.*assets"
```

**Step 4: Commit**

```bash
git add systems/telemetry/runTelemetry.ts
git commit -m "feat: add run telemetry module with damage/death/summary logging and JSON export"
```

---

## Task 4: Wire tuning store into GameEngine

**Files:**
- Modify: `components/GameEngine.tsx:2-3` (add import)
- Modify: `components/GameEngine.tsx:20-40` (replace constants)
- Modify: `components/GameEngine.tsx:71` (add hook call)
- Modify: scattered references to old constant names

**Step 1: Add import at top of GameEngine.tsx**

After line 8 (`import { startMusic, ...}`), add:

```typescript
import { useTuningStore } from '../systems/tuning/useTuningStore';
```

**Step 2: Replace hardcoded constants with tuning destructure**

Remove lines 20-40 (the `const GRAVITY = 0.75` through `const PLAYING_SPAWN_JITTER_MS = 320` block).

Inside the component function (after the existing `useState` declarations around line 90), add:

```typescript
const { tuning } = useTuningStore();
```

**Step 3: Replace all references to old constants**

Search-and-replace these mappings throughout GameEngine.tsx. Each old constant name maps to `tuning.<property>`:

| Old constant | New reference |
|---|---|
| `GRAVITY` | `tuning.gravity` |
| `JUMP_FORCE` | `tuning.jumpForce` |
| `BOUNCE_FORCE` | `tuning.bounceForce` |
| `INITIAL_SPEED` | `tuning.initialSpeed` |
| `SPEED_INCREMENT` | `tuning.speedIncrement` |
| `POWERUP_THRESHOLD` | `tuning.powerupThreshold` |
| `BOSS_THRESHOLD` | `tuning.bossThreshold` |
| `STREAK_REQUIRED` | `tuning.streakRequired` |
| `INVINCIBILITY_DURATION` | `tuning.invincibilityDurationMs` |
| `PATTERN_END_GAP` | `tuning.patternEndGapMs` |
| `HARMFUL_COOLDOWN` | `tuning.harmfulCooldownMs` |
| `START_SPAWN_GRACE_MS` | `tuning.startSpawnGraceMs` |
| `HIT_SPAWN_GRACE_MS` | `tuning.hitSpawnGraceMs` |
| `LOW_LIVES_THRESHOLD` | `tuning.lowLivesThreshold` |
| `CRITICAL_LIVES_THRESHOLD` | `tuning.criticalLivesThreshold` |
| `BOSS_INTRO_EASE_MS` | `tuning.bossIntroEaseMs` |
| `PLAYING_SPAWN_BASE_MS` | `tuning.spawnBaseMs` |
| `PLAYING_SPAWN_MIN_MS` | `tuning.spawnMinMs` |
| `PLAYING_SPAWN_JITTER_MS` | `tuning.spawnJitterMs` |

**Important:** Keep `GROUND_Y = 100` and `CONTROLS_HINT_DURATION_MS = 6000` as local constants — they are layout values, not tuning knobs.

**Step 4: Fix the `useCallback` dependency arrays**

The `update` callback at line 667 and other callbacks reference these constants. Since they now come from `tuning` (which is state), add `tuning` to the dependency arrays of `useCallback` calls that reference tuning values. The main one is the `update` callback at ~line 667 — add `tuning` to its dependency array at ~line 1349.

**Step 5: Also update `speedRef` initialization**

Line 112: `const speedRef = useRef(INITIAL_SPEED);` → `const speedRef = useRef(tuning.initialSpeed);`

Line 110: `const coinsRef = useRef(startAtBoss ? BOSS_THRESHOLD : 0);` → `const coinsRef = useRef(startAtBoss ? tuning.bossThreshold : 0);`

**Step 6: Verify TypeScript compiles**

```bash
npx tsc --noEmit 2>&1 | grep -v "Cannot find module.*assets"
```

Expected: no new errors. All old constant names are gone.

**Step 7: Verify build succeeds**

```bash
npm run build
```

**Step 8: Commit**

```bash
git add components/GameEngine.tsx
git commit -m "refactor: replace hardcoded GameEngine constants with tuning store"
```

---

## Task 5: Wire telemetry into GameEngine

**Files:**
- Modify: `components/GameEngine.tsx` (add import, create telemetry instance, log events)

**Step 1: Add import**

After the tuning store import, add:

```typescript
import { createRunTelemetry, RunTelemetry } from '../systems/telemetry/runTelemetry';
```

**Step 2: Create telemetry ref inside component**

Near the other refs (~line 107-120 area), add:

```typescript
const telemetryRef = useRef<RunTelemetry>(createRunTelemetry());
```

**Step 3: Log damage events**

At the damage path (~line 1321, where `livesRef.current--` happens), add immediately after the decrement:

```typescript
telemetryRef.current.logDamage(
  obs.type,
  speedRef.current,
  livesRef.current,
  Math.floor(scoreRef.current / 10)
);
```

**Step 4: Log death events**

At ~line 1342 (where `setStatus(GameStatus.GAMEOVER)` is called), add immediately before it:

```typescript
telemetryRef.current.logDeath(
  Math.floor(scoreRef.current / 10),
  coinsRef.current,
  speedRef.current,
  activePowerUpRef.current?.type ?? null
);
```

**Step 5: Log run summary on game over**

At ~line 1343 (the `onGameOver` call), add immediately after it:

```typescript
telemetryRef.current.logRunSummary(
  Math.floor(scoreRef.current / 10),
  coinsRef.current,
  status === GameStatus.BOSS_FIGHT || status === GameStatus.BOSS_INTRO,
  false,
  localStorage.getItem('beach-cat-dev-tuning') ? 'custom' : 'default'
);
```

**Step 6: Log run summary on victory**

Find the boss defeat / victory transition (where `setStatus(GameStatus.VICTORY)` is called via `onStatusChange`). Around ~line 960-965, after the victory status is set, add:

```typescript
telemetryRef.current.logRunSummary(
  Math.floor(scoreRef.current / 10),
  coinsRef.current,
  true,
  true,
  localStorage.getItem('beach-cat-dev-tuning') ? 'custom' : 'default'
);
```

**Step 7: Expose telemetry via a callback prop**

Add to `GameEngineProps`:

```typescript
onTelemetryReady?: (getTelemetry: () => import('../systems/telemetry/runTelemetry').TelemetryEvent[]) => void;
```

In the component, after creating the telemetry ref, call it once:

```typescript
useEffect(() => {
  onTelemetryReady?.(() => telemetryRef.current.getEvents());
}, [onTelemetryReady]);
```

**Step 8: Verify build**

```bash
npm run build
```

**Step 9: Commit**

```bash
git add components/GameEngine.tsx
git commit -m "feat: wire telemetry logging into GameEngine damage/death/victory paths"
```

---

## Task 6: Build BalancePanel component

**Files:**
- Create: `components/dev/BalancePanel.tsx`

**Step 1: Create directory**

```bash
mkdir -p components/dev
```

**Step 2: Write the BalancePanel**

This is a self-contained component. It uses `useTuningStore` for tuning values and accepts a telemetry export callback as a prop.

Key requirements:
- Fixed position, top-right, `z-50`
- Semi-transparent dark background (`bg-gray-900/90`)
- Max height `90vh` with overflow scroll
- Collapsible sections per group: Physics, Spawning, Difficulty, Assist, Boss
- Each slider: range input with label, current value display, default value dimmed
- Reset per group, reset all
- Preset save/load/delete dropdown
- Telemetry export button
- All styling via Tailwind classes

The component should import:
```typescript
import { useTuningStore } from '../../systems/tuning/useTuningStore';
import { TuningProfile, DEFAULT_TUNING, TUNING_RANGES } from '../../systems/tuning/defaultTuning';
import { TelemetryEvent, exportTelemetryJson } from '../../systems/telemetry/runTelemetry';
```

Props interface:
```typescript
interface BalancePanelProps {
  getTelemetryEvents?: () => TelemetryEvent[];
}
```

Group the tuning keys for section rendering:
```typescript
const GROUPS: Record<string, (keyof TuningProfile)[]> = {
  Physics: ['gravity', 'jumpForce', 'bounceForce', 'initialSpeed', 'speedIncrement'],
  Spawning: ['spawnBaseMs', 'spawnMinMs', 'spawnJitterMs', 'patternEndGapMs', 'harmfulCooldownMs'],
  Difficulty: ['bossThreshold', 'powerupThreshold', 'streakRequired'],
  Assist: ['lowLivesThreshold', 'criticalLivesThreshold', 'hitSpawnGraceMs', 'startSpawnGraceMs'],
  Boss: ['bossIntroEaseMs', 'invincibilityDurationMs'],
};
```

Each slider row renders:
```tsx
<label className="flex items-center justify-between text-xs text-gray-300">
  <span>{key}</span>
  <span className="tabular-nums">{tuning[key]} <span className="text-gray-600">({DEFAULT_TUNING[key]})</span></span>
</label>
<input
  type="range"
  min={TUNING_RANGES[key][0]}
  max={TUNING_RANGES[key][1]}
  step={TUNING_RANGES[key][2]}
  value={tuning[key]}
  onChange={e => setTuning({ [key]: parseFloat(e.target.value) })}
  className="w-full h-1 bg-gray-700 rounded appearance-none cursor-pointer"
/>
```

Preset management section: a text input for preset name, save button, a `<select>` dropdown of existing presets with load/delete buttons.

Telemetry section at the bottom:
```tsx
<button
  onClick={() => getTelemetryEvents && exportTelemetryJson(getTelemetryEvents())}
  disabled={!getTelemetryEvents}
  className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 text-white text-xs font-bold py-2 px-3 rounded"
>
  Export Telemetry JSON
</button>
```

**Step 3: Verify build**

```bash
npm run build
```

**Step 4: Commit**

```bash
git add components/dev/BalancePanel.tsx
git commit -m "feat: add dev BalancePanel component with tuning sliders, presets, and telemetry export"
```

---

## Task 7: Wire BalancePanel into App.tsx

**Files:**
- Modify: `App.tsx`

**Step 1: Add imports**

After existing imports at top of `App.tsx`, add:

```typescript
import BalancePanel from './components/dev/BalancePanel';
import { TelemetryEvent } from './systems/telemetry/runTelemetry';
```

**Step 2: Add state for panel visibility and telemetry getter**

After the existing state declarations (~line 22), add:

```typescript
const [showDevPanel, setShowDevPanel] = useState(false);
const [getTelemetryEvents, setGetTelemetryEvents] = useState<(() => TelemetryEvent[]) | null>(null);
```

**Step 3: Add backtick key listener**

After the `useEffect` for wisdom fetching (~line 175), add:

```typescript
useEffect(() => {
  const handleKey = (e: KeyboardEvent) => {
    if (e.key === '`') setShowDevPanel(prev => !prev);
  };
  window.addEventListener('keydown', handleKey);
  return () => window.removeEventListener('keydown', handleKey);
}, []);
```

**Step 4: Add telemetry ready handler**

Create a callback to receive the telemetry getter from GameEngine:

```typescript
const handleTelemetryReady = useCallback((getter: () => TelemetryEvent[]) => {
  setGetTelemetryEvents(() => getter);
}, []);
```

**Step 5: Pass callback to GameEngine**

On the `<GameEngine>` component (~line 407-415), add the prop:

```tsx
onTelemetryReady={handleTelemetryReady}
```

**Step 6: Render BalancePanel**

At the very end of the return JSX, just before the closing `</div>` (~line 583), add:

```tsx
{showDevPanel && (
  <BalancePanel getTelemetryEvents={getTelemetryEvents ?? undefined} />
)}
```

**Step 7: Verify build**

```bash
npm run build
```

**Step 8: Manual smoke test**

```bash
npm run dev
```

Open browser, press backtick — panel should appear top-right. Move sliders, verify values update. Close panel, gameplay should be normal.

**Step 9: Commit**

```bash
git add App.tsx components/GameEngine.tsx
git commit -m "feat: wire BalancePanel into App with backtick toggle and telemetry passthrough"
```

---

## Task 8: Final verification and docs update

**Files:**
- Modify: `docs/PROGRESS.md`
- Modify: `features.json`

**Step 1: Full build check**

```bash
npm run build
```

**Step 2: Update PROGRESS.md**

Add a new session entry at the top of PROGRESS.md (after the "ADD NEW SESSIONS AT THE TOP" comment) documenting Phase 9 completion.

**Step 3: Update features.json**

Set all Phase 9 task statuses to `"pass"` and phase status to `"pass"`.

**Step 4: Commit**

```bash
git add docs/PROGRESS.md features.json
git commit -m "docs: update progress and features for Phase 9 completion"
```

---

## Agent Team Assignment

These tasks can be distributed to a 3-agent team:

| Agent | Tasks | Dependencies |
|-------|-------|-------------|
| **tuning-agent** | Task 1, Task 2, Task 4 | None — goes first |
| **panel-agent** | Task 6, Task 7 | Blocked on Task 1, 2, 4 completing (needs tuning store in GameEngine) |
| **telemetry-agent** | Task 3, Task 5 | Blocked on Task 4 completing (needs tuning store in GameEngine) |
| **lead** | Task 8 | After all agents finish |

Execution order:
1. **tuning-agent** does Tasks 1 → 2 → 4 (sequential, ~10 min)
2. Once tuning-agent finishes, **panel-agent** and **telemetry-agent** start in parallel
3. panel-agent does Tasks 6 → 7, telemetry-agent does Tasks 3 → 5
4. Lead does Task 8 after both finish
