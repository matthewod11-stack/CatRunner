import { describe, it, expect } from 'vitest';
import { afterReachingGoal } from './crossingStateMachine';

describe('afterReachingGoal', () => {
  it('continues when more crossings required', () => {
    expect(afterReachingGoal({ crossingsCompleted: 0, crossingsToWin: 3 })).toEqual({
      type: 'continue',
      nextCrossings: 1,
    });
  });
  it('victory on final crossing', () => {
    expect(afterReachingGoal({ crossingsCompleted: 2, crossingsToWin: 3 })).toEqual({
      type: 'victory',
    });
  });
});
