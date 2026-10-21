import Phaser from 'phaser'
import { LEVELS } from '../data/levels'
import { progress } from '../state/progress'

export class DeadScene extends Phaser.Scene {
  private cause = 'fall'
  private levelName = ''

  constructor() {
    super('dead')
  }

  init(data: { cause?: string; name?: string }) {
    this.cause = data?.cause ?? 'fall'
    // 关卡名由 GameScene 带过来；旧调用没带就退回按存档下标查（测试关卡不在 LEVELS 里）
    this.levelName = data?.name ?? LEVELS[progress.levelIndex]?.name ?? ''
  }

  create() {
    let title = '掉下去了……'

    if (this.cause === 'hazard') {
      title = '撞上屏障了……'
    } else if (this.cause === 'spike') {
      title = '被岩刺钉了个对穿……'
    } else if (this.cause === 'crush') {
      title = '被崩塌吞没了……'
    } else if (this.cause === 'monster') {
      title = '被魔物扑倒了……'
    } else if (this.cause === 'guard') {
      title = '被千岩军抓住了……'
    } else if (this.cause === 'childe') {
      title = '被公子打倒了……'
    }
    
    this.add.rectangle(0, 0, 480, 270, 0x000000).setOrigin(0, 0).setAlpha(0.75)
    this.add.rectangle(240, 140, 300, 210, 0x241e2e).setStrokeStyle(2, 0x6a4a6a)

    this.add
      .text(240, 56, title, {
        fontFamily: 'sans-serif',
        fontSize: '24px',
        color: '#ff8a8a',
      })
      .setOrigin(0.5)

    this.add
      .text(240, 88, this.levelName, {
        fontFamily: 'sans-serif',
        fontSize: '14px',
        color: '#ffffff',
      })
      .setOrigin(0.5)

    this.add
      .text(240, 112, '本次收集的星星不会保存', {
        fontFamily: 'sans-serif',
        fontSize: '12px',
        color: '#8fa3b8',
      })
      .setOrigin(0.5)

    this.makeButton(155, '重开本关', () => {
      this.scene.stop('game')
      this.scene.start('game', { domain: false, collectedGems: [] })
    })
    this.makeButton(189, '回到选择界面', () => {
      this.scene.stop('game')
      this.scene.start('select')
    })
    this.makeButton(223, '回到标题', () => {
      this.scene.stop('game')
      this.scene.start('menu')
    })

    this.input.keyboard!.on('keydown-ESC', (event: KeyboardEvent) => {
      if (event.repeat) {
        return
      }

      this.scene.stop('game')
      this.scene.start('game', { domain: false, collectedGems: [] })
    })
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
  }
}
