# The Cat Tree (CAT_TREE) — Climber Level Design Spec

**Date:** 2026-04-05  
**Level ID:** `CAT_TREE`  
**Genre:** Vertical climber (Doodle Jump–style bounce + horizontal steer)  
**Victory:** Complete summit **routing gauntlet** and trigger the **goal** (no boss HP)

---

## Overview

The Cat Tree is the campaign finale as a **continuous vertical climb** up a giant tree into the sky. Core mechanics stay the same from bottom to top; **atmosphere** escalates through **sky gradient, stars, and parallax**. **Light patrol enemies** appear on some platforms—**contact costs a life** (same life/respawn loop as today). There is **one signature pickup**, **sticky paws**: a **short buff** that lets the cat **cling and slide with control** on **designated vertical surfaces** so routing can use **side branches** and **narrow vertical strips**. Near the top, procedural generation yields to a **short, data-driven summit gauntlet** focused on **path choice** (gaps, breakables, narrow landings)—**not** a timer chase and **not** a traditional boss. **Scoring stays minimal**; **stars** are **soft tiers** tied to clear quality (see Stars section), not a pickup economy.

**Design pillars:**

- **Readable pressure** — threats are platforms, patrols, and finale layout; avoid opaque rules.
- **Identity through sticky paws** — single rare power-up, clearly telegraphed verticals.
- **Finale = routing** — authored challenge, then goal trigger; no DPS / HP boss.
- **Stars without grind** — tiers from survival and clear conditions, not coin/yarn farming.

---

## Ascent Structure (Continuous)

| Aspect | Description |
|--------|-------------|
| **Mechanics** | Same throughout: gravity, bounce on land, left/right move, screen wrap, auto-upward camera scroll (tuned via `ClimberLevelConfig`). |
| **Platforms** | Procedural **solid**, **spring**, **breakable** (existing types); widths/gaps from config. |
| **Verticals for sticky** | Some generated platforms attach a **thin vertical collision strip** (“trunk” segment) eligible for **sticky paws** only while buff is active. |
| **Enemies** | **Patrol** along platform surface, clamped to platform width. **Player–enemy overlap** costs a life (use **AABB + forgiveness** tuning; no stomp-to-kill). |
| **Pickups** | **Sticky paws** only; **rare**; **non-stackable** (one active charge or refresh rules TBD in implementation—prefer **refresh duration** if picked up again while active). |
| **Mood bands** | **Visual only** (optional labels for art): lower trunk → open branches → night sky. No change to core generation rules per band unless tuning demands it later. |

---

## Sticky Paws (Signature Power-Up)

| Property | Spec |
|----------|------|
| **Effect** | While active, player may **cling** to **sticky-eligible vertical segments** and **slide down** (or slow slide) with **horizontal input** to reposition before letting go or timing out. |
| **Duration** | Short (target **2–4s** tunable in config). |
| **Eligibility** | Only surfaces flagged at generation time (vertical rects tied to platform archetypes). |
| **Failure** | Missing a grab while falling behaves like normal fall (no auto-stick to any wall). |
| **Juice** | Distinct SFX + subtle color/outline on verticals when buff active (implementation detail). |

---

## Summit Gauntlet (Set-Piece Finale)

| Aspect | Description |
|--------|-------------|
| **Trigger** | Enter **summit band** by **world height** or explicit **phase flag** when `highestY` / camera crosses threshold (single crossing; guard against re-entry). |
| **Proc-gen** | **Pause or taper** infinite proc-gen; **spawn** fixed **routing layout** from data (segment list or grid schema). |
| **Challenge type** | **Routing (B)** — narrow platforms, **breakable** branches, **gaps**; player finds a viable path. Optional **one sticky vertical** as a “pressure valve.” |
| **Victory** | **Goal collider** (perch / treetop); on overlap → `emitLevelComplete` with `victoryType: 'goal'`, `levelId: 'CAT_TREE'`. |
| **Explicit non-goals** | No boss health bar, no multi-phase AI fight, no DPS window. |

---

## Enemies (Light Patrol)

- **Role:** Pressure and readability, not a stomp combo layer.  
- **Behavior:** Patrol left/right on platform top, turn at edges.  
- **Outcome on player contact:** **Lose one life** and use existing respawn rules (or knockback + life—**prefer align with current `handleDeath` life decrement** for consistency).  
- **Defeat:** Optional **despawn on timeout** or **when platform breaks**; **no reward** or **tiny score tick** only if needed for telemetry—**default no score reward** to match minimal scoring pillar.

---

## Scoring & Stars (Minimal)

**Primary win condition:** Reach goal through summit gauntlet. **Points** are secondary.

Proposed **star tier semantics** (may require **interpreting or adjusting** `starThresholds` in `levels/catalog.ts` and bridge/HUD copy so players are not misled into thinking only “points” matter):

| Star | Proposed rule |
|------|----------------|
| **1★** | **Clear** — trigger goal (complete gauntlet). |
| **2★** | **No life lost** for the **entire run** (from scene start through goal). |
| **3★** | **No life lost** + complete under a **generous par time** (config-driven ms or height-rate cap—tuned in QA). |

**Alternative 3★** (if par time is too harsh): no life lost + **no enemy contact** (stricter than 2★). Pick **one** 3★ rule in implementation plan; default recommendation above is **par time** so sticky paws and routing remain rewarding.

---

## Visuals & Audio

| Area | Spec |
|------|------|
| **Background** | Sky gradient progression (existing pattern extended); **stars** intensify with height. |
| **Parallax** | **2–3 layers** (e.g. leaves, distant branches, haze)—implementation can use rects/sprites later. |
| **Summit** | Visually distinct band (brighter sky, crown silhouette optional). |
| **Audio** | **SFX** for bounce, spring, break, life lost, sticky activate/hold/release, enemy bump, goal. **Music:** reuse existing stems or defer full unique track (per levelbuilder out-of-scope note). |

---

## Architecture Direction (for Implementation Plan)

Align with **City Heights** pattern:

- Managers under `scenes/climber/` implementing a shared **`SceneManager`** shape: `create()`, `update()`, `destroy()`.
- **Thin** `ClimberScene.ts` orchestrator (~300–500 lines target).
- **Pure logic** extracted for: platform/summit generation params, sticky-paws state machine, summit layout definitions, star evaluation inputs.
- **Tests (Vitest)** on pure modules; Phaser wiring stays in managers/scene.

Suggested manager split (names indicative):

1. **PlatformTerrainManager** — proc-gen, vertical sticky segments, lifecycle/cleanup.  
2. **BackgroundManager** — gradient, stars, parallax.  
3. **PatrolEnemyManager** — spawn tied to platforms, patrol update, collision with player.  
4. **PowerupManager** — sticky paws spawn and pickup.  
5. **SummitGauntletManager** — transition, fixed layout, goal trigger.  

**Task 7** in the 10-task template maps to **Summit / goal system** (not HP boss).

---

## Config & Types (Expectations for Task 1)

Extend `ClimberLevelConfig` / related types as needed for:

- Sticky paws: **duration**, **spawn weight**, **vertical strip** dimensions.  
- Summit: **entry height**, **par time** for 3★, gauntlet **layout id** or inline data.  
- Enemies: **spawn rate**, **patrol speed**, **hitbox** padding.  
- Star rules: either **numeric encoding** into existing `starThresholds` or **parallel flags** + UI copy updates.

---

## Out of Scope (This Spec)

- Final illustrated sprite art and unique music composition.  
- Long tuning passes and narrative cutscenes.  
- Stompable enemies or multi-phase boss fights.

---

## References

- Skeleton: `scenes/ClimberScene.ts`  
- Config: `levels/cattree.ts`, `levels/catalog.ts`  
- Types: `ClimberLevelConfig` in `types.ts`  
- Reference process: `docs/specs/2026-04-05-city-heights-platformer-design.md`
