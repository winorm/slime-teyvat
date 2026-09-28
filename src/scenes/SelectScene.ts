import Phaser from 'phaser'
import { LEVELS } from '../data/levels'
import { progress, DEV_MODE } from '../state/progress'
import { ELEMENTS } from '../data/elements'

const COLS = 5
const CELL_W = 84
const CELL_H = 60
const FIRST_X = 72
const FIRST_Y = 80

export class SelectScene extends Phaser.Scene {
  constructor() {
    super('select')
  }

  create() {
    this.add
      .text(240, 22, '选择关卡', {
        fontFamily: 'sans-serif',
        fontSize: '24px',
        color: '#ffffff',
      })
      .setOrigin(0.5)

    for (let index = 0; index < 15; index++) {
      const col = index % COLS
      const row = Math.floor(index / COLS)

      this.makeCell(index, FIRST_X + col * CELL_W, FIRST_Y + row * CELL_H)
    }

    this.add
      .text(240, 252, '按 Esc 回到标题', {
        fontFamily: 'sans-serif',
        fontSize: '14px',
        color: '#8fa3b8',
      })
      .setOrigin(0.5)

    this.input.keyboard!.once('keydown-ESC', () => {
      this.scene.start('menu')
    })

    if (DEV_MODE) {
      this.add
        .text(12, 12, '开发者模式：全部关卡已解锁', {
          fontFamily: 'sans-serif',
          fontSize: '12px',
          color: '#ff9a9a',
        })
        .setOrigin(0, 0)
    }
  }

  private makeCell(index: number, x: number, y: number) {
    const level = LEVELS[index]
    const isPlayable = level !== undefined && (DEV_MODE || index <= progress.maxLevel)

    this.add.rectangle(x, y, 76, 52, 0x1e1e30).setStrokeStyle(2, 0x3a3a5a)

    if (!level) {
      this.add.image(x, y - 8, 'slime-none').setTint(0x2a2a3e)
      this.add.image(x + 24, y + 14, 'lock').setTint(0x55556a)
      return
    }

    const element = ELEMENTS[level.startElement]

    const slime = this.add.image(x, y - 8, 'slime-' + level.startElement)

    if (element.wing) {
      const wings: [number, number, number][] = [
        [-8, 1, -45],
        [8, 0, 45],
      ]

      wings.forEach(([offset, originX, angle]) => {
        const wing = this.add
          .image(x + offset, y - 14, 'wing')
          .setOrigin(originX, 0.5)
          .setAngle(angle)
          .setScale(0.75)
          .setTint(isPlayable ? element.color : 0x3a3a4e)

        if (originX === 1) {
          wing.setFlipX(true)
        }
      })
    }

    const eyeTint = isPlayable ? element.eyeColor : 0x2a2a3a

    this.add.image(x - 5, y - 10, 'eye').setTint(eyeTint)
    this.add.image(x + 5, y - 10, 'eye').setTint(eyeTint)

    if (!isPlayable) {
      slime.setTint(0x3a3a4e)
    }

    const gems = progress.levelGems[index] ?? []

    for (let slot = 0; slot < 3; slot++) {
      const lit = slot < gems.length

      this.add.image(x - 16 + slot * 16, y + 16, 'gem').setTint(lit ? 0x6ec6ff : 0x33333f)
    }

    if (isPlayable) {
      slime.setInteractive({ useHandCursor: true })

      slime.on('pointerdown', () => {
        progress.levelIndex = index
        this.scene.start('game')
      })
    }
  }
}