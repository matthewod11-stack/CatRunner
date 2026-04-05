import Phaser from 'phaser';
import { SceneBridge } from './shared/SceneBridge';
import type { LauncherSceneInitData } from './shared/bridgeProtocol';
import { PhaserAudio } from './shared/PhaserAudio';
import type { LauncherLevelConfig, LauncherStructure, GameScore, GameStatus } from '../types';
import type { LauncherBlockKind } from '../types';
import { loadCatSprite, CAT_TEXTURE_KEY } from './shared/SpriteLoader';
import { EffectsManager } from './shared/EffectsManager';
import { pickStructureKey, resolveActForRound } from './launcher/actPick';
import { findExplosionNeighborIds } from './launcher/explosion';
import { KitchenBackground } from './launcher/KitchenBackground';
import { StructureBuilder, type LauncherBlockRuntime } from './launcher/StructureBuilder';
import { HazardManager } from './launcher/HazardManager';
import { CritterManager } from './launcher/CritterManager';
import { PowerupManager } from './launcher/PowerupManager';
import { DEPTH } from './launcher/types';

const MATERIAL_COLORS: Record<string, number> = {
  glass: 0x88ccff,
  wood: 0xc4842d,
  metal: 0x888899,
};

export default class LauncherScene extends SceneBridge {
  private config!: LauncherLevelConfig;

  private catSprite!: Phaser.GameObjects.Sprite | Phaser.GameObjects.Image;

  private lives = 3;
  private gameScore: GameScore = {
    current: 0,
    high: 0,
    coins: 0,
    multiplier: 1,
    streak: 0,
    lives: 3,
  };
  private currentRound = 0;
  private projectilesLeft = 0;
  private maxAmmoThisRound = 0;
  private isGameOver = false;
  private hasWon = false;
  private isLaunching = false;

  private isDragging = false;
  private dragStartX = 0;
  private dragStartY = 0;
  private dragCurrentX = 0;
  private dragCurrentY = 0;
  private aimLine!: Phaser.GameObjects.Graphics;

  private projectile: Phaser.Types.Physics.Arcade.SpriteWithDynamicBody | null = null;

  private currentStructure: LauncherStructure | null = null;

  private kitchenBg!: KitchenBackground;
  private structure!: StructureBuilder;
  private hazards!: HazardManager;
  private critters!: CritterManager;
  private powerups = new PowerupManager();
  private effects!: EffectsManager;
  private audio!: PhaserAudio;

  private roundText!: Phaser.GameObjects.Text;
  private ammoText!: Phaser.GameObjects.Text;
  private powerText!: Phaser.GameObjects.Text;
  private instructionText!: Phaser.GameObjects.Text;

  private pendingPierceExtra = 0;
  private pendingCluster = false;

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

    this.kitchenBg = new KitchenBackground(this, this.config);
    this.kitchenBg.create();

    this.structure = new StructureBuilder(this, this.config);
    this.structure.create();

    this.hazards = new HazardManager(
      this,
      this.config,
      () => this.projectile,
      () => this.isBossRound()
    );
    this.hazards.create();

    this.critters = new CritterManager(this);
    this.critters.initCallbacks({
      addScore: (d, x, y, l) => this.addScoreDelta(d, x, y, l),
      playSfx: (k) => this.audio.playSfx(k as Parameters<PhaserAudio['playSfx']>[0]),
    });
    this.critters.create();

    const hasCatTexture = this.textures.exists(CAT_TEXTURE_KEY);
    if (hasCatTexture) {
      this.catSprite = this.add
        .sprite(this.config.launchX, this.config.counterY - 30, CAT_TEXTURE_KEY)
        .setDisplaySize(50, 50)
        .setDepth(DEPTH.PLAYER);
    } else {
      const g = this.make.graphics({}, false);
      g.fillStyle(0xff8844);
      g.fillRoundedRect(0, 0, 50, 50, 8);
      g.generateTexture('cat-launcher', 50, 50);
      g.destroy();
      this.catSprite = this.add
        .image(this.config.launchX, this.config.counterY - 30, 'cat-launcher')
        .setDepth(DEPTH.PLAYER);
    }

    this.aimLine = this.add.graphics().setDepth(DEPTH.AIM_LINE);

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

    this.effects = new EffectsManager(this);
    this.audio = new PhaserAudio(this);

    this.roundText = this.add
      .text(16, 16, '', {
        fontSize: '18px',
        fontFamily: '"Courier New", monospace',
        color: '#92400e',
      })
      .setDepth(DEPTH.HUD);

    this.ammoText = this.add
      .text(16, 40, '', {
        fontSize: '16px',
        fontFamily: '"Courier New", monospace',
        color: '#b45309',
      })
      .setDepth(DEPTH.HUD);

    this.powerText = this.add
      .text(16, 64, '', {
        fontSize: '14px',
        fontFamily: '"Courier New", monospace',
        color: '#7c3aed',
      })
      .setDepth(DEPTH.HUD);

    this.instructionText = this.add
      .text(width / 2, this.config.counterY - 80, 'Drag from cat to aim, release to launch!', {
        fontSize: '16px',
        fontFamily: 'system-ui, sans-serif',
        color: '#92400e',
        backgroundColor: '#fef3c7aa',
        padding: { x: 12, y: 6 },
      })
      .setOrigin(0.5)
      .setDepth(DEPTH.HUD);

    this.time.delayedCall(3000, () => {
      this.tweens.add({
        targets: this.instructionText,
        alpha: 0,
        duration: 800,
        onComplete: () => this.instructionText.destroy(),
      });
    });

    this.input.on('pointerdown', this.onPointerDown, this);
    this.input.on('pointermove', this.onPointerMove, this);
    this.input.on('pointerup', this.onPointerUp, this);

    this.input.keyboard!.on('keydown-P', this.togglePause, this);
    this.input.keyboard!.on('keydown-ESC', this.togglePause, this);

    this.gameScore.lives = this.lives;
    this.emitScoreUpdate({ ...this.gameScore });
    this.emitStatusChange('PLAYING' as GameStatus);

    this.startRound(false);
  }

  update(_time: number, delta: number): void {
    if (this.isGameOver || this.hasWon) return;

    this.hazards.update(_time, delta);

    if (this.projectile && this.isLaunching) {
      this.critters.onProjectileHitCritters(this.projectile);

      const p = this.projectile;
      const body = p.body;

      if (p.y > this.scale.height + 50 || p.x > this.scale.width + 50 || p.x < -50) {
        this.onProjectileDone();
      } else if (
        body &&
        Math.abs(body.velocity.x) < 5 &&
        Math.abs(body.velocity.y) < 5 &&
        p.y >= this.config.counterY - 5
      ) {
        this.time.delayedCall(500, () => {
          if (this.isLaunching) this.onProjectileDone();
        });
      }
    }

    this.updateHud();
  }

  private isBossRound(): boolean {
    return !!this.config.boss && this.currentRound === this.config.boss.roundIndex;
  }

  private pickStructureForRound(): LauncherStructure {
    if (this.isBossRound() && this.config.boss) {
      return this.config.boss.structure;
    }
    const presets = this.config.structurePresets;
    const acts = this.config.acts;
    if (presets && acts && acts.length > 0) {
      const act = resolveActForRound(this.currentRound, acts);
      if (act) {
        const key = pickStructureKey(act, Math.random);
        const s = presets[key];
        if (s) return s;
      }
    }
    const pool = this.config.structures;
    return pool[Phaser.Math.Between(0, pool.length - 1)];
  }

  private startRound(isRetry: boolean): void {
    if (!isRetry) {
      this.currentRound++;
    }

    if (this.isBossRound() && this.config.boss) {
      this.projectilesLeft = this.config.boss.shots;
      this.maxAmmoThisRound = this.config.boss.shots;
      this.currentStructure = this.config.boss.structure;
    } else {
      this.projectilesLeft = this.config.projectilesPerRound;
      this.maxAmmoThisRound = this.config.projectilesPerRound;
      if (!isRetry) {
        this.currentStructure = this.pickStructureForRound();
      }
    }

    if (!this.currentStructure) {
      this.currentStructure = this.config.structures[0];
    }

    this.structure.buildFromStructure(
      this.currentStructure,
      this.scale.width,
      this.config.counterY
    );
    this.critters.spawnForRound(this.currentRound, this.isBossRound(), this.structure);
  }

  private onPointerDown(pointer: Phaser.Input.Pointer): void {
    if (this.isLaunching || this.isGameOver || this.hasWon) return;
    if (this.projectilesLeft <= 0) return;

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

    const power = this.config.projectileConfig.powerMultiplier;
    const vx = (this.dragStartX - this.dragCurrentX) * power;
    const vy = (this.dragStartY - this.dragCurrentY) * power;

    if (Math.sqrt(vx * vx + vy * vy) < 100) return;

    this.launchProjectile(vx, vy);
  }

  private drawAimLine(): void {
    this.aimLine.clear();

    this.aimLine.lineStyle(3, 0xff6644, 0.6);
    this.aimLine.lineBetween(
      this.config.launchX,
      this.config.counterY - 30,
      this.dragCurrentX,
      this.dragCurrentY
    );

    const power = this.config.projectileConfig.powerMultiplier;
    const vx = (this.dragStartX - this.dragCurrentX) * power;
    const vy = (this.dragStartY - this.dragCurrentY) * power;
    const gravity = this.config.projectileConfig.gravity;

    this.aimLine.fillStyle(0xff6644, 0.4);
    for (let t = 0; t < 1.2; t += 0.05) {
      const px = this.config.launchX + vx * t;
      const py = this.config.counterY - 30 + vy * t + 0.5 * gravity * t * t;
      if (py > this.config.counterY + 20 || px > this.scale.width) break;
      this.aimLine.fillCircle(px, py, 3);
    }

    const dist = Math.sqrt(
      (this.dragStartX - this.dragCurrentX) ** 2 + (this.dragStartY - this.dragCurrentY) ** 2
    );
    const pct = Math.min(100, (dist / this.config.projectileConfig.maxDragDistance) * 100);
    const color = pct > 70 ? '#ef4444' : pct > 40 ? '#f59e0b' : '#22c55e';
    this.aimLine.fillStyle(Phaser.Display.Color.HexStringToColor(color).color);
    this.aimLine.fillCircle(this.dragCurrentX, this.dragCurrentY, 8);
  }

  private launchProjectile(vx: number, vy: number): void {
    this.isLaunching = true;
    this.projectilesLeft--;

    const consumed = this.powerups.consumeForLaunch();
    this.pendingPierceExtra = consumed === 'piercing' ? 1 : 0;
    this.pendingCluster = consumed === 'cluster';

    const r = this.config.projectileConfig.radius;

    this.projectile = this.physics.add.sprite(
      this.config.launchX,
      this.config.counterY - 30,
      'projectile'
    ).setDepth(DEPTH.PROJECTILE);

    this.projectile.body.setCircle(r);
    this.projectile.body.setVelocity(vx, vy);
    this.projectile.setGravityY(this.config.projectileConfig.gravity);
    this.projectile.body.setBounce(0.3, 0.3);
    this.projectile.body.setCollideWorldBounds(false);

    this.physics.add.collider(this.projectile, this.structure.getBlockGroup(), (_proj, blockObj) => {
      this.onBlockHit(blockObj as Phaser.Physics.Arcade.Sprite);
    });

    this.audio.playSfx('jump');
    this.tweens.add({
      targets: this.catSprite,
      scaleX: 1.3,
      scaleY: 0.7,
      duration: 100,
      yoyo: true,
    });
  }

  private cheeseWardShielded(runtime: LauncherBlockRuntime): boolean {
    if (runtime.kind !== 'cheese_ward') return false;
    const bounds = this.structure.getActiveBlockBounds();
    const nids = findExplosionNeighborIds(bounds, runtime.id);
    for (const nid of nids) {
      const n = this.structure.getRuntimeById(nid);
      if (n && n.kind !== 'cheese_ward' && n.health > 0) return true;
    }
    return false;
  }

  private onBlockHit(block: Phaser.Physics.Arcade.Sprite): void {
    const data = this.structure.getBlockData().get(block);
    if (!data || !block.active) return;

    if (this.cheeseWardShielded(data)) {
      this.effects.shake(0.004, 40);
      this.audio.playSfx('hit');
      return;
    }

    let dmg = 1 + this.pendingPierceExtra;
    this.pendingPierceExtra = 0;

    const doCluster = this.pendingCluster;
    this.pendingCluster = false;

    this.applyDamageToBlock(block, data, dmg);

    if (doCluster && block.active) {
      this.applyNeighborSplash(block, 1);
    }

    if (data.kind === 'ice' && this.projectile?.body) {
      this.projectile.setBounce(0.88, 0.88);
    }
  }

  private applyNeighborSplash(fromBlock: Phaser.Physics.Arcade.Sprite, amount: number): void {
    const data = this.structure.getBlockData().get(fromBlock);
    if (!data) return;
    const bounds = this.structure.getActiveBlockBounds();
    const nids = findExplosionNeighborIds(bounds, data.id);
    for (const nid of nids) {
      const spr = this.structure.getSpriteById(nid);
      const rt = spr ? this.structure.getBlockData().get(spr) : undefined;
      if (spr && rt && spr.active) {
        this.applyDamageToBlock(spr, rt, amount);
      }
    }
  }

  private applyDamageToBlock(
    block: Phaser.Physics.Arcade.Sprite,
    data: LauncherBlockRuntime,
    amount: number
  ): void {
    if (this.cheeseWardShielded(data)) return;

    data.health -= amount;

    if (data.health <= 0) {
      const cx = block.x;
      const cy = block.y;
      const kind = data.kind;
      const wasMixerCore = kind === 'mixer_core';

      this.gameScore.current += data.points;
      this.gameScore.streak++;
      if (this.gameScore.streak % 3 === 0) {
        this.gameScore.multiplier = Math.min(this.gameScore.multiplier + 1, 5);
      }

      this.effects.spawnParticles(cx, cy, MATERIAL_COLORS[data.material] ?? 0x888888, 8, 150);
      this.effects.floatingScore(cx, cy, `+${data.points}`);
      this.audio.playSfx('coin');

      if (kind === 'power_crate' && this.config.powerupsEnabled !== false) {
        this.powerups.pushFromCrate();
        this.audio.playSfx('powerup');
      }

      this.structure.getBlockData().delete(block);
      this.structure.getSpriteById(data.id);
      this.structure['idToSprite'].delete(data.id);
      block.destroy();

      this.emitScoreUpdate({ ...this.gameScore });

      if (kind === 'explosive') {
        const bounds = this.structure.getActiveBlockBounds();
        for (const nid of findExplosionNeighborIds(bounds, data.id)) {
          const spr = this.structure.getSpriteById(nid);
          const rt = spr ? this.structure.getBlockData().get(spr) : undefined;
          if (spr && rt) this.applyDamageToBlock(spr, rt, 1);
        }
      }

      if (wasMixerCore && this.isBossRound()) {
        this.winLevel();
        return;
      }
    } else {
      const tint = data.health === 1 ? 0xff8888 : 0xffcccc;
      block.setTint(tint);
      this.effects.shake(0.005, 50);
      this.audio.playSfx('hit');
    }
  }

  /** @internal exposed for explosive chain id map cleanup */
  private removeBlockMapping(runtimeId: string, block: Phaser.Physics.Arcade.Sprite): void {
    this.structure.getBlockData().delete(block);
    (this.structure as unknown as { idToSprite: Map<string, Phaser.Physics.Arcade.Sprite> }).idToSprite.delete(
      runtimeId
    );
  }

  private addScoreDelta(delta: number, x: number, y: number, label?: string): void {
    this.gameScore.current = Math.max(0, this.gameScore.current + delta);
    if (label) this.effects.floatingScore(x, y, label, delta < 0 ? '#ef4444' : '#fbbf24');
    this.emitScoreUpdate({ ...this.gameScore });
  }

  private winLevel(): void {
    if (this.hasWon) return;
    this.hasWon = true;
    this.cleanupProjectile();
    this.audio.playSfx('boss_hit');
    this.time.delayedCall(200, () => this.audio.playSfx('boss_hit'));
    this.emitLevelComplete({
      levelId: 'KITCHEN',
      finalScore: this.gameScore.current,
      gameScore: { ...this.gameScore },
      victoryType: 'score',
    });
  }

  private cleanupProjectile(): void {
    this.isLaunching = false;
    if (this.projectile) {
      this.projectile.destroy();
      this.projectile = null;
    }
  }

  private onProjectileDone(): void {
    this.cleanupProjectile();

    const cleared = this.structure.getBlockGroup().countActive() === 0;

    if (!cleared) {
      this.critters.applyMouseStealIfNeeded(false, this.config.counterY);
    }

    if (cleared) {
      const bonus = 50 * this.currentRound;
      this.gameScore.current += bonus;
      this.effects.floatingScore(this.scale.width / 2, this.scale.height / 2, `CLEARED! +${bonus}`, '#22c55e');
      this.emitScoreUpdate({ ...this.gameScore });
      this.audio.playSfx('mult');

      const target = (this.config.victoryCondition as { type: 'score'; target: number }).target;
      if (this.gameScore.current >= target) {
        this.hasWon = true;
        this.emitLevelComplete({
          levelId: 'KITCHEN',
          finalScore: this.gameScore.current,
          gameScore: { ...this.gameScore },
          victoryType: 'score',
        });
        return;
      }

      if (this.currentRound < this.config.totalRounds) {
        this.time.delayedCall(1000, () => this.startRound(false));
      } else {
        this.checkEndCondition();
      }
      return;
    }

    if (this.projectilesLeft <= 0) {
      this.lives--;
      this.gameScore.lives = this.lives;
      this.emitLivesChanged(this.lives);

      if (this.lives <= 0) {
        this.isGameOver = true;
        this.audio.playSfx('hit');
        this.emitGameOver(this.gameScore.current);
        return;
      }

      this.audio.playSfx('meow');
      if (this.currentRound < this.config.totalRounds) {
        this.time.delayedCall(800, () => this.startRound(true));
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

  private updateHud(): void {
    this.roundText.setText(`Round ${this.currentRound}/${this.config.totalRounds}`);
    const filled = '●'.repeat(this.projectilesLeft);
    const empty = '○'.repeat(Math.max(0, this.maxAmmoThisRound - this.projectilesLeft));
    this.ammoText.setText(`Ammo: ${filled}${empty}`);
    const pl = this.powerups.getHudLabel();
    this.powerText.setText(pl ? `Power: ${pl}` : '');
  }

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

  shutdown(): void {
    this.critters?.destroy();
    this.hazards?.destroy();
    this.structure?.destroy();
    this.kitchenBg?.destroy();
    this.audio?.destroy();
    super.shutdown?.();
  }
}
