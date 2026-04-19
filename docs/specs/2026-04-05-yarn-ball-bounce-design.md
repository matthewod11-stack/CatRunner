# Yarn Ball Bounce (YARN) — Level Design Spec

**Date:** 2026-04-05  
**Level ID:** `YARN`  
**Genre:** Breakout (paddle + ball + destructible grid)  
**Victory:** Clear **wave 1**, then **wave 2**; destroy **all** bricks including the **hybrid mini-boss**  
**Campaign slot:** Level 5 (`LEVEL_ORDER`)

---

## Overview

Yarn Ball Bounce is a breakout stage themed around a cozy craft shelf: the player moves a paddle (cat paw sprite when available), launches a yarn ball, and clears two waves of “yarn bricks.” A **mini-boss** yarn knot anchors in the pattern until damaged, then breaks free and moves. Rare **power-ups** (**slow ball**, **multiball**) drop only from **normal** bricks; the run **guarantees** one of each over the full stage via a **pity / eligibility** system (not random-only frustration). Background uses **light parallax** (2–3 non-colliding layers).

**Design pillars:**

- **Readable chaos** — multiball is exciting but bounded; slow ball is the “breather.”
- **Two-act structure** — wave 1 teaches the grid; wave 2 raises stakes with the mini-boss.
- **Mini-boss as set piece** — hybrid anchor → mobile phase; no separate full boss scene.
- **Engineering parity** — same discipline as City Heights: `scenes/breakout/` managers, pure logic + Vitest, thin `BreakoutScene` orchestrator.

---

## Engineering Alignment (City Heights Pattern)

- **Managers** under `scenes/breakout/`, each implementing `SceneManager`: `create()`, `update()`, `destroy()`.
- **Pure logic** (wave sequencing, pity counters, mini-boss state transitions, multiball rules) in standalone modules with **Vitest** coverage.
- **`BreakoutScene.ts`** becomes a **thin orchestrator** (~300–500 lines target): wires Phaser physics, delegates to managers, forwards bridge events (`SCORE_UPDATE`, `LIVES_CHANGED`, `LEVEL_COMPLETE`, etc.).
- **Deferred destroy** pattern preserved where groups are mutated during iteration.
- **SFX** — wire shared Phaser audio hooks for brick break, paddle hit, power-up, phase change, wave transition, life lost (specific asset keys can follow existing `sfxService` / scene patterns used elsewhere).

---

## Wave Structure

| Phase | Content | Transition |
|-------|---------|------------|
| **Wave 1** | Standard brick grid (config-driven layout); normal bricks only for power-up eligibility | When **active brick count == 0**: brief **beat** (0.5–1.0s): particles or short text, **no** new input required; then spawn wave 2 |
| **Wave 2** | Second grid pattern + **hybrid mini-boss** brick(es) placed per layout rules | Clear **all** bricks → `LEVEL_COMPLETE` (`victoryType: 'clear'`) |

- **Loss condition:** unchanged — ball(s) below bottom bound consume lives; **multiball:** a life is lost only when **no** balls remain in play (standard breakout convention).
- **Pause:** existing P / ESC behavior retained.

---

## Brick Model & Layout

- **`BreakoutBrick`** in config remains the source of truth; extend types only as needed (e.g. `kind: 'normal' | 'miniboss'`, optional `maxHealth` override for boss cell).
- **Wave 1 / wave 2** layouts can be **two arrays** in `BreakoutLevelConfig` or a `waves: BreakoutBrick[][]` field — implementation plan chooses the smallest clean extension.
- **Mini-boss placement:** embedded in **wave 2** pattern (not wave 1). Exact column/row from config or generator with a **stable** default for tests.

---

## Hybrid Mini-Boss (“Yarn Knot”)

**Behavior:**

1. **Phase A — Anchored:** behaves like a brick with **high HP** (e.g. 6–12 hits — tune in config). Fixed grid position; distinct **tint / texture** so it reads as special.
2. **Phase B — Mobile:** when `currentHealth <= ceil(maxHealth / 2)` **once**, transition: detach from grid logic, enable **movement** (recommend **horizontal patrol** within playfield bounds, bouncing off walls; speed config-driven). Still destroyed only by ball hits; **no** collision with paddle beyond normal ball physics.
3. **Destruction:** on break, score burst + particles; no power-up drop from mini-boss.

**State machine** (pure module): `Anchored` → `Mobile` → `Destroyed`; tests cover transitions and “only one phase flip.”

---

## Power-Ups (Exactly Two Types)

| Pickup | Effect | Duration / rules |
|--------|--------|-------------------|
| **Slow ball** | Multiplies **all** balls’ effective speed by a factor < 1 (e.g. 0.65) | **Time-based** (e.g. 8s) or until life lost — pick one in implementation; document in config |
| **Multiball** | Spawns **one** additional ball from impact site (or paddle) with diverging angles | No cap on balls **or** soft cap (e.g. max 3) — **recommend max 3** for readability |

**Acquisition:**

- Drops only when **normal** bricks break (not mini-boss).
- **Rare** base chance per eligible break.
- **Guarantee:** over the **entire stage** (both waves), the player receives **at least one** Slow and **at least one** Multiball if they clear enough **eligible** bricks — implement via **pity counters** (increment on eligible break without drop; force next eligible break to drop) or **pre-assigned secret slots** on brick indices. Pity is preferred for simpler tuning.

**Collision:** pickup is a small sensor body falling straight down; missed pickups despawn at bottom (or after timeout).

---

## Background & Juice

- **Light parallax:** 2–3 layers (e.g. blurred shelf, hanging yarn hanks, soft bokeh lights), **slow** drift, **no** physics.
- Keep **dominant** `bgColor` from config as base; layers sit above it at low depth.
- Reuse **`EffectsManager`** for brick break particles, floating score, mini-boss phase change flash optional.

---

## Scoring & Stars

- **Catalog** `starThresholds: [200, 500, 800]` — unchanged unless playtest demands; scoring continues from brick points + streak/multiplier rules already in scene (preserve or extract to pure module).
- Mini-boss awards **bonus points** on destroy (config value, e.g. 100–300).

---

## Audio (This Milestone)

- **SFX** for: brick hit / break, paddle hit, power-up collect, mini-boss phase shift, wave clear, ball lost.
- **Music:** defer to follow-up unless a genre sting already exists in `sfxService` — not a blocker for “playable.”

---

## Testing Strategy

- **Pure:** wave progression (wave1 empty → interstitial → wave2 spawn), pity/guarantee drops, mini-boss HP phase flip, multiball count cap, slow multiplier application.
- **Integration:** manual QA in browser — two waves, both power-ups received by end of typical run, win/lose, pause.

---

## Out of Scope (Explicit)

- Full multi-phase **boss** scene or separate arena
- More than **two** power-up types (future expansion can add rows to a table)
- Final illustrated sprite art (procedural / tinted rectangles OK)
- New music composition
- Cutscenes / narrative

---

## Open Implementation Choices (Plan Phase)

The implementation plan should pin these (not left ambiguous in code):

1. Slow ball: **time limit** vs **until death** — recommend **time limit** stacked refresh if duplicate pickup.
2. Multiball: **max concurrent balls** — recommend **3**.
3. Inter-wave pause: **fixed duration** vs **skippable with SPACE** — recommend **skippable** after 0.3s minimum.

---

## Approval

This spec is ready for **`writing-plans`** (10-task implementation plan under `docs/plans/`) after stakeholder sign-off.
