# Phaser ↔ DOM Engine Y Coordinate Conversion

> **Category:** rendering-bug
> **Created:** 2026-03-22
> **Keywords:** phaser, coordinates, Y position, groundY, rendering, DOM engine, screen space

## Symptoms

- Ground obstacles (crab, beachball, sandcastle) float ~100px above the ground
- Shell bullets fire but appear invisible or miss the boss
- Boss defeat poop animation renders in wrong position
- Sand Monster floats above ground level
- Any entity using `groundYScreen - entityY` renders too high

## Root Cause

The DOM engine and Phaser use different Y coordinate systems:

| System | Y=0 | Y=groundY (100) | Y>groundY |
|--------|-----|------------------|-----------|
| **DOM engine (collision)** | Canvas bottom | Ground plane | Airborne |
| **Player coords** | Ground plane | 100px airborne | Higher |

The Phaser port used `screenY = groundYScreen - entityY` which treats `entityY` as "pixels above ground zero." But in the DOM engine, `entityY = groundY` means "at ground level," not "100px above ground."

## Solution

For **entity/obstacle/boss coordinates** (where y=groundY means "at ground"):
```typescript
// WRONG — shifts everything up by groundY pixels
const screenY = this.groundYScreen - entityY - (height * scale);

// CORRECT — subtract groundY offset so y=groundY maps to ground line
const screenY = this.groundYScreen - (entityY - this.themeGroundY) - (height * scale);
```

For **player coordinates** (where y=0 means "at ground"):
```typescript
// CORRECT — player uses y=0 as ground, no offset needed
const renderY = this.groundYScreen - this.playerY;
```

For **bullets** (spawned at `themeGroundY + playerY + offset`, i.e., collision coords):
```typescript
// CORRECT — bullets are in collision coords, need the offset
const screenY = this.groundYScreen - (bullet.y - this.themeGroundY);
```

## Locations Fixed (8 total in RunnerScene.ts)

1. `createObstacleGraphics()` — obstacle initial render
2. `updateObstacleSprite()` — obstacle position updates
3. `updateCollisions()` — collision effect screen positions
4. Boss sprite creation (`triggerBossFight`)
5. `drawBoss()` — boss sprite + health bar updates
6. Boss face Y for particle effects
7. `shootShell()` — bullet initial render
8. `updateBullets()` — bullet position updates + hit effects
9. Defeat poop animation rendering

## Key Rule

**Two coordinate systems coexist:**
- **Entity/collision coords:** `y = groundY` (100) = at ground. Use `- (y - themeGroundY)`.
- **Player coords:** `y = 0` = at ground. Use `- playerY` directly.

When adding new rendering code, check which system the Y value comes from before choosing the formula.
