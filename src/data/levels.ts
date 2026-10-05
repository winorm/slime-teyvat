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
  after?: 'cage' | 'statue'
  prompt: string
}

export type StatueDef = {
  x: number
  y: number
  grants: ElementKey
  prompt: string
}

export type PlateDef = {
  x: number
  y: number
  width?: number      // 不写就是 28
  id: string          // 门的 needs 里点这个 id
}

export type LauncherDef = {
  x: number
  y: number
  dir?: 'down' | 'left' | 'right'   // 默认 down：贴天花板往下打
  interval?: number                 // 发射间隔（秒），默认 2
  speed?: number                    // 岩刺速度（像素/秒），默认 220
}

export type CageDef = {
  x: number
  y: number
  prompt: string
}

export type DomeDef = {
  apexY: number      // 穹顶最高处（内表面）
  springY: number    // 起拱线：贴墙那两端的 y
  holeX: number      // 孔洞中心 x
  holeWidth: number  // 孔洞宽度
  thickness: number  // 穹顶壳厚
}

export type BgTheme = 'beach' | 'field' | 'church' | 'sky' | 'tower' | 'liyue'

export type ThemeColor = {
  ground: number
  oneWay: number
  crumble: number
  hazard: number
}

// 每个主题的地形配色：地面 / 单向平台 / 碎裂平台 / 危险物
export const THEME_COLORS: Record<BgTheme, ThemeColor> = {
  beach: { ground: 0xc2a877, oneWay: 0xd6c194, crumble: 0xa97f57, hazard: 0xb03a3a },
  field: { ground: 0x6b5836, oneWay: 0x8a7346, crumble: 0xa4583a, hazard: 0xb03a3a },
  church: { ground: 0x5f6478, oneWay: 0x7d8398, crumble: 0x9a6a52, hazard: 0xb03a3a },
  sky: { ground: 0x55607e, oneWay: 0x707d9c, crumble: 0x8a5a6a, hazard: 0x44608f },
  tower: { ground: 0x39405a, oneWay: 0x4c5470, crumble: 0x7a5648, hazard: 0xb03a3a },
  // 璃月·荻花洲：岩土色的地面，黄昏里偏暖
  liyue: { ground: 0x8a6a4a, oneWay: 0xb09068, crumble: 0x9a5a44, hazard: 0x2f6f8f },
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
  doors?: DoorDef[]
  notes?: NoteDef[]
  spire?: { x: number; y: number; radius: number }
  dome?: DomeDef
  cage?: CageDef
  music?: string
  bg?: BgTheme
  windmill?: { x: number; y: number }
  inn?: { x: number; y: number }          // 望舒客栈：画在背景里的地标，不参与碰撞
  statue?: StatueDef
  plates?: PlateDef[]
  launchers?: LauncherDef[]
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
  id?: string
  after?: string
  neighbors?: string[]
  startLit?: boolean
}

export type DoorDef = {
  x: number
  y: number
  width: number
  height: number
  needs: string[]
  ordered?: boolean
}

export type NoteDef = {
  x: number
  y: number
  prompt: string
  text: string
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
    bg: 'beach',
    // 终点这块台子原来顶面在 126，神像加高到 130 以后会顶出画面，所以整块往下挪 32
    goal: { x: 1230, y: 144, kind: 'chest', prompt: '打开', after: 'statue' },
    // y 是底座底面那条线（站的地面顶面），贴图变高也不用再改这里
    statue: { x: 1330, y: 158, grants: 'wind', prompt: '触摸' },
    platforms: [
      { x: 150, y: 258, width: 300, height: 24 },
      { x: 495, y: 258, width: 250, height: 24 },
      { x: 720, y: 222, width: 100, height: 12 },
      { x: 870, y: 192, width: 100, height: 12 },
      { x: 1020, y: 162, width: 100, height: 12 },
      { x: 1260, y: 230, width: 280, height: 144 },
    ],
    orbs: [],
    gems: [
      { x: 335, y: 180 },
      { x: 870, y: 179 },
      { x: 1160, y: 151 },
    ],
    blessings: [],
    hazards: [],
    monuments: [],
    hints: [
      { x: 60, y: 200, text: '← → 移动' },
      { x: 260, y: 200, text: '按空格可跳跃' },
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
    bg: 'field',
    windmill: { x: 200, y: 480 },
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
    bg: 'church',
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
    music: 'music-chase',
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
    bg: 'sky',
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
    width: 480,
    height: 1600,
    startElement: 'wind',
    spawn: { x: 60, y: 1547 },
    bg: 'tower',
    goal: { x: 240, y: 306, kind: 'chest', prompt: '打开', after: 'cage' },
    platforms: [
      // 一层：塔底地面
      { x: 240, y: 1580, width: 480, height: 40 },

      // 一层 → 二层的天花板，右上角留出 70 宽的门洞
      { x: 150, y: 1270, width: 300, height: 40 },
      { x: 425, y: 1270, width: 110, height: 40 },
      // 一层爬升台阶
      { x: 120, y: 1485, width: 120, height: 10, oneWay: true },
      { x: 240, y: 1400, width: 120, height: 10, oneWay: true },
      { x: 335, y: 1330, width: 130, height: 10, oneWay: true },

      // 二层 → 三层的天花板，左上角留门
      { x: 25, y: 960, width: 50, height: 40 },
      { x: 300, y: 960, width: 360, height: 40 },
      // 二层爬升台阶
      { x: 360, y: 1175, width: 120, height: 10, oneWay: true },
      { x: 240, y: 1095, width: 120, height: 10, oneWay: true },
      { x: 120, y: 1020, width: 120, height: 10, oneWay: true },

      // 三层 → 四层的天花板，右上角留门
      { x: 150, y: 650, width: 300, height: 40 },
      { x: 425, y: 650, width: 110, height: 40 },
      // 三层：星阵五碑各自踩的小石台
      { x: 240, y: 742, width: 64, height: 10, oneWay: true },
      { x: 321, y: 801, width: 64, height: 10, oneWay: true },
      { x: 190, y: 896, width: 64, height: 10, oneWay: true },
      { x: 159, y: 801, width: 64, height: 10, oneWay: true },
      { x: 290, y: 896, width: 64, height: 10, oneWay: true },
      // 三层通往门的那级台阶
      { x: 380, y: 710, width: 160, height: 10, oneWay: true },

      // 四层 → 五层的天花板，左上角留口（门在下面的 doors 里）
      { x: 25, y: 340, width: 50, height: 40 },
      { x: 300, y: 340, width: 360, height: 40 },
      // 四层：六碑阵，每碑脚下垫一块小石台（4 号碑直接站在地板上）
      { x: 240, y: 462, width: 64, height: 10, oneWay: true },
      { x: 140, y: 522, width: 64, height: 10, oneWay: true },
      { x: 340, y: 522, width: 64, height: 10, oneWay: true },
      { x: 140, y: 577, width: 64, height: 10, oneWay: true },
      { x: 340, y: 577, width: 64, height: 10, oneWay: true },
      // 四层通往第五层洞口的那级台阶
      { x: 120, y: 400, width: 120, height: 10, oneWay: true },

      // 塔顶：穹顶由 dome 数据在 GameScene 里拼出来，这里只放支柱、塔尖落脚点和窄台
      { x: 30, y: 225, width: 16, height: 190 },
      { x: 450, y: 225, width: 16, height: 190 },
      // 塔尖顶上的小平台（站上去触发成就）
      { x: 240, y: 36, width: 20, height: 8 },
      // 爬向穹顶洞口的两级窄台
      { x: 140, y: 235, width: 72, height: 10, oneWay: true },
      { x: 330, y: 145, width: 72, height: 10, oneWay: true },
    ],
    orbs: [],
    gems: [
      { x: 150, y: 1460 },
      { x: 240, y: 800 },
      { x: 200, y: 270 },
    ],
    blessings: [],
    hazards: [],
    monuments: [
      { x: 240, y: 1538, element: 'wind', id: 'f1' },
      { x: 150, y: 1228, element: 'wind', id: 'f2a' },
      { x: 240, y: 1068, element: 'wind', id: 'f2b', after: 'f2a' },
      { x: 240, y: 715, element: 'wind', id: 'star0' },
      { x: 321, y: 774, element: 'wind', id: 'star1' },
      { x: 190, y: 869, element: 'wind', id: 'star2' },
      { x: 159, y: 774, element: 'wind', id: 'star3' },
      { x: 290, y: 869, element: 'wind', id: 'star4' },
      // 四层：六碑阵，碰灭着的碑会让它自己变亮、相邻两座翻转
      { x: 240, y: 435, element: 'wind', id: 'm1', neighbors: ['m6', 'm2'], startLit: true },
      { x: 340, y: 495, element: 'wind', id: 'm2', neighbors: ['m1', 'm3'] },
      { x: 340, y: 550, element: 'wind', id: 'm3', neighbors: ['m2', 'm4'], startLit: true },
      { x: 240, y: 608, element: 'wind', id: 'm4', neighbors: ['m3', 'm5'] },
      { x: 140, y: 550, element: 'wind', id: 'm5', neighbors: ['m4', 'm6'], startLit: true },
      { x: 140, y: 495, element: 'wind', id: 'm6', neighbors: ['m5', 'm1'] },
    ],
    doors: [
      { x: 335, y: 1270, width: 70, height: 40, needs: ['f1'] },
      { x: 85, y: 960, width: 70, height: 40, needs: ['f2a', 'f2b'] },
      {
        x: 335,
        y: 650,
        width: 70,
        height: 40,
        needs: ['star0', 'star4', 'star3', 'star1', 'star2'],
        ordered: true,
      },
      {
        x: 85,
        y: 340,
        width: 70,
        height: 40,
        needs: ['m1', 'm2', 'm3', 'm4', 'm5', 'm6'],
      },
    ],
    notes: [
      {
        x: 440,
        y: 880,
        prompt: '阅读',
        text:
          '五碑同形，五源归一。\n启门之序，不在碑，而在阵。\n一画成星，起与顶，越一而连。\n五步归始，门自开焉。\n逆序或错触，五碑俱灭。',
      },
      {
        x: 440,
        y: 590,
        prompt: '阅读',
        text:
          '六碑同形，一炁共鸣。\n触其一，其自易，其邻者亦易。\n明灭相易，六碑皆明，门自开。\n古碑残留，明灭有定。\n勿逆其性，顺其鸣。',
      },
    ],
    dome: { apexY: 70, springY: 150, holeX: 340, holeWidth: 80, thickness: 16 },
    spire: { x: 240, y: 30, radius: 30 },
    music: 'music-tower',
    cage: { x: 400, y: 300, prompt: '开启' },
    hints: [
      { x: 46, y: 1310, text: '第一层' },
      { x: 46, y: 995, text: '第二层' },
      { x: 46, y: 690, text: '第三层' },
      { x: 46, y: 380, text: '第四层' },
      { x: 210, y: 260, text: '塔顶' },
      { x: 300, y: 1500, text: '按 F 点亮方碑' },
      { x: 240, y: 1150, text: '两座方碑都要点亮' },
      { x: 400, y: 920, text: '墙上有一张纸' },
      { x: 400, y: 618, text: '墙上有一张纸' },
    ],
  },

  {
    name: '第六关 · 岩之国度',
    intro:
      '这里就是风神提到的璃月吧。\n荻花洲的芦苇在晚风里摇，远处那座岩柱上的木楼就是望舒客栈。\n天快黑了，先摸一摸路边的神像，再上去歇一晚。',

    width: 2000,
    height: 540,
    startElement: 'wind',
    spawn: { x: 60, y: 467 },
    bg: 'liyue',
    inn: { x: 1860, y: 480 },
    // 神像在关卡开头：这一关开局没有岩元素，得先摸神像拿到，后面的岩刺/板子/石壁才用得上
    statue: { x: 520, y: 480, grants: 'rock', prompt: '触摸' },
    goal: { x: 1770, y: 466, kind: 'chest', prompt: '打开', after: 'statue' },
    platforms: [
      // 荻花洲的长堤：从岸边一直铺到望舒客栈前，顶上 480
      { x: 1000, y: 510, width: 2000, height: 60 },
      // 岩刺走廊上方的岩棚（走廊净高 80，正好卡着人走）
      { x: 850, y: 380, width: 460, height: 40 },
      // 压力板上方的岩檐：想站上去踩板子，就得顶着落下来的岩刺
      { x: 1200, y: 380, width: 160, height: 40 },
      // 拦路的岩壁：一整根从关卡顶部挂到门顶（0~380），下面就是石门（380~480）。
      // 只有 80 宽，玩家走到它跟前正好站在门口，不会被旁边的石头夹住；
      // 顶到 y=0 是为了风元素也没法从上面绕过去
      { x: 1460, y: 190, width: 80, height: 380 },
      // 客栈前的小石台，上面放着最后一颗原石
      { x: 1700, y: 444, width: 80, height: 20 },
    ],
    plates: [
      // 板子压在岩刺正下方：站上去要挨扎，拿岩柱压住才是最稳的办法
      { x: 1200, y: 476, id: 'p1' },
    ],
    doors: [
      { x: 1460, y: 430, width: 80, height: 100, needs: ['p1'] },
    ],
    launchers: [
      // 走廊里的两门：间隔一样但错开摆放，跑过去要卡节奏
      { x: 760, y: 407, interval: 2.6 },
      { x: 940, y: 407, interval: 2.6 },
      // 压力板上方那一门
      { x: 1200, y: 407, interval: 2.2 },
    ],
    orbs: [],
    gems: [
      { x: 300, y: 440 },
      { x: 760, y: 440 },
      { x: 940, y: 440 },
      { x: 1290, y: 440 },
      { x: 1700, y: 404 },
    ],
    blessings: [],
    hazards: [],
    monuments: [],
    notes: [
      {
        x: 150,
        y: 464,
        prompt: '阅读',
        text:
          '残卷上写着：\n"岩之国度，契约之乡。\n' +
          '一柱立地，可承千钧。\n一石在身，可挡一劫。\n' +
          '然岩性不移，行则迟缓。\n顺其性者，可行远。"',
      },
      {
        x: 1330,
        y: 464,
        prompt: '阅读',
        text:
          '残卷上写着：\n"重物压机，门自启。\n' +
          '人立其上，机亦应之，\n然山中之石，可代人行远。"',
      },
    ],
    hints: [
      { x: 220, y: 430, text: '按 F 读一读残卷' },
      { x: 520, y: 356, text: '按 F 触摸神像' },
      { x: 700, y: 440, text: '岩刺会扎人：按 X 岩化能挡一下' },
      { x: 1130, y: 440, text: '按 C 把岩柱砸在压力板上' },
      { x: 1660, y: 400, text: '望舒客栈就在前面' },
    ],
  },

]
