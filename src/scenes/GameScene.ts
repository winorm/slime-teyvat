import Phaser from 'phaser'
import { ELEMENTS, type ElementKey } from '../data/elements'
import {
  LEVELS,
  THEME_COLORS,
  type LevelDef,
  type DomeDef,
  type PlatformDef,
} from '../data/levels'
import { progress, unlockElement, cycleElement, recordClear, saveProgress } from '../state/progress'
import { playMusic, playSfx, setLoop, stopAllLoops } from '../state/audio'
import { queueAchievementToast } from '../state/achievements'

const HOVER = {
  riseSpeed: 70,
  fallSpeed: 35,
  drainPerSecond: 30,
  regenPerSecond: 80,
}

const STAMINA_MAX = 100

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
  private elementIcon!: Phaser.GameObjects.Image

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
  private invulnTimer = 0
  private rockPillar: Phaser.Physics.Arcade.Sprite | null = null
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
  private promptBox!: Phaser.GameObjects.Rectangle
  private promptText!: Phaser.GameObjects.Text

  private monuments!: Phaser.Physics.Arcade.StaticGroup
  private monumentList: MonumentRef[] = []

  private gates!: Phaser.Physics.Arcade.StaticGroup
  private doorList: DoorRef[] = []
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
  private wingRight!: Phaser.GameObjects.Image
  private wingOffset = 0

  private windTrails: Phaser.GameObjects.Image[] = []
  private trailFade = 0

  constructor() {
    super('game')
  }

  create() {
    this.level = LEVELS[progress.levelIndex]
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

    this.cameras.main.setZoom(1)

    this.chased = false
    this.platforms = this.physics.add.staticGroup()
    this.orbs = this.physics.add.staticGroup()

    const theme = this.level.bg ?? 'field'
    const palette = THEME_COLORS[theme]

    // 塔内的墙要跟相机 1:1 地往上走，每层的窗户才对得上楼层；户外的纵向几乎不动
    this.bgFarY = theme === 'tower' ? 1 : 0.2
    this.bgMidY = theme === 'tower' ? 1 : 0.45

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

    this.gems = this.physics.add.staticGroup()
    this.blessings = this.physics.add.staticGroup()
    this.hazards = this.physics.add.staticGroup()

    this.monuments = this.physics.add.staticGroup()

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

      this.statueSprite = this.add
        .image(statue.x, statue.y, 'statue')
        .setTint(ELEMENTS[statue.grants].color)
    }

    this.slime = this.physics.add.sprite(this.level.spawn.x, this.level.spawn.y, 'slime-none')
    this.slime.setBounce(0.2)
    this.slime.setCollideWorldBounds(true)
    this.slime.setVisible(false)

    this.slimeArt = this.add.image(this.level.spawn.x, this.level.spawn.y, 'slime-none')

    this.wingLeft = this.add.image(0, 0, 'wing')
    this.wingRight = this.add.image(0, 0, 'wing')
    this.rockCrown = this.add.image(0, 0, 'rock-crown').setDepth(9).setVisible(false)
    
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
      pillar.setTint(0x474d61)

      const icon = this.add.image(def.x, def.y - 16, 'icon-' + def.element).setScale(0.5)
      icon.setTint(0x7c8299)

      const hidden = def.after !== undefined

      if (hidden) {
        pillar.setVisible(false)
        icon.setVisible(false)
      }

      const startLit = def.startLit === true

      if (startLit) {
        pillar.setTint(0x1f7f9c)
        icon.setTint(ELEMENTS[def.element].color)
      }

      const monument: MonumentRef = {
        pillar,
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

    this.physics.add.overlap(this.slime, this.hazards, (_slime, hazard) => {
      this.die('hazard', (hazard as Phaser.Physics.Arcade.Sprite).x)
    })


    // 左上角从上到下：设置齿轮、元素图标、体力条
    const settingsIcon = this.add
      .image(18, 16, 'gear')
      .setScrollFactor(0)
      .setTint(0x8fa3b8)
      .setInteractive({ useHandCursor: true })

    settingsIcon.on('pointerdown', () => {
      this.scene.pause()
      this.scene.launch('pause')
    })

    this.elementIcon = this.add.image(18, 40, 'icon-none').setScrollFactor(0)

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

    this.armored = false
    this.armoredTimer = 0
    this.invulnTimer = 0
    this.rockPillar = null

    progress.current = this.level.startElement
    this.applyElement(this.level.startElement)
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
        this.die('crush', this.chase.x)
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
  private makeHint(x: number, y: number, text: string) {
    const label = this.add
      .text(x, y, text, {
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

  private refreshHud() {
    const element = ELEMENTS[this.element]
    const iconKey = 'icon-' + this.element

    this.elementIcon.setTexture(this.textures.exists(iconKey) ? iconKey : 'icon-none')
    this.elementIcon.setTint(element.color)
    this.staminaBar.setVisible(element.canHover)
    this.staminaBar.setFillStyle(element.color)
  }

  private applyElement(key: ElementKey) {
    const element = ELEMENTS[key]

    // 换元素会退出岩化
    this.armored = false
    this.armoredTimer = 0

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

  private playStatueScene(granted: ElementKey) {
    unlockElement(granted)

    // 演出以神像为中心：没有独立神像时（旧数据）退回用终点
    const source = this.statueSprite ?? this.goalSprite

    this.cameras.main.stopFollow()
    this.cameras.main.pan(
      (this.slime.x + source.x) / 2,
      this.slime.y - 30,
      600,
      'Sine.easeInOut'
    )
    this.cameras.main.zoomTo(1.8, 600, 'Sine.easeInOut')

    const orb = this.add
      .image(source.x, source.y - 46, 'icon-' + granted)
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

  // 眼睛颜色：平时用元素的眼珠色，岩化时换成亮金，保证在深色身体上也看得清
  private refreshEyeTint() {
    this.eyes.forEach((eye) => eye.setTint(ELEMENTS[this.element].eyeColor))
  }

  // 岩化：换成结晶态，能挡一次造物伤害，4 秒后自动解除
  private setArmored(on: boolean) {
    if (this.armored === on) {
      return
    }

    this.armored = on
    this.armoredTimer = on ? 4 : 0
    this.slimeArt.setTexture(on ? 'slime-rock-armored' : 'slime-' + this.element)
    this.refreshEyeTint()

    playSfx(this, 'sfx-interact', 0.35)
  }

  // 岩造物：在身前立一根高石柱，可以踩着往上跳，6 秒后消失
  private spawnRockPillar() {
    this.rockPillar?.destroy()

    const x = this.slime.x + (this.slime.flipX ? -30 : 30)
    const y = this.slime.y + 10
    const pillar = this.platforms.create(x, y, 'pixel') as Phaser.Physics.Arcade.Sprite

    pillar.setDisplaySize(20, 72)
    pillar.setTint(THEME_COLORS[this.level.bg ?? 'field'].ground)
    pillar.refreshBody()

    this.rockPillar = pillar
    playSfx(this, 'sfx-gem', 0.4)

    this.time.delayedCall(6000, () => {
      if (this.rockPillar === pillar) {
        this.rockPillar = null
      }

      pillar.destroy()
    })
  }

  private syncVisual(sx: number, sy: number) {
    // 岩化时整体放大一圈，像个石墩。放大是绕贴图中心做的，所以贴图要往上提一点，
    // 脚底才不会陷进地面
    const grow = this.armored ? 1.15 : 1
    const scaleX = sx * grow
    const scaleY = sy * grow
    const growLift = 14.5 * (grow - 1)

    this.slimeArt.setPosition(this.slime.x, this.slime.y - growLift)
    this.slimeArt.setFlipX(this.slime.flipX)
    this.slimeArt.setScale(scaleX, scaleY)

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

  private die(cause: string, sourceX?: number) {
    if (this.dying || this.invulnTimer > 0) {
      return
    }

    // 岩化能挡一次"造物伤害"（红闸门、崩塌的墙），摔落不算
    if (this.armored && cause !== 'fall') {
      this.setArmored(false)
      this.invulnTimer = 1.2
      this.showMessage('岩壳替你挡下了一击')

      if (sourceX !== undefined) {
        this.slime.setPosition(this.slime.x > sourceX ? sourceX + 44 : sourceX - 44, this.slime.y)
        this.slime.setVelocity(0, 0)
      }

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
      .text(240, 232, '按 空格 继续', {
        fontFamily: 'sans-serif',
        fontSize: '12px',
        color: '#8fa3b8',
      })
      .setOrigin(0.5)

    layer.add([shade, body, tip])

    this.introLayer = layer
  }

  private lightMonument(monument: MonumentRef) {
    monument.lit = true
    monument.pillar.setTint(0x1f7f9c)
    monument.icon.setTint(ELEMENTS[monument.element].color)

    this.makeMonumentAura(monument)
    this.revealFollowers(monument.id)
  }

  private monumentById(id: string) {
    return this.monumentList.find((monument) => monument.id === id) ?? null
  }

  private extinguishMonument(monument: MonumentRef) {
    monument.lit = false
    monument.pillar.setTint(0x474d61)
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
      monument.icon.setVisible(true).setAlpha(0)

      this.tweens.add({
        targets: [monument.pillar, monument.icon],
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

      if (door && door.needs.every((id) => this.monumentById(id)?.lit === true)) {
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

      if (door.needs.every((id) => this.monumentById(id)?.lit === true)) {
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
      .text(240, 244, '按 F 收起', {
        fontFamily: 'sans-serif',
        fontSize: '12px',
        color: '#8fa3b8',
      })
      .setOrigin(0.5)

    layer.add([shade, panel, title, body, tip])

    this.paperLayer = layer
  }

  private updatePaper() {
    if (Phaser.Input.Keyboard.JustDown(this.interactKey)) {
      this.paperLayer?.destroy()
      this.paperLayer = null
      this.paperShowing = false
      this.physics.world.resume()
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
      this.introLayer?.destroy()
      this.introLayer = null
      this.introShowing = false
      this.physics.world.resume()
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

    if (Phaser.Input.Keyboard.JustDown(this.prevKey)) {
      cycleElement(-1)
      this.applyElement(progress.current)
    }

    if (Phaser.Input.Keyboard.JustDown(this.nextKey)) {
      cycleElement(1)
      this.applyElement(progress.current)
    }

    if (this.invulnTimer > 0) {
      this.invulnTimer -= dt
    }

    if (this.armored) {
      this.armoredTimer -= dt

      if (this.armoredTimer <= 0) {
        this.setArmored(false)
      }
    }

    if (Phaser.Input.Keyboard.JustDown(this.armorKey) && this.element === 'rock') {
      this.setArmored(!this.armored)
    }

    if (Phaser.Input.Keyboard.JustDown(this.rockKey) && this.element === 'rock') {
      this.spawnRockPillar()
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

    if (this.cursors.left.isDown) {
      this.slime.setVelocityX(-speed)
      this.slime.setFlipX(true)
    } else if (this.cursors.right.isDown) {
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
        prompt = '[F] 点亮'
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

          prompt = '[F] ' + note.prompt
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
        prompt = '[F] ' + this.level.cage.prompt
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
        prompt = '[F] ' + statue.prompt
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
        prompt = '[F] ' + this.level.goal.prompt
        action = () => this.win()
      }
    }

    this.promptBox.setVisible(prompt !== null)
    this.promptText.setVisible(prompt !== null)

    if (prompt) {
      this.promptBox.setPosition(this.slime.x, this.slime.y - 34)
      this.promptText.setPosition(this.slime.x, this.slime.y - 34)
      this.promptText.setText(prompt)

      if (action && Phaser.Input.Keyboard.JustDown(this.interactKey)) {
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

    if (Phaser.Input.Keyboard.JustDown(this.cursors.space) && onGround) {
      this.slime.setVelocityY(this.jumpPower)
      playSfx(this, 'sfx-jump', 0.16)
    }

    const wantHover =
      element.canHover && this.cursors.space.isDown && !onGround && this.stamina > 0

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
      const amount = (moving ? 0.05 : 0.03) * element.squash
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
  }
}
