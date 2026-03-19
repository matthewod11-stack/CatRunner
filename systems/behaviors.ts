import type { ObstacleType, WorldEntity } from '../types';

/** Resolved swoop Y anchors (from level `swoop` behavior `config` or defaults). */
export interface SwoopYParams {
  swoopStartY: number;
  swoopLowY: number;
  swoopEndY: number;
}

/**
 * Compute the Y position for a swooping seagull based on its X position.
 * Uses ease-in-out cubic easing for smooth dive-and-recover trajectory.
 */
export function computeSwoopY(
  obsX: number,
  screenWidth: number,
  params?: Partial<SwoopYParams>
): number {
  const swoopStartY = params?.swoopStartY ?? 400;
  const swoopLowY = params?.swoopLowY ?? 170;
  const swoopEndY = params?.swoopEndY ?? 280;

  const centerX = screenWidth / 2;

  const easeInOutCubic = (t: number): number =>
    t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

  if (obsX > centerX) {
    const distFromCenter = Math.abs(obsX - centerX);
    const prog = Math.min(distFromCenter / centerX, 1);
    const eased = easeInOutCubic(prog);
    return swoopStartY + (swoopLowY - swoopStartY) * eased;
  }
  const upProg = (centerX - obsX) / centerX;
  const eased = easeInOutCubic(upProg);
  return swoopLowY + (swoopEndY - swoopLowY) * eased;
}

export interface DropProjectileSpawnSpec {
  type: ObstacleType;
  width: number;
  height: number;
  poopDelayBase?: number;
  poopDelayRange?: number;
  poopDelayBaseLowLives?: number;
  poopDelayRangeLowLives?: number;
}

/**
 * Check if a dropProjectile-variant flyer should spawn a falling projectile this frame.
 * `spec` comes from level config (`resolveDropProjectileSpec`); pass null if the level does not define drops.
 */
export function checkPoopDrop(
  obs: WorldEntity,
  now: number,
  lowLivesMode: boolean,
  canSpawnPoop: boolean,
  spec: DropProjectileSpawnSpec | null
): WorldEntity | null {
  if (
    !spec ||
    obs.type !== 'SEAGULL' ||
    obs.seagullType !== 'poop' ||
    !obs.lastPoopTime ||
    !canSpawnPoop
  ) {
    return null;
  }

  const timeSinceLastPoop = now - obs.lastPoopTime;
  const delayBase = lowLivesMode
    ? spec.poopDelayBaseLowLives ?? 2600
    : spec.poopDelayBase ?? 2000;
  const delayRange = lowLivesMode
    ? spec.poopDelayRangeLowLives ?? 1200
    : spec.poopDelayRange ?? 1000;

  if (timeSinceLastPoop <= delayBase + Math.random() * delayRange) {
    return null;
  }

  const seagullX = obs.x + obs.width / 2;
  const seagullY = obs.y ?? 220;

  return {
    id: Date.now() + Math.random(),
    type: spec.type,
    x: seagullX,
    y: seagullY,
    width: spec.width,
    height: spec.height,
    speed: 0,
    vx: 0,
    vy: -(2 + Math.random() * 2),
    rotation: 0,
    isPassed: false,
  };
}
