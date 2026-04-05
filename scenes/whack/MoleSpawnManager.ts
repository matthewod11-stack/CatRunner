import Phaser from 'phaser';
import type { GameScore, WhackLevelConfig, WhackMouseType } from '../../types';
import { EffectsManager } from '../shared/EffectsManager';
import { pickWeightedKey } from './spawnPick';
import {
  currentWaveDuration,
  elapsedInCurrentWave,
  waveIndexAtElapsed,
} from './waves';
import type { SceneManager } from './types';
import { DEPTH } from './types';
import type { WhackPowerupManager } from './WhackPowerupManager';

interface ActiveMouse {
  hole: number;
  type: WhackMouseType;
  container: Phaser.GameObjects.Container;
  expiresAt: number;
}

export class MoleSpawnManager implements SceneManager {
  private active: ActiveMouse[] = [];
  private spawnTimer: Phaser.Time.TimerEvent | null = null;
  private stopped = false;
  private tornDown = false;

  constructor(
    private readonly scene: Phaser.Scene,
    private readonly config: WhackLevelConfig,
    private readonly getElapsedWaveSec: () => number,
    private readonly getHolePositions: () => { x: number; y: number }[],
    private readonly powerups: WhackPowerupManager,
    private readonly effects: EffectsManager,
    private readonly patchScore: (fn: (s: GameScore) => GameScore) => void,
  ) {}

  create(): void {
    this.tornDown = false;
    this.stopped = false;
    this.scheduleNextSpawn();
  }

  update(_time: number, _delta: number): void {
    const now = this.scene.time.now;
    for (let i = this.active.length - 1; i >= 0; i--) {
      const m = this.active[i];
      if (now >= m.expiresAt) {
        m.container.destroy();
        this.active.splice(i, 1);
        this.patchScore(s => ({ ...s, streak: 0, multiplier: 1 }));
      }
    }
  }

  destroy(): void {
    if (this.tornDown) return;
    this.tornDown = true;
    if (this.spawnTimer) {
      this.spawnTimer.remove(false);
      this.spawnTimer = null;
    }
    this.active.forEach(m => m.container.destroy());
    this.active = [];
  }

  stopSpawning(): void {
    this.stopped = true;
    if (this.spawnTimer) {
      this.spawnTimer.remove(false);
      this.spawnTimer = null;
    }
  }

  clearAllMoles(): void {
    this.active.forEach(m => m.container.destroy());
    this.active = [];
  }

  tryTap(pointer: Phaser.Input.Pointer): boolean {
    for (let i = this.active.length - 1; i >= 0; i--) {
      const m = this.active[i];
      const b = m.container.getBounds();
      if (
        pointer.x >= b.x &&
        pointer.x <= b.x + b.width &&
        pointer.y >= b.y &&
        pointer.y <= b.y + b.height
      ) {
        this.applyWhack(m, i);
        return true;
      }
    }
    return false;
  }

  private applyWhack(m: ActiveMouse, index: number): void {
    const now = this.scene.time.now;
    const multBase = this.powerups.getScoreMultiplier(now);
    let awarded = 0;
    this.patchScore(s => {
      const comboMult = s.multiplier;
      const pts = Math.floor(m.type.points * comboMult * multBase);
      awarded = pts;
      const streak = s.streak + 1;
      let multiplier = s.multiplier;
      if (streak % 3 === 0) {
        multiplier = Math.min(multiplier + 1, 5);
      }
      return {
        ...s,
        current: s.current + pts,
        streak,
        multiplier,
      };
    });

    if (m.type.grantsEffect && m.type.effectDurationSec) {
      this.powerups.applyEffect(m.type.grantsEffect, now, m.type.effectDurationSec);
    }

    const { x, y } = m.container;
    this.effects.spawnParticles(x, y, m.type.color, 8, 150);
    this.effects.floatingScore(x, y - 10, `+${awarded}`);

    m.container.destroy();
    this.active.splice(index, 1);
  }

  private scheduleNextSpawn(): void {
    if (this.stopped) return;

    const elapsed = this.getElapsedWaveSec();
    const waves = this.config.waves;
    const wIdx = waveIndexAtElapsed(elapsed, waves);
    const wave = waves[wIdx] ?? waves[0];
    if (!wave) return;

    const [maxMs, minMs] = wave.spawnIntervalRange;
    const dur = currentWaveDuration(elapsed, waves);
    const local = elapsedInCurrentWave(elapsed, waves);
    const progress = Math.min(1, local / dur);
    let interval = Phaser.Math.Linear(maxMs, minMs, progress);
    interval *= this.powerups.getSpawnIntervalMultiplier(this.scene.time.now);

    this.spawnTimer = this.scene.time.delayedCall(interval, () => {
      if (!this.stopped) {
        this.spawnMouse();
        this.scheduleNextSpawn();
      }
    });
  }

  private spawnMouse(): void {
    if (this.stopped) return;
    const elapsed = this.getElapsedWaveSec();
    const waves = this.config.waves;
    const wIdx = waveIndexAtElapsed(elapsed, waves);
    const wave = waves[wIdx] ?? waves[0];
    if (!wave) return;

    const weights: Record<string, number> = {};
    for (const [k, w] of Object.entries(wave.spawnWeights)) {
      if (this.config.mouseTypes[k]) weights[k] = w;
    }
    const key = pickWeightedKey(weights);
    if (!key) return;
    const mouseType = this.config.mouseTypes[key];
    if (!mouseType) return;

    const positions = this.getHolePositions();
    if (!positions.length) return;

    const occupied = new Set(this.active.map(m => m.hole));
    const free = positions.map((_, i) => i).filter(i => !occupied.has(i));
    if (free.length === 0) return;

    const holeIdx = free[Phaser.Math.Between(0, free.length - 1)];
    const pos = positions[holeIdx];

    const container = this.scene.add.container(pos.x, pos.y - 10);
    container.setDepth(DEPTH.MICE);

    const body = this.scene.add.circle(0, 0, 25, mouseType.color);
    container.add(body);

    container.add(this.scene.add.circle(-8, -8, 4, 0xffffff));
    container.add(this.scene.add.circle(8, -8, 4, 0xffffff));
    container.add(this.scene.add.circle(-8, -8, 2, 0x000000));
    container.add(this.scene.add.circle(8, -8, 2, 0x000000));

    container.setScale(0);
    this.scene.tweens.add({
      targets: container,
      scaleX: 1,
      scaleY: 1,
      duration: 100,
      ease: 'Back.easeOut',
    });

    this.active.push({
      hole: holeIdx,
      type: mouseType,
      container,
      expiresAt: this.scene.time.now + mouseType.visibleMs,
    });
  }
}
