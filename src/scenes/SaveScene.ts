import Phaser from 'phaser'
import { LEVELS } from '../data/levels'
import {
  SLOT_COUNT,
  SAVE_HINT,
  clearSave,
  deleteSlot,
  getSlotSummary,
  loadSlot,
  newGame,
} from '../state/progress'
import { ACHIEVEMENTS } from '../state/achievements'
import { playMusic } from '../state/audio'
import { touchMode } from '../state/touch'

const formatTime = (stamp: number) => {
  if (stamp <= 0) {
    return '—'
  }

  const date = new Date(stamp)
  const pad = (value: number) => String(value).padStart(2, '0')

  return (
    date.getFullYear() +
    '/' +
    (date.getMonth() + 1) +
    '/' +
    date.getDate() +
    ' ' +
    pad(date.getHours()) +
    ':' +
    pad(date.getMinutes())
  )
}

// 按多久算「长按」：到了这个时长松手就是"要删这一格"，短按还是正常进入
const LONG_PRESS_MS = 550

export class SaveScene extends Phaser.Scene {
  private cursor = 0
  private starting = false
  private deleteArmed = -1          // 哪一格进入了「再点一次删除」状态，-1 表示没有
  private clearArmed = false        // 「清空全部存档」是否在等第二次点击
  private pressAt = 0
  private pressIndex = -1
  private panels: Phaser.GameObjects.Rectangle[] = []
  private nameTexts: Phaser.GameObjects.Text[] = []
  private clearText!: Phaser.GameObjects.Text

  constructor() {
    super('save')
  }

  create() {
    playMusic(this, 'music-menu')

    this.cursor = 0
    this.starting = false
    this.deleteArmed = -1
    this.clearArmed = false
    this.pressAt = 0
    this.pressIndex = -1
    this.panels = []
    this.nameTexts = []

    this.add
      .text(240, 26, '选择存档', {
        fontFamily: 'sans-serif',
        fontSize: '18px',
        color: '#7be0a8',
      })
      .setOrigin(0.5)

    const totalGems = LEVELS.reduce((total, level) => total + level.gems.length, 0)

    for (let index = 0; index < SLOT_COUNT; index++) {
      const y = 82 + index * 58
      const summary = getSlotSummary(index)

      const panel = this.add
        .rectangle(240, y, 400, 50, 0x1e1e30)
        .setStrokeStyle(2, 0x3a3a4e)
        .setInteractive(new Phaser.Geom.Rectangle(0, 0, 400, 50), Phaser.Geom.Rectangle.Contains)

      panel.on('pointerover', () => {
        this.cursor = index
        this.refresh()
      })

      panel.on('pointerdown', () => {
        this.pressAt = this.time.now
        this.pressIndex = index
        this.cursor = index
        this.refresh()
      })

      // 松手时再决定：按得久 = 要删档，短按 = 正常进入
      panel.on('pointerup', () => {
        if (this.pressIndex !== index) {
          return
        }

        const held = this.time.now - this.pressAt
        this.pressIndex = -1

        if (held >= LONG_PRESS_MS) {
          this.armDelete(index)
          return
        }

        if (this.deleteArmed === index) {
          this.doDelete(index)
          return
        }

        if (this.deleteArmed >= 0) {
          // 点了别的格子，取消删除确认
          this.deleteArmed = -1
          this.refresh()
          return
        }

        this.confirm()
      })

      panel.on('pointerout', () => {
        this.pressIndex = -1
      })

      const nameText = this.add.text(52, y - 16, summary.empty ? '空档' : summary.name, {
        fontFamily: 'sans-serif',
        fontSize: '14px',
        color: '#ffffff',
      })

      this.nameTexts.push(nameText)
      this.panels.push(panel)

      const levelText =
        summary.maxLevel >= LEVELS.length
          ? '已通关'
          : '第 ' + (summary.maxLevel + 1) + ' 关 / 共 ' + LEVELS.length + ' 关'

      this.add.text(
        52,
        y + 4,
        summary.empty
          ? touchMode()
            ? '开始新游戏'
            : '按 空格 在这里开始新游戏'
          : levelText +
            ' · 原石 ' +
            summary.gems +
            ' / ' +
            totalGems +
            ' · 成就 ' +
            summary.achievements +
            ' / ' +
            ACHIEVEMENTS.length,
        {
          fontFamily: 'sans-serif',
          fontSize: '12px',
          color: '#8fa3b8',
        }
      )

      this.add
        .text(440, y - 16, summary.empty ? '—' : formatTime(summary.savedAt), {
          fontFamily: 'sans-serif',
          fontSize: '12px',
          color: '#6a7a8e',
        })
        .setOrigin(1, 0)

    }

    this.add
      .text(240, 250, touchMode() ? '短按进入 · 长按存档格删除' : SAVE_HINT, {
        fontFamily: 'sans-serif',
        fontSize: '12px',
        color: '#8fa3b8',
      })
      .setOrigin(0.5)

    // 清空全部 3 格：两下确认，手机上也能用
    this.clearText = this.add
      .text(240, 232, '清空全部存档', {
        fontFamily: 'sans-serif',
        fontSize: '12px',
        color: '#6a7a8e',
      })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true })

    this.clearText.on('pointerdown', () => {
      if (!this.clearArmed) {
        this.clearArmed = true
        this.clearText.setText('再点一次：清空全部存档（' + SLOT_COUNT + ' 格全删）')
        this.clearText.setColor('#ff8a8a')

        this.time.delayedCall(3000, () => this.resetClearArmed())
        return
      }

      clearSave()
      this.scene.restart()
    })

    this.refresh()

    this.input.keyboard!.on('keydown-UP', () => this.move(-1))
    this.input.keyboard!.on('keydown-DOWN', () => this.move(1))
    this.input.keyboard!.on('keydown-W', () => this.move(-1))
    this.input.keyboard!.on('keydown-S', () => this.move(1))
    this.input.keyboard!.on('keydown-SPACE', () => this.confirm())
    this.input.keyboard!.on('keydown-ENTER', () => this.confirm())
    this.input.keyboard!.once('keydown-ESC', () => this.scene.start('menu'))
    this.input.keyboard!.on('keydown-DELETE', () => this.deleteCurrent())
    this.input.keyboard!.on('keydown-BACKSPACE', () => this.deleteCurrent())

  }

  private move(step: number) {
    this.cursor = (this.cursor + step + SLOT_COUNT) % SLOT_COUNT
    this.refresh()
  }

  private refresh() {
    this.panels.forEach((panel, index) => {
      const armed = this.deleteArmed === index
      const color = armed ? 0xff6b6b : index === this.cursor ? 0xffd54f : 0x3a3a4e

      panel.setStrokeStyle(2, color)
    })

    this.nameTexts.forEach((text, index) => {
      if (this.deleteArmed === index) {
        text.setText('再点一次删除「' + getSlotSummary(index).name + '」')
        text.setColor('#ff8a8a')
        return
      }

      text.setText(getSlotSummary(index).empty ? '空档' : getSlotSummary(index).name)
      text.setColor('#ffffff')
    })
  }

  // 长按（或者按 Delete 键）之后进入「再点一次才真删」的状态，3 秒不操作自动取消
  private armDelete(index: number) {
    if (getSlotSummary(index).empty) {
      return
    }

    this.deleteArmed = index
    this.cursor = index
    this.refresh()

    this.time.delayedCall(3000, () => {
      if (this.deleteArmed === index) {
        this.deleteArmed = -1
        this.refresh()
      }
    })
  }

  private doDelete(index: number) {
    deleteSlot(index)
    this.scene.restart()
  }

  private resetClearArmed() {
    if (!this.clearArmed) {
      return
    }

    this.clearArmed = false

    if (this.clearText.active) {
      this.clearText.setText('清空全部存档')
      this.clearText.setColor('#6a7a8e')
    }
  }

  private confirm() {
    if (this.starting) {
      return
    }

    this.starting = true

    if (getSlotSummary(this.cursor).empty) {
      newGame(this.cursor)
      this.scene.start('game')
      return
    }

    loadSlot(this.cursor)
    this.scene.start('select')
  }

  private deleteCurrent() {
    if (getSlotSummary(this.cursor).empty) {
      return
    }

    if (this.deleteArmed === this.cursor) {
      this.doDelete(this.cursor)
      return
    }

    this.armDelete(this.cursor)
  }

}
