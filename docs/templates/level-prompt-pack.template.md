# Level {{LEVEL_NUMBER}} {{LEVEL_NAME}} Prompt Pack

Source-generation notes for `{{LEVEL_ID}}` (`{{GENRE}}`).

The prompts here are for model-assisted or external art-tool generation only. Shipped gameplay art must still be cleaned, committed, and loaded through deterministic runtime paths.

## Global Prompt Invariants

Use these constraints for every generated candidate unless a section explicitly overrides them:

- {{GENRE_PROMPT_PHRASE}}
- TODO: visual style
- TODO: outline/edge treatment
- TODO: palette anchors from `{{VISUAL_BRIEF_DOC}}`
- TODO: transparent-background rule for gameplay sprites
- TODO: opaque full-bleed rule for background/tile layers
- no text labels, no UI mockups, no poster composition
- readable at gameplay scale

## Environment

### Background / Sky / Backdrop

Prompt: TODO.

Export target: `assets/sprites/{{ASSET_SLUG}}/environment/TODO.svg`.

Acceptance: TODO.

### Gameplay Surface

Prompt: TODO.

Export target: `assets/sprites/{{ASSET_SLUG}}/environment/TODO.svg`.

Acceptance: TODO.

## Obstacles And Enemies

### Primary Hazard

Prompt: TODO.

Export target: `assets/sprites/{{ASSET_SLUG}}/obstacles/TODO.svg`.

Acceptance: TODO.

### Secondary Hazard / Enemy

Prompt: TODO.

Export target: `assets/sprites/{{ASSET_SLUG}}/obstacles/TODO.svg`.

Acceptance: TODO.

## Collectibles And Power-Ups

### Core Collectible

Prompt: TODO.

Export target: `assets/sprites/{{ASSET_SLUG}}/collectibles/TODO.svg`.

Acceptance: TODO.

### Power-Up Family

Prompt: TODO.

Export target: `assets/sprites/{{ASSET_SLUG}}/fx/TODO.svg`.

Acceptance: TODO.

## Background Entities

List lower-priority silhouettes, vehicles, props, or decorative entities here. They should support depth without competing with gameplay.

- TODO.

Export targets live under `assets/sprites/{{ASSET_SLUG}}/entities/`.

## Boss Or Finale States

Required states:

- idle/neutral: TODO
- attack/active: TODO
- hit/feedback: TODO
- defeat/victory transition: TODO

Export targets live under `assets/sprites/{{ASSET_SLUG}}/boss/`.

## Rejection Rules

- TODO: fake transparency cases to reject.
- TODO: silhouettes that are too close to pickups or hazards.
- TODO: style drift that breaks the visual brief.

## Genre-Specific Prompt Families

{{GENRE_PROMPT_FAMILIES}}
