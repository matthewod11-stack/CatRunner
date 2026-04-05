import Phaser from 'phaser';
import type { WhackLevelConfig } from '../../types';
import { BossStateMachine } from './bossState';
import type { SceneManager } from './types';
import { DEPTH } from './types';
import { PhaserAudio } from '../shared/PhaserAudio';
import { EffectsManager } from '../shared/EffectsManager';

export class GopherBossManager implements SceneManager {
  private readonly machine: BossStateMachine;
  private bossGraphic: Phaser.GameObjects.Arc | null = null;
  private active = false;
  private canWhackBoss = false;
  private emergePending: Phaser.Time.TimerEvent | null = null;
  private hidePending: Phaser.Time.TimerEvent | null = null;
  private tornDown = false;

  constructor(
    private readonly scene: Phaser.Scene,
    private readonly config: WhackLevelConfig,
    private readonly getHolePositions: () => { x: number; y: number }[],
    private readonly audio: PhaserAudio,
    private readonly effects: EffectsManager,
    private readonly onDefeat: () => void,
  ) {
    this.machine = new BossStateMachine({
      hitsToDefeat: config.boss.hitsToDefeat,
      hitInvulnMs: config.boss.hitInvulnMs,
    });
  }

  create(): void {
    this.tornDown = false;
  }

  update(_time: number, _delta: number): void {
    if (!this.active) return;
    this.machine.endInvuln(this.scene.time.now);
  }

  destroy(): void {
    if (this.tornDown) return;
    this.tornDown = true;
    this.clearTimers();
    this.destroyBossGraphic();
    this.active = false;
    this.audio.setBossMode(false);
  }

  start(): void {
    if (this.tornDown) return;
    this.active = true;
    this.machine.activate();
    this.audio.playSfx('boss_alert', { isBossFight: true });
    this.audio.setBossMode(true);
    this.queueEmerge();
  }

  isDefeated(): boolean {
    return this.machine.phase === 'defeated';
  }

  tryTap(pointer: Phaser.Input.Pointer): boolean {
    if (!this.active || !this.canWhackBoss || !this.bossGraphic) return false;
    const g = this.bossGraphic;
    const dx = pointer.x - g.x;
    const dy = pointer.y - g.y;
    const r = this.config.boss.radiusPx + 8;
    if (dx * dx + dy * dy > r * r) return false;

    const now = this.scene.time.now;
    const res = this.machine.tryHit(now);
    if (res === 'ignore') return false;
    if (res === 'hit') {
      this.audio.playSfx('boss_hit', { isBossFight: true });
      this.effects.spawnParticles(g.x, g.y, this.config.boss.color, 12, 220);
      return true;
    }
    // defeated
    this.audio.playSfx('boss_hit', { isBossFight: true });
    this.effects.spawnParticles(g.x, g.y, 0xffcc44, 28, 380);
    this.clearTimers();
    this.canWhackBoss = false;
    this.scene.tweens.add({
      targets: g,
      scaleX: 0,
      scaleY: 0,
      duration: 200,
      onComplete: () => {
        this.destroyBossGraphic();
        this.onDefeat();
      },
    });
    return true;
  }

  private queueEmerge(): void {
    if (!this.active || this.machine.phase === 'defeated') return;
    this.clearEmergeTimer();
    const [a, b] = this.config.boss.emergeDelayMs;
    const delay = Phaser.Math.Between(a, b);
    this.emergePending = this.scene.time.delayedCall(delay, () => {
      this.doEmerge();
    });
  }

  private doEmerge(): void {
    if (!this.active || this.machine.phase === 'defeated') return;
    const positions = this.getHolePositions();
    if (!positions.length) return;

    this.destroyBossGraphic();
    this.canWhackBoss = false;

    const idx = Phaser.Math.Between(0, positions.length - 1);
    const pos = positions[idx];
    const r = this.config.boss.radiusPx;

    this.bossGraphic = this.scene.add.circle(pos.x, pos.y - 14, r, this.config.boss.color);
    this.bossGraphic.setStrokeStyle(4, 0xffcc66);
    this.bossGraphic.setDepth(DEPTH.BOSS);
    this.bossGraphic.setInteractive({ useHandCursor: true });
    this.bossGraphic.setScale(0);

    this.scene.tweens.add({
      targets: this.bossGraphic,
      scaleX: 1,
      scaleY: 1,
      duration: 160,
      ease: 'Back.easeOut',
      onComplete: () => {
        this.canWhackBoss = true;
        this.machine.setVulnerable(this.scene.time.now);
      },
    });

    this.clearHideTimer();
    this.hidePending = this.scene.time.delayedCall(this.config.boss.visibleMs, () => {
      this.hideAndRequeue();
    });
  }

  private hideAndRequeue(): void {
    if (!this.bossGraphic || this.machine.phase === 'defeated') return;
    this.canWhackBoss = false;
    const g = this.bossGraphic;
    this.clearHideTimer();
    this.scene.tweens.add({
      targets: g,
      scaleX: 0,
      scaleY: 0,
      duration: 120,
      ease: 'Back.easeIn',
      onComplete: () => {
        this.destroyBossGraphic();
        this.queueEmerge();
      },
    });
  }

  private destroyBossGraphic(): void {
    if (this.bossGraphic) {
      this.bossGraphic.destroy();
      this.bossGraphic = null;
    }
    this.canWhackBoss = false;
  }

  private clearEmergeTimer(): void {
    if (this.emergePending) {
      this.emergePending.remove(false);
      this.emergePending = null;
    }
  }

  private clearHideTimer(): void {
    if (this.hidePending) {
      this.hidePending.remove(false);
      this.hidePending = null;
    }
  }

  private clearTimers(): void {
    this.clearEmergeTimer();
    this.clearHideTimer();
  }
}
