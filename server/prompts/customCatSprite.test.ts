import { describe, it, expect } from 'vitest';
import {
  sanitizeUserCatDescriptionForPrompt,
  buildCustomCatSpritePrompt,
} from './customCatSprite';

describe('sanitizeUserCatDescriptionForPrompt', () => {
  it('strips control characters and collapses whitespace', () => {
    expect(sanitizeUserCatDescriptionForPrompt('hello\u0000world')).toBe('hello world');
    expect(sanitizeUserCatDescriptionForPrompt('a   b\t\nc')).toBe('a b c');
  });
});

describe('buildCustomCatSpritePrompt', () => {
  it('wraps user text in delimiters', () => {
    const p = buildCustomCatSpritePrompt('pink hat');
    expect(p).toContain('<<<USER_CAT_DESCRIPTION');
    expect(p).toContain('USER_CAT_DESCRIPTION>>>');
    expect(p).toContain('pink hat');
    expect(p).toContain('prompt injection');
  });
});
