import { describe, it, expect } from 'vitest';
import { pickLongestPatrolSegment, stepPatrol, type PatrolSegment, type PatrolState } from './patrolPath';

function segmentLen(seg: PatrolSegment): number {
  return seg.b - seg.a + 1;
}

describe('pickLongestPatrolSegment', () => {
  it('empty 5×5 interior yields a segment with length at least 3 on a middle row or column', () => {
    const seg = pickLongestPatrolSegment(5, 5, new Set(), () => 0);
    expect(seg).not.toBeNull();
    expect(segmentLen(seg!)).toBeGreaterThanOrEqual(3);
  });

  it('wall blocking the middle of the only long corridor shortens the max run', () => {
    // 8×8 grid: interior is 6×6; only row 2 (r=2) is walkable except we wall every other interior cell.
    const onlyRow2Open = new Set<string>();
    for (let r = 1; r < 7; r++) {
      if (r === 2) continue;
      for (let c = 1; c < 7; c++) {
        onlyRow2Open.add(`${c},${r}`);
      }
    }
    const baseline = pickLongestPatrolSegment(8, 8, onlyRow2Open, () => 0);
    expect(baseline).not.toBeNull();
    expect(baseline!.axis).toBe('row');
    expect(baseline!.fixed).toBe(2);
    expect(segmentLen(baseline!)).toBe(6);

    // Wall at (3,2) splits row 2 into lengths 2 and 3; best becomes 3.
    const split = new Set(onlyRow2Open);
    split.add('3,2');
    const narrowed = pickLongestPatrolSegment(8, 8, split, () => 0);
    expect(narrowed).not.toBeNull();
    expect(segmentLen(narrowed!)).toBe(3);
  });
});

describe('stepPatrol', () => {
  const seg: PatrolSegment = { axis: 'row', fixed: 0, a: 1, b: 3 };

  it('bounces at b when moving forward', () => {
    let state: PatrolState = { varying: 2, direction: 1 };
    state = stepPatrol(seg, state);
    expect(state).toEqual({ varying: 3, direction: 1 });
    state = stepPatrol(seg, state);
    // Would overshoot b; clamp to b and reverse
    expect(state).toEqual({ varying: 3, direction: -1 });
  });

  it('bounces at a when moving backward', () => {
    let state: PatrolState = { varying: 2, direction: -1 };
    state = stepPatrol(seg, state);
    expect(state).toEqual({ varying: 1, direction: -1 });
    state = stepPatrol(seg, state);
    expect(state).toEqual({ varying: 1, direction: 1 });
  });
});
