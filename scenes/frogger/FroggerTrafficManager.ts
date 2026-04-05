import Phaser from 'phaser';
import type { FroggerLane } from '../../types';
import type { SceneManager, TrafficEntry } from './types';
import { DEPTH } from './types';

export class FroggerTrafficManager implements SceneManager {
  private entries: TrafficEntry[] = [];

  constructor(private readonly scene: Phaser.Scene) {}

  create(): void {}

  rebuild(lanes: FroggerLane[], screenWidth: number, cellSize: number): void {
    for (const e of this.entries) e.sprite.destroy();
    this.entries = [];

    lanes.forEach((lane, laneIndex) => {
      if (lane.kind === 'safe') return;
      const { width: objW, height: objH, color, gap } = lane.objects;
      const totalSpan = screenWidth + gap * 2;
      let x = -gap;
      while (x < totalSpan) {
        const rect = this.scene.add
          .rectangle(x + objW / 2, lane.y + cellSize / 2, objW, objH, color)
          .setDepth(DEPTH.OBJECTS);
        if (lane.kind === 'medianSlow') {
          rect.setStrokeStyle(2, 0x553311);
        }
        if (lane.kind === 'bike') {
          rect.setStrokeStyle(1, 0xaaaaaa);
        }
        this.entries.push({ sprite: rect, laneIndex, lane });
        x += objW + gap;
      }
    });
  }

  update(_time: number, delta: number): void {
    const dt = delta / 1000;
    const screenWidth = this.scene.scale.width;
    for (const obj of this.entries) {
      const lane = obj.lane;
      obj.sprite.x += lane.direction * lane.speed * dt;
      const halfW = lane.objects.width / 2;
      if (lane.direction > 0 && obj.sprite.x - halfW > screenWidth + 50) {
        obj.sprite.x = -halfW - 50;
      } else if (lane.direction < 0 && obj.sprite.x + halfW < -50) {
        obj.sprite.x = screenWidth + halfW + 50;
      }
    }
  }

  getEntries(): readonly TrafficEntry[] {
    return this.entries;
  }

  destroy(): void {
    for (const e of this.entries) e.sprite.destroy();
    this.entries = [];
  }
}
