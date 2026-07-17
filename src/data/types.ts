export type EquipmentSlot = "头部" | "左臂" | "右臂" | "左腿" | "右腿" | "胸部" | "背翼" | "光环";
export type EnemyKind = "骷髅兵" | "僵尸" | "骷髅射手" | "幽灵" | "狼兵" | "妖狐";
export type WeaponId = "桃木剑" | "雷符" | "八卦盘" | "红葫芦" | "拂尘";

export interface SaveData {
  version: 1;
  gold: number;
  highestFloor: number;
  equipmentFragments: Record<EquipmentSlot, number>;
  ownedEquipment: Record<EquipmentSlot, number>;
  equipmentExperience: number;
  equipmentLevel: number;
  mysteryFragments: number;
  mysteryChests: number;
  settings: { soundEnabled: boolean; vibrationEnabled: boolean };
}

export interface Stats { maxHp: number; attack: number; defense: number; speed: number; crit: number; attackSpeed: number; }
export interface RunResources { gold: number; fragments: Record<EquipmentSlot, number>; mystery: number; }
