# Level 1 Beach Prompt Pack

Phase 1 source-generation notes for the Beach world-art pack. The current implementation uses deterministic SVG authoring in `scripts/generate-beach-art-pack.mjs`; these prompts preserve the direction if assets are later regenerated with an image model or external art tool.

## Global Prompt Invariants

Use these constraints for every asset family:

- bright arcade beach runner game asset
- chunky clean vector style
- dark consistent outline
- warm sand and cyan water palette
- transparent background for sprites, pickups, hazards, boss states, entities, and FX
- opaque full-bleed art only for background/tile layers
- no text labels, no poster composition, no UI mockup
- readable at small gameplay scale
- side-view runner camera

## Environment

### Sky Treatment

Bright arcade beach runner full-canvas sky background, cyan-to-warm-sunrise gradient, simple horizon bands for ocean foam and sand, clean vector shapes, no characters, no text, opaque full-bleed background, readable behind HUD.

Export target: `assets/sprites/beach/environment/sky.svg`.

### Sun

Simple smiling-free arcade beach sun icon, golden yellow disk, orange rays, chunky dark outline, clean vector asset, transparent background, readable at 80px display size.

Export target: `assets/sprites/beach/environment/sun.svg`.

### Clouds

Soft rounded arcade beach cloud sprite, white or pale blue fill, chunky dark outline, simple vector shape, transparent background, low visual priority for parallax.

Export targets: `cloud-1.svg`, `cloud-2.svg`.

### Ocean Tile

Side-view arcade ocean tile, cyan water with darker lower band and white wave strokes, seamless horizontal feel, opaque full-bleed tile, no horizon clutter.

Export target: `ocean-tile.svg`.

### Foam Strip

Arcade waterline foam strip, white and pale cyan waves, horizontal seamless feel, opaque full-width strip, should mark boundary between ocean and sand.

Export target: `waterline-foam.svg`.

### Sand Tile

Warm arcade sand ground tile, subtle wave contours and sparse pebbles, opaque full-bleed tile, not visually busy, readable as the runner play lane.

Export target: `sand-tile.svg`.

## Obstacles And Collectibles

### Crab Variants

Cute but hazardous arcade crab, red or orange shell, raised claws, big readable eyes, chunky dark outline, side-view runner obstacle, transparent background, clear ground contact shadow.

Export targets: `crab-1.svg`, `crab-2.svg`.

### Seagull Variants

Arcade seagull hazard, wings spread, side-view readable body and beak, white or pale blue wing variation, chunky dark outline, transparent background, readable while swooping.

Export targets: `seagull-1.svg`, `seagull-2.svg`.

### Beachball

Round arcade beachball hazard, red yellow blue panels, curved seams that wrap around the sphere, bold outline, bright highlight, subtle shaded edge, transparent background, readable as a bouncy obstacle rather than a flat target.

Export target: `beachball.svg`.

### Shell

Arcade shell collectible ammo, cream shell with orange grooves, bold outline, transparent background, distinct from coin and readable at pickup size.

Export target: `shell.svg`.

### Sandcastle

Arcade sandcastle slow obstacle, warm sand blocks, towers, crenellations, doorway, bold outline, transparent background, clear ground baseline.

Export target: `sandcastle.svg`.

### Palm Tree

Arcade palm tree hazard, curved trunk, green fronds, coconuts, chunky outline, transparent background, clear vertical silhouette and ground contact.

Export target: `palm-tree.svg`.

### Tidepool

Arcade tidepool slow obstacle, shallow blue oval with highlights and sand rim, bold outline, transparent background, low ground profile.

Export target: `tidepool.svg`.

## Projectiles And Power-Ups

### Sand Projectile

Arcade clump of thrown sand, warm brown/gold irregular shape, impact tail, chunky outline, transparent background, distinct from coin and shell.

Export target: `sand-projectile.svg`.

### Speed Power-Up

Arcade blue circular power-up with white lightning icon, bold outline, transparent background, readable at 60px.

Export target: `speed-powerup.svg`.

### Magnet Power-Up

Arcade purple circular power-up with white horseshoe magnet icon, bold outline, transparent background, readable at 60px.

Export target: `magnet-powerup.svg`.

### Super-Size Power-Up

Arcade green circular power-up with white star icon, bold outline, transparent background, readable at 60px.

Export target: `super-size-powerup.svg`.

## Background Entities

Background entities should use the same style but lower detail density. They are runtime-rendered below gameplay priority and should not look like hazards.

- Boat: orange sailboat, readable silhouette.
- Sinking boat: same family with damage/tilt marks.
- Airplane: white small plane, blue windows.
- Airplane-fire: same plane with readable flame trail.
- Surfer: small surfer on board, secondary silhouette.
- Jetski: red jetski with rider, secondary silhouette.

Export targets live under `assets/sprites/beach/entities/`.

## Boss States

### Sand Monster

Large arcade Sand Monster boss, higher-fidelity featured enemy treatment than small props, warm sand body with subtle grain, dark outline, expressive eyes and mouth, readable at 320px display size, transparent background, consistent silhouette across states.

Required states:

- idle: neutral looming face
- attack: aggressive mouth/arm gesture
- hit: startled red impact marks
- defeat: slumped/buried read

Export targets live under `assets/sprites/beach/boss/`.
