import Phaser from 'phaser';
import type { PlatformerLevelConfig } from '../../types';
import {
  createBossState, advanceBossPhase, shouldLand,
  getLandDuration, getFeathersPerPass, getSwoopSpeed,
  getMiniPigeonCount, hasDiveBomb,
} from './bossPhases';
import type { BossPhaseState, SceneManager } from './types';
import { DEPTH } from './types';
import { EffectsManager } from '../shared/EffectsManager';
import { ROOFTOPS_BOSS_TEXTURES, ROOFTOPS_ENEMY_TEXTURES, ROOFTOPS_FX_TEXTURES } from './rooftopsAssets';

const BOSS_SIZE = { w: 216, h: 160 };
const FEATHER_SIZE = { w: 18, h: 10 };
const MINI_PIGEON_SIZE = { w: 38, h: 32 };
const FEATHER_FALL_SPEED = 250;
const FEATHER_DRIFT = 80;
const BOSS_HIT_COOLDOWN_MS = 650;

type ArcadeBody = Phaser.Physics.Arcade.Body;

/** Narrow the union type to the dynamic Arcade body */
function arcBody(sprite: Phaser.Physics.Arcade.Sprite): ArcadeBody {
  return sprite.body as ArcadeBody;
}

export type BossMode = 'swooping' | 'landing' | 'landed' | 'takeoff' | 'defeated';

export interface PigeonKingBossSnapshot {
  hp: number;
  phase: BossPhaseState['phase'];
  mode: BossMode;
  defeated: boolean;
  arena: {
    left: number;
    right: number;
    y: number;
    width: number;
  };
  boss: {
    x: number;
    y: number;
    vx: number;
    vy: number;
    textureKey: string;
  };
  threats: {
    feathers: number;
    miniPigeons: number;
  };
}

export class PigeonKingBoss implements SceneManager {
  private scene: Phaser.Scene;
  private config: PlatformerLevelConfig;
  private effects: EffectsManager;

  private bossSprite!: Phaser.Physics.Arcade.Sprite;
  private feathers!: Phaser.Physics.Arcade.Group;
  private miniPigeons!: Phaser.Physics.Arcade.Group;

  private state: BossPhaseState;
  private mode: BossMode = 'swooping';

  private arenaLeft = 0;
  private arenaRight = 0;
  private arenaY = 0;
  private swoopDirection = 1;
  private swoopY = 0;
  private landX = 0;
  private diveBombCooldown = 0;
  private hitInvulnerableUntilMs = 0;

  /** True once boss is fully defeated */
  private defeated = false;

  constructor(scene: Phaser.Scene, config: PlatformerLevelConfig, effects: EffectsManager) {
    this.scene = scene;
    this.config = config;
    this.effects = effects;
    this.state = createBossState();
  }

  /** Call this to set up the boss arena at a specific position */
  createArena(arenaX: number, arenaY: number, arenaWidth = this.config.boss.arenaWidth): void {
    this.arenaLeft = arenaX;
    this.arenaRight = arenaX + arenaWidth;
    this.arenaY = arenaY;
    this.swoopY = arenaY - 200;

    this.createTextures();

    // Boss sprite
    const entryX = Phaser.Math.Clamp(
      this.arenaLeft + 180,
      this.arenaLeft + BOSS_SIZE.w,
      this.arenaRight - BOSS_SIZE.w,
    );
    this.bossSprite = this.scene.physics.add.sprite(
      entryX,
      this.swoopY,
      this.bossTexture('swoop'),
    );
    this.bossSprite.setDepth(DEPTH.ENEMIES + 1);
    this.bossSprite.setDisplaySize(BOSS_SIZE.w, BOSS_SIZE.h);
    arcBody(this.bossSprite).setAllowGravity(false);
    this.resizeBossBody();
    arcBody(this.bossSprite).setVelocityX(getSwoopSpeed(this.state, this.config.boss));

    // Feather projectile group
    this.feathers = this.scene.physics.add.group({ allowGravity: false });

    // Mini pigeon group
    this.miniPigeons = this.scene.physics.add.group({ allowGravity: false });
  }

  create(): void {
    // Arena creation is deferred — call createArena() when player reaches boss zone
  }

  update(_time: number, delta: number): void {
    if (this.defeated) return;

    switch (this.mode) {
      case 'swooping': this.updateSwoop(delta); break;
      case 'landing': this.updateLanding(delta); break;
      case 'landed': this.updateLanded(delta); break;
      case 'takeoff': this.updateTakeoff(delta); break;
    }

    this.updateFeathers(delta);
    this.updateMiniPigeons();
  }

  destroy(): void {
    this.bossSprite?.destroy();
    this.feathers?.destroy(true);
    this.miniPigeons?.destroy(true);
  }

  isDefeated(): boolean { return this.defeated; }
  getBossSprite(): Phaser.Physics.Arcade.Sprite { return this.bossSprite; }
  getFeatherGroup(): Phaser.Physics.Arcade.Group { return this.feathers; }
  getMiniPigeonGroup(): Phaser.Physics.Arcade.Group { return this.miniPigeons; }
  getHP(): number { return this.state.hp; }
  getMode(): BossMode { return this.mode; }
  getSnapshot(): PigeonKingBossSnapshot {
    const bossSprite = this.bossSprite;
    const body = bossSprite.body as ArcadeBody | null;
    return {
      hp: this.state.hp,
      phase: this.state.phase,
      mode: this.mode,
      defeated: this.defeated,
      arena: {
        left: Math.round(this.arenaLeft),
        right: Math.round(this.arenaRight),
        y: Math.round(this.arenaY),
        width: Math.round(this.arenaRight - this.arenaLeft),
      },
      boss: {
        x: Math.round(bossSprite.x),
        y: Math.round(bossSprite.y),
        vx: Math.round(body?.velocity.x ?? 0),
        vy: Math.round(body?.velocity.y ?? 0),
        textureKey: bossSprite.texture?.key ?? 'destroyed',
      },
      threats: {
        feathers: this.feathers.countActive(true),
        miniPigeons: this.miniPigeons.countActive(true),
      },
    };
  }

  /** Called when the player lands a valid top stomp. */
  handleStomp(): boolean { return this.handleHit(); }

  /** Called when a thrown platformer projectile hits the boss. */
  handleProjectileHit(): boolean { return this.handleHit(); }

  private handleHit(): boolean {
    if (this.defeated || this.scene.time.now < this.hitInvulnerableUntilMs) return false;
    this.hitInvulnerableUntilMs = this.scene.time.now + BOSS_HIT_COOLDOWN_MS;
    this.state = advanceBossPhase(this.state);
    this.state.isLanded = false;

    // Flash + screech effect
    this.effects.flash(0xffffff, 200);
    this.effects.shake(0.02, 200);
    this.effects.freezeFrame(80);
    this.effects.spawnParticles(this.bossSprite.x, this.bossSprite.y, 0xffffff, 15, 250);

    // Destroy mini pigeons on phase change
    this.miniPigeons.clear(true, true);

    if (this.state.hp <= 0) {
      this.mode = 'defeated';
      this.defeated = true;
      this.bossSprite.setTexture(this.bossTexture('defeat'));
      this.bossSprite.setDisplaySize(BOSS_SIZE.w, BOSS_SIZE.h);
      this.resizeBossBody();
      this.defeatSequence();
      return true;
    }

    // Take off for next phase
    this.mode = 'takeoff';
    this.scene.tweens.killTweensOf(this.bossSprite);
    this.bossSprite.setTexture(this.bossTexture('hit'));
    this.bossSprite.setDisplaySize(BOSS_SIZE.w, BOSS_SIZE.h);
    this.resizeBossBody();
    arcBody(this.bossSprite).setVelocity(0, 0);
    this.scene.tweens.add({
      targets: this.bossSprite,
      y: this.swoopY,
      duration: 600,
      ease: 'Power2',
      onComplete: () => {
        this.mode = 'swooping';
        this.bossSprite.setTexture(this.bossTexture('swoop'));
        this.bossSprite.setDisplaySize(BOSS_SIZE.w, BOSS_SIZE.h);
        this.resizeBossBody();
        this.swoopDirection = 1;
        arcBody(this.bossSprite).setVelocityX(getSwoopSpeed(this.state, this.config.boss));
      },
    });

    return true;
  }

  // ── Swoop ─────────────────────────────────────────────────────

  private updateSwoop(delta: number): void {
    const speed = getSwoopSpeed(this.state, this.config.boss);

    // Bounce off arena walls
    if (this.bossSprite.x >= this.arenaRight - BOSS_SIZE.w) {
      this.swoopDirection = -1;
      arcBody(this.bossSprite).setVelocityX(-speed);
      this.bossSprite.setFlipX(true);
      this.state.swoopCount++;
      this.dropFeathers();
    } else if (this.bossSprite.x <= this.arenaLeft + BOSS_SIZE.w) {
      this.swoopDirection = 1;
      arcBody(this.bossSprite).setVelocityX(speed);
      this.bossSprite.setFlipX(false);
      this.state.swoopCount++;
      this.dropFeathers();
    }

    // Check if should land
    if (shouldLand(this.state, this.config.boss)) {
      this.beginLanding();
    }

    // Dive bomb in phase 3
    if (hasDiveBomb(this.state, this.config.boss)) {
      this.diveBombCooldown -= delta;
      if (this.diveBombCooldown <= 0) {
        this.diveBombCooldown = 3000; // 3s between dive bombs
        this.doDiveBomb();
      }
    }
  }

  private dropFeathers(): void {
    const count = getFeathersPerPass(this.state, this.config.boss);
    const spacing = (this.arenaRight - this.arenaLeft) / (count + 1);

    for (let i = 1; i <= count; i++) {
      const fx = this.arenaLeft + spacing * i + Phaser.Math.Between(-20, 20);
      const feather = this.feathers.create(fx, this.swoopY + 20, this.featherTexture()) as Phaser.Physics.Arcade.Sprite;
      feather.setDepth(DEPTH.ENEMIES);
      feather.setDisplaySize(FEATHER_SIZE.w, FEATHER_SIZE.h);
      arcBody(feather).setVelocity(
        Phaser.Math.Between(-FEATHER_DRIFT, FEATHER_DRIFT),
        FEATHER_FALL_SPEED,
      );
    }
  }

  private doDiveBomb(): void {
    // Quick downward dash to near-ground, then return
    this.scene.tweens.add({
      targets: this.bossSprite,
      y: this.landedCenterY() - 10,
      duration: 300,
      ease: 'Power3',
      yoyo: true,
      hold: 100,
      onYoyo: () => {
        this.effects.shake(0.015, 100);
      },
    });
  }

  // ── Landing ───────────────────────────────────────────────────

  private beginLanding(): void {
    this.mode = 'landing';
    this.state.swoopCount = 0;

    // Pick a landing spot
    this.landX = Phaser.Math.Between(
      this.arenaLeft + Math.round(BOSS_SIZE.w * 0.8),
      this.arenaRight - Math.round(BOSS_SIZE.w * 0.8),
    );

    arcBody(this.bossSprite).setVelocity(0, 0);
    this.scene.tweens.add({
      targets: this.bossSprite,
      x: this.landX,
      y: this.landedCenterY(),
      duration: 500,
      ease: 'Power2',
      onComplete: () => {
        this.mode = 'landed';
        this.bossSprite.setTexture(this.bossTexture('landed'));
        this.bossSprite.setDisplaySize(BOSS_SIZE.w, BOSS_SIZE.h);
        this.resizeBossBody();
        this.state.isLanded = true;
        this.state.landTimer = getLandDuration(this.state, this.config.boss) * 1000;

        // Spawn mini pigeons for this phase
        this.spawnMiniPigeons();
      },
    });
  }

  private updateLanding(_delta: number): void {
    // Tween handles movement — nothing to do
  }

  private updateLanded(delta: number): void {
    this.state.landTimer -= delta;
    if (this.state.landTimer <= 0) {
      // Time's up — take off without being stomped
      this.state.isLanded = false;
      this.mode = 'takeoff';
      this.miniPigeons.clear(true, true);
      this.scene.tweens.add({
        targets: this.bossSprite,
        y: this.swoopY,
        duration: 400,
        ease: 'Power2',
        onComplete: () => {
          this.mode = 'swooping';
          this.bossSprite.setTexture(this.bossTexture('swoop'));
          this.bossSprite.setDisplaySize(BOSS_SIZE.w, BOSS_SIZE.h);
          this.resizeBossBody();
          this.state.isLanded = false;
          arcBody(this.bossSprite).setVelocityX(
            getSwoopSpeed(this.state, this.config.boss) * this.swoopDirection,
          );
        },
      });
    }
  }

  private updateTakeoff(_delta: number): void {
    // Tween handles movement
  }

  private landedCenterY(): number {
    return this.arenaY - BOSS_SIZE.h / 2;
  }

  private resizeBossBody(): void {
    const scaleX = Math.max(Math.abs(this.bossSprite.scaleX), 0.001);
    const scaleY = Math.max(Math.abs(this.bossSprite.scaleY), 0.001);
    arcBody(this.bossSprite).setSize(
      (BOSS_SIZE.w - 24) / scaleX,
      (BOSS_SIZE.h - 18) / scaleY,
      true,
    );
  }

  // ── Mini Pigeons ──────────────────────────────────────────────

  private spawnMiniPigeons(): void {
    const count = getMiniPigeonCount(this.state, this.config.boss);
    if (count === 0) return;

    if (!this.scene.textures.exists(this.miniPigeonTexture())) {
      const g = this.scene.make.graphics({}, false);
      g.fillStyle(0x8888aa);
      g.fillRoundedRect(0, 0, MINI_PIGEON_SIZE.w, MINI_PIGEON_SIZE.h, 4);
      g.fillStyle(0xffffff);
      g.fillCircle(7, 7, 2);
      g.fillCircle(17, 7, 2);
      g.generateTexture('mini-pigeon', MINI_PIGEON_SIZE.w, MINI_PIGEON_SIZE.h);
      g.destroy();
    }

    const spacing = (this.arenaRight - this.arenaLeft) / (count + 1);
    for (let i = 1; i <= count; i++) {
      const px = this.arenaLeft + spacing * i;
      const py = this.arenaY - MINI_PIGEON_SIZE.h / 2;
      const mp = this.miniPigeons.create(px, py, this.miniPigeonTexture()) as Phaser.Physics.Arcade.Sprite;
      mp.setDepth(DEPTH.ENEMIES);
      mp.setDisplaySize(MINI_PIGEON_SIZE.w, MINI_PIGEON_SIZE.h);
      arcBody(mp).setVelocityX(Phaser.Math.Between(40, 80) * (Math.random() < 0.5 ? 1 : -1));
    }
  }

  private updateMiniPigeons(): void {
    for (const child of this.miniPigeons.getChildren()) {
      const mp = child as Phaser.Physics.Arcade.Sprite;
      // Bounce off arena walls
      if (mp.x <= this.arenaLeft + 10) arcBody(mp).setVelocityX(Math.abs(arcBody(mp).velocity.x));
      if (mp.x >= this.arenaRight - 10) arcBody(mp).setVelocityX(-Math.abs(arcBody(mp).velocity.x));
    }
  }

  // ── Feathers ──────────────────────────────────────────────────

  private updateFeathers(_delta: number): void {
    for (const child of [...this.feathers.getChildren()]) {
      const f = child as Phaser.Physics.Arcade.Sprite;
      // Destroy feathers that hit the ground
      if (f.y >= this.arenaY) {
        f.destroy();
      }
    }
  }

  // ── Textures ──────────────────────────────────────────────────

  private createTextures(): void {
    if (!this.scene.textures.exists(this.bossTexture('idle'))) {
      const g = this.scene.make.graphics({}, false);
      g.fillStyle(0x7777aa);
      g.fillRoundedRect(0, 0, BOSS_SIZE.w, BOSS_SIZE.h, 8);
      // Crown
      g.fillStyle(0xffdd44);
      g.fillTriangle(20, 8, 24, 0, 28, 8);
      g.fillTriangle(28, 8, 32, 0, 36, 8);
      g.fillTriangle(36, 8, 40, 0, 44, 8);
      // Eyes
      g.fillStyle(0xff4444);
      g.fillCircle(18, 22, 5);
      g.fillCircle(46, 22, 5);
      g.fillStyle(0xffffff);
      g.fillCircle(18, 22, 3);
      g.fillCircle(46, 22, 3);
      // Beak
      g.fillStyle(0xffaa44);
      g.fillTriangle(28, 28, 36, 28, 32, 36);
      g.generateTexture('pigeon-king', BOSS_SIZE.w, BOSS_SIZE.h);
      g.destroy();
    }

    if (!this.scene.textures.exists(this.featherTexture())) {
      const g = this.scene.make.graphics({}, false);
      g.fillStyle(0xddddee);
      g.fillEllipse(FEATHER_SIZE.w / 2, FEATHER_SIZE.h / 2, FEATHER_SIZE.w, FEATHER_SIZE.h);
      g.generateTexture('feather', FEATHER_SIZE.w, FEATHER_SIZE.h);
      g.destroy();
    }
  }

  private bossTexture(state: keyof typeof ROOFTOPS_BOSS_TEXTURES): string {
    return this.scene.textures.exists(ROOFTOPS_BOSS_TEXTURES[state])
      ? ROOFTOPS_BOSS_TEXTURES[state]
      : 'pigeon-king';
  }

  private featherTexture(): string {
    return this.scene.textures.exists(ROOFTOPS_FX_TEXTURES.featherProjectile)
      ? ROOFTOPS_FX_TEXTURES.featherProjectile
      : 'feather';
  }

  private miniPigeonTexture(): string {
    return this.scene.textures.exists(ROOFTOPS_ENEMY_TEXTURES.PIGEON)
      ? ROOFTOPS_ENEMY_TEXTURES.PIGEON
      : 'mini-pigeon';
  }

  // ── Defeat ────────────────────────────────────────────────────

  private defeatSequence(): void {
    arcBody(this.bossSprite).setVelocity(0, 0);

    // Feather explosion
    for (let i = 0; i < 30; i++) {
      this.effects.spawnParticles(
        this.bossSprite.x + Phaser.Math.Between(-20, 20),
        this.bossSprite.y + Phaser.Math.Between(-20, 20),
        0xddddee, 3, 300,
      );
    }

    // Boss flies away
    this.scene.tweens.add({
      targets: this.bossSprite,
      y: -200,
      x: this.bossSprite.x + 300,
      alpha: 0,
      duration: 1500,
      ease: 'Power2',
      onComplete: () => {
        this.bossSprite.destroy();
      },
    });
  }
}
