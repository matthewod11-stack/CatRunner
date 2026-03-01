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
