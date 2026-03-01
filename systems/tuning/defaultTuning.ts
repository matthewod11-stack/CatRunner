export interface TuningProfile {
  // Physics
  gravity: number;
  jumpForce: number;
  bounceForce: number;
  initialSpeed: number;
  speedIncrement: number;

  // Spawning
  spawnBaseMs: number;
  spawnMinMs: number;
  spawnJitterMs: number;
  patternEndGapMs: number;
  harmfulCooldownMs: number;

  // Difficulty
  bossThreshold: number;
  powerupThreshold: number;
  streakRequired: number;

  // Assist
  lowLivesThreshold: number;
  criticalLivesThreshold: number;
  hitSpawnGraceMs: number;
  startSpawnGraceMs: number;

  // Boss
  bossIntroEaseMs: number;
  invincibilityDurationMs: number;
}

export const DEFAULT_TUNING: TuningProfile = {
  gravity: 0.75,
  jumpForce: 17,
  bounceForce: 15,
  initialSpeed: 7.5,
  speedIncrement: 0.002,

  spawnBaseMs: 1225,
  spawnMinMs: 520,
  spawnJitterMs: 320,
  patternEndGapMs: 600,
  harmfulCooldownMs: 400,

  bossThreshold: 50,
  powerupThreshold: 20,
  streakRequired: 5,

  lowLivesThreshold: 2,
  criticalLivesThreshold: 1,
  hitSpawnGraceMs: 900,
  startSpawnGraceMs: 1800,

  bossIntroEaseMs: 12000,
  invincibilityDurationMs: 2000,
};

// Slider metadata: [min, max, step] for each tuning key
export const TUNING_RANGES: Record<keyof TuningProfile, [number, number, number]> = {
  gravity:                [0.1, 2.0, 0.05],
  jumpForce:              [5, 30, 0.5],
  bounceForce:            [5, 25, 0.5],
  initialSpeed:           [3, 15, 0.5],
  speedIncrement:         [0, 0.01, 0.0005],

  spawnBaseMs:            [400, 3000, 25],
  spawnMinMs:             [200, 1500, 10],
  spawnJitterMs:          [0, 800, 10],
  patternEndGapMs:        [0, 2000, 50],
  harmfulCooldownMs:      [0, 1500, 25],

  bossThreshold:          [5, 200, 5],
  powerupThreshold:       [5, 50, 1],
  streakRequired:         [2, 15, 1],

  lowLivesThreshold:      [1, 5, 1],
  criticalLivesThreshold: [1, 3, 1],
  hitSpawnGraceMs:        [0, 3000, 50],
  startSpawnGraceMs:      [0, 5000, 100],

  bossIntroEaseMs:        [2000, 30000, 500],
  invincibilityDurationMs:[500, 5000, 100],
};
