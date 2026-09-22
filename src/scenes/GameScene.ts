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
  private finished = false

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

    this.platforms = this.physics.add.staticGroup()
    this.orbs = this.physics.add.staticGroup()
    this.gems = this.physics.add.staticGroup()

    this.level.platforms.forEach((def) => {
      const platform = this.platforms.create(def.x, def.y, 'pixel') as Phaser.Physics.Arcade.Sprite
      platform.setDisplaySize(def.width, def.height)
      platform.setTint(0x2c3e50)
      platform.refreshBody()
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
      gem.setTint(0xffd54f)
      gem.setData('index', index)
    })

    this.level.orbs.forEach((def) => {
      const orb = this.orbs.create(def.x, def.y, 'orb') as Phaser.Physics.Arcade.Sprite
      orb.setTint(ELEMENTS[def.element].color)
      orb.setData('element', def.element)
    })

    const goal = this.level.goal
    const goalColor = goal.grants ? ELEMENTS[goal.grants].color : 0xffd54f
    const goalSprite = this.physics.add.staticSprite(goal.x, goal.y, goal.kind)
    goalSprite.setTint(goalColor)

    this.slime = this.physics.add.sprite(this.level.spawn.x, this.level.spawn.y, 'slime-none')
    this.slime.setBounce(0.2)
    this.slime.setCollideWorldBounds(true)
    this.slime.setVisible(false)

    this.slimeArt = this.add.image(this.level.spawn.x, this.level.spawn.y, 'slime-none')
    this.eyes = [this.add.image(0, 0, 'eye'), this.add.image(0, 0, 'eye')]
    this.physics.world.setBounds(0, 0, this.level.width, 600)
    this.cameras.main.setBounds(0, 0, this.level.width, 270)
    this.cameras.main.startFollow(this.slime, true, 0.12, 0.12)

    this.physics.add.collider(this.slime, this.platforms)

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
    })

    this.physics.add.overlap(this.slime, goalSprite, () => {
      this.win()
    })

    this.elementIcon = this.add.image(18, 18, 'icon-none').setScrollFactor(0)

    this.staminaBar = this.add
      .rectangle(10, 38, 60, 6, 0x74d0b0)
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

    progress.current = this.level.startElement
    this.applyElement(this.level.startElement)
    this.refreshGemHud()
    
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
    this.slime.setVelocityX(0)
    this.slime.setVelocityY(-160)

    const granted = this.level.goal.grants

    if (granted) {
      unlockElement(granted)
      this.applyElement(granted)
    }

    this.time.delayedCall(600, () => {
      this.scene.start('result')
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
  }

  private refreshGemHud() {
    const saved = progress.levelGems[progress.levelIndex] ?? []

    this.gemIcons.forEach((icon, index) => {
      const lit = saved.includes(index) || this.collectedIndices.includes(index)
      icon.setTint(lit ? 0xffd54f : 0x33333f)
    })
  }

  update(time: number, delta: number) {
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
      this.syncVisual(1, 1)
      return
    }

    if (this.slime.y > 320) {
      this.scene.restart()
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

    if (onGround && !this.wasOnGround) {
      this.landSquash = 1
    }

    this.wasOnGround = onGround
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