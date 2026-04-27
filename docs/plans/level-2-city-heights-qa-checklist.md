# Level 2 City Heights QA Checklist

Manual and automated QA for `ROOFTOPS` (`platformer`).

Related docs:

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

## Manual Playtest

- [ ] Start `City Heights` from campaign select.
- [ ] Verify player spawn, camera framing, and first 10 seconds of rooftop readability.
- [ ] Exercise left/right movement, variable-height jumping, double jump, and camera-follow traversal.
- [ ] Land on at least three generated rooftops and confirm landing surfaces are clear.
- [ ] Stomp a pigeon or other enemy and compare against a side-hit/damage case.
- [ ] Trigger AC unit, clothesline, satellite dish, and neon sign behavior when those zones are reachable.
- [ ] Collect coins and at least one platformer power-up.
- [ ] Reach the Pigeon King arena or use a dev helper once one exists for platformer boss/finale capture.
- [ ] Confirm pause/resume and campaign eject/readability.
- [ ] Confirm victory, game-over, replay, Hall of Fame/result behavior.

## Screenshot / Capture Set

Store artifacts under `docs/artifacts/level-2-city-heights/`.

- [ ] `01-start.png` - spawn and first rooftop
- [ ] `02-jump-gap.png` - jump arc and landing target
- [ ] `03-stomp-vs-side-hit.png` - enemy interaction readability
- [ ] `04-hazards.png` - AC/clothesline/satellite/neon as available
- [ ] `05-pause.png` - fixed HUD and pause overlay over city background
- [ ] `06-boss-arena.png` - Pigeon King framing and camera lock
- [ ] `07-victory.png`
- [ ] `08-game-over.png`

## Findings

- TODO: platform edge clarity.
- TODO: jump arc and landing feel.
- TODO: stomp vs side-hit readability.
- TODO: camera follow and boss arena lock.
- TODO: HUD/pause over skyline and facade detail.
- TODO: terminal flows.

## Follow-Ups

- Add a platformer-specific dev capture helper if manual boss/finale capture remains too slow.
- Add screenshots once final City Heights art and hero sheet are integrated.
