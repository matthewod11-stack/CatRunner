import Phaser from 'phaser';
import { SceneBridge } from './shared/SceneBridge';
import type { ShooterSceneInitData } from './shared/bridgeProtocol';
import type { ShooterLevelConfig, ShooterEnemyDef, GameScore, GameStatus } from '../types';
import { loadCatSprite, CAT_TEXTURE_KEY } from './shared/SpriteLoader';
import { EffectsManager } from './shared/EffectsManager';

// ─── Constants ──────────────────────────────────────────────────────

const PLAYER_WIDTH = 48;
const PLAYER_HEIGHT = 40;
const BULLET_W = 6;
const BULLET_H = 14;
const ENEMY_SIZE = 36;
const ENEMY_BULLET_SIZE = 8;
const ENEMY_GAP_X = 60;
const ENEMY_GAP_Y = 50;

const DEPTH = {
  BG: 0,
  STARS: 1,
  ENEMIES: 10,
  BULLETS: 15,
  PLAYER: 20,
  EFFECTS: 30,
  HUD: 50,
};

const ENEMY_COLORS: Record<string, number> = {
  mouse: 0x888888,
  rat: 0xaa6644,
  bat: 0x6644aa,
};

// ─── Scene ──────────────────────────────────────────────────────────

export default class ShooterScene extends SceneBridge {
  // Config
  private config!: ShooterLevelConfig;

  // Player
  private player!: Phaser.Types.Physics.Arcade.SpriteWithDynamicBody;
  private lastFireTime = 0;
  private invincibleUntil = 0;

  // Bullets
  private playerBullets!: Phaser.Physics.Arcade.Group;
  private enemyBullets!: Phaser.Physics.Arcade.Group;

  // Enemies
  private enemyGroup!: Phaser.Physics.Arcade.Group;
  private enemyDataMap: Map<Phaser.GameObjects.GameObject, { def: ShooterEnemyDef; health: number; isBoss: boolean }> = new Map();
  private formationX = 0;
  private formationBaseY = 0;

  // Wave state
  private currentWaveIndex = 0;
  private waveStartTime = 0;

  // Deferred destruction — prevents Phaser iterator corruption
  private pendingDestroys: Set<Phaser.GameObjects.GameObject> = new Set();

  // Game state
  private lives = 3;
  private gameScore: GameScore = {
    current: 0, high: 0, coins: 0,
    multiplier: 1, streak: 0, lives: 3,
  };
  private isGameOver = false;
  private hasWon = false;

  // Input
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private spaceKey!: Phaser.Input.Keyboard.Key;

  // Managers
  private effects!: EffectsManager;

  // Background
  private stars: { x: number; y: number; speed: number; size: number }[] = [];
  private starsGraphics!: Phaser.GameObjects.Graphics;

  // HUD
  private waveText!: Phaser.GameObjects.Text;

  // ─── Lifecycle ──────────────────────────────────────────────────

  init(data: ShooterSceneInitData): void {
    super.init(data);
    this.config = data.levelConfig;
    this.lives = data.initialLives ?? this.config.startLives;
  }

  preload(): void {
    loadCatSprite(this, this.catSpriteUrl);
    EffectsManager.createParticleTexture(this);
  }

  create(): void {
    const { width, height } = this.scale;

    // Background
    this.cameras.main.setBackgroundColor(this.config.theme.bgColor);

    // Nebula glow
    const nebulaG = this.add.graphics().setDepth(DEPTH.BG);
    const nebulaColor = Phaser.Display.Color.HexStringToColor(this.config.theme.nebulaColor).color;
    nebulaG.fillStyle(nebulaColor, 0.15);
    nebulaG.fillEllipse(width * 0.7, height * 0.3, 400, 300);
    nebulaG.fillStyle(nebulaColor, 0.08);
    nebulaG.fillEllipse(width * 0.2, height * 0.6, 300, 200);

    // Stars
    this.starsGraphics = this.add.graphics().setDepth(DEPTH.STARS);
    const density = this.config.theme.starDensity;
    const starCount = Math.floor((width * height / 1000) * density);
    for (let i = 0; i < starCount; i++) {
      this.stars.push({
        x: Phaser.Math.Between(0, width),
        y: Phaser.Math.Between(0, height),
        speed: Phaser.Math.FloatBetween(20, 80),
        size: Phaser.Math.FloatBetween(0.5, 2),
      });
    }

    // Generate textures
    this.createTextures();

    // Player
    const hasCatTexture = this.textures.exists(CAT_TEXTURE_KEY);
    const playerTexture = hasCatTexture ? CAT_TEXTURE_KEY : 'ship';
    this.player = this.physics.add.sprite(width / 2, height - 60, playerTexture)
      .setDisplaySize(PLAYER_WIDTH, PLAYER_HEIGHT)
      .setDepth(DEPTH.PLAYER)
      .setCollideWorldBounds(true);

    // Bullet groups
    this.playerBullets = this.physics.add.group({ classType: Phaser.Physics.Arcade.Sprite });
    this.enemyBullets = this.physics.add.group({ classType: Phaser.Physics.Arcade.Sprite });

    // Enemy group
    this.enemyGroup = this.physics.add.group({ classType: Phaser.Physics.Arcade.Sprite });

    // Collisions
    this.physics.add.overlap(this.playerBullets, this.enemyGroup, (_bullet, _enemy) => {
      this.onBulletHitEnemy(
        _bullet as Phaser.Physics.Arcade.Sprite,
        _enemy as Phaser.Physics.Arcade.Sprite,
      );
    });

    this.physics.add.overlap(this.enemyBullets, this.player, (_player, _bullet) => {
      this.onPlayerHit(_bullet as Phaser.Physics.Arcade.Sprite);
    });

    this.physics.add.overlap(this.enemyGroup, this.player, (_player, _enemy) => {
      this.onPlayerHit(_enemy as Phaser.Physics.Arcade.Sprite);
    });

    // Input
    this.cursors = this.input.keyboard!.createCursorKeys();
    this.spaceKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);

    // Pause
    this.input.keyboard!.on('keydown-P', this.togglePause, this);
    this.input.keyboard!.on('keydown-ESC', this.togglePause, this);

    // Effects
    this.effects = new EffectsManager(this);

    // HUD
    this.waveText = this.add.text(width / 2, 20, '', {
      fontSize: '18px', fontFamily: '"Courier New", monospace', color: '#8888ff',
    }).setOrigin(0.5).setDepth(DEPTH.HUD);

    // Init
    this.gameScore.lives = this.lives;
    this.emitScoreUpdate({ ...this.gameScore });
    this.emitStatusChange('PLAYING' as GameStatus);

    this.spawnWave();
  }

  update(time: number, delta: number): void {
    if (this.isGameOver || this.hasWon) return;

    const dt = delta / 1000;

    this.updateStars(dt);
    this.handleInput(time);
    this.updateFormation(dt, time);
    this.updateEnemyShooting(time);
    this.cleanupOffscreen();
    this.flushDestroys(); // destroy after all iteration is done
    this.checkWaveComplete();
    this.updateHud();
  }

  // ─── Textures ─────────────────────────────────────────────────

  private createTextures(): void {
    // Player ship (fallback)
    if (!this.textures.exists('ship')) {
      const g = this.make.graphics({}, false);
      g.fillStyle(0xff8844);
      g.fillTriangle(PLAYER_WIDTH / 2, 0, 0, PLAYER_HEIGHT, PLAYER_WIDTH, PLAYER_HEIGHT);
      g.fillStyle(0xffaa66);
      g.fillRect(PLAYER_WIDTH / 2 - 6, PLAYER_HEIGHT * 0.3, 12, PLAYER_HEIGHT * 0.5);
      g.generateTexture('ship', PLAYER_WIDTH, PLAYER_HEIGHT);
      g.destroy();
    }

    // Player bullet
    if (!this.textures.exists('p-bullet')) {
      const g = this.make.graphics({}, false);
      g.fillStyle(0x44ff88);
      g.fillRoundedRect(0, 0, BULLET_W, BULLET_H, 2);
      g.generateTexture('p-bullet', BULLET_W, BULLET_H);
      g.destroy();
    }

    // Enemy bullet
    if (!this.textures.exists('e-bullet')) {
      const g = this.make.graphics({}, false);
      g.fillStyle(0xff4444);
      g.fillCircle(ENEMY_BULLET_SIZE / 2, ENEMY_BULLET_SIZE / 2, ENEMY_BULLET_SIZE / 2);
      g.generateTexture('e-bullet', ENEMY_BULLET_SIZE, ENEMY_BULLET_SIZE);
      g.destroy();
    }

    // Enemy textures per type
    for (const [key, color] of Object.entries(ENEMY_COLORS)) {
      const texKey = `enemy-${key}`;
      if (!this.textures.exists(texKey)) {
        const g = this.make.graphics({}, false);
        g.fillStyle(color);
        // Simple invader-style shape
        g.fillRect(4, 0, ENEMY_SIZE - 8, ENEMY_SIZE * 0.6);
        g.fillRect(0, ENEMY_SIZE * 0.3, ENEMY_SIZE, ENEMY_SIZE * 0.4);
        g.fillRect(8, ENEMY_SIZE * 0.6, 6, ENEMY_SIZE * 0.3);
        g.fillRect(ENEMY_SIZE - 14, ENEMY_SIZE * 0.6, 6, ENEMY_SIZE * 0.3);
        // Eyes
        g.fillStyle(0xff0000);
        g.fillCircle(ENEMY_SIZE * 0.35, ENEMY_SIZE * 0.35, 3);
        g.fillCircle(ENEMY_SIZE * 0.65, ENEMY_SIZE * 0.35, 3);
        g.generateTexture(texKey, ENEMY_SIZE, ENEMY_SIZE);
        g.destroy();
      }
    }

    // Boss texture
    if (!this.textures.exists('enemy-boss')) {
      const g = this.make.graphics({}, false);
      const s = ENEMY_SIZE * 2.5;
      g.fillStyle(0xcc3333);
      g.fillRoundedRect(0, 0, s, s * 0.7, 10);
      g.fillStyle(0xff4444);
      g.fillRect(s * 0.1, s * 0.1, s * 0.8, s * 0.4);
      // Crown
      g.fillStyle(0xffcc00);
      g.fillTriangle(s * 0.3, s * 0.05, s * 0.5, -s * 0.15, s * 0.7, s * 0.05);
      // Eyes
      g.fillStyle(0xffff00);
      g.fillCircle(s * 0.35, s * 0.35, 6);
      g.fillCircle(s * 0.65, s * 0.35, 6);
      g.generateTexture('enemy-boss', s, s * 0.7);
      g.destroy();
    }
  }

  // ─── Input ────────────────────────────────────────────────────

  private handleInput(time: number): void {
    const speed = this.config.playerConfig.moveSpeed;

    if (this.cursors.left.isDown) {
      this.player.body.setVelocityX(-speed);
    } else if (this.cursors.right.isDown) {
      this.player.body.setVelocityX(speed);
    } else {
      this.player.body.setVelocityX(0);
    }

    // Auto-fire while space is held (or up arrow)
    const fireInterval = 1000 / this.config.playerConfig.fireRate;
    if ((this.spaceKey.isDown || this.cursors.up.isDown) && time - this.lastFireTime >= fireInterval) {
      this.fireBullet();
      this.lastFireTime = time;
    }
  }

  private fireBullet(): void {
    const bullet = this.playerBullets.create(
      this.player.x, this.player.y - PLAYER_HEIGHT / 2, 'p-bullet'
    ) as Phaser.Physics.Arcade.Sprite;
    bullet.setDepth(DEPTH.BULLETS);
    (bullet.body as Phaser.Physics.Arcade.Body).setVelocityY(-this.config.playerConfig.bulletSpeed);
  }

  // ─── Wave / Enemy System ──────────────────────────────────────

  private spawnWave(): void {
    if (this.currentWaveIndex >= this.config.waves.length) {
      // All waves cleared — victory
      this.hasWon = true;
      this.emitLevelComplete({
        finalScore: this.gameScore.current,
        gameScore: { ...this.gameScore },
        victoryType: 'boss',
      });
      return;
    }

    const wave = this.config.waves[this.currentWaveIndex];
    this.formationBaseY = wave.startY;
    this.formationX = 0;
    this.waveStartTime = this.time.now;

    const screenCenterX = this.scale.width / 2;

    for (let row = 0; row < wave.rows.length; row++) {
      const cols = wave.rows[row];
      const rowWidth = cols.length * ENEMY_GAP_X;
      const rowStartX = screenCenterX - rowWidth / 2 + ENEMY_GAP_X / 2;

      for (let col = 0; col < cols.length; col++) {
        const key = cols[col];
        if (!key) continue;

        const def = this.config.enemies[key];
        if (!def) continue;

        const isBoss = key === 'boss';
        const size = isBoss ? ENEMY_SIZE * 2.5 : ENEMY_SIZE;
        const texKey = `enemy-${isBoss ? 'boss' : def.type}`;

        const ex = rowStartX + col * ENEMY_GAP_X;
        const ey = wave.startY + row * ENEMY_GAP_Y;

        const enemy = this.enemyGroup.create(ex, ey, texKey) as Phaser.Physics.Arcade.Sprite;
        enemy.setDisplaySize(size, isBoss ? size * 0.7 : size);
        enemy.setDepth(DEPTH.ENEMIES);
        enemy.setData('baseX', ex - screenCenterX); // offset from formation center
        enemy.setData('baseY', ey);
        enemy.setData('lastFireTime', 0);

        this.enemyDataMap.set(enemy, { def, health: isBoss ? 20 : def.health, isBoss });
      }
    }

    // Wave announcement
    const waveName = this.currentWaveIndex === this.config.waves.length - 1 ? 'BOSS WAVE!' : `Wave ${this.currentWaveIndex + 1}`;
    const announce = this.add.text(this.scale.width / 2, this.scale.height / 2, waveName, {
      fontSize: '32px', fontFamily: 'system-ui, sans-serif', fontStyle: 'bold',
      color: this.currentWaveIndex === this.config.waves.length - 1 ? '#ff4444' : '#8888ff',
    }).setOrigin(0.5).setDepth(DEPTH.HUD);

    this.tweens.add({
      targets: announce, alpha: 0, y: this.scale.height / 2 - 40,
      duration: 1500, ease: 'Power2',
      onComplete: () => announce.destroy(),
    });
  }

  private updateFormation(dt: number, time: number): void {
    const wave = this.config.waves[this.currentWaveIndex];
    if (!wave) return;

    // Sway
    const elapsed = (time - this.waveStartTime) / 1000;
    this.formationX = Math.sin(elapsed * 1.5) * wave.swayAmplitude;

    // Descent
    this.formationBaseY += wave.descentSpeed * dt;

    const screenCenterX = this.scale.width / 2;

    let enemiesReachedBottom = false;

    this.enemyGroup.children.iterate((child) => {
      const enemy = child as Phaser.Physics.Arcade.Sprite;
      if (!enemy.active) return true;

      const baseX = enemy.getData('baseX') as number;
      const baseY = enemy.getData('baseY') as number;
      const rowOffset = baseY - wave.startY;

      enemy.x = screenCenterX + this.formationX + baseX;
      enemy.y = this.formationBaseY + rowOffset;

      if (enemy.y > this.scale.height - 100) {
        enemiesReachedBottom = true;
      }

      return true;
    });

    // Trigger death once if any enemy breached the line
    if (enemiesReachedBottom) {
      this.handleDeath();
      // Reset formation back up to give player breathing room
      this.formationBaseY = wave.startY;
    }
  }

  private updateEnemyShooting(time: number): void {
    this.enemyGroup.children.iterate((child) => {
      const enemy = child as Phaser.Physics.Arcade.Sprite;
      if (!enemy.active) return true;

      const data = this.enemyDataMap.get(enemy);
      if (!data || !data.def.shoots) return true;

      const fireInterval = 1000 / (data.def.fireRate ?? 1);
      const lastFire = enemy.getData('lastFireTime') as number;

      if (time - lastFire >= fireInterval) {
        // Random chance to actually fire (prevents all enemies firing at once)
        if (Math.random() < 0.3) {
          const bullet = this.enemyBullets.create(enemy.x, enemy.y + ENEMY_SIZE / 2, 'e-bullet') as Phaser.Physics.Arcade.Sprite;
          bullet.setDepth(DEPTH.BULLETS);

          // Aim roughly toward player
          const angle = Phaser.Math.Angle.Between(enemy.x, enemy.y, this.player.x, this.player.y);
          const speed = 200;
          (bullet.body as Phaser.Physics.Arcade.Body).setVelocity(Math.cos(angle) * speed, Math.sin(angle) * speed);
        }
        enemy.setData('lastFireTime', time);
      }

      return true;
    });
  }

  // ─── Collisions ───────────────────────────────────────────────

  private deferDestroy(obj: Phaser.GameObjects.GameObject): void {
    if (this.pendingDestroys.has(obj)) return;
    this.pendingDestroys.add(obj);
    (obj as Phaser.Physics.Arcade.Sprite).setActive(false).setVisible(false);
    // Disable the physics body so it stops participating in overlaps
    const body = (obj as Phaser.Physics.Arcade.Sprite).body;
    if (body) body.enable = false;
  }

  private flushDestroys(): void {
    for (const obj of this.pendingDestroys) {
      obj.destroy();
    }
    this.pendingDestroys.clear();
  }

  private onBulletHitEnemy(bullet: Phaser.Physics.Arcade.Sprite, enemy: Phaser.Physics.Arcade.Sprite): void {
    this.deferDestroy(bullet);

    const data = this.enemyDataMap.get(enemy);
    if (!data) return;

    data.health--;

    if (data.health <= 0) {
      const cx = enemy.x;
      const cy = enemy.y;
      const points = data.def.points;

      this.gameScore.current += points;
      this.gameScore.streak++;
      if (this.gameScore.streak % 5 === 0) {
        this.gameScore.multiplier = Math.min(this.gameScore.multiplier + 1, 5);
      }

      const color = ENEMY_COLORS[data.def.type] ?? 0xff4444;
      this.effects.spawnParticles(cx, cy, color, data.isBoss ? 20 : 8, data.isBoss ? 250 : 150);
      this.effects.floatingScore(cx, cy, `+${points}`);

      if (data.isBoss) {
        this.effects.shake(0.02, 300);
        this.effects.flash(0xffffff, 200);
      }

      this.enemyDataMap.delete(enemy);
      this.deferDestroy(enemy);
      this.emitScoreUpdate({ ...this.gameScore });
    } else {
      // Damage flash
      enemy.setTint(0xff8888);
      this.time.delayedCall(100, () => {
        if (enemy.active) enemy.clearTint();
      });
      this.effects.shake(0.005, 50);
    }
  }

  private onPlayerHit(source: Phaser.Physics.Arcade.Sprite): void {
    const now = this.time.now;
    if (now < this.invincibleUntil) return;

    // Only destroy enemy bullets, not enemies themselves
    if (this.enemyBullets.contains(source)) {
      this.deferDestroy(source);
    }

    this.handleDeath();
  }

  private handleDeath(): void {
    const now = this.time.now;
    if (now < this.invincibleUntil) return;

    this.lives--;
    this.gameScore.lives = this.lives;
    this.gameScore.streak = 0;
    this.gameScore.multiplier = 1;

    this.effects.flash(0xff0000, 200);
    this.effects.shake(0.02, 200);

    this.emitLivesChanged(this.lives);
    this.emitScoreUpdate({ ...this.gameScore });

    if (this.lives <= 0) {
      this.isGameOver = true;
      this.emitGameOver(this.gameScore.current);
      return;
    }

    // Invincibility window
    this.invincibleUntil = now + 2000;
    this.tweens.add({
      targets: this.player, alpha: 0.3,
      duration: 100, yoyo: true, repeat: 9,
      onComplete: () => this.player.setAlpha(1),
    });
  }

  // ─── Wave Management ──────────────────────────────────────────

  private waveTransitioning = false;

  private checkWaveComplete(): void {
    if (this.waveTransitioning || this.hasWon || this.isGameOver) return;
    if (this.enemyGroup.countActive() === 0) {
      this.waveTransitioning = true;
      this.currentWaveIndex++;
      this.time.delayedCall(1500, () => {
        this.waveTransitioning = false;
        this.spawnWave();
      });
    }
  }

  // ─── Background ───────────────────────────────────────────────

  private updateStars(dt: number): void {
    this.starsGraphics.clear();
    const h = this.scale.height;

    for (const star of this.stars) {
      star.y += star.speed * dt;
      if (star.y > h) {
        star.y = 0;
        star.x = Phaser.Math.Between(0, this.scale.width);
      }

      const alpha = 0.3 + (star.speed / 80) * 0.7;
      this.starsGraphics.fillStyle(0xffffff, alpha);
      this.starsGraphics.fillCircle(star.x, star.y, star.size);
    }
  }

  // ─── Cleanup ──────────────────────────────────────────────────

  private cleanupOffscreen(): void {
    const h = this.scale.height;

    this.playerBullets.children.iterate((child) => {
      const b = child as Phaser.Physics.Arcade.Sprite;
      if (b.active && b.y < -20) this.deferDestroy(b);
      return true;
    });

    this.enemyBullets.children.iterate((child) => {
      const b = child as Phaser.Physics.Arcade.Sprite;
      if (b.active && (b.y > h + 20 || b.y < -20 || b.x < -20 || b.x > this.scale.width + 20)) this.deferDestroy(b);
      return true;
    });
  }

  // ─── HUD ──────────────────────────────────────────────────────

  private updateHud(): void {
    const isBoss = this.currentWaveIndex === this.config.waves.length - 1;
    this.waveText.setText(isBoss ? 'BOSS FIGHT' : `Wave ${this.currentWaveIndex + 1}/${this.config.waves.length}`);
    this.waveText.setColor(isBoss ? '#ff4444' : '#8888ff');
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
