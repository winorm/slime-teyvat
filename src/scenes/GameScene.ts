import Phaser from 'phaser'
import { ELEMENTS, type ElementKey } from '../data/elements'
import { progress, unlockElement, cycleElement } from '../state/progress'

const HOVER = {
  maxRise: 100,
  riseSpeed: 70,
  fallSpeed: 35,
  drainPerSecond: 30,
  regenPerSecond: 80,
}

const STAMINA_MAX = 100

type PlatformDef = {
  x: number
  y: number
  width: number
  height: number
}

type OrbDef = {
  x: number
  y: number
  element: ElementKey
}

type LevelDef = {
  startElement: ElementKey
  spawn: { x: number; y: number }
  goal: { x: number; y: number }
  platforms: PlatformDef[]
  orbs: OrbDef[]
}

const LEVEL: LevelDef = {
  startElement: 'none',
  spawn: { x: 60, y: 150 },
  goal: { x: 400, y: 158 },
  platforms: [
    { x: 240, y: 258, width: 480, height: 24 },
    { x: 360, y: 176, width: 160, height: 12 },
  ],
  orbs: [{ x: 90, y: 225, element: 'wind' }],
}

export class GameScene extends Phaser.Scene {
  private slime!: Phaser.Physics.Arcade.Sprite
  private platforms!: Phaser.Physics.Arcade.StaticGroup
  private orbs!: Phaser.Physics.Arcade.StaticGroup
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys
  private restartKey!: Phaser.Input.Keyboard.Key
  private prevKey!: Phaser.Input.Keyboard.Key
  private nextKey!: Phaser.Input.Keyboard.Key
  private staminaBar!: Phaser.GameObjects.Rectangle
  private elementText!: Phaser.GameObjects.Text

  private element: ElementKey = 'none'
  private jumpPower = -260
  private stamina = STAMINA_MAX
  private hoverOriginY = 0
  private finished = false

  constructor() {
    super('game')
  }

  create() {
    this.finished = false
    this.stamina = STAMINA_MAX

    this.platforms = this.physics.add.staticGroup()
    this.orbs = this.physics.add.staticGroup()

    LEVEL.platforms.forEach((def) => {
      const platform = this.platforms.create(def.x, def.y, 'pixel') as Phaser.Physics.Arcade.Sprite
      platform.setDisplaySize(def.width, def.height)
      platform.setTint(0x2c3e50)
      platform.refreshBody()
    })

    LEVEL.orbs.forEach((def) => {
      const orb = this.orbs.create(def.x, def.y, 'orb') as Phaser.Physics.Arcade.Sprite
      orb.setTint(ELEMENTS[def.element].color)
      orb.setData('element', def.element)
    })

    const goal = this.physics.add.staticSprite(LEVEL.goal.x, LEVEL.goal.y, 'goal')
    goal.setTint(0xffd54f)

    this.slime = this.physics.add.sprite(LEVEL.spawn.x, LEVEL.spawn.y, 'slime')
    this.slime.setBounce(0.2)
    this.slime.setCollideWorldBounds(true)

    this.physics.add.collider(this.slime, this.platforms)

    this.physics.add.overlap(this.slime, this.orbs, (_slime, orb) => {
      const orbSprite = orb as Phaser.Physics.Arcade.Sprite
      this.absorb(orbSprite.getData('element') as ElementKey)
      orbSprite.destroy()
    })

    this.physics.add.overlap(this.slime, goal, () => {
      this.win()
    })

    this.elementText = this.add
      .text(14, 10, '', {
        fontFamily: 'sans-serif',
        fontSize: '16px',
        color: '#ffffff',
      })
      .setScrollFactor(0)

    this.staminaBar = this.add
      .rectangle(14, 36, 60, 6, 0x74d0b0)
      .setOrigin(0, 0.5)
      .setScrollFactor(0)

    this.cursors = this.input.keyboard!.createCursorKeys()
    this.restartKey = this.input.keyboard!.addKey('R')
    this.prevKey = this.input.keyboard!.addKey('Q')
    this.nextKey = this.input.keyboard!.addKey('E')

    progress.current = LEVEL.startElement
    this.applyElement(LEVEL.startElement)
  }

  private refreshHud() {
    const element = ELEMENTS[this.element]

    this.elementText.setText('元素：' + element.label)
    this.staminaBar.setVisible(element.canHover)
    this.staminaBar.setFillStyle(element.color)
  }

  private applyElement(key: ElementKey) {
    const element = ELEMENTS[key]

    this.element = key
    this.jumpPower = element.jump
    this.slime.setTint(element.color)
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
    this.slime.setVelocity(0, 0)
    this.slime.setTint(0xffd54f)

    this.time.delayedCall(400, () => {
      this.scene.start('result')
    })
  }

  update(_time: number, delta: number) {
    const body = this.slime.body as Phaser.Physics.Arcade.Body
    const speed = 120
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

      this.stamina = Math.max(0, this.stamina - HOVER.drainPerSecond * dt)
    } else {
      body.setAllowGravity(true)

      if (element.canHover && body.velocity.y > HOVER.fallSpeed) {
        this.slime.setVelocityY(HOVER.fallSpeed)
      }
    }

    this.staminaBar.setScale(this.stamina / STAMINA_MAX, 1)
  }
}