import Phaser from 'phaser';

export class EffectsManager {
  private scene: Phaser.Scene;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }

  /** Call once in scene preload to create shared particle texture */
  static createParticleTexture(scene: Phaser.Scene): void {
    if (!scene.textures.exists('particle')) {
      const g = scene.make.graphics({}, false);
      g.fillStyle(0xffffff);
      g.fillCircle(4, 4, 4);
      g.generateTexture('particle', 8, 8);
      g.destroy();
    }
  }

  shake(intensity: number = 0.01, duration: number = 100): void {
    this.scene.cameras.main.shake(duration, intensity);
  }

  flash(color: number = 0xff0000, duration: number = 150): void {
    this.scene.cameras.main.flash(
      duration,
      (color >> 16) & 0xff,
      (color >> 8) & 0xff,
      color & 0xff,
      false,
      (_cam: Phaser.Cameras.Scene2D.Camera, progress: number) => {
        // fade from alpha 0.4 to 0
        this.scene.cameras.main.setAlpha(1 - progress * 0.4);
      }
    );
  }

  freezeFrame(durationMs: number = 50): void {
    this.scene.physics?.pause();
    this.scene.time.delayedCall(durationMs, () => {
      this.scene.physics?.resume();
    });
  }

  spawnParticles(x: number, y: number, color: number, count: number = 10, speed: number = 200): void {
    const emitter = this.scene.add.particles(x, y, 'particle', {
      speed: { min: speed * 0.25, max: speed },
      scale: { start: 0.5, end: 0 },
      lifespan: 500,
      quantity: count,
      tint: color,
      emitting: false,
    });
    emitter.explode(count);
    this.scene.time.delayedCall(600, () => emitter.destroy());
  }

  /** Spawn dust trail particles at the player's feet */
  spawnDust(x: number, y: number, gameSpeed: number): void {
    const emitter = this.scene.add.particles(x, y, 'particle', {
      speedX: { min: -gameSpeed * 30, max: -gameSpeed * 10 },
      speedY: { min: -20, max: -60 },
      scale: { start: 0.3, end: 0 },
      lifespan: 400,
      quantity: 2,
      tint: 0xd2b48c, // sand color
      alpha: { start: 0.5, end: 0 },
      emitting: false,
    });
    emitter.explode(2);
    this.scene.time.delayedCall(500, () => emitter.destroy());
  }

  /** Show floating score popup that rises and fades */
  floatingScore(x: number, y: number, value: string, color: string = '#fbbf24'): void {
    const text = this.scene.add.text(x, y, value, {
      fontSize: '20px',
      fontFamily: 'system-ui, sans-serif',
      fontStyle: 'bold',
      color,
    }).setOrigin(0.5).setDepth(100);

    this.scene.tweens.add({
      targets: text,
      y: y - 60,
      alpha: 0,
      scale: 1.3,
      duration: 1200,
      ease: 'Power2',
      onComplete: () => text.destroy(),
    });
  }
}
