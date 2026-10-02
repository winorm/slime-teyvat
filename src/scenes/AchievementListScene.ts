import Phaser from 'phaser'
import { ACHIEVEMENTS, isAchieved } from '../state/achievements'
import { playMusic } from '../state/audio'

export class AchievementListScene extends Phaser.Scene {
  constructor() {
    super('achievements')
  }

  create() {
    playMusic(this, 'music-menu')

    const unlocked = ACHIEVEMENTS.filter((item) => isAchieved(item.key)).length

    this.add
      .text(240, 26, '成就', {
        fontFamily: 'sans-serif',
        fontSize: '18px',
        color: '#ffd54f',
      })
      .setOrigin(0.5)

    this.add
      .text(240, 48, unlocked + ' / ' + ACHIEVEMENTS.length, {
        fontFamily: 'sans-serif',
        fontSize: '12px',
        color: '#8fa3b8',
      })
      .setOrigin(0.5)

    ACHIEVEMENTS.forEach((item, index) => {
      const done = isAchieved(item.key)
      const hidden = item.hidden && !done
      const y = 80 + index * 36

      this.add
        .rectangle(52, y, 20, 20, done ? 0xffd54f : 0x2a2a3a)
        .setStrokeStyle(2, done ? 0xffd54f : 0x3a3a4e)

      this.add.text(76, y - 9, hidden ? '？？？' : item.name, {
        fontFamily: 'sans-serif',
        fontSize: '14px',
        color: done ? '#ffd54f' : '#c8d2de',
      })

      this.add.text(76, y + 7, hidden ? '隐藏成就，自己去发现' : item.desc, {
        fontFamily: 'sans-serif',
        fontSize: '12px',
        color: '#6a7a8e',
      })
    })

    this.add
      .text(240, 250, '按 Esc 返回', {
        fontFamily: 'sans-serif',
        fontSize: '12px',
        color: '#8fa3b8',
      })
      .setOrigin(0.5)

    this.input.keyboard!.once('keydown-ESC', () => {
      this.scene.start('menu')
    })
  }
}
