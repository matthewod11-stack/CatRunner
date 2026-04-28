# Level 2 City Heights Visual Brief

Active art direction for `ROOFTOPS` (`platformer`).

Related pipeline docs:

- [`level-2-city-heights-art-bible.md`](./level-2-city-heights-art-bible.md)
- [`level-2-city-heights-prompt-pack.md`](./level-2-city-heights-prompt-pack.md)
- [`level-2-city-heights-asset-inventory.md`](./level-2-city-heights-asset-inventory.md)
- [`level-2-platformer-hero-sheet-contract.md`](./level-2-platformer-hero-sheet-contract.md)
- [`level-2-city-heights-qa-checklist.md`](./level-2-city-heights-qa-checklist.md)

## Direction

City Heights is now the flagship cozy pixel-art platformer slice for Beach Kitty. It should feel like a warm, funny rooftop adventure: crisp pixel silhouettes, readable Mario-style jumps, charming rooftop props, and a theatrical Pigeon King promise. The first read must be "where can I land, what can hurt me, and what can I stomp" before the player notices skyline detail.

## Genre Contract

Core mechanic: left/right movement, variable-height jumping, double/triple jump, stomps, bounce pads, secondary platforms, and camera-follow traversal.

Genre-specific readability focus:

- Walkable rooftop lips must be the highest-contrast environmental pixels.
- Enemy top silhouettes, side-hit silhouettes, and stomp feedback must be obvious at gameplay scale.
- Fire escapes, clotheslines, satellite dishes, AC units, and neon signs each need a distinct interaction language.
- The opening route is hand-authored first; procedural generation resumes after the flagship slice.

## Palette

| Role | Colors | Usage |
| --- | --- | --- |
| Background | `#ff9f43`, `#ffd166`, `#7c3aed`, `#1a1a3e` | banded golden-hour sky and distant atmosphere |
| Far skyline | `#0d0d2b`, `#141436`, `#24244f` | low-contrast pixel silhouettes |
| Gameplay rooftops | `#8b7355`, `#a89070`, `#d8c198`, `#2f251c` | walkable surfaces, top lips, platform undersides |
| Hero | `#f6b06d`, `#ffcf8a`, `#fef3c7`, `#273043` | Beach Kitty pixel hero sheet |
| Hazards/enemies | `#94a3b8`, `#ef4444`, `#d946ef`, `#f97316` | pigeons, rats, AC, neon, timed danger states |
| Pickups/power-ups | `#facc15`, `#3b82f6`, `#22c55e`, `#a855f7` | coins, triple jump, glide, shield |
| Ink/outline | `#111827`, `#273043` | sprite outlines and collision-surface detail |

## Pixel Style

- True pixel art only for final gameplay assets: no vector gradients, antialiased sprite edges, soft blur, or fake transparency.
- Use nearest-neighbor scaling and fixed source grids.
- Gameplay sprites carry stronger outlines and cleaner silhouettes than background detail.
- Background strips can use banded pixel shading and sparse dithering, but must stay lower contrast than platforms.
- Windows and facade marks must be sparse and dim enough to avoid reading as coins.

## Camera And Readability

- Genre camera: side-view platformer with horizontal follow and limited vertical movement.
- Primary player read: bottom-center Beach Kitty, deterministic facing, distinct run/jump/fall/glide/stomp poses.
- Primary hazard read: AC units block, steam warns, neon on/off state hurts, satellite dishes bounce, clotheslines/platforms carry.
- Core mechanic read: every jump target needs a visible landing lip before the player commits.
- HUD/pause relationship: fixed React/Phaser HUD surfaces must remain readable over moving city art.

## Asset Families

| Family | Needed Assets | Notes |
| --- | --- | --- |
| Environment | sky, far skyline, mid skyline, facade tile, rooftop cap tile | pixel strips/tiles; rooftop caps outrank skyline detail |
| Platform/traversal | fire escape, scaffold, clothesline, satellite dish, rooftop props | clear contact line and baseline |
| Enemies/hazards | pigeon, rat, raccoon idle/charge, AC unit, steam puff, neon on/off | top-vs-side contact must read |
| Collectibles/power-ups | coin, triple jump, glide, shield | distinct from windows and neon |
| Background entities | antennas, water tanks, vents, pipes, distant birds | low priority, lower contrast |
| Boss/finale | Pigeon King idle/swoop, landed/vulnerable, attack, hit, defeat; feather; mini pigeons | boss state changes cannot rely only on HP text |
| Hero | 64x64 Beach Kitty platformer sheet | see `level-2-platformer-hero-sheet-contract.md` |
| FX/support | stomp burst, dust, feather hit, neon zap, power-up aura, shield bubble | reinforce gameplay without hiding landing targets |

## Acceptance Notes

- The first completion target is the deterministic opening route, not the full 15,000px level.
- Platform readability beats skyline richness.
- The art pass is not complete until assets are loaded through a City Heights manifest and verified in-game.
- Weezy is reference material only; do not copy its code or assets into Beach Kitty.
