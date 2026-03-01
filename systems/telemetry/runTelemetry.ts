export interface DamageEvent {
  type: 'damage';
  timestamp: number;
  obstacleType: string;
  speed: number;
  livesRemaining: number;
  score: number;
}

export interface DeathEvent {
  type: 'death';
  timestamp: number;
  score: number;
  coins: number;
  speed: number;
  activePowerUp: string | null;
  damageCount: number;
}

export interface RunSummaryEvent {
  type: 'run_summary';
  timestamp: number;
  durationMs: number;
  finalScore: number;
  coinsCollected: number;
  bossReached: boolean;
  bossDefeated: boolean;
  damageCount: number;
  tuningProfile: string;
}

export type TelemetryEvent = DamageEvent | DeathEvent | RunSummaryEvent;

export function createRunTelemetry() {
  const events: TelemetryEvent[] = [];
  const startTime = Date.now();

  return {
    logDamage(obstacleType: string, speed: number, livesRemaining: number, score: number) {
      events.push({ type: 'damage', timestamp: Date.now(), obstacleType, speed, livesRemaining, score });
    },

    logDeath(score: number, coins: number, speed: number, activePowerUp: string | null) {
      const damageCount = events.filter(e => e.type === 'damage').length;
      events.push({ type: 'death', timestamp: Date.now(), score, coins, speed, activePowerUp, damageCount });
    },

    logRunSummary(finalScore: number, coinsCollected: number, bossReached: boolean, bossDefeated: boolean, tuningProfile: string) {
      const damageCount = events.filter(e => e.type === 'damage').length;
      events.push({
        type: 'run_summary',
        timestamp: Date.now(),
        durationMs: Date.now() - startTime,
        finalScore,
        coinsCollected,
        bossReached,
        bossDefeated,
        damageCount,
        tuningProfile,
      });
    },

    getEvents(): TelemetryEvent[] {
      return [...events];
    },

    clear() {
      events.length = 0;
    },
  };
}

export type RunTelemetry = ReturnType<typeof createRunTelemetry>;

export function exportTelemetryJson(events: TelemetryEvent[]): void {
  const blob = new Blob([JSON.stringify(events, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `beach-kitty-telemetry-${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.json`;
  a.click();
  URL.revokeObjectURL(url);
}
