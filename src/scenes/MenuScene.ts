import Phaser from 'phaser'
import { ELEMENTS, type ElementKey } from '../data/elements'
import { newGame } from '../state/progress'
import { playMusic } from '../state/audio'

const MENU_OPTIONS = ['新游戏', '继续游戏', '成就']

export class MenuScene extends Phaser.Scene {
  private cursor = 0
  private starting = false
  private optionLabels: Phaser.GameObjects.Text[] = []
  private cursorIcon!: Phaser.GameObjects.Image

  constructor() {
    super('menu')
  }

  create() {
    playMusic(this, 'music-menu')

    this.cursor = 0
    this.starting = false
    this.optionLabels = []

    this.add
      .text(240, 52, '重生之我在提瓦特当史莱姆', {
        fontFamily: 'sans-serif',
        fontSize: '24px',
        color: '#7be0a8',
      })
      .setOrigin(0.5)

    // 三种形态并排：普通 → 风 → 岩（岩脊要先画，它在身体背后）
    this.makeSlime(160, 126, 'none')
    this.makeSlime(240, 126, 'wind')
    this.makeSlime(320, 126, 'rock')

    MENU_OPTIONS.forEach((text, index) => {
      const label = this.add
        .text(240, 178 + index * 28, text, {
          fontFamily: 'sans-serif',
          fontSize: '18px',
          color: '#ffffff',
        })
        .setOrigin(0.5)
        .setInteractive({ useHandCursor: true })

      label.on('pointerover', () => {
        this.cursor = index
        this.refreshMenu()
      })

      label.on('pointerdown', () => {
        this.cursor = index
        this.refreshMenu()
        this.confirmMenu()
      })

      this.optionLabels.push(label)
    })

    this.cursorIcon = this.add.image(0, 0, 'gem').setTint(0xffd54f)

    this.add
      .text(240, 258, '↑ ↓ 选择 · 空格 确认', {
        fontFamily: 'sans-serif',
        fontSize: '12px',
        color: '#8fa3b8',
      })
      .setOrigin(0.5)

    this.refreshMenu()

    this.input.keyboard!.on('keydown-UP', () => this.moveMenu(-1))
    this.input.keyboard!.on('keydown-DOWN', () => this.moveMenu(1))
    this.input.keyboard!.on('keydown-W', () => this.moveMenu(-1))
    this.input.keyboard!.on('keydown-S', () => this.moveMenu(1))
    this.input.keyboard!.on('keydown-SPACE', () => this.confirmMenu())
    this.input.keyboard!.on('keydown-ENTER', () => this.confirmMenu())
  }

  private moveMenu(step: number) {
    this.cursor = (this.cursor + step + MENU_OPTIONS.length) % MENU_OPTIONS.length
    this.refreshMenu()
  }

  private refreshMenu() {
    this.optionLabels.forEach((label, index) => {
      label.setColor(index === this.cursor ? '#ffd54f' : '#ffffff')
    })

    const active = this.optionLabels[this.cursor]

    this.cursorIcon.setPosition(active.x - active.width / 2 - 16, active.y)
  }

  private confirmMenu() {
    if (this.starting) {
      return
    }

    this.starting = true

    if (this.cursor === 0) {
      newGame()
      this.scene.start('game')
      return
    }

    if (this.cursor === 1) {
      this.scene.start('save')
      return
    }

    this.scene.start('achievements')
  }

  private makeSlime(x: number, y: number, key: ElementKey) {
    const element = ELEMENTS[key]

    // 岩脊挂在人物背后，所以先画；位移和关卡里一样是 -8
    if (key === 'rock') {
      this.add.image(x, y - 8, 'rock-crown')
    }

    this.add.image(x, y, 'slime-' + key)

    if (element.wing) {
      this.add
        .image(x - 12, y - 10, 'wing')
        .setOrigin(1, 0.5)
        .setFlipX(true)
        .setAngle(-45)
        .setScale(0.75)
        .setTint(element.color)

      this.add
        .image(x + 12, y - 10, 'wing')
        .setOrigin(0, 0.5)
        .setAngle(45)
        .setScale(0.75)
        .setTint(element.color)
    }

    // 带黑描边的眼睛只有岩史莱姆用
    const eyeKey = key === 'rock' ? 'eye-rock' : 'eye'

    this.add.image(x - 5, y - 2, eyeKey).setTint(element.eyeColor)
    this.add.image(x + 5, y - 2, eyeKey).setTint(element.eyeColor)
  }
}
