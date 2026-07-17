import Phaser from "phaser";
import { GAME_HEIGHT, GAME_WIDTH } from "../config/gameConfig";
import { EQUIPMENT_SLOTS } from "../data/equipment";
import { SaveSystem } from "../systems/SaveSystem";
import { Rng } from "../systems/Rng";

export class TitleScene extends Phaser.Scene {
  private save = new SaveSystem();
  private panel?: Phaser.GameObjects.Container;
  constructor() { super("Title"); }
  create(): void { this.paintBackground(); this.showTitle(); }
  private paintBackground(): void { const g = this.add.graphics(); g.fillStyle(0x0b1719); g.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT); for (let y = 0; y < GAME_HEIGHT; y += 32) for (let x = (y / 32 % 2) * 16; x < GAME_WIDTH; x += 32) { g.lineStyle(1, 0x1a3030, .55); g.strokeRect(x, y, 30, 30); } g.fillStyle(0x080d0e, .7); g.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT); }
  private showTitle(): void {
    this.panel?.destroy(true); const save = this.save.get(); const children: Phaser.GameObjects.GameObject[] = [];
    const addText = (text: string, x: number, y: number, size: number, color: string) => { const item = this.add.text(x, y, text, { fontFamily: "Microsoft YaHei, Arial", fontSize: `${size}px`, color, align: "center" }).setOrigin(.5); children.push(item); return item; };
    addText("诡计迷宫", GAME_WIDTH / 2, 154, 54, "#e8d99a"); addText("无尽闯关", GAME_WIDTH / 2, 214, 20, "#8cad9f");
    addText(`最高抵达：第 ${save.highestFloor || "--"} 关   金币：${save.gold}`, GAME_WIDTH / 2, 278, 17, "#d8e4d3");
    const button = (label: string, y: number, action: () => void, enabled = true, hint = "") => {
      const fill = enabled ? 0x284849 : 0x1d292a;
      const border = enabled ? 0xd5c77f : 0x506566;
      const rect = this.add.rectangle(GAME_WIDTH / 2, y, 328, 54, fill).setStrokeStyle(2, border);
      children.push(rect);
      const t = addText(label, GAME_WIDTH / 2, y - 1, 21, enabled ? "#fff4cf" : "#839394").setStroke("#101b1c", 3);
      const h = addText(hint, GAME_WIDTH / 2, y + 39, 14, enabled ? "#b7d0c3" : "#8fa2a2");
      if (enabled) {
        rect.setInteractive({ useHandCursor: true });
        rect.on("pointerover", () => rect.setFillStyle(0x396062).setStrokeStyle(3, 0xf2dd8e));
        rect.on("pointerout", () => rect.setFillStyle(fill).setStrokeStyle(2, border));
        rect.on("pointerup", action);
      }
      return { rect, t, h };
    };
    button("开始新局", 364, () => this.scene.start("Game", { floor: 1 }));
    const canContinue = save.highestFloor > 0 && save.gold >= 500;
    button("继续最高纪录", 446, () => { const floor = this.save.continueRun(); if (floor) this.scene.start("Game", { floor }); }, canContinue, canContinue ? `消耗 500 金币，从第 ${save.highestFloor} 关开始` : "需拥有最高纪录与 500 金币");
    button("永久装备", 538, () => this.showEquipment());
    button("重置存档", 620, () => this.confirmReset());
    addText("离线单机 · 本地存档 · 键盘操作", GAME_WIDTH / 2, 790, 15, "#6f918c");
    this.panel = this.add.container(0, 0, children);
  }
  private showEquipment(): void { this.panel?.setVisible(false); const save = this.save.get(); const box = this.add.container(); const bg = this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, 484, 620, 0x0c1719, .98).setStrokeStyle(2, 0xd7bf74); box.add(bg); box.add(this.add.text(GAME_WIDTH / 2, 180, "永久装备", { fontSize: "30px", color: "#f1df9d" }).setOrigin(.5)); box.add(this.add.text(GAME_WIDTH / 2, 222, `装备等级 ${save.equipmentLevel}/10    经验 ${save.equipmentExperience}/3`, { fontSize: "16px", color: "#b2c8bc" }).setOrigin(.5));
    EQUIPMENT_SLOTS.forEach((slot, index) => { const x = GAME_WIDTH / 2 + (index % 2 ? 116 : -116), y = 290 + Math.floor(index / 2) * 68; const owned = save.ownedEquipment[slot] ? "\u5df2\u88c5\u5907" : "\u672a\u5408\u6210"; box.add(this.add.rectangle(x, y, 200, 50, 0x1d3739).setStrokeStyle(1, save.ownedEquipment[slot] ? 0xd5c77f : 0x426263)); box.add(this.add.text(x, y - 8, slot, { fontSize: "18px", color: "#ecdfb4" }).setOrigin(.5)); box.add(this.add.text(x, y + 13, `${owned} · 碎片 ${save.equipmentFragments[slot]}/3`, { fontSize: "13px", color: "#b7ccc4" }).setOrigin(.5)); });
    const chest = this.add.rectangle(GAME_WIDTH / 2, 597, 260, 48, save.mysteryChests && save.gold >= 200 ? 0x5a4530 : 0x253435).setStrokeStyle(2, 0xd5c77f).setInteractive({ useHandCursor: true });
    box.add(chest);
    box.add(this.add.text(GAME_WIDTH / 2, 597, `开启神秘宝箱 (${save.mysteryChests})`, { fontSize: "17px", color: "#f3e5bd" }).setOrigin(.5));
    chest.on("pointerup", () => {
      const opened = this.save.openMystery(() => new Rng().weighted(EQUIPMENT_SLOTS.map((slot) => ({ value: slot, weight: 1 }))));
      if (opened) { box.destroy(true); this.showEquipment(); }
    });
    const close = this.add.text(GAME_WIDTH / 2, 690, "返回", { fontSize: "20px", color: "#d1eee0", backgroundColor: "#263f40", padding: { x: 36, y: 12 } }).setOrigin(.5).setInteractive({ useHandCursor: true }); box.add(close); close.on("pointerup", () => { box.destroy(true); this.panel?.setVisible(true); });
  }
  private confirmReset(): void { const text = this.add.text(GAME_WIDTH / 2, 728, "再次点击此处确认清除全部存档", { fontSize: "16px", color: "#ffb3a2", backgroundColor: "#3f2021", padding: { x: 12, y: 10 } }).setOrigin(.5).setInteractive({ useHandCursor: true }); text.on("pointerup", () => { this.save.reset(); text.destroy(); this.showTitle(); }); this.time.delayedCall(3000, () => text.active && text.destroy()); }
}
