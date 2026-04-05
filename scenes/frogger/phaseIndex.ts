/**
 * crossingsCompleted = market goals already finished this run.
 * First attempt: 0 → phase 0. After first crossing: 1 → phase 1 (capped at last).
 */
export function activePhaseIndex(
  crossingsCompleted: number,
  phaseCount: number
): number {
  if (phaseCount <= 0) return 0;
  return Math.min(Math.max(0, crossingsCompleted), phaseCount - 1);
}
