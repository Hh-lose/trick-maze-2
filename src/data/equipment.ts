import type { EquipmentSlot, Stats } from "./types";

export const EQUIPMENT_SLOTS: EquipmentSlot[] = ["头部", "左臂", "右臂", "左腿", "右腿", "胸部", "背翼", "光环"];
export const EQUIPMENT_WEIGHTS: Record<EquipmentSlot, number> = { "头部": 10, "左臂": 15, "右臂": 15, "左腿": 15, "右腿": 15, "胸部": 15, "背翼": 10, "光环": 5 };

export function emptySlots(): Record<EquipmentSlot, number> {
  return Object.fromEntries(EQUIPMENT_SLOTS.map((slot) => [slot, 0])) as Record<EquipmentSlot, number>;
}

export function permanentStats(owned: Record<EquipmentSlot, number>, level: number): Partial<Stats> {
  const multiplier = 1 + Math.max(0, level - 1) * 0.1;
  const result: Partial<Stats> = {};
  const add = (key: keyof Stats, amount: number) => { result[key] = (result[key] ?? 0) + amount; };
  if (owned["头部"]) add("maxHp", 300 * multiplier);
  if (owned["左臂"]) add("attack", 30 * multiplier);
  if (owned["右臂"]) add("attack", 30 * multiplier);
  if (owned["左腿"]) add("defense", 5);
  if (owned["右腿"]) add("defense", 5);
  if (owned["胸部"]) add("maxHp", 200 * multiplier);
  if (owned["背翼"]) { add("defense", 2); add("speed", 64); }
  if (owned["光环"]) { add("defense", 4); add("attack", 6 * multiplier); }
  return result;
}
