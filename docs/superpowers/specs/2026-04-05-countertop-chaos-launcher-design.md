# Countertop Chaos (KITCHEN) — Full Level Design Spec

**Date:** 2026-04-05  
**Level ID:** `KITCHEN`  
**Genre:** Slingshot launcher (Angry Birds–style)  
**Victory:** Reach **500** campaign score (unchanged in `CAMPAIGN_LEVEL_META`); finale **Mixer Mouse** boss round awards a large score burst so consistent play clears the bar.

---

## Overview

Countertop Chaos is a kitchen-themed slingshot level: the cat launches a **treat** from the left counter toward **destructible stacks** on the right (jars, boxes, snack towers). Rounds escalate through three **acts** plus a **boss round**. The existing `LauncherScene` already implements core slingshot physics, materials (glass / wood / metal), rounds, and score target — this spec adds **special blocks**, **counter hazards**, **critters**, **power treats**, a **boss structure**, **lives that matter**, richer **background art**, and a **manager-based scene layout** matching City Heights engineering patterns.

**Design pillars:**

- **Readable chaos:** Structures read as “snack architecture”; special blocks have distinct silhouettes and tints.
- **Skill expression:** Trajectory + material knowledge + when to break power crates first.
- **Escalation:** Acts add one new system at a time; boss combines them.
- **Same bridge contract:** `SceneBridge` events, `LauncherLevelConfig` from `levels/kitchen.ts`, no React gameplay changes.

---

## Act Structure (Round Bands)

Rounds are grouped into acts. `totalRounds` in config becomes **at least 6** (acts 1–3) **+ 1 boss round** (config-driven). Existing random structure pick evolves into **weighted pools per act**.

| Act | Rounds (suggested) | New mechanic | Structures | Critters / hazards | Feel |
|-----|-------------------|--------------|------------|-------------------|------|
| **1: Morning Mess** | 1–2 | Core knockdown + **spill hazard** | Simple towers, wide walls from current pool (tuned) | Spill zone only | Teach aim, materials, clear bonus. |
| **2: Pantry Raid** | 3–4 | **Special blocks** + **power crate** | + pyramids / fortress variants with seeded specials | + **ants** (bonus targets on blocks) | Plan order of destruction; explosive chains. |
| **3: Dinner Rush** | 5 | **Mouse guard** + tighter ammo pressure | Denser stacks, more metal | **Mouse** on top row — score drain if left alive at round end | Execution check. |
| **Boss: Mixer Mouse** | 6 (fixed finale) | **Boss weak-point structure** | Custom layout: **Cheese Ward** blocks shielding **Mixer Core** | Spill + optional fan pulse (single hazard channel) | Destroy shield layers, then core **5 HP**; fixed shot budget **6**. |

**Transitions:** HUD act label (“Morning Mess”, etc.), brief toast or color shift on wall gradient (warmer → more saturated amber). No loading screens.

---

## Structure & Block Model

### Base blocks (existing)

`LauncherBlock`: position, size, `health`, `material` (`glass` | `wood` | `metal`), `points`. Physics: static bodies, treat collision, damage → destroy.

### Special block types (extend `LauncherBlock`)

| Kind | Behavior | Visual |
|------|----------|--------|
| **explosive** | On destruction: deal **1** damage to adjacent blocks (cardinal neighbors in grid space; use block center distance & threshold). | Orange tint, small “spark” icon. |
| **ice** | When treat **bounces** off it, treat retains **95%** velocity (low damping for that contact only). | Pale cyan fill, glassy edge. |
| **power_crate** | On destruction: grants **one charge** of the next power treat (see Powerups). | “?” pattern, purple accent. |
| **cheese_ward** | Boss only: **invulnerable** until at least one adjacent non-ward block is destroyed; then normal HP. | Yellow wedge motif. |
| **mixer_core** | Boss only: **5** HP, large single body; destroying it triggers **level complete** with victory payload. | Bowl + swirl graphic (procedural). |

**Config:** Extend `LauncherStructure` or block def with optional `kind?: 'normal' | 'explosive' | ...` defaulting to normal. Boss layout lives as a dedicated `LauncherStructure` (or small array) in `levels/kitchen.ts`, not the random pool.

### Generation rules

- **Act 1:** No explosive adjacent to glass-only supports if that would one-shot the whole stack (generator rule: max one explosive per structure, not on bottom row).
- **Act 2+:** Allow chains; **power_crate** max **1** per structure.
- **Material tuning:** Metal HP stays authoritative; explosive damage respects remaining HP.

---

## Critters (“Enemies”)

Launcher genre: critters **ride on blocks**; they interact with **score**, not separate HP pools (keeps collision simple).

### Ants

- **Spawn:** Row of **3–5** small sprites along the top face of a chosen block (act 2+ only).
- **Treat hit:** Each ant popped = **+15** points × current multiplier streak rules (reuse existing streak from block breaks or align multiplier to block system only — pick **one** source of truth in implementation; spec: ant pops **increment streak** like block breaks).
- **Block destroyed:** All ants on that block auto-clear (no penalty).

### Mouse guard

- **Spawn:** One mouse on the **topmost** block of the stack (act 3+).
- **End of round** (when advancing: cleared structure OR out of ammo for that round): if mouse still alive, **−25** points (floor at 0), floating “STOLEN!” text.
- **Treat hit:** Mouse is removed and awards **+50**; no end-of-round penalty.

Critters are managed by **`CritterManager`** (create with structure, update for cosmetic wobble optional, destroy with round teardown).

---

## Hazards

### Spill zone (Act 1+)

- **Placement:** Rectangular **slow zone** on the counter between launch X and structures (config: `spillRect` relative to counter Y).
- **Effect:** While treat body overlaps spill, apply **extra linear damping** (e.g. ×0.92 velocity per frame) and **+15% gravity** — shots skim weakly unless aimed high.
- **Visual:** Glossy puddle (ellipse graphic), subtle shimmer.

### Optional: Fan gust (Boss only)

- **Every 8s:** Horizontal impulse **−120** px/s on treat for **0.5s** (leftward, toward cat). One-time telegraph (blade spin graphic).
- **Readability:** Only during boss round; never stacked with a new spill shape.

**HazardManager** owns zones and timings; scene passes treat sprite reference or registers overlap in `update`.

---

## Power treats

**Charges** stack from breaking **power_crate** blocks. Max **2** stored charges; picking a third while full **replaces** oldest (simple queue).

| Power | Effect | SFX |
|-------|--------|-----|
| **Piercing** | Next treat **ignores collision response** on the **first** block hit (passes through once, still deals **1** damage). | `projectile` pitch-up |
| **Cluster** | On first impact, spawn **3** tiny pebbles with low velocity cone; each deals **1** damage to one block max. | `impact` burst |

**UI:** Small icons near ammo HUD showing loaded power (if any). If player launches without tapping a modifier, **next charge** auto-applies to next shot (MVP); optional later: tap-to-select.

---

## Mixer Mouse Boss Round

### Layout

- Single **wide** structure: central **mixer_core** (large), flanked by **cheese_ward** columns and outer wood/glass filler — exact coordinates in config.
- **Shots:** **6** treats for the whole boss round (override `projectilesPerRound` for this round only).
- **Win:** `mixer_core` destroyed → `emitLevelComplete` with `victoryType: 'score'` (or introduce `'boss'` if bridge already supports; otherwise keep score payload and set `finalScore` ≥ target).

### Lose conditions

- Shots exhausted with core alive → **lose 1 life** and **rebuild same boss structure** (retry boss), OR if **lives === 0** → `emitGameOver`.

### Narrative tone

Light comedy: “The stand mixer won’t quit.” No full cutscene; short HUD banner “Boss: Mixer Mouse!”

---

## Lives & Failure

- **`startLives: 3`** (config) is enforced.
- **Lose a life when:** all shots expended for the current round **and** structure not cleared **and** not boss auto-retry edge case — **implementation choice A:** lose life only on **boss fail** or **final round fail**; **choice B:** any round fail costs a life. **Spec decision: B** — failing a round (ammo out, blocks remain) costs **1 life**, then **same structure respawns** for retry. Clearing all blocks still grants clear bonus as today.
- **Game over:** lives **0** and fail condition.
- **Win:** score ≥ **500** at any `emitLevelComplete` (including boss clear with score burst).

---

## Visual Design

### Kitchen read

- Keep warm `bgGradient`; add **upper cabinets** (simple rectangles + handles) in far layer, **window** with soft daylight blob, **counter edge** wood grain (line hatching).
- **Depth order:** BG gradient → cabinets/window → wall tile → counter → spill → blocks → critters → treat → aim line → HUD.

### Parallax (subtle)

- Cabinets / window **0.05x** horizontal drift on camera shake only, or static for MVP — prefer **static** art first; parallax optional in `KitchenBackground` if cheap.

### Special block readability

- Explosive: orange + hazard stripe; ice: cyan; power crate: purple “?”; cheese ward: yellow; core: metallic bowl + rotating highlight (tween).

---

## File Architecture

### New directory

```
scenes/launcher/
  KitchenBackground.ts   # Gradient, tiles, cabinets, spill/fan visuals (draw hooks)
  StructureBuilder.ts    # From LauncherStructure + act → Phaser static bodies, block metadata map
  CritterManager.ts      # Ant rows + mouse attach to blocks; hit / round-end scoring
  HazardManager.ts       # Spill damping, boss fan pulse; queries treat overlap
  PowerupManager.ts      # Charge stack, apply on next launch, HUD hints
  MixerBoss.ts           # Boss layout factory + core HP + win/lose hooks (or fold into StructureBuilder if tiny)
  launcherTypes.ts       # Shared enums + pure helpers (neighbor explosion, act pick)
```

### Pure logic (Vitest)

- `explosionNeighbors.test.ts` — grid adjacency damage
- `actStructurePick.test.ts` — weighted pool by act + round index
- `bossLayout.test.ts` — cheese ward invulnerability rule until neighbor broken

### Modified files

```
scenes/LauncherScene.ts       # Thin orchestrator (~300–500 lines): input, launch, bridge, manager wiring
types.ts                      # Extend LauncherBlock, LauncherLevelConfig (acts, hazards, boss structure, powers)
levels/kitchen.ts             # Full tuning: acts, pools, boss def, spill rect, fan toggle
```

### Manager contract

Match City Heights pattern:

```ts
interface LauncherManager {
  create(scene: Phaser.Scene, config: LauncherLevelConfig, ctx: LauncherSceneContext): void;
  update(time: number, delta: number): void;
  destroy(): void;
}
```

`LauncherSceneContext` is a narrow facade the scene implements: `getTreat()`, `getBlockGroup()`, `addScore()`, `getCurrentAct()`, etc., to avoid circular imports.

---

## SFX Integration

Phaser audio + existing `sfxService` keys where possible. SFX-only (no new music).

| Action | SFX key | Notes |
|--------|---------|-------|
| Draw slingshot | (optional) soft tick | Procedural or defer |
| Launch | `jump` | Short whoosh |
| Block hit / break | `impact` / `coin` variant | Material pitch shift optional |
| Explosive pop | `impact` | Louder |
| Ant pop | `coin` | Small |
| Mouse steal | `hurt` | Quick |
| Power gain | `powerup` | |
| Boss core hit | `boss_hit` | |
| Boss destroy | `victory` | |
| Game over | `death` | |

---

## Scoring & Stars

**Aligned with `CAMPAIGN_LEVEL_META` for KITCHEN:**

- Star thresholds: **200 / 400 / 600** (score at end of run).
- Victory score target: **500**.

**Score sources:**

- Block points (existing table).
- Clear bonus per round (existing scaled bonus — tune down slightly if acts add more rounds).
- Ant pops, mouse bonus.
- Mixer core: **+200** on destroy (guarantees boss path hits 500 if player had modest earlier score).

**Multiplier:** Keep existing streak on block destruction; ant pops contribute to streak; mouse penalty does **not** reset multiplier (only feels punitive enough).

---

## Config Shape (types.ts summary)

Extensions to `LauncherLevelConfig`:

- `acts: { id: string; roundStart: number; roundEnd: number; structurePool: string[]; weights?: number[] }[]`
- `hazards: { spill: { x: number; y: number; width: number; height: number } | null; bossFan?: boolean }`
- `bossRoundIndex: number` (e.g. `6`)
- `boss: { structure: LauncherStructure; shots: number; coreBlockId: string }`
- `powerupsEnabled: boolean` (default true)
- Optional `structurePresets: Record<string, LauncherStructure>` for named pools

(Exact naming left to implementation; must remain JSON-serializable for future tooling.)

---

## Out of Scope

- Custom composed music track for kitchen
- Multiplayer or level editor UI
- Full sprite sheets for critters (use Phaser graphics + texture gen like blocks)
- Changing global `LEVEL_ORDER` or victory type in catalog (still `score` target **500**)
- Physics engine swap (stay Arcade)

---

## Spec Self-Review

- **Placeholders:** None intentional; numeric tuning (damping, impulses) is adjustable in `kitchen.ts`.
- **Consistency:** Victory remains score-based; boss adds score burst; stars 200/400/600 preserved.
- **Scope:** Single level, one scene refactor + managers; fits one 10-task implementation plan.
- **Ambiguity resolved:** Round failure costs **1 life** and retries same layout; boss has dedicated shots and layout.

---

## Approval Gate

Implementation must not start until this spec is **explicitly approved** by the project owner. Next step after approval: **writing-plans** skill → `docs/superpowers/plans/2026-04-05-countertop-chaos-implementation.md` (10-task template).
