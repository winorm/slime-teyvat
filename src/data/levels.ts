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
  width: number
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
    width: 960,
    startElement: 'none',
    spawn: { x: 40, y: 150 },
    goal: { x: 850, y: 180, kind: 'statue', grants: 'wind' },
    platforms: [
      { x: 140, y: 258, width: 280, height: 24 },
      { x: 495, y: 258, width: 290, height: 24 },
      { x: 840, y: 258, width: 240, height: 24 },
      { x: 460, y: 210, width: 80, height: 12 },
      { x: 600, y: 186, width: 80, height: 12 },
      { x: 850, y: 210, width: 100, height: 12 },
    ],
    orbs: [],
    hints: [
      { x: 60, y: 215, text: '← → 移动' },
      { x: 460, y: 160, text: '空格 跳跃' },
    ],
  },
  {
    name: '第二关 · 初次冒险',
    width: 1200,
    startElement: 'wind',
    spawn: { x: 40, y: 150 },
    goal: { x: 960, y: 156, kind: 'chest' },
    platforms: [
      { x: 160, y: 258, width: 320, height: 24 },
      { x: 560, y: 258, width: 320, height: 24 },
      { x: 960, y: 258, width: 320, height: 24 },
      { x: 200, y: 186, width: 100, height: 12 },
      { x: 560, y: 186, width: 120, height: 12 },
      { x: 960, y: 176, width: 140, height: 12 },
    ],
    orbs: [],
    hints: [
      { x: 70, y: 215, text: '长按 空格 悬浮' },
      { x: 560, y: 150, text: '悬浮中可左右移动' },
    ],
  },
]