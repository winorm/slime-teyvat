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

// 岩：石核，中间的空隙是一道倾斜的有棱角的 S
const ICON_ROCK = [
  '................',
  '................',
  '................',
  '.....######.....',
  '....####.###....',
  '...####.#####...',
  '...###.###.##...',
  '...##.##.#.##...',
  '...##.#..#.##...',
  '...##.#.##.##...',
  '...##.###.###...',
  '...#####.####...',
  '....###.####....',
  '.....######.....',
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

    this.makeArmoredSlime()

    this.makeRockCrown()

    this.makeEyeGlow()

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

    // 右侧压暗一层做出体积。用灰色叠加，染色时会被乘暗，不会破坏元素色
    statueGfx.fillStyle(0x6a6a6a, 0.45)
    statueGfx.fillRect(24, 42, 6, 34)
    statueGfx.fillRect(24, 26, 10, 18)
    statueGfx.fillCircle(30, 20, 5)
    statueGfx.fillTriangle(33, 16, 47, 20, 33, 31)
    statueGfx.fillRect(24, 76, 10, 6)

    statueGfx.fillStyle(0x6a6a6a, 0.25)
    statueGfx.fillRect(2, 82, 44, 3)

    statueGfx.generateTexture('statue', 48, 92)
    statueGfx.destroy()

    const chestGfx = this.add.graphics()
    chestGfx.fillStyle(0xc79a3a, 1)
    chestGfx.fillRect(2, 17, 28, 11)
    chestGfx.fillRoundedRect(1, 7, 30, 10, 4)
    chestGfx.fillStyle(0x6b4a1a, 1)
    chestGfx.fillRect(2, 17, 28, 2)
    chestGfx.fillStyle(0x4a3413, 1)
    chestGfx.fillRoundedRect(13, 14, 6, 9, 2)
    chestGfx.generateTexture('chest', 32, 28)
    chestGfx.destroy()

    const chestOpenGfx = this.add.graphics()
    chestOpenGfx.fillStyle(0xc79a3a, 1)
    chestOpenGfx.fillRect(2, 18, 28, 10)
    chestOpenGfx.fillRoundedRect(1, 4, 30, 9, 4)
    chestOpenGfx.fillStyle(0x2a1f0a, 1)
    chestOpenGfx.fillRect(4, 15, 24, 5)
    chestOpenGfx.generateTexture('chest-open', 32, 28)
    chestOpenGfx.destroy()

    this.makeIcon('icon-none', ICON_NONE)
    this.makeIcon('icon-wind', ICON_WIND)
    this.makeIcon('icon-rock', ICON_ROCK)

    this.makeGear()

    this.makeBackgrounds()
    this.makeWindmill()
    this.makeWindmillBlades()
    this.makeHazardSpark()

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

    if (key === 'rock') {
      // 四个取色点：正上=岩脊色，正中=身体黄，正下两侧=白。
      // 逐行铺满椭圆，横向宽度按椭圆公式收，所以四周不会再有单独的白边
      for (let y = 3; y <= 27; y++) {
        const t = (15 - y) / 11.5
        const color =
          t >= 0
            ? this.mixColor(element.color, 0x8a6a2c, Math.min(1, t))
            : this.mixColor(element.color, 0xffffff, Math.min(1, -t))
        const half = 15 * Math.sqrt(Math.max(0, 1 - t * t))

        gfx.fillStyle(color, 1)
        gfx.fillRect(16 - half, y, half * 2, 1)
      }

      // 头顶挂一层泥沼：几摊深浅不一的泥，带两滴往下淌的泥浆，普通态头部也不至于空着
      gfx.fillStyle(0x6b5734, 1)
      gfx.fillEllipse(12, 9.5, 9, 6)

      gfx.fillStyle(0x5c6238, 1)
      gfx.fillEllipse(21, 8, 8, 5)

      gfx.fillStyle(0x54452a, 1)
      gfx.fillEllipse(16.5, 11, 6, 4)
      gfx.fillRect(9, 12, 1, 3)
      gfx.fillRect(22, 10, 1, 2)

      gfx.fillStyle(0x7d6640, 1)
      gfx.fillRect(9, 7, 2, 1)
      gfx.fillRect(22, 10, 2, 1)
      gfx.fillRect(14, 6, 1, 1)
    } else {
      layers.forEach((layer) => {
        gfx.fillStyle(element.color, layer.alpha)
        gfx.fillEllipse(16, 15, layer.w, layer.h)
      })

      gfx.fillStyle(0xffffff, 0.5)
      gfx.fillEllipse(11, 8, 9, 5)
    }

    gfx.generateTexture('slime-' + key, 32, 26)
    gfx.destroy()
  }

  // 岩化态：身体还是圆滚滚的，只是圈外有点硬边，头部换成一整块厚、深、不规则的岩石
  private makeArmoredSlime() {
    const gfx = this.add.graphics()

    gfx.fillStyle(0x14141f, 1)
    gfx.fillEllipse(16, 15, 32, 25)

    gfx.fillStyle(0xffffff, 1)
    gfx.fillEllipse(16, 15, 30, 23)

    // 岩化态同样四个取色点，只是正上方换成岩化岩脊的深色、中心换成压暗的岩色
    for (let y = 3; y <= 27; y++) {
      const t = (15 - y) / 11.5
      const color =
        t >= 0
          ? this.mixColor(0xa8823a, 0x5c4d33, Math.min(1, t))
          : this.mixColor(0xa8823a, 0xffffff, Math.min(1, -t))
      const half = 15 * Math.sqrt(Math.max(0, 1 - t * t))

      gfx.fillStyle(color, 1)
      gfx.fillRect(16 - half, y, half * 2, 1)
    }

    // 圈外的一点"变硬"感：几片贴在轮廓外的小石片（体型放大后也跟着加厚一圈）
    gfx.fillStyle(0x8a7f6a, 1)
    gfx.fillTriangle(1, 10, 0, 18, 6, 15)
    gfx.fillTriangle(31, 9, 32, 17, 26, 14)
    gfx.fillTriangle(3, 21, 9, 24, 5, 24)
    gfx.fillTriangle(23, 20, 29, 23, 25, 24)
    gfx.fillTriangle(8, 25, 13, 26, 11, 22)
    gfx.fillTriangle(19, 24, 24, 26, 22, 22)

    // 头顶那一圈厚岩壳（岩柱单独一张贴图，见 makeRockCrown）。岩化体型放大后要更厚，
    // 不然放大一圈会显得头顶那层壳太薄、压不住身体
    gfx.fillStyle(0x4a3f2c, 1)
    gfx.fillPoints(
      [
        new Phaser.Math.Vector2(1, 12),
        new Phaser.Math.Vector2(3, 4),
        new Phaser.Math.Vector2(10, 1),
        new Phaser.Math.Vector2(16, 4),
        new Phaser.Math.Vector2(22, 1),
        new Phaser.Math.Vector2(29, 4),
        new Phaser.Math.Vector2(31, 12),
        new Phaser.Math.Vector2(25, 15),
        new Phaser.Math.Vector2(16, 10),
        new Phaser.Math.Vector2(7, 15),
      ],
      true
    )

    gfx.generateTexture('slime-rock-armored', 32, 26)
    gfx.destroy()
  }

  // 眼睛底下的一圈白晕：让眼睛在深色身体上也能看清
  private makeEyeGlow() {
    const gfx = this.add.graphics()

    gfx.fillStyle(0xffffff, 0.32)
    gfx.fillCircle(4, 4, 4)
    gfx.fillStyle(0xffffff, 0.5)
    gfx.fillCircle(4, 4, 2.5)

    gfx.generateTexture('eye-glow', 8, 8)
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

    // 底色略微压暗，给高光留出空间
    gfx.fillStyle(0xd2d2d2, 1)
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

    // 左上亮面
    gfx.fillStyle(0xffffff, 1)
    gfx.fillPoints(
      [
        new Phaser.Math.Vector2(6, 0),
        new Phaser.Math.Vector2(8, 5),
        new Phaser.Math.Vector2(6, 7),
        new Phaser.Math.Vector2(4, 5),
      ],
      true
    )

    // 右下暗面，做出棱面
    gfx.fillStyle(0x8f8f8f, 1)
    gfx.fillPoints(
      [
        new Phaser.Math.Vector2(6, 0),
        new Phaser.Math.Vector2(12, 7),
        new Phaser.Math.Vector2(6, 14),
        new Phaser.Math.Vector2(6, 7),
      ],
      true
    )

    // 中间一点高光
    gfx.fillStyle(0xffffff, 1)
    gfx.fillRect(5, 4, 2, 2)

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

  // 头顶那条连着三个峰的岩脊：中间最高，两边各一峰，用鞍部连成一体。
  // 单独一张贴图，所以能长得比身体高很多（挂在 slime-rock 系列之上）
  private makeRockCrown() {
    // 身体顶部的轮廓：slime-rock 本体的椭圆半径 15x11.5，圆心在贴图里的位置随贴图高度变
    // （普通态岩脊贴图 32x30，圆心落在 (16, 25)；岩化态贴图更高，圆心落在 (16, 31)）
    const bodyTop = (x: number, centerY: number, drop: number) => {
      const offset = Math.min(1, Math.abs(x - 16) / 15)

      return centerY - 11.5 * Math.sqrt(Math.max(0, 1 - offset * offset)) + drop
    }

    // 岩脊的形状：底座沿着上面那条身体轮廓走，所以两条曲线一定接得上
    const ridgeAt =
      (centerY: number) =>
      (
        gfx: Phaser.GameObjects.Graphics,
        from: number,
        to: number,
        peaks: Array<[number, number]>,
        saddle: number,
        drop: number
      ) => {
        const points: Phaser.Math.Vector2[] = []
        const steps = 10

        for (let index = 0; index <= steps; index++) {
          const x = from + ((to - from) * index) / steps

          points.push(new Phaser.Math.Vector2(x, bodyTop(x, centerY, drop)))
        }

        for (let index = peaks.length - 1; index >= 0; index--) {
          const [x, y] = peaks[index]

          points.push(new Phaser.Math.Vector2(x + 3, y + saddle))
          points.push(new Phaser.Math.Vector2(x, y))
          points.push(new Phaser.Math.Vector2(x - 3, y + saddle))
        }

        gfx.fillPoints(points, true)
      }

    const ridge = ridgeAt(25)

    // 普通态：亮金岩脊
    const gfx = this.add.graphics()
    const peaks: Array<[number, number]> = [
      [2, 9],
      [16, 0],
      [30, 9],
    ]

    for (let step = 0; step < 6; step++) {
      const t = step / 5
      const inset = step * 0.9

      gfx.fillStyle(this.mixColor(0x8a6a2c, 0x33291a, t), 1)
      ridge(
        gfx,
        1 + inset,
        31 - inset,
        peaks.map(([x, y]) => [x, y + step * 0.9]),
        5,
        0.5 + step * 0.9
      )
    }

    gfx.fillStyle(0xa8894a, 1)
    gfx.fillPoints(
      [
        new Phaser.Math.Vector2(16, 1),
        new Phaser.Math.Vector2(20, 8),
        new Phaser.Math.Vector2(14, 12),
      ],
      true
    )

    // 与身体重叠的那一段：直接抄史莱姆本体那套同心椭圆渐变（同样的大小、透明度），
    // 圆心对准身体的中心（在这个贴图里是 (16, 25)），于是重叠区看着就是身体本身
    const bodyLayers = [
      { w: 28, h: 21, alpha: 0.35 },
      { w: 25, h: 18, alpha: 0.5 },
      { w: 21, h: 15, alpha: 0.6 },
      { w: 17, h: 12, alpha: 0.7 },
      { w: 13, h: 9, alpha: 0.8 },
      { w: 8, h: 6, alpha: 0.9 },
    ]

    gfx.fillStyle(0xffffff, 1)
    gfx.fillEllipse(16, 25, 30, 23)

    bodyLayers.forEach((layer) => {
      gfx.fillStyle(0xd9a441, layer.alpha)
      gfx.fillEllipse(16, 25, layer.w, layer.h)
    })

    gfx.generateTexture('rock-crown', 32, 30)
    gfx.destroy()

    // 岩化态：贴图更高（32x36），所以岩脊能长得更高大，也更厚、更暗、峰高错落，像一整块不规则的岩石
    const armorCenterY = 31
    const armor = this.add.graphics()
    const armorPeaks: Array<[number, number]> = [
      [3, 18],
      [16, 1],
      [29, 13],
    ]
    const armorRidge = ridgeAt(armorCenterY)

    for (let step = 0; step < 6; step++) {
      const t = step / 5
      const inset = step * 1.2

      armor.fillStyle(this.mixColor(0x5c4d33, 0x2a2316, t), 1)
      armorRidge(
        armor,
        1 + inset,
        31 - inset,
        armorPeaks.map(([x, y]) => [x, y + step * 1.2]),
        7,
        0.5 + step * 1.2
      )
    }

    // 岩化态也要同样的过渡：白色底 + 六层同心椭圆，但用岩化身体那一档的暗岩色。
    // 最外层椭圆 30x23 就是史莱姆真实轮廓的大小，所以渐变下缘贴着身体走
    armor.fillStyle(0xffffff, 1)
    armor.fillEllipse(16, armorCenterY, 30, 23)

    ;[
      { w: 28, h: 21, alpha: 0.35 },
      { w: 25, h: 18, alpha: 0.5 },
      { w: 21, h: 15, alpha: 0.6 },
      { w: 17, h: 12, alpha: 0.7 },
      { w: 13, h: 9, alpha: 0.8 },
      { w: 8, h: 6, alpha: 0.9 },
    ].forEach((layer) => {
      armor.fillStyle(0xa8823a, layer.alpha)
      armor.fillEllipse(16, armorCenterY, layer.w, layer.h)
    })

    armor.generateTexture('rock-crown-armored', 32, 36)
    armor.destroy()
  }

  // 左上角的设置齿轮：八颗齿 + 本体 + 一个压暗的轮毂（染色后像挖了个孔）
  private makeGear() {
    const gfx = this.add.graphics()
    const center = 9

    gfx.fillStyle(0xffffff, 1)

    for (let index = 0; index < 8; index++) {
      const angle = (index / 8) * Math.PI * 2

      gfx.fillCircle(center + Math.cos(angle) * 6.5, center + Math.sin(angle) * 6.5, 2.2)
    }

    gfx.fillCircle(center, center, 6)

    gfx.fillStyle(0x5a5a5a, 1)
    gfx.fillCircle(center, center, 2.4)

    gfx.generateTexture('gear', 18, 18)
    gfx.destroy()
  }

  // 混色：t=0 返回 from，t=1 返回 to
  private mixColor(from: number, to: number, t: number) {
    const r = ((from >> 16) & 0xff) + (((to >> 16) & 0xff) - ((from >> 16) & 0xff)) * t
    const g = ((from >> 8) & 0xff) + (((to >> 8) & 0xff) - ((from >> 8) & 0xff)) * t
    const b = (from & 0xff) + ((to & 0xff) - (from & 0xff)) * t

    return (Math.round(r) << 16) + (Math.round(g) << 8) + Math.round(b)
  }

  // 竖直渐变，一行一行画
  private paintGradient(
    gfx: Phaser.GameObjects.Graphics,
    width: number,
    height: number,
    top: number,
    bottom: number
  ) {
    for (let y = 0; y < height; y++) {
      gfx.fillStyle(this.mixColor(top, bottom, y / (height - 1)), 1)
      gfx.fillRect(0, y, width, 1)
    }
  }

  // 波浪地形：按正弦起伏，线以下填满。波数取整数，所以左右边缘能无缝对接
  private drawRidge(
    gfx: Phaser.GameObjects.Graphics,
    width: number,
    height: number,
    color: number,
    waves: number[],
    amplitude: number,
    baseY: number,
    alpha = 1
  ) {
    const points: Phaser.Math.Vector2[] = []

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

    gfx.fillStyle(color, alpha)
    gfx.fillPoints(points, true)
  }

  // 危险物上那道光：竖直的折线，靠 tileSprite 铺满任意高度
  private makeHazardSpark() {
    const gfx = this.add.graphics()

    gfx.fillStyle(0xffffff, 1)
    gfx.fillRect(4, 0, 2, 5)
    gfx.fillRect(2, 5, 2, 4)
    gfx.fillRect(6, 5, 2, 4)
    gfx.fillRect(4, 9, 2, 7)

    gfx.generateTexture('hazard-spark', 10, 16)
    gfx.destroy()
  }

  // 风车塔身：上窄下宽的圆台，右侧一格深色做出体积
  private makeWindmill() {
    const gfx = this.add.graphics()

    gfx.fillStyle(0x6b7c8c, 1)
    gfx.fillPoints(
      [
        new Phaser.Math.Vector2(2, 64),
        new Phaser.Math.Vector2(46, 64),
        new Phaser.Math.Vector2(37, 18),
        new Phaser.Math.Vector2(11, 18),
      ],
      true
    )

    gfx.fillStyle(0x596a79, 1)
    gfx.fillPoints(
      [
        new Phaser.Math.Vector2(24, 18),
        new Phaser.Math.Vector2(37, 18),
        new Phaser.Math.Vector2(46, 64),
        new Phaser.Math.Vector2(24, 64),
      ],
      true
    )

    gfx.fillStyle(0x7d8f9f, 1)
    gfx.fillRect(9, 13, 30, 5)
    gfx.fillTriangle(24, 3, 11, 14, 37, 14)

    gfx.fillStyle(0x3d4a56, 1)
    gfx.fillRect(19, 46, 10, 18)
    gfx.fillRect(21, 26, 6, 8)

    gfx.generateTexture('windmill', 48, 64)
    gfx.destroy()
  }

  // 风车扇叶：四片窄边朝着中心的长矩形，整体一起旋转就是风车在转
  private makeWindmillBlades() {
    const gfx = this.add.graphics()
    const center = 46

    gfx.fillStyle(0x8a9bb0, 1)
    gfx.fillRect(center - 5, center - 42, 10, 42)
    gfx.fillRect(center, center - 5, 42, 10)
    gfx.fillRect(center - 5, center, 10, 42)
    gfx.fillRect(center - 42, center - 5, 42, 10)

    gfx.fillStyle(0x6b7c8c, 1)
    gfx.fillCircle(center, center, 7)

    gfx.fillStyle(0xd9e4ee, 1)
    gfx.fillCircle(center, center, 3)

    gfx.generateTexture('windmill-blades', 92, 92)
    gfx.destroy()
  }

  // 五关各一套背景，每套两层：bg-<主题>-far（远）和 bg-<主题>-mid（近）
  private makeBackgrounds() {
    this.makeBeachBackground()
    this.makeFieldBackground()
    this.makeChurchBackground()
    this.makeSkyBackground()
    this.makeTowerBackground()
  }

  // 第一关·沙滩：天上一个太阳，远处海面，近处沙丘
  private makeBeachBackground() {
    const far = this.add.graphics()

    this.paintGradient(far, 480, 270, 0xa6e0f5, 0xe8f7fb)
    far.fillStyle(0xfff0b8, 0.95)
    far.fillCircle(372, 66, 20)

    far.fillStyle(0x5fb3d4, 1)
    far.fillRect(0, 172, 480, 98)
    far.fillStyle(0x9fe0f0, 1)
    far.fillRect(0, 172, 480, 3)

    far.fillStyle(0xffffff, 0.45)
    for (let index = 0; index < 12; index++) {
      far.fillRect(index * 40 + 8, 188 + (index % 3) * 14, 20, 2)
    }

    far.generateTexture('bg-beach-far', 480, 270)
    far.destroy()

    const mid = this.add.graphics()

    this.drawRidge(mid, 480, 270, 0xefdcae, [1, 3], 8, 228)
    mid.fillStyle(0xd9c188, 1)
    mid.fillRect(70, 248, 26, 3)
    mid.fillRect(306, 242, 34, 3)
    mid.fillStyle(0xfaf0d6, 1)
    mid.fillCircle(140, 244, 3)
    mid.fillCircle(392, 236, 3)

    mid.generateTexture('bg-beach-mid', 480, 270)
    mid.destroy()
  }

  // 第二关·蒙德郊外：云、太阳、两层草坡、风车剪影
  private makeFieldBackground() {
    const far = this.add.graphics()

    this.paintGradient(far, 480, 270, 0x9ed7f2, 0xe6f4e6)
    far.fillStyle(0xfff3c4, 0.95)
    far.fillCircle(96, 60, 18)

    far.fillStyle(0xffffff, 0.8)
    far.fillEllipse(238, 70, 92, 26)
    far.fillEllipse(282, 62, 58, 20)
    far.fillEllipse(408, 96, 72, 20)

    far.generateTexture('bg-field-far', 480, 270)
    far.destroy()

    const mid = this.add.graphics()

    this.drawRidge(mid, 480, 270, 0x9ed3a0, [1, 3], 12, 214)
    this.drawRidge(mid, 480, 270, 0x84bd88, [2, 5], 8, 240)

    mid.generateTexture('bg-field-mid', 480, 270)
    mid.destroy()
  }

  // 第三关·教堂内部：石墙、三扇彩色玻璃拱窗，近处是长椅和石柱
  private makeChurchBackground() {
    const far = this.add.graphics()

    this.paintGradient(far, 480, 270, 0x4a4f63, 0x22262f)

    const panes = [0xc75a5a, 0x5a7fc7, 0xe0b45a, 0x6f9e6a]

    for (let index = 0; index < 3; index++) {
      const x = 80 + index * 160

      far.fillStyle(0x1b1f28, 1)
      far.fillRect(x - 26, 46, 52, 92)
      far.fillCircle(x, 46, 26)

      for (let row = 0; row < 4; row++) {
        for (let col = 0; col < 3; col++) {
          far.fillStyle(panes[(row + col + index) % panes.length], 0.85)
          far.fillRect(x - 18 + col * 13, 58 + row * 20, 11, 18)
        }
      }

      far.fillStyle(0x2a2f3b, 0.9)
      far.fillRect(x - 26, 88, 52, 3)
      far.fillRect(x - 2, 46, 4, 92)
    }

    far.fillStyle(0x1b1f28, 0.6)
    far.fillRect(0, 0, 480, 22)

    far.generateTexture('bg-church-far', 480, 270)
    far.destroy()

    const mid = this.add.graphics()

    this.drawRidge(mid, 480, 270, 0x2b3040, [1, 3], 6, 236)

    // 一排长椅剪影
    mid.fillStyle(0x1f2430, 1)
    for (let index = 0; index < 4; index++) {
      const x = 34 + index * 120

      mid.fillRect(x, 246, 74, 6)
      mid.fillRect(x + 4, 252, 6, 18)
      mid.fillRect(x + 64, 252, 6, 18)
      mid.fillRect(x, 228, 6, 24)
    }

    mid.generateTexture('bg-church-mid', 480, 270)
    mid.destroy()
  }

  // 第四关·教堂外的高空：天和海一样的云海，远处立着教堂尖顶
  private makeSkyBackground() {
    const far = this.add.graphics()

    this.paintGradient(far, 480, 270, 0x3f6fb5, 0xbcd9f0)

    far.fillStyle(0xffffff, 0.32)
    far.fillEllipse(120, 206, 220, 40)
    far.fillEllipse(360, 234, 260, 46)
    far.fillEllipse(250, 184, 160, 30)

    const spire = (x: number, top: number, width: number, alpha: number) => {
      far.fillStyle(0x6a7c9c, alpha)
      far.fillRect(x - width / 2, top, width, 120)
      far.fillTriangle(x, top - 34, x - width / 2, top, x + width / 2, top)
    }

    spire(96, 118, 30, 0.55)
    spire(384, 140, 24, 0.45)

    far.generateTexture('bg-sky-far', 480, 270)
    far.destroy()

    const mid = this.add.graphics()

    mid.fillStyle(0xffffff, 0.5)
    mid.fillEllipse(80, 250, 300, 54)
    mid.fillEllipse(400, 258, 300, 50)

    // 近处那一座尖塔
    mid.fillStyle(0x54688c, 0.8)
    mid.fillRect(206, 176, 20, 94)
    mid.fillTriangle(216, 138, 197, 178, 235, 178)
    mid.fillRect(210, 150, 12, 12)

    mid.generateTexture('bg-sky-mid', 480, 270)
    mid.destroy()
  }

  // 第五关·塔内：整座塔一张 480x1600 的贴图（和世界坐标一一对应），
  // 砖墙破败，五层各有一扇不一样的窗
  private makeTowerBackground() {
    const far = this.add.graphics()

    far.fillStyle(0x232a3d, 1)
    far.fillRect(0, 0, 480, 1600)

    for (let row = 0; row < 133; row++) {
      const y = row * 12
      const offset = row % 2 === 0 ? 0 : 12

      for (let col = -1; col < 21; col++) {
        if ((row * 7 + col * 5) % 23 === 0) {
          continue
        }

        const x = col * 24 + offset

        far.fillStyle((row + col) % 3 === 0 ? 0x2c3448 : 0x28303f, 1)
        far.fillRect(x + 1, y + 1, 22, 10)
      }
    }

    // 塔尖这一截人已经爬出来了：上面是天空，下面是参差不齐的残墙头
    far.fillStyle(0x5f9bd0, 1)
    far.fillRect(0, 0, 480, 60)
    far.fillStyle(0x86bcdf, 1)
    far.fillRect(0, 60, 480, 44)

    const skyPoints: Phaser.Math.Vector2[] = [
      new Phaser.Math.Vector2(0, 104),
      new Phaser.Math.Vector2(480, 104),
    ]

    for (let index = 23; index >= 0; index--) {
      const x = index * 20
      const height = 104 + ((index * 7) % 5) * 11

      skyPoints.push(new Phaser.Math.Vector2(x + 20, height))
      skyPoints.push(new Phaser.Math.Vector2(x, height))
    }

    far.fillStyle(0xb9dcf1, 1)
    far.fillPoints(skyPoints, true)

    far.fillStyle(0xffffff, 0.5)
    far.fillEllipse(120, 52, 170, 26)
    far.fillEllipse(352, 78, 200, 30)

    const arch = (x: number, top: number, width: number, height: number, warm: number) => {
      const half = width / 2

      far.fillStyle(0x141926, 1)
      far.fillRect(x - half - 4, top, width + 8, height + 4)
      far.fillCircle(x, top, half + 4)

      far.fillStyle(0x39465f, 1)
      far.fillRect(x - half, top + 4, width, height)
      far.fillCircle(x, top + 4, half)

      far.fillStyle(0xffd98a, warm)
      far.fillRect(x - half + 4, top + 10, width - 8, height - 8)
      far.fillCircle(x, top + 10, half - 4)
    }

    const round = (x: number, cy: number, radius: number) => {
      far.fillStyle(0x141926, 1)
      far.fillCircle(x, cy, radius + 5)

      far.fillStyle(0x39465f, 1)
      far.fillCircle(x, cy, radius)

      far.fillStyle(0xffd98a, 0.16)
      far.fillCircle(x, cy, radius - 4)

      far.fillStyle(0x2a3446, 1)
      for (let index = 0; index < 6; index++) {
        const angle = (index / 6) * Math.PI * 2

        far.fillTriangle(
          x,
          cy,
          x + Math.cos(angle) * (radius - 4),
          cy + Math.sin(angle) * (radius - 4),
          x + Math.cos(angle + 0.5) * (radius - 10),
          cy + Math.sin(angle + 0.5) * (radius - 10)
        )
      }
    }

    // 一层：一扇宽拱窗
    arch(130, 1320, 66, 118, 0.16)
    // 二层：左右两扇窄拱窗
    arch(150, 1024, 34, 92, 0.13)
    arch(330, 1024, 34, 92, 0.13)
    // 三层：一扇圆花窗
    round(240, 720, 44)
    // 四层：一条细长的箭窗
    arch(372, 356, 22, 142, 0.12)
    // 五层（塔顶）：一扇大拱窗（往下挪，别被天空吃掉）
    arch(240, 186, 88, 124, 0.18)

    // 墙上的裂缝
    far.fillStyle(0x1b2130, 1)
    far.fillTriangle(108, 1600, 128, 1600, 116, 1500)
    far.fillTriangle(112, 1500, 124, 1500, 120, 1428)
    far.fillTriangle(296, 1180, 316, 1180, 304, 1096)
    far.fillTriangle(176, 700, 196, 700, 186, 618)

    // 墙角的苔藓
    far.fillStyle(0x3c5a4a, 0.45)
    far.fillEllipse(70, 1580, 90, 34)
    far.fillEllipse(410, 960, 110, 40)
    far.fillEllipse(60, 420, 80, 30)

    far.generateTexture('bg-tower-far', 480, 1600)
    far.destroy()

    const mid = this.add.graphics()

    // 塌下来的断梁和碎石
    mid.fillStyle(0x3b3242, 1)
    mid.fillRect(18, 1500, 130, 12)
    mid.fillRect(346, 1180, 12, 76)
    mid.fillRect(120, 640, 150, 10)

    mid.fillStyle(0xd9c79a, 0.14)
    for (let index = 0; index < 60; index++) {
      const x = (index * 37 + 11) % 480
      const y = (index * 53 + 23) % 1600

      mid.fillRect(x, y, 2, 2)
    }

    mid.generateTexture('bg-tower-mid', 480, 1600)
    mid.destroy()
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
