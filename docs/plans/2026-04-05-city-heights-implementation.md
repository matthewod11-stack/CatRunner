# City Heights (ROOFTOPS) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Transform the ROOFTOPS platformer skeleton into a full-fledged 3-zone level with building-based platforms, 3 enemy types, 4 hazards, 3 powerups, Pigeon King boss fight, golden hour visuals, and SFX — establishing a repeatable build pattern for remaining campaign levels.

**Architecture:** Modular scene + managers. PlatformerScene orchestrates 6 manager modules (BuildingGenerator, EnemyManager, HazardManager, PowerupManager, PigeonKingBoss, CityBackground), each owning its own Phaser groups and following a shared `create/update/destroy` contract. Pure logic is extracted for testability.

**Tech Stack:** Phaser 3 (Arcade Physics), React 19, TypeScript, Vitest

**Spec:** `docs/superpowers/specs/2026-04-05-city-heights-platformer-design.md`

---

## Repeatable Level Build Pattern

This plan establishes a 10-task template for building any campaign level from skeleton to full:

| Phase | Generic Task | City Heights Specific |
|-------|-------------|----------------------|
| 1 | Type extensions + config | Zone configs, enemy/hazard/boss/powerup types |
| 2 | Terrain system | BuildingGenerator (buildings as platforms) |
| 3 | Background/visual system | CityBackground (golden hour parallax) |
| 4 | Enemy system | EnemyManager (pigeon, rat, raccoon) |
| 5 | Hazard system | HazardManager (AC unit, clothesline, satellite dish, neon sign) |
| 6 | Powerup system | PowerupManager (triple jump, glide, shield) |
| 7 | Boss system | PigeonKingBoss (3-phase stomp fight) |
| 8 | Scene rewrite (orchestrator) | PlatformerScene calling all managers |
| 9 | SFX integration | PhaserAudio hookup |
| 10 | Integration + QA | Full playthrough, tuning pass |

Future levels substitute genre-specific implementations into the same slots.

---

## File Map

### New Files (create)
```
scenes/platformer/BuildingGenerator.ts    — building spawning, rooftops, facades, props, fire escapes
scenes/platformer/EnemyManager.ts         — pigeon/rat/raccoon spawn, patrol, stomp
scenes/platformer/HazardManager.ts        — AC unit, clothesline, satellite dish, neon sign
scenes/platformer/PowerupManager.ts       — triple jump, glide, shield
scenes/platformer/PigeonKingBoss.ts       — boss arena, 3-phase state machine
scenes/platformer/CityBackground.ts       — parallax sky + building silhouettes
scenes/platformer/types.ts                — platformer-specific enums, interfaces, constants
scenes/platformer/generation.ts           — pure zone-parameter resolution logic (testable)
scenes/platformer/generation.test.ts      — tests for generation logic
scenes/platformer/bossPhases.ts           — pure boss phase state machine (testable)
scenes/platformer/bossPhases.test.ts      — tests for boss state machine
```

### Modified Files
```
types.ts                   — extend PlatformerLevelConfig with zones, enemies, hazards, boss, powerups
levels/rooftops.ts         — full level config with all zone parameters
scenes/PlatformerScene.ts  — rewrite as orchestrator calling managers
```

### Dependencies Between Tasks
```
Task 1 (types + config) ──► blocks all other tasks
Task 2 (BuildingGenerator) ──► blocks Task 8 (scene rewrite)
Task 3 (CityBackground) ──► blocks Task 8
Task 4 (EnemyManager) ──► blocks Task 8
Task 5 (HazardManager) ──► blocks Task 8
Task 6 (PowerupManager) ──► blocks Task 8
Task 7 (PigeonKingBoss) ──► blocks Task 8
Task 8 (scene rewrite) ──► blocks Task 9, Task 10
Task 9 (SFX) ──► blocks Task 10
Tasks 2-7 can be built in parallel after Task 1
```

---

### Task 1: Type Extensions + Level Config

**Files:**
- Modify: `types.ts` (add platformer-specific types near existing `PlatformerLevelConfig` ~line 427)
- Create: `scenes/platformer/types.ts` (runtime enums and constants)
- Modify: `levels/rooftops.ts` (full config)
- Create: `scenes/platformer/generation.ts` (pure zone-parameter resolution)
- Create: `scenes/platformer/generation.test.ts`

- [ ] **Step 1: Create platformer runtime types**

Create `scenes/platformer/types.ts`:

```ts
/** Platformer-specific runtime types — enums, constants, interfaces for managers. */

export type PlatformerEnemyType = 'PIGEON' | 'RAT' | 'RACCOON';
export type PlatformerHazardType = 'AC_UNIT' | 'CLOTHESLINE' | 'SATELLITE_DISH' | 'NEON_SIGN';
export type PlatformerPowerupType = 'TRIPLE_JUMP' | 'GLIDE' | 'SHIELD';

export interface BuildingData {
  x: number;
  width: number;
  height: number;
  rooftopY: number;
  zoneIndex: number;
}

export interface FireEscapeData {
  x: number;
  y: number;
  width: number;
  buildingIndex: number;
  side: 'left' | 'right';
}

export interface EnemySpawn {
  type: PlatformerEnemyType;
  buildingIndex: number;
  x: number;
  rooftopY: number;
  rooftopWidth: number;
}

export interface HazardSpawn {
  type: PlatformerHazardType;
  x: number;
  y: number;
  config?: Record<string, unknown>;
}

export type BossPhaseId = 1 | 2 | 3;

export interface BossPhaseState {
  phase: BossPhaseId;
  hp: number;
  swoopCount: number;
  isLanded: boolean;
  landTimer: number;
  miniPigeonCount: number;
}

/** Depth layer constants for platformer scene */
export const DEPTH = {
  BG_FAR: 0,
  BG_MID: 1,
  BUILDINGS: 5,
  PLATFORMS: 10,
  HAZARDS: 12,
  COINS: 15,
  POWERUPS: 16,
  ENEMIES: 18,
  PLAYER: 20,
  EFFECTS: 30,
  HUD: 50,
} as const;

/** Manager contract — all managers implement this */
export interface SceneManager {
  create(): void;
  update(time: number, delta: number): void;
  destroy(): void;
}
```

- [ ] **Step 2: Extend PlatformerLevelConfig in types.ts**

In `types.ts`, add these interfaces near the existing `PlatformerLevelConfig` (~line 427). Add imports for the new enums at the top of the types block:

```ts
// Add after PlatformGenerationConfig (around line 406):

export interface ZoneGenerationOverrides {
  platformWidthRange?: [number, number];
  gapRange?: [number, number];
  heightStepRange?: [number, number];
  gapScaling?: number;
}

export interface ZoneEnemyConfig {
  type: 'PIGEON' | 'RAT' | 'RACCOON';
  /** Average number of this enemy per 1000px of zone distance */
  density: number;
}

export interface ZoneHazardConfig {
  type: 'AC_UNIT' | 'CLOTHESLINE' | 'SATELLITE_DISH' | 'NEON_SIGN';
  /** Average number per 1000px */
  frequency: number;
}

export interface ZoneConfig {
  startDistance: number;
  endDistance: number;
  generation: ZoneGenerationOverrides;
  enemies: ZoneEnemyConfig[];
  hazards: ZoneHazardConfig[];
  fireEscapeChance: number;
  coinDensity: number;
}

export interface PlatformerBossPhaseConfig {
  swoopSpeed: number;
  feathersPerPass: number;
  swoopsBeforeLand: number;
  landDuration: number;
  miniPigeonCount: number;
  hasDiveBomb: boolean;
}

export interface PlatformerBossConfig {
  arenaWidth: number;
  phases: [PlatformerBossPhaseConfig, PlatformerBossPhaseConfig, PlatformerBossPhaseConfig];
}

export interface PlatformerPowerupConfig {
  tripleJumpDuration: number;
  glideDuration: number;
  glideGravityMultiplier: number;
  spawnPerZone: number;
  fireEscapeBonusChance: number;
}
```

Then update the existing `PlatformerLevelConfig` interface:

```ts
export interface PlatformerLevelConfig extends CampaignLevelMeta {
  genre: 'platformer';
  theme: PlatformerThemeConfig;
  generation: PlatformGenerationConfig;
  zones: ZoneConfig[];
  victoryDistance: number;
  playerConfig: {
    moveSpeed: number;
    jumpForce: number;
    gravity: number;
    maxJumps: number;
  };
  startLives: number;
  boss: PlatformerBossConfig;
  powerups: PlatformerPowerupConfig;
}
```

Also extend `PlatformerThemeConfig` with parallax colors:

```ts
export interface PlatformerThemeConfig {
  skyGradient: [string, string];
  skyGradientZone3?: [string, string]; // warmer sky for high rise zone
  platformColor: string;
  platformEdgeColor: string;
  buildingColors: string[];
  farSkylineColor: string;
  midSkylineColor: string;
  particleColors: {
    dust: string;
    impact: string;
    coinCollect: string;
  };
}
```

- [ ] **Step 3: Write zone resolution tests**

Create `scenes/platformer/generation.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { resolveZoneParams, getZoneIndex } from './generation';
import type { PlatformGenerationConfig, ZoneConfig } from '../../types';

const BASE_GEN: PlatformGenerationConfig = {
  platformWidthRange: [120, 280],
  gapRange: [80, 160],
  heightStepRange: [-60, 80],
  gapScaling: 0.008,
  startY: 500,
  deathY: 800,
};

const ZONES: ZoneConfig[] = [
  {
    startDistance: 0, endDistance: 4000,
    generation: { platformWidthRange: [140, 240], gapRange: [60, 100], heightStepRange: [-30, 50] },
    enemies: [{ type: 'PIGEON', density: 2 }],
    hazards: [{ type: 'AC_UNIT', frequency: 1.5 }],
    fireEscapeChance: 0.1, coinDensity: 0.7,
  },
  {
    startDistance: 4000, endDistance: 9000,
    generation: { platformWidthRange: [100, 200], gapRange: [80, 140] },
    enemies: [{ type: 'PIGEON', density: 1.5 }, { type: 'RAT', density: 1 }],
    hazards: [{ type: 'AC_UNIT', frequency: 1 }, { type: 'CLOTHESLINE', frequency: 0.5 }, { type: 'SATELLITE_DISH', frequency: 0.5 }],
    fireEscapeChance: 0.25, coinDensity: 0.5,
  },
  {
    startDistance: 9000, endDistance: 14000,
    generation: { platformWidthRange: [80, 160], gapRange: [100, 180], heightStepRange: [-60, 90] },
    enemies: [{ type: 'PIGEON', density: 1 }, { type: 'RAT', density: 1 }, { type: 'RACCOON', density: 0.8 }],
    hazards: [{ type: 'AC_UNIT', frequency: 0.8 }, { type: 'NEON_SIGN', frequency: 1 }],
    fireEscapeChance: 0.4, coinDensity: 0.3,
  },
];

describe('getZoneIndex', () => {
  it('returns 0 for distances in zone 1', () => {
    expect(getZoneIndex(ZONES, 0)).toBe(0);
    expect(getZoneIndex(ZONES, 2000)).toBe(0);
    expect(getZoneIndex(ZONES, 3999)).toBe(0);
  });

  it('returns 1 for distances in zone 2', () => {
    expect(getZoneIndex(ZONES, 4000)).toBe(1);
    expect(getZoneIndex(ZONES, 7000)).toBe(1);
  });

  it('returns 2 for distances in zone 3', () => {
    expect(getZoneIndex(ZONES, 9000)).toBe(2);
    expect(getZoneIndex(ZONES, 13000)).toBe(2);
  });

  it('clamps to last zone for distances past all zones', () => {
    expect(getZoneIndex(ZONES, 15000)).toBe(2);
  });
});

describe('resolveZoneParams', () => {
  it('merges zone overrides onto base generation config', () => {
    const resolved = resolveZoneParams(BASE_GEN, ZONES[0]);
    expect(resolved.platformWidthRange).toEqual([140, 240]);
    expect(resolved.gapRange).toEqual([60, 100]);
    expect(resolved.heightStepRange).toEqual([-30, 50]);
    // non-overridden fields fall through from base
    expect(resolved.gapScaling).toBe(0.008);
    expect(resolved.startY).toBe(500);
    expect(resolved.deathY).toBe(800);
  });

  it('uses base values when zone has no override for a field', () => {
    const resolved = resolveZoneParams(BASE_GEN, ZONES[1]);
    // zone 2 overrides platformWidthRange and gapRange but not heightStepRange
    expect(resolved.heightStepRange).toEqual([-60, 80]);
  });
});
```

- [ ] **Step 4: Run tests to verify they fail**

Run: `npm run test:run -- scenes/platformer/generation.test.ts`
Expected: FAIL — module `./generation` does not exist

- [ ] **Step 5: Implement generation logic**

Create `scenes/platformer/generation.ts`:

```ts
import type { PlatformGenerationConfig, ZoneConfig } from '../../types';

/**
 * Determine which zone index a distance falls in.
 * Clamps to the last zone for distances beyond all zones.
 */
export function getZoneIndex(zones: ZoneConfig[], distance: number): number {
  for (let i = zones.length - 1; i >= 0; i--) {
    if (distance >= zones[i].startDistance) return i;
  }
  return 0;
}

/**
 * Merge zone-specific generation overrides onto the base config.
 * Zone overrides are partial — unset fields fall through from base.
 */
export function resolveZoneParams(
  base: PlatformGenerationConfig,
  zone: ZoneConfig,
): PlatformGenerationConfig {
  return {
    ...base,
    ...zone.generation,
  };
}
```

- [ ] **Step 6: Run tests to verify they pass**

Run: `npm run test:run -- scenes/platformer/generation.test.ts`
Expected: All 6 tests PASS

- [ ] **Step 7: Update rooftops.ts with full config**

Replace `levels/rooftops.ts` with the full level config:

```ts
import type { PlatformerLevelConfig } from '../types';

export const ROOFTOPS_LEVEL_CONFIG: PlatformerLevelConfig = {
  id: 'ROOFTOPS',
  name: 'City Heights',
  genre: 'platformer',
  description: 'Jump across rooftops and dodge pigeons above the city!',
  catPose: 'platformer',
  victoryCondition: { type: 'goal', description: 'Reach the penthouse' },
  starThresholds: [500, 1500, 3500],

  theme: {
    skyGradient: ['#ff6b35', '#1a1a3e'],
    skyGradientZone3: ['#e85d26', '#1a1a3e'],
    platformColor: '#8b7355',
    platformEdgeColor: '#a89070',
    buildingColors: ['#1a1a2e', '#151528', '#1e1e35', '#191930', '#252540'],
    farSkylineColor: '#0d0d2b',
    midSkylineColor: '#1a1a3e',
    particleColors: {
      dust: '#8888aa',
      impact: '#ff6644',
      coinCollect: '#ffdd44',
    },
  },

  generation: {
    platformWidthRange: [120, 280],
    gapRange: [80, 160],
    heightStepRange: [-60, 80],
    gapScaling: 0.008,
    startY: 500,
    deathY: 800,
  },

  zones: [
    {
      startDistance: 0,
      endDistance: 4000,
      generation: {
        platformWidthRange: [140, 240],
        gapRange: [60, 100],
        heightStepRange: [-30, 50],
      },
      enemies: [{ type: 'PIGEON', density: 2 }],
      hazards: [{ type: 'AC_UNIT', frequency: 1.5 }],
      fireEscapeChance: 0.1,
      coinDensity: 0.7,
    },
    {
      startDistance: 4000,
      endDistance: 9000,
      generation: {
        platformWidthRange: [100, 200],
        gapRange: [80, 140],
        heightStepRange: [-50, 70],
      },
      enemies: [
        { type: 'PIGEON', density: 1.5 },
        { type: 'RAT', density: 1 },
      ],
      hazards: [
        { type: 'AC_UNIT', frequency: 1 },
        { type: 'CLOTHESLINE', frequency: 0.5 },
        { type: 'SATELLITE_DISH', frequency: 0.5 },
      ],
      fireEscapeChance: 0.25,
      coinDensity: 0.5,
    },
    {
      startDistance: 9000,
      endDistance: 14000,
      generation: {
        platformWidthRange: [80, 160],
        gapRange: [100, 180],
        heightStepRange: [-60, 90],
      },
      enemies: [
        { type: 'PIGEON', density: 1 },
        { type: 'RAT', density: 1 },
        { type: 'RACCOON', density: 0.8 },
      ],
      hazards: [
        { type: 'AC_UNIT', frequency: 0.8 },
        { type: 'NEON_SIGN', frequency: 1 },
      ],
      fireEscapeChance: 0.4,
      coinDensity: 0.3,
    },
  ],

  victoryDistance: 15_000,

  playerConfig: {
    moveSpeed: 250,
    jumpForce: 480,
    gravity: 1000,
    maxJumps: 2,
  },

  startLives: 3,

  boss: {
    arenaWidth: 1200,
    phases: [
      { swoopSpeed: 200, feathersPerPass: 2, swoopsBeforeLand: 2, landDuration: 3, miniPigeonCount: 0, hasDiveBomb: false },
      { swoopSpeed: 280, feathersPerPass: 3, swoopsBeforeLand: 2, landDuration: 2, miniPigeonCount: 2, hasDiveBomb: false },
      { swoopSpeed: 350, feathersPerPass: 4, swoopsBeforeLand: 3, landDuration: 1.5, miniPigeonCount: 3, hasDiveBomb: true },
    ],
  },

  powerups: {
    tripleJumpDuration: 8000,
    glideDuration: 10000,
    glideGravityMultiplier: 0.3,
    spawnPerZone: 1,
    fireEscapeBonusChance: 0.1,
  },
};
```

- [ ] **Step 8: Verify build compiles**

Run: `npx tsc --noEmit`
Expected: No errors (types are consistent with new config shape)

- [ ] **Step 9: Commit**

```bash
git add scenes/platformer/types.ts scenes/platformer/generation.ts scenes/platformer/generation.test.ts types.ts levels/rooftops.ts
git commit -m "feat(rooftops): add platformer types, zone config, and generation logic"
```

---

### Task 2: BuildingGenerator

**Files:**
- Create: `scenes/platformer/BuildingGenerator.ts`

This replaces the floating-platform generator. Buildings extend from rooftop to world bottom. Rooftop is the collision surface. Facades have procedural windows. Decorative props spawn on rooftops. Fire escapes are secondary platforms.

- [ ] **Step 1: Create BuildingGenerator**

Create `scenes/platformer/BuildingGenerator.ts`:

```ts
import Phaser from 'phaser';
import type { PlatformerLevelConfig, PlatformGenerationConfig } from '../../types';
import { getZoneIndex, resolveZoneParams } from './generation';
import type { BuildingData, FireEscapeData, SceneManager } from './types';
import { DEPTH } from './types';

const ROOFTOP_HEIGHT = 8;
const PLATFORM_BUFFER = 600;
const CLEANUP_BUFFER = 400;
const FIRE_ESCAPE_WIDTH = 28;
const FIRE_ESCAPE_HEIGHT = 6;

/** Decorative props randomly placed on rooftops (visual only) */
const PROP_POOL = ['waterTank', 'antenna', 'vent', 'pipe'] as const;

export class BuildingGenerator implements SceneManager {
  private scene: Phaser.Scene;
  private config: PlatformerLevelConfig;

  /** Static group for rooftop collision surfaces */
  private rooftops!: Phaser.Physics.Arcade.StaticGroup;
  /** Static group for fire escape / scaffolding platforms */
  private secondaryPlatforms!: Phaser.Physics.Arcade.StaticGroup;
  /** Graphics layer for building facades */
  private facadeGraphics!: Phaser.GameObjects.Graphics;

  /** All generated buildings, for lookup by other managers */
  private buildings: BuildingData[] = [];
  private fireEscapes: FireEscapeData[] = [];

  /** Coin collectibles on rooftops */
  private coins!: Phaser.Physics.Arcade.StaticGroup;

  private generatedUpToX = 0;
  private lastRooftopY = 0;
  private startX = 200;

  constructor(scene: Phaser.Scene, config: PlatformerLevelConfig) {
    this.scene = scene;
    this.config = config;
  }

  create(): void {
    this.rooftops = this.scene.physics.add.staticGroup();
    this.secondaryPlatforms = this.scene.physics.add.staticGroup();
    this.coins = this.scene.physics.add.staticGroup();
    this.facadeGraphics = this.scene.add.graphics().setDepth(DEPTH.BUILDINGS);

    this.lastRooftopY = this.config.generation.startY;

    // Starting building — wide and safe
    this.createBuilding(100, 300, this.config.generation.startY, 0);
    this.generatedUpToX = 400;
  }

  update(_time: number, _delta: number): void {
    const cam = this.scene.cameras.main;
    const targetX = cam.scrollX + this.scene.scale.width + PLATFORM_BUFFER;
    this.generateUpTo(targetX);
    this.cleanupBehind(cam.scrollX - CLEANUP_BUFFER);
    this.drawFacades();
  }

  destroy(): void {
    this.rooftops.destroy(true);
    this.secondaryPlatforms.destroy(true);
    this.coins.destroy(true);
    this.facadeGraphics.destroy();
    this.buildings = [];
    this.fireEscapes = [];
  }

  /** Get the rooftop collision group — used by scene for player collider */
  getRooftops(): Phaser.Physics.Arcade.StaticGroup {
    return this.rooftops;
  }

  /** Get secondary platform collision group */
  getSecondaryPlatforms(): Phaser.Physics.Arcade.StaticGroup {
    return this.secondaryPlatforms;
  }

  /** Get building data array — used by enemy/hazard managers for placement */
  getBuildings(): readonly BuildingData[] {
    return this.buildings;
  }

  getFireEscapes(): readonly FireEscapeData[] {
    return this.fireEscapes;
  }

  getCoinGroup(): Phaser.Physics.Arcade.StaticGroup {
    return this.coins;
  }

  /** Find the building the player is standing on (or nearest behind) */
  findNearestBuildingBehind(playerX: number): BuildingData | null {
    let best: BuildingData | null = null;
    for (const b of this.buildings) {
      if (b.x <= playerX + 50) best = b;
    }
    return best;
  }

  // ── Generation ────────────────────────────────────────────────

  private generateUpTo(targetX: number): void {
    while (this.generatedUpToX < targetX) {
      const distance = this.generatedUpToX - this.startX;
      const zoneIdx = getZoneIndex(this.config.zones, distance);
      const zone = this.config.zones[zoneIdx];
      const params = resolveZoneParams(this.config.generation, zone);

      // Gap (alley width)
      const [gapMin, gapMax] = params.gapRange;
      const scaledGapMin = gapMin + distance * params.gapScaling;
      const scaledGapMax = gapMax + distance * params.gapScaling;
      const gap = Phaser.Math.Between(scaledGapMin, Math.max(scaledGapMin, scaledGapMax));

      // Building width
      const [wMin, wMax] = params.platformWidthRange;
      const width = Phaser.Math.Between(wMin, wMax);

      // Height step
      const [hMin, hMax] = params.heightStepRange;
      const heightStep = Phaser.Math.Between(hMin, hMax);
      let newY = this.lastRooftopY - heightStep;
      newY = Phaser.Math.Clamp(newY, 100, params.deathY - 150);

      const newX = this.generatedUpToX + gap;
      this.createBuilding(newX, width, newY, zoneIdx);

      // Maybe spawn coins on rooftop
      if (Math.random() < zone.coinDensity) {
        this.createCoin(newX + width / 2, newY - 40);
      }

      // Maybe add fire escape
      if (Math.random() < zone.fireEscapeChance) {
        this.createFireEscape(newX, width, newY, this.buildings.length - 1);
      }

      this.generatedUpToX = newX + width;
      this.lastRooftopY = newY;
    }
  }

  private createBuilding(x: number, width: number, rooftopY: number, zoneIndex: number): void {
    // Rooftop collision surface
    const key = `roof-${width}`;
    if (!this.scene.textures.exists(key)) {
      const g = this.scene.make.graphics({}, false);
      g.fillStyle(Phaser.Display.Color.HexStringToColor(this.config.theme.platformColor).color);
      g.fillRect(0, 0, width, ROOFTOP_HEIGHT);
      g.fillStyle(Phaser.Display.Color.HexStringToColor(this.config.theme.platformEdgeColor).color);
      g.fillRect(0, 0, width, 3);
      g.generateTexture(key, width, ROOFTOP_HEIGHT);
      g.destroy();
    }

    const roof = this.rooftops.create(
      x + width / 2,
      rooftopY + ROOFTOP_HEIGHT / 2,
      key,
    ) as Phaser.Physics.Arcade.Sprite;
    roof.setDepth(DEPTH.PLATFORMS);
    roof.refreshBody();

    const height = this.config.generation.deathY - rooftopY + 200;
    this.buildings.push({ x, width, height, rooftopY, zoneIndex });
  }

  private createFireEscape(
    buildingX: number,
    buildingWidth: number,
    rooftopY: number,
    buildingIndex: number,
  ): void {
    const side = Math.random() < 0.5 ? 'left' : 'right';
    const feX = side === 'left'
      ? buildingX - FIRE_ESCAPE_WIDTH
      : buildingX + buildingWidth;
    const feY = rooftopY + Phaser.Math.Between(30, 80);

    const key = 'fire-escape';
    if (!this.scene.textures.exists(key)) {
      const g = this.scene.make.graphics({}, false);
      g.fillStyle(0x5a4a3a);
      g.fillRect(0, 0, FIRE_ESCAPE_WIDTH, FIRE_ESCAPE_HEIGHT);
      g.fillStyle(0x7a6a5a);
      g.fillRect(0, 0, FIRE_ESCAPE_WIDTH, 2);
      g.generateTexture(key, FIRE_ESCAPE_WIDTH, FIRE_ESCAPE_HEIGHT);
      g.destroy();
    }

    const plat = this.secondaryPlatforms.create(
      feX + FIRE_ESCAPE_WIDTH / 2,
      feY + FIRE_ESCAPE_HEIGHT / 2,
      key,
    ) as Phaser.Physics.Arcade.Sprite;
    plat.setDepth(DEPTH.PLATFORMS);
    plat.refreshBody();

    this.fireEscapes.push({ x: feX, y: feY, width: FIRE_ESCAPE_WIDTH, buildingIndex, side });
  }

  private createCoin(x: number, y: number): void {
    const COIN_SIZE = 20;
    if (!this.scene.textures.exists('coin')) {
      const g = this.scene.make.graphics({}, false);
      g.fillStyle(0xffdd44);
      g.fillCircle(COIN_SIZE / 2, COIN_SIZE / 2, COIN_SIZE / 2);
      g.lineStyle(2, 0xffaa00);
      g.strokeCircle(COIN_SIZE / 2, COIN_SIZE / 2, COIN_SIZE / 2 - 1);
      g.generateTexture('coin', COIN_SIZE, COIN_SIZE);
      g.destroy();
    }

    const coin = this.coins.create(x, y, 'coin') as Phaser.Physics.Arcade.Sprite;
    coin.setDepth(DEPTH.COINS);
    coin.refreshBody();
    this.scene.tweens.add({
      targets: coin,
      y: y - 8,
      duration: 800,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });
  }

  // ── Rendering ─────────────────────────────────────────────────

  private drawFacades(): void {
    this.facadeGraphics.clear();

    const cam = this.scene.cameras.main;
    const viewLeft = cam.scrollX - 100;
    const viewRight = cam.scrollX + this.scene.scale.width + 100;
    const colors = this.config.theme.buildingColors;

    for (let i = 0; i < this.buildings.length; i++) {
      const b = this.buildings[i];
      if (b.x + b.width < viewLeft || b.x > viewRight) continue;

      // Building facade
      const colorHex = colors[i % colors.length];
      const color = Phaser.Display.Color.HexStringToColor(colorHex).color;
      this.facadeGraphics.fillStyle(color);
      this.facadeGraphics.fillRect(b.x, b.rooftopY + ROOFTOP_HEIGHT, b.width, b.height);

      // Windows
      this.facadeGraphics.fillStyle(0xffcc44, 0.15 + Math.random() * 0.2);
      const windowStartY = b.rooftopY + ROOFTOP_HEIGHT + 18;
      for (let wy = windowStartY; wy < b.rooftopY + b.height - 20; wy += 28) {
        for (let wx = b.x + 12; wx < b.x + b.width - 12; wx += 20) {
          // Skip some windows randomly for variety
          if (((wx * 7 + wy * 13) % 10) < 4) continue;
          this.facadeGraphics.fillRect(wx, wy, 8, 10);
        }
      }

      // Decorative props on rooftop (deterministic from building index)
      this.drawRooftopProps(b, i);
    }

    // Fire escape vertical rails
    for (const fe of this.fireEscapes) {
      if (fe.x + fe.width < viewLeft || fe.x > viewRight) continue;
      this.facadeGraphics.fillStyle(0x5a4a3a);
      const railX = fe.side === 'left' ? fe.x : fe.x + fe.width - 2;
      this.facadeGraphics.fillRect(railX, fe.y, 2, 40);
    }
  }

  private drawRooftopProps(b: BuildingData, index: number): void {
    // Use building index as seed for deterministic prop placement
    const seed = index * 17;

    if (seed % 4 === 0 && b.width > 100) {
      // Water tank
      this.facadeGraphics.fillStyle(0x333344);
      const tankX = b.x + 10 + (seed % 3) * 15;
      this.facadeGraphics.fillRect(tankX, b.rooftopY - 14, 16, 14);
      this.facadeGraphics.fillRect(tankX - 2, b.rooftopY - 16, 20, 3);
    }

    if (seed % 3 === 0) {
      // Antenna
      this.facadeGraphics.fillStyle(0x555566);
      const antX = b.x + b.width - 18;
      this.facadeGraphics.fillRect(antX, b.rooftopY - 22, 2, 22);
      this.facadeGraphics.fillRect(antX - 4, b.rooftopY - 20, 10, 2);
    }

    if (seed % 5 === 1 && b.width > 80) {
      // Vent
      this.facadeGraphics.fillStyle(0x2a2a3e);
      this.facadeGraphics.fillRect(b.x + b.width / 2 - 8, b.rooftopY - 8, 16, 8);
    }
  }

  // ── Cleanup ───────────────────────────────────────────────────

  private cleanupBehind(cutoffX: number): void {
    // Remove buildings far behind camera
    while (this.buildings.length > 0 && this.buildings[0].x + this.buildings[0].width < cutoffX) {
      this.buildings.shift();
    }

    // Remove fire escapes far behind
    this.fireEscapes = this.fireEscapes.filter(fe => fe.x + fe.width >= cutoffX);

    // Clean up Phaser bodies far behind
    for (const child of this.rooftops.getChildren()) {
      const sprite = child as Phaser.Physics.Arcade.Sprite;
      if (sprite.x + sprite.width / 2 < cutoffX) sprite.destroy();
    }
    for (const child of this.secondaryPlatforms.getChildren()) {
      const sprite = child as Phaser.Physics.Arcade.Sprite;
      if (sprite.x + sprite.width / 2 < cutoffX) sprite.destroy();
    }
  }
}
```

- [ ] **Step 2: Verify build compiles**

Run: `npx tsc --noEmit`
Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add scenes/platformer/BuildingGenerator.ts
git commit -m "feat(rooftops): add BuildingGenerator — buildings as platforms with facades and fire escapes"
```

---

### Task 3: CityBackground

**Files:**
- Create: `scenes/platformer/CityBackground.ts`

Parallax golden hour sky with background building silhouettes. Three layers: far skyline (0.1x), mid skyline (0.3x), and the gradient sky (fixed).

- [ ] **Step 1: Create CityBackground**

Create `scenes/platformer/CityBackground.ts`:

```ts
import Phaser from 'phaser';
import type { PlatformerLevelConfig } from '../../types';
import { getZoneIndex } from './generation';
import type { SceneManager } from './types';
import { DEPTH } from './types';

interface SkylineBuilding {
  x: number;
  width: number;
  height: number;
}

export class CityBackground implements SceneManager {
  private scene: Phaser.Scene;
  private config: PlatformerLevelConfig;

  private skyGraphics!: Phaser.GameObjects.Graphics;
  private farGraphics!: Phaser.GameObjects.Graphics;
  private midGraphics!: Phaser.GameObjects.Graphics;

  private farBuildings: SkylineBuilding[] = [];
  private midBuildings: SkylineBuilding[] = [];
  private farGeneratedUpToX = 0;
  private midGeneratedUpToX = 0;

  private startX = 200;

  constructor(scene: Phaser.Scene, config: PlatformerLevelConfig) {
    this.scene = scene;
    this.config = config;
  }

  create(): void {
    const { width, height } = this.scene.scale;

    // Sky gradient (fixed to camera)
    this.skyGraphics = this.scene.add.graphics()
      .setScrollFactor(0)
      .setDepth(DEPTH.BG_FAR);
    this.drawSkyGradient(width, height, this.config.theme.skyGradient);

    // Far skyline (slow parallax)
    this.farGraphics = this.scene.add.graphics()
      .setScrollFactor(0)
      .setDepth(DEPTH.BG_FAR + 0.1);

    // Mid skyline (medium parallax)
    this.midGraphics = this.scene.add.graphics()
      .setScrollFactor(0)
      .setDepth(DEPTH.BG_MID);

    // Generate initial background
    const initWidth = width + 800;
    this.generateFarUpTo(initWidth);
    this.generateMidUpTo(initWidth);
  }

  update(_time: number, _delta: number): void {
    const cam = this.scene.cameras.main;
    const screenW = this.scene.scale.width;

    // Generate more background buildings as camera moves
    this.generateFarUpTo(cam.scrollX * 0.1 + screenW + 400);
    this.generateMidUpTo(cam.scrollX * 0.3 + screenW + 400);

    // Update sky gradient based on zone (shifts warmer in zone 3)
    const distance = cam.scrollX;
    const zoneIdx = getZoneIndex(this.config.zones, distance);
    if (zoneIdx >= 2 && this.config.theme.skyGradientZone3) {
      this.drawSkyGradient(screenW, this.scene.scale.height, this.config.theme.skyGradientZone3);
    }

    this.drawFarSkyline(cam.scrollX);
    this.drawMidSkyline(cam.scrollX);
  }

  destroy(): void {
    this.skyGraphics.destroy();
    this.farGraphics.destroy();
    this.midGraphics.destroy();
  }

  private drawSkyGradient(w: number, h: number, gradient: [string, string]): void {
    this.skyGraphics.clear();
    const top = Phaser.Display.Color.HexStringToColor(gradient[0]);
    const bot = Phaser.Display.Color.HexStringToColor(gradient[1]);

    for (let y = 0; y < h; y++) {
      const t = y / h;
      const r = Phaser.Math.Linear(top.red, bot.red, t);
      const g = Phaser.Math.Linear(top.green, bot.green, t);
      const b = Phaser.Math.Linear(top.blue, bot.blue, t);
      this.skyGraphics.fillStyle(Phaser.Display.Color.GetColor(r, g, b));
      this.skyGraphics.fillRect(0, y, w, 1);
    }
  }

  private generateFarUpTo(targetX: number): void {
    const color = this.config.theme.farSkylineColor;
    while (this.farGeneratedUpToX < targetX) {
      const w = Phaser.Math.Between(30, 80);
      const h = Phaser.Math.Between(80, 250);
      this.farBuildings.push({ x: this.farGeneratedUpToX, width: w, height: h });
      this.farGeneratedUpToX += w + Phaser.Math.Between(5, 30);
    }
  }

  private generateMidUpTo(targetX: number): void {
    while (this.midGeneratedUpToX < targetX) {
      const w = Phaser.Math.Between(40, 120);
      const h = Phaser.Math.Between(120, 380);
      this.midBuildings.push({ x: this.midGeneratedUpToX, width: w, height: h });
      this.midGeneratedUpToX += w + Phaser.Math.Between(8, 40);
    }
  }

  private drawFarSkyline(cameraScrollX: number): void {
    this.farGraphics.clear();
    const parallax = cameraScrollX * 0.1;
    const screenW = this.scene.scale.width;
    const baseY = this.scene.scale.height;
    const color = Phaser.Display.Color.HexStringToColor(this.config.theme.farSkylineColor).color;

    this.farGraphics.fillStyle(color, 0.4);
    for (const b of this.farBuildings) {
      const sx = b.x - parallax;
      if (sx + b.width < -50 || sx > screenW + 50) continue;
      this.farGraphics.fillRect(sx, baseY - b.height, b.width, b.height);
    }
  }

  private drawMidSkyline(cameraScrollX: number): void {
    this.midGraphics.clear();
    const parallax = cameraScrollX * 0.3;
    const screenW = this.scene.scale.width;
    const baseY = this.scene.scale.height;
    const color = Phaser.Display.Color.HexStringToColor(this.config.theme.midSkylineColor).color;

    this.midGraphics.fillStyle(color, 0.6);
    for (const b of this.midBuildings) {
      const sx = b.x - parallax;
      if (sx + b.width < -100 || sx > screenW + 100) continue;
      this.midGraphics.fillRect(sx, baseY - b.height, b.width, b.height);

      // Window dots on mid buildings
      this.midGraphics.fillStyle(0xffcc44, 0.1);
      for (let wy = baseY - b.height + 15; wy < baseY - 15; wy += 22) {
        for (let wx = b.x + 8; wx < b.x + b.width - 8; wx += 16) {
          if (((wx * 3 + wy * 7) % 10) < 4) continue;
          this.midGraphics.fillRect(wx - parallax, wy, 5, 7);
        }
      }
      this.midGraphics.fillStyle(color, 0.6);
    }
  }
}
```

- [ ] **Step 2: Verify build compiles**

Run: `npx tsc --noEmit`
Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add scenes/platformer/CityBackground.ts
git commit -m "feat(rooftops): add CityBackground — golden hour parallax skyline"
```

---

### Task 4: EnemyManager

**Files:**
- Create: `scenes/platformer/EnemyManager.ts`

Three enemy types: pigeon (patrol), rat (dash), raccoon (charge). All stompable.

- [ ] **Step 1: Create EnemyManager**

Create `scenes/platformer/EnemyManager.ts`:

```ts
import Phaser from 'phaser';
import type { PlatformerLevelConfig } from '../../types';
import { getZoneIndex } from './generation';
import type { BuildingData, PlatformerEnemyType, SceneManager } from './types';
import { DEPTH } from './types';
import { EffectsManager } from '../shared/EffectsManager';

const MAX_ACTIVE_ENEMIES = 4;
const STOMP_POINTS = 25;

const ENEMY_SIZES: Record<PlatformerEnemyType, { w: number; h: number }> = {
  PIGEON: { w: 24, h: 20 },
  RAT: { w: 20, h: 14 },
  RACCOON: { w: 30, h: 26 },
};

const ENEMY_COLORS: Record<PlatformerEnemyType, number> = {
  PIGEON: 0x8888aa,
  RAT: 0x666655,
  RACCOON: 0x554433,
};

interface ActiveEnemy {
  sprite: Phaser.Physics.Arcade.Sprite;
  type: PlatformerEnemyType;
  patrolMinX: number;
  patrolMaxX: number;
  rooftopY: number;
  speed: number;
  state: 'patrol' | 'dash' | 'idle' | 'charge' | 'windup';
  windupTimer: number;
  triggered: boolean;
}

export class EnemyManager implements SceneManager {
  private scene: Phaser.Scene;
  private config: PlatformerLevelConfig;
  private effects: EffectsManager;

  private group!: Phaser.Physics.Arcade.Group;
  private enemies: ActiveEnemy[] = [];
  private spawnedBuildingIndices = new Set<number>();

  private getBuildingsFn: () => readonly BuildingData[];

  constructor(
    scene: Phaser.Scene,
    config: PlatformerLevelConfig,
    effects: EffectsManager,
    getBuildings: () => readonly BuildingData[],
  ) {
    this.scene = scene;
    this.config = config;
    this.effects = effects;
    this.getBuildingsFn = getBuildings;
  }

  create(): void {
    this.group = this.scene.physics.add.group({ allowGravity: false });
  }

  update(_time: number, _delta: number): void {
    this.trySpawnEnemies();
    this.updateEnemyBehaviors();
    this.cleanupOffscreen();
  }

  destroy(): void {
    this.group.destroy(true);
    this.enemies = [];
    this.spawnedBuildingIndices.clear();
  }

  /** Get the enemy group — used by scene for player overlap */
  getGroup(): Phaser.Physics.Arcade.Group {
    return this.group;
  }

  /**
   * Check if a player-enemy overlap is a stomp (player falling onto enemy).
   * Returns points awarded, or 0 if it's not a stomp (= player takes damage).
   */
  handleOverlap(
    player: Phaser.Types.Physics.Arcade.SpriteWithDynamicBody,
    enemySprite: Phaser.Physics.Arcade.Sprite,
    multiplier: number,
  ): { stomped: boolean; points: number } {
    const playerBottom = player.body.y + player.body.height;
    const enemyTop = enemySprite.body!.y;
    const playerFalling = player.body.velocity.y > 0;

    if (playerFalling && playerBottom - enemyTop < 15) {
      // Stomp!
      const enemy = this.enemies.find(e => e.sprite === enemySprite);
      if (enemy) {
        this.killEnemy(enemy);
        const points = STOMP_POINTS * multiplier;
        this.effects.floatingScore(enemySprite.x, enemySprite.y, `+${points}`);
        this.effects.spawnParticles(
          enemySprite.x, enemySprite.y,
          ENEMY_COLORS[enemy.type], 8, 150,
        );
        return { stomped: true, points };
      }
    }
    return { stomped: false, points: 0 };
  }

  // ── Spawning ──────────────────────────────────────────────────

  private trySpawnEnemies(): void {
    if (this.enemies.length >= MAX_ACTIVE_ENEMIES) return;

    const buildings = this.getBuildingsFn();
    const cam = this.scene.cameras.main;
    const viewRight = cam.scrollX + this.scene.scale.width;

    for (let i = 0; i < buildings.length; i++) {
      if (this.spawnedBuildingIndices.has(i)) continue;
      const b = buildings[i];

      // Only spawn on buildings that are approaching the screen
      if (b.x > viewRight + 200 || b.x + b.width < cam.scrollX) continue;
      if (b.width < 80) continue; // too narrow for enemies

      const distance = b.x;
      const zoneIdx = getZoneIndex(this.config.zones, distance);
      const zone = this.config.zones[zoneIdx];

      // Roll for each enemy type in this zone
      for (const enemyCfg of zone.enemies) {
        const chancePerBuilding = enemyCfg.density / 5; // density is per 1000px, ~5 buildings per 1000px
        if (Math.random() < chancePerBuilding && this.enemies.length < MAX_ACTIVE_ENEMIES) {
          this.spawnEnemy(enemyCfg.type as PlatformerEnemyType, b, i);
          this.spawnedBuildingIndices.add(i);
          break; // max 1 enemy per building
        }
      }
    }
  }

  private spawnEnemy(type: PlatformerEnemyType, building: BuildingData, buildingIndex: number): void {
    const size = ENEMY_SIZES[type];
    const color = ENEMY_COLORS[type];

    // Create texture if needed
    const texKey = `enemy-${type}`;
    if (!this.scene.textures.exists(texKey)) {
      const g = this.scene.make.graphics({}, false);
      g.fillStyle(color);
      g.fillRoundedRect(0, 0, size.w, size.h, 4);
      // Eyes
      g.fillStyle(0xffffff);
      g.fillCircle(size.w * 0.3, size.h * 0.35, 3);
      g.fillCircle(size.w * 0.7, size.h * 0.35, 3);
      g.fillStyle(0x000000);
      g.fillCircle(size.w * 0.3, size.h * 0.35, 1.5);
      g.fillCircle(size.w * 0.7, size.h * 0.35, 1.5);
      g.generateTexture(texKey, size.w, size.h);
      g.destroy();
    }

    const x = building.x + Phaser.Math.Between(20, building.width - 20);
    const y = building.rooftopY - size.h;

    const sprite = this.group.create(x, y, texKey) as Phaser.Physics.Arcade.Sprite;
    sprite.setDepth(DEPTH.ENEMIES);
    sprite.body!.setSize(size.w - 4, size.h - 2);

    const speed = type === 'PIGEON' ? 60 : type === 'RAT' ? 200 : 0;

    const enemy: ActiveEnemy = {
      sprite,
      type,
      patrolMinX: building.x + 10,
      patrolMaxX: building.x + building.width - 10,
      rooftopY: building.rooftopY,
      speed,
      state: type === 'PIGEON' ? 'patrol' : type === 'RAT' ? 'dash' : 'idle',
      windupTimer: 0,
      triggered: false,
    };

    // Pigeon starts moving right
    if (type === 'PIGEON') {
      sprite.body!.setVelocityX(speed);
    }
    // Rat dashes from left edge to right
    if (type === 'RAT') {
      sprite.setPosition(building.x + 10, y);
      sprite.body!.setVelocityX(speed);
    }

    this.enemies.push(enemy);
  }

  // ── Behaviors ─────────────────────────────────────────────────

  private updateEnemyBehaviors(): void {
    const playerX = this.scene.cameras.main.scrollX + this.scene.scale.width / 2;

    for (const e of this.enemies) {
      switch (e.type) {
        case 'PIGEON':
          this.updatePigeon(e);
          break;
        case 'RAT':
          this.updateRat(e);
          break;
        case 'RACCOON':
          this.updateRaccoon(e, playerX);
          break;
      }
    }
  }

  private updatePigeon(e: ActiveEnemy): void {
    // Patrol: bounce between building edges
    if (e.sprite.x <= e.patrolMinX) {
      e.sprite.body!.setVelocityX(e.speed);
      e.sprite.setFlipX(false);
    } else if (e.sprite.x >= e.patrolMaxX) {
      e.sprite.body!.setVelocityX(-e.speed);
      e.sprite.setFlipX(true);
    }
  }

  private updateRat(e: ActiveEnemy): void {
    // Dash across and destroy when off the building
    if (e.sprite.x >= e.patrolMaxX || e.sprite.x <= e.patrolMinX - 20) {
      this.killEnemy(e);
    }
  }

  private updateRaccoon(e: ActiveEnemy, playerX: number): void {
    const dist = Math.abs(e.sprite.x - playerX);

    if (e.state === 'idle' && dist < 150 && !e.triggered) {
      // Player is close — start wind-up
      e.state = 'windup';
      e.windupTimer = 400; // 400ms wind-up
      e.triggered = true;

      // Visual: shake slightly
      this.scene.tweens.add({
        targets: e.sprite,
        x: e.sprite.x + 3,
        duration: 50,
        yoyo: true,
        repeat: 4,
      });
    }

    if (e.state === 'windup') {
      e.windupTimer -= this.scene.game.loop.delta;
      if (e.windupTimer <= 0) {
        // Charge!
        e.state = 'charge';
        const dir = playerX > e.sprite.x ? 1 : -1;
        e.sprite.body!.setVelocityX(180 * dir);
        e.sprite.setFlipX(dir < 0);
      }
    }

    if (e.state === 'charge') {
      // Turn around at building edges
      if (e.sprite.x <= e.patrolMinX) {
        e.sprite.body!.setVelocityX(180);
        e.sprite.setFlipX(false);
      } else if (e.sprite.x >= e.patrolMaxX) {
        e.sprite.body!.setVelocityX(-180);
        e.sprite.setFlipX(true);
      }
    }
  }

  // ── Cleanup ───────────────────────────────────────────────────

  private killEnemy(enemy: ActiveEnemy): void {
    enemy.sprite.destroy();
    this.enemies = this.enemies.filter(e => e !== enemy);
  }

  private cleanupOffscreen(): void {
    const camLeft = this.scene.cameras.main.scrollX - 200;
    for (const e of [...this.enemies]) {
      if (e.sprite.x + 50 < camLeft) {
        this.killEnemy(e);
      }
    }
  }
}
```

- [ ] **Step 2: Verify build compiles**

Run: `npx tsc --noEmit`
Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add scenes/platformer/EnemyManager.ts
git commit -m "feat(rooftops): add EnemyManager — pigeon patrol, rat dash, raccoon charge"
```

---

### Task 5: HazardManager

**Files:**
- Create: `scenes/platformer/HazardManager.ts`

Four hazard types: AC unit (blocker + steam), clothesline (zipline), satellite dish (bounce), neon sign (rhythm).

- [ ] **Step 1: Create HazardManager**

Create `scenes/platformer/HazardManager.ts`:

```ts
import Phaser from 'phaser';
import type { PlatformerLevelConfig } from '../../types';
import { getZoneIndex } from './generation';
import type { BuildingData, PlatformerHazardType, SceneManager } from './types';
import { DEPTH } from './types';

const AC_UNIT_SIZE = { w: 30, h: 25 };
const SATELLITE_SIZE = { w: 28, h: 20 };
const NEON_SIZE = { w: 10, h: 30 };
const CLOTHESLINE_SPEED = 100;
const NEON_CYCLE_MS = 1500;

interface ActiveHazard {
  type: PlatformerHazardType;
  sprite: Phaser.GameObjects.GameObject;
  body?: Phaser.Physics.Arcade.Body | Phaser.Physics.Arcade.StaticBody;
  buildingIndex: number;
  /** Neon sign on/off state */
  isOn?: boolean;
  /** Neon cycle timer */
  cycleTimer?: number;
  /** Clothesline: destination X */
  destinationX?: number;
  /** Clothesline: is player riding? */
  isRiding?: boolean;
  /** Steam AC: direction of push */
  steamDirection?: number;
  /** Steam timer */
  steamTimer?: number;
}

export class HazardManager implements SceneManager {
  private scene: Phaser.Scene;
  private config: PlatformerLevelConfig;
  private getBuildingsFn: () => readonly BuildingData[];

  /** Static hazards the player collides with (AC units) */
  private staticGroup!: Phaser.Physics.Arcade.StaticGroup;
  /** Bounce surfaces (satellite dishes) */
  private bounceGroup!: Phaser.Physics.Arcade.StaticGroup;
  /** Damage hazards (neon signs when ON) */
  private damageGroup!: Phaser.Physics.Arcade.StaticGroup;
  /** Clothesline platforms */
  private clotheslineGroup!: Phaser.Physics.Arcade.StaticGroup;

  private hazards: ActiveHazard[] = [];
  private placedBuildingIndices = new Set<number>();

  /** Graphics for clothesline ropes */
  private ropeGraphics!: Phaser.GameObjects.Graphics;

  constructor(
    scene: Phaser.Scene,
    config: PlatformerLevelConfig,
    getBuildings: () => readonly BuildingData[],
  ) {
    this.scene = scene;
    this.config = config;
    this.getBuildingsFn = getBuildings;
  }

  create(): void {
    this.staticGroup = this.scene.physics.add.staticGroup();
    this.bounceGroup = this.scene.physics.add.staticGroup();
    this.damageGroup = this.scene.physics.add.staticGroup();
    this.clotheslineGroup = this.scene.physics.add.staticGroup();
    this.ropeGraphics = this.scene.add.graphics().setDepth(DEPTH.HAZARDS);

    this.createTextures();
  }

  update(time: number, delta: number): void {
    this.tryPlaceHazards();
    this.updateNeonSigns(delta);
    this.updateSteam(delta);
    this.drawClotheslines();
    this.cleanupOffscreen();
  }

  destroy(): void {
    this.staticGroup.destroy(true);
    this.bounceGroup.destroy(true);
    this.damageGroup.destroy(true);
    this.clotheslineGroup.destroy(true);
    this.ropeGraphics.destroy();
    this.hazards = [];
    this.placedBuildingIndices.clear();
  }

  getStaticGroup(): Phaser.Physics.Arcade.StaticGroup { return this.staticGroup; }
  getBounceGroup(): Phaser.Physics.Arcade.StaticGroup { return this.bounceGroup; }
  getDamageGroup(): Phaser.Physics.Arcade.StaticGroup { return this.damageGroup; }
  getClotheslineGroup(): Phaser.Physics.Arcade.StaticGroup { return this.clotheslineGroup; }

  /** Check if a satellite dish was hit — returns bounce force multiplier */
  isBounce(sprite: Phaser.Physics.Arcade.Sprite): boolean {
    return this.bounceGroup.contains(sprite);
  }

  /** Check if a neon sign is currently ON (dangerous) */
  isNeonDangerous(sprite: Phaser.GameObjects.GameObject): boolean {
    const hazard = this.hazards.find(h => h.sprite === sprite && h.type === 'NEON_SIGN');
    return hazard?.isOn ?? false;
  }

  /** Get steam push direction for an AC unit (0 = no steam) */
  getSteamPush(sprite: Phaser.GameObjects.GameObject): number {
    const hazard = this.hazards.find(h => h.sprite === sprite && h.type === 'AC_UNIT');
    return hazard?.steamDirection ?? 0;
  }

  // ── Textures ──────────────────────────────────────────────────

  private createTextures(): void {
    // AC Unit
    if (!this.scene.textures.exists('ac-unit')) {
      const g = this.scene.make.graphics({}, false);
      g.fillStyle(0x444455);
      g.fillRoundedRect(0, 0, AC_UNIT_SIZE.w, AC_UNIT_SIZE.h, 3);
      g.fillStyle(0x333344);
      g.fillRect(3, 3, AC_UNIT_SIZE.w - 6, 4); // vent slats
      g.fillRect(3, 10, AC_UNIT_SIZE.w - 6, 4);
      g.fillRect(3, 17, AC_UNIT_SIZE.w - 6, 4);
      g.generateTexture('ac-unit', AC_UNIT_SIZE.w, AC_UNIT_SIZE.h);
      g.destroy();
    }

    // Satellite Dish
    if (!this.scene.textures.exists('satellite-dish')) {
      const g = this.scene.make.graphics({}, false);
      g.fillStyle(0x888899);
      g.fillEllipse(SATELLITE_SIZE.w / 2, SATELLITE_SIZE.h / 2, SATELLITE_SIZE.w, SATELLITE_SIZE.h);
      g.fillStyle(0xaaaabb);
      g.fillEllipse(SATELLITE_SIZE.w / 2, SATELLITE_SIZE.h / 2 - 2, SATELLITE_SIZE.w - 8, SATELLITE_SIZE.h - 6);
      g.generateTexture('satellite-dish', SATELLITE_SIZE.w, SATELLITE_SIZE.h);
      g.destroy();
    }

    // Neon Sign (ON)
    if (!this.scene.textures.exists('neon-on')) {
      const g = this.scene.make.graphics({}, false);
      g.fillStyle(0xff0066);
      g.fillRect(0, 0, NEON_SIZE.w, NEON_SIZE.h);
      g.generateTexture('neon-on', NEON_SIZE.w, NEON_SIZE.h);
      g.destroy();
    }

    // Neon Sign (OFF)
    if (!this.scene.textures.exists('neon-off')) {
      const g = this.scene.make.graphics({}, false);
      g.fillStyle(0x331122);
      g.fillRect(0, 0, NEON_SIZE.w, NEON_SIZE.h);
      g.generateTexture('neon-off', NEON_SIZE.w, NEON_SIZE.h);
      g.destroy();
    }

    // Clothesline platform (small invisible surface)
    if (!this.scene.textures.exists('clothesline-plat')) {
      const g = this.scene.make.graphics({}, false);
      g.fillStyle(0xffffff, 0);
      g.fillRect(0, 0, 20, 4);
      g.generateTexture('clothesline-plat', 20, 4);
      g.destroy();
    }
  }

  // ── Placement ─────────────────────────────────────────────────

  private tryPlaceHazards(): void {
    const buildings = this.getBuildingsFn();
    const cam = this.scene.cameras.main;
    const viewRight = cam.scrollX + this.scene.scale.width;

    for (let i = 0; i < buildings.length; i++) {
      if (this.placedBuildingIndices.has(i)) continue;
      const b = buildings[i];
      if (b.x > viewRight + 300 || b.x + b.width < cam.scrollX) continue;

      const distance = b.x;
      const zoneIdx = getZoneIndex(this.config.zones, distance);
      const zone = this.config.zones[zoneIdx];

      for (const hazardCfg of zone.hazards) {
        const chancePerBuilding = hazardCfg.frequency / 5;
        if (Math.random() < chancePerBuilding) {
          this.placeHazard(hazardCfg.type as PlatformerHazardType, b, i, buildings);
          this.placedBuildingIndices.add(i);
          break; // max 1 hazard per building
        }
      }
    }
  }

  private placeHazard(
    type: PlatformerHazardType,
    building: BuildingData,
    buildingIndex: number,
    allBuildings: readonly BuildingData[],
  ): void {
    switch (type) {
      case 'AC_UNIT':
        this.placeACUnit(building, buildingIndex);
        break;
      case 'SATELLITE_DISH':
        this.placeSatelliteDish(building, buildingIndex);
        break;
      case 'NEON_SIGN':
        this.placeNeonSign(building, buildingIndex);
        break;
      case 'CLOTHESLINE':
        this.placeClothesline(building, buildingIndex, allBuildings);
        break;
    }
  }

  private placeACUnit(building: BuildingData, buildingIndex: number): void {
    const x = building.x + Phaser.Math.Between(20, building.width - AC_UNIT_SIZE.w - 20);
    const y = building.rooftopY - AC_UNIT_SIZE.h;

    const sprite = this.staticGroup.create(
      x + AC_UNIT_SIZE.w / 2, y + AC_UNIT_SIZE.h / 2, 'ac-unit',
    ) as Phaser.Physics.Arcade.Sprite;
    sprite.setDepth(DEPTH.HAZARDS);
    sprite.refreshBody();

    // 40% chance of steam variant
    const steamDir = Math.random() < 0.4 ? (Math.random() < 0.5 ? -1 : 1) : 0;

    this.hazards.push({
      type: 'AC_UNIT', sprite, buildingIndex,
      steamDirection: steamDir, steamTimer: 0,
    });
  }

  private placeSatelliteDish(building: BuildingData, buildingIndex: number): void {
    const x = building.x + Phaser.Math.Between(15, building.width - SATELLITE_SIZE.w - 15);
    const y = building.rooftopY - SATELLITE_SIZE.h;

    const sprite = this.bounceGroup.create(
      x + SATELLITE_SIZE.w / 2, y + SATELLITE_SIZE.h / 2, 'satellite-dish',
    ) as Phaser.Physics.Arcade.Sprite;
    sprite.setDepth(DEPTH.HAZARDS);
    sprite.refreshBody();

    this.hazards.push({ type: 'SATELLITE_DISH', sprite, buildingIndex });
  }

  private placeNeonSign(building: BuildingData, buildingIndex: number): void {
    // Place near building edge
    const atLeft = Math.random() < 0.5;
    const x = atLeft ? building.x - NEON_SIZE.w / 2 : building.x + building.width - NEON_SIZE.w / 2;
    const y = building.rooftopY - NEON_SIZE.h + 5;

    const sprite = this.damageGroup.create(
      x + NEON_SIZE.w / 2, y + NEON_SIZE.h / 2, 'neon-on',
    ) as Phaser.Physics.Arcade.Sprite;
    sprite.setDepth(DEPTH.HAZARDS);
    sprite.refreshBody();

    this.hazards.push({
      type: 'NEON_SIGN', sprite, buildingIndex,
      isOn: true, cycleTimer: Math.random() * NEON_CYCLE_MS, // offset so they don't all sync
    });
  }

  private placeClothesline(
    building: BuildingData,
    buildingIndex: number,
    allBuildings: readonly BuildingData[],
  ): void {
    // Need a next building to span to
    const nextIdx = buildingIndex + 1;
    if (nextIdx >= allBuildings.length) return;

    // Clothesline data is stored for rope drawing; actual ride is handled by scene
    // Place a small invisible platform at the start point
    const startX = building.x + building.width;
    const ropeY = Math.max(building.rooftopY, allBuildings[nextIdx].rooftopY) - 10;

    const sprite = this.clotheslineGroup.create(
      startX + 10, ropeY, 'clothesline-plat',
    ) as Phaser.Physics.Arcade.Sprite;
    sprite.setDepth(DEPTH.HAZARDS);
    sprite.refreshBody();

    this.hazards.push({
      type: 'CLOTHESLINE', sprite, buildingIndex,
      destinationX: allBuildings[nextIdx].x,
    });
  }

  // ── Updates ───────────────────────────────────────────────────

  private updateNeonSigns(delta: number): void {
    for (const h of this.hazards) {
      if (h.type !== 'NEON_SIGN') continue;

      h.cycleTimer! += delta;
      if (h.cycleTimer! >= NEON_CYCLE_MS) {
        h.cycleTimer! -= NEON_CYCLE_MS;
        h.isOn = !h.isOn;

        const sprite = h.sprite as Phaser.Physics.Arcade.Sprite;
        sprite.setTexture(h.isOn ? 'neon-on' : 'neon-off');
        sprite.setAlpha(h.isOn ? 1 : 0.3);
      }
    }
  }

  private updateSteam(delta: number): void {
    for (const h of this.hazards) {
      if (h.type !== 'AC_UNIT' || !h.steamDirection) continue;
      // Steam puff visual is handled by the scene checking getSteamPush()
      // Timer is used for 2s cycle: 0.5s on, 1.5s off
      h.steamTimer! += delta;
      if (h.steamTimer! > 2000) h.steamTimer! -= 2000;
    }
  }

  /** Returns true if steam is currently active (first 500ms of 2s cycle) */
  isSteamActive(hazard: ActiveHazard): boolean {
    return (hazard.steamTimer ?? 0) < 500;
  }

  private drawClotheslines(): void {
    this.ropeGraphics.clear();
    const cam = this.scene.cameras.main;
    const viewLeft = cam.scrollX - 100;
    const viewRight = cam.scrollX + this.scene.scale.width + 100;

    for (const h of this.hazards) {
      if (h.type !== 'CLOTHESLINE') continue;
      const sprite = h.sprite as Phaser.Physics.Arcade.Sprite;
      if (sprite.x < viewLeft || sprite.x > viewRight) continue;

      const startX = sprite.x;
      const endX = h.destinationX!;
      const y = sprite.y;

      // Rope line with slight sag
      this.ropeGraphics.lineStyle(2, 0xaaaaaa);
      this.ropeGraphics.beginPath();
      this.ropeGraphics.moveTo(startX, y);
      const midX = (startX + endX) / 2;
      this.ropeGraphics.lineTo(midX, y + 8); // sag
      this.ropeGraphics.lineTo(endX, y);
      this.ropeGraphics.strokePath();

      // Clothes hanging (decorative)
      const clothColors = [0xcc6666, 0x6666cc, 0x66cc66, 0xcccc66];
      for (let cx = startX + 20; cx < endX - 20; cx += 30) {
        const color = clothColors[Math.floor(cx) % clothColors.length];
        this.ropeGraphics.fillStyle(color, 0.6);
        this.ropeGraphics.fillRect(cx, y + 2, 8, 12);
      }
    }
  }

  private cleanupOffscreen(): void {
    const camLeft = this.scene.cameras.main.scrollX - 300;
    this.hazards = this.hazards.filter(h => {
      const sprite = h.sprite as Phaser.Physics.Arcade.Sprite;
      if (sprite.x + 50 < camLeft) {
        sprite.destroy();
        return false;
      }
      return true;
    });
  }
}
```

- [ ] **Step 2: Verify build compiles**

Run: `npx tsc --noEmit`
Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add scenes/platformer/HazardManager.ts
git commit -m "feat(rooftops): add HazardManager — AC units, clotheslines, satellite dishes, neon signs"
```

---

### Task 6: PowerupManager

**Files:**
- Create: `scenes/platformer/PowerupManager.ts`

Triple Jump, Glide, Shield. Spawn on rooftops (1 per zone) and optionally on fire escapes.

- [ ] **Step 1: Create PowerupManager**

Create `scenes/platformer/PowerupManager.ts`:

```ts
import Phaser from 'phaser';
import type { PlatformerLevelConfig } from '../../types';
import { getZoneIndex } from './generation';
import type { BuildingData, FireEscapeData, PlatformerPowerupType, SceneManager } from './types';
import { DEPTH } from './types';
import { EffectsManager } from '../shared/EffectsManager';

const POWERUP_SIZE = 22;

const POWERUP_COLORS: Record<PlatformerPowerupType, number> = {
  TRIPLE_JUMP: 0x44ddff,
  GLIDE: 0xaa88ff,
  SHIELD: 0x44ff88,
};

const POWERUP_LABELS: Record<PlatformerPowerupType, string> = {
  TRIPLE_JUMP: '3x',
  GLIDE: '~',
  SHIELD: 'O',
};

export interface ActivePowerupState {
  type: PlatformerPowerupType | null;
  remainingMs: number;
}

export class PowerupManager implements SceneManager {
  private scene: Phaser.Scene;
  private config: PlatformerLevelConfig;
  private effects: EffectsManager;
  private getBuildingsFn: () => readonly BuildingData[];
  private getFireEscapesFn: () => readonly FireEscapeData[];

  private group!: Phaser.Physics.Arcade.StaticGroup;
  private spawnedZones = new Set<number>();
  private spawnedFireEscapes = new Set<number>();

  /** Currently active powerup */
  private activePowerup: PlatformerPowerupType | null = null;
  private powerupTimer = 0;

  /** Shield is single-use, tracked separately */
  private shieldActive = false;

  constructor(
    scene: Phaser.Scene,
    config: PlatformerLevelConfig,
    effects: EffectsManager,
    getBuildings: () => readonly BuildingData[],
    getFireEscapes: () => readonly FireEscapeData[],
  ) {
    this.scene = scene;
    this.config = config;
    this.effects = effects;
    this.getBuildingsFn = getBuildings;
    this.getFireEscapesFn = getFireEscapes;
  }

  create(): void {
    this.group = this.scene.physics.add.staticGroup();
    this.createTextures();
  }

  update(_time: number, delta: number): void {
    this.trySpawnPowerups();

    // Tick down timed powerups
    if (this.activePowerup && this.activePowerup !== 'SHIELD') {
      this.powerupTimer -= delta;
      if (this.powerupTimer <= 0) {
        this.activePowerup = null;
        this.powerupTimer = 0;
      }
    }
  }

  destroy(): void {
    this.group.destroy(true);
    this.activePowerup = null;
    this.powerupTimer = 0;
    this.shieldActive = false;
  }

  getGroup(): Phaser.Physics.Arcade.StaticGroup { return this.group; }

  getState(): ActivePowerupState {
    return {
      type: this.shieldActive ? 'SHIELD' : this.activePowerup,
      remainingMs: this.shieldActive ? Infinity : this.powerupTimer,
    };
  }

  /** Is triple jump currently active? */
  hasTripleJump(): boolean {
    return this.activePowerup === 'TRIPLE_JUMP';
  }

  /** Is glide currently active? */
  hasGlide(): boolean {
    return this.activePowerup === 'GLIDE';
  }

  /** Is shield active? */
  hasShield(): boolean {
    return this.shieldActive;
  }

  /** Consume the shield (on damage). Returns true if shield was active. */
  consumeShield(): boolean {
    if (this.shieldActive) {
      this.shieldActive = false;
      return true;
    }
    return false;
  }

  /** Called when player overlaps a powerup pickup */
  collectPowerup(sprite: Phaser.Physics.Arcade.Sprite): void {
    const type = sprite.getData('powerupType') as PlatformerPowerupType;
    const x = sprite.x;
    const y = sprite.y;
    sprite.destroy();

    this.effects.floatingScore(x, y, type.replace('_', ' '), '#44ffaa');
    this.effects.spawnParticles(x, y, POWERUP_COLORS[type], 10, 180);

    if (type === 'SHIELD') {
      this.shieldActive = true;
    } else {
      // Replace any existing timed powerup
      this.activePowerup = type;
      this.powerupTimer = type === 'TRIPLE_JUMP'
        ? this.config.powerups.tripleJumpDuration
        : this.config.powerups.glideDuration;
    }
  }

  // ── Textures ──────────────────────────────────────────────────

  private createTextures(): void {
    for (const type of ['TRIPLE_JUMP', 'GLIDE', 'SHIELD'] as PlatformerPowerupType[]) {
      const key = `powerup-${type}`;
      if (this.scene.textures.exists(key)) continue;

      const g = this.scene.make.graphics({}, false);
      const color = POWERUP_COLORS[type];
      // Glowing circle
      g.fillStyle(color, 0.3);
      g.fillCircle(POWERUP_SIZE / 2, POWERUP_SIZE / 2, POWERUP_SIZE / 2);
      g.fillStyle(color);
      g.fillCircle(POWERUP_SIZE / 2, POWERUP_SIZE / 2, POWERUP_SIZE / 2 - 4);
      g.generateTexture(key, POWERUP_SIZE, POWERUP_SIZE);
      g.destroy();
    }
  }

  // ── Spawning ──────────────────────────────────────────────────

  private trySpawnPowerups(): void {
    const buildings = this.getBuildingsFn();
    const cam = this.scene.cameras.main;
    const viewRight = cam.scrollX + this.scene.scale.width;

    // Zone-based spawns (1 per zone, near midpoint)
    for (const zone of this.config.zones) {
      const zoneIdx = this.config.zones.indexOf(zone);
      if (this.spawnedZones.has(zoneIdx)) continue;

      const midDistance = (zone.startDistance + zone.endDistance) / 2;

      // Find a building near the zone midpoint
      for (const b of buildings) {
        if (b.x < midDistance - 300 || b.x > midDistance + 300) continue;
        if (b.x > viewRight + 400) continue;
        if (b.width < 60) continue;

        this.spawnPowerup(b);
        this.spawnedZones.add(zoneIdx);
        break;
      }
    }

    // Fire escape bonus spawns
    const fireEscapes = this.getFireEscapesFn();
    for (let i = 0; i < fireEscapes.length; i++) {
      if (this.spawnedFireEscapes.has(i)) continue;
      const fe = fireEscapes[i];
      if (fe.x > viewRight + 400) continue;

      if (Math.random() < this.config.powerups.fireEscapeBonusChance) {
        this.spawnPowerupAt(fe.x + fe.width / 2, fe.y - POWERUP_SIZE);
        this.spawnedFireEscapes.add(i);
      } else {
        this.spawnedFireEscapes.add(i); // mark as checked even if not spawned
      }
    }
  }

  private spawnPowerup(building: BuildingData): void {
    const x = building.x + building.width / 2;
    const y = building.rooftopY - POWERUP_SIZE - 10;
    this.spawnPowerupAt(x, y);
  }

  private spawnPowerupAt(x: number, y: number): void {
    const types: PlatformerPowerupType[] = ['TRIPLE_JUMP', 'GLIDE', 'SHIELD'];
    const type = types[Math.floor(Math.random() * types.length)];

    const sprite = this.group.create(x, y, `powerup-${type}`) as Phaser.Physics.Arcade.Sprite;
    sprite.setDepth(DEPTH.POWERUPS);
    sprite.setData('powerupType', type);
    sprite.refreshBody();

    // Gentle bob animation
    this.scene.tweens.add({
      targets: sprite,
      y: y - 6,
      duration: 900,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });
  }
}
```

- [ ] **Step 2: Verify build compiles**

Run: `npx tsc --noEmit`
Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add scenes/platformer/PowerupManager.ts
git commit -m "feat(rooftops): add PowerupManager — triple jump, glide, shield"
```

---

### Task 7: PigeonKingBoss

**Files:**
- Create: `scenes/platformer/bossPhases.ts` (pure state machine logic)
- Create: `scenes/platformer/bossPhases.test.ts`
- Create: `scenes/platformer/PigeonKingBoss.ts` (Phaser rendering + gameplay)

- [ ] **Step 1: Write boss phase state machine tests**

Create `scenes/platformer/bossPhases.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { createBossState, advanceBossPhase, shouldLand, INITIAL_HP } from './bossPhases';
import type { PlatformerBossConfig } from '../../types';

const BOSS_CONFIG: PlatformerBossConfig = {
  arenaWidth: 1200,
  phases: [
    { swoopSpeed: 200, feathersPerPass: 2, swoopsBeforeLand: 2, landDuration: 3, miniPigeonCount: 0, hasDiveBomb: false },
    { swoopSpeed: 280, feathersPerPass: 3, swoopsBeforeLand: 2, landDuration: 2, miniPigeonCount: 2, hasDiveBomb: false },
    { swoopSpeed: 350, feathersPerPass: 4, swoopsBeforeLand: 3, landDuration: 1.5, miniPigeonCount: 3, hasDiveBomb: true },
  ],
};

describe('createBossState', () => {
  it('initializes at phase 1 with full HP', () => {
    const state = createBossState();
    expect(state.phase).toBe(1);
    expect(state.hp).toBe(INITIAL_HP);
    expect(state.swoopCount).toBe(0);
    expect(state.isLanded).toBe(false);
  });
});

describe('shouldLand', () => {
  it('returns true when swoop count reaches phase threshold', () => {
    const state = createBossState();
    state.swoopCount = 2;
    expect(shouldLand(state, BOSS_CONFIG)).toBe(true);
  });

  it('returns false before enough swoops', () => {
    const state = createBossState();
    state.swoopCount = 1;
    expect(shouldLand(state, BOSS_CONFIG)).toBe(false);
  });
});

describe('advanceBossPhase', () => {
  it('decrements HP and advances phase', () => {
    const state = createBossState();
    const next = advanceBossPhase(state);
    expect(next.hp).toBe(INITIAL_HP - 1);
    expect(next.phase).toBe(2);
    expect(next.swoopCount).toBe(0);
    expect(next.isLanded).toBe(false);
  });

  it('advances to phase 3 on second stomp', () => {
    let state = createBossState();
    state = advanceBossPhase(state);
    state = advanceBossPhase(state);
    expect(state.phase).toBe(3);
    expect(state.hp).toBe(1);
  });

  it('reaches 0 HP on third stomp', () => {
    let state = createBossState();
    state = advanceBossPhase(state);
    state = advanceBossPhase(state);
    state = advanceBossPhase(state);
    expect(state.hp).toBe(0);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm run test:run -- scenes/platformer/bossPhases.test.ts`
Expected: FAIL — module `./bossPhases` does not exist

- [ ] **Step 3: Implement boss phase state machine**

Create `scenes/platformer/bossPhases.ts`:

```ts
import type { PlatformerBossConfig } from '../../types';
import type { BossPhaseId, BossPhaseState } from './types';

export const INITIAL_HP = 3;

export function createBossState(): BossPhaseState {
  return {
    phase: 1,
    hp: INITIAL_HP,
    swoopCount: 0,
    isLanded: false,
    landTimer: 0,
    miniPigeonCount: 0,
  };
}

/** Check if the boss should land based on current swoop count and phase config */
export function shouldLand(state: BossPhaseState, config: PlatformerBossConfig): boolean {
  const phaseConfig = config.phases[state.phase - 1];
  return state.swoopCount >= phaseConfig.swoopsBeforeLand;
}

/** Get the land duration for the current phase (in seconds) */
export function getLandDuration(state: BossPhaseState, config: PlatformerBossConfig): number {
  return config.phases[state.phase - 1].landDuration;
}

/** Get feather count for current phase */
export function getFeathersPerPass(state: BossPhaseState, config: PlatformerBossConfig): number {
  return config.phases[state.phase - 1].feathersPerPass;
}

/** Get swoop speed for current phase */
export function getSwoopSpeed(state: BossPhaseState, config: PlatformerBossConfig): number {
  return config.phases[state.phase - 1].swoopSpeed;
}

/** Get mini pigeon count for current phase */
export function getMiniPigeonCount(state: BossPhaseState, config: PlatformerBossConfig): number {
  return config.phases[state.phase - 1].miniPigeonCount;
}

/** Check if current phase has dive bomb attack */
export function hasDiveBomb(state: BossPhaseState, config: PlatformerBossConfig): boolean {
  return config.phases[state.phase - 1].hasDiveBomb;
}

/** After a stomp: decrement HP, advance phase, reset swoop counter */
export function advanceBossPhase(state: BossPhaseState): BossPhaseState {
  const newHp = state.hp - 1;
  const newPhase = Math.min(state.phase + 1, 3) as BossPhaseId;
  return {
    phase: newHp > 0 ? newPhase : state.phase,
    hp: newHp,
    swoopCount: 0,
    isLanded: false,
    landTimer: 0,
    miniPigeonCount: 0,
  };
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm run test:run -- scenes/platformer/bossPhases.test.ts`
Expected: All 6 tests PASS

- [ ] **Step 5: Create PigeonKingBoss Phaser module**

Create `scenes/platformer/PigeonKingBoss.ts`:

```ts
import Phaser from 'phaser';
import type { PlatformerLevelConfig } from '../../types';
import {
  createBossState, advanceBossPhase, shouldLand,
  getLandDuration, getFeathersPerPass, getSwoopSpeed,
  getMiniPigeonCount, hasDiveBomb,
} from './bossPhases';
import type { BossPhaseState, SceneManager } from './types';
import { DEPTH } from './types';
import { EffectsManager } from '../shared/EffectsManager';

const BOSS_SIZE = { w: 64, h: 48 };
const FEATHER_SIZE = { w: 12, h: 6 };
const MINI_PIGEON_SIZE = { w: 24, h: 20 };
const FEATHER_FALL_SPEED = 250;
const FEATHER_DRIFT = 80;

type BossMode = 'swooping' | 'landing' | 'landed' | 'takeoff' | 'defeated';

export class PigeonKingBoss implements SceneManager {
  private scene: Phaser.Scene;
  private config: PlatformerLevelConfig;
  private effects: EffectsManager;

  private bossSprite!: Phaser.Physics.Arcade.Sprite;
  private feathers!: Phaser.Physics.Arcade.Group;
  private miniPigeons!: Phaser.Physics.Arcade.Group;

  private state: BossPhaseState;
  private mode: BossMode = 'swooping';

  private arenaLeft = 0;
  private arenaRight = 0;
  private arenaY = 0;
  private swoopDirection = 1;
  private swoopY = 0;
  private landX = 0;
  private featherCooldown = 0;
  private diveBombCooldown = 0;

  /** True once boss is fully defeated */
  private defeated = false;

  constructor(scene: Phaser.Scene, config: PlatformerLevelConfig, effects: EffectsManager) {
    this.scene = scene;
    this.config = config;
    this.effects = effects;
    this.state = createBossState();
  }

  /** Call this to set up the boss arena at a specific position */
  createArena(arenaX: number, arenaY: number): void {
    this.arenaLeft = arenaX;
    this.arenaRight = arenaX + this.config.boss.arenaWidth;
    this.arenaY = arenaY;
    this.swoopY = arenaY - 150;

    this.createTextures();

    // Boss sprite
    this.bossSprite = this.scene.physics.add.sprite(
      (this.arenaLeft + this.arenaRight) / 2,
      this.swoopY,
      'pigeon-king',
    );
    this.bossSprite.setDepth(DEPTH.ENEMIES + 1);
    this.bossSprite.body!.setAllowGravity(false);
    this.bossSprite.body!.setSize(BOSS_SIZE.w - 8, BOSS_SIZE.h - 4);
    this.bossSprite.body!.setVelocityX(getSwoopSpeed(this.state, this.config.boss));

    // Feather projectile group
    this.feathers = this.scene.physics.add.group({ allowGravity: false });

    // Mini pigeon group
    this.miniPigeons = this.scene.physics.add.group({ allowGravity: false });
  }

  create(): void {
    // Arena creation is deferred — call createArena() when player reaches boss zone
  }

  update(time: number, delta: number): void {
    if (this.defeated) return;

    switch (this.mode) {
      case 'swooping': this.updateSwoop(delta); break;
      case 'landing': this.updateLanding(delta); break;
      case 'landed': this.updateLanded(delta); break;
      case 'takeoff': this.updateTakeoff(delta); break;
    }

    this.updateFeathers(delta);
    this.updateMiniPigeons();
  }

  destroy(): void {
    this.bossSprite?.destroy();
    this.feathers?.destroy(true);
    this.miniPigeons?.destroy(true);
  }

  isDefeated(): boolean { return this.defeated; }
  getBossSprite(): Phaser.Physics.Arcade.Sprite { return this.bossSprite; }
  getFeatherGroup(): Phaser.Physics.Arcade.Group { return this.feathers; }
  getMiniPigeonGroup(): Phaser.Physics.Arcade.Group { return this.miniPigeons; }
  getHP(): number { return this.state.hp; }

  /**
   * Called when player stomps the boss while it's landed.
   * Returns true if the stomp was valid.
   */
  handleStomp(): boolean {
    if (this.mode !== 'landed') return false;

    this.state = advanceBossPhase(this.state);

    // Flash + screech effect
    this.effects.flash(0xffffff, 200);
    this.effects.shake(0.02, 200);
    this.effects.freezeFrame(80);
    this.effects.spawnParticles(this.bossSprite.x, this.bossSprite.y, 0xffffff, 15, 250);

    // Destroy mini pigeons on phase change
    this.miniPigeons.clear(true, true);

    if (this.state.hp <= 0) {
      this.mode = 'defeated';
      this.defeated = true;
      this.defeatSequence();
      return true;
    }

    // Take off for next phase
    this.mode = 'takeoff';
    this.scene.tweens.add({
      targets: this.bossSprite,
      y: this.swoopY,
      duration: 600,
      ease: 'Power2',
      onComplete: () => {
        this.mode = 'swooping';
        this.swoopDirection = 1;
        this.bossSprite.body!.setVelocityX(getSwoopSpeed(this.state, this.config.boss));
      },
    });

    return true;
  }

  // ── Swoop ─────────────────────────────────────────────────────

  private updateSwoop(delta: number): void {
    const speed = getSwoopSpeed(this.state, this.config.boss);

    // Bounce off arena walls
    if (this.bossSprite.x >= this.arenaRight - BOSS_SIZE.w) {
      this.swoopDirection = -1;
      this.bossSprite.body!.setVelocityX(-speed);
      this.bossSprite.setFlipX(true);
      this.state.swoopCount++;
      this.dropFeathers();
    } else if (this.bossSprite.x <= this.arenaLeft + BOSS_SIZE.w) {
      this.swoopDirection = 1;
      this.bossSprite.body!.setVelocityX(speed);
      this.bossSprite.setFlipX(false);
      this.state.swoopCount++;
      this.dropFeathers();
    }

    // Check if should land
    if (shouldLand(this.state, this.config.boss)) {
      this.beginLanding();
    }

    // Dive bomb in phase 3
    if (hasDiveBomb(this.state, this.config.boss)) {
      this.diveBombCooldown -= delta;
      if (this.diveBombCooldown <= 0) {
        this.diveBombCooldown = 3000; // 3s between dive bombs
        this.doDiveBomb();
      }
    }
  }

  private dropFeathers(): void {
    const count = getFeathersPerPass(this.state, this.config.boss);
    const spacing = (this.arenaRight - this.arenaLeft) / (count + 1);

    for (let i = 1; i <= count; i++) {
      const fx = this.arenaLeft + spacing * i + Phaser.Math.Between(-20, 20);
      const feather = this.feathers.create(fx, this.swoopY + 20, 'feather') as Phaser.Physics.Arcade.Sprite;
      feather.setDepth(DEPTH.ENEMIES);
      feather.body!.setVelocity(
        Phaser.Math.Between(-FEATHER_DRIFT, FEATHER_DRIFT),
        FEATHER_FALL_SPEED,
      );
    }
  }

  private doDiveBomb(): void {
    // Quick downward dash to near-ground, then return
    const originalY = this.bossSprite.y;
    this.scene.tweens.add({
      targets: this.bossSprite,
      y: this.arenaY - BOSS_SIZE.h - 10,
      duration: 300,
      ease: 'Power3',
      yoyo: true,
      hold: 100,
      onYoyo: () => {
        this.effects.shake(0.015, 100);
      },
    });
  }

  // ── Landing ───────────────────────────────────────────────────

  private beginLanding(): void {
    this.mode = 'landing';
    this.state.swoopCount = 0;

    // Pick a landing spot
    this.landX = Phaser.Math.Between(
      this.arenaLeft + 100,
      this.arenaRight - 100,
    );

    this.bossSprite.body!.setVelocity(0, 0);
    this.scene.tweens.add({
      targets: this.bossSprite,
      x: this.landX,
      y: this.arenaY - BOSS_SIZE.h,
      duration: 500,
      ease: 'Power2',
      onComplete: () => {
        this.mode = 'landed';
        this.state.isLanded = true;
        this.state.landTimer = getLandDuration(this.state, this.config.boss) * 1000;

        // Spawn mini pigeons for this phase
        this.spawnMiniPigeons();
      },
    });
  }

  private updateLanding(_delta: number): void {
    // Tween handles movement — nothing to do
  }

  private updateLanded(delta: number): void {
    this.state.landTimer -= delta;
    if (this.state.landTimer <= 0) {
      // Time's up — take off without being stomped
      this.state.isLanded = false;
      this.mode = 'takeoff';
      this.miniPigeons.clear(true, true);
      this.scene.tweens.add({
        targets: this.bossSprite,
        y: this.swoopY,
        duration: 400,
        ease: 'Power2',
        onComplete: () => {
          this.mode = 'swooping';
          this.bossSprite.body!.setVelocityX(
            getSwoopSpeed(this.state, this.config.boss) * this.swoopDirection,
          );
        },
      });
    }
  }

  private updateTakeoff(_delta: number): void {
    // Tween handles movement
  }

  // ── Mini Pigeons ──────────────────────────────────────────────

  private spawnMiniPigeons(): void {
    const count = getMiniPigeonCount(this.state, this.config.boss);
    if (count === 0) return;

    if (!this.scene.textures.exists('mini-pigeon')) {
      const g = this.scene.make.graphics({}, false);
      g.fillStyle(0x8888aa);
      g.fillRoundedRect(0, 0, MINI_PIGEON_SIZE.w, MINI_PIGEON_SIZE.h, 4);
      g.fillStyle(0xffffff);
      g.fillCircle(7, 7, 2);
      g.fillCircle(17, 7, 2);
      g.generateTexture('mini-pigeon', MINI_PIGEON_SIZE.w, MINI_PIGEON_SIZE.h);
      g.destroy();
    }

    const spacing = (this.arenaRight - this.arenaLeft) / (count + 1);
    for (let i = 1; i <= count; i++) {
      const px = this.arenaLeft + spacing * i;
      const py = this.arenaY - MINI_PIGEON_SIZE.h;
      const mp = this.miniPigeons.create(px, py, 'mini-pigeon') as Phaser.Physics.Arcade.Sprite;
      mp.setDepth(DEPTH.ENEMIES);
      mp.body!.setVelocityX(Phaser.Math.Between(40, 80) * (Math.random() < 0.5 ? 1 : -1));
    }
  }

  private updateMiniPigeons(): void {
    for (const child of this.miniPigeons.getChildren()) {
      const mp = child as Phaser.Physics.Arcade.Sprite;
      // Bounce off arena walls
      if (mp.x <= this.arenaLeft + 10) mp.body!.setVelocityX(Math.abs(mp.body!.velocity.x));
      if (mp.x >= this.arenaRight - 10) mp.body!.setVelocityX(-Math.abs(mp.body!.velocity.x));
    }
  }

  // ── Feathers ──────────────────────────────────────────────────

  private updateFeathers(_delta: number): void {
    for (const child of [...this.feathers.getChildren()]) {
      const f = child as Phaser.Physics.Arcade.Sprite;
      // Destroy feathers that hit the ground
      if (f.y >= this.arenaY) {
        f.destroy();
      }
    }
  }

  // ── Textures ──────────────────────────────────────────────────

  private createTextures(): void {
    if (!this.scene.textures.exists('pigeon-king')) {
      const g = this.scene.make.graphics({}, false);
      g.fillStyle(0x7777aa);
      g.fillRoundedRect(0, 0, BOSS_SIZE.w, BOSS_SIZE.h, 8);
      // Crown
      g.fillStyle(0xffdd44);
      g.fillTriangle(20, 8, 24, 0, 28, 8);
      g.fillTriangle(28, 8, 32, 0, 36, 8);
      g.fillTriangle(36, 8, 40, 0, 44, 8);
      // Eyes
      g.fillStyle(0xff4444);
      g.fillCircle(18, 22, 5);
      g.fillCircle(46, 22, 5);
      g.fillStyle(0xffffff);
      g.fillCircle(18, 22, 3);
      g.fillCircle(46, 22, 3);
      // Beak
      g.fillStyle(0xffaa44);
      g.fillTriangle(28, 28, 36, 28, 32, 36);
      g.generateTexture('pigeon-king', BOSS_SIZE.w, BOSS_SIZE.h);
      g.destroy();
    }

    if (!this.scene.textures.exists('feather')) {
      const g = this.scene.make.graphics({}, false);
      g.fillStyle(0xddddee);
      g.fillEllipse(FEATHER_SIZE.w / 2, FEATHER_SIZE.h / 2, FEATHER_SIZE.w, FEATHER_SIZE.h);
      g.generateTexture('feather', FEATHER_SIZE.w, FEATHER_SIZE.h);
      g.destroy();
    }
  }

  // ── Defeat ────────────────────────────────────────────────────

  private defeatSequence(): void {
    this.bossSprite.body!.setVelocity(0, 0);

    // Feather explosion
    for (let i = 0; i < 30; i++) {
      this.effects.spawnParticles(
        this.bossSprite.x + Phaser.Math.Between(-20, 20),
        this.bossSprite.y + Phaser.Math.Between(-20, 20),
        0xddddee, 3, 300,
      );
    }

    // Boss flies away
    this.scene.tweens.add({
      targets: this.bossSprite,
      y: -200,
      x: this.bossSprite.x + 300,
      alpha: 0,
      duration: 1500,
      ease: 'Power2',
      onComplete: () => {
        this.bossSprite.destroy();
      },
    });
  }
}
```

- [ ] **Step 6: Verify build compiles**

Run: `npx tsc --noEmit`
Expected: No errors

- [ ] **Step 7: Run all new tests**

Run: `npm run test:run -- scenes/platformer/`
Expected: All tests pass (generation + bossPhases)

- [ ] **Step 8: Commit**

```bash
git add scenes/platformer/bossPhases.ts scenes/platformer/bossPhases.test.ts scenes/platformer/PigeonKingBoss.ts
git commit -m "feat(rooftops): add PigeonKingBoss — 3-phase stomp fight with feather projectiles"
```

---

### Task 8: PlatformerScene Rewrite

**Files:**
- Modify: `scenes/PlatformerScene.ts` (full rewrite — orchestrator calling managers)

This is the integration task. The scene becomes a thin orchestrator that delegates to all managers.

- [ ] **Step 1: Rewrite PlatformerScene.ts**

Replace the entire contents of `scenes/PlatformerScene.ts`:

```ts
import Phaser from 'phaser';
import { SceneBridge } from './shared/SceneBridge';
import type { PlatformerSceneInitData } from './shared/bridgeProtocol';
import type { PlatformerLevelConfig, GameScore, GameStatus } from '../types';
import { loadCatSprite, CAT_TEXTURE_KEY } from './shared/SpriteLoader';
import { EffectsManager } from './shared/EffectsManager';
import { BuildingGenerator } from './platformer/BuildingGenerator';
import { CityBackground } from './platformer/CityBackground';
import { EnemyManager } from './platformer/EnemyManager';
import { HazardManager } from './platformer/HazardManager';
import { PowerupManager } from './platformer/PowerupManager';
import { PigeonKingBoss } from './platformer/PigeonKingBoss';
import { DEPTH } from './platformer/types';

const PLAYER_WIDTH = 40;
const PLAYER_HEIGHT = 48;
const COIN_SIZE = 20;
const BOUNCE_MULTIPLIER = 1.8;

export default class PlatformerScene extends SceneBridge {
  private config!: PlatformerLevelConfig;

  // Player
  private player!: Phaser.Types.Physics.Arcade.SpriteWithDynamicBody;
  private jumpCount = 0;
  private facingRight = true;
  private isOnGround = false;
  private maxJumps = 2;

  // Game state
  private lives = 3;
  private gameScore: GameScore = {
    current: 0, high: 0, coins: 0,
    multiplier: 1, streak: 0, lives: 3,
  };
  private distanceTraveled = 0;
  private startX = 200;
  private isGameOver = false;
  private hasWon = false;
  private inBossArena = false;

  // Input
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private spaceKey!: Phaser.Input.Keyboard.Key;
  private jumpHeld = false;

  // Managers
  private effects!: EffectsManager;
  private buildings!: BuildingGenerator;
  private background!: CityBackground;
  private enemies!: EnemyManager;
  private hazards!: HazardManager;
  private powerups!: PowerupManager;
  private boss!: PigeonKingBoss;

  // HUD
  private distanceText!: Phaser.GameObjects.Text;

  // ─── Lifecycle ──────────────────────────────────────────────

  init(data: PlatformerSceneInitData): void {
    super.init(data);
    this.config = data.levelConfig;
    this.lives = data.initialLives ?? this.config.startLives;
  }

  preload(): void {
    loadCatSprite(this, this.catSpriteUrl);
    EffectsManager.createParticleTexture(this);
  }

  create(): void {
    const { width, height } = this.scale;

    // Physics world
    this.physics.world.setBounds(0, 0, this.config.victoryDistance + 2000, this.config.generation.deathY + 200);

    // Effects manager
    this.effects = new EffectsManager(this);

    // Create managers
    this.background = new CityBackground(this, this.config);
    this.background.create();

    this.buildings = new BuildingGenerator(this, this.config);
    this.buildings.create();

    this.enemies = new EnemyManager(
      this, this.config, this.effects,
      () => this.buildings.getBuildings(),
    );
    this.enemies.create();

    this.hazards = new HazardManager(
      this, this.config,
      () => this.buildings.getBuildings(),
    );
    this.hazards.create();

    this.powerups = new PowerupManager(
      this, this.config, this.effects,
      () => this.buildings.getBuildings(),
      () => this.buildings.getFireEscapes(),
    );
    this.powerups.create();

    this.boss = new PigeonKingBoss(this, this.config, this.effects);
    this.boss.create();

    // Create player
    this.createPlayer();

    // Coins group (generated by BuildingGenerator in future — for now spawned alongside buildings)
    const coinGroup = this.createCoinGroup();

    // Collisions
    this.physics.add.collider(this.player, this.buildings.getRooftops(), () => this.onLand());
    this.physics.add.collider(this.player, this.buildings.getSecondaryPlatforms(), () => this.onLand());
    this.physics.add.collider(this.player, this.hazards.getStaticGroup());
    this.physics.add.collider(this.player, this.hazards.getClotheslineGroup(), () => this.onLand());

    // Overlaps
    this.physics.add.overlap(this.player, this.enemies.getGroup(), (_p, enemy) => {
      this.handleEnemyOverlap(enemy as Phaser.Physics.Arcade.Sprite);
    });
    this.physics.add.overlap(this.player, this.hazards.getBounceGroup(), (_p, dish) => {
      this.handleBounce(dish as Phaser.Physics.Arcade.Sprite);
    });
    this.physics.add.overlap(this.player, this.hazards.getDamageGroup(), (_p, hazard) => {
      this.handleNeonDamage(hazard);
    });
    this.physics.add.overlap(this.player, this.powerups.getGroup(), (_p, powerup) => {
      this.powerups.collectPowerup(powerup as Phaser.Physics.Arcade.Sprite);
    });
    this.physics.add.overlap(this.player, coinGroup, (_p, coin) => {
      this.collectCoin(coin as Phaser.Physics.Arcade.Sprite);
    });

    // Camera
    this.cameras.main.startFollow(this.player, true, 0.1, 0.1);
    this.cameras.main.setBounds(0, 0, this.config.victoryDistance + 2000, this.config.generation.deathY + 200);

    // Input
    this.cursors = this.input.keyboard!.createCursorKeys();
    this.spaceKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);

    // HUD
    this.distanceText = this.add.text(16, 16, '', {
      fontSize: '18px',
      fontFamily: '"Courier New", monospace',
      color: '#aaaacc',
    }).setScrollFactor(0).setDepth(DEPTH.HUD);

    // Initial state
    this.gameScore.lives = this.lives;
    this.emitScoreUpdate({ ...this.gameScore });
    this.emitStatusChange('PLAYING' as GameStatus);

    // Pause
    this.input.keyboard!.on('keydown-P', this.togglePause, this);
    this.input.keyboard!.on('keydown-ESC', this.togglePause, this);
  }

  update(time: number, delta: number): void {
    if (this.isGameOver || this.hasWon) return;
    if (this.scene.isPaused()) return;

    this.handleInput();
    this.updateDistance();

    // Update all managers
    this.background.update(time, delta);
    this.buildings.update(time, delta);
    this.enemies.update(time, delta);
    this.hazards.update(time, delta);
    this.powerups.update(time, delta);

    if (this.inBossArena) {
      this.boss.update(time, delta);
      if (this.boss.isDefeated() && !this.hasWon) {
        this.handleVictory();
      }
    }

    this.checkFallDeath();
    this.checkBossEntry();
    this.updateHud();
  }

  // ─── Player Creation ────────────────────────────────────────

  private createPlayer(): void {
    const hasCatTexture = this.textures.exists(CAT_TEXTURE_KEY);
    if (hasCatTexture) {
      this.player = this.physics.add.sprite(this.startX, this.config.generation.startY - 60, CAT_TEXTURE_KEY);
      this.player.setDisplaySize(PLAYER_WIDTH, PLAYER_HEIGHT);
    } else {
      const g = this.make.graphics({}, false);
      g.fillStyle(0xff8844);
      g.fillRoundedRect(0, 0, PLAYER_WIDTH, PLAYER_HEIGHT, 6);
      g.generateTexture('cat-fallback', PLAYER_WIDTH, PLAYER_HEIGHT);
      g.destroy();
      this.player = this.physics.add.sprite(this.startX, this.config.generation.startY - 60, 'cat-fallback');
    }

    this.player.setDepth(DEPTH.PLAYER);
    this.player.setCollideWorldBounds(false);
    this.player.body.setSize(PLAYER_WIDTH - 8, PLAYER_HEIGHT - 4);
    this.player.body.setGravityY(this.config.playerConfig.gravity);
  }

  private createCoinGroup(): Phaser.Physics.Arcade.StaticGroup {
    // Coins are managed by BuildingGenerator alongside building creation
    return this.buildings.getCoinGroup();
  }

  // ─── Input ──────────────────────────────────────────────────

  private handleInput(): void {
    const speed = this.config.playerConfig.moveSpeed;
    const body = this.player.body;

    this.isOnGround = body.blocked.down || body.touching.down;
    if (this.isOnGround) this.jumpCount = 0;

    // Dynamic max jumps (powerup)
    this.maxJumps = this.powerups.hasTripleJump() ? 3 : this.config.playerConfig.maxJumps;

    // Horizontal movement
    if (this.cursors.left.isDown) {
      body.setVelocityX(-speed);
      if (this.facingRight) { this.player.setFlipX(true); this.facingRight = false; }
    } else if (this.cursors.right.isDown) {
      body.setVelocityX(speed);
      if (!this.facingRight) { this.player.setFlipX(false); this.facingRight = true; }
    } else {
      body.setVelocityX(0);
    }

    // Jump
    const jumpJustPressed = Phaser.Input.Keyboard.JustDown(this.cursors.up) ||
                            Phaser.Input.Keyboard.JustDown(this.spaceKey);
    this.jumpHeld = this.cursors.up.isDown || this.spaceKey.isDown;

    if (jumpJustPressed && this.jumpCount < this.maxJumps) {
      body.setVelocityY(-this.config.playerConfig.jumpForce);
      this.jumpCount++;
      if (this.jumpCount === 1 && this.isOnGround) {
        this.effects.spawnDust(this.player.x, this.player.y + PLAYER_HEIGHT / 2, 1);
      }
    }

    // Glide (reduce gravity while holding jump + falling + has glide powerup)
    if (this.powerups.hasGlide() && this.jumpHeld && body.velocity.y > 0) {
      body.setGravityY(this.config.playerConfig.gravity * this.config.powerups.glideGravityMultiplier);
    } else {
      body.setGravityY(this.config.playerConfig.gravity);
    }

    // Squash/stretch
    if (!this.isOnGround) {
      const vy = body.velocity.y;
      if (vy < -100) this.player.setScale(0.85, 1.15);
      else if (vy > 100) this.player.setScale(1.1, 0.9);
    } else {
      this.player.setScale(1, 1);
    }
  }

  // ─── Collisions ─────────────────────────────────────────────

  private onLand(): void {
    if (this.player.body.velocity.y >= 0) this.jumpCount = 0;
  }

  private handleEnemyOverlap(enemySprite: Phaser.Physics.Arcade.Sprite): void {
    const result = this.enemies.handleOverlap(this.player, enemySprite, this.gameScore.multiplier);
    if (result.stomped) {
      // Bounce up after stomp
      this.player.body.setVelocityY(-this.config.playerConfig.jumpForce * 0.6);
      this.jumpCount = 0; // Reset jump — reward for stomping
      this.gameScore.current += result.points;
      this.gameScore.streak += 1;
      if (this.gameScore.streak % 5 === 0) {
        this.gameScore.multiplier = Math.min(this.gameScore.multiplier + 1, 5);
      }
      this.emitScoreUpdate({ ...this.gameScore });
    } else {
      this.handleDamage();
    }
  }

  private handleBounce(_dish: Phaser.Physics.Arcade.Sprite): void {
    this.player.body.setVelocityY(-this.config.playerConfig.jumpForce * BOUNCE_MULTIPLIER);
    this.jumpCount = 0;
    this.effects.shake(0.008, 80);
  }

  private handleNeonDamage(hazard: Phaser.GameObjects.GameObject): void {
    if (this.hazards.isNeonDangerous(hazard)) {
      this.handleDamage();
    }
  }

  private handleDamage(): void {
    // Shield absorbs one hit
    if (this.powerups.consumeShield()) {
      this.effects.flash(0x44ff88, 150);
      this.effects.spawnParticles(this.player.x, this.player.y, 0x44ff88, 8, 150);
      return;
    }

    this.lives -= 1;
    this.gameScore.lives = this.lives;
    this.gameScore.streak = 0;
    this.gameScore.multiplier = 1;

    this.effects.flash(0xff0000, 200);
    this.effects.shake(0.015, 150);
    this.emitLivesChanged(this.lives);
    this.emitScoreUpdate({ ...this.gameScore });

    if (this.lives <= 0) {
      this.isGameOver = true;
      this.emitGameOver(this.gameScore.current);
      return;
    }

    // Brief invincibility
    this.tweens.add({
      targets: this.player,
      alpha: 0.3, duration: 100, yoyo: true, repeat: 5,
      onComplete: () => this.player.setAlpha(1),
    });
  }

  private collectCoin(coinSprite: Phaser.Physics.Arcade.Sprite): void {
    const cx = coinSprite.x;
    const cy = coinSprite.y;
    coinSprite.destroy();

    this.gameScore.coins += 1;
    this.gameScore.streak += 1;
    if (this.gameScore.streak % 5 === 0) {
      this.gameScore.multiplier = Math.min(this.gameScore.multiplier + 1, 5);
    }
    this.gameScore.current += 10 * this.gameScore.multiplier;

    this.effects.floatingScore(cx, cy, `+${10 * this.gameScore.multiplier}`);
    this.effects.spawnParticles(cx, cy, 0xffdd44, 6, 120);
    this.emitScoreUpdate({ ...this.gameScore });
  }

  // ─── Distance & Victory ─────────────────────────────────────

  private updateDistance(): void {
    const newDist = Math.max(0, this.player.x - this.startX);
    if (newDist > this.distanceTraveled) {
      const delta = newDist - this.distanceTraveled;
      this.gameScore.current += Math.floor(delta * 0.1);
      this.distanceTraveled = newDist;
    }
  }

  private checkBossEntry(): void {
    if (this.inBossArena) return;
    if (this.distanceTraveled >= this.config.victoryDistance - 1000) {
      this.inBossArena = true;

      // Lock camera to boss arena
      const arenaX = this.startX + this.config.victoryDistance - 500;
      const arenaY = this.lastKnownRooftopY();
      this.boss.createArena(arenaX, arenaY);

      // Wire up boss collisions
      this.physics.add.overlap(this.player, this.boss.getBossSprite(), () => {
        if (this.boss.handleStomp()) {
          this.player.body.setVelocityY(-this.config.playerConfig.jumpForce * 0.7);
          this.jumpCount = 0;
          this.gameScore.current += 100;
          this.emitScoreUpdate({ ...this.gameScore });
        }
      });
      this.physics.add.overlap(this.player, this.boss.getFeatherGroup(), (_p, feather) => {
        (feather as Phaser.Physics.Arcade.Sprite).destroy();
        this.handleDamage();
      });
      this.physics.add.overlap(this.player, this.boss.getMiniPigeonGroup(), () => {
        this.handleDamage();
      });
    }
  }

  private lastKnownRooftopY(): number {
    const buildings = this.buildings.getBuildings();
    if (buildings.length === 0) return this.config.generation.startY;
    return buildings[buildings.length - 1].rooftopY;
  }

  private handleVictory(): void {
    this.hasWon = true;
    this.effects.spawnParticles(this.player.x, this.player.y, 0xffdd44, 20, 300);
    this.emitLevelComplete({
      levelId: 'ROOFTOPS',
      finalScore: this.gameScore.current,
      gameScore: { ...this.gameScore },
      victoryType: 'goal',
    });
  }

  // ─── Death ──────────────────────────────────────────────────

  private checkFallDeath(): void {
    if (this.inBossArena) return; // No fall death in boss arena
    if (this.player.y > this.config.generation.deathY) {
      this.handleFallDeath();
    }
  }

  private handleFallDeath(): void {
    this.lives -= 1;
    this.gameScore.lives = this.lives;
    this.gameScore.streak = 0;
    this.gameScore.multiplier = 1;

    this.effects.flash(0xff0000, 200);
    this.effects.shake(0.015, 150);
    this.emitLivesChanged(this.lives);
    this.emitScoreUpdate({ ...this.gameScore });

    if (this.lives <= 0) {
      this.isGameOver = true;
      this.emitGameOver(this.gameScore.current);
      return;
    }

    this.respawnPlayer();
  }

  private respawnPlayer(): void {
    const building = this.buildings.findNearestBuildingBehind(this.player.x);
    const respawnX = building ? building.x + building.width / 2 : this.startX;
    const respawnY = building ? building.rooftopY - PLAYER_HEIGHT - 10 : this.config.generation.startY - 60;

    this.player.setPosition(respawnX, respawnY);
    this.player.body.setVelocity(0, 0);
    this.jumpCount = 0;

    this.tweens.add({
      targets: this.player,
      alpha: 0.3, duration: 100, yoyo: true, repeat: 5,
      onComplete: () => this.player.setAlpha(1),
    });
  }

  // ─── HUD ────────────────────────────────────────────────────

  private updateHud(): void {
    if (this.inBossArena) {
      this.distanceText.setText(`BOSS — HP: ${this.boss.getHP()}/3`);
    } else {
      const pct = Math.min(100, (this.distanceTraveled / this.config.victoryDistance) * 100);
      this.distanceText.setText(`${Math.floor(pct)}% to penthouse`);
    }
  }

  // ─── Pause ──────────────────────────────────────────────────

  private togglePause(): void {
    if (this.isGameOver || this.hasWon) return;
    const paused = !this.scene.isPaused();
    if (paused) this.scene.pause(); else this.scene.resume();
    this.emitHudUpdate({ isPaused: paused });
  }

  // ─── Runtime Patch ──────────────────────────────────────────

  applyRuntimePatch(patch: Record<string, unknown>): void {
    if (typeof patch.isPaused === 'boolean') {
      if (patch.isPaused && !this.scene.isPaused()) this.scene.pause();
      else if (!patch.isPaused && this.scene.isPaused()) this.scene.resume();
    }
  }
}
```

- [ ] **Step 2: Verify build compiles**

Run: `npx tsc --noEmit`
Expected: No errors

- [ ] **Step 3: Test in browser**

Run: `npm run dev` — open http://localhost:3000, navigate to City Heights level. Verify:
- Buildings render as rooftops with facades (not floating slabs)
- Golden hour sky gradient
- Parallax background buildings
- Player can jump between rooftops
- Pigeons patrol on rooftops (Zone 1)
- AC units appear as obstacles
- Fall death + respawn works

- [ ] **Step 4: Commit**

```bash
git add scenes/PlatformerScene.ts
git commit -m "feat(rooftops): rewrite PlatformerScene as modular orchestrator with all managers"
```

---

### Task 9: SFX Integration

**Files:**
- Modify: `scenes/PlatformerScene.ts` (add PhaserAudio import and sound calls)

- [ ] **Step 1: Check PhaserAudio API**

Read `scenes/shared/PhaserAudio.ts` to verify the available API. The integration adds `PhaserAudio` instance to the scene and calls `play()` at each sound event.

- [ ] **Step 2: Add PhaserAudio to PlatformerScene**

At the top of `scenes/PlatformerScene.ts`, add import:

```ts
import { PhaserAudio } from './shared/PhaserAudio';
```

In the class, add a property:

```ts
private audio!: PhaserAudio;
```

In `create()`, after effects manager initialization:

```ts
this.audio = new PhaserAudio(this);
```

Then add sound calls at each event point:

- In `handleInput()` jump block: `this.audio.play('jump');`
- In `onLand()`: `this.audio.play('land');`
- In `handleEnemyOverlap()` stomp branch: `this.audio.play('stomp');`
- In `handleDamage()`: `this.audio.play('hurt');`
- In `handleFallDeath()`: `this.audio.play('death');`
- In `collectCoin()`: `this.audio.play('coin');`
- In `PowerupManager.collectPowerup()`: scene passes audio, calls `this.audio.play('powerup');`
- In `handleBounce()`: `this.audio.play('spring');`
- In `handleVictory()`: `this.audio.play('victory');`

- [ ] **Step 3: Verify build compiles**

Run: `npx tsc --noEmit`
Expected: No errors

- [ ] **Step 4: Commit**

```bash
git add scenes/PlatformerScene.ts
git commit -m "feat(rooftops): wire up SFX via PhaserAudio for all gameplay events"
```

---

### Task 10: Integration Testing + QA

**Files:**
- No new files — this is a testing and tuning pass

- [ ] **Step 1: Run full test suite**

Run: `npm run test:run`
Expected: All tests pass, including new `generation.test.ts` and `bossPhases.test.ts`

- [ ] **Step 2: Verify build**

Run: `npm run build`
Expected: Clean build, no errors

- [ ] **Step 3: Manual QA playthrough**

Open http://localhost:3000, play through City Heights end-to-end. Check:

**Zone 1 (0-4000px):**
- [ ] Buildings render with facades, windows, decorative props
- [ ] Rooftop is the collision surface (player lands on top, not inside building)
- [ ] Alleys between buildings — falling in = death + respawn
- [ ] Pigeons patrol on rooftops, stompable
- [ ] AC units block path, some blow steam
- [ ] Coins spawn on rooftops
- [ ] Score updates on coin collect and enemy stomp

**Zone 2 (4000-9000px):**
- [ ] Buildings narrower, gaps wider
- [ ] Rats appear — fast dash across rooftops
- [ ] Clotheslines span alleys (if they spawn)
- [ ] Satellite dishes bounce player up
- [ ] Fire escapes appear on building sides
- [ ] Powerup spawns near zone midpoint

**Zone 3 (9000-14000px):**
- [ ] Tight platforms, big gaps
- [ ] Raccoons charge when player approaches
- [ ] Neon signs flicker on/off — damage when lit
- [ ] All enemy types present

**Boss (14000-15000px):**
- [ ] Arena loads, camera locks
- [ ] Pigeon King swoops, drops feathers
- [ ] Boss lands briefly — stompable
- [ ] Phase 2: faster, mini pigeons spawn
- [ ] Phase 3: dive bombs, tiny stomp window
- [ ] 3 stomps = victory + level complete

**Powerups:**
- [ ] Triple Jump grants 3rd jump
- [ ] Glide reduces fall speed while holding jump
- [ ] Shield absorbs one hit

**General:**
- [ ] Parallax background scrolls properly
- [ ] Sky gradient visible (golden hour)
- [ ] SFX play for jump/land/stomp/coin/damage/death
- [ ] Pause (P/Esc) works
- [ ] Score/lives bridge to React HUD
- [ ] Game over on 0 lives
- [ ] Stars awarded at end based on score

- [ ] **Step 4: Tuning adjustments**

Based on playthrough, adjust values in `levels/rooftops.ts`:
- Gap sizes (too easy / too hard?)
- Enemy density (too crowded / too sparse?)
- Boss land durations (too generous / too tight?)
- Powerup durations
- Star thresholds

- [ ] **Step 5: Final commit**

```bash
git add -A
git commit -m "feat(rooftops): City Heights level complete — full QA pass and tuning"
```

- [ ] **Step 6: Run full test suite one more time**

Run: `npm run test:run`
Expected: All tests pass, 0 failures
