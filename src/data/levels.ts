import type { ElementKey } from './elements'

export type PlatformDef = {
  x: number
  y: number
  width: number
  height: number
  oneWay?: boolean
  crumble?: boolean
  water?: boolean   // 顶面叠一层浅水（只做画面，不参与碰撞）
  grass?: boolean   // 顶面叠一层草（只做画面，不参与碰撞）
  brick?: boolean   // 表面盖一层砖石（村庄断墙用，同样只做画面）
  plank?: boolean   // 表面盖一层木板（木桥用，同样只做画面）
  tint?: number     // 覆盖主题配色：村庄断墙、矿洞岩壁这类要单独上色的块
  depth?: number    // 画在哪一层：古树的后层楼梯给 1（会被树干挡住），前层给 3
  rail?: boolean    // 平台边缘画一道护栏（和楼梯护栏同高，用来接上）
  pillars?: number   // 楼板下面画几根立柱（从楼板底面撑到下一层楼板，没有就往下 60 像素）
  layer?: 'front' | 'back'   // 只在「树前」或「树后」某一层存在的补片（第七关楼板上的活板）：
                             // 树前层时它是完整楼板、可以正常走过去；树后层时它消失、露出楼梯井

}

// 画在玩家前面的摆件：牌楼前层、停在水里的船、前景灯笼之类
export type ForegroundDef = {
  x: number
  y: number        // 底边那条线
  key: string
  scale?: number
  alpha?: number
}

// 千岩军：巡逻 + 扇形视野（视野朝斜下方）。看见玩家 2.5 秒转追击，追击撞到障碍就放弃
export type GuardDef = {
  x: number
  y: number        // 底边贴地那条线
  range: number    // 以 x 为中心左右各巡逻多远
  speed?: number   // 巡逻速度，默认 26
  facing?: 1 | -1  // 开局朝向，默认朝右
  vision?: number  // 视野半径，默认 170
}
// 关卡里的魔物：会来回巡逻，碰到即死；被雷鸣劈中眩晕 3 秒（眩晕里不动、碰到不死）
export type MonsterDef = {
  x: number
  y: number        // 底边贴地那条线（地面顶面）
  range: number    // 以 x 为中心，左右各巡逻多远
  speed?: number   // 不写就是 30 像素/秒
}

// 木楼梯：从下层地面一级一级走到上层地面。
// from 是最下面一级搭脚的地方（贴下层地面的顶面），to 是楼梯顶端踩到的上层地面顶面。
export type StairDef = {
  from: { x: number; y: number }
  to: { x: number; y: number }
  depth?: number    // 不写就是 3（画在树干前面）
  layer?: 'front' | 'back'   // 画在树干前面（front，默认）还是树干后面（back）
}

// 进出「树的图层」的判定区：玩家踩进去就把自己的图层切成 layer。
// 前半段楼梯在树前面走，走到 1/2 层平台最右端（树右边那一个史莱姆宽的地方）切到 back，
// 人就到树后面去了；绕到树左边、踩上下一层平台时再切回 front。
export type DepthGateDef = {
  x: number
  y: number
  width: number
  height: number
  // 在判定区里朝这个方向走的时候，把「树前/树后」翻一层（-1 往左、1 往右，默认 1）。
  // 上楼和下楼在同一块平台上走的方向不一样，靠这个分开
  dir?: -1 | 1
}

// 路上能捡的东西（第七关的木材）
export type PickupDef = {
  x: number
  y: number
  key?: string       // 贴图，不写就用 'wood-plank'
  prompt: string
}

// 楼梯上的断口：哪一跑、断了哪几级、修好之后长回来
export type RepairDef = {
  stair: number      // 在 level.stairs 里的下标（0 起）
  steps: number[]    // 这一跑里要挖掉的踏步序号（0 = 最下面一级）
  x: number          // 玩家站在这附近按 F 修
  y: number
  prompt: string
}

// 背景静物：房子、山体这类只做画面、不参与碰撞的东西
export type DecorDef = {
  x: number
  y: number         // 底边贴着的那条线（地面顶面）
  key: string
  scale?: number
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
  after?: 'cage' | 'statue' | 'repair'| 'xiao'
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

export type BgTheme = 'beach' | 'field' | 'church' | 'sky' | 'tower' | 'liyue' | 'harbor'

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
  harbor: { ground: 0x8a6a4a, oneWay: 0xb09068, crumble: 0x9a5a44, hazard: 0x2f6f8f },
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
  stairs?: StairDef[]
  depthGates?: DepthGateDef[]
  pickups?: PickupDef[]
  repairs?: RepairDef[]
  orbs: OrbDef[]
  gems: { x: number; y: number; layer?: 'front' | 'back' }[]
  // layer：这颗原石属于哪一层。写 'back' 的挂在树干之后，
  // 只有史莱姆也在树后层、透视洞把它露出来时才看得到、捡得到
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
  decor?: DecorDef[]                      // 背景静物：破屋、矿山剪影
  trunk?: { x: number; y: number; width: number; height: number; depth?: number }
  // 古树主干：竖着平铺树皮带，x/y 是中心点
  spindle?: { x: number; y: number; width: number; height: number; depth?: number }
  // 楼内那根"短木"（楼内楼梯绕着它上）：同样画成 RenderTexture，
  // 史莱姆在树后层时在它附近擦一个透视洞
  lift?: { x: number; width: number; stops: number[] }
  // 木制水利电梯：x = 井道中心，width = 井道宽，
  // stops = 每层楼板顶面 y（从高到低写）
  bgSpin?: number                         // 背景横向"环树"系数：往上爬时背景往一侧流
  statue?: StatueDef
  unlocks?: ElementKey[]                  // 本关开局就解锁的元素（没有神像但想给某个元素时用）
  plates?: PlateDef[]
  launchers?: LauncherDef[]
  chase?: boolean
  hints: HintDef[]

  guards?: GuardDef[]
  foreground?: ForegroundDef[]
  // 港口背景打包：一段 460 宽，kind 选港口 / 街道 / 郊区，variant 选第几版（不写＝第一版）
  harborBlocks?: { at: number; kind: 'dock' | 'street' | 'suburb'; variant?: 1 | 2 | 3 }[]
  chaseAt?: number          // 走过这条线：演出一下、立刻生成追击小队
  squadCount?: number       // 小队人数，默认 3
  squadSpeed?: number       // 追击速度，默认 92（玩家全速 100）
  squadSpawnGap?: number    // 生成在玩家身后多少像素，默认 260
  squadStop?: number        // 跑过这条线就甩掉他们
  chaseCause?: string       // 被抓时的死因，默认 'guard'（死亡界面会写"被千岩军抓住了……"）

  monsters?: MonsterDef[]
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
  texture?: string  // 不写就是石门（gate），铁栅栏用 iron-gate
  tint?: number     // 不写就按贴图本来的颜色
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
      { x: 330, y: 440, text: '长按空格漂浮（耗体力）' },
      { x: 1190, y: 465, text: '风史莱姆可以缓降（也耗体力）' },
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
      { x: 260, y: 430, text: '长按空格飞出坑口（耗体力）' },
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
      '这里就是风神提到的璃月吧。\n荻花洲的芦苇在晚风里摇，远处那座岩柱上的木楼就是望舒客栈。\n天快黑了，先去歇一晚。',

    width: 3500,
    height: 540,
    startElement: 'wind',
    spawn: { x: 60, y: 467 },
    bg: 'liyue',
    inn: { x: 3450, y: 480 },
    // 神像在过桥之后的土堆顶上：这一关开局没有岩元素，得先摸神像拿到，
    // 后面的双压力板、铁栅栏、岩刺走廊才用得上
    statue: { x: 1500, y: 444, grants: 'rock', prompt: '触摸' },
    // 宝箱放在出洞口那颗原石后面，先捡原石再开箱
    goal: { x: 3390, y: 466, kind: 'chest', prompt: '打开', after: 'statue' },
    platforms: [
      // ① 荻花洲岸边：出生点，往右就是断桥
      { x: 350, y: 510, width: 700, height: 60, grass: true },
      // ② 木桥：拱形，桥面是一级级的台阶（扶梯），中间两处断板
      // （820~880、1180~1240）可以掉下去；顶面从岸边的 480 起拱，最高 432
      { x: 730, y: 474, width: 60, height: 16, plank: true },
      { x: 790, y: 460, width: 60, height: 16, plank: true },
      { x: 910, y: 448, width: 60, height: 16, plank: true },
      { x: 970, y: 442, width: 60, height: 16, plank: true },
      { x: 1030, y: 440, width: 60, height: 16, plank: true },
      { x: 1090, y: 442, width: 60, height: 16, plank: true },
      { x: 1150, y: 448, width: 60, height: 16, plank: true },
      { x: 1270, y: 460, width: 60, height: 16, plank: true },
      // 桥洞下的浅水：顶面 496，比桥面最高的地方低 64，
      // 从两个缺口都能跳回桥面（最近的断板顶面 452，跳高 56 够用）
      { x: 1000, y: 511, width: 600, height: 30, water: true },
      // ③ 神像土堆：两层往里收的草土堆，神像站在最上面那层
      { x: 1525, y: 510, width: 450, height: 60, grass: true },
      { x: 1500, y: 471, width: 200, height: 18, grass: true },
      // 顶面留宽一点，玩家站到神像两侧时交互距离（64）才够得着
      { x: 1500, y: 450, width: 160, height: 12, grass: true },
      // ④ 破败的村庄：几段断墙，跳过去就是矿洞口
      { x: 2050, y: 510, width: 600, height: 60 },
      { x: 1830, y: 466, width: 16, height: 28, brick: true },
      { x: 1900, y: 460, width: 60, height: 40, brick: true },
      { x: 2030, y: 466, width: 20, height: 28, brick: true },
      // ⑤ 矿洞口：门前空地 + 从关卡顶部挂到门顶的岩壁（0~380），
      // 顶到 y=0 是为了风元素也没法从上面绕过去
      { x: 2500, y: 510, width: 300, height: 60 },
      { x: 2650, y: 190, width: 80, height: 380, tint: 0x5b4a38 },
      // ⑥ 矿洞：地面一直铺到客栈，洞顶从洞口盖到陷阱尽头（净高 80，正好卡着人走）
      { x: 3075, y: 510, width: 850, height: 60 },
      { x: 2955, y: 200, width: 610, height: 400, tint: 0x4a3d30 },
    ],
    plates: [
      // 两块板隔 70 像素：一个人的身位压不住两块，一根岩柱也只能压一块，
      // 所以必须「岩柱压一块 + 自己岩化站在另一块上」
      { x: 2450, y: 476, id: 'p1' },
      { x: 2520, y: 476, id: 'p2' },
    ],
    doors: [
      // 洞口铁栅栏：单独一张铁栏杆贴图，两块板同时压住才开
      { x: 2650, y: 430, width: 80, height: 100, needs: ['p1', 'p2'], texture: 'iron-gate' },
    ],
    launchers: [
      // 前两门是教学：间隔 2.6 秒，卡着节奏能跑过去
      { x: 2760, y: 407, interval: 2.6 },
      { x: 2880, y: 407, interval: 2.6 },
      // 强制点：四门挤在 108 像素里，每 0.9 秒一轮。
      // 危险区 148 像素：岩化（90/秒）要 1.64 秒才能穿过去，> 0.9 秒，
      // 所以不管什么节奏进来都躲不掉，必挨一下；
      // 又因为 1.64 < 0.9×2，最多只会碰上两轮，第二轮被 1.2 秒无敌吃掉，
      // 于是「岩化挡一次」是唯一解，也不会被第二下打死。
      { x: 3060, y: 407, interval: 0.9 },
      { x: 3096, y: 407, interval: 0.9 },
      { x: 3132, y: 407, interval: 0.9 },
      { x: 3168, y: 407, interval: 0.9 },
    ],
    orbs: [],
    gems: [
      { x: 860, y: 470 },   // 桥洞下那一颗：得从缺口跳下去才拿得到
      { x: 2700, y: 440 },  // 进矿洞
      { x: 3320, y: 440 },  // 出矿洞
    ],
    blessings: [],
    hazards: [],
    monuments: [],
    // 背景静物：左边是塌掉的村子，越往右越像矿山，最后收在洞口那面岩壁上
    decor: [
      { x: 1790, y: 480, key: 'ruin-house' },
      { x: 1980, y: 480, key: 'ruin-house-broken' },
      { x: 2170, y: 480, key: 'ruin-house', scale: 0.85 },
      { x: 2360, y: 480, key: 'mine-hill' },
      { x: 2520, y: 480, key: 'mine-hill', scale: 1.25 },
      { x: 2650, y: 480, key: 'mine-cliff' },
    ],
    notes: [
      {
        x: 2380,
        y: 464,
        prompt: '阅读',
        text: '"重物压机，门自启。\n人立其上，机亦应之，\n然山中之石，可代人行远。"',
      },
    ],
    hints: [
      { x: 1630, y: 420, text: '按 F 触摸神像' },
      { x: 2760, y: 440, text: '岩刺会扎人：按 X 岩化能挡一下' },
      { x: 3300, y: 286, text: '望舒客栈就在前面' },
    ],
  },

  {
    name: '第七关 · 修复望舒客栈',
    intro:
      '听客栈的人说，这里最近遭了\n魔物袭击，楼梯断了好几处。\n我去找老板娘问问怎么回事。',
    width: 960,
    height: 2200,
    startElement: 'rock',
    // 开局就给风：这关没有神像，不给的话从选关直接进来的玩家切不出风来（也爬不上去看观感）
    unlocks: ['wind'],
    spawn: { x: 220, y: 2144 },          // 一楼地面左侧（树根左边）
    bg: 'liyue',
    // 爬得越高，背景越往一侧流 —— 「绕着古树盘旋而上」的感觉
    bgSpin: 0.25,
    trunk: { x: 460, y: 1555, width: 220, height: 890 },   // 主杆：y 1110~2000
    spindle: { x: 510, y: 758, width: 22, height: 704 },   // 楼内短木：顶 406（顶楼楼板底面）、底 1110（一层楼板面）
    lift: { x: 240, width: 80, stops: [400, 650, 900, 1110, 2160] },   // 最低一站在一楼地面上
    goal: { x: 880, y: 386, kind: 'chest', prompt: '打开', after: 'xiao' },
    platforms: [
      // 一楼地面（顶面 2160）
      { x: 480, y: 2180, width: 960, height: 40 },

      // 室外：左端楼层平台（顶面 1810 / 1460 / 1110）
      { x: 302, y: 1813, width: 120, height: 6, depth: 3, plank: true, pillars: 3 },
      { x: 302, y: 1463, width: 120, height: 6, depth: 3, plank: true, pillars: 3 },
      // 室外：右端 1/2 层平台（顶面 1985 / 1635 / 1285）
      { x: 630, y: 1988, width: 120, height: 6, depth: 3, rail: true, plank: true, pillars: 3 },
      { x: 630, y: 1638, width: 120, height: 6, depth: 3, rail: true, plank: true, pillars: 3 },
      { x: 630, y: 1288, width: 120, height: 6, depth: 3, rail: true, plank: true, pillars: 3 },
      
      // 1110 层
      { x: 100, y: 1113, width: 200, height: 6, depth: 3, plank: true },
      { x: 321, y: 1113, width: 82,  height: 6, depth: 3, plank: true },
      { x: 410, y: 1113, width: 96,  height: 6, depth: 3, plank: true, layer: 'front' },
      { x: 709, y: 1113, width: 502, height: 6, depth: 3, plank: true },
      
      // 900 层
      { x: 100, y: 903, width: 200, height: 6, depth: 3, plank: true },
      { x: 355, y: 903, width: 150, height: 6, depth: 3, plank: true },
      { x: 482, y: 903, width: 104, height: 6, depth: 3, plank: true, layer: 'front' },
      { x: 747, y: 903, width: 426, height: 6, depth: 3, plank: true },
      
      // 650 层
      { x: 100, y: 653, width: 200, height: 6, depth: 3, plank: true },
      { x: 355, y: 653, width: 150, height: 6, depth: 3, plank: true },
      { x: 482, y: 653, width: 104, height: 6, depth: 3, plank: true, layer: 'front' },
      { x: 747, y: 653, width: 426, height: 6, depth: 3, plank: true },

      
      // 楼内：绕短木的半层平台（顶面 985 / 775 / 525）
      // 楼内六跑楼梯每跑的上端都落在 x=590，就是踩在这三块上
      { x: 650, y: 988, width: 120, height: 6, depth: 3, rail: true, plank: true },
      { x: 650, y: 778, width: 120, height: 6, depth: 3, rail: true, plank: true },
      { x: 650, y: 528, width: 120, height: 6, depth: 3, rail: true, plank: true },

      // 顶楼 400
      { x: 100, y: 403, width: 200, height: 6, depth: 3, plank: true },
      { x: 355, y: 403, width: 150, height: 6, depth: 3, plank: true },
      { x: 470, y: 403, width: 80,  height: 6, depth: 3, plank: true, layer: 'front' },
      { x: 735, y: 403, width: 450, height: 6, depth: 3, plank: true },
      // 顶楼阳台（宝箱 880,386 在这上面）
      { x: 855, y: 403, width: 210, height: 6, depth: 3, rail: true, plank: true },
    
    ],

    stairs: [
      // 室外：绕树六跑（每跑升 175、横向 208）
      { from: { x: 362, y: 2160 }, to: { x: 570, y: 1985 }, layer: 'front' },
      { from: { x: 570, y: 1985 }, to: { x: 362, y: 1810 }, layer: 'back' },
      { from: { x: 362, y: 1810 }, to: { x: 570, y: 1635 }, layer: 'front' },
      { from: { x: 570, y: 1635 }, to: { x: 362, y: 1460 }, layer: 'back' },
      { from: { x: 362, y: 1460 }, to: { x: 570, y: 1285 }, layer: 'front' },
      { from: { x: 570, y: 1285 }, to: { x: 362, y: 1110 }, layer: 'back' },

      // 楼内：绕短木六跑（每跑升 125、横向 160）
      { from: { x: 430, y: 1110 }, to: { x: 590, y: 985 }, layer: 'front' },
      { from: { x: 590, y: 985 }, to: { x: 430, y: 900 }, layer: 'back' },
      { from: { x: 430, y: 900 },  to: { x: 590, y: 775 }, layer: 'front' },
      { from: { x: 590, y: 775 }, to: { x: 430, y: 650 }, layer: 'back' },
      { from: { x: 430, y: 650 },  to: { x: 590, y: 525 }, layer: 'front' },
      { from: { x: 590, y: 525 }, to: { x: 430, y: 400 }, layer: 'back' },
    ],

    depthGates: [
      // 室外：1/2 层平台往右、楼层平台往左
      { x: 610, y: 1969, width: 32, height: 40 },
      { x: 280, y: 1794, width: 32, height: 40 },
      { x: 610, y: 1619, width: 32, height: 40 },
      { x: 280, y: 1444, width: 32, height: 40 },
      { x: 610, y: 1269, width: 32, height: 40 },

      // 楼内：1/2 层平台往右（上楼下楼的人都是从左边走进来的，进来时往右走一下正好换层）
      { x: 630, y: 969, width: 32, height: 40 },
      { x: 630, y: 759, width: 32, height: 40 },
      { x: 630, y: 509, width: 32, height: 40 },

      { x: 362, y: 1094, width: 32, height: 40 },
      { x: 430, y: 884,  width: 32, height: 40 },
      { x: 430, y: 634,  width: 32, height: 40 },
      // 顶楼（400 那层）的楼梯口也在 430，同上一行一个道理
      { x: 430, y: 384,  width: 32, height: 40 },
    ],
    pickups: [
      { x: 300, y: 1810, prompt: '拾取木材' },
      { x: 300, y: 1460, prompt: '拾取木材' },
    ],
    repairs: [
      { stair: 2, steps: [5, 6], x: 440, y: 1750, prompt: '修理楼梯' },
      { stair: 4, steps: [5, 6], x: 440, y: 1400, prompt: '修理楼梯' },
    ],
    orbs: [],
    gems: [
      // 树后层那两颗：放在树后两跑楼梯的踏面上（x=466 处，踏面顶 1890.8 / 1540.8），
      // 站树前层看不见也捡不到，绕到树后才拿得到
      { x: 466, y: 1884, layer: 'back' },
      { x: 466, y: 1534, layer: 'back' },
      { x: 880, y: 370 },
    ],
    blessings: [],
    hazards: [],
    monuments: [],
    plates: [
      // 花树左边的压力板：岩柱压上去 / 岩化史莱姆站上去 → 树上开始飘花
      { x: 620, y: 2160, id: 'blossom' },
    ],
    hints: [],
  },

 {
    name: '第八关 · 可疑人员',
    intro:
      '走了三天，终于看见璃月港了。\n今天码头上格外热闹 —— 赶上了一年一度的请仙典仪。\n先去玉京台那边看看，说不定能问出回家的路。',

    width: 5600,
    height: 1200,
    // 岩是上一关带过来的；雷是本关新给的（雷神像还没画，先用 unlocks 顶着）
    startElement: 'rock',
    unlocks: ['wind', 'thunder'],
    spawn: { x: 60, y: 1120 },
    bg: 'harbor',
    // 混出港区：跑到最右边把箱子开了
    goal: { x: 5520, y: 1146, kind: 'chest', prompt: '打开' },

    platforms: [
      // ① 码头那一段石岸（顶面 1160）
      { x: 1050, y: 1180, width: 2100, height: 40, brick: true },
      // （木箱 / 摊位台子这些小障碍由用户自己手动摆：48 高那种刚好"站着能挡视线、
      //   跳一下能翻过去"，两边都兼顾）

      { x: 2550, y: 1115, width: 400, height: 6, brick: true, pillars: 2 },   // 顶面 1112
      { x: 3150, y: 1067, width: 400, height: 6, brick: true, pillars: 2 },
      // ② 藏着原石的那道矮通道：净空 22（要跳起来往右挤才能钻过去）
      { x: 2700, y: 1124, width: 200, height: 28, brick: true },  // 底面 1138 → 净空 22

      // ③ 玉京台前广场（顶面 1016）
      { x: 3975, y: 1019, width: 850, height: 6, brick: true, pillars: 3 },
      // （广场上给千岩军当掩体的箱子也由用户自己摆）
      // 通往演仪台的一小段台阶
      { x: 4300, y: 1015, width: 120, height: 6, brick: true },

      // ⑤ 逃脱跑酷：从广场一路往下跳回码头
      { x: 4600, y: 1067, width: 180, height: 6, plank: true },   // 顶面 1064
      { x: 4890, y: 1115, width: 160, height: 6, plank: true },   // 顶面 1112
      { x: 5170, y: 1163, width: 200, height: 6, plank: true },   // 顶面 1160
      // 最后一段码头（顶面 1160）
      { x: 5450, y: 1180, width: 500, height: 40, brick: true },
    ],

    // 三段石阶（from 是最下边一级、to 是踩到的上一层顶面）
    stairs: [
      { from: { x: 2150, y: 1160 }, to: { x: 2350, y: 1112 }, layer: 'front' },
      { from: { x: 2780, y: 1112 }, to: { x: 2980, y: 1064 }, layer: 'front' },
      { from: { x: 3380, y: 1064 }, to: { x: 3580, y: 1016 }, layer: 'front' },
    ],

    // ② 石阶中间那道机关：压力板只有岩柱 / 岩化能压住，压住才开铁栅栏
    plates: [{ x: 2600, y: 1112, id: 'h1' }],
    doors: [{ x: 2900, y: 1062, width: 80, height: 100, needs: ['h1'], texture: 'iron-gate' }],

    // ③ 广场上巡逻的两名千岩军（视野朝斜下方，正前方看不见）
    guards: [
      { x: 3700, y: 1016, range: 140 },
      { x: 4150, y: 1016, range: 180, facing: -1 },
    ],

    // ⑤ 逃脱：走过 4400 触发"被发现了"的演出 + 生成三名千岩军，5480 甩掉
    chaseAt: 4400,
    squadCount: 3,
    squadSpeed: 92,
    squadSpawnGap: 240,
    squadStop: 5480,
    chaseCause: 'guard',

    orbs: [],
    gems: [
      { x: 2760, y: 1150 },   // 那道矮通道里面（净空 22，要挤进去）
      { x: 4650, y: 1040 },   // 逃脱第一段屋顶上
      { x: 5200, y: 1136 },   // 最后一段码头上
    ],
    blessings: [],
    hazards: [],
    monuments: [],
    notes: [
      {
        x: 2500,
        y: 1136,
        prompt: '阅读',
        text:
          '码头告示：\n今日请仙典仪，玉京台一带\n闲人止步。\n（听说老屋底下有一道缝，\n瘦一点的能钻过去……）',
      },
    ],

    // 港口背景打包：一段 460，想要长一点就多复制几段。kind = dock 港口 / street 街道 / suburb 郊区
    // variant 不写就是第一版；两版轮着铺，街景才不重复
    harborBlocks: [
      { at: 0, kind: 'dock' },      // 码头：有水面、船只、护栏
      { at: 460, kind: 'dock', variant: 2 },
      { at: 920, kind: 'street' },  // 上街：水面和护栏自动消失
      { at: 1380, kind: 'street', variant: 2 },
      { at: 1840, kind: 'street' },
      { at: 2300, kind: 'suburb' }, // 郊区：房子稀疏、摊位也少
      { at: 2760, kind: 'suburb', variant: 2 },
      { at: 3220, kind: 'street', variant: 2 },
      { at: 3680, kind: 'street' },
      { at: 4140, kind: 'street', variant: 2 },
      { at: 4600, kind: 'suburb', variant: 2 }, // 逃脱段也铺上，跑酷时不至于空荡
      { at: 5060, kind: 'dock' },   // 最后一段又回到码头
    ],

    hints: [
      { x: 160, y: 1100, text: '往右走：码头 → 集市街 → 玉京台的石阶' },
      { x: 1350, y: 1080, text: '集市街：摊位能踩、史莱姆人群只是背景' },
      { x: 2500, y: 1080, text: '老屋底下那道缝能钻过去（净空 22）' },
      { x: 2600, y: 1060, text: '压力板：只有岩柱 / 岩化能压住' },
      { x: 3700, y: 960, text: '千岩军：别站进他的视野；岩化不动他不会发现' },
      { x: 4300, y: 960, text: '前面就是请仙典仪' },
      { x: 4420, y: 960, text: '往右跑！被盯上了' },
      { x: 5400, y: 1100, text: '跑到尽头把箱子开了就算混出去了' },
    ],
  },

]
