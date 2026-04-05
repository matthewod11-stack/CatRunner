---
description: Build a campaign level from skeleton to functional — brainstorm, spec, plan, implement
allowed-tools: Agent, Bash, Edit, Glob, Grep, Read, Write, Skill, TaskCreate, TaskUpdate, TaskList, ToolSearch
---

# Level Builder

> **Purpose:** Take a skeleton campaign level through the full build pipeline: brainstorm design → write spec → create implementation plan → execute with subagents. Produces a playable level with terrain, enemies, hazards, powerups, boss, visuals, and SFX.

## Scope

This command builds the **core gameplay** for a level. It does NOT cover:
- Final sprite art or asset polish
- Music composition
- Extensive tuning passes
- Cutscenes or narrative

Those are separate follow-up efforts per level.

---

## Prerequisites

Before starting, verify:
1. The level has a skeleton scene in `scenes/` (e.g., `PlatformerScene.ts`, `LauncherScene.ts`)
2. The level has an entry in `levels/catalog.ts` (`CAMPAIGN_LEVEL_META`)
3. The level has a basic config in `levels/` (e.g., `levels/rooftops.ts`)
4. The level has a genre type and config interface in `types.ts`

If any of these are missing, flag it before proceeding.

---

## Phase 1: Brainstorm (invoke skill)

Invoke `superpowers:brainstorming` to design the level collaboratively with the user.

**Context to provide the brainstorming skill:**

1. Read the skeleton scene file to understand what's already implemented
2. Read the level's config file for current parameters
3. Read the level's type interface in `types.ts`
4. Check `CAMPAIGN_LEVEL_META` in `levels/catalog.ts` for the level's display name, genre, description

**Questions to cover during brainstorming** (the skill will guide these, but ensure these topics are addressed):

- **Feel:** What's the gameplay feel? (precision, exploration, momentum, etc.)
- **Structure:** How many zones/sections? Is there a boss?
- **Enemies:** Which enemy types, what behaviors, which zones introduce them?
- **Hazards:** Environmental threats — what movement verbs do they add?
- **Visuals:** Time of day, color palette, how terrain connects to the theme
- **Terrain model:** How does the genre's terrain work? (platforms, lanes, grids, etc.)
- **Powerups:** Reuse existing or genre-specific?
- **Boss:** Mechanics, phases, how to damage it
- **Audio:** Full music, SFX only, or defer entirely?
- **Scoring:** Star thresholds, score sources

**Output:** A design spec saved to `docs/superpowers/specs/YYYY-MM-DD-<level-name>-design.md`

---

## Phase 2: Implementation Plan (invoke skill)

After the spec is approved, invoke `superpowers:writing-plans` to create the implementation plan.

**The plan should follow the 10-task template:**

| Task | Purpose | Generic Pattern |
|------|---------|-----------------|
| 1 | Type extensions + config | Foundation types, zone/enemy/hazard configs, level config |
| 2 | Terrain system | Genre-specific terrain generation (buildings, lanes, grid, etc.) |
| 3 | Background/visual system | Parallax layers, sky, environmental art |
| 4 | Enemy system | All enemy types with spawn, behavior, defeat logic |
| 5 | Hazard system | Environmental hazards with placement and interaction |
| 6 | Powerup system | Genre-appropriate powerups with spawn and effects |
| 7 | Boss system | Boss arena, phase state machine, attacks, defeat |
| 8 | Scene rewrite | Orchestrator calling all managers |
| 9 | SFX integration | Wire PhaserAudio for all gameplay events |
| 10 | Integration + QA | Full test suite, build verify, playthrough |

Tasks 2-7 are independent after Task 1. Task 8 depends on 2-7. Task 9 depends on 8. Task 10 depends on 9.

**Key plan requirements:**
- Each manager implements the `SceneManager` interface: `create()`, `update()`, `destroy()`
- Testable pure logic extracted into separate files (e.g., generation params, boss state machine)
- TDD for pure logic modules
- Managers go in `scenes/<genre>/` subdirectory
- Scene file is rewritten as thin orchestrator (~300-500 lines)

**Output:** Implementation plan saved to `docs/superpowers/plans/YYYY-MM-DD-<level-name>.md`

---

## Phase 3: Execute (invoke skill)

After the plan is approved, invoke `superpowers:subagent-driven-development` to execute the plan.

**Execution flow per task:**
1. Dispatch implementer subagent with full task text + context
2. On DONE → dispatch spec compliance reviewer
3. On spec compliant → dispatch code quality reviewer (skip for pure-type tasks)
4. On approved → mark task complete, move to next

**After all tasks complete:**
1. Run `npm run test:run` — verify all tests pass
2. Run `npm run build` — verify production build
3. Open dev server and verify the level loads and is playable
4. Report completion to user with summary of what was built

---

## Reference Implementation

City Heights (ROOFTOPS) was built using this exact flow:
- Spec: `docs/superpowers/specs/2026-04-05-city-heights-platformer-design.md`
- Plan: `docs/superpowers/plans/2026-04-05-city-heights-implementation.md`
- Pattern: 6 managers in `scenes/platformer/` + scene orchestrator rewrite
- Result: 12 new files, 97 tests, clean build

## Remaining Levels

| Level ID | Name | Genre | Status |
|----------|------|-------|--------|
| ROOFTOPS | City Heights | platformer | BUILT |
| KITCHEN | ??? | launcher | skeleton |
| SPACE | ??? | shooter | skeleton |
| YARN | ??? | breakout | skeleton |
| STREET | ??? | frogger | skeleton |
| GARDEN_WHACK | ??? | whack | skeleton |
| GARDEN_SNAKE | ??? | snake | skeleton |
| CAT_TREE | ??? | climber | skeleton |

Check `levels/catalog.ts` for current names and descriptions.
