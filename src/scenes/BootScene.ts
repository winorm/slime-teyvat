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

  preload() {
    this.load.audio('sfx-jump', 'sfx/jump.ogg')
    this.load.audio('sfx-land', 'sfx/land.ogg')
    this.load.audio('sfx-gem', 'sfx/gem.ogg')
    this.load.audio('sfx-interact', 'sfx/interact.ogg')
    this.load.audio('sfx-win', 'sfx/win.ogg')
    this.load.audio('sfx-die', 'sfx/die.ogg')
    this.load.audio('sfx-fly', 'sfx/fly.wav')
    this.load.audio('sfx-glide', 'sfx/glide.wav')
    this.load.audio('sfx-step', 'sfx/step.wav')
    this.load.audio('music-menu', 'bgm/menu.wav')
    this.load.audio('music-field', 'bgm/field.wav')
    this.load.audio('music-tower', 'bgm/tower.wav')
    this.load.audio('music-chase', 'bgm/chase.wav')
  }

  create() {
    this.makeTextures()
    this.scene.launch('achievement')
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
    this.makeGate()
    this.makePaper()
    this.makeSpire()
    this.makeCage()
    this.makeCageOpen()
    this.makeEgg()
    this.makeDragonling()
    this.makeWing()
  }

  private makeSpire() {
    const gfx = this.add.graphics()

    gfx.fillStyle(0x3a4a5e, 1)
    gfx.fillTriangle(24, 10, 1, 38, 47, 38)

    gfx.fillStyle(0x54697f, 1)
    gfx.fillTriangle(24, 10, 1, 38, 24, 38)

    gfx.fillStyle(0x24303f, 1)
    gfx.fillTriangle(24, 10, 24, 38, 47, 38)

    gfx.fillStyle(0x8a9bb0, 1)
    gfx.fillRect(23, 0, 2, 12)
    gfx.fillRect(19, 2, 10, 2)

    gfx.generateTexture('spire', 48, 38)
    gfx.destroy()
  }
  
  private makeCage() {
    const gfx = this.add.graphics()

    gfx.fillStyle(0x54697f, 1)
    gfx.fillRect(2, 34, 28, 6)
    gfx.fillRect(3, 6, 26, 3)

    gfx.fillStyle(0x8a9bb0, 1)
    gfx.fillRect(15, 1, 2, 5)
    gfx.fillRect(11, 0, 10, 2)
    gfx.fillRect(6, 9, 2, 25)
    gfx.fillRect(12, 9, 2, 25)
    gfx.fillRect(18, 9, 2, 25)
    gfx.fillRect(24, 9, 2, 25)

    gfx.fillStyle(0x54697f, 1)
    gfx.fillRect(4, 17, 24, 2)
    gfx.fillRect(4, 27, 24, 2)

    gfx.generateTexture('cage', 32, 40)
    gfx.destroy()
  }

  private makeCageOpen() {
    const gfx = this.add.graphics()

    // 底座、顶盖、提环和关着的那张一模一样，保证左右对称
    gfx.fillStyle(0x54697f, 1)
    gfx.fillRect(2, 34, 28, 6)
    gfx.fillRect(3, 6, 26, 3)

    gfx.fillStyle(0x8a9bb0, 1)
    gfx.fillRect(15, 1, 2, 5)
    gfx.fillRect(11, 0, 10, 2)

    // 只留左右两根立柱，中间的门开了（位置和关着那张的外栏杆对齐）
    gfx.fillRect(6, 9, 2, 25)
    gfx.fillRect(24, 9, 2, 25)

    // 横箍只留在立柱上
    gfx.fillStyle(0x54697f, 1)
    gfx.fillRect(4, 17, 8, 2)
    gfx.fillRect(20, 17, 8, 2)
    gfx.fillRect(4, 27, 8, 2)
    gfx.fillRect(20, 27, 8, 2)

    // 掀开的门朝着主角那一侧（左边）
    gfx.fillStyle(0x8a9bb0, 1)
    gfx.fillPoints(
      [
        new Phaser.Math.Vector2(6, 10),
        new Phaser.Math.Vector2(2, 13),
        new Phaser.Math.Vector2(0, 31),
        new Phaser.Math.Vector2(5, 32),
      ],
      true
    )

    gfx.generateTexture('cage-open', 32, 40)
    gfx.destroy()
  }

  private makeEgg() {
    const gfx = this.add.graphics()

    gfx.fillStyle(0xf2e6c4, 1)
    gfx.fillEllipse(7, 11, 12, 14)

    gfx.fillStyle(0xd8c49a, 1)
    gfx.fillEllipse(7, 6, 8, 6)

    gfx.fillStyle(0xc9b48a, 1)
    gfx.fillRect(4, 10, 2, 2)
    gfx.fillRect(9, 8, 2, 2)
    gfx.fillRect(6, 14, 2, 2)
    gfx.fillRect(10, 13, 1, 1)

    gfx.generateTexture('egg', 14, 18)
    gfx.destroy()
  }

  private makeDragonling() {
    const gfx = this.add.graphics()

    gfx.fillStyle(0x5aa891, 1)
    gfx.fillTriangle(11, 8, 2, 0, 13, 4)

    gfx.fillStyle(0x74d0b0, 1)
    gfx.fillEllipse(12, 10, 15, 8)
    gfx.fillEllipse(19, 7, 8, 7)
    gfx.fillRect(21, 6, 3, 3)
    gfx.fillTriangle(6, 10, 0, 6, 7, 13)

    gfx.fillStyle(0xa8e8d4, 1)
    gfx.fillTriangle(18, 2, 17, 6, 21, 4)

    gfx.fillStyle(0xd8f5ea, 1)
    gfx.fillEllipse(12, 12, 10, 3)

    gfx.fillStyle(0x1f4a3e, 1)
    gfx.fillRect(20, 6, 1, 1)

    gfx.generateTexture('dragonling', 24, 16)
    gfx.destroy()
  }

  private makeGate() {
    const gfx = this.add.graphics()

    gfx.fillStyle(0xffffff, 1)
    gfx.fillRect(0, 0, 16, 2)
    gfx.fillRect(0, 14, 16, 2)
    gfx.fillRect(0, 2, 2, 12)
    gfx.fillRect(14, 2, 2, 12)
    gfx.fillRect(4, 2, 2, 12)
    gfx.fillRect(10, 2, 2, 12)

    gfx.fillStyle(0x888888, 0.6)
    gfx.fillRect(2, 8, 12, 2)

    gfx.generateTexture('gate', 16, 16)
    gfx.destroy()
  }

  private makePaper() {
    const gfx = this.add.graphics()

    gfx.fillStyle(0xf2e6c4, 1)
    gfx.fillRect(0, 1, 14, 16)

    gfx.fillStyle(0xcbb68c, 1)
    gfx.fillRect(0, 1, 14, 1)
    gfx.fillRect(0, 16, 14, 1)
    gfx.fillRect(0, 1, 1, 16)
    gfx.fillRect(13, 1, 1, 16)

    gfx.fillStyle(0x8d7a55, 1)
    gfx.fillRect(3, 5, 8, 1)
    gfx.fillRect(3, 8, 8, 1)
    gfx.fillRect(3, 11, 6, 1)

    gfx.generateTexture('paper', 14, 18)
    gfx.destroy()
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
