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
  prompt: string
}

export type LevelDef = {
  name: string
  intro: string
  width: number
  height: number
  startElement: ElementKey
  spawn: { x: number; y: number }
  goal: GoalDef
  platforms: PlatformDef[]
  orbs: OrbDef[]
  gems: { x: number; y: number }[]
  blessings: { x: number; y: number }[]
  blessingEndX?: number
  hazards: HazardDef[]
  monuments: MonumentDef[]
  chase?: boolean
  hints: HintDef[]
}

export type HazardDef = {
  x: number
  gapY: number
}

export type MonumentDef = {
  x: number
  y: number
  element: ElementKey
}

export const LEVELS: LevelDef[] = [
  {
    name: '第一关 · 你好，提瓦特',
    intro:
      '我从一片沙滩上醒来，这里的空气好熟悉。\n可是我又在哪里，现在是什么时候，我又睡了多久。\n这些问题一直在我脑里回想。\n先不管了，四处走走看吧。',

    width: 1400,
    height: 270,
    startElement: 'none',
    spawn: { x: 40, y: 233 },
    goal: { x: 1330, y: 80, kind: 'statue', grants: 'wind',prompt: '触摸', },
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
    monuments: [],
    hints: [
      { x: 60, y: 215, text: '← → 移动' },
      { x: 260, y: 205, text: '按空格可跳跃' },
    ],
  },

  {
    name: '第二关 · 来自蒙德？',
    intro:
      '触碰到一座神像似的建筑后，我的身体似乎发生了变化。\n好像有一股力量将要涌出。\n那么，拿着新力量继续前进吧。',

    width: 1700,
    height: 540,
    startElement: 'wind',
    spawn: { x: 60, y: 467 },
    goal: { x: 1600, y: 466, kind: 'chest',prompt: '打开',},
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
    monuments: [],
    hints: [
      { x: 330, y: 440, text: '长按空格漂浮' },
      { x: 1190, y: 465, text: '风史莱姆可以缓降' },
    ],
  },

  {
    name: '第三关 · 无路可走',
    intro:
      '可恶，竟然中了陷阱！\n怎么后面有人追来，前面的路似乎快要塌了。\n不管了，冲吧！',

    width: 1700,
    height: 540,
    startElement: 'wind',
    spawn: { x: 260, y: 467 },
    goal: { x: 1650, y: 376, kind: 'chest',prompt: '打开', },
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
    monuments: [],
    chase: true,
    hints: [
      { x: 260, y: 430, text: '长按空格飞出坑口' },
      { x: 840, y: 330, text: '松开空格可以缓降' },
    ],
  },

  {
    name: '第四关 · 曙光？',
    intro:
      '前面全是障碍，这可怎么办。\n突然，脑中隐隐约约有一个声音指引着我前进。\n他似乎没有恶意……现在也只能相信他了。',

    width: 2600,
    height: 540,
    startElement: 'wind',
    spawn: { x: 60, y: 377 },
    goal: { x: 2520, y: 466, kind: 'chest',prompt: '打开', },
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
    blessingEndX: 2150,
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
    monuments: [],
    hints: [{ x: 340, y: 320, text: '穿过中间的缝隙' }],
  },

  {
    name: '第五关 · 登塔',
    intro:
      '被一位自称是风神的人指引，我来到了这座塔下。\n塔中似乎关押着他的伙伴，需要我帮他解救出来。\n既然他帮助过我，那我也应该帮他一次，这样就算扯平了吧。',
    width: 800,
    height: 270,
    startElement: 'wind',
    spawn: { x: 60, y: 209 },
    goal: { x: 700, y: 208, kind: 'chest', prompt: '打开' },
    platforms: [{ x: 400, y: 246, width: 800, height: 48 }],
    orbs: [],
    gems: [],
    blessings: [],
    hazards: [],
    monuments: [{ x: 320, y: 200, element: 'wind' }],
    hints: [],
  },

]
