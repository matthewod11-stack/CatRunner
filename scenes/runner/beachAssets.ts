import airplaneFireUrl from '../../assets/sprites/beach/entities/airplane-fire.svg?url';
import airplaneUrl from '../../assets/sprites/beach/entities/airplane.svg?url';
import beachballUrl from '../../assets/sprites/beach/obstacles/beachball.svg?url';
import boatSinkingUrl from '../../assets/sprites/beach/entities/boat-sinking.svg?url';
import boatUrl from '../../assets/sprites/beach/entities/boat.svg?url';
import cloud1Url from '../../assets/sprites/beach/environment/cloud-1.svg?url';
import cloud2Url from '../../assets/sprites/beach/environment/cloud-2.svg?url';
import coinUrl from '../../assets/sprites/beach/collectibles/coin.svg?url';
import crab1Url from '../../assets/sprites/beach/obstacles/crab-1.svg?url';
import crab2Url from '../../assets/sprites/beach/obstacles/crab-2.svg?url';
import jetskiUrl from '../../assets/sprites/beach/entities/jetski.svg?url';
import magnetPowerupUrl from '../../assets/sprites/beach/fx/magnet-powerup.svg?url';
import oceanTileUrl from '../../assets/sprites/beach/environment/ocean-tile.svg?url';
import palmTreeUrl from '../../assets/sprites/beach/obstacles/palm-tree.svg?url';
import sandMonsterAttackUrl from '../../assets/sprites/beach/boss/sand-monster-attack.svg?url';
import sandMonsterDefeatUrl from '../../assets/sprites/beach/boss/sand-monster-defeat.svg?url';
import sandMonsterHitUrl from '../../assets/sprites/beach/boss/sand-monster-hit.svg?url';
import sandMonsterIdleUrl from '../../assets/sprites/beach/boss/sand-monster-idle.svg?url';
import sandProjectileUrl from '../../assets/sprites/beach/fx/sand-projectile.svg?url';
import sandTileUrl from '../../assets/sprites/beach/environment/sand-tile.svg?url';
import sandcastleUrl from '../../assets/sprites/beach/obstacles/sandcastle.svg?url';
import seagull1Url from '../../assets/sprites/beach/obstacles/seagull-1.svg?url';
import seagull2Url from '../../assets/sprites/beach/obstacles/seagull-2.svg?url';
import shellProjectileUrl from '../../assets/sprites/beach/fx/shell-projectile.svg?url';
import shellUrl from '../../assets/sprites/beach/collectibles/shell.svg?url';
import skyUrl from '../../assets/sprites/beach/environment/sky.svg?url';
import speedPowerupUrl from '../../assets/sprites/beach/fx/speed-powerup.svg?url';
import sunUrl from '../../assets/sprites/beach/environment/sun.svg?url';
import superSizePowerupUrl from '../../assets/sprites/beach/fx/super-size-powerup.svg?url';
import surferUrl from '../../assets/sprites/beach/entities/surfer.svg?url';
import tidepoolUrl from '../../assets/sprites/beach/obstacles/tidepool.svg?url';
import waterlineFoamUrl from '../../assets/sprites/beach/environment/waterline-foam.svg?url';

export interface BeachImageAsset {
  key: string;
  path: string;
}

export const BEACH_BOSS_TEXTURES = {
  idle: 'boss',
  attack: 'boss-attack',
  hit: 'boss-hit',
  defeat: 'boss-defeat',
} as const;

export const BEACH_OBSTACLE_TEXTURES: Record<string, string> = {
  CRAB: 'obs-CRAB',
  COIN: 'obs-COIN',
  SEAGULL: 'obs-SEAGULL',
  BEACHBALL: 'obs-BEACHBALL',
  SHELL: 'obs-SHELL',
  SANDCASTLE: 'obs-SANDCASTLE',
  TIDEPOOL: 'obs-TIDEPOOL',
  PALM_TREE: 'obs-PALM_TREE',
  SAND_PROJECTILE: 'obs-SAND_PROJECTILE',
  SPEED: 'obs-SPEED',
  MAGNET: 'obs-MAGNET',
  SUPER_SIZE: 'obs-SUPER_SIZE',
};

export const BEACH_OBSTACLE_VARIANTS: Record<string, readonly string[]> = {
  CRAB: ['obs-CRAB', 'obs-CRAB-2'],
  SEAGULL: ['obs-SEAGULL', 'obs-SEAGULL-2'],
};

export const BEACH_BACKGROUND_TEXTURES: Record<string, string> = {
  BOAT: 'bg-boat',
  BOAT_SINKING: 'bg-boat-sinking',
  AIRPLANE: 'bg-airplane',
  AIRPLANE_FIRE: 'bg-airplane-fire',
  SURFER: 'bg-surfer',
  JETSKI: 'bg-jetski',
  CLOUD: 'env-cloud-1',
};

export const BEACH_SHELL_PROJECTILE_TEXTURE = 'obs-SHELL_PROJECTILE';

export const BEACH_IMAGE_LOADS: readonly BeachImageAsset[] = [
  { key: 'env-sky', path: skyUrl },
  { key: 'env-sun', path: sunUrl },
  { key: 'env-cloud-1', path: cloud1Url },
  { key: 'env-cloud-2', path: cloud2Url },
  { key: 'env-ocean', path: oceanTileUrl },
  { key: 'env-foam', path: waterlineFoamUrl },
  { key: 'env-sand', path: sandTileUrl },
  { key: 'obs-CRAB', path: crab1Url },
  { key: 'obs-CRAB-2', path: crab2Url },
  { key: 'obs-COIN', path: coinUrl },
  { key: 'obs-SEAGULL', path: seagull1Url },
  { key: 'obs-SEAGULL-2', path: seagull2Url },
  { key: 'obs-BEACHBALL', path: beachballUrl },
  { key: 'obs-SHELL', path: shellUrl },
  { key: BEACH_SHELL_PROJECTILE_TEXTURE, path: shellProjectileUrl },
  { key: 'obs-SANDCASTLE', path: sandcastleUrl },
  { key: 'obs-TIDEPOOL', path: tidepoolUrl },
  { key: 'obs-PALM_TREE', path: palmTreeUrl },
  { key: 'obs-SAND_PROJECTILE', path: sandProjectileUrl },
  { key: 'obs-SPEED', path: speedPowerupUrl },
  { key: 'obs-MAGNET', path: magnetPowerupUrl },
  { key: 'obs-SUPER_SIZE', path: superSizePowerupUrl },
  { key: 'bg-boat', path: boatUrl },
  { key: 'bg-boat-sinking', path: boatSinkingUrl },
  { key: 'bg-airplane', path: airplaneUrl },
  { key: 'bg-airplane-fire', path: airplaneFireUrl },
  { key: 'bg-surfer', path: surferUrl },
  { key: 'bg-jetski', path: jetskiUrl },
  { key: BEACH_BOSS_TEXTURES.idle, path: sandMonsterIdleUrl },
  { key: BEACH_BOSS_TEXTURES.attack, path: sandMonsterAttackUrl },
  { key: BEACH_BOSS_TEXTURES.hit, path: sandMonsterHitUrl },
  { key: BEACH_BOSS_TEXTURES.defeat, path: sandMonsterDefeatUrl },
];
