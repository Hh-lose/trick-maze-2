import Phaser from "phaser";
import type { EnemyKind } from "../data/types";
import { ENEMIES } from "../data/enemies";

export class Enemy {
  readonly sprite: Phaser.GameObjects.Graphics;
  hp: number;
  cooldown = 0;
  hitFlash = 0;
  burn = 0;
  burnTick = 0;
  alive = true;
  constructor(private scene: Phaser.Scene, public kind: EnemyKind, public position: Phaser.Math.Vector2, public hpMax: number, public attack: number, public boss = false, public elite = 0) { this.hp = hpMax; this.sprite = scene.add.graphics().setDepth(5); this.draw(); }
  get definition() { return ENEMIES[this.kind]; }
  get radius(): number { return this.boss ? 28 : 10; }
  draw(): void { const g = this.sprite, color = this.hitFlash > 0 ? 0xffffff : this.elite || this.definition.color; const r = this.radius; g.clear(); g.fillStyle(0x080a0b); g.fillCircle(this.position.x + 2, this.position.y + 3, r + 3); g.fillStyle(color); g.fillCircle(this.position.x, this.position.y, r); g.fillStyle(0x26151c); g.fillCircle(this.position.x - r * .35, this.position.y - 2, Math.max(2, r * .16)); g.fillCircle(this.position.x + r * .35, this.position.y - 2, Math.max(2, r * .16)); if (this.boss) { g.lineStyle(3, 0xc84345); g.strokeCircle(this.position.x, this.position.y, r + 5); } if (this.elite) { g.fillStyle(this.elite); g.fillTriangle(this.position.x, this.position.y - r - 8, this.position.x - 5, this.position.y - r - 2, this.position.x + 5, this.position.y - r - 2); } }
  hurt(amount: number, burn = false): boolean { this.hp -= amount; this.hitFlash = 90; if (burn) { this.burn = 3000; this.burnTick = 0; } if (this.hp <= 0) { this.alive = false; this.sprite.destroy(); return true; } return false; }
}
