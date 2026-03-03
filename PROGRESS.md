# Progress — Beach Kitty

---

## Session: 2026-03-02 (Phase 3 + Gameplay Fixes)

### Completed
- **Phase 3: Behavior System Library** — complete
  - Created `systems/behaviors.ts` with `computeSwoopY` and `checkPoopDrop` pure functions
  - Created `systems/collisionHandlers.ts` with `CollisionResult` interface + 3 handlers (`handleBounceCollision`, `handleSlowCollision`, `handleHarmfulCollision`)
  - Wired all functions into `GameEngine.tsx` with `applyCollisionResult` helper
  - Net reduction: 76 lines from GameEngine.tsx
  - All spec reviews passed (behaviors, collisions, wiring)
- **Bug fixes discovered during play-test:**
  - Fixed SAND_PROJECTILE gravity direction: `vy + gravity` → `vy - gravity` (was backwards vs player physics)
  - Fixed poop vy sign: positive → negative so poop falls downward instead of upward
  - Added `newY < -200` removal condition for projectiles falling off screen
  - Raised seagull spawn heights: dive seagulls 220/280 → 350/400, swoop trajectory 280→150→200 → 400→170→280
  - Updated seagull Y fallback in collision detection to match new heights

### In Progress
- Gameplay tuning fixes are uncommitted (pending play-test verification)

### Issues Encountered
- SAND_PROJECTILE gravity was inverted vs player physics (pre-existing bug, not Phase 3 regression)
- Seagull spawn heights were too low relative to the cat (pre-existing tuning issue)

### Next Session Should
- Play-test the seagull/poop fixes to confirm they feel right
- Consider spawn rate tuning (user reported "too many obstacles, feels constant")
- Consider sunset clock alignment with game progress
- Sound engine overhaul noted for future
- Begin Phase 5 (Obstacle Component Refactor) or Phase 6 (GameEngine Abstraction)
- Pre-existing image import warnings (4 total) remain unrelated to this work

---

## Session: 2026-03-01 (Phase 3 — Behavior System Library)

### Completed
- Created `systems/behaviors.ts` with two pure movement behavior functions:
  - `computeSwoopY` — eased cubic swoop trajectory for dive-seagulls
  - `checkPoopDrop` — poop-drop timing and SAND_PROJECTILE spawning for poop-seagulls
- Created `systems/collisionHandlers.ts` with `CollisionResult` interface and three handlers:
  - `handleBounceCollision` — stomp-from-above for CRAB, BEACHBALL, SEAGULL (dive), SAND_PROJECTILE
  - `handleSlowCollision` — slow-on-contact for SANDCASTLE, TIDEPOOL
  - `handleHarmfulCollision` — damage sound for harmful non-stomp hits
- Wired all functions into `GameEngine.tsx`, replacing ~119 lines of inline code with function calls
- Added `applyCollisionResult` helper inside GameEngine to DRY up sound/particle/score/mark logic
- Net reduction: 76 lines from GameEngine.tsx
- Build passes, all spec reviews pass

### Issues Encountered
- None — mechanical extraction with no behavioral changes

### Next Session Should
- Begin Phase 5 (Obstacle Component Refactor) or Phase 6 (GameEngine Abstraction)
- Phase 6 will wire GameEngine to read from `levels/beach.ts` config instead of hardcoded constants
- Pre-existing image import warnings (4 total in ObstacleComponent.tsx and SandMonster.tsx) remain

---

## Session: 2026-03-01 00:00

### Completed
- Phase 4: Created `levels/beach.ts` with full `BEACH_LEVEL_CONFIG` satisfying the `LevelConfig` interface
- Extracted all hardcoded beach-level values from `GameEngine.tsx` into declarative config: 7 obstacles, 8 patterns, theme, boss tuning, background entities, harmful types
- Created `levels/index.ts` barrel re-export
- Verified build passes — no new type errors introduced

### Issues Encountered
- None — Phase 4 was data-only extraction with no runtime changes
