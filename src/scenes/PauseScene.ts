import Phaser from 'phaser'
import { LEVELS } from '../data/levels'
import { progress } from '../state/progress'

export class PauseScene extends Phaser.Scene {
  constructor() {
    super('pause')
  }

  create() {
    const level = LEVELS[progress.levelIndex]
    const gems = progress.levelGems[progress.levelIndex] ?? []

    this.add.rectangle(0, 0, 480, 270, 0x000000).setOrigin(0, 0).setAlpha(0.7)
    this.add.rectangle(240, 140, 280, 210, 0x1e1e30).setStrokeStyle(2, 0x5a5a82)

    this.add
      .text(240, 58, '设置', {
        fontFamily: 'sans-serif',
        fontSize: '24px',
        color: '#ffd54f',
      })
      .setOrigin(0.5)

    this.add
      .text(240, 86, level.name, {
        fontFamily: 'sans-serif',
        fontSize: '14px',
        color: '#ffffff',
      })
      .setOrigin(0.5)

    for (let slot = 0; slot < 3; slot++) {
      this.add
        .image(240 - 32 + slot * 32, 116, 'gem')
        .setScale(2)
        .setTint(slot < gems.length ? 0xffd54f : 0x33333f)
    }

    this.makeButton(160, '继续游戏', () => this.resumeGame())
    this.makeButton(194, '重开本关', () => {
      this.scene.stop('game')
      this.scene.start('game')
    })
    this.makeButton(228, '回到选择界面', () => {
      this.scene.stop('game')
      this.scene.start('select')
    })

    this.input.keyboard!.on('keydown-ESC', () => {
      this.resumeGame()
    })
  }

  private resumeGame() {
    this.scene.resume('game')
    this.scene.stop()
  }

  private makeButton(y: number, label: string, onClick: () => void) {
    const rect = this.add.rectangle(240, y, 180, 26, 0x2c2c44).setStrokeStyle(2, 0x4a4a6a)
    const text = this.add
      .text(240, y, label, {
        fontFamily: 'sans-serif',
        fontSize: '15px',
        color: '#ffffff',
      })
      .setOrigin(0.5)

    rect.setInteractive({ useHandCursor: true })

    rect.on('pointerover', () => {
      rect.setFillStyle(0x3d3d5e)
      text.setColor('#ffd54f')
    })

    rect.on('pointerout', () => {
      rect.setFillStyle(0x2c2c44)
      text.setColor('#ffffff')
    })

    rect.on('pointerdown', onClick)
  }
}