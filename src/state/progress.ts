import type { ElementKey } from '../data/elements'
import { ELEMENT_ORDER } from '../data/elements'

export const progress = {
  unlocked: ['none'] as ElementKey[],
  current: 'none' as ElementKey,
  levelIndex: 0,
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
