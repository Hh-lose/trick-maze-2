export class Rng {
  private state: number;
  constructor(seed = (Date.now() ^ Math.floor(Math.random() * 0xffffffff)) >>> 0) { this.state = seed || 0x9e3779b9; }
  next(): number { let t = (this.state += 0x6d2b79f5); t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }
  int(min: number, max: number): number { return Math.floor(this.next() * (max - min + 1)) + min; }
  pick<T>(items: readonly T[]): T { return items[Math.floor(this.next() * items.length)]; }
  weighted<T>(items: { value: T; weight: number }[]): T { const total = items.reduce((sum, item) => sum + item.weight, 0); let roll = this.next() * total; for (const item of items) { roll -= item.weight; if (roll <= 0) return item.value; } return items[items.length - 1].value; }
}
