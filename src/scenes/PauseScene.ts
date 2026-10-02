import Phaser from 'phaser'
import { LEVELS } from '../data/levels'
import { progress, deleteSlot } from '../state/progress'
import { audio, toggleMute } from '../state/audio'

export class PauseScene extends Phaser.Scene {
  constructor() {
    super('pause')
  }

  create() {
    const level = LEVELS[progress.levelIndex]
    const gems = progress.levelGems[progress.levelIndex] ?? []

    this.add.rectangle(0, 0, 480, 270, 0x000000).setOrigin(0, 0).setAlpha(0.7)
    this.add.rectangle(240, 135, 300, 250, 0x1e1e30).setStrokeStyle(2, 0x5a5a82)

    this.add
      .text(240, 40, '设置', {
        fontFamily: 'sans-serif',
        fontSize: '24px',
        color: '#ffd54f',
      })
      .setOrigin(0.5)

    this.add
      .text(240, 64, level.name, {
        fontFamily: 'sans-serif',
        fontSize: '14px',
        color: '#ffffff',
      })
      .setOrigin(0.5)

    for (let slot = 0; slot < 3; slot++) {
      this.add
        .image(240 - 32 + slot * 32, 90, 'gem')
        .setScale(2)
        .setTint(slot < gems.length ? 0x6ec6ff : 0x33333f)
    }

    this.makeButton(112, '继续游戏', () => this.resumeGame())
    this.makeButton(144, '重开本关', () => {
      this.scene.stop('game')
      this.scene.start('game')
    })
    this.makeButton(176, '回到选择界面', () => {
      this.scene.stop('game')
      this.scene.start('select')
    })

    let clearArmed = false

    const clearText = this.makeButton(208, '清除本档存档', () => {
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
    })

    const muteText = this.makeButton(240, audio.muted ? '声音：关' : '声音：开', () => {
      const muted = toggleMute()

      muteText.setText(muted ? '声音：关' : '声音：开')
    })

    this.input.keyboard!.on('keydown-ESC', () => {
      this.resumeGame()
    })
  }

  private resumeGame() {
    this.scene.resume('game')
    this.scene.stop()
  }

  private makeButton(y: number, label: string, onClick: () => void) {
    const rect = this.add.rectangle(240, y, 180, 26, 0x2c2c44).setStrokeStyle(2, 0x4a4a6a)
    const text = this.add
      .text(240, y, label, {
        fontFamily: 'sans-serif',
        fontSize: '15px',
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
