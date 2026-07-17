import Phaser from "phaser";
import type { Stats, WeaponId } from "../data/types";

export class Player {
  readonly body: Phaser.GameObjects.Graphics;
  position: Phaser.Math.Vector2;
  hp: number;
  aim = new Phaser.Math.Vector2(0, -1);
  invincible = 0;
  stunned = 0;
  constructor(private scene: Phaser.Scene, position: Phaser.Math.Vector2, public stats: Stats, public weapon: WeaponId = "桃木剑") {
    this.position = position.clone(); this.hp = stats.maxHp; this.body = scene.add.graphics().setDepth(6); this.draw();
  }
  draw(): void { const g = this.body; g.clear(); g.fillStyle(0x102d35); g.fillRect(this.position.x - 10, this.position.y - 13, 20, 26); g.fillStyle(0xe6d39a); g.fillRect(this.position.x - 7, this.position.y - 11, 14, 12); g.fillStyle(0xd95b4c); g.fillRect(this.position.x - 4, this.position.y - 5, 3, 3); g.fillRect(this.position.x + 3, this.position.y - 5, 3, 3); g.lineStyle(2, 0xd5f7ed); g.lineBetween(this.position.x, this.position.y + 4, this.position.x + this.aim.x * 15, this.position.y + 4 + this.aim.y * 15); if (this.invincible > 0) { g.lineStyle(2, 0xf4e9c4); g.strokeCircle(this.position.x, this.position.y, 16); } }
  heal(amount: number): void { this.hp = Math.min(this.stats.maxHp, this.hp + amount); }
  hit(amount: number): boolean { if (this.invincible > 0) return false; this.hp = Math.max(0, this.hp - amount); this.invincible = 250; return true; }
  destroy(): void { this.body.destroy(); }
}
