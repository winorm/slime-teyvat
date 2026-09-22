import Phaser from 'phaser'
import { LEVELS } from '../data/levels'
import { progress } from '../state/progress'

export class ResultScene extends Phaser.Scene {
  constructor() {
    super('result')
  }

  create() {
    const isLast = progress.levelIndex >= LEVELS.length - 1

    this.add
      .text(240, 70, isLast ? '全部通关！' : '关卡完成！', {
        fontFamily: 'sans-serif',
        fontSize: '32px',
        color: '#ffd54f',
      })
      .setOrigin(0.5)

    this.add
      .text(240, 120, LEVELS[progress.levelIndex].name, {
        fontFamily: 'sans-serif',
        fontSize: '18px',
        color: '#ffffff',
      })
      .setOrigin(0.5)

    if (isLast) {
      this.add
        .text(240, 180, '按 Esc 回到标题', {
          fontFamily: 'sans-serif',
          fontSize: '18px',
          color: '#9aa5b1',
        })
        .setOrigin(0.5)

      this.input.keyboard!.once('keydown-ESC', () => {
        this.scene.start('menu')
      })
    } else {
      this.add
        .text(240, 180, '按 空格 继续冒险', {
          fontFamily: 'sans-serif',
          fontSize: '18px',
          color: '#ffffff',
        })
        .setOrigin(0.5)

      this.input.keyboard!.once('keydown-SPACE', () => {
        progress.levelIndex += 1
        this.scene.start('game')
      })

      this.input.keyboard!.once('keydown-ESC', () => {
        this.scene.start('menu')
      })
    }
  }
}