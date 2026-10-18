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
  hidden?: boolean  // 只碰撞不画（秘境云台：画面用 decor 的 cloud-puff）
  // 只画不挡人：台体、基座这类"当背景看的墙"用（玉京台下面那道墙就是它）。
  // 画面照旧画，但不参与碰撞，史莱姆可以从它前面走过去
  solid?: boolean   // 不写＝参与碰撞
  // 叠在地形之上的"道具"平台（屋檐、木箱、断桥这种摆在街上的东西）：
  // 算背景落脚线时**不拿它当参考** —— 不然挂在背景上的房子会跟着这些道具往上飘
  overlay?: boolean
  rail?: boolean    // 平台边缘画一道护栏（和楼梯护栏同高，用来接上）
  railBar?: boolean // 平台悬空那端的实体挡板（防走掉下去）。写 false 就不要，
                    // 阶梯井口那种必须能走过去的地方要关掉，否则人下不去楼梯
  // 站上去就把「前层 / 后层」翻一层的平台（玉京台的半层小平台用）：
  // 踩过它一次翻一层，配合"站在哪一跑楼梯上就属于哪一层"，上楼切后层、下楼切回前层
  layerFlip?: boolean
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
  // 楼梯样式：wood = 原来的木楼梯（第七关客栈那种），
  // brick = 砖石台阶（底下是实心台体），ramp = 砖石斜坡（同样是实心，只是面是平的）
  style?: 'wood' | 'brick' | 'ramp'
  // 自带的木扶栏画不画：不写就画；none = 不画（改用 revealRails 里那种带透视的石栏杆）
  rail?: 'normal' | 'none'
  // 扶栏画在第几层：不写就跟着 layer（front → 12「画在人前面」，back → 1.4「画在人后面」）。
  // 玉京台的下半层就是这个用法：楼梯本体在前层，栏杆强制压到史莱姆下面
  railDepth?: number
  // 下跑的"穿过去"开关（玉京台用）：沿着这一跑下到地面之后，要是往玉京台外面走，
  // 不该被这条下跑再抬上去 —— 落地后先把这一跑的碰撞关掉（画面也画在人后面，depth 给 1），
  // 等身体整个穿过它再恢复
  passUnder?: boolean
}

// 拱形土坡（2026/10/16 新增）：**走线本身是一条真的弧**，不是台阶拼出来的。
// 顶面高度按抛物线算：y(x) = y + rise × t²，其中 t = (x − 中心) ÷ (跨度 ÷ 2)，
// 所以中间最高（y）、两端各低 rise，是一条左右对称的拱。
//
// 物理上 Arcade 只有轴对齐矩形、没有斜面，所以这一段不走碰撞体，靠"贴地"接管：
// 人走进弧的 x 范围、脚底贴着弧面时，GameScene.updateSlopes() 每帧把脚底按曲线按上去、
// 临时关掉重力、当成站在地上（跳跃、体力回复都照常 —— onGround 把这一条也算进去了）。
export type SlopeDef = {
  x: number         // 拱顶（最高处）所在 x
  y: number         // 拱顶那条走线 y
  width: number     // 跨度：以 x 为中心，左右各 width ÷ 2（两端高度 = y + rise）
  rise: number      // 两端比拱顶低多少（＝拱高）
  // 只用这条拱的一段（默认 tStart = -1、tEnd = 1 ＝整条拱）。
  // 盘山道就是这么拼出来的：**半条拱 = 一条单调上升的坡** ——
  //   tStart 0 / tEnd 1（rise 为正）：从拱顶那种"平"起步，越走越陡（＝起步要缓）；
  //   tStart -1 / tEnd 0（rise 为正）：越走越平（＝收口，走到平台上不硌脚）。
  // 两条这样的坡首尾相接，接缝处的斜率都是 0，所以接起来是光滑的
  tStart?: number
  tEnd?: number
  depthTo?: number  // 土体向下填到哪条 y（不写＝拱顶往下 90）
  tint?: number     // 土体颜色（不写＝该主题的地面色）
  grass?: boolean   // 沿着弧面铺一条草带
  depth?: number    // 画在第几层（不写＝2，和背景岩层同一档）
  // 这一跑属于「前层」还是「后层」（不写＝front）。盘山道拐角处两条跑的 x 是重叠的 ——
  // 在 2D 侧视里它们必然要碰头，靠"上下错开"或"跳一下"都不好用（用户 2026/10/16 定），
  // 改成**按层分开**：上下两跑各占一层，贴地只管**当前这一层**的坡，
  // 走到拐角用 depthGates 翻层，和玉京台折返楼梯一个思路。
  // 画面上记得让后层的 depth 比前层小（前层才会盖住后层）
  layer?: 'front' | 'back'
  // 曲线形状（不写＝arch）：
  //   arch —— 拱形（原来的抛物线），中段最平、两端最陡，适合"一个山头 / 一个土包"；
  //   ramp —— **两头都平的坡**（smoothstep），起点和终点都是 0 斜率，中段最陡（最陡处 ≈ 1.5·rise÷跨度）。
  //           盘山道每一跑都用这个：进坡、出坡都不硌脚，中段最陡也不会超过 45 度左右。
  // 两种形状用的是同一套参数：t 从 tStart 走到 tEnd，tEnd 那一端永远是最高的（y 最小）
  mode?: 'arch' | 'ramp'
  // 山体正面的装饰（第九关）：斜岩层 + 一条竖向冲沟。
  // 这些细节画在坡体的岩石填色**里面**，不会盖到草带和走面。
  //   gully —— 冲沟中心的世界 x（不写就只画岩层）
  frontFace?: { gully?: number }
  // 这一段坡的走面要画在瀑布前面（第九关 C2→山顶的 R3）：
  // 只把草带和 26 像素泥土层抬到瀑布之上，坡体本身仍在瀑布后面
  overWaterfall?: boolean
}

// 带透视的栏杆：画在玩家前面（depth 12），玩家走到它后面时在它身上擦一个洞，
// 于是史莱姆不会被栏杆挡死 —— 和第七关那棵古树用的是同一套做法。
// 每段是 from → to 的一条直线（水平的、倾斜的都行），样式取 'rail-stone' 这张贴图
export type RevealRailDef = {
  from: { x: number; y: number }
  to: { x: number; y: number }
  key?: string      // 不写就用 'rail-stone'
  height?: number   // 栏杆贴图的高度，默认按贴图本身
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

// 第十关送仙典仪的三样供品（夜泊石 / 霓裳花 / 永生香）。纯拾取，不做木材那套“一次一根”
export type MaterialDef = {
  x: number
  y: number
  key: string
  label: string
  // 要按住 F 读条才拿得到（秒）：站定、不移动、不松手，完成才收进兜里。
  // 不写就是按一下就拿
  hold?: number
}

// 疾风符：拾取后一段时间内移动加速（第九关爬山用）
export type SpeedItemDef = {
  x: number
  y: number
  key?: string      // 不写就用 'speed-charm'
  duration?: number // 秒，默认 10
  multiplier?: number // 速度倍率，默认 1.6
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
  flip?: boolean    // 左右翻过来（崖树贴左边还是右边的崖壁，就靠这个）
  // 画在第几层。不写就是 -5（背景静物，永远在最后面）；崖壁上的树要压在填色之上，给 1.16 左右
  depth?: number
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

export type BgTheme =
  | 'beach'
  | 'field'
  | 'church'
  | 'sky'
  | 'tower'
  | 'liyue'
  | 'harbor'
  | 'harbor-land'
  | 'mountain'

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
  // 璃月港陆地：只有街巷和层楼，没有水面
  'harbor-land': { ground: 0x8a6a4a, oneWay: 0xb09068, crumble: 0x9a5a44, hazard: 0x2f6f8f },
  // 高山：白天的岩土色，和第九关的山体填色同一套
  mountain: { ground: 0x8a6a4a, oneWay: 0xb09068, crumble: 0x9a5a44, hazard: 0x2f6f8f },
}

export type LevelDef = {
  name: string
  intro: string
  width: number
  height: number
  startElement: ElementKey
  spawn: { x: number; y: number }
  goal: GoalDef
  // 本关不摆通关宝箱（第九关的最终宝箱在秘境里，山顶的占位宝箱要关掉）
  goalDisabled?: boolean
  // 山顶的仙人（第九关）：靠近按 F 对话，进入仙家试炼
  crane?: { x: number; y: number }
  // 秘境第一重试炼：浮石 + 分段安全台 + 顶部仙家符箓
  trialOne?: {
    stones: { x: number; y: number; section: number }[]
    checkpoints: { x: number; y: number }[]
    artifact: { x: number; y: number }
  }
  // 秘境第二重试炼：站在云台上撑过五轮岩脊，每题落点随机、落地前有预警
  trialTwo?: {
    arena: { left: number; right: number; groundY: number }
    rounds: number[]
    roundTime: number
    warnTime: number
    // 低空横扫的岩刺：counts 是每轮几条，firstAt / lastAt 是这一轮内的毫秒数，
    // height 是离地高度（站在地上打不到，跳起来才会撞上）
    sideSpikes?: {
      counts: number[]
      firstAt: number
      lastAt: number
      speed: number
      height: number
    }
  }
  // 秘境第三重试炼：三口机关锅，记住苹果后看仙人换锅，三次里猜中两次过关
  trialThree?: {
    area: { left: number; right: number; groundY: number }
    slots: number[]
    rounds: number
    swaps: number[]
    showTime: number
    swapTime: number
  }
  platforms: PlatformDef[]
  // 纯碰撞边缘（不画）：山顶/转角平台的防掉落挡板。
  // 画面由 decor 里的山峰、树、大石块负责，这里只放一个看不见的实体。
  blockers?: { x: number; y: number; width: number; height: number }[]
  stairs?: StairDef[]
  slopes?: SlopeDef[]                      // 拱形土坡：走线是弧的一段地面（第九关的"爬山"要用）
  // 山腰的雾带（第九关）：世界坐标里的一条横向薄雾，缓慢左右飘。
  //   x/y 是中心点；width 不写就用贴图原宽；drift 是左右飘的幅度
  mistBands?: {
    x: number
    y: number
    width?: number
    alpha?: number
    depth?: number
    drift?: number
    duration?: number
  }[]
  // 山顶湖泊（第九关）：x/y 是湖心，width/height 是透视椭圆的尺寸。
  summitLake?: { x: number; y: number; width?: number; height?: number }
  // 瀑布（第九关）：x 是水柱中心，segments 是中间被走线打断后的几段。
  // 每段从 y 往下画 height；段与段之间的空隙正好留给坡面/平台。
  waterfall?: {
    x: number
    width?: number
    segments: { y: number; height: number }[]
  }
  revealRails?: RevealRailDef[]            // 带透视的栏杆（玉京台那种：画在玩家前面，靠近时擦洞）
  // 按高度自动切「前层 / 后层」（玉京台那种两层楼梯用）：脚底在这条线**以上**算后层、
  // 以下算前层。走到半层平台就自动翻层，不用踩判定区，来回走也不会翻错
  layerLine?: { y: number }
  // 镜头把玩家放到画面下半部分：脚底高于 y 时镜头往上偏 offset 像素（玉京台那种高台上用）。
  // band 是回差 —— 要落回 y+band 以下才放下，免得卡在临界高度时镜头来回抖
  cameraLift?: { y: number; band: number; offset: number }
  // 恒定的镜头跟随偏移（爬山关用）：镜头一直往上抬这么多，史莱姆落在画面下半部分，
  // 往上爬时先看见的是"接下来要爬的那一段"。和 cameraLift 是两回事（那个是到高处才抬），
  // 一个关卡只会用其中一个（两个都写时 cameraLift 优先）
  cameraBias?: number
  depthGates?: DepthGateDef[]
  pickups?: PickupDef[]
  materials?: MaterialDef[]
  speedItems?: SpeedItemDef[]
  repairs?: RepairDef[]
  orbs: OrbDef[]
  gems: { x: number; y: number; layer?: 'front' | 'back' }[]
  // layer：这颗原石属于哪一层。写 'back' 的挂在树干之后，
  // 只有史莱姆也在树后层、透视洞把它露出来时才看得到、捡得到
  blessings: { x: number; y: number }[]
  blessingEndX?: number
  hazards: HazardDef[]
  monuments: MonumentDef[]
  ambers?: AmberDef[]                      // 琥珀：岩共鸣才震得开的互动造物
  doors?: DoorDef[]
  notes?: NoteDef[]
  spire?: { x: number; y: number; radius: number }
  dome?: DomeDef
  cage?: CageDef
  music?: string
  bg?: BgTheme
  // 背景整幅钉在屏幕上，不随镜头的上下移动（平地街景用，飞起来时背景楼房不会跟着飞）
  bgFixedY?: boolean
  windmill?: { x: number; y: number }
  inn?: { x: number; y: number }          // 望舒客栈：画在背景里的地标，不参与碰撞
  decor?: DecorDef[]                      // 背景静物：破屋、矿山剪影
  // 玉京台左半边的请仙典仪广场（写了才建）：x/y = 广场中心那一列 + 台面顶面。
  // 走到这儿按 F = 观礼（请仙典仪那一场戏，一次性）
  plaza?: { x: number; y: number }
  // 玉京台上的送仙典仪（第十关）：x/y = 祭坛前玩家站的那条走线。
  // 祭坛、供品、香炉、凝光、围观的都按 2.5D 的深度往后排
  rite?: { x: number; y: number }
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
  harborBlocks?: { at: number; kind: 'dock' | 'street' | 'suburb' | 'terrace'; variant?: 1 | 2 | 3 }[]
  // 陆地层楼打包：一段 920 宽，房子两层/三层，带可站立的楼层平台
  landBlocks?: { at: number; kind: 'land-a' | 'land-b' }[]
  chaseAt?: number          // 走过这条线：演出一下、立刻生成追击小队
  chaseOnLand?: boolean     // 追击还要等脚落地才算（第八关：出了玉京台、落地之后才追）
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

// 琥珀（2026/10/17 用户设计的互动造物）：摆在转角平台上的一坨金色树脂，里面冻着东西。
// **岩共鸣、普通跳砸、岩化跳砸都能打开**（岩柱站着的时候，脚下会一圈圈往外散金色光圈；
// 也可以直接跳到琥珀上踩碎），敲开以后里面的东西就出来了：原石 / 野猪 / 人。
export type AmberDef = {
  x: number
  y: number                                  // 底面那条线（贴地摆）
  key?: string                               // 贴图，不写＝amber（第十关的矿壳用 ore-shell）
  stand?: boolean | string                   // 底下垫什么：不写＝amber-stand，false＝不垫，字符串＝指定贴图
  loot?: 'gem' | 'boar' | 'npc' | 'material' // 里面冻着什么（不写＝gem）
  text?: string                              // npc 那一句
  gemIndex?: number                          // loot 是 gem 时用它当"第几颗原石"（0 起）
  item?: { key: string; label: string }      // loot 是 material 时给的那件东西
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

// 过渡平台下面的填色（2026/10/16 用户要的）：一块平台是 6 像素厚的板，底下要是空的，
// 画面就会出现一块悬着的板 + 一大片空挡。这个函数把平台**从顶面一直填到地面**，
// 并且**分三层、每层换个色号**——那几道横缝就是"岩石的横截面"，填色区不至于是一整块死色。
// 越往下的一层往左多伸出去一点（崖脚堆着碎石的样子），左边那道崖壁才不是一刀切。
// 全是 solid: false：只画不挡人。
const platformFill = (x: number, width: number, top: number, bottom: number, baseDepth = 1.1) => {
  // 山体就用崖面那套石头色（用户 2026/10/17 定的四档，见 BootScene.makeCliffDetails），
  // 这样填色和贴在它前面的岩面能接得上，不会一块暖褐一块冷灰
  const shades = [0x73665a, 0x6a5e52, 0x5e5348]

  return shades.map((tint, index) => {
    const rows = shades.length
    const height = (bottom - top) / rows
    const spread = index * 14

    return {
      x: x - spread / 2,
      y: top + height * index + height / 2,
      width: width + spread,
      height,
      tint,
      // 深度都压在 1.2 以下：盘山道有一跑挂后层时，人在后层是 1.2，
      // 填色比它大就会把走在后层的人盖掉（见「第九关（爬山关）的设计」）
      depth: baseDepth + index * 0.01,
      solid: false,
    }
  })
}

// 这一关一共几颗原石：摆在关卡里的 + 冻在琥珀里的（不写 loot 的琥珀默认就是原石）。
// 关卡内 HUD、通关界面、存档里的原石总数都走这一个口径，避免第九关少算琥珀里那颗。
export function levelGemTotal(level: LevelDef): number {
  const inAmber = (level.ambers ?? []).filter((amber) => (amber.loot ?? 'gem') === 'gem').length

  return level.gems.length + inAmber
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
      // 地面这一跑要「穿过去」（用户 2026/10/11）：从 1/2 层平台顺着它下到一楼地面之后，
      // 往右走是走过楼梯底下（一楼右边的观赏树、压力板、桌椅都在这边），
      // 不该被最低那几级再抬回楼上；一趟用一次，重新踏上这一跑才再有
      { from: { x: 362, y: 2160 }, to: { x: 570, y: 1985 }, layer: 'front', passUnder: true },
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

    width: 6900,
    height: 1200,
    // 岩是上一关带过来的；雷是本关新给的 —— **雷神像留到第 11 关才出现**（用户定的），
    // 所以这一关不给神像，直接用 unlocks 把雷发下来
    startElement: 'rock',
    unlocks: ['wind', 'thunder'],
    spawn: { x: 60, y: 1120 },
    bg: 'harbor',
    // 宝箱摆在追击段最后一摞木箱（x 6737）最上面那一块上：箱顶 1028，宝箱中心压在上面
    goal: { x: 6737, y: 1014, kind: 'chest', prompt: '打开' },

    platforms: [
      // 一整条平地面（顶面 1160，x 0 → 6900）
      { x: 3450, y: 1180, width: 6900, height: 40, brick: true },

      // ③ 玉京台：x 2300 → 4600（**2300 宽 = 5 段打包背景**），台面顶面 880（比地面高 280）。
      //    用户定的 x 轴排布（从左到右）：**小平台 → 左上下楼梯 → 大平台 → 右上下楼梯 → 小平台**。
      //    玉京台的两个**边界是小平台**（顶面 1020），楼梯在小平台里侧，
      //    能走的就是中间这一块 —— **1600 宽**（2300 减去两边的小平台 110 ×2 和楼梯 240 ×2），
      //    加宽只加这一块：小平台 110、楼梯 240、半层高度 140 都不动
      { x: 3450, y: 900, width: 1600, height: 40, brick: true, rail: false, railBar: false },   // 2650~4250
      // 台体：整面砖墙，从台面顶面 880 一直落到地面 1160（楼梯背后也是砖，不会露出天空）。
      // solid: false —— 只画不挡人，史莱姆贴着墙走过去、从楼梯下面穿都没问题；
      // 真正挡人的只有中间的台面楼板和两级楼梯
      { x: 3450, y: 1020, width: 2300, height: 280, brick: true, solid: false },   // 2300~4600
      // 半层小平台 —— 玉京台的左右两个边界（顶面 1020），外沿贴 2300 / 4600。
      // layerFlip —— 站上去翻一层：上楼过来就切到后层（好上上跑），下楼过来就切回前层（好下下跑）
      { x: 2355, y: 1023, width: 110, height: 6, brick: true, rail: false, layerFlip: true },   // 2300~2410
      { x: 4545, y: 1023, width: 110, height: 6, brick: true, rail: false, layerFlip: true },   // 4490~4600

      // ② 前往玉京台那一段（x 0~2300）：和追击段同一套做法 ——
      //    背景房子的屋檐全做成单向平台（尺寸照贴图里那道檐口：宽 2×half、厚 6），
      //    最开头摆一摞三级木箱当上房顶的起点，屋檐之间接不上的空当补空中断裂平台。
      //    地面上每隔一栋房子的屋檐下挂一门发射机关（见下面的 launchers），
      //    三颗原石就放在其中三门的正下方 —— 想拿就得在岩刺下面走一趟。
      //  A · 屋檐（c 宽 118 / a 宽 146 / b 宽 236 / d 宽 134，都厚 6）
      { x: 75, y: 1090, width: 118, height: 6, oneWay: true, overlay: true, rail: false, railBar: false },   // 屋檐 c · 顶 1087
      { x: 385, y: 1014, width: 146, height: 6, oneWay: true, overlay: true, rail: false, railBar: false },   // 屋檐 a · 顶 1011
      { x: 600, y: 1067, width: 236, height: 6, oneWay: true, overlay: true, rail: false, railBar: false },   // 屋檐 b · 顶 1064
      { x: 830, y: 1090, width: 118, height: 6, oneWay: true, overlay: true, rail: false, railBar: false },   // 屋檐 c · 顶 1087
      { x: 993, y: 1014, width: 146, height: 6, oneWay: true, overlay: true, rail: false, railBar: false },   // 屋檐 a · 顶 1011
      { x: 1139, y: 1014, width: 146, height: 6, oneWay: true, overlay: true, rail: false, railBar: false },  // 屋檐 a · 顶 1011
      { x: 1470, y: 949, width: 134, height: 6, oneWay: true, overlay: true, rail: false, railBar: false },   // 屋檐 d · 顶 946
      { x: 1595, y: 1090, width: 118, height: 6, oneWay: true, overlay: true, rail: false, railBar: false },  // 屋檐 c · 顶 1087
      { x: 1920, y: 1014, width: 146, height: 6, oneWay: true, overlay: true, rail: false, railBar: false },  // 屋檐 a · 顶 1011
      //  （开头那一摞木箱按用户要求删了；这一段现在只有屋檐本身是落脚点，
      //   从地面上去要靠旁边的断桥 —— 见下面 C 段 x 142 那块）
      //  C · 屋檐之间接不上的空当补的空中断裂平台
      { x: 142, y: 1105, width: 44, height: 6, oneWay: true, overlay: true, rail: false, railBar: false },    // 断桥 · 顶 1102
      { x: 912, y: 1052, width: 44, height: 6, oneWay: true, overlay: true, rail: false, railBar: false },    // 断桥 · 顶 1049
      { x: 1222, y: 998, width: 44, height: 6, oneWay: true, overlay: true, rail: false, railBar: false },    // 断桥 · 顶 995
      { x: 1305, y: 982, width: 44, height: 6, oneWay: true, overlay: true, rail: false, railBar: false },    // 断桥 · 顶 979
      { x: 1387, y: 965, width: 44, height: 6, oneWay: true, overlay: true, rail: false, railBar: false },    // 断桥 · 顶 962
      { x: 1660, y: 1075, width: 44, height: 6, oneWay: true, overlay: true, rail: false, railBar: false },   // 断桥 · 顶 1072
      { x: 1725, y: 1060, width: 44, height: 6, oneWay: true, overlay: true, rail: false, railBar: false },   // 断桥 · 顶 1057
      { x: 1790, y: 1044, width: 44, height: 6, oneWay: true, overlay: true, rail: false, railBar: false },   // 断桥 · 顶 1041
      { x: 1855, y: 1029, width: 44, height: 6, oneWay: true, overlay: true, rail: false, railBar: false },   // 断桥 · 顶 1026

      // ④ 追击段（出玉京台 → 宝箱）：**背景里那排房子的屋檐全做成单向平台**。
      //    尺寸严格照贴图里真正画出来的那道**檐口**来 —— roof() 里那一条是
      //    `fillRect(cx − half, baseY − 5, half × 2, 6)`，也就是「宽 2×half、厚 6」，
      //    所以平台正好盖在那道檐口上：不会比屋檐宽、也不会比屋檐厚。
      //    （屋檐顶面 = 贴图里 baseY − 5 那一行；house-a 宽 146 / b 236 / c 118 / d 134）
      //    玩家可以顺着屋檐跑，也可以走地面（地面每隔一栋房子挂着发射岩刺的造物机关）。
      //    空当里**只留两摞三级木箱**（第一组和最外面那组），从地面踩着它就能上屋檐；
      //    木箱整摞摆在空当正中，不压到任何一栋房子下面。
      //    剩下几个接不上的空当用"空中断裂平台"补，高度都取"两边都跳得到、余量最大"那一档。
      //    数据照岩史莱姆真实的跳跃弧算（速度 90 / 跳力 240 / 重力 600），
      //    空隙上限那张表见开发笔记「踩过的坑」六十七。
      //    y 的写法：单向平台 y = 顶 + height/2；木箱是实心墩子，y = (顶 + 1160) ÷ 2
      //  A · 屋檐（= 贴图里那道檐口：宽 2×half、厚 6，正好盖在上面）
      { x: 4690, y: 1090, width: 118, height: 6, oneWay: true, overlay: true, rail: false, railBar: false },   // 屋檐 c · 顶 1087
      { x: 4880, y: 1014, width: 146, height: 6, oneWay: true, overlay: true, rail: false, railBar: false },   // 屋檐 a · 顶 1011
      { x: 5160, y: 1090, width: 118, height: 6, oneWay: true, overlay: true, rail: false, railBar: false },   // 屋檐 c · 顶 1087
      { x: 5480, y: 1096.7, width: 109, height: 6, oneWay: true, overlay: true, rail: false, railBar: false }, // 屋檐 c(0.92) · 顶 1093.7
      { x: 5610, y: 1067, width: 236, height: 6, oneWay: true, overlay: true, rail: false, railBar: false },   // 屋檐 b · 顶 1064
      { x: 5910, y: 1090, width: 118, height: 6, oneWay: true, overlay: true, rail: false, railBar: false },   // 屋檐 c · 顶 1087
      { x: 6100, y: 1014, width: 146, height: 6, oneWay: true, overlay: true, rail: false, railBar: false },   // 屋檐 a · 顶 1011
      { x: 6360, y: 1090, width: 118, height: 6, oneWay: true, overlay: true, rail: false, railBar: false },   // 屋檐 c · 顶 1087
      { x: 6560, y: 1014, width: 146, height: 6, oneWay: true, overlay: true, rail: false, railBar: false },   // 屋檐 a · 顶 1011
      { x: 6820, y: 1090, width: 118, height: 6, oneWay: true, overlay: true, rail: false, railBar: false },   // 屋檐 c · 顶 1087
      //  B · 三级木箱：只留第一组和最外面那组
      { x: 4987, y: 1138, width: 36, height: 44, plank: true, overlay: true, rail: false, railBar: false },     // 木箱 · 顶 1116
      { x: 5027, y: 1116, width: 36, height: 88, plank: true, overlay: true, rail: false, railBar: false },     // 木箱 · 顶 1072
      { x: 5067, y: 1094, width: 36, height: 132, plank: true, overlay: true, rail: false, railBar: false },    // 木箱 · 顶 1028
      { x: 6657, y: 1138, width: 36, height: 44, plank: true, overlay: true, rail: false, railBar: false },     // 木箱 · 顶 1116
      { x: 6697, y: 1116, width: 36, height: 88, plank: true, overlay: true, rail: false, railBar: false },     // 木箱 · 顶 1072
      { x: 6737, y: 1094, width: 36, height: 132, plank: true, overlay: true, rail: false, railBar: false },    // 木箱 · 顶 1028（宝箱在这上面）
      //  C · 屋檐之间接不上的空当补的空中断裂平台
      { x: 4779, y: 1055, width: 44, height: 6, oneWay: true, overlay: true, rail: false, railBar: false },     // 断桥 · 顶 1052
      { x: 5266, y: 1087, width: 44, height: 6, oneWay: true, overlay: true, rail: false, railBar: false },     // 断桥 · 顶 1084
      { x: 5326, y: 1087, width: 44, height: 6, oneWay: true, overlay: true, rail: false, railBar: false },     // 断桥 · 顶 1084
      { x: 5386, y: 1087, width: 44, height: 6, oneWay: true, overlay: true, rail: false, railBar: false },     // 断桥 · 顶 1084
      { x: 5774, y: 1077, width: 44, height: 6, oneWay: true, overlay: true, rail: false, railBar: false },     // 断桥 · 顶 1074
      { x: 5819, y: 1077, width: 44, height: 6, oneWay: true, overlay: true, rail: false, railBar: false },     // 断桥 · 顶 1074
      { x: 5999, y: 1055, width: 44, height: 6, oneWay: true, overlay: true, rail: false, railBar: false },     // 断桥 · 顶 1052
      { x: 6236, y: 1053, width: 44, height: 6, oneWay: true, overlay: true, rail: false, railBar: false },     // 断桥 · 顶 1050
      { x: 6454, y: 1055, width: 44, height: 6, oneWay: true, overlay: true, rail: false, railBar: false },     // 断桥 · 顶 1052
    ],

    // ③ 玉京台的两条双层楼梯（一跑一半高，两跑一样高，正好嵌在台面左右两边）：
    //    楼梯上不画护栏（只留半层小平台边沿那一道）；下跑和前层同层，人在前层走上去，
    //    在地面上从楼梯下面穿过去也没问题；踩到半层小平台（layerFlip）自动翻一层 ——
    //    上楼过来切「后层」（上跑能上）、下楼过来切回「前层」（下跑能下）
    stairs: [
      // 每一侧的两跑在同一个 x 上交接（左 2410、右 4490）—— 交点就在小平台靠里那一端；
      // 一跑半层 140，横向 240
      // 下跑：落地端在**里侧**（左 2650 / 右 3110），从地面往小平台上半层。
      // 左边这条**保持原样**（用户只让改右边那一条）
      { from: { x: 2650, y: 1160 }, to: { x: 2410, y: 1020 }, style: 'brick', layer: 'front', rail: 'none' },
      { from: { x: 2410, y: 1020 }, to: { x: 2650, y: 880 }, style: 'brick', layer: 'back', rail: 'none' },
      // 右边这条：passUnder —— 沿着它下到地面之后往玉京台外面走时，
      // 先把这一跑的碰撞关掉（画在人后面的是它本来那层 depth 3，史莱姆在前层是 10，
      // 所以看着还是"人走在楼梯前面"），等身体整个穿过它再恢复
      { from: { x: 4250, y: 1160 }, to: { x: 4490, y: 1020 }, style: 'ramp', layer: 'front', rail: 'none', passUnder: true },
      { from: { x: 4490, y: 1020 }, to: { x: 4250, y: 880 }, style: 'ramp', layer: 'back', rail: 'none' },
    ],

    // 上楼之后镜头往上偏一点，把史莱姆放到画面下半部分（高台上视野更舒服）。
    // band 是回差：脚底高过 y 才抬起、落到 y+band 以下才放下，免得站在半层平台上反复抖
    cameraLift: { y: 1010, band: 44, offset: 52 },

    // 台面沿口的栏杆 + 两块半层小平台的沿口栏杆（都在玩家图层上）：
    // 史莱姆走到栏杆后面时在它身上擦一个透视洞，和第七关那棵树一个做法
    revealRails: [
      // 台面沿口：就中间那块台面（左右两边是楼梯，本来就不用栏杆）。
      // **中间 3340~3560 留空**：拱门就立在那儿，栏杆不能从门洞里穿过去
      // height: 13 —— 前景的护栏压到原来一半高（26 → 13），免得挡人挡得太狠
      { from: { x: 2650, y: 880 }, to: { x: 3340, y: 880 }, height: 13 },
      { from: { x: 3560, y: 880 }, to: { x: 4250, y: 880 }, height: 13 },
      // 楼梯上的栏杆都删了，只留平台边沿这一道：从外沿拉到楼梯交接点 + 外端一根带柱头的柱子
      { from: { x: 2300, y: 1020 }, to: { x: 2410, y: 1020 }, height: 13 },
      { from: { x: 2300, y: 1020 }, to: { x: 2301, y: 1020 }, key: 'rail-end', height: 13 },
      { from: { x: 4490, y: 1020 }, to: { x: 4600, y: 1020 }, height: 13 },
      { from: { x: 4600, y: 1020 }, to: { x: 4601, y: 1020 }, key: 'rail-end', height: 13 },
    ],

    orbs: [],
    // 三颗原石全摆在「前往玉京台」那段：**就放在发射机关的正下方**（地面上），
    // 想吃就得在岩刺底下走一趟；嫌危险就跳上屋檐走上面那条
    gems: [
      { x: 600, y: 1147 },
      { x: 1470, y: 1147 },
      { x: 1920, y: 1147 },
    ],
    blessings: [],
    hazards: [],
    monuments: [],
    // 发射岩刺的造物机关：**每隔一栋房子**挂一个在屋檐底下，只往下打 ——
    // 走地面这条线就躲这个；嫌挤就跳上屋檐走上面那一条。
    // y 都落在屋檐平台**下面**一点（檐口板占 6 像素高），机关才不会埋在板子里。
    // 前四门在「前往玉京台」那段（600~1920），后五门在追击段（4600~6760）。
    // **开局那一段不许放陷阱**（用户 2026/10/15 定的）：原来 75 那门正压在出生点
    // （spawn x=60）上，一进关卡就挨岩刺，已经删掉；以后新关卡也别在出生点附近摆机关。
    launchers: [
      { x: 600, y: 1078, interval: 2.2 },
      { x: 993, y: 1025, interval: 2.2 },
      { x: 1470, y: 960, interval: 2.2 },
      { x: 1920, y: 1025, interval: 2.2 },
      { x: 4690, y: 1101, interval: 2.2 },
      { x: 5160, y: 1101, interval: 2.2 },
      { x: 5610, y: 1078, interval: 2.2 },
      { x: 6100, y: 1025, interval: 2.2 },
      { x: 6560, y: 1025, interval: 2.2 },
    ],

    // ③ 玉京台左半边：请仙典仪的广场（圆形广场 + 长方形祭坛 + 围观的 + 凝光和两个仆从）。
    // 走到广场前面按 F = 观礼，演完请仙失败那一场就从右边的券门走
    plaza: { x: 3050, y: 880 },

    // 右半边连廊里巡逻的千岩军（潜行段）：看见你 2.5 秒就追，撞上障碍就放弃；
    // 岩化之后站着不动，他们认不出来，会从你身边走过去 —— 就是靠这个从券门躲到尽头
    guards: [
      { x: 3720, y: 880, range: 100, facing: 1 },
      { x: 4070, y: 880, range: 120, facing: -1, vision: 150 },
    ],

    // 走出玉京台（右端 4600）、脚落到地面（1160）之后触发追击演出，身后生成三个千岩军；
    // 紧接着就是那段屋檐跑酷（见下面 platforms 的 ④ 段），跑到最后一摞木箱顶上开宝箱过关
    chaseAt: 4620,
    chaseOnLand: true,
    squadCount: 3,
    squadSpeed: 92,
    squadSpawnGap: 240,
    chaseCause: 'guard',

    // 港口背景打包：一段 460，想要长一点就多复制几段。
    // kind = dock 港口 / street 街道 / suburb 郊区 / terrace 玉京台（两座巨型房子，贴在台面上）
    // variant 不写就是第一版。从左到右的顺序（定稿）：
    // 港口① → 港口③ → 港口② → 街道② → 街道① → 玉京台（5 段）→ 街道③ → 郊区③ → 郊区② → 郊区①
    harborBlocks: [
      { at: 0, kind: 'dock' },                 // 港口①：水面 / 护栏 / 一正一背两个摊位 + 小船
      { at: 460, kind: 'dock', variant: 3 },   // 港口③：宽厅 + 小屋 + 高帆渔船
      { at: 920, kind: 'dock', variant: 2 },   // 港口②：两栋相连的楼房 + 灯笼串 + 牌楼
      { at: 1380, kind: 'street', variant: 2 },// 街道②：高铺 + 小屋 + 左侧背向摊位
      { at: 1840, kind: 'street' },            // 街道①：房子 + 街上摊位 + 背向的房子
      // 2300 → 4600（5 段宽）是玉京台自己的背景（新做的两座巨型房子）：
      // 左半边一整座请仙典仪的大殿（屋脊画在画面外，站在台面上只看得到下面一截），中间一道拱门，
      // 右半边是连廊——一段 460，一段接一段连起来，玩家从拱门过来就在这条廊里躲
      // 左半边的大殿：世界 x 2300~3450（左半边整条），在 z=500 处投影成 2568~3307，
      // 所以渲染中心要落在 xAt(2875) = 2937 → at = 2937 − 575 = 2362
      { at: 2362, kind: 'terrace' },            // 左半边：请仙典仪大殿（一整座）
      // 右半边的连廊两段：站在台面上底的远边（z=500，大小 0.643），段距也要跟着缩
      //（575 → 370）。at + 287 是渲染中心：3492 / 3862，合起来正好铺满右半边的远边
      { at: 3205, kind: 'terrace', variant: 2 },// 右半边：连廊 1
      { at: 3575, kind: 'terrace', variant: 2 },// 右半边：连廊 2（和上一段接上）
      { at: 4600, kind: 'street', variant: 3 },// 街道③：两栋房子 + 右侧背向摊位
      { at: 5060, kind: 'suburb', variant: 3 },// 郊区③：最空的一版
      { at: 5520, kind: 'suburb', variant: 2 },// 郊区②：大厅 + 小屋 + 路边摊
      { at: 5980, kind: 'suburb' },            // 郊区①：两栋小屋
      { at: 6440, kind: 'suburb' },            // 最后一段：铺到关卡最右边，建筑一路不断
    ],

    // 世界里的提示文字（`makeHint` 画在对应坐标上）。这四句都不含操作键位，
    // 所以不会被「这一类提示过了就不再出现」那套吃掉，每次进关都会显示
    hints: [
      { x: 240, y: 1085, text: '向右前往玉京台' },
      { x: 2650, y: 1085, text: '上楼观看请仙典仪' },
      { x: 3700, y: 840, text: '岩化时静止不动，则不会被发现' },
      { x: 4110, y: 840, text: '岩柱可阻挡千岩军视野' },
    ],
  },

  // ══ 第九关 · 那个女人（2026/10/15 起：爬山）═══════════════════════════════
  // 剧情：逃出璃月港的路上遇见一位自称客卿的先生，他指了条路 —— 北边高山上住着仙人。
  // 这一关只玩**风、岩**两种元素（用户定的，不发新元素；雷留到第 11 关）。
  //
  // 【圆台形爬山】2026/10/17 第三版：山体下宽上窄，每一跑都比下面一跑短。
  //   右爬 R1（1800）→ 平地 F1 → 右爬 R2（700）→ 转角 C1 →
  //   左爬 L1（700，后层）→ 平地 F2（后层）→ 左爬半段 L2（350，后层）→
  //   转角 C2 → 右爬 R3（600）→ 山顶（宽度=600，中心对齐 R3）。
  // 坡体用 `slopes` 的 `mode: 'ramp'`，脚底由 `updateSlopes` 接管，不需要跳。
  // 山体正面用**横向岩层**（矩形，不再沿坡面采样成百上千个顶点）；
  // 山顶是一块透视椭圆湖，瀑布从湖心分四段落到地面，遇到 R3/L2/F1 的走线就断开。
  // 性能：坡面每 12 像素采一个点，几段长坡的 Graphics 顶点数比原来少一半。
  {
    name: '第九关 · 那个女人',
    intro:
      '逃出璃月港的路上，一位气质不凡的先生叫住了我。\n他说自己只是个客卿，让我去北边的高山上找仙人求助。\n既然已经走投无路，那就去试试吧。',

    // **圆台形山体**（2026/10/17 第四版）：底座 0~4400，中轴 2200，
    // 山顶 1600~2920（右端多出 120 做转角平台）。
    //   山脚 0~800（顶面 1360）
    //   右爬 R1 800→1900（1100 宽，升 200）→ 平地 F1 1900~2500（1160）
    //   右爬 R2 2500→3200（700 宽，升 150）→ 转角 C1 3200~3450（1010）
    //   左爬 L1 3450→2650（800 宽，升 200，后层）→ 平地 F2 2400~2650（810）
    //   左爬半段 L2 2400→1800（600 宽，升 100，后层）→ 转角 C2 1600~1800（710）
    //   右爬 R3 1600→2800（1200 宽，升 250）→ 山顶 1600~2920（1320，右端 120 转角平台）
    // 山顶中心 2200 就是整座山的中轴；湖是环形，泉眼在中轴，瀑布从泉眼落到地面。
    width: 4400,
    height: 1500,
    startElement: 'rock',
    unlocks: ['wind'],
    spawn: { x: 80, y: 1347 },
    bg: 'mountain',
    cameraBias: 56,
    goal: { x: 2740, y: 446, kind: 'chest', prompt: '打开' },
    goalDisabled: true,
    crane: { x: 2050, y: 460 },

    platforms: [
      // 山脚 0~800
      { x: 400, y: 1380, width: 800, height: 40, grass: true },
      // F1 平地 / C1 转角 / F2 后层平地 / C2 转角 / 山顶
      { x: 2200, y: 1163, width: 600, height: 6, grass: true, depth: 3 },
      { x: 3380, y: 1013, width: 360, height: 6, grass: true, depth: 3 },
      { x: 2525, y: 813, width: 250, height: 6, grass: true, depth: 1.1, layer: 'back' },
      { x: 1650, y: 713, width: 300, height: 6, grass: true, depth: 3 },
      { x: 2260, y: 463, width: 1320, height: 6, grass: true, depth: 3 },
      // 山脚底下：泥土 + 岩石
      { x: 400, y: 1430, width: 800, height: 140, tint: 0x8a6a4a, depth: 1.0 },
      { x: 2600, y: 1430, width: 3600, height: 140, tint: 0x5e5348, depth: 1.0 },
      // 平台填色。F2/C2/山顶压到 0.9：它们和最后几跑在 x 上重叠，
      // 如果还画在 1.1 会盖住坡面；0.9 在坡体后面，只露坡面以上的崖身。
      ...platformFill(2200, 600, 1160, 1360, 1.0),
      ...platformFill(3380, 360, 1010, 1360, 1.02),
      ...platformFill(2525, 250, 810, 1360, 0.9),
      ...platformFill(1650, 300, 710, 1360, 0.9),
      ...platformFill(2260, 1320, 460, 1360, 0.9),
      // 左右两侧的山肩：只画不挡人，把底座撑宽（0~4400）
      // 左边山肩改成背景小山 bg-foothill（见 decor），不再用方形填色
      ...platformFill(3925, 950, 1010, 1360, 0.9),
    ],

    // 防掉落挡板：山顶左右沿、C1 右沿、C2 左沿。
    // 只挡人不画，画面上的山峰/树/大石头在 decor 里。
    blockers: [
      { x: 1600, y: 360, width: 20, height: 200 }, // 山顶左沿：1590~1610，挡住平台边，防止移山后走出悬崖
      { x: 2930, y: 360, width: 20, height: 200 }, // 山顶右沿（转角平台外沿）
      { x: 3570, y: 950, width: 20, height: 120 }, // C1 右沿：3560~3580
      { x: 1490, y: 660, width: 20, height: 100 }, // C2 左沿：1480~1500
    ],

    // R1 右爬 → F1 平地 → R2 右爬 → C1 转角 → L1 左爬（后层）→
    // F2 平地（后层）→ L2 左爬半段（后层）→ C2 转角 → R3 右爬 → 山顶
    slopes: [
      // R1：800→1900，1360→1160
      { x: 1900, y: 1160, width: 2200, rise: 200, tStart: -1, tEnd: 0, mode: 'ramp', grass: true, depthTo: 1360, depth: 1.15, frontFace: {} },
      // R2：2500→3200，1160→1010
      { x: 3200, y: 1010, width: 1400, rise: 150, tStart: -1, tEnd: 0, mode: 'ramp', grass: true, depthTo: 1360, depth: 1.15, frontFace: {} },
      // L1：3450→2650，1010→810（后层）
      { x: 2650, y: 810, width: 1600, rise: 200, tStart: 1, tEnd: 0, mode: 'ramp', grass: true, layer: 'back', depthTo: 1360, depth: 1.1, frontFace: {} },
      // L2：2400→1800，810→710（后层，半段）
      { x: 1800, y: 710, width: 1200, rise: 100, tStart: 1, tEnd: 0, mode: 'ramp', grass: true, layer: 'back', depthTo: 1360, depth: 1.1, frontFace: {} },
      // R3：1600→2800，710→460
      { x: 2800, y: 460, width: 2400, rise: 250, tStart: -1, tEnd: 0, mode: 'ramp', grass: true, depthTo: 1360, depth: 1.05, frontFace: {}, overWaterfall: true },
    ],

    depthGates: [
      // C1 右端：到 3450 掉头向左 → 翻后层，接 L1
      { x: 3390, y: 997, width: 120, height: 40, dir: -1 },
      // C2 左端：到 1600 掉头向右 → 翻前层，接 R3
      { x: 1660, y: 697, width: 120, height: 40, dir: 1 },
    ],

    mistBands: [
      { x: 2000, y: 850, width: 1800, alpha: 0.5, depth: 1.16, drift: 42, duration: 26000 },
      { x: 2200, y: 1150, width: 1500, alpha: 0.38, depth: 1.16, drift: -36, duration: 32000 },
    ],

    // 山顶沼泽：不再是规整的圆湖，改成 1800~2600 的浑绿沼地；瀑布仍从 2200 落下
    summitLake: { x: 2200, y: 410, width: 800, height: 180 },
    // 瀑布：宽度和 F1 一样（600），从泉眼一路直落到地面，不再在坡道处断开
    waterfall: {
      x: 2200,
      width: 600,
      segments: [{ y: 440, height: 920 }],
    },

    orbs: [],
    // **原石总数还是三颗**（用户 2026/10/17 重申）：这里放两颗（山脚、山顶），
    // 第三颗冻在转角平台 1 的琥珀里 —— 那颗由 ambers 里的 gemIndex 领走下标 1，
    // 所以三颗的序号正好是 0 / 1 / 2，捡满了 HUD 就是三颗全亮，不会多出来第四颗
    gems: [
      { x: 150, y: 1347 },    // ① 山脚（顶面 1360）
      { x: 1650, y: 447 },    // ② 山顶（顶面 460），放在湖环左边
    ],
    blessings: [],
    hazards: [],
    monuments: [],
    // 琥珀（2026/10/17）：摆在两块转角平台上，**要用岩柱的岩共鸣震开**。
    // 里面冻的东西不一样：一块是原石，一块是野猪。第三个平台（山顶）留给仙人和小考验
    ambers: [
      { x: 3480, y: 1010, loot: 'gem', gemIndex: 2 },
      { x: 1640, y: 710, loot: 'boar' },
      {
        x: 2200,
        y: 1160,
        loot: 'npc',
        text: '琥珀里冻着一个戴草帽、披蓑衣的史莱姆……',
      },
    ],
    // 疾风符（山顶和 F2 不放）：山脚 / F1 / C1 / C2
    speedItems: [
      { x: 650, y: 1360, duration: 10, multiplier: 1.6 },
      { x: 2400, y: 1160, duration: 10, multiplier: 1.6 },
      { x: 3300, y: 1010, duration: 10, multiplier: 1.6 },
      { x: 1750, y: 710, duration: 10, multiplier: 1.6 },
    ],

    // 把新画的素材先堆到这一关看看效果（2026/10/17）。
    // 分层约定（从下往上）：山体填色 1.0~1.12 → 坡面 1.05~1.15 → 岩石横截面 1.16
    //   → 崖壁 1.17 → 崖沿草 / 碎石锥 1.18 → 崖树 1.19 → 后层玩家 1.2 → 前层玩家 10。
    // 崖树必须压在崖壁上面（1.19），不然树根会被岩面盖住，看起来像浮在半空。
    decor: [
      // 山脚左侧背景小山：从出生点后方起坡，落到 x=800 山脚，再沿 R1 背后藏进大山。
      // depth -1：压在背景层之上、地面和坡体之下，不会盖住玩家和草地
      { x: 600, y: 1360, key: 'bg-foothill', depth: -1 },
      // 右外缘：右侧山肩到 4400，崖壁摆在 4292~4400，上沿 1010
      { x: 4351, y: 1360, key: 'cliff-wall-350', depth: 1.17 },
      { x: 4340, y: 1364, key: 'cliff-talus', depth: 1.18 },
      // 上层左沿 1600：整面背景崖（894 高，上沿 466），压在下层坡体后面
      { x: 1543, y: 1360, key: 'cliff-wall-r', flip: true, depth: 1.0 },
      // 山顶右沿 2800：从山顶 460 落到 L1 坡面（约 830~860）
      { x: 2857, y: 880, key: 'cliff-wall-420', depth: 1.0 },
      // 崖树：只留在上层左沿
      { x: 1535, y: 900, key: 'tree-cliff-a', depth: 1.19 },
      // 崖沿草
      { x: 4385, y: 1050, key: 'cliff-grass', scale: 1.4, flip: true, depth: 1.18 },
      { x: 4360, y: 1280, key: 'cliff-grass', scale: 1.3, flip: true, depth: 1.18 },
      { x: 1590, y: 500, key: 'cliff-grass', scale: 1.3, flip: true, depth: 1.18 },
      { x: 1520, y: 1120, key: 'cliff-grass', scale: 1.2, flip: true, depth: 1.18 },
      // 山顶右沿的崖草往左收回平台/崖壁范围内，别悬在平台外的空中
      { x: 2900, y: 480, key: 'cliff-grass', scale: 1.4, flip: true, depth: 1.18 },
      { x: 2840, y: 700, key: 'cliff-grass', scale: 1.2, flip: true, depth: 1.18 },
      // 边缘防掉落的画面：山顶两座岩峰、C1 右沿的崖树、C2 左沿的大石块。
      // 实体挡板在上面 blockers 里，这些只负责让玩家看出"这里过不去"。
      { x: 1660, y: 460, key: 'summit-peak', flip: true, depth: 1.15 },
      // 右沿岩峰也收回平台内（底边 2800~2920），不再有半块悬在平台外
      { x: 2860, y: 460, key: 'summit-peak', depth: 1.15 },
      { x: 3558, y: 1010, key: 'tree-pine', scale: 1.05, depth: 1.19 },
      // C2 左沿的大石块：右移半块（约 58px），左沿正好压在悬崖边 1500 上，不再往外悬空
      { x: 1548, y: 710, key: 'boulder-big', scale: 1.2, depth: 1.15 },
      // 岩体里的岩石横截面。坡面往下 26 像素是泥土走道，横截面顶部必须落在它下面，
      // 所以三块都往下压：a 在 R1，b 在 R2，c 在右侧山肩（那里没有泥土层，只跟着下移）
      { x: 1200, y: 1378, key: 'rock-strata-a', scale: 1.4, depth: 1.16 },
      { x: 3000, y: 1118, key: 'rock-strata-b', scale: 1.4, depth: 1.16 },
      { x: 3900, y: 1276, key: 'rock-strata-c', scale: 1.4, depth: 1.16 },
      // 山脚石子
      { x: 250, y: 1360, key: 'pebble-a', scale: 1.8, depth: 1.2 },
      { x: 500, y: 1360, key: 'stone-pile', scale: 1.6, depth: 1.2 },
      { x: 700, y: 1360, key: 'pebble-c', scale: 1.8, depth: 1.2 },
      // 山顶远景：一圈环形山体围着沼泽，正中低垭口藏一个远处的秘境门洞
      { x: 2200, y: 460, key: 'summit-high-peak', depth: 0.6 },
      { x: 2200, y: 400, key: 'domain-entrance', scale: 0.5, depth: 0.9 },
      // 浅池塘：近岸只留一条窄泥边，池塘水从中间翻过池沿接上瀑布
      { x: 2200, y: 460, key: 'pond-edge', depth: 1.32 },
      { x: 2200, y: 452, key: 'pond-spill', depth: 1.36 },
      // 四块装饰踏石（都在水里，不站人）
      { x: 1850, y: 430, key: 'swamp-stone', depth: 3.3 },
      { x: 1950, y: 424, key: 'swamp-stone', depth: 3.3 },
      { x: 2450, y: 420, key: 'swamp-stone', depth: 3.3 },
      { x: 2550, y: 424, key: 'swamp-stone', depth: 3.3 },
      // 右岸：一棵巨大的垂柳，树干顺着崖壁盘着往上；树下石桌石凳、桌上一壶三杯，
      // 杯口三缕热气（'tea-steam' 会自动加一段往上飘的循环动画）
      // 山顶 1600~2920：柳树 2640（冠铺 2520~2760），茶桌 2660，
      // 宝箱 2740、原石 1650，沼泽中心 2200
      { x: 2640, y: 460, key: 'willow-summit', depth: 1.2 },
      { x: 2660, y: 460, key: 'tea-table', depth: 1.22 },
      { x: 2612, y: 460, key: 'tea-bench', depth: 1.22 },
      { x: 2708, y: 460, key: 'tea-bench', depth: 1.22 },
      { x: 2652, y: 440, key: 'tea-steam', depth: 1.24 },
      { x: 2662, y: 436, key: 'tea-steam', depth: 1.24 },
      { x: 2672, y: 441, key: 'tea-steam', depth: 1.24 },
    ],

    hints: [
      { x: 150, y: 1285, text: '往山上走，仙人住在山顶' },
      // 这句里**不能出现按键名**：出现了就会被 hintCategory 归成"教操作"那一类，
      // 而跳/悬浮早在前面几关教过了 —— 玩家就再也看不到这句。所以只说动作
      { x: 2600, y: 1120, text: '顺着山路盘上去' },
      { x: 2250, y: 420, text: '仙人就在前面' },
    ],
  },

  // ══ 第十关 · 送仙（2026/10/18 开工：璃月港 → 往生堂）════════════════════
  // 帝君遇刺后的璃月港仍在戒严。玩家去往生堂找客卿，替送仙典仪收集三样供品：
  // 夜泊石、霓裳花、永生香。三样齐了交给胡桃，再回玉京台的祭坛前举行送仙典仪
  // （2026/10/18 按原作改：往生堂只负责接活备料，正日子在玉京台）
  {
    name: '第十关 · 送仙',
    intro:
      '回到璃月港，帝君遇刺后的戒严还没有解除。\n先去往生堂找那位客卿，问清送仙典仪的事。\n路上顺便把典仪要用的三样东西找齐吧。',

    // 地图到玉京台最右边为止（4680~5680 是台面）
    width: 5680,
    height: 1200,
    startElement: 'rock',
    unlocks: ['wind'],
    spawn: { x: 60, y: 1147 },
    bg: 'harbor-land',
    bgFixedY: true,
    // 宝箱在玉京台台面上（祭坛左边一点），送仙典仪演完才出现
    goal: { x: 4940, y: 866, kind: 'chest', prompt: '打开' },

    platforms: [
      // 港口街道（顶面 1160），在 3610~3730 断成一条排水渠 ——
      // 街面过不去，只能踩木箱上屋檐、从两栋楼之间的木板桥上过去
      { x: 1805, y: 1180, width: 3610, height: 40, brick: true },
      { x: 4705, y: 1180, width: 1950, height: 40, brick: true },

      // 玉京台：台面顶面 880（比地面高 280），4680~5680 走的是台面。
      // 左边最后一栋楼到 4140 为止 —— 玉京台是**接着上一段街往后新加的一节**，不压原来的建筑
      { x: 5180, y: 900, width: 1000, height: 40, brick: true, rail: false, railBar: false },
      // 台体：整面砖墙从 880 落到地面 1160（只画不挡人，人从楼梯上来）
      { x: 5180, y: 1020, width: 1000, height: 280, brick: true, solid: false },

      // ── 屋檐跑酷 ───────────────────────────────────────────────────
      // 两栋三层楼的屋檐都在 1104（land-b 打包里 dy -56 那两条隐形檐口）：
      // 左楼 930~1310、右楼 1430~1810，中间那条 120 宽的巷子用一块木板桥接上。
      // 巷子里两只木箱当起步台阶（30 / 60），踩上去就能上左楼的屋檐
      { x: 1256, y: 1145, width: 34, height: 30, plank: true, overlay: true, rail: false, railBar: false },
      { x: 1294, y: 1130, width: 34, height: 60, plank: true, overlay: true, rail: false, railBar: false },
      // 木板桥的碰撞箱：隐形单向平台，顶面 1104。**两头伸进瓦檐 14 像素**，
      // 免得刚好卡在两块单向平台的接缝上漏下去
      // overlay：别让它被 harborGroundAt 当成"落脚线"，否则整段打包建筑会被抬高 56
      { x: 1370, y: 1107, width: 148, height: 6, oneWay: true, hidden: true, overlay: true },

      // ── 从屋檐往屋顶爬的两级木托架 ─────────────────────────────────
      // 1104（屋檐）→ 1058 → 1012（二层挑台，打包里自带）→ 964 → 922（阁楼檐口）
      // → 874（屋顶，霓裳花摆在上面）
      { x: 1520, y: 1061, width: 62, height: 6, oneWay: true, hidden: true, overlay: true },
      { x: 1580, y: 967, width: 62, height: 6, oneWay: true, hidden: true, overlay: true },

      // ── 被追着跑的那一段：街面上两摞货箱要跳过去 ─────────────────────
      { x: 2860, y: 1138, width: 36, height: 44, plank: true, overlay: true, rail: false, railBar: false },
      { x: 3120, y: 1138, width: 36, height: 44, plank: true, overlay: true, rail: false, railBar: false },

      // ── 排水渠：街上过不去，踩两只木箱上屋檐、从木板桥跨过去 ───────────
      // 木箱在 3460 / 3498（顶面 1130 / 1100），屋檐 1104，桥面 1104
      { x: 3460, y: 1145, width: 34, height: 30, plank: true, overlay: true, rail: false, railBar: false },
      { x: 3498, y: 1130, width: 34, height: 60, plank: true, overlay: true, rail: false, railBar: false },
      // 跨渠的木板桥：两头各伸进瓦檐 14 像素，避免单向平台接缝漏下去
      { x: 3670, y: 1107, width: 148, height: 6, oneWay: true, hidden: true, overlay: true },
    ],

    // 玉京台的楼梯：从左往右上，一跑直接上台面（25 步，每级 20×11.7）
    stairs: [
      { from: { x: 4200, y: 1160 }, to: { x: 4680, y: 880 }, style: 'brick', layer: 'front', rail: 'none' },
    ],

    // 台面沿口的石栏杆（玩家图层上，走到后面擦透视洞）。楼梯口那一头留空
    revealRails: [{ from: { x: 4740, y: 880 }, to: { x: 5680, y: 880 }, height: 13 }],

    // 站在台面上镜头往上偏一点
    cameraLift: { y: 1010, band: 44, offset: 52 },

    orbs: [],
    // 三颗原石各跟着一段挑战走：屋顶尽头一颗、香铺柜台后一颗、
    // 第三颗封在码头另一只矿壳里（见下面的 ambers）
    gems: [
      { x: 1620, y: 874 },
      { x: 2640, y: 1160 },
    ],
    blessings: [],
    hazards: [],
    monuments: [],

    // 戒严：香铺门口两个千岩军在来回巡逻 —— 永生香就摆在他们的眼皮底下。
    // 趁他们背身溜进去，或者岩化后站着不动（他不认石头）。
    // 视野 / 疑惑 / 追击和第八关是同一套
    guards: [
      // 码头这只在矿壳旁边来回走：砸矿壳的声音会把他引过来（见 GameScene.breakAmber）
      { x: 930, y: 1160, range: 60, speed: 20, facing: -1, vision: 130 },
      { x: 2520, y: 1160, range: 80, speed: 22, facing: -1, vision: 150 },
      { x: 2705, y: 1160, range: 55, speed: 26, facing: 1, vision: 150 },
    ],

    // 送仙典仪的三样供品：两样摆在外面（纯拾取），夜泊石封在码头的矿壳里
    materials: [
      // 霓裳花摆在右边那栋楼的屋顶上：踩木箱 → 过桥 → 再借两级木托架爬到屋顶
      { x: 1500, y: 874, key: 'item-silkflower', label: '霓裳花' },
      // 永生香要按住 F 读条 1.5 秒：一动就断，只能等守卫背身或者岩化硬扛
      { x: 2580, y: 1160, key: 'item-incense', label: '永生香', hold: 1.5 },
    ],

    // 夜泊石：封在码头那只矿壳里。岩柱的岩共鸣 / 跳上去踩碎（岩化跳砸范围更大）都能砸开，
    // 砸开以后它才掉出来，和别的供品一样走过去按 F 收
    ambers: [
      {
        x: 880,
        y: 1160,
        key: 'ore-shell',
        stand: 'ore-stand',
        loot: 'material',
        item: { key: 'item-noctilocus', label: '夜泊石' },
      },
      // 旁边那只矿壳里封着第三颗原石
      {
        x: 960,
        y: 1160,
        key: 'ore-shell',
        stand: 'ore-stand',
        loot: 'gem',
        gemIndex: 2,
      },
    ],

    // 陆地多层楼打包：两段 920 宽，交替铺满整条街
    landBlocks: [
      { at: 0, kind: 'land-a' },
      { at: 920, kind: 'land-b' },
      // 1840~2300 中间留空，画往生堂
      { at: 2300, kind: 'land-a' },
      { at: 3220, kind: 'land-b' },
      // 3220~4140 是最后一栋楼；4140 之后是玉京台脚下新加的一节空地
    ],

    decor: [
      // 地图中央的往生堂：独立建筑，左右各留 20 像素空当
      { x: 2070, y: 1160, key: 'wang-sheng-tang', depth: -5 },
      // 玉京台上的大殿：远一档、小一点，底边压在台面 880 上
      { x: 5180, y: 884, key: 'terrace-hall', scale: 0.62, depth: -6 },
      // 两栋楼屋檐之间那条木板桥：画面在 y=1120（板面 1104），碰撞箱在上面
      { x: 1370, y: 1120, key: 'eave-bridge', depth: -4.9 },
      // 墙上的两级木托架（板面 1058 / 964）
      { x: 1520, y: 1072, key: 'wall-ledge', depth: -4.6 },
      { x: 1580, y: 978, key: 'wall-ledge', depth: -4.6 },
      // 排水渠：水面画在街面以下，人掉下去就沉了
      { x: 3670, y: 1220, key: 'canal-gap', depth: -4.2 },
      // 跨渠的木板桥（画面在 1120，板面 1104）
      { x: 3670, y: 1120, key: 'eave-bridge', depth: -4.9 },
    ],

    // 送仙典仪的祭坛（玉京台台面中心）。x 是玩家走的走线，祭坛/人群/凝光都排在这条线往后
    rite: { x: 5180, y: 880 },

    // 交完供品往玉京台走时被千岩军盯上：两个追兵从往生堂后面追上来，
    // 玩家跑上玉京台台面（4680）就收队 —— 石阶上有追兵挡着，他们不敢跟上来
    chaseAt: 2400,
    squadCount: 2,
    squadSpeed: 80,
    squadSpawnGap: 260,
    squadStop: 4680,
    chaseCause: 'guard',

    hints: [
      { x: 100, y: 1085, text: '向右走，去往生堂找客卿' },
      { x: 880, y: 1085, text: '夜泊石封在码头的矿壳里' },
      { x: 1210, y: 1085, text: '踩木箱上屋檐 · 沿屋檐过桥' },
      { x: 2580, y: 1085, text: '永生香在香铺门口' },
      { x: 2360, y: 1085, text: '香铺前有千岩军 · 岩化静止可避开视线' },
      { x: 2070, y: 1085, text: '往生堂' },
      { x: 3380, y: 1085, text: '街面塌了一截 · 踩木箱走屋檐' },
      { x: 3960, y: 1085, text: '玉京台 · 送仙典仪' },
    ],
  },

]
