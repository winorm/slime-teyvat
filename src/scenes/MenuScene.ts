import Phaser from 'phaser'
import { progress } from '../state/progress'

export class MenuScene extends Phaser.Scene {
  constructor() {
    super('menu')
  }

  create() {
    this.add
      .text(240, 60, '重生之我在提瓦特当史莱姆', {
        fontFamily: 'sans-serif',
        fontSize: '24px',
        color: '#7be0a8',
      })
      .setOrigin(0.5)

    this.add.image(240, 140, 'slime-none')

    this.add
      .text(240, 210, '按 空格 开始冒险', {
        fontFamily: 'sans-serif',
        fontSize: '18px',
        color: '#ffffff',
      })
      .setOrigin(0.5)

    this.input.keyboard!.once('keydown-SPACE', () => {
      progress.levelIndex = 0
      this.scene.start('game')
    })
  }
}