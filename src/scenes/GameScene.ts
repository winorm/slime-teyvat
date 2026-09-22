import Phaser from 'phaser'

type ElementKey = 'fire' | 'thunder' | 'ice'

type ElementDef = {
  color: number
  jump: number
}

const ELEMENTS: Record<ElementKey, ElementDef> = {
  fire: { color: 0xff7043, jump: -700 },
  thunder: { color: 0xb388ff, jump: -520 },
  ice: { color: 0x81d4fa, jump: -420 },
}

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
  spawn: { x: number; y: number }
  goal: { x: number; y: number }
  platforms: PlatformDef[]
  orbs: OrbDef[]
}

const LEVEL: LevelDef = {
  spawn: { x: 120, y: 300 },
  goal: { x: 680, y: 300 },
  platforms: [
    { x: 480, y: 530, width: 960, height: 20 },
    { x: 300, y: 440, width: 200, height: 20 },
    { x: 620, y: 350, width: 200, height: 20 },
  ],
  orbs: [
    { x: 170, y: 470, element: 'fire' },
    { x: 300, y: 390, element: 'thunder' },
    { x: 560, y: 300, element: 'ice' },
  ],
}

export class GameScene extends Phaser.Scene {
  private slime!: Phaser.Physics.Arcade.Sprite
  private platforms!: Phaser.Physics.Arcade.StaticGroup
  private orbs!: Phaser.Physics.Arcade.StaticGroup
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys
  private restartKey!: Phaser.Input.Keyboard.Key
  private jumpPower = -520
  private finished = false

  constructor() {
    super('game')
  }

  create() {
    this.jumpPower = -520
    this.finished = false

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

    this.slime = this.physics.add.sprite(LEVEL.spawn.x, LEVEL.spawn.y, 'slime')
    this.slime.setTint(0x7be0a8)
    this.slime.setBounce(0.2)
    this.slime.setCollideWorldBounds(true)

    const goal = this.physics.add.staticSprite(LEVEL.goal.x, LEVEL.goal.y, 'goal')
    goal.setTint(0xffd54f)

    this.physics.add.collider(this.slime, this.platforms)

    this.physics.add.overlap(this.slime, this.orbs, (_slime, orb) => {
      const orbSprite = orb as Phaser.Physics.Arcade.Sprite
      this.absorb(orbSprite.getData('element') as ElementKey)
      orbSprite.destroy()
    })

    this.physics.add.overlap(this.slime, goal, () => {
      this.win()
    })

    this.cursors = this.input.keyboard!.createCursorKeys()
    this.restartKey = this.input.keyboard!.addKey('R')
  }

  private absorb(key: ElementKey) {
    const element = ELEMENTS[key]
    this.slime.setTint(element.color)
    this.jumpPower = element.jump
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

  update() {
    const body = this.slime.body as Phaser.Physics.Arcade.Body
    const speed = 240

    if (Phaser.Input.Keyboard.JustDown(this.restartKey)) {
      this.scene.restart()
      return
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

    if (this.cursors.space.isDown && body.blocked.down) {
      this.slime.setVelocityY(this.jumpPower)
    }
  }
}