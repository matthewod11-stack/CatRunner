export type BossPhase = 'inactive' | 'emerging' | 'vulnerable' | 'invuln' | 'defeated';

export interface BossStateConfig {
  hitsToDefeat: number;
  hitInvulnMs: number;
}

export class BossStateMachine {
  phase: BossPhase = 'inactive';
  hitsRemaining: number;
  invulnUntil = 0;

  constructor(private readonly cfg: BossStateConfig) {
    this.hitsRemaining = cfg.hitsToDefeat;
  }

  activate(): void {
    this.phase = 'emerging';
    this.hitsRemaining = this.cfg.hitsToDefeat;
    this.invulnUntil = 0;
  }

  /** Call when boss becomes targetable after emerge animation. */
  setVulnerable(now: number): void {
    if (this.phase === 'emerging') this.phase = 'vulnerable';
    this.invulnUntil = now;
  }

  tryHit(now: number): 'hit' | 'ignore' | 'defeated' {
    if (this.phase === 'defeated' || this.phase === 'inactive') return 'ignore';
    if (now < this.invulnUntil) return 'ignore';
    if (this.phase !== 'vulnerable' && this.phase !== 'invuln') return 'ignore';

    this.hitsRemaining--;
    if (this.hitsRemaining <= 0) {
      this.phase = 'defeated';
      return 'defeated';
    }
    this.phase = 'invuln';
    this.invulnUntil = now + this.cfg.hitInvulnMs;
    return 'hit';
  }

  endInvuln(now: number): void {
    if (this.phase === 'invuln' && now >= this.invulnUntil) {
      this.phase = 'vulnerable';
    }
  }
}
