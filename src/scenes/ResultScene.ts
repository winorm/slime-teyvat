import Phaser from 'phaser'
import { LEVELS } from '../data/levels'
import { progress } from '../state/progress'

export class ResultScene extends Phaser.Scene {
  constructor() {
    super('result')
  }

  create() {
    const index = progress.levelIndex
    const level = LEVELS[index]
    const gems = progress.levelGems[index] ?? []
    const isLast = index >= LEVELS.length - 1

    this.add
      .text(240, 34, isLast ? '全部通关！' : '关卡完成！', {
        fontFamily: 'sans-serif',
        fontSize: '28px',
        color: '#ffd54f',
      })
      .setOrigin(0.5)

    this.add
      .text(240, 64, level.name, {
        fontFamily: 'sans-serif',
        fontSize: '16px',
        color: '#ffffff',
      })
      .setOrigin(0.5)

    for (let slot = 0; slot < 3; slot++) {
      const lit = slot < gems.length

      this.add
        .image(240 - 36 + slot * 36, 104, 'gem')
        .setScale(2)
        .setTint(lit ? 0xffd54f : 0x33333f)
    }

    this.add
      .text(240, 132, '已收集 ' + gems.length + ' / ' + level.gems.length, {
        fontFamily: 'sans-serif',
        fontSize: '14px',
        color: '#8fa3b8',
      })
      .setOrigin(0.5)

    if (isLast) {
      this.makeButton(180, '重来一次', () => this.scene.start('game'))
      this.makeButton(218, '回到选择界面', () => this.scene.start('select'))
    } else {
      this.makeButton(170, '重来一次', () => this.scene.start('game'))
      this.makeButton(202, '下一关', () => {
        progress.levelIndex += 1
        this.scene.start('game')
      })
      this.makeButton(234, '回到选择界面', () => this.scene.start('select'))
    }

    this.input.keyboard!.once('keydown-ESC', () => {
      this.scene.start('select')
    })
  }

  private makeButton(y: number, label: string, onClick: () => void) {
    const rect = this.add.rectangle(240, y, 160, 26, 0x24243a).setStrokeStyle(2, 0x4a4a6a)
    const text = this.add
      .text(240, y, label, {
        fontFamily: 'sans-serif',
        fontSize: '15px',
        color: '#ffffff',
      })
      .setOrigin(0.5)

    rect.setInteractive({ useHandCursor: true })

    rect.on('pointerover', () => {
      rect.setFillStyle(0x35355a)
      text.setColor('#ffd54f')
    })

    rect.on('pointerout', () => {
      rect.setFillStyle(0x24243a)
      text.setColor('#ffffff')
    })

    rect.on('pointerdown', onClick)
  }
}