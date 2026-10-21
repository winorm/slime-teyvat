import Phaser from 'phaser'
import { BootScene } from './scenes/BootScene'
import { MenuScene } from './scenes/MenuScene'
import { GameScene } from './scenes/GameScene'
import { ResultScene } from './scenes/ResultScene'
import { SelectScene } from './scenes/SelectScene'
import { PauseScene } from './scenes/PauseScene'
import { DeadScene } from './scenes/DeadScene'
import { AchievementScene } from './scenes/AchievementScene'
import { AchievementListScene } from './scenes/AchievementListScene'
import { SaveScene } from './scenes/SaveScene'

window.addEventListener('error', (event) => {
  console.error(event.error ?? event.message)
})

window.addEventListener('unhandledrejection', (event) => {
  console.error(event.reason)
})

new Phaser.Game({
  type: Phaser.AUTO,
  parent: 'game',
  width: 480,
  height: 270,
  backgroundColor: '#1a1a2e',
  pixelArt: true,
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  render: {
    // 手机上尽量要性能档（双 GPU 的机器会挑大核）
    powerPreference: 'high-performance',
  },
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { x: 0, y: 600 },
      debug: false,
    },
  },
  scene: [BootScene, MenuScene, SaveScene, SelectScene, GameScene, PauseScene, DeadScene, ResultScene, AchievementListScene, AchievementScene],
  
})
