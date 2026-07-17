import type { WeaponId } from "./types";

export interface Weapon { id: WeaponId; range: number; multiplier: number; color: number; description: string; }
export const WEAPONS: Record<WeaponId, Weapon> = {
  "桃木剑": { id: "桃木剑", range: 2, multiplier: 1, color: 0xe9db98, description: "前方扇形，攻击 +10%" },
  "雷符": { id: "雷符", range: 5, multiplier: 0.9, color: 0x83e8ef, description: "落点爆炸，暴击 +15%" },
  "八卦盘": { id: "八卦盘", range: 1.4, multiplier: 0.85, color: 0xe7c76f, description: "周身旋转，防御 +15%" },
  "红葫芦": { id: "红葫芦", range: 3, multiplier: 1, color: 0xce533a, description: "直线灼烧 3 秒，每秒 1% 最大生命" },
  "拂尘": { id: "拂尘", range: 2, multiplier: 0.9, color: 0xe8e3cf, description: "大范围扫击，战斗中每 3 秒恢复 1% 最大生命" },
};
