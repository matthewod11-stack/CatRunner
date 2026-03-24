import Phaser from 'phaser';
import { SceneBridge } from './shared/SceneBridge';
import type { LauncherSceneInitData } from './shared/bridgeProtocol';
import type { LauncherLevelConfig, LauncherBlock, LauncherStructure, GameScore, GameStatus } from '../types';
import { loadCatSprite, CAT_TEXTURE_KEY } from './shared/SpriteLoader';
import { EffectsManager } from './shared/EffectsManager';

// ─── Constants ──────────────────────────────────────────────────────

const DEPTH = {
  BG: 0,
  WALL: 1,
  COUNTER: 5,
  BLOCKS: 10,
  PROJECTILE: 15,
  PLAYER: 20,
  AIM_LINE: 25,
  EFFECTS: 30,
  HUD: 50,
};

const MATERIAL_COLORS: Record<string, number> = {
  glass: 0x88ccff,
  wood: 0xc4842d,
  metal: 0x888899,
};

const MATERIAL_EDGE_COLORS: Record<string, number> = {
  glass: 0x66aadd,
  wood: 0x9a6820,
  metal: 0x666677,
};

// ─── Scene ──────────────────────────────────────────────────────────

export default class LauncherScene extends SceneBridge {
  // Config
  private config!: LauncherLevelConfig;

  // Player (cat)
  private catSprite!: Phaser.GameObjects.Sprite | Phaser.GameObjects.Image;

  // Game state
  private lives = 3;
  private gameScore: GameScore = {
    current: 0, high: 0, coins: 0,
    multiplier: 1, streak: 0, lives: 3,
  };
  private currentRound = 0;
  private projectilesLeft = 0;
  private isGameOver = false;
  private hasWon = false;
  private isLaunching = false; // projectile in flight

  // Aiming
  private isDragging = false;
  private dragStartX = 0;
  private dragStartY = 0;
  private dragCurrentX = 0;
  private dragCurrentY = 0;
  private aimLine!: Phaser.GameObjects.Graphics;

  // Projectile
  private projectile: Phaser.Types.Physics.Arcade.SpriteWithDynamicBody | null = null;

  // Blocks
  private blockGroup!: Phaser.Physics.Arcade.StaticGroup;
  private blockData: Map<Phaser.GameObjects.GameObject, { health: number; maxHealth: number; points: number; material: string }> = new Map();

  // Current structure
  private currentStructure: LauncherStructure | null = null;

  // Managers
  private effects!: EffectsManager;

  // HUD
  private roundText!: Phaser.GameObjects.Text;
  private ammoText!: Phaser.GameObjects.Text;
  private instructionText!: Phaser.GameObjects.Text;

  // ─── Lifecycle ──────────────────────────────────────────────────

  init(data: LauncherSceneInitData): void {
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
    this.drawBackground(width, height);

    // Counter surface
    const counterG = this.add.graphics().setDepth(DEPTH.COUNTER);
    const cColor = Phaser.Display.Color.HexStringToColor(this.config.theme.counterColor).color;
    counterG.fillStyle(cColor);
    counterG.fillRect(0, this.config.counterY, width, height - this.config.counterY);
    // Counter edge highlight
    counterG.fillStyle(cColor + 0x222222);
    counterG.fillRect(0, this.config.counterY, width, 4);

    // Cat sprite (launch point)
    const hasCatTexture = this.textures.exists(CAT_TEXTURE_KEY);
    if (hasCatTexture) {
      this.catSprite = this.add.sprite(this.config.launchX, this.config.counterY - 30, CAT_TEXTURE_KEY)
        .setDisplaySize(50, 50).setDepth(DEPTH.PLAYER);
    } else {
      const g = this.make.graphics({}, false);
      g.fillStyle(0xff8844);
      g.fillRoundedRect(0, 0, 50, 50, 8);
      g.generateTexture('cat-launcher', 50, 50);
      g.destroy();
      this.catSprite = this.add.image(this.config.launchX, this.config.counterY - 30, 'cat-launcher')
        .setDepth(DEPTH.PLAYER);
    }

    // Block group
    this.blockGroup = this.physics.add.staticGroup();

    // Aim line graphics
    this.aimLine = this.add.graphics().setDepth(DEPTH.AIM_LINE);

    // Generate projectile texture
    if (!this.textures.exists('projectile')) {
      const g = this.make.graphics({}, false);
      const r = this.config.projectileConfig.radius;
      g.fillStyle(0xff6644);
      g.fillCircle(r, r, r);
      g.lineStyle(2, 0xcc4422);
      g.strokeCircle(r, r, r - 1);
      g.generateTexture('projectile', r * 2, r * 2);
      g.destroy();
    }

    // Effects
    this.effects = new EffectsManager(this);

    // HUD (fixed to camera)
    this.roundText = this.add.text(16, 16, '', {
      fontSize: '18px', fontFamily: '"Courier New", monospace', color: '#92400e',
    }).setDepth(DEPTH.HUD);

    this.ammoText = this.add.text(16, 40, '', {
      fontSize: '16px', fontFamily: '"Courier New", monospace', color: '#b45309',
    }).setDepth(DEPTH.HUD);

    this.instructionText = this.add.text(width / 2, this.config.counterY - 80, 'Drag from cat to aim, release to launch!', {
      fontSize: '16px', fontFamily: 'system-ui, sans-serif', color: '#92400e',
      backgroundColor: '#fef3c7aa', padding: { x: 12, y: 6 },
    }).setOrigin(0.5).setDepth(DEPTH.HUD);

    // Fade instruction after 3s
    this.time.delayedCall(3000, () => {
      this.tweens.add({
        targets: this.instructionText, alpha: 0, duration: 800,
        onComplete: () => this.instructionText.destroy(),
      });
    });

    // Input
    this.input.on('pointerdown', this.onPointerDown, this);
    this.input.on('pointermove', this.onPointerMove, this);
    this.input.on('pointerup', this.onPointerUp, this);

    // Pause
    this.input.keyboard!.on('keydown-P', this.togglePause, this);
    this.input.keyboard!.on('keydown-ESC', this.togglePause, this);

    // Start first round
    this.gameScore.lives = this.lives;
    this.emitScoreUpdate({ ...this.gameScore });
    this.emitStatusChange('PLAYING' as GameStatus);

    this.startRound();
  }

  update(_time: number, _delta: number): void {
    if (this.isGameOver || this.hasWon) return;

    // Check if projectile has stopped or gone off screen
    if (this.projectile && this.isLaunching) {
      const p = this.projectile;
      const body = p.body;

      // Off screen or stopped
      if (p.y > this.scale.height + 50 || p.x > this.scale.width + 50 || p.x < -50) {
        this.onProjectileDone();
      } else if (body && Math.abs(body.velocity.x) < 5 && Math.abs(body.velocity.y) < 5 && p.y >= this.config.counterY - 5) {
        // Settled on counter
        this.time.delayedCall(500, () => {
          if (this.isLaunching) this.onProjectileDone();
        });
      }
    }

    this.updateHud();
  }

  // ─── Rounds ───────────────────────────────────────────────────

  private startRound(): void {
    this.currentRound++;
    this.projectilesLeft = this.config.projectilesPerRound;

    // Pick a random structure
    const structures = this.config.structures;
    this.currentStructure = structures[Phaser.Math.Between(0, structures.length - 1)];

    // Clear old blocks
    this.blockGroup.clear(true, true);
    this.blockData.clear();

    // Build the structure
    this.buildStructure(this.currentStructure);
  }

  private buildStructure(structure: LauncherStructure): void {
    const baseX = this.scale.width - structure.offsetX;
    const baseY = this.config.counterY;

    for (const blockDef of structure.blocks) {
      const bx = baseX + blockDef.x;
      const by = baseY + blockDef.y - blockDef.height; // blocks stack upward from counter

      const key = `block-${blockDef.material}-${blockDef.width}x${blockDef.height}`;
      if (!this.textures.exists(key)) {
        const g = this.make.graphics({}, false);
        g.fillStyle(MATERIAL_COLORS[blockDef.material] ?? 0x888888);
        g.fillRect(0, 0, blockDef.width, blockDef.height);
        g.lineStyle(2, MATERIAL_EDGE_COLORS[blockDef.material] ?? 0x666666);
        g.strokeRect(1, 1, blockDef.width - 2, blockDef.height - 2);
        // Crack lines for wood
        if (blockDef.material === 'wood') {
          g.lineStyle(1, 0x7a5218, 0.3);
          g.lineBetween(5, blockDef.height * 0.3, blockDef.width - 5, blockDef.height * 0.35);
          g.lineBetween(3, blockDef.height * 0.7, blockDef.width - 8, blockDef.height * 0.65);
        }
        // Shine for glass
        if (blockDef.material === 'glass') {
          g.fillStyle(0xffffff, 0.3);
          g.fillRect(3, 3, blockDef.width * 0.3, blockDef.height * 0.2);
        }
        g.generateTexture(key, blockDef.width, blockDef.height);
        g.destroy();
      }

      const block = this.blockGroup.create(bx + blockDef.width / 2, by + blockDef.height / 2, key) as Phaser.Physics.Arcade.Sprite;
      block.setDepth(DEPTH.BLOCKS);
      block.refreshBody();

      this.blockData.set(block, {
        health: blockDef.health,
        maxHealth: blockDef.health,
        points: blockDef.points,
        material: blockDef.material,
      });
    }
  }

  // ─── Aiming & Launching ───────────────────────────────────────

  private onPointerDown(pointer: Phaser.Input.Pointer): void {
    if (this.isLaunching || this.isGameOver || this.hasWon) return;
    if (this.projectilesLeft <= 0) return;

    // Must drag from near the cat
    const dx = pointer.x - this.config.launchX;
    const dy = pointer.y - (this.config.counterY - 30);
    if (Math.sqrt(dx * dx + dy * dy) > 100) return;

    this.isDragging = true;
    this.dragStartX = pointer.x;
    this.dragStartY = pointer.y;
    this.dragCurrentX = pointer.x;
    this.dragCurrentY = pointer.y;
  }

  private onPointerMove(pointer: Phaser.Input.Pointer): void {
    if (!this.isDragging) return;

    this.dragCurrentX = pointer.x;
    this.dragCurrentY = pointer.y;

    // Clamp drag distance
    const maxDist = this.config.projectileConfig.maxDragDistance;
    let dx = this.dragStartX - this.dragCurrentX;
    let dy = this.dragStartY - this.dragCurrentY;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist > maxDist) {
      dx = (dx / dist) * maxDist;
      dy = (dy / dist) * maxDist;
      this.dragCurrentX = this.dragStartX - dx;
      this.dragCurrentY = this.dragStartY - dy;
    }

    this.drawAimLine();
  }

  private onPointerUp(): void {
    if (!this.isDragging) return;
    this.isDragging = false;
    this.aimLine.clear();

    // Calculate launch velocity (opposite of drag direction, like slingshot)
    const power = this.config.projectileConfig.powerMultiplier;
    const vx = (this.dragStartX - this.dragCurrentX) * power;
    const vy = (this.dragStartY - this.dragCurrentY) * power;

    // Minimum power threshold
    if (Math.sqrt(vx * vx + vy * vy) < 100) return;

    this.launchProjectile(vx, vy);
  }

  private drawAimLine(): void {
    this.aimLine.clear();

    // Draw slingshot line from cat to drag point
    this.aimLine.lineStyle(3, 0xff6644, 0.6);
    this.aimLine.lineBetween(
      this.config.launchX, this.config.counterY - 30,
      this.dragCurrentX, this.dragCurrentY
    );

    // Draw trajectory preview (dotted arc)
    const power = this.config.projectileConfig.powerMultiplier;
    const vx = (this.dragStartX - this.dragCurrentX) * power;
    const vy = (this.dragStartY - this.dragCurrentY) * power;
    const gravity = this.config.projectileConfig.gravity;

    this.aimLine.fillStyle(0xff6644, 0.4);
    for (let t = 0; t < 1.2; t += 0.05) {
      const px = this.config.launchX + vx * t;
      const py = (this.config.counterY - 30) + vy * t + 0.5 * gravity * t * t;
      if (py > this.config.counterY + 20 || px > this.scale.width) break;
      this.aimLine.fillCircle(px, py, 3);
    }

    // Power indicator
    const dist = Math.sqrt(
      (this.dragStartX - this.dragCurrentX) ** 2 +
      (this.dragStartY - this.dragCurrentY) ** 2
    );
    const pct = Math.min(100, (dist / this.config.projectileConfig.maxDragDistance) * 100);
    const color = pct > 70 ? '#ef4444' : pct > 40 ? '#f59e0b' : '#22c55e';
    this.aimLine.fillStyle(Phaser.Display.Color.HexStringToColor(color).color);
    this.aimLine.fillCircle(this.dragCurrentX, this.dragCurrentY, 8);
  }

  private launchProjectile(vx: number, vy: number): void {
    this.isLaunching = true;
    this.projectilesLeft--;

    const r = this.config.projectileConfig.radius;

    this.projectile = this.physics.add.sprite(
      this.config.launchX, this.config.counterY - 30, 'projectile'
    ).setDepth(DEPTH.PROJECTILE);

    this.projectile.body.setCircle(r);
    this.projectile.body.setVelocity(vx, vy);
    this.projectile.body.setGravityY(this.config.projectileConfig.gravity);
    this.projectile.body.setBounce(0.3, 0.3);
    this.projectile.body.setCollideWorldBounds(false);

    // Collision with blocks
    this.physics.add.collider(this.projectile, this.blockGroup, (_proj, blockObj) => {
      this.onBlockHit(blockObj as Phaser.Physics.Arcade.Sprite);
    });

    // Cat launch animation (squash)
    this.tweens.add({
      targets: this.catSprite,
      scaleX: 1.3, scaleY: 0.7,
      duration: 100,
      yoyo: true,
    });
  }

  private onBlockHit(block: Phaser.Physics.Arcade.Sprite): void {
    const data = this.blockData.get(block);
    if (!data) return;

    data.health--;

    if (data.health <= 0) {
      // Destroyed
      const cx = block.x;
      const cy = block.y;

      this.gameScore.current += data.points;
      this.gameScore.streak++;
      if (this.gameScore.streak % 3 === 0) {
        this.gameScore.multiplier = Math.min(this.gameScore.multiplier + 1, 5);
      }

      this.effects.spawnParticles(cx, cy, MATERIAL_COLORS[data.material] ?? 0x888888, 8, 150);
      this.effects.floatingScore(cx, cy, `+${data.points}`);

      this.blockData.delete(block);
      block.destroy();

      this.emitScoreUpdate({ ...this.gameScore });
    } else {
      // Damaged — flash and tint darker
      const tint = data.health === 1 ? 0xff8888 : 0xffcccc;
      block.setTint(tint);
      this.effects.shake(0.005, 50);
    }
  }

  private onProjectileDone(): void {
    this.isLaunching = false;
    if (this.projectile) {
      this.projectile.destroy();
      this.projectile = null;
    }

    // Check if all blocks destroyed
    if (this.blockGroup.countActive() === 0) {
      // Bonus for clearing the structure
      const bonus = 50 * this.currentRound;
      this.gameScore.current += bonus;
      this.effects.floatingScore(this.scale.width / 2, this.scale.height / 2, `CLEARED! +${bonus}`, '#22c55e');
      this.emitScoreUpdate({ ...this.gameScore });

      // Check victory
      if (this.gameScore.current >= (this.config.victoryCondition as { type: 'score'; target: number }).target) {
        this.hasWon = true;
        this.emitLevelComplete({
          levelId: 'KITCHEN',
          finalScore: this.gameScore.current,
          gameScore: { ...this.gameScore },
          victoryType: 'score',
        });
        return;
      }

      // Next round
      if (this.currentRound < this.config.totalRounds) {
        this.time.delayedCall(1000, () => this.startRound());
      } else {
        // Out of rounds — check score
        this.checkEndCondition();
      }
      return;
    }

    // Still blocks left — check ammo
    if (this.projectilesLeft <= 0) {
      // Out of ammo for this round
      if (this.currentRound < this.config.totalRounds) {
        this.time.delayedCall(800, () => this.startRound());
      } else {
        this.checkEndCondition();
      }
    }
  }

  private checkEndCondition(): void {
    const target = (this.config.victoryCondition as { type: 'score'; target: number }).target;
    if (this.gameScore.current >= target) {
      this.hasWon = true;
      this.emitLevelComplete({
        levelId: 'KITCHEN',
        finalScore: this.gameScore.current,
        gameScore: { ...this.gameScore },
        victoryType: 'score',
      });
    } else {
      this.isGameOver = true;
      this.emitGameOver(this.gameScore.current);
    }
  }

  // ─── Background ───────────────────────────────────────────────

  private drawBackground(w: number, h: number): void {
    const g = this.add.graphics().setDepth(DEPTH.BG);

    // Wall gradient
    const [top, bottom] = this.config.theme.bgGradient;
    const topColor = Phaser.Display.Color.HexStringToColor(top);
    const botColor = Phaser.Display.Color.HexStringToColor(bottom);

    for (let y = 0; y < this.config.counterY; y++) {
      const t = y / this.config.counterY;
      const r = Phaser.Math.Linear(topColor.red, botColor.red, t);
      const gr = Phaser.Math.Linear(topColor.green, botColor.green, t);
      const b = Phaser.Math.Linear(topColor.blue, botColor.blue, t);
      g.fillStyle(Phaser.Display.Color.GetColor(r, gr, b));
      g.fillRect(0, y, w, 1);
    }

    // Kitchen wall details — tile pattern
    const wallG = this.add.graphics().setDepth(DEPTH.WALL);
    wallG.lineStyle(1, 0xd4c4a0, 0.15);
    const tileSize = 40;
    for (let x = 0; x < w; x += tileSize) {
      wallG.lineBetween(x, 0, x, this.config.counterY);
    }
    for (let y = 0; y < this.config.counterY; y += tileSize) {
      wallG.lineBetween(0, y, w, y);
    }
  }

  // ─── HUD ──────────────────────────────────────────────────────

  private updateHud(): void {
    this.roundText.setText(`Round ${this.currentRound}/${this.config.totalRounds}`);
    this.ammoText.setText(`Ammo: ${'●'.repeat(this.projectilesLeft)}${'○'.repeat(Math.max(0, this.config.projectilesPerRound - this.projectilesLeft))}`);
  }

  // ─── Pause ────────────────────────────────────────────────────

  private togglePause(): void {
    if (this.isGameOver || this.hasWon) return;
    const paused = !this.scene.isPaused();
    if (paused) this.scene.pause();
    else this.scene.resume();
    this.emitHudUpdate({ isPaused: paused });
  }

  // ─── Runtime Patch ────────────────────────────────────────────

  applyRuntimePatch(patch: Record<string, unknown>): void {
    if (typeof patch.isPaused === 'boolean') {
      if (patch.isPaused && !this.scene.isPaused()) this.scene.pause();
      else if (!patch.isPaused && this.scene.isPaused()) this.scene.resume();
    }
  }
}
