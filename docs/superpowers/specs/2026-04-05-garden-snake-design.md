# Garden Snake (GARDEN_SNAKE) — Full Level Design Spec

**Date:** 2026-04-05  
**Level ID:** `GARDEN_SNAKE`  
**Genre:** Grid snake  
**Victory:** Complete the **patrol finale** after **~60–90s** of escalating garden play (no standalone 2-minute survive)

---

## Overview

Garden Snake is a classic grid snake set in a backyard: the cat’s “tail” grows from treats, speed and pressure ramp up over a **single continuous session**, then a **territorial dog** enters and **patrols predictable paths** for a short window. The player **wins** only after **surviving the finale duration** without the head colliding with the dog (walls and self-collision rules unchanged).

**Design pillars**

- **Readable threats:** Dog moves on the **same grid** as the snake; no pixel-realistic collision surprises.
- **Escalation, not marathon:** Total intended run (normal + finale) **~75–105s** tuned in config — friendly for retries and campaign pacing.
- **Lightweight boss:** The dog is a **moving hazard**, not a multi-phase boss with HP — same engineering complexity as a smart obstacle.
- **Campaign parity:** Victory is expressed as a **`goal`** condition for metadata/UI; stars still come from **final score**.

---

## Approach (selected)

| Approach | Summary | Trade-offs |
|----------|---------|------------|
| **A — Timer phases** | Config: `normalPhaseMs` + `finaleDurationMs`. At end of normal → start finale; win = survive finale timer with dog active. | Simple to tune and test; clear HUD copy (“Patrol!” + countdown). |
| **B — Milestone gate** | Must hit **min length or score** before finale can start (or timer pauses until achieved). | Higher skill ceiling; risks players stuck in normal too long. |
| **C — Discrete waves** | Hard cuts every N seconds (new wall batch, message). | More “game show,” slightly more code for transitions. |

**Recommendation:** **A** as the spine, with **soft escalation** during normal (speed steps, optional extra wall seeds) so it *feels* like C without formal wave UI.

---

## Phase structure

| Phase | Duration (default band) | Objective | Lose conditions |
|-------|-------------------------|-----------|-----------------|
| **Normal (garden)** | **60–90s** (`normalPhaseMs`, e.g. 75_000) | Eat treats, grow, score; avoid walls and self | Head vs wall/self → lose life, reset snake position/length per current rules |
| **Finale (patrol)** | **15–25s** (`finaleDurationMs`, e.g. 20_000) | **Survive** until finale timer hits 0 while dog patrols | Head vs dog cell = same as wall; head vs wall/self still applies |

**HUD**

- Normal: show **time until patrol** (countdown) + score/length as today.
- Finale: show **“Patrol!”** (or similar) + **finale countdown**; optionally pulse border tint.

**On life loss during finale**

- **Preferred:** Reset **snake only** (center, default length), **keep finale timer and dog state** — avoids punishing one mistake with full finale restart.
- **Alternative (harder):** Restart entire finale from full duration — document as tuning flag if needed later.

---

## Escalation (normal phase only)

All values live in `SnakeLevelConfig` (or nested `escalation` object) for tuning.

- **Move interval:** Step down toward `minMoveInterval` using **time-based curve** (e.g. every 10s shave a few ms) rather than only on eat — so pressure rises even between pickups.
- **Treats:** Keep single pickup type for v1; **+score** and **growth** on eat; optional small **score multiplier** streak (reuse existing streak fields if already wired).
- **Walls:** Initial border + `wallCount` random interior cells; optional **late normal** spawn of **1–2 extra wall cells** at fixed timestamps (deterministic seed from run start optional — v1 can use `time.now` buckets).

**Out of scope for v1:** Multiple food types, power-ups, moving hazards during normal.

---

## Finale — patrol dog

**Representation**

- Dog occupies **one grid cell** per tick (or two if we want “long dog” later — **v1: one cell**).
- Rendered as a distinct color/sprite layer (Graphics or simple shape); depth above grass, below or above snake head per readability (head must read clearly — **dog below snake graphics** or contrasting outline).

**Movement (v1)**

- **Back-and-forth patrol** on a **precomputed segment** of the grid (e.g. horizontal row through the middle, or vertical column), reversing at ends.
- Path chosen at finale start: prefer rows/cols with **no wall** on the segment; if cluttered, pick longest clear 1D line in interior.
- Move **once per snake tick** (same `moveInterval` as snake at finale entry) so rhythm stays locked — avoids desync bugs.

**Collision**

- If `headCell === dogCell` after snake move (or after dog move — define **single order**: e.g. snake moves, then dog, then collision check), trigger same pipeline as wall hit (life loss, particles, SFX).

**Food during finale**

- **Stop spawning new food** when finale begins; existing food cell can be **cleared** or left as optional risk/reward — **v1: clear food** to focus attention on dog.

---

## Scoring and stars

- **Score sources:** Pickup points, streak/multiplier (if kept), optional **time bonus** at win (small).
- **Star thresholds:** Keep `[200, 500, 900]` initially; rebalance after playtest (shorter run ⇒ scores may need retuning).

---

## Victory metadata and types

- **`CAMPAIGN_LEVEL_META` / config:** Change `victoryCondition` from `{ type: 'survive', durationMs: 120000 }` to **`{ type: 'goal', description: 'Survive the garden patrol' }`** (or similar copy).
- **`SnakeLevelConfig`:** Replace or repurpose `surviveTimeMs`:
  - Add **`normalPhaseMs`** and **`finaleDurationMs`** (required).
  - Deprecate/remove `surviveTimeMs` or alias it for migration during refactor.
- **`LevelCompletePayload.victoryType`:** Emit **`'goal'`** on win (Phaser scene), consistent with new `victoryCondition`.

---

## Code architecture (aligned with levelbuilder / City Heights pattern)

**Managers** (each `create` / `update` / `destroy`), thin `SnakeScene` orchestrator (~300–500 lines target after extraction):

| Manager | Responsibility |
|---------|----------------|
| **GridRenderManager** | Checkerboard, borders, optional garden-tint overlays |
| **WallManager** | Wall set, interior random + timed additions, draw |
| **SnakeSimManager** | Body array, direction queue, step tick, self/wall collision |
| **FoodManager** | Spawn empty cell, sprite, despawn on phase change |
| **PatrolDogManager** | Path pick, position update, draw, head collision query |
| **PhaseController** | Normal vs finale timers, transitions, HUD strings, enable/disable food |
| **Effects** | Reuse `EffectsManager` where possible |

**Pure logic modules (Vitest)**

- Phase transition: given elapsed, flags for finale started / completed.
- Patrol path: given grid, walls, pick segment; step position with bounce.
- Collision helpers: grid key sets, head vs obstacle.

**SFX (PhaserAudio)**

- Eat, wall/self hit, **finale start sting**, tick optional, **win burst**.

---

## Audio

- **Music:** Defer full track; levelbuilder scope allows **SFX-only** or light ambient — match other short genre levels.
- **SFX:** Required hooks listed above.

---

## Testing and QA

- Unit tests for phase math, patrol bounce, spawn food exclusion.
- `npm run test:run` + `npm run build` before merge.
- Manual: keyboard arrows, pause, life loss in normal vs finale, win only after finale timer.

---

## Explicit non-goals (this spec)

- Final art pass, custom sprites, narrative cutscenes.
- Multiplayer or daily challenge modifiers.
- New `VictoryCondition` union member unless product later demands it — **`goal` is sufficient**.

---

## Open tuning defaults (starting point)

| Key | Suggested value |
|-----|-----------------|
| `normalPhaseMs` | 75_000 |
| `finaleDurationMs` | 20_000 |
| `baseMoveInterval` | 180 |
| `minMoveInterval` | 70 |
| `startLength` | 3 |
| `wallCount` | 8 |

---

## Summary

Garden Snake becomes a **~90s campaign snack**: escalating snake on a garden grid, then a **short dog patrol finale** as a readable “boss-shaped” hazard. Config and campaign metadata move from **2-minute survive** to **goal + two-phase timers**; implementation follows the **manager + pure logic + tests** pattern used for City Heights.
