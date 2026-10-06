import Phaser from 'phaser'
import { LEVELS } from '../data/levels'
import { progress, deleteSlot } from '../state/progress'
import { audio, toggleMute } from '../state/audio'
import { touchMode } from '../state/touch'
import { getMoveMode, toggleMoveMode } from '../state/settings'

export class PauseScene extends Phaser.Scene {
  constructor() {
    super('pause')
  }

  create() {
    const level = LEVELS[progress.levelIndex]
    const gems = progress.levelGems[progress.levelIndex] ?? []

    this.add.rectangle(0, 0, 480, 270, 0x000000).setOrigin(0, 0).setAlpha(0.7)
    this.add.rectangle(240, 135, 380, 250, 0x1e1e30).setStrokeStyle(2, 0x5a5a82)

    this.add
      .text(240, 34, '设置', {
        fontFamily: 'sans-serif',
        fontSize: '20px',
        color: '#ffd54f',
      })
      .setOrigin(0.5)

    this.add
      .text(240, 58, level.name, {
        fontFamily: 'sans-serif',
        fontSize: '13px',
        color: '#ffffff',
      })
      .setOrigin(0.5)

    for (let slot = 0; slot < 3; slot++) {
      this.add
        .image(240 - 32 + slot * 32, 78, 'gem')
        .setScale(2)
        .setTint(slot < gems.length ? 0x6ec6ff : 0x33333f)
    }

    // —— 四行按钮：整行宽 320（x 80~400），高 32，行距 38；对分的两列各 156 ——
    const ROW = [112, 150, 188, 226]
    const COL = { left: 158, right: 322, half: 156, full: 320 }

    // 第 1 行：主操作
    this.makeButton(240, ROW[0], COL.full, '继续游戏', () => this.resumeGame(), 16)

    // 第 2 行：重开 / 回选关
    this.makeButton(COL.left, ROW[1], COL.half, '重开本关', () => {
      this.scene.stop('game')
      this.scene.start('game')
    })

    this.makeButton(COL.right, ROW[1], COL.half, '回到选择界面', () => {
      this.scene.stop('game')
      this.scene.start('select')
    })

    // 第 3 行：设置项。触屏时「移动方式」在左、「声音」在右；桌面只有声音，就占满整行
    const touch = touchMode()

    if (touch) {
      const moveText = this.makeButton(
        COL.left,
        ROW[2],
        COL.half,
        getMoveMode() === 'stick' ? '移动方式：摇杆' : '移动方式：左右键',
        () => {
          const mode = toggleMoveMode()

          moveText.setText(mode === 'stick' ? '移动方式：摇杆' : '移动方式：左右键')
        },
        13
      )

      moveText.setColor('#a8e8d4')
    }

    const muteText = this.makeButton(
      touch ? COL.right : 240,
      ROW[2],
      touch ? COL.half : COL.full,
      audio.muted ? '声音：关' : '声音：开',
      () => {
        const muted = toggleMute()

        muteText.setText(muted ? '声音：关' : '声音：开')
      },
      13
    )

    // 第 4 行：危险操作，整行
    let clearArmed = false

    const clearText = this.makeButton(
      240,
      ROW[3],
      COL.full,
      '清除本档存档',
      () => {
        if (!clearArmed) {
          clearArmed = true
          clearText.setText('再点一次确认清除')
          clearText.setColor('#ff8a8a')

          this.time.delayedCall(3000, () => {
            clearArmed = false
            clearText.setText('清除本档存档')
            clearText.setColor('#ffffff')
          })

          return
        }

        deleteSlot()
        this.scene.stop('game')
        this.scene.start('menu')
      },
      13
    )

    this.add
      .text(240, 250, touch ? '点「继续游戏」返回' : '按 Esc 继续游戏', {
        fontFamily: 'sans-serif',
        fontSize: '11px',
        color: '#6a7a8e',
      })
      .setOrigin(0.5)

    this.input.keyboard!.on('keydown-ESC', () => {
      this.resumeGame()
    })
  }

  private resumeGame() {
    this.scene.resume('game')
    this.scene.stop()
  }

  private makeButton(
    x: number,
    y: number,
    width: number,
    label: string,
    onClick: () => void,
    fontSize = 14
  ) {
    const rect = this.add.rectangle(x, y, width, 32, 0x2c2c44).setStrokeStyle(2, 0x4a4a6a)
    const text = this.add
      .text(x, y, label, {
        fontFamily: 'sans-serif',
        fontSize: fontSize + 'px',
        color: '#ffffff',
      })
      .setOrigin(0.5)

    rect.setInteractive({ useHandCursor: true })

    rect.on('pointerover', () => {
      rect.setFillStyle(0x3d3d5e)
      text.setColor('#ffd54f')
    })

    rect.on('pointerout', () => {
      rect.setFillStyle(0x2c2c44)
      text.setColor('#ffffff')
    })

    rect.on('pointerdown', onClick)

    return text
  }

}
