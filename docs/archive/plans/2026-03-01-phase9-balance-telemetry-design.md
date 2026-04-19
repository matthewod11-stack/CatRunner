# Phase 9: Live Balancing + Telemetry — Design

**Date:** 2026-03-01
**Status:** Approved
**Scope:** Dev-only balance panel, tuning store, run telemetry with export

---

## Overview

Add runtime tuning controls and structured telemetry to accelerate gameplay balancing. The balance panel is dev-only (toggled via backtick key), has zero impact on normal gameplay, and persists tuning profiles to localStorage.

---

## 1. Tuning Store

### Files
- `systems/tuning/defaultTuning.ts` — `TuningProfile` interface + canonical defaults
- `systems/tuning/useTuningStore.ts` — React hook for read/write + localStorage persistence

### TuningProfile Interface

```typescript
interface TuningProfile {
  // Physics
  gravity: number;            // 0.75
  jumpForce: number;          // 17
  bounceForce: number;        // 15
  initialSpeed: number;       // 7.5
  speedIncrement: number;     // 0.002

  // Spawning
  spawnBaseMs: number;        // 1225
  spawnMinMs: number;         // 520
  spawnJitterMs: number;      // 320
  patternEndGapMs: number;    // 600
  harmfulCooldownMs: number;  // 400

  // Difficulty
  bossThreshold: number;      // 50
  powerupThreshold: number;   // 20
  streakRequired: number;     // 5

  // Assist
  lowLivesThreshold: number;       // 2
  criticalLivesThreshold: number;  // 1
  hitSpawnGraceMs: number;         // 900
  startSpawnGraceMs: number;       // 1800

  // Boss
  bossIntroEaseMs: number;   // 12000
  invincibilityDurationMs: number; // 2000
}
```

### Behavior
- `useTuningStore()` returns `{ tuning, setTuning, resetToDefaults, presets, savePreset, loadPreset, deletePreset }`
- localStorage key: `beach-cat-dev-tuning`
- Presets stored under: `beach-cat-dev-tuning-presets`
- When no overrides exist, returns `DEFAULT_TUNING` (identical to current hardcoded values)

### GameEngine Integration
- Replace top-level `const` declarations with destructured values from `useTuningStore()`
- All inline assist calculations (lowLivesMode bonuses, etc.) remain in GameEngine but reference tuning values instead of hardcoded constants

---

## 2. Balance Panel UI

### File
- `components/dev/BalancePanel.tsx`

### Activation
- Backtick key (`` ` ``) toggles panel visibility
- Panel state (open/closed) does not persist across page loads — always starts closed

### Layout
- Fixed position, top-right corner
- Semi-transparent dark background (see game underneath)
- Collapsible sections per tuning group (Physics, Spawning, Difficulty, Assist, Boss)
- Each slider: label, current value, default value (dimmed)

### Controls
- Range slider per tuning value with sensible min/max/step
- Reset button per group
- Global "Reset All to Defaults" button
- Preset management: save named preset, load from dropdown, delete preset
- Telemetry export button (downloads JSON file)

### Wiring
- Reads/writes via `useTuningStore()` — no prop drilling to GameEngine
- Rendered in `App.tsx`, conditionally shown based on backtick toggle state

---

## 3. Telemetry System

### File
- `systems/telemetry/runTelemetry.ts`

### Event Types

```typescript
interface DamageEvent {
  type: 'damage';
  timestamp: number;
  obstacleType: string;
  speed: number;
  livesRemaining: number;
  score: number;
}

interface DeathEvent {
  type: 'death';
  timestamp: number;
  score: number;
  coins: number;
  speed: number;
  activePowerUp: string | null;
  damageCount: number;
}

interface RunSummaryEvent {
  type: 'run_summary';
  timestamp: number;
  durationMs: number;
  finalScore: number;
  coinsCollected: number;
  bossReached: boolean;
  bossDefeated: boolean;
  damageCount: number;
  tuningProfile: string; // "default" or preset name
}

type TelemetryEvent = DamageEvent | DeathEvent | RunSummaryEvent;
```

### API
- `createRunTelemetry()` — returns `{ logDamage, logDeath, logRunSummary, getEvents, clear }`
- Events stored in a plain array (ref-based during play)
- No localStorage persistence — telemetry is ephemeral per run
- Export via balance panel button: downloads `beach-kitty-telemetry-{ISO-date}.json`

### GameEngine Integration
- Call `logDamage()` in existing damage/collision handler
- Call `logDeath()` when lives reach 0
- Call `logRunSummary()` on game over or victory

---

## 4. Implementation Strategy

### Agent Team (3 agents, sequential then parallel)

| Order | Agent | Scope | Key Files |
|-------|-------|-------|-----------|
| 1st | tuning-agent | Extract constants, build tuning store, wire GameEngine | `systems/tuning/defaultTuning.ts`, `systems/tuning/useTuningStore.ts`, `GameEngine.tsx` |
| 2nd (parallel) | panel-agent | Build balance panel UI, presets, backtick toggle | `components/dev/BalancePanel.tsx`, `App.tsx` |
| 2nd (parallel) | telemetry-agent | Build telemetry logger, wire into GameEngine | `systems/telemetry/runTelemetry.ts`, `GameEngine.tsx` |

tuning-agent runs first because both panel-agent and telemetry-agent depend on `TuningProfile` type and the `useTuningStore` hook.

### Verification
- `npm run build` must pass after each agent's work
- Gameplay with panel closed must be identical to current behavior
- Panel open + default values must also produce identical gameplay

---

## 5. Non-Goals

- No telemetry server/upload — local export only
- No player-facing UI — dev-only
- No hot-reload of tuning mid-frame — values read at frame start are used for that frame
- No automated replay from telemetry data (deferred)
