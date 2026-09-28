import Phaser from 'phaser'
import { ELEMENTS, type ElementKey } from '../data/elements'
import { LEVELS, type LevelDef } from '../data/levels'
import { progress, unlockElement, cycleElement, recordClear } from '../state/progress'

const HOVER = {
  maxRise: 100,
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
  private wasOnGround = false

  private element: ElementKey = 'none'
  private jumpPower = -260
  private stamina = STAMINA_MAX
  private hoverOriginY = 0

  private bgFar!: Phaser.GameObjects.TileSprite
  private bgMid!: Phaser.GameObjects.TileSprite

  private blessings!: Phaser.Physics.Arcade.StaticGroup
  private staminaGlowOuter!: Phaser.GameObjects.Rectangle
  private staminaGlow!: Phaser.GameObjects.Rectangle
  private blessed = false

  private finished = false

  private hazards!: Phaser.Physics.Arcade.StaticGroup
  private dying = false

  private introShowing = false
  private introLayer: Phaser.GameObjects.Container | null = null

  private chase!: Phaser.Physics.Arcade.Image
  private chased = false

  private interactKey!: Phaser.Input.Keyboard.Key
  private goalSprite!: Phaser.Physics.Arcade.Sprite
  private promptBox!: Phaser.GameObjects.Rectangle
  private promptText!: Phaser.GameObjects.Text

  private monuments!: Phaser.Physics.Arcade.StaticGroup
  private monumentList: MonumentRef[] = []

  private gates!: Phaser.Physics.Arcade.StaticGroup
  private doorList: DoorRef[] = []
  private noteList: NoteRef[] = []
  private paperShowing = false
  private paperLayer: Phaser.GameObjects.Container | null = null

  private wingLeft!: Phaser.GameObjects.Image
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
    this.wasOnGround = false
    this.collectedIndices = []
    this.blessed = false
    this.dying = false

    this.trailFade = 0
    this.introShowing = false
    this.introLayer = null
    this.paperShowing = false
    this.paperLayer = null

    this.cameras.main.setZoom(1)

    this.chased = false
    this.platforms = this.physics.add.staticGroup()
    this.orbs = this.physics.add.staticGroup()

    this.bgFar = this.add.tileSprite(0, 165, 480, 105, 'bg-far').setOrigin(0, 0).setScrollFactor(0)
    this.bgMid = this.add.tileSprite(0, 190, 480, 80, 'bg-mid').setOrigin(0, 0).setScrollFactor(0)

    this.gems = this.physics.add.staticGroup()
    this.blessings = this.physics.add.staticGroup()
    this.hazards = this.physics.add.staticGroup()

    this.monuments = this.physics.add.staticGroup()

    this.level.platforms.forEach((def) => {
      const platform = this.platforms.create(def.x, def.y, 'pixel') as Phaser.Physics.Arcade.Sprite
      platform.setDisplaySize(def.width, def.height)
      platform.setTint(def.crumble ? 0x6b4a3a : def.oneWay ? 0x3a4a5e : 0x2c3e50)
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

    this.level.hints.forEach((hint) => {
      this.add
        .text(hint.x, hint.y, hint.text, {
          fontFamily: 'sans-serif',
          fontSize: '14px',
          color: '#8fa3b8',
        })
        .setOrigin(0.5)
    })

    const savedGems = progress.levelGems[progress.levelIndex] ?? []

    this.level.gems.forEach((spot, index) => {
      if (savedGems.includes(index)) {
        return
      }

    const gem = this.gems.create(spot.x, spot.y, 'gem') as Phaser.Physics.Arcade.Sprite
      gem.setTint(0x6ec6ff)
      gem.setData('index', index)
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

    this.slime = this.physics.add.sprite(this.level.spawn.x, this.level.spawn.y, 'slime-none')
    this.slime.setBounce(0.2)
    this.slime.setCollideWorldBounds(true)
    this.slime.setVisible(false)

    this.slimeArt = this.add.image(this.level.spawn.x, this.level.spawn.y, 'slime-none')

    this.wingLeft = this.add.image(0, 0, 'wing')
    this.wingRight = this.add.image(0, 0, 'wing')
    
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

      if (!progress.gemStorySeen) {
        progress.gemStorySeen = true
        this.showMessage('透过这颗天蓝色的四角晶石，我仿佛看到了家乡的影子……')
      }
    })

    this.physics.add.overlap(this.slime, this.blessings, (_slime, item) => {
      const sprite = item as Phaser.Physics.Arcade.Sprite
      sprite.destroy()
      this.grantBlessing()
    })

    this.monumentList = []

    this.level.monuments.forEach((def) => {
      const pillar = this.monuments.create(def.x, def.y, 'monument') as Phaser.Physics.Arcade.Sprite
      pillar.setTint(0x2a2a3a)

      const icon = this.add.image(def.x, def.y - 16, 'icon-' + def.element).setScale(0.5)
      icon.setTint(0x3a3a4e)

      const hidden = def.after !== undefined

      if (hidden) {
        pillar.setVisible(false)
        icon.setVisible(false)
      }

      const startLit = def.startLit === true

      if (startLit) {
        pillar.setTint(0x9a8a6a)
        icon.setTint(ELEMENTS[def.element].color)
      }

      this.monumentList.push({
        pillar,
        icon,
        element: def.element,
        id: def.id ?? '',
        after: def.after,
        lit: startLit,
        hidden,
        neighbors: def.neighbors ?? [],
      })
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
      const sprite = this.add.image(def.x, def.y, 'paper')

      this.noteList.push({ sprite, prompt: def.prompt, text: def.text })
    })

    this.level.hazards.forEach((def) => {
    const gapTop = def.gapY - HAZARD.gapHeight / 2
    const gapBottom = def.gapY + HAZARD.gapHeight / 2
    const bottomHeight = this.level.height - gapBottom

    const upper = this.hazards.create(def.x, gapTop / 2, 'pixel') as Phaser.Physics.Arcade.Sprite
    upper.setDisplaySize(HAZARD.width, gapTop)
    upper.setTint(0xb03a3a)
    upper.refreshBody()

    const lower = this.hazards.create(
        def.x,
        gapBottom + bottomHeight / 2,
        'pixel'
      ) as Phaser.Physics.Arcade.Sprite
      lower.setDisplaySize(HAZARD.width, bottomHeight)
      lower.setTint(0xb03a3a)
      lower.refreshBody()
    })

    this.physics.add.overlap(this.slime, this.hazards, () => {
      this.die('hazard')
    })


    this.elementIcon = this.add.image(18, 18, 'icon-none').setScrollFactor(0)

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
      .rectangle(10, 38, 70, 16, 0x6b5210)
      .setOrigin(0, 0.5)
      .setScrollFactor(0)
      .setVisible(false)

    this.staminaGlow = this.add
      .rectangle(10, 38, 68, 14, 0xffd54f)
      .setOrigin(0, 0.5)
      .setScrollFactor(0)
      .setVisible(false)

    this.staminaBar = this.add
      .rectangle(10, 38, 60, 6, 0x74d0b0)
      .setOrigin(0, 0.5)
      .setScrollFactor(0)
    
    const gemTotal = this.level.gems.length
    const gemStartX = 480 - 20 - (gemTotal - 1) * 18

    this.gemIcons = this.level.gems.map((_spot, index) =>
      this.add.image(gemStartX + index * 18, 18, 'gem').setScrollFactor(0).setTint(0x33333f)
    )

    this.add
      .text(10, 56, 'Esc  设置', {
        fontFamily: 'sans-serif',
        fontSize: '12px',
        color: '#6a7a8e',
      })
      .setScrollFactor(0)

    this.cursors = this.input.keyboard!.createCursorKeys()
    this.restartKey = this.input.keyboard!.addKey('R')
    this.prevKey = this.input.keyboard!.addKey('Q')
    this.nextKey = this.input.keyboard!.addKey('E')
    this.interactKey = this.input.keyboard!.addKey('F')

    progress.current = this.level.startElement
    this.applyElement(this.level.startElement)
    this.refreshGemHud()

    this.showIntro(this.level.intro)

    if (this.level.chase) {
      this.chase = this.physics.add.image(-40, this.level.height / 2, 'pixel')
      this.chase.setDisplaySize(60, this.level.height)
      this.chase.setTint(0x8a2b2b)

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

    this.wingLeft.setTint(element.color)
    this.wingRight.setTint(element.color)
    this.element = key
    this.jumpPower = element.jump
    this.slimeArt.setTexture('slime-' + key)
    this.eyes.forEach((eye) => eye.setTint(element.eyeColor))
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

    if (this.level.goal.kind === 'chest') {
      this.goalSprite.setTexture('chest-open')
    }

    const granted = this.level.goal.grants

    if (this.level.goal.kind === 'statue' && granted) {
      this.playStatueScene(granted)
      return
    }

    if (this.level.goal.kind === 'chest') {
      this.goalSprite.setTexture('chest-open')
    }

    this.time.delayedCall(900, () => {
      this.scene.start('result')
    })
  }

  private playStatueScene(granted: ElementKey) {
    unlockElement(granted)

    this.cameras.main.stopFollow()
    this.cameras.main.pan(
      (this.slime.x + this.goalSprite.x) / 2,
      this.slime.y - 30,
      600,
      'Sine.easeInOut'
    )
    this.cameras.main.zoomTo(1.8, 600, 'Sine.easeInOut')

    const orb = this.add
      .image(this.goalSprite.x, this.goalSprite.y - 46, 'icon-' + granted)
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

        this.time.delayedCall(400, () => {
          this.scene.start('result')
        })
      },
    })
  }

  private syncVisual(sx: number, sy: number) {
    this.slimeArt.setPosition(this.slime.x, this.slime.y)
    this.slimeArt.setFlipX(this.slime.flipX)
    this.slimeArt.setScale(sx, sy)

    const look = this.slime.flipX ? -2 : 2

    this.eyes[0].setPosition(this.slime.x + (-5 + look) * sx, this.slime.y - 2 * sy)
    this.eyes[1].setPosition(this.slime.x + (5 + look) * sx, this.slime.y - 2 * sy)
    this.eyes.forEach((eye) => eye.setScale(1, this.blinkScale))
    const hasWing = ELEMENTS[this.element].wing

    this.wingLeft.setVisible(hasWing)
    this.wingRight.setVisible(hasWing)

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
    if (this.dying) {
      return
    }

    this.dying = true
    this.scene.pause()
    this.scene.launch('dead', { cause })
  }

  private showIntro(text: string) {
    this.introShowing = true
    this.physics.world.pause()

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
    monument.pillar.setTint(0x9a8a6a)
    monument.icon.setTint(ELEMENTS[monument.element].color)

    this.revealFollowers(monument.id)
  }

  private monumentById(id: string) {
    return this.monumentList.find((monument) => monument.id === id) ?? null
  }

  private extinguishMonument(monument: MonumentRef) {
    monument.lit = false
    monument.pillar.setTint(0x2a2a3a)
    monument.icon.setTint(0x3a3a4e)
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

    const camera = this.cameras.main

    this.bgFar.setTilePosition(Math.floor(camera.scrollX * 0.15), 0)
    this.bgMid.setTilePosition(Math.floor(camera.scrollX * 0.35), 0)

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

    if (this.finished) {
      this.syncVisual(1, 1)
      return
    }

    if (this.slime.y > this.level.height + 50) {
      this.die('fall')
      return
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

    if (!prompt) {
      const nearGoal =
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
      this.hoverOriginY = this.slime.y
      this.stamina = Math.min(STAMINA_MAX, this.stamina + HOVER.regenPerSecond * dt)
    }

    if (Phaser.Input.Keyboard.JustDown(this.cursors.space) && onGround) {
      this.slime.setVelocityY(this.jumpPower)
    }

    const wantHover =
      element.canHover && this.cursors.space.isDown && !onGround && this.stamina > 0

    if (wantHover) {
      const risen = this.hoverOriginY - this.slime.y

      if (risen < HOVER.maxRise) {
        body.setAllowGravity(true)

        if (body.velocity.y > -HOVER.riseSpeed) {
          this.slime.setVelocityY(-HOVER.riseSpeed)
        }
      } else {
        body.setAllowGravity(false)
        this.slime.setVelocityY(0)
      }

      this.stamina = this.blessed
        ? STAMINA_MAX
        : Math.max(0, this.stamina - HOVER.drainPerSecond * dt)
      } else {
      body.setAllowGravity(true)

      if (element.canHover && body.velocity.y > HOVER.fallSpeed) {
        this.slime.setVelocityY(HOVER.fallSpeed)
      }
    }

    if (onGround && !this.wasOnGround) {
      this.landSquash = 1
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
      const amount = moving ? 0.05 : 0.03
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
