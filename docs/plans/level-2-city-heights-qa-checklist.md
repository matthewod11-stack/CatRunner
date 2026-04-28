# Level 2 City Heights QA Checklist

Manual and automated QA for `ROOFTOPS` (`platformer`).

Related docs:

- [`level-2-city-heights-art-bible.md`](./level-2-city-heights-art-bible.md)
- [`level-2-city-heights-visual-brief.md`](./level-2-city-heights-visual-brief.md)
- [`level-2-city-heights-asset-inventory.md`](./level-2-city-heights-asset-inventory.md)
- [`level-2-platformer-hero-sheet-contract.md`](./level-2-platformer-hero-sheet-contract.md)

## Local Target

```text
http://127.0.0.1:5173/?unlock_all=1&level=ROOFTOPS
```

## Automated Checks

```bash
npm run test:run
npx tsc --noEmit
npm run build
npm run test:smoke
```

Latest Phase 6 capture pass:

- `npm run test:run` - 46 files, 222 tests passing
- `npx tsc --noEmit` - passing
- `npm run build` - passing with existing large chunk warning
- `npm run test:smoke` - 3 browser smoke tests passing
- Web-game client and targeted Playwright capture loops - state snapshots produced with no browser errors; canvas-only PNG capture is black under headless WebGL, so full-page screenshots below are the visual source of truth

## Web-Game Hooks

- `window.render_game_to_text()` should return the current platformer state as concise JSON.
- `window.advanceTime(ms)` should perform best-effort Phaser stepping for Playwright action bursts.
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

## Findings

- Replaced the rough four-band sky with a full pixel starry-night backdrop and crescent moon; `01-start.png` and `02-jump-gap.png` were refreshed against the new look.
- Far and mid skyline strips now use much taller silhouettes, reaching roughly half the camera height so the route feels embedded in nearby buildings instead of separated from a distant skyline.
- Playable foreground facades now draw with an opaque backing so nearby skyline silhouettes no longer show through buildings the player stands on.
- First landing route was widened and the calm handoff platform was extended; the opening slice now reaches a readable handoff screenshot before the procedural level takes over.
- Top-facade windows now start lower and use deterministic alpha so the gameplay lane is less noisy and no longer flickers frame to frame.
- `window.render_game_to_text()` now reports `lastInteraction` and `recentInteractions`; `03-stomp-vs-side-hit-state.json` confirms pigeon stomp, coin pickup, and rat side-hit in one run.
- Damage now has a short invulnerability gate, preventing one overlap from draining multiple lives during enemy or hazard QA.
- Pixel hero pose readability is acceptable at this scale, but jump/fall silhouettes still deserve stronger contrast in the next regenerated sheet.
- Victory and game-over dev hooks drive the React result surfaces; screenshots `07` and `08` are captured.

## Follow-Ups

- Replace generated baseline assets with selected image-generation candidates where they materially improve the slice.
- Add a platformer-specific boss/finale capture helper after the opening-route slice is stable.
