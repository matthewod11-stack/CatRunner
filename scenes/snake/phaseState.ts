export type SnakeRunPhase = 'normal' | 'finale' | 'won';

export interface PhaseStateInput {
  elapsedMs: number;
  normalPhaseMs: number;
  finaleDurationMs: number;
  finaleStarted: boolean;
}

/**
 * `elapsedMs` = scene time.now - runStartTime (wall clock, not paused-adjusted in v1).
 * When normal phase ends, caller sets `finaleStarted` true and resets a finale-local timer;
 * this function only needs finale elapsed for win check.
 */
export function resolvePhase(input: PhaseStateInput, finaleElapsedMs: number): SnakeRunPhase {
  if (!input.finaleStarted) {
    return input.elapsedMs >= input.normalPhaseMs ? 'finale' : 'normal';
  }
  if (finaleElapsedMs >= input.finaleDurationMs) return 'won';
  return 'finale';
}

export function shouldEnterFinale(elapsedMs: number, normalPhaseMs: number, finaleStarted: boolean): boolean {
  return !finaleStarted && elapsedMs >= normalPhaseMs;
}
