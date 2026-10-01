import Phaser from 'phaser'
import { takeAchievementToast } from '../state/achievements'

// 成就提示条：独立场景，自带相机（zoom 恒为 1），所以不会被关卡的推镜头／缩放影响
export class AchievementScene extends Phaser.Scene {
  private showing = false

  constructor() {
    super('achievement')
  }

  update() {
    if (!this.showing) {
      this.showNext()
    }
  }

  private showNext() {
    const def = takeAchievementToast()

    if (!def) {
      return
    }

    this.showing = true

    const label = this.add.text(0, 0, '成就达成', {
      fontFamily: 'sans-serif',
      fontSize: '10px',
      color: '#ffd54f',
    })
    const name = this.add.text(0, 0, def.name, {
      fontFamily: 'sans-serif',
      fontSize: '11px',
      color: '#ffffff',
    })

    const gap = 8
    const total = label.width + gap + name.width
    const left = -total / 2

    label.setOrigin(0, 0.5).setPosition(left, 0)
    name.setOrigin(0, 0.5).setPosition(left + label.width + gap, 0)

    const panel = this.add.rectangle(0, 0, total + 24, 26, 0x1e1e30).setStrokeStyle(2, 0xffd54f)
    const box = this.add.container(240, -18)

    box.add([panel, label, name])

    this.tweens.add({
      targets: box,
      y: 30,
      duration: 320,
      ease: 'Back.easeOut',
      onComplete: () => {
        this.time.delayedCall(2000, () => {
          this.tweens.add({
            targets: box,
            y: -18,
            alpha: 0,
            duration: 260,
            onComplete: () => {
              box.destroy()
              this.showing = false
            },
          })
        })
      },
    })
  }
}