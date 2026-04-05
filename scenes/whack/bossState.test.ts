import { describe, it, expect } from 'vitest';
import { BossStateMachine } from './bossState';

describe('BossStateMachine', () => {
  const cfg = { hitsToDefeat: 3, hitInvulnMs: 100 };

  it('ignores hits until vulnerable', () => {
    const b = new BossStateMachine(cfg);
    b.activate();
    expect(b.tryHit(1000)).toBe('ignore');
    b.setVulnerable(1000);
    expect(b.tryHit(1000)).toBe('hit');
    expect(b.hitsRemaining).toBe(2);
  });

  it('ignores during invuln window', () => {
    const b = new BossStateMachine(cfg);
    b.activate();
    b.setVulnerable(0);
    b.tryHit(0);
    expect(b.phase).toBe('invuln');
    expect(b.tryHit(50)).toBe('ignore');
    b.endInvuln(200);
    expect(b.phase).toBe('vulnerable');
  });

  it('defeated after enough hits', () => {
    const b = new BossStateMachine({ hitsToDefeat: 2, hitInvulnMs: 10 });
    b.activate();
    b.setVulnerable(0);
    expect(b.tryHit(0)).toBe('hit');
    b.endInvuln(100);
    expect(b.tryHit(100)).toBe('defeated');
    expect(b.tryHit(200)).toBe('ignore');
  });
});
