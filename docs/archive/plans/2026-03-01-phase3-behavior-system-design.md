# Phase 3: Behavior System Library — Design

> **Date:** 2026-03-01
> **Scope:** Extract hardcoded obstacle behaviors from GameEngine.tsx into reusable pure functions
> **Approach:** Extract-only (pure math/logic), create + wire in same phase

---

## Decisions

- **Pure functions** over registry/strategy pattern — simpler for 4 behaviors, can add lookup layer in Phase 6
- **Extract + wire now** — replace inline GameEngine code with calls so we verify immediately
- **Engine owns side effects** — sounds, particles, score, state mutations stay in GameEngine; behaviors return data

---

## File Structure

```
systems/
  behaviors.ts          ← movement behaviors (swoop, dropProjectile)
  collisionHandlers.ts  ← collision responses (bounce, slowOnContact, harmful)
  index.ts              ← barrel export (update existing)
```

---

## behaviors.ts

### `computeSwoopY(obsX: number, screenWidth: number): number`

Pure math replacing GameEngine lines 1134-1155. Eased cubic trajectory for dive-seagulls:
- Approaching center: swoop down from 280 to 150
- Past center: recover up to 200
- Uses ease-in-out cubic easing

### `checkPoopDrop(obs: WorldEntity, now: number, lowLivesMode: boolean, canSpawnPoop: boolean): WorldEntity | null`

Replaces GameEngine lines 844-877. Checks timing for poop-type seagulls:
- Returns a new SAND_PROJECTILE entity if drop interval elapsed, else null
- Drop delay: 2000-3000ms normal, 2600-3800ms in low-lives mode
- Projectile: 60x60, vy 2-4, no horizontal movement
- Caller responsible for pushing entity, updating lastPoopTime and lastHarmfulSpawnTime

---

## collisionHandlers.ts

### `CollisionResult` interface

```ts
interface CollisionResult {
  bounceForce?: number;
  jumpCount?: number;
  slowDuration?: number;
  points?: number;
  markAs: 'collected' | 'passed' | 'none';
  particleColor?: string;
  sounds: string[];
}
```

### `handleBounceCollision(obsType: EntityType, tuning: TuningProfile): CollisionResult`

Covers stomp-from-above on BEACHBALL, SEAGULL (dive), SAND_PROJECTILE:
- BEACHBALL: bounceForce from tuning, 'boing' sound, yellow particles, markAs 'passed'
- SEAGULL dive: vy=8, jumpCount=1, splat sound, white particles, markAs 'collected'
- SAND_PROJECTILE: vy=8, jumpCount=1, white particles, markAs 'collected'
- All award BOUNCE_POINTS

### `handleSlowCollision(obsType: EntityType): CollisionResult`

Covers SANDCASTLE and TIDEPOOL:
- slowDuration: 2000ms
- SANDCASTLE: gold particles
- TIDEPOOL: blue particles
- markAs 'passed', hit sound

### `handleHarmfulCollision(): CollisionResult`

Covers harmful-type non-stomp hits (CRAB, BEACHBALL, PALM_TREE, SAND_PROJECTILE):
- Returns hiss sound, markAs 'none' (engine handles damage/invincibility)

---

## GameEngine Wiring

Four mechanical replacements:

1. **Swoop movement** — replace inline easing with `computeSwoopY()` call
2. **Poop drops** — replace forEach block with `checkPoopDrop()` call per seagull
3. **Collision if/else chain** — replace per-type branches with `handleBounceCollision()`, `handleSlowCollision()`, `handleHarmfulCollision()` calls
4. **applyCollisionResult** — small private helper inside GameEngine to avoid repeating sound/particle/score/mark logic

No new props, state, or context introduced. Imports only.

---

## Verification

- `npm run build` passes with no new errors
- Game plays identically: swoop trajectory, poop timing, bounce feel, slow effect unchanged
- BOUNCE_POINTS value stays at 5 (from tuning)
