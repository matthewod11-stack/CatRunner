import type { WorldEntity } from '../types';

/**
 * Compute the Y position for a swooping seagull based on its X position.
 * Uses ease-in-out cubic easing for smooth dive-and-recover trajectory.
 */
export function computeSwoopY(obsX: number, screenWidth: number): number {
  const centerX = screenWidth / 2;
  const swoopStartY = 280;
  const swoopLowY = 150;
  const swoopEndY = 200;

  const easeInOutCubic = (t: number): number =>
    t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

  if (obsX > centerX) {
    const distFromCenter = Math.abs(obsX - centerX);
    const prog = Math.min(distFromCenter / centerX, 1);
    const eased = easeInOutCubic(prog);
    return swoopStartY + (swoopLowY - swoopStartY) * eased;
  } else {
    const upProg = (centerX - obsX) / centerX;
    const eased = easeInOutCubic(upProg);
    return swoopLowY + (swoopEndY - swoopLowY) * eased;
  }
}

/**
 * Check if a poop-type seagull should drop a projectile this frame.
 * Returns a new SAND_PROJECTILE entity if the drop interval has elapsed, else null.
 * Caller is responsible for:
 *   - pushing the returned entity into the obstacles array
 *   - updating obs.lastPoopTime = now
 *   - updating lastHarmfulSpawnTime = now
 */
export function checkPoopDrop(
  obs: WorldEntity,
  now: number,
  lowLivesMode: boolean,
  canSpawnPoop: boolean
): WorldEntity | null {
  if (obs.type !== 'SEAGULL' || obs.seagullType !== 'poop' || !obs.lastPoopTime || !canSpawnPoop) {
    return null;
  }

  const timeSinceLastPoop = now - obs.lastPoopTime;
  const delayBase = lowLivesMode ? 2600 : 2000;
  const delayRange = lowLivesMode ? 1200 : 1000;

  if (timeSinceLastPoop <= delayBase + Math.random() * delayRange) {
    return null;
  }

  const seagullX = obs.x + obs.width / 2;
  const seagullY = obs.y ?? 220;

  return {
    id: Date.now() + Math.random(),
    type: 'SAND_PROJECTILE',
    x: seagullX,
    y: seagullY,
    width: 60,
    height: 60,
    speed: 0,
    vx: 0,
    vy: 2 + Math.random() * 2,
    rotation: 0,
    isPassed: false,
  };
}
