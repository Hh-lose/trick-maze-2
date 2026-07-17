import Phaser from "phaser";
import { GAME_HEIGHT, GAME_WIDTH, MAP_Y, TILE } from "../config/gameConfig";
import { ENEMIES } from "../data/enemies";
import { EQUIPMENT_SLOTS, permanentStats } from "../data/equipment";
import type { EnemyKind, EquipmentSlot, RunResources, Stats, WeaponId } from "../data/types";
import { WEAPONS } from "../data/weapons";
import { Enemy } from "../entities/Enemy";
import { Player } from "../entities/Player";
import { Projectile } from "../entities/Projectile";
import { damage } from "../systems/CombatSystem";
import { MapGenerator, type GeneratedMap } from "../systems/MapGenerator";
import { Rng } from "../systems/Rng";
import { RewardSystem, type Reward } from "../systems/RewardSystem";
import { SaveSystem } from "../systems/SaveSystem";

type Interactable = { kind: "chest" | "seal" | "exit"; position: Phaser.Math.Vector2; graphic: Phaser.GameObjects.Graphics; opened?: boolean; progress?: number; };
const BASE_ATTACK_RANGE = 2;
const SEAL_UNLOCK_DURATION = 2000;

export class GameScene extends Phaser.Scene {
  private rng = new Rng();
  private map!: GeneratedMap;
  private player!: Player;
  private enemies: Enemy[] = [];
  private projectiles: Projectile[] = [];
  private items: Interactable[] = [];
  private hud!: Phaser.GameObjects.Text;
  private banner!: Phaser.GameObjects.Text;
  private attackCooldown = 0;
  private spawnTimer = 0;
  private spawned = 0;
  private target = 0;
  private defeated = 0;
  private floor = 1;
  private seedText = "";
  private paused = false;
  private interactionHeld = false;
  private modal?: Phaser.GameObjects.Container;
  private save = new SaveSystem();
  private run: RunResources = { gold: 0, fragments: Object.fromEntries(EQUIPMENT_SLOTS.map((slot) => [slot, 0])) as Record<EquipmentSlot, number>, mystery: 0 };
  private keys!: Record<string, Phaser.Input.Keyboard.Key>;
  private bossWarning = 0;
  private bossTimer = 0;
  private runWeapon: WeaponId = "桃木剑";
  private navigationDistances = new Map<string, number>();
  private navigationRefresh = 0;
  private navigationOrigin = "";

  constructor() { super("Game"); }
  init(data: { floor?: number }): void { this.floor = data.floor ?? 1; this.runWeapon = new Rng().pick(Object.keys(WEAPONS) as WeaponId[]); }
  create(): void {
    this.keys = this.input.keyboard!.addKeys({ up: "W", down: "S", left: "A", right: "D", space: "SPACE", interact: "E", pause: "ESC" }) as Record<string, Phaser.Input.Keyboard.Key>;
    this.input.keyboard!.on("keydown-UP", () => this.togglePause()); this.input.keyboard!.on("keydown-DOWN", () => this.togglePause());
    this.startFloor(this.floor);
  }
  private startFloor(floor: number): void {
    this.floor = floor; this.children.removeAll(true); this.enemies = []; this.projectiles = []; this.items = []; this.spawned = 0; this.defeated = 0; this.spawnTimer = 800; this.attackCooldown = 0; this.bossTimer = 0; this.bossWarning = 0; this.navigationDistances.clear(); this.navigationRefresh = 0; this.navigationOrigin = ""; this.rng = new Rng(); this.seedText = (this.rng as unknown as { state: number }).state?.toString(16).toUpperCase() ?? Math.floor(Math.random() * 1e8).toString(16).toUpperCase();
    this.map = new MapGenerator().generate(this.rng); this.drawMap();
    const perm = permanentStats(this.save.get().ownedEquipment, this.save.get().equipmentLevel);
    const stats: Stats = { maxHp: 300 + (perm.maxHp ?? 0), attack: 30 + (perm.attack ?? 0), defense: 20 + (perm.defense ?? 0), speed: 96 + (perm.speed ?? 0), crit: .05, attackSpeed: 0 };
    this.player = new Player(this, this.tilePosition(this.map.spawn), stats, this.runWeapon);
    this.target = floor % 10 === 0 ? 1 + Math.min(22 + floor, 50) : Math.min(18 + floor * 3, 70);
    this.createHud(); this.createKeyboardHelp(); this.toast(`第 ${floor} 关 · 初始武器 ${this.runWeapon}`, 1600);
  }
  private drawMap(): void { const g = this.add.graphics().setDepth(0); const offsetX = Math.floor((GAME_WIDTH - this.map.width * TILE) / 2); this.map.walkable.forEach((tile) => { const x = offsetX + tile.x * TILE, y = MAP_Y + tile.y * TILE; g.fillStyle((tile.x + tile.y) % 2 ? 0x1a3030 : 0x192b2d); g.fillRect(x + 1, y + 1, TILE - 2, TILE - 2); g.lineStyle(1, 0x314547, .5); g.strokeRect(x + 2, y + 2, TILE - 4, TILE - 4); }); this.map.walls.forEach((row, y) => row.forEach((wall, x) => { if (!wall) return; const px = offsetX + x * TILE, py = MAP_Y + y * TILE; g.fillStyle(0x0e2022); g.fillRect(px, py, TILE, TILE); g.fillStyle(0x304548); g.fillRect(px + 2, py + 2, TILE - 4, 6); g.fillStyle(0x562f2e); if ((x * 7 + y) % 5 === 0) g.fillRect(px + 15, py + 10, 2, 15); })); }
  private createHud(): void { const top = this.add.graphics().setDepth(30); top.fillStyle(0x091516, .96); top.fillRect(0, 0, GAME_WIDTH, 108); top.lineStyle(2, 0xb8a45b); top.lineBetween(0, 108, GAME_WIDTH, 108); this.hud = this.add.text(18, 14, "", { fontFamily: "Microsoft YaHei", fontSize: "17px", color: "#e2ecd9", lineSpacing: 5 }).setDepth(31); this.add.text(GAME_WIDTH / 2, 17, `种子: ${this.seedText}`, { fontFamily: "monospace", fontSize: "14px", color: "#a3c5bb" }).setOrigin(.5, 0).setDepth(31); const pause = this.add.rectangle(540, 31, 44, 44, 0x284849).setStrokeStyle(2, 0xd7c47f).setDepth(32).setInteractive({ useHandCursor: true }); this.add.text(540, 30, "Ⅱ", { fontSize: "26px", color: "#f2e9c8" }).setOrigin(.5).setDepth(33); pause.on("pointerup", () => this.togglePause()); this.banner = this.add.text(GAME_WIDTH / 2, 120, "", { fontSize: "22px", color: "#f0d990", backgroundColor: "#192b2d", padding: { x: 14, y: 8 } }).setOrigin(.5, 0).setDepth(50).setVisible(false); }
  private createKeyboardHelp(): void { this.add.text(GAME_WIDTH / 2, 810, "WASD / 方向键移动   自动攻击   E 交互   Esc 暂停", { fontFamily: "Microsoft YaHei, Arial", fontSize: "15px", color: "#a8c1b6" }).setOrigin(.5).setDepth(20); }
  update(_time: number, delta: number): void {
    if (this.paused || this.modal) return;
    const dt = Math.min(delta, 50); this.updatePlayer(dt); this.updateNavigation(dt); this.updateCombat(dt); this.updateEnemies(dt); this.updateProjectiles(dt); this.updateInteraction(dt); this.updateHud();
    if (this.player.hp <= 0) this.death();
  }
  private updatePlayer(delta: number): void { const move = new Phaser.Math.Vector2(); if (this.keys.left.isDown) move.x -= 1; if (this.keys.right.isDown) move.x += 1; if (this.keys.up.isDown) move.y -= 1; if (this.keys.down.isDown) move.y += 1; if (move.lengthSq() > 1) move.normalize(); if (this.player.stunned > 0) { this.player.stunned -= delta; move.set(0); }
    const next = this.player.position.clone().add(move.scale(this.player.stats.speed * delta / 1000)); if (!this.blocked(next)) this.player.position.copy(next); else { const xOnly = this.player.position.clone().add(new Phaser.Math.Vector2(move.x, 0).scale(this.player.stats.speed * delta / 1000)); const yOnly = this.player.position.clone().add(new Phaser.Math.Vector2(0, move.y).scale(this.player.stats.speed * delta / 1000)); if (!this.blocked(xOnly)) this.player.position.copy(xOnly); else if (!this.blocked(yOnly)) this.player.position.copy(yOnly); }
    this.player.invincible = Math.max(0, this.player.invincible - delta); this.player.draw();
  }
  private updateCombat(delta: number): void { this.attackCooldown = Math.max(0, this.attackCooldown - delta); const target = this.nearestEnemyInRange(); if (target && this.attackCooldown <= 0) { this.player.aim.copy(target.position.clone().subtract(this.player.position).normalize()); this.attack(target); } }
  private effectiveAttackRange(): number { return BASE_ATTACK_RANGE + WEAPONS[this.player.weapon].range; }
  private nearestEnemyInRange(): Enemy | undefined { const range = this.effectiveAttackRange() * TILE; return this.enemies.filter((enemy) => enemy.alive && enemy.position.distance(this.player.position) <= range).sort((a, b) => a.position.distance(this.player.position) - b.position.distance(this.player.position))[0]; }
  private attack(target: Enemy): void { this.attackCooldown = Math.max(250, 750 / (1 + this.player.stats.attackSpeed)); const weapon = WEAPONS[this.player.weapon]; const range = this.effectiveAttackRange() * TILE; const crit = this.rng.next() < this.player.stats.crit; const hit: Enemy[] = []; for (const enemy of this.enemies) { const distance = enemy.position.distance(this.player.position); const direction = enemy.position.clone().subtract(this.player.position).normalize(); const dot = direction.dot(this.player.aim); const circle = this.player.weapon === "八卦盘" || this.player.weapon === "拂尘"; const line = this.player.weapon === "红葫芦"; if (distance <= range && (circle || (line ? dot > .86 : dot > .35))) hit.push(enemy); }
    if (this.player.weapon === "雷符") { const center = target.position; this.enemies.forEach((enemy) => { if (enemy.position.distance(center) < 1.5 * TILE) hit.push(enemy); }); }
    const flash = this.add.graphics().setDepth(15); flash.lineStyle(5, 0xb8f7ec, .85); flash.lineBetween(this.player.position.x, this.player.position.y, this.player.position.x + this.player.aim.x * range, this.player.position.y + this.player.aim.y * range); this.tweens.add({ targets: flash, alpha: 0, duration: 120, onComplete: () => flash.destroy() }); [...new Set(hit)].forEach((enemy) => { const amount = damage(this.player.stats.attack, 0, weapon.multiplier, crit); this.damageEnemy(enemy, amount, crit, this.player.weapon === "红葫芦"); }); }
  private updateNavigation(delta: number): void {
    this.navigationRefresh -= delta;
    const origin = this.worldTile(this.player.position), originKey = this.tileKey(origin.x, origin.y);
    if (this.navigationRefresh > 0 && this.navigationOrigin === originKey) return;
    this.navigationRefresh = 180; this.navigationOrigin = originKey; this.navigationDistances.clear();
    if (this.map.walls[origin.y]?.[origin.x]) return;
    const queue = [origin]; this.navigationDistances.set(originKey, 0);
    for (let index = 0; index < queue.length; index++) {
      const tile = queue[index], distance = this.navigationDistances.get(this.tileKey(tile.x, tile.y))!;
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const x = tile.x + dx, y = tile.y + dy, key = this.tileKey(x, y);
        if (!this.map.walls[y]?.[x] && !this.navigationDistances.has(key)) { this.navigationDistances.set(key, distance + 1); queue.push(new Phaser.Math.Vector2(x, y)); }
      }
    }
  }
  private navigationDirection(position: Phaser.Math.Vector2): Phaser.Math.Vector2 {
    const current = this.worldTile(position); let best = current, bestDistance = this.navigationDistances.get(this.tileKey(current.x, current.y)) ?? Infinity;
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const tile = new Phaser.Math.Vector2(current.x + dx, current.y + dy), distance = this.navigationDistances.get(this.tileKey(tile.x, tile.y));
      if (distance !== undefined && distance < bestDistance) { best = tile; bestDistance = distance; }
    }
    const target = best.equals(current) ? this.player.position : this.tilePosition(best);
    return target.clone().subtract(position).normalize();
  }
  private updateEnemies(delta: number): void { this.spawnTimer -= delta; if (this.spawned < this.target && this.spawnTimer <= 0 && this.enemies.length < 55) { this.spawnWave(); this.spawnTimer = 3000; } for (const enemy of this.enemies) { if (!enemy.alive) continue; enemy.cooldown -= delta; enemy.hitFlash = Math.max(0, enemy.hitFlash - delta); enemy.burn = Math.max(0, enemy.burn - delta); enemy.burnTick += delta; if (enemy.burn > 0 && enemy.burnTick > 1000) { enemy.burnTick = 0; this.damageEnemy(enemy, Math.max(1, Math.floor(enemy.hpMax * .01)), false, false); }
      const enemyTile = this.worldTile(enemy.position); const pathDistance = this.navigationDistances.get(this.tileKey(enemyTile.x, enemyTile.y)) ?? Infinity; const attackRange = enemy.definition.ranged ? 5 : 1; if (pathDistance > attackRange) { const direction = this.navigationDirection(enemy.position); const speed = enemy.boss ? 64 : (enemy.kind === "狼兵" && Math.floor(this.time.now / 5000) % 2 === 0 ? 96 : 48); const next = enemy.position.clone().add(direction.scale(speed * delta / 1000)); if (!this.blocked(next)) enemy.position.copy(next); } else if (enemy.cooldown <= 0) { enemy.cooldown = enemy.definition.ranged ? 3000 : 1500; if (enemy.definition.ranged) this.shootEnemy(enemy); else this.hitPlayer(damage(enemy.attack, this.player.stats.defense)); }
      enemy.draw(); }
    this.enemies = this.enemies.filter((enemy) => enemy.alive);
    const boss = this.enemies.find((enemy) => enemy.boss); if (boss) { this.bossTimer += delta; if (this.bossTimer > 13800 && this.bossWarning === 0) { this.bossWarning = 1200; this.toast("迷魂震荡！", 1200); } if (this.bossWarning > 0) { this.bossWarning -= delta; if (this.bossWarning <= 0) { this.player.stunned = 1000; this.hitPlayer(Math.round(this.player.stats.maxHp * .02), true); this.bossTimer = 0; } } }
    if (this.defeated === this.target && this.items.length === 0) this.spawnRewards();
  }
  private spawnWave(): void { const count = Math.min(this.target - this.spawned, this.floor % 10 === 0 && this.spawned === 0 ? 1 : this.rng.int(3, 8)); for (let i = 0; i < count; i++) { const boss = this.floor % 10 === 0 && this.spawned === 0; const enemy = this.spawnEnemy(boss); if (enemy) { this.enemies.push(enemy); this.spawned++; } } }
  private spawnEnemy(boss: boolean): Enemy | null { const available = (Object.keys(ENEMIES) as EnemyKind[]).filter((kind) => ENEMIES[kind].unlock <= this.floor); const melee = available.filter((kind) => !ENEMIES[kind].ranged), ranged = available.filter((kind) => ENEMIES[kind].ranged); const kind = boss ? this.rng.pick(available) : this.rng.next() < .8 || !ranged.length ? this.rng.pick(melee) : this.rng.pick(ranged); let tile = this.rng.pick(this.map.walkable); for (let tries = 0; tries < 25 && this.tilePosition(tile).distance(this.player.position) < 5 * TILE; tries++) tile = this.rng.pick(this.map.walkable); const def = ENEMIES[kind], scale = 1 + .12 * (this.floor - 1); const eliteChance = Math.min(.03 + this.floor * .004, .25), elite = !boss && this.rng.next() < eliteChance ? this.rng.pick([0x4b9b66, 0x4287ba, 0x9654b5, 0xd0aa42, 0xd34242]) : 0; const multiplier = elite ? 1.25 : 1; const bossNumber = Math.max(1, Math.floor(this.floor / 10)); return new Enemy(this, kind, this.tilePosition(tile), Math.round(def.hp * scale * multiplier * (boss ? 8 * (1 + .3 * (bossNumber - 1)) : 1)), Math.round(def.attack * scale * multiplier * (boss ? 2.5 * (1 + .3 * (bossNumber - 1)) : 1)), boss, elite); }
  private shootEnemy(enemy: Enemy): void { const count = enemy.kind === "幽灵" ? 5 : 2; const aim = this.player.position.clone().subtract(enemy.position).normalize(); for (let i = 0; i < count && this.projectiles.filter((p) => p.enemyOwned).length < 80; i++) { const angle = (i - (count - 1) / 2) * .18; const vector = aim.clone().rotate(angle).scale(155); this.projectiles.push(new Projectile(this, enemy.position.clone(), vector, damage(enemy.attack, this.player.stats.defense), true)); } }
  private updateProjectiles(delta: number): void { for (const projectile of this.projectiles) { projectile.update(delta); if (projectile.enemyOwned && projectile.position.distance(this.player.position) < projectile.radius + 11) { this.hitPlayer(projectile.damage); projectile.age = 9999; } if (this.blocked(projectile.position) || projectile.age > 3200) projectile.age = 9999; } this.projectiles = this.projectiles.filter((projectile) => { if (projectile.age > 4000) { projectile.destroy(); return false; } return true; }); }
  private hitPlayer(amount: number, trueDamage = false): void { const final = trueDamage ? amount : amount; if (this.player.hit(final)) { this.cameras.main.flash(90, 115, 22, 22, false); this.floatText(this.player.position, `-${final}`, "#ff806e"); } }
  private damageEnemy(enemy: Enemy, amount: number, crit: boolean, burn = false): void { if (!enemy.alive) return; const dead = enemy.hurt(amount, burn); this.floatText(enemy.position, `${crit ? "暴击 " : ""}${amount}`, crit ? "#f4d561" : "#d9ffff"); if (dead) { this.defeated++; if (this.rng.next() < .08 && this.player.hp < this.player.stats.maxHp) this.player.heal(this.player.stats.maxHp * .08); } }
  private spawnRewards(): void { const spot = this.safeTile(6); this.items.push(this.makeItem("chest", spot)); const seals = this.rng.int(0, 2); for (let i = 0; i < seals; i++) this.items.push(this.makeItem("seal", this.safeTile(4))); this.toast("房间已清空，开启奖励宝箱", 2200); }
  private makeItem(kind: Interactable["kind"], position: Phaser.Math.Vector2): Interactable { const g = this.add.graphics().setDepth(4); const item: Interactable = { kind, position, graphic: g, progress: 0 }; this.drawItem(item); return item; }
  private drawItem(item: Interactable): void { const g = item.graphic; g.clear(); if (item.kind === "chest") { g.fillStyle(item.opened ? 0x5c4b36 : 0xd3a94e); g.fillRect(item.position.x - 13, item.position.y - 10, 26, 20); g.fillStyle(0x5a3927); g.fillRect(item.position.x - 13, item.position.y - 2, 26, 4); } else if (item.kind === "seal") { g.lineStyle(3, 0xd5c857); g.strokeCircle(item.position.x, item.position.y, 16); g.fillStyle(0xf0e59a); g.fillCircle(item.position.x, item.position.y, 6); } else { g.fillStyle(0x0c0712); g.fillCircle(item.position.x, item.position.y, 23); g.lineStyle(2, 0x8f63ae); g.strokeCircle(item.position.x, item.position.y, 23); } }
  private updateInteraction(delta: number): void { const nearby = this.items.find((item) => !item.opened && item.position.distance(this.player.position) < 42); this.interactionHeld = this.keys.interact.isDown; if (!nearby) return; if (nearby.kind === "seal") { if (this.interactionHeld) { nearby.progress = (nearby.progress ?? 0) + delta; this.toast(`封印解锁 ${Math.ceil(Math.max(0, SEAL_UNLOCK_DURATION - nearby.progress) / 1000)} 秒`, 100); if ((nearby.progress ?? 0) >= SEAL_UNLOCK_DURATION) { nearby.opened = true; nearby.graphic.destroy(); this.openRewards(new RewardSystem(this.rng).rewards()); } } else nearby.progress = 0; } else if (Phaser.Input.Keyboard.JustDown(this.keys.interact)) { if (nearby.kind === "chest") { nearby.opened = true; this.drawItem(nearby); this.openRewards(new RewardSystem(this.rng).rewards()); const exit = this.makeItem("exit", this.tilePosition(this.map.exit)); this.items.push(exit); } else if (nearby.kind === "exit") this.startFloor(this.floor + 1); } }
  private openRewards(rewards: Reward[]): void { const choices: Reward[] = []; rewards.forEach((reward) => { if (reward.kind === "weapon" || reward.kind === "skill") choices.push(reward); else this.applyReward(reward); }); this.resolveRewardChoices(choices); }
  private resolveRewardChoices(choices: Reward[]): void { const reward = choices.shift(); if (!reward) return; const next = () => this.resolveRewardChoices(choices); if (reward.kind === "weapon") this.weaponChoice(reward.weapon, next); else if (reward.kind === "skill") this.skillChoice(next); else { this.applyReward(reward); next(); } }
  private applyReward(reward: Reward): void { if (reward.kind === "gold") { this.run.gold += reward.amount; this.save.addGold(reward.amount); this.toast(`获得 ${reward.amount} 金币`, 1200); } if (reward.kind === "heal") { this.player.heal(this.player.stats.maxHp * reward.amount); this.toast("获得医疗包", 1200); } if (reward.kind === "fragment") { this.run.fragments[reward.slot]++; this.save.addFragment(reward.slot); this.toast(`获得 ${reward.slot} 碎片`, 1200); } if (reward.kind === "mystery") { this.run.mystery++; this.save.addMystery(); this.toast("获得神秘宝箱碎片", 1200); } }
  private weaponChoice(weapon: WeaponId, onResolved: () => void): void { this.showModal("发现武器", `${weapon}\n${WEAPONS[weapon].description}\n有效射程：${BASE_ATTACK_RANGE + WEAPONS[weapon].range} 格`, "替换当前武器", () => { this.player.weapon = weapon; this.runWeapon = weapon; this.closeModal(); onResolved(); }, "保留当前", () => { this.closeModal(); onResolved(); }); }
  private skillChoice(onResolved: () => void): void { const skills = new RewardSystem(this.rng).skills(); const container = this.add.container().setDepth(100); container.add(this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x000000, .72).setInteractive()); container.add(this.add.text(GAME_WIDTH / 2, 250, "技能石：三选一", { fontSize: "25px", color: "#f2e4b0" }).setOrigin(.5)); skills.forEach((skill, index) => { const x = 110 + index * 178; const card = this.add.rectangle(x, 440, 154, 194, 0x203638).setStrokeStyle(3, skill.color).setInteractive({ useHandCursor: true }); const label = this.add.text(x, 420, skill.name, { fontSize: "17px", color: "#f3ecda", align: "center", wordWrap: { width: 134 } }).setOrigin(.5); const detail = this.add.text(x, 482, "选择后立即生效", { fontSize: "14px", color: "#a9c7bc" }).setOrigin(.5); container.add([card, label, detail]); card.on("pointerdown", () => { if (skill.stat === "maxHp") { const increase = this.player.stats.maxHp * skill.value; this.player.stats.maxHp += increase; this.player.hp += increase; } else this.player.stats[skill.stat] += skill.value; container.destroy(true); this.modal = undefined; this.toast("能力已强化", 1000); onResolved(); }); }); this.modal = container; }
  private showModal(title: string, detail: string, yes: string, onYes: () => void, no: string, onNo: () => void): void { const box = this.add.container().setDepth(100); box.add(this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x000000, .72).setInteractive()); box.add(this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, 420, 280, 0x122527).setStrokeStyle(2, 0xd9c278)); box.add(this.add.text(GAME_WIDTH / 2, 345, title, { fontSize: "26px", color: "#f0d997" }).setOrigin(.5)); box.add(this.add.text(GAME_WIDTH / 2, 415, detail, { fontSize: "18px", color: "#d0e1d8", align: "center" }).setOrigin(.5)); const a = this.add.text(200, 520, yes, { fontSize: "17px", color: "#f2ead0", backgroundColor: "#355154", padding: { x: 14, y: 11 } }).setOrigin(.5).setInteractive({ useHandCursor: true }); const b = this.add.text(376, 520, no, { fontSize: "17px", color: "#d1e4dc", backgroundColor: "#303f40", padding: { x: 14, y: 11 } }).setOrigin(.5).setInteractive({ useHandCursor: true }); box.add([a,b]); a.on("pointerdown", onYes); b.on("pointerdown", onNo); this.modal = box; }
  private closeModal(): void { this.modal?.destroy(true); this.modal = undefined; }
  private togglePause(): void { if (this.modal) return; this.paused = !this.paused; if (!this.paused) { this.banner.setVisible(false); return; } this.showModal("暂停", "计时、敌人与投射物已停止", "继续", () => { this.closeModal(); this.paused = false; }, "返回标题", () => { this.save.recordFloor(this.floor); this.scene.start("Title"); }); }
  private death(): void { this.save.recordFloor(this.floor); this.showModal("闯关结束", `抵达第 ${this.floor} 关\n已保存可带出资源`, "重新开始", () => this.scene.start("Game", { floor: 1 }), "返回标题", () => this.scene.start("Title")); this.paused = true; }
  private updateHud(): void { const weapon = this.player.weapon; this.hud.setText(`第 ${this.floor} 关  ${this.floor % 10 === 0 ? "BOSS" : "战斗"}\n生命 ${Math.ceil(this.player.hp)}/${Math.ceil(this.player.stats.maxHp)}  攻 ${Math.round(this.player.stats.attack)}  金币 ${this.save.get().gold}\n剩余鬼怪 ${Math.max(0, this.target - this.defeated)}  武器 ${weapon}  射程 ${this.effectiveAttackRange()} 格`); }
  private toast(text: string, duration: number): void { if (!this.banner) return; this.banner.setText(text).setVisible(true); this.time.delayedCall(duration, () => this.banner?.setVisible(false)); }
  private floatText(position: Phaser.Math.Vector2, text: string, color: string): void { const label = this.add.text(position.x, position.y - 16, text, { fontSize: "15px", color, fontStyle: "bold" }).setOrigin(.5).setDepth(40); this.tweens.add({ targets: label, y: label.y - 24, alpha: 0, duration: 600, onComplete: () => label.destroy() }); }
  private tilePosition(tile: Phaser.Math.Vector2): Phaser.Math.Vector2 { const ox = Math.floor((GAME_WIDTH - this.map.width * TILE) / 2); return new Phaser.Math.Vector2(ox + tile.x * TILE + TILE / 2, MAP_Y + tile.y * TILE + TILE / 2); }
  private tileKey(x: number, y: number): string { return `${x},${y}`; }
  private worldTile(pos: Phaser.Math.Vector2): Phaser.Math.Vector2 { const ox = Math.floor((GAME_WIDTH - this.map.width * TILE) / 2); return new Phaser.Math.Vector2(Math.floor((pos.x - ox) / TILE), Math.floor((pos.y - MAP_Y) / TILE)); }
  private blocked(pos: Phaser.Math.Vector2): boolean { const tile = this.worldTile(pos); return this.map.walls[tile.y]?.[tile.x] ?? true; }
  private safeTile(distance: number): Phaser.Math.Vector2 { let tile = this.rng.pick(this.map.walkable); for (let tries = 0; tries < 30 && this.tilePosition(tile).distance(this.player.position) < distance * TILE; tries++) tile = this.rng.pick(this.map.walkable); return this.tilePosition(tile); }
}
