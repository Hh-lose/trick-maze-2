import Phaser from "phaser";

export class VirtualJoystick {
  readonly base: Phaser.GameObjects.Arc;
  readonly knob: Phaser.GameObjects.Arc;
  private pointerId: number | null = null;
  value = new Phaser.Math.Vector2();
  constructor(private scene: Phaser.Scene, private x: number, private y: number, private radius = 52, color = 0x77999a) { this.base = scene.add.circle(x, y, radius, color, .24).setStrokeStyle(2, color, .6).setDepth(20); this.knob = scene.add.circle(x, y, 19, color, .5).setDepth(21); }
  update(): void { const pointers = this.scene.input.manager.pointers; const pointer = pointers.find((item) => item.isDown && (this.pointerId === item.id || (this.pointerId === null && Phaser.Math.Distance.Between(item.x, item.y, this.x, this.y) < this.radius * 1.7))); if (!pointer) { this.pointerId = null; this.value.scale(.8); this.knob.setPosition(this.x + this.value.x * this.radius * .55, this.y + this.value.y * this.radius * .55); return; } this.pointerId = pointer.id; const vector = new Phaser.Math.Vector2(pointer.x - this.x, pointer.y - this.y); if (vector.length() > this.radius) vector.setLength(this.radius); this.value.copy(vector).scale(1 / this.radius); this.knob.setPosition(this.x + vector.x, this.y + vector.y); }
  destroy(): void { this.base.destroy(); this.knob.destroy(); }
}
