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
  height: number
  startElement: ElementKey
  spawn: { x: number; y: number }
  goal: GoalDef
  platforms: PlatformDef[]
  orbs: OrbDef[]
  gems: { x: number; y: number }[]
  blessings: { x: number; y: number }[]
  hazards: HazardDef[]
  hints: HintDef[]
}

export type HazardDef = {
  x: number
  gapY: number
}

export const LEVELS: LevelDef[] = [
  {
    name: '第一关 · 觉醒之前',
    width: 1400,
    height: 270,
    startElement: 'none',
    spawn: { x: 40, y: 150 },
    goal: { x: 1330, y: 102, kind: 'statue', grants: 'wind' },
    platforms: [
      { x: 150, y: 258, width: 300, height: 24 },
      { x: 495, y: 258, width: 250, height: 24 },
      { x: 720, y: 222, width: 100, height: 12 },
      { x: 870, y: 192, width: 100, height: 12 },
      { x: 1020, y: 162, width: 100, height: 12 },
      { x: 1260, y: 198, width: 280, height: 144 },
    ],
    orbs: [],
    gems: [
      { x: 335, y: 180 },
      { x: 870, y: 179 },
      { x: 1160, y: 119 },
    ],
    blessings: [],
    hazards: [],
    hints: [
      { x: 60, y: 215, text: '← → 移动' },
      { x: 260, y: 205, text: '按空格可跳跃' },
    ],
  },

  {
    name: '第二关 · 初次冒险',
    width: 1700,
    height: 540,
    startElement: 'wind',
    spawn: { x: 60, y: 400 },
    goal: { x: 1600, y: 466, kind: 'chest' },
    platforms: [
      { x: 200, y: 510, width: 400, height: 60 },
      { x: 870, y: 475, width: 300, height: 130 },
      { x: 1530, y: 510, width: 340, height: 60 },
    ],
    orbs: [],
    gems: [
      { x: 560, y: 415 },
      { x: 900, y: 403 },
      { x: 1190, y: 400 },
    ],
    blessings: [],
    hazards: [],
    hints: [
      { x: 330, y: 440, text: '长按空格漂浮' },
      { x: 1190, y: 465, text: '风史莱姆可以缓降' },
    ],
  },

  {
    name: '第三关 · 遗迹回廊',
    width: 1700,
    height: 540,
    startElement: 'wind',
    spawn: { x: 260, y: 440 },
    goal: { x: 1650, y: 376, kind: 'chest' },
    platforms: [
      { x: 70, y: 465, width: 140, height: 150 },
      { x: 450, y: 465, width: 140, height: 150 },
      { x: 260, y: 510, width: 240, height: 60 },
      { x: 260, y: 396, width: 240, height: 12, oneWay: true },
      { x: 700, y: 396, width: 80, height: 12, crumble: true },
      { x: 980, y: 396, width: 80, height: 12, crumble: true },
      { x: 1260, y: 396, width: 80, height: 12, crumble: true },
      { x: 1600, y: 465, width: 200, height: 150 },
    ],
    orbs: [],
    gems: [
      { x: 260, y: 383 },
      { x: 840, y: 450 },
      { x: 1120, y: 450 },
    ],
    blessings: [],
    hazards: [],
    hints: [
      { x: 260, y: 430, text: '长按空格飞出坑口' },
      { x: 840, y: 330, text: '松开空格可以缓降' },
    ],
  },

  {
    name: '第四关 · 风神的赐福',
    width: 2600,
    height: 540,
    startElement: 'wind',
    spawn: { x: 60, y: 300 },
    goal: { x: 2520, y: 466, kind: 'chest' },
    platforms: [
      { x: 200, y: 465, width: 400, height: 150 },
      { x: 2400, y: 510, width: 400, height: 60 },
    ],
    orbs: [],
    gems: [
      { x: 1000, y: 300 },
      { x: 1450, y: 380 },
      { x: 1900, y: 300 },
    ],
    blessings: [{ x: 370, y: 376 }],
    hazards: [
      { x: 700, gapY: 300 },
      { x: 850, gapY: 380 },
      { x: 1000, gapY: 300 },
      { x: 1150, gapY: 380 },
      { x: 1300, gapY: 300 },
      { x: 1450, gapY: 380 },
      { x: 1600, gapY: 300 },
      { x: 1750, gapY: 380 },
      { x: 1900, gapY: 300 },
      { x: 2050, gapY: 380 },
    ],
    hints: [{ x: 340, y: 320, text: '穿过中间的缝隙' }],
  },

]
