# Level 2 City Heights Prompt Pack

Source-generation notes for `ROOFTOPS` (`platformer`).

The prompts here are for model-assisted or external art-tool generation only. Shipped gameplay art must be cleaned, committed, and loaded through deterministic runtime paths.

Related docs:

- [`level-2-city-heights-art-bible.md`](./level-2-city-heights-art-bible.md)
- [`level-2-city-heights-visual-brief.md`](./level-2-city-heights-visual-brief.md)

## Global Prompt Invariants

Use these constraints for every generated candidate unless a section explicitly overrides them:

- true pixel art, cozy SNES-era side-view platformer asset
- Beach Kitty rooftop adventure, warm and funny but readable
- fixed pixel grid, nearest-neighbor look, no anti-aliasing, no blur
- shared dark outline, 8-16 color sprite palette, transparent background for gameplay sprites
- opaque pixel strip or tile output only for background, skyline, facade, and rooftop surface layers
- no text labels, no UI mockups, no poster composition, no fake border, no frame, no box
- readable at gameplay scale and at 4x zoom

## Environment

### Pixel Sky Strip

Prompt: Cozy pixel-art golden-hour city sky for a side-view platformer, broad orange-to-gold-to-purple bands, sparse pixel dithering, no buildings in the foreground, no characters, opaque 320x180 background, readable behind HUD, no smooth gradient.

Export target: `assets/sprites/rooftops/environment/sky.png`.

Acceptance: background support only; no high-contrast details near the gameplay layer.

### Far Skyline

Prompt: Low-contrast pixel-art distant city skyline strip, deep navy-purple buildings, simple rooflines, sparse dim warm windows, seamless horizontal parallax strip, no foreground collision edges, opaque background.

Export target: `assets/sprites/rooftops/environment/far-skyline.png`.

Acceptance: reads as depth, never as landing platforms.

### Mid Skyline

Prompt: Pixel-art mid-distance city skyline strip, dark blue-purple buildings, larger dim window clusters, simple rooftop silhouettes, parallax-ready, lower contrast than gameplay rooftops.

Export target: `assets/sprites/rooftops/environment/mid-skyline.png`.

Acceptance: supports motion and depth without competing with roof lips.

### Building Facade Tile

Prompt: Pixel-art rooftop building facade tile, dark building body, sparse warm rectangular windows, subtle panel pixels, designed to sit below a separate high-contrast rooftop cap, opaque tile.

Export target: `assets/sprites/rooftops/environment/building-facade-tile.png`.

Acceptance: windows cannot resemble coins.

### Rooftop Cap Tile

Prompt: Pixel-art rooftop platform cap tile, warm concrete, strong bright top edge, dark underside, side-view collision surface, seamless horizontal tile, readable as walkable at small scale.

Export target: `assets/sprites/rooftops/environment/rooftop-cap.png`.

Acceptance: strongest environmental edge contrast in the level.

## Platform And Traversal Props

### Fire Escape / Scaffold

Prompt: Pixel-art side-view fire escape platform, small metal railings, transparent background, strong walkable top bar, readable as a usable secondary platform rather than decoration.

Export target: `assets/sprites/rooftops/entities/fire-escape.png`.

Acceptance: usable top line remains clear at 30-60px runtime width.

### Clothesline

Prompt: Pixel-art clothesline spanning between rooftops, taut rideable rope line with a few tiny cloth shapes below it, transparent background, no background cable confusion.

Export target: `assets/sprites/rooftops/obstacles/clothesline.png`.

Acceptance: rope contact line is visible.

### Satellite Dish Bounce Pad

Prompt: Pixel-art rooftop satellite dish bounce pad, gray-blue dish tilted upward with springy base, dark outline, transparent background, clearly readable as a bounce platform.

Export target: `assets/sprites/rooftops/obstacles/satellite-dish.png`.

Acceptance: dish bowl points the intended bounce direction.

## Enemies And Hazards

### Pigeon

Prompt: Stompable pixel-art rooftop pigeon enemy, pompous expression, side-view body, readable wings and beak, dark outline, transparent background, small patrol enemy for platformer.

Export target: `assets/sprites/rooftops/obstacles/pigeon.png`.

Acceptance: top stomp area reads clearly.

### Rat

Prompt: Fast pixel-art rooftop rat enemy, low side-view silhouette, pointed nose, visible tail, caffeinated expression, dark outline, transparent background.

Export target: `assets/sprites/rooftops/obstacles/rat.png`.

Acceptance: small but not lost against dark rooftops.

### Raccoon

Prompt: Pixel-art rooftop raccoon enemy, chunky body, mask markings, idle and charge variants, transparent background, charge silhouette visibly different from idle.

Export targets: `assets/sprites/rooftops/obstacles/raccoon-idle.png`, `raccoon-charge.png`.

Acceptance: charge state reads without text or particles.

### AC Unit And Steam

Prompt: Pixel-art rooftop AC unit hazard, boxy metal shape, grille pixels, dark outline, transparent background, solid blocker read. Separate steam puff sprite, pale gray-white pixel cloud burst, transparent background.

Export targets: `assets/sprites/rooftops/obstacles/ac-unit.png`, `assets/sprites/rooftops/fx/steam-puff.png`.

Acceptance: AC reads solid; steam reads warning/push.

### Neon Sign

Prompt: Pixel-art rooftop neon sign hazard, magenta-red glowing sign panel with simple bolt icon and no readable text, side bracket, transparent background, include separate on and off variants.

Export targets: `assets/sprites/rooftops/obstacles/neon-sign-on.png`, `neon-sign-off.png`.

Acceptance: on/off state is obvious without subtle glow.

## Collectibles And Power-Ups

### Coin

Prompt: Pixel-art rooftop coin collectible, golden disk with simple paw or star pixels, bold outline, transparent background, distinct from warm building windows.

Export target: `assets/sprites/rooftops/collectibles/coin.png`.

Acceptance: readable at pickup size and color-separated from facade lights.

### Triple Jump

Prompt: Pixel-art blue power-up icon for triple jump, circular badge with three upward chevrons or paw jumps, bold outline, transparent background.

Export target: `assets/sprites/rooftops/fx/triple-jump-powerup.png`.

Acceptance: communicates extra jump, not speed.

### Glide

Prompt: Pixel-art green glide power-up icon, circular badge with parachute or cape silhouette, bold outline, transparent background.

Export target: `assets/sprites/rooftops/fx/glide-powerup.png`.

Acceptance: communicates slow fall/recovery.

### Shield

Prompt: Pixel-art purple shield power-up icon, circular badge with shield bubble, bold outline, transparent background.

Export targets: `assets/sprites/rooftops/fx/shield-powerup.png`, `shield-bubble.png`.

Acceptance: not confused with neon hazard.

## Boss Or Finale States

### Pigeon King

Prompt: Large pixel-art rooftop Pigeon King boss, pompous oversized pigeon with crown-like feather tuft, theatrical expression, dark outline, transparent background, consistent silhouette across states.

Required states:

- idle/swoop: wings spread and moving across arena
- landed/vulnerable: feet on rooftop, body low enough for stomp
- attack: feather projectile drop tell
- hit: stunned expression and feather burst
- defeat: flying away or sprawled defeated silhouette

Export targets live under `assets/sprites/rooftops/boss/`.

## Cleanup Rules

- Inspect candidates at 4x zoom.
- Remove fake backgrounds and semi-transparent halos.
- Crop to content bounds, then center on the target canvas.
- Preserve fixed frame sizes for sheets.
- Re-run image generation instead of hand-waving major anatomy, perspective, or baseline failures.

## Rejection Rules

- Reject antialiased edges, smooth gradients, fake transparency, box frames, and poster compositions.
- Reject skyline art with bright window density that looks collectible.
- Reject fire escapes or clotheslines that read as decoration instead of usable traversal.
- Reject enemies without clear top/body silhouettes for stomp judging.
- Reject neon sign states that differ only by subtle glow.
