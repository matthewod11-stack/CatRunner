import pigeonKingAttackUrl from '../../assets/sprites/rooftops/boss/pigeon-king-attack.png?url';
import pigeonKingDefeatUrl from '../../assets/sprites/rooftops/boss/pigeon-king-defeat.png?url';
import pigeonKingHitUrl from '../../assets/sprites/rooftops/boss/pigeon-king-hit.png?url';
import pigeonKingIdleUrl from '../../assets/sprites/rooftops/boss/pigeon-king-idle.png?url';
import pigeonKingLandedUrl from '../../assets/sprites/rooftops/boss/pigeon-king-landed.png?url';
import pigeonKingSwoopUrl from '../../assets/sprites/rooftops/boss/pigeon-king-swoop.png?url';
import coinUrl from '../../assets/sprites/rooftops/collectibles/coin.png?url';
import fireEscapeUrl from '../../assets/sprites/rooftops/entities/fire-escape.png?url';
import buildingFacadeTileUrl from '../../assets/sprites/rooftops/environment/building-facade-tile.png?url';
import farSkylineUrl from '../../assets/sprites/rooftops/environment/far-skyline.png?url';
import midSkylineUrl from '../../assets/sprites/rooftops/environment/mid-skyline.png?url';
import rooftopCapUrl from '../../assets/sprites/rooftops/environment/rooftop-cap.png?url';
import skyUrl from '../../assets/sprites/rooftops/environment/sky.png?url';
import featherProjectileUrl from '../../assets/sprites/rooftops/fx/feather-projectile.png?url';
import glidePowerupUrl from '../../assets/sprites/rooftops/fx/glide-powerup.png?url';
import shieldBubbleUrl from '../../assets/sprites/rooftops/fx/shield-bubble.png?url';
import shieldPowerupUrl from '../../assets/sprites/rooftops/fx/shield-powerup.png?url';
import steamPuffUrl from '../../assets/sprites/rooftops/fx/steam-puff.png?url';
import tripleJumpPowerupUrl from '../../assets/sprites/rooftops/fx/triple-jump-powerup.png?url';
import acUnitUrl from '../../assets/sprites/rooftops/obstacles/ac-unit.png?url';
import clotheslineUrl from '../../assets/sprites/rooftops/obstacles/clothesline.png?url';
import neonSignOffUrl from '../../assets/sprites/rooftops/obstacles/neon-sign-off.png?url';
import neonSignOnUrl from '../../assets/sprites/rooftops/obstacles/neon-sign-on.png?url';
import pigeonUrl from '../../assets/sprites/rooftops/obstacles/pigeon.png?url';
import raccoonChargeUrl from '../../assets/sprites/rooftops/obstacles/raccoon-charge.png?url';
import raccoonIdleUrl from '../../assets/sprites/rooftops/obstacles/raccoon-idle.png?url';
import ratUrl from '../../assets/sprites/rooftops/obstacles/rat.png?url';
import satelliteDishUrl from '../../assets/sprites/rooftops/obstacles/satellite-dish.png?url';
import type { PlatformerEnemyType, PlatformerHazardType, PlatformerPowerupType } from './types';

export interface RooftopsImageAsset {
  key: string;
  path: string;
}

export const ROOFTOPS_BACKGROUND_TEXTURES = {
  sky: 'rooftops-sky',
  farSkyline: 'rooftops-far-skyline',
  midSkyline: 'rooftops-mid-skyline',
  buildingFacadeTile: 'rooftops-building-facade-tile',
  rooftopCap: 'rooftops-rooftop-cap',
} as const;

export const ROOFTOPS_ENTITY_TEXTURES = {
  fireEscape: 'rooftops-fire-escape',
} as const;

export const ROOFTOPS_ENEMY_TEXTURES: Record<PlatformerEnemyType, string> = {
  PIGEON: 'rooftops-enemy-pigeon',
  RAT: 'rooftops-enemy-rat',
  RACCOON: 'rooftops-enemy-raccoon-idle',
};

export const ROOFTOPS_ENEMY_VARIANTS = {
  RACCOON: {
    idle: 'rooftops-enemy-raccoon-idle',
    charge: 'rooftops-enemy-raccoon-charge',
  },
} as const;

export const ROOFTOPS_HAZARD_TEXTURES: Record<PlatformerHazardType, string> = {
  AC_UNIT: 'rooftops-hazard-ac-unit',
  CLOTHESLINE: 'rooftops-hazard-clothesline',
  SATELLITE_DISH: 'rooftops-hazard-satellite-dish',
  NEON_SIGN: 'rooftops-hazard-neon-on',
};

export const ROOFTOPS_NEON_TEXTURES = {
  on: 'rooftops-hazard-neon-on',
  off: 'rooftops-hazard-neon-off',
} as const;

export const ROOFTOPS_COLLECTIBLE_TEXTURES = {
  coin: 'rooftops-coin',
} as const;

export const ROOFTOPS_POWERUP_TEXTURES: Record<PlatformerPowerupType, string> = {
  TRIPLE_JUMP: 'rooftops-powerup-triple-jump',
  GLIDE: 'rooftops-powerup-glide',
  SHIELD: 'rooftops-powerup-shield',
};

export const ROOFTOPS_FX_TEXTURES = {
  steamPuff: 'rooftops-fx-steam-puff',
  shieldBubble: 'rooftops-fx-shield-bubble',
  featherProjectile: 'rooftops-fx-feather-projectile',
} as const;

export const ROOFTOPS_BOSS_TEXTURES = {
  idle: 'rooftops-boss-pigeon-king-idle',
  swoop: 'rooftops-boss-pigeon-king-swoop',
  landed: 'rooftops-boss-pigeon-king-landed',
  attack: 'rooftops-boss-pigeon-king-attack',
  hit: 'rooftops-boss-pigeon-king-hit',
  defeat: 'rooftops-boss-pigeon-king-defeat',
} as const;

export const ROOFTOPS_IMAGE_LOADS: readonly RooftopsImageAsset[] = [
  { key: ROOFTOPS_BACKGROUND_TEXTURES.sky, path: skyUrl },
  { key: ROOFTOPS_BACKGROUND_TEXTURES.farSkyline, path: farSkylineUrl },
  { key: ROOFTOPS_BACKGROUND_TEXTURES.midSkyline, path: midSkylineUrl },
  { key: ROOFTOPS_BACKGROUND_TEXTURES.buildingFacadeTile, path: buildingFacadeTileUrl },
  { key: ROOFTOPS_BACKGROUND_TEXTURES.rooftopCap, path: rooftopCapUrl },
  { key: ROOFTOPS_ENTITY_TEXTURES.fireEscape, path: fireEscapeUrl },
  { key: ROOFTOPS_ENEMY_TEXTURES.PIGEON, path: pigeonUrl },
  { key: ROOFTOPS_ENEMY_TEXTURES.RAT, path: ratUrl },
  { key: ROOFTOPS_ENEMY_VARIANTS.RACCOON.idle, path: raccoonIdleUrl },
  { key: ROOFTOPS_ENEMY_VARIANTS.RACCOON.charge, path: raccoonChargeUrl },
  { key: ROOFTOPS_HAZARD_TEXTURES.AC_UNIT, path: acUnitUrl },
  { key: ROOFTOPS_HAZARD_TEXTURES.CLOTHESLINE, path: clotheslineUrl },
  { key: ROOFTOPS_HAZARD_TEXTURES.SATELLITE_DISH, path: satelliteDishUrl },
  { key: ROOFTOPS_NEON_TEXTURES.on, path: neonSignOnUrl },
  { key: ROOFTOPS_NEON_TEXTURES.off, path: neonSignOffUrl },
  { key: ROOFTOPS_COLLECTIBLE_TEXTURES.coin, path: coinUrl },
  { key: ROOFTOPS_POWERUP_TEXTURES.TRIPLE_JUMP, path: tripleJumpPowerupUrl },
  { key: ROOFTOPS_POWERUP_TEXTURES.GLIDE, path: glidePowerupUrl },
  { key: ROOFTOPS_POWERUP_TEXTURES.SHIELD, path: shieldPowerupUrl },
  { key: ROOFTOPS_FX_TEXTURES.shieldBubble, path: shieldBubbleUrl },
  { key: ROOFTOPS_FX_TEXTURES.steamPuff, path: steamPuffUrl },
  { key: ROOFTOPS_FX_TEXTURES.featherProjectile, path: featherProjectileUrl },
  { key: ROOFTOPS_BOSS_TEXTURES.idle, path: pigeonKingIdleUrl },
  { key: ROOFTOPS_BOSS_TEXTURES.swoop, path: pigeonKingSwoopUrl },
  { key: ROOFTOPS_BOSS_TEXTURES.landed, path: pigeonKingLandedUrl },
  { key: ROOFTOPS_BOSS_TEXTURES.attack, path: pigeonKingAttackUrl },
  { key: ROOFTOPS_BOSS_TEXTURES.hit, path: pigeonKingHitUrl },
  { key: ROOFTOPS_BOSS_TEXTURES.defeat, path: pigeonKingDefeatUrl },
];

export const ROOFTOPS_PIXELATED_TEXTURE_KEYS = ROOFTOPS_IMAGE_LOADS.map(asset => asset.key);
