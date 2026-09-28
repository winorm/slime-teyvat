import type { ElementKey } from '../data/elements'
import { ELEMENT_ORDER } from '../data/elements'

// 开发者模式：改成 true 就能解锁全部关卡，用于测试
// 这个值在打包时会被写死，发布版本必须是 false
export const DEV_MODE = true

export const progress = {
  unlocked: ['none'] as ElementKey[],
  current: 'none' as ElementKey,
  levelIndex: 0,
  maxLevel: 0,
  levelGems: [] as number[][],
  gemStorySeen: false,
}

export function unlockElement(key: ElementKey) {
  if (!progress.unlocked.includes(key)) {
    progress.unlocked.push(key)
    progress.unlocked.sort((a, b) => ELEMENT_ORDER.indexOf(a) - ELEMENT_ORDER.indexOf(b))
  }

  progress.current = key
}

export function cycleElement(step: number) {
  const list = progress.unlocked
  const index = list.indexOf(progress.current)
  const next = (index + step + list.length) % list.length

  progress.current = list[next]
}

export function recordClear(levelIndex: number, indices: number[]) {
  const saved = progress.levelGems[levelIndex] ?? []

  progress.levelGems[levelIndex] = Array.from(new Set([...saved, ...indices]))
  progress.maxLevel = Math.max(progress.maxLevel, levelIndex + 1)
}