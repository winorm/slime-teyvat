import Phaser from 'phaser'

export class MenuScene extends Phaser.Scene {
  constructor() {
    super('menu')
  }

  create() {
    this.add
      .text(480, 180, '重生之我在提瓦特当史莱姆', {
        fontFamily: 'sans-serif',
        fontSize: '44px',
        color: '#7be0a8',
      })
      .setOrigin(0.5)

    this.add.image(480, 320, 'slime').setTint(0x7be0a8)

    this.add
      .text(480, 420, '按 空格 开始冒险', {
        fontFamily: 'sans-serif',
        fontSize: '24px',
        color: '#ffffff',
      })
      .setOrigin(0.5)

    this.input.keyboard!.once('keydown-SPACE', () => {
      this.scene.start('game')
    })
  }
}