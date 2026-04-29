# Level 2 City Heights QA Checklist

Manual and automated QA for `ROOFTOPS` (`platformer`).

Related docs:

- [`level-2-city-heights-art-bible.md`](./level-2-city-heights-art-bible.md)
- [`level-2-city-heights-visual-brief.md`](./level-2-city-heights-visual-brief.md)
- [`level-2-city-heights-asset-inventory.md`](./level-2-city-heights-asset-inventory.md)
- [`level-2-platformer-hero-sheet-contract.md`](./level-2-platformer-hero-sheet-contract.md)

## Local Target

```text
http://127.0.0.1:3000/?unlock_all=1&level=ROOFTOPS
```

## Automated Checks

```bash
npm run test:run
npx tsc --noEmit
npm run build
npm run test:smoke
```

Latest Phase 7 boss combat/scale pass:

- `npm run test:run` - 46 files, 223 tests passing
- `npx tsc --noEmit` - passing
- `npm run build` - passing with existing large chunk warning
- `npm run test:smoke` - 3 browser smoke tests passing
- Web-game client and targeted Playwright capture loops - state snapshots produced with no browser errors; canvas-only PNG capture is black under headless WebGL, so full-page screenshots below are the visual source of truth
- Phase 6 selected-art refresh - image-generation candidates were used as reference, then cleaned into deterministic true-pixel assets and re-captured in `01-start.png` through `05-pause.png`
- Phase 7 boss pass - `09-boss-entry.png`, `10-boss-landed.png`, `11-boss-throw-hit.png`, `12-boss-stomp-hit.png`, and `13-boss-defeat.png` capture boss entry, vulnerability, throw damage, stomp damage, and victory with matching JSON snapshots

## Web-Game Hooks

- `window.render_game_to_text()` should return the current platformer state as concise JSON.
- `window.advanceTime(ms)` should perform best-effort Phaser stepping for Playwright action bursts.
- `window.enter_platformer_boss_for_qa()` should move the live platformer scene to the authored boss arena for deterministic boss/finale captures.
- `window.drop_on_platformer_boss_for_qa()` should place the player in a valid top-stomp position for deterministic boss-stomp verification.
- Test payloads should cover right movement, left movement, jump, held jump/glide when available, pause/resume, and route reset/eject.

## Manual Playtest

- [x] Start `City Heights` from campaign select.
- [x] Verify Beach Kitty pixel hero spawn, camera framing, and first 10 seconds of rooftop readability.
- [x] Exercise left/right movement, variable-height jumping, double jump, and camera-follow traversal.
- [x] Land on at least three hand-authored opening-route rooftops.
- [x] Stomp the seeded pigeon and compare against a seeded side-hit/damage case.
- [x] Trigger the seeded hazard and verify its unsafe state is readable.
- [x] Collect the seeded coin and one opening-route power-up path item.
- [x] Confirm pause/resume and campaign eject/readability.
- [x] Confirm dev-hook victory and game-over still drive React result surfaces.
- [x] Enter the authored boss arena and verify the React shell receives `BOSS_FIGHT`.
- [x] Wait for the Pigeon King landed/vulnerable state and verify HP text plus `render_game_to_text()` boss details.
- [x] Throw yarn with `X` or `ArrowDown` and verify boss HP decreases.
- [x] Stomp the Pigeon King from above and verify it damages the boss without costing a life.
- [x] Defeat the Pigeon King with three successful boss hits and verify the route reaches victory.

## Screenshot / Capture Set

Store artifacts under `docs/artifacts/level-2-city-heights/`.

- [x] `01-start.png` - spawn and first rooftop
- [x] `02-jump-gap.png` - jump arc and landing target
- [x] `03-stomp-vs-side-hit.png` - enemy interaction readability
- [x] `04-hazard-pickup.png` - seeded hazard plus pickup/power-up
- [x] `05-pause.png` - fixed HUD and pause overlay over city background
- [x] `06-opening-route-complete.png` - hand-authored slice handoff area
- [x] `07-victory.png`
- [x] `08-game-over.png`
- [x] `09-boss-entry.png` - authored boss arena and first swoop
- [x] `10-boss-landed.png` - landed/vulnerable Pigeon King state
- [x] `11-boss-throw-hit.png` - player-thrown yarn damages the Pigeon King
- [x] `12-boss-stomp-hit.png` - top-stomp damages the Pigeon King without side-hit life loss
- [x] `13-boss-defeat.png` - three boss hits trigger victory

## Findings

- Kitty, enemies, hazards, pickups, and the Pigeon King were scaled up after hands-on review; the boss now reads as a large arena target rather than a regular enemy.
- `X` and `ArrowDown` now throw a visible yarn shot in the boss arena; projectile cleanup uses the authored arena bounds so long shots are not destroyed by camera framing.
- Three successful boss hits defeat the Pigeon King and trigger the victory surface; `13-boss-defeat-state.json` records the final `boss-projectile` interaction and `mode: "VICTORY"`.
- `12-boss-stomp-hit-state.json` confirms top-stomps reduce boss HP while lives remain unchanged, preventing the old accidental post-stomp side-hit.
- The Pigeon King now appears inside the flagship opening slice instead of near the old full-level finale distance.
- `openingRoute.bossArena` pins trigger, floor, and patrol width to authored geometry; validation now rejects boss arenas without a matching platform floor.
- Boss entry emits `BOSS_FIGHT`; boss victory now reports the configured boss victory type.
- Boss snapshots now expose phase, mode, arena, boss position/velocity, HP, feathers, and mini-pigeon counts through `window.render_game_to_text()`.
- Boss contact now distinguishes stomp from side/swoop hits; feathers and mini-pigeons record specific interaction types.
- First-phase timing was softened for the slice: one opening swoop before landing, fewer feathers, and a longer first stomp window.
- Replaced the rough four-band sky with a full pixel starry-night backdrop and crescent moon; `01-start.png` and `02-jump-gap.png` were refreshed against the new look.
- Far and mid skyline strips now use much taller silhouettes, reaching roughly half the camera height so the route feels embedded in nearby buildings instead of separated from a distant skyline.
- Playable foreground facades now draw with an opaque backing so nearby skyline silhouettes no longer show through buildings the player stands on.
- First landing route was widened and the calm handoff platform was extended; the opening slice now reaches a readable handoff screenshot before the procedural level takes over.
- Top-facade windows now start lower and use deterministic alpha so the gameplay lane is less noisy and no longer flickers frame to frame.
- `window.render_game_to_text()` now reports `lastInteraction` and `recentInteractions`; `03-stomp-vs-side-hit-state.json` confirms pigeon stomp, coin pickup, and rat side-hit in one run.
- Damage now has a short invulnerability gate, preventing one overlap from draining multiple lives during enemy or hazard QA.
- Selected cleanup pass replaced the rougher platformer hero sheet with a chunkier Beach Kitty read: triangular ears, scarf, stronger side-view body, clearer jump/fall/glide/hurt poses, and preserved fixed 64x64 frames.
- Pigeon, rat, raccoon, AC unit, neon sign, and power-up icons received the same cleanup pass; enemy tops, low rat silhouette, charge tell, and pickup symbols now read more clearly at gameplay scale.
- Victory and game-over dev hooks drive the React result surfaces; screenshots `07` and `08` are captured.

## Follow-Ups

- Continue hands-on boss difficulty tuning after play review: throw cooldown, feather pressure, and stomp timing are now isolated knobs.
