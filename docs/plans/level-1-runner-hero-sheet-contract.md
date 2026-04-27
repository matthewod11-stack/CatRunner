# Level 1 Runner Hero Sheet Contract

This is the active Phase 2 contract for the default Beach gameplay cat. It is the contract future runner-cat swaps must satisfy before they can replace the shipped baseline.

Related files:

- `assets/sprites/beach/hero/runner-hero-sheet.png`
- `assets/sprites/beach/hero/runner-hero-sheet.svg`
- `scripts/generate-beach-hero-sheet.mjs`
- `scenes/runner/heroSheet.ts`
- `scenes/RunnerScene.ts`

## Operating Decision

Level 1 gameplay uses a committed curated animated runner sheet. Static custom cat renders remain valid for identity, closet, and preview surfaces, but they do not replace the gameplay hero until they can satisfy this same sheet contract.

## Sheet Geometry

| Field | Value |
| --- | --- |
| Frame size | `256x256` |
| Sheet layout | 8 columns, 29 populated frames |
| Runtime origin | bottom-center, `{ x: 0.5, y: 1 }` |
| Feet baseline | `y = 220` inside every frame |
| Bottom padding | `36px` below the feet baseline |
| Runtime ground-contact offset | `0px` for the current committed sheet |
| Runtime render box | `160x200`, scaled by `RunnerScene.ENTITY_SCALE` |
| Normal collision box | `{ x: 24, y: 0, width: 160, height: 200 }` |
| Duck collision box | `{ x: 24, y: 0, width: 160, height: 90 }` |

Frame art should stay inside the slot with predictable padding. Feet should land on the same baseline in every grounded frame so jump, duck, hurt, throw, victory, and defeat states do not require per-state anchoring code.

Phase 3 runtime audit note: the current committed sheet includes foot/shadow pixels down to the frame bottom. `scenes/runner/heroSheet.ts` therefore exposes `runtimeGroundOffset: 0` and anchors the current sheet by bottom-center contact. If a future regenerated sheet restores true transparent bottom padding, update `runtimeGroundOffset`, the helper tests, and browser screenshots together.

## Animation States

| State | Frames | Runtime behavior |
| --- | --- | --- |
| `idle` | `0, 1, 2, 1` | Fallback when the runner is not moving |
| `run` | `3-8` | Default grounded movement loop |
| `jumpRise` | `9-10` | Airborne with positive vertical velocity |
| `jumpFall` | `11-12` | Jump apex and falling state |
| `duck` | `13-15` | Grounded duck pose; collision height changes, render height does not |
| `hurt` | `16-18` | One-shot damage feedback |
| `shellThrow` | `19-21` | One-shot shell throw during boss fight |
| `victory` | `22-25` | Boss defeated or victory presentation |
| `defeat` | `26-28` | Game-over presentation |

`scenes/runner/heroSheet.ts` is the source of truth for frame indexes, animation keys, frame rates, and resolver priority.

## Resolver Priority

The runtime resolver maps gameplay state to animation state in this order:

1. Game over -> `defeat`
2. Victory or boss defeat sequence -> `victory`
3. Damage feedback -> `hurt`
4. Boss shell throw -> `shellThrow`
5. Duck input -> `duck`
6. Airborne rise/fall -> `jumpRise` or `jumpFall`
7. Movement -> `run`
8. Fallback -> `idle`

The one-shot feedback states are time-boxed in `RunnerScene`; ordinary movement state resumes after the short lock expires.

## Future Swap Rules

- Keep the same frame size, ordering, feet baseline, and transparent padding.
- Keep `runtimeGroundOffset` aligned with the actual committed sheet, not the intended padding alone.
- Keep the gameplay-facing animation names stable.
- Do not wire a generated custom cat into active gameplay unless it outputs every required state in this contract.
- Re-run `npm run test:run`, `npm run test:smoke`, `npx tsc --noEmit`, and `npm run build` after replacing the sheet.
- Confirm the sheet in a browser playtest before treating the swap as shippable.
