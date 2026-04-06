export interface StickyPawsState {
  activeUntilMs: number | null;
}

export function createStickyState(): StickyPawsState {
  return { activeUntilMs: null };
}

export function activateSticky(
  state: StickyPawsState,
  nowMs: number,
  durationMs: number,
): void {
  const next = nowMs + durationMs;
  if (state.activeUntilMs === null || next > state.activeUntilMs) {
    state.activeUntilMs = next;
  }
}

export function isStickyActive(state: StickyPawsState, nowMs: number): boolean {
  return state.activeUntilMs !== null && nowMs < state.activeUntilMs;
}

export function deactivateSticky(state: StickyPawsState): void {
  state.activeUntilMs = null;
}
