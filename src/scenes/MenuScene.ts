import Phaser from 'phaser'
import { ELEMENTS, type ElementKey } from '../data/elements'

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

    this.makeSlime(200, 140, 'none')
    this.makeSlime(280, 140, 'wind')

    this.add
      .text(240, 210, '按 空格 开始冒险', {
        fontFamily: 'sans-serif',
        fontSize: '18px',
        color: '#ffffff',
      })
      .setOrigin(0.5)

    this.input.keyboard!.once('keydown-SPACE', () => {
      this.scene.start('select')
    })
  }

  private makeSlime(x: number, y: number, key: ElementKey) {
    const element = ELEMENTS[key]

    this.add.image(x, y, 'slime-' + key)

    if (element.wing) {
      this.add
        .image(x - 12, y - 10, 'wing')
        .setOrigin(1, 0.5)
        .setFlipX(true)
        .setAngle(-45)
        .setScale(0.75)
        .setTint(element.color)

      this.add
        .image(x + 12, y - 10, 'wing')
        .setOrigin(0, 0.5)
        .setAngle(45)
        .setScale(0.75)
        .setTint(element.color)
    }

    this.add.image(x - 5, y - 2, 'eye').setTint(element.eyeColor)
    this.add.image(x + 5, y - 2, 'eye').setTint(element.eyeColor)
  }
}