import { progress, saveProgress } from './progress'

export type AchievementDef = {
  key: string
  name: string
  desc: string
  hidden: boolean
}

// 成就表：加一条就是加一个成就。key 一旦定下就别改，存档里存的就是它
export const ACHIEVEMENTS: AchievementDef[] = [
  { key: 'first-gem', name: '家乡的影子', desc: '第一次拾起原石', hidden: false },
  { key: 'first-clear', name: '你好，提瓦特', desc: '第一次通关任意关卡', hidden: false },
  { key: 'tower-top', name: '到达蒙德最高层！', desc: '登上风塔的塔尖', hidden: true },
]

export function findAchievement(key: string) {
  return ACHIEVEMENTS.find((item) => item.key === key) ?? null
}

export function isAchieved(key: string) {
  return progress.achievements.includes(key)
}

// 头一回解锁返回 true（调用方据此弹提示）；已经有了、或者 key 不存在，返回 false
export function unlockAchievement(key: string) {
  if (isAchieved(key) || !findAchievement(key)) {
    return false
  }

  progress.achievements.push(key)
  saveProgress()

  return true
}

const toastQueue: string[] = []

// 真正解锁成功才进队列；返回 true 表示可以弹提示了
export function queueAchievementToast(key: string) {
  if (!unlockAchievement(key)) {
    return false
  }

  toastQueue.push(key)

  return true
}

// 提示条场景每次来取一条，取不到就返回 null
export function takeAchievementToast() {
  const key = toastQueue.shift()

  return key === undefined ? null : findAchievement(key)
}