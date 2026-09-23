import type { ElementKey } from './elements'

export type PlatformDef = {
  x: number
  y: number
  width: number
  height: number
  oneWay?: boolean
  crumble?: boolean
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
  gems: { x: number; y: number }[]
  hints: HintDef[]
}

export const LEVELS: LevelDef[] = [
  {
    name: '第一关 · 觉醒之前',
    width: 960,
    startElement: 'none',
    spawn: { x: 40, y: 150 },
    goal: { x: 850, y: 180, kind: 'statue', grants: 'wind' },
    gems: [
      { x: 200, y: 239 },
      { x: 460, y: 197 },
      { x: 600, y: 173 },
    ],
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
    gems: [
      { x: 200, y: 173 },
      { x: 560, y: 173 },
      { x: 880, y: 239 },
    ],
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

  {
    name: '第三关 · 遗迹回廊',
    width: 1040,
    startElement: 'wind',
    spawn: { x: 40, y: 150 },
    goal: { x: 920, y: 116, kind: 'chest' },
    platforms: [
      { x: 120, y: 258, width: 240, height: 24 },
      { x: 340, y: 215, width: 120, height: 10, oneWay: true },
      { x: 340, y: 175, width: 120, height: 10, oneWay: true },
      { x: 340, y: 135, width: 120, height: 10, oneWay: true },
      { x: 500, y: 135, width: 70, height: 10, crumble: true },
      { x: 630, y: 135, width: 70, height: 10, crumble: true },
      { x: 760, y: 135, width: 70, height: 10, crumble: true },
      { x: 920, y: 136, width: 120, height: 12 },
    ],
    orbs: [],
    gems: [
      { x: 340, y: 123 },
      { x: 500, y: 123 },
      { x: 920, y: 123 },
    ],
    hints: [
      { x: 120, y: 215, text: '穿过平台往上跳' },
      { x: 630, y: 95, text: '踩上去会碎，快跳' },
    ],
  },
]
