import Phaser from 'phaser'
import { ELEMENTS, ELEMENT_ORDER, type ElementKey } from '../data/elements'

const ICON_NONE = [
  '................',
  '................',
  '.....######.....',
  '...##########...',
  '..############..',
  '..############..',
  '.##############.',
  '.##############.',
  '.##############.',
  '.##############.',
  '..############..',
  '..############..',
  '...##########...',
  '.....######.....',
  '................',
  '................',
]

const ICON_WIND = [
  '................',
  '................',
  '...#####........',
  '.......##.......',
  '......##........',
  '................',
  '.....#####......',
  '.........##.....',
  '........##......',
  '................',
  '......#####.....',
  '..........##....',
  '.........##.....',
  '................',
  '................',
  '................',
]

export class BootScene extends Phaser.Scene {
  constructor() {
    super('boot')
  }

  create() {
    this.makeTextures()
    this.scene.start('menu')
  }

  private makeTextures() {
    const pixelGfx = this.add.graphics()
    pixelGfx.fillStyle(0xffffff, 1)
    pixelGfx.fillRect(0, 0, 1, 1)
    pixelGfx.generateTexture('pixel', 1, 1)
    pixelGfx.destroy()

    ELEMENT_ORDER.forEach((key) => {
      this.makeSlime(key)
    })

    this.makeEye()
    this.makeGem()
    this.makeLock()

    const orbGfx = this.add.graphics()
    orbGfx.fillStyle(0xffffff, 1)
    orbGfx.fillCircle(7, 7, 7)
    orbGfx.generateTexture('orb', 14, 14)
    orbGfx.destroy()

    const goalGfx = this.add.graphics()
    goalGfx.fillStyle(0xffffff, 1)
    goalGfx.fillRoundedRect(0, 0, 24, 24, 6)
    goalGfx.generateTexture('goal', 24, 24)
    goalGfx.destroy()
    
    const statueGfx = this.add.graphics()
    statueGfx.fillStyle(0xffffff, 1)
    statueGfx.fillRect(0, 40, 32, 8)
    statueGfx.fillRoundedRect(6, 16, 20, 26, 6)
    statueGfx.fillCircle(16, 12, 10)
    statueGfx.generateTexture('statue', 32, 48)
    statueGfx.destroy()

    const chestGfx = this.add.graphics()
    chestGfx.fillStyle(0xffffff, 1)
    chestGfx.fillRect(0, 12, 32, 16)
    chestGfx.fillRoundedRect(0, 4, 32, 10, 5)
    chestGfx.generateTexture('chest', 32, 28)
    chestGfx.destroy()

    this.makeIcon('icon-none', ICON_NONE)
    this.makeIcon('icon-wind', ICON_WIND)

    this.makeRidge('bg-far', 480, 105, 0x2b2b46, [3, 7], 18)
    this.makeRidge('bg-mid', 480, 80, 0x222236, [2, 5], 14)

    this.makeBlessing()
  }

  private makeSlime(key: ElementKey) {
    const element = ELEMENTS[key]
    const gfx = this.add.graphics()

    gfx.fillStyle(0x14141f, 1)
    gfx.fillCircle(16, 13, 13)
    gfx.fillEllipse(16, 18, 32, 16)

    gfx.fillStyle(0xffffff, 1)
    gfx.fillCircle(16, 13, 12)
    gfx.fillEllipse(16, 18, 30, 14)

    gfx.fillStyle(element.color, 0.7)
    gfx.fillCircle(16, 15, 8)
    gfx.fillEllipse(16, 19, 20, 10)

    gfx.fillStyle(0xffffff, 0.55)
    gfx.fillEllipse(11, 9, 9, 5)

    gfx.generateTexture('slime-' + key, 32, 26)
    gfx.destroy()
  }

  private makeEye() {
    const gfx = this.add.graphics()
    gfx.fillStyle(0xffffff, 1)
    gfx.fillCircle(2, 2, 2)
    gfx.generateTexture('eye', 4, 4)
    gfx.destroy()
  }

  private makeGem() {
    const gfx = this.add.graphics()
    gfx.fillStyle(0xffffff, 1)
    gfx.fillPoints(
      [
        new Phaser.Math.Vector2(6, 0),
        new Phaser.Math.Vector2(8, 5),
        new Phaser.Math.Vector2(12, 7),
        new Phaser.Math.Vector2(8, 9),
        new Phaser.Math.Vector2(6, 14),
        new Phaser.Math.Vector2(4, 9),
        new Phaser.Math.Vector2(0, 7),
        new Phaser.Math.Vector2(4, 5),
      ],
      true
    )
    gfx.generateTexture('gem', 12, 14)
    gfx.destroy()
  }
  
  private makeIcon(key: string, rows: string[]) {
    const gfx = this.add.graphics()
    gfx.fillStyle(0xffffff, 1)

    rows.forEach((row, y) => {
      for (let x = 0; x < row.length; x++) {
        if (row[x] === '#') {
          gfx.fillRect(x, y, 1, 1)
        }
      }
    })

    gfx.generateTexture(key, 16, 16)
    gfx.destroy()
  }

  private makeLock() {
    const gfx = this.add.graphics()
    gfx.fillStyle(0xffffff, 1)
    gfx.fillRect(3, 9, 14, 10)
    gfx.fillRect(5, 4, 3, 6)
    gfx.fillRect(12, 4, 3, 6)
    gfx.fillRect(5, 2, 10, 3)
    gfx.generateTexture('lock', 20, 20)
    gfx.destroy()
  }

  private makeRidge(
    key: string,
    width: number,
    height: number,
    color: number,
    waves: number[],
    amplitude: number
  ) {
    const gfx = this.add.graphics()
    const points: Phaser.Math.Vector2[] = []
    const baseY = height - 30

    for (let x = 0; x <= width; x++) {
      let offset = 0

      for (let index = 0; index < waves.length; index++) {
        offset +=
          Math.sin((x / width) * Math.PI * 2 * waves[index] + index) * (amplitude / (index + 1))
      }

      points.push(new Phaser.Math.Vector2(x, baseY + offset))
    }

    points.push(new Phaser.Math.Vector2(width, height))
    points.push(new Phaser.Math.Vector2(0, height))

    gfx.fillStyle(color, 1)
    gfx.fillPoints(points, true)
    gfx.generateTexture(key, width, height)
    gfx.destroy()
  }

  private makeBlessing() {
    const gfx = this.add.graphics()

    gfx.fillStyle(0xffe9a8, 0.35)
    gfx.fillCircle(11, 11, 11)

    gfx.fillStyle(0xffe9a8, 1)
    gfx.fillCircle(11, 11, 6)

    gfx.fillStyle(0xffffff, 1)
    gfx.fillCircle(11, 11, 3)

    gfx.generateTexture('blessing', 22, 22)
    gfx.destroy()
  }
}