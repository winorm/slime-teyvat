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
  '.......##.......',
  '......###.......',
  '.....####.......',
  '....#####.......',
  '...######.......',
  '..######.#......',
  '..#####.##......',
  '..####.##.......',
  '...##.##........',
  '....###.........',
  '.....#..........',
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

    statueGfx.fillRect(2, 82, 44, 10)
    statueGfx.fillRect(7, 76, 34, 6)
    statueGfx.fillRect(18, 42, 12, 34)

    statueGfx.fillRoundedRect(14, 26, 20, 18, 6)
    statueGfx.fillCircle(24, 19, 8)

    statueGfx.fillTriangle(15, 32, 1, 20, 15, 15)
    statueGfx.fillTriangle(33, 32, 47, 20, 33, 15)

    statueGfx.generateTexture('statue', 48, 92)
    statueGfx.destroy()

    const chestGfx = this.add.graphics()
    chestGfx.fillStyle(0xc79a3a, 1)
    chestGfx.fillRect(2, 15, 28, 11)
    chestGfx.fillRoundedRect(1, 5, 30, 10, 4)
    chestGfx.fillStyle(0x6b4a1a, 1)
    chestGfx.fillRect(2, 15, 28, 2)
    chestGfx.fillStyle(0x4a3413, 1)
    chestGfx.fillRoundedRect(13, 12, 6, 9, 2)
    chestGfx.generateTexture('chest', 32, 28)
    chestGfx.destroy()

    const chestOpenGfx = this.add.graphics()
    chestOpenGfx.fillStyle(0xc79a3a, 1)
    chestOpenGfx.fillRect(2, 16, 28, 10)
    chestOpenGfx.fillRoundedRect(1, 2, 30, 9, 4)
    chestOpenGfx.fillStyle(0x2a1f0a, 1)
    chestOpenGfx.fillRect(4, 13, 24, 5)
    chestOpenGfx.generateTexture('chest-open', 32, 28)
    chestOpenGfx.destroy()

    this.makeIcon('icon-none', ICON_NONE)
    this.makeIcon('icon-wind', ICON_WIND)

    this.makeRidge('bg-far', 480, 105, 0x2b2b46, [3, 7], 18)
    this.makeRidge('bg-mid', 480, 80, 0x222236, [2, 5], 14)

    this.makeBlessing()

    this.makeMonument()

    this.makeWing()
  }

  private makeWing() {
    const gfx = this.add.graphics()

    gfx.fillStyle(0xffffff, 1)
    gfx.fillEllipse(5, 8, 11, 15)
    gfx.fillEllipse(9, 7, 11, 11)
    gfx.fillEllipse(13, 6, 8, 7)
    gfx.fillEllipse(16, 5, 5, 4)

    gfx.fillStyle(0x555555, 0.4)
    gfx.fillEllipse(7, 12, 10, 6)
    gfx.fillEllipse(12, 10, 7, 4)

    gfx.generateTexture('wing', 18, 16)
    gfx.destroy()
  }
  
  private makeMonument() {
    const gfx = this.add.graphics()

    gfx.fillStyle(0xffffff, 1)

    gfx.fillRect(4, 13, 20, 24)
    gfx.fillTriangle(4, 37, 24, 37, 28, 44)
    gfx.fillTriangle(4, 37, 28, 44, 0, 44)
    gfx.fillRect(10, 0, 8, 13)
    gfx.fillTriangle(10, 2, 1, 8, 10, 12)
    gfx.fillTriangle(18, 2, 27, 8, 18, 12)

    gfx.fillStyle(0x666666, 0.45)
    gfx.fillRect(17, 13, 7, 24)

    gfx.fillStyle(0x666666, 0.35)
    gfx.fillTriangle(18, 2, 27, 8, 18, 12)

    gfx.fillStyle(0x555555, 0.5)
    gfx.fillRect(4, 20, 20, 2)
    gfx.fillRect(4, 30, 20, 2)

    gfx.generateTexture('monument', 28, 44)
    gfx.destroy()
  }

  private makeSlime(key: ElementKey) {
    const element = ELEMENTS[key]
    const gfx = this.add.graphics()

    gfx.fillStyle(0x14141f, 1)
    gfx.fillEllipse(16, 15, 32, 25)

    gfx.fillStyle(0xffffff, 1)
    gfx.fillEllipse(16, 15, 30, 23)

    const layers = [
      { w: 28, h: 21, alpha: 0.35 },
      { w: 25, h: 18, alpha: 0.5 },
      { w: 21, h: 15, alpha: 0.6 },
      { w: 17, h: 12, alpha: 0.7 },
      { w: 13, h: 9, alpha: 0.8 },
      { w: 8, h: 6, alpha: 0.9 },
    ]

    layers.forEach((layer) => {
      gfx.fillStyle(element.color, layer.alpha)
      gfx.fillEllipse(16, 15, layer.w, layer.h)
    })

    gfx.fillStyle(0xffffff, 0.5)
    gfx.fillEllipse(11, 8, 9, 5)

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