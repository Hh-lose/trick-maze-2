import Phaser from "phaser";

export const GAME_WIDTH = 576;
export const GAME_HEIGHT = 896;
export const TILE = 32;
export const MAP_Y = 118;
export const GAME_KEY = "trick-maze-save-v1";

export const gameConfig: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  parent: "app",
  width: GAME_WIDTH,
  height: GAME_HEIGHT,
  backgroundColor: "#091113",
  pixelArt: true,
  scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
  scene: [],
};
