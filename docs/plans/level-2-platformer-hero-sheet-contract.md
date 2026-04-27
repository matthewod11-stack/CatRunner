# Level 2 Platformer Hero Sheet Contract

Default gameplay cat contract for `ROOFTOPS` (`platformer`).

This is the first non-runner application of the Beach hero-sheet process. The exact frame art can still change, but City Heights should not reach final polish with a static still image or rectangle fallback as the baseline gameplay cat.

## Runtime Owner

- Scene family: `platformer`
- Asset root: `assets/sprites/rooftops/hero/`
- Proposed runtime module: `scenes/platformer/heroSheet.ts`
- Resolver/test owner: `scenes/platformer/heroSheet.test.ts`
- Scene integration target: `scenes/PlatformerScene.ts`

## Proposed Sheet Geometry

| Property | Value |
| --- | --- |
| Sheet file | `assets/sprites/rooftops/hero/platformer-hero-sheet.png` |
| Frame size | `192 x 192` |
| Columns | `8` |
| Total frames | `32` maximum for first pass |
| Origin | bottom center, `{ x: 0.5, y: 1 }` |
| Contact/baseline point | rear/front paws on platform top; proposed `feetBaselineY: 168` |
| Transparent padding rule | enough top/side room for jump, stomp squash, and victory poses; no gameplay feet below baseline |
| Runtime render size | proposed `48 x 58`, tuned against current `PLAYER_WIDTH = 40`, `PLAYER_HEIGHT = 48` |

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
| powerUp | `28-31` | 8 | loop or once | shield/triple-jump/glide pickup feedback if needed |

## Collision Boxes

Collision boxes must be documented separately from visual padding.

| Runtime State | Box | Notes |
| --- | --- | --- |
| normal | proposed `{ x: 76, y: 116, width: 40, height: 48 }` before render scaling | matches current platformer body size |
| airborne | same as normal unless playtest proves jump art needs tighter sides | avoids jump-state collision drift |
| stomp/land | proposed `{ x: 72, y: 122, width: 48, height: 42 }` | slightly wider visual read, collision still predictable |
| glide | proposed `{ x: 68, y: 110, width: 56, height: 52 }` | only if glide art materially widens silhouette |
| shield/powered | no collision expansion by default | shield is presentation/absorb state, not size change |

## Resolver Priority

1. defeat
2. victory
3. hurt
4. land/stomp feedback
5. power-up action or glide
6. airborne rise/fall
7. grounded run
8. idle

Facing direction must be deterministic and driven by the most recent horizontal input or velocity. Prefer flipping the sprite over duplicating left/right frames unless asymmetrical art requires separate states.

## Swap Rules

- Replacement sheets must keep frame size, origin, baseline, and required states unless this contract and tests change together.
- Custom/generated gameplay cats must pass the same resolver and collision tests as the default sheet.
- Any regenerated sheet needs an updated screenshot or QA artifact in `level-2-city-heights-qa-checklist.md`.
- The platformer default sheet may share style with the Beach runner cat, but poses must be platformer-specific: run, jump, fall, land/stomp, and glide cannot be recycled blindly from the runner sheet.

## Open Questions For The Level 2 Pass

- Whether City Heights needs a separate ledge-grab/climb state or can defer that because current mechanics do not support ledge grabbing.
- Whether triple jump should have a distinct animation or only a particle/aura effect.
- Whether shield should be represented by hero frames or an external bubble sprite.
