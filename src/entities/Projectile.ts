import Phaser from "phaser";

export class Projectile {
  readonly sprite: Phaser.GameObjects.Graphics;
  age = 0;
  constructor(private scene: Phaser.Scene, public position: Phaser.Math.Vector2, public velocity: Phaser.Math.Vector2, public damage: number, public enemyOwned: boolean, public radius = 5) { this.sprite = scene.add.graphics().setDepth(7); this.draw(); }
  private draw(): void { this.sprite.clear(); this.sprite.fillStyle(this.enemyOwned ? 0xef7848 : 0xb8f5ef); this.sprite.fillCircle(this.position.x, this.position.y, this.radius); }
  update(delta: number): void { this.age += delta; this.position.add(this.velocity.clone().scale(delta / 1000)); this.draw(); }
  destroy(): void { this.sprite.destroy(); }
}
