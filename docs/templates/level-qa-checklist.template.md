# Level {{LEVEL_NUMBER}} {{LEVEL_NAME}} QA Checklist

Manual and automated QA for `{{LEVEL_ID}}` (`{{GENRE}}`).

Related docs:

- [`{{VISUAL_BRIEF_DOC}}`](./{{VISUAL_BRIEF_DOC}})
- [`{{ASSET_INVENTORY_DOC}}`](./{{ASSET_INVENTORY_DOC}})
- [`{{HERO_CONTRACT_DOC}}`](./{{HERO_CONTRACT_DOC}})

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

- [ ] Start `{{LEVEL_NAME}}` from campaign select.
- [ ] Verify player spawn, camera framing, and first 10 seconds of readability.
- [ ] Exercise the core `{{GENRE}}` mechanic: {{CORE_MECHANIC}}.
- [ ] Trigger at least one hazard/enemy interaction.
- [ ] Collect one reward/power-up if applicable.
- [ ] Reach boss/finale or force the terminal flow through a dev helper.
- [ ] Confirm pause/resume and campaign eject/readability.
- [ ] Confirm victory, game-over, replay, Hall of Fame/result behavior.

## Screenshot / Capture Set

Store artifacts under `docs/artifacts/level-{{LEVEL_NUMBER}}-{{LEVEL_SLUG}}/`.

- [ ] `01-start.png`
- [ ] `02-core-mechanic.png`
- [ ] `03-hazard-readability.png`
- [ ] `04-pause.png`
- [ ] `05-boss-or-finale.png`
- [ ] `06-victory.png`
- [ ] `07-game-over.png`

## Findings

- TODO: readability.
- TODO: controls.
- TODO: HUD/pause.
- TODO: terminal flows.

Genre-specific QA focus:

{{GENRE_QA_FOCUS}}

## Follow-Ups

- TODO.
