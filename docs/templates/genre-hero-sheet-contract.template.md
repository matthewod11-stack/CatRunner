# Level {{LEVEL_NUMBER}} {{GENRE_TITLE}} Hero Sheet Contract

Default gameplay cat contract for `{{LEVEL_ID}}` (`{{GENRE}}`).

This contract is required before custom gameplay cats can replace the default hero. A static still image is not enough for a completed action level.

## Runtime Owner

- Scene family: `{{GENRE}}`
- Asset root: `assets/sprites/{{ASSET_SLUG}}/hero/`
- Runtime manifest/module: TODO
- Resolver/test owner: TODO

## Sheet Geometry

| Property | Value |
| --- | --- |
| Sheet file | `assets/sprites/{{ASSET_SLUG}}/hero/TODO-hero-sheet.png` |
| Frame size | TODO x TODO |
| Columns | TODO |
| Total frames | TODO |
| Origin | TODO |
| Contact/baseline point | TODO |
| Transparent padding rule | TODO |
| Runtime render size | TODO |

## Required Animation States

Genre baseline states:

{{GENRE_HERO_STATES}}

| State | Frames | Frame Rate | Repeat | Runtime Trigger |
| --- | --- | --- | --- | --- |
| idle | TODO | TODO | loop | no movement / wait state |
| move-primary | TODO | TODO | loop | main genre movement |
| move-secondary | TODO | TODO | loop or once | jump, fall, glide, aim, paddle, climb, or genre-specific action |
| interact | TODO | TODO | once | attack, shoot, whack, collect, bounce, or genre-specific action |
| hurt | TODO | TODO | once | damage feedback |
| victory | TODO | TODO | loop | level complete |
| defeat | TODO | TODO | once | game over |

## Collision Boxes

Collision boxes must be documented separately from visual padding.

| Runtime State | Box | Notes |
| --- | --- | --- |
| normal | TODO | default body |
| action | TODO | duck/glide/aim/climb/etc. if applicable |
| powered | TODO | optional power-up variant |

## Resolver Priority

Document the exact priority from highest to lowest. Example:

1. defeat
2. victory
3. hurt
4. genre-specific action
5. airborne / active movement state
6. idle

Genre-specific resolver concerns:

{{GENRE_RESOLVER_CONCERNS}}

## Swap Rules

- Replacement sheets must keep the same frame size, origin, baseline, and required states unless the contract and tests are updated together.
- Custom/generated gameplay cats must pass the same resolver and collision tests as the default sheet.
- Any regenerated sheet needs an updated screenshot or QA artifact in `{{QA_CHECKLIST_DOC}}`.

## Open Questions

- TODO: genre-specific states that need validation in playtest.
- TODO: whether the default sheet can share poses with other genres or needs bespoke art.
