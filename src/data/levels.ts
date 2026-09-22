import type { ElementKey } from './elements'

export type PlatformDef = {
  x: number
  y: number
  width: number
  height: number
}

export type OrbDef = {
  x: number
  y: number
  element: ElementKey
}

export type HintDef = {
  x: number
  y: number
  text: string
}

export type GoalKind = 'statue' | 'chest'

export type GoalDef = {
  x: number
  y: number
  kind: GoalKind
  grants?: ElementKey
}

export type LevelDef = {
  name: string
  startElement: ElementKey
  spawn: { x: number; y: number }
  goal: GoalDef
  platforms: PlatformDef[]
  orbs: OrbDef[]
  hints: HintDef[]
}

export const LEVELS: LevelDef[] = [
  {
    name: '第一关 · 觉醒之前',
    startElement: 'none',
    spawn: { x: 40, y: 150 },
    goal: { x: 290, y: 156, kind: 'statue', grants: 'wind' },
    platforms: [
      { x: 240, y: 258, width: 480, height: 24 },
      { x: 140, y: 210, width: 80, height: 12 },
      { x: 280, y: 186, width: 80, height: 12 },
    ],
    orbs: [],
    hints: [
      { x: 60, y: 215, text: '← → 移动' },
      { x: 190, y: 165, text: '空格 跳跃' },
    ],
  },
  {
    name: '第二关 · 初次冒险',
    startElement: 'wind',
    spawn: { x: 40, y: 150 },
    goal: { x: 370, y: 146, kind: 'chest' },
    platforms: [
      { x: 240, y: 258, width: 480, height: 24 },
      { x: 150, y: 186, width: 100, height: 12 },
      { x: 350, y: 166, width: 120, height: 12 },
    ],
    orbs: [],
    hints: [
      { x: 70, y: 215, text: '长按 空格 悬浮' },
      { x: 250, y: 215, text: '悬浮中可左右移动' },
    ],
  },
]