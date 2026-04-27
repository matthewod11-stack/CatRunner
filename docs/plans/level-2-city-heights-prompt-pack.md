# Level 2 City Heights Prompt Pack

Source-generation notes for `ROOFTOPS` (`platformer`).

The prompts here are for model-assisted or external art-tool generation only. Shipped gameplay art must still be cleaned, committed, and loaded through deterministic runtime paths.

## Global Prompt Invariants

Use these constraints for every generated candidate unless a section explicitly overrides them:

- side-view platformer arcade game asset with readable collision surfaces and rooftop traversal depth
- golden-hour city rooftop palette from `level-2-city-heights-visual-brief.md`
- chunky clean vector style, dark consistent outline on gameplay objects
- transparent background for sprites, enemies, hazards, boss states, props, pickups, and FX
- opaque full-bleed or seamless tile output only for background, skyline, facade, and rooftop surface layers
- no text labels, no UI mockups, no poster composition
- readable at gameplay scale

## Environment

### Golden-Hour Sky

Prompt: Side-view arcade platformer full-canvas golden-hour city sky, warm orange-to-gold-to-deep-purple gradient, simple atmospheric depth, no buildings in the foreground, no characters, no text, opaque full-bleed background, readable behind fixed HUD.

Export target: `assets/sprites/rooftops/environment/sky.svg`.

Acceptance: background support only; should not contain high-contrast details near the gameplay layer.

### Far Skyline

Prompt: Distant city skyline silhouette for a side-view arcade platformer, deep navy-purple buildings, simple rooflines, sparse low-alpha warm windows, seamless horizontal parallax strip, opaque full-width layer, low contrast.

Export target: `assets/sprites/rooftops/environment/far-skyline.svg`.

Acceptance: depth read only; never looks like a landing platform.

### Mid Skyline

Prompt: Mid-distance city skyline layer, dark blue-purple buildings with slightly larger warm windows, simple vector shapes, horizontal parallax strip, lower contrast than gameplay buildings, no foreground collision edges.

Export target: `assets/sprites/rooftops/environment/mid-skyline.svg`.

Acceptance: supports motion/depth without competing with rooftops.

### Gameplay Building Facade Tile

Prompt: Side-view arcade rooftop building facade tile, dark building body, sparse warm window rectangles, subtle vertical panels, clean vector style, opaque tile, designed to sit below a separate high-contrast rooftop cap.

Export target: `assets/sprites/rooftops/environment/building-facade-tile.svg`.

Acceptance: windows must not resemble coins.

### Rooftop Cap / Walkable Edge

Prompt: Arcade rooftop platform cap, concrete-stone surface with warm edge highlight, strong dark top outline, side-view collision surface, seamless horizontal tile, readable as walkable at small scale.

Export target: `assets/sprites/rooftops/environment/rooftop-cap.svg`.

Acceptance: strongest environmental edge contrast in the level.

## Platform And Traversal Props

### Fire Escape / Scaffold

Prompt: Side-view arcade fire escape platform attached to building side, metal frame with simple railings, transparent background, strong walkable top edge, readable as a small secondary platform rather than background decoration.

Export target: `assets/sprites/rooftops/entities/fire-escape.svg`.

Acceptance: must read as solid/usable at 30-60px widths.

### Clothesline

Prompt: Arcade clothesline spanning between buildings, taut rope with a few simple cloth shapes below it, transparent background, rideable line clearly separated from decorative wires, side-view platformer prop.

Export target: `assets/sprites/rooftops/obstacles/clothesline.svg`.

Acceptance: rope contact line is visible and not confused with background cable.

### Satellite Dish Bounce Pad

Prompt: Arcade rooftop satellite dish bounce pad, gray-blue dish tilted upward with springy base, dark outline, transparent background, clearly readable as bounceable platformer object.

Export target: `assets/sprites/rooftops/obstacles/satellite-dish.svg`.

Acceptance: dish bowl points the intended bounce direction.

## Enemies And Hazards

### Pigeon

Prompt: Stompable arcade rooftop pigeon enemy, side-view body, readable wings and beak, expressive eyes, dark outline, transparent background, small patrol enemy for platformer.

Export target: `assets/sprites/rooftops/obstacles/pigeon.svg`.

Acceptance: stompable top surface/body read is clear.

### Rat

Prompt: Fast arcade rooftop rat enemy, low side-view silhouette, pointed nose, visible tail, dark outline, transparent background, designed to dash across a platform.

Export target: `assets/sprites/rooftops/obstacles/rat.svg`.

Acceptance: smaller than pigeon but not lost against dark rooftops.

### Raccoon

Prompt: Arcade rooftop raccoon enemy, chunky body, mask markings, aggressive charge pose, dark outline, transparent background, readable wind-up/charge silhouette for platformer.

Export targets: `assets/sprites/rooftops/obstacles/raccoon-idle.svg`, `raccoon-charge.svg`.

Acceptance: charge state is visibly different from idle.

### AC Unit And Steam

Prompt: Arcade rooftop AC unit hazard, boxy metal shape, grille detail, dark outline, transparent background, readable as a solid blocker. Separate steam puff sprite, pale gray-white cloud burst, transparent background.

Export targets: `assets/sprites/rooftops/obstacles/ac-unit.svg`, `assets/sprites/rooftops/fx/steam-puff.svg`.

Acceptance: AC body reads solid; steam reads push/unsafe without resembling cloud scenery.

### Neon Sign

Prompt: Arcade rooftop neon sign hazard, magenta-red glowing sign panel with simple bolt icon but no readable text, side-mounted bracket, transparent background, include separate on and off variants.

Export targets: `assets/sprites/rooftops/obstacles/neon-sign-on.svg`, `neon-sign-off.svg`.

Acceptance: on/off state is obvious without relying only on animation timing.

## Collectibles And Power-Ups

### Coin

Prompt: Arcade rooftop coin collectible, golden disk with star or paw detail, bold outline, transparent background, distinct from warm building windows.

Export target: `assets/sprites/rooftops/collectibles/coin.svg`.

Acceptance: readable at pickup size and color-separated from facade lights.

### Triple Jump

Prompt: Arcade blue power-up icon for triple jump, circular badge with three upward chevrons or paw jumps, bold outline, transparent background.

Export target: `assets/sprites/rooftops/fx/triple-jump-powerup.svg`.

Acceptance: communicates extra jump, not speed.

### Glide

Prompt: Arcade green or teal glide power-up icon, circular badge with simple parachute/cape silhouette, bold outline, transparent background.

Export target: `assets/sprites/rooftops/fx/glide-powerup.svg`.

Acceptance: communicates slow fall/recovery.

### Shield

Prompt: Arcade purple shield power-up icon, circular badge with shield bubble, bold outline, transparent background.

Export target: `assets/sprites/rooftops/fx/shield-powerup.svg`.

Acceptance: not confused with neon hazard.

## Boss Or Finale States

### Pigeon King

Prompt: Large arcade rooftop Pigeon King boss, expressive oversized pigeon with crown-like feather tuft, dark outline, readable at boss scale, transparent background, consistent silhouette across states.

Required states:

- idle/swoop: wings spread, moving across arena
- landed/vulnerable: feet on rooftop, body low enough for stomp
- attack: feather projectile drop tell
- hit: stunned expression and feather burst
- defeat: flying away or sprawled defeated silhouette

Export targets live under `assets/sprites/rooftops/boss/`.

## Rejection Rules

- Reject skyline art with bright window density that looks collectible.
- Reject fire escapes or clotheslines that read as decoration instead of usable traversal.
- Reject enemies without clear top/body silhouettes for stomp judging.
- Reject neon sign states that differ only by subtle glow.
- Reject any sprite with fake transparency, checkerboards, or baked shadows that break alpha.
