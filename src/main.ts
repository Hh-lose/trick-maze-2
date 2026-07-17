import Phaser from "phaser";
import { gameConfig } from "./config/gameConfig";
import { BootScene } from "./scenes/BootScene";
import { GameScene } from "./scenes/GameScene";
import { OverlayScene } from "./scenes/OverlayScene";
import { TitleScene } from "./scenes/TitleScene";

new Phaser.Game({ ...gameConfig, scene: [BootScene, TitleScene, GameScene, OverlayScene] });
