# Level 2 Platformer Hero Sheet Contract

Default gameplay cat contract for `ROOFTOPS` (`platformer`).

City Heights uses Beach Kitty as a true pixel-art platformer hero. A static custom cat image or rectangle fallback is not acceptable for the flagship slice.

## Runtime Owner

- Scene family: `platformer`
- Asset root: `assets/sprites/rooftops/hero/`
- Runtime module: `scenes/platformer/heroSheet.ts`
- Resolver/test owner: `scenes/platformer/heroSheet.test.ts`
- Scene integration target: `scenes/PlatformerScene.ts`

## Sheet Geometry

| Property | Value |
| --- | --- |
| Sheet file | `assets/sprites/rooftops/hero/platformer-hero-sheet.png` |
| Frame size | `64 x 64` |
| Columns | `8` |
| Total frames | `32` maximum |
| Origin | bottom center, `{ x: 0.5, y: 1 }` |
| Contact/baseline point | paws on platform top at `feetBaselineY: 58` |
| Transparent padding rule | room for ears, jump, stomp squash, and victory pose; no feet below baseline |
| Runtime render size | `56 x 56`, tuned against the current `40 x 48` physics body |

## Required Animation States

| State | Frames | Frame Rate | Repeat | Runtime Trigger |
| --- | --- | --- | --- | --- |
| idle | `0-1` | 4 | loop | no horizontal input, grounded |
| run | `2-7` | 12 | loop | grounded left/right movement |
| jumpRise | `8-9` | 9 | loop | airborne with upward velocity |
| fall | `10-11` | 8 | loop | airborne with downward velocity |
| landStomp | `12-14` | 12 | once | stomp enemy or land-impact feedback |
| glide | `15-17` | 10 | loop | glide power-up active and jump held while falling |
| hurt | `18-20` | 12 | once | damage feedback |
| victory | `21-24` | 7 | loop | level complete |
| defeat | `25-27` | 6 | once | game over |
| powerUp | `28-31` | 8 | once | shield/triple-jump/glide pickup feedback |

## Collision Boxes

Collision boxes are documented separately from visual padding.

| Runtime State | Box | Notes |
| --- | --- | --- |
| normal | `{ x: 12, y: 10, width: 40, height: 48 }` before render scaling | matches current platformer body size |
| airborne | `{ x: 12, y: 10, width: 40, height: 48 }` | avoids jump-state collision drift |
| stomp/land | `{ x: 10, y: 18, width: 44, height: 40 }` | squash pose is visual; collision remains predictable |
| glide | `{ x: 8, y: 8, width: 48, height: 50 }` | visual cape/arms may be wider |
| shield/powered | no collision expansion | shield is an external bubble and absorb state |

## Resolver Priority

1. defeat
2. victory
3. hurt
4. land/stomp feedback
5. power-up feedback
6. glide
7. airborne rise/fall
8. grounded run
9. idle

Facing direction is deterministic and driven by the latest horizontal input or velocity. Prefer flipping the sprite over duplicating left/right frames.

## Swap Rules

- Replacement sheets must keep frame size, origin, baseline, and required states unless this contract and tests change together.
- Custom/generated gameplay cats must pass the same resolver and collision tests as the default sheet.
- Any regenerated sheet needs an updated screenshot or QA artifact in `level-2-city-heights-qa-checklist.md`.
- The platformer default sheet may share Beach Kitty identity, but platformer poses must be bespoke.

## Open Questions For Later Polish

- Whether City Heights needs ledge-grab/climb poses after the opening slice.
- Whether triple jump deserves a distinct hero frame beyond the current power-up feedback.
- Whether the shield bubble needs multiple animation frames after QA.
