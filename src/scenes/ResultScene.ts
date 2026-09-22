import Phaser from 'phaser'

export class ResultScene extends Phaser.Scene {
  constructor() {
    super('result')
  }

  create() {
    this.add
      .text(240, 80, '通关！', {
        fontFamily: 'sans-serif',
        fontSize: '36px',
        color: '#ffd54f',
      })
      .setOrigin(0.5)

    this.add
      .text(240, 160, '按 空格 再玩一次', {
        fontFamily: 'sans-serif',
        fontSize: '18px',
        color: '#ffffff',
      })
      .setOrigin(0.5)

    this.add
      .text(240, 195, '按 Esc 回到标题', {
        fontFamily: 'sans-serif',
        fontSize: '18px',
        color: '#9aa5b1',
      })
      .setOrigin(0.5)

    this.input.keyboard!.once('keydown-SPACE', () => {
      this.scene.start('game')
    })

    this.input.keyboard!.once('keydown-ESC', () => {
      this.scene.start('menu')
    })
  }
}