import { describe, it, expect } from 'vitest';
import { parseCatApiBody, catApiToScore, catApiToDescription } from './catApiBody';

describe('parseCatApiBody', () => {
  it('returns empty object for nullish', () => {
    expect(parseCatApiBody(null)).toEqual({});
    expect(parseCatApiBody(undefined)).toEqual({});
  });

  it('parses JSON string', () => {
    expect(parseCatApiBody('{"a":1}')).toEqual({ a: 1 });
    expect(parseCatApiBody('not json')).toEqual({});
  });

  it('passes through plain objects', () => {
    const o = { x: true };
    expect(parseCatApiBody(o)).toBe(o);
  });
});

describe('catApiToScore', () => {
  it('floors non-negative finite numbers', () => {
    expect(catApiToScore(12.7)).toBe(12);
    expect(catApiToScore(-3)).toBe(0);
    expect(catApiToScore('45')).toBe(45);
  });

  it('returns 0 for NaN and non-numeric', () => {
    expect(catApiToScore(NaN)).toBe(0);
    expect(catApiToScore('x')).toBe(0);
    expect(catApiToScore({})).toBe(0);
  });
});

describe('catApiToDescription', () => {
  it('trims and caps length', () => {
    expect(catApiToDescription('  hi  ')).toBe('hi');
    const long = 'x'.repeat(400);
    expect(catApiToDescription(long).length).toBe(300);
  });

  it('returns empty for non-string', () => {
    expect(catApiToDescription(1)).toBe('');
  });
});
