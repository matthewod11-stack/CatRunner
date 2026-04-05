# City Heights (ROOFTOPS) — Full Level Design Spec

**Date:** 2026-04-05
**Level ID:** `ROOFTOPS`
**Genre:** Exploration platformer (Mario-style)
**Victory:** Reach the penthouse at 15,000px, defeat Pigeon King boss

---

## Overview

City Heights is a Mario-style exploration platformer where the player jumps across rooftops of a golden-hour cityscape, stomps enemies, navigates hazards, and reaches a penthouse rooftop where they face the Pigeon King boss. The level is broken into 3 escalating zones plus a boss arena.

**Design pillars:**
- Platforms are rooftops of actual buildings (no floating slabs)
- Each zone teaches a new mechanic, then tests it
- Enemies are stompable — aggressive play is rewarded
- Secondary platforms (fire escapes, scaffolding) create optional exploration paths
- Contrasts with Beach runner: full directional movement, not auto-scroll

---

## Zone Structure

| Zone | Distance | New Mechanic | Enemies | Hazards | Feel |
|------|----------|-------------|---------|---------|------|
| **1: Low Rooftops** | 0 – 4,000px | Core platforming | Pigeon | AC Unit | Tutorial. Wide buildings, small gaps. Learn to jump and stomp. |
| **2: Mid City** | 4,000 – 9,000px | Secondary platforms + new enemies | Pigeon, Rat | + Clothesline, Satellite Dish | Ramp up. Narrower buildings, taller height variance. Fire escapes as alternate routes. |
| **3: High Rise** | 9,000 – 14,000px | Rhythm hazards + raccoons | Pigeon, Rat, Raccoon | + Neon Sign | Full test. Tight gaps, charging raccoons, neon timing. All mechanics combined. |
| **Boss: Penthouse** | 14,000 – 15,000px | Pigeon King fight | Boss + mini pigeons | Arena AC units as cover | Locked camera. Stomp boss 3 times. Escalating aggression. |

**Zone transitions** are subtle — sky gradient shifts warmer, buildings get taller, parallax layer density increases. No hard cuts or loading screens.

---

## Building Generation Model

Buildings replace the current floating-platform system entirely. Each building is a full structure extending from the rooftop down past the camera bottom.

### Building Anatomy
- **Rooftop surface:** Top edge of the building. This is the collision body (Phaser static body). Only the rooftop has physics.
- **Facade:** Rectangle below the rooftop, rendered with procedural windows (random warm-tinted rectangles). Visual only, no collision.
- **Decorative props:** Water tanks, antennas, vents, pipes — randomly placed on rooftops. Visual only, no collision.
- **Secondary platforms:** Fire escapes and scaffolding attached to building sides. Small static bodies (20–35px wide). Optional alternate routes.

### Generation Parameters by Zone

| Parameter | Zone 1: Low Rooftops | Zone 2: Mid City | Zone 3: High Rise |
|-----------|---------------------|-----------------|------------------|
| Building width | 140–240px | 100–200px | 80–160px |
| Alley gap | 60–100px | 80–140px | 100–180px |
| Height step | -30 to 50px | -50 to 70px | -60 to 90px |
| Fire escapes | Rare | Moderate | Frequent |
| Coin density | High | Medium | Low (high value) |

### Key Rules
- Buildings extend to world bottom — no floating
- Only rooftop edge has a physics body
- Fire escapes / scaffolding are small static platforms attached to building sides
- Clotheslines span alleys between adjacent buildings — rideable surfaces
- Death zone is below the alley darkness — fall = lose a life, respawn on last rooftop
- Decorative props are randomized per building from a pool (water tank, antenna, vent, pipe)

---

## Enemies

Three enemy types, all managed by `EnemyManager`. All are stompable. Stomping gives +25 pts x multiplier and resets double jump.

### Pigeon (Zone 1+)
- Spawns on rooftops, patrols left/right within the building width
- Turns around at rooftop edges
- Stompable — player bounces up, pigeon dies with particle burst
- Side contact = damage to player
- Speed: 60px/s

### Rat (Zone 2+)
- Spawns at one edge of a rooftop, dashes across to the other side, then despawns
- Fast (200px/s), small hitbox
- Stompable but hard to time due to speed
- Triggered when player lands on the same rooftop (reactive spawn)
- Speed: 200px/s

### Raccoon (Zone 3+)
- Spawns on rooftops, idles until player is within ~150px
- Charges toward the player at high speed after a brief wind-up animation (the tell)
- Stompable during charge
- Side contact during charge = damage
- Does not fall off rooftop edges — turns around at ledge
- Speed: 180px/s (during charge)

### Shared Rules
- Max active enemies on screen: ~4
- Enemy density scales per zone
- No enemy + hazard on the same rooftop (readability rule)

---

## Hazards

Four hazard types managed by `HazardManager`.

### AC Unit (Zone 1+)
- Static box on rooftops (~30x25px), blocks path — must jump over
- **Steam variant** (Zone 2+): blows horizontal steam puff every 2s, pushes player sideways. Not damaging, but can push toward edges.

### Clothesline (Zone 2+)
- Rope spanning an alley between two adjacent buildings
- Player lands on it and auto-rides across the gap (~100px/s toward far building). No input needed — landing triggers the ride.
- Player can jump off the clothesline at any time to reach coins above or bail out early
- Coins float above as reward for using them
- Slight vertical wobble while riding (cosmetic)
- Optional path — can always jump the gap normally

### Satellite Dish (Zone 2+)
- Placed on rooftops, acts as a bounce pad
- Landing on it launches player ~1.8x normal jump height
- Used to reach elevated fire escapes or bonus coin clusters
- Visual: dish tilts on impact, spring-back animation

### Neon Sign (Zone 3+)
- Attached to building sides, extends over rooftop edge
- Alternates ON (electrified, glowing, damages) / OFF (safe, dim) on a 1.5s cycle
- Player must time movement past it
- Placed at rooftop edges near gaps — forces timed jumps

### Placement Rule
No rooftop gets both an enemy AND a hazard simultaneously.

---

## Powerups

Three platformer-specific powerups managed by `PowerupManager`. Spawn as glowing pickups on rooftops.

### Triple Jump (8 second duration)
- Grants a 3rd jump (normally max 2)
- Visual: faint trail particles on each jump, counter shows "3" near player
- Use: reach elevated platforms and bonus coin clusters

### Glide (10 second duration)
- Holding jump while falling reduces gravity to ~30%
- Visual: subtle cape/parachute silhouette effect, drift particles
- Use: safely cross wide gaps, recover from missed jumps, reach distant fire escapes

### Shield (single use — absorbs one hit)
- Blocks one instance of contact damage (enemy or neon sign)
- Visual: faint bubble/glow around player, pops on absorb with particle burst
- Does NOT prevent fall death

### Spawn Rules
- One powerup guaranteed per zone, placed on a rooftop roughly at the zone midpoint
- ~10% chance of bonus powerup on fire escapes / scaffolding (rewards exploration)
- Picking up a new powerup replaces the active one (shield exception — single-use, not timed)

---

## Pigeon King Boss Fight

### Arena
- Wide penthouse rooftop at 14,000px (~2-3 screen widths)
- Camera locks — no scrolling during boss
- Walls on both sides — no fall death in arena
- Two AC units mid-roof provide cover from feather projectiles
- Penthouse structures on left and right edges (visual framing)

### Core Loop
1. Pigeon King swoops overhead, dropping feather projectiles (dodge phase)
2. Lands on the rooftop briefly (vulnerability window)
3. Player stomps it — boss screeches, takes off
4. Repeat with escalating aggression

### Three Phases (1 stomp each = 3 total to win)

**Phase 1: Cautious**
- Slow swoops left-to-right, drops 2 feather projectiles per pass
- After 2 swoops, lands for 3 seconds
- Stomp window is generous

**Phase 2: Aggressive**
- Faster swoops, 3 feathers per pass
- Summons 2 mini pigeons that patrol the rooftop
- Lands for 2 seconds (shorter window)
- Mini pigeons despawn after stomp

**Phase 3: Enraged**
- Rapid swoops, 4 feathers per pass
- Summons 3 mini pigeons
- Occasional dive bomb (fast vertical drop at player position)
- Lands for 1.5 seconds (tiny window)
- Final stomp triggers victory — feather explosion, Pigeon King flies away defeated

### Boss Rules
- Feather projectiles fall from above at angle, despawn on rooftop contact, damage player on contact
- Mini pigeons are stompable (same as regular pigeons)
- Health displayed as 3 pips above boss — each stomp removes one with flash + screech
- Player lives carry over from traversal. Death during boss = respawn in arena, boss keeps current HP

---

## Visual Design

### Golden Hour Sunset Theme
- **Sky gradient:** Warm orange (#ff6b35) → golden (#ffd700) → deep purple (#1a1a3e) at bottom
- **Buildings:** Dark silhouettes (#1a1a2e range) with warm-tinted window rectangles
- **Rooftop surface:** Concrete/stone tone (#8b7355 with #a89070 edge highlight)
- **Zone progression:** Sky shifts slightly warmer/more golden as player climbs higher

### Parallax Layers
1. **Far background (0.1x scroll):** Distant city skyline silhouettes, faint
2. **Mid background (0.3x scroll):** Closer buildings with window detail
3. **Gameplay layer (1x scroll):** Active buildings the player stands on
4. **Foreground (1.2x scroll):** Occasional close building edge or antenna tip passing in front

### Building Visual Details
- Window grid: random warm-tinted rectangles (#ffcc44 at varying alpha)
- Some windows unlit (darker) for variety
- Building colors vary from a pool of dark tones
- Decorative props rendered as simple shapes (water tanks = cylinders, antennas = thin lines with crossbar)

### Depth Constants
```
BG_FAR:     0    // distant skyline
BG_MID:     1    // mid parallax buildings
PLATFORMS:  10   // building rooftops + secondary platforms
HAZARDS:    12   // AC units, neon signs, etc.
COINS:      15   // collectibles
ENEMIES:    18   // pigeons, rats, raccoons
PLAYER:     20   // cat
EFFECTS:    30   // particles, floating scores
HUD:        50   // in-scene text
```

---

## File Architecture

### New Files
```
scenes/platformer/
  BuildingGenerator.ts     # Building spawning, rooftop collision, facades, props, fire escapes
  EnemyManager.ts          # Pigeon/rat/raccoon spawn, patrol, stomp logic
  HazardManager.ts         # AC unit, clothesline, satellite dish, neon sign
  PigeonKingBoss.ts        # Boss arena, 3-phase state machine, attacks, victory
  PowerupManager.ts        # Triple jump, glide, shield — spawn, effects, duration
  CityBackground.ts        # Parallax sky + background building silhouettes
```

### Modified Files
```
scenes/PlatformerScene.ts  # Rewrite: orchestrator calling managers
types.ts                   # Extend PlatformerLevelConfig with zones, enemies, hazards, boss
levels/rooftops.ts         # Full config with all zone parameters
```

### Manager Contract
Each manager follows the same interface pattern:
```ts
create(scene: Phaser.Scene, config: PlatformerLevelConfig): void
update(time: number, delta: number): void
destroy(): void
```

The scene calls `create()` in its `create()`, `update()` in its `update()`, `destroy()` on shutdown. Managers own their own Phaser groups and sprites.

### Cross-Manager Communication
Goes through the scene. Example: `EnemyManager` asks the scene for building rooftop positions (sourced from `BuildingGenerator`) to know where to place enemies.

---

## SFX Integration

Uses existing `PhaserAudio` + `sfxService` infrastructure. No custom music — SFX only.

| Action | SFX Key | Notes |
|--------|---------|-------|
| Jump | `jump` | Each jump including double/triple |
| Land | `land` | Player touches rooftop after airborne |
| Stomp enemy | `stomp` | Satisfying squash |
| Coin collect | `coin` | Existing |
| Powerup collect | `powerup` | Existing |
| Player hurt | `hurt` | Contact damage |
| Player death | `death` | Fall into alley |
| Neon buzz | `electric` | Ambient when neon ON |
| Satellite bounce | `spring` | Bounce pad |
| Clothesline ride | `slide` | While riding |
| Boss screech | `boss_hit` | Each stomp on Pigeon King |
| Boss feather | `projectile` | Feather fire |
| Victory | `victory` | Boss defeated |

Sounds without existing file-backed SFX get procedural oscillator fallbacks. File-backed SFX can be added as a polish pass.

---

## Scoring & Stars

**Score sources:**
- Coins: 10 pts x multiplier
- Enemy stomps: 25 pts x multiplier
- Distance: 0.1 pts per pixel traveled

**Multiplier:** Increases by 1 every 5-coin streak (max 5x). Resets on damage.

**Star thresholds** (score-only, consistent with Beach level):
- 1 star: 500
- 2 stars: 1,500
- 3 stars: 3,500

(Calibrated for ~15,000px level with moderate coin collection and some enemy stomps.)

---

## Config Shape

The existing `PlatformerLevelConfig` in `types.ts` needs to be extended:

```ts
interface PlatformerLevelConfig extends CampaignLevelMeta {
  genre: 'platformer';
  theme: PlatformerThemeConfig;       // extended with parallax, building colors
  generation: PlatformGenerationConfig; // per-zone overrides
  zones: ZoneConfig[];                // zone boundaries + enemy/hazard mix
  victoryDistance: number;
  playerConfig: { ... };              // unchanged
  startLives: number;
  boss: PlatformerBossConfig;         // boss arena + phase tuning
  powerups: PlatformerPowerupConfig;  // spawn rates, durations
}

interface ZoneConfig {
  startDistance: number;
  endDistance: number;
  generation: Partial<PlatformGenerationConfig>;  // overrides base
  enemies: { type: EnemyType; density: number }[];
  hazards: { type: HazardType; frequency: number }[];
  fireEscapeChance: number;
  coinDensity: number;
}

interface PlatformerBossConfig {
  arenaWidth: number;
  phases: BossPhaseConfig[];
}

interface BossPhaseConfig {
  swoopSpeed: number;
  feathersPerPass: number;
  swoopsBeforeLand: number;
  landDuration: number;  // seconds
  miniPigeonCount: number;
  hasDiveBomb: boolean;
}
```

---

## Out of Scope

These are explicitly deferred:
- Custom music / procedural audio for City Heights
- Additional boss attacks beyond swoop/feather/divebomb/minipigeon
- Moving platforms (elevators, cranes) — fire escapes and clotheslines cover the "alternate path" need
- Water tower / crumbling ledge hazards (cut during design)
- Swooping hawk enemy (cut during design)
