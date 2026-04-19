# Phase 3: Behavior System Library — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Extract hardcoded obstacle movement and collision behaviors from GameEngine.tsx into pure functions in `systems/behaviors.ts` and `systems/collisionHandlers.ts`, then wire GameEngine to call them.

**Architecture:** Pure functions that take obstacle state + context, return data. Engine applies side effects (sounds, particles, score). No new React state, props, or context.

**Tech Stack:** TypeScript, existing types from `types.ts` and `systems/tuning/defaultTuning.ts`

---

### Task 1: Create `systems/behaviors.ts` with `computeSwoopY`

**Files:**
- Create: `systems/behaviors.ts`

**Step 1: Create behaviors.ts with computeSwoopY**

Extract the swoop easing math from `components/GameEngine.tsx:1134-1155` into a pure function.

```ts
import type { WorldEntity } from '../types';

/**
 * Compute the Y position for a swooping seagull based on its X position.
 * Uses ease-in-out cubic easing for smooth dive-and-recover trajectory.
 */
export function computeSwoopY(obsX: number, screenWidth: number): number {
  const centerX = screenWidth / 2;
  const swoopStartY = 280;
  const swoopLowY = 150;
  const swoopEndY = 200;

  const easeInOutCubic = (t: number): number =>
    t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

  if (obsX > centerX) {
    // Approaching center — swooping down
    const distFromCenter = Math.abs(obsX - centerX);
    const prog = Math.min(distFromCenter / centerX, 1);
    const eased = easeInOutCubic(prog);
    return swoopStartY + (swoopLowY - swoopStartY) * eased;
  } else {
    // Past center — swooping back up
    const upProg = (centerX - obsX) / centerX;
    const eased = easeInOutCubic(upProg);
    return swoopLowY + (swoopEndY - swoopLowY) * eased;
  }
}
```

**Step 2: Verify build**

Run: `npm run build`
Expected: Clean build, no errors

**Step 3: Commit**

```bash
git add systems/behaviors.ts
git commit -m "feat(phase3): add computeSwoopY behavior function"
```

---

### Task 2: Add `checkPoopDrop` to `systems/behaviors.ts`

**Files:**
- Modify: `systems/behaviors.ts`

**Step 1: Add checkPoopDrop function**

Extract the poop-drop timing logic from `components/GameEngine.tsx:844-877` into a pure function.

```ts
/**
 * Check if a poop-type seagull should drop a projectile this frame.
 * Returns a new SAND_PROJECTILE entity if the drop interval has elapsed, else null.
 * Caller is responsible for:
 *   - pushing the returned entity into the obstacles array
 *   - updating obs.lastPoopTime = now
 *   - updating lastHarmfulSpawnTime = now
 */
export function checkPoopDrop(
  obs: WorldEntity,
  now: number,
  lowLivesMode: boolean,
  canSpawnPoop: boolean
): WorldEntity | null {
  if (obs.type !== 'SEAGULL' || obs.seagullType !== 'poop' || !obs.lastPoopTime || !canSpawnPoop) {
    return null;
  }

  const timeSinceLastPoop = now - obs.lastPoopTime;
  const delayBase = lowLivesMode ? 2600 : 2000;
  const delayRange = lowLivesMode ? 1200 : 1000;

  if (timeSinceLastPoop <= delayBase + Math.random() * delayRange) {
    return null;
  }

  const seagullX = obs.x + obs.width / 2;
  const seagullY = obs.y ?? 220;

  return {
    id: Date.now() + Math.random(),
    type: 'SAND_PROJECTILE',
    x: seagullX,
    y: seagullY,
    width: 60,
    height: 60,
    speed: 0,
    vx: 0,
    vy: 2 + Math.random() * 2,
    rotation: 0,
    isPassed: false,
  };
}
```

**Step 2: Verify build**

Run: `npm run build`
Expected: Clean build, no errors

**Step 3: Commit**

```bash
git add systems/behaviors.ts
git commit -m "feat(phase3): add checkPoopDrop behavior function"
```

---

### Task 3: Create `systems/collisionHandlers.ts`

**Files:**
- Create: `systems/collisionHandlers.ts`

**Step 1: Create collisionHandlers.ts with all three handlers**

Extract collision logic from `components/GameEngine.tsx:1251-1334` into pure functions.

```ts
import type { EntityType } from '../types';
import type { TuningProfile } from './tuning/defaultTuning';

export const BOUNCE_POINTS = 10;

export interface CollisionResult {
  bounceForce?: number;
  jumpCount?: number;
  slowDuration?: number;
  points?: number;
  markAs: 'collected' | 'passed' | 'none';
  particleColor?: string;
  sounds: string[];
}

/**
 * Handle stomp-from-above collision on bounceable/stompable obstacles.
 * Covers: CRAB, BEACHBALL, SEAGULL (dive), SAND_PROJECTILE.
 */
export function handleBounceCollision(
  obsType: EntityType,
  tuning: TuningProfile
): CollisionResult {
  const base = { points: BOUNCE_POINTS };

  if (obsType === 'BEACHBALL') {
    return {
      ...base,
      bounceForce: tuning.bounceForce,
      jumpCount: 0,
      markAs: 'passed',
      particleColor: '#fde047',
      sounds: ['meow', 'boing-boing-bounce-454474'],
    };
  }

  if (obsType === 'CRAB') {
    return {
      ...base,
      bounceForce: 8,
      jumpCount: 0,
      markAs: 'collected',
      particleColor: '#ef4444',
      sounds: ['meow', 'cartoon-splat-310479'],
    };
  }

  if (obsType === 'SEAGULL') {
    return {
      ...base,
      bounceForce: 8,
      jumpCount: 1,
      markAs: 'collected',
      particleColor: '#ffffff',
      sounds: ['meow', 'cartoon-splat-310479'],
    };
  }

  // SAND_PROJECTILE
  return {
    ...base,
    bounceForce: 8,
    jumpCount: 1,
    markAs: 'collected',
    particleColor: '#ffffff',
    sounds: ['meow'],
  };
}

/**
 * Handle collision with slow-on-contact obstacles (SANDCASTLE, TIDEPOOL).
 */
export function handleSlowCollision(obsType: EntityType): CollisionResult {
  return {
    slowDuration: 2000,
    markAs: 'passed',
    particleColor: obsType === 'TIDEPOOL' ? '#60a5fa' : '#fbbf24',
    sounds: ['hit'],
  };
}

/**
 * Handle harmful collision (non-stomp hit from CRAB, BEACHBALL, PALM_TREE, SAND_PROJECTILE).
 * Engine is responsible for decrementing lives, invincibility, screen shake, etc.
 */
export function handleHarmfulCollision(): CollisionResult {
  return {
    markAs: 'none',
    sounds: ['hiss'],
  };
}
```

**Step 2: Verify build**

Run: `npm run build`
Expected: Clean build, no errors

**Step 3: Commit**

```bash
git add systems/collisionHandlers.ts
git commit -m "feat(phase3): add collision handler functions"
```

---

### Task 4: Update `systems/` barrel exports

**Files:**
- Modify or create: `systems/index.ts` (does not currently exist as a barrel — telemetry and tuning are imported directly)

Since systems/ has no index.ts and existing imports go directly to submodules, **skip creating a barrel** — just import the new files directly where needed in GameEngine. This avoids changing existing import paths.

No action needed for this task. Proceed to Task 5.

---

### Task 5: Wire `computeSwoopY` into GameEngine

**Files:**
- Modify: `components/GameEngine.tsx:1134-1155`

**Step 1: Add import at top of GameEngine.tsx**

After the existing imports (around line 10), add:

```ts
import { computeSwoopY, checkPoopDrop } from '../systems/behaviors';
import { handleBounceCollision, handleSlowCollision, handleHarmfulCollision, CollisionResult, BOUNCE_POINTS } from '../systems/collisionHandlers';
```

**Step 2: Replace swoop inline code**

Replace `components/GameEngine.tsx:1134-1155` (the `if (obs.type === 'SEAGULL' && obs.isSwooping)` block) with:

```ts
        if (obs.type === 'SEAGULL' && obs.isSwooping) {
          newY = computeSwoopY(newX, window.innerWidth);
        }
```

**Step 3: Verify build**

Run: `npm run build`
Expected: Clean build, no errors

**Step 4: Commit**

```bash
git add components/GameEngine.tsx
git commit -m "feat(phase3): wire computeSwoopY into GameEngine"
```

---

### Task 6: Wire `checkPoopDrop` into GameEngine

**Files:**
- Modify: `components/GameEngine.tsx:844-877`

**Step 1: Replace poop-drop forEach block**

Replace the existing poop-drop block (`components/GameEngine.tsx:844-877`) with:

```ts
    // Handle seagull poop drops - with stacking prevention
    if (status === GameStatus.PLAYING || status === GameStatus.BOSS_FIGHT) {
      const harmfulCooldown = tuning.harmfulCooldownMs + (lowLivesMode ? 250 : 0);
      const canSpawnPoop = (now - lastHarmfulSpawnTime.current) > harmfulCooldown;

      obstaclesRef.current.forEach(obs => {
        const projectile = checkPoopDrop(obs, now, lowLivesMode, canSpawnPoop);
        if (projectile) {
          obstaclesRef.current.push(projectile);
          obs.lastPoopTime = now;
          lastHarmfulSpawnTime.current = now;
        }
      });
    }
```

**Step 2: Verify build**

Run: `npm run build`
Expected: Clean build, no errors

**Step 3: Commit**

```bash
git add components/GameEngine.tsx
git commit -m "feat(phase3): wire checkPoopDrop into GameEngine"
```

---

### Task 7: Wire collision handlers into GameEngine

**Files:**
- Modify: `components/GameEngine.tsx:1251-1334`

This is the largest replacement. We add an `applyCollisionResult` helper inside GameEngine, then replace the per-type if/else chain.

**Step 1: Remove the local BOUNCE_POINTS constant**

Delete line 1253 (`const BOUNCE_POINTS = 10;`) — it's now imported from collisionHandlers.

**Step 2: Add applyCollisionResult helper**

Add this helper function inside the GameEngine component (e.g. near other helper functions like `spawnBopParticles`). This is a local function, not exported — it accesses component refs and state setters via closure.

```ts
    const applyCollisionResult = (result: CollisionResult, obs: Obstacle, oRectTop: number) => {
      result.sounds.forEach(s => playSound(s));
      if (result.particleColor) {
        spawnBopParticles(obs.x + obs.width / 2, oRectTop, result.particleColor);
      }
      if (result.bounceForce !== undefined) {
        playerRef.current.vy = result.bounceForce;
      }
      if (result.jumpCount !== undefined) {
        playerRef.current.jumpCount = result.jumpCount;
      }
      if (result.points) {
        scoreRef.current += result.points;
        const scoreId = Date.now() + Math.random();
        setFloatingScores(prev => [...prev, { id: scoreId, x: obs.x + obs.width / 2, y: oRectTop, value: result.points! }]);
        setTimeout(() => setFloatingScores(prev => prev.filter(s => s.id !== scoreId)), 1500);
      }
      if (result.slowDuration) {
        slowdownUntilRef.current = now + result.slowDuration;
      }
      if (result.markAs === 'collected') obs.isCollected = true;
      else if (result.markAs === 'passed') obs.isPassed = true;
    };
```

**NOTE:** `applyCollisionResult` references `now` from the game loop scope. It must be defined inside the `gameLoop` function (where `now` is available), or `now` must be passed as a parameter. The cleanest approach: define it inside `gameLoop` right before the collision detection loop, so it closes over `now`.

**Step 3: Replace the stomp-from-above if/else chain**

Replace lines 1252-1304 (the `if (isLanding) { ... }` block containing per-type branches) with:

```ts
        const isLanding = playerRef.current.vy < 0 && (kRect.b >= oRect.t - 30);
        if (isLanding) {
          if (obs.type === 'CRAB' || obs.type === 'BEACHBALL' || (obs.type === 'SEAGULL' && obs.seagullType === 'dive') || obs.type === 'SAND_PROJECTILE') {
            const result = handleBounceCollision(obs.type, tuning);
            applyCollisionResult(result, obs, oRect.t);
            continue;
          }
```

**Step 4: Replace slow-on-contact branches**

Replace lines 1305-1316 (SANDCASTLE and TIDEPOOL blocks) with:

```ts
        } else if ((obs.type === 'SANDCASTLE' || obs.type === 'TIDEPOOL') && !isCurrentlyHurt) {
          const result = handleSlowCollision(obs.type);
          applyCollisionResult(result, obs, oRect.t);
```

**Step 5: Replace harmful collision branch**

Replace line 1317's condition entry. The harmful branch stays mostly intact since the engine owns the damage logic, but we use `handleHarmfulCollision()` for the sound:

```ts
        } else if (HARMFUL_TYPES.includes(obs.type) && !isCurrentlyHurt && activePowerUpRef.current?.type !== 'SUPER_SIZE') {
          const result = handleHarmfulCollision();
          result.sounds.forEach(s => playSound(s));
          // Engine-owned damage logic continues below unchanged
          livesRef.current--;
          telemetryRef.current.logDamage(obs.type, speedRef.current, livesRef.current, Math.floor(scoreRef.current / 10));
          invincibilityUntilRef.current = now + tuning.invincibilityDurationMs;
          safeSpawnUntilRef.current = now + tuning.hitSpawnGraceMs;
          streakRef.current = 0;
          triggerFreezeFrame(80);
          triggerScreenShake(12);
          setHitFlash(true);
          setTimeout(() => setHitFlash(false), 150);
```

(The rest of the harmful hit block — lives check, game over, etc. — stays unchanged.)

**Step 6: Verify build**

Run: `npm run build`
Expected: Clean build, no errors

**Step 7: Commit**

```bash
git add components/GameEngine.tsx
git commit -m "feat(phase3): wire collision handlers into GameEngine"
```

---

### Task 8: Final verification and feature tracking update

**Files:**
- Modify: `features.json`
- Modify: `PROGRESS.md`

**Step 1: Run full build**

Run: `npm run build`
Expected: Clean build, no errors

**Step 2: Manual play-test checklist**

Run `npm run dev` and verify in browser:
- [ ] Swooping seagulls follow the same curved dive path
- [ ] Poop-seagulls drop projectiles at similar intervals
- [ ] Stomping a crab/beachball/seagull/projectile bounces the player and awards points
- [ ] Walking into a sandcastle or tidepool slows the player
- [ ] Getting hit by a crab/beachball/palm tree reduces lives with hiss sound
- [ ] Boss fight still works normally

**Step 3: Update features.json**

Set phase-3 status to "pass" and update each task.

**Step 4: Update PROGRESS.md**

Add session entry with completed work.

**Step 5: Commit**

```bash
git add features.json PROGRESS.md
git commit -m "docs: update tracking for Phase 3 completion"
```
