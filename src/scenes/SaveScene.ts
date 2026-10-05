import Phaser from 'phaser'
import { LEVELS } from '../data/levels'
import { SLOT_COUNT, SAVE_HINT, deleteSlot, getSlotSummary, loadSlot, newGame } from '../state/progress'
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

export class SaveScene extends Phaser.Scene {
  private cursor = 0
  private starting = false
  private deleteArmed = false
  private panels: Phaser.GameObjects.Rectangle[] = []

  constructor() {
    super('save')
  }

  create() {
    playMusic(this, 'music-menu')

    this.cursor = 0
    this.starting = false
    this.deleteArmed = false
    this.panels = []

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
        this.cursor = index
        this.refresh()
        this.confirm()
      })

      this.add.text(52, y - 16, summary.empty ? '空档' : summary.name, {
        fontFamily: 'sans-serif',
        fontSize: '14px',
        color: '#ffffff',
      })

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

      this.panels.push(panel)
    }

    this.add
      .text(240, 250, touchMode() ? '选择存档格' : SAVE_HINT, {
        fontFamily: 'sans-serif',
        fontSize: '12px',
        color: '#8fa3b8',
      })
      .setOrigin(0.5)

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
      panel.setStrokeStyle(2, index === this.cursor ? 0xffd54f : 0x3a3a4e)
    })
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

    if (!this.deleteArmed) {
      this.deleteArmed = true

      this.time.delayedCall(3000, () => {
        this.deleteArmed = false
      })

      return
    }

    deleteSlot(this.cursor)
    this.scene.restart()
  }

}
