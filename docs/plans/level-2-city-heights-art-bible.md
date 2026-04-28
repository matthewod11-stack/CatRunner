# Level 2 City Heights Pixel Art Bible

Master art reference for the `ROOFTOPS` flagship platformer slice.

Related docs:

- [`level-2-city-heights-visual-brief.md`](./level-2-city-heights-visual-brief.md)
- [`level-2-city-heights-prompt-pack.md`](./level-2-city-heights-prompt-pack.md)
- [`level-2-city-heights-asset-inventory.md`](./level-2-city-heights-asset-inventory.md)
- [`level-2-platformer-hero-sheet-contract.md`](./level-2-platformer-hero-sheet-contract.md)
- [`level-2-city-heights-qa-checklist.md`](./level-2-city-heights-qa-checklist.md)

## Slice Promise

City Heights should feel like a cozy SNES-era rooftop platformer starring Beach Kitty. The first playable slice is not a skyline collage; it is a clear platforming route with funny rooftop business: pigeons acting important, AC units puffing like tiny factories, laundry lines with personality, satellite dishes used as bounce pads, and a ridiculous Pigeon King promise in the distance.

## Pixel Rules

- Use true pixel art with nearest-neighbor scaling.
- Use fixed sprite frame grids and transparent backgrounds for all gameplay sprites.
- Avoid anti-aliased edges, vector gradients, soft blurs, baked drop shadows, fake checkerboard transparency, and poster-style compositions.
- Favor 8-16 colors per sprite family, with shared outline colors.
- Backgrounds may use banded pixel dithering, but gameplay sprites must stay sharper and higher contrast.
- Every gameplay asset needs a clear baseline/contact point before it is accepted.

## Palette

| Role | Colors | Notes |
| --- | --- | --- |
| Evening sky | `#ff9f43`, `#ffd166`, `#7c3aed`, `#1a1a3e` | Use broad pixel bands and sparse dithering, not smooth gradients |
| Far skyline | `#0d0d2b`, `#141436`, `#24244f` | Low contrast, never a landing-surface read |
| Rooftop surfaces | `#8b7355`, `#a89070`, `#d8c198`, `#2f251c` | Highest environmental contrast belongs to top collision lips |
| Cat hero | `#f6b06d`, `#ffcf8a`, `#fef3c7`, `#273043` | Warm Beach Kitty read, dark outline, bright face pixels |
| Enemies/hazards | `#94a3b8`, `#ef4444`, `#d946ef`, `#f97316` | Hazard states must not be confused with coins |
| Pickups/power-ups | `#facc15`, `#3b82f6`, `#22c55e`, `#a855f7` | Coin remains distinct from window lights |
| Shared ink | `#111827`, `#273043` | Gameplay outlines and key facial details |

## Scale Rules

| Family | Target Source Size | Runtime Read |
| --- | --- | --- |
| Hero | 64x64 per frame | Display around 56x56 with a 40x48 body |
| Small enemies | 24-32px wide | Stompable top silhouette visible at speed |
| Hazards | 24-40px wide | Unsafe state visible before contact |
| Pickups | 16-24px | Distinct from windows and HUD |
| Rooftop cap tiles | 32x8 or 64x8 | Strong top line, tileable |
| Background strips | 320x180 or tile strips | Lower contrast than platforms |

## Hero Direction

Beach Kitty is the default City Heights hero: a warm orange platforming cat with expressive eyes, small backpack or rooftop scarf optional, and strong Mario-style action poses. Required pose reads are idle, run, jump rise, fall, stomp/land squash, glide, hurt, victory, defeat, and power-up sparkle. Do not use custom user cats as gameplay heroes until they can satisfy the same sheet contract.

## Rooftop Language

- Walkable roofs have a bright top lip and dark underside.
- Fire escapes and scaffold platforms use clear horizontal top bars.
- Clotheslines need one readable ride/contact line plus decorative cloth below it.
- Satellite dishes are bounce pads; their bowl angle points the expected launch direction.
- AC units are solid blockers; steam is a separate timed warning.
- Neon signs need explicit on/off pixel variants, not subtle glow changes only.
- Windows stay dim, rectangular, and lower saturation than coins.

## Humor And Boss Identity

The level should be funny in the asset choices, not through text labels. Pigeons can look bureaucratic, rats can look over-caffeinated, and the Pigeon King should read as pompous and theatrical. The boss promise is a large crowned pigeon silhouette with feather projectiles, mini-pigeons, landed vulnerability, hit, and defeat states.

## Rejection Rules

- Reject any sprite with antialiased fuzzy edges at 4x zoom.
- Reject fake transparency, borders, frames, or box artifacts.
- Reject skyline or facade art whose windows look collectible.
- Reject platform caps without a readable top collision line.
- Reject enemy art where stomp-vs-side-hit cannot be judged from silhouette.
- Reject sheets with drifting feet baselines across movement frames.
