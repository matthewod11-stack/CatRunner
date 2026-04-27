# Level 2 City Heights Visual Brief

Active art direction for `ROOFTOPS` (`platformer`).

Related pipeline docs:

- [`level-2-city-heights-prompt-pack.md`](./level-2-city-heights-prompt-pack.md)
- [`level-2-city-heights-asset-inventory.md`](./level-2-city-heights-asset-inventory.md)
- [`level-2-platformer-hero-sheet-contract.md`](./level-2-platformer-hero-sheet-contract.md)
- [`level-2-city-heights-qa-checklist.md`](./level-2-city-heights-qa-checklist.md)

## Direction

City Heights should feel like a golden-hour rooftop platformer: the cat is crossing layered city buildings, using fire escapes and rooftop props as readable traversal affordances, then entering a penthouse boss arena against the Pigeon King. The first read must be "where can I land, what can hurt me, and what can I stomp" rather than "city skyline collage."

## Genre Contract

Core mechanic: left/right movement, variable-height jumping, stomps, secondary platforms, and camera-follow traversal.

Genre-specific readability focus:

- Walkable rooftop edges must be more readable than decorative facades.
- Enemy stomp silhouettes, jump targets, and hazard timing tells must remain clear while the camera follows the player.
- Fire escapes, clotheslines, and satellite dishes need a distinct "usable traversal object" language separate from skyline decoration.

## Palette

| Role | Colors | Usage |
| --- | --- | --- |
| Background | `#ff6b35`, `#ffd166`, `#1a1a3e` | golden-hour sky gradient, readable but warm |
| Far skyline | `#0d0d2b`, `#141436` | low-contrast depth silhouettes |
| Mid buildings | `#1a1a2e`, `#1e1e35`, `#252540` | parallax structures and facades |
| Gameplay rooftops | `#8b7355`, `#a89070`, `#d8c198` | walkable surfaces and platform edges |
| Windows/lights | `#ffcc44`, `#ffdca8`, `#f97316` | low-alpha facade detail, never hazard color priority |
| Hazards/enemies | `#ef4444`, `#f97316`, `#d946ef`, `#94a3b8` | neon, AC units, pigeons/rats/raccoons, damage states |
| Pickups/power-ups | `#facc15`, `#3b82f6`, `#22c55e`, `#a855f7` | coins, triple jump, glide, shield |
| Ink/outline | `#111827`, `#273043` | gameplay silhouettes and state detail |

## Line Style

- Chunky arcade vector silhouettes with stronger outline on gameplay objects than on skyline/facade details.
- Rooftop edges get the highest environmental contrast because they are collision surfaces.
- Windows and decorative facade marks should be sparse and low-contrast enough to avoid looking collectible.
- Enemies need readable eyes/body direction at small sizes; hazards need one visual tell per unsafe state.

## Camera And Readability

- Genre camera: side-view platformer with horizontal follow and vertical movement.
- Primary player read: bottom-center grounded cat, directional facing, clear jump/fall/stomp poses.
- Primary hazard read: AC units block ground movement, clotheslines are rideable, satellite dishes are bounce pads, neon signs have explicit on/off states.
- Core mechanic read: every jump target needs a visible landing lip before the player commits.
- HUD/pause relationship: current React/Phaser HUD surfaces should remain readable while the camera moves; avoid bright background detail behind fixed HUD text.

## Asset Families

| Family | Needed Assets | Notes |
| --- | --- | --- |
| Environment | sky gradient/backdrop, far skyline, mid skyline, building facade tiles, rooftop cap/edge pieces | full-bleed or tile rules; walkable edges are priority |
| Platform/traversal | fire escape, scaffold, clothesline, satellite dish, rooftop props | must read as usable or solid at gameplay scale |
| Enemies/hazards | pigeon, rat, raccoon, AC unit, steam puff, neon sign | true alpha, clear hit/stomp/damage silhouettes |
| Collectibles/power-ups | coin, triple jump, glide, shield | distinct from window lights and hazard colors |
| Background entities | antennas, water tanks, vents, pipes, distant birds | lower priority silhouettes |
| Boss/finale | Pigeon King idle, swoop, landed/vulnerable, hit, defeat; feather projectile; mini pigeons | boss state changes must read without relying only on particles |
| Hero | platformer cat sheet | see `level-2-platformer-hero-sheet-contract.md` |
| FX/support | stomp burst, dust, feather hit, neon zap, power-up aura, victory/game-over support | feedback should reinforce rather than hide landing targets |

## Acceptance Notes

- The art pass is not complete until the current procedural rectangles/shapes are replaced or deliberately retained behind a manifest with final styling notes.
- Platform readability beats skyline detail. If a facade looks better but makes a landing surface ambiguous, the facade loses.
- The first QA capture set should prove spawn readability, gap/jump readability, enemy stomp clarity, hazard timing, boss arena framing, pause, victory, and game-over.
