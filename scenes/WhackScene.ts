import Phaser from 'phaser';
import { SceneBridge } from './shared/SceneBridge';
import type { WhackSceneInitData } from './shared/bridgeProtocol';
import type { WhackLevelConfig, WhackMouseType, GameScore, GameStatus } from '../types';
import { EffectsManager } from './shared/EffectsManager';

const DEPTH = { BG: 0, HOLES: 5, MICE: 10, EFFECTS: 30, HUD: 50 };

interface ActiveMouse {
  hole: number;
  type: WhackMouseType;
  sprite: Phaser.GameObjects.Arc;
  expiresAt: number;
}

export default class WhackScene extends SceneBridge {
  private config!: WhackLevelConfig;
  private lives = 3;
  private gameScore: GameScore = { current: 0, high: 0, coins: 0, multiplier: 1, streak: 0, lives: 3 };
  private isGameOver = false;
  private hasWon = false;

  private holePositions: { x: number; y: number }[] = [];
  private activeMice: ActiveMouse[] = [];
  private spawnTimer: Phaser.Time.TimerEvent | null = null;
  private timeRemaining = 60;

  private effects!: EffectsManager;
  private timerText!: Phaser.GameObjects.Text;
  private comboText!: Phaser.GameObjects.Text;

  init(data: WhackSceneInitData): void {
    super.init(data);
    this.config = data.levelConfig;
    this.lives = data.initialLives ?? this.config.startLives;
  }

  preload(): void {
    EffectsManager.createParticleTexture(this);
  }

  create(): void {
    const { width, height } = this.scale;
    this.cameras.main.setBackgroundColor(this.config.bgColor);
    this.timeRemaining = this.config.timeLimit;

    // Draw grass bg
    const g = this.add.graphics().setDepth(DEPTH.BG);
    g.fillStyle(0x3a6a2a);
    g.fillRect(0, 0, width, height);
    // Grass texture lines
    g.lineStyle(1, 0x2e5a20, 0.3);
    for (let y = 0; y < height; y += 12) {
      for (let x = 0; x < width; x += 20) {
        g.lineBetween(x + Math.random() * 10, y, x + 5 + Math.random() * 10, y - 8);
      }
    }

    // Compute hole positions
    const { gridCols, gridRows } = this.config;
    const padX = 120, padY = 100;
    const gapX = (width - padX * 2) / (gridCols - 1);
    const gapY = (height - padY * 2) / (gridRows - 1);

    for (let row = 0; row < gridRows; row++) {
      for (let col = 0; col < gridCols; col++) {
        const x = padX + col * gapX;
        const y = padY + row * gapY;
        this.holePositions.push({ x, y });

        // Draw hole
        const hole = this.add.graphics().setDepth(DEPTH.HOLES);
        hole.fillStyle(0x1a3a10);
        hole.fillEllipse(x, y, 80, 50);
        hole.fillStyle(0x0a2a08);
        hole.fillEllipse(x, y, 70, 40);
      }
    }

    // Effects
    this.effects = new EffectsManager(this);

    // HUD
    this.timerText = this.add.text(16, 16, '', {
      fontSize: '20px', fontFamily: '"Courier New", monospace', color: '#ffffff',
    }).setDepth(DEPTH.HUD);
    this.comboText = this.add.text(width / 2, height - 30, '', {
      fontSize: '16px', fontFamily: 'system-ui, sans-serif', color: '#ffcc44',
    }).setOrigin(0.5).setDepth(DEPTH.HUD);

    // Input — click/tap on mice
    this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => this.onTap(pointer));

    // Timer
    this.time.addEvent({
      delay: 1000, loop: true,
      callback: () => {
        if (this.isGameOver || this.hasWon) return;
        this.timeRemaining--;
        if (this.timeRemaining <= 0) {
          this.isGameOver = true;
          this.emitGameOver(this.gameScore.current);
        }
      },
    });

    // Spawn timer
    this.scheduleNextSpawn();

    // Pause
    this.input.keyboard!.on('keydown-P', this.togglePause, this);
    this.input.keyboard!.on('keydown-ESC', this.togglePause, this);

    this.gameScore.lives = this.lives;
    this.emitScoreUpdate({ ...this.gameScore });
    this.emitStatusChange('PLAYING' as GameStatus);
  }

  update(): void {
    if (this.isGameOver || this.hasWon) return;

    const now = this.time.now;

    // Expire mice
    for (let i = this.activeMice.length - 1; i >= 0; i--) {
      const m = this.activeMice[i];
      if (now >= m.expiresAt) {
        m.sprite.destroy();
        this.activeMice.splice(i, 1);
        // Missed — reset streak
        this.gameScore.streak = 0;
        this.gameScore.multiplier = 1;
      }
    }

    // Check victory
    if (this.gameScore.current >= (this.config.victoryCondition as { type: 'score'; target: number }).target) {
      this.hasWon = true;
      this.effects.spawnParticles(this.scale.width / 2, this.scale.height / 2, 0xffcc44, 25, 300);
      this.emitLevelComplete({
        levelId: 'GARDEN_WHACK',
        finalScore: this.gameScore.current,
        gameScore: { ...this.gameScore },
        victoryType: 'score',
      });
    }

    // HUD
    const color = this.timeRemaining <= 10 ? '#ff4444' : '#ffffff';
    this.timerText.setText(`Time: ${this.timeRemaining}s`).setColor(color);
    this.comboText.setText(this.gameScore.streak >= 3 ? `Combo x${this.gameScore.multiplier}!` : '');
  }

  private scheduleNextSpawn(): void {
    const [maxMs, minMs] = this.config.spawnIntervalRange;
    // Speed up over time
    const elapsed = this.config.timeLimit - this.timeRemaining;
    const progress = elapsed / this.config.timeLimit;
    const interval = Phaser.Math.Linear(maxMs, minMs, progress);

    this.spawnTimer = this.time.delayedCall(interval, () => {
      if (!this.isGameOver && !this.hasWon) {
        this.spawnMouse();
        this.scheduleNextSpawn();
      }
    });
  }

  private spawnMouse(): void {
    // Pick a random empty hole
    const occupiedHoles = new Set(this.activeMice.map(m => m.hole));
    const freeHoles = this.holePositions.map((_, i) => i).filter(i => !occupiedHoles.has(i));
    if (freeHoles.length === 0) return;

    const holeIdx = freeHoles[Phaser.Math.Between(0, freeHoles.length - 1)];
    const pos = this.holePositions[holeIdx];

    // Pick mouse type (weighted: 60% normal, 25% bonus, 15% sneaky)
    const types = Object.values(this.config.mouseTypes);
    const roll = Math.random();
    const mouseType = roll < 0.15 ? types[2] ?? types[0] : roll < 0.4 ? types[1] ?? types[0] : types[0];

    const sprite = this.add.circle(pos.x, pos.y - 10, 25, mouseType.color)
      .setDepth(DEPTH.MICE)
      .setInteractive();

    // Eyes
    this.add.circle(pos.x - 8, pos.y - 18, 4, 0xffffff).setDepth(DEPTH.MICE + 1);
    this.add.circle(pos.x + 8, pos.y - 18, 4, 0xffffff).setDepth(DEPTH.MICE + 1);
    this.add.circle(pos.x - 8, pos.y - 18, 2, 0x000000).setDepth(DEPTH.MICE + 2);
    this.add.circle(pos.x + 8, pos.y - 18, 2, 0x000000).setDepth(DEPTH.MICE + 2);

    // Pop-up animation
    sprite.setScale(0);
    this.tweens.add({
      targets: sprite, scaleX: 1, scaleY: 1,
      duration: 100, ease: 'Back.easeOut',
    });

    this.activeMice.push({
      hole: holeIdx,
      type: mouseType,
      sprite,
      expiresAt: this.time.now + mouseType.visibleMs,
    });
  }

  private onTap(pointer: Phaser.Input.Pointer): void {
    if (this.isGameOver || this.hasWon) return;

    // Check if tapped a mouse
    let hit = false;
    for (let i = this.activeMice.length - 1; i >= 0; i--) {
      const m = this.activeMice[i];
      const dx = pointer.x - m.sprite.x;
      const dy = pointer.y - m.sprite.y;
      if (dx * dx + dy * dy < 35 * 35) {
        // Hit!
        hit = true;
        this.gameScore.current += m.type.points * this.gameScore.multiplier;
        this.gameScore.streak++;
        if (this.gameScore.streak % 3 === 0) {
          this.gameScore.multiplier = Math.min(this.gameScore.multiplier + 1, 5);
        }

        this.effects.spawnParticles(m.sprite.x, m.sprite.y, m.type.color, 8, 150);
        this.effects.floatingScore(m.sprite.x, m.sprite.y, `+${m.type.points * this.gameScore.multiplier}`);

        m.sprite.destroy();
        this.activeMice.splice(i, 1);
        this.emitScoreUpdate({ ...this.gameScore });
        break;
      }
    }

    if (!hit) {
      // Miss — break streak
      this.gameScore.streak = 0;
      this.gameScore.multiplier = 1;
    }
  }

  private togglePause(): void {
    if (this.isGameOver || this.hasWon) return;
    const paused = !this.scene.isPaused();
    if (paused) this.scene.pause(); else this.scene.resume();
    this.emitHudUpdate({ isPaused: paused });
  }

  applyRuntimePatch(patch: Record<string, unknown>): void {
    if (typeof patch.isPaused === 'boolean') {
      if (patch.isPaused && !this.scene.isPaused()) this.scene.pause();
      else if (!patch.isPaused && this.scene.isPaused()) this.scene.resume();
    }
  }
}
