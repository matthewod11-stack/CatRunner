export const BOSS_AMMO_REFILL_INTERVAL_MS = 1800;
export const BOSS_MIN_REFILL_AMMO = 2;
export const BOSS_STARTING_AMMO_BUFFER = 1;

export function getRequiredBossShellHits(bossHealth: number, damagePerShell: number): number {
  if (damagePerShell <= 0) return 0;
  return Math.ceil(bossHealth / damagePerShell);
}

export function getBossStartingShellAmmo(
  currentAmmo: number,
  bossHealth: number,
  damagePerShell: number
): number {
  return Math.max(
    currentAmmo,
    getRequiredBossShellHits(bossHealth, damagePerShell) + BOSS_STARTING_AMMO_BUFFER,
  );
}

export function shouldRefillBossShellAmmo({
  ammo,
  bossAttackStartTime,
  isDefeating,
  lastRefillAt,
  now,
}: {
  ammo: number;
  bossAttackStartTime: number;
  isDefeating: boolean;
  lastRefillAt: number;
  now: number;
}): boolean {
  if (isDefeating) return false;
  if (now < bossAttackStartTime) return false;
  if (ammo >= BOSS_MIN_REFILL_AMMO) return false;
  return lastRefillAt === 0 || now - lastRefillAt >= BOSS_AMMO_REFILL_INTERVAL_MS;
}
