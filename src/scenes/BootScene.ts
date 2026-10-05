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

    this.makeArmorPlate()

    this.makeRockPillar()

    this.makePlate()

    this.makeSpikeLauncher()
    this.makeRockSpike()

    this.makeTouchArrow()
    this.makeTouchJump()
    this.makeTouchPillar()
    this.makeTouchArmor()

    this.makeEyeGlow()

    this.makeEye()
    this.makeRockEye()
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
    
    this.makeStatueBase()
    this.makeStatueWind()
    this.makeStatueRock()

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
    this.makeInn()
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
  
  // 元素方碑拆成两半：
  // `monument` 是碑身和底座，烤成砖瓦色 + 深浅杂点，不参与元素染色；
  // `monument-head` 是上面带元素标记的那一段，画成白色，点亮时用元素色染它。
  // 两张贴图都是 28x44、贴图坐标一一对应，所以直接摆同一个坐标就对齐
  private makeMonument() {
    const gfx = this.add.graphics()
    const outline = 0x14141f

    // 本体的三块形状（碑身 + 两级台阶），dx/dy 是偏移量
    const body = (dx: number, dy: number) => {
      gfx.fillRect(4 + dx, 13 + dy, 20, 24)
      gfx.fillTriangle(4 + dx, 37 + dy, 24 + dx, 37 + dy, 28 + dx, 44 + dy)
      gfx.fillTriangle(4 + dx, 37 + dy, 28 + dx, 44 + dy, dx, 44 + dy)
    }

    // 轮廓：把本体朝八个方向各铺一遍，中间再盖回本色，就得到一圈 1 像素黑边
    gfx.fillStyle(outline, 1)

    ;[-1, 0, 1].forEach((dx) => {
      ;[-1, 0, 1].forEach((dy) => {
        if (dx !== 0 || dy !== 0) {
          body(dx, dy)
        }
      })
    })

    // 碑身：石砖灰（取塔里砖瓦 0x39405a 调亮一档，比冷蓝更偏石头）
    gfx.fillStyle(0x4e5878, 1)
    gfx.fillRect(4, 13, 20, 24)

    // 左边一整条受光面：用明暗分面做体积，不画竖缝（竖缝就成砖墙了）
    gfx.fillStyle(0x5c688c, 1)
    gfx.fillRect(4, 13, 5, 24)

    // 右侧压暗
    gfx.fillStyle(0x333b52, 0.45)
    gfx.fillRect(17, 13, 7, 24)

    // 底座两级台阶，压深一档，台面留一条亮边当石棱
    gfx.fillStyle(0x424a66, 1)
    gfx.fillTriangle(4, 37, 24, 37, 28, 44)
    gfx.fillTriangle(4, 37, 28, 44, 0, 44)
    gfx.fillStyle(0x555f80, 1)
    gfx.fillRect(4, 36, 20, 1)

    // 石头的感觉：几道带错位的裂纹（走向不规则，所以不像砖缝）+ 边角崩口
    gfx.fillStyle(0x2f3648, 0.85)
    gfx.fillRect(6, 19, 5, 1)
    gfx.fillRect(10, 20, 4, 1)
    gfx.fillRect(13, 19, 4, 1)
    gfx.fillRect(7, 27, 4, 1)
    gfx.fillRect(11, 28, 6, 1)
    gfx.fillRect(19, 24, 3, 1)

    gfx.fillRect(4, 15, 1, 2)
    gfx.fillRect(4, 25, 2, 1)
    gfx.fillRect(23, 18, 1, 2)
    gfx.fillRect(22, 30, 2, 1)

    // 杂质质感：深浅不一的小点，让砖面不是一块死板色
    const specks: Array<[number, number, number]> = [
      [6, 16, 0x646e8e],
      [20, 15, 0x3b4358],
      [12, 24, 0x545e80],
      [22, 27, 0x3b4358],
      [8, 33, 0x646e8e],
      [15, 34, 0x545e80],
      [5, 26, 0x3b4358],
      [23, 19, 0x646e8e],
      [10, 18, 0x3b4358],
      [19, 32, 0x545e80],
    ]

    specks.forEach(([x, y, color]) => {
      gfx.fillStyle(color, 1)
      gfx.fillRect(x, y, 1, 1)
    })

    gfx.generateTexture('monument', 28, 44)
    gfx.destroy()

    // 碑头：白的，点亮时整段染成元素色，元素标记本身保持白色当发光刻印
    const head = this.add.graphics()

    const headShape = (dx: number, dy: number) => {
      head.fillRect(10 + dx, dy, 8, 13)
      head.fillTriangle(10 + dx, 2 + dy, 1 + dx, 8 + dy, 10 + dx, 12 + dy)
      head.fillTriangle(18 + dx, 2 + dy, 27 + dx, 8 + dy, 18 + dx, 12 + dy)
    }

    // 同一套黑边（黑色乘任何染色都还是黑，所以点亮染元素色时描边不会被带走）
    head.fillStyle(outline, 1)

    ;[-1, 0, 1].forEach((dx) => {
      ;[-1, 0, 1].forEach((dy) => {
        if (dx !== 0 || dy !== 0) {
          headShape(dx, dy)
        }
      })
    })

    head.fillStyle(0xffffff, 1)
    head.fillRect(10, 0, 8, 13)
    head.fillTriangle(10, 2, 1, 8, 10, 12)
    head.fillTriangle(18, 2, 27, 8, 18, 12)

    // 右侧压暗，和碑身同一个受光方向
    head.fillStyle(0x8f8f8f, 0.4)
    head.fillRect(14, 0, 4, 13)
    head.fillTriangle(18, 2, 27, 8, 18, 12)

    head.generateTexture('monument-head', 28, 44)
    head.destroy()
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
      // 三档取色：正上=岩脊色，正中=土色，正下=浅黄（原来是白色，太亮，删掉了）。
      // 逐行铺满椭圆，横向宽度按椭圆公式收，所以四周不会再有单独的白边
      for (let y = 3; y <= 27; y++) {
        const t = (15 - y) / 11.5
        const color =
          t >= 0
            ? this.mixColor(0x9d7430, 0x8a6a2c, Math.min(1, t))
            : this.mixColor(0x9d7430, 0xefd79b, Math.min(1, -t))
        const half = 15 * Math.sqrt(Math.max(0, 1 - t * t))

        gfx.fillStyle(color, 1)
        gfx.fillRect(16 - half, y, half * 2, 1)
      }

      // 头顶挂一层泥沼：几摊深浅不一的泥。眼睛占着 y 10~16、x 6~26 这一片，
      // 所以泥一律待在 y 10 以上、往左右两个边缘靠，别糊到眼睛上
      gfx.fillStyle(0x6b5734, 1)
      gfx.fillEllipse(9, 8, 8.5, 3.8)

      gfx.fillStyle(0x5c6238, 1)
      gfx.fillEllipse(23, 7.5, 7, 3.8)

      gfx.fillStyle(0x54452a, 1)
      gfx.fillEllipse(16, 5.5, 6, 3)
      gfx.fillRect(6, 8, 1, 2)
      gfx.fillRect(26, 7, 1, 2)

      gfx.fillStyle(0x7d6640, 1)
      gfx.fillRect(9, 5, 2, 1)
      gfx.fillRect(21, 5, 1, 1)
      gfx.fillRect(15, 4, 1, 1)
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

    // 岩化态也走同一套：正上=岩化岩脊的深色，正中=更深的土色，正下=哑一点的浅黄（不再是白）
    for (let y = 3; y <= 27; y++) {
      const t = (15 - y) / 11.5
      const color =
        t >= 0
          ? this.mixColor(0x866631, 0x5c4d33, Math.min(1, t))
          : this.mixColor(0x866631, 0xc6b07e, Math.min(1, -t))
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

  // 岩化态多出来的一层护甲：一圈贴着身体轮廓的岩板，单独一张贴图挂在身体后面，
  // 所以只有探出轮廓的那一圈会露出来，放大、震动时和身体一起变形（和岩脊同一个套路）。
  // 贴图中心就是身体圆心，挂点直接写身体圆心就行
  private makeArmorPlate() {
    const gfx = this.add.graphics()
    const cx = 20
    const cy = 17
    const rx = 15
    const ry = 11.5
    const back = { x: rx * 0.9, y: ry * 0.9 }

    // [中角, 半张角, 探出多少]，屏幕坐标：0=右、90=下、180=左、270=上。
    // 头顶那段留空给岩壳，肩上那两块也少探一点，免得在岩壳旁边戳出孤立的小点
    const plates: Array<[number, number, number]> = [
      [305, 21, 0.78],
      [345, 19, 1],
      [25, 21, 1],
      [65, 20, 1],
      [105, 21, 1],
      [145, 19, 1],
      [185, 21, 1],
      [225, 20, 0.78],
    ]

    plates.forEach(([angle, half, shrink], index) => {
      const a1 = ((angle - half) * Math.PI) / 180
      const a2 = ((angle + half) * Math.PI) / 180
      const inner = { x: rx * 0.8, y: ry * 0.8 }
      const outer = { x: rx + 3.5 * shrink, y: ry + 3.5 * shrink }
      const face = { x: rx + 2.2 * shrink, y: ry + 2.2 * shrink }
      const at = (r: { x: number; y: number }, a: number) =>
        new Phaser.Math.Vector2(cx + r.x * Math.cos(a), cy + r.y * Math.sin(a))

      // 先铺一层深色，再把亮面往里收一点盖上去，每块板就自带一圈描边
      gfx.fillStyle(0x4a3f2c, 1)
      gfx.fillPoints([at(inner, a1), at(outer, a1), at(outer, a2), at(inner, a2)], true)

      gfx.fillStyle(index % 3 === 1 ? 0x7a7060 : 0x8a7f6a, 1)
      gfx.fillPoints([at(back, a1), at(face, a1), at(face, a2), at(back, a2)], true)
    })

    gfx.generateTexture('armor-plate', 40, 34)
    gfx.destroy()
  }

  // 岩造物的石柱：一头一尾是石箍 + 金色的岩元素标识（就是 ICON_ROCK 那套字符画），
  // 中间那段柱身盘着一条竖着走的龙身线
  private makeRockPillar() {
    const gfx = this.add.graphics()

    // 柱身：左侧一条亮面、右侧一条暗面，做出圆柱感
    gfx.fillStyle(0x5c4d33, 1)
    gfx.fillRect(2, 15, 16, 42)
    gfx.fillStyle(0x866631, 1)
    gfx.fillRect(2, 15, 6, 42)
    gfx.fillStyle(0x4a3f2c, 1)
    gfx.fillRect(15, 15, 3, 42)

    // 上下两头更粗的石箍
    gfx.fillStyle(0x4a3f2c, 1)
    gfx.fillRect(0, 0, 20, 15)
    gfx.fillRect(0, 57, 20, 15)

    gfx.fillStyle(0x5c4d33, 1)
    gfx.fillRect(0, 0, 20, 2)
    gfx.fillRect(0, 57, 20, 2)

    // 金箍线：一头一道，正好压在石箍和柱身的分界上
    gfx.fillStyle(0xffd54f, 1)
    gfx.fillRect(0, 15, 20, 1)
    gfx.fillRect(0, 56, 20, 1)

    // 两头的岩元素标识：ICON_ROCK 是 16 宽的字符画，放在 x=2 正好居中
    ;[0, 57].forEach((top) => {
      gfx.fillStyle(0xffd54f, 1)

      ICON_ROCK.forEach((row, y) => {
        for (let x = 0; x < row.length; x++) {
          if (row[x] === '#') {
            gfx.fillRect(2 + x, top + y, 1, 1)
          }
        }
      })
    })

    // 中间的龙身：一条左右盘着的竖线（宽 3 像素），两侧再点几片鳍刺
    gfx.fillStyle(0xd9a441, 1)

    for (let y = 16; y <= 55; y++) {
      const x = 10 + Math.round(2.4 * Math.sin(y / 5.5))

      gfx.fillRect(x - 1, y, 3, 1)
    }

    gfx.fillStyle(0x8a6a2c, 1)

    for (let y = 19; y <= 53; y += 7) {
      gfx.fillRect(4, y, 2, 1)
      gfx.fillRect(14, y + 3, 2, 1)
    }

    gfx.generateTexture('rock-pillar', 20, 72)
    gfx.destroy()
  }

  // 压力板：灰阶贴图，靠 setTint 变色（没踩住=石头色，踩住=金色）
  private makePlate() {
    const gfx = this.add.graphics()

    gfx.fillStyle(0x8a8a8a, 1)
    gfx.fillRect(0, 4, 28, 4)
    gfx.fillStyle(0xffffff, 1)
    gfx.fillRect(1, 1, 26, 4)
    gfx.fillStyle(0xb0b0b0, 1)
    gfx.fillRect(1, 1, 26, 1)

    gfx.generateTexture('plate', 28, 8)
    gfx.destroy()
  }

  // 触屏按键：点阵画的小圆环，用来给箭头之类的按键加一圈纹饰
  private pixelRing(
    gfx: Phaser.GameObjects.Graphics,
    cx: number,
    cy: number,
    radius: number,
    color: number,
    alpha = 1
  ) {
    gfx.fillStyle(color, alpha)

    for (let index = 0; index < 28; index++) {
      const angle = (index / 28) * Math.PI * 2

      gfx.fillRect(
        Math.round(cx + Math.cos(angle) * radius),
        Math.round(cy + Math.sin(angle) * radius),
        1,
        1
      )
    }
  }

  // 触屏的方向箭头：石头质感的圆环 + 四角纹饰 + 一个亮色箭头（朝右，左键靠 flipX）
  private makeTouchArrow() {
    const gfx = this.add.graphics()
    const center = 14

    gfx.fillStyle(0x1c1c28, 0.55)
    gfx.fillCircle(center, center, 13)

    this.pixelRing(gfx, center, center, 12, 0x8a7f6a, 0.85)
    this.pixelRing(gfx, center, center, 10, 0x5c688c, 0.5)

    // 四个斜角的菱形纹饰
    gfx.fillStyle(0xd9c9a8, 0.7)

    ;[
      [center - 8, center - 8],
      [center + 8, center - 8],
      [center - 8, center + 8],
      [center + 8, center + 8],
    ].forEach(([x, y]) => {
      gfx.fillTriangle(x, y - 2, x + 2, y, x, y + 2)
      gfx.fillTriangle(x, y - 2, x - 2, y, x, y + 2)
    })

    // 箭头本体：深色描边 + 亮面（整体围着圆环中心摆正，不偏左）
    gfx.fillStyle(0x1c1c28, 1)
    gfx.fillTriangle(8, 5, 23, 14, 8, 23)
    gfx.fillRect(5, 11, 4, 6)

    gfx.fillStyle(0xf0e2c0, 1)
    gfx.fillTriangle(9, 7, 21, 14, 9, 21)
    gfx.fillRect(6, 12, 4, 4)

    gfx.generateTexture('touch-arrow', 28, 28)
    gfx.destroy()
  }

  // 跳跃键：一颗无元素史莱姆往右上方跃起，身后拖几根细线表示风
  private makeTouchJump() {
    const gfx = this.add.graphics()
    const cx = 26
    const cy = 26

    // 底盘的圆
    gfx.fillStyle(0x1c1c28, 0.55)
    gfx.fillCircle(cx, cy, 24)

    this.pixelRing(gfx, cx, cy, 23, 0x8a7f6a, 0.85)

    // 身后的风线：史莱姆往右上跳，风就斜着往左下拖（每根都是往左下走的一串小台阶）
    gfx.fillStyle(0xa8e8d4, 0.75)

    ;[
      [30, 24, 7],
      [28, 30, 6],
      [24, 36, 5],
    ].forEach(([x, y, length]) => {
      for (let step = 0; step < length; step++) {
        gfx.fillRect(x - step, y + step, 2, 1)
      }
    })

    // 史莱姆本体：压在按钮的右上角，刚蹬离地面的样子
    gfx.fillStyle(0x14141f, 1)
    gfx.fillEllipse(34, 20, 22, 15)
    gfx.fillStyle(0xffffff, 1)
    gfx.fillEllipse(34, 20, 20, 13)

    ;[
      [18, 11, 0.35],
      [16, 9, 0.5],
      [13, 7, 0.6],
      [10, 6, 0.7],
      [7, 4, 0.8],
      [4, 3, 0.9],
    ].forEach(([w, h, alpha]) => {
      gfx.fillStyle(0x55556a, alpha)
      gfx.fillEllipse(34, 20, w, h)
    })

    // 蹬地那一下：右下角带出一小块
    gfx.fillStyle(0x55556a, 0.9)
    gfx.fillTriangle(24, 26, 30, 24, 26, 31)

    // 眼睛
    gfx.fillStyle(0x20202a, 1)
    gfx.fillRect(31, 17, 2, 3)
    gfx.fillRect(37, 17, 2, 3)

    gfx.generateTexture('touch-jump', 52, 52)
    gfx.destroy()
  }

  // 岩柱键：把关卡里那根岩柱（20x72）等比缩小了画进来，整个都在圆盘里面，不超出底盘
  private makeTouchPillar() {
    const gfx = this.add.graphics()

    gfx.fillStyle(0x1c1c28, 0.5)
    gfx.fillCircle(15, 15, 14)

    // 上下石箍（比柱身宽）
    gfx.fillStyle(0x4a3f2c, 1)
    gfx.fillRect(11, 3, 8, 4)
    gfx.fillRect(11, 23, 8, 4)

    gfx.fillStyle(0x5c4d33, 1)
    gfx.fillRect(11, 3, 8, 1)
    gfx.fillRect(11, 23, 8, 1)

    // 柱身：左亮右暗
    gfx.fillStyle(0x5c4d33, 1)
    gfx.fillRect(12, 6, 6, 18)
    gfx.fillStyle(0x866631, 1)
    gfx.fillRect(12, 6, 2, 18)
    gfx.fillStyle(0x4a3f2c, 1)
    gfx.fillRect(17, 6, 1, 18)

    // 上下金箍线
    gfx.fillStyle(0xffd54f, 1)
    gfx.fillRect(11, 7, 8, 1)
    gfx.fillRect(11, 22, 8, 1)

    // 柱身上盘着的那条龙线
    gfx.fillStyle(0xd9a441, 1)

    for (let y = 9; y <= 20; y++) {
      const x = 15 + Math.round(1.2 * Math.sin(y / 2.4))

      gfx.fillRect(x - 1, y, 2, 1)
    }

    // 两头的一点金：代表岩元素标识
    gfx.fillStyle(0xffd54f, 1)
    gfx.fillRect(14, 4, 2, 1)
    gfx.fillRect(14, 25, 2, 1)

    gfx.generateTexture('touch-pillar', 30, 30)
    gfx.destroy()
  }

  // 岩化键：岩元素色的底盘 + 岩元素图标（亮的一张 + 冷却时用的灰版一张）
  private makeTouchArmor() {
    const draw = (
      gfx: Phaser.GameObjects.Graphics,
      outer: number,
      mid: number,
      inner: number,
      ring: number,
      icon: number
    ) => {
      const center = 18

      gfx.fillStyle(0x1c1c28, 0.55)
      gfx.fillCircle(center, center, 17)

      // 抛过光的底盘：外深内亮
      gfx.fillStyle(outer, 1)
      gfx.fillCircle(center, center, 16)
      gfx.fillStyle(mid, 1)
      gfx.fillCircle(center, center, 13)
      gfx.fillStyle(inner, 1)
      gfx.fillCircle(center, center, 10)

      this.pixelRing(gfx, center, center, 15, ring, 0.6)

      // 岩元素图标，正中间
      gfx.fillStyle(icon, 1)

      ICON_ROCK.forEach((row, y) => {
        for (let x = 0; x < row.length; x++) {
          if (row[x] === '#') {
            gfx.fillRect(center - 8 + x, center - 8 + y, 1, 1)
          }
        }
      })
    }

    const lit = this.add.graphics()
    draw(lit, 0x8a6a2c, 0xd9a441, 0xb0873a, 0xffd54f, 0xfff3d0)
    lit.generateTexture('touch-armor', 36, 36)
    lit.destroy()

    // 岩化用完变灰的那一版（冷却时用它当底，亮的那张从下往上盖回来）
    const dim = this.add.graphics()
    draw(dim, 0x3a3a44, 0x55555f, 0x46464f, 0x8a8a94, 0x9a9aa4)
    dim.generateTexture('touch-armor-dim', 36, 36)
    dim.destroy()
  }
  // 岩刺造物：背后一层贴在建筑上的岩壳，前面收成锥口，口上一点金。
  // 贴图画的是「朝下」，贴天花板直接用，贴左墙 / 右墙靠旋转
  private makeSpikeLauncher() {
    const gfx = this.add.graphics()

    // 贴住建筑的那层壳
    gfx.fillStyle(0x4a3f2c, 1)
    gfx.fillRect(0, 0, 20, 6)
    gfx.fillStyle(0x5c4d33, 1)
    gfx.fillRect(0, 0, 20, 2)

    // 往下收的锥体
    gfx.fillStyle(0x5c4d33, 1)
    gfx.fillPoints(
      [
        new Phaser.Math.Vector2(1, 6),
        new Phaser.Math.Vector2(19, 6),
        new Phaser.Math.Vector2(12, 13),
        new Phaser.Math.Vector2(8, 13),
      ],
      true
    )

    // 左侧受光面
    gfx.fillStyle(0x6b5d42, 1)
    gfx.fillPoints(
      [
        new Phaser.Math.Vector2(1, 6),
        new Phaser.Math.Vector2(7, 6),
        new Phaser.Math.Vector2(10, 13),
        new Phaser.Math.Vector2(8, 13),
      ],
      true
    )

    // 锥口 + 一点金，提示它是岩元素造物
    gfx.fillStyle(0x2f2617, 1)
    gfx.fillRect(8, 13, 4, 1)
    gfx.fillStyle(0xffd54f, 1)
    gfx.fillRect(9, 12, 2, 1)

    gfx.generateTexture('spike-launcher', 20, 14)
    gfx.destroy()
  }

  // 岩刺：上宽下尖的一根石锥，按发射方向旋转
  private makeRockSpike() {
    const gfx = this.add.graphics()

    gfx.fillStyle(0x4a3f2c, 1)
    gfx.fillPoints(
      [
        new Phaser.Math.Vector2(1, 0),
        new Phaser.Math.Vector2(7, 0),
        new Phaser.Math.Vector2(4, 13),
      ],
      true
    )

    gfx.fillStyle(0x8a7f6a, 1)
    gfx.fillPoints(
      [
        new Phaser.Math.Vector2(1, 0),
        new Phaser.Math.Vector2(4, 0),
        new Phaser.Math.Vector2(4, 13),
      ],
      true
    )

    gfx.fillStyle(0xffd54f, 1)
    gfx.fillRect(3, 1, 1, 2)

    gfx.generateTexture('rock-spike', 8, 14)
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

  // 普通眼睛：一颗白眼球，染色后就是元素色
  private makeEye() {
    const gfx = this.add.graphics()

    gfx.fillStyle(0xffffff, 1)
    gfx.fillCircle(2, 2, 2)
    gfx.generateTexture('eye', 4, 4)
    gfx.destroy()
  }

  // 岩史莱姆专用：白眼球外面加一圈黑描边。染色只把白的那圈乘成元素色，
  // 黑色乘任何颜色都还是黑，所以描边不受 tint 影响；眨眼是整张图一起压扁，
  // 描边也跟着变，闭眼时正好压成一条深色细线
  private makeRockEye() {
    const gfx = this.add.graphics()

    gfx.fillStyle(0x0b0b12, 1)
    gfx.fillCircle(4, 4, 3)

    gfx.fillStyle(0xffffff, 1)
    gfx.fillCircle(4, 4, 2)

    gfx.generateTexture('eye-rock', 8, 8)
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

          // 每个峰是下宽上窄的梯形，不是三角形：峰顶留出 3 像素宽的平顶
          points.push(new Phaser.Math.Vector2(x + 3, y + saddle))
          points.push(new Phaser.Math.Vector2(x + 1.5, y))
          points.push(new Phaser.Math.Vector2(x - 1.5, y))
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

    // 岩化态的三个峰之间各填一坨新岩石：顶边从左边那峰的腰连到右边那峰的腰、
    // 中间塌下去一点，像一整块裂开的岩壳，三个峰之间只留浅浅的凹口。
    // 只填岩化态，普通态那两个凹口保持原样。底边压在身体后面，不用管接缝
    const armorBottom = 34

    armor.fillStyle(this.mixColor(0x5c4d33, 0x2a2316, 0.4), 1)

    for (let index = 0; index + 1 < armorPeaks.length; index++) {
      const [leftX, leftY] = armorPeaks[index]
      const [rightX, rightY] = armorPeaks[index + 1]
      const topLeftX = leftX + 1
      const topLeftY = leftY + 3
      const topRightX = rightX - 1
      const topRightY = rightY + 3
      // 顶边按两个峰的高度插值，再整体压下去 2 像素，中间就自然塌一点
      const edge = (t: number) => topLeftY + (topRightY - topLeftY) * t + 2

      armor.fillPoints(
        [
          new Phaser.Math.Vector2(topLeftX, topLeftY),
          new Phaser.Math.Vector2(topLeftX + (topRightX - topLeftX) * 0.35, edge(0.35)),
          new Phaser.Math.Vector2(topLeftX + (topRightX - topLeftX) * 0.65, edge(0.65)),
          new Phaser.Math.Vector2(topRightX, topRightY),
          new Phaser.Math.Vector2(rightX - 3, armorBottom),
          new Phaser.Math.Vector2(leftX + 3, armorBottom),
        ],
        true
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
    this.makeLiyueBackground()
  }

  // 第一关·沙滩：天上一个太阳，远处海面，近处沙丘。
  // 沙丘别低于 y≈200，再往下会被地面盖掉（背景是钉在屏幕上的）
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

    this.drawRidge(mid, 480, 270, 0xefdcae, [1, 3], 8, 196)
    mid.fillStyle(0xd9c188, 1)
    mid.fillRect(70, 218, 26, 3)
    mid.fillRect(306, 212, 34, 3)
    mid.fillStyle(0xfaf0d6, 1)
    mid.fillCircle(140, 214, 3)
    mid.fillCircle(392, 206, 3)

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

    // 两层草坡都要留在 y≈200 以上，不然会被地面挡住
    this.drawRidge(mid, 480, 270, 0x9ed3a0, [1, 3], 12, 152)
    this.drawRidge(mid, 480, 270, 0x84bd88, [2, 5], 8, 186)

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

    // 长椅和地台留在 y≈200 以上，不然会被地面挡住
    this.drawRidge(mid, 480, 270, 0x2b3040, [1, 3], 6, 190)

    // 一排长椅剪影
    mid.fillStyle(0x1f2430, 1)
    for (let index = 0; index < 4; index++) {
      const x = 34 + index * 120

      mid.fillRect(x, 200, 74, 6)
      mid.fillRect(x + 4, 206, 6, 18)
      mid.fillRect(x + 64, 206, 6, 18)
      mid.fillRect(x, 182, 6, 24)
    }

    mid.generateTexture('bg-church-mid', 480, 270)
    mid.destroy()
  }

  // 第四关·教堂外的高空：天和海一样的云海，远处立着教堂尖顶
  private makeSkyBackground() {
    const far = this.add.graphics()

    this.paintGradient(far, 480, 270, 0x3f6fb5, 0xbcd9f0)

    far.fillStyle(0xffffff, 0.32)
    far.fillEllipse(120, 176, 220, 40)
    far.fillEllipse(360, 196, 260, 46)
    far.fillEllipse(250, 152, 160, 30)

    const spire = (x: number, top: number, width: number, alpha: number) => {
      far.fillStyle(0x6a7c9c, alpha)
      far.fillRect(x - width / 2, top, width, 120)
      far.fillTriangle(x, top - 34, x - width / 2, top, x + width / 2, top)
    }

    spire(96, 96, 30, 0.55)
    spire(384, 116, 24, 0.45)

    far.generateTexture('bg-sky-far', 480, 270)
    far.destroy()

    const mid = this.add.graphics()

    // 云和塔都留在 y≈200 以上，下面那一截会被地面挡住
    mid.fillStyle(0xffffff, 0.5)
    mid.fillEllipse(80, 196, 300, 54)
    mid.fillEllipse(400, 204, 300, 50)

    // 近处那一座尖塔
    mid.fillStyle(0x54688c, 0.8)
    mid.fillRect(206, 132, 20, 70)
    mid.fillTriangle(216, 94, 197, 134, 235, 134)
    mid.fillRect(210, 106, 12, 12)

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

  // 第六关·荻花洲的黄昏。从上到下分四段：天空(0~138) → 远山(138~196)
  // → 湖面 → 堤岸和芦苇，一层压一层，各占各的高度不互相盖掉。
  // 注意：户外的背景是钉在屏幕上的，而地面站在屏幕最下边（大约 y>210 那一带），
  // 所以有内容的东西都要画在 y≈205 以上，芦苇的顶也是从堤岸往上伸到这一段里
  private makeLiyueBackground() {
    const far = this.add.graphics()

    // 天空
    this.paintGradient(far, 480, 270, 0xf3b072, 0x745f92)

    // 落日
    far.fillStyle(0xffe2ad, 0.9)
    far.fillEllipse(352, 86, 140, 66)

    // 晚霞
    far.fillStyle(0xffffff, 0.3)
    far.fillEllipse(120, 34, 130, 22)
    far.fillEllipse(300, 20, 96, 16)
    far.fillEllipse(60, 58, 90, 14)

    // 远山：两层剪影，上面的浅、下面的深
    this.drawRidge(far, 480, 270, 0x8a7396, [2, 5], 20, 100, 0.9)
    this.drawRidge(far, 480, 270, 0x5d5075, [1, 4], 26, 128)

    far.generateTexture('bg-liyue-far', 480, 270)
    far.destroy()

    const mid = this.add.graphics()

    // 湖面（155 起，露在地面以上的那一截才是玩家看得到的）
    mid.fillStyle(0x4f6f8a, 1)
    mid.fillRect(0, 155, 480, 60)

    mid.fillStyle(0x6f8fa8, 1)
    mid.fillRect(0, 155, 480, 2)

    // 落日在水面上拉出的反光
    mid.fillStyle(0xffd9a0, 0.45)

    for (let index = 0; index < 10; index++) {
      const width = 34 - (index % 4) * 6

      mid.fillRect(340 - width / 2 + ((index % 3) - 1) * 10, 161 + index * 4, width, 2)
    }

    // 堤岸 + 芦苇：芦苇站在岸线（215）上，往湖里伸出来，
    // 岸线本身藏在地面后面，露出来的是芦苇的上半截
    this.drawRidge(mid, 480, 270, 0x6b5a44, [3, 7], 6, 215)
    this.drawRidge(mid, 480, 270, 0x50442f, [4, 9], 4, 232)

    for (let index = 0; index < 26; index++) {
      const x = 8 + index * 19 + ((index * 7) % 5)
      const height = 26 + ((index * 11) % 16)
      const y = 215 - height

      mid.fillStyle(0x6f6a3c, 1)
      mid.fillRect(x, y, 1, height)

      // 穗子
      mid.fillStyle(0x9a945a, 1)
      mid.fillRect(x - 1, y - 3, 2, 4)
    }

    mid.generateTexture('bg-liyue-mid', 480, 270)
    mid.destroy()
  }

  // 望舒客栈：一根很高的岩柱，顶上压着一栋木楼，檐下挂着灯笼。
  // 画在背景层里当路标，不参与碰撞
  private makeInn() {
    const gfx = this.add.graphics()

    // 岩柱：上窄下宽，右侧压暗做出体积
    gfx.fillStyle(0x5b4a38, 1)
    gfx.fillPoints(
      [
        new Phaser.Math.Vector2(18, 160),
        new Phaser.Math.Vector2(54, 160),
        new Phaser.Math.Vector2(46, 56),
        new Phaser.Math.Vector2(26, 56),
      ],
      true
    )

    gfx.fillStyle(0x6f5c46, 1)
    gfx.fillPoints(
      [
        new Phaser.Math.Vector2(18, 160),
        new Phaser.Math.Vector2(32, 160),
        new Phaser.Math.Vector2(32, 56),
        new Phaser.Math.Vector2(26, 56),
      ],
      true
    )

    gfx.fillStyle(0x3f3225, 1)
    gfx.fillPoints(
      [
        new Phaser.Math.Vector2(44, 160),
        new Phaser.Math.Vector2(54, 160),
        new Phaser.Math.Vector2(46, 56),
        new Phaser.Math.Vector2(40, 56),
      ],
      true
    )

    // 木楼：三层，越上面越窄
    gfx.fillStyle(0x8a5a3c, 1)
    gfx.fillRect(14, 38, 44, 20)
    gfx.fillRect(18, 22, 36, 16)
    gfx.fillRect(22, 8, 28, 14)

    gfx.fillStyle(0x6d452e, 1)
    gfx.fillRect(14, 54, 44, 4)
    gfx.fillRect(18, 36, 36, 3)
    gfx.fillRect(22, 20, 28, 3)

    // 青瓦屋顶，两端翘一点
    gfx.fillStyle(0x3f6b62, 1)
    gfx.fillTriangle(36, 0, 12, 10, 60, 10)
    gfx.fillRect(10, 9, 52, 3)
    gfx.fillRect(60, 6, 4, 4)
    gfx.fillRect(8, 6, 4, 4)

    // 窗和灯笼
    gfx.fillStyle(0xffd54f, 1)
    gfx.fillRect(24, 26, 4, 5)
    gfx.fillRect(44, 26, 4, 5)
    gfx.fillRect(20, 43, 4, 5)
    gfx.fillRect(34, 43, 4, 5)
    gfx.fillRect(48, 43, 4, 5)

    gfx.fillStyle(0xd94f3a, 1)
    gfx.fillRect(13, 30, 3, 5)
    gfx.fillRect(56, 30, 3, 5)

    gfx.generateTexture('inn', 72, 160)
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
  // 神像共用的底座：自上而下是小圆台、圆柱、大圆台三层，抛光的石砖质感。
  // 底座 48x78 = 史莱姆的 1.5 倍宽、3 倍高。
  // 三层从上到下依次是小圆台、圆柱、大圆台，顶面 34 宽，够造像的底部站上去
  // 配色是烤死的，不参与元素染色（神像本体才染色）
  private makeStatueBase() {
    const gfx = this.add.graphics()

    const stone = 0x8f8878
    const light = 0xb8b09e
    const dark = 0x5f5a4e

    // 最底下的大圆台：矮矮一层（13 像素 = 史莱姆的一半高）
    gfx.fillStyle(stone, 1)
    gfx.fillPoints(
      [
        new Phaser.Math.Vector2(0, 77),
        new Phaser.Math.Vector2(48, 77),
        new Phaser.Math.Vector2(45, 64),
        new Phaser.Math.Vector2(3, 64),
      ],
      true
    )
    gfx.fillStyle(light, 1)
    gfx.fillRect(3, 64, 42, 2)
    gfx.fillStyle(dark, 0.5)
    gfx.fillRect(0, 75, 48, 3)

    // 中层圆柱：宽 26（= 史莱姆的 0.8 倍），又高又瘦，左边一条亮面、右边压暗
    gfx.fillStyle(stone, 1)
    gfx.fillRect(11, 14, 26, 52)
    gfx.fillStyle(light, 1)
    gfx.fillRect(11, 14, 5, 52)
    gfx.fillStyle(dark, 0.35)
    gfx.fillRect(32, 14, 5, 52)
    gfx.fillStyle(light, 1)
    gfx.fillRect(10, 12, 28, 3)

    // 上层小圆台
    gfx.fillStyle(stone, 1)
    gfx.fillPoints(
      [
        new Phaser.Math.Vector2(11, 14),
        new Phaser.Math.Vector2(37, 14),
        new Phaser.Math.Vector2(35, 1),
        new Phaser.Math.Vector2(13, 1),
      ],
      true
    )
    gfx.fillStyle(light, 1)
    gfx.fillRect(14, 1, 20, 3)

    // 抛光的反光：几道竖直亮线
    gfx.fillStyle(0xffffff, 0.28)
    gfx.fillRect(18, 3, 2, 9)
    gfx.fillRect(14, 16, 2, 32)
    gfx.fillRect(6, 66, 4, 8)

    // 石砖的杂质点
    gfx.fillStyle(dark, 0.5)

    ;[
      [16, 24],
      [33, 30],
      [24, 44],
      [40, 68],
      [7, 70],
    ].forEach(([x, y]) => {
      gfx.fillRect(x, y, 1, 1)
    })

    gfx.generateTexture('statue-base', 48, 78)
    gfx.destroy()
  }

  // 风神像：带翅膀的女性站着，双手在胸前捧一颗水晶球（元素力从球里出来）。
  // 贴图 48x52 = 史莱姆的 1.5 倍宽、2 倍高；翅膀另外用 wing 贴图摆，不占这张图。
  // 本体是白 + 灰的明暗，靠染色成元素色；球画亮一点，染色后是元素色的浅色
  private makeStatueWind() {
    const gfx = this.add.graphics()
    const shade = 0x6a6a6a

    // 翅膀不画在这张图里：用风史莱姆那张 wing 贴图放大来摆（见 GameScene），
    // 这样两边翅膀的形状、羽线、角度天然和风史莱姆一致

    // 长袍：上窄下宽，裙摆垂到脚底
    gfx.fillStyle(0xffffff, 1)
    gfx.fillPoints(
      [
        new Phaser.Math.Vector2(18, 13),
        new Phaser.Math.Vector2(30, 13),
        new Phaser.Math.Vector2(32, 25),
        new Phaser.Math.Vector2(35, 49),
        new Phaser.Math.Vector2(13, 49),
        new Phaser.Math.Vector2(15, 25),
      ],
      true
    )

    // 收腰和裙褶
    gfx.fillStyle(shade, 0.3)
    gfx.fillPoints(
      [
        new Phaser.Math.Vector2(18, 13),
        new Phaser.Math.Vector2(24, 13),
        new Phaser.Math.Vector2(24, 49),
        new Phaser.Math.Vector2(13, 49),
        new Phaser.Math.Vector2(15, 25),
      ],
      true
    )
    gfx.fillStyle(shade, 0.45)
    gfx.fillRect(17, 28, 14, 1)
    gfx.fillRect(15, 37, 17, 1)
    gfx.fillRect(14, 44, 18, 1)

    // 手臂：从两肩往里收，托住水晶球
    gfx.fillStyle(0xffffff, 1)
    gfx.fillPoints(
      [
        new Phaser.Math.Vector2(16, 15),
        new Phaser.Math.Vector2(20, 14),
        new Phaser.Math.Vector2(23, 24),
        new Phaser.Math.Vector2(18, 25),
      ],
      true
    )
    gfx.fillPoints(
      [
        new Phaser.Math.Vector2(32, 15),
        new Phaser.Math.Vector2(28, 14),
        new Phaser.Math.Vector2(25, 24),
        new Phaser.Math.Vector2(30, 25),
      ],
      true
    )

    // 头、发、脖子
    gfx.fillStyle(0xffffff, 1)
    gfx.fillCircle(24, 5, 5)
    gfx.fillRect(23, 9, 3, 3)
    gfx.fillStyle(shade, 0.35)
    gfx.fillRect(27, 2, 3, 5)

    // 水晶球：外面一圈深色，里面留白；左上一道反光弧 + 一个亮点，
    // 右下再点一颗小星芒，看着像一颗玻璃球
    gfx.fillStyle(0xffffff, 1)
    gfx.fillCircle(24, 23, 6)
    gfx.fillStyle(shade, 0.55)
    gfx.fillCircle(24, 23, 6)
    gfx.fillStyle(0xffffff, 1)
    gfx.fillCircle(24, 23, 5)

    // 反光弧：贴着左上边缘的一串亮像素
    gfx.fillStyle(0xffffff, 1)
    gfx.fillRect(21, 18, 4, 1)
    gfx.fillRect(19, 20, 2, 1)
    gfx.fillRect(19, 21, 1, 2)
    gfx.fillRect(20, 20, 1, 4)

    // 亮点
    gfx.fillCircle(21, 21, 1)

    // 右下的星芒
    gfx.fillStyle(0xffffff, 0.85)
    gfx.fillRect(28, 26, 1, 3)
    gfx.fillRect(27, 27, 3, 1)

    // 底部一点压暗，球才不是一块白饼
    gfx.fillStyle(shade, 0.35)
    gfx.fillRect(23, 27, 4, 1)
    gfx.fillRect(26, 26, 3, 1)

    gfx.generateTexture('statue-wind', 48, 52)
    gfx.destroy()
  }

  // 岩神像：男性，翘着二郎腿坐在带靠背的岩石座位上，手里捧一颗岩元素立方体。
  // 贴图 48x52 = 史莱姆的 1.5 倍宽、2 倍高；座椅本身就是造像的底部，正好压在底座顶面上
  private makeStatueRock() {
    const gfx = this.add.graphics()
    const shade = 0x5f5a52

    // 座椅的靠背：先画，人物压在它前面，只在右肩外露出一截
    gfx.fillStyle(0x7d7666, 1)
    gfx.fillPoints(
      [
        new Phaser.Math.Vector2(28, 40),
        new Phaser.Math.Vector2(42, 38),
        new Phaser.Math.Vector2(43, 14),
        new Phaser.Math.Vector2(30, 12),
      ],
      true
    )
    gfx.fillStyle(0xa8a08e, 1)
    gfx.fillPoints(
      [
        new Phaser.Math.Vector2(30, 12),
        new Phaser.Math.Vector2(43, 14),
        new Phaser.Math.Vector2(39, 16),
        new Phaser.Math.Vector2(30, 14),
      ],
      true
    )
    gfx.fillStyle(0x4a453c, 0.4)
    gfx.fillPoints(
      [
        new Phaser.Math.Vector2(37, 14),
        new Phaser.Math.Vector2(43, 14),
        new Phaser.Math.Vector2(42, 38),
        new Phaser.Math.Vector2(37, 38),
      ],
      true
    )

    // 岩石座位
    gfx.fillStyle(0x8f8878, 1)
    gfx.fillPoints(
      [
        new Phaser.Math.Vector2(11, 49),
        new Phaser.Math.Vector2(37, 49),
        new Phaser.Math.Vector2(35, 40),
        new Phaser.Math.Vector2(29, 36),
        new Phaser.Math.Vector2(18, 38),
        new Phaser.Math.Vector2(12, 43),
      ],
      true
    )
    gfx.fillStyle(0xb8b09e, 1)
    gfx.fillPoints(
      [
        new Phaser.Math.Vector2(18, 38),
        new Phaser.Math.Vector2(31, 37),
        new Phaser.Math.Vector2(35, 40),
        new Phaser.Math.Vector2(19, 41),
      ],
      true
    )
    gfx.fillStyle(0x5f5a4e, 0.45)
    gfx.fillPoints(
      [
        new Phaser.Math.Vector2(28, 37),
        new Phaser.Math.Vector2(37, 49),
        new Phaser.Math.Vector2(28, 49),
      ],
      true
    )

    // 下摆：端坐着，长袍从腰垂到座面上，把腿脚都盖住（只留左臂搭在膝上）
    gfx.fillStyle(0xffffff, 1)
    gfx.fillPoints(
      [
        new Phaser.Math.Vector2(17, 34),
        new Phaser.Math.Vector2(31, 34),
        new Phaser.Math.Vector2(35, 49),
        new Phaser.Math.Vector2(13, 49),
      ],
      true
    )
    gfx.fillStyle(shade, 0.3)
    gfx.fillPoints(
      [
        new Phaser.Math.Vector2(17, 34),
        new Phaser.Math.Vector2(24, 34),
        new Phaser.Math.Vector2(24, 49),
        new Phaser.Math.Vector2(13, 49),
      ],
      true
    )
    // 裙褶
    gfx.fillStyle(shade, 0.45)
    gfx.fillRect(15, 40, 19, 1)
    gfx.fillRect(14, 45, 21, 1)
    gfx.fillStyle(shade, 0.55)
    gfx.fillRect(13, 48, 22, 1)

    // 上身：端端正正地坐着，肩腰都竖直
    gfx.fillStyle(0xffffff, 1)
    gfx.fillPoints(
      [
        new Phaser.Math.Vector2(16, 20),
        new Phaser.Math.Vector2(32, 20),
        new Phaser.Math.Vector2(31, 37),
        new Phaser.Math.Vector2(17, 37),
      ],
      true
    )
    gfx.fillStyle(shade, 0.3)
    gfx.fillPoints(
      [
        new Phaser.Math.Vector2(26, 20),
        new Phaser.Math.Vector2(32, 20),
        new Phaser.Math.Vector2(31, 37),
        new Phaser.Math.Vector2(26, 37),
      ],
      true
    )

    // 右手（画面左边）抬到胸前举着立方体；左手搭在膝盖上
    gfx.fillStyle(0xffffff, 1)
    gfx.fillPoints(
      [
        new Phaser.Math.Vector2(16, 23),
        new Phaser.Math.Vector2(21, 22),
        new Phaser.Math.Vector2(18, 28),
        new Phaser.Math.Vector2(13, 28),
      ],
      true
    )
    gfx.fillPoints(
      [
        new Phaser.Math.Vector2(32, 23),
        new Phaser.Math.Vector2(27, 22),
        new Phaser.Math.Vector2(28, 36),
        new Phaser.Math.Vector2(33, 37),
      ],
      true
    )

    // 头 + 发髻 + 胡须
    gfx.fillStyle(0xffffff, 1)
    gfx.fillCircle(24, 11, 7)
    gfx.fillRect(21, 17, 6, 3)
    gfx.fillStyle(shade, 0.4)
    gfx.fillRect(27, 5, 6, 9)
    gfx.fillStyle(0xffffff, 1)
    gfx.fillPoints(
      [
        new Phaser.Math.Vector2(20, 18),
        new Phaser.Math.Vector2(28, 18),
        new Phaser.Math.Vector2(24, 25),
      ],
      true
    )
    gfx.fillStyle(shade, 0.5)
    gfx.fillRect(18, 3, 13, 3)

    // 右手举在胸前的岩元素立方体：三个面三种明暗，左上沿反光 + 右下星芒
    gfx.fillStyle(0xffffff, 1)
    gfx.fillPoints(
      [
        new Phaser.Math.Vector2(11, 19),
        new Phaser.Math.Vector2(16, 21),
        new Phaser.Math.Vector2(11, 23),
        new Phaser.Math.Vector2(6, 21),
      ],
      true
    )
    gfx.fillStyle(0xb0b0b0, 1)
    gfx.fillPoints(
      [
        new Phaser.Math.Vector2(6, 21),
        new Phaser.Math.Vector2(11, 23),
        new Phaser.Math.Vector2(11, 28),
        new Phaser.Math.Vector2(6, 26),
      ],
      true
    )
    gfx.fillStyle(0x8a8a8a, 1)
    gfx.fillPoints(
      [
        new Phaser.Math.Vector2(11, 23),
        new Phaser.Math.Vector2(16, 21),
        new Phaser.Math.Vector2(16, 26),
        new Phaser.Math.Vector2(11, 28),
      ],
      true
    )

    // 反光：顶面上沿的亮边 + 顶点亮点
    gfx.fillStyle(0xffffff, 1)
    gfx.fillRect(8, 20, 2, 1)
    gfx.fillRect(10, 19, 3, 1)
    gfx.fillRect(13, 20, 2, 1)

    // 右下角星芒
    gfx.fillStyle(0xffffff, 0.85)
    gfx.fillRect(14, 25, 1, 2)
    gfx.fillRect(13, 26, 3, 1)

    gfx.generateTexture('statue-rock', 48, 52)
    gfx.destroy()
  }
}
