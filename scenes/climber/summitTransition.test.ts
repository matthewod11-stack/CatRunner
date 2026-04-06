import { describe, it, expect } from 'vitest';
import { shouldEnterSummit } from './summitTransition';

describe('shouldEnterSummit', () => {
  it('returns false when already entered', () => {
    expect(
      shouldEnterSummit({
        highestWorldY: -99999,
        entryWorldY: -9200,
        alreadyEntered: true,
      }),
    ).toBe(false);
  });
  it('returns false when not yet past entry depth', () => {
    expect(
      shouldEnterSummit({
        highestWorldY: -8000,
        entryWorldY: -9200,
        alreadyEntered: false,
      }),
    ).toBe(false);
  });
  it('returns true when at or past entry depth', () => {
    expect(
      shouldEnterSummit({
        highestWorldY: -9200,
        entryWorldY: -9200,
        alreadyEntered: false,
      }),
    ).toBe(true);
    expect(
      shouldEnterSummit({
        highestWorldY: -9300,
        entryWorldY: -9200,
        alreadyEntered: false,
      }),
    ).toBe(true);
  });
});
