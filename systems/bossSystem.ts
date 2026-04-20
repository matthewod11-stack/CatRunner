import type { BossConfig, Obstacle, ObstacleType } from '../types';
export function computeBossProjectileSpawnRate(
  healthPercent: number,
  bossCfg: BossConfig,
  introProgress: number,
  lowLives: boolean
): number {
  const pr = bossCfg.projectile.spawnRateByHealth;
  const baseSpawnRate =
    healthPercent < 0.3 ? pr.low : healthPercent < 0.6 ? pr.mid : pr.high;
  let spawnRate = baseSpawnRate * (0.55 + introProgress * 0.45);
  if (lowLives) spawnRate *= 0.82;
  return Math.max(0.18, Math.min(0.75, spawnRate));
}

export function createBossProjectileObstacle(params: {
  boss: Obstacle;
  groundY: number;
  playerY: number;
  bossCfg: BossConfig;
  healthPercent: number;
  introProgress: number;
  lowLives: boolean;
  projWidth: number;
  projHeight: number;
  projectileType: ObstacleType;
  /** Screen X the projectile aims toward (e.g. `resolvePlayerAnchor(theme).projectileAimX`). */
  projectileAimX: number;
}): Obstacle {
  const {
    boss,
    groundY,
    playerY,
    bossCfg,
    healthPercent,
    introProgress,
    lowLives,
    projWidth,
    projHeight,
    projectileType,
    projectileAimX,
  } = params;

  const bossFaceX = boss.x + boss.width * 0.5;
  const bossFaceY = (boss.y ?? 0) + boss.height * 0.85;

  const kittyX = projectileAimX;
  const kittyY = groundY + playerY + 50;
  const dx = kittyX - bossFaceX;
  const dy = kittyY - bossFaceY;
  const verticalOffset = dy * 0.3;

  const accuracy = healthPercent < 0.3 ? 0.85 : healthPercent < 0.6 ? 0.9 : 0.95;
  const angleVariation = (1 - accuracy) * 0.25;
  const baseAngle = Math.atan2(verticalOffset, dx);
  const angle = baseAngle + (Math.random() - 0.5) * angleVariation;

  const baseSpeed =
    bossCfg.projectile.baseSpeed + Math.random() * bossCfg.projectile.speedRange;
  const introSpeedScale = 0.78 + introProgress * 0.22;
  const livesSpeedScale = lowLives ? 0.85 : 1.0;
  const healthSpeedScale = healthPercent < 0.3 ? 1.2 : 1.0;
  const speed = baseSpeed * introSpeedScale * livesSpeedScale * healthSpeedScale;
  const vx = Math.cos(angle) * speed;
  const vy = Math.sin(angle) * speed * 0.4;

  return {
    id: Date.now() + Math.random(),
    type: projectileType,
    x: bossFaceX,
    y: bossFaceY,
    width: projWidth,
    height: projHeight,
    speed: vx,
    vx,
    vy,
    rotation: 0,
    isPassed: false,
  };
}

export function bossFacingFromProjectileAim(dx: number): 'left' | 'right' {
  return dx < 0 ? 'left' : 'right';
}

export function computeBossWorldPose(params: {
  time: number;
  windowInnerWidth: number;
  groundY: number;
  bossCfg: BossConfig;
  bossHealth: number;
}): { x: number; y: number; facingDelta: number } {
  const { time, windowInnerWidth, groundY, bossCfg, bossHealth } = params;
  const healthPercent = bossHealth / bossCfg.health;
  const swayAmount =
    healthPercent < 0.3
      ? bossCfg.movement.swayAmountLow
      : bossCfg.movement.swayAmountNormal;
  const horizontalSway =
    Math.sin(time / bossCfg.movement.swayFrequency) * swayAmount;
  const baseX = windowInnerWidth - 450;
  const bob =
    groundY +
    bossCfg.spawnYOffset -
    bossCfg.movement.bobAmplitude +
    Math.sin(time / bossCfg.movement.bobFrequency) * bossCfg.movement.bobAmplitude;
  const x = Math.max(windowInnerWidth - 500, baseX + horizontalSway);
  return { x, y: bob, facingDelta: horizontalSway };
}

export function facingFromBossSway(horizontalSway: number): 'left' | 'right' | null {
  if (horizontalSway > 5) return 'right';
  if (horizontalSway < -5) return 'left';
  return null;
}
