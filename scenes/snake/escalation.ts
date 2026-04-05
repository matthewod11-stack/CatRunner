export function moveIntervalAfterElapsed(
  base: number,
  min: number,
  elapsedMs: number,
  speedStepEveryMs: number,
  speedStepAmount: number
): number {
  if (speedStepEveryMs <= 0) return base;
  const steps = Math.floor(elapsedMs / speedStepEveryMs);
  return Math.max(min, base - steps * speedStepAmount);
}

export function shouldAddExtraWallNow(
  elapsedMs: number,
  prevElapsedMs: number,
  extraWallAtElapsedMs: number[]
): boolean {
  return extraWallAtElapsedMs.some(
    (t) => t > prevElapsedMs && t <= elapsedMs
  );
}
