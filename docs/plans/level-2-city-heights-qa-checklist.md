# Level 2 City Heights QA Checklist

Manual and automated QA for `ROOFTOPS` (`platformer`).

Related docs:

- [`level-2-city-heights-art-bible.md`](./level-2-city-heights-art-bible.md)
- [`level-2-city-heights-visual-brief.md`](./level-2-city-heights-visual-brief.md)
- [`level-2-city-heights-asset-inventory.md`](./level-2-city-heights-asset-inventory.md)
- [`level-2-platformer-hero-sheet-contract.md`](./level-2-platformer-hero-sheet-contract.md)

## Local Target

```text
http://127.0.0.1:3000/?unlock_all=1
```

## Automated Checks

```bash
npm run test:run
npx tsc --noEmit
npm run build
npm run test:smoke
```

Latest baseline before first tuning pass:

- `npm run test:run` - 46 files, 222 tests passing
- `npx tsc --noEmit` - passing
- `npm run build` - passing with existing large chunk warning
- Web-game client action loop - state snapshots produced with no console-error files; canvas-only PNG capture is black under headless WebGL, so full-page screenshots below are the visual source of truth

## Web-Game Hooks

- `window.render_game_to_text()` should return the current platformer state as concise JSON.
- `window.advanceTime(ms)` should perform best-effort Phaser stepping for Playwright action bursts.
- Test payloads should cover right movement, left movement, jump, held jump/glide when available, pause/resume, and route reset/eject.

## Manual Playtest

- [x] Start `City Heights` from campaign select.
- [x] Verify Beach Kitty pixel hero spawn, camera framing, and first 10 seconds of rooftop readability.
- [x] Exercise left/right movement, variable-height jumping, double jump, and camera-follow traversal.
- [x] Land on at least three hand-authored opening-route rooftops.
- [ ] Stomp the seeded pigeon and compare against a seeded side-hit/damage case.
- [x] Trigger the seeded hazard and verify its unsafe state is readable.
- [x] Collect the seeded coin and one opening-route power-up path item.
- [x] Confirm pause/resume and campaign eject/readability.
- [ ] Confirm dev-hook victory and game-over still drive React result surfaces.

## Screenshot / Capture Set

Store artifacts under `docs/artifacts/level-2-city-heights/`.

- [x] `01-start.png` - spawn and first rooftop
- [x] `02-jump-gap.png` - jump arc and landing target
- [ ] `03-stomp-vs-side-hit.png` - enemy interaction readability
- [x] `04-hazard-pickup.png` - seeded hazard plus pickup/power-up
- [x] `05-pause.png` - fixed HUD and pause overlay over city background
- [ ] `06-opening-route-complete.png` - hand-authored slice handoff area
- [ ] `07-victory.png`
- [ ] `08-game-over.png`

## Findings

- Platform edge clarity is good enough for the baseline; next tuning should reduce facade/window repetition under the gameplay lane.
- Jump arc and landing feel are testable, but the first gap needs tuning after a stomp-specific capture.
- TODO: stomp vs side-hit readability.
- Pixel hero pose readability is acceptable at first pass, but jump/fall silhouettes need stronger contrast against bright sky.
- HUD/pause over pixel skyline and facade detail passed first capture.
- TODO: terminal flows.

## Follow-Ups

- Replace generated baseline assets with selected image-generation candidates where they materially improve the slice.
- Add a platformer-specific boss/finale capture helper after the opening-route slice is stable.
