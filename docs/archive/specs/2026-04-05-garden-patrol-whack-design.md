# Garden Patrol (GARDEN_WHACK) — Full Level Design Spec

**Date:** 2026-04-05  
**Level ID:** `GARDEN_WHACK`  
**Genre:** Whack-a-mole (tap targets in a hole grid)  
**Victory:** Reach **score ≥ target** during the **wave phase**, then **defeat the Gopher King** in the **boss phase**.

---

## Overview

Garden Patrol is a whack-a-mole level set in a backyard garden. Mice pop from mole holes to steal catnip; the player taps them for points, builds **combo multipliers**, and survives **three escalating waves**. After waves, if the score qualifies, a **boss beat** begins: the **Gopher King** appears in sequence across holes and must be whacked multiple times before the level completes.

**Design pillars:**

- **Readable targets:** Silhouette + color distinguish normal, fast bonus, and sneaky mice.
- **Escalation via waves:** Difficulty ramps through spawn density and visibility windows, not obscure rules.
- **Boss as finale:** Short, focused encounter — not a platformer boss — fits the genre.
- **SFX-first audio:** Procedural hits, pops, wave transitions, boss telegraphs; **no new music** in this build (levelbuilder scope).

**Win condition (authoritative):**

1. **Wave phase:** Player has `wavePhaseTimeLimitSec` seconds to reach `victoryCondition.target` score (default **400**, from existing catalog).
2. **Qualify gate:** When the wave timer expires, if `currentScore < target` → **game over**.
3. If qualified → **boss phase** begins (main timer paused or replaced by boss timer).
4. **Boss phase:** Defeat Gopher King (`hitsToDefeat` whacks on the boss entity). On success → `emitLevelComplete` with `victoryType: 'score'` (boss is a sub-mechanic; campaign metadata stays score-type).

**Lives:** **Time-only failure** during waves (plus qualify gate). **No life decrement** on missed moles in v1 — removes confusion with unused `startLives`. Config field `startLives` remains for API consistency but whack scene does not game-over on lives; optional later: whack **penalty** targets cost a life.

---

## Wave Structure

| Wave | Name (HUD) | Duration (default) | Spawn feel | Mouse emphasis |
|------|------------|----------------------|------------|----------------|
| **1** | *Warm-up* | 15 s | Gentler intervals, longer visibility | Mostly **normal** |
| **2** | *Rush* | 15 s | Tighter `spawnIntervalRange` | More **bonus** |
| **3** | *Chaos* | 15 s | Fast spawns, shorter windows | More **sneaky** + bonus |

**Totals:** 45 s wave phase (configurable). Transitions show a brief **toast** or HUD flash (“Wave 2!”) + SFX.

**Spawn model:** Same 3×3 grid (configurable `gridCols` × `gridRows`). Each spawn picks an unoccupied hole, then a mouse **type** from **per-wave weights** (normalized). Existing `mouseTypes` entries (`normal`, `bonus`, `sneaky`) stay; weights are config-driven per wave.

**Speed curve:** `spawnIntervalRange` per wave **overrides** the single global pair; optional `lerp` within a wave is **not** required for v1 — step change at wave boundary is enough.

---

## Boss: Gopher King

- **Entry:** After wave 3 ends and `score >= target`, **pause** mole spawning and show short telegraph (screen tint pulse + `boss_alert` SFX).
- **Behavior:** Boss is a **larger** circle (or compound sprite) that **emerges** from a hole, stays **visible longer** than sneaky mice, then **hides** and **re-emerges** at a **different random hole** (not necessarily adjacent).
- **Damage:** Each successful tap on the boss while visible increments **boss HP** down (e.g. **5 hits** to defeat).
- **Invulnerability:** **Brief invuln** after each hit (`hitInvulnMs`) so one tap doesn’t multi-damage.
- **Failure:** `bossTimeLimitSec` (e.g. **30**); if boss not defeated in time → **game over**.
- **Success:** Big particle burst + `boss_hit` / celebration SFX → `emitLevelComplete`.

---

## Power-ups (v1)

**Two optional effect types**, delivered as **dedicated mouse types** in config (not random overlay):

| Effect | Behavior |
|--------|----------|
| **Slow-mo** | Next **N seconds** (e.g. 3), spawn intervals **multiplied** by ≥1.3 (slower moles). |
| **Double score** | Next **N seconds** (e.g. 5), all point awards ×2 (stacks **after** combo multiplier math: `(points * combo) * 2` or document as `(points * combo * 2)` — pick **one** and test). |

**Spawn:** Low **weight** in waves 2–3 only (config). Whacking the powerup mouse applies the effect **and** awards **0 or small** points (config).

**YAGNI for v1:** No “bad” decoy animals, no mud splash occlusion.

---

## Terrain & Visuals

- **Hole grid:** Procedural **mound + ellipse** (existing style), depth sorted: grass backdrop → holes → moles → effects → HUD.
- **Background:** Richer **garden** read — gradient sky strip optional; **flower** or **fence** accents as simple shapes (graphics), no external art dependency.
- **Wave read:** Subtle **tint** or **vignette** shift per wave (low saturation change) + HUD wave label.

---

## Scoring & Stars

- **Catalog** `starThresholds: [150, 350, 600]` unchanged — star mapping stays in **App / run outcome** from `finalScore`.
- **Combo:** Preserve current rule: streak builds multiplier; miss on empty or expired mole resets streak; **optional** miss SFX soft click.

---

## Technical Architecture

- **`scenes/whack/`** subdirectory: managers implementing `SceneManager` (`create`, `update`, `destroy`) matching platformer pattern.
- **Pure logic:** `waves.ts` (wave index vs elapsed time), `bossState.ts` (hits, invuln window), `spawnWeights.ts` (normalize + pick type) — **Vitest** coverage.
- **`WhackScene.ts`:** Thin orchestrator (~300–500 lines): init managers, forward `update`, handle pointer, bridge events, `PhaserAudio`.

---

## SFX Mapping (PhaserAudio)

Reuse existing `ProceduralSfxType` where possible:

| Event | SFX |
|-------|-----|
| Mole pop | `boing` (short) |
| Whack hit | `coin` or light `hit` |
| Combo tier up | `mult` |
| Wave start | `powerup` |
| Boss enter | `boss_alert` |
| Boss damaged | `boss_hit` |
| Boss defeat | `boss_hit` + particles |
| Game over | `hit` (low) |

**Music:** Optional `startMusic()` low tempo during waves — **defer** to follow-up; not required for levelbuilder completion.

---

## Out of Scope (this build)

- Final sprite art / spine animations  
- New composed music tracks  
- Narrative cutscenes  
- Penalty / decoy animals  
- Mud splash hazard  

---

## Acceptance Criteria

1. Three waves with distinct spawn parameters; visible wave indicator.
2. Timer ends wave phase; **game over** if score `< target`.
3. Boss phase after qualify; boss defeat completes level; boss timeout **game over**.
4. At least one powerup effect works end-to-end.
5. `npm run test:run` passes including new **pure** tests.
6. `npm run build` passes; level loads from campaign with Phaser path.

**Spec references:** `scenes/WhackScene.ts`, `levels/garden-whack.ts`, `types.ts` (`WhackLevelConfig`), `docs/plans/2026-04-05-garden-patrol-whack-implementation.md`.
