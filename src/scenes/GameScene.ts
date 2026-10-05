import Phaser from 'phaser'
import { ELEMENTS, ELEMENT_ORDER, type ElementKey } from '../data/elements'
import {
  LEVELS,
  THEME_COLORS,
  type LevelDef,
  type DomeDef,
  type PlatformDef,
} from '../data/levels'
import {
  progress,
  unlockElement,
  cycleElement,
  recordClear,
  saveProgress,
  hasSeenHint,
  markHintSeen,
} from '../state/progress'
import { playMusic, playSfx, setLoop, stopAllLoops } from '../state/audio'
import { queueAchievementToast } from '../state/achievements'
import { touchMode, touchText } from '../state/touch'

const HOVER = {
  riseSpeed: 70,
  fallSpeed: 35,
  drainPerSecond: 30,
  regenPerSecond: 80,
}

const STAMINA_MAX = 100

// 技能持续时间（秒）
const ARMOR_TIME = 10
const PILLAR_TIME = 30

// 岩化的冷却：技能结束后要等这么久才能再按 X（时间到、被打碎、换元素都算结束）
const ARMOR_COOLDOWN = 8

// 造像往下压多少像素：压在底座顶面上，
// 看起来是"下面的圆台把上面的造像托住"，而不是造像悬在半空
const STATUE_SEAT = 5

// 岩化时的跳跃加成：速度 ×1.12，实际跳高从 48 涨到约 60 像素
const ARMOR_JUMP = 1.12

// 压力板：压到底要多久（秒），以及压下去多深（像素）
const PLATE_PRESS_TIME = 0.45
const PLATE_SINK = 3

// 岩柱：贴图多大、从落点上方多高开始掉、蓄力多久、落点最远能低于脚底多少
const PILLAR_SIZE = { width: 20, height: 72 }
const PILLAR_DROP = 140
const PILLAR_REACH = 170
// 按住多久算「长按」（秒）：短按直接放，长按进预览、再点一次 C 才落柱
const PILLAR_HOLD = 0.22
// 依次尝试的生成距离：前面放不下就往人身边挪
const PILLAR_OFFSETS = [30, 22, 14, 6, 0]

type PillarTarget = {
  x: number
  landTop: number
  spawnBottom: number
  valid: boolean
}

// 岩化时本体放大的倍数。放大后同样的 sy 会摆出更大的位移，所以走动形变的幅度
// 要按这个倍数收回来，岩化态和普通态的晃动幅度、节奏才是一样的
const ARMOR_GROW = 1.15

const HAZARD = {
  width: 24,
  gapHeight: 70,
}

const CHASE = {
  speed: 60,
  triggerX: 560,
  stopX: 1450,
}

type MonumentRef = {
  pillar: Phaser.Physics.Arcade.Sprite
  head: Phaser.GameObjects.Image
  icon: Phaser.GameObjects.Image
  element: ElementKey
  id: string
  after?: string
  lit: boolean
  hidden: boolean
  neighbors: string[]
  aura: Phaser.GameObjects.Image[]
}

type DoorRef = {
  sprite: Phaser.Physics.Arcade.Sprite
  needs: string[]
  ordered: boolean
  progress: string[]
  opened: boolean
}

type NoteRef = {
  sprite: Phaser.GameObjects.Image
  prompt: string
  text: string
}

type PlateRef = {
  sprite: Phaser.Physics.Arcade.Sprite
  id: string
  baseY: number
  press: number       // 0 = 完全抬起，1 = 压到底
  pressed: boolean
}

type LauncherRef = {
  sprite: Phaser.GameObjects.Image
  dir: 'down' | 'left' | 'right'
  interval: number
  speed: number
  timer: number
}

export class GameScene extends Phaser.Scene {
  private level!: LevelDef
  private slime!: Phaser.Physics.Arcade.Sprite
  private platforms!: Phaser.Physics.Arcade.StaticGroup
  private orbs!: Phaser.Physics.Arcade.StaticGroup

  private gems!: Phaser.Physics.Arcade.StaticGroup
  private gemIcons: Phaser.GameObjects.Image[] = []
  private collectedIndices: number[] = []

  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys
  private restartKey!: Phaser.Input.Keyboard.Key
  private prevKey!: Phaser.Input.Keyboard.Key
  private nextKey!: Phaser.Input.Keyboard.Key
  private staminaBar!: Phaser.GameObjects.Rectangle
  private elementIcons: Phaser.GameObjects.Image[] = []
  private elementMarks: Phaser.GameObjects.Rectangle[] = []
  private elementHint!: Phaser.GameObjects.Text
  private armorBarBack!: Phaser.GameObjects.Rectangle
  private armorBar!: Phaser.GameObjects.Rectangle

  private slimeArt!: Phaser.GameObjects.Image
  private eyes: Phaser.GameObjects.Image[] = []
  private blinkTimer = 0
  private blinkScale = 1
  private landSquash = 0
  private stepTimer = 0
  private wasOnGround = false

  private element: ElementKey = 'none'
  private jumpPower = -260
  private stamina = STAMINA_MAX

  private bgFar!: Phaser.GameObjects.TileSprite
  private bgMid!: Phaser.GameObjects.TileSprite
  private bgFarY = 0.2
  private bgMidY = 0.45
  private windmillBlades: Phaser.GameObjects.Image | null = null

  private blessings!: Phaser.Physics.Arcade.StaticGroup
  private staminaGlowOuter!: Phaser.GameObjects.Rectangle
  private staminaGlow!: Phaser.GameObjects.Rectangle
  private blessed = false

  private finished = false

  private hazards!: Phaser.Physics.Arcade.StaticGroup
  private dying = false
  private armored = false
  private armoredTimer = 0
  private armorCooldown = 0
  private invulnTimer = 0
  private rockPillar: Phaser.Physics.Arcade.Sprite | null = null
  private pillarGhost: Phaser.GameObjects.Image | null = null
  private pillarMark: Phaser.GameObjects.Rectangle | null = null
  private pillarCharging = false
  private pillarPressed = false
  private pillarHold = 0
  private armorKey!: Phaser.Input.Keyboard.Key
  private rockKey!: Phaser.Input.Keyboard.Key

  private introShowing = false
  private introLayer: Phaser.GameObjects.Container | null = null

  private chase!: Phaser.Physics.Arcade.Image
  private chased = false

  private interactKey!: Phaser.Input.Keyboard.Key
  private goalSprite!: Phaser.Physics.Arcade.Sprite
  private statueSprite: Phaser.GameObjects.Image | null = null
  private statueUsed = false
  private lockedElement: ElementKey | null = null
  // 神像演出期间把操作全锁住：移动、跳跃、技能、交互
  private inputLocked = false

  // 触屏按键的状态（和键盘是两套，最后在 update 里合并；Just 结尾的是本帧刚按下/刚抬起）
  private touchMode = false
  private touchLeft = false
  private touchRight = false
  private touchJump = false
  private touchJumpJust = false
  private touchArmorJust = false
  private touchPillarJust = false
  private touchPillarUp = false
  // 触屏按键的引用：跟着「有没有岩元素」显示/隐藏，并随岩化冷却做回充
  private rockAvailable = false
  private touchButtons: Array<{
    image: Phaser.GameObjects.Image
    x: number
    y: number
    r: number
    base: number
  }> = []
  private touchPillarButton: Phaser.GameObjects.Image | null = null
  private touchArmorDim: Phaser.GameObjects.Image | null = null
  private touchArmorFill: Phaser.GameObjects.Image | null = null
  private promptBox!: Phaser.GameObjects.Rectangle
  private promptText!: Phaser.GameObjects.Text
  private promptAction: (() => void) | null = null

  private monuments!: Phaser.Physics.Arcade.StaticGroup
  private monumentList: MonumentRef[] = []

  private gates!: Phaser.Physics.Arcade.StaticGroup
  private doorList: DoorRef[] = []
  private plates!: Phaser.Physics.Arcade.StaticGroup
  private plateList: PlateRef[] = []
  private spikes!: Phaser.Physics.Arcade.Group
  private launchers: LauncherRef[] = []
  private noteList: NoteRef[] = []
  private paperShowing = false
  private paperLayer: Phaser.GameObjects.Container | null = null
  
  private cageSprite: Phaser.GameObjects.Image | null = null
  private eggSprite: Phaser.GameObjects.Image | null = null
  private dragonling: Phaser.GameObjects.Image | null = null
  private cageScene = false
  private cageOpened = false
  private goalReady = true

  private wingLeft!: Phaser.GameObjects.Image
  private rockCrown!: Phaser.GameObjects.Image
  private armorPlate!: Phaser.GameObjects.Image
  private wingRight!: Phaser.GameObjects.Image
  private wingOffset = 0

  private windTrails: Phaser.GameObjects.Image[] = []
  private trailFade = 0

  constructor() {
    super('game')
  }

  create() {
    this.level = LEVELS[progress.levelIndex]

    this.touchMode = touchMode()
    this.finished = false
    this.stamina = STAMINA_MAX
    this.blinkScale = 1
    this.blinkTimer = 1200
    this.landSquash = 0
    this.stepTimer = 0
    this.wasOnGround = false
    this.collectedIndices = []
    this.blessed = false
    this.dying = false

    this.trailFade = 0
    this.introShowing = false
    this.introLayer = null
    this.paperShowing = false
    this.paperLayer = null

    this.cageSprite = null
    this.eggSprite = null
    this.dragonling = null
    this.cageScene = false
    this.cageOpened = false

    // 场景实例是复用的：上一局留下的「锁操作」和暂停的物理世界必须清干净，
    // 不然开完箱（win 里会锁上）之后再进任何一关，人都会原地动不了
    this.inputLocked = false
    this.pillarPressed = false
    this.pillarCharging = false

    // 触屏按键的状态也一并复位（场景实例复用）
    this.clearTouchInput()

    // 暂停期间手指抬起是收不到 pointerup 的，恢复时再清一遍，
    // 否则回来之后角色会一直往一个方向跑、技能也会被那一下误触发
    this.events.off(Phaser.Scenes.Events.RESUME)
    this.events.on(Phaser.Scenes.Events.RESUME, () => this.clearTouchInput())

    this.pillarGhost = null
    this.pillarMark = null
    this.physics.world.resume()

    this.cameras.main.setZoom(1)

    this.chased = false
    this.platforms = this.physics.add.staticGroup()
    this.orbs = this.physics.add.staticGroup()

    const theme = this.level.bg ?? 'field'
    const palette = THEME_COLORS[theme]

    // 纵向视差：户外的天空/远山/湖面/芦苇是「远景」，纵向一律不跟着相机走，
    // 所以跳起来的时候整片背景不会上下滑动（横向的视差保留）。
    // 塔内的墙反过来，要跟世界 1:1 地往上走，每层的窗户才对得上楼层
    const worldLocked = theme === 'tower'

    this.bgFarY = worldLocked ? 1 : 0
    this.bgMidY = worldLocked ? 1 : 0

    this.bgFar = this.add
      .tileSprite(0, 0, 480, 270, 'bg-' + theme + '-far')
      .setOrigin(0, 0)
      .setScrollFactor(0)
      .setDepth(-30)

    this.bgMid = this.add
      .tileSprite(0, 0, 480, 270, 'bg-' + theme + '-mid')
      .setOrigin(0, 0)
      .setScrollFactor(0)
      .setDepth(-20)

    // 第二关的风车：塔身固定在世界坐标里，扇叶用另一张贴图负责转
    this.windmillBlades = null

    if (this.level.windmill) {
      const windmill = this.level.windmill

      this.add.image(windmill.x, windmill.y - 32, 'windmill').setDepth(-15)

      this.windmillBlades = this.add
        .image(windmill.x, windmill.y - 54, 'windmill-blades')
        .setDepth(-14)
        .setScale(0.8)
    }

    // 望舒客栈：背景里的地标，贴着地面立着
    if (this.level.inn) {
      this.add.image(this.level.inn.x, this.level.inn.y - 80, 'inn').setDepth(-15)
    }

    this.gems = this.physics.add.staticGroup()
    this.blessings = this.physics.add.staticGroup()
    this.hazards = this.physics.add.staticGroup()

    this.monuments = this.physics.add.staticGroup()

    this.plates = this.physics.add.staticGroup()
    this.plateList = []

    ;(this.level.plates ?? []).forEach((def) => {
      const plate = this.plates.create(def.x, def.y, 'plate') as Phaser.Physics.Arcade.Sprite

      plate.setDisplaySize(def.width ?? 28, 8)
      plate.setTint(0x8a7f6a)
      plate.refreshBody()

      this.plateList.push({ sprite: plate, id: def.id, baseY: def.y, press: 0, pressed: false })
    })

    // 岩刺造物：贴在建筑上的发射器 + 它吐出来的岩刺。
    // 注意：和史莱姆的判定要等史莱姆创建之后再注册（见下面 slime 那一段），
    // 这里 this.slime 还不存在，注册了会变成一句空操作
    this.spikes = this.physics.add.group({ allowGravity: false })
    this.launchers = []

    ;(this.level.launchers ?? []).forEach((def) => {
      const dir = def.dir ?? 'down'
      const sprite = this.add.image(def.x, def.y, 'spike-launcher').setDepth(4)

      // 贴图是朝下的：朝左的口就把图转 90°，朝右的转 -90°
      sprite.setAngle(dir === 'left' ? 90 : dir === 'right' ? -90 : 0)

      this.launchers.push({
        sprite,
        dir,
        interval: def.interval ?? 2,
        speed: def.speed ?? 220,
        timer: 0.8,
      })
    })

    const platformDefs = [...this.level.platforms]

    if (this.level.dome) {
      platformDefs.push(...this.buildDome(this.level.dome))
    }

    platformDefs.forEach((def) => {
      const platform = this.platforms.create(def.x, def.y, 'pixel') as Phaser.Physics.Arcade.Sprite
      platform.setDisplaySize(def.width, def.height)
      platform.setTint(def.crumble ? palette.crumble : def.oneWay ? palette.oneWay : palette.ground)
      platform.refreshBody()

      if (def.oneWay) {
        const body = platform.body as Phaser.Physics.Arcade.StaticBody
        body.checkCollision.down = false
        body.checkCollision.left = false
        body.checkCollision.right = false
      }

      if (def.crumble) {
        platform.setData('crumble', true)
      }
    })

    if (this.level.dome) {
      const dome = this.level.dome
      const holeBottom = Math.round(this.domeY(dome, dome.holeX))

      this.add
        .rectangle(
          dome.holeX,
          holeBottom - dome.thickness / 2,
          dome.holeWidth,
          dome.thickness,
          0x9adcf0,
          0.22
        )
        .setDepth(-1)
    }

    if (this.level.dome && this.level.spire) {
      this.add
        .image(this.level.spire.x, this.domeY(this.level.dome, this.level.spire.x) - 19, 'spire')
        .setDepth(1)
    }

    if (this.level.cage) {
      this.cageSprite = this.add.image(this.level.cage.x, this.level.cage.y, 'cage')
      this.eggSprite = this.add.image(this.level.cage.x, this.level.cage.y + 8, 'egg')

      this.eggSprite.setDepth(1)
      this.cageSprite.setDepth(2)
    }

    this.level.hints.forEach((hint) => {
      this.makeHint(hint.x, hint.y, hint.text)
    })

    const savedGems = progress.levelGems[progress.levelIndex] ?? []

    this.level.gems.forEach((spot, index) => {
      if (savedGems.includes(index)) {
        return
      }

    const gem = this.gems.create(spot.x, spot.y, 'gem') as Phaser.Physics.Arcade.Sprite
      gem.setTint(0x6ec6ff)
      gem.setData('index', index)
      gem.setDepth(5)
    })

    this.level.blessings.forEach((spot) => {
      const item = this.blessings.create(spot.x, spot.y, 'blessing') as Phaser.Physics.Arcade.Sprite
      item.setTint(0xffe9a8)
    })

    this.level.orbs.forEach((def) => {
      const orb = this.orbs.create(def.x, def.y, 'orb') as Phaser.Physics.Arcade.Sprite
      orb.setTint(ELEMENTS[def.element].color)
      orb.setData('element', def.element)
    })

    const goal = this.level.goal
    const goalColor = goal.grants ? ELEMENTS[goal.grants].color : 0xffffff
    this.goalSprite = this.physics.add.staticSprite(goal.x, goal.y, goal.kind)
    this.goalSprite.setTint(goalColor)

    this.goalReady = goal.after === undefined

    if (!this.goalReady) {
      this.goalSprite.setVisible(false).setScale(0)
    }

    // 路边的神像：点了给元素，但不再是终点（真正过关的是随后出现的宝箱）
    this.statueSprite = null
    this.statueUsed = false

    if (this.level.statue) {
      const statue = this.level.statue
      const wanted = 'statue-' + statue.grants
      const figureKey = this.textures.exists(wanted) ? wanted : 'statue-wind'
      const tint = ELEMENTS[statue.grants].color

      // statue.y 是「底座底面所在的那条线」，也就是脚下的地面顶面
      const base = this.add.image(statue.x, statue.y, 'statue-base').setDepth(-1)
      // 底座：底面对齐地面线 → 中心 = 地面线 − 半高，顶面 = 地面线 − 全高
      const baseTop = statue.y - base.displayHeight

      base.setY(statue.y - base.displayHeight / 2)

      // 风神像的翅膀直接用风史莱姆那张 wing 贴图放大来摆，
      // 形状、羽线、角度和史莱姆完全一致，只是大号版
      if (statue.grants === 'wind') {
        const wings = [
          { offset: -7, originX: 1, angle: -45, flip: true },
          { offset: 7, originX: 0, angle: 45, flip: false },
        ]

        wings.forEach((wing) => {
          this.add
            .image(statue.x + wing.offset, baseTop + STATUE_SEAT - 38, 'wing')
            .setOrigin(wing.originX, 0.5)
            .setFlipX(wing.flip)
            .setAngle(wing.angle)
            .setScale(1.2)
            .setTint(tint)
            .setDepth(-2)
        })
      }

      // 本体站在底座上（底座在后面，所以台面会从袍子/裙摆两侧露出来）
      this.statueSprite = this.add.image(statue.x, statue.y, figureKey).setTint(tint)
      // 造像：底面压在底座顶面下面一点（压 5 像素），做出"下托上"的坐实感
      this.statueSprite.setY(
        baseTop + STATUE_SEAT - this.statueSprite.displayHeight / 2
      )
    }

    this.slime = this.physics.add.sprite(this.level.spawn.x, this.level.spawn.y, 'slime-none')
    this.slime.setBounce(0.2)
    this.slime.setCollideWorldBounds(true)
    this.slime.setVisible(false)

    this.slimeArt = this.add.image(this.level.spawn.x, this.level.spawn.y, 'slime-none')

    this.wingLeft = this.add.image(0, 0, 'wing')
    this.wingRight = this.add.image(0, 0, 'wing')
    this.rockCrown = this.add.image(0, 0, 'rock-crown').setDepth(9).setVisible(false)
    this.armorPlate = this.add.image(0, 0, 'armor-plate').setDepth(9).setVisible(false)
    
    this.windTrails = [0, 1, 2].map((index) =>
      this.add
        .image(0, 0, 'pixel')
        .setDisplaySize(12 + index * 5, 2)
        .setTint(0xa8e8d4)
        .setVisible(false)
    )

    this.eyes = [this.add.image(0, 0, 'eye'), this.add.image(0, 0, 'eye')]
    
    this.slimeArt.setDepth(10)
    this.wingLeft.setDepth(9)
    this.wingRight.setDepth(9)
    this.eyes.forEach((eye) => eye.setDepth(11))


    this.physics.world.setBounds(0, 0, this.level.width, this.level.height + 200)
    this.cameras.main.setBounds(0, 0, this.level.width, this.level.height)
    this.cameras.main.startFollow(this.slime, true, 0.12, 0.12)

    // 岩刺的判定：撞地形就碎，撞到史莱姆就按危险物算（岩化能挡、其它情况死亡结算）
    this.physics.add.collider(this.spikes, this.platforms, (spike) => {
      this.breakSpike(spike as Phaser.Physics.Arcade.Sprite)
    })

    this.physics.add.overlap(this.spikes, this.slime, (_slime, spike) => {
      const shot = spike as Phaser.Physics.Arcade.Sprite

      this.die('spike')
      this.breakSpike(shot)
    })

    this.physics.add.collider(this.slime, this.platforms, (_slime, platform) => {
      const sprite = platform as Phaser.Physics.Arcade.Sprite

      if (!sprite.getData('crumble') || sprite.getData('crumbling')) {
        return
      }

      sprite.setData('crumbling', true)
      sprite.setTint(0x8a5a5a)

      this.time.delayedCall(800, () => {
        sprite.destroy()
      })
    })

    this.physics.add.overlap(this.slime, this.orbs, (_slime, orb) => {
      const orbSprite = orb as Phaser.Physics.Arcade.Sprite
      this.absorb(orbSprite.getData('element') as ElementKey)
      orbSprite.destroy()
    })

    this.physics.add.overlap(this.slime, this.gems, (_slime, gem) => {
    const gemSprite = gem as Phaser.Physics.Arcade.Sprite
    this.collectedIndices.push(gemSprite.getData('index') as number)
    gemSprite.destroy()
    this.refreshGemHud()
    playSfx(this, 'sfx-gem', 0.5)

      if (!progress.gemStorySeen) {
        progress.gemStorySeen = true
        saveProgress()
        this.showMessage('透过这颗天蓝色的四角晶石，我仿佛看到了家乡的影子……')
      }

      queueAchievementToast('first-gem')
    })

    this.physics.add.overlap(this.slime, this.blessings, (_slime, item) => {
      const sprite = item as Phaser.Physics.Arcade.Sprite
      sprite.destroy()
      this.grantBlessing()
    })

    this.monumentList = []

    this.level.monuments.forEach((def) => {
      const pillar = this.monuments.create(def.x, def.y, 'monument') as Phaser.Physics.Arcade.Sprite
      // 底座是烤好的砖瓦色，没点亮时压暗一点，点亮就恢复本色
      pillar.setTint(0x9a9a9a)

      const head = this.add.image(def.x, def.y, 'monument-head')
      head.setTint(0x3a3a46)

      const icon = this.add.image(def.x, def.y - 16, 'icon-' + def.element).setScale(0.5)
      icon.setTint(0x7c8299)

      const hidden = def.after !== undefined

      if (hidden) {
        pillar.setVisible(false)
        head.setVisible(false)
        icon.setVisible(false)
      }

      const startLit = def.startLit === true

      if (startLit) {
        pillar.setTint(0xffffff)
        head.setTint(ELEMENTS[def.element].color)
        icon.setTint(0xffffff)
      }

      const monument: MonumentRef = {
        pillar,
        head,
        icon,
        element: def.element,
        id: def.id ?? '',
        after: def.after,
        lit: startLit,
        hidden,
        neighbors: def.neighbors ?? [],
        aura: [],
      }

      this.monumentList.push(monument)

      if (startLit) {
        this.makeMonumentAura(monument)
      }
    })

    this.gates = this.physics.add.staticGroup()
    this.doorList = []

    ;(this.level.doors ?? []).forEach((def) => {
      const sprite = this.gates.create(def.x, def.y, 'gate') as Phaser.Physics.Arcade.Sprite
      sprite.setDisplaySize(def.width, def.height)
      sprite.setTint(0x8f7bd6)
      sprite.refreshBody()

      this.doorList.push({
        sprite,
        needs: def.needs,
        ordered: def.ordered === true,
        progress: [],
        opened: false,
      })
    })

    this.physics.add.collider(this.slime, this.gates)

    // 关着的门也挡岩刺（门开的时候 body.enable 被关掉，岩刺就能飞过去了）
    this.physics.add.collider(this.spikes, this.gates, (spike) => {
      this.breakSpike(spike as Phaser.Physics.Arcade.Sprite)
    })

    this.noteList = []

    ;(this.level.notes ?? []).forEach((def) => {
      const sprite = this.add.image(def.x, def.y, 'paper').setDepth(5)

      this.noteList.push({ sprite, prompt: def.prompt, text: def.text })
    })

    this.level.hazards.forEach((def) => {
    const gapTop = def.gapY - HAZARD.gapHeight / 2
    const gapBottom = def.gapY + HAZARD.gapHeight / 2
    const bottomHeight = this.level.height - gapBottom

    const upper = this.hazards.create(def.x, gapTop / 2, 'pixel') as Phaser.Physics.Arcade.Sprite
    upper.setDisplaySize(HAZARD.width, gapTop)
    upper.setTint(palette.hazard)
    upper.refreshBody()

    const upperSpark = this.add
      .tileSprite(def.x, gapTop / 2, 10, gapTop, 'hazard-spark')
      .setAlpha(0.3)

    this.tweens.add({
      targets: upperSpark,
      alpha: 0.12,
      duration: 420,
      yoyo: true,
      repeat: -1,
    })

    const lower = this.hazards.create(
        def.x,
        gapBottom + bottomHeight / 2,
        'pixel'
      ) as Phaser.Physics.Arcade.Sprite
      lower.setDisplaySize(HAZARD.width, bottomHeight)
      lower.setTint(palette.hazard)
      lower.refreshBody()

      const lowerSpark = this.add
        .tileSprite(def.x, gapBottom + bottomHeight / 2, 10, bottomHeight, 'hazard-spark')
        .setAlpha(0.3)

      this.tweens.add({
        targets: lowerSpark,
        alpha: 0.12,
        duration: 420,
        yoyo: true,
        repeat: -1,
      })
    })

    this.physics.add.overlap(this.slime, this.hazards, () => {
      this.die('hazard')
    })


    // 左上角从上到下：设置齿轮、元素图标、体力条
    const settingsIcon = this.add
      .image(18, 16, 'gear')
      .setScrollFactor(0)
      .setTint(0x8fa3b8)
      .setInteractive({ useHandCursor: true })

    settingsIcon.on('pointerdown', () => {
      this.clearTouchInput()
      this.scene.pause()
      this.scene.launch('pause')
    })

    // 元素图标一横排：先铺底框再放图标，否则底框会盖住图标
    this.elementMarks = ELEMENT_ORDER.map((_key, index) =>
      this.add
        .rectangle(18 + index * 20, 40, 18, 18, 0x1e1e30, 0.9)
        .setStrokeStyle(1, 0xffd54f)
        .setScrollFactor(0)
        .setVisible(false)
    )

    // 图标可以点：手机上直接点元素图标就切过去（等于按 Q / E），
    // 没解锁的位置是隐藏的，Phaser 不会给隐藏对象派发点击，所以点不到
    this.elementIcons = ELEMENT_ORDER.map((_key, index) => {
      const icon = this.add
        .image(18 + index * 20, 40, 'icon-none')
        .setScrollFactor(0)
        .setVisible(false)

      icon.setInteractive(
        new Phaser.Geom.Rectangle(-2, -2, 20, 20),
        Phaser.Geom.Rectangle.Contains
      )

      icon.on('pointerdown', () => {
        const key = this.availableElements()[index]

        if (key) {
          this.switchElement(key)
        }
      })

      return icon
    })

    this.elementHint = this.add
      .text(34, 40, this.touchMode ? '切换元素' : 'Q / E 切换元素', {
        fontFamily: 'sans-serif',
        fontSize: '10px',
        color: '#8fa3b8',
      })
      .setOrigin(0, 0.5)
      .setScrollFactor(0)

        this.promptBox = this.add
      .rectangle(0, 0, 80, 18, 0x1e1e30)
      .setStrokeStyle(2, 0xffd54f)
      .setDepth(20)
      .setVisible(false)

    this.promptText = this.add
      .text(0, 0, '', {
        fontFamily: 'sans-serif',
        fontSize: '12px',
        color: '#ffffff',
      })
      .setOrigin(0.5)
      .setDepth(21)
      .setVisible(false)

    // 提示条本身可点：触屏设备上等于按 F（提示条不可见时 Phaser 不会派发点击）
    this.promptBox.setInteractive({ useHandCursor: true })

    this.promptBox.on('pointerdown', () => {
      if (this.inputLocked || !this.promptAction) {
        return
      }

      playSfx(this, 'sfx-interact', 0.3)
      this.promptAction()
    })

    this.staminaGlowOuter = this.add
      .rectangle(10, 60, 70, 16, 0x6b5210)
      .setOrigin(0, 0.5)
      .setScrollFactor(0)
      .setVisible(false)

    this.staminaGlow = this.add
      .rectangle(10, 60, 68, 14, 0xffd54f)
      .setOrigin(0, 0.5)
      .setScrollFactor(0)
      .setVisible(false)

    this.staminaBar = this.add
      .rectangle(10, 60, 60, 6, 0x74d0b0)
      .setOrigin(0, 0.5)
      .setScrollFactor(0)

    this.armorBarBack = this.add
      .rectangle(10, 51, 70, 5, 0x2a2118)
      .setOrigin(0, 0.5)
      .setScrollFactor(0)
      .setVisible(false)

    this.armorBar = this.add
      .rectangle(10, 51, 70, 3, 0xd9a441)
      .setOrigin(0, 0.5)
      .setScrollFactor(0)
      .setVisible(false)

    const gemTotal = this.level.gems.length
    const gemStartX = 480 - 20 - (gemTotal - 1) * 18

    this.gemIcons = this.level.gems.map((_spot, index) =>
      this.add.image(gemStartX + index * 18, 18, 'gem').setScrollFactor(0).setTint(0x33333f)
    )

    this.cursors = this.input.keyboard!.createCursorKeys()
    this.restartKey = this.input.keyboard!.addKey('R')
    this.prevKey = this.input.keyboard!.addKey('Q')
    this.nextKey = this.input.keyboard!.addKey('E')
    this.interactKey = this.input.keyboard!.addKey('F')
    this.armorKey = this.input.keyboard!.addKey('X')
    this.rockKey = this.input.keyboard!.addKey('C')

    // 触屏设备（或 ?touch=1）才铺虚拟按键，桌面浏览器上不占画面
    if (this.touchMode) {
      this.makeTouchControls()
    }

    this.armored = false
    this.armoredTimer = 0
    this.armorCooldown = 0
    this.invulnTimer = 0
    this.rockPillar = null

    // 关卡自带的元素也要登记进解锁表：不然它不在表里，Q/E 一转就把它丢了
    unlockElement(this.level.startElement)

    // 本关神像授予的元素，在摸到神像之前先锁着：存档里解锁过也不算数，
    // 只锁这一关，不动存档，别的关照样能用。锁的是本关自己出场的元素
    this.lockedElement =
      this.level.statue && this.level.statue.grants !== this.level.startElement
        ? this.level.statue.grants
        : null

    this.applyElement(progress.current)
    this.refreshGemHud()

    this.showIntro(this.level.intro)
    playMusic(this, this.level.music ?? 'music-field')

    if (this.level.chase) {
      this.chase = this.physics.add.image(-40, this.level.height / 2, 'pixel')
      this.chase.setDisplaySize(60, this.level.height)
      this.chase.setTint(palette.crumble)

      const chaseBody = this.chase.body as Phaser.Physics.Arcade.Body
      chaseBody.setAllowGravity(false)

      this.physics.add.overlap(this.slime, this.chase, () => {
        this.die('crush')
      })
    }
    this.input.keyboard!.on('keydown-ESC', () => {
      this.scene.pause()
      this.scene.launch('pause')
    })

    this.events.once('shutdown', () => {
      stopAllLoops()
    })
    
  }

  // 关卡提示统一长这样：一块深色底 + 一行浅字，和交互提示、独白是同一套配色
  // 操作类提示按类别只出现一次：「按空格可跳跃」这类教操作的，同一类之后的关卡不再显示；
  // 「前面有座神像」这种纯地标提示不归类，永远都在
  // 交互提示的「[F] 」前缀同样只带一次，学会之后只留动作名（触屏下本来就没有前缀）
  private interactPrefix() {
    return hasSeenHint('interact') ? '' : '[F] '
  }

  private hintCategory(text: string): string | null {
    if (/长按空格/.test(text)) {
      return 'hover'
    }

    if (/松开空格/.test(text)) {
      return 'glide'
    }

    if (/空格/.test(text)) {
      return 'jump'
    }

    if (/按 X/.test(text)) {
      return 'armor'
    }

    if (/按 C/.test(text)) {
      return 'pillar'
    }

    if (/按 F|\[F\]/.test(text)) {
      return 'interact'
    }

    if (/← →/.test(text)) {
      return 'move'
    }

    return null
  }

  private makeHint(x: number, y: number, text: string) {
    const category = this.hintCategory(text)

    // 这一类操作已经提示过了，就不再出现
    if (category && hasSeenHint(category)) {
      return
    }

    if (category) {
      markHintSeen(category)
    }

    const label = this.add
      .text(x, y, touchText(text), {
        fontFamily: 'sans-serif',
        fontSize: '12px',
        color: '#a8b6c8',
      })
      .setOrigin(0.5)
      .setDepth(4)

    // 底框按文字实测宽度来，不会出现空边或者字被切掉
    const panel = this.add
      .rectangle(x, y, Math.max(48, label.width + 16), 20, 0x14181f)
      .setStrokeStyle(1, 0x3a4a5e)
      .setAlpha(0.82)
      .setDepth(3)

    return { panel, label }
  }

  private domeY(dome: DomeDef, x: number) {
    const half = this.level.width / 2
    const rise = dome.springY - dome.apexY
    const centerY =
      (half * half + dome.springY * dome.springY - dome.apexY * dome.apexY) / (2 * rise)
    const radius = centerY - dome.apexY

    return centerY - Math.sqrt(radius * radius - (x - half) * (x - half))
  }

  private buildDome(dome: DomeDef): PlatformDef[] {
    const blocks: PlatformDef[] = []
    const step = 20

    for (let cx = step / 2; cx < this.level.width; cx += step) {
      if (Math.abs(cx - dome.holeX) < dome.holeWidth / 2 + step / 2) {
        continue
      }

      const bottom = Math.round(this.domeY(dome, cx))

      blocks.push({ x: cx, y: bottom - dome.thickness / 2, width: step, height: dome.thickness })
    }

    return blocks
  }

  // 这一关能用的元素：从第一关走到本关，途中真正会拿到的那些——
  // 各关自带元素 + 前面各关神像授予的元素（本关神像要摸到才算），
  // 最后再和存档里的解锁表取交集。所以哪怕存档里已经有岩元素，
  // 回到第一关也切不出来，得按关卡顺序重新把神像摸一遍
  private switchElement(key: ElementKey) {
    if (this.inputLocked || key === this.element || !this.availableElements().includes(key)) {
      return
    }

    progress.current = key
    this.applyElement(key)
    playSfx(this, 'sfx-interact', 0.25)
  }

  private availableElements(): ElementKey[] {
    const list: ElementKey[] = []

    const add = (key: ElementKey) => {
      if (!list.includes(key)) {
        list.push(key)
      }
    }

    LEVELS.forEach((level, index) => {
      if (index > progress.levelIndex) {
        return
      }

      add(level.startElement)

      // 本关神像还没摸到就先不给
      if (level.statue && !(index === progress.levelIndex && this.lockedElement !== null)) {
        add(level.statue.grants)
      }
    })

    return ELEMENT_ORDER.filter((key) => list.includes(key) && progress.unlocked.includes(key))
  }

  // 触屏按键：左下角是左右移动（箭头 + 中圈），右下角是跳跃 + 岩柱 + 岩化。
  // 位置直接按逻辑分辨率 480x270 写，缩放交给 Phaser 的 Scale.FIT
  private clearTouchInput() {
    this.touchLeft = false
    this.touchRight = false
    this.touchJump = false
    this.touchJumpJust = false
    this.touchArmorJust = false
    this.touchPillarJust = false
    this.touchPillarUp = false
  }

  private makeTouchControls() {
    // 允许三指同时按：左手压方向、右手点跳跃和技能
    this.input.addPointer(2)

    this.touchButtons = []

    const button = (
      x: number,
      y: number,
      key: string,
      onDown: () => void,
      onUp?: () => void,
      flip = false
    ) => {
      const image = this.add
        .image(x, y, key)
        .setScrollFactor(0)
        .setDepth(100)
        .setAlpha(0.62)
        .setFlipX(flip)
        .setInteractive({ useHandCursor: true })

      const release = () => {
        image.setScale(1)
        onUp?.()
      }

      image.on('pointerdown', () => {
        // 按下只缩小，透明度交给「别遮住史莱姆」那套统一控制
        image.setScale(0.92)
        onDown()
      })

      image.on('pointerup', release)
      image.on('pointerout', release)

      this.touchButtons.push({ image, x, y, r: image.width / 2, base: 0.62 })

      return image
    }

    // 左下：只有左右两个圆盘，左箭头（贴图朝右，靠翻转）往左、右箭头往右
    button(
      28,
      232,
      'touch-arrow',
      () => {
        this.touchLeft = true
      },
      () => {
        this.touchLeft = false
      },
      true
    )

    button(
      92,
      232,
      'touch-arrow',
      () => {
        this.touchRight = true
      },
      () => {
        this.touchRight = false
      }
    )

    // 右下：最大的跳跃键
    button(
      412,
      214,
      'touch-jump',
      () => {
        this.touchJump = true
        this.touchJumpJust = true
      },
      () => {
        this.touchJump = false
      }
    )

    // 跳跃键左下角：岩柱（小一号）。没解锁岩元素时整个藏起来
    this.touchPillarButton = button(
      368,
      246,
      'touch-pillar',
      () => {
        this.touchPillarJust = true
      },
      () => {
        this.touchPillarUp = true
      }
    )

    // 岩柱左边：岩化（图标更大一点）。
    // 底下压一张灰版，亮的那张用 setCrop 从下往上露出，就是冷却回充的样子
    const armorX = 322
    const armorY = 246

    const armorDim = this.add
      .image(armorX, armorY, 'touch-armor-dim')
      .setScrollFactor(0)
      .setDepth(100)
      .setAlpha(0.62)

    const armorFill = this.add
      .image(armorX, armorY, 'touch-armor')
      .setScrollFactor(0)
      .setDepth(101)
      .setAlpha(0.62)

    this.touchArmorDim = armorDim
    this.touchArmorFill = armorFill

    armorDim.setInteractive({ useHandCursor: true })

    const armorRelease = () => {
      armorDim.setScale(1)
      armorFill.setScale(1)
    }

    armorDim.on('pointerdown', () => {
      armorDim.setScale(0.92)
      armorFill.setScale(0.92)
      this.touchArmorJust = true
    })

    armorDim.on('pointerup', armorRelease)
    armorDim.on('pointerout', armorRelease)

    this.touchButtons.push({
      image: armorDim,
      x: armorX,
      y: armorY,
      r: 18,
      base: 0.62,
    })

    this.touchButtons.push({
      image: armorFill,
      x: armorX,
      y: armorY,
      r: 18,
      base: 0.62,
    })
  }

  private refreshHud() {
    const unlocked = this.availableElements()

    // 没解锁岩元素就不显示岩柱 / 岩化两个键（键盘的 C / X 本来也不会响应）
    this.rockAvailable = unlocked.includes('rock')

    this.touchPillarButton?.setVisible(this.rockAvailable)
    this.touchArmorDim?.setVisible(this.rockAvailable)
    this.touchArmorFill?.setVisible(this.rockAvailable)

    unlocked.forEach((key, index) => {
      const icon = this.elementIcons[index]
      const active = key === this.element
      const iconKey = 'icon-' + key

      icon.setVisible(true)
      icon.setPosition(18 + index * 20, 40)
      icon.setTexture(this.textures.exists(iconKey) ? iconKey : 'icon-none')
      icon.setTint(ELEMENTS[key].color)
      icon.setAlpha(active ? 1 : 0.4)

      this.elementMarks[index].setPosition(icon.x, icon.y).setVisible(active)
    })

    // 没解锁的位置全部收起来
    for (let index = unlocked.length; index < this.elementIcons.length; index++) {
      this.elementIcons[index].setVisible(false)
      this.elementMarks[index].setVisible(false)
    }

    this.elementHint.setPosition(14 + unlocked.length * 20, 40)

    const element = ELEMENTS[this.element]

    this.staminaBar.setVisible(element.canHover)
    this.staminaBar.setFillStyle(element.color)
  }

  private applyElement(key: ElementKey) {
    const element = ELEMENTS[key]

    // 换元素会退出岩化：走同一条收尾流程，所以也会进冷却（不能切走再切回来白嫖）
    this.setArmored(false)
    // 预览也一起收掉
    this.pillarPressed = false
    this.stopPillarPreview()

    this.wingLeft.setTint(element.color)
    this.wingRight.setTint(element.color)
    this.element = key
    this.jumpPower = element.jump
    this.slimeArt.setTexture('slime-' + key)
    this.refreshEyeTint()
    this.refreshHud()
  }

  private absorb(key: ElementKey) {
    unlockElement(key)
    this.applyElement(key)
  }

  private win() {
    if (this.finished) {
      return
    }

    this.finished = true

    // 开箱之后也锁住操作：物理世界暂停 + 清速度 + 收掉岩柱预览，
    // 等 900 毫秒后结算界面接手，玩家不会带着惯性滑出去
    this.inputLocked = true
    this.physics.world.pause()
    this.slime.setVelocity(0, 0)
    this.pillarPressed = false
    this.stopPillarPreview()

    recordClear(progress.levelIndex, this.collectedIndices)
    stopAllLoops()
    playSfx(this, 'sfx-win', 0.55)

    if (this.level.goal.kind === 'chest') {
      this.goalSprite.setTexture('chest-open')
    }

    this.time.delayedCall(900, () => {
      this.scene.start('result')
    })
  }

  // 元素力从神像手里的东西里冒出来：风是水晶球（贴图里在正中间偏上），
  // 岩是右手举在胸前的立方体（偏左）。偏移 = 持物中心 − 本体中心
  private statueHeldOffset(granted: ElementKey) {
    return granted === 'rock' ? { x: -13, y: -3 } : { x: 0, y: -3 }
  }

  private playStatueScene(granted: ElementKey) {
    unlockElement(granted)

    // 演出期间锁操作：物理世界暂停 + 清速度 + 收掉岩柱预览
    this.inputLocked = true
    this.physics.world.pause()
    this.slime.setVelocity(0, 0)
    this.pillarPressed = false
    this.stopPillarPreview()

    // 本关的锁解开了：元素图标那一排会多出一个，Q/E 也能切到它了
    if (this.lockedElement === granted) {
      this.lockedElement = null
    }

    // 演出以神像为中心：没有独立神像时（旧数据）退回用终点
    const source = this.statueSprite ?? this.goalSprite
    const held = this.statueHeldOffset(granted)
    const heldX = source.x + held.x
    const heldY = source.y + held.y

    this.cameras.main.stopFollow()
    this.cameras.main.pan(
      (this.slime.x + source.x) / 2,
      (this.slime.y + source.y) / 2,
      600,
      'Sine.easeInOut'
    )
    this.cameras.main.zoomTo(1.8, 600, 'Sine.easeInOut')

    const orb = this.add
      .image(heldX, heldY, 'icon-' + granted)
      .setTint(ELEMENTS[granted].color)
      .setDepth(30)
      .setScale(0)

    this.tweens.add({
      targets: orb,
      scale: 1,
      duration: 300,
      onComplete: () => {
        this.tweens.add({
          targets: orb,
          x: this.slime.x,
          y: this.slime.y,
          scale: 1.4,
          duration: 900,
          ease: 'Sine.easeInOut',
          onComplete: () => {
            orb.destroy()
            this.playTransformFlash(granted)
          },
        })
      },
    })
  }

  private playTransformFlash(granted: ElementKey) {
    const flash = this.add
      .rectangle(0, 0, 480, 270, 0xffffff)
      .setOrigin(0, 0)
      .setScrollFactor(0)
      .setDepth(60)
      .setAlpha(0)

    this.tweens.add({
      targets: flash,
      alpha: 1,
      duration: 260,
      hold: 80,
      yoyo: true,
      onYoyo: () => {
        this.applyElement(granted)
      },
      onComplete: () => {
        flash.destroy()

        // 演出结束，解锁操作、恢复物理世界，再恢复镜头
        this.inputLocked = false
        this.physics.world.resume()

        // 演出结束，镜头恢复到正常跟随和 1 倍缩放
        this.cameras.main.zoomTo(1, 300)
        this.cameras.main.startFollow(this.slime, true, 0.12, 0.12)

        // 神像不是终点：演出结束后，如果这一关的宝箱在等神像，就把宝箱放出来
        if (this.level.goal.after === 'statue') {
          this.time.delayedCall(600, () => {
            this.revealGoal()
          })

          return
        }

        this.time.delayedCall(400, () => {
          this.scene.start('result')
        })
      },
    })
  }

  // 眼睛：颜色用元素的眼珠色；带黑描边的只有岩史莱姆，所以贴图也在这里一起换
  private refreshEyeTint() {
    const eyeKey = this.element === 'rock' ? 'eye-rock' : 'eye'

    this.eyes.forEach((eye) => {
      eye.setTexture(eyeKey)
      eye.setTint(ELEMENTS[this.element].eyeColor)
    })
  }

  // 岩化：换成结晶态，能挡一次造物伤害，到时间或者被打碎才解除。
  // 按 X 只能开、不能关；开完这一轮就进 ARMOR_COOLDOWN 秒冷却
  private setArmored(on: boolean) {
    if (this.armored === on) {
      return
    }

    this.armored = on
    this.armoredTimer = on ? ARMOR_TIME : 0

    if (!on) {
      // 时间到、被打碎、换元素打断，都从这一刻开始算冷却
      this.armorCooldown = ARMOR_COOLDOWN
    }

    this.slimeArt.setTexture(on ? 'slime-rock-armored' : 'slime-' + this.element)
    this.refreshEyeTint()
    this.playArmorShift(on)

    playSfx(this, 'sfx-interact', 0.35)
  }

  // 两种状态切换那一下的动画：白光一闪 + 一圈扩散 + 左右各崩一块石屑
  private playArmorShift(on: boolean) {
    const flash = this.add
      .image(this.slime.x, this.slime.y, 'pixel')
      .setDisplaySize(36, 30)
      .setTint(on ? 0xffd54f : 0xffffff)
      .setAlpha(0.55)
      .setDepth(12)

    this.tweens.add({
      targets: flash,
      displayWidth: 46,
      displayHeight: 38,
      alpha: 0,
      duration: 200,
      onComplete: () => flash.destroy(),
    })

    const ring = this.add
      .image(this.slime.x, this.slime.y, 'blessing')
      .setTint(on ? 0xffd54f : 0x8a7f6a)
      .setAlpha(0.7)
      .setScale(0.2)
      .setDepth(12)

    this.tweens.add({
      targets: ring,
      scale: 1.7,
      alpha: 0,
      duration: on ? 280 : 220,
      onComplete: () => ring.destroy(),
    })

    ;[-1, 1].forEach((dir) => {
      const chip = this.add
        .image(this.slime.x + dir * 10, this.slime.y, 'pixel')
        .setDisplaySize(3, 3)
        .setTint(on ? 0x8a7f6a : 0x4a3f2c)
        .setDepth(12)

      this.tweens.add({
        targets: chip,
        x: chip.x + dir * 24,
        y: chip.y - (on ? 16 : 6),
        alpha: 0,
        duration: 320,
        ease: 'Quad.easeOut',
        onComplete: () => chip.destroy(),
      })
    })
  }

  // 岩造物落点：就是正前方脚下那块地形。从脚底开始往下找，不往上找，
  // 所以头顶有建筑也不会跑到上面去；找不到合适的高度、或者柱身会跟地形撞上，就算不能放
  // 落点：从 PILLAR_OFFSETS 里挑第一个放得下的距离，前面的位置放不下就往人身边挪
  private pillarTarget(): PillarTarget {
    const dir = this.slime.flipX ? -1 : 1
    let last: PillarTarget | null = null

    for (const offset of PILLAR_OFFSETS) {
      const target = this.pillarSpotAt(this.slime.x + dir * offset, this.slime.y)

      if (target.valid) {
        return target
      }

      last = target
    }

    return last ?? this.pillarSpotAt(this.slime.x, this.slime.y)
  }

  // 某一个 x 上能不能立柱子：从脚底往下找地形，不许穿模
  private pillarSpotAt(x: number, slimeY: number): PillarTarget {
    const feet = slimeY + 13
    const landTop = this.pillarLandingY(x, PILLAR_SIZE.width / 2, feet)

    if (landTop === null || landTop - feet > PILLAR_REACH) {
      return { x, landTop: feet, spawnBottom: feet - PILLAR_DROP, valid: false }
    }

    // 柱身这一段不许和别的地形/关着的门重叠，不然会穿模
    const box = {
      left: x - PILLAR_SIZE.width / 2,
      right: x + PILLAR_SIZE.width / 2,
      top: landTop - PILLAR_SIZE.height,
      bottom: landTop,
    }
    let blocked = false
    // 头顶最近的障碍物底边：下落就从它下面开始，免得掉下来的过程从楼板里穿过去
    let ceilingBottom: number | null = null

    const scan = (child: Phaser.GameObjects.GameObject) => {
      const body = (child as Phaser.Physics.Arcade.Sprite).body as Phaser.Physics.Arcade.StaticBody

      if (!body || !body.enable) {
        return
      }

      if (
        box.left < body.right &&
        box.right > body.left &&
        box.top < body.bottom &&
        box.bottom > body.top
      ) {
        blocked = true
      }

      if (body.bottom <= box.top && body.right > box.left && body.left < box.right) {
        ceilingBottom = ceilingBottom === null ? body.bottom : Math.max(ceilingBottom, body.bottom)
      }
    }

    this.platforms.getChildren().forEach(scan)
    this.gates.getChildren().forEach(scan)

    const lowest = ceilingBottom === null ? -Infinity : ceilingBottom + PILLAR_SIZE.height

    return {
      x,
      landTop,
      spawnBottom: Math.min(landTop, Math.max(landTop - PILLAR_DROP, lowest)),
      valid: !blocked,
    }
  }

  // 长按 C：进入预览，正前方立一根半透明的柱子 + 脚下的落点线，松手才真的落柱
  private startPillarPreview() {
    this.pillarCharging = true

    this.pillarGhost?.destroy()
    this.pillarGhost = this.add.image(0, 0, 'rock-pillar').setAlpha(0.45).setDepth(8)

    this.pillarMark?.destroy()
    this.pillarMark = this.add
      .rectangle(0, 0, PILLAR_SIZE.width + 6, 3, 0x74d0b0)
      .setOrigin(0.5)
      .setDepth(8)

    this.pillarGhost.setScale(1, 0.6)

    this.tweens.add({
      targets: this.pillarGhost,
      scaleY: 1,
      duration: 140,
      ease: 'Quad.easeOut',
    })
  }

  private stopPillarPreview() {
    this.pillarCharging = false
    this.pillarGhost?.destroy()
    this.pillarMark?.destroy()
    this.pillarGhost = null
    this.pillarMark = null
  }

  // 预览每帧更新：位置跟着史莱姆走，合法是绿线、放不下整根变红
  private updatePillarPreview() {
    if (!this.pillarCharging || !this.pillarGhost || !this.pillarMark) {
      return
    }

    const target = this.pillarTarget()

    this.pillarGhost.setPosition(target.x, target.landTop - PILLAR_SIZE.height / 2)
    this.pillarGhost.setTint(target.valid ? 0xffffff : 0xff6b6b)

    this.pillarMark.setPosition(target.x, target.landTop)
    this.pillarMark.setFillStyle(target.valid ? 0x74d0b0 : 0xff6b6b)
  }

  // 落柱：合法就砸下来并返回 true，不合法就提示一声
  private castPillar(): boolean {
    const target = this.pillarTarget()

    if (!target.valid) {
      this.showMessage('这里放不下石柱')
      return false
    }

    this.spawnRockPillar(target.x, target.landTop, target.spawnBottom)

    return true
  }

  // 真正生成：从落点上方掉下来，动画期间不参与碰撞，落点就是预览里那一个
  private spawnRockPillar(x: number, landTop: number, spawnBottom: number) {
    this.rockPillar?.destroy()

    const pillar = this.platforms.create(x, 0, 'rock-pillar') as Phaser.Physics.Arcade.Sprite
    const restY = landTop - pillar.displayHeight / 2
    const spawnY = spawnBottom - pillar.displayHeight / 2
    const fall = Math.abs(restY - spawnY)

    pillar.setY(spawnY)
    pillar.disableBody()
    pillar.refreshBody()

    this.rockPillar = pillar

    this.tweens.add({
      targets: pillar,
      y: restY,
      // 重力 600，自由落体的时间是 sqrt(2h/g)；Quad.easeIn 的位移正好是 t²，配起来像真掉下来
      duration: Phaser.Math.Clamp(Math.sqrt((2 * fall) / 600) * 1000, 180, 900),
      ease: 'Quad.easeIn',
      onComplete: () => {
        pillar.enableBody()
        pillar.refreshBody()
        playSfx(this, 'sfx-land', 0.4)
        this.cameras.main.shake(160, 0.005)
        this.spawnPillarDust(x, landTop)
      },
    })

    this.time.delayedCall(PILLAR_TIME * 1000, () => {
      if (this.rockPillar === pillar) {
        this.rockPillar = null
      }

      pillar.destroy()
    })
  }

  // 柱脚正下方最高的那块地形顶面；底下是空的（悬崖、洞口）就返回 null
  private pillarLandingY(x: number, halfWidth: number, fromY: number): number | null {
    let landTop: number | null = null

    this.platforms.getChildren().forEach((child) => {
      const body = (child as Phaser.Physics.Arcade.Sprite).body as Phaser.Physics.Arcade.StaticBody

      // 只管还开着的、在柱脚下面的地形（柱子自己这会儿是关着的，会自动跳过）
      if (!body || !body.enable || body.top < fromY) {
        return
      }

      // 柱脚这条横带得真的压在这块地形上
      if (x - halfWidth > body.right || x + halfWidth < body.left) {
        return
      }

      if (landTop === null || body.top < landTop) {
        landTop = body.top
      }
    })

    return landTop
  }

  // 石柱落地那一下溅起的几粒土：左右各三粒，斜着抛出去，再掉回地面、边掉边淡出
  private spawnPillarDust(x: number, groundY: number) {
    ;[-1, 1].forEach((dir) => {
      for (let index = 0; index < 3; index++) {
        const size = index === 0 ? 3 : 2
        const dust = this.add
          .image(x + dir * 8, groundY - 2, 'pixel')
          .setDisplaySize(size, size)
          .setTint(index % 2 === 0 ? 0x8a7f6a : 0x6b5a3a)
          .setDepth(8)

        this.tweens.add({
          targets: dust,
          x: x + dir * (16 + index * 9),
          y: groundY - 12 - index * 4,
          duration: 180,
          ease: 'Quad.easeOut',
          onComplete: () => {
            this.tweens.add({
              targets: dust,
              y: groundY - 1,
              alpha: 0,
              duration: 220,
              onComplete: () => dust.destroy(),
            })
          },
        })
      }
    })
  }
 
  // 压力板：只有岩柱和「岩化状态」的史莱姆压得动，而且是慢慢压下去的
  private updatePlates(dt: number) {
    this.plateList.forEach((plate) => {
      const weight =
        (this.armored && this.physics.overlap(plate.sprite, this.slime)) ||
        (this.rockPillar !== null && this.physics.overlap(plate.sprite, this.rockPillar))
      const step = dt / PLATE_PRESS_TIME

      // 有重量就往下沉，重量一走就慢慢弹回来
      plate.press = Phaser.Math.Clamp(plate.press + (weight ? step : -step), 0, 1)
      // 只动画面、不动刚体：判定范围固定在抬起时的位置，不会跟着往下跑
      plate.sprite.setY(plate.baseY + plate.press * PLATE_SINK)

      // 压到底才算数：跑过去踩一下（不到 0.45 秒）是压不动的
      const pressed = plate.press >= 1

      if (pressed === plate.pressed) {
        return
      }

      plate.pressed = pressed
      plate.sprite.setTint(pressed ? 0xffd54f : 0x8a7f6a)
      playSfx(this, pressed ? 'sfx-interact' : 'sfx-step', 0.3)

      this.doorList.forEach((door) => {
        if (
          !door.opened &&
          door.needs.includes(plate.id) &&
          door.needs.every((id) => this.idReady(id))
        ) {
          this.openDoor(door)
        }
      })
    })
  }

  // 门点名到的东西算不算数：方碑看亮没亮，压力板看上面压没压着东西
  private idReady(id: string) {
    const monument = this.monumentById(id)

    if (monument) {
      return monument.lit
    }

    return this.plateList.some((plate) => plate.id === id && plate.pressed)
  }

  // 岩刺造物：到点先抖一下当预警，0.15 秒后真的吐出一根
  private updateLaunchers(dt: number) {
    this.launchers.forEach((launcher) => {
      launcher.timer -= dt

      if (launcher.timer > 0) {
        return
      }

      launcher.timer = launcher.interval

      this.tweens.add({
        targets: launcher.sprite,
        scaleX: 1.15,
        scaleY: 0.85,
        duration: 120,
        yoyo: true,
      })

      this.time.delayedCall(150, () => {
        this.fireSpike(launcher)
      })
    })

    this.spikes.getChildren().forEach((child) => {
      const spike = child as Phaser.Physics.Arcade.Sprite

      // 飞出关卡就收掉，别越攒越多
      if (
        spike.x < -40 ||
        spike.x > this.level.width + 40 ||
        spike.y < -40 ||
        spike.y > this.level.height + 60
      ) {
        this.breakSpike(spike)
        return
      }

      // 岩柱挡得住：柱子在的话就对一下位置
      if (!this.rockPillar) {
        return
      }

      const hit =
        spike.x + 5 > this.rockPillar.x - 10 &&
        spike.x - 5 < this.rockPillar.x + 10 &&
        spike.y + 8 > this.rockPillar.y - 36 &&
        spike.y - 8 < this.rockPillar.y + 36

      if (hit) {
        this.breakSpike(spike)
      }
    })
  }

  private fireSpike(launcher: LauncherRef) {
    const dirX = launcher.dir === 'left' ? -1 : launcher.dir === 'right' ? 1 : 0
    const dirY = launcher.dir === 'down' ? 1 : 0
    // 锥口离贴图中心 6 像素，岩刺半长 7，再往里压 2 像素就是出生点
    const muzzle = 11
    const spike = this.spikes.create(
      launcher.sprite.x + dirX * muzzle,
      launcher.sprite.y + dirY * muzzle,
      'rock-spike'
    ) as Phaser.Physics.Arcade.Sprite

    spike.setAngle(launcher.dir === 'left' ? 90 : launcher.dir === 'right' ? -90 : 0)
    spike.setDepth(6)
    spike.setVelocity(dirX * launcher.speed, dirY * launcher.speed)

    // 横着飞的那根要把判定盒也横过来，不然会和画面错开
    if (dirX !== 0) {
      const body = spike.body as Phaser.Physics.Arcade.Body

      body.setSize(14, 8)
    }
  }

  private breakSpike(spike: Phaser.Physics.Arcade.Sprite) {
    if (!spike.active) {
      return
    }

    spike.destroy()
  }

  private syncVisual(sx: number, sy: number) {
    // 岩化时整体放大一圈，像个石墩。放大是绕贴图中心做的，所以贴图要往上提一点，
    // 脚底才不会陷进地面
    const grow = this.armored ? ARMOR_GROW : 1
    const scaleX = sx * grow
    const scaleY = sy * grow
    const growLift = 14.5 * (grow - 1)

    this.slimeArt.setPosition(this.slime.x, this.slime.y - growLift)
    this.slimeArt.setFlipX(this.slime.flipX)
    this.slimeArt.setScale(scaleX, scaleY)

    // 护甲层：贴图中心就是身体圆心，所以挂在身体圆心、和身体同一个缩放
    this.armorPlate.setVisible(this.armored)

    if (this.armored) {
      this.armorPlate.setScale(scaleX, scaleY)
      this.armorPlate.setPosition(this.slime.x, this.slime.y - growLift + 2 * scaleY)
    }

    const look = this.slime.flipX ? -2 : 2

    this.eyes[0].setPosition(
      this.slime.x + (-5 + look) * scaleX,
      this.slime.y - growLift - 2 * scaleY
    )
    this.eyes[1].setPosition(
      this.slime.x + (5 + look) * scaleX,
      this.slime.y - growLift - 2 * scaleY
    )
    this.eyes.forEach((eye) => eye.setScale(1, this.blinkScale))

    const hasWing = ELEMENTS[this.element].wing

    this.wingLeft.setVisible(hasWing)
    this.wingRight.setVisible(hasWing)

    // 岩史莱姆的岩脊：单独一张贴图挂在头顶，所以能明显高过身体
    const isRock = this.element === 'rock'

    this.rockCrown.setVisible(isRock)

    if (isRock) {
      // 岩化态的岩脊贴图更高（32x36），贴图里身体圆心离贴图中心也更远，所以少提上来一点
      const lift = this.armored ? 11 : 8

      this.rockCrown.setTexture(this.armored ? 'rock-crown-armored' : 'rock-crown')
      // 岩脊跟着本体一起放大、形变，所以任何姿势下底座都压在本体顶部
      this.rockCrown.setScale(scaleX, scaleY)
      this.rockCrown.setFlipX(this.slime.flipX)
      this.rockCrown.setPosition(this.slime.x, this.slime.y - growLift - lift * scaleY)
    }

    if (hasWing) {
      this.wingLeft.setScale(0.75)
      this.wingRight.setScale(0.75)
      this.wingLeft.setOrigin(1, 0.5)
      this.wingRight.setOrigin(0, 0.5)
      this.wingLeft.setPosition(
        this.slime.x - 16 * sx,
        this.slime.y - 6 * sy + this.wingOffset
      )
      this.wingRight.setPosition(
        this.slime.x + 16 * sx,
        this.slime.y - 6 * sy + this.wingOffset
      )
      this.wingLeft.setFlipX(true)
      this.wingLeft.setAngle(-45)
      this.wingRight.setAngle(45)
    }

    const body = this.slime.body as Phaser.Physics.Arcade.Body
    const target = this.blessed && Math.abs(body.velocity.x) > 10 ? 1 : 0

    this.trailFade = Phaser.Math.Linear(this.trailFade, target, 0.1)

    const dir = this.slime.flipX ? 1 : -1
    const shimmer = 0.7 + 0.3 * Math.sin(this.time.now / 180)

    this.windTrails.forEach((trail, index) => {
      trail.setVisible(this.trailFade > 0.02)

      if (this.trailFade > 0.02) {
        trail.setAlpha(this.trailFade * (0.5 - index * 0.14) * (shimmer - index * 0.15))
        trail.setPosition(this.slime.x + dir * (24 + index * 9), this.slime.y + 9 + index * 2)
      }
    })
  }

  private refreshGemHud() {
    const saved = progress.levelGems[progress.levelIndex] ?? []

    this.gemIcons.forEach((icon, index) => {
      const lit = saved.includes(index) || this.collectedIndices.includes(index)
      icon.setTint(lit ? 0x6ec6ff : 0x33333f)
    })
  }

  private grantBlessing() {
    this.blessed = true
    this.stamina = STAMINA_MAX
    this.staminaGlowOuter.setVisible(true)
    this.staminaGlow.setVisible(true)
    this.showMessage('别怕，借你一点风的力量——去吧。')
  }

  private endBlessing() {
    this.blessed = false
    this.staminaGlowOuter.setVisible(false)
    this.staminaGlow.setVisible(false)
    this.showMessage('愿风神护佑你')
  }

  private showMessage(text: string) {
    const message = this.add
      .text(240, 232, text, {
        fontFamily: 'sans-serif',
        fontSize: '16px',
        color: '#ffe9a8',
        backgroundColor: '#000000aa',
        padding: { x: 10, y: 5 },
      })
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(50)
      .setAlpha(0)

    this.tweens.add({
      targets: message,
      alpha: 1,
      duration: 250,
      hold: 2000,
      yoyo: true,
      onComplete: () => {
        message.destroy()
      },
    })
  }

  private die(cause: string) {
    if (this.dying || this.invulnTimer > 0) {
      return
    }

    // 岩化能挡一次"造物伤害"（红闸门、崩塌的墙），摔落不算
    if (this.armored && cause !== 'fall') {
      this.setArmored(false)
      this.invulnTimer = 1.2
      this.showMessage('岩壳替你挡下了一击')

      return
    }

    this.dying = true
    stopAllLoops()
    playSfx(this, 'sfx-die', 0.45)
    this.scene.pause()
    this.scene.launch('dead', { cause })
  }

  private showIntro(text: string) {
    this.introShowing = true
    this.physics.world.pause()
    stopAllLoops()

    const layer = this.add.container(0, 0).setDepth(200).setScrollFactor(0)

    const shade = this.add.rectangle(0, 0, 480, 270, 0x0a0a14).setOrigin(0, 0)
    const body = this.add
      .text(240, 118, text, {
        fontFamily: 'sans-serif',
        fontSize: '16px',
        color: '#ffffff',
        align: 'center',
        lineSpacing: 8,
      })
      .setOrigin(0.5)
    const tip = this.add
      .text(240, 232, this.touchMode ? '轻点屏幕继续' : '按 空格 继续', {
        fontFamily: 'sans-serif',
        fontSize: '12px',
        color: '#8fa3b8',
      })
      .setOrigin(0.5)

    layer.add([shade, body, tip])

    this.introLayer = layer

    // 手机上没有空格键，点一下屏幕也能继续（同样延迟一帧再挂，避免被同一次点击吃掉）
    this.time.delayedCall(0, () => {
      this.input.once('pointerdown', () => this.closeIntro())
    })
  }

  private closeIntro() {
    if (!this.introShowing) {
      return
    }

    this.introLayer?.destroy()
    this.introLayer = null
    this.introShowing = false
    this.physics.world.resume()
  }

  private lightMonument(monument: MonumentRef) {
    monument.lit = true
    // 点亮：底座恢复砖瓦本色，碑头整段染成元素色，元素标记留白当发光刻印
    monument.pillar.setTint(0xffffff)
    monument.head.setTint(ELEMENTS[monument.element].color)
    monument.icon.setTint(0xffffff)

    this.makeMonumentAura(monument)
    this.revealFollowers(monument.id)
  }

  private monumentById(id: string) {
    return this.monumentList.find((monument) => monument.id === id) ?? null
  }

  private extinguishMonument(monument: MonumentRef) {
    monument.lit = false
    monument.pillar.setTint(0x9a9a9a)
    monument.head.setTint(0x3a3a46)
    monument.icon.setTint(0x7c8299)

    this.clearMonumentAura(monument)
  }

  // 点亮后的竖线光圈：几条元素色的细竖线紧贴方碑轮廓，持续明暗呼吸
  private makeMonumentAura(monument: MonumentRef) {
    if (monument.aura.length > 0) {
      return
    }

    const color = ELEMENTS[monument.element].color
    const x = monument.pillar.x
    const y = monument.pillar.y

    // [横向偏移, 纵向偏移, 线高]
    const lines: Array<[number, number, number]> = [
      [-17, -4, 16],
      [-17, -20, 10],
      [17, -4, 16],
      [17, -20, 10],
      [-11, -30, 6],
      [11, -30, 6],
      [0, -38, 5],
    ]

    lines.forEach(([dx, dy, height], index) => {
      const line = this.add
        .image(x + dx, y + dy, 'pixel')
        .setDisplaySize(2, height)
        .setTint(color)
        .setDepth(4)
        .setAlpha(0.45)

      this.tweens.add({
        targets: line,
        alpha: 0.95,
        duration: 900,
        yoyo: true,
        repeat: -1,
        delay: index * 90,
      })

      monument.aura.push(line)
    })
  }

  private clearMonumentAura(monument: MonumentRef) {
    monument.aura.forEach((line) => {
      this.tweens.killTweensOf(line)
      line.destroy()
    })

    monument.aura = []
  }

  private revealFollowers(id: string) {
    if (id === '') {
      return
    }

    this.monumentList.forEach((monument) => {
      if (!monument.hidden || monument.after !== id) {
        return
      }

      monument.hidden = false
      monument.pillar.setVisible(true).setAlpha(0)
      monument.head.setVisible(true).setAlpha(0)
      monument.icon.setVisible(true).setAlpha(0)

      this.tweens.add({
        targets: [monument.pillar, monument.head, monument.icon],
        alpha: 1,
        duration: 400,
      })
    })
  }

  private touchMonument(monument: MonumentRef) {
    const door = this.doorList.find(
      (item) => !item.opened && monument.id !== '' && item.needs.includes(monument.id)
    )

    if (monument.neighbors.length > 0) {
      this.lightMonument(monument)

      monument.neighbors.forEach((id) => {
        const neighbor = this.monumentById(id)

        if (!neighbor) {
          return
        }

        if (neighbor.lit) {
          this.extinguishMonument(neighbor)
        } else {
          this.lightMonument(neighbor)
        }
      })

      if (door && door.needs.every((id) => this.idReady(id))) {
        this.openDoor(door)
      }

      return
    }

    if (!door) {
      this.lightMonument(monument)
      return
    }

    if (!door.ordered) {
      this.lightMonument(monument)

      if (door.needs.every((id) => this.idReady(id))) {
        this.openDoor(door)
      }

      return
    }

    if (monument.id !== door.needs[door.progress.length]) {
      this.extinguishAll(door)
      return
    }

    this.lightMonument(monument)
    door.progress.push(monument.id)

    if (door.progress.length === door.needs.length) {
      this.openDoor(door)
    }
  }

  private extinguishAll(door: DoorRef) {
    door.progress = []

    door.needs.forEach((id) => {
      const monument = this.monumentById(id)

      if (monument) {
        this.extinguishMonument(monument)
      }
    })

    this.cameras.main.shake(240, 0.01)
    this.showMessage('五碑俱灭……顺序错了。')
  }

  private openDoor(door: DoorRef) {
    if (door.opened) {
      return
    }

    door.opened = true

    const body = door.sprite.body as Phaser.Physics.Arcade.StaticBody
    body.enable = false

    this.showMessage('门开了。')

    const doorScaleY = door.sprite.scaleY * 0.12

    this.tweens.add({
      targets: door.sprite,
      alpha: 0,
      scaleY: doorScaleY,
      duration: 420,
      ease: 'Sine.easeIn',
      onComplete: () => {
        door.sprite.destroy()
      },
    })
  }

  private showPaper(text: string) {
    if (this.paperShowing) {
      return
    }

    this.paperShowing = true
    this.physics.world.pause()
    stopAllLoops()

    const layer = this.add.container(0, 0).setDepth(220).setScrollFactor(0)

    const shade = this.add.rectangle(0, 0, 480, 270, 0x0a0a14, 0.88).setOrigin(0, 0)
    const panel = this.add.rectangle(240, 128, 400, 188, 0x1b1b2a).setStrokeStyle(2, 0xffd54f)
    const title = this.add
      .text(240, 56, '残卷', {
        fontFamily: 'sans-serif',
        fontSize: '16px',
        color: '#ffd54f',
      })
      .setOrigin(0.5)
    const body = this.add
      .text(240, 130, text, {
        fontFamily: 'sans-serif',
        fontSize: '14px',
        color: '#e8e2d0',
        align: 'center',
        lineSpacing: 10,
        wordWrap: { width: 340 },
      })
      .setOrigin(0.5)
    const tip = this.add
      .text(240, 244, this.touchMode ? '轻点屏幕收起' : '按 F 收起', {
        fontFamily: 'sans-serif',
        fontSize: '12px',
        color: '#8fa3b8',
      })
      .setOrigin(0.5)

    layer.add([shade, panel, title, body, tip])

    this.paperLayer = layer

    // 手机上没有 F 键，点一下屏幕就收起。
    // 延迟一帧再挂监听：这一次点击正是"点提示条打开纸条"的那一下，
    // 同一帧里挂上去会被这次点击立刻关掉（就是之前点了没反应的原因）
    this.time.delayedCall(0, () => {
      this.input.once('pointerdown', () => this.closePaper())
    })
  }

  private closePaper() {
    if (!this.paperShowing) {
      return
    }

    this.paperLayer?.destroy()
    this.paperLayer = null
    this.paperShowing = false
    this.physics.world.resume()
  }

  private updatePaper() {
    if (Phaser.Input.Keyboard.JustDown(this.interactKey)) {
      this.closePaper()
    }
  }

  private playCageScene() {
    if (this.cageScene || !this.cageSprite || !this.eggSprite) {
      return
    }

    this.cageScene = true
    this.cageOpened = true
    this.physics.world.pause()
    stopAllLoops()

    const cageX = this.cageSprite.x
    const cageY = this.cageSprite.y

    this.cageSprite.setTexture('cage-open')

    // 一、主角体内突然爆出一圈力量
    this.cameras.main.shake(240, 0.006)

    const ringDelays = [0, 130, 260]

    ringDelays.forEach((delay, index) => {
      this.time.delayedCall(delay, () => {
        const ring = this.add
          .image(this.slime.x, this.slime.y, 'blessing')
          .setTint(0xa8e8d4)
          .setDepth(8)
          .setScale(0.6)

        this.tweens.add({
          targets: ring,
          scale: 3.2 + index * 0.6,
          alpha: 0,
          duration: 640,
          onComplete: () => {
            ring.destroy()
          },
        })
      })
    })

    // 二、蛋开始晃
    this.time.delayedCall(620, () => {
      this.tweens.add({
        targets: this.eggSprite,
        x: cageX + 2,
        duration: 80,
        yoyo: true,
        repeat: 5,
      })
    })

    // 三、白光一闪，趁白屏把蛋换成小龙
    this.time.delayedCall(1200, () => {
      const flash = this.add
        .rectangle(0, 0, 480, 270, 0xffffff)
        .setOrigin(0, 0)
        .setScrollFactor(0)
        .setDepth(60)
        .setAlpha(0)

      this.tweens.add({
        targets: flash,
        alpha: 1,
        duration: 220,
        hold: 90,
        yoyo: true,
        onYoyo: () => {
          this.eggSprite?.destroy()
          this.eggSprite = null

          this.spawnDragonling(cageX, cageY + 6)
        },
        onComplete: () => {
          flash.destroy()
        },
      })
    })

    // 四、小龙被风托起，从穹顶的孔洞飞出去
    this.time.delayedCall(2500, () => {
      this.flyDragonlingOut()
    })
  }

  private spawnDragonling(x: number, y: number) {
    const dragon = this.add.image(x, y, 'dragonling').setDepth(1).setScale(0)

    this.dragonling = dragon

    this.tweens.add({
      targets: dragon,
      scale: 1,
      duration: 420,
      ease: 'Back.easeOut',
    })

    this.time.delayedCall(440, () => {
      this.tweens.add({
        targets: dragon,
        y: y - 14,
        duration: 320,
        yoyo: true,
      })
    })
  }

  private flyDragonlingOut() {
    const dragon = this.dragonling

    if (!dragon) {
      this.endCageScene()
      return
    }

    const holeX = this.level.dome ? this.level.dome.holeX : dragon.x

    // 飞离笼子的这一刻才提到最前面
    dragon.setDepth(8)

    const glow = this.add
      .image(dragon.x, dragon.y + 8, 'blessing')
      .setTint(0xa8e8d4)
      .setDepth(7)
      .setScale(1.6)

    this.cameras.main.stopFollow()
    this.cameras.main.pan(240, 200, 600, 'Sine.easeInOut')

    this.tweens.add({
      targets: dragon,
      x: holeX,
      y: 18,
      duration: 1200,
      ease: 'Sine.easeInOut',
      onUpdate: () => {
        glow.setPosition(dragon.x, dragon.y + 8)
      },
      onComplete: () => {
        glow.destroy()

        this.tweens.add({
          targets: dragon,
          alpha: 0,
          duration: 280,
          onComplete: () => {
            dragon.destroy()
            this.dragonling = null
          },
        })
      },
    })

    this.time.delayedCall(1900, () => {
      this.showMessage('风神：「谢谢你……去飞吧，替我看看更远的地方。」')
    })

    this.time.delayedCall(2600, () => {
      this.endCageScene()
    })
  }

  private endCageScene() {
    this.cameras.main.startFollow(this.slime, true, 0.12, 0.12)
    this.physics.world.resume()
    this.cageScene = false

    if (this.level.goal.after === 'cage') {
      this.time.delayedCall(1200, () => {
        this.revealGoal()
      })
    }
  }

  private revealGoal() {
    this.goalReady = true
    this.goalSprite.setVisible(true).setScale(0)

    const ring = this.add
      .image(this.goalSprite.x, this.goalSprite.y + 10, 'blessing')
      .setTint(0xffd54f)
      .setDepth(6)
      .setScale(0.8)

    this.tweens.add({
      targets: ring,
      scale: 3,
      alpha: 0,
      duration: 640,
      onComplete: () => {
        ring.destroy()
      },
    })

    this.tweens.add({
      targets: this.goalSprite,
      scale: 1,
      duration: 420,
      ease: 'Back.easeOut',
    })
  }

  private updateIntro() {
    if (Phaser.Input.Keyboard.JustDown(this.cursors.space)) {
      this.closeIntro()
    }
  }

  update(time: number, delta: number) {
    if (this.introShowing) {
      this.updateIntro()
      return
    }

    if (this.paperShowing) {
      this.updatePaper()
      return
    }

    if (this.cageScene) {
      return
    }

    const camera = this.cameras.main

    this.bgFar.setTilePosition(
      Math.floor(camera.scrollX * 0.15),
      Math.floor(camera.scrollY * this.bgFarY)
    )
    this.bgMid.setTilePosition(
      Math.floor(camera.scrollX * 0.35),
      Math.floor(camera.scrollY * this.bgMidY)
    )

    if (this.windmillBlades) {
      // 正角度在屏幕坐标里就是顺时针
      this.windmillBlades.rotation += (delta / 1000) * 1.2
    }

    const body = this.slime.body as Phaser.Physics.Arcade.Body
    const speed = ELEMENTS[this.element].speed
    const dt = delta / 1000

    if (Phaser.Input.Keyboard.JustDown(this.restartKey)) {
      this.scene.restart()
      return
    }

    // 键盘 + 触屏的输入边沿都在这里各读一次（JustDown/JustUp 读一次就把标记清掉，
    // 所以不能在别处再读第二遍），触屏那几个 Just 标记读完立刻清零
    const prevJust = Phaser.Input.Keyboard.JustDown(this.prevKey)
    const nextJust = Phaser.Input.Keyboard.JustDown(this.nextKey)
    const armorJust = Phaser.Input.Keyboard.JustDown(this.armorKey) || this.touchArmorJust
    const rockJustDown = Phaser.Input.Keyboard.JustDown(this.rockKey) || this.touchPillarJust
    const rockJustUp = Phaser.Input.Keyboard.JustUp(this.rockKey) || this.touchPillarUp
    const jumpJust = Phaser.Input.Keyboard.JustDown(this.cursors.space) || this.touchJumpJust

    this.touchArmorJust = false
    this.touchPillarJust = false
    this.touchPillarUp = false
    this.touchJumpJust = false

    if (!this.inputLocked) {
      if (prevJust) {
        cycleElement(-1, this.availableElements())
        this.applyElement(progress.current)
      }

      if (nextJust) {
        cycleElement(1, this.availableElements())
        this.applyElement(progress.current)
      }
    }

    if (this.invulnTimer > 0) {
      this.invulnTimer -= dt
    }

    if (this.armorCooldown > 0) {
      this.armorCooldown -= dt
    }

    if (this.armored) {
      this.armoredTimer -= dt

      if (this.armoredTimer <= 0) {
        this.setArmored(false)
      }
    }

    if (!this.inputLocked && armorJust && this.element === 'rock') {
      // 只能开：岩化中按不掉，冷却中按不了
      if (!this.armored && this.armorCooldown <= 0) {
        this.setArmored(true)
      }
    }

    // C：短按直接在身前落柱（前面放不下会自动往人身边挪）；
    // 长按进入预览状态（松手也不退出），再点一次 C 才落柱
    if (this.inputLocked) {
      this.pillarPressed = false
    } else if (this.element === 'rock') {
      if (rockJustDown) {
        if (this.pillarCharging) {
          // 预览状态里再点一次 = 放置；放不下就留在预览里继续找位置
          if (this.castPillar()) {
            this.stopPillarPreview()
          }
        } else {
          this.pillarPressed = true
          this.pillarHold = 0
        }
      }

      if (this.pillarPressed) {
        this.pillarHold += dt

        if (this.pillarHold >= PILLAR_HOLD) {
          // 长按：进预览状态，之后松手也不会退出去
          this.pillarPressed = false
          this.startPillarPreview()
        }
      }

      if (rockJustUp && this.pillarPressed) {
        // 短按：直接放
        this.pillarPressed = false
        this.castPillar()
      }
    } else if (this.pillarPressed || this.pillarCharging) {
      // 换元素时把预览收干净
      this.pillarPressed = false
      this.stopPillarPreview()
    }

    if (!this.inputLocked) {
      this.updatePlates(dt)
      this.updateLaunchers(dt)
      this.updatePillarPreview()
    }

    if (this.finished) {
      this.syncVisual(1, 1)
      return
    }

    if (this.slime.y > this.level.height + 50) {
      this.die('fall')
      return
    }

    if (this.level.spire) {
      const spireDistance = Phaser.Math.Distance.Between(
        this.slime.x,
        this.slime.y,
        this.level.spire.x,
        this.level.spire.y
      )

      if (spireDistance < this.level.spire.radius) {
        queueAchievementToast('tower-top')
      }
    }

    if (this.inputLocked) {
      // 神像演出期间原地不动
      this.slime.setVelocityX(0)
    } else if (this.cursors.left.isDown || this.touchLeft) {
      this.slime.setVelocityX(-speed)
      this.slime.setFlipX(true)
    } else if (this.cursors.right.isDown || this.touchRight) {
      this.slime.setVelocityX(speed)
      this.slime.setFlipX(false)
    } else {
      this.slime.setVelocityX(0)
    }

    const element = ELEMENTS[this.element]
    const onGround = body.blocked.down

    let prompt: string | null = null
    let action: (() => void) | null = null

    let target: MonumentRef | null = null
    let nearest = 56

    for (const monument of this.monumentList) {
      if (monument.lit || monument.hidden) {
        continue
      }

      const distance = Phaser.Math.Distance.Between(
        this.slime.x,
        this.slime.y,
        monument.pillar.x,
        monument.pillar.y
      )

      if (distance > 56 || distance > nearest) {
        continue
      }

      nearest = distance
      target = monument
    }

    if (target) {
      const monument = target

      if (this.element === monument.element) {
        prompt = this.interactPrefix() + '点亮'
        action = () => this.touchMonument(monument)
      } else {
        prompt = '需要' + ELEMENTS[monument.element].label + '元素'
      }
    }

    if (!prompt && this.noteList.length > 0) {
      for (const note of this.noteList) {
        const distance = Phaser.Math.Distance.Between(
          this.slime.x,
          this.slime.y,
          note.sprite.x,
          note.sprite.y
        )

        if (distance < 52) {
          const text = note.text

          prompt = this.interactPrefix() + note.prompt
          action = () => this.showPaper(text)
          break
        }
      }
    }

    if (!prompt && this.level.cage && !this.cageOpened) {
      const cageDistance = Phaser.Math.Distance.Between(
        this.slime.x,
        this.slime.y,
        this.level.cage.x,
        this.level.cage.y
      )

      if (cageDistance < 56) {
        prompt = this.interactPrefix() + this.level.cage.prompt
        action = () => this.playCageScene()
      }
    }

    if (!prompt && this.level.statue && this.statueSprite && !this.statueUsed) {
      const statue = this.level.statue
      const statueDistance = Phaser.Math.Distance.Between(
        this.slime.x,
        this.slime.y,
        statue.x,
        statue.y
      )

      if (statueDistance < 64) {
        prompt = this.interactPrefix() + statue.prompt
        action = () => {
          this.statueUsed = true
          this.playStatueScene(statue.grants)
        }
      }
    }

    if (!prompt) {
      const nearGoal =
        this.goalReady &&
        Phaser.Math.Distance.Between(
          this.slime.x,
          this.slime.y,
          this.goalSprite.x,
          this.goalSprite.y
        ) < 48

      if (nearGoal) {
        prompt = this.interactPrefix() + this.level.goal.prompt
        action = () => this.win()
      }
    }

    this.promptBox.setVisible(prompt !== null)
    this.promptText.setVisible(prompt !== null)

    // 手机上没有 F 键：当前这条提示能做的话，点提示条本身就等于按 F
    this.promptAction = this.inputLocked ? null : action

    if (prompt) {
      this.promptBox.setPosition(this.slime.x, this.slime.y - 34)
      this.promptText.setPosition(this.slime.x, this.slime.y - 34)
      // 触屏下把「[F] 阅读」这类提示里的按键字样去掉
      this.promptText.setText(touchText(prompt))

      // 第一次显示带 [F] 的交互提示之后，后面的提示就不再带前缀了
      if (action) {
        markHintSeen('interact')
      }

      if (!this.inputLocked && action && Phaser.Input.Keyboard.JustDown(this.interactKey)) {
        playSfx(this, 'sfx-interact', 0.3)
        action()
      }
    }

    if (this.level.chase) {
      if (!this.chased && this.slime.x > CHASE.triggerX) {
        this.chased = true
      }

      if (this.chased) {
        const chaseBody = this.chase.body as Phaser.Physics.Arcade.Body

        if (this.chase.x >= CHASE.stopX) {
          chaseBody.setVelocityX(0)
        } else {
          chaseBody.setVelocityX(CHASE.speed)
        }
      }
    }

    if (
      this.blessed &&
      this.level.blessingEndX !== undefined &&
      this.slime.x > this.level.blessingEndX
    ) {
      this.endBlessing()
    }

    if (onGround) {
      this.stamina = Math.min(STAMINA_MAX, this.stamina + HOVER.regenPerSecond * dt)
    }

    if (!this.inputLocked && jumpJust && onGround) {
      // 岩化时身体更结实，跳得也略高一点
      this.slime.setVelocityY(this.jumpPower * (this.armored ? ARMOR_JUMP : 1))
      playSfx(this, 'sfx-jump', 0.16)
    }

    const wantHover =
      !this.inputLocked &&
      element.canHover &&
      (this.cursors.space.isDown || this.touchJump) &&
      !onGround &&
      this.stamina > 0

    if (wantHover) {
      if (body.velocity.y > -HOVER.riseSpeed) {
        this.slime.setVelocityY(-HOVER.riseSpeed)
      }

      this.stamina = this.blessed
        ? STAMINA_MAX
        : Math.max(0, this.stamina - HOVER.drainPerSecond * dt)
    } else if (element.canHover && body.velocity.y > HOVER.fallSpeed) {
      this.slime.setVelocityY(HOVER.fallSpeed)
    }

    setLoop(this, 'sfx-fly', wantHover, 0.12)
    setLoop(
      this,
      'sfx-glide',
      !wantHover && element.canHover && !onGround && body.velocity.y > 0,
      0.1
    )

    if (onGround && !this.wasOnGround) {
      this.landSquash = 1
      playSfx(this, 'sfx-land', 0.15)
    }

    if (onGround && Math.abs(body.velocity.x) > 10) {
      this.stepTimer -= dt

      if (this.stepTimer <= 0) {
        this.stepTimer = 0.3
        playSfx(this, 'sfx-step', 0.16, Phaser.Math.FloatBetween(0.92, 1.08))
      }
    } else {
      this.stepTimer = 0.06
    }

    this.wasOnGround = onGround
    let flapSpeed = 420
    let flapRange = 0.12

    if (!onGround) {
      if (wantHover || body.velocity.y < 0) {
        flapSpeed = 110
        flapRange = 0.5
      } else {
        flapSpeed = 260
        flapRange = 0.3
      }
    } else if (Math.abs(body.velocity.x) > 10) {
      flapRange = 0
    }

    const wave = Math.sin(this.time.now / flapSpeed)
    this.wingOffset = Math.round(wave * flapRange * 8)

    this.landSquash = Math.max(0, this.landSquash - dt * 4)

    let sx = 1
    let sy = 1

    if (!onGround) {
      if (wantHover) {
        const wave = Math.sin(time / 140)
        sx = 0.95 + wave * 0.02
        sy = 1.06 - wave * 0.02
      } else if (element.canHover && this.stamina <= 0 && body.velocity.y > 0) {
        sx = 1.16
        sy = 0.86
      } else if (body.velocity.y < 0) {
        sx = 0.9
        sy = 1.12
      } else {
        sx = 1.1
        sy = 0.92
      }
    } else {
      const moving = Math.abs(body.velocity.x) > 10
      // 岩化后体型放大，形变幅度按倍数收回来：绝对位移、节奏都和普通态一致
      const amount =
        ((moving ? 0.05 : 0.03) * element.squash) / (this.armored ? ARMOR_GROW : 1)
      const period = moving ? 120 : 340
      const wave = Math.sin((time / period) * Math.PI * 2)

      sx = 1 + wave * amount
      sy = 1 - wave * amount
    }

    sx += this.landSquash * 0.22
    sy -= this.landSquash * 0.22

    this.blinkTimer -= delta

    if (this.blinkTimer <= 0) {
      this.blinkTimer = 1800 + Math.random() * 2200
      this.blinkScale = 0.15

      this.time.delayedCall(110, () => {
        this.blinkScale = 1
      })
    }

    this.syncVisual(sx, sy)
    this.staminaBar.setScale(this.stamina / STAMINA_MAX, 1)

    // 岩化条：岩化时是剩余时间（金色，越用越短），冷却时是回充进度（土色，长满就能再按 X）
    const showArmor = this.element === 'rock' && (this.armored || this.armorCooldown > 0)

    this.armorBarBack.setVisible(showArmor)
    this.armorBar.setVisible(showArmor)

    if (this.armored) {
      this.armorBar.setFillStyle(0xd9a441)
      this.armorBar.setScale(Math.max(0, this.armoredTimer / ARMOR_TIME), 1)
    } else {
      this.armorBar.setFillStyle(0x6b5a3a)
      this.armorBar.setScale(Math.max(0, 1 - this.armorCooldown / ARMOR_COOLDOWN), 1)
    }

    this.updateTouchVisuals()
  }

  // 触屏按键的显示：岩化冷却时灰版打底、亮版从下往上长回来；
  // 史莱姆跑到按键底下时整体淡下去，保证不挡视野
  private updateTouchVisuals() {
    if (this.touchButtons.length === 0) {
      return
    }

    if (this.touchArmorFill) {
      const ready = this.armorCooldown <= 0
      const ratio = ready ? 1 : Math.max(0, 1 - this.armorCooldown / ARMOR_COOLDOWN)
      const show = this.rockAvailable && ratio > 0.002

      if (show) {
        // setCrop 的原点在贴图左上角：裁出下面这一块，就是自下而上回充
        this.touchArmorFill.setCrop(0, 36 * (1 - ratio), 36, 36 * ratio)
      }

      this.touchArmorFill.setVisible(show)
    }

    const camera = this.cameras.main
    const screenX = this.slime.x - camera.scrollX
    const screenY = this.slime.y - camera.scrollY

    this.touchButtons.forEach((button) => {
      if (button.image === this.touchArmorFill) {
        return
      }

      const near =
        Math.abs(screenX - button.x) < button.r + 22 &&
        Math.abs(screenY - button.y) < button.r + 22

      button.image.setAlpha(near ? button.base * 0.3 : button.base)
    })

    if (this.touchArmorFill) {
      this.touchArmorFill.setAlpha(this.touchArmorDim?.alpha ?? 0.62)
    }
  }
}
