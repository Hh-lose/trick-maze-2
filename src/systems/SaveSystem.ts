import { GAME_KEY } from "../config/gameConfig";
import { emptySlots, EQUIPMENT_SLOTS } from "../data/equipment";
import type { EquipmentSlot, SaveData } from "../data/types";

export class SaveSystem {
  private data: SaveData;
  constructor() { this.data = this.load(); }
  private defaults(): SaveData { return { version: 1, gold: 0, highestFloor: 0, equipmentFragments: emptySlots(), ownedEquipment: emptySlots(), equipmentExperience: 0, equipmentLevel: 1, mysteryFragments: 0, mysteryChests: 0, settings: { soundEnabled: true, vibrationEnabled: true } }; }
  private load(): SaveData { try { const value = JSON.parse(localStorage.getItem(GAME_KEY) ?? "null") as Partial<SaveData> | null; if (!value || value.version !== 1) return this.defaults(); const base = this.defaults(); return { ...base, ...value, equipmentFragments: { ...base.equipmentFragments, ...value.equipmentFragments }, ownedEquipment: { ...base.ownedEquipment, ...value.ownedEquipment } }; } catch { console.warn("存档读取失败，已使用默认存档"); return this.defaults(); } }
  get(): SaveData { return this.data; }
  save(): void { localStorage.setItem(GAME_KEY, JSON.stringify(this.data)); }
  addGold(amount: number): void { this.data.gold += amount; this.save(); }
  recordFloor(floor: number): void { this.data.highestFloor = Math.max(this.data.highestFloor, floor); this.save(); }
  addFragment(slot: EquipmentSlot): void { this.data.equipmentFragments[slot]++; if (this.data.equipmentFragments[slot] >= 3) { this.data.equipmentFragments[slot] -= 3; this.data.ownedEquipment[slot]++; if (this.data.ownedEquipment[slot] > 1) { this.data.ownedEquipment[slot] = 1; this.data.equipmentExperience++; } while (this.data.equipmentExperience >= 3 && this.data.equipmentLevel < 10) { this.data.equipmentExperience -= 3; this.data.equipmentLevel++; } } this.save(); }
  addMystery(): void { this.data.mysteryFragments++; if (this.data.mysteryFragments >= 3) { this.data.mysteryFragments -= 3; this.data.mysteryChests++; } this.save(); }
  openMystery(slotPicker: () => EquipmentSlot): boolean { if (this.data.mysteryChests < 1 || this.data.gold < 200) return false; this.data.mysteryChests--; this.data.gold -= 200; this.data.gold += 200; for (let i = 0; i < 3; i++) this.addFragment(slotPicker()); this.save(); return true; }
  continueRun(): number | null { if (this.data.highestFloor < 1 || this.data.gold < 500) return null; this.data.gold -= 500; this.save(); return this.data.highestFloor; }
  reset(): void { localStorage.removeItem(GAME_KEY); this.data = this.defaults(); }
}
