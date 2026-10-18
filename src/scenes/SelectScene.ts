import Phaser from 'phaser'
import { LEVELS } from '../data/levels'
import { progress, saveProgress, DEV_MODE } from '../state/progress'
import { ELEMENTS } from '../data/elements'
import { playMusic } from '../state/audio'
import { touchMode } from '../state/touch'

const COLS = 5
const CELL_W = 84
const CELL_H = 66
const FIRST_X = 72
const FIRST_Y = 72

export class SelectScene extends Phaser.Scene {
  private selected = 0
  private selectionBox!: Phaser.GameObjects.Rectangle
  private levelLabel!: Phaser.GameObjects.Text

  constructor() {
    super('select')
  }

  create() {
    playMusic(this, 'music-menu')
    this.selected = Phaser.Math.Clamp(
      progress.levelIndex,
      0,
      Math.max(0, LEVELS.length - 1)
    )

    this.add
      .text(240, 22, '选择关卡', {
        fontFamily: 'sans-serif',
        fontSize: '24px',
        color: '#ffffff',
      })
      .setOrigin(0.5)

    // 左上角：当前黄框选中的是第几关
    this.levelLabel = this.add
      .text(12, 10, '', {
        fontFamily: 'sans-serif',
        fontSize: '15px',
        color: '#ffd54f',
      })
      .setOrigin(0, 0)

    for (let index = 0; index < 15; index++) {
      const col = index % COLS
      const row = Math.floor(index / COLS)

      this.makeCell(index, FIRST_X + col * CELL_W, FIRST_Y + row * CELL_H)
    }

    // 黄色选框：只画边框，压在格子内容上面
    this.selectionBox = this.add
      .rectangle(0, 0, 80, 64, 0xffd54f, 0)
      .setStrokeStyle(3, 0xffd54f, 1)
      .setDepth(20)

    this.tweens.add({
      targets: this.selectionBox,
      alpha: 0.55,
      duration: 720,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    })

    this.refreshSelection()

    // 触屏上没有 Esc，这行提示本身可点，点了就回标题
    const back = this.add
      .text(240, 252, touchMode() ? '返回标题' : '按 Esc 回到标题', {
        fontFamily: 'sans-serif',
        fontSize: '14px',
        color: '#8fa3b8',
      })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true })

    back.on('pointerdown', () => this.scene.start('menu'))

    this.input.keyboard!.once('keydown-ESC', () => {
      this.scene.start('menu')
    })

    this.input.keyboard!.on('keydown-LEFT', (event: KeyboardEvent) => {
      if (!event.repeat) {
        this.moveSelection(-1, 0)
      }
    })
    this.input.keyboard!.on('keydown-RIGHT', (event: KeyboardEvent) => {
      if (!event.repeat) {
        this.moveSelection(1, 0)
      }
    })
    this.input.keyboard!.on('keydown-UP', (event: KeyboardEvent) => {
      if (!event.repeat) {
        this.moveSelection(0, -1)
      }
    })
    this.input.keyboard!.on('keydown-DOWN', (event: KeyboardEvent) => {
      if (!event.repeat) {
        this.moveSelection(0, 1)
      }
    })
    this.input.keyboard!.on('keydown-SPACE', (event: KeyboardEvent) => {
      if (!event.repeat) {
        this.enterSelected()
      }
    })

    if (DEV_MODE) {
      this.add
        .text(12, 30, '开发者模式：全部关卡已解锁', {
          fontFamily: 'sans-serif',
          fontSize: '10px',
          color: '#ff9a9a',
        })
        .setOrigin(0, 0)
    }
  }

  private cellAt(index: number) {
    const col = index % COLS
    const row = Math.floor(index / COLS)

    return { x: FIRST_X + col * CELL_W, y: FIRST_Y + row * CELL_H }
  }

  private isPlayable(index: number) {
    const level = LEVELS[index]

    return level !== undefined && (DEV_MODE || index <= progress.maxLevel)
  }

  private refreshSelection() {
    const position = this.cellAt(this.selected)
    const playable = this.isPlayable(this.selected)

    this.selectionBox.setPosition(position.x, position.y)
    this.selectionBox.setStrokeStyle(3, 0xffd54f, 1)

    this.levelLabel
      .setText(`第 ${this.selected + 1} 关${playable ? '' : ' · 未解锁'}`)
      .setColor(playable ? '#ffd54f' : '#8fa3b8')
  }

  private moveSelection(dx: number, dy: number) {
    const next = this.selected + dx + dy * COLS

    if (next < 0 || next >= LEVELS.length) {
      return
    }

    // 左右移动不跨行；到了行尾就停住
    if (
      dx !== 0 &&
      Math.floor(next / COLS) !== Math.floor(this.selected / COLS)
    ) {
      return
    }

    this.selected = next
    this.refreshSelection()
  }

  private enterSelected() {
    if (!this.isPlayable(this.selected)) {
      this.selectionBox.setStrokeStyle(3, 0xff6b6b, 1)
      this.time.delayedCall(140, () => this.refreshSelection())
      return
    }

    progress.levelIndex = this.selected
    saveProgress()
    this.scene.start('game')
  }

  private makeCell(index: number, x: number, y: number) {
    const level = LEVELS[index]
    const isPlayable = level !== undefined && (DEV_MODE || index <= progress.maxLevel)

    this.add.rectangle(x, y, 76, 62, 0x1e1e30).setStrokeStyle(2, 0x3a3a5a)   // 52 → 62

    if (!level) {
      this.add.image(x, y - 8, 'slime-none').setTint(0x2a2a3e)
      this.add.image(x + 24, y + 14, 'lock').setTint(0x55556a)
      return
    }

    const element = ELEMENTS[level.startElement]

    const bodyY = y - 2        // 身体中心的 y，以后想整体挪只改这一个数

    if (level.startElement === 'rock') {
      this.add.image(x, bodyY - 10, 'rock-crown').setScale(1)     // 岩脊：身体中心往上 10
    }

    const slime = this.add.image(x, bodyY, 'slime-' + level.startElement)

    if (element.wing) {
      const wings: [number, number, number][] = [
        [-12, 1, -58],
        [12, 0, 58],
      ]

      wings.forEach(([offset, originX, angle]) => {
        const wing = this.add
          .image(x + offset, bodyY - 9, 'wing')                  // 翅膀：身体中心往上 9

          .setOrigin(originX, 0.5)
          .setAngle(angle)
          .setScale(0.8)
          .setTint(isPlayable ? element.color : 0x3a3a4e)

        if (originX === 1) {
          wing.setFlipX(true)
        }
      })
    }

    const eyeTint = isPlayable ? element.eyeColor : 0x2a2a3a

    this.add.image(x - 5, bodyY - 2, 'eye').setTint(eyeTint)     // 眼睛：身体中心往上 2
    this.add.image(x + 5, bodyY - 2, 'eye').setTint(eyeTint)

    if (!isPlayable) {
      slime.setTint(0x3a3a4e)
    }

    const gems = progress.levelGems[index] ?? []

    for (let slot = 0; slot < 3; slot++) {
      const lit = slot < gems.length

      this.add.image(x - 16 + slot * 16, y + 23, 'gem').setTint(lit ? 0x6ec6ff : 0x33333f)
      
    }

    if (isPlayable) {
      slime.setInteractive({ useHandCursor: true })

      slime.on('pointerdown', () => {
        this.selected = index
        this.refreshSelection()
        this.enterSelected()
      })
    }
  }
}
