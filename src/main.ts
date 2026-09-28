import Phaser from 'phaser'
import { BootScene } from './scenes/BootScene'
import { MenuScene } from './scenes/MenuScene'
import { GameScene } from './scenes/GameScene'
import { ResultScene } from './scenes/ResultScene'
import { SelectScene } from './scenes/SelectScene'
import { PauseScene } from './scenes/PauseScene'
import { DeadScene } from './scenes/DeadScene'

// 出错时把错误直接画在页面上，不用打开浏览器控制台也能看到原因
function showFatal(text: string) {
  let box = document.getElementById('fatal-box')

  if (!box) {
    box = document.createElement('pre')
    box.id = 'fatal-box'
    box.style.cssText = [
      'position:fixed',
      'left:8px',
      'top:8px',
      'max-width:90vw',
      'max-height:60vh',
      'overflow:auto',
      'margin:0',
      'padding:8px 10px',
      'background:#3a0d0dcc',
      'color:#ffd0d0',
      'font:12px/1.5 monospace',
      'white-space:pre-wrap',
      'z-index:9999',
      'border:1px solid #ff7a7a',
    ].join(';')
    document.body.appendChild(box)
  }

  box.textContent = text
}

window.addEventListener('error', (event) => {
  showFatal(event.message + '\n' + (event.filename ?? '') + ':' + (event.lineno ?? 0))
})

window.addEventListener('unhandledrejection', (event) => {
  showFatal(String(event.reason))
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
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { x: 0, y: 600 },
      debug: false,
    },
  },
  scene: [BootScene, MenuScene, SelectScene, GameScene, PauseScene, DeadScene, ResultScene],
  
})
