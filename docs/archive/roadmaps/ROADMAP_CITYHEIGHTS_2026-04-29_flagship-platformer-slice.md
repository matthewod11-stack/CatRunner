# Roadmap City Heights — Flagship Pixel Platformer Slice

> Archived 2026-04-29 after completing the Level 2 `ROOFTOPS` flagship pixel platformer slice through the Pigeon King boss combat pass. This is no longer the active root roadmap. The next root roadmap should be `ROADMAP_COUNTERTOP_CHAOS.md`.

Historical roadmap for the Level 2 `ROOFTOPS` art/runtime pass.

## Goal

Turn City Heights into a true cozy pixel-art Beach Kitty platformer slice: a polished first 60-90 second opening route that can become the model for a future standalone platformer build. The slice should prove movement readability, background depth, hero animation, enemy/hazard language, pickups, HUD clarity, and test hooks before the full 15,000px level receives the same treatment.

## Phase 0 — Direction Lock

- [x] Choose flagship-slice scope over a full-level pass
- [x] Choose true cozy pixel art over the earlier chunky vector direction
- [x] Keep Beach Kitty as the default platformer hero
- [x] Defer custom/generated gameplay cats until the default hero sheet passes the platformer contract

## Phase 1 — Pixel Art Bible And Prompt Factory

- [x] Add a City Heights pixel art bible under `docs/plans/`
- [x] Pivot the Level 2 visual brief to true pixel-art rules
- [x] Pivot the Level 2 prompt pack to image-generation and cleanup rules for pixel assets
- [x] Update the Level 2 asset inventory around the opening-route slice
- [x] Update the platformer hero-sheet contract to a 64x64 true-pixel frame contract
- [x] Update the Level 2 QA checklist around web-game test hooks and slice screenshots

## Phase 2 — Committed Pixel Baseline And Manifest

- [x] Add a repeatable local pixel-pack generator for the first City Heights baseline
- [x] Generate committed assets under `assets/sprites/rooftops/`
- [x] Add `scenes/platformer/rooftopsAssets.ts` with deterministic texture keys
- [x] Add manifest tests for uniqueness, coverage, and committed local paths

## Phase 3 — Platformer Hero Sheet Contract

- [x] Add `scenes/platformer/heroSheet.ts`
- [x] Load the default pixel Beach Kitty platformer sheet in `PlatformerScene`
- [x] Register and resolve idle, run, jumpRise, fall, landStomp, glide, hurt, victory, defeat, and powerUp animations
- [x] Add resolver and collision-box tests

## Phase 4 — Opening Route Runtime

- [x] Add optional `openingRoute` config to platformer levels
- [x] Seed a deterministic City Heights opening route before procedural generation resumes
- [x] Seed deterministic opening-route enemies, hazards, coins, and power-ups
- [x] Add opening-route validation tests
- [x] Start loading City Heights runtime art through the manifest

## Phase 5 — Web-Game Test Hooks

- [x] Add `window.render_game_to_text()` for platformer state snapshots
- [x] Add a best-effort `window.advanceTime(ms)` Phaser stepping hook
- [x] Capture first-pass web-game screenshots under `docs/artifacts/level-2-city-heights/`
- [x] Record findings in the Level 2 QA checklist

## Phase 6 — Polish Loop

- [x] Run movement/jump/stomp/side-hit/hazard/pickup/pause/eject scenarios through the web-game client
- [x] Tune opening-route geometry for jump readability and landing confidence
- [x] Add damage cooldown and recent interaction snapshots for readable stomp/side-hit QA
- [x] Replace the generated baseline with selected image-generation candidates where they improve the slice
- [x] Verify final screenshots against the art bible
- [x] Run `npm run test:run`, `npx tsc --noEmit`, `npm run build`, and `npm run test:smoke`

## Phase 7 — Pigeon King Boss Slice

- [x] Move the Pigeon King into the deterministic opening-route slice
- [x] Add an authored `bossArena` route contract with trigger, floor, and patrol width
- [x] Extend the opening route with a platform-backed boss arena
- [x] Scale Kitty, enemies, obstacles, pickups, and the Pigeon King up for stronger gameplay readability
- [x] Tune first-phase boss timing for a readable swoop, feather drop, and stomp window
- [x] Add a player-controlled yarn throw on `X` / `ArrowDown` as the primary boss damage route
- [x] Allow valid top-stomps to damage the Pigeon King without immediately converting into side-hit damage
- [x] Defeat the Pigeon King after three successful boss hits and route to victory
- [x] Emit platformer `BOSS_FIGHT` status and boss victory payloads
- [x] Add boss mode, arena, HP, and threat details to `window.render_game_to_text()`
- [x] Add narrow boss-entry and boss-stomp QA hooks for deterministic web-game capture
- [x] Capture boss-entry, landed/vulnerable, throw-hit, stomp-hit, and defeat screenshots under `docs/artifacts/level-2-city-heights/`
- [x] Run `npm run test:run`, `npx tsc --noEmit`, `npm run build`, and `npm run test:smoke`

## Guardrails

- Runtime image generation is not part of shipped gameplay.
- Final gameplay assets must be committed under `assets/sprites/rooftops/`.
- True pixel art means nearest-neighbor scaling, no anti-aliased sprite edges, no vector gradients in final gameplay assets, and fixed frame grids for animated sprites.
- Platform readability beats skyline detail.
- Weezy is reference material only; do not import its code or assets.
