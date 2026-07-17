import type { EnemyKind } from "./types";

export interface EnemyDefinition { kind: EnemyKind; hp: number; attack: number; ranged: boolean; unlock: number; color: number; }
export const ENEMIES: Record<EnemyKind, EnemyDefinition> = {
  "骷髅兵": { kind: "骷髅兵", hp: 50, attack: 30, ranged: false, unlock: 1, color: 0xd8d6c2 },
  "僵尸": { kind: "僵尸", hp: 100, attack: 30, ranged: false, unlock: 1, color: 0x95a96e },
  "骷髅射手": { kind: "骷髅射手", hp: 30, attack: 50, ranged: true, unlock: 1, color: 0xc2c5a7 },
  "幽灵": { kind: "幽灵", hp: 70, attack: 70, ranged: true, unlock: 11, color: 0x8db5d1 },
  "狼兵": { kind: "狼兵", hp: 300, attack: 60, ranged: false, unlock: 11, color: 0xa48175 },
  "妖狐": { kind: "妖狐", hp: 100, attack: 100, ranged: false, unlock: 31, color: 0xe0a48e },
};
