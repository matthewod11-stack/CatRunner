# Busy Crossing (STREET) — Full Level Design Spec

**Date:** 2026-04-05  
**Level ID:** `STREET`  
**Genre:** Frogger-style discrete grid crossing  
**Victory:** Goal — reach the fish market and complete **N** crossings (default **N = 3**). No boss.

---

## Overview

Busy Crossing is an urban frogger level: the cat moves on a **grid** from the **bottom sidewalk** to a **top fish market** safe zone, through **three hazard bands** in order — **road → median → two-wheel traffic**. Each successful market visit scores a **crossing**; the cat **resets to the bottom** for the next run. **Crossing 1** uses a **shorter, gentler** phase (teaching); **later crossings** use **remixed lane data** (faster, tighter gaps, more bike emphasis), not a copy of phase 0.

**Design pillars:**

- **Teach order:** cars first (read gaps), then slow median movers (wide / slow), then bikes/scooters (narrow / fast / different rhythm).
- **Hybrid progression:** phase-bound layouts per crossing index; bottom reset between crossings stays **arcade-readable**.
- **No water band** in the shipping layout (replaces the legacy river / log lane metaphor).
- **Data-driven phases** — each crossing index selects a **phase config** (full lane list + tuning). Prefer explicit tables over opaque scaling modifiers so tests can assert “phase 0 has no bike lanes,” “phase 2 increases speeds,” etc.

**Contrast with Beach / City Heights:** discrete hops, screen-space grid, no free-platform exploration; Phaser renders lanes and movers; React stays HUD/menus via existing bridge.

---

## Band Structure (Bottom → Top)

| Order | Band | Role | Hazard family | Player verb |
|-------|------|------|---------------|-------------|
| 0 | **Safe start** | Sidewalk | `safe` | Positioning before road |
| 1 | **Road** | Cars / trucks | `road` | Gap timing, direction alternation |
| 2 | **Median** | 1–2 lanes | `medianSlow` | Slower, wider bodies; timing without bike pace |
| 3 | **Two-wheel** | Bikes / scooters | `bike` | Narrow hit targets, higher speed, different gap rhythm |
| 4 | **Safe goal** | Fish market | `safe` | Crossing completion trigger |

Lanes remain **horizontal strips** with **moving rectangles** (or sprites later); genre stays **2D side-view frogger**, not top-down.

---

## Crossing Phases & Remix Rules

- **`crossingsToWin`:** default **3** (align with existing `STREET_LEVEL_CONFIG` unless playtest changes).
- **Phase table:** **`FroggerCrossingPhase[]`** with at least **3** entries (indices **0, 1, 2**) for crossings **1, 2, 3**.
- **Selection rule:** crossing number **k** (1-based) uses phase **`min(k - 1, phases.length - 1)`** so if **N > phases.length**, the **last phase repeats**.
- **Phase 0 (teaching):** fewer total rows and/or lower speeds / wider gaps; **no bike lanes** or at most one short bike lane — spec must match implementation (pick one in plan: “no bike in phase 0” is simplest to test).
- **Phase 1+:** introduce or expand **bike** lanes; increase **speed** and/or reduce **gaps**; optional extra road or median row — changes are **authored per phase**, not only scaled from phase 0.
- **Reset after goal:** same as today — tween or snap player to **bottom** start column; **timer** may reset per `timeLimit` policy (default: **full timer refresh** each crossing unless design doc in plan says otherwise). **Lives** are run-wide, not per crossing.
- **Scoring:** preserve **forward row bonus** and **crossing completion bonus**; exact numbers live in config or pure scoring helper with tests.

---

## Types & Config (Foundation)

- Extend **`FroggerLane`** (or add a parallel discriminant) so each lane has a **`hazardFamily`** (names TBD in implementation but conceptually): `safe` | `road` | `medianSlow` | `bike`.
- **`FroggerCrossingPhase`:** `{ lanes: FroggerLane[]; label?: string }` plus optional phase overrides (e.g. `timeLimitSeconds` if we ever vary timer per phase — default: use level-global `timeLimit`).
- **`FroggerLevelConfig`:** `phases: FroggerCrossingPhase[]`, `crossingsToWin`, `cellSize`, `startCol`, `timeLimit`, `bgColor`, `startLives`, plus existing campaign meta (`starThresholds`, etc.).
- **Collision:** centralize **per-family hitbox forgiveness** (width fraction, vertical overlap) in **pure functions** + unit tests; scene/managers call helpers only.

---

## Architecture (Refactor Target)

Match **City Heights** pattern:

- **`scenes/frogger/`** — managers implementing a shared **`SceneManager`** shape: `create()`, `update()`, `destroy()`.
- **`FroggerScene.ts`** — thin orchestrator (~300–500 lines target) wiring bridge events, init data, and manager lifecycle.
- **Pure modules** (no Phaser): phase index resolution, lane list validation, AABB / overlap for player vs mover, optional score computation.
- **Tests (Vitest):** phase selection, collision rules, scoring helpers; expand as managers stabilize.

Exact manager names are left to the implementation plan; suggested split for planning: **lane view / background**, **hazard spawn & motion**, **player grid & hop**, **phase / crossing state**, **HUD sync** (or delegate to existing bridge patterns).

---

## Juice, SFX, Input

- Reuse **`EffectsManager`** patterns from current scene: particles on goal, flash/shake on death, floating score popups where they already exist.
- **SFX:** wire **PhaserAudio** (or project equivalent) for **hop**, **hit/death**, **goal/crossing**, **timer warning** (e.g. last 10s). No new music requirement in this pass.
- **Input:** keep **keyboard** cursors; **pointer/tap** grid directions are optional follow-up if time permits (not required for spec approval).

---

## Explicitly Out of Scope (This Pass)

- Final sprite art and asset polish  
- Music composition  
- Extensive difficulty tuning passes  
- Cutscenes or narrative  
- Boss fight (victory remains **goal**)  
- **Safe-row pickups** — optional later task; **not** required for v1 implementation of this spec

---

## Star Thresholds & Catalog

Keep **`CAMPAIGN_LEVEL_META`** / `starThresholds` aligned with **score sources** after implementation; initial targets remain **[100, 300, 500]** unless playtest adjusts (document changes in `PROGRESS.md` or release notes, not in this spec unless numbers change).

---

## Success Criteria (QA)

- Level loads via campaign with **no console errors**.
- **Crossing 1** is clearly easier than **crossing 3** (fewer deaths in blind playtest expectation).
- **Road → median → bike** order is always respected in every phase.
- Completing **N** crossings emits **level complete** with correct **final score** on bridge.
- **`npm run test:run`** and **`npm run build`** pass after implementation.

---

## Spec Self-Review (2026-04-05)

- **Placeholders:** Manager names left flexible; phase count **3** and **N = 3** are fixed defaults — implementation plan will name files and freeze “no bike in phase 0” vs “one short bike lane.”
- **Consistency:** No water; three-band urban model matches brainstorm; reset-to-bottom + phase remix matches hybrid **C** + post-crossing **A**.
- **Scope:** Single implementation cycle; pickups and touch input deferred.
- **Ambiguity resolved:** Phase selection uses **`min(k - 1, phases.length - 1)`** for crossing **k**.
