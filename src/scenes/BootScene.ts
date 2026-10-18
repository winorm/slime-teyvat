import Phaser from 'phaser'
import { ELEMENTS, ELEMENT_ORDER, type ElementKey } from '../data/elements'
import { DEV_LEVEL_MODE } from '../data/devLevel'
import { LEVELS } from '../data/levels'
import { DEV_MODE, progress } from '../state/progress'

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

// 雷：一道竖劈下来的闪电
const ICON_THUNDER = [
  '................',
  '.......#####....',
  '......#####.....',
  '.....#####......',
  '....#####.......',
  '...#####........',
  '...########.....',
  '..##########....',
  '.....######.....',
  '......#####.....',
  '.......#####....',
  '........#####...',
  '.........#####..',
  '..........###...',
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
    // 开发用：?domain=1 直接进仙家试炼秘境（只有 DEV_MODE 开着时有效）
    const search = new URLSearchParams(location.search)

    if (DEV_MODE && search.get('domain') === '1') {
      const domainReturnLevel = LEVELS.length - 1

      progress.levelIndex = domainReturnLevel
      progress.maxLevel = Math.max(progress.maxLevel, domainReturnLevel)
      progress.unlocked = [...ELEMENT_ORDER]
      this.scene.start('game', {
        domain: true,
        returnPoint: { x: 1960, y: 446, element: 'rock' },
      })
      return
    }

    // 开发用：地址上带 ?level=8 就直接进第八关（和 ?dev=1 一样，只有 DEV_MODE 开着时才有）
    const levelParam = search.get('level')
    const levelIndex = levelParam === null ? Number.NaN : Number.parseInt(levelParam, 10) - 1

    if (DEV_MODE && Number.isInteger(levelIndex) && levelIndex >= 0 && levelIndex < LEVELS.length) {
      progress.levelIndex = levelIndex
      progress.maxLevel = Math.max(progress.maxLevel, levelIndex)
      progress.unlocked = [...ELEMENT_ORDER]
      this.scene.start('game')
      return
    }

    // 带 ?dev=1（并且 DEV_MODE 开着）时跳过主菜单，直接进测试沙盒
    this.scene.start(DEV_LEVEL_MODE ? 'game' : 'menu')
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

    this.makeWaterTop()
    this.makeGrassTop()

    this.makeSpikeLauncher()
    this.makeRockSpike()

    this.makeTouchArrow()
    this.makeTouchStick()
    this.makeTouchJump()
    this.makeTouchPillar()
    this.makeTouchArmor()
    this.makeTouchThunder()

    this.makeThunderRod()
    this.makeThunderCooledSlime()
    this.makePolarityMarks()
    this.makeChargeBattery()
    this.makeThunderBall()
    this.makeStunMark()
    this.makeMonsterBrute()
    this.makeGuardMillelith()
    this.makeHarborProps()
    this.makeLandBuildings()
    this.makeWangShengTang()
    this.makeTerraceHouses()
    this.makeTerracePlaza()
    this.makeTerraceGate()
    this.makeTerraceCenser()
    this.makeRiteProps()
    this.makeCloudRetainerCrane()
    this.makeAmber()
    this.makeAmberBoar()
    this.makeAmberNpc()
    this.makeSpeedCharm()
    this.makeTrialTalisman()
    this.makeTrialStone()
    this.makeTrialRockSpike()
    this.makeTrialSideSpike()
    this.makeTrialPot()
    this.makeTrialPotLid()
    this.makeTrialApple()
    this.makeAmberStand()
    this.makeCliffTrees()
    this.makePlatformPine()
    this.makeRockStrata()
    this.makePebbles()
    this.makeStonePile()
    this.makeBirches()
    this.makePeachTrees()
    this.makeSummitWillow()
    this.makeTeaSet()
    this.makeCliffDetails()
    this.makeSummitPeak()
    this.makeBoulderBig()
    this.makeMountainMist()
    this.makeSummitLake()
    this.makeSummitMarsh()
    this.makePondSpill()
    this.makeSummitHighPeak()
    this.makeDomainEntrance()
    this.makeSwampStone()
    this.makeWaterfall()
    this.makeSlimeShadow()
    this.makeTerracePaving()

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
    this.makeIcon('icon-thunder', ICON_THUNDER)

    this.makeGear()

    this.makeBackgrounds()
    this.makeWindmill()
    this.makeWindmillBlades()
    this.makeInn()
    this.makeHazardSpark()

    this.makeBlessing()
    this.makeMonument()
    this.makeGate()
    this.makeIronGate()
    this.makeRuinBrick()
    this.makeWoodPlank()
    this.makeTreeTrunk()
    this.makeRuinHouse()
    this.makeRuinHouseBroken()
    this.makeMineHill()
    this.makeMineCliff()
    this.makePaper()
    this.makeSpire()
    this.makeCage()
    this.makeCageOpen()
    this.makeEgg()
    this.makeDragonling()
    this.makeWing()
    this.makeRevealBlob()
    this.makeLantern()
    this.makeBarrel()
    this.makeTreeRoot()
    this.makeTreeBranches()
    this.makeLiftCar()
    this.makeWaterWheel()
    this.makeInnFront()
    this.makeInnFurniture()
    this.makeInnDining()
    this.makeInnWall()
    this.makeInnBed()
    this.makeInnDoor()
    this.makeInnSign()
    this.makeInnAwning()
    this.makeInnScreen()
    this.makeXiaoSlime()
    this.makeInnkeeper()
    this.makeIngredientItems()
    this.makeRitualMaterials()
    this.makeOsmanthusTree()
    this.makePetal()
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

  // 石门：嵌在墙里的双扇石闸。门框比门扇深，两扇中间留一道缝，
  // 上下各压一条砌石线，四角有铁钉，右下角带一点缺角
  private makeGate() {
    const gfx = this.add.graphics()

    // 门框（沉进墙里）
    gfx.fillStyle(0x4a443b, 1)
    gfx.fillRect(0, 0, 70, 40)

    // 门洞底色
    gfx.fillStyle(0x241f1a, 1)
    gfx.fillRect(3, 3, 64, 37)

    // 两扇门扇
    gfx.fillStyle(0x8a8175, 1)
    gfx.fillRect(4, 4, 31, 34)
    gfx.fillRect(35, 4, 31, 34)

    // 受光的上棱和压暗的下棱
    gfx.fillStyle(0xa39a8c, 1)
    gfx.fillRect(4, 4, 31, 2)
    gfx.fillRect(35, 4, 31, 2)
    gfx.fillStyle(0x6d6558, 1)
    gfx.fillRect(4, 36, 31, 2)
    gfx.fillRect(35, 36, 31, 2)

    // 中缝
    gfx.fillStyle(0x595247, 1)
    gfx.fillRect(34, 4, 2, 34)

    // 竖向石纹（每扇三道，深浅交错，免得像平板）
    gfx.fillStyle(0x7c7365, 1)
    gfx.fillRect(13, 8, 1, 26)
    gfx.fillRect(22, 12, 1, 20)
    gfx.fillRect(44, 9, 1, 25)
    gfx.fillRect(55, 14, 1, 18)
    gfx.fillRect(30, 16, 1, 16)
    gfx.fillRect(62, 10, 1, 22)

    // 横向砌石线：两扇各一条，做成上下两层砌石
    gfx.fillStyle(0x6d6558, 1)
    gfx.fillRect(4, 20, 31, 1)
    gfx.fillRect(35, 20, 31, 1)

    // 铁钉 + 门环
    gfx.fillStyle(0x3b352e, 1)
    gfx.fillRect(9, 9, 2, 2)
    gfx.fillRect(27, 9, 2, 2)
    gfx.fillRect(41, 9, 2, 2)
    gfx.fillRect(59, 9, 2, 2)
    gfx.fillRect(9, 29, 2, 2)
    gfx.fillRect(27, 29, 2, 2)
    gfx.fillRect(41, 29, 2, 2)
    gfx.fillRect(59, 29, 2, 2)

    gfx.fillStyle(0x4a423a, 1)
    gfx.fillRect(26, 22, 8, 3)
    gfx.fillRect(36, 22, 8, 3)

    // 几道细裂纹和右下缺角
    gfx.fillStyle(0x6d6558, 1)
    gfx.fillRect(18, 26, 1, 8)
    gfx.fillRect(49, 24, 1, 10)
    gfx.fillStyle(0x241f1a, 1)
    gfx.fillRect(62, 34, 4, 4)
    gfx.fillRect(60, 36, 2, 2)

    gfx.generateTexture('gate', 70, 40)
    gfx.destroy()
  }

  // 铁栅栏：两侧嵌石柱，中间一排尖头铁栏，两道横梁 + 铆钉，带一点锈
  private makeIronGate() {
    const gfx = this.add.graphics()

    // 两侧石柱
    gfx.fillStyle(0x6b6257, 1)
    gfx.fillRect(0, 0, 8, 100)
    gfx.fillRect(72, 0, 8, 100)
    gfx.fillStyle(0x877d6f, 1)
    gfx.fillRect(0, 0, 2, 100)
    gfx.fillRect(72, 0, 2, 100)
    gfx.fillStyle(0x4f483f, 1)
    gfx.fillRect(6, 0, 2, 100)
    gfx.fillRect(78, 0, 2, 100)

    // 栅栏后面的黑暗
    gfx.fillStyle(0x231d17, 1)
    gfx.fillRect(8, 0, 64, 100)

    // 七根竖栏 + 尖头
    for (let index = 0; index < 7; index++) {
      const x = 11 + index * 9

      gfx.fillStyle(0x54545e, 1)
      gfx.fillRect(x, 6, 4, 88)
      gfx.fillStyle(0x6f6f7a, 1)
      gfx.fillRect(x, 6, 1, 88)
      gfx.fillStyle(0x2f2f36, 1)
      gfx.fillRect(x + 3, 6, 1, 88)

      gfx.fillStyle(0x54545e, 1)
      gfx.fillTriangle(x - 1, 6, x + 5, 6, x + 2, 0)
      gfx.fillStyle(0x6f6f7a, 1)
      gfx.fillTriangle(x, 6, x + 2, 6, x + 2, 2)
    }

    // 两道横梁
    gfx.fillStyle(0x4b4b55, 1)
    gfx.fillRect(8, 22, 64, 8)
    gfx.fillRect(8, 72, 64, 8)
    gfx.fillStyle(0x66666f, 1)
    gfx.fillRect(8, 22, 64, 2)
    gfx.fillRect(8, 72, 64, 2)
    gfx.fillStyle(0x30303a, 1)
    gfx.fillRect(8, 28, 64, 2)
    gfx.fillRect(8, 78, 64, 2)

    // 铆钉
    gfx.fillStyle(0x82828e, 1)
    for (let index = 0; index < 4; index++) {
      gfx.fillRect(12 + index * 18, 25, 3, 3)
      gfx.fillRect(12 + index * 18, 75, 3, 3)
    }

    // 锈迹
    gfx.fillStyle(0x8a5a3a, 0.5)
    gfx.fillRect(19, 40, 3, 10)
    gfx.fillRect(46, 52, 2, 13)
    gfx.fillRect(64, 36, 3, 8)
    gfx.fillRect(28, 62, 2, 6)

    gfx.generateTexture('iron-gate', 80, 100)
    gfx.destroy()
  }

  // 村庄断墙用的砖石：可平铺的一小块
  private makeRuinBrick() {
    const gfx = this.add.graphics()

    gfx.fillStyle(0x6a5a48, 1)
    gfx.fillRect(0, 0, 16, 16)
    gfx.fillStyle(0x7c6a56, 1)
    gfx.fillRect(0, 0, 16, 1)
    gfx.fillRect(0, 8, 16, 1)
    gfx.fillStyle(0x4a3f33, 1)
    gfx.fillRect(0, 7, 16, 1)
    gfx.fillRect(0, 15, 16, 1)
    gfx.fillRect(7, 0, 1, 8)
    gfx.fillRect(15, 8, 1, 8)
    gfx.fillStyle(0x5c4e3e, 1)
    gfx.fillRect(2, 3, 4, 2)
    gfx.fillRect(10, 11, 4, 2)

    gfx.generateTexture('ruin-brick', 16, 16)
    gfx.destroy()
  }

  // 木桥的板材：横铺的一根板子，可平铺。上沿受光、下沿压暗，
  // 中间几道木纹，两头各一颗钉子
  // 望舒客栈的琉璃灯笼：暖黄灯身 + 深红上下箍 + 顶端一截挂绳
  // 古树的树根段：顶端和主杆一样宽（220），往下张开成三条根盘，底边压在地面线上。
  // 一整张贴图用（不平铺），靠 y 对齐主杆底端
  private makeTreeRoot() {
    // 高度 = 主杆底边(2000) 到 地面线(2160) 的那 160 像素；顶端 220 = 主杆宽；底部张开到 500
    // （这样贴图按 1 倍画，顶端正好接上主杆、底边正好压在地面线上）
    const width = 500
    const height = 160
    const topWidth = 220
    const cx = width / 2
    const gfx = this.add.graphics()

    // 一行一行画：宽度从 220 平滑张到 500。
    // 每行切成 18 竖条，明暗用和树干完全一样的公式（按"这一行自己的宽度"算），
    // 所以接上去是同一块材料；而且压暗只发生在木头上，形状外面不会留黑边
    const rowHalfWidth = (y: number) =>
      topWidth / 2 + (width / 2 - topWidth / 2) * Math.pow(y / (height - 1), 2)

    for (let y = 0; y < height; y++) {
      const halfWidth = rowHalfWidth(y)
      const left = cx - halfWidth
      const slices = 18

      for (let s = 0; s < slices; s++) {
        const x0 = left + (halfWidth * 2 * s) / slices
        const x1 = left + (halfWidth * 2 * (s + 1)) / slices
        const n = (((x0 + x1) / 2 - left) / (halfWidth * 2) - 0.5) * 2
        const shade = 1 - n * n * 0.4 + Math.sin(((x0 + x1) / 2) * 0.55) * 0.02

        gfx.fillStyle(
          Phaser.Display.Color.GetColor(
            Math.round(0x7a * shade),
            Math.round(0x5a * shade),
            Math.round(0x38 * shade)
          ),
          1
        )
        gfx.fillRect(x0, y, x1 - x0 + 1, 1)
      }

      // 受光面：和树干一样落在宽度的 30% 处，跟着形状往下走
      gfx.fillStyle(0x9a7444, 0.3)
      gfx.fillRect(left + halfWidth * 2 * 0.3, y, 8, 1)
      gfx.fillStyle(0x9a7444, 0.15)
      gfx.fillRect(left + halfWidth * 2 * 0.42, y, 5, 1)
    }

    // 三条根盘：从主干两侧斜着扎下去，越往根尖越细
    const roots = [
      { fromX: 150, tipX: 34, thickness: 26 },
      { fromX: 356, tipX: 470, thickness: 23 },
      { fromX: 250, tipX: 188, thickness: 30 },
    ]

    roots.forEach((root) => {
      const steps = 30

      for (let i = 0; i < steps; i++) {
        const t = i / (steps - 1)
        const x = root.fromX + (root.tipX - root.fromX) * t * t
        const y = 84 + (height - 84) * t
        const thickness = root.thickness * (1 - t * 0.5)

        gfx.fillStyle(0x6a4c2e, 1)
        gfx.fillRect(x - thickness / 2, y, thickness, 10)
        gfx.fillStyle(0x8a6a44, 1)
        gfx.fillRect(x - thickness / 2, y, thickness, 2)
        gfx.fillStyle(0x4a3320, 0.9)
        gfx.fillRect(x - thickness / 2, y + 8, thickness, 3)
      }
    })

    // 根盘扎进土里的暗影（只画在木头底下）
    gfx.fillStyle(0x2a1c10, 0.45)
    gfx.fillRect(cx - rowHalfWidth(height - 1), height - 7, rowHalfWidth(height - 1) * 2, 7)

    // 树皮裂纹 + 苔藓，和主杆一个调子；位置按"这一行的宽度"算，全都夹在木头里
    gfx.fillStyle(0x3f2c1c, 0.5)

    for (let index = 0; index < 22; index++) {
      const y = 6 + ((index * 41) % (height - 40))
      const half = rowHalfWidth(y)
      const x = cx - half + 8 + ((index * 47) % Math.max(1, half * 2 - 16))

      gfx.fillRect(x, y, 2, 10 + (index % 3) * 8)
    }

    gfx.fillStyle(0x5f7a3c, 0.6)

    const moss = [
      { y: 34, at: 0.16, w: 38 },
      { y: 76, at: 0.74, w: 32 },
      { y: 112, at: 0.3, w: 36 },
      { y: 142, at: 0.6, w: 28 },
    ]

    moss.forEach((patch) => {
      const half = rowHalfWidth(patch.y)

      gfx.fillRect(cx - half + half * 2 * patch.at, patch.y, patch.w, 5)
    })

    gfx.generateTexture('tree-root', width, height)
    gfx.destroy()
  }

  // 水利电梯的轿厢：木框 + 铺板 + 两道横箍（和井道立柱呼应），和普通楼板区分开
  private makeLiftCar() {
    const width = 80
    const height = 12
    const gfx = this.add.graphics()

    gfx.fillStyle(0x5f4224, 1)              // 底下那圈厚边框
    gfx.fillRect(0, 3, width, 9)
    gfx.fillStyle(0x8a6034, 1)              // 铺板
    gfx.fillRect(1, 4, width - 2, 5)
    gfx.fillStyle(0xa8794a, 1)              // 上沿受光
    gfx.fillRect(1, 4, width - 2, 2)
    gfx.fillStyle(0x7a4c28, 1)              // 两道横箍
    gfx.fillRect(6, 3, 3, 9)
    gfx.fillRect(width - 9, 3, 3, 9)
    gfx.fillStyle(0x3f2c1c, 1)              // 顶面的分格线

    for (let x = 14; x < width - 10; x += 12) {
      gfx.fillRect(x, 6, 1, 3)
    }

    gfx.generateTexture('lift-car', width, height)
    gfx.destroy()
  }

  // 水利电梯的水车：木轮 + 八根辐条 + 中心轴，转动时用来当"水力"的表现
  // 望舒客栈的前台柜台：木台面 + 分格柜身 + 台面上一个小算盘
  // 望舒客栈的家具：木格柜、砖灶（带锅）、柴堆、吊锅
  // 客栈的桌凳：方桌（桌面 + 四条腿 + 横撑）和圆凳
  // 客栈后墙：可平铺的木墙 + 一扇格子窗（120×120 一格，横着平铺就成一整面墙）
  // 客栈客房的床：床头板 + 褥子 + 枕头 + 被子
  // 望舒客栈的进楼门口：两根木柱夹一个门洞，门洞里压暗、挂一幅红门帘。
  // 贴在室外楼梯最后一跑的落点（x=362 那一层），玩家就是从这里进楼的
  private makeInnDoor() {
    const gfx = this.add.graphics()

    gfx.fillStyle(0x2a2018, 1)              // 门洞：里面是暗的
    gfx.fillRect(6, 8, 52, 76)

    gfx.fillStyle(0x7d2f28, 1)              // 红门帘
    gfx.fillRect(7, 12, 50, 46)
    gfx.fillStyle(0x5e211c, 1)              // 门帘的褶子

    for (let x = 16; x < 56; x += 9) {
      gfx.fillRect(x, 12, 2, 46)
    }

    gfx.fillStyle(0xe0b03c, 1)              // 门帘下摆的金边
    gfx.fillRect(7, 56, 50, 3)

    gfx.fillStyle(0x6b4a2c, 1)              // 两根门柱
    gfx.fillRect(0, 0, 6, 84)
    gfx.fillRect(58, 0, 6, 84)
    gfx.fillStyle(0x8a6034, 1)
    gfx.fillRect(0, 0, 2, 84)
    gfx.fillRect(58, 0, 2, 84)
    gfx.fillStyle(0x4a3320, 1)
    gfx.fillRect(4, 0, 2, 84)
    gfx.fillRect(62, 0, 2, 84)

    gfx.fillStyle(0x5f4224, 1)              // 门楣
    gfx.fillRect(0, 0, 64, 10)
    gfx.fillStyle(0x8a6034, 1)
    gfx.fillRect(0, 0, 64, 3)
    gfx.fillStyle(0x3f2c1c, 1)
    gfx.fillRect(0, 10, 64, 2)

    gfx.fillStyle(0xe0b03c, 1)              // 门楣中间一颗门簪
    gfx.fillCircle(32, 6, 3)

    gfx.generateTexture('inn-door', 64, 84)
    gfx.destroy()
  }

  // 客栈招牌的木板：牌面留空，字由 GameScene 用 Text 打上去（跟提示词一套做法，改字方便）
  private makeInnSign() {
    const gfx = this.add.graphics()

    gfx.fillStyle(0x3f2c1c, 1)              // 外框
    gfx.fillRect(0, 0, 76, 28)
    gfx.fillStyle(0xb5854f, 1)              // 牌面
    gfx.fillRect(2, 2, 72, 24)
    gfx.fillStyle(0xd0a56b, 1)
    gfx.fillRect(2, 2, 72, 4)               // 上沿受光
    gfx.fillStyle(0x9a7040, 1)
    gfx.fillRect(2, 22, 72, 4)              // 下沿压暗
    gfx.fillStyle(0x8a6034, 1)              // 左右两头的木纹
    gfx.fillRect(6, 5, 1, 18)
    gfx.fillRect(69, 5, 1, 18)

    gfx.generateTexture('inn-sign', 76, 28)
    gfx.destroy()
  }

  // 一楼户外用餐区的棚子：两根木柱撑一片小屋檐（跟屋顶同一套青灰瓦 + 金边），
  // 100×66，贴地摆。柱子落在 x=6/90，棚底在贴图 y=25（离地 41 像素，人从下面过）
  private makeInnAwning() {
    const gfx = this.add.graphics()

    gfx.fillStyle(0x3d4a63, 1)              // 棚面（梯形）
    gfx.fillPoints(
      [
        new Phaser.Math.Vector2(0, 18),
        new Phaser.Math.Vector2(100, 18),
        new Phaser.Math.Vector2(84, 0),
        new Phaser.Math.Vector2(16, 0),
      ],
      true
    )
    gfx.fillStyle(0x4b5975, 1)              // 下沿一条亮带
    gfx.fillPoints(
      [
        new Phaser.Math.Vector2(0, 18),
        new Phaser.Math.Vector2(100, 18),
        new Phaser.Math.Vector2(96, 14),
        new Phaser.Math.Vector2(4, 14),
      ],
      true
    )
    gfx.fillStyle(0x5a6a86, 1)              // 正脊
    gfx.fillRect(14, 0, 72, 3)
    gfx.fillStyle(0x2b3446, 1)              // 檐板
    gfx.fillRect(0, 18, 100, 5)
    gfx.fillStyle(0xc9a227, 1)              // 檐口金边
    gfx.fillRect(0, 23, 100, 2)

    gfx.fillStyle(0x6b4a2c, 1)              // 两根木柱
    gfx.fillRect(6, 16, 4, 50)
    gfx.fillRect(90, 16, 4, 50)
    gfx.fillStyle(0x8a6034, 1)
    gfx.fillRect(6, 16, 1, 50)
    gfx.fillRect(90, 16, 1, 50)
    gfx.fillStyle(0x4a3320, 1)
    gfx.fillRect(9, 16, 1, 50)
    gfx.fillRect(93, 16, 1, 50)

    gfx.generateTexture('inn-awning', 100, 66)
    gfx.destroy()
  }

  // 客房里的三扇屏风：木框 + 纸面，中间那扇当成背光面压暗一档，做出折起来的感觉
  private makeInnScreen() {
    const gfx = this.add.graphics()

    gfx.fillStyle(0x4a3320, 1)
    gfx.fillRect(0, 2, 60, 40)
    gfx.fillStyle(0x6b4a2c, 1)
    gfx.fillRect(1, 3, 58, 38)

    for (let panel = 0; panel < 3; panel++) {
      const x = 3 + panel * 19

      gfx.fillStyle(0x6b4a2c, 1)
      gfx.fillRect(x, 5, 16, 34)
      gfx.fillStyle(panel === 1 ? 0xd8c69a : 0xe8d9b0, 1)
      gfx.fillRect(x + 2, 7, 12, 30)
      gfx.fillStyle(0x5a6a86, 1)            // 每扇上一点远山
      gfx.fillTriangle(x + 3, 30, x + 8, 21, x + 13, 30)
      gfx.fillStyle(0x8a9a7a, 1)
      gfx.fillRect(x + 3, 32, 10, 2)
    }

    gfx.fillStyle(0x4a3320, 1)              // 两只小脚
    gfx.fillRect(0, 42, 4, 4)
    gfx.fillRect(56, 42, 4, 4)

    gfx.generateTexture('inn-screen', 60, 46)
    gfx.destroy()
  }

  // 隐藏动画里的 NPC：风元素史莱姆「魈」。
  // 和主角不同的地方：① 全身是同一个色（主角是白底 + 六层同心椭圆渐变），而且更深；
  // ② 身上带着不明显的黑色伤疤；③ 背后斜穿一杆长枪、腰侧挂一具罗刹面具（侧面）。
  // 画布 64x60：身体按 32x25 描边 + 30x23 本体画、圆心在 (32,46)，原点放在脚底（originY = 1）。
  // 长枪那条线过 (32,40.3)、斜率 -0.857 —— 比上一版整体压低约 6 像素，
  // 所以它是斜着"穿过"身体的（左下枪尾露在身体外、右上枪头挑到头以上）
  private makeXiaoSlime() {
    const gfx = this.add.graphics()

    const outline = 0x14141f
    const body = 0x3a8f77          // 深风绿：主角风史莱姆是 0x74d0b0
    const scar = 0x1a3a31          // 伤疤：比身体深一档，不扎眼
    const scarDark = 0x0f221c
    const jade = 0x7fd8b4
    const jadeDark = 0x3f8f70
    const steel = 0x9aa0ad
    const steelDark = 0x5b6270
    const gold = 0xd9a441

    // ---- 背后那杆长枪：左下枪尾、右上枪头，斜穿整个身体 ----
    const butt = new Phaser.Math.Vector2(12, 57.5)
    const ux = 0.759          // 枪身方向（右上）
    const uy = -0.651
    const nx = 0.651          // 法线
    const ny = 0.759
    const at = (t: number) => new Phaser.Math.Vector2(butt.x + ux * t, butt.y + uy * t)

    // 一段有厚度的杆：沿着枪身方向走，往法线两边各长 width/2
    const rod = (t0: number, t1: number, width: number, color: number) => {
      const a = at(t0)
      const b = at(t1)
      const half = width / 2

      gfx.fillStyle(color, 1)
      gfx.fillPoints(
        [
          new Phaser.Math.Vector2(a.x + nx * half, a.y + ny * half),
          new Phaser.Math.Vector2(b.x + nx * half, b.y + ny * half),
          new Phaser.Math.Vector2(b.x - nx * half, b.y - ny * half),
          new Phaser.Math.Vector2(a.x - nx * half, a.y - ny * half),
        ],
        true
      )
    }

    // 枪杆：先描黑边，再叠杆身，最后沿一侧压一条高光
    rod(0, 48, 4.6, outline)
    rod(0, 48, 2.4, 0x4a4a58)
    rod(2, 46, 0.8, 0x6e6e80)

    // 枪尾：一个金属配重 + 一道金箍
    rod(-3, 3, 4.2, outline)
    rod(-3, 3, 3, steelDark)
    rod(3, 5, 3.4, gold)

    // 枪杆上两道缠绳：挑的是"露在身体外面"的那两段（枪杆中段是被身体挡住的）
    rod(6, 10, 3.4, outline)
    rod(6, 10, 2.8, 0x8a6034)
    rod(37, 41, 3.4, outline)
    rod(37, 41, 2.8, 0x8a6034)

    // 枪头：金箍 → 玉色的刃（有脊线）+ 两侧倒钩
    rod(48, 51, 4.2, outline)
    rod(48, 51, 3.4, steel)
    rod(51, 53, 4.6, gold)

    const tip = at(66)
    const waistA = at(57)
    const neck = at(53)

    gfx.fillStyle(outline, 1)
    gfx.fillTriangle(
      neck.x + nx * 3.4, neck.y + ny * 3.4,
      neck.x - nx * 3.4, neck.y - ny * 3.4,
      tip.x, tip.y
    )
    gfx.fillStyle(jade, 1)
    gfx.fillTriangle(
      neck.x + nx * 2.4, neck.y + ny * 2.4,
      neck.x - nx * 2.4, neck.y - ny * 2.4,
      tip.x - ux * 1.5, tip.y - uy * 1.5
    )
    gfx.fillStyle(jadeDark, 1)                 // 刃的背光半边
    gfx.fillTriangle(
      neck.x - nx * 2.4, neck.y - ny * 2.4,
      tip.x - ux * 1.5, tip.y - uy * 1.5,
      waistA.x - nx * 1.2, waistA.y - ny * 1.2
    )
    gfx.fillStyle(0xd6f4e4, 1)                 // 中间的脊线
    gfx.fillTriangle(
      neck.x + nx * 0.6, neck.y + ny * 0.6,
      neck.x - nx * 0.6, neck.y - ny * 0.6,
      tip.x - ux * 2, tip.y - uy * 2
    )

    const barb = at(55)                        // 两侧倒钩
    gfx.fillStyle(steel, 1)
    gfx.fillTriangle(
      barb.x + nx * 2.6, barb.y + ny * 2.6,
      barb.x + nx * 5.6 - ux * 3, barb.y + ny * 5.6 - uy * 3,
      barb.x - ux * 1, barb.y - uy * 1
    )
    gfx.fillTriangle(
      barb.x - nx * 2.6, barb.y - ny * 2.6,
      barb.x - nx * 5.6 - ux * 3, barb.y - ny * 5.6 - uy * 3,
      barb.x - ux * 1, barb.y - uy * 1
    )

    // ---- 身体：一圈黑描边 + 一个平色的本体（没有渐变） ----
    gfx.fillStyle(outline, 1)
    gfx.fillEllipse(32, 46, 32, 25)
    gfx.fillStyle(body, 1)
    gfx.fillEllipse(32, 46, 30, 23)

    // ---- 白色腰带：贴着身体下缘横一道，上沿压暗当褶皱、下沿提亮 ----
    gfx.fillStyle(0xa8a49a, 1)
    gfx.fillPoints(
      [
        new Phaser.Math.Vector2(17.6, 49.6),
        new Phaser.Math.Vector2(46.4, 49.6),
        new Phaser.Math.Vector2(43.1, 54.4),
        new Phaser.Math.Vector2(20.9, 54.4),
      ],
      true
    )
    gfx.fillStyle(0xe8e4d8, 1)
    gfx.fillPoints(
      [
        new Phaser.Math.Vector2(17.8, 50.2),
        new Phaser.Math.Vector2(46.2, 50.2),
        new Phaser.Math.Vector2(43, 53.8),
        new Phaser.Math.Vector2(21, 53.8),
      ],
      true
    )
    gfx.fillStyle(0xffffff, 1)                 // 腰带下沿的一线亮光
    gfx.fillPoints(
      [
        new Phaser.Math.Vector2(20.9, 53.6),
        new Phaser.Math.Vector2(43.1, 53.6),
        new Phaser.Math.Vector2(43, 54.4),
        new Phaser.Math.Vector2(20.9, 54.4),
      ],
      true
    )
    gfx.fillStyle(0xc9c4b6, 1)                 // 腰前打的一个结
    gfx.fillRect(30, 49.6, 4, 4.8)
    gfx.fillStyle(0xe8e4d8, 1)
    gfx.fillRect(30.5, 50.2, 3, 3.6)

    // ---- 伤疤：几道很淡的深色细痕，散在身上 ----
    gfx.fillStyle(scar, 1)
    gfx.fillRect(24, 39, 4, 1)
    gfx.fillRect(26, 40, 2, 1)
    gfx.fillRect(38, 36, 3, 1)
    gfx.fillRect(39, 37, 1, 2)
    gfx.fillRect(29, 48, 3, 1)
    gfx.fillRect(21, 45, 2, 1)
    gfx.fillRect(37, 47, 2, 2)

    gfx.fillStyle(scarDark, 1)
    gfx.fillRect(25, 39, 1, 1)
    gfx.fillRect(33, 35, 2, 1)
    gfx.fillRect(35, 46, 1, 1)
    gfx.fillRect(22, 45, 1, 1)

    // ---- 眼睛：外眼角往下垂、上眼睑往外压，带一点孤独和忧伤；眼里留一点湿光 ----
    const eye = (cx: number, side: number) => {
      gfx.fillStyle(outline, 1)                // 眼窝
      gfx.fillEllipse(cx, 45.6, 7, 5.6)

      gfx.fillStyle(0xd8e07a, 1)               // 眼芯
      gfx.fillEllipse(cx, 46.2, 4.6, 3.4)

      gfx.fillStyle(outline, 1)                // 上眼睑：往外侧压下去
      gfx.fillTriangle(
        cx - 3.6 * side, 43.4,
        cx + 3.8 * side, 45.2,
        cx + 3.2 * side, 46.6
      )
      gfx.fillTriangle(cx + 3.8 * side, 45.2, cx + 4.2 * side, 47.4, cx + 3.2 * side, 46.6)

      gfx.fillStyle(0xeaf6d2, 1)               // 眼里那点湿光
      gfx.fillRect(cx - 2 * side, 45.4, 1, 1)

      gfx.fillStyle(scar, 1)                   // 眼下淡淡的阴影
      gfx.fillRect(cx - 2 * side, 48.6, 3, 1)
    }

    eye(27, -1)
    eye(37, 1)

    // ---- 头顶的饰件：照着魈那身"紫 + 金 + 红"来的额饰 ----
    // 金底托 + 紫色莲瓣 + 中间一颗红玉 + 下头一截红流苏，两侧各一枚小金角
    gfx.fillStyle(0xd9a441, 1)
    gfx.fillPoints(
      [
        new Phaser.Math.Vector2(32, 32.6),
        new Phaser.Math.Vector2(38.4, 36.6),
        new Phaser.Math.Vector2(32, 40.8),
        new Phaser.Math.Vector2(25.6, 36.6),
      ],
      true
    )
    gfx.fillStyle(0x8a6fbf, 1)                 // 紫莲瓣
    gfx.fillPoints(
      [
        new Phaser.Math.Vector2(32, 33.8),
        new Phaser.Math.Vector2(36.8, 36.6),
        new Phaser.Math.Vector2(32, 39.6),
        new Phaser.Math.Vector2(27.2, 36.6),
      ],
      true
    )
    gfx.fillStyle(0xb79ae0, 1)                 // 莲瓣的受光半边
    gfx.fillTriangle(32, 33.8, 36.8, 36.6, 32, 36.6)

    gfx.fillStyle(0xd9a441, 1)                 // 两侧小金角
    gfx.fillTriangle(24.6, 35.8, 26.6, 33.4, 27.4, 36.6)
    gfx.fillTriangle(39.4, 35.8, 37.4, 33.4, 36.6, 36.6)

    // 这几处都是 2 像素级的细节，坐标必须落在整像素上，不然会被抗锯齿糊掉
    gfx.fillStyle(0xc0392b, 1)                 // 中间那颗红玉
    gfx.fillRect(31, 36, 2, 2)
    gfx.fillStyle(0xf0a08a, 1)
    gfx.fillRect(31, 36, 1, 1)

    gfx.fillStyle(0xc0392b, 1)                 // 垂下来的红流苏
    gfx.fillRect(31, 41, 2, 5)
    gfx.fillRect(30, 46, 4, 1)
    gfx.fillStyle(0xd9a441, 1)                 // 流苏头上的金珠
    gfx.fillRect(30, 40, 4, 1)

    // ---- 腰侧那具罗刹面具：侧面朝外（不是正脸），整块用几片棱面拼出体积。
    // 第一版太大（15×17），整块按 0.72 缩到 11×12 左右 ----
    const mask = [
      new Phaser.Math.Vector2(42.68, 44.12),   // 后脑
      new Phaser.Math.Vector2(44.84, 40.88),   // 角根
      new Phaser.Math.Vector2(46.28, 44.48),   // 眉骨
      new Phaser.Math.Vector2(52.76, 47.36),   // 鼻尖
      new Phaser.Math.Vector2(49.52, 49.16),   // 上唇
      new Phaser.Math.Vector2(50.96, 50.6),    // 獠牙
      new Phaser.Math.Vector2(48.44, 53.12),   // 下巴
      new Phaser.Math.Vector2(44.84, 52.76),   // 下颌
      new Phaser.Math.Vector2(42.32, 49.88),   // 后颈
    ]

    gfx.fillStyle(outline, 1)                  // 外描边：整体放大一圈
    gfx.fillPoints(
      mask
        .map((point) => {
          const dx = point.x - 47
          const dy = point.y - 47
          const len = Math.hypot(dx, dy) || 1

          return new Phaser.Math.Vector2(point.x + (dx / len) * 1, point.y + (dy / len) * 1)
        }),
      true
    )

    gfx.fillStyle(0x4fa085, 1)                 // 侧面主体
    gfx.fillPoints(mask, true)

    gfx.fillStyle(0x6fbf9c, 1)                 // 眉骨到鼻梁那一片受光面
    gfx.fillPoints(
      [
        new Phaser.Math.Vector2(44.84, 40.88),
        new Phaser.Math.Vector2(46.28, 44.48),
        new Phaser.Math.Vector2(52.76, 47.36),
        new Phaser.Math.Vector2(48.44, 45.56),
        new Phaser.Math.Vector2(45.56, 43.4),
      ],
      true
    )

    gfx.fillStyle(0x2f6f58, 1)                 // 下半张脸压暗
    gfx.fillPoints(
      [
        new Phaser.Math.Vector2(42.32, 49.88),
        new Phaser.Math.Vector2(44.84, 52.76),
        new Phaser.Math.Vector2(48.44, 53.12),
        new Phaser.Math.Vector2(49.52, 49.16),
        new Phaser.Math.Vector2(45.56, 48.44),
      ],
      true
    )

    gfx.fillStyle(outline, 1)                  // 侧面那只眼：斜着的三角形
    gfx.fillTriangle(45.92, 45.85, 49.88, 46.71, 46.64, 47.43)
    gfx.fillStyle(0xd8a24a, 1)
    gfx.fillTriangle(46.71, 46.28, 48.87, 46.71, 47.14, 47)

    gfx.fillStyle(0xe8e0c8, 1)                 // 嘴里露出的獠牙
    gfx.fillTriangle(49.59, 49.45, 50.46, 49.59, 49.88, 50.89)

    gfx.fillStyle(0xa04a4a, 1)                 // 眉上那一抹红
    gfx.fillPoints(
      [
        new Phaser.Math.Vector2(45.2, 41.67),
        new Phaser.Math.Vector2(47, 44.12),
        new Phaser.Math.Vector2(45.99, 44.41),
        new Phaser.Math.Vector2(44.41, 42.25),
      ],
      true
    )

    gfx.fillStyle(0x8fd8bb, 1)                 // 鼻梁上一条高光，做出瓷面的质感
    gfx.fillTriangle(46.64, 44.26, 52.04, 47.14, 46.42, 45.27)

    gfx.fillStyle(0x24564a, 1)                 // 几道磨痕
    gfx.fillRect(44, 51, 2, 1)
    gfx.fillRect(47, 52, 1, 1)
    gfx.fillRect(44, 46, 1, 1)

    gfx.fillStyle(0x6b4a2c, 1)                 // 系在腰带上的那根绳
    gfx.fillRect(43, 43, 1, 2)

    gfx.generateTexture('npc-xiao-slime', 64, 60)
    gfx.destroy()
  }

  // 望舒客栈的老板娘：一只史莱姆，头上包着米白头巾、腰间系深红围裙（纯画面 NPC）。
  // 和主角同一套画法（黑描边 + 平色本体），只是颜色挑了个温吞的米黄，一眼能和主角区分开
  private makeInnkeeper() {
    const gfx = this.add.graphics()

    const outline = 0x14141f
    const body = 0xcfb894
    const cloth = 0xe8e4d8
    const clothShade = 0x9a958a
    const apron = 0xa04a4a
    const apronDark = 0x7a3636

    // 身体
    gfx.fillStyle(outline, 1)
    gfx.fillEllipse(17, 17, 32, 25)
    gfx.fillStyle(body, 1)
    gfx.fillEllipse(17, 17, 30, 23)

    // 围裙：贴着身体下缘的一个梯形（跟着椭圆收），下面一道暗边，中间一个小口袋
    gfx.fillStyle(outline, 1)
    gfx.fillPoints(
      [
        new Phaser.Math.Vector2(2.6, 20.4),
        new Phaser.Math.Vector2(31.4, 20.4),
        new Phaser.Math.Vector2(23.2, 29.6),
        new Phaser.Math.Vector2(10.8, 29.6),
      ],
      true
    )
    gfx.fillStyle(apron, 1)
    gfx.fillPoints(
      [
        new Phaser.Math.Vector2(3.6, 21.2),
        new Phaser.Math.Vector2(30.4, 21.2),
        new Phaser.Math.Vector2(22.6, 28.8),
        new Phaser.Math.Vector2(11.4, 28.8),
      ],
      true
    )
    gfx.fillStyle(cloth, 1)                  // 围裙上沿那条白边
    gfx.fillPoints(
      [
        new Phaser.Math.Vector2(3.6, 21.2),
        new Phaser.Math.Vector2(30.4, 21.2),
        new Phaser.Math.Vector2(30.1, 22.6),
        new Phaser.Math.Vector2(3.9, 22.6),
      ],
      true
    )
    gfx.fillStyle(apronDark, 1)              // 小口袋
    gfx.fillRect(13, 24, 8, 4)
    gfx.fillStyle(0xc06a6a, 1)
    gfx.fillRect(13, 24, 8, 1)

    // 头巾：盖在头顶那一片，右边打个结
    gfx.fillStyle(outline, 1)
    gfx.fillPoints(
      [
        new Phaser.Math.Vector2(3.4, 14.4),
        new Phaser.Math.Vector2(6.8, 7.6),
        new Phaser.Math.Vector2(17, 3.4),
        new Phaser.Math.Vector2(27.2, 7.6),
        new Phaser.Math.Vector2(30.6, 14.4),
        new Phaser.Math.Vector2(25, 16.6),
        new Phaser.Math.Vector2(9, 16.6),
      ],
      true
    )
    gfx.fillStyle(cloth, 1)
    gfx.fillPoints(
      [
        new Phaser.Math.Vector2(4.6, 13.8),
        new Phaser.Math.Vector2(7.8, 8.2),
        new Phaser.Math.Vector2(17, 4.6),
        new Phaser.Math.Vector2(26.2, 8.2),
        new Phaser.Math.Vector2(29.4, 13.8),
        new Phaser.Math.Vector2(24.6, 15.6),
        new Phaser.Math.Vector2(9.4, 15.6),
      ],
      true
    )
    gfx.fillStyle(clothShade, 1)             // 头巾下沿的褶子
    gfx.fillPoints(
      [
        new Phaser.Math.Vector2(9.4, 14.6),
        new Phaser.Math.Vector2(24.6, 14.6),
        new Phaser.Math.Vector2(24.6, 15.6),
        new Phaser.Math.Vector2(9.4, 15.6),
      ],
      true
    )
    gfx.fillStyle(cloth, 1)                  // 右边那个结
    gfx.fillCircle(30, 12, 3)
    gfx.fillRect(27, 11, 5, 2)
    gfx.fillStyle(clothShade, 1)
    gfx.fillRect(28, 13, 4, 1)

    // 眼睛：两个圆点，温吞一点（比主角的稍微小一号）
    gfx.fillStyle(0x2a2a3a, 1)
    gfx.fillEllipse(11, 19, 4, 5)
    gfx.fillEllipse(23, 19, 4, 5)

    gfx.generateTexture('npc-innkeeper', 34, 30)
    gfx.destroy()
  }

  // 支线要凑的三样原料：糖（一小碗）、杏仁（三颗）、豆腐（一块，垫在叶子上）。
  // 都是 16 像素上下的小物件，躺在地上 / 摆在桌上，按 F 拾取
  private makeIngredientItems() {
    const outline = 0x14141f

    // 糖：青白小瓷碗 + 一碗堆起来的白糖
    const sugar = this.add.graphics()

    sugar.fillStyle(outline, 1)
    sugar.fillEllipse(8, 9, 15, 10)
    sugar.fillStyle(0xc8d4de, 1)
    sugar.fillEllipse(8, 9, 13, 8)
    sugar.fillStyle(outline, 1)
    sugar.fillEllipse(8, 7, 12, 7)
    sugar.fillStyle(0xffffff, 1)
    sugar.fillEllipse(8, 6.6, 10, 5.6)
    sugar.fillStyle(0xe4ecf2, 1)
    sugar.fillEllipse(8, 5, 7, 3)
    sugar.fillStyle(0xa8b4c0, 1)
    sugar.fillRect(3, 11, 10, 1)
    sugar.generateTexture('item-sugar', 16, 14)
    sugar.destroy()

    // 杏仁：三颗带尖的果仁
    const almond = this.add.graphics()

    almond.fillStyle(outline, 1)
    almond.fillEllipse(5, 9, 9, 9)
    almond.fillEllipse(11, 9.5, 9, 9)
    almond.fillEllipse(8, 4.5, 8, 8)
    almond.fillStyle(0xd8b483, 1)
    almond.fillEllipse(5, 9, 7, 7)
    almond.fillEllipse(11, 9.5, 7, 7)
    almond.fillEllipse(8, 4.5, 6, 6)
    almond.fillStyle(0xb08a56, 1)
    almond.fillRect(4, 8, 3, 1)
    almond.fillRect(10, 8.5, 3, 1)
    almond.fillRect(7, 3.5, 2, 1)
    almond.fillStyle(0xf0dcb4, 1)
    almond.fillRect(4, 7, 2, 1)
    almond.fillRect(10, 7.5, 2, 1)
    almond.generateTexture('item-almond', 16, 14)
    almond.destroy()

    // 豆腐：一块方方正正的白豆腐，垫在一片叶子上
    const tofu = this.add.graphics()

    tofu.fillStyle(0x2f5a35, 1)              // 叶子
    tofu.fillEllipse(8, 13, 15, 6)
    tofu.fillStyle(0x4a7a4a, 1)
    tofu.fillEllipse(8, 12.6, 13, 4.6)
    tofu.fillStyle(0x8fbf7a, 1)
    tofu.fillRect(3, 12, 10, 1)

    tofu.fillStyle(outline, 1)               // 豆腐块
    tofu.fillRect(2.6, 2.6, 11, 10)
    tofu.fillStyle(0xf4f2e8, 1)
    tofu.fillRect(3.4, 3.4, 9.4, 8.4)
    tofu.fillStyle(0xffffff, 1)
    tofu.fillRect(3.4, 3.4, 9.4, 2)
    tofu.fillStyle(0xd6d3c4, 1)
    tofu.fillRect(3.4, 10, 9.4, 1.8)
    tofu.fillStyle(0xc4c1b2, 1)
    tofu.fillRect(8, 5.4, 1, 4.6)
    tofu.generateTexture('item-tofu', 16, 16)
    tofu.destroy()

    // 做好的菜：白瓷浅盘 + 一层琥珀糖水 + 三块奶白豆腐 + 两片杏仁
    const dish = this.add.graphics()

    dish.fillStyle(outline, 1)
    dish.fillEllipse(9, 10, 17, 8)
    dish.fillStyle(0xdfe6ec, 1)
    dish.fillEllipse(9, 9.6, 15, 6.4)
    dish.fillStyle(0xffffff, 1)
    dish.fillEllipse(9, 9, 13, 5)
    dish.fillStyle(0xd8a24a, 1)              // 糖水
    dish.fillEllipse(9, 9, 11, 4)
    dish.fillStyle(0xf8f6ee, 1)              // 豆腐块
    dish.fillRect(4, 6, 4, 4)
    dish.fillRect(10, 6, 4, 4)
    dish.fillRect(7, 8, 4, 4)
    dish.fillStyle(0xd8b483, 1)              // 杏仁片
    dish.fillRect(6, 5, 2, 1)
    dish.fillRect(11, 7, 2, 1)
    dish.fillStyle(0xffffff, 1)
    dish.fillRect(5, 6, 1, 1)
    dish.fillRect(11, 6, 1, 1)
    dish.generateTexture('item-almond-tofu', 18, 14)
    dish.destroy()
  }

  // 第十关送仙典仪的三样供品（24x22）：夜泊石、霓裳花、永生香
  private makeRitualMaterials() {
    const P = (x: number, y: number) => new Phaser.Math.Vector2(x, y)

    // 夜泊石：深蓝晶簇，中间一根最高，两边各一根斜晶
    const noctilocus = this.add.graphics()
    noctilocus.fillStyle(0x2a2118, 0.3)
    noctilocus.fillEllipse(12, 21, 20, 5)
    noctilocus.fillStyle(0x10203a, 1)
    noctilocus.fillPoints([P(12, 1), P(18, 10), P(17, 20), P(7, 20), P(6, 10)], true)
    noctilocus.fillStyle(0x2e5a8a, 1)
    noctilocus.fillPoints([P(12, 3), P(16, 11), P(15, 19), P(8, 19), P(8, 11)], true)
    noctilocus.fillStyle(0x6fa9d8, 1)
    noctilocus.fillPoints([P(12, 4), P(14, 11), P(13, 18), P(10, 13)], true)
    noctilocus.fillStyle(0x244a74, 1)
    noctilocus.fillPoints([P(6, 8), P(10, 14), P(9, 20), P(3, 20), P(3, 13)], true)
    noctilocus.fillStyle(0x3a6a9a, 1)
    noctilocus.fillPoints([P(18, 10), P(21, 15), P(20, 20), P(15, 20), P(15, 13)], true)
    noctilocus.fillStyle(0xa8d8f0, 0.8)
    noctilocus.fillRect(11, 5, 2, 4)
    noctilocus.generateTexture('item-noctilocus', 24, 22)
    noctilocus.destroy()

    // 霓裳花：一枝粉花，绿叶托底
    const silk = this.add.graphics()
    silk.fillStyle(0x2f5a35, 1)
    silk.fillRect(11, 9, 2, 12)
    silk.fillEllipse(6, 17, 10, 5)
    silk.fillEllipse(18, 15, 10, 5)
    silk.fillStyle(0x5f8a3a, 1)
    silk.fillEllipse(6, 16.5, 8, 3.4)
    silk.fillEllipse(18, 14.5, 8, 3.4)
    silk.fillStyle(0x8a2f4a, 1)
    for (const [x, y] of [[12, 4], [7, 7], [17, 7], [8, 11], [16, 11]]) {
      silk.fillEllipse(x, y, 7, 6)
    }
    silk.fillStyle(0xd45a7a, 1)
    for (const [x, y] of [[12, 5], [8, 7.5], [16, 7.5], [9, 10.5], [15, 10.5]]) {
      silk.fillEllipse(x, y, 5, 4.2)
    }
    silk.fillStyle(0xf08aa0, 1)
    silk.fillEllipse(10, 6, 2, 2)
    silk.fillStyle(0xffd54f, 1)
    silk.fillCircle(12, 8, 2.2)
    silk.fillStyle(0xffe9a8, 1)
    silk.fillCircle(11.4, 7.4, 0.9)
    silk.generateTexture('item-silkflower', 24, 22)
    silk.destroy()

    // 永生香：小铜香炉 + 三炷香 + 一缕烟
    const incense = this.add.graphics()
    incense.fillStyle(0x2a2118, 0.3)
    incense.fillEllipse(12, 21, 18, 5)

    incense.fillStyle(0x5a4a35, 1)
    incense.fillRect(9, 4, 1, 9)
    incense.fillRect(12, 2, 1, 11)
    incense.fillRect(15, 4, 1, 9)
    incense.fillStyle(0xd9a441, 1)
    incense.fillRect(9, 3, 1, 2)
    incense.fillRect(12, 1, 1, 2)
    incense.fillRect(15, 3, 1, 2)

    incense.fillStyle(0x3f2c1c, 1)
    incense.fillEllipse(12, 16, 18, 8)
    incense.fillStyle(0x8a6f3c, 1)
    incense.fillEllipse(12, 14.5, 17, 6)
    incense.fillStyle(0xffd54f, 1)
    incense.fillRect(4, 14, 16, 1)
    incense.fillRect(9, 19, 6, 1)

    incense.lineStyle(1, 0xd9e4e8, 0.45)
    incense.beginPath()
    incense.moveTo(12, 1)
    incense.lineTo(10, -3)
    incense.lineTo(13, -6)
    incense.strokePath()

    incense.generateTexture('item-incense', 24, 22)
    incense.destroy()
  }

  // 望舒客栈一楼右侧那棵景观树：不是樱花，是本地（璃月＝中国）的「金桂」。
  // 220×250（约一层楼高）。叶子是深绿革质、高光偏黄（有蜡质的油光）；
  // 花是几颗一串簇生在枝上、被叶子遮掉一部分，远看是"绿丛里透出点点金"
  private makeOsmanthusTree() {
    const gfx = this.add.graphics()

    // 树干：根盘外扩、往上收细，右边留一条暗面
    gfx.fillStyle(0x6b4a2c, 1)
    gfx.fillRect(96, 230, 30, 20)           // 根盘
    gfx.fillRect(101, 170, 20, 66)          // 下段
    gfx.fillRect(104, 118, 14, 56)          // 上段
    gfx.fillStyle(0x5a3c22, 1)
    gfx.fillRect(101, 170, 6, 66)
    gfx.fillRect(104, 118, 4, 56)

    // 四根主枝：从树干顶斜着伸进树冠
    gfx.fillStyle(0x6b4a2c, 1)
    gfx.fillTriangle(118, 142, 168, 104, 176, 120)
    gfx.fillTriangle(104, 142, 52, 100, 44, 116)
    gfx.fillTriangle(114, 122, 142, 88, 152, 102)
    gfx.fillTriangle(110, 122, 78, 86, 68, 100)

    // 树冠分三层压：深绿铺底 → 中绿 → 亮绿高光（往左上偏，当受光面）
    const deep: [number, number, number][] = [
      [110, 72, 58],
      [60, 98, 42],
      [160, 94, 44],
      [84, 44, 40],
      [142, 42, 38],
      [32, 120, 30],
      [186, 116, 30],
      [110, 110, 46],
    ]
    const mid: [number, number, number][] = [
      [104, 66, 46],
      [56, 92, 32],
      [156, 88, 34],
      [86, 40, 30],
      [138, 38, 28],
      [36, 114, 22],
      [182, 110, 24],
    ]

    gfx.fillStyle(0x33512c, 1)
    deep.forEach(([x, y, r]) => gfx.fillCircle(x, y, r))

    gfx.fillStyle(0x466b35, 1)
    mid.forEach(([x, y, r]) => gfx.fillCircle(x, y, r))

    // 亮绿高光：往左上偏一点，但颜色要偏黄不能偏冷 ——
    // 金桂是革质叶、表面有层蜡，晒到是"黄绿的油光"
    gfx.fillStyle(0x6f9440, 1)
    mid.forEach(([x, y, r]) => gfx.fillCircle(x - 6, y - 8, r * 0.55))

    // 桂花：不是均匀撒点，是几颗一串地簇生在枝上（顺着枝条方向排成小串）
    const sprays: [number, number, number, number, number][] = [
      // x, y, 每串几颗, 横向步长, 纵向步长
      [44, 84, 4, 7, -3],
      [92, 32, 3, 8, 2],
      [148, 56, 4, 7, 3],
      [174, 92, 3, 6, 4],
      [36, 116, 3, 8, 1],
      [108, 106, 4, 8, 2],
      [156, 122, 3, 7, 3],
      [76, 92, 3, 7, 3],
    ]

    gfx.fillStyle(0xf2c14e, 1)
    sprays.forEach(([x, y, n, dx, dy]) => {
      for (let i = 0; i < n; i++) gfx.fillCircle(x + dx * i, y + dy * i, 4)
    })

    gfx.fillStyle(0xffd97a, 1)
    sprays.forEach(([x, y, n, dx, dy]) => {
      for (let i = 0; i < n; i++) gfx.fillCircle(x + dx * i - 1, y + dy * i - 2, 2)
    })

    gfx.fillStyle(0xd99a2b, 1)
    sprays.forEach(([x, y, n, dx, dy]) => {
      for (let i = 0; i < n; i++) gfx.fillCircle(x + dx * i + 3, y + dy * i + 3, 2)
    })

    // 再压几片叶子回来：每串花只盖掉头一两颗，剩下的从叶缝里透出来
    const cover: [number, number, number][] = [
      [40, 78, 13],
      [86, 22, 14],
      [142, 48, 14],
      [168, 86, 12],
      [32, 112, 12],
      [102, 100, 13],
      [150, 116, 12],
      [70, 86, 12],
    ]

    gfx.fillStyle(0x3f6234, 1)
    cover.forEach(([x, y, r]) => gfx.fillCircle(x, y, r))
    gfx.fillStyle(0x527a3a, 1)
    cover.forEach(([x, y, r]) => gfx.fillCircle(x - 4, y - 5, r * 0.5))

    // 叶面的蜡质反光：几个小亮点，别铺满
    gfx.fillStyle(0x8fb055, 1)

    for (const [x, y] of [[52, 22], [104, 14], [152, 28], [32, 76], [178, 66], [90, 62]]) {
      gfx.fillCircle(x, y, 3)
    }

    gfx.generateTexture('osmanthus-tree', 220, 250)
    gfx.destroy()
  }

  // 花瓣：飘花用的小瓣。
  // 画成白色的，运行时按 PETAL_COLORS setTint 出深浅不一的金桂色
  private makePetal() {
    const gfx = this.add.graphics()

    gfx.fillStyle(0xffffff, 1)
    gfx.fillEllipse(3, 2.4, 5.4, 3.8)
    gfx.fillStyle(0xd6d6d6, 1)              // 花瓣根部压暗一点，染色后是深浅两层
    gfx.fillEllipse(3, 2.9, 2.2, 1.4)

    gfx.generateTexture('petal', 6, 5)
    gfx.destroy()
  }

  private makeInnBed() {
    const gfx = this.add.graphics()

    gfx.fillStyle(0x6b4a2c, 1)              // 床架
    gfx.fillRect(0, 16, 44, 8)
    gfx.fillStyle(0x8a6034, 1)              // 床头板
    gfx.fillRect(0, 6, 5, 18)
    gfx.fillStyle(0xa8794a, 1)
    gfx.fillRect(0, 6, 5, 2)
    gfx.fillStyle(0xd9cfc0, 1)              // 褥子
    gfx.fillRect(5, 13, 39, 5)
    gfx.fillStyle(0xf2ece2, 1)              // 枕头
    gfx.fillRect(7, 8, 12, 6)
    gfx.fillStyle(0x7a4c28, 1)              // 被子
    gfx.fillRect(21, 12, 23, 8)
    gfx.fillStyle(0x9a6a3c, 1)
    gfx.fillRect(21, 12, 23, 2)
    gfx.fillStyle(0x5f4224, 1)              // 床腿
    gfx.fillRect(2, 24, 3, 2)
    gfx.fillRect(39, 24, 3, 2)

    gfx.generateTexture('inn-bed', 44, 26)
    gfx.destroy()
  }

  private makeInnWall() {
    // 一格 300×300：横着平铺大约每 300 像素一扇窗（原来 120 太频繁），
    // 竖着不重复（楼层高度 210~250，一格里只出现一扇窗）
    const size = 300
    const gfx = this.add.graphics()

    gfx.fillStyle(0x5f4224, 1)              // 墙板底色
    gfx.fillRect(0, 0, size, size)
    gfx.fillStyle(0x6b4a2c, 1)
    gfx.fillRect(0, 0, size, 4)
    gfx.fillRect(0, size - 4, size, 4)

    // 竖向木板缝
    gfx.fillStyle(0x4a3320, 0.7)

    for (let x = 20; x < size; x += 20) {
      gfx.fillRect(x, 0, 2, size)
    }

    // 横梁
    gfx.fillStyle(0x3f2c1c, 1)
    gfx.fillRect(0, 0, size, 2)
    gfx.fillRect(0, size - 2, size, 2)

    // 格子窗：木框 + 深色玻璃 + 3×3 木格
    const winW = 44
    const winH = 40
    const winX = (size - winW) / 2
    const winY = (size - winH) / 2

    gfx.fillStyle(0x8a6034, 1)
    gfx.fillRect(winX - 3, winY - 3, winW + 6, winH + 6)
    gfx.fillStyle(0x1a1a2e, 1)
    gfx.fillRect(winX, winY, winW, winH)
    gfx.fillStyle(0xffd9a0, 0.18)           // 窗里透一点暖光
    gfx.fillRect(winX, winY, winW, winH)
    gfx.fillStyle(0x8a6034, 1)

    for (let i = 1; i < 3; i++) {
      gfx.fillRect(winX, winY + (winH / 3) * i, winW, 2)
      gfx.fillRect(winX + (winW / 3) * i, winY, 2, winH)
    }

    gfx.generateTexture('inn-wall', size, size)
    gfx.destroy()
  }

  private makeInnDining() {
    const table = this.add.graphics()

    table.fillStyle(0x8a6034, 1)            // 桌面
    table.fillRect(0, 4, 32, 5)
    table.fillStyle(0xa8794a, 1)            // 桌面高光
    table.fillRect(0, 4, 32, 2)
    table.fillStyle(0x5f4224, 1)            // 四条腿
    table.fillRect(2, 9, 3, 12)
    table.fillRect(27, 9, 3, 12)
    table.fillRect(9, 9, 3, 8)
    table.fillRect(20, 9, 3, 8)
    table.fillStyle(0x6a4c2e, 1)            // 腿间横撑
    table.fillRect(5, 16, 22, 2)

    table.generateTexture('inn-table', 32, 22)
    table.destroy()

    const stool = this.add.graphics()

    stool.fillStyle(0x8a6034, 1)            // 凳面
    stool.fillEllipse(7, 4, 14, 7)
    stool.fillStyle(0xa8794a, 1)
    stool.fillEllipse(7, 3, 10, 4)
    stool.fillStyle(0x5f4224, 1)            // 凳腿
    stool.fillRect(2, 6, 2, 5)
    stool.fillRect(10, 6, 2, 5)

    stool.generateTexture('inn-stool', 14, 11)
    stool.destroy()
  }

  private makeInnFurniture() {
    const cab = this.add.graphics()          // 木格柜：柜体 + 3×4 格子窗

    cab.fillStyle(0x6b4a2c, 1)
    cab.fillRect(0, 0, 40, 44)
    cab.fillStyle(0x8a6034, 1)
    cab.fillRect(0, 0, 40, 3)
    cab.fillStyle(0x3f2c1c, 1)
    cab.fillRect(3, 4, 34, 36)
    cab.fillStyle(0x8a6034, 1)

    for (let i = 1; i < 3; i++) {
      cab.fillRect(3, 4 + (36 / 3) * i, 34, 2)
    }

    for (let i = 1; i < 4; i++) {
      cab.fillRect(3 + (34 / 4) * i, 4, 2, 36)
    }

    cab.generateTexture('inn-cabinet', 40, 44)
    cab.destroy()

    const stove = this.add.graphics()        // 砖灶 + 灶上的锅

    stove.fillStyle(0x7a5644, 1)
    stove.fillRect(0, 8, 48, 22)
    stove.fillStyle(0x8f6a54, 1)

    for (let y = 14; y < 30; y += 6) {
      stove.fillRect(0, y, 48, 1)
    }

    for (let x = 8; x < 48; x += 12) {
      stove.fillRect(x, 8, 1, 22)
    }

    stove.fillStyle(0x4a3320, 1)
    stove.fillRect(16, 20, 16, 10)
    stove.fillStyle(0xd9a441, 0.8)
    stove.fillRect(18, 24, 12, 6)
    stove.fillStyle(0x8a6034, 1)
    stove.fillRect(0, 6, 48, 3)
    stove.fillStyle(0x5f4224, 1)
    stove.fillEllipse(24, 4, 30, 12)
    stove.fillStyle(0x3f2c1c, 1)
    stove.fillEllipse(24, 2, 24, 8)
    stove.generateTexture('inn-stove', 48, 30)
    stove.destroy()

    const wood = this.add.graphics()         // 柴堆：六根圆木堆成小三角
    const logs = [
      [0, 12],
      [10, 12],
      [20, 12],
      [5, 6],
      [15, 6],
      [10, 0],
    ]

    logs.forEach(([x, y]) => {
      wood.fillStyle(0x6a4c2e, 1)
      wood.fillCircle(x + 6, y + 6, 6)
      wood.fillStyle(0x8a6a44, 1)
      wood.fillCircle(x + 6, y + 6, 4)
      wood.fillStyle(0x4a3320, 1)
      wood.fillCircle(x + 6, y + 6, 2)
    })

    wood.generateTexture('inn-wood', 34, 26)
    wood.destroy()

    const pot = this.add.graphics()          // 吊锅：黑锅 + 吊钩横杆

    pot.fillStyle(0x3f2c1c, 1)
    pot.fillRect(0, 0, 16, 2)
    pot.fillRect(7, 2, 2, 4)
    pot.fillStyle(0x555566, 1)
    pot.fillEllipse(8, 12, 14, 12)
    pot.fillStyle(0x3f3f4a, 1)
    pot.fillEllipse(8, 9, 14, 6)
    pot.generateTexture('inn-pot', 16, 20)
    pot.destroy()
  }

  private makeInnFront() {
    const width = 76
    const height = 30
    const gfx = this.add.graphics()

    gfx.fillStyle(0x6b4a2c, 1)              // 柜身
    gfx.fillRect(0, 8, width, height - 8)

    gfx.fillStyle(0x8a6034, 1)              // 台面
    gfx.fillRect(0, 6, width, 4)
    gfx.fillStyle(0xa8794a, 1)              // 台面高光
    gfx.fillRect(0, 6, width, 2)

    for (let x = 6; x < width - 4; x += 14) {
      gfx.fillStyle(0x5a3c22, 1)            // 柜身分格
      gfx.fillRect(x, 12, 10, height - 16)
      gfx.fillStyle(0x7a4c28, 1)            // 格子里的横板
      gfx.fillRect(x, 12, 10, 2)
    }

    gfx.fillStyle(0x4a3320, 1)              // 台面上的小算盘
    gfx.fillRect(54, 2, 14, 4)
    gfx.fillStyle(0xd9a441, 1)

    for (let i = 0; i < 6; i++) {
      gfx.fillRect(55 + i * 2, 2, 1, 3)
    }

    gfx.generateTexture('inn-front', width, height)
    gfx.destroy()
  }

  private makeWaterWheel() {
    const size = 96
    const center = size / 2
    const gfx = this.add.graphics()

    // 外圈（做成有轮叶的大水车）
    gfx.fillStyle(0x6f4423, 1)
    gfx.fillCircle(center, center, center - 1)
    gfx.fillStyle(0x8a6034, 1)
    gfx.fillCircle(center, center, center - 7)
    gfx.fillStyle(0x2f6f8f, 0.5)           // 中心透出一点"水"
    gfx.fillCircle(center, center, center - 17)

    // 八根辐条 + 轮叶（辐条末端那几片小桨）
    for (let i = 0; i < 8; i++) {
      const angle = (Math.PI * 2 * i) / 8
      const x = center + Math.cos(angle) * (center - 14)
      const y = center + Math.sin(angle) * (center - 14)

      gfx.fillStyle(0x5f4224, 1)
      gfx.fillRect(
        Math.min(x, center) - 2,
        Math.min(y, center) - 2,
        Math.abs(x - center) + 4,
        Math.abs(y - center) + 4
      )

      // 轮叶：贴着外圈的一小片深色桨
      const px = center + Math.cos(angle) * (center - 3)
      const py = center + Math.sin(angle) * (center - 3)

      gfx.fillStyle(0x3f2c1c, 1)
      gfx.fillRect(px - 6, py - 6, 12, 12)
      gfx.fillStyle(0x9adcf0, 0.35)        // 桨面上挂着一线水光
      gfx.fillRect(px - 6, py - 6, 12, 3)
    }

    // 中心轴
    gfx.fillStyle(0x3f2c1c, 1)
    gfx.fillCircle(center, center, 10)
    gfx.fillStyle(0xa8794a, 1)
    gfx.fillCircle(center, center, 5)

    gfx.generateTexture('water-wheel', size, size)
    gfx.destroy()
  }

  // 斜枝：一共四种形状，都是左边粗、右边细，横着画；
  // 用的时候 setAngle 转成斜的、左边的 setFlipX 翻过来
  //   0 = 普通枝（主枝 + 两根小杈）
  //   1 = 分叉枝（中段往上岔出一条）
  //   2 = 断枝（短、粗，右端一个斜切口）
  //   3 = 细枝（细长，挑几根小杈）
  private makeTreeBranches() {
    this.makeBranchShape('tree-branch', 140, 26, 0)
    this.makeBranchShape('tree-branch-fork', 140, 36, 1)
    this.makeBranchShape('tree-branch-short', 74, 24, 2)
    this.makeBranchShape('tree-branch-twig', 120, 18, 3)
  }

  private makeBranchShape(key: string, width: number, height: number, kind: number) {
    const gfx = this.add.graphics()
    const thickness = kind === 3 ? 9 : kind === 2 ? 15 : 19

    // 主体：左端粗头往右收细，上沿受光、下沿压暗
    for (let x = 0; x < width; x++) {
      const t = x / (width - 1)
      const halfHeight = (thickness / 2) * (1 - t * 0.72)
      const y0 = height / 2 - halfHeight

      gfx.fillStyle(0x6a4c2e, 1)
      gfx.fillRect(x, y0, 1, halfHeight * 2)
      gfx.fillStyle(0x8a6a44, 1)
      gfx.fillRect(x, y0, 1, 3)
      gfx.fillStyle(0x3f2c1c, 1)
      gfx.fillRect(x, y0 + halfHeight * 2 - 3, 1, 3)
    }

    // 普通枝：主枝上挑两根小杈
    if (kind === 0) {
      ;[0.42, 0.72].forEach((at, index) => {
        const x0 = Math.round(width * at)

        for (let i = 0; i < 16; i++) {
          const t = i / 15
          const x = x0 + i
          const dir = index % 2 === 0 ? -1 : 1
          const y = height / 2 + dir * t * (height / 2 - 4)

          gfx.fillStyle(0x6a4c2e, 1)
          gfx.fillRect(x, y - 2, 6, 4)
        }
      })
    }

    // 分叉枝：中段往上岔出一条
    if (kind === 1) {
      const forkStart = Math.round(width * 0.34)

      for (let i = 0; i < 48; i++) {
        const t = i / 47
        const x = forkStart + i
        const y = height / 2 - t * (height / 2 - 4)
        const half = 7 * (1 - t * 0.65)

        gfx.fillStyle(0x6a4c2e, 1)
        gfx.fillRect(x, y - half, 7, half * 2)
        gfx.fillStyle(0x8a6a44, 1)
        gfx.fillRect(x, y - half, 7, 2)
      }
    }

    // 细枝：挑三根小杈，左右交替
    if (kind === 3) {
      ;[0.3, 0.55, 0.78].forEach((at, index) => {
        const x0 = Math.round(width * at)

        for (let i = 0; i < 16; i++) {
          const t = i / 15
          const x = x0 + i
          const dir = index % 2 === 0 ? -1 : 1
          const y = height / 2 + dir * t * (height / 2 - 2)

          gfx.fillStyle(0x6a4c2e, 1)
          gfx.fillRect(x, y - 1, 5, 3)
        }
      })
    }

    // 断枝：右端留一个斜切口（亮面 + 深色边）
    if (kind === 2) {
      gfx.fillStyle(0x9a7444, 1)
      gfx.fillRect(width - 9, height / 2 - 6, 9, 5)
      gfx.fillStyle(0x3f2c1c, 1)
      gfx.fillRect(width - 9, height / 2 + 1, 9, 3)
    }

    // 几道树皮纹
    gfx.fillStyle(0x4a3320, 0.55)
    gfx.fillRect(Math.round(width * 0.18), height / 2 - 4, 26, 2)
    gfx.fillRect(Math.round(width * 0.46), height / 2 + 2, 20, 2)

    gfx.generateTexture(key, width, height)
    gfx.destroy()
  }

  // 望舒客栈的琉璃灯笼：暖黄灯身 + 深红上下箍 + 顶端一截挂绳
  private makeLantern() {
    const gfx = this.add.graphics()

    gfx.fillStyle(0x5f4224, 1)          // 挂绳
    gfx.fillRect(4, 0, 2, 3)

    gfx.fillStyle(0x8c2f2f, 1)          // 上下箍
    gfx.fillRect(1, 3, 8, 2)
    gfx.fillRect(1, 11, 8, 2)

    gfx.fillStyle(0xffb347, 1)          // 灯身
    gfx.fillRect(1, 5, 8, 6)

    gfx.fillStyle(0xffe08a, 1)          // 灯芯：中间更亮的一道
    gfx.fillRect(3, 6, 4, 4)

    gfx.generateTexture('lantern', 10, 14)
    gfx.destroy()
  }

  // 木桶：桶身 + 顶面亮圈 + 两道深箍 + 左侧压暗
  private makeBarrel() {
    const gfx = this.add.graphics()

    gfx.fillStyle(0x8a6034, 1)
    gfx.fillRect(0, 2, 12, 12)

    gfx.fillStyle(0xa8794a, 1)          // 顶面（俯视那一圈亮色）
    gfx.fillRect(1, 1, 10, 3)

    gfx.fillStyle(0x5f4224, 1)          // 两道深箍
    gfx.fillRect(0, 5, 12, 2)
    gfx.fillRect(0, 10, 12, 2)

    gfx.fillStyle(0x74512c, 1)          // 左侧压暗，做出圆柱感
    gfx.fillRect(0, 2, 2, 12)

    gfx.generateTexture('barrel', 12, 14)
    gfx.destroy()
  }

  // 「透视圈」用的椭圆贴图：横着长一点（贴着史莱姆的身形），
  // 从中心到边缘一层层叠 alpha，边缘几乎为 0 —— 所以擦出来是带渐变的透过，不是硬边。
  // 以后做「洞内没有光源」的视野限制也能直接用这张
  private makeRevealBlob() {
    const width = 200
    const height = 168
    const steps = 24
    const maxErase = 0.8
    const gfx = this.add.graphics()

    // 由外向内一层层画：每层只叠一点点，越靠中心叠得越多
    for (let i = steps; i >= 1; i--) {
      const t = i / steps

      gfx.fillStyle(0xffffff, maxErase / steps)
      gfx.fillEllipse(width / 2, height / 2, width * t, height * t)
    }

    gfx.generateTexture('reveal-blob', width, height)
    gfx.destroy()
  }

  private makeWoodPlank() {
    const gfx = this.add.graphics()

    gfx.fillStyle(0x8a6034, 1)
    gfx.fillRect(0, 0, 16, 16)
    gfx.fillStyle(0xa8794a, 1)
    gfx.fillRect(0, 0, 16, 2)
    gfx.fillStyle(0x5f4224, 1)
    gfx.fillRect(0, 13, 16, 3)
    gfx.fillRect(0, 0, 1, 16)
    gfx.fillStyle(0x74512c, 1)
    gfx.fillRect(3, 6, 6, 1)
    gfx.fillRect(10, 9, 4, 1)
    gfx.fillRect(5, 11, 5, 1)
    gfx.fillStyle(0x4a3418, 1)
    gfx.fillRect(2, 3, 1, 1)
    gfx.fillRect(13, 3, 1, 1)

    gfx.generateTexture('wood-plank', 16, 16)
    gfx.destroy()
  }

  // 古树主干的一段树皮：140 宽、160 高，可以竖着平铺。
  // 横向做「两边暗、中间亮」的渐变，柱子才有体积感；再撒几道树皮纹、两个树瘤和苔藓
  private makeTreeTrunk() {
    const gfx = this.add.graphics()
    const width = 220
    const height = 160

    // 圆柱明暗：中间亮、两边压暗。宽度做成和主杆一样（220），平铺时左右不会有接缝
    for (let x = 0; x < width; x++) {
      const t = (x / (width - 1) - 0.5) * 2      // -1 ~ 1
      const shade = 1 - t * t * 0.4 + Math.sin(x * 0.55) * 0.02   // 中间 1，两边 0.6 左右

      gfx.fillStyle(
        Phaser.Display.Color.GetColor(
          Math.round(0x7a * shade),
          Math.round(0x5a * shade),
          Math.round(0x38 * shade)
        ),
        1
      )
      gfx.fillRect(x, 0, 1, height)
    }

    // 受光面：中偏左一条窄亮带
    gfx.fillStyle(0x9a7444, 0.32)
    gfx.fillRect(Math.round(width * 0.3), 0, 10, height)
    gfx.fillStyle(0x9a7444, 0.16)
    gfx.fillRect(Math.round(width * 0.43), 0, 6, height)

    // 树皮纹：短竖纹，错开分布（都不跨 y=0 / y=160，平铺起来没接缝）
    gfx.fillStyle(0x3f2c1c, 0.5)

    for (let index = 0; index < 40; index++) {
      const x = 4 + ((index * 53) % (width - 8))
      const y = (index * 37) % (height - 30)

      gfx.fillRect(x, y, 2, 10 + (index % 4) * 7)
    }

    // 深色裂纹：带一点分叉，树皮才有层次
    gfx.fillStyle(0x2a1c10, 0.55)

    for (let index = 0; index < 10; index++) {
      const x = 10 + ((index * 71) % (width - 22))
      const y = (index * 61) % (height - 42)

      gfx.fillRect(x, y, 2, 22 + (index % 3) * 10)
      gfx.fillRect(x - 2, y + 8, 2, 10)
    }

    // 两处树瘤
    gfx.fillStyle(0x4a3320, 0.9)
    gfx.fillEllipse(52, 44, 26, 34)
    gfx.fillStyle(0x3a2718, 1)
    gfx.fillEllipse(52, 44, 14, 20)
    gfx.fillStyle(0x4a3320, 0.9)
    gfx.fillEllipse(168, 116, 20, 26)

    // 苔藓：贴着两侧和几道缝长
    gfx.fillStyle(0x5f7a3c, 0.65)
    gfx.fillRect(150, 18, 40, 6)
    gfx.fillRect(20, 120, 46, 5)
    gfx.fillRect(96, 84, 28, 4)
    gfx.fillStyle(0x6f8c46, 0.5)
    gfx.fillRect(156, 24, 22, 3)
    gfx.fillRect(28, 125, 24, 3)

    gfx.generateTexture('tree-trunk', width, height)
    gfx.destroy()
  }
  
  // 村里的破屋：石基 + 木板墙，屋顶塌了一半，门洞黑着，墙根长苔
  private makeRuinHouse() {
    const gfx = this.add.graphics()

    // 石基
    gfx.fillStyle(0x6b6257, 1)
    gfx.fillRect(2, 52, 72, 12)
    gfx.fillStyle(0x574f45, 1)
    gfx.fillRect(2, 60, 72, 4)

    // 木墙
    gfx.fillStyle(0x6a4f34, 1)
    gfx.fillRect(6, 26, 64, 28)
    gfx.fillStyle(0x533d28, 1)

    for (let index = 0; index < 8; index++) {
      gfx.fillRect(6 + index * 8, 26, 1, 28)
    }

    gfx.fillStyle(0x7c5e40, 1)
    gfx.fillRect(6, 26, 64, 2)

    // 屋顶：左边还立着，右边只剩几根椽子
    gfx.fillStyle(0x8a4a38, 1)
    gfx.fillPoints(
      [
        new Phaser.Math.Vector2(0, 26),
        new Phaser.Math.Vector2(38, 8),
        new Phaser.Math.Vector2(38, 26),
      ],
      true
    )
    gfx.fillStyle(0xa85c46, 1)
    gfx.fillRect(4, 24, 30, 2)
    gfx.fillStyle(0x533d28, 1)
    gfx.fillRect(42, 16, 3, 10)
    gfx.fillRect(52, 20, 3, 6)
    gfx.fillRect(62, 14, 3, 12)

    // 门洞和窗
    gfx.fillStyle(0x241a12, 1)
    gfx.fillRect(32, 38, 14, 16)
    gfx.fillRect(12, 32, 10, 9)
    gfx.fillStyle(0x3a2a1c, 1)
    gfx.fillRect(32, 36, 14, 2)
    gfx.fillRect(16, 32, 1, 9)
    gfx.fillRect(12, 36, 10, 1)

    // 裂缝和苔
    gfx.fillStyle(0x3f2f1f, 1)
    gfx.fillRect(24, 30, 1, 10)
    gfx.fillRect(56, 34, 1, 14)
    gfx.fillStyle(0x5f7a3c, 1)
    gfx.fillRect(4, 50, 8, 3)
    gfx.fillRect(58, 50, 12, 3)
    gfx.fillRect(28, 52, 4, 2)

    gfx.generateTexture('ruin-house', 76, 64)
    gfx.destroy()
  }

  // 彻底塌掉的那种：只剩半截墙，顶上参差不齐，中间破了个洞
  private makeRuinHouseBroken() {
    const gfx = this.add.graphics()

    // 参差的墙头
    gfx.fillStyle(0x6a4f34, 1)
    gfx.fillPoints(
      [
        new Phaser.Math.Vector2(4, 44),
        new Phaser.Math.Vector2(4, 12),
        new Phaser.Math.Vector2(14, 7),
        new Phaser.Math.Vector2(24, 14),
        new Phaser.Math.Vector2(34, 5),
        new Phaser.Math.Vector2(46, 12),
        new Phaser.Math.Vector2(58, 6),
        new Phaser.Math.Vector2(64, 14),
        new Phaser.Math.Vector2(64, 44),
      ],
      true
    )

    gfx.fillStyle(0x533d28, 1)

    for (let index = 0; index < 8; index++) {
      gfx.fillRect(6 + index * 8, 16, 1, 26)
    }

    // 破洞
    gfx.fillStyle(0x241a12, 1)
    gfx.fillRect(20, 26, 16, 12)
    gfx.fillRect(40, 22, 10, 8)

    // 石基
    gfx.fillStyle(0x6b6257, 1)
    gfx.fillRect(2, 36, 64, 8)
    gfx.fillStyle(0x574f45, 1)
    gfx.fillRect(2, 41, 64, 3)

    // 苔
    gfx.fillStyle(0x5f7a3c, 1)
    gfx.fillRect(6, 42, 10, 2)
    gfx.fillRect(50, 42, 9, 2)

    gfx.generateTexture('ruin-house-broken', 68, 44)
    gfx.destroy()
  }

  // 矿山剪影：一座秃石头山，左边受光、右边压暗
  private makeMineHill() {
    const gfx = this.add.graphics()

    gfx.fillStyle(0x4a3d30, 1)
    gfx.fillPoints(
      [
        new Phaser.Math.Vector2(0, 90),
        new Phaser.Math.Vector2(0, 52),
        new Phaser.Math.Vector2(24, 26),
        new Phaser.Math.Vector2(54, 8),
        new Phaser.Math.Vector2(88, 26),
        new Phaser.Math.Vector2(120, 58),
        new Phaser.Math.Vector2(120, 90),
      ],
      true
    )

    gfx.fillStyle(0x5b4a38, 1)
    gfx.fillPoints(
      [
        new Phaser.Math.Vector2(0, 52),
        new Phaser.Math.Vector2(24, 26),
        new Phaser.Math.Vector2(54, 8),
        new Phaser.Math.Vector2(62, 90),
        new Phaser.Math.Vector2(0, 90),
      ],
      true
    )

    gfx.fillStyle(0x382d22, 1)
    gfx.fillPoints(
      [
        new Phaser.Math.Vector2(88, 26),
        new Phaser.Math.Vector2(120, 58),
        new Phaser.Math.Vector2(120, 90),
        new Phaser.Math.Vector2(74, 90),
      ],
      true
    )

    gfx.fillStyle(0x2f261d, 1)
    gfx.fillRect(38, 34, 2, 16)
    gfx.fillRect(70, 44, 2, 12)
    gfx.fillRect(52, 58, 2, 10)

    gfx.generateTexture('mine-hill', 120, 90)
    gfx.destroy()
  }

  // 洞口那面岩壁：一整块秃岩，中间挖出一个拱形洞口，铁栅栏就装在里面
  private makeMineCliff() {
    const gfx = this.add.graphics()

    gfx.fillStyle(0x4a3d30, 1)
    gfx.fillPoints(
      [
        new Phaser.Math.Vector2(0, 170),
        new Phaser.Math.Vector2(0, 62),
        new Phaser.Math.Vector2(28, 30),
        new Phaser.Math.Vector2(74, 10),
        new Phaser.Math.Vector2(150, 8),
        new Phaser.Math.Vector2(196, 36),
        new Phaser.Math.Vector2(220, 72),
        new Phaser.Math.Vector2(220, 170),
      ],
      true
    )

    // 左侧受光面
    gfx.fillStyle(0x5b4a38, 1)
    gfx.fillPoints(
      [
        new Phaser.Math.Vector2(0, 62),
        new Phaser.Math.Vector2(28, 30),
        new Phaser.Math.Vector2(74, 10),
        new Phaser.Math.Vector2(84, 170),
        new Phaser.Math.Vector2(0, 170),
      ],
      true
    )

    // 右侧暗面
    gfx.fillStyle(0x372c22, 1)
    gfx.fillPoints(
      [
        new Phaser.Math.Vector2(150, 8),
        new Phaser.Math.Vector2(196, 36),
        new Phaser.Math.Vector2(220, 72),
        new Phaser.Math.Vector2(220, 170),
        new Phaser.Math.Vector2(146, 170),
      ],
      true
    )

    // 岩层线
    gfx.fillStyle(0x2f261d, 1)
    gfx.fillRect(20, 84, 44, 2)
    gfx.fillRect(150, 62, 50, 2)
    gfx.fillRect(96, 44, 40, 2)
    gfx.fillStyle(0x6b5a44, 0.6)
    gfx.fillRect(30, 100, 30, 2)
    gfx.fillRect(160, 96, 40, 2)

    // 洞口：拱顶 + 竖直洞身，洞口正好让 80x100 的铁栅栏嵌进来
    gfx.fillStyle(0x14100c, 1)
    gfx.fillRect(72, 70, 76, 100)
    gfx.fillEllipse(110, 70, 76, 44)

    // 洞口上沿的一圈岩棱
    gfx.fillStyle(0x5b4a38, 1)
    gfx.fillRect(68, 66, 6, 12)
    gfx.fillRect(146, 66, 6, 12)
    gfx.fillRect(88, 44, 44, 4)

    gfx.generateTexture('mine-cliff', 220, 170)
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

    if (key === 'thunder') {
      this.paintThunderBody(gfx, true)
    } else if (key === 'rock') {
      // 三档取色：正上=岩脊色，正中=土色，正下=浅黄。整体比原来更往金色偏一档
      // （原来的土黄偏褐，加上头顶一层泥沼，离璃月的金太远了）。
      // 逐行铺满椭圆，横向宽度按椭圆公式收，所以四周不会再有单独的白边
      for (let y = 3; y <= 27; y++) {
        const t = (15 - y) / 11.5
        const color =
          t >= 0
            ? this.mixColor(0xb08a26, 0x8f6c1e, Math.min(1, t))
            : this.mixColor(0xb08a26, 0xf2d88a, Math.min(1, -t))
        const half = 15 * Math.sqrt(Math.max(0, 1 - t * t))

        gfx.fillStyle(color, 1)
        gfx.fillRect(16 - half, y, half * 2, 1)
      }

      // 头顶的泥沼删掉了，换成几粒嵌在岩壳里的金矿：上亮下暗各 1 像素，再点一个高光。
      // 眼睛占着 y 10~16、x 6~26 那一片，所以金粒一律在 y 9 以上
      const nuggets: [number, number, number][] = [
        // x, y, 宽
        [5, 8, 3],
        [13, 4, 3],
        [17, 6, 2],
        [22, 7, 4],
      ]

      gfx.fillStyle(0xc79a22, 1)
      nuggets.forEach(([x, y, w]) => gfx.fillRect(x, y + 1, w, 1))

      gfx.fillStyle(0xffd76a, 1)
      nuggets.forEach(([x, y, w]) => gfx.fillRect(x, y, w, 1))

      gfx.fillStyle(0xfff0bd, 1)
      nuggets.forEach(([x, y]) => gfx.fillRect(x, y, 1, 1))
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
            ? this.mixColor(0x8f6b24, 0x5f4e28, Math.min(1, t))
            : this.mixColor(0x8f6b24, 0xcbb171, Math.min(1, -t))
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

  // 压力板：灰阶贴图，靠 setTint 变色（没踩住=石头色，踩住=金色）。
  // 画法照抄木地板那张（wood-plank）：一整块**平的**石板 —— 上沿一条亮线、下沿一层
  // 侧边 + 接触阴影、中间一道嵌进去的凹槽。横版 2D 里用"外框 + 厚侧面"那套假体积会很像
  // 贴上去的按钮，所以不用黑描边、也不做厚底座。判定用的细条不在贴图里，见 PLATE_BODY
  private makePlate() {
    const gfx = this.add.graphics()

    // 板面：从上到下亮 → 暗，四档，跟木头地板同一个路数
    gfx.fillStyle(0xf0f0f0, 1)
    gfx.fillRect(1, 2, 50, 2)
    gfx.fillStyle(0xdedede, 1)
    gfx.fillRect(1, 4, 50, 4)
    gfx.fillStyle(0xc0c0c0, 1)
    gfx.fillRect(1, 8, 50, 2)
    gfx.fillStyle(0x9a9a9a, 1)
    gfx.fillRect(1, 10, 50, 1)
    gfx.fillStyle(0x6e6e6e, 1)
    gfx.fillRect(1, 11, 50, 1)              // 贴地那条接触阴影

    gfx.fillStyle(0xffffff, 1)
    gfx.fillRect(1, 0, 50, 2)               // 上沿的受光亮线（板子"厚度"只靠这一条）

    // 两头压一道暗边：读起来是单独一块板，不是地上一条亮带
    gfx.fillStyle(0xb0b0b0, 1)
    gfx.fillRect(0, 0, 1, 12)
    gfx.fillRect(51, 0, 1, 12)

    // 中间那道凹槽：上缘压暗、下缘提亮，看着是"嵌进去"的
    gfx.fillStyle(0xa8a8a8, 1)
    gfx.fillRect(15, 5, 22, 2)
    gfx.fillStyle(0xffffff, 1)
    gfx.fillRect(15, 7, 22, 1)

    gfx.generateTexture('plate', 52, 12)
    gfx.destroy()
  }

  // 浅水层：可平铺的一小条，上亮下暗，摊在地形顶面上当水面
  private makeWaterTop() {
    const gfx = this.add.graphics()

    gfx.fillStyle(0x4a7fa0, 0.55)
    gfx.fillRect(0, 2, 16, 6)
    gfx.fillStyle(0x9fd0e8, 0.9)
    gfx.fillRect(0, 0, 16, 2)
    gfx.fillStyle(0x8fc8e0, 0.5)
    gfx.fillRect(3, 3, 4, 1)
    gfx.fillRect(10, 4, 3, 1)

    gfx.generateTexture('water-top', 16, 8)
    gfx.destroy()
  }

  // 草地层：也是可平铺的一小条，顶上冒几根草叶
  private makeGrassTop() {
    const gfx = this.add.graphics()

    gfx.fillStyle(0x5f8a3a, 1)
    gfx.fillRect(0, 2, 16, 5)
    gfx.fillStyle(0x7fb04a, 1)
    gfx.fillRect(0, 1, 16, 2)
    gfx.fillStyle(0x86bb52, 1)
    gfx.fillRect(2, 0, 1, 3)
    gfx.fillRect(6, 0, 1, 2)
    gfx.fillRect(11, 0, 1, 3)
    gfx.fillRect(14, 1, 1, 2)

    gfx.generateTexture('grass-top', 16, 7)
    gfx.destroy()
  }

  // 触屏按键：点阵画的小圆环，用来给箭头之类的按键加一圈纹饰
  private pixelRing(
    gfx: Phaser.GameObjects.Graphics,
    cx: number,
    cy: number,
    radius: number,
    color: number,
    alpha = 1,
    thickness = 1
  ) {
    gfx.fillStyle(color, alpha)

    // 半径越大点数越多，不然大圆盘会画成一圈稀稀拉拉的虚线
    const steps = Math.max(28, Math.round(radius * 2.2))

    for (let index = 0; index < steps; index++) {
      const angle = (index / steps) * Math.PI * 2

      gfx.fillRect(
        Math.round(cx + Math.cos(angle) * radius),
        Math.round(cy + Math.sin(angle) * radius),
        thickness,
        thickness
      )
    }
  }

  // 触屏的方向箭头：石头质感的圆环 + 四角纹饰 + 一个亮色箭头（朝右，左键靠 flipX）
  private makeTouchArrow() {
    const gfx = this.add.graphics()
    const center = 20

    gfx.fillStyle(0x1c1c28, 0.55)
    gfx.fillCircle(center, center, 19)

    // 贴图按最终显示尺寸画（40x40），不做缩放，所以环线可以画成 2 像素宽
    this.pixelRing(gfx, center, center, 18, 0x8a7f6a, 0.85, 2)
    this.pixelRing(gfx, center, center, 14, 0x5c688c, 0.5)

    // 四个斜角的菱形纹饰
    gfx.fillStyle(0xd9c9a8, 0.7)

    ;[
      [center - 12, center - 12],
      [center + 12, center - 12],
      [center - 12, center + 12],
      [center + 12, center + 12],
    ].forEach(([x, y]) => {
      gfx.fillTriangle(x, y - 3, x + 3, y, x, y + 3)
      gfx.fillTriangle(x, y - 3, x - 3, y, x, y + 3)
    })

    // 箭头本体：深色描边 + 亮面（整体围着圆环中心摆正，不偏左）
    gfx.fillStyle(0x1c1c28, 1)
    gfx.fillTriangle(11, 6, 33, 20, 11, 34)
    gfx.fillRect(6, 16, 6, 8)

    gfx.fillStyle(0xf0e2c0, 1)
    gfx.fillTriangle(14, 10, 29, 20, 14, 30)
    gfx.fillRect(9, 17, 5, 6)

    gfx.generateTexture('touch-arrow', 40, 40)
    gfx.destroy()
  }

  // 浮动摇杆的两张图：外圈底盘（能拖动的那一圈）和中间的摇杆头。
  // 配色和箭头键一致（深底 + 石头色圆环），这样两套操作看起来是一家的
  private makeTouchStick() {
    const base = this.add.graphics()
    const center = 36

    base.fillStyle(0x1c1c28, 0.45)
    base.fillCircle(center, center, 34)

    this.pixelRing(base, center, center, 32, 0x8a7f6a, 0.8, 2)
    this.pixelRing(base, center, center, 21, 0x5c688c, 0.35, 2)

    // 四个方向的小刻度，让人一眼看出这是个方向盘
    base.fillStyle(0xd9c9a8, 0.55)
    base.fillRect(center - 2, 5, 4, 2)
    base.fillRect(center - 2, 65, 4, 2)
    base.fillRect(5, center - 2, 2, 4)
    base.fillRect(65, center - 2, 2, 4)

    base.generateTexture('touch-stick-base', 72, 72)
    base.destroy()

    const knob = this.add.graphics()
    const knobCenter = 15

    knob.fillStyle(0x1c1c28, 0.6)
    knob.fillCircle(knobCenter, knobCenter, 14)

    this.pixelRing(knob, knobCenter, knobCenter, 13, 0xd9c9a8, 0.9, 2)

    knob.fillStyle(0xd9c9a8, 0.8)
    knob.fillCircle(knobCenter, knobCenter, 6)

    knob.generateTexture('touch-stick-knob', 30, 30)
    knob.destroy()
  }

  // 跳跃键：一颗无元素史莱姆往右上方跃起，身后拖几根细线表示风
  private makeTouchJump() {
    const gfx = this.add.graphics()
    const cx = 36
    const cy = 36

    // 底盘的圆
    gfx.fillStyle(0x1c1c28, 0.55)
    gfx.fillCircle(cx, cy, 34)

    this.pixelRing(gfx, cx, cy, 33, 0x8a7f6a, 0.85, 2)

    // 身后的风线：史莱姆往右上跳，风就斜着往左下拖（每根都是往左下走的一串小台阶）
    gfx.fillStyle(0xa8e8d4, 0.75)

    ;[
      [44, 34, 9],
      [41, 43, 8],
      [35, 52, 6],
    ].forEach(([x, y, length]) => {
      for (let step = 0; step < length; step++) {
        gfx.fillRect(x - step * 2, y + step * 3, 3, 2)
      }
    })

    // 史莱姆本体：压在按钮的右上角，刚蹬离地面的样子
    gfx.fillStyle(0x14141f, 1)
    gfx.fillEllipse(48, 27, 31, 21)
    gfx.fillStyle(0xffffff, 1)
    gfx.fillEllipse(48, 27, 28, 18)

    ;[
      [25, 15, 0.35],
      [22, 13, 0.5],
      [18, 10, 0.6],
      [14, 8, 0.7],
      [10, 6, 0.8],
      [6, 4, 0.9],
    ].forEach(([w, h, alpha]) => {
      gfx.fillStyle(0x55556a, alpha)
      gfx.fillEllipse(48, 27, w, h)
    })

    // 蹬地那一下：右下角带出一小块
    gfx.fillStyle(0x55556a, 0.9)
    gfx.fillTriangle(33, 36, 42, 32, 36, 44)

    // 眼睛
    gfx.fillStyle(0x20202a, 1)
    gfx.fillRect(43, 23, 3, 4)
    gfx.fillRect(52, 23, 3, 4)

    gfx.generateTexture('touch-jump', 72, 72)
    gfx.destroy()
  }

  // 岩柱键：把关卡里那根岩柱（20x72）等比缩小了画进来，整个都在圆盘里面，不超出底盘
  private makeTouchPillar() {
    const gfx = this.add.graphics()

    gfx.fillStyle(0x1c1c28, 0.5)
    gfx.fillCircle(21, 21, 19)

    // 上下石箍（比柱身宽）
    gfx.fillStyle(0x4a3f2c, 1)
    gfx.fillRect(15, 4, 12, 6)
    gfx.fillRect(15, 32, 12, 6)

    gfx.fillStyle(0x5c4d33, 1)
    gfx.fillRect(15, 4, 12, 2)
    gfx.fillRect(15, 32, 12, 2)

    // 柱身：左亮右暗
    gfx.fillStyle(0x5c4d33, 1)
    gfx.fillRect(17, 8, 8, 26)
    gfx.fillStyle(0x866631, 1)
    gfx.fillRect(17, 8, 3, 26)
    gfx.fillStyle(0x4a3f2c, 1)
    gfx.fillRect(24, 8, 1, 26)

    // 上下金箍线
    gfx.fillStyle(0xffd54f, 1)
    gfx.fillRect(15, 10, 12, 2)
    gfx.fillRect(15, 31, 12, 2)

    // 柱身上盘着的那条龙线
    gfx.fillStyle(0xd9a441, 1)

    for (let y = 13; y <= 29; y++) {
      const x = 21 + Math.round(1.7 * Math.sin(y / 2.6))

      gfx.fillRect(x - 1, y, 3, 1)
    }

    // 两头的一点金：代表岩元素标识
    gfx.fillStyle(0xffd54f, 1)
    gfx.fillRect(19, 6, 4, 2)
    gfx.fillRect(19, 34, 4, 2)

    gfx.generateTexture('touch-pillar', 42, 42)
    gfx.destroy()
  }

  // 岩化键：岩元素色的底盘 + 岩元素图标（亮的一张 + 冷却时用的灰版一张）
  private makeTouchArmor() {
    const draw = (
      gfx: Phaser.GameObjects.Graphics,
      outer: number,
      mid: number,
      ring: number,
      icon: number
    ) => {
      const center = 25

      gfx.fillStyle(0x1c1c28, 0.55)
      gfx.fillCircle(center, center, 24)

      // 抛过光的底盘：外深内亮
      gfx.fillStyle(outer, 1)
      gfx.fillCircle(center, center, 22)
      gfx.fillStyle(mid, 1)
      gfx.fillCircle(center, center, 18)

      this.pixelRing(gfx, center, center, 21, ring, 0.6, 2)

      // 岩元素图标，正中间（每个像素画成 2x2，比原来大一倍但依然是硬边）
      gfx.fillStyle(icon, 1)

      ICON_ROCK.forEach((row, y) => {
        for (let x = 0; x < row.length; x++) {
          if (row[x] === '#') {
            gfx.fillRect(center - 16 + x * 2, center - 16 + y * 2, 2, 2)
          }
        }
      })
    }

    const lit = this.add.graphics()
    draw(lit, 0x8a6a2c, 0xd9a441, 0xffd54f, 0xfff3d0)
    lit.generateTexture('touch-armor', 50, 50)
    lit.destroy()

    // 岩化用完变灰的那一版（冷却时用它当底，亮的那张从下往上盖回来）
    const dim = this.add.graphics()
    draw(dim, 0x3a3a44, 0x55555f, 0x8a8a94, 0x9a9aa4)
    dim.generateTexture('touch-armor-dim', 50, 50)
    dim.destroy()
  }
  // 雷闪 / 雷鸣两个键（雷史莱姆时盖掉岩化 / 岩柱那两张）
  private makeTouchThunder() {
    // 雷闪（X）：横着一排史莱姆剪影，从左到右一个比一个实，
    // 最后一个是雷史莱姆本人（本体 + 头顶那根带球的雷极）—— 就是它一路闪过去的样子
    const drawBlink = (
      gfx: Phaser.GameObjects.Graphics,
      backingOuter: number,
      backingMid: number,
      ring: number,
      ghost: number,
      bodyTop: number,
      body: number,
      rod: number,
      ball: number
    ) => {
      const center = 25

      gfx.fillStyle(0x1c1c28, 0.55)
      gfx.fillCircle(center, center, 24)
      gfx.fillStyle(backingOuter, 1)
      gfx.fillCircle(center, center, 22)
      gfx.fillStyle(backingMid, 1)
      gfx.fillCircle(center, center, 18)
      this.pixelRing(gfx, center, center, 21, ring, 0.6, 2)

      // 前面两道剪影：越往左越淡（就是它闪过来的残影）
      gfx.fillStyle(ghost, 0.3)
      gfx.fillEllipse(10, 33, 13, 10)
      gfx.fillStyle(ghost, 0.6)
      gfx.fillEllipse(22, 33, 14, 11)

      // 最后一个是雷史莱姆：先画头顶那根雷极，再画本体，最后点两只眼睛
      gfx.fillStyle(rod, 1)
      gfx.fillRect(36, 18, 3, 9)
      gfx.fillStyle(ball, 1)
      gfx.fillCircle(37, 17, 3.5)
      gfx.fillStyle(bodyTop, 1)
      gfx.fillEllipse(36, 33, 18, 14)
      gfx.fillStyle(body, 1)
      gfx.fillEllipse(36, 35, 16, 10)
      gfx.fillStyle(0x2a2440, 1)
      gfx.fillRect(33, 31, 2, 2)
      gfx.fillRect(38, 31, 2, 2)
    }

    const blink = this.add.graphics()
    drawBlink(blink, 0x3b2a66, 0x5b3fa8, 0xb388ff, 0x2a1f45, 0xd9c9ff, 0xa07bff, 0xf2c14e, 0xfff3d0)
    blink.generateTexture('touch-blink', 50, 50)
    blink.destroy()

    // 一格电都没有时用的灰版
    const blinkDim = this.add.graphics()
    drawBlink(blinkDim, 0x3a3a44, 0x55555f, 0x8a8a94, 0x2a2a34, 0x9a9aa4, 0x7a7a86, 0x9a9aa4, 0xb0b0bc)
    blinkDim.generateTexture('touch-blink-dim', 50, 50)
    blinkDim.destroy()

    // 雷鸣（C）：就是把游戏里那道雷电缩小放进按键里 —— 外面一层淡紫的光，
    // 里面一条亮的芯，上下一路折线
    const bolt = this.add.graphics()

    bolt.fillStyle(0x1c1c28, 0.5)
    bolt.fillCircle(21, 21, 19)
    bolt.fillStyle(0x3b2a66, 1)
    bolt.fillCircle(21, 21, 18)
    bolt.fillStyle(0x5b3fa8, 1)
    bolt.fillCircle(21, 21, 14)
    this.pixelRing(bolt, 21, 21, 17, 0xb388ff, 0.6, 2)

    const spine: Array<[number, number]> = [
      [22, 5],
      [17, 15],
      [22, 21],
      [15, 30],
      [19, 37],
    ]
    const stroke = (width: number, color: number, alpha: number) => {
      bolt.lineStyle(width, color, alpha)
      bolt.beginPath()
      bolt.moveTo(spine[0][0], spine[0][1])

      for (let i = 1; i < spine.length; i++) {
        bolt.lineTo(spine[i][0], spine[i][1])
      }

      bolt.strokePath()
    }

    stroke(6, 0xb388ff, 0.3)
    stroke(2.5, 0xe6dcff, 0.95)

    bolt.generateTexture('touch-thunder', 42, 42)
    bolt.destroy()
  }

  // 雷鸣冷却中的雷史莱姆：整个身子是紫的（一点黄都没有），和"充满"那版区分开
  private makeThunderCooledSlime() {
    const gfx = this.add.graphics()

    gfx.fillStyle(0x14141f, 1)
    gfx.fillEllipse(16, 15, 32, 25)
    gfx.fillStyle(0xffffff, 1)
    gfx.fillEllipse(16, 15, 30, 23)

    // 冷却中：全是紫的，同样揉成柔和的斑（深浅紫之间渗）
    this.paintThunderBody(gfx, false)

    gfx.generateTexture('slime-thunder-cd', 32, 26)
    gfx.destroy()
  }

  // 雷史莱姆身上的黄紫：像淤青那样柔和地一块块渗开，不是一条一条色带 ——
  // 先用一个上下渐变打底，再叠几团软软的斑（越靠斑心越明显），
  // 最后把参数过一遍 smoothstep，所以任何两色之间都找不到硬边。
  // ready = 雷鸣充满（金 ↔ 紫），否则只有紫（浅紫 ↔ 深紫）
  private paintThunderBody(gfx: Phaser.GameObjects.Graphics, ready: boolean) {
    // x, y, 半径, 强度（正数往金色推，负数往紫色推）
    const blobs: Array<[number, number, number, number]> = [
      [22, 8, 11, -0.5],
      [9, 12, 10, 0.45],
      [20, 20, 9, 0.5],
      [10, 22, 9, -0.45],
      [16, 14, 8, -0.2],
    ]

    const lowA = ready ? 0xf2c14e : 0xb388ff
    const lowB = ready ? 0xd9a8ff : 0x8a5cf0
    const highA = ready ? 0xd9a8ff : 0x8a5cf0
    const highB = ready ? 0x8a5cf0 : 0x6b3fd0

    for (let y = 3; y <= 27; y++) {
      for (let x = 1; x <= 31; x++) {
        const ux = (x - 16) / 15
        const uy = (y - 15) / 11.5

        if (ux * ux + uy * uy > 1) {
          continue
        }

        let k = (y - 3) / 24

        blobs.forEach(([bx, by, radius, strength]) => {
          const dx = x - bx
          const dy = y - by
          const d2 = (dx * dx + dy * dy) / (radius * radius)

          if (d2 < 1) {
            k += strength * (1 - d2) * (1 - d2)
          }
        })

        k = Phaser.Math.Clamp(k, 0, 1)
        k = k * k * (3 - 2 * k)

        const color =
          k < 0.5
            ? this.mixColor(lowA, lowB, k * 2)
            : this.mixColor(highA, highB, (k - 0.5) * 2)

        gfx.fillStyle(color, 1)
        gfx.fillRect(x, y, 1, 1)
      }
    }
  }

  // 头顶那根雷极：一根弯杆，尾端（底下那头）是一颗雷球，杆子往上弯到一边去。
  // 贴图 26x44，身体圆心落在 (13, 33)。黄紫那版是「雷鸣充满」，全紫那版是「冷却中」。
  // + / - 两种极性的闪光是另外两张小贴图，运行时在杆子尖端闪
  private makeThunderRod() {
    const draw = (
      gfx: Phaser.GameObjects.Graphics,
      rodOuter: number,
      rodInner: number,
      ballOuter: number,
      ballInner: number,
      ballCore: number
    ) => {
      const cx = 13
      const centerY = 33

      // 杆子：从头顶立起来，先竖着再往右弯出去，弯到顶上是那颗雷球
      const spine: Array<[number, number]> = [
        [13, 28],
        [13, 19],
        [14, 13],
        [17, 8],
      ]

      const trace = () => {
        gfx.beginPath()
        spine.forEach(([x, y], index) => {
          if (index === 0) {
            gfx.moveTo(x, y)
          } else {
            gfx.lineTo(x, y)
          }
        })
        gfx.strokePath()
      }

      gfx.lineStyle(5, rodOuter, 1)
      trace()
      gfx.lineStyle(2, rodInner, 1)
      trace()

      // 尾端那颗雷球：长在杆子的顶上
      gfx.fillStyle(ballOuter, 1)
      gfx.fillCircle(19, 5, 6)
      gfx.fillStyle(ballInner, 1)
      gfx.fillCircle(19, 5, 4.2)
      gfx.fillStyle(ballCore, 1)
      gfx.fillCircle(18, 4, 1.8)

      // 底边压一段和本体一样的渐变，接缝看不出来
      gfx.fillStyle(0xffffff, 1)
      gfx.fillEllipse(cx, centerY, 30, 23)

      const layers = [
        { w: 28, h: 21, alpha: 0.35 },
        { w: 25, h: 18, alpha: 0.5 },
        { w: 21, h: 15, alpha: 0.6 },
        { w: 17, h: 12, alpha: 0.7 },
        { w: 13, h: 9, alpha: 0.8 },
        { w: 8, h: 6, alpha: 0.9 },
      ]

      layers.forEach((layer) => {
        gfx.fillStyle(ELEMENTS.thunder.color, layer.alpha)
        gfx.fillEllipse(cx, centerY, layer.w, layer.h)
      })
    }

    // 雷鸣充满：杆子是黄紫两色，球是金芯
    const lit = this.add.graphics()
    draw(lit, 0x5b3fa8, 0xf2c14e, 0x8a5cf0, 0xf2c14e, 0xfff3d0)
    lit.generateTexture('thunder-rod', 26, 44)
    lit.destroy()

    // 冷却中：整根都是紫的
    const cooled = this.add.graphics()
    draw(cooled, 0x4b2a78, 0x8a5cf0, 0x6b3fd0, 0xa07bff, 0xe6dcff)
    cooled.generateTexture('thunder-rod-cd', 26, 44)
    cooled.destroy()
  }

  // 雷极顶上那颗球里间歇闪的极性符号（芯 7x7 + 1 像素黑描边，总共 9x9）。
  // 黑边是烤进贴图的：贴图本身是白的，运行时 setTint 只染白的那部分，
  // 黑的乘什么色都还是黑的，所以描边一直清楚
  private makePolarityMarks() {
    const draw = (key: string, vertical: boolean) => {
      const gfx = this.add.graphics()

      // 描边：把芯的形状往四个方向各错开 1 像素铺一层黑
      gfx.fillStyle(0x000000, 1)

      const ink = (dx: number, dy: number) => {
        if (vertical) {
          gfx.fillRect(3 + dx, 1 + dy, 3, 7)
        }

        gfx.fillRect(1 + dx, 3 + dy, 7, 3)
      }

      ink(-1, 0)
      ink(1, 0)
      ink(0, -1)
      ink(0, 1)

      // 芯
      gfx.fillStyle(0xffffff, 1)
      ink(0, 0)

      gfx.generateTexture(key, 9, 9)
      gfx.destroy()
    }

    draw('polarity-plus', true)
    draw('polarity-minus', false)
  }

  // 雷闪的电能：左上角一块小电池（三格），外壳上亮下暗做出厚度，
  // 里面一口井，两片隔板把井分成三格 —— 电是从最左边那格开始涨的
  private makeChargeBattery() {
    const gfx = this.add.graphics()

    // 正极那小疙瘩
    gfx.fillStyle(0x55637a, 1)
    gfx.fillRect(32, 4, 4, 6)
    gfx.fillStyle(0x39435a, 1)
    gfx.fillRect(32, 8, 4, 2)

    // 外壳：外圈压暗、上左打光，看着像有厚度
    gfx.fillStyle(0x0a0d14, 1)
    gfx.fillRect(0, 0, 32, 14)
    gfx.fillStyle(0x55637a, 1)
    gfx.fillRect(0, 0, 32, 1)
    gfx.fillRect(0, 0, 1, 14)
    gfx.fillStyle(0x1b2230, 1)
    gfx.fillRect(1, 1, 30, 12)

    // 里面那口井
    gfx.fillStyle(0x0d1018, 1)
    gfx.fillRect(2, 2, 28, 10)

    // 两片隔板：三格各 8 宽
    gfx.fillStyle(0x39435a, 1)
    gfx.fillRect(10, 2, 2, 10)
    gfx.fillRect(20, 2, 2, 10)

    gfx.generateTexture('charge-battery', 36, 14)
    gfx.destroy()

    // 按键下缘那三个充能点：白芯 + 黑圈（黑的一圈烤进贴图，运行时 setTint 染不动它）
    const dot = this.add.graphics()

    dot.fillStyle(0x000000, 1)
    dot.fillCircle(3.5, 3.5, 3.5)
    dot.fillStyle(0xffffff, 1)
    dot.fillCircle(3.5, 3.5, 2)
    dot.generateTexture('charge-dot', 7, 7)
    dot.destroy()
  }

  // 蓄力瞄准时史莱姆变成的那颗雷球（34x30）
  private makeThunderBall() {
    const gfx = this.add.graphics()
    const cx = 17
    const cy = 15

    gfx.fillStyle(0x241a3d, 1)
    gfx.fillEllipse(cx, cy, 34, 30)
    gfx.fillStyle(0x5b3fa8, 1)
    gfx.fillEllipse(cx, cy, 30, 26)
    gfx.fillStyle(0x8a5cf0, 1)
    gfx.fillEllipse(cx, cy, 24, 21)
    gfx.fillStyle(0xc8b4ff, 1)
    gfx.fillEllipse(cx, cy, 15, 13)
    gfx.fillStyle(0xffffff, 1)
    gfx.fillEllipse(cx, cy, 7, 6)

    // 外面跳几道小电弧
    gfx.lineStyle(1, 0xe6dcff, 0.9)

    const arcs: number[][][] = [
      [[2, 6], [5, 9], [3, 12]],
      [[31, 4], [28, 8], [30, 11]],
      [[6, 26], [9, 23], [7, 20]],
      [[29, 27], [26, 24], [28, 21]],
    ]

    arcs.forEach((arc) => {
      gfx.beginPath()
      gfx.moveTo(arc[0][0], arc[0][1])
      gfx.lineTo(arc[1][0], arc[1][1])
      gfx.lineTo(arc[2][0], arc[2][1])
      gfx.strokePath()
    })

    gfx.generateTexture('thunder-ball', 34, 30)
    gfx.destroy()
  }

  // 魔物被雷劈中后的眩晕标记：头上转的三个小点
  private makeStunMark() {
    const gfx = this.add.graphics()

    gfx.fillStyle(0xffe066, 1)
    gfx.fillCircle(3, 5, 1.5)
    gfx.fillCircle(8, 2, 1.5)
    gfx.fillCircle(13, 5, 1.5)

    gfx.generateTexture('monster-stun', 16, 9)
    gfx.destroy()
  }

  // 魔物：丘丘人。个头大约 1.5 个史莱姆高（贴图 34x42，底边贴地），
  // 四肢、兽皮背心 + 围腰、骨面具、拎着的木棍都要能看清楚
  private makeMonsterBrute() {
    const gfx = this.add.graphics()

    // 脚下一点阴影，看着是站在地上
    gfx.fillStyle(0x000000, 0.16)
    gfx.fillEllipse(17, 40, 24, 5)

    // 腿 + 脚
    gfx.fillStyle(0x6b4a2f, 1)
    gfx.fillRect(10, 29, 5, 10)
    gfx.fillRect(19, 29, 5, 10)
    gfx.fillStyle(0x543a24, 1)
    gfx.fillRect(9, 38, 7, 4)
    gfx.fillRect(18, 38, 7, 4)

    // 兽皮围腰（梯形）+ 腰带
    gfx.fillStyle(0x4a3a2a, 1)
    gfx.fillPoints(
      [
        new Phaser.Math.Vector2(8, 28),
        new Phaser.Math.Vector2(26, 28),
        new Phaser.Math.Vector2(24, 35),
        new Phaser.Math.Vector2(10, 35),
      ],
      true
    )
    gfx.fillStyle(0x5c4a34, 1)
    gfx.fillRect(8, 28, 18, 2)

    // 上身：兽皮背心，胸腹压一层浅色
    gfx.fillStyle(0x8a6240, 1)
    gfx.fillEllipse(17, 21, 22, 17)
    gfx.fillStyle(0x9b7150, 1)
    gfx.fillEllipse(17, 20, 13, 12)
    gfx.fillStyle(0x6f4c31, 1)
    gfx.fillEllipse(17, 26, 18, 8)

    // 手臂：左臂垂着、右臂举着木棍
    gfx.fillStyle(0x7a5537, 1)
    gfx.fillRect(4, 16, 5, 11)
    gfx.fillRect(25, 13, 5, 12)
    gfx.fillStyle(0x8a6240, 1)
    gfx.fillRect(4, 26, 5, 4)
    gfx.fillRect(25, 22, 5, 4)

    // 脖子
    gfx.fillStyle(0x6f4c31, 1)
    gfx.fillRect(15, 12, 5, 4)

    // 头 + 往外斜的大耳朵
    gfx.fillStyle(0x8a6240, 1)
    gfx.fillEllipse(17, 10, 17, 15)
    gfx.fillStyle(0x7a5537, 1)
    gfx.fillTriangle(9, 6, 1, 0, 10, 12)
    gfx.fillTriangle(25, 6, 33, 0, 24, 12)

    // 骨面具：上半亮、下半压一层灰，做出一点弧度
    gfx.fillStyle(0xe8e2d0, 1)
    gfx.fillEllipse(17, 10, 14, 13)
    gfx.fillStyle(0xc9c0a8, 1)
    gfx.fillEllipse(17, 14, 14, 6)

    // 两个眼洞 + 眉心那道红纹
    gfx.fillStyle(0x2a2018, 1)
    gfx.fillRect(12, 8, 4, 4)
    gfx.fillRect(19, 8, 4, 4)
    gfx.fillStyle(0xb2402f, 1)
    gfx.fillRect(16, 13, 2, 5)

    // 木棍：一根带疙瘩的粗棒子
    gfx.fillStyle(0x8a6a3a, 1)
    gfx.fillRect(27, 4, 3, 20)
    gfx.fillStyle(0x9c7a44, 1)
    gfx.fillRect(25, 1, 7, 7)
    gfx.fillStyle(0x6b5228, 1)
    gfx.fillRect(26, 3, 2, 2)
    gfx.fillRect(29, 5, 2, 2)

    gfx.generateTexture('monster-brute', 34, 42)
    gfx.destroy()
  }

  // 千岩军（草稿第二版，更中式）：圆领战袍 + 甲片胸铠 + 宽腰带玉扣 + 百褶战裙（云纹镶边），
  // 两片云纹肩甲、脑后一块顿项，头盔是金顶 + 红盔缨，右手一杆带红缨长枪。
  // 贴图 34x48，底边贴地，约 1.85 个史莱姆高；眼睛（面甲那条缝）在底边往上 36
  private makeGuardMillelith() {
    const gfx = this.add.graphics()

    // 脚下阴影
    gfx.fillStyle(0x000000, 0.16)
    gfx.fillEllipse(16, 45, 24, 5)

    // 长枪：枪杆 + 枪尖 + 红缨（竖在右手边）
    gfx.fillStyle(0x6b4a2a, 1)
    gfx.fillRect(30, 6, 2, 42)
    gfx.fillStyle(0xc9d1dc, 1)
    gfx.fillTriangle(27, 8, 31, 0, 35, 8)
    gfx.fillStyle(0x8f9aa8, 1)
    gfx.fillTriangle(28, 8, 31, 3, 34, 8)
    gfx.fillStyle(0xc0392b, 1)
    gfx.fillRect(29, 8, 4, 6)
    gfx.fillRect(28, 11, 6, 3)

    // 腿 + 靴
    gfx.fillStyle(0x3a3a46, 1)
    gfx.fillRect(11, 36, 5, 8)
    gfx.fillRect(18, 36, 5, 8)
    gfx.fillStyle(0x2a2a34, 1)
    gfx.fillRect(10, 43, 7, 4)
    gfx.fillRect(17, 43, 7, 4)

    // 百褶战裙：深红底 + 三道褶 + 金色下摆
    gfx.fillStyle(0x7a2f2a, 1)
    gfx.fillPoints(
      [
        new Phaser.Math.Vector2(8, 28),
        new Phaser.Math.Vector2(25, 28),
        new Phaser.Math.Vector2(27, 40),
        new Phaser.Math.Vector2(6, 40),
      ],
      true
    )
    gfx.fillStyle(0x5e211e, 1)
    gfx.fillRect(12, 29, 2, 10)
    gfx.fillRect(17, 29, 2, 10)
    gfx.fillRect(22, 29, 2, 10)
    gfx.fillStyle(0xd9a441, 1)
    gfx.fillRect(6, 38, 22, 2)
    gfx.fillRect(14, 32, 6, 1)

    // 宽腰带 + 玉扣
    gfx.fillStyle(0x2f3a46, 1)
    gfx.fillRect(7, 25, 20, 4)
    gfx.fillStyle(0xd9a441, 1)
    gfx.fillRect(15, 25, 4, 4)
    gfx.fillStyle(0x7fd6b8, 1)
    gfx.fillRect(16, 26, 2, 2)

    // 上身：圆领战袍 + 三排甲片
    gfx.fillStyle(0x8a2f2a, 1)
    gfx.fillEllipse(16, 21, 21, 18)
    gfx.fillStyle(0xb0852f, 1)

    for (let row = 0; row < 3; row++) {
      for (let col = 0; col < 5; col++) {
        gfx.fillRect(9 + col * 4, 15 + row * 4, 3, 3)
      }
    }

    // 交领：中间一块深青内襟，两边金边
    gfx.fillStyle(0x2f3a46, 1)
    gfx.fillTriangle(12, 13, 21, 13, 16, 21)
    gfx.fillStyle(0xd9a441, 1)
    gfx.fillTriangle(11, 12, 16, 20, 14, 20)
    gfx.fillTriangle(22, 12, 17, 20, 19, 20)

    // 两片云纹肩甲
    gfx.fillStyle(0xd9a441, 1)
    gfx.fillEllipse(5, 19, 13, 10)
    gfx.fillEllipse(27, 19, 13, 10)
    gfx.fillStyle(0xb0852f, 1)
    gfx.fillEllipse(5, 22, 11, 4)
    gfx.fillEllipse(27, 22, 11, 4)
    gfx.fillStyle(0xffe9a8, 1)
    gfx.fillRect(4, 18, 2, 2)
    gfx.fillRect(26, 18, 2, 2)

    // 顿项（脖子后面那块护甲）
    gfx.fillStyle(0x2f3a46, 1)
    gfx.fillPoints(
      [
        new Phaser.Math.Vector2(8, 11),
        new Phaser.Math.Vector2(25, 11),
        new Phaser.Math.Vector2(23, 20),
        new Phaser.Math.Vector2(10, 20),
      ],
      true
    )

    // 头盔：金顶 + 盔缨 + 盔沿
    gfx.fillStyle(0xc0392b, 1)
    gfx.fillEllipse(16, 3, 12, 5)
    gfx.fillRect(15, 0, 3, 5)
    gfx.fillStyle(0xd9a441, 1)
    gfx.fillEllipse(16, 11, 20, 16)
    gfx.fillStyle(0xb0852f, 1)
    gfx.fillEllipse(16, 15, 20, 7)
    gfx.fillStyle(0xffe9a8, 1)
    gfx.fillRect(16, 8, 2, 2)

    // 面甲：一条黑缝 + 两道金色眼光
    gfx.fillStyle(0x1a1a22, 1)
    gfx.fillRect(9, 11, 15, 4)
    gfx.fillStyle(0xffe9a8, 1)
    gfx.fillRect(11, 12, 4, 2)
    gfx.fillRect(19, 12, 4, 2)

    gfx.generateTexture('guard-millelith', 34, 48)
    gfx.destroy()

    // 头顶那两个提示：警觉中一个问号、发现了感叹号（白芯 + 黑描边，同样烤进贴图）
    const mark = (key: string, rows: string[]) => {
      const g = this.add.graphics()

      const ink = (dx: number, dy: number, color: number) => {
        g.fillStyle(color, 1)
        rows.forEach((row, y) => {
          for (let x = 0; x < row.length; x++) {
            if (row[x] === '#') {
              g.fillRect(x + dx, y + dy, 1, 1)
            }
          }
        })
      }

      ink(-1, 0, 0x000000)
      ink(1, 0, 0x000000)
      ink(0, -1, 0x000000)
      ink(0, 1, 0x000000)
      ink(0, 0, 0xffffff)

      g.generateTexture(key, 9, 13)
      g.destroy()
    }

    mark('alert-mark', [
      '..#####..',
      '.##...##.',
      '.##...##.',
      '......##.',
      '.....##..',
      '....##...',
      '...##....',
      '...##....',
      '.........',
      '...##....',
      '...##....',
    ])

    mark('alert-exclaim', [
      '...##....',
      '...##....',
      '...##....',
      '...##....',
      '...##....',
      '...##....',
      '...##....',
      '...##....',
      '.........',
      '...##....',
      '...##....',
    ])
  }

  // ── 璃月港用的六样新东西（2026/10/10 第一版草稿，等用户审外观）──
  // 统一色调：灰蓝瓦 0x4a5560、暗红木 0x7a3a2e、金饰 0xd9a441、灯笼红 0xc0392b
  private makeHarborProps() {
    const TILE = 0x4a5560
    const TILE_LIGHT = 0x66737f
    const TILE_DARK = 0x333d47
    const WOOD = 0x7a3a2e
    const WOOD_LIGHT = 0x94513f
    const WOOD_DARK = 0x5a2a22
    const GOLD = 0xd9a441
    const LANTERN = 0xc0392b
    const INK = 0x2a1a16
    const PAPER = 0xe8e4d8

    // 屋顶（飞檐）：底边压在 y = baseY 上（也就是墙顶），所以屋檐和墙不会分开；
    // 一组竖瓦垄往上收、横向几道瓦垄、屋檐一圈瓦当、两头上翘、顶上一条屋脊加宝顶
    const roof = (
      gfx: Phaser.GameObjects.Graphics,
      cx: number,
      baseY: number,
      half: number,
      thickness: number
    ) => {
      const topHalf = half * 0.66
      const rows = 4

      gfx.fillStyle(TILE, 1)
      gfx.fillPoints(
        [
          new Phaser.Math.Vector2(cx - half, baseY),
          new Phaser.Math.Vector2(cx - topHalf, baseY - thickness),
          new Phaser.Math.Vector2(cx + topHalf, baseY - thickness),
          new Phaser.Math.Vector2(cx + half, baseY),
        ],
        true
      )

      // 竖瓦垄
      const count = Math.max(4, Math.round(half / 7))

      for (let index = 0; index <= count; index++) {
        const t = index / count
        const bx = cx - half + half * 2 * t
        const tx = cx - topHalf + topHalf * 2 * t

        gfx.fillStyle(index % 2 === 0 ? TILE_DARK : TILE_LIGHT, 0.5)

        for (let step = 0; step < rows; step++) {
          const u0 = step / rows
          const u1 = (step + 1) / rows
          const x0 = bx + (tx - bx) * u0
          const x1 = bx + (tx - bx) * u1
          const y0 = baseY - thickness * u0
          const y1 = baseY - thickness * u1

          gfx.fillPoints(
            [
              new Phaser.Math.Vector2(x0, y0),
              new Phaser.Math.Vector2(x0 + 2, y0),
              new Phaser.Math.Vector2(x1 + 2, y1),
              new Phaser.Math.Vector2(x1, y1),
            ],
            true
          )
        }
      }

      // 横瓦垄
      for (let step = 1; step < rows; step++) {
        const u = step / rows
        const h = half + (topHalf - half) * u

        gfx.fillStyle(TILE_LIGHT, 0.28)
        gfx.fillRect(cx - h, baseY - thickness * u, h * 2, 1)
      }

      // 屋檐 + 瓦当
      gfx.fillStyle(TILE_LIGHT, 1)
      gfx.fillRect(cx - half, baseY - 5, half * 2, 6)
      gfx.fillStyle(TILE_DARK, 1)

      for (let x = cx - half + 2; x < cx + half - 2; x += 5) {
        gfx.fillRect(x, baseY - 2, 3, 3)
      }

      // 翘角
      gfx.fillStyle(TILE_DARK, 1)
      gfx.fillTriangle(cx - half, baseY - 2, cx - half - 6, baseY - 12, cx - half + 4, baseY - 6)
      gfx.fillTriangle(cx + half, baseY - 2, cx + half + 6, baseY - 12, cx + half - 4, baseY - 6)

      // 屋脊 + 宝顶
      gfx.fillStyle(TILE_DARK, 1)
      gfx.fillRect(cx - topHalf + 2, baseY - thickness - 4, topHalf * 2 - 4, 4)
      gfx.fillStyle(GOLD, 1)
      gfx.fillRect(cx - 2, baseY - thickness - 10, 4, 6)
    }

    // 格子窗：金框 + 暗窗 + 窗棂
    const latticeWindow = (
      gfx: Phaser.GameObjects.Graphics,
      x: number,
      y: number,
      w: number,
      h: number
    ) => {
      gfx.fillStyle(GOLD, 1)
      gfx.fillRect(x, y, w, h)
      gfx.fillStyle(INK, 1)
      gfx.fillRect(x + 2, y + 2, w - 4, h - 4)
      gfx.fillStyle(GOLD, 1)

      for (let gx = x + 4; gx < x + w - 2; gx += 5) {
        gfx.fillRect(gx, y + 2, 1, h - 4)
      }

      for (let gy = y + 4; gy < y + h - 2; gy += 5) {
        gfx.fillRect(x + 2, gy, w - 4, 1)
      }
    }

    // 房子统一按 HOUSE_K 放大 —— 摊位的尺寸不动，让"房子明显比摊位大得多"。
    // 基准稿还是原来那套坐标，想再调大小只改这一个数
    const HOUSE_K = 1.4
    const hk = (value: number) => Math.round(value * HOUSE_K)

    // ① 楼房 A：两层商铺（基准 104x160），二层腰线 + 竖招牌
    const houseA = this.add.graphics()

    houseA.fillStyle(WOOD, 1)
    houseA.fillRect(hk(16), hk(46), hk(72), hk(104))
    houseA.fillStyle(WOOD_LIGHT, 1)
    houseA.fillRect(hk(16), hk(46), hk(72), hk(3))
    houseA.fillStyle(WOOD_DARK, 1)
    houseA.fillRect(hk(16), hk(142), hk(72), hk(10))
    houseA.fillRect(hk(12), hk(98), hk(80), hk(4))
    latticeWindow(houseA, hk(26), hk(62), hk(24), hk(26))
    latticeWindow(houseA, hk(56), hk(62), hk(24), hk(26))
    latticeWindow(houseA, hk(24), hk(110), hk(20), hk(22))
    houseA.fillStyle(INK, 1)
    houseA.fillRect(hk(54), hk(116), hk(22), hk(36))
    houseA.fillStyle(GOLD, 1)
    houseA.fillRect(hk(56), hk(118), hk(18), hk(2))
    // 竖招牌
    houseA.fillStyle(WOOD_DARK, 1)
    houseA.fillRect(hk(4), hk(104), hk(10), hk(36))
    houseA.fillStyle(GOLD, 1)
    houseA.fillRect(hk(5), hk(106), hk(8), hk(32))
    houseA.fillStyle(INK, 1)
    houseA.fillRect(hk(7), hk(111), hk(4), hk(4))
    houseA.fillRect(hk(7), hk(119), hk(4), hk(4))
    houseA.fillRect(hk(7), hk(127), hk(4), hk(4))
    roof(houseA, hk(52), hk(49), hk(52), hk(30))
    houseA.generateTexture('harbor-house-a', hk(104), hk(160))
    houseA.destroy()

    // ① 楼房 B：单层大厅（基准 170x120），三开间 + 门楣匾
    const houseB = this.add.graphics()

    houseB.fillStyle(WOOD, 1)
    houseB.fillRect(hk(16), hk(44), hk(138), hk(66))
    houseB.fillStyle(WOOD_LIGHT, 1)
    houseB.fillRect(hk(16), hk(44), hk(138), hk(3))
    houseB.fillStyle(WOOD_DARK, 1)
    houseB.fillRect(hk(16), hk(102), hk(138), hk(10))
    latticeWindow(houseB, hk(26), hk(62), hk(26), hk(26))
    latticeWindow(houseB, hk(122), hk(62), hk(26), hk(26))
    houseB.fillStyle(INK, 1)
    houseB.fillRect(hk(70), hk(74), hk(30), hk(36))
    houseB.fillStyle(GOLD, 1)
    houseB.fillRect(hk(72), hk(76), hk(26), hk(2))
    houseB.fillRect(hk(64), hk(56), hk(42), hk(12))
    houseB.fillStyle(INK, 1)
    houseB.fillRect(hk(66), hk(58), hk(38), hk(8))
    houseB.fillStyle(GOLD, 1)
    houseB.fillRect(hk(70), hk(60), hk(4), hk(4))
    houseB.fillRect(hk(79), hk(60), hk(4), hk(4))
    houseB.fillRect(hk(88), hk(60), hk(4), hk(4))
    roof(houseB, hk(85), hk(47), hk(84), hk(32))
    houseB.generateTexture('harbor-house-b', hk(170), hk(120))
    houseB.destroy()

    // ① 楼房 C：小屋（基准 86x96）
    const houseC = this.add.graphics()

    houseC.fillStyle(WOOD, 1)
    houseC.fillRect(hk(14), hk(36), hk(58), hk(52))
    houseC.fillStyle(WOOD_DARK, 1)
    houseC.fillRect(hk(14), hk(80), hk(58), hk(8))
    latticeWindow(houseC, hk(22), hk(50), hk(18), hk(18))
    houseC.fillStyle(INK, 1)
    houseC.fillRect(hk(48), hk(58), hk(18), hk(30))
    roof(houseC, hk(43), hk(39), hk(42), hk(24))
    houseC.generateTexture('harbor-house-c', hk(86), hk(96))
    houseC.destroy()

    // ① 楼房 D：三层高铺（基准 96x200）
    const houseD = this.add.graphics()

    houseD.fillStyle(WOOD, 1)
    houseD.fillRect(hk(18), hk(40), hk(60), hk(152))
    houseD.fillStyle(WOOD_LIGHT, 1)
    houseD.fillRect(hk(18), hk(40), hk(60), hk(3))
    houseD.fillStyle(WOOD_DARK, 1)
    houseD.fillRect(hk(18), hk(184), hk(60), hk(8))

    for (let floor = 0; floor < 3; floor++) {
      const y = hk(54) + floor * hk(46)

      houseD.fillStyle(WOOD_DARK, 1)
      houseD.fillRect(hk(14), y + hk(34), hk(68), hk(3))
      latticeWindow(houseD, hk(24), y, hk(20), hk(26))
      latticeWindow(houseD, hk(52), y, hk(20), hk(26))
    }

    roof(houseD, hk(48), hk(43), hk(48), hk(26))
    houseD.generateTexture('harbor-house-d', hk(96), hk(200))
    houseD.destroy()

    // ② 牌楼（背面那层）：左边两根柱子 + 枋 + 匾额（背后有背板）+ 两层瓦顶
    const gateBack = this.add.graphics()

    gateBack.fillStyle(WOOD, 1)
    ;[18, 60].forEach((x) => gateBack.fillRect(x - 5, 52, 10, 88))
    gateBack.fillStyle(GOLD, 1)
    ;[18, 60].forEach((x) => gateBack.fillRect(x - 7, 132, 14, 8))
    gateBack.fillStyle(WOOD_DARK, 1)
    gateBack.fillRect(6, 56, 128, 12)
    gateBack.fillRect(6, 86, 128, 6)
    // 匾额 + 背后的背板（原来缺的那块墙）
    gateBack.fillStyle(0x2f3a46, 1)
    gateBack.fillRect(44, 26, 52, 34)
    gateBack.fillStyle(GOLD, 1)
    gateBack.fillRect(50, 34, 40, 20)
    gateBack.fillStyle(INK, 1)
    gateBack.fillRect(54, 38, 6, 6)
    gateBack.fillRect(63, 38, 6, 6)
    gateBack.fillRect(72, 38, 6, 6)
    roof(gateBack, 70, 30, 68, 22)
    roof(gateBack, 70, 12, 48, 16)
    gateBack.generateTexture('harbor-paifang', 140, 140)
    gateBack.destroy()

    // ② 牌楼（前面那层）：右边两根柱子单独一张图，摆的时候 depth 给 11
    //（比史莱姆的 10 高），史莱姆从牌楼下走过去时会被这两根挡住，才有前后感
    const gateFront = this.add.graphics()

    ;[86, 128].forEach((x) => {
      gateFront.fillStyle(WOOD_LIGHT, 1)
      gateFront.fillRect(x - 6, 60, 12, 80)
      gateFront.fillStyle(WOOD_DARK, 1)
      gateFront.fillRect(x - 6, 60, 3, 80)
    })
    gateFront.fillStyle(GOLD, 1)
    ;[86, 128].forEach((x) => gateFront.fillRect(x - 8, 132, 16, 8))
    gateFront.generateTexture('harbor-paifang-front', 140, 140)
    gateFront.destroy()

    // ③ 灯笼串：一根微微下垂的绳 + 三个红灯笼，每只下面三缕流苏（末端带小珠子）（140x80）
    const lanterns = this.add.graphics()

    lanterns.lineStyle(2, INK, 1)
    lanterns.beginPath()
    lanterns.moveTo(4, 8)
    lanterns.lineTo(70, 18)
    lanterns.lineTo(136, 8)
    lanterns.strokePath()

    ;[28, 70, 112].forEach((x, index) => {
      const y = index === 1 ? 30 : 24

      lanterns.fillStyle(INK, 1)
      lanterns.fillRect(x - 1, y - 14, 2, 14)
      lanterns.fillStyle(GOLD, 1)
      lanterns.fillRect(x - 7, y - 3, 14, 3)
      lanterns.fillStyle(LANTERN, 1)
      lanterns.fillEllipse(x, y + 11, 24, 24)
      lanterns.fillStyle(0xff8a6a, 0.5)
      lanterns.fillEllipse(x - 4, y + 7, 10, 10)
      lanterns.fillStyle(GOLD, 1)
      lanterns.fillRect(x - 7, y + 22, 14, 3)

      // 流苏：三缕，长短不一，末端一颗小珠子
      for (let strand = -1; strand <= 1; strand++) {
        const sx = x + strand * 4
        const length = 10 + Math.abs(strand) * 3

        lanterns.fillStyle(strand === 0 ? GOLD : 0xd9773f, 1)
        lanterns.fillRect(sx, y + 25, 2, length)
        lanterns.fillRect(sx - 1, y + 25 + length, 4, 2)
      }
    })

    lanterns.generateTexture('harbor-lanterns', 140, 80)
    lanterns.destroy()

    // ④ 摊位：木篷 + 四根立柱 + 木案，卖的是鱼和肉（110x86，尺寸保持原样不动）
    const stall = this.add.graphics()

    // 后面两根柱子（浅）
    stall.fillStyle(WOOD_DARK, 1)
    ;[16, 92].forEach((x) => stall.fillRect(x - 4, 16, 8, 62))
    // 前面两根柱子（更深一点）
    stall.fillStyle(WOOD, 1)
    ;[34, 74].forEach((x) => stall.fillRect(x - 4, 20, 8, 58))
    // 木篷：三层斜木板 + 一根边梁
    for (let plank = 0; plank < 3; plank++) {
      stall.fillStyle(plank % 2 === 0 ? WOOD_LIGHT : WOOD, 1)
      stall.fillRect(2, 8 + plank * 5, 106, 4)
    }

    stall.fillStyle(WOOD_DARK, 1)
    stall.fillRect(2, 22, 106, 4)
    // 案板 + 四条腿
    stall.fillStyle(WOOD, 1)
    stall.fillRect(10, 50, 90, 7)
    stall.fillStyle(WOOD_DARK, 1)
    ;[14, 94].forEach((x) => stall.fillRect(x, 57, 4, 21))
    ;[30, 78].forEach((x) => stall.fillRect(x, 57, 4, 18))
    // 卖的货：两条挂着的鱼
    const fish = (x: number, y: number) => {
      stall.fillStyle(0x8fb8c9, 1)
      stall.fillEllipse(x, y, 22, 10)
      stall.fillTriangle(x - 11, y, x - 17, y - 5, x - 17, y + 5)
      stall.fillStyle(INK, 1)
      stall.fillRect(x + 6, y - 3, 2, 2)
    }

    stall.fillStyle(INK, 1)
    stall.fillRect(30, 26, 2, 8)
    stall.fillRect(74, 26, 2, 8)
    fish(30, 40)
    fish(74, 40)
    // 两片肉
    stall.fillStyle(0xb04a3a, 1)
    stall.fillEllipse(46, 46, 16, 8)
    stall.fillEllipse(62, 46, 14, 7)
    stall.fillStyle(0xe8c9b0, 1)
    stall.fillRect(46, 42, 10, 3)
    stall.fillRect(62, 42, 8, 3)

    stall.generateTexture('harbor-stall', 110, 86)
    stall.destroy()

    // 街上的摊位：结构和港口那个一样，但卖的东西不同 —— 码头卖鱼肉，
    // 街上卖的是青菜（两把）、果子（一筐）、还有一摞蒸笼
    const streetStall = this.add.graphics()

    streetStall.fillStyle(WOOD_DARK, 1)
    ;[16, 92].forEach((x) => streetStall.fillRect(x - 4, 16, 8, 62))
    streetStall.fillStyle(WOOD, 1)
    ;[34, 74].forEach((x) => streetStall.fillRect(x - 4, 20, 8, 58))
    for (let plank = 0; plank < 3; plank++) {
      streetStall.fillStyle(plank % 2 === 0 ? 0xc9b083 : 0x8a7458, 1)
      streetStall.fillRect(2, 8 + plank * 5, 106, 4)
    }
    streetStall.fillStyle(WOOD_DARK, 1)
    streetStall.fillRect(2, 22, 106, 4)
    streetStall.fillStyle(WOOD, 1)
    streetStall.fillRect(10, 50, 90, 7)
    streetStall.fillStyle(WOOD_DARK, 1)
    ;[14, 94].forEach((x) => streetStall.fillRect(x, 57, 4, 21))
    ;[30, 78].forEach((x) => streetStall.fillRect(x, 57, 4, 18))
    // 两把青菜（叶 + 白梗）
    const greens = (x: number) => {
      streetStall.fillStyle(0x6fae53, 1)
      streetStall.fillEllipse(x, 42, 18, 12)
      streetStall.fillStyle(0x8fd06a, 1)
      streetStall.fillEllipse(x - 3, 40, 11, 8)
      streetStall.fillStyle(0xe8e4d8, 1)
      streetStall.fillRect(x - 2, 46, 4, 6)
    }

    greens(28)
    greens(50)
    // 一筐果子
    streetStall.fillStyle(0xb0852f, 1)
    streetStall.fillEllipse(78, 46, 26, 12)
    streetStall.fillStyle(0xe08a3a, 1)
    streetStall.fillEllipse(72, 42, 8, 7)
    streetStall.fillEllipse(80, 41, 8, 7)
    streetStall.fillEllipse(76, 37, 8, 7)
    // 一摞蒸笼
    streetStall.fillStyle(0xd9c9a0, 1)
    streetStall.fillRect(96, 36, 12, 6)
    streetStall.fillRect(96, 43, 12, 6)
    streetStall.fillStyle(0xa89372, 1)
    streetStall.fillRect(96, 41, 12, 2)
    streetStall.fillRect(96, 48, 12, 2)

    streetStall.generateTexture('harbor-stall-street', 110, 86)
    streetStall.destroy()

    // 摊位的**背面**（前景用）：只能看到木篷的背面、两根立柱和案板边，
    // 挂在篷下的鱼和案上的肉都看不见了
    const stallBack = this.add.graphics()

    stallBack.fillStyle(WOOD_DARK, 1)
    ;[14, 94].forEach((x) => stallBack.fillRect(x - 5, 14, 10, 64))
    for (let plank = 0; plank < 3; plank++) {
      stallBack.fillStyle(plank % 2 === 0 ? 0x6b543a : 0x7a6247, 1)
      stallBack.fillRect(0, 6 + plank * 5, 110, 4)
    }

    stallBack.fillStyle(0x4a3a2a, 1)
    stallBack.fillRect(0, 20, 110, 5)
    // 案板的下沿（背面只露出这一条）
    stallBack.fillStyle(WOOD, 1)
    stallBack.fillRect(8, 50, 94, 6)
    stallBack.fillStyle(WOOD_DARK, 1)
    stallBack.fillRect(8, 56, 94, 3)
    ;[12, 92].forEach((x) => stallBack.fillRect(x, 56, 5, 22))
    ;[30, 76].forEach((x) => stallBack.fillRect(x, 56, 4, 18))

    stallBack.generateTexture('harbor-stall-back', 110, 86)
    stallBack.destroy()

    // 木箱（后景/障碍用，30x30）
    const crate = this.add.graphics()

    crate.fillStyle(0x8a6a3a, 1)
    crate.fillRect(2, 4, 26, 24)
    crate.fillStyle(0x6b5228, 1)
    crate.fillRect(2, 4, 26, 3)
    crate.fillRect(2, 25, 26, 3)
    crate.fillRect(2, 4, 3, 24)
    crate.fillRect(25, 4, 3, 24)
    crate.fillRect(4, 12, 22, 2)
    crate.fillRect(4, 19, 22, 2)
    crate.fillStyle(0x5a4a28, 1)
    crate.fillRect(14, 4, 3, 24)
    crate.generateTexture('harbor-crate', 30, 30)
    crate.destroy()

    // 街边房屋的**背面**（前景用）：门窗都没有，只有一面后墙 + 屋檐，
    // 史莱姆走到它后面时靠"透视"露出来（图层那块）。
    const houseBack = this.add.graphics()

    houseBack.fillStyle(0x5f2c24, 1)
    houseBack.fillRect(hk(16), hk(46), hk(72), hk(104))
    houseBack.fillStyle(0x4a2018, 1)
    houseBack.fillRect(hk(16), hk(46), hk(72), hk(3))
    houseBack.fillRect(hk(16), hk(142), hk(72), hk(10))
    // 后门（关着的一块板）
    houseBack.fillStyle(0x4a3a2a, 1)
    houseBack.fillRect(hk(46), hk(104), hk(24), hk(46))
    houseBack.fillStyle(0x6b543a, 1)
    houseBack.fillRect(hk(48), hk(106), hk(20), hk(3))
    // 屋檐：和正面那几栋同一套，但整条压暗一点
    const roofGfx = houseBack

    roof(roofGfx, hk(52), hk(49), hk(52), hk(30))
    // 屋脊压一道后墙的暗色，表示看到的是背面
    houseBack.fillStyle(0x2a1a16, 0.25)
    houseBack.fillRect(hk(16), hk(46), hk(72), hk(104))

    houseBack.generateTexture('harbor-house-back', hk(104), hk(160))
    houseBack.destroy()

    // ⑤ 街上的史莱姆：一张图一只（以前是五只挤在一长条里，太挤了）。
    // 大小 1 的那只和主角一样大；朝向有正面对镜头的、有侧身的、有背过去的。
    // 每一段里只摆两只，而且隔开摆 —— 见 GameScene 里的 HARBOR_BLOCKS
    const makeHarborSlime = (
      key: string,
      color: number,
      facing: 'front' | 'side' | 'back',
      scale: number
    ) => {
      const gfx = this.add.graphics()
      const w = 30 * scale
      const h = 23 * scale
      const canvasW = Math.ceil(w) + 6
      const canvasH = Math.ceil(h) + 6
      const cx = canvasW / 2
      const cy = canvasH - 3 - h / 2

      gfx.fillStyle(0x14141f, 1)
      gfx.fillEllipse(cx, cy, w + 2, h + 2)
      gfx.fillStyle(color, 1)
      gfx.fillEllipse(cx, cy, w, h)
      // 顶部高光：背过去的也留一点，看着还是圆润的史莱姆
      gfx.fillStyle(0xffffff, 0.42)
      gfx.fillEllipse(cx - w * 0.16, cy - h * 0.28, w * 0.3, h * 0.25)

      if (facing === 'front') {
        // 正面：两只眼
        gfx.fillStyle(0x1a1a22, 1)
        gfx.fillRect(cx - 5 * scale, cy - 1, 3 * scale, 3 * scale)
        gfx.fillRect(cx + 2 * scale, cy - 1, 3 * scale, 3 * scale)
      } else if (facing === 'side') {
        // 侧身：一只眼
        gfx.fillStyle(0x1a1a22, 1)
        gfx.fillRect(cx + 2 * scale, cy - 1, 3 * scale, 3 * scale)
      } else {
        // 背过去：只在背上压一小块暗色，表示是背面
        gfx.fillStyle(0x000000, 0.16)
        gfx.fillEllipse(cx, cy + h * 0.18, w * 0.55, h * 0.3)
      }

      gfx.generateTexture(key, canvasW, canvasH)
      gfx.destroy()
    }

    makeHarborSlime('harbor-slime-a', 0xd9a441, 'front', 1)
    makeHarborSlime('harbor-slime-b', 0x74d0b0, 'back', 0.8)
    // 绿色这只原来画的是侧身（一只眼），看着像坏了 —— 改成正面两只眼
    makeHarborSlime('harbor-slime-c', 0x7bc86c, 'front', 1.15)
    makeHarborSlime('harbor-slime-d', 0xb388ff, 'back', 0.68)

    // ⑥ 船：三种 —— 船壳 + 桅杆 + 方帆（方帆挑高）+ 船头灯笼，大的还带船舱
    const hull = (
      gfx: Phaser.GameObjects.Graphics,
      left: number,
      right: number,
      deckY: number,
      bottomY: number
    ) => {
      gfx.fillStyle(WOOD_DARK, 1)
      gfx.fillPoints(
        [
          new Phaser.Math.Vector2(left, deckY),
          new Phaser.Math.Vector2(right, deckY),
          new Phaser.Math.Vector2(right - 14, bottomY),
          new Phaser.Math.Vector2(left + 14, bottomY),
        ],
        true
      )
      gfx.fillStyle(WOOD, 1)
      gfx.fillRect(left + 2, deckY - 5, right - left - 4, 7)
      gfx.fillStyle(0x3a2a20, 1)
      gfx.fillRect(left + 16, (deckY + bottomY) / 2, right - left - 32, 3)
      gfx.fillRect(left + 20, (deckY + bottomY) / 2 + 7, right - left - 40, 3)
    }

    const sail = (
      gfx: Phaser.GameObjects.Graphics,
      x: number,
      topY: number,
      width: number,
      height: number
    ) => {
      gfx.fillStyle(PAPER, 1)
      gfx.fillPoints(
        [
          new Phaser.Math.Vector2(x, topY),
          new Phaser.Math.Vector2(x + width, topY + 6),
          new Phaser.Math.Vector2(x + width, topY + height),
          new Phaser.Math.Vector2(x, topY + height + 4),
        ],
        true
      )
      gfx.fillStyle(0xc9bfae, 1)
      gfx.fillRect(x, topY, width, 2)
      gfx.fillRect(x, topY, 2, height + 4)
      gfx.fillRect(x + width - 2, topY + 6, 2, height - 6)
      // 竹骨
      for (let rib = 1; rib < 5; rib++) {
        gfx.fillRect(x, topY + (height / 5) * rib, width, 1)
      }
    }

    // 船 A：小舢板（120x64）
    const boatA = this.add.graphics()

    hull(boatA, 4, 116, 40, 60)
    boatA.fillStyle(WOOD_DARK, 1)
    boatA.fillRect(58, 2, 3, 40)
    sail(boatA, 61, 6, 34, 30)
    boatA.generateTexture('harbor-boat-a', 120, 64)
    boatA.destroy()

    // 船 B：渔船，方帆挑高 + 船头灯笼（168x130）
    const boatB = this.add.graphics()

    hull(boatB, 4, 164, 104, 128)
    boatB.fillStyle(WOOD_DARK, 1)
    boatB.fillRect(80, 4, 4, 100)
    sail(boatB, 84, 10, 62, 84)
    boatB.fillStyle(WOOD_DARK, 1)
    boatB.fillRect(25, 60, 3, 10)
    boatB.fillStyle(LANTERN, 1)
    boatB.fillEllipse(26, 78, 18, 18)
    boatB.fillStyle(GOLD, 1)
    boatB.fillRect(20, 68, 12, 3)
    boatB.fillRect(20, 86, 12, 3)
    boatB.generateTexture('harbor-boat-b', 168, 130)
    boatB.destroy()

    // 船 C：带船舱的货船，船舱也是瓦顶（220x150）
    const boatC = this.add.graphics()

    hull(boatC, 4, 216, 120, 146)
    boatC.fillStyle(WOOD, 1)
    boatC.fillRect(30, 74, 66, 46)
    boatC.fillStyle(WOOD_DARK, 1)
    boatC.fillRect(30, 112, 66, 8)
    latticeWindow(boatC, 40, 88, 18, 18)
    boatC.fillStyle(INK, 1)
    boatC.fillRect(70, 96, 18, 24)
    roof(boatC, 63, 76, 44, 22)
    boatC.fillStyle(WOOD_DARK, 1)
    boatC.fillRect(140, 6, 4, 116)
    sail(boatC, 144, 12, 60, 88)
    boatC.generateTexture('harbor-boat-c', 220, 150)
    boatC.destroy()

    // ⑦ 玉京台的石栏杆。**做成有立体感的一版**（用户要求：太平了会糊在背后那面砖墙上分不出来）：
    //    每道构件都"顶面高光 + 正面中间色 + 下沿深色描边"，立柱左边亮、右边暗，看着是圆柱
    //   · rail-stone：一整段栏杆（上下两道横杆 + 一根立柱 + 柱头），横向平铺就是一道栏杆
    //   · rail-band：只有一道横杆，给斜着的楼梯栏杆用（斜着摆放不会露馅）
    const stoneRail = this.add.graphics()

    stoneRail.fillStyle(0x9b876d, 1)         // 上横杆：顶面高光
    stoneRail.fillRect(0, 0, 24, 3)
    stoneRail.fillStyle(0x6a5a48, 1)         // 上横杆：正面
    stoneRail.fillRect(0, 3, 24, 6)
    stoneRail.fillStyle(0x33291f, 1)         // 上横杆：下沿描边
    stoneRail.fillRect(0, 9, 24, 2)
    stoneRail.fillStyle(0x7c6a56, 1)         // 下横杆
    stoneRail.fillRect(0, 17, 24, 3)
    stoneRail.fillStyle(0x33291f, 1)
    stoneRail.fillRect(0, 20, 24, 2)
    stoneRail.fillStyle(0x6a5a48, 1)         // 立柱
    stoneRail.fillRect(9, 4, 6, 22)
    stoneRail.fillStyle(0x93805f, 1)         // 立柱左侧受光
    stoneRail.fillRect(9, 4, 2, 22)
    stoneRail.fillStyle(0x463a2c, 1)         // 立柱右侧背光
    stoneRail.fillRect(14, 4, 1, 22)
    stoneRail.fillStyle(0x9b876d, 1)         // 柱头
    stoneRail.fillRect(7, 0, 10, 4)
    stoneRail.fillStyle(0x33291f, 1)
    stoneRail.fillRect(7, 4, 10, 1)
    stoneRail.generateTexture('rail-stone', 24, 26)
    stoneRail.destroy()

    const stoneBand = this.add.graphics()

    stoneBand.fillStyle(0x9b876d, 1)
    stoneBand.fillRect(0, 0, 32, 2)
    stoneBand.fillStyle(0x6a5a48, 1)
    stoneBand.fillRect(0, 2, 32, 4)
    stoneBand.fillStyle(0x33291f, 1)
    stoneBand.fillRect(0, 6, 32, 2)
    stoneBand.generateTexture('rail-band', 32, 8)
    stoneBand.destroy()

    // 玉京台半层小平台用的"端头护栏"：一根带柱头的石柱（放在平台外沿那头），同样带描边
    const railEnd = this.add.graphics()

    railEnd.fillStyle(0x6a5a48, 1)         // 柱身
    railEnd.fillRect(3, 6, 8, 23)
    railEnd.fillStyle(0x93805f, 1)         // 柱身受光面
    railEnd.fillRect(3, 6, 3, 23)
    railEnd.fillStyle(0x463a2c, 1)         // 柱身背光面
    railEnd.fillRect(10, 6, 1, 23)
    railEnd.fillStyle(0x9b876d, 1)         // 柱头
    railEnd.fillRect(1, 0, 12, 6)
    railEnd.fillStyle(0x33291f, 1)         // 柱头下沿描边
    railEnd.fillRect(1, 6, 12, 2)
    railEnd.fillStyle(0x4a3f33, 1)         // 柱础
    railEnd.fillRect(2, 29, 10, 1)
    railEnd.generateTexture('rail-end', 14, 30)
    railEnd.destroy()
  }

  // 岩刺造物：背后一层贴在建筑上的岩壳，前面收成锥口，口上一点金。
  // 贴图画的是「朝下」，贴天花板直接用，贴左墙 / 右墙靠旋转
  // 第十关的陆地“层楼”打包：两层茶楼、三层客栈和一间单层小铺。
  // 建筑本身只负责画面；可站立的楼层在 LAND_BLOCKS 的 platforms 里单独给。
  private makeLandBuildings() {
    const P = (x: number, y: number) => new Phaser.Math.Vector2(x, y)
    const ROOF = 0x314447
    const ROOF_LIGHT = 0x446066
    const TILE = 0x223033
    const WALL = 0xefe0c4
    const WALL_SHADE = 0xd8c4a2
    const TIMBER = 0x6b3f2a
    const TIMBER_DARK = 0x3f261b
    const GOLD = 0xd9a441
    const RED = 0xb03a2e

    const roof = (
      g: Phaser.GameObjects.Graphics,
      x: number,
      y: number,
      w: number,
      h: number
    ) => {
      g.fillStyle(TIMBER_DARK, 1)
      g.fillPoints([P(x, y + h), P(x + 10, y), P(x + w - 10, y), P(x + w, y + h)], true)
      g.fillStyle(ROOF, 1)
      g.fillPoints([P(x + 2, y + h - 3), P(x + 12, y + 2), P(x + w - 12, y + 2), P(x + w - 2, y + h - 3)], true)
      g.fillStyle(ROOF_LIGHT, 1)
      g.fillPoints([P(x + 12, y + 3), P(x + w - 12, y + 3), P(x + w - 18, y + 8), P(x + 18, y + 8)], true)
      // 上翘的檐角
      g.fillStyle(TIMBER_DARK, 1)
      g.fillTriangle(x + 2, y + h - 2, x - 10, y + h - 10, x + 18, y + h - 10)
      g.fillTriangle(x + w - 2, y + h - 2, x + w + 10, y + h - 10, x + w - 18, y + h - 10)
      // 瓦缝
      g.lineStyle(1, TILE, 0.55)
      for (let tx = x + 18; tx < x + w - 18; tx += 16) {
        g.lineBetween(tx, y + 4, tx - 5, y + h - 4)
      }
      g.lineStyle(1, TILE, 0.7)
      g.lineBetween(x + 8, y + h - 4, x + w - 8, y + h - 4)
    }

    const windowBox = (
      g: Phaser.GameObjects.Graphics,
      x: number,
      y: number,
      w: number,
      h: number
    ) => {
      g.fillStyle(TIMBER_DARK, 1)
      g.fillRect(x, y, w, h)
      g.fillStyle(0xffd54f, 0.5)
      g.fillRect(x + 2, y + 2, w - 4, h - 4)
      g.lineStyle(1, TIMBER, 0.9)
      g.lineBetween(x + w / 2, y + 2, x + w / 2, y + h - 2)
      g.lineBetween(x + 2, y + h / 2, x + w - 2, y + h / 2)
      for (let lx = x + 5; lx < x + w - 2; lx += 7) {
        g.lineBetween(lx, y + 2, lx, y + h - 2)
      }
    }

    const lantern = (g: Phaser.GameObjects.Graphics, x: number, y: number) => {
      g.fillStyle(TIMBER_DARK, 1)
      g.fillRect(x, y - 8, 1, 8)
      g.fillStyle(GOLD, 1)
      g.fillRect(x - 4, y - 9, 9, 2)
      g.fillStyle(RED, 1)
      g.fillEllipse(x, y, 8, 10)
      g.fillStyle(0xe05a3a, 1)
      g.fillEllipse(x - 1, y - 1, 5, 7)
      g.fillStyle(GOLD, 1)
      g.fillRect(x - 4, y + 3, 9, 1)
      g.fillRect(x - 1, y + 5, 3, 3)
    }

    const sign = (g: Phaser.GameObjects.Graphics, x: number, y: number, h: number) => {
      g.fillStyle(TIMBER_DARK, 1)
      g.fillRect(x - 2, y - 2, 16, h + 4)
      g.fillStyle(RED, 1)
      g.fillRect(x, y, 12, h)
      g.fillStyle(GOLD, 1)
      g.fillRect(x + 2, y + 3, 8, 1)
      g.fillRect(x + 2, y + h / 2, 8, 1)
      g.fillRect(x + 2, y + h - 4, 8, 1)
    }

    // ── 两层茶楼（380x300）──
    const two = this.add.graphics()
    two.fillStyle(0x5e5348, 1)
    two.fillRect(20, 284, 340, 16)
    two.fillStyle(WALL, 1)
    two.fillRect(30, 240, 320, 50)
    two.fillStyle(0x241a12, 1)
    two.fillRect(60, 250, 260, 40)
    two.fillStyle(0x9a6a2a, 0.3)
    two.fillRect(70, 256, 240, 26)
    two.fillStyle(TIMBER, 1)
    two.fillRect(50, 278, 280, 8)
    ;[40, 110, 240, 340].forEach((x) => two.fillRect(x, 240, 8, 50))
    roof(two, 10, 222, 360, 22)

    two.fillStyle(WALL, 1)
    two.fillRect(40, 180, 300, 44)
    two.fillStyle(WALL_SHADE, 1)
    two.fillRect(40, 216, 300, 8)
    windowBox(two, 70, 190, 44, 24)
    windowBox(two, 170, 190, 44, 24)
    windowBox(two, 270, 190, 44, 24)

    // 二层墙与屋顶之间的阁楼墙：一直顶到屋顶底边 104，不能留缝
    two.fillStyle(WALL, 1)
    two.fillRect(50, 104, 280, 78)
    two.fillStyle(WALL_SHADE, 1)
    two.fillRect(50, 176, 280, 6)
    two.fillStyle(TIMBER, 1)
    two.fillRect(56, 104, 6, 76)
    two.fillRect(318, 104, 6, 76)
    two.fillRect(50, 144, 280, 4)
    windowBox(two, 170, 142, 40, 22)

    // 二楼挑台：只留地板和一道矮边，不做高栅栏，免得把上层房子挡在外面
    two.fillStyle(TIMBER, 1)
    two.fillRect(28, 174, 324, 9)
    two.fillStyle(0x8a6a44, 1)
    two.fillRect(30, 176, 320, 3)
    two.fillStyle(TIMBER_DARK, 1)
    two.fillRect(34, 171, 314, 3)

    roof(two, 16, 104, 348, 30)
    roof(two, 36, 38, 308, 70)
    sign(two, 322, 196, 44)
    lantern(two, 48, 178)
    lantern(two, 336, 178)
    two.generateTexture('land-house-two', 380, 300)
    two.destroy()

    // ── 三层客栈（400x420）──
    const three = this.add.graphics()
    three.fillStyle(0x5e5348, 1)
    three.fillRect(20, 404, 360, 16)
    three.fillStyle(WALL, 1)
    three.fillRect(30, 360, 340, 50)
    three.fillStyle(0x241a12, 1)
    three.fillRect(60, 370, 280, 40)
    three.fillStyle(0x9a6a2a, 0.28)
    three.fillRect(70, 376, 260, 24)
    three.fillStyle(TIMBER, 1)
    three.fillRect(50, 398, 300, 8)
    ;[40, 120, 280, 350].forEach((x) => three.fillRect(x, 360, 8, 50))
    roof(three, 10, 342, 380, 22)

    three.fillStyle(WALL, 1)
    three.fillRect(40, 280, 320, 62)
    three.fillStyle(WALL_SHADE, 1)
    three.fillRect(40, 332, 320, 8)
    windowBox(three, 70, 292, 48, 26)
    windowBox(three, 176, 292, 48, 26)
    windowBox(three, 282, 292, 48, 26)
    three.fillStyle(TIMBER, 1)
    three.fillRect(28, 272, 344, 9)
    three.fillStyle(0x8a6a44, 1)
    three.fillRect(30, 274, 340, 3)
    // 二层挑台：只留地板和矮边，不做高栅栏
    three.fillStyle(TIMBER_DARK, 1)
    three.fillRect(34, 268, 334, 3)

    three.fillStyle(WALL, 1)
    three.fillRect(50, 190, 300, 60)
    three.fillStyle(WALL_SHADE, 1)
    three.fillRect(50, 242, 300, 8)
    windowBox(three, 82, 202, 42, 26)
    windowBox(three, 180, 202, 42, 26)
    windowBox(three, 278, 202, 42, 26)

    // 三层墙底(250)到二层挑台(272)之间补实墙体：撤掉高栅栏后这里原来露空了
    three.fillStyle(WALL, 1)
    three.fillRect(40, 250, 320, 22)
    three.fillStyle(WALL_SHADE, 1)
    three.fillRect(40, 266, 320, 6)
    three.fillStyle(TIMBER, 1)
    three.fillRect(40, 250, 320, 4)
    three.fillRect(40, 268, 320, 4)
    three.fillRect(40, 250, 6, 22)
    three.fillRect(354, 250, 6, 22)

    // 三层墙与屋顶之间的阁楼墙，一直顶到屋顶底边 104
    three.fillStyle(WALL, 1)
    three.fillRect(58, 104, 284, 86)
    three.fillStyle(WALL_SHADE, 1)
    three.fillRect(58, 184, 284, 6)
    three.fillStyle(TIMBER, 1)
    three.fillRect(64, 104, 6, 84)
    three.fillRect(330, 104, 6, 84)
    three.fillRect(58, 148, 284, 4)
    windowBox(three, 176, 142, 44, 24)

    three.fillStyle(TIMBER, 1)
    three.fillRect(38, 182, 324, 9)
    three.fillStyle(0x8a6a44, 1)
    three.fillRect(40, 184, 320, 3)
    // 三层挑台：同样只留地板和矮边
    three.fillStyle(TIMBER_DARK, 1)
    three.fillRect(44, 178, 314, 3)

    roof(three, 16, 104, 368, 30)
    roof(three, 40, 36, 320, 70)
    sign(three, 340, 290, 54)
    lantern(three, 50, 276)
    lantern(three, 354, 276)
    lantern(three, 50, 186)
    lantern(three, 354, 186)
    three.generateTexture('land-house-three', 400, 420)
    three.destroy()

    // ── 单层小铺（220x150）──
    const shop = this.add.graphics()
    shop.fillStyle(0x5e5348, 1)
    shop.fillRect(10, 140, 200, 10)
    shop.fillStyle(WALL, 1)
    shop.fillRect(20, 90, 180, 50)
    shop.fillStyle(0x241a12, 1)
    shop.fillRect(40, 100, 140, 40)
    shop.fillStyle(0xd9a441, 0.28)
    shop.fillRect(48, 106, 124, 24)
    shop.fillStyle(TIMBER, 1)
    shop.fillRect(30, 128, 160, 6)
    ;[24, 190].forEach((x) => shop.fillRect(x, 90, 6, 50))
    roof(shop, 6, 74, 208, 18)
    sign(shop, 180, 104, 30)
    lantern(shop, 34, 92)
    shop.generateTexture('land-shop', 220, 150)
    shop.destroy()
  }

  // 往生堂（420x300）：地图中央的独立建筑，深色木构、白墙、黑门和纸灯笼。
  private makeWangShengTang() {
    const P = (x: number, y: number) => new Phaser.Math.Vector2(x, y)
    const ROOF = 0x2b3c3f
    const ROOF_LIGHT = 0x3d5458
    const WALL = 0xe8e0d0
    const WALL_SHADE = 0xd2c6b2
    const TIMBER = 0x3f2a1c
    const TIMBER_DARK = 0x241811
    const GOLD = 0xd9a441
    const PAPER = 0xf6f0dc
    const g = this.add.graphics()

    const roof = (x: number, w: number, base: number, h: number) => {
      g.fillStyle(TIMBER_DARK, 1)
      g.fillPoints([P(x, base), P(x + 12, base - h), P(x + w - 12, base - h), P(x + w, base)], true)
      g.fillStyle(ROOF, 1)
      g.fillPoints([P(x + 3, base - 3), P(x + 14, base - h + 2), P(x + w - 14, base - h + 2), P(x + w - 3, base - 3)], true)
      g.fillStyle(ROOF_LIGHT, 1)
      g.fillRect(x + 18, base - h + 4, w - 36, 2)
      g.fillTriangle(x, base, x - 12, base - 10, x + 18, base - 6)
      g.fillTriangle(x + w, base, x + w + 12, base - 10, x + w - 18, base - 6)
      g.lineStyle(1, 0x1c292c, 0.6)
      for (let tx = x + 24; tx < x + w - 20; tx += 18) {
        g.lineBetween(tx, base - h + 5, tx - 5, base - 4)
      }
    }

    // 地基与台阶
    g.fillStyle(0x4f453b, 1)
    g.fillRect(10, 284, 400, 16)
    g.fillStyle(0x6a5e52, 1)
    g.fillRect(140, 284, 140, 6)
    g.fillStyle(0x8a7c69, 1)
    g.fillRect(146, 280, 128, 5)

    // 一层白墙与木构
    g.fillStyle(WALL, 1)
    g.fillRect(30, 190, 360, 94)
    g.fillStyle(WALL_SHADE, 1)
    g.fillRect(30, 272, 360, 12)
    g.fillStyle(TIMBER, 1)
    g.fillRect(30, 190, 360, 8)
    g.fillRect(30, 276, 360, 8)
    ;[30, 90, 150, 270, 330, 390].forEach((x) => g.fillRect(x, 190, 8, 94))

    // 侧面格窗
    const windowBox = (x: number, y: number, w: number, h: number) => {
      g.fillStyle(TIMBER_DARK, 1)
      g.fillRect(x, y, w, h)
      g.fillStyle(0xd9b978, 0.5)
      g.fillRect(x + 2, y + 2, w - 4, h - 4)
      g.lineStyle(1, TIMBER, 0.9)
      for (let lx = x + 5; lx < x + w - 2; lx += 7) {
        g.lineBetween(lx, y + 2, lx, y + h - 2)
      }
      g.lineBetween(x + 2, y + h / 2, x + w - 2, y + h / 2)
    }

    windowBox(56, 216, 62, 34)
    windowBox(302, 216, 62, 34)

    // 黑门与门钉
    g.fillStyle(0x120e0a, 1)
    g.fillRect(160, 210, 100, 74)
    g.fillStyle(TIMBER_DARK, 1)
    g.fillRect(160, 210, 100, 6)
    g.fillStyle(0x2a2118, 1)
    g.fillRect(164, 218, 44, 66)
    g.fillRect(212, 218, 44, 66)
    g.fillStyle(GOLD, 1)
    g.fillRect(206, 218, 4, 66)
    for (let row = 0; row < 4; row++) {
      for (let col = 0; col < 2; col++) {
        g.fillCircle(176 + col * 24, 228 + row * 15, 2)
        g.fillCircle(224 + col * 24 - 24, 228 + row * 15, 2)
      }
    }

    // 门上的黑底金框匾额
    g.fillStyle(0x120e0a, 1)
    g.fillRect(172, 194, 76, 18)
    g.lineStyle(1, GOLD, 0.9)
    g.strokeRect(172, 194, 76, 18)
    g.fillStyle(GOLD, 1)
    g.fillRect(180, 201, 10, 2)
    g.fillRect(198, 201, 20, 2)
    g.fillRect(226, 201, 10, 2)

    // 门口两盏白纸灯笼
    const paperLantern = (x: number) => {
      g.fillStyle(TIMBER_DARK, 1)
      g.fillRect(x, 190, 1, 18)
      g.fillStyle(GOLD, 1)
      g.fillRect(x - 5, 206, 11, 3)
      g.fillStyle(PAPER, 1)
      g.fillEllipse(x, 220, 18, 24)
      g.fillStyle(0xffffff, 0.7)
      g.fillEllipse(x - 2, 216, 10, 15)
      g.fillStyle(GOLD, 1)
      g.fillRect(x - 5, 232, 11, 3)
    }

    paperLantern(126)
    paperLantern(294)

    // 二层
    g.fillStyle(WALL, 1)
    g.fillRect(50, 100, 320, 90)
    g.fillStyle(WALL_SHADE, 1)
    g.fillRect(50, 180, 320, 10)
    g.fillStyle(TIMBER, 1)
    g.fillRect(50, 100, 320, 8)
    ;[50, 120, 200, 280, 350].forEach((x) => g.fillRect(x, 100, 8, 90))
    windowBox(74, 126, 56, 38)
    windowBox(182, 126, 56, 38)
    windowBox(290, 126, 56, 38)

    // 二层外挑木台
    g.fillStyle(TIMBER, 1)
    g.fillRect(40, 180, 340, 9)
    g.fillStyle(0x6b4a2c, 1)
    g.fillRect(42, 182, 336, 3)
    g.fillStyle(TIMBER_DARK, 1)
    for (let x = 48; x <= 372; x += 24) {
      g.fillRect(x, 160, 4, 22)
    }
    g.fillRect(44, 163, 328, 3)

    // 屋顶
    roof(36, 348, 104, 34)
    roof(64, 292, 70, 70)

    // 屋脊与两端小兽
    g.fillStyle(TIMBER_DARK, 1)
    g.fillRect(64, 36, 292, 5)
    g.fillRect(58, 26, 10, 12)
    g.fillRect(352, 26, 10, 12)

    g.generateTexture('wang-sheng-tang', 420, 300)
    g.destroy()
  }

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

    // 普通态：亮金岩脊（跟着身体一起往金色偏了一档）
    const gfx = this.add.graphics()
    const peaks: Array<[number, number]> = [
      [2, 9],
      [16, 0],
      [30, 9],
    ]

    for (let step = 0; step < 6; step++) {
      const t = step / 5
      const inset = step * 0.9

      gfx.fillStyle(this.mixColor(0x8f6c1e, 0x3a2f14, t), 1)
      ridge(
        gfx,
        1 + inset,
        31 - inset,
        peaks.map(([x, y]) => [x, y + step * 0.9]),
        5,
        0.5 + step * 0.9
      )
    }

    gfx.fillStyle(0xbba03f, 1)
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
      gfx.fillStyle(0xe3b83c, layer.alpha)
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

      armor.fillStyle(this.mixColor(0x5f4e28, 0x2b2412, t), 1)
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

    armor.fillStyle(this.mixColor(0x5f4e28, 0x2b2412, 0.4), 1)

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
      armor.fillStyle(0xb08a30, layer.alpha)
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
  // ── 玉京台的两座巨型房子（2026/10/11 第一版，等用户审外观）──────────
  // 玉京台在璃月城的最高处：白石台基 + 朱红立柱 + 琉璃绿瓦的大屋顶。
  // 一段打包 460 宽正好放一栋，底边坐在台面（880）上；高不过 ~190，
  // 站在台面上抬头看得到整座屋顶（镜头抬起来之后上方只剩 ~190 像素可见）
  private makeTerraceHouses() {
    const TILE = 0x2f7f6a
    const TILE_LIGHT = 0x54b09a
    const TILE_DARK = 0x1d5949
    const STONE = 0xd3cbb8
    const STONE_MID = 0xb8ae98
    const STONE_DARK = 0x8f8570
    const WOOD = 0x8a3f30
    const WOOD_LIGHT = 0xa4513c
    const WOOD_DARK = 0x5f2a20
    const GOLD = 0xd9a441
    const INK = 0x2a1a16
    const LANTERN = 0xc0392b

    // 格窗：金框 + 暗窗 + 窗棂
    const lattice = (
      gfx: Phaser.GameObjects.Graphics,
      x: number,
      y: number,
      w: number,
      h: number
    ) => {
      gfx.fillStyle(GOLD, 1)
      gfx.fillRect(x, y, w, h)
      gfx.fillStyle(INK, 1)
      gfx.fillRect(x + 2, y + 2, w - 4, h - 4)
      gfx.fillStyle(GOLD, 1)

      for (let gx = x + 5; gx < x + w - 3; gx += 6) {
        gfx.fillRect(gx, y + 2, 1, h - 4)
      }

      for (let gy = y + 5; gy < y + h - 3; gy += 6) {
        gfx.fillRect(x + 2, gy, w - 4, 1)
      }
    }

    // 琉璃绿瓦的屋顶：底边压在 baseY（墙顶），竖瓦垄往上收，
    // 檐口一道瓦当、脊上一条屋脊 + 金宝顶。
    // corners = 两头上翘的飞檐（单独一栋房子用）；连廊要一段接一段拼，传 false 就是平檐
    const glazedRoof = (
      gfx: Phaser.GameObjects.Graphics,
      cx: number,
      baseY: number,
      half: number,
      thickness: number,
      corners = true
    ) => {
      const topHalf = half * 0.36

      gfx.fillStyle(TILE, 1)
      gfx.fillPoints(
        [
          new Phaser.Math.Vector2(cx - half, baseY),
          new Phaser.Math.Vector2(cx - topHalf, baseY - thickness),
          new Phaser.Math.Vector2(cx + topHalf, baseY - thickness),
          new Phaser.Math.Vector2(cx + half, baseY),
        ],
        true
      )

      gfx.fillStyle(TILE_DARK, 1)
      for (let i = -5; i <= 5; i++) {
        gfx.fillRect(cx + (i / 5) * topHalf - 1, baseY - thickness + 2, 2, thickness - 3)
      }
      gfx.fillStyle(TILE_LIGHT, 1)
      gfx.fillRect(cx - topHalf, baseY - thickness, topHalf * 2, 2)
      gfx.fillStyle(TILE_DARK, 1)
      gfx.fillRect(cx - half, baseY - 2, half * 2, 3)

      if (corners) {
        gfx.fillTriangle(cx - half, baseY - 1, cx - half - 8, baseY - 14, cx - half + 5, baseY - 6)
        gfx.fillTriangle(cx + half, baseY - 1, cx + half + 8, baseY - 14, cx + half - 5, baseY - 6)
      }

      gfx.fillRect(cx - topHalf + 2, baseY - thickness - 4, topHalf * 2 - 4, 4)
      gfx.fillStyle(GOLD, 1)
      gfx.fillRect(cx - 3, baseY - thickness - 11, 6, 7)
    }

    // ① 请仙典仪的大殿（1150x340，**一整座**盖住左半边）：两级白石台基 + 两侧配殿 +
    //    中间的重檐大殿。立在台面上只能看到楼高的三分之一左右，
    //    所以屋脊和宝顶是故意画在画面外那个高度上的
    const hall = this.add.graphics()

    // 台基（一整条贯通）
    hall.fillStyle(STONE_DARK, 1)
    hall.fillRect(0, 302, 1150, 38)
    hall.fillStyle(STONE, 1)
    hall.fillRect(0, 302, 1150, 4)
    hall.fillStyle(STONE_MID, 1)
    hall.fillRect(30, 288, 1090, 14)
    hall.fillStyle(STONE, 1)
    hall.fillRect(30, 288, 1090, 4)
    // 中间踏跺
    hall.fillStyle(STONE, 1)
    hall.fillRect(545, 302, 60, 34)
    hall.fillStyle(STONE_DARK, 1)
    hall.fillRect(545, 312, 60, 2)
    hall.fillRect(545, 322, 60, 2)

    // 两侧配殿：一层，白墙 + 长排朱红柱 + 一整条格窗（左右通到贴图两边，和连廊接得上）
    hall.fillStyle(STONE, 1)
    hall.fillRect(0, 176, 1150, 112)
    lattice(hall, 26, 196, 350, 52)
    lattice(hall, 760, 196, 350, 52)
    ;[20, 99, 178, 257, 336, 415, 735, 814, 893, 972, 1051, 1130].forEach((x) => {
      hall.fillStyle(WOOD, 1)
      hall.fillRect(x, 172, 13, 116)
      hall.fillStyle(WOOD_DARK, 1)
      hall.fillRect(x + 10, 172, 3, 116)
    })
    hall.fillStyle(STONE_DARK, 1)
    hall.fillRect(0, 284, 1150, 4)
    // 配殿屋檐：底边压在墙顶 176 上（不能和墙之间留缝），左右各通到贴图边
    glazedRoof(hall, 215, 176, 215, 20, false)
    glazedRoof(hall, 935, 176, 215, 20, false)

    // 中间大殿：一层殿身
    hall.fillStyle(STONE, 1)
    hall.fillRect(415, 100, 320, 188)
    ;[415, 500, 585, 670, 735].forEach((x) => {
      hall.fillStyle(WOOD, 1)
      hall.fillRect(x, 100, 14, 188)
      hall.fillStyle(WOOD_DARK, 1)
      hall.fillRect(x + 11, 100, 3, 188)
    })
    lattice(hall, 442, 122, 44, 60)
    lattice(hall, 527, 122, 44, 60)
    lattice(hall, 612, 122, 44, 60)
    lattice(hall, 687, 122, 36, 60)
    hall.fillStyle(WOOD_DARK, 1)
    hall.fillRect(415, 100, 320, 5)

    // 大殿下层屋檐
    glazedRoof(hall, 575, 100, 176, 16)

    // 大殿二层（收进一截）+ 匾额
    hall.fillStyle(STONE, 1)
    hall.fillRect(480, 52, 190, 48)
    ;[480, 658].forEach((x) => {
      hall.fillStyle(WOOD, 1)
      hall.fillRect(x, 52, 12, 48)
    })
    lattice(hall, 504, 62, 40, 28)
    lattice(hall, 608, 62, 40, 28)
    hall.fillStyle(GOLD, 1)
    hall.fillRect(543, 58, 64, 18)
    hall.fillStyle(INK, 1)
    hall.fillRect(546, 61, 58, 12)
    hall.fillStyle(GOLD, 1)
    hall.fillRect(553, 66, 7, 3)
    hall.fillRect(568, 66, 7, 3)
    hall.fillRect(583, 66, 7, 3)
    hall.fillStyle(WOOD_DARK, 1)
    hall.fillRect(480, 52, 190, 4)

    // 大殿主屋顶（脊和宝顶故意高到画面外）
    glazedRoof(hall, 575, 52, 150, 26)

    hall.generateTexture('terrace-hall', 1150, 340)
    hall.destroy()

    // ② 逃跑那一片的连廊（575x165，**一段接一段能拼**）：屋檐底边**压在墙顶上**（不留缝），
    //    台基、白墙、格窗、屋顶都通到贴图两边；柱距 575/5 = 115、灯笼也是 115，
    //    接缝两侧的间距和段内一模一样。右半边两段正好铺满 3450~4600
    const wing = this.add.graphics()

    // 台基（通长）
    wing.fillStyle(STONE_DARK, 1)
    wing.fillRect(0, 144, 575, 21)
    wing.fillStyle(STONE, 1)
    wing.fillRect(0, 144, 575, 4)
    wing.fillStyle(STONE_MID, 1)
    wing.fillRect(0, 136, 575, 8)
    wing.fillStyle(STONE, 1)
    wing.fillRect(0, 136, 575, 2)

    // 廊身：白墙（顶在 96，正好顶到屋檐）+ 通长格窗 + 一排朱红柱
    wing.fillStyle(STONE, 1)
    wing.fillRect(0, 96, 575, 40)
    wing.fillStyle(INK, 1)
    wing.fillRect(0, 118, 575, 14)
    wing.fillStyle(GOLD, 1)
    wing.fillRect(0, 118, 575, 2)
    wing.fillRect(0, 130, 575, 2)

    for (let gx = 3; gx < 575; gx += 6) {
      wing.fillRect(gx, 120, 1, 10)
    }

    ;[58, 173, 288, 403, 518].forEach((x) => {
      wing.fillStyle(WOOD, 1)
      wing.fillRect(x - 7, 96, 14, 40)
      wing.fillStyle(WOOD_DARK, 1)
      wing.fillRect(x + 3, 96, 4, 40)
    })

    // 檐下挂灯笼（四盏，间距 115，接得上）
    ;[115, 230, 345, 460].forEach((x) => {
      wing.fillStyle(WOOD_DARK, 1)
      wing.fillRect(x - 1, 96, 2, 8)
      wing.fillStyle(LANTERN, 1)
      wing.fillRect(x - 8, 104, 16, 14)
      wing.fillStyle(GOLD, 1)
      wing.fillRect(x - 8, 104, 16, 2)
      wing.fillRect(x - 8, 114, 16, 2)
    })

    // 平檐屋顶（通长，两边不上翘）：底边 96 = 墙顶，拼起来是一条直檐
    glazedRoof(wing, 287.5, 96, 287.5, 24, false)

    wing.generateTexture('terrace-wing', 575, 165)
    wing.destroy()

    // ③ 中间的拱门（玩家从请仙典仪那边穿过它进右边的连廊）：
    //    背面一层 = 台基、拱顶、匾额、琉璃顶 + **左边两根门柱**（depth 5，在史莱姆后面）；
    //    这座门是个**长方体**：同一座门画两遍 —— 背面那遍小一点、暗一点（摆 z=120），
    //    正面那遍大一点、亮一点（摆 z=0）。两张一叠就是"有进深的门"（和牌楼一个做法）。
    //    （下面这两张木门贴图暂时留着但已经没用了：墙和券门现在是一体的，
    //     在 GameScene 里按投影现画；下次清理时删掉这一段）
    const gateArt = (
      gfx: Phaser.GameObjects.Graphics,
      wood: number,
      woodDark: number,
      base: number
    ) => {
      // 两根门柱 + 柱础（门洞底下不铺，免得人过门时脚下多一道坎）
      ;[40, 156].forEach((x) => {
        gfx.fillStyle(base, 1)
        gfx.fillRect(x - 4, 150, 32, 18)
        gfx.fillStyle(wood, 1)
        gfx.fillRect(x, 44, 24, 106)
        gfx.fillStyle(woodDark, 1)
        gfx.fillRect(x + 20, 44, 4, 106)
        gfx.fillStyle(GOLD, 1)
        gfx.fillRect(x, 140, 24, 5)
      })
      // 拱顶（连到两根柱头）+ 金边
      gfx.fillStyle(woodDark, 1)
      gfx.fillRect(30, 30, 160, 16)
      gfx.fillStyle(wood, 1)
      gfx.fillRect(30, 30, 160, 10)
      gfx.fillStyle(GOLD, 1)
      gfx.fillRect(30, 30, 160, 3)
      // 匾额
      gfx.fillStyle(GOLD, 1)
      gfx.fillRect(88, 34, 44, 14)
      gfx.fillStyle(INK, 1)
      gfx.fillRect(91, 37, 38, 8)
      // 琉璃顶（和台面上的房子同一套，只是小一号）
      glazedRoof(gfx, 110, 30, 100, 18)
    }

    const arch = this.add.graphics()

    gateArt(arch, WOOD, WOOD_DARK, STONE_DARK)
    arch.generateTexture('terrace-arch', 220, 176)
    arch.destroy()

    const archFront = this.add.graphics()

    gateArt(archFront, WOOD_LIGHT, WOOD_DARK, STONE_MID)
    archFront.generateTexture('terrace-arch-front', 220, 176)
    archFront.destroy()
  }

  // ── 玉京台左半边：请仙典仪的广场（2026/10/11 第一版，等用户审外观）──────
  // 近处这一层：广场地面（圆形，斜着看是椭圆）、后沿的矮围栏、长方形祭坛 +
  // 坛上的金银珠宝水果、主事的凝光 + 两个仆从，围观人群用港口那只史莱姆
  private makeTerracePlaza() {
    const TILE = 0x2f7f6a
    const TILE_LIGHT = 0x54b09a
    const STONE = 0xd3cbb8
    const STONE_MID = 0xb8ae98
    const STONE_DARK = 0x8f8570
    const STONE_DEEP = 0x6f6857
    const GOLD = 0xd9a441
    const GOLD_DARK = 0xa9791f
    const JADE = 0x4fae95
    const INK = 0x2a1a16
    const RED = 0xc0392b
    const SILVER = 0xcfd4da
    const FRUIT = [0xe07a2b, 0xd94f3d, 0xe8c33f]
    const LANTERN = 0xc0392b

    // ① 广场后沿的矮围栏（575x64，一段接一段能拼：柱子距 575/4、灯笼距也是）
    const wall = this.add.graphics()

    // 座体
    wall.fillStyle(STONE_DARK, 1)
    wall.fillRect(0, 40, 575, 24)
    wall.fillStyle(STONE, 1)
    wall.fillRect(0, 40, 575, 3)
    wall.fillStyle(STONE_DEEP, 1)
    wall.fillRect(0, 58, 575, 6)
    // 望柱（每 143.75 一根，接缝处间距一样）
    ;[72, 216, 359, 503].forEach((x) => {
      wall.fillStyle(STONE_MID, 1)
      wall.fillRect(x - 8, 14, 16, 30)
      wall.fillStyle(STONE, 1)
      wall.fillRect(x - 8, 14, 16, 3)
      wall.fillStyle(TILE, 1)
      wall.fillRect(x - 9, 12, 18, 7)
      wall.fillStyle(TILE_LIGHT, 1)
      wall.fillRect(x - 9, 12, 18, 2)
    })
    // 扶手
    wall.fillStyle(STONE, 1)
    wall.fillRect(0, 4, 575, 10)
    wall.fillStyle(STONE_MID, 1)
    wall.fillRect(0, 12, 575, 3)
    wall.fillStyle(TILE, 1)
    wall.fillRect(0, 1, 575, 4)
    wall.fillStyle(TILE_LIGHT, 1)
    wall.fillRect(0, 1, 575, 1)
    // 檐下小灯笼（间距 144，接得上）
    ;[36, 180, 324, 468].forEach((x) => {
      wall.fillStyle(INK, 1)
      wall.fillRect(x - 1, 15, 2, 7)
      wall.fillStyle(LANTERN, 1)
      wall.fillRect(x - 6, 22, 12, 11)
      wall.fillStyle(GOLD, 1)
      wall.fillRect(x - 6, 22, 12, 2)
      wall.fillRect(x - 6, 31, 12, 2)
    })

    wall.generateTexture('terrace-pwall', 575, 64)
    wall.destroy()

    // ③ 长方形祭坛（200x64）：座 + 前脸（带线脚）+ 台面（露出来的一层）
    const altar = this.add.graphics()

    altar.fillStyle(STONE_DEEP, 1)
    altar.fillRect(10, 46, 180, 18)
    altar.fillStyle(STONE_DARK, 1)
    altar.fillRect(14, 22, 172, 26)
    altar.fillStyle(STONE_MID, 1)
    altar.fillRect(18, 26, 164, 18)
    altar.fillStyle(STONE_DEEP, 1)
    altar.fillRect(30, 30, 6, 12)
    altar.fillRect(164, 30, 6, 12)
    altar.fillRect(93, 30, 14, 12)
    altar.fillStyle(GOLD, 1)
    altar.fillRect(14, 46, 172, 3)
    altar.fillStyle(STONE, 1)
    altar.fillRect(0, 10, 200, 14)
    altar.fillStyle(0xe3dccb, 1)
    altar.fillRect(4, 8, 192, 6)
    altar.fillStyle(TILE, 1)
    altar.fillRect(0, 20, 200, 3)

    altar.generateTexture('terrace-altar', 200, 64)
    altar.destroy()

    // ④ 坛上的东西（180x40）：金盘上摆金锭、银锭、宝石、水果
    const offer = this.add.graphics()

    // 金盘
    offer.fillStyle(GOLD_DARK, 1)
    offer.fillRect(6, 32, 168, 6)
    offer.fillStyle(GOLD, 1)
    offer.fillRect(6, 30, 168, 3)
    // 金锭（两头翘）
    ;[14, 40].forEach((x) => {
      offer.fillStyle(GOLD, 1)
      offer.fillRect(x, 20, 22, 10)
      offer.fillRect(x - 3, 18, 28, 4)
      offer.fillStyle(0xf0d07a, 1)
      offer.fillRect(x - 3, 18, 28, 2)
    })
    // 银锭
    offer.fillStyle(SILVER, 1)
    offer.fillRect(70, 24, 18, 8)
    offer.fillStyle(0xeef1f4, 1)
    offer.fillRect(70, 22, 18, 3)
    // 宝石
    ;[
      [96, 20, JADE],
      [108, 22, RED],
      [120, 20, 0x4a86c8],
    ].forEach(([x, y, color]) => {
      offer.fillStyle(color as number, 1)
      offer.fillTriangle(x as number, (y as number) - 6, (x as number) - 5, (y as number) + 2, (x as number) + 5, (y as number) + 2)
    })
    // 水果
    ;[136, 150, 164].forEach((x, i) => {
      offer.fillStyle(FRUIT[i % FRUIT.length], 1)
      offer.fillCircle(x, 26, 6)
      offer.fillStyle(0xffffff, 0.35)
      offer.fillCircle(x - 2, 24, 2)
    })

    offer.generateTexture('terrace-offerings', 180, 40)
    offer.destroy()

    // ⑤ 凝光（48x60）：参考原神里天权星凝光的配色与装饰 ——
    //    **主色调是金**（配白）：白玉的身子、金色的下裙压浅金云纹、
    //    白羽披肩（金边）、金腰带中间一颗白珠、头上金冠（金冠 + 白珠 + 两串金流苏）、
    //    手里一柄金骨白面的折扇。整身不用绿色
    const ning = this.add.graphics()

    // 身子：白玉（白 → 乳白 → 淡金，同心椭圆）
    ning.fillStyle(0x263230, 1)
    ning.fillEllipse(24, 42, 40, 30)
    ning.fillStyle(0xf7f4ea, 1)
    ning.fillEllipse(24, 42, 36, 27)
    ning.fillStyle(0xf3ecdc, 1)
    ning.fillEllipse(24, 43, 28, 21)
    ning.fillStyle(0xecdfc2, 1)
    ning.fillEllipse(24, 44, 18, 13)
    // 金色下裙 + 浅金云纹（云纹用小方块拼两道）
    ning.fillStyle(0xc08a2c, 1)
    ning.fillEllipse(24, 52, 38, 15)
    ning.fillStyle(0xd9a441, 1)
    ning.fillEllipse(24, 50, 34, 11)
    ning.fillStyle(0xf0d07a, 1)
    ning.fillRect(9, 50, 5, 3)
    ning.fillRect(17, 52, 5, 3)
    ning.fillRect(27, 52, 5, 3)
    ning.fillRect(35, 50, 5, 3)
    // 金腰带 + 白珠扣
    ning.fillStyle(GOLD, 1)
    ning.fillRect(7, 45, 34, 4)
    ning.fillStyle(GOLD_DARK, 1)
    ning.fillRect(7, 48, 34, 1)
    ning.fillStyle(0xf7f4ea, 1)
    ning.fillEllipse(24, 47, 8, 6)
    ning.fillStyle(GOLD, 1)
    ning.fillEllipse(24, 47, 10, 8)
    ning.fillStyle(0xf7f4ea, 1)
    ning.fillEllipse(24, 47, 7, 5)
    // 白羽披肩：肩上两片向外的白色羽翼 + 金边
    ning.fillStyle(0xf7f4ea, 1)
    ning.fillPoints(
      [
        new Phaser.Math.Vector2(6, 34),
        new Phaser.Math.Vector2(14, 30),
        new Phaser.Math.Vector2(13, 41),
      ],
      true
    )
    ning.fillPoints(
      [
        new Phaser.Math.Vector2(42, 34),
        new Phaser.Math.Vector2(34, 30),
        new Phaser.Math.Vector2(35, 41),
      ],
      true
    )
    ning.fillStyle(GOLD, 1)
    ning.fillRect(8, 34, 6, 2)
    ning.fillRect(34, 34, 6, 2)
    // 眼睛（带一点金箔眼影）+ 红唇
    ning.fillStyle(0xd9a441, 0.55)
    ning.fillEllipse(17, 38, 9, 5)
    ning.fillEllipse(31, 38, 9, 5)
    ning.fillStyle(INK, 1)
    ning.fillEllipse(17, 39, 5, 6)
    ning.fillEllipse(31, 39, 5, 6)
    ning.fillStyle(0xffffff, 1)
    ning.fillRect(16, 37, 2, 2)
    ning.fillRect(30, 37, 2, 2)
    ning.fillStyle(0xb04a48, 1)
    ning.fillEllipse(24, 49, 7, 3)
    // 头饰：金冠 + 白珠 + 两串金流苏
    ning.fillStyle(GOLD, 1)
    ning.fillRect(22, 14, 4, 22)
    ning.fillRect(13, 21, 22, 3)
    ning.fillRect(17, 17, 3, 5)
    ning.fillRect(28, 17, 3, 5)
    ning.fillStyle(0xf7f4ea, 1)
    ning.fillCircle(24, 11, 5)
    ning.fillStyle(GOLD, 1)
    ning.fillCircle(24, 11, 6)
    ning.fillStyle(0xf7f4ea, 1)
    ning.fillCircle(24, 11, 4)
    ning.fillStyle(0xffffff, 0.45)
    ning.fillCircle(22, 9, 2)
    ning.fillStyle(GOLD, 1)
    ning.fillRect(13, 24, 2, 7)
    ning.fillRect(33, 24, 2, 7)
    // 折扇：金骨白面（右手，斜着举起来）
    ning.fillStyle(GOLD_DARK, 1)
    ning.fillPoints(
      [
        new Phaser.Math.Vector2(40, 32),
        new Phaser.Math.Vector2(47, 18),
        new Phaser.Math.Vector2(46, 34),
      ],
      true
    )
    ning.fillStyle(0xf7f4ea, 1)
    ning.fillPoints(
      [
        new Phaser.Math.Vector2(39, 31),
        new Phaser.Math.Vector2(45, 19),
        new Phaser.Math.Vector2(44, 32),
      ],
      true
    )
    ning.fillStyle(GOLD, 1)
    ning.fillRect(39, 31, 6, 2)

    ning.generateTexture('npc-ningguang', 48, 60)
    ning.destroy()

    // ⑥ 身边的小跟班（32x44）：小一号的玉衣史莱姆，捧着一个金托盘
    const servant = this.add.graphics()

    servant.fillStyle(0x2a3a3a, 1)
    servant.fillEllipse(16, 30, 28, 22)
    servant.fillStyle(0xf2efe4, 1)
    servant.fillEllipse(16, 30, 25, 19)
    servant.fillStyle(0xd6ece2, 1)
    servant.fillEllipse(16, 32, 14, 10)
    servant.fillStyle(JADE, 1)
    servant.fillEllipse(16, 37, 26, 10)
    servant.fillStyle(GOLD, 1)
    servant.fillRect(4, 32, 24, 3)
    servant.fillStyle(INK, 1)
    servant.fillEllipse(11, 27, 4, 5)
    servant.fillEllipse(21, 27, 4, 5)
    servant.fillStyle(GOLD, 1)
    servant.fillRect(15, 12, 3, 12)
    servant.fillRect(9, 16, 14, 2)
    servant.fillStyle(JADE, 1)
    servant.fillCircle(16, 11, 4)
    // 金托盘
    servant.fillStyle(GOLD, 1)
    servant.fillRect(22, 20, 10, 3)
    servant.fillStyle(GOLD_DARK, 1)
    servant.fillRect(22, 23, 10, 2)

    servant.generateTexture('npc-attendant', 32, 44)
    servant.destroy()
  }

  // ── 留云借风真君 · 鸟兽形态（130x152）：仙鹤（照丹顶鹤的比例重画）──────
  //   上一版画丑了：身子又圆又胖、脖子几乎竖直、腿太短、喙像一根横条。
  //   这一版按真鹤的比例来：**腿占一半身高、身子是横着的蛋形、脖子细长带 S 弯、
  //   头小、喙细长、头顶一块朱红（丹顶）**，再加上仙鹤最标志性的**深色翼羽**
  //   —— 就是垂在尾巴后面那一束，很多人会当成尾巴。
  //   配色（2026/10/15 用户定）：**脖子以上不动，还是原来那套白的**（白脖子、白头、
  //   深色长喙、朱红头冠）；只有**身子改成青白**。脸朝右，和其他 NPC 一致。
  // ── 琥珀（64x52 = 两倍史莱姆大小，2026/10/17 用户定）：转角平台上那坨金色树脂 ──
  //   里头冻着一点东西（一眼能看出来）；岩柱的岩共鸣震开它（GameScene.updateResonance）
  private makeAmber() {
    const g = this.add.graphics()

    // 外形（2026/10/17 用户定）：**三个竖着的椭圆并在一起** —— 中间最大、左边中等、右边最小，
    // 像三坨树脂淌下来凝成了一块。先把三个椭圆的深色轮廓一起铺出来，再统一填色，
    // 这样轮廓是"连成一整块"的，不会出现三个各自描边的圆
    const lobes: Array<[number, number, number, number]> = [
      [30, 26, 38, 48], // 中间：最大
      [14, 30, 26, 34], // 左边：中等
      [50, 33, 20, 24], // 右边：最小
    ]
    // 底部再摊一层**扁平椭圆**（2026/10/17 用户加的）：像树脂淌到地上摊开的那一摊。
    // 先画它，压在三个椭圆下面，所以最底下那一圈是宽的
    // 加宽了一档、又压扁了一点；中心挪到 31，让左右两端正好**卡在三个椭圆的左右外沿**
    //（1 ~ 61），不会往两边戳出来
    const pool: [number, number, number, number] = [31, 45, 60, 11]

    g.fillStyle(0x5a3210, 1)
    g.fillEllipse(pool[0], pool[1], pool[2], pool[3])
    lobes.forEach(([x, y, w, h]) => g.fillEllipse(x, y, w, h))
    // 主体：深琥珀
    g.fillStyle(0xd98a24, 1)
    g.fillEllipse(pool[0], pool[1], pool[2] - 4, pool[3] - 4)
    lobes.forEach(([x, y, w, h]) => g.fillEllipse(x, y, w - 4, h - 4))
    // 受光面：每个椭圆左上再压一层亮琥珀
    g.fillStyle(0xf0a83c, 1)
    g.fillEllipse(pool[0] - 2, pool[1] - 2, (pool[2] - 4) * 0.78, (pool[3] - 4) * 0.5)
    lobes.forEach(([x, y, w, h]) => g.fillEllipse(x - 2, y - 3, (w - 4) * 0.7, (h - 4) * 0.72))
    // 右下压深一档（只在中间和右边那两坨的底部）
    g.fillStyle(0xc9741c, 1)
    g.fillEllipse(43, 47, 22, 5)
    g.fillEllipse(34, 40, 22, 12)
    g.fillEllipse(52, 40, 12, 7)
    // 高光：中间那坨一道长条、右边那坨一点
    g.fillStyle(0xffe0a0, 0.85)
    g.fillEllipse(22, 18, 9, 15)
    g.fillStyle(0xfff2cc, 0.85)
    g.fillCircle(20, 14, 3)
    g.fillCircle(46, 27, 1.8)
    // 里面冻着的小虫（放在中间那一坨里，放大到看得清）
    g.fillStyle(0x3a2410, 0.8)
    g.fillEllipse(32, 30, 12, 7)
    g.fillEllipse(25, 28, 6, 6)
    g.fillRect(23, 24, 2, 6)
    g.fillRect(32, 24, 2, 8)
    g.fillRect(29, 33, 6, 2)
    // 底部再压一道暗，跟坐台接得住
    g.fillStyle(0x3a2410, 0.3)
    g.fillEllipse(31, 50, 56, 5)

    g.generateTexture('amber', 64, 52)
    g.destroy()
  }

  // ── 琥珀的"底"（80x16）：不是工业化的石台，是**原始的一堆泥土和草** ────────
  //   2026/10/17 用户定：琥珀是天然凝在那儿的，底下是一小堆土、长着草，
  //   土堆顶上压出一圈浅坑，坑沿留着几片琥珀残渣。琥珀碎了这堆土照样留着。
  private makeAmberStand() {
    const g = this.add.graphics()

    // 土堆：三个椭圆叠出来的不规则土丘（底下宽、上面收、左右不对称）
    g.fillStyle(0x4a3a28, 1)
    g.fillEllipse(40, 13, 78, 12)
    g.fillStyle(0x5b4730, 1)
    g.fillEllipse(30, 11, 42, 12)
    g.fillEllipse(52, 11, 36, 11)
    g.fillStyle(0x6b5540, 1)
    g.fillEllipse(28, 9, 28, 8)
    g.fillEllipse(50, 10, 24, 7)
    // 土堆顶上被琥珀压出来的一圈浅坑
    g.fillStyle(0x3a2c1c, 0.45)
    g.fillEllipse(40, 8, 38, 6)
    g.fillStyle(0x8a6a1c, 0.5)
    g.fillEllipse(40, 7, 32, 4)
    // 琥珀残渣：坑沿几片小金块
    g.fillStyle(0xe8a33a, 1)
    g.fillPoints(
      [
        new Phaser.Math.Vector2(22, 8),
        new Phaser.Math.Vector2(27, 6),
        new Phaser.Math.Vector2(30, 9),
        new Phaser.Math.Vector2(25, 10),
      ],
      true
    )
    g.fillPoints(
      [
        new Phaser.Math.Vector2(52, 7),
        new Phaser.Math.Vector2(58, 6),
        new Phaser.Math.Vector2(59, 9),
        new Phaser.Math.Vector2(53, 10),
      ],
      true
    )
    g.fillStyle(0xf6c766, 1)
    g.fillRect(25, 7, 3, 1)
    g.fillRect(54, 7, 3, 1)
    g.fillStyle(0xc9741c, 1)
    g.fillRect(8, 12, 4, 2)
    g.fillRect(66, 12, 3, 2)
    // 草：前坡和两侧各长两撮，深浅两层
    g.fillStyle(0x5f8a3a, 1)
    g.fillEllipse(12, 11, 18, 5)
    g.fillEllipse(64, 11, 20, 5)
    g.fillEllipse(38, 14, 26, 4)
    g.fillStyle(0x7fb04a, 1)
    ;[10, 14, 18, 60, 65, 70, 34, 40, 46].forEach((x, index) => {
      g.fillRect(x, 6 + (index % 3), 1, 3)
    })
    g.fillStyle(0x86bb52, 1)
    ;[13, 62, 68].forEach((x) => g.fillRect(x, 5, 1, 2))
    // 几粒石子
    g.fillStyle(0x7d7266, 1)
    g.fillRect(6, 13, 2, 1)
    g.fillRect(44, 13, 2, 1)
    g.fillRect(72, 12, 2, 1)

    g.generateTexture('amber-stand', 80, 16)
    g.destroy()
  }

  // ── 琥珀里的野猪（26x18）：圆滚滚一头，短腿、獠牙、背上一排硬毛 ──────────
  private makeAmberBoar() {
    const g = this.add.graphics()

    // 腿
    g.fillStyle(0x3a2a1c, 1)
    g.fillRect(6, 13, 2, 4)
    g.fillRect(11, 14, 2, 3)
    g.fillRect(17, 14, 2, 3)
    g.fillRect(21, 13, 2, 4)
    // 身子
    g.fillStyle(0x4b3624, 1)
    g.fillEllipse(14, 9, 22, 13)
    g.fillStyle(0x5d4530, 1)
    g.fillEllipse(13, 7, 18, 9)
    // 头（朝左）
    g.fillStyle(0x3a2a1c, 1)
    g.fillEllipse(4, 9, 8, 8)
    g.fillStyle(0x6b5238, 1)
    g.fillEllipse(3, 10, 6, 5)
    // 獠牙
    g.fillStyle(0xf2e6c8, 1)
    g.fillTriangle(1, 9, 2, 9, 0, 5)
    g.fillTriangle(5, 10, 6, 10, 7, 13)
    // 背毛
    g.fillStyle(0x2c2016, 1)
    for (let x = 7; x < 24; x += 3) {
      g.fillTriangle(x, 3, x + 2, 3, x + 1, 0)
    }
    // 眼睛
    g.fillStyle(0xf2e6c8, 1)
    g.fillCircle(4, 8, 1.3)
    g.fillStyle(0x1a140e, 1)
    g.fillCircle(4, 8, 0.7)

    g.generateTexture('amber-boar', 26, 18)
    g.destroy()
  }

  // 琥珀里的人影彩蛋：戴草帽、披蓑衣的史莱姆（44x42）
  private makeAmberNpc() {
    const g = this.add.graphics()
    const P = (x: number, y: number) => new Phaser.Math.Vector2(x, y)

    // 落地影
    g.fillStyle(0x1a140f, 0.22)
    g.fillEllipse(22, 40, 30, 4)

    // 蓑衣后片
    g.fillStyle(0x5f4627, 1)
    g.fillPoints([P(10, 20), P(34, 20), P(39, 38), P(5, 38)], true)
    g.fillStyle(0x795b32, 1)
    g.fillPoints([P(12, 21), P(32, 21), P(36, 36), P(8, 36)], true)

    // 后片的草茎
    g.fillStyle(0x9a7842, 0.8)
    for (let x = 10; x <= 34; x += 4) {
      g.fillRect(x, 22, 1, 13)
    }

    // 史莱姆本体
    g.fillStyle(0x2c3a22, 1)
    g.fillEllipse(22, 30, 30, 19)
    g.fillStyle(0x86b45c, 1)
    g.fillEllipse(22, 29, 28, 17)
    g.fillStyle(0x9ccb70, 1)
    g.fillEllipse(20, 27, 20, 10)
    g.fillStyle(0xffffff, 0.45)
    g.fillEllipse(16, 25, 8, 4)

    // 眼睛
    g.fillStyle(0xf4f1e4, 1)
    g.fillEllipse(16, 30, 6, 5)
    g.fillEllipse(28, 30, 6, 5)
    g.fillStyle(0x1b2218, 1)
    g.fillCircle(16, 30, 1.7)
    g.fillCircle(28, 30, 1.7)
    g.fillStyle(0x1b2218, 0.8)
    g.fillRect(20, 34, 4, 1)

    // 蓑衣前襟：两片盖在身体两侧，露出脸
    g.fillStyle(0x6b4f2c, 1)
    g.fillPoints([P(8, 21), P(16, 21), P(14, 38), P(4, 38)], true)
    g.fillPoints([P(28, 21), P(36, 21), P(40, 38), P(30, 38)], true)
    g.fillStyle(0x9a7842, 1)
    for (let y = 23; y <= 35; y += 4) {
      g.fillRect(8, y, 6, 1)
      g.fillRect(31, y, 6, 1)
    }

    // 草帽：帽檐 + 帽冠 + 红带
    g.fillStyle(0x6b4a24, 1)
    g.fillEllipse(22, 17, 40, 9)
    g.fillStyle(0xc39a52, 1)
    g.fillEllipse(22, 16, 38, 8)
    g.fillStyle(0xd9b46a, 1)
    g.fillEllipse(22, 16, 32, 6)

    g.fillStyle(0x6b4a24, 1)
    g.fillEllipse(22, 10, 22, 13)
    g.fillStyle(0xc39a52, 1)
    g.fillEllipse(22, 9, 20, 12)
    g.fillStyle(0xd9b46a, 1)
    g.fillEllipse(20, 8, 14, 8)

    // 帽冠的草编纹
    g.lineStyle(1, 0x8b6230, 0.7)
    for (let y = 7; y <= 13; y += 3) {
      g.lineBetween(13, y, 31, y)
    }
    for (let x = 15; x <= 29; x += 5) {
      g.lineBetween(x, 5, x, 14)
    }

    // 红带
    g.fillStyle(0x8a3f2a, 1)
    g.fillRect(13, 13, 18, 2)
    g.fillStyle(0xb85a3a, 1)
    g.fillRect(13, 13, 18, 1)

    // 帽檐上的几道草茎和一小截帽绳
    g.fillStyle(0x9b7538, 0.75)
    g.fillRect(5, 17, 34, 1)
    g.fillStyle(0x6b4a24, 1)
    g.fillRect(31, 18, 1, 4)
    g.fillStyle(0xd9b46a, 1)
    g.fillCircle(32, 22, 1.4)

    g.generateTexture('npc-straw-slime', 44, 42)
    g.destroy()
  }

  // 疾风符（22x28）：一片青绿色风羽 + 金色符带，拾取后加速 10 秒
  private makeSpeedCharm() {
    const g = this.add.graphics()
    const P = (x: number, y: number) => new Phaser.Math.Vector2(x, y)

    // 背后一点风晕
    g.fillStyle(0x8fe0c2, 0.18)
    g.fillEllipse(11, 14, 22, 26)

    // 羽轴
    g.fillStyle(0x2f6f6a, 1)
    g.fillPoints([P(6, 26), P(9, 25), P(17, 5), P(15, 3)], true)
    g.fillStyle(0xf0fff7, 0.9)
    g.fillPoints([P(8, 25), P(9.5, 25), P(16, 5), P(15, 4)], true)

    // 左侧羽片
    g.fillStyle(0x4b9f8a, 1)
    g.fillPoints([P(8, 23), P(2, 17), P(4, 12), P(9, 14)], true)
    g.fillPoints([P(10, 18), P(4, 10), P(7, 6), P(11, 10)], true)
    g.fillPoints([P(12, 13), P(8, 5), P(11, 2), P(14, 7)], true)

    // 右侧羽片（压亮）
    g.fillStyle(0x74d0b0, 1)
    g.fillPoints([P(11, 24), P(18, 19), P(18, 14), P(12, 15)], true)
    g.fillPoints([P(13, 19), P(20, 12), P(19, 8), P(14, 11)], true)
    g.fillPoints([P(14, 14), P(18, 7), P(16, 3), P(13, 8)], true)

    // 金色符带
    g.fillStyle(0xd9a441, 1)
    g.fillPoints([P(5, 26), P(12, 22), P(13, 24), P(7, 27)], true)
    g.fillStyle(0xffe9a8, 1)
    g.fillRect(7, 24, 5, 1)

    // 羽尖高光
    g.fillStyle(0xffffff, 0.9)
    g.fillRect(15, 3, 2, 2)
    g.fillStyle(0xeafff6, 0.7)
    g.fillRect(4, 12, 1, 3)

    g.generateTexture('speed-charm', 22, 28)
    g.destroy()
  }

  // 仙家符箓（24x32）：黄纸红边、朱砂印、金色符纹和一条小穗
  private makeTrialTalisman() {
    const g = this.add.graphics()

    // 纸身
    g.fillStyle(0x8f3a2a, 1)
    g.fillRect(3, 4, 18, 25)
    g.fillStyle(0xf2d06a, 1)
    g.fillRect(5, 6, 14, 21)
    g.fillStyle(0xffe9a8, 1)
    g.fillRect(6, 7, 12, 19)

    // 顶部挂环
    g.lineStyle(2, 0xd9a441, 1)
    g.strokeCircle(12, 4, 3)

    // 朱砂印
    g.fillStyle(0xb03a2e, 1)
    g.fillRect(8, 20, 8, 6)
    g.fillStyle(0xf4d6a0, 1)
    g.fillRect(9, 21, 6, 1)
    g.fillRect(9, 24, 6, 1)

    // 金色符纹
    g.lineStyle(1, 0xb8862f, 0.9)
    g.lineBetween(8, 9, 16, 9)
    g.lineBetween(12, 9, 12, 18)
    g.lineBetween(8, 12, 12, 15)
    g.lineBetween(16, 12, 12, 15)

    // 下面小穗
    g.fillStyle(0xd9a441, 1)
    g.fillRect(11, 29, 2, 3)
    g.fillStyle(0xb03a2e, 1)
    g.fillRect(10, 31, 4, 1)

    g.generateTexture('trial-talisman', 24, 32)
    g.destroy()
  }

  // 试炼浮石（48x34 = 1.5 个史莱姆宽）：不规则倒三角，上面白石头、下面绿发光石
  private makeTrialStone() {
    const g = this.add.graphics()
    const P = (x: number, y: number) => new Phaser.Math.Vector2(x, y)

    // 底部绿石的光晕
    g.fillStyle(0x4dff9a, 0.18)
    g.fillEllipse(24, 28, 36, 18)

    // 不规则倒三角：上沿宽、下沿收成参差的尖，轮廓故意不对称
    const body: Array<[number, number]> = [
      [1, 1],
      [10, 0],
      [19, 2],
      [28, 0],
      [39, 1],
      [47, 3],
      [44, 10],
      [47, 17],
      [40, 23],
      [31, 28],
      [25, 34],
      [19, 28],
      [12, 26],
      [7, 21],
      [2, 13],
      [5, 7],
    ]

    g.fillStyle(0x4b5357, 1)
    g.fillPoints(body.map(([x, y]) => P(x, y)), true)

    const inset = body.map(([x, y]) => P(24 + (x - 24) * 0.94, 1 + (y - 1) * 0.93))

    g.fillStyle(0xdfe6e2, 1)
    g.fillPoints(inset, true)

    // 白色受光面
    g.fillStyle(0xf7fbf7, 1)
    g.fillPoints([P(4, 3), P(22, 2), P(24, 16), P(15, 6)], true)
    g.fillStyle(0xe9f1ed, 1)
    g.fillPoints([P(7, 6), P(18, 5), P(24, 19), P(21, 25), P(12, 17)], true)

    // 灰色背光面
    g.fillStyle(0xbfc9c5, 1)
    g.fillPoints([P(24, 2), P(44, 4), P(41, 15), P(34, 22), P(26, 17)], true)

    // 底部绿发光石：不规则的一整块，和白色岩体咬在一起
    g.fillStyle(0x1f7f56, 1)
    g.fillPoints([P(12, 20), P(36, 20), P(33, 27), P(25, 34), P(18, 27), P(10, 24)], true)
    g.fillStyle(0x4fe39a, 1)
    g.fillPoints([P(14, 21), P(34, 21), P(31, 26), P(25, 32), P(20, 26), P(13, 23)], true)
    g.fillStyle(0xa8ffd2, 0.9)
    g.fillPoints([P(18, 22), P(23, 22), P(25, 28)], true)
    g.fillStyle(0x2fbf7a, 0.55)
    g.fillEllipse(24, 28, 28, 10)

    // 上沿亮边和石缝
    g.fillStyle(0xffffff, 0.9)
    g.fillRect(3, 2, 42, 2)
    g.lineStyle(1, 0x8d9994, 0.6)
    g.lineBetween(9, 7, 18, 16)
    g.lineBetween(29, 6, 25, 15)
    g.lineBetween(34, 10, 30, 20)

    g.generateTexture('trial-stone', 48, 34)
    g.destroy()
  }

  // 第二重试炼的岩脊（26x48）：从云台里破土而出的尖石。
  // 底宽上尖，左侧受光、右侧背光，根部压着一圈金色碎石，和秘境的仙家金边呼应。
  private makeTrialRockSpike() {
    const g = this.add.graphics()
    const P = (x: number, y: number) => new Phaser.Math.Vector2(x, y)

    // 根部光晕与落点阴影
    g.fillStyle(0xffd54f, 0.14)
    g.fillEllipse(13, 44, 30, 10)
    g.fillStyle(0x2a2118, 0.35)
    g.fillEllipse(13, 45, 22, 6)

    // 主体：不规则的三角尖石，左右棱面分开上色
    const outline: Array<[number, number]> = [
      [13, 0],
      [18, 9],
      [16, 16],
      [23, 27],
      [21, 36],
      [25, 45],
      [3, 45],
      [6, 36],
      [4, 27],
      [10, 17],
      [8, 9],
    ]

    g.fillStyle(0x5d4c37, 1)
    g.fillPoints(outline.map(([x, y]) => P(x, y)), true)

    // 左侧亮面
    g.fillStyle(0xb59a6d, 1)
    g.fillPoints([P(13, 2), P(9, 12), P(11, 19), P(6, 29), P(8, 37), P(5, 43), P(3, 44), P(3, 36), P(6, 27), P(10, 17), P(8, 9)], true)
    // 左侧高光棱
    g.fillStyle(0xd8c293, 0.9)
    g.fillPoints([P(12, 4), P(10, 12), P(12, 19), P(9, 27), P(11, 36), P(9, 42), P(6, 43), P(8, 36), P(6, 28), P(9, 18)], true)
    // 右侧暗面
    g.fillStyle(0x7a6446, 1)
    g.fillPoints([P(13, 2), P(18, 10), P(16, 17), P(23, 28), P(21, 37), P(24, 44), P(14, 44), P(13, 30), P(17, 17)], true)
    // 右侧更深的背光棱
    g.fillStyle(0x4a3b2a, 0.95)
    g.fillPoints([P(16, 18), P(23, 28), P(20, 37), P(23, 44), P(16, 44), P(15, 31)], true)

    // 石缝和金色矿点
    g.lineStyle(1, 0x3b2e20, 0.7)
    g.lineBetween(12, 8, 10, 18)
    g.lineBetween(11, 24, 16, 31)
    g.lineBetween(15, 37, 11, 42)
    g.fillStyle(0xffd54f, 0.85)
    g.fillRect(8, 34, 2, 2)
    g.fillRect(16, 22, 1, 2)
    g.fillStyle(0xffe9a8, 0.9)
    g.fillRect(12, 14, 1, 2)

    // 底部碎屑
    g.fillStyle(0xa98d60, 1)
    g.fillRect(1, 43, 3, 3)
    g.fillRect(22, 42, 3, 2)
    g.fillStyle(0x8a7048, 1)
    g.fillRect(6, 45, 2, 2)
    g.fillRect(19, 45, 2, 2)

    g.generateTexture('trial-rock-spike', 26, 48)
    g.destroy()
  }

  // 第二重试炼的横向岩刺（36x14）：一根朝右的尖石，底端带碎屑、尾端带速度线。
  // 低空横扫用，左飞时直接 flipX。
  private makeTrialSideSpike() {
    const g = this.add.graphics()
    const P = (x: number, y: number) => new Phaser.Math.Vector2(x, y)

    // 尾端速度线
    g.fillStyle(0xffd54f, 0.16)
    g.fillRect(0, 4, 7, 1)
    g.fillRect(1, 9, 5, 1)
    g.fillStyle(0xd8c293, 0.22)
    g.fillRect(2, 6, 4, 1)

    // 主体：底端粗、右端收成尖
    const body: Array<[number, number]> = [
      [4, 4],
      [10, 2],
      [18, 3],
      [25, 1],
      [35, 7],
      [24, 12],
      [17, 11],
      [10, 13],
      [5, 11],
    ]

    g.fillStyle(0x5d4c37, 1)
    g.fillPoints(body.map(([x, y]) => P(x, y)), true)

    // 上半受光面
    g.fillStyle(0xb59a6d, 1)
    g.fillPoints([P(5, 4), P(11, 2), P(19, 3), P(26, 2), P(34, 7), P(24, 7), P(16, 8), P(9, 7)], true)
    g.fillStyle(0xd8c293, 0.85)
    g.fillPoints([P(6, 4), P(12, 3), P(20, 4), P(27, 3), P(33, 7), P(25, 6), P(16, 7)], true)

    // 下半背光面
    g.fillStyle(0x4a3b2a, 1)
    g.fillPoints([P(9, 7), P(24, 7), P(34, 7), P(24, 12), P(17, 11), P(10, 13)], true)

    // 石缝与金点
    g.lineStyle(1, 0x3b2e20, 0.65)
    g.lineBetween(12, 4, 16, 9)
    g.lineBetween(21, 5, 25, 9)
    g.fillStyle(0xffd54f, 0.9)
    g.fillRect(14, 5, 1, 2)
    g.fillRect(23, 8, 2, 1)

    // 底端碎屑
    g.fillStyle(0x8a7048, 1)
    g.fillRect(1, 12, 3, 2)
    g.fillRect(6, 13, 2, 1)

    g.generateTexture('trial-side-spike', 36, 14)
    g.destroy()
  }

  // 第三重试炼的仙家机关锅锅身（40x30）：青铜锅身、金色箍、两只提耳，锅口是开的。
  // 锅盖单独一张贴图，猜苹果时只开盖，锅本身不动。
  private makeTrialPot() {
    const g = this.add.graphics()

    // 接地影
    g.fillStyle(0x2a2118, 0.35)
    g.fillEllipse(20, 28, 32, 6)

    // 两只提耳
    g.fillStyle(0x8a6f3c, 1)
    g.fillRect(1, 14, 6, 3)
    g.fillRect(33, 14, 6, 3)
    g.fillStyle(0xffd54f, 0.8)
    g.fillRect(1, 14, 6, 1)
    g.fillRect(33, 14, 6, 1)

    // 锅身：下腹暗、上腹亮
    g.fillStyle(0x4f4232, 1)
    g.fillEllipse(20, 22, 32, 16)
    g.fillStyle(0x7a6547, 1)
    g.fillEllipse(20, 17, 32, 20)
    g.fillStyle(0x9a8460, 1)
    g.fillEllipse(18, 15, 24, 14)
    g.fillStyle(0xb59a6d, 0.55)
    g.fillEllipse(15, 12, 12, 8)

    // 金色箍和铆钉
    g.fillStyle(0xd9a441, 1)
    g.fillRect(4, 19, 32, 2)
    g.fillStyle(0xffd54f, 0.9)
    g.fillRect(4, 19, 32, 1)
    ;[7, 13, 27, 33].forEach((x) => {
      g.fillStyle(0xffe9a8, 1)
      g.fillRect(x, 20, 1, 1)
    })

    // 锅口：外沿金圈 + 里面一圈深色，看得出盖子是盖在这上面的
    g.fillStyle(0x6b5a3f, 1)
    g.fillEllipse(20, 6, 34, 10)
    g.fillStyle(0x2e261c, 1)
    g.fillEllipse(20, 6, 29, 7)
    g.lineStyle(2, 0xd9a441, 0.9)
    g.strokeEllipse(20, 6, 34, 10)
    g.fillStyle(0xfff1c4, 0.55)
    g.fillRect(7, 3, 10, 1)

    g.generateTexture('trial-pot', 40, 30)
    g.destroy()
  }

  // 锅盖（36x12）：盖面 + 金色边 + 小钮，单独一张，方便打开和盖上。
  private makeTrialPotLid() {
    const g = this.add.graphics()

    g.fillStyle(0x5a4a35, 1)
    g.fillEllipse(18, 8, 34, 6)
    g.fillStyle(0x8a7350, 1)
    g.fillEllipse(18, 6, 30, 6)
    g.fillStyle(0xd9a441, 1)
    g.fillRect(3, 7, 30, 1)
    g.fillStyle(0x9a7a45, 1)
    g.fillEllipse(18, 4, 16, 6)
    g.fillStyle(0xffd54f, 1)
    g.fillCircle(18, 2, 2)
    g.fillStyle(0xfff1c4, 0.7)
    g.fillRect(7, 5, 12, 1)

    g.generateTexture('trial-pot-lid', 36, 12)
    g.destroy()
  }

  // 藏在锅下的苹果（14x14）：红果、深红底、绿叶和短梗。
  private makeTrialApple() {
    const g = this.add.graphics()

    g.fillStyle(0x8e1f1f, 1)
    g.fillCircle(7, 9, 5)
    g.fillStyle(0xd63c3c, 1)
    g.fillCircle(7, 8, 4.5)
    g.fillStyle(0xf06a5a, 0.9)
    g.fillCircle(5, 6, 2)
    g.fillStyle(0xffb0a0, 0.8)
    g.fillCircle(4.5, 5.5, 1)

    g.fillStyle(0x6b4a2c, 1)
    g.fillRect(7, 1, 1, 3)
    g.fillStyle(0x4f8a3a, 1)
    g.fillEllipse(10, 3, 5, 3)
    g.fillStyle(0x7fb04a, 1)
    g.fillEllipse(10, 2.6, 3, 1.6)

    g.generateTexture('trial-apple', 14, 14)
    g.destroy()
  }

  // ── 长在**垂直崖壁上**的树 3 种（2026/10/17 用户要的：不是站在平地上，是从崖壁里长出来）──
  //   照黄山松 / 崖柏的样子来：
  //   ① 根不是扎进土里，而是**像手指一样扒在岩面上**，往左（贴壁那一侧）铺开；
  //   ② 树干从石缝里**横着探出来**，再折向上；
  //   ③ 树冠被风吹成**平顶**、往一侧压（迎风那侧几乎没有枝，背风那侧甩出去）；
  //   ④ 树身常常比冠还要歪、还要细，一半的体量在崖外悬着。
  //   所以贴图左边那一列就是"贴壁"的方向 —— 摆到关卡里的垂直崖面上，根正好压住岩壁。
  private makeCliffTrees() {
    const P = (x: number, y: number) => new Phaser.Math.Vector2(x, y)

    const a = this.add.graphics()
    // ① 根：四股往左铺开、扒在岩面上
    a.fillStyle(0x4a3524, 1)
    // 根：**从树干底部那个点往外叉**（内端压在树干上，2026/10/17 用户要求根和树干连上）
    for (const root of [[11, 42, 0, 24], [11, 44, 0, 36], [11, 46, 0, 48], [11, 50, 2, 57]]) {
      a.fillPoints(
        [P(root[0], root[1]), P(root[2], root[3] - 3), P(root[2] + 5, root[3] + 1), P(root[0], root[1] + 4)],
        true
      )
    }
    // ② 树干：从缝里横着出去，再折向上
    a.fillStyle(0x3a2a1c, 1)
    a.fillPoints([P(6, 41), P(11, 46), P(38, 21), P(44, 15), P(48, 20), P(40, 26), P(13, 51)], true)
    a.fillStyle(0x513c26, 1)
    a.fillPoints([P(8, 44), P(11, 45), P(42, 18), P(45, 19)], true)
    // ③ 平顶松冠：三层，全往右压
    const pad = (cx: number, cy: number, w: number, h: number) => {
      a.fillStyle(0x2f5136, 1)
      a.fillEllipse(cx, cy, w, h)
      a.fillStyle(0x46754a, 1)
      a.fillEllipse(cx - 1, cy - 2, w * 0.72, h * 0.5)
    }
    pad(52, 20, 40, 13)
    pad(56, 11, 30, 11)
    pad(46, 27, 26, 9)
    a.generateTexture('tree-cliff-a', 76, 64)
    a.destroy()

    const b = this.add.graphics()
    // 根：三股短的
    b.fillStyle(0x4a3524, 1)
    for (const root of [[12, 48, 0, 34], [12, 50, 0, 44], [12, 53, 1, 52]]) {
      b.fillPoints(
        [P(root[0], root[1]), P(root[2], root[3] - 3), P(root[2] + 5, root[3] + 1), P(root[0], root[1] + 4)],
        true
      )
    }
    // 短而粗的树干，探出崖面就分叉
    b.fillStyle(0x3a2a1c, 1)
    b.fillPoints([P(6, 46), P(12, 51), P(30, 30), P(36, 24), P(39, 30), P(33, 35), P(14, 55)], true)
    b.fillStyle(0x513c26, 1)
    b.fillPoints([P(8, 49), P(12, 50), P(35, 27), P(37, 28)], true)
    // 一根斜杈，树冠比 a 更散
    b.fillStyle(0x3a2a1c, 1)
    b.fillPoints([P(30, 30), P(33, 34), P(46, 20), P(44, 17)], true)
    b.fillStyle(0x2f5136, 1)
    b.fillEllipse(46, 22, 44, 17)
    b.fillStyle(0x46754a, 1)
    b.fillEllipse(42, 17, 30, 12)
    b.fillStyle(0x2a4830, 1)
    b.fillEllipse(55, 1 + 27, 26, 11)
    // **鸟巢**：卡在分叉那一处（枝条编成的一圈 + 两枚浅色的蛋）
    b.fillStyle(0x5b4326, 1)
    b.fillEllipse(36, 30, 20, 9)
    b.fillStyle(0x6f5430, 1)
    b.fillEllipse(36, 28, 15, 6)
    b.fillStyle(0x3a2a1c, 1)
    for (const x of [29, 32, 35, 38, 41]) {
      b.fillRect(x, 27 + (x % 2), 4, 1)
    }
    b.fillStyle(0xf2e6c8, 1)
    b.fillCircle(34, 27, 2.2)
    b.fillCircle(38, 27, 2.2)
    b.generateTexture('tree-cliff-b', 76, 64)
    b.destroy()

    const c = this.add.graphics()
    // 旗形：风常年往右刮 —— 树干几乎是平的，枝全甩到右边，左边那侧一根枝都没有
    c.fillStyle(0x4a3524, 1)
    for (const root of [[10, 42, 0, 30], [10, 44, 0, 42], [10, 48, 1, 52]]) {
      c.fillPoints(
        [P(root[0], root[1]), P(root[2], root[3] - 3), P(root[2] + 5, root[3] + 1), P(root[0], root[1] + 4)],
        true
      )
    }
    c.fillStyle(0x3a2a1c, 1)
    c.fillPoints([P(6, 39), P(10, 45), P(48, 32), P(52, 26), P(56, 31), P(47, 38), P(12, 50)], true)
    c.fillStyle(0x513c26, 1)
    c.fillPoints([P(8, 42), P(11, 44), P(50, 30), P(52, 31)], true)
    // 往右甩出去的冠（扁长的两片）+ 底下一小片
    c.fillStyle(0x2f5136, 1)
    c.fillEllipse(58, 24, 36, 12)
    c.fillStyle(0x46754a, 1)
    c.fillEllipse(60, 21, 26, 8)
    c.fillStyle(0x2a4830, 1)
    c.fillEllipse(46, 35, 24, 8)
    c.generateTexture('tree-cliff-c', 78, 60)
    c.destroy()
  }

  // C1 平台右端的直立松树（72x124）：主干 + 五层针叶，根部带碎石。
  // 用来替代原来横贴崖面的 tree-cliff-a，让挡住去路的是一棵完整的松树。
  private makePlatformPine() {
    const g = this.add.graphics()
    const P = (x: number, y: number) => new Phaser.Math.Vector2(x, y)

    // 落地影和脚边碎石
    g.fillStyle(0x2a2118, 0.35)
    g.fillEllipse(36, 121, 46, 6)
    g.fillStyle(0x6b6156, 1)
    g.fillEllipse(17, 120, 12, 5)
    g.fillEllipse(57, 120, 10, 4)

    // 根部
    g.fillStyle(0x3a2a1c, 1)
    g.fillTriangle(30, 120, 10, 121, 33, 107)
    g.fillTriangle(42, 120, 62, 121, 39, 107)

    // 主干，略向右弯
    g.fillStyle(0x33241a, 1)
    g.fillPoints(
      [P(30, 120), P(37, 120), P(40, 72), P(42, 42), P(39, 24), P(35, 38), P(32, 72), P(29, 108)],
      true
    )
    g.fillStyle(0x4a3524, 1)
    g.fillPoints(
      [P(32, 118), P(37, 118), P(38, 72), P(40, 42), P(38, 30), P(35, 42), P(34, 72)],
      true
    )
    g.fillStyle(0x543e29, 0.8)
    g.fillRect(35, 56, 2, 48)
    g.fillStyle(0x2a1d13, 0.6)
    g.fillRect(33, 84, 1, 26)

    // 一层针叶：深色轮廓 + 主体 + 左上受光 + 底边下垂的针叶
    const tier = (cx: number, baseY: number, width: number, height: number) => {
      g.fillStyle(0x1f3527, 1)
      g.fillTriangle(cx - width / 2 - 3, baseY + 3, cx + width / 2 + 3, baseY + 3, cx, baseY - height)
      g.fillStyle(0x2f5136, 1)
      g.fillTriangle(cx - width / 2, baseY, cx + width / 2, baseY, cx, baseY - height + 2)
      g.fillStyle(0x46754a, 1)
      g.fillTriangle(
        cx - width * 0.32,
        baseY - 3,
        cx + width * 0.08,
        baseY - 3,
        cx - width * 0.06,
        baseY - height + 8
      )
      g.fillStyle(0x5f8a3a, 0.7)
      g.fillTriangle(
        cx - width * 0.2,
        baseY - 7,
        cx - width * 0.02,
        baseY - 7,
        cx - width * 0.08,
        baseY - height + 12
      )

      for (let i = 0; i < 3; i++) {
        const tx = cx - width * 0.3 + i * width * 0.3
        g.fillStyle(i % 2 === 0 ? 0x2f5136 : 0x24402e, 1)
        g.fillTriangle(tx - 4, baseY, tx + 4, baseY, tx, baseY + 6)
      }
    }

    tier(36, 94, 62, 30)
    tier(37, 76, 54, 28)
    tier(38, 58, 44, 26)
    tier(38, 42, 32, 24)
    tier(38, 28, 20, 18)

    // 几道从冠里露出来的枝干
    g.fillStyle(0x33241a, 1)
    g.fillRect(20, 92, 16, 3)
    g.fillRect(44, 74, 14, 3)
    g.fillRect(22, 56, 12, 2)

    g.generateTexture('tree-pine', 72, 124)
    g.destroy()
  }

  // ── 岩石横截面 3 种（56x34 的岩块）—— 2026/10/17 重做：
  //   颜色全部贴住山体那档 0x6a5e52，上下只差三五个色号，靠**细石缝**分出层理，
  //   不再是一深一浅的大色块（那样贴上去像补丁）
  private makeRockStrata() {
    const bands = [0x6a5e52, 0x675b4f, 0x6e6256, 0x645849]
    const seam = 0x554a3f

    const a = this.add.graphics()
    a.fillStyle(bands[0], 1)
    a.fillRect(0, 0, 56, 34)
    for (let i = 0; i < 4; i++) {
      a.fillStyle(bands[i % bands.length], 1)
      a.fillRect(0, 6 + i * 7, 56, 4)
    }
    a.lineStyle(1, seam, 0.75)
    a.lineBetween(20, 0, 26, 16)
    a.lineBetween(26, 16, 22, 34)
    a.generateTexture('rock-strata-a', 56, 34)
    a.destroy()

    const b = this.add.graphics()
    b.fillStyle(bands[1], 1)
    b.fillRect(0, 0, 56, 34)
    for (let row = 0; row < 4; row++) {
      let x = row % 2 === 0 ? 0 : -8
      while (x < 56) {
        b.fillStyle(bands[(row + 2) % bands.length], 1)
        const w = 16 + ((row * 7 + (x + 56)) % 10)
        b.fillRect(x + 1, row * 9 + 1, w - 2, 7)
        x += w
      }
    }
    b.generateTexture('rock-strata-b', 56, 34)
    b.destroy()

    const c = this.add.graphics()
    c.fillStyle(bands[0], 1)
    c.fillRect(0, 0, 56, 34)
    c.fillStyle(bands[1], 1)
    c.fillRect(0, 10, 56, 6)
    c.fillRect(0, 24, 56, 5)
    for (const spot of [[12, 12, 9], [30, 15, 7], [44, 26, 8], [20, 28, 6]]) {
      c.fillStyle(0x746858, 1)
      c.fillCircle(spot[0], spot[1], spot[2] / 2)
      c.fillStyle(0x7d7161, 1)
      c.fillCircle(spot[0] - 1, spot[1] - 1, spot[2] / 3)
    }
    c.generateTexture('rock-strata-c', 56, 34)
    c.destroy()
  }

  // ── 小石子 3 种（18x12 的小簇）──────────────────────────────────────
  private makePebbles() {
    const a = this.add.graphics()
    a.fillStyle(0x6b6156, 1)
    a.fillEllipse(5, 8, 8, 6)
    a.fillEllipse(11, 9, 7, 5)
    a.fillEllipse(9, 5, 6, 5)
    a.fillStyle(0x8a8073, 1)
    a.fillEllipse(4, 7, 4, 2)
    a.fillEllipse(8, 4, 3, 2)
    a.generateTexture('pebble-a', 18, 12)
    a.destroy()

    const b = this.add.graphics()
    const P = (x: number, y: number) => new Phaser.Math.Vector2(x, y)
    b.fillStyle(0x5f564c, 1)
    b.fillPoints([P(1, 10), P(7, 3), P(16, 6), P(12, 11)], true)
    b.fillStyle(0x7d7367, 1)
    b.fillPoints([P(3, 8), P(7, 4), P(13, 6), P(10, 9)], true)
    b.generateTexture('pebble-b', 18, 12)
    b.destroy()

    const c = this.add.graphics()
    c.fillStyle(0x6b6156, 1)
    c.fillEllipse(9, 7, 14, 9)
    c.fillStyle(0x8a8073, 1)
    c.fillEllipse(7, 5, 7, 4)
    c.fillStyle(0x5f8a3a, 1)
    c.fillEllipse(12, 4, 7, 3)
    c.fillStyle(0x7fb04a, 1)
    c.fillRect(11, 2, 1, 2)
    c.fillRect(14, 3, 1, 2)
    c.generateTexture('pebble-c', 18, 12)
    c.destroy()
  }

  // ── 石堆（38x26）：七块石头垒起来的一小堆 ────────────────────────────
  private makeStonePile() {
    const g = this.add.graphics()
    const stone = (x: number, y: number, w: number, h: number, dark: number, light: number) => {
      g.fillStyle(dark, 1)
      g.fillEllipse(x, y, w, h)
      g.fillStyle(light, 1)
      g.fillEllipse(x - 1, y - 1, w * 0.6, h * 0.5)
    }

    stone(10, 20, 16, 8, 0x4f463c, 0x6b6156)
    stone(26, 21, 14, 7, 0x4f463c, 0x6b6156)
    stone(18, 15, 14, 8, 0x574d42, 0x776d60)
    stone(28, 13, 10, 7, 0x4f463c, 0x6b6156)
    stone(8, 12, 10, 7, 0x574d42, 0x776d60)
    stone(17, 7, 12, 7, 0x5f564c, 0x8a8073)
    g.generateTexture('stone-pile', 38, 26)
    g.destroy()
  }

  // ── 桦木 2 种（白杆 + 黑横斑 + 嫩绿树冠）—— 用户 2026/10/17 只留 a、c ──
  private makeBirches() {
    const P = (x: number, y: number) => new Phaser.Math.Vector2(x, y)
    const canopy = (g: Phaser.GameObjects.Graphics, cx: number, cy: number, w: number, h: number) => {
      g.fillStyle(0x6f9a4a, 1)
      g.fillEllipse(cx, cy, w, h)
      g.fillStyle(0x8cba5e, 1)
      g.fillEllipse(cx - w * 0.08, cy - h * 0.16, w * 0.72, h * 0.62)
      g.fillStyle(0x5c8a3c, 1)
      g.fillEllipse(cx + w * 0.22, cy + h * 0.2, w * 0.4, h * 0.34)
    }

    const a = this.add.graphics()
    a.fillStyle(0xe8e4d8, 1)
    a.fillPoints([P(22, 70), P(27, 70), P(26, 24), P(23, 24)], true)
    a.fillStyle(0xf5f2e8, 1)
    a.fillRect(23, 24, 2, 46)
    a.fillStyle(0xcfcabb, 1)
    a.fillRect(25, 24, 1, 46)
    a.fillStyle(0x2c2622, 1)
    for (let y = 30, i = 0; y < 66; y += 5, i++) {
      a.fillRect(22 + (i % 2), y, 3, 1)
    }
    canopy(a, 24, 16, 34, 26)
    a.generateTexture('birch-a', 48, 72)
    a.destroy()

    const c = this.add.graphics()
    c.fillStyle(0xe8e4d8, 1)
    c.fillPoints([P(20, 70), P(25, 70), P(31, 34), P(27, 33)], true)
    c.fillStyle(0x2c2622, 1)
    for (const mark of [[23, 60], [25, 52], [27, 44], [29, 38]]) {
      c.fillRect(mark[0], mark[1], 3, 1)
    }
    canopy(c, 32, 24, 40, 28)
    c.generateTexture('birch-c', 56, 72)
    c.destroy()
  }

  // ── 仙桃树 2 种（2026/10/17 用户要的"更符合仙人气质的树"）：蟠曲的老干 + 粉花 ──
  //   仙人居所常见的那种：树干扭着长、树冠不是一整团绿，而是一簇簇粉白的花
  private makePeachTrees() {
    const P = (x: number, y: number) => new Phaser.Math.Vector2(x, y)
    const blossom = (g: Phaser.GameObjects.Graphics, cx: number, cy: number, w: number, h: number) => {
      g.fillStyle(0xd97fa3, 1)
      g.fillEllipse(cx, cy, w, h)
      g.fillStyle(0xf2a7c0, 1)
      g.fillEllipse(cx - w * 0.1, cy - h * 0.16, w * 0.78, h * 0.68)
      g.fillStyle(0xfbd3e0, 1)
      g.fillEllipse(cx - w * 0.2, cy - h * 0.28, w * 0.4, h * 0.34)
    }

    // a：矮而盘的老干，四簇花
    const a = this.add.graphics()
    a.fillStyle(0x402c1c, 1)
    a.fillPoints([P(26, 70), P(34, 70), P(36, 52), P(44, 40), P(38, 36), P(28, 50)], true)
    a.fillStyle(0x533a24, 1)
    a.fillPoints([P(28, 70), P(31, 70), P(33, 52), P(41, 39), P(38, 38), P(30, 50)], true)
    // 两根斜枝
    a.fillStyle(0x402c1c, 1)
    a.fillPoints([P(30, 46), P(33, 48), P(18, 30), P(16, 32)], true)
    a.fillPoints([P(36, 40), P(38, 43), P(52, 26), P(50, 24)], true)
    // 根
    a.fillTriangle(26, 70, 14, 73, 30, 65)
    a.fillTriangle(34, 70, 46, 73, 32, 65)
    blossom(a, 16, 26, 26, 16)
    blossom(a, 52, 22, 24, 15)
    blossom(a, 34, 14, 30, 17)
    blossom(a, 42, 32, 20, 12)
    a.generateTexture('peach-a', 68, 76)
    a.destroy()

    // c：高一点、往一边斜的
    const c = this.add.graphics()
    c.fillStyle(0x402c1c, 1)
    c.fillPoints([P(22, 70), P(29, 70), P(34, 44), P(44, 20), P(38, 17), P(28, 42)], true)
    c.fillStyle(0x533a24, 1)
    c.fillPoints([P(23, 70), P(26, 70), P(31, 44), P(41, 20), P(38, 19), P(25, 43)], true)
    c.fillStyle(0x402c1c, 1)
    c.fillPoints([P(31, 40), P(34, 42), P(24, 26), P(22, 28)], true)
    c.fillTriangle(22, 70, 10, 72, 26, 64)
    blossom(c, 40, 16, 30, 18)
    blossom(c, 22, 24, 22, 14)
    blossom(c, 50, 28, 22, 13)
    blossom(c, 34, 34, 18, 11)
    c.generateTexture('peach-c', 68, 76)
    c.destroy()
  }

  // ── 山顶那棵巨大的垂柳（2026/10/17 用户定稿的形态）──────────────────
  //   ① 底部粗、往上收细；② 主干**先往左弯**，过了腰再**向右上侧伸长**；
  //   ③ 冠又宽又密，而且要**盖住每根枝条的末端**（枝梢不能光秃秃地露出来）；
  //   ④ 底下垂一大蓬柳条。190x240，摆在 460 的山顶平台上，顶能够到 220
  private makeSummitWillow() {
    const P = (x: number, y: number) => new Phaser.Math.Vector2(x, y)
    const g = this.add.graphics()

    // 主干的脊线：底部粗、先向左弓、过了腰再往右上伸
    const spine: Array<[number, number, number]> = [
      [128, 268, 30],
      [120, 240, 26],
      [96, 210, 21],
      [86, 186, 18],
      [100, 158, 15],
      [124, 126, 12],
      [154, 96, 10],
      [186, 66, 8],
      [212, 46, 6],
    ]

    // 沿脊线一段段铺成四边形：先铺一圈深色轮廓，再压本体，再点一道受光侧
    const segment = (from: number, to: number, grow: number, color: number, alpha = 1) => {
      g.fillStyle(color, alpha)
      for (let i = from; i < to; i++) {
        const a = spine[i]
        const b = spine[i + 1]
        g.fillPoints(
          [
            P(a[0] - a[2] - grow, a[1] + 1),
            P(a[0] + a[2] + grow, a[1] + 1),
            P(b[0] + b[2] + grow, b[1] - 1),
            P(b[0] - b[2] - grow, b[1] - 1),
          ],
          true
        )
      }
    }

    segment(0, spine.length - 1, 2, 0x33241a)
    segment(0, spine.length - 1, 0, 0x412f1f)
    // 受光的一侧（右边那条窄带）
    g.fillStyle(0x543e29, 1)
    for (let i = 0; i < spine.length - 1; i++) {
      const a = spine[i]
      const b = spine[i + 1]
      g.fillPoints(
        [P(a[0] + a[2] * 0.35, a[1] + 1), P(a[0] + a[2] * 0.8, a[1] + 1), P(b[0] + b[2] * 0.8, b[1] - 1), P(b[0] + b[2] * 0.35, b[1] - 1)],
        true
      )
    }
    // 树皮竖纹
    g.fillStyle(0x2a1d13, 0.7)
    for (const bark of [[86, 214, 3, 18], [72, 186, 2, 16], [64, 158, 2, 18], [82, 128, 2, 16], [106, 100, 2, 14], [134, 72, 1, 16]]) {
      g.fillRect(bark[0], bark[1], bark[2], bark[3])
    }
    // 底部的板根：从主干底边的两个角贴着地面往两边叉出去
    //（原来那两道是按旧脊线画的，脊线一挪就成了浮在树边的两块三角，2026/10/17 修）
    g.fillStyle(0x33241a, 1)
    g.fillTriangle(98, 268, 58, 269, 104, 236)
    g.fillTriangle(158, 268, 198, 269, 152, 236)
    g.fillStyle(0x412f1f, 1)
    g.fillTriangle(102, 268, 74, 268, 106, 242)
    g.fillTriangle(154, 268, 182, 268, 150, 242)

    // 四根**粗壮**的枝：根端最粗、往梢上收，末端都伸进冠里（会被叶团盖住）
    const limb = (x0: number, y0: number, x1: number, y1: number, w0: number, w1: number) => {
      const dx = x1 - x0
      const dy = y1 - y0
      const len = Math.hypot(dx, dy) || 1
      const nx = -dy / len
      const ny = dx / len

      g.fillStyle(0x33241a, 1)
      g.fillPoints(
        [P(x0 + nx * (w0 + 2), y0 + ny * (w0 + 2)), P(x1 + nx * (w1 + 2), y1 + ny * (w1 + 2)), P(x1 - nx * (w1 + 2), y1 - ny * (w1 + 2)), P(x0 - nx * (w0 + 2), y0 - ny * (w0 + 2))],
        true
      )
      g.fillStyle(0x412f1f, 1)
      g.fillPoints(
        [P(x0 + nx * w0, y0 + ny * w0), P(x1 + nx * w1, y1 + ny * w1), P(x1 - nx * w1, y1 - ny * w1), P(x0 - nx * w0, y0 - ny * w0)],
        true
      )
      g.fillStyle(0x543e29, 1)
      g.fillPoints(
        [P(x0 + nx * w0 * 0.7, y0 + ny * w0 * 0.7), P(x0 + nx * w0, y0 + ny * w0), P(x1 + nx * w1, y1 + ny * w1), P(x1 + nx * w1 * 0.7, y1 + ny * w1 * 0.7)],
        true
      )
    }

    limb(96, 178, 44, 122, 11, 6)
    limb(128, 140, 86, 74, 10, 6)
    limb(170, 110, 178, 46, 9, 5)
    limb(200, 70, 236, 52, 8, 4)

    // 冠：宽、密，五团叠起来，把四根枝的末端全盖住
    const clump = (cx: number, cy: number, w: number, h: number) => {
      g.fillStyle(0x4e7a38, 1)
      g.fillEllipse(cx, cy, w, h)
      g.fillStyle(0x6f9a4a, 1)
      g.fillEllipse(cx - w * 0.06, cy - h * 0.2, w * 0.86, h * 0.66)
      g.fillStyle(0x8cba5e, 1)
      g.fillEllipse(cx - w * 0.14, cy - h * 0.32, w * 0.52, h * 0.36)
    }
    clump(44, 122, 60, 46)
    clump(64, 94, 76, 56)
    clump(112, 62, 92, 64)
    clump(168, 46, 96, 60)
    clump(204, 68, 62, 46)

    // 柳条：从冠的下垂下来，密一点
    const strand = (x0: number, y0: number, len: number, sway: number, color: number) => {
      g.fillStyle(color, 1)
      for (let i = 0; i < len; i += 3) {
        const x = x0 + Math.sin((i / len) * Math.PI * 2 + x0) * sway
        g.fillRect(x, y0 + i, 2, 3)
      }
    }
    for (let i = 0; i < 36; i++) {
      const x = 12 + i * 6
      const top = 70 + ((i * 11) % 34)
      const len = 80 + ((i * 17) % 90)
      const color = i % 3 === 0 ? 0x41682f : i % 3 === 1 ? 0x5f8a3a : 0x7fb04a
      strand(x, top, len, 3 + (i % 4), color)
    }

    g.generateTexture('willow-summit', 240, 270)
    g.destroy()
  }

  // ── 柳树下的石桌石凳 + 茶具（2026/10/17）：桌上一壶三杯，杯口冒热气 ────
  private makeTeaSet() {
    // 石桌（44x30）
    const table = this.add.graphics()
    table.fillStyle(0x4f463c, 1)
    table.fillRect(16, 14, 12, 14)
    table.fillStyle(0x5f564c, 1)
    table.fillRect(17, 14, 4, 14)
    table.fillStyle(0x6b6156, 1)
    table.fillEllipse(22, 12, 42, 12)
    table.fillStyle(0x8a8073, 1)
    table.fillEllipse(22, 9, 42, 9)
    // 茶壶（深陶色 + 壶嘴 + 壶盖钮）
    table.fillStyle(0x7a4a32, 1)
    table.fillEllipse(15, 6, 14, 9)
    table.fillStyle(0x8f5a3e, 1)
    table.fillEllipse(14, 4, 10, 6)
    table.fillStyle(0x7a4a32, 1)
    table.fillTriangle(21, 3, 25, 1, 22, 6)
    table.fillStyle(0x5f3724, 1)
    table.fillCircle(14, 1, 1.6)
    // 三只小茶杯（浅色的，杯口一点茶）
    for (const cup of [[29, 7], [35, 8], [24, 9]]) {
      table.fillStyle(0xe8e4d8, 1)
      table.fillEllipse(cup[0], cup[1], 6, 4)
      table.fillStyle(0xb98a4a, 1)
      table.fillEllipse(cup[0], cup[1] - 1, 4, 2)
    }
    table.generateTexture('tea-table', 44, 30)
    table.destroy()

    // 石凳（32x14）
    const bench = this.add.graphics()
    bench.fillStyle(0x4f463c, 1)
    bench.fillRect(4, 8, 4, 6)
    bench.fillRect(24, 8, 4, 6)
    bench.fillStyle(0x6b6156, 1)
    bench.fillRect(1, 5, 30, 5)
    bench.fillStyle(0x8a8073, 1)
    bench.fillRect(1, 5, 30, 2)
    bench.generateTexture('tea-bench', 32, 14)
    bench.destroy()

    // 热气（10x16）：一道弯着的白汽
    const steam = this.add.graphics()
    steam.fillStyle(0xffffff, 0.5)
    steam.fillEllipse(5, 13, 6, 4)
    steam.fillStyle(0xffffff, 0.38)
    steam.fillEllipse(6, 9, 5, 4)
    steam.fillStyle(0xffffff, 0.26)
    steam.fillEllipse(4, 5, 4, 4)
    steam.fillStyle(0xffffff, 0.16)
    steam.fillEllipse(5, 2, 3, 3)
    steam.generateTexture('tea-steam', 10, 16)
    steam.destroy()
  }

  // ── 崖面（2026/10/17 用户定）：**整面都是裸露的石头**，不是往平面上贴几块圆石 ──
  //   石头配色就这四档，以后画这一带的岩体都用它（别再各画各的）：
  //     亮面 0x8a7c69 · 主面 0x73665a · 暗面 0x5e5348 · 石缝 0x453d34
  //   形状是**有棱有角的块面**：一块一块不等边的多边形拼起来，靠外那条边参差不齐，
  //   一整段接着一整段摞上去，边缘才是连续的崖（不是一个个方框）。
  //   贴图右边是参差的外沿、左边是直的（贴住山体）；挂到左边的崖面时 flip 过来。
  private makeCliffDetails() {
    const LIT = 0x8a7c69
    const MID = 0x73665a
    const DARK = 0x5e5348
    const CRACK = 0x453d34
    const P = (x: number, y: number) => new Phaser.Math.Vector2(x, y)

    // 一整面崖壁一张图（2026/10/17 重画）：
    //   以前是 180 高的小块一张张往上摞，靠压 40 像素盖住横缝；远看还行，近看每块之间
    //   都有一条横向接缝，而且最上面那一块只要差几像素就会蹭到平台面、把草带盖掉。
    //   现在按整段高度一次画完，外沿从崖顶一路到底，不留横缝：
    //     左崖壁 594 高（平台板底 766 → 地面 1360）
    //     右崖壁 894 高（平台板底 466 → 地面 1360）
    //     山顶接缝那条窄岩垛 896 高（464 → 1360）——只盖山体接缝，不盖草带
    //   贴图最左边 x=0 这一条是**直的**，要埋进山体里；右边才是参差的外沿。
    const wall = (key: string, W: number, H: number, seed: number, spread: number) => {
      const g = this.add.graphics()
      let s = seed >>> 0
      const rnd = () => {
        s = (s * 1664525 + 1013904223) >>> 0
        return s / 4294967296
      }

      // 崖顶收一个斜肩：从直边（x=0）斜着探出去，再往下走 —— 不是一刀切的平口
      const pts: Array<[number, number]> = [[0, 0], [spread * 0.72, 4], [spread * 0.94, 9]]
      let x = spread * 0.94
      let y = 9
      let dir = 1

      while (y < H - 26) {
        const run = 34 + rnd() * 46
        y = Math.min(H - 12, y + run)
        pts.push([x, y])

        // 一半是直上直下的岩面，一半是斜着退进去的冲刷面 —— 混着来才不像楼梯
        const step = 8 + rnd() * 14
        const nextX = Math.max(spread - 34, Math.min(spread, x + dir * step))

        if (rnd() < 0.45 && y < H - 24) {
          y = Math.min(H - 12, y + 10 + rnd() * 18)
          pts.push([nextX, y])
        } else if (y < H - 12) {
          pts.push([nextX, y])
        }

        x = nextX
        if (rnd() < 0.55) dir = -dir
      }

      pts.push([x, H])

      // ① 整面岩体
      const body: Phaser.Math.Vector2[] = [P(0, -2), ...pts.map(([px, py]) => P(px, py)), P(0, H + 2)]
      g.fillStyle(MID, 1)
      g.fillPoints(body, true)

      // ② 每一段竖面/斜面：往外凸的受光，往里退的压暗；横檐底面单独压一道
      for (let i = 0; i < pts.length - 1; i++) {
        const [ax, ay] = pts[i]
        const [bx, by] = pts[i + 1]

        if (by === ay) {
          g.fillStyle(DARK, 1)
          g.fillRect(Math.min(ax, bx) - 4, ay - 1, Math.abs(bx - ax) + 4, 3)
          continue
        }

        const inset = Math.min(12, Math.max(4, spread * 0.1))
        const edge = Math.min(inset, ax - 1, bx - 1)
        if (edge <= 0) continue

        g.fillStyle(bx > ax ? LIT : DARK, 1)
        g.fillPoints([P(ax, ay), P(bx, by), P(bx - edge, by), P(ax - edge, ay)], true)
      }

      // ③ 冲沟：从崖顶往下越冲越宽，沟底压在岩体里
      const gullies = W > 80 ? 3 : 2
      for (let k = 0; k < gullies; k++) {
        const gx = 8 + k * (W > 80 ? 18 : 10) + rnd() * 4
        const gy = 8 + rnd() * 10
        const gb = H - 16 - rnd() * 20
        const topW = 3 + rnd() * 2
        const botW = topW + 3 + rnd() * 3

        g.fillStyle(CRACK, 0.62)
        g.fillPoints([P(gx, gy), P(gx + topW, gy), P(gx + botW + 3, gb), P(gx + 3, gb)], true)
        g.fillStyle(DARK, 0.45)
        g.fillPoints([P(gx + topW, gy), P(gx + topW + 1.5, gy), P(gx + botW + 1, gb), P(gx + botW + 3, gb)], true)
      }

      // ④ 层理：顺着高度横着几道细石缝，只在岩体里面，不出外沿
      const profileAt = (py: number) => {
        for (let i = 0; i < pts.length - 1; i++) {
          const [ax, ay] = pts[i]
          const [bx, by] = pts[i + 1]
          if (py >= ay && py <= by && by > ay) {
            return ax + ((bx - ax) * (py - ay)) / (by - ay)
          }
        }
        return pts[pts.length - 1][0]
      }

      g.lineStyle(1, CRACK, 0.5)
      for (let ly = 30; ly < H - 10; ly += 30 + rnd() * 22) {
        const right = profileAt(ly) - 6
        if (right > 8) {
          g.lineBetween(4, ly, right, ly + (rnd() - 0.5) * 2)
        }
      }

      // ⑤ 大块面：几片暗一块、亮一块，把平面的岩体拆开
      for (let i = 0; i < 4; i++) {
        const fy = 18 + rnd() * (H - 80)
        const fx = 4 + rnd() * 18
        const fw = Math.min(profileAt(fy) - fx - 8, 28 + rnd() * 26)
        const fh = 22 + rnd() * 34
        if (fw <= 6) continue
        g.fillStyle(i % 2 === 0 ? DARK : LIT, 0.22)
        g.fillPoints([P(fx, fy), P(fx + fw, fy + 3), P(fx + fw - 6, fy + fh), P(fx, fy + fh - 4)], true)
      }

      // ⑥ 外沿压一道深色边：崖面和后面的山体同色，不给边就糊在一起
      g.lineStyle(1, CRACK, 0.75)
      for (let i = 0; i < pts.length - 1; i++) {
        g.lineBetween(pts[i][0], pts[i][1], pts[i + 1][0], pts[i + 1][1])
      }

      // ⑦ 顶肩压亮、肩下压暗（光从上来）
      g.lineStyle(2, LIT, 0.8)
      g.lineBetween(1, 1, spread * 0.94, 9)
      g.lineStyle(1, DARK, 0.6)
      g.lineBetween(2, 5, spread * 0.94, 13)

      g.generateTexture(key, W, H)
      g.destroy()
    }

    wall('cliff-wall-l', 118, 594, 11, 108)
    wall('cliff-wall-r', 118, 894, 23, 108)
    wall('cliff-buttress', 56, 896, 37, 50)
    wall('cliff-wall-350', 118, 350, 41, 108)
    wall('cliff-wall-420', 118, 420, 43, 108)

    // 碎石锥（100x44）：崖脚那一扇碎石 —— 山体和平地之间真正的过渡。
    // 每颗碎石都按三角形当时的左右边界放，不会飘到坡外面去。
    const talus = this.add.graphics()
    talus.fillStyle(0x5e5348, 1)
    talus.fillPoints([P(66, 0), P(100, 44), P(0, 44)], true)
    talus.fillStyle(0x6a5e52, 1)
    talus.fillPoints([P(62, 4), P(92, 44), P(8, 44)], true)
    talus.fillStyle(0x453d34, 0.35)
    talus.fillEllipse(52, 42, 86, 8)
    let seed = 7
    const rnd = () => {
      seed = (seed * 1103515245 + 12345) % 2147483648
      return seed / 2147483648
    }
    for (let i = 0; i < 18; i++) {
      const ty = 10 + rnd() * 30
      const left = 66 - 1.5 * ty + 3
      const right = 66 + 0.7727 * ty - 3
      const tx = left + rnd() * Math.max(0, right - left)
      const size = 3 + rnd() * 5
      talus.fillStyle(i % 3 === 0 ? 0x73665a : i % 3 === 1 ? 0x5e5348 : 0x8a7c69, 1)
      talus.fillEllipse(tx, ty, size, size * 0.7)
    }
    talus.generateTexture('cliff-talus', 100, 44)
    talus.destroy()

    // 崖沿上的草（这丛草是长在崖沿上的植被，不是崖壁本身）
    const grass = this.add.graphics()
    // 一小撮土
    grass.fillStyle(0x4a3a28, 1)
    grass.fillEllipse(13, 12, 20, 6)
    // 草叶：长短不一、往两边散
    grass.fillStyle(0x5f8a3a, 1)
    grass.fillRect(12, 3, 2, 9)
    grass.fillRect(7, 5, 2, 7)
    grass.fillRect(18, 5, 2, 7)
    grass.fillStyle(0x7fb04a, 1)
    grass.fillTriangle(11, 12, 15, 12, 10, 1)
    grass.fillTriangle(6, 12, 9, 12, 4, 3)
    grass.fillTriangle(17, 12, 20, 12, 23, 2)
    grass.fillStyle(0x86bb52, 1)
    grass.fillRect(13, 2, 1, 4)
    // 垂下去的草根（末端挂着一点土）
    grass.fillStyle(0x6b5334, 1)
    grass.fillRect(6, 14, 1, 8)
    grass.fillRect(12, 14, 1, 11)
    grass.fillRect(19, 14, 1, 7)
    grass.fillStyle(0x4a3a28, 1)
    grass.fillRect(11, 24, 3, 2)
    grass.fillRect(5, 21, 2, 2)
    grass.generateTexture('cliff-grass', 26, 28)
    grass.destroy()
  }

  private makeCloudRetainerCrane() {
    // 配色（2026/10/15 用户定）：**脖子以上一个字不改，全用回原来那套**；只把**身子**换成青白。
    //   青白 = 白里带一层淡青，所以身子比原来的纯白略沉一档，下腹的暗面也跟着压青
    const BODY = 0xd0ebf1       // 青白：身子 + 收拢的翅膀（原来这两个都是纯白）
    const BODY_DEEP = 0xb0d8e1  // 青白的暗面（下腹）
    const WHITE = 0xf6f8fa      // 脖子 / 头 / 额前那一小撮羽 —— 还是原来的白
    const SHADE = 0xdfe8f0      // 脖子那点圆柱明暗 —— 也是原来的
    const PLUME = 0x2b3a4a
    const PLUME_DARK = 0x1e2a36
    const GOLD = 0xd9a441
    const CROWN = 0xc0392b
    const CROWN_LIGHT = 0xd94f3d
    const BEAK = 0x3f4a56
    const BEAK_DARK = 0x2c343d
    const LEG = 0x4a5560
    const LEG_DARK = 0x333c46
    const INK = 0x232830

    const g = this.add.graphics()
    const P = (x: number, y: number) => new Phaser.Math.Vector2(x, y)

    // ① 后面那条腿（压深一档，做出前后）
    g.fillStyle(LEG_DARK, 1)
    g.fillRect(71, 100, 3, 43)
    g.fillRect(66, 141, 12, 3)
    g.fillRect(73, 143, 8, 3)

    // ② 前面那条腿：长、细，中间看得见踝关节，再挂一个金环（仙人身上的饰）
    g.fillStyle(LEG, 1)
    g.fillRect(58, 96, 3, 47)
    g.fillCircle(59, 120, 2.6)
    g.fillRect(53, 142, 11, 3)
    g.fillRect(56, 145, 6, 2)
    g.fillRect(61, 143, 8, 3)
    g.fillStyle(GOLD, 1)
    g.fillRect(56, 126, 8, 3)

    // ③ 深色翼羽：从翼后甩出去、往下垂的那一束
    g.fillStyle(PLUME, 1)
    g.fillPoints([P(48, 86), P(24, 104), P(22, 122), P(42, 120), P(56, 100)], true)
    g.fillStyle(PLUME_DARK, 1)
    g.fillPoints([P(30, 106), P(20, 120), P(34, 122), P(40, 112)], true)
    g.lineStyle(1, 0x16202a, 1)
    g.lineBetween(44, 90, 30, 118)
    g.lineBetween(50, 94, 38, 120)

    // ④ 身子：横着的蛋形，深色描一圈再压白
    g.fillStyle(INK, 1)
    g.fillEllipse(66, 88, 66, 36)
    g.fillStyle(BODY, 1)
    g.fillEllipse(66, 87, 62, 32)
    g.fillStyle(BODY_DEEP, 1)
    g.fillEllipse(62, 96, 46, 14)

    // ⑤ 收起来的翅膀：一道金线当翼前缘，后面几道羽纹
    g.fillStyle(BODY, 1)
    g.fillPoints([P(88, 74), P(96, 88), P(86, 100), P(52, 100), P(44, 84)], true)
    g.lineStyle(2, GOLD, 1)
    g.lineBetween(88, 74, 48, 82)
    g.lineStyle(1, 0xc4d2e0, 1)
    g.lineBetween(86, 84, 58, 90)
    g.lineBetween(84, 92, 62, 97)

    // ⑥ 脖子：一条二阶贝塞尔，从身子前上方绕一道很轻的 S 到头上。
    //   **必须分两趟画**：先把整串轮廓圆铺满，再把整串白圆压上去 ——
    //   交替着画的话，后一个圆的深色边会把前一个圆的白心盖掉，整条脖子会变黑
    const neck = (t: number) => ({
      x: (1 - t) * (1 - t) * 92 + 2 * (1 - t) * t * 84 + t * t * 106,
      y: (1 - t) * (1 - t) * 86 + 2 * (1 - t) * t * 56 + t * t * 36,
    })

    for (let i = 0; i <= 22; i++) {
      const t = i / 22
      const p = neck(t)
      const r = 6.4 - t * 2.8

      g.fillStyle(INK, 1)
      g.fillCircle(p.x, p.y, r + 1.3)
    }

    for (let i = 0; i <= 22; i++) {
      const t = i / 22
      const p = neck(t)
      const r = 6.4 - t * 2.8

      g.fillStyle(WHITE, 1)
      g.fillCircle(p.x, p.y, r)
    }

    // 圆柱的那点明暗：靠后（左）一侧压一条很淡的冷灰，脖子才是圆的、不是一根扁带
    for (let i = 0; i <= 22; i++) {
      const t = i / 22
      const p = neck(t)
      const r = 6.4 - t * 2.8

      g.fillStyle(SHADE, 0.55)
      g.fillCircle(p.x - r * 0.42, p.y, r * 0.42)
    }

    // ⑦ 头（小、圆）+ 细长的喙
    g.fillStyle(INK, 1)
    g.fillEllipse(106, 33, 17, 15)
    g.fillStyle(WHITE, 1)
    g.fillEllipse(106, 33, 14, 12)
    g.fillStyle(BEAK, 1)
    g.fillPoints([P(112, 30), P(128, 39), P(112, 37)], true)
    g.fillStyle(BEAK_DARK, 1)
    g.fillPoints([P(113, 34), P(127, 39), P(113, 36)], true)

    // ⑧ 头冠：不做成一块红贴片，而是**几根红色小羽**立在头顶 ——
    //   中间一根最长、两边两根短，羽尖稍微往后翘；根上压一小片红当"底座"。
    //   额前留一小撮白羽，别让红一直红到喙根
    const feather = (x: number, y: number, len: number, lean: number) => {
      g.fillStyle(CROWN, 1)
      g.fillPoints(
        [P(x - 3, y), P(x + 3, y), P(x + lean + 1.5, y - len), P(x + lean - 1.5, y - len)],
        true
      )
      g.fillStyle(CROWN_LIGHT, 1)
      g.fillPoints(
        [P(x - 1, y - 1), P(x + 1.4, y - 1), P(x + lean, y - len + 2), P(x + lean - 1, y - len + 2)],
        true
      )
    }

    g.fillStyle(CROWN, 1)
    g.fillEllipse(105, 28, 13, 5)
    feather(100, 28, 8, -3)
    feather(105, 27, 13, -2)
    feather(110, 28, 7, -1)
    g.fillStyle(WHITE, 1)
    g.fillEllipse(111, 30, 7, 6)

    // ⑨ 眼睛最后点，别被红冠盖住
    g.fillStyle(INK, 1)
    g.fillCircle(108, 31, 2)

    g.generateTexture('npc-cloud-retainer-crane', 130, 152)
    g.destroy()
  }

  // ── 请仙典仪祭坛两边的香炉（26x32）：三足鼎式 ────────────────────
  //   双耳 + 口沿 + 上宽下窄的鼎身 + 三只足，青铜色压一道金纹；
  //   青烟不画进贴图，由 GameScene 用几个会往上飘的小方块做
  private makeTerraceCenser() {
    const BRONZE = 0x8a6a3a
    const BRONZE_LIGHT = 0xa8823f
    const BRONZE_DARK = 0x5a4630
    const GOLD = 0xd9a441

    const g = this.add.graphics()
    const P = (x: number, y: number) => new Phaser.Math.Vector2(x, y)

    // 双耳
    g.fillStyle(BRONZE_DARK, 1)
    g.fillRect(2, 7, 3, 6)
    g.fillRect(21, 7, 3, 6)
    g.fillStyle(BRONZE_LIGHT, 1)
    g.fillRect(3, 8, 1, 5)
    g.fillRect(22, 8, 1, 5)

    // 口沿
    g.fillStyle(BRONZE_LIGHT, 1)
    g.fillRect(3, 11, 20, 4)
    g.fillStyle(GOLD, 1)
    g.fillRect(3, 11, 20, 1)

    // 鼎身：上宽下窄
    g.fillStyle(BRONZE, 1)
    g.fillPoints([P(5, 15), P(21, 15), P(18, 25), P(8, 25)], true)
    g.fillStyle(BRONZE_LIGHT, 1)
    g.fillPoints([P(6, 15), P(9, 15), P(10, 25), P(9, 25)], true)
    g.fillStyle(BRONZE_DARK, 1)
    g.fillPoints([P(18, 15), P(21, 15), P(18, 25), P(17, 25)], true)
    g.fillStyle(GOLD, 1)
    g.fillRect(7, 19, 12, 1)

    // 三只足（中间那只压深一点，做出前后）
    g.fillStyle(BRONZE_DARK, 1)
    g.fillRect(7, 25, 3, 6)
    g.fillRect(16, 25, 3, 6)
    g.fillStyle(0x4a3a28, 1)
    g.fillRect(11, 25, 3, 5)

    g.generateTexture('terrace-censer', 26, 32)
    g.destroy()
  }

  // ── 玉京台的匾额（132x118）：进、出各立一座 ────────────────────────
  //   石柱 + 柱础 + 横枋 + 金框玉匾，顶上压一道玉瓦檐。
  //   匾心里的「玉京台」三个字**不画进贴图**，由 GameScene 用 Text 叠上去 ——
  //   以后想换字、换字体不用重画这张图
  private makeTerraceGate() {
    const TILE = 0x2f7f6a
    const TILE_LIGHT = 0x54b09a
    const STONE = 0xd3cbb8
    const STONE_MID = 0xb8ae98
    const STONE_DARK = 0x8f8570
    const STONE_DEEP = 0x6f6857
    const GOLD = 0xd9a441
    const GOLD_LIGHT = 0xf0d07a
    const JADE = 0x3f9b86

    const gate = this.add.graphics()

    // 玉瓦檐 + 檐口
    gate.fillStyle(TILE, 1)
    gate.fillRect(24, 0, 84, 9)
    gate.fillStyle(TILE_LIGHT, 1)
    gate.fillRect(24, 0, 84, 3)
    gate.fillStyle(STONE_DARK, 1)
    gate.fillRect(18, 9, 96, 3)

    // 匾：金框 + 玉面（字留白）
    gate.fillStyle(GOLD, 1)
    gate.fillRect(34, 12, 64, 30)
    gate.fillStyle(TILE, 1)
    gate.fillRect(37, 15, 58, 24)
    gate.fillStyle(JADE, 1)
    gate.fillRect(39, 17, 54, 20)
    // 四角金钉
    gate.fillStyle(GOLD_LIGHT, 1)
    ;[
      [41, 19],
      [91, 19],
      [41, 35],
      [91, 35],
    ].forEach(([x, y]) => gate.fillCircle(x, y, 1.6))

    // 横枋
    gate.fillStyle(STONE_DARK, 1)
    gate.fillRect(4, 42, 124, 12)
    gate.fillStyle(STONE, 1)
    gate.fillRect(4, 42, 124, 3)
    gate.fillStyle(STONE_DEEP, 1)
    gate.fillRect(4, 51, 124, 3)

    // 两根石柱：左边一条亮边、右边一条深边，柱子才立得住。
    // 靠镜头这一侧的右柱要**单独出一张贴图**、盖到玩家前面去（用户定的规矩：
    // 牌楼要是能穿过去，右边那根柱子就得压在史莱姆上面），所以这里也画一份 front
    const pillar = (g: Phaser.GameObjects.Graphics, x: number) => {
      g.fillStyle(STONE_MID, 1)
      g.fillRect(x, 54, 16, 54)
      g.fillStyle(STONE, 1)
      g.fillRect(x, 54, 3, 54)
      g.fillStyle(STONE_DEEP, 1)
      g.fillRect(x + 13, 54, 3, 54)
    }

    const base = (g: Phaser.GameObjects.Graphics, x: number) => {
      g.fillStyle(STONE_DARK, 1)
      g.fillRect(x, 104, 28, 14)
      g.fillStyle(STONE, 1)
      g.fillRect(x, 104, 28, 3)
      g.fillStyle(STONE_DEEP, 1)
      g.fillRect(x, 115, 28, 3)
    }

    ;[16, 100].forEach((x) => {
      pillar(gate, x)
    })

    ;[10, 94].forEach((x) => {
      base(gate, x)
    })

    gate.generateTexture('terrace-gate', 132, 118)
    gate.destroy()

    // 只画右柱（连柱础），尺寸和上面那张一样 —— 摆的时候 x/y 用同一个数就自动对齐
    const front = this.add.graphics()

    pillar(front, 100)
    base(front, 94)

    front.generateTexture('terrace-gate-front', 132, 118)
    front.destroy()
  }

  // ── 第八关「请仙典仪」那场戏用的五样东西（2026/10/11）─────────────
  //   风旋 / 云朵 / 从风旋里坠下来的东方龙 / 撞毁的祭坛 / 趴在祭坛上的龙身。
  //   石色跟玉京台一套（0xd3cbb8 / 0xb8ae98 / 0x8f8570 / 0x6f6857）；
  //   帝君是岩属性，龙身取土金 0xb9863f，鬃毛和角取金 0xd9a441
  private makeRiteProps() {
    const STONE = 0xd3cbb8
    const STONE_MID = 0xb8ae98
    const STONE_DARK = 0x8f8570
    const STONE_DEEP = 0x6f6857
    const CRACK = 0x2a2620
    const BODY = 0xb9863f
    const BODY_LIGHT = 0xd8ab68
    const BELLY = 0xe6cfa4
    const MANE = 0xd9a441
    const MANE_LIGHT = 0xf0d07a
    const WHISKER = 0xf2efe4
    const INK = 0x2a1a16

    // ── 画龙的两件工具（③ 和 ⑤ 共用）────────────────────────────
    // 一条过所有控制点的 Catmull-Rom 曲线。自己写、不依赖 Phaser 的 Curves，
    // 省得版本一变又出岔子
    const spline = (raw: number[][]) => {
      const pts = raw.map(([x, y]) => new Phaser.Math.Vector2(x, y))
      const at = (i: number) => pts[Math.max(0, Math.min(pts.length - 1, i))]

      const point = (t: number) => {
        const f = Math.min(0.9999, Math.max(0, t)) * (pts.length - 1)
        const i = Math.floor(f)
        const u = f - i
        const p0 = at(i - 1)
        const p1 = at(i)
        const p2 = at(i + 1)
        const p3 = at(i + 2)
        const u2 = u * u
        const u3 = u2 * u
        const axis = (a: number, b: number, c: number, d: number) =>
          0.5 * (2 * b + (-a + c) * u + (2 * a - 5 * b + 4 * c - d) * u2 + (-a + 3 * b - 3 * c + d) * u3)

        return new Phaser.Math.Vector2(axis(p0.x, p1.x, p2.x, p3.x), axis(p0.y, p1.y, p2.y, p3.y))
      }

      const tangent = (t: number) => {
        const a = point(Math.max(0, t - 0.02))
        const b = point(Math.min(1, t + 0.02))

        return new Phaser.Math.Vector2(b.x - a.x, b.y - a.y).normalize()
      }

      return { point, tangent }
    }

    // 画一颗龙头。整个头都画在**头自己的坐标系**里：a 朝前（鼻子那个方向）、b 朝头顶，
    // fx/fy 和 ux/uy 就是这两个方向的单位向量。眼、眉、角、须、嘴全挂在这套坐标上 ——
    // 所以它们永远跟着头走，不会再各画各的、对不上
    const paintHead = (
      g: Phaser.GameObjects.Graphics,
      cx: number,
      cy: number,
      fx: number,
      fy: number,
      ux: number,
      uy: number,
      shut: boolean
    ) => {
      const P = (a: number, b: number) =>
        new Phaser.Math.Vector2(cx + a * fx + b * ux, cy + a * fy + b * uy)

      // 头坐标系里的一个椭圆 → 画布上的一圈点
      const ring = (a0: number, b0: number, ra: number, rb: number, n = 20) => {
        const list: Phaser.Math.Vector2[] = []

        for (let i = 0; i < n; i++) {
          const t = (i / n) * Math.PI * 2

          list.push(P(a0 + Math.cos(t) * ra, b0 + Math.sin(t) * rb))
        }

        return list
      }

      const stroke = (width: number, color: number, path: Phaser.Math.Vector2[]) => {
        g.lineStyle(width, color, 1)
        g.beginPath()
        g.moveTo(path[0].x, path[0].y)

        for (let i = 1; i < path.length; i++) {
          g.lineTo(path[i].x, path[i].y)
        }

        g.strokePath()
      }

      // 后脑
      g.fillStyle(INK, 1)
      g.fillPoints(ring(-2, 0, 15, 11), true)
      g.fillStyle(BODY, 1)
      g.fillPoints(ring(-2, 0, 13.4, 9.6), true)
      g.fillStyle(BODY_LIGHT, 1)
      g.fillPoints(ring(-4, 2.4, 9.2, 6), true)
      // 吻部：往前伸出去的一节
      g.fillStyle(INK, 1)
      g.fillPoints(ring(11, -1, 10.5, 8), true)
      g.fillStyle(BODY, 1)
      g.fillPoints(ring(11, -1, 9, 6.6), true)
      g.fillStyle(BODY_LIGHT, 1)
      g.fillPoints(ring(12, 1.6, 6.6, 3.6), true)
      // 下颚
      g.fillStyle(INK, 1)
      g.fillPoints(ring(7, -7.6, 10.5, 5), true)
      g.fillStyle(BELLY, 1)
      g.fillPoints(ring(7, -7.2, 9.2, 3.8), true)
      // 嘴缝：从吻尖往后拉到腮
      stroke(2.4, INK, [P(19, -4.4), P(10, -5.4), P(-1, -4.8)])
      // 鼻孔
      const nose = P(17.5, 1.8)

      g.fillStyle(INK, 1)
      g.fillCircle(nose.x, nose.y, 1.7)
      // 眉：压在眼睛正上方的一道深色
      stroke(2.6, INK, [P(4.8, 5.6), P(-4.6, 6.6)])
      // 眼睛：顺着脸斜下来的一颗杏仁
      g.fillStyle(INK, 1)
      g.fillPoints(ring(0.6, 3.2, 5.2, 3.4), true)
      g.fillStyle(shut ? BODY_LIGHT : 0xf7f4ea, 1)
      g.fillPoints(ring(0.6, 3.2, 3.8, 2.2), true)

      if (shut) {
        stroke(1.8, INK, [P(4.2, 3.2), P(0.6, 2.2), P(-3, 3.2)])
      } else {
        const pupil = P(0.6, 3.2)
        const glint = P(2.3, 4.2)

        g.fillStyle(INK, 1)
        g.fillCircle(pupil.x, pupil.y, 1.9)
        g.fillStyle(0xffffff, 1)
        g.fillCircle(glint.x, glint.y, 1)
      }

      // 角：两支金黄的分叉角，从后脑往"头顶偏后"甩
      const horn = (path: number[][], fork: number[], width: number) => {
        const pts = path.map(([a, b]) => P(a, b))

        stroke(width + 3, INK, pts)
        stroke(width, MANE, pts)
        stroke(width - 1.6, MANE_LIGHT, [pts[0], pts[pts.length - 1]])
        stroke(width - 0.4, INK, [P(fork[0], fork[1]), P(fork[2], fork[3])])
        stroke(width - 1.8, MANE_LIGHT, [P(fork[0], fork[1]), P(fork[2], fork[3])])
      }

      horn([[-7, 5.5], [-14, 11], [-21, 18]], [-14, 11, -17, 20], 5)
      horn([[-11, 3.5], [-19, 8], [-27, 13]], [-19, 8, -24, 16], 4.4)

      // 龙须：从吻部后面荡出去、往身后飘的两缕
      const whisker = (a0: number, b0: number, path: number[][], width: number) => {
        const pts = [P(a0, b0), ...path.map(([a, b]) => P(a, b))]

        stroke(width + 1.8, INK, pts)
        stroke(width, WHISKER, pts)
      }

      whisker(19, -7, [[9, -13], [-5, -16], [-19, -13]], 1.6)
      whisker(18, -10, [[7, -16], [-8, -20], [-22, -19]], 1.4)

      // 脖子后面那一圈短鬃
      for (let i = 0; i < 4; i++) {
        const a = -9 - i * 3.4
        const b = 8 - i * 0.6

        g.fillStyle(i % 2 === 0 ? MANE : MANE_LIGHT, 1)
        g.fillPoints([P(a, b), P(a + 3.4, b + 9), P(a - 3, b + 1)], true)
      }
    }

    // 画整条龙：身体、鬃刺、四爪、尾尖全长在同一条脊椎上；头挂在脊椎头端，
    // 朝向由该端的切向自动算出来（鼻子朝着曲线的反方向）
    const paintDragon = (
      g: Phaser.GameObjects.Graphics,
      raw: number[][],
      shut: boolean
    ) => {
      const spine = spline(raw)
      const N = 48
      // 从脖子 10 收细到尾巴 3.5：脖子不能太粗，不然头会被身子吞掉
      const radius = (t: number) => 10 - t * 6.5
      const frame = (t: number) => {
        const p = spine.point(t)
        const tan = spine.tangent(t)

        // 背脊那一侧：切向在屏幕坐标里转 90°（y 轴朝下，所以取 (tan.y, -tan.x)）
        return { p, tan, nx: tan.y, ny: -tan.x }
      }

      // ① 身体：先整条描一圈深色，再压本体色 / 背脊亮色 / 肚皮
      for (let i = 0; i <= N; i++) {
        const { p } = frame(i / N)

        g.fillStyle(INK, 1)
        g.fillCircle(p.x, p.y, radius(i / N) + 1.7)
      }

      for (let i = 0; i <= N; i++) {
        const { p, nx, ny } = frame(i / N)
        const r = radius(i / N)

        g.fillStyle(BODY, 1)
        g.fillCircle(p.x, p.y, r)
        g.fillStyle(BODY_LIGHT, 1)
        g.fillCircle(p.x + nx * r * 0.36, p.y + ny * r * 0.36, r * 0.54)
        g.fillStyle(BELLY, 1)
        g.fillCircle(p.x - nx * r * 0.44, p.y - ny * r * 0.44, r * 0.42)
      }

      // ② 鬃刺（隔三格一根、别太密，否则看着像一圈毛）
      for (let i = 3; i < N - 2; i += 3) {
        const { p, tan, nx, ny } = frame(i / N)
        const r = radius(i / N)
        const bx = p.x + nx * r
        const by = p.y + ny * r

        g.fillStyle(i % 4 === 0 ? MANE_LIGHT : MANE, 1)
        g.fillPoints(
          [
            new Phaser.Math.Vector2(bx - tan.x * 4, by - tan.y * 4),
            new Phaser.Math.Vector2(bx + nx * 9, by + ny * 9),
            new Phaser.Math.Vector2(bx + tan.x * 4, by + tan.y * 4),
          ],
          true
        )
      }

      // ③ 四只爪子：从身子下侧（背的反面）伸出来，每只三根爪。
      //    都放在前中段 —— 再往后就到尾巴了，爪子会从尾巴上长出来
      ;[0.16, 0.34, 0.5, 0.66].forEach((t) => {
        const { p, tan, nx, ny } = frame(t)
        const r = radius(t)
        const rootX = p.x - nx * r * 0.6
        const rootY = p.y - ny * r * 0.6
        const footX = rootX - nx * 10
        const footY = rootY - ny * 10

        g.lineStyle(8, INK, 1)
        g.lineBetween(rootX, rootY, footX, footY)
        g.lineStyle(5.4, BODY, 1)
        g.lineBetween(rootX, rootY, footX, footY)

        for (let k = -1; k <= 1; k++) {
          const clawX = footX - nx * 7 + tan.x * k * 4.6
          const clawY = footY - ny * 7 + tan.y * k * 4.6

          g.lineStyle(4.4, INK, 1)
          g.lineBetween(footX, footY, clawX, clawY)
          g.lineStyle(2.6, MANE_LIGHT, 1)
          g.lineBetween(footX, footY, clawX, clawY)
        }
      })

      // ④ 尾巴尖：两片金羽
      const tail = frame(1)

      g.fillStyle(MANE, 1)
      g.fillPoints(
        [
          new Phaser.Math.Vector2(tail.p.x, tail.p.y),
          new Phaser.Math.Vector2(
            tail.p.x + tail.tan.x * 16 + tail.nx * 10,
            tail.p.y + tail.tan.y * 16 + tail.ny * 10
          ),
          new Phaser.Math.Vector2(
            tail.p.x + tail.tan.x * 18 - tail.nx * 4,
            tail.p.y + tail.tan.y * 18 - tail.ny * 4
          ),
        ],
        true
      )
      g.fillStyle(MANE_LIGHT, 1)
      g.fillPoints(
        [
          new Phaser.Math.Vector2(tail.p.x, tail.p.y),
          new Phaser.Math.Vector2(
            tail.p.x + tail.tan.x * 13 + tail.nx * 4,
            tail.p.y + tail.tan.y * 13 + tail.ny * 4
          ),
          new Phaser.Math.Vector2(
            tail.p.x + tail.tan.x * 14 - tail.nx * 3,
            tail.p.y + tail.tan.y * 14 - tail.ny * 3
          ),
        ],
        true
      )

      // ⑤ 头
      const neck = frame(0)
      const fx = -neck.tan.x
      const fy = -neck.tan.y

      paintHead(g, neck.p.x + fx * 14, neck.p.y + fy * 14, fx, fy, -fy, fx, shut)
    }

    // ① 风旋（128x128）：一条从里到外由细到粗、越转越开的螺旋。
    //    每一段都描两遍 —— 先一道深色（在亮天空上给出轮廓，用户要的"加黑"），
    //    再压一道由浅青到深青的螺旋带；段与段在角度上互相压着，连起来才是一条整螺旋，
    //    不是一圈圈分开的弧（用户要的"精细一点"）
    const vortex = this.add.graphics()
    const TURNS = 44
    const vortexArc = (i: number) => {
      const t = i / (TURNS - 1)

      return { t, r: 6 + t * 46, a0: t * Math.PI * 4.6, width: 8.6 - t * 6 }
    }

    for (let i = 0; i < TURNS; i++) {
      const { r, a0, width } = vortexArc(i)

      vortex.lineStyle(width + 2.4, 0x1d3b4c, 0.5)
      vortex.beginPath()
      vortex.arc(64, 64, r, a0, a0 + Math.PI * 0.62)
      vortex.strokePath()
    }

    for (let i = 0; i < TURNS; i++) {
      const { t, r, a0, width } = vortexArc(i)

      vortex.lineStyle(width, this.mixColor(0xcfeef6, 0x2f6f8f, t), 0.95 - t * 0.2)
      vortex.beginPath()
      vortex.arc(64, 64, r, a0, a0 + Math.PI * 0.62)
      vortex.strokePath()
    }

    // 旋心再点一小团，看着是有东西在里头转
    vortex.fillStyle(0x1d3b4c, 0.75)
    vortex.fillCircle(64, 64, 3.4)
    vortex.fillStyle(0xeaf7ff, 0.9)
    vortex.fillCircle(64, 64, 1.6)

    vortex.generateTexture('wind-vortex', 128, 128)
    vortex.destroy()

    // ② 云朵（140x44）：五团互相压着的软云 —— 底下先铺一层偏灰的阴影面，
    //    上面压云体、再点两处高光。左右拉到 140 宽（用户要的"变宽、重叠"），
    //    摆到场上三朵再互相叠一叠
    const cloud = this.add.graphics()

    // 阴影面（比云体低一点、偏灰蓝）
    cloud.fillStyle(0xc2d2df, 0.92)
    cloud.fillEllipse(34, 32, 60, 20)
    cloud.fillEllipse(72, 30, 76, 24)
    cloud.fillEllipse(108, 33, 56, 18)
    // 云体
    cloud.fillStyle(0xf3f7fb, 0.96)
    cloud.fillEllipse(28, 27, 54, 24)
    cloud.fillEllipse(62, 21, 68, 34)
    cloud.fillEllipse(98, 25, 60, 28)
    cloud.fillEllipse(117, 31, 38, 18)
    // 顶上的高光
    cloud.fillStyle(0xffffff, 0.85)
    cloud.fillEllipse(58, 15, 46, 18)
    cloud.fillEllipse(90, 19, 34, 14)

    cloud.generateTexture('cloud-puff', 140, 44)
    cloud.destroy()

    // ③ 东方龙·坠落那一瞬（180x150）：头在左下、身子拱成一道弧、尾巴甩到右下。
    //    七个控制点就是它的脊椎（横坐标一路向右、不回折，这样身子不会自己压自己）；
    //    眼、眉、角、龙须全挂在头自己的坐标上（paintHead），
    //    身子、鬃刺、四爪、尾羽挂在脊椎上（paintDragon）
    const dive = this.add.graphics()

    paintDragon(
      dive,
      [
        [56, 116],
        [72, 98],
        [94, 84],
        [118, 78],
        [140, 84],
        [154, 98],
        [160, 116],
      ],
      false
    )

    dive.generateTexture('dragon-dive', 180, 150)
    dive.destroy()

    // ④ 撞毁的祭坛（200x64）：台面裂成两半、中间塌下去一块，
    //    右半边断掉的台面斜插在地上，脚边散着碎砖
    const broken = this.add.graphics()

    // 台座（下半截还立着）
    broken.fillStyle(STONE_DEEP, 1)
    broken.fillRect(10, 46, 180, 18)
    broken.fillStyle(STONE_DARK, 1)
    broken.fillRect(14, 22, 172, 26)
    broken.fillStyle(STONE_MID, 1)
    broken.fillRect(18, 26, 164, 18)
    // 塌进去的那一块（黑洞洞的裂口）
    broken.fillStyle(CRACK, 1)
    broken.fillRect(78, 24, 44, 22)
    // 两道裂缝
    broken.fillStyle(CRACK, 1)
    broken.fillRect(64, 26, 3, 16)
    broken.fillRect(132, 30, 3, 14)
    // 台面：左半还压在座上（微微翘起来），右半已经塌到地上
    broken.fillStyle(STONE, 1)
    broken.fillPoints(
      [
        new Phaser.Math.Vector2(0, 8),
        new Phaser.Math.Vector2(76, 12),
        new Phaser.Math.Vector2(74, 26),
        new Phaser.Math.Vector2(0, 22),
      ],
      true
    )
    broken.fillStyle(0xe3dccb, 1)
    broken.fillPoints(
      [
        new Phaser.Math.Vector2(2, 8),
        new Phaser.Math.Vector2(74, 11),
        new Phaser.Math.Vector2(73, 16),
        new Phaser.Math.Vector2(2, 14),
      ],
      true
    )
    // 塌下来的右半台面：斜插在地上
    broken.fillStyle(STONE_MID, 1)
    broken.fillPoints(
      [
        new Phaser.Math.Vector2(124, 20),
        new Phaser.Math.Vector2(188, 14),
        new Phaser.Math.Vector2(192, 32),
        new Phaser.Math.Vector2(128, 32),
      ],
      true
    )
    broken.fillStyle(0xe3dccb, 1)
    broken.fillPoints(
      [
        new Phaser.Math.Vector2(126, 20),
        new Phaser.Math.Vector2(186, 15),
        new Phaser.Math.Vector2(187, 19),
        new Phaser.Math.Vector2(127, 23),
      ],
      true
    )
    // 地上的碎砖
    broken.fillStyle(STONE_DARK, 1)
    broken.fillRect(54, 56, 16, 8)
    broken.fillRect(100, 58, 22, 6)
    broken.fillRect(150, 54, 12, 10)
    broken.fillStyle(STONE, 1)
    broken.fillRect(54, 56, 16, 3)
    broken.fillRect(100, 58, 22, 3)
    broken.fillRect(150, 54, 12, 3)

    broken.generateTexture('terrace-altar-broken', 200, 64)
    broken.destroy()

    // ⑤ 龙身趴在祭坛上（240x140）：身子横搭在坛面上、头从前面垂下来、尾巴拖到右后边。
    //    和坠落那条用的是同一套画法，只是脊椎换成一条更平缓的弧、眼睛闭上
    const wreck = this.add.graphics()

    paintDragon(
      wreck,
      [
        [56, 104],
        [76, 84],
        [102, 72],
        [130, 70],
        [158, 78],
        [186, 94],
        [208, 114],
      ],
      true
    )

    wreck.generateTexture('dragon-wreck', 240, 140)
    wreck.destroy()

    // ⑥ 砸在祭坛上那一圈冲击波（96x96）：一圈金白的光环，越往外越淡
    const ring = this.add.graphics()

    for (let i = 12; i > 0; i--) {
      ring.lineStyle(i * 0.9, 0xfff3d0, 0.05 + (12 - i) * 0.05)
      ring.strokeCircle(48, 48, 40)
    }

    ring.generateTexture('shock-ring', 96, 96)
    ring.destroy()
  }

  // 台面顶面那**一小节**（400x40）：全局规则是「走线＝平台前沿」，玩家永远踩在前沿上，
  // 所以这块地面只从走线往上画 40 像素到背景里（让人看出"这是个有厚度的台子"），
  // 再远处的东西一律当背景景画（近大远小）。越远越淡；石板缝等距、不向远处收
  private makeTerracePaving() {
    // 台面的上底（梯形）现在是 Graphics 现画的（见 GameScene.buildTerracePlaza），
    // 这里只剩"前沿那道翻边"这一张贴图
    const gfx = this.add.graphics()

    gfx.fillStyle(0xe6dfcd, 1)
    gfx.fillRect(0, 0, 400, 3)
    gfx.fillStyle(0xa89f8a, 1)
    gfx.fillRect(0, 3, 400, 4)
    gfx.fillStyle(0x8a8069, 1)
    gfx.fillRect(0, 7, 400, 3)

    gfx.generateTexture('terrace-paving', 400, 10)
    gfx.destroy()
  }

  // 山顶边缘的岩峰（120x170）：两座高低错落的尖峰，底边贴住山顶
  private makeSummitPeak() {
    const LIT = 0x8a7c69
    const MID = 0x73665a
    const DARK = 0x5e5348
    const CRACK = 0x453d34
    const g = this.add.graphics()
    const P = (x: number, y: number) => new Phaser.Math.Vector2(x, y)

    const body: Array<[number, number]> = [
      [4, 170],
      [16, 118],
      [30, 64],
      [44, 26],
      [56, 8],
      [68, 42],
      [82, 88],
      [98, 54],
      [116, 170],
    ]

    g.fillStyle(MID, 1)
    g.fillPoints([...body.map(([x, y]) => P(x, y))], true)

    // 受光面 / 背光面
    g.fillStyle(LIT, 1)
    g.fillPoints([P(56, 8), P(68, 42), P(74, 92), P(58, 126), P(48, 80)], true)
    g.fillStyle(DARK, 1)
    g.fillPoints([P(30, 64), P(44, 26), P(48, 80), P(40, 126), P(24, 132)], true)
    g.fillStyle(LIT, 0.7)
    g.fillPoints([P(98, 54), P(108, 94), P(104, 132), P(90, 110), P(88, 82)], true)

    // 横向层理
    g.lineStyle(1, CRACK, 0.55)
    for (const y of [70, 96, 122, 148]) {
      g.lineBetween(10, y, 112, y)
    }

    // 裂缝
    g.lineStyle(1, CRACK, 0.75)
    g.lineBetween(56, 10, 50, 78)
    g.lineBetween(62, 58, 76, 118)
    g.lineBetween(96, 58, 92, 112)

    // 山脚草和碎石
    g.fillStyle(0x5f8a3a, 1)
    for (let i = 0; i < 8; i++) {
      const x = 8 + i * 14
      g.fillRect(x, 164 - (i % 3) * 2, 2, 5 + (i % 3) * 2)
    }

    g.fillStyle(0x6a5e52, 1)
    g.fillEllipse(22, 164, 12, 6)
    g.fillEllipse(102, 162, 10, 5)

    g.generateTexture('summit-peak', 120, 170)
    g.destroy()
  }

  // 转角平台边缘的大石块（96x70）：一整块，不是碎石堆
  private makeBoulderBig() {
    const LIT = 0x8a7c69
    const MID = 0x73665a
    const DARK = 0x5e5348
    const CRACK = 0x453d34
    const g = this.add.graphics()
    const P = (x: number, y: number) => new Phaser.Math.Vector2(x, y)

    g.fillStyle(MID, 1)
    g.fillPoints(
      [
        P(8, 64),
        P(12, 38),
        P(28, 18),
        P(54, 8),
        P(76, 16),
        P(90, 38),
        P(88, 64),
      ],
      true
    )

    g.fillStyle(LIT, 1)
    g.fillPoints([P(28, 18), P(54, 8), P(64, 20), P(44, 32), P(24, 32)], true)
    g.fillStyle(DARK, 1)
    g.fillPoints([P(8, 64), P(12, 38), P(24, 32), P(40, 52), P(30, 64)], true)
    g.fillStyle(DARK, 0.7)
    g.fillPoints([P(54, 8), P(76, 16), P(90, 38), P(72, 52), P(58, 34)], true)

    g.lineStyle(1, CRACK, 0.7)
    g.lineBetween(40, 18, 34, 44)
    g.lineBetween(34, 44, 46, 60)
    g.lineBetween(66, 24, 70, 50)

    g.fillStyle(0x5f8a3a, 1)
    g.fillRect(18, 60, 2, 6)
    g.fillRect(22, 62, 2, 5)
    g.fillRect(78, 60, 2, 6)

    g.generateTexture('boulder-big', 96, 70)
    g.destroy()
  }

  // 山腰的雾带（1200x56）：中间厚、上下和左右两端渐淡。
  // 先按行铺一条很淡的横带，再用几团更亮的云絮把边缘打碎，
  // 贴到关卡里时整体 alpha 再压一次，只当"空气"，不挡路。
  private makeMountainMist() {
    const W = 1200
    const H = 56
    const g = this.add.graphics()

    for (let y = 0; y < H; y++) {
      const vertical = Math.sin((y / (H - 1)) * Math.PI)

      for (let x = 0; x < W; x += 8) {
        const edge = Math.min(1, x / 90, (W - 1 - x) / 90)
        const wave = 0.82 + 0.18 * Math.sin(x * 0.011 + y * 0.13)

        g.fillStyle(0xdbe6ea, vertical * edge * wave * 0.16)
        g.fillRect(x, y, 8, 1)
      }
    }

    let seed = 17
    const rnd = () => {
      seed = (seed * 1664525 + 1013904223) >>> 0
      return seed / 4294967296
    }

    for (let i = 0; i < 18; i++) {
      g.fillStyle(0xf2f7f9, 0.022 + rnd() * 0.022)
      g.fillEllipse(40 + rnd() * (W - 80), 16 + rnd() * 24, 90 + rnd() * 160, 10 + rnd() * 12)
    }

    g.generateTexture('mountain-mist', W, H)
    g.destroy()
  }

  // 山顶沼泽（1000x180）：**平行六边形**水面，不再是椭圆湖。
  // 上下两条边平行、左右两组斜边也各自平行，读起来像 2.5D 里的一块六边形沼地。
  private makeSummitLake() {
    const W = 1000
    const H = 180
    const g = this.add.graphics()
    const cx = W / 2
    const cy = 92
    const P = (x: number, y: number) => new Phaser.Math.Vector2(x, y)

    // 六个顶点：上下两条水平边，左右各两条平行的斜边
    const hex = (inset: number) => {
      const topHalf = 250 - inset * 1.3
      const midHalf = 470 - inset * 1.8
      const topY = 26 + inset
      const botY = 154 - inset

      return [
        P(cx - topHalf, topY),
        P(cx + topHalf, topY),
        P(cx + midHalf, cy),
        P(cx + topHalf, botY),
        P(cx - topHalf, botY),
        P(cx - midHalf, cy),
      ]
    }
    const shift = (points: Phaser.Math.Vector2[], dx: number, dy: number) =>
      points.map((point) => P(point.x + dx, point.y + dy))

    // 泥岸三层，保持同样的六边形轮廓
    g.fillStyle(0x3f3528, 1)
    g.fillPoints(hex(0), true)
    g.fillStyle(0x5a4a36, 1)
    g.fillPoints(hex(14), true)
    g.fillStyle(0x6b5a3f, 1)
    g.fillPoints(hex(28), true)

    // 浅水池塘：先铺一层看得见的沙底，再压一层半透明的浅青水
    g.fillStyle(0x9a8a6a, 1)
    g.fillPoints(hex(40), true)
    g.fillStyle(0x8a7c5e, 1)
    g.fillPoints(hex(52), true)
    g.fillStyle(0xb5a47a, 0.45)
    g.fillPoints(shift(hex(58), -20, 2), true)
    g.fillStyle(0x7fb9c9, 0.42)
    g.fillPoints(hex(38), true)
    g.fillStyle(0x9fd3df, 0.2)
    g.fillPoints(hex(48), true)

    let seed = 31
    const rnd = () => {
      seed = (seed * 1664525 + 1013904223) >>> 0
      return seed / 4294967296
    }

    // 水底能看见的沙斑和碎石
    for (let i = 0; i < 18; i++) {
      const x = cx - 280 + rnd() * 560
      const y = cy - 28 + rnd() * 56
      const w = 14 + rnd() * 46
      const h = 4 + rnd() * 11

      g.fillStyle(i % 3 === 0 ? 0xb5a47a : i % 3 === 1 ? 0x7d7161 : 0x9a8a6a, 0.35 + rnd() * 0.25)
      g.fillEllipse(x, y, w, h)
    }

    // 浅水上的细小涟漪
    g.lineStyle(1, 0xeaf9fc, 0.32)

    for (let i = 0; i < 14; i++) {
      const x = cx - 260 + rnd() * 520
      const y = cy - 24 + rnd() * 48
      const w = 18 + rnd() * 40

      g.strokeEllipse(x, y, w, 3 + rnd() * 2)
    }

    // 少量浮萍，保持池塘感而不是沼泽
    for (let i = 0; i < 8; i++) {
      const x = cx - 240 + rnd() * 480
      const y = cy - 20 + rnd() * 40
      const size = 5 + rnd() * 6

      g.fillStyle(i % 2 === 0 ? 0x4f8a3a : 0x6f9a4a, 0.9)
      g.fillEllipse(x, y, size, size * 0.58)
      g.fillStyle(0x8fb45e, 0.55)
      g.fillEllipse(x - size * 0.15, y - 1, size * 0.45, size * 0.25)
    }

    // 沿着六条边撒芦苇和碎石，强化"平行六边形"的轮廓
    const outer = hex(2)

    for (let edge = 0; edge < outer.length; edge++) {
      const a = outer[edge]
      const b = outer[(edge + 1) % outer.length]

      for (let t = 0.1; t < 1; t += 0.18) {
        const x = a.x + (b.x - a.x) * t
        const y = a.y + (b.y - a.y) * t
        const h = 7 + ((edge * 7 + Math.round(t * 10)) % 10)

        g.fillStyle(edge % 2 === 0 ? 0x2f5136 : 0x4a6b3e, 0.85)
        g.fillRect(x, y - h, 1, h)
        g.fillStyle(0x8a9a5a, 0.8)
        g.fillRect(x - 1, y - h, 3, 2)

        if ((edge + Math.round(t * 10)) % 3 === 0) {
          const size = 3 + ((edge + Math.round(t * 10)) % 6)

          g.fillStyle(edge % 2 === 0 ? 0x7d7161 : 0x4a4034, 1)
          g.fillEllipse(x + 4, y + 3, size, size * 0.55)
        }
      }
    }

    g.generateTexture('summit-lake', W, H)
    g.destroy()
  }

  // 池塘近岸的窄泥边（800x24）：只围在池塘前缘，别再铺成一整片沼泽，
  // 让山顶 1600~2920 从左到右都仍然是可走的地面。
  private makeSummitMarsh() {
    const W = 800
    const H = 24
    const g = this.add.graphics()
    const P = (x: number, y: number) => new Phaser.Math.Vector2(x, y)
    const top: Array<[number, number]> = []

    for (let x = 0; x <= W; x += 8) {
      top.push([x, 12 + Math.sin(x * 0.023) * 2 + Math.sin(x * 0.071) * 1.2])
    }

    // 湿泥主体
    g.fillStyle(0x4a3e2e, 1)
    g.fillPoints([...top.map(([x, y]) => P(x, y)), P(W, H), P(0, H)], true)

    // 靠上的一层湿泥
    g.fillStyle(0x5a4a36, 1)
    g.fillPoints(
      [
        ...top.map(([x, y]) => P(x, y)),
        ...top.map(([x, y]) => P(x, y + 7)).reverse(),
      ],
      true
    )

    // 苔草边
    g.fillStyle(0x5f7a3a, 1)
    g.fillPoints(
      [
        ...top.map(([x, y]) => P(x, y - 2)),
        ...top.map(([x, y]) => P(x, y + 3)).reverse(),
      ],
      true
    )

    // 池塘水面贴着泥边的一道浅色水线
    g.fillStyle(0x9fd3df, 0.5)
    g.fillPoints(
      [
        ...top.map(([x, y]) => P(x, y - 4)),
        ...top.map(([x, y]) => P(x, y - 2)).reverse(),
      ],
      true
    )

    // 草叶
    for (let x = 6; x < W; x += 13) {
      const y = 12 + Math.sin(x * 0.023) * 2 + Math.sin(x * 0.071) * 1.2
      const h = 4 + (x % 5)

      g.fillStyle(x % 3 === 0 ? 0x7fb04a : 0x5f8a3a, 1)
      g.fillRect(x, y - h - 1, 1, h + 2)
    }

    // 泥里的碎石
    for (let i = 0; i < 12; i++) {
      const x = 20 + ((i * 71) % 760)
      const y = 15 + ((i * 11) % 7)

      g.fillStyle(i % 2 === 0 ? 0x7d7161 : 0x4a4034, 1)
      g.fillEllipse(x, y, 3 + (i % 4), 2 + (i % 2))
    }

    g.generateTexture('pond-edge', W, H)
    g.destroy()
  }

  // 池塘和瀑布的接口（600x24）：一道浅水翻过池沿的白沫，压住瀑布顶端，
  // 让池塘看起来真的是从这里流下去的，而不是瀑布凭空从山下开始。
  private makePondSpill() {
    const W = 600
    const H = 24
    const g = this.add.graphics()

    // 贴地的浅水带
    g.fillStyle(0x9fd3df, 0.55)
    g.fillRect(0, 10, W, 8)
    g.fillStyle(0xd9f3f8, 0.45)
    g.fillRect(0, 8, W, 3)

    // 池沿白沫
    for (let x = 18; x < W; x += 54) {
      g.fillStyle(0xeaf9fc, 0.78)
      g.fillEllipse(x, 13 + (x % 3) * 2, 48, 8)
      g.fillStyle(0xffffff, 0.55)
      g.fillEllipse(x + 12, 10 + (x % 4), 30, 5)
    }

    // 刚翻过池沿的几道短水线
    g.fillStyle(0xffffff, 0.3)

    for (let x = 30; x < W; x += 70) {
      g.fillRect(x, 15, 2, 8)
      g.fillRect(x + 8, 17, 1, 6)
    }

    g.generateTexture('pond-spill', W, H)
    g.destroy()
  }

  // 山顶远景的环形山体（1000x220）：一圈高低错落的山峰围着沼泽，
  // 正中留一个较低的垭口，秘境入口就藏在那个远处的缺口里。
  private makeSummitHighPeak() {
    const W = 1000
    const H = 220
    const g = this.add.graphics()
    const P = (x: number, y: number) => new Phaser.Math.Vector2(x, y)

    // 最远的一圈淡色山脊
    g.fillStyle(0x6f8590, 0.5)
    g.fillPoints(
      [
        P(0, 220),
        P(0, 150),
        P(80, 70),
        P(160, 120),
        P(240, 48),
        P(320, 110),
        P(400, 82),
        P(500, 118),
        P(600, 62),
        P(680, 105),
        P(780, 40),
        P(860, 112),
        P(940, 78),
        P(1000, 145),
        P(1000, 220),
      ],
      true
    )

    // 中景一圈
    g.fillStyle(0x587078, 0.82)
    g.fillPoints(
      [
        P(0, 220),
        P(0, 168),
        P(120, 108),
        P(210, 146),
        P(300, 92),
        P(380, 132),
        P(470, 138),
        P(500, 148),
        P(540, 132),
        P(630, 86),
        P(730, 72),
        P(820, 128),
        P(900, 118),
        P(1000, 172),
        P(1000, 220),
      ],
      true
    )

    // 近处一圈，正中留低垭口
    g.fillStyle(0x40585c, 1)
    g.fillPoints(
      [
        P(0, 220),
        P(0, 174),
        P(90, 132),
        P(170, 158),
        P(260, 118),
        P(340, 154),
        P(420, 142),
        P(500, 162),
        P(580, 136),
        P(660, 112),
        P(740, 134),
        P(820, 104),
        P(910, 152),
        P(1000, 178),
        P(1000, 220),
      ],
      true
    )

    // 两处雪顶，给环形山一点高度层次
    g.fillStyle(0xdfeef2, 0.85)
    g.fillTriangle(214, 64, 240, 48, 266, 66)
    g.fillTriangle(752, 54, 780, 40, 806, 56)

    // 山脚一圈薄雾
    g.fillStyle(0xbfd4d8, 0.16)
    g.fillRect(0, 194, W, 26)

    g.generateTexture('summit-high-peak', W, H)
    g.destroy()
  }

  // 秘境入口（320x340）：一座石山，正中嵌一道黑门洞，门框是石梁 + 金符。
  // 只是画面，不参与交互；白鹤仍是进入秘境的对话入口。
  private makeDomainEntrance() {
    const W = 320
    const H = 340
    const g = this.add.graphics()
    const P = (x: number, y: number) => new Phaser.Math.Vector2(x, y)

    // 石山脚下的接地影
    g.fillStyle(0x2a2118, 0.35)
    g.fillEllipse(160, 334, 270, 14)

    // 不规则石山
    g.fillStyle(0x4f453b, 1)
    g.fillPoints(
      [
        P(4, 340),
        P(0, 260),
        P(24, 176),
        P(58, 100),
        P(104, 52),
        P(156, 30),
        P(212, 58),
        P(260, 112),
        P(300, 200),
        P(318, 340),
      ],
      true
    )

    g.fillStyle(0x73665a, 1)
    g.fillPoints(
      [
        P(24, 340),
        P(22, 258),
        P(46, 178),
        P(82, 118),
        P(128, 72),
        P(166, 54),
        P(160, 340),
      ],
      true
    )

    g.fillStyle(0x5e5348, 1)
    g.fillPoints(
      [
        P(166, 54),
        P(212, 74),
        P(258, 130),
        P(294, 214),
        P(300, 340),
        P(188, 340),
      ],
      true
    )

    // 岩层裂缝
    g.lineStyle(1, 0x3d342a, 0.7)
    g.lineBetween(72, 140, 120, 210)
    g.lineBetween(120, 210, 100, 300)
    g.lineBetween(220, 110, 250, 200)
    g.lineBetween(250, 200, 230, 300)

    // 门洞
    const dx = 160
    const dw = 112
    const dTop = 174
    const dBottom = 330

    // 门框外沿
    g.fillStyle(0x9a8a70, 1)
    g.fillRect(dx - dw / 2 - 16, dTop - 14, dw + 32, 16)
    g.fillRect(dx - dw / 2 - 16, dTop, 14, dBottom - dTop)
    g.fillRect(dx + dw / 2 + 2, dTop, 14, dBottom - dTop)
    g.fillStyle(0x6a5e52, 1)
    g.fillRect(dx - dw / 2 - 10, dTop - 8, dw + 20, 7)

    // 黑门洞：矩形 + 上半圆拱
    g.fillStyle(0x121816, 1)
    g.fillRect(dx - dw / 2, dTop, dw, dBottom - dTop)
    g.fillEllipse(dx, dTop, dw, 52)

    // 门内一点冷光，表现出"里面有路"
    g.fillStyle(0x3f6f6a, 0.22)
    g.fillEllipse(dx, dTop + 24, dw * 0.66, 34)
    g.fillStyle(0x8fd3c8, 0.12)
    g.fillEllipse(dx, dTop + 30, dw * 0.36, 22)

    // 台阶
    g.fillStyle(0x6a5e52, 1)
    g.fillRect(dx - dw / 2 - 24, dBottom, dw + 48, 10)
    g.fillStyle(0x8a7c69, 1)
    g.fillRect(dx - dw / 2 - 18, dBottom - 4, dw + 36, 6)

    // 门框金符
    g.fillStyle(0xffd54f, 0.95)
    g.fillRect(dx - 30, dTop - 6, 8, 2)
    g.fillRect(dx - 20, dTop - 6, 8, 2)
    g.fillRect(dx + 12, dTop - 6, 8, 2)
    g.fillRect(dx + 22, dTop - 6, 8, 2)
    g.fillRect(dx - dw / 2 - 10, dTop + 36, 3, 12)
    g.fillRect(dx + dw / 2 + 7, dTop + 36, 3, 12)

    // 石山上的青苔
    g.fillStyle(0x4f6b3a, 0.9)
    g.fillEllipse(58, 220, 30, 10)
    g.fillEllipse(250, 190, 26, 9)
    g.fillEllipse(120, 110, 20, 7)

    g.generateTexture('domain-entrance', W, H)
    g.destroy()
  }

  // 沼泽里的踏石（60x24）：一块带苔藓的扁石，纯装饰。
  private makeSwampStone() {
    const W = 60
    const H = 24
    const g = this.add.graphics()
    const P = (x: number, y: number) => new Phaser.Math.Vector2(x, y)

    g.fillStyle(0x2a2118, 0.3)
    g.fillEllipse(30, 22, 50, 6)
    g.fillStyle(0x5e5348, 1)
    g.fillPoints([P(4, 20), P(6, 12), P(16, 5), P(32, 3), P(48, 8), P(56, 15), P(54, 21)], true)
    g.fillStyle(0x73665a, 1)
    g.fillPoints([P(8, 17), P(10, 10), P(20, 6), P(34, 5), P(46, 9), P(50, 14), P(46, 18)], true)
    g.fillStyle(0x8a7c69, 1)
    g.fillPoints([P(14, 9), P(32, 6), P(40, 8), P(26, 11)], true)
    g.fillStyle(0x4f6b3a, 1)
    g.fillEllipse(28, 8, 22, 5)
    g.fillStyle(0x6f8a55, 0.8)
    g.fillEllipse(24, 7, 14, 3)
    g.fillStyle(0x453d34, 0.7)
    g.lineBetween(18, 12, 26, 17)
    g.lineBetween(38, 10, 44, 16)

    g.generateTexture('swamp-stone', W, H)
    g.destroy()
  }

  // 瀑布（600x920）：一整幅宽水帘，宽度和 F1 平台一样（600），高度直接画出整段落差。
  // 横向是中间亮、两侧暗的水体渐变，竖向是长短交错的亮纹，底部只留一条白沫。
  private makeWaterfall() {
    const W = 600
    const H = 920
    const g = this.add.graphics()

    // 水体：横向渐变，中间最亮、两侧压暗，像一整幅水帘
    for (let x = 0; x < W; x += 4) {
      const d = Math.abs(x + 2 - W / 2) / (W / 2)
      const color = this.mixColor(0x5f98af, 0xb8e4ec, 1 - d * 0.88)

      g.fillStyle(color, 0.92)
      g.fillRect(x, 0, 4, H - 24)
    }

    // 两侧的暗边，给水帘一点厚度
    g.fillStyle(0x2f5666, 0.35)
    g.fillRect(0, 0, 10, H - 24)
    g.fillRect(W - 10, 0, 10, H - 24)

    // 竖直亮纹：长短交错，铺满整个宽度
    for (let i = 0; i < 70; i++) {
      const x = 8 + ((i * 53) % (W - 16))
      const y = (i * 97) % (H - 160)
      const h = 80 + ((i * 131) % 340)

      g.fillStyle(0xffffff, 0.08 + (i % 4) * 0.04)
      g.fillRect(x, y, 2 + (i % 3 === 0 ? 1 : 0), h)
    }

    // 顶部薄薄一层亮水
    g.fillStyle(0xd9f3f8, 0.55)
    g.fillRect(8, 0, W - 16, 3)

    // 底部白沫：只留窄窄一条落地水花
    g.fillStyle(0xcfeef5, 0.35)
    g.fillRect(6, H - 24, W - 12, 20)
    g.fillStyle(0xeaf9fc, 0.8)

    for (let x = 20; x < W; x += 70) {
      g.fillEllipse(x, H - 12, 60, 14)
    }

    g.fillStyle(0xffffff, 0.55)

    for (let x = 45; x < W; x += 90) {
      g.fillEllipse(x, H - 8, 40, 10)
    }

    g.generateTexture('waterfall', W, H)
    g.destroy()
  }

  // 脚下的接地影：一个软椭圆。2D 里玩家只站在一条线上，
  // 有了它"我现在落在这条线的哪一段"一眼就看得出来（跳起来会变小变淡）
  private makeSlimeShadow() {
    const gfx = this.add.graphics()

    gfx.fillStyle(0x1a140f, 0.16)
    gfx.fillEllipse(20, 7, 40, 14)
    gfx.fillStyle(0x1a140f, 0.2)
    gfx.fillEllipse(20, 7, 32, 11)
    gfx.fillStyle(0x1a140f, 0.24)
    gfx.fillEllipse(20, 7, 22, 8)

    gfx.generateTexture('slime-shadow', 40, 14)
    gfx.destroy()
  }

  private makeBackgrounds() {
    this.makeBeachBackground()
    this.makeFieldBackground()
    this.makeChurchBackground()
    this.makeSkyBackground()
    this.makeTowerBackground()
    this.makeLiyueBackground()
    this.makeHarborLandBackground()
    this.makeMountainFoothill()
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
  // 璃月系背景：liyue（黄昏水乡）、harbor（港口）、mountain（白天高山）三套都在这里生成
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

    mid.generateTexture('bg-liyue-mid', 480, 270)
    mid.destroy()

    // 堤岸 + 芦苇单独一层（近景）：这层视差最大，爬高时会最先退出画面 ——
    // 天空/远山几乎不动、湖面很慢、岸边的芦苇最快，"高处还能看见芦苇"就是这层没分开造成的
    const near = this.add.graphics()

    this.drawRidge(near, 480, 270, 0x6b5a44, [3, 7], 6, 215)
    this.drawRidge(near, 480, 270, 0x50442f, [4, 9], 4, 232)

    for (let index = 0; index < 26; index++) {
      const x = 8 + index * 19 + ((index * 7) % 5)
      const height = 26 + ((index * 11) % 16)
      const y = 215 - height

      near.fillStyle(0x6f6a3c, 1)
      near.fillRect(x, y, 1, height)

      // 穗子
      near.fillStyle(0x9a945a, 1)
      near.fillRect(x - 1, y - 3, 2, 4)
    }

    near.generateTexture('bg-liyue-near', 480, 270)
    near.destroy()

    // ── 高山（第九关用）三层：白天天空 + 远山、山腰云海 + 中景山脊、近景深色山脊 ──
    // 纵向视差仍走 tallOutdoor：远层几乎不动、中层慢、近层爬高时退出画面。
    // 云海放在中层，所以玩家爬到山顶时它会沉到画面下方。
    const mountainFar = this.add.graphics()

    this.paintGradient(mountainFar, 480, 270, 0x5e9fc9, 0xeaf4f6)

    // 白天的日晕和高空薄云
    mountainFar.fillStyle(0xfff3d6, 0.32)
    mountainFar.fillEllipse(356, 92, 150, 70)
    mountainFar.fillStyle(0xfffbf0, 0.3)
    mountainFar.fillEllipse(356, 92, 86, 42)
    mountainFar.fillStyle(0xffffff, 0.2)
    mountainFar.fillEllipse(110, 38, 130, 18)
    mountainFar.fillEllipse(300, 24, 100, 14)
    mountainFar.fillEllipse(60, 64, 84, 12)

    // 远山两层：越高越淡、越偏蓝
    this.drawRidge(mountainFar, 480, 270, 0x9bb8c9, [1, 3], 28, 170, 0.9)
    this.drawRidge(mountainFar, 480, 270, 0x7c9fb4, [2, 5], 20, 200, 0.95)

    // 高空的几只鸟
    mountainFar.lineStyle(1, 0x4b6475, 0.55)

    for (const [bx, by] of [
      [64, 86],
      [84, 78],
      [330, 62],
      [344, 68],
    ]) {
      mountainFar.lineBetween(bx - 4, by, bx, by - 3)
      mountainFar.lineBetween(bx, by - 3, bx + 4, by)
    }

    mountainFar.generateTexture('bg-mountain-far', 480, 270)
    mountainFar.destroy()

    const mountainMid = this.add.graphics()

    // 山腰云海：先铺一层软云，再用山脊压住下半截
    for (let i = 0; i < 9; i++) {
      const x = -10 + i * 58
      const y = 166 + (i % 3) * 7

      mountainMid.fillStyle(0xf7fcfe, 0.2)
      mountainMid.fillEllipse(x, y, 130, 26)
      mountainMid.fillStyle(0xdceef6, 0.22)
      mountainMid.fillEllipse(x + 18, y + 7, 110, 20)
    }

    // 中景山脊：三层，颜色逐层压深
    this.drawRidge(mountainMid, 480, 270, 0x5e8087, [1, 4], 24, 196)
    this.drawRidge(mountainMid, 480, 270, 0x466b72, [2, 5], 18, 220)
    this.drawRidge(mountainMid, 480, 270, 0x35575d, [3, 7], 12, 242)

    // 山脊上几棵松树剪影，给远景一个尺度
    const pine = (x: number, baseY: number, height: number) => {
      mountainMid.fillStyle(0x2f4a48, 1)
      mountainMid.fillRect(x, baseY - height, 2, height)
      mountainMid.fillTriangle(x - 8, baseY - height + 6, x + 10, baseY - height + 6, x + 1, baseY - height - 6)
      mountainMid.fillTriangle(x - 6, baseY - height + 14, x + 8, baseY - height + 14, x + 1, baseY - height + 2)
    }

    pine(58, 206, 26)
    pine(168, 226, 22)
    pine(302, 212, 30)
    pine(414, 236, 20)

    mountainMid.generateTexture('bg-mountain-mid', 480, 270)
    mountainMid.destroy()

    const mountainNear = this.add.graphics()

    // 近景：一条更深的谷底山脊，爬高后最先退出画面
    this.drawRidge(mountainNear, 480, 270, 0x2d4844, [2, 6], 16, 232)
    this.drawRidge(mountainNear, 480, 270, 0x213936, [3, 8], 9, 252)

    // 脊线上的短草和碎石
    for (let i = 0; i < 22; i++) {
      const x = 6 + i * 22 + ((i * 7) % 5)
      const y = 232 + ((i * 11) % 14)

      mountainNear.fillStyle(0x1b302e, 1)
      mountainNear.fillRect(x, y - 6, 1, 6)
      mountainNear.fillRect(x + 3, y - 4, 1, 4)
    }

    mountainNear.generateTexture('bg-mountain-near', 480, 270)
    mountainNear.destroy()

    // ── 港口（第八关用）三层：**从镜头往外是「护栏 → 岸边 → 房子 → 高山 → 天空」**（用户定的）──
    // 远（-30）：**白天**的天空 + 白云 + 高山（两层剪影，越高越淡）
    const harborFar = this.add.graphics()

    for (let y = 0; y < 200; y++) {
      const t = y / 200
      const color = this.mixColor(0x5aabe4, 0xcfe9f7, t)

      harborFar.fillStyle(color, 1)
      harborFar.fillRect(0, y, 480, 1)
    }

    // 白天的太阳（偏高处，周围一点白光）
    harborFar.fillStyle(0xfff8e0, 0.95)
    harborFar.fillEllipse(400, 40, 34, 34)
    harborFar.fillStyle(0xfffdf0, 0.3)
    harborFar.fillEllipse(400, 40, 62, 62)
    // 白云：几团叠着的椭圆
    const cloud = (x: number, y: number, scale: number) => {
      harborFar.fillStyle(0xffffff, 0.85)
      harborFar.fillEllipse(x, y, 46 * scale, 16 * scale)
      harborFar.fillEllipse(x - 18 * scale, y + 4 * scale, 30 * scale, 12 * scale)
      harborFar.fillEllipse(x + 20 * scale, y + 3 * scale, 34 * scale, 13 * scale)
      harborFar.fillEllipse(x + 4 * scale, y - 7 * scale, 26 * scale, 12 * scale)
    }

    cloud(70, 46, 1)
    cloud(210, 30, 0.8)
    cloud(330, 64, 0.9)
    cloud(140, 84, 0.6)
    // 远山：**每次进关卡随机生成**两种高度的山峰（用户要求：远山和天空不打包、随机生成山峰即可），
    // 每段的峰高和起伏都带随机，所以每局看着都不一样
    const ridgeSeed = Math.floor(Math.random() * 1000)

    this.drawRidge(harborFar, 480, 270, 0x8fa8bd, [2 + (ridgeSeed % 3), 5], 46 + (ridgeSeed % 14), 172, 0.95)
    this.drawRidge(
      harborFar,
      480,
      270,
      0x65808f,
      [1 + ((ridgeSeed >> 3) % 3), 4],
      58 + ((ridgeSeed >> 2) % 18),
      190
    )

    harborFar.generateTexture('bg-harbor-far', 480, 270)
    harborFar.destroy()

    // 中层和近层都不画水、不画对岸的房子 —— 用户定的：**背景里只有建筑物 → 高山 → 天空**，
    // 水和护栏一样都属于**前景**：
    //   建筑物 = 关卡里用 harbor-house-a/b/c/d 那几张（我前面设计的那四栋）摆出来的远岸城市
    //   水 = 下面这张可平铺的前景水面
    //   护栏 = 前景最前面那一道（harbor-railing）
    // 所以这里只留下 bg-harbor-far 一张，bg-harbor-mid / bg-harbor-near 都不生成了
    //（引擎那边对不存在的近景贴图会自己跳过，不用改）

    // 前景的水：可平铺（96 宽一段），水线在贴图顶边，往下越来越深
    const water = this.add.graphics()

    water.fillStyle(0x4a86b4, 1)
    water.fillRect(0, 0, 96, 60)

    for (let y = 0; y < 60; y++) {
      const t = y / 60

      water.fillStyle(this.mixColor(0x6fa8cf, 0x2f5f86, t), 0.5)
      water.fillRect(0, y, 96, 1)
    }

    water.fillStyle(0xdff2ff, 0.55)
    water.fillRect(0, 0, 96, 2)
    // 波纹（密一点，铺开就是一片亮闪闪的水面）
    for (let index = 0; index < 7; index++) {
      const x = (index * 29) % 80
      const width = 14 + (index % 3) * 8

      water.fillStyle(0xdff2ff, 0.35)
      water.fillRect(x, 8 + index * 7, width, 2)
    }

    water.generateTexture('harbor-water', 96, 60)
    water.destroy()

    // 远岸城市脚下那条"地"，可平铺（48 宽一段）：让房子贴着它站，不至于飘在空中
    const cityBase = this.add.graphics()

    cityBase.fillStyle(0x6f7d8c, 1)
    cityBase.fillRect(0, 0, 48, 16)
    cityBase.fillStyle(0x8a97a3, 1)
    cityBase.fillRect(0, 0, 48, 3)
    cityBase.fillStyle(0x5a6673, 1)
    cityBase.fillRect(0, 12, 48, 4)
    // 岸上零星的矮墙 / 石阶
    cityBase.fillStyle(0x7b8794, 1)
    cityBase.fillRect(6, 4, 10, 6)
    cityBase.fillRect(30, 6, 12, 4)

    cityBase.generateTexture('harbor-city-base', 48, 16)
    cityBase.destroy()

    // 前景的护栏（可平铺，48 宽一段：一根立柱 + 上下两道横杆）。
    // 高度 24 —— 比史莱姆矮（史莱姆 26 高），不会把史莱姆整个盖住；
    // 颜色比背景亮、还加了深色描边，和远处的建筑区分开
    const railing = this.add.graphics()

    railing.fillStyle(0xc9b083, 1)
    railing.fillRect(0, 2, 48, 6)
    railing.fillRect(0, 14, 48, 5)
    railing.fillStyle(0x6b543a, 1)
    railing.fillRect(0, 0, 48, 2)
    railing.fillRect(0, 8, 48, 2)
    railing.fillRect(0, 12, 48, 2)
    railing.fillRect(0, 19, 48, 2)
    railing.fillStyle(0xe0c795, 1)
    railing.fillRect(20, 2, 7, 22)
    railing.fillStyle(0x6b543a, 1)
    railing.fillRect(19, 0, 2, 24)
    railing.fillRect(27, 0, 2, 24)
    railing.fillRect(19, 22, 10, 2)

    railing.generateTexture('harbor-railing', 48, 24)
    railing.destroy()
  }

  // 望舒客栈：一根很高的岩柱，顶上压着一栋木楼，檐下挂着灯笼。
  // 画在背景层里当路标，不参与碰撞
  // 第十关：璃月港陆地背景。没有水面，只有黄昏天空、远山、层层屋顶和近景屋檐。
  private makeHarborLandBackground() {
    const P = (x: number, y: number) => new Phaser.Math.Vector2(x, y)

    // ── 远景：黄昏天空 + 远山 + 城市屋脊 ──
    const far = this.add.graphics()
    this.paintGradient(far, 480, 270, 0x2f4a6a, 0xe8b07a)

    far.fillStyle(0xffe0b0, 0.26)
    far.fillEllipse(356, 108, 160, 74)
    far.fillStyle(0xfff2d8, 0.3)
    far.fillEllipse(356, 108, 86, 36)
    far.fillStyle(0xffffff, 0.16)
    far.fillEllipse(110, 54, 150, 18)
    far.fillEllipse(300, 36, 110, 13)

    this.drawRidge(far, 480, 270, 0x5a7188, [1, 3], 18, 172, 0.82)
    this.drawRidge(far, 480, 270, 0x41576c, [2, 5], 12, 198)

    const farRoof = (x: number, w: number, base: number, color: number) => {
      far.fillStyle(color, 1)
      far.fillPoints(
        [P(x, base), P(x + 7, base - 22), P(x + w - 7, base - 22), P(x + w, base)],
        true
      )
      far.fillTriangle(x, base, x - 7, base - 7, x + 10, base - 4)
      far.fillTriangle(x + w, base, x + w + 7, base - 7, x + w - 10, base - 4)
    }

    ;[
      [10, 74, 214],
      [80, 66, 222],
      [142, 88, 208],
      [228, 70, 220],
      [300, 84, 210],
      [382, 62, 224],
      [440, 50, 216],
    ].forEach(([x, w, base], index) => {
      farRoof(x, w, base, index % 2 === 0 ? 0x33484f : 0x3b5156)
    })

    // 远处两座塔
    far.fillStyle(0x2d4148, 1)
    far.fillRect(196, 150, 20, 70)
    far.fillTriangle(206, 128, 190, 152, 222, 152)
    far.fillRect(330, 160, 16, 58)
    far.fillTriangle(338, 142, 326, 162, 350, 162)

    far.generateTexture('bg-harbor-land-far', 480, 270)
    far.destroy()

    // ── 中景：层层叠叠的璃月屋顶、客栈和灯笼 ──
    const mid = this.add.graphics()
    const roof = (x: number, w: number, base: number, h: number, color: number, light: number) => {
      mid.fillStyle(color, 1)
      mid.fillPoints(
        [P(x, base), P(x + 10, base - h), P(x + w - 10, base - h), P(x + w, base)],
        true
      )
      mid.fillTriangle(x, base, x - 9, base - 8, x + 12, base - 4)
      mid.fillTriangle(x + w, base, x + w + 9, base - 8, x + w - 12, base - 4)
      mid.fillStyle(light, 0.8)
      mid.fillRect(Math.round(x + 12), base - h + 2, Math.max(1, w - 24), 2)
      mid.lineStyle(1, 0x223033, 0.55)
      for (let tx = x + 18; tx < x + w - 14; tx += 15) {
        mid.lineBetween(tx, base - h + 4, tx - 4, base - 3)
      }
    }

    // 底部一层屋顶
    roof(-30, 210, 250, 34, 0x314447, 0x446066)
    roof(155, 190, 242, 30, 0x2a3d42, 0x3b5156)
    roof(320, 190, 252, 34, 0x314447, 0x446066)

    // 后排楼体
    mid.fillStyle(0xb8a88a, 1)
    mid.fillRect(24, 202, 112, 48)
    mid.fillRect(190, 192, 110, 50)
    mid.fillRect(346, 206, 100, 46)
    mid.fillStyle(0x8a7350, 1)
    mid.fillRect(24, 202, 112, 4)
    mid.fillRect(190, 192, 110, 4)
    mid.fillRect(346, 206, 100, 4)

    // 暖窗和灯笼
    for (let i = 0; i < 12; i++) {
      const x = 18 + i * 38 + (i % 3) * 6
      const y = 214 + (i % 2) * 12

      mid.fillStyle(0xffd54f, 0.55)
      mid.fillRect(x, y, 5, 6)
    }

    for (let i = 0; i < 9; i++) {
      const x = 22 + i * 52
      const y = 206 + (i % 2) * 16

      mid.fillStyle(0xb03a2e, 1)
      mid.fillEllipse(x, y, 5, 7)
      mid.fillStyle(0xffb070, 0.7)
      mid.fillEllipse(x, y - 1, 3, 4)
    }

    // 左边一座高塔
    mid.fillStyle(0x2a3d42, 1)
    mid.fillRect(74, 138, 34, 112)
    for (let tier = 0; tier < 3; tier++) {
      roof(62 - tier * 3, 56 + tier * 6, 168 - tier * 28, 18, 0x314447, 0x446066)
    }
    mid.fillStyle(0xb8a88a, 1)
    mid.fillRect(80, 150, 22, 96)
    mid.fillStyle(0xffd54f, 0.55)
    mid.fillRect(87, 166, 6, 8)
    mid.fillRect(87, 190, 6, 8)

    mid.generateTexture('bg-harbor-land-mid', 480, 270)
    mid.destroy()

    // ── 近景：镜头最前面的屋檐剪影和灯笼 ──
    const near = this.add.graphics()
    const eave = (x: number, w: number, base: number, color: number) => {
      near.fillStyle(color, 1)
      near.fillPoints(
        [P(x, base), P(x + 14, base - 24), P(x + w - 14, base - 24), P(x + w, base)],
        true
      )
      near.fillTriangle(x, base, x - 12, base - 8, x + 16, base - 2)
      near.fillTriangle(x + w, base, x + w + 12, base - 8, x + w - 16, base - 2)
      near.fillStyle(0x162326, 0.8)
      near.fillRect(x + 8, base, w - 16, 24)
    }

    eave(-40, 210, 246, 0x1b2b2f)
    eave(150, 200, 254, 0x22353a)
    eave(330, 200, 248, 0x1b2b2f)

    for (let i = 0; i < 5; i++) {
      const x = 30 + i * 100
      const y = 240 - (i % 2) * 10

      near.fillStyle(0xb03a2e, 1)
      near.fillEllipse(x, y, 6, 8)
      near.fillStyle(0xffb070, 0.75)
      near.fillEllipse(x, y - 1, 3, 4)
      near.fillStyle(0x2a2118, 1)
      near.fillRect(x, y - 8, 1, 5)
    }

    near.generateTexture('bg-harbor-land-near', 480, 270)
    near.destroy()
  }

  // 第九关山脚左侧的背景小山（1200x200）：从左边地面起坡，落到 x=800 的山脚，
  // 再沿着 R1 背后微微抬起，最后藏进大山里。它替换掉原来的方形山肩填色，
  // 让出生点后面那道“岩墙”真正连到右边的大山。
  private makeMountainFoothill() {
    const g = this.add.graphics()
    const P = (x: number, y: number) => new Phaser.Math.Vector2(x, y)
    const top: Array<[number, number]> = [
      [0, 200],
      [40, 190],
      [100, 175],
      [160, 155],
      [220, 130],
      [280, 105],
      [330, 85],
      [380, 75],
      [430, 85],
      [500, 115],
      [570, 145],
      [640, 165],
      [720, 180],
      [800, 190],
      [900, 170],
      [1000, 150],
      [1100, 135],
      [1200, 130],
    ]

    // 主体：从山脊线一路填到地面，下面会被地面/坡体盖住
    g.fillStyle(0x3f5a55, 1)
    g.fillPoints(
      [...top.map(([x, y]) => P(x, y)), P(1200, 200), P(0, 200)],
      true
    )

    // 山脊顶部受光的一条窄边
    const rim = [
      ...top.map(([x, y]) => P(x, y)),
      ...[...top].reverse().map(([x, y]) => P(x, y + 3)),
    ]
    g.fillStyle(0x5c7870, 0.85)
    g.fillPoints(rim, true)

    // 左坡的暗面和两块岩壁
    g.fillStyle(0x354a47, 0.75)
    g.fillPoints(
      [P(220, 130), P(330, 85), P(380, 75), P(430, 120), P(360, 150), P(280, 165)],
      true
    )
    g.fillStyle(0x4a6660, 0.6)
    g.fillPoints([P(100, 175), P(220, 130), P(280, 165), P(180, 195)], true)

    g.lineStyle(1, 0x2c403d, 0.5)
    g.lineBetween(260, 120, 300, 170)
    g.lineBetween(340, 100, 380, 155)
    g.lineBetween(430, 95, 470, 155)

    // 山脊上几棵松树，给背景小山一个尺度
    const pine = (x: number, baseY: number, height: number) => {
      g.fillStyle(0x2f4a48, 1)
      g.fillRect(x, baseY - height, 2, height)
      g.fillTriangle(x - 7, baseY - height + 6, x + 9, baseY - height + 6, x + 1, baseY - height - 5)
      g.fillTriangle(x - 5, baseY - height + 13, x + 7, baseY - height + 13, x + 1, baseY - height + 2)
    }

    pine(230, 128, 22)
    pine(320, 96, 26)
    pine(540, 140, 18)
    pine(980, 155, 16)

    g.generateTexture('bg-foothill', 1200, 200)
    g.destroy()
  }

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
