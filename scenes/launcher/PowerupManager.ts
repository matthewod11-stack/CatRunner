export type LauncherPowerKind = 'piercing' | 'cluster';

const MAX_CHARGES = 2;

export class PowerupManager {
  private queue: LauncherPowerKind[] = [];

  reset(): void {
    this.queue = [];
  }

  push(kind: LauncherPowerKind): void {
    if (this.queue.length >= MAX_CHARGES) {
      this.queue.shift();
    }
    this.queue.push(kind);
  }

  peekNext(): LauncherPowerKind | null {
    return this.queue[0] ?? null;
  }

  /** Consume one charge for the upcoming shot */
  consumeForLaunch(): LauncherPowerKind | null {
    return this.queue.shift() ?? null;
  }

  getHudLabel(): string {
    if (this.queue.length === 0) return '';
    return this.queue.map((k) => (k === 'piercing' ? 'P' : 'C')).join('');
  }

  /** Grant charge from a broken power crate (alternates piercing / cluster). */
  pushFromCrate(): void {
    this.push(this.queue.length % 2 === 0 ? 'piercing' : 'cluster');
  }
}
