# 诡计迷宫：无尽闯关

基于 Vite + TypeScript + Phaser 3 的离线单机竖屏像素动作 Roguelite。所有画面由 Canvas/Phaser 原生图形绘制，无外部图片、音频、CDN 或网络服务。

## 运行

```powershell
pnpm install
pnpm run dev
```

打开终端给出的本地地址 https://hh-lose.github.io/trick-maze-2/。使用 WASD 或方向键移动；角色会自动攻击范围内最近的敌人，攻击距离为基础 2 格加上当前武器距离；E 交互，Esc 暂停。

## 构建

```powershell
pnpm run build
```

进度保存在浏览器 `localStorage` 的 `trick-maze-save-v1` 键中。
