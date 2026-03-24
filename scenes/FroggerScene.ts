import Phaser from 'phaser';
import { SceneBridge } from './shared/SceneBridge';
import type { FroggerSceneInitData } from './shared/bridgeProtocol';
import type { FroggerLevelConfig, FroggerLane, GameScore, GameStatus } from '../types';
import { loadCatSprite, CAT_TEXTURE_KEY } from './shared/SpriteLoader';
import { EffectsManager } from './shared/EffectsManager';

// ─── Constants ──────────────────────────────────────────────────────

const DEPTH = {
  BG: 0,
  LANES: 2,
  OBJECTS: 10,
  PLAYER: 20,
  EFFECTS: 30,
  HUD: 50,
};

// ─── Lane Object tracking ───────────────────────────────────────────

interface LaneObject {
  sprite: Phaser.GameObjects.Rectangle;
  lane: FroggerLane;
}

// ─── Scene ──────────────────────────────────────────────────────────

export default class FroggerScene extends SceneBridge {
  private config!: FroggerLevelConfig;

  // Player grid position
  private gridCol = 10;
  private gridRow = 0; // 0 = bottom (start)
  private player!: Phaser.GameObjects.Sprite | Phaser.GameObjects.Rectangle;
  private isMoving = false; // prevent input spam during hop animation
  private ridingObject: LaneObject | null = null;

  // Lane objects
  private laneObjects: LaneObject[] = [];

  // Game state
  private lives = 3;
  private gameScore: GameScore = {
    current: 0, high: 0, coins: 0,
    multiplier: 1, streak: 0, lives: 3,
  };
  private isGameOver = false;
  private hasWon = false;
  private crossingsCompleted = 0;
  private highestRow = 0;

  // Timer
  private timeRemaining = 60;
  private timerEvent: Phaser.Time.TimerEvent | null = null;

  // Input
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;

  // Effects
  private effects!: EffectsManager;

  // HUD
  private timerText!: Phaser.GameObjects.Text;
  private crossingText!: Phaser.GameObjects.Text;

  // ─── Lifecycle ──────────────────────────────────────────────────

  init(data: FroggerSceneInitData): void {
    super.init(data);
    this.config = data.levelConfig;
    this.lives = data.initialLives ?? this.config.startLives;
  }

  preload(): void {
    loadCatSprite(this, this.catSpriteUrl);
    EffectsManager.createParticleTexture(this);
  }

  create(): void {
    const { width } = this.scale;

    this.cameras.main.setBackgroundColor(this.config.bgColor);
    this.gridCol = this.config.startCol;
    this.gridRow = 0;
    this.timeRemaining = this.config.timeLimit;

    // Draw lanes
    this.drawLanes(width);

    // Spawn lane objects
    this.spawnLaneObjects(width);

    // Player
    const hasCat = this.textures.exists(CAT_TEXTURE_KEY);
    const px = this.gridCol * this.config.cellSize;
    const py = this.getRowY(0);
    const cs = this.config.cellSize;

    if (hasCat) {
      this.player = this.add.sprite(px + cs / 2, py + cs / 2, CAT_TEXTURE_KEY)
        .setDisplaySize(cs - 8, cs - 8).setDepth(DEPTH.PLAYER);
    } else {
      this.player = this.add.rectangle(px + cs / 2, py + cs / 2, cs - 8, cs - 8, 0xff8844)
        .setDepth(DEPTH.PLAYER);
    }

    // Input
    this.cursors = this.input.keyboard!.createCursorKeys();
    this.input.keyboard!.on('keydown-P', this.togglePause, this);
    this.input.keyboard!.on('keydown-ESC', this.togglePause, this);

    // Effects
    this.effects = new EffectsManager(this);

    // Timer
    if (this.config.timeLimit > 0) {
      this.timerEvent = this.time.addEvent({
        delay: 1000, callback: () => {
          this.timeRemaining--;
          if (this.timeRemaining <= 0) this.handleDeath();
        },
        loop: true,
      });
    }

    // HUD
    this.timerText = this.add.text(16, 16, '', {
      fontSize: '18px', fontFamily: '"Courier New", monospace', color: '#ffffff',
    }).setScrollFactor(0).setDepth(DEPTH.HUD);

    this.crossingText = this.add.text(this.scale.width - 16, 16, '', {
      fontSize: '18px', fontFamily: '"Courier New", monospace', color: '#ffaa44',
    }).setOrigin(1, 0).setScrollFactor(0).setDepth(DEPTH.HUD);

    // Init
    this.gameScore.lives = this.lives;
    this.emitScoreUpdate({ ...this.gameScore });
    this.emitStatusChange('PLAYING' as GameStatus);
  }

  update(_time: number, delta: number): void {
    if (this.isGameOver || this.hasWon) return;

    const dt = delta / 1000;

    this.handleInput();
    this.updateLaneObjects(dt);
    this.checkCollisions();
    this.updateHud();
  }

  // ─── Lane Drawing ─────────────────────────────────────────────

  private getRowY(row: number): number {
    return this.config.lanes[row]?.y ?? 600;
  }

  private drawLanes(width: number): void {
    const g = this.add.graphics().setDepth(DEPTH.LANES);

    for (const lane of this.config.lanes) {
      if (lane.type === 'safe') {
        g.fillStyle(0x44aa44, 0.4);
      } else if (lane.type === 'road') {
        g.fillStyle(0x333333);
      } else if (lane.type === 'water') {
        g.fillStyle(0x2244aa, 0.7);
      }
      g.fillRect(0, lane.y, width, this.config.cellSize);

      // Road lane markings
      if (lane.type === 'road') {
        g.fillStyle(0xffff00, 0.3);
        for (let x = 0; x < width; x += 40) {
          g.fillRect(x, lane.y + this.config.cellSize / 2 - 1, 20, 2);
        }
      }
    }

    // Goal area highlight
    const goalLane = this.config.lanes[this.config.lanes.length - 1];
    if (goalLane) {
      const goalText = this.add.text(width / 2, goalLane.y + this.config.cellSize / 2, 'FISH MARKET', {
        fontSize: '14px', fontFamily: 'system-ui, sans-serif', fontStyle: 'bold',
        color: '#ffffff', backgroundColor: '#ff884488', padding: { x: 8, y: 4 },
      }).setOrigin(0.5).setDepth(DEPTH.LANES + 1);
    }
  }

  // ─── Lane Objects ─────────────────────────────────────────────

  private spawnLaneObjects(screenWidth: number): void {
    for (const lane of this.config.lanes) {
      if (lane.type === 'safe') continue;

      const { width: objW, height: objH, color, gap } = lane.objects;
      const totalSpan = screenWidth + gap * 2; // extend beyond screen
      let x = -gap;

      while (x < totalSpan) {
        const rect = this.add.rectangle(x + objW / 2, lane.y + this.config.cellSize / 2, objW, objH, color)
          .setDepth(DEPTH.OBJECTS);

        // Rounded corners for logs
        if (lane.type === 'water') {
          rect.setStrokeStyle(2, 0x553311);
        }

        this.laneObjects.push({ sprite: rect, lane });
        x += objW + gap;
      }
    }
  }

  private updateLaneObjects(dt: number): void {
    const screenWidth = this.scale.width;

    for (const obj of this.laneObjects) {
      const lane = obj.lane;
      obj.sprite.x += lane.direction * lane.speed * dt;

      // Wrap around
      const halfW = lane.objects.width / 2;
      if (lane.direction > 0 && obj.sprite.x - halfW > screenWidth + 50) {
        obj.sprite.x = -halfW - 50;
      } else if (lane.direction < 0 && obj.sprite.x + halfW < -50) {
        obj.sprite.x = screenWidth + halfW + 50;
      }
    }

    // If riding a water object, move with it
    if (this.ridingObject) {
      this.player.x += this.ridingObject.lane.direction * this.ridingObject.lane.speed * dt;
      // Fell off screen
      if (this.player.x < -20 || this.player.x > this.scale.width + 20) {
        this.handleDeath();
      }
    }
  }

  // ─── Input ────────────────────────────────────────────────────

  private handleInput(): void {
    if (this.isMoving) return;

    const cs = this.config.cellSize;
    let targetRow = this.gridRow;
    let targetCol = this.gridCol;

    if (Phaser.Input.Keyboard.JustDown(this.cursors.up)) {
      targetRow = Math.min(this.gridRow + 1, this.config.lanes.length - 1);
    } else if (Phaser.Input.Keyboard.JustDown(this.cursors.down)) {
      targetRow = Math.max(this.gridRow - 1, 0);
    } else if (Phaser.Input.Keyboard.JustDown(this.cursors.left)) {
      targetCol = Math.max(this.gridCol - 1, 0);
    } else if (Phaser.Input.Keyboard.JustDown(this.cursors.right)) {
      targetCol = Math.min(this.gridCol + 1, Math.floor(this.scale.width / cs) - 1);
    }

    if (targetRow === this.gridRow && targetCol === this.gridCol) return;

    this.isMoving = true;
    this.gridRow = targetRow;
    this.gridCol = targetCol;

    const targetX = targetCol * cs + cs / 2;
    const targetY = this.getRowY(targetRow) + cs / 2;

    // Score for advancing
    if (targetRow > this.highestRow) {
      this.highestRow = targetRow;
      this.gameScore.current += 10;
      this.emitScoreUpdate({ ...this.gameScore });
    }

    // Hop animation
    this.tweens.add({
      targets: this.player,
      x: targetX, y: targetY,
      duration: 120,
      ease: 'Power1',
      onComplete: () => {
        this.isMoving = false;
        this.checkGoalReached();
      },
    });
  }

  // ─── Collisions ───────────────────────────────────────────────

  private checkCollisions(): void {
    if (this.isMoving) return;

    const currentLane = this.config.lanes[this.gridRow];
    if (!currentLane || currentLane.type === 'safe') {
      this.ridingObject = null;
      return;
    }

    const px = this.player.x;
    const py = this.player.y;
    const halfCell = this.config.cellSize / 2;

    if (currentLane.type === 'road') {
      // Check if hit by a car
      for (const obj of this.laneObjects) {
        if (obj.lane !== currentLane) continue;
        const halfW = obj.lane.objects.width / 2;
        if (Math.abs(obj.sprite.x - px) < halfW + halfCell * 0.4 &&
            Math.abs(obj.sprite.y - py) < halfCell * 0.8) {
          this.handleDeath();
          return;
        }
      }
    } else if (currentLane.type === 'water') {
      // Must be on a log/lily — find one we're on
      let onPlatform = false;
      for (const obj of this.laneObjects) {
        if (obj.lane !== currentLane) continue;
        const halfW = obj.lane.objects.width / 2;
        if (Math.abs(obj.sprite.x - px) < halfW + halfCell * 0.2 &&
            Math.abs(obj.sprite.y - py) < halfCell * 0.8) {
          onPlatform = true;
          this.ridingObject = obj;
          break;
        }
      }
      if (!onPlatform) {
        this.ridingObject = null;
        this.handleDeath(); // fell in water
      }
    }
  }

  // ─── Goal ─────────────────────────────────────────────────────

  private checkGoalReached(): void {
    if (this.gridRow >= this.config.lanes.length - 1) {
      this.crossingsCompleted++;
      this.gameScore.current += 100;
      this.emitScoreUpdate({ ...this.gameScore });

      this.effects.spawnParticles(this.player.x, this.player.y, 0xffaa44, 15, 200);
      this.effects.floatingScore(this.player.x, this.player.y, '+100', '#ffaa44');

      if (this.crossingsCompleted >= this.config.crossingsToWin) {
        this.hasWon = true;
        this.emitLevelComplete({
          levelId: 'STREET',
          finalScore: this.gameScore.current,
          gameScore: { ...this.gameScore },
          victoryType: 'goal',
        });
        return;
      }

      // Reset to start for next crossing
      this.time.delayedCall(500, () => this.resetToStart());
    }
  }

  private resetToStart(): void {
    this.gridRow = 0;
    this.gridCol = this.config.startCol;
    this.highestRow = 0;
    this.ridingObject = null;

    const cs = this.config.cellSize;
    this.player.setPosition(this.gridCol * cs + cs / 2, this.getRowY(0) + cs / 2);

    // Reset timer
    this.timeRemaining = this.config.timeLimit;
  }

  // ─── Death ────────────────────────────────────────────────────

  private handleDeath(): void {
    this.lives--;
    this.gameScore.lives = this.lives;
    this.gameScore.streak = 0;
    this.gameScore.multiplier = 1;
    this.ridingObject = null;

    this.effects.flash(0xff0000, 200);
    this.effects.shake(0.015, 150);
    this.effects.spawnParticles(this.player.x, this.player.y, 0xff4444, 10, 150);

    this.emitLivesChanged(this.lives);
    this.emitScoreUpdate({ ...this.gameScore });

    if (this.lives <= 0) {
      this.isGameOver = true;
      this.emitGameOver(this.gameScore.current);
      return;
    }

    this.resetToStart();
  }

  // ─── HUD ──────────────────────────────────────────────────────

  private updateHud(): void {
    const color = this.timeRemaining <= 10 ? '#ff4444' : '#ffffff';
    this.timerText.setText(`Time: ${this.timeRemaining}s`).setColor(color);
    this.crossingText.setText(`${this.crossingsCompleted}/${this.config.crossingsToWin} crossings`);
  }

  // ─── Pause ────────────────────────────────────────────────────

  private togglePause(): void {
    if (this.isGameOver || this.hasWon) return;
    const paused = !this.scene.isPaused();
    if (paused) this.scene.pause();
    else this.scene.resume();
    this.emitHudUpdate({ isPaused: paused });
  }

  applyRuntimePatch(patch: Record<string, unknown>): void {
    if (typeof patch.isPaused === 'boolean') {
      if (patch.isPaused && !this.scene.isPaused()) this.scene.pause();
      else if (!patch.isPaused && this.scene.isPaused()) this.scene.resume();
    }
  }
}
