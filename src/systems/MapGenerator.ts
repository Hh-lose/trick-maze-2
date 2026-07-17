import { TILE } from "../config/gameConfig";
import { Rng } from "./Rng";

export interface GeneratedMap { width: number; height: number; walls: boolean[][]; spawn: Phaser.Math.Vector2; exit: Phaser.Math.Vector2; walkable: Phaser.Math.Vector2[]; }

export class MapGenerator {
  generate(rng: Rng): GeneratedMap {
    const width = rng.int(16, 18);
    const height = rng.int(15, 17);
    const walls = Array.from({ length: height }, (_, y) => Array.from({ length: width }, (_, x) => x === 0 || y === 0 || x === width - 1 || y === height - 1));
    const spawn = new Phaser.Math.Vector2(Math.floor(width / 2), height - 3);
    const exit = new Phaser.Math.Vector2(Math.floor(width / 2), 2);
    const attempts = rng.int(6, 14);
    for (let i = 0; i < attempts; i++) {
      const x = rng.int(2, width - 3), y = rng.int(3, height - 4);
      if (Math.abs(x - spawn.x) <= 2 && Math.abs(y - spawn.y) <= 2) continue;
      if (Math.abs(x - exit.x) <= 1 && Math.abs(y - exit.y) <= 1) continue;
      walls[y][x] = true;
      if (!this.connected(walls, spawn, exit)) walls[y][x] = false;
    }
    const walkable: Phaser.Math.Vector2[] = [];
    walls.forEach((row, y) => row.forEach((wall, x) => { if (!wall) walkable.push(new Phaser.Math.Vector2(x, y)); }));
    return { width, height, walls, spawn, exit, walkable };
  }
  private connected(walls: boolean[][], start: Phaser.Math.Vector2, end: Phaser.Math.Vector2): boolean {
    const queue = [start], seen = new Set([`${start.x},${start.y}`]);
    while (queue.length) { const point = queue.shift()!; if (point.equals(end)) return true; for (const [dx, dy] of [[1,0],[-1,0],[0,1],[0,-1]]) { const x = point.x + dx, y = point.y + dy, key = `${x},${y}`; if (!walls[y]?.[x] && !seen.has(key)) { seen.add(key); queue.push(new Phaser.Math.Vector2(x, y)); } } }
    return false;
  }
  static center(tile: Phaser.Math.Vector2): Phaser.Math.Vector2 { return new Phaser.Math.Vector2(tile.x * TILE + TILE / 2, tile.y * TILE + TILE / 2); }
}
