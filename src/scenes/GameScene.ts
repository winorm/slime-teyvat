import Phaser from 'phaser'
import { ELEMENTS, ELEMENT_ORDER, type ElementKey } from '../data/elements'
import {
  LEVELS,
  THEME_COLORS,
  type LevelDef,
  type DomeDef,
  type PlatformDef,
  type PickupDef,
  type SpeedItemDef,
  type RepairDef,
  type MonsterDef,
  type StairDef,
  type SlopeDef,
  type AmberDef,
} from '../data/levels'
import {
  progress,
  unlockElement,
  cycleElement,
  recordClear,
  saveProgress,
  hasSeenHint,
  markHintSeen,
} from '../state/progress'
import { playMusic, playSfx, setLoop, stopAllLoops } from '../state/audio'
import { queueAchievementToast } from '../state/achievements'
import { touchMode, touchText } from '../state/touch'
import { getMoveMode } from '../state/settings'
import { DEV_LEVEL, DEV_LEVEL_MODE } from '../data/devLevel'
import { DOMAIN_LEVEL } from '../data/domainLevel'

type SceneCheckpoint = { x: number; y: number; element?: ElementKey }
type GameSceneStartData = {
  domain?: boolean
  returnPoint?: SceneCheckpoint
  checkpoint?: SceneCheckpoint
}

const HOVER = {
  // 风元素削过一轮（用户按玩家反馈选了 B 档）：升得慢一点、耗得快一点、回得也慢一点
  riseSpeed: 55,
  fallSpeed: 35,
  drainPerSecond: 40,
  // 缓降不再白嫖：滑翔期间也慢慢扣体力，扣干了就变自由落体
  glideDrainPerSecond: 5,
  regenPerSecond: 50,
}

const STAMINA_MAX = 100

// 碎裂平台：踩上去之后多久塌掉。
// 风史莱姆削成 B 档之后（升速 70→55、耗体力 30→40/秒），第三关那两颗掉在坑里的
// 原石变得拿不到了——玩家从碎裂平台跳下去捡、再飞回来需要更多时间，所以从 800 提到 1200
const CRUMBLE_DELAY = 1200

// 技能持续时间（秒）
const ARMOR_TIME = 10
const PILLAR_TIME = 30

// 岩化的冷却：技能结束后要等这么久才能再按 X（时间到、被打碎、换元素都算结束）
const ARMOR_COOLDOWN = 8

// 造像往下压多少像素：压在底座顶面上，
// 看起来是"下面的圆台把上面的造像托住"，而不是造像悬在半空
const STATUE_SEAT = 5

// 岩化时的跳跃加成：速度 ×1.12，实际跳高从 48 涨到约 60 像素
const ARMOR_JUMP = 1.12

// 压力板：压到底要多久（秒），以及压下去多深（像素）
const PLATE_PRESS_TIME = 0.45
const PLATE_SINK = 3

// 压力板分两件：一件看不见的"判定条"，一件看得见的"板子"。
// 判定条故意比画面窄一圈 —— 第六关矿洞口那两块板板心相距 70，
// 判定条 34 + 史莱姆 32 = 66 < 70，所以一个人跨不住两块（岩柱 20 更不可能）
const PLATE_BODY = { width: 34, height: 8 }

// 板子的画面深度跟客栈家具一套：树前层压在树根（depth 2）前面，树后层沉到史莱姆后面
// （沉下去以后靠树根那圈"透视洞"露出来，跟家具在树后是一样的道理）
const PLATE_DEPTH = { front: 2.9, back: 1.05 }

// 金桂飘花（第七关一楼那棵景观树）：隔多久飘一片花瓣、花瓣用哪几种金
const PETAL_INTERVAL = 0.2
const PETAL_COLORS = [0xf2c14e, 0xffd97a, 0xffe9a8, 0xd99a2b]

// 第七关那条杏仁豆腐支线做完之后，这一关的机关也要记进存档（用户要求：别让人重跑一遍）。
// 借 seenHints 这条现成的存档数组放一个标记，省得去动 progress.ts 里 SaveData 的结构
// （那个文件按约定归用户维护）。这个字符串不会被任何提示查询用到，放着是安全的
const INN_RESTORED_FLAG = 'inn-restored'

// 第五关的"小龙已经救出来了"同样记进存档（用户要求）：下次进来方碑全亮、四道门全开、
// 笼子是空的、宝箱已经在塔中央。存法同上（借 seenHints）
const TOWER_RESTORED_FLAG = 'tower-restored'

// 第八关的两处动画也记进存档（用户要求：开箱之后存，下次进来不用再看一遍）：
//   ① 请仙典仪那场戏演过了 —— 祭坛就是撞毁的、龙还趴在上面
//   ② 出玉京台那场追击演出放过了 —— 只跳过镜头演出，千岩军照旧会追上来
// 存法同上（借 seenHints）
const RITE_SEEN_FLAG = 'terrace-rite-seen'
const TERRACE_CHASE_FLAG = 'terrace-chase'

// 岩柱：贴图多大、从落点上方多高开始掉、蓄力多久、落点最远能低于脚底多少
const PILLAR_SIZE = { width: 20, height: 72 }
const PILLAR_DROP = 140
const PILLAR_REACH = 170
// 按住多久算「长按」（秒）：短按直接放，长按进预览、再点一次 C 才落柱
const PILLAR_HOLD = 0.22
// 依次尝试的生成距离：前面放不下就往人身边挪
const PILLAR_OFFSETS = [30, 22, 14, 6, 0]

// 雷闪（X）：朝指定方向瞬移一段。点按 = 朝面朝方向闪，按住 = 进瞄准、松开闪。
// 它同时是最强位移和最硬无敌（位移期间免疫一切伤害、穿过所有障碍），
// 所以单独给它一套「电荷」资源，不能无限赖
const BLINK_DIST = 90
// 按住多久算「长按」（和岩柱同一个手感阈值）
const BLINK_HOLD = 0.22
// 一次闪完之后的硬直：这段时间里按 X 不响应
const BLINK_LOCKOUT = 0.4
// 位移期间的无敌时间（盖住整段闪现 + 一点余量）
const BLINK_INVULN = 0.35
const BLINK_CHARGE_MAX = 3
// 站着不动每这么久回一格电荷（落地也立刻回一格）
const BLINK_CHARGE_TIME = 3
// 瞄准时指针离史莱姆小于这个距离就不改方向（免得手指一抖方向乱跳）
const BLINK_AIM_DEAD = 24

// 雷鸣（C）：正前方依次劈下三道雷，落点会往附近的目标吸一点，免得瞄不准
const THUNDER_STEPS = [70, 140, 210]
const THUNDER_GAP = 0.18
const THUNDER_COOLDOWN = 5
const THUNDER_SNAP = 26
// 每道雷的判定半宽。36 > 相邻两道之间的一半间隔（35），
// 所以三道雷的判定区是连成一片的，不是三个孤立的柱子
const THUNDER_HIT_W = 36
// 魔物被雷劈中后眩晕多久（眩晕里它不动、碰到玩家也不致死）
const THUNDER_STUN = 5

// 魔物：来回巡逻的怪。碰到即死，被雷鸣劈中晕 3 秒
type MonsterRef = {
  def: MonsterDef
  sprite: Phaser.GameObjects.Image
  stunMark: Phaser.GameObjects.Image
  dir: number
  stun: number
}

// 千岩军（第八关潜行要用）：巡逻 + 一个扇形视野。看见你 1.2 秒算"被发现"，
// 被发现就朝你追过来；甩掉他的视线 3 秒，他才回到巡逻。
// 注意：正式的字段还没写进 levels.ts（那是用户的文件），这里先按同名可选字段读，
// 以后他把 `guards?: GuardDef[]` 加进 LevelDef，这段不用改
// 视野是"朝斜下方"的一个扇形：中心在水平下方 50°，张角 ±40° ——
// 上边界 = 水平下方 10°，所以正前方（眼睛那条水平线）他是看不见的
const GUARD_VISION = { range: 170, center: 50, halfAngle: 45 }
// 疑惑 2.5 秒攒满（用户要求）；消得慢 —— 每秒掉 20%（满进度算 100%）
const GUARD_AWARENESS_UP = 1 / 2.5
const GUARD_AWARENESS_DOWN = 0.2
const GUARD_LOSE_TIME = 3
const GUARD_CHASE_SPEED = 72
const GUARD_TOUCH = 20
// 追击被挡下来、疑惑也清空之后，自己走回巡逻路线的速度
const GUARD_RETURN_SPEED = 40
// 眼睛（面甲那条缝）在贴图底边往上 36 的位置
const GUARD_EYE_LIFT = 36

// 千岩军的五个状态：
//   patrol     在自己那段范围里来回走
//   suspicious 看见人了（还没满）—— 呆在原地不动，疑惑慢慢攒
//   chase      疑惑满了，朝你追
//   recover    追击被打断（撞障碍 / 跟丢）—— 也呆在原地，疑惑慢慢消
//   return     疑惑清空了，自己走回原巡逻路线最近的一点（无视障碍、从图层下方过）
type GuardState = 'patrol' | 'suspicious' | 'chase' | 'recover' | 'return'

type GuardDef = {
  x: number
  y: number
  range: number
  speed?: number
  facing?: 1 | -1
  vision?: number
}

type GuardRef = {
  def: GuardDef
  sprite: Phaser.GameObjects.Image
  mark: Phaser.GameObjects.Image
  dir: number
  awareness: number
  state: GuardState
  loseTimer: number
}

type PillarTarget = {
  x: number
  landTop: number
  spawnBottom: number
  valid: boolean
}

// 岩化时本体放大的倍数。放大后同样的 sy 会摆出更大的位移，所以走动形变的幅度
// 要按这个倍数收回来，岩化态和普通态的晃动幅度、节奏才是一样的
const ARMOR_GROW = 1.15

const HAZARD = {
  width: 24,
  gapHeight: 70,
}

// 木楼梯：每级踏板的宽度（0.5 个史莱姆宽 = 16）。
// 踏板是三角形切面，一级比一级高一点点；AUTO_STEP 是「不用跳、走上去就自动抬起来」的最大高度
const STAIR_TREAD = 16
const AUTO_STEP = 14
// 自动上台阶时往上抬的速度（像素/秒）。一级 8~12 像素，摊到三四帧里抬完：
// 瞬移的话镜头慢半拍，人在屏幕上先弹上去、镜头再慢慢追回来，看着就是抖
const STAIR_CLIMB_SPEED = 150
// 上台阶的这几帧把镜头的纵向跟随临时调紧。
// 平时 0.12 是为了让跳跃看着飘一点，但爬楼梯时人是一级一级往上抬的，
// 镜头跟不上就会看到「人弹上去、镜头再慢慢沉回来」——那就是抖
const STAIR_CAM_LERP = 0.75
// 上台阶结束后镜头还要继续「收紧」这么久，把剩下的一点偏差收干净再回到平时的跟随
const STAIR_CAM_HOLD = 0.25
// 平时镜头的纵向跟随
const CAM_LERP_Y = 0.12

// 屏幕 UI（HUD）的统一层级：必须盖在所有游戏内物件之上。
// 以前这些对象都是默认 0，史莱姆（10）、造物（4~6）、提示条（20/21）走到角落时会把它们压住
const HUD_DEPTH = 110
// 屏幕中下方的消息条比 HUD 再高一层，免得被虚拟按键盖住
const HUD_MESSAGE_DEPTH = 130

// 浮动摇杆：平时静静躺在左下角；手指在左下这块区域按下就跳到那里，
// 横向拖过 deadZone 才算「往左 / 往右」
const STICK = {
  idleX: 66,
  idleY: 214,
  radius: 26,       // 摇杆头能离开底盘中心的最大距离
  deadZone: 10,     // 横向超过这个距离才判定移动
  zoneRight: 210,   // 这块区域里按下才会唤起摇杆，避免和右下角技能键打架
  zoneTop: 130,
  hitRadius: 36,    // 底盘贴图 72x72 的一半，用来算「史莱姆靠近就变淡」
}

// 摇杆的透明度：待机和按住时不一样，再乘上「靠近变淡」的系数
const STICK_ALPHA = {
  base: 0.6,
  knob: 0.85,
  baseActive: 0.75,
  knobActive: 0.95,
  fade: 0.45,
}

const CHASE = {
  speed: 60,
  triggerX: 560,
  stopX: 1450,
}

// 追击小队（第八关那套）：走过触发线 → 演出 → 原地生成几个千岩军一路追你。
// 第三关那种"压过来的墙"还是用上面的 CHASE + level.chase（那边一个字没动）。
// 这几个字段还没写进 levels.ts（那是用户的文件），这里按同名可选字段读
type ChaseTuning = {
  wallAt?: number
  chaseStop?: number
  chaseSpeed?: number
  chaseTint?: number
  chaseAt?: number
  chaseCause?: string
  squadCount?: number
  squadSpeed?: number
  squadSpawnGap?: number
  squadStop?: number
}

// 追击小队的默认值：速度比玩家跑得慢一点（玩家全速 100），但不会停 ——
// 一路不摔不卡才甩得掉。跳跃速度用的是玩家那套 (-260)，所以它们跳不过高墙 / 岩柱
const SQUAD = { count: 3, speed: 92, gap: 260, jump: -260, jumpCooldown: 0.5 }

type ChaserRef = {
  sprite: Phaser.Physics.Arcade.Sprite
  jumpCooldown: number
  stuck: number
  detour: number
}

// ── 港口"背景打包"（用户定的做法）──────────────────────────────
// 一段街区 = 一个可复制的打包：里面按"史莱姆前 / 史莱姆后"两层摆好该有的东西。
// 关卡数据只写 `harborBlocks: [{ at, kind }]`，引擎把整段盖上去 —— 想要长一点就多写几段。
//   后景（在史莱姆后面）：房屋（成排挤在一起）、摊位（码头上卖鱼肉）、木箱、人群
//   前景（压在史莱姆前面）：水面、船只、护栏（**只有码头有**）、摊位的背面、
//                          少数街边房屋的背面（带透视，走到后面能看见史莱姆）
const HARBOR_BLOCK_WIDTH = 460

type HarborPiece = {
  dx: number
  key: string
  scale?: number
  dy?: number
  alpha?: number
  tint?: number          // 远的东西压一层青灰（空气透视）
  depth?: number        // 后景默认 -5；人群压在房屋前面就给 -4 之类
  randomScale?: number  // 每次盖上去随机缩放一点（人群用，显得热闹）
}

// 港口这批贴图是"先画再 generateTexture"的，画稿下沿离画布底边还空着一截
// （房子 / 摊位那几张的最下一行画在倒数第 8 行，底下 8 像素是透明的）。
// 直接让图片底边贴地，看着就是房子浮在地面上方 —— 这里按"贴图里真正画到的
// 最下一行像素"把每张图往下压回去，量一次记下来，之后就查表。
const HARBOR_BOTTOM_PAD: Record<string, number> = {}

function harborBottomPad(scene: Phaser.Scene, key: string) {
  const cached = HARBOR_BOTTOM_PAD[key]

  if (cached !== undefined) {
    return cached
  }

  let pad = 0
  const source = scene.textures.exists(key)
    ? (scene.textures.get(key).getSourceImage() as unknown as HTMLCanvasElement)
    : null
  const width = source?.width ?? 0
  const height = source?.height ?? 0

  if (width > 0 && height > 0) {
    const canvas = document.createElement('canvas')

    canvas.width = width
    canvas.height = height

    const ctx = canvas.getContext('2d', { willReadFrequently: true })

    if (ctx) {
      ctx.drawImage(source as unknown as CanvasImageSource, 0, 0)

      const pixels = ctx.getImageData(0, 0, width, height).data

      pad = height

      for (let y = height - 1; y >= 0 && pad === height; y--) {
        for (let x = 0; x < width; x++) {
          if (pixels[(y * width + x) * 4 + 3] > 8) {
            pad = height - 1 - y
            break
          }
        }
      }

      // 整张全透明就当没有留白，别把东西按一整张图的高度推下去
      if (pad === height) {
        pad = 0
      }
    }
  }

  HARBOR_BOTTOM_PAD[key] = pad

  return pad
}

// 每类打包都有两版（用户要求两版都会用上）。数据里写 { at, kind, variant }，
// 不写 variant 就是第一版。两版通用的规矩：
//   · 房子 / 摊位都按贴图真正画到的那一行贴地（harborBottomPad）
//   · 同一段里不放"正面摊位 + 背面摊位"同框
//   · 背向房子只摆在后排房子够不着的地方，先不做半透明（透视以后一起做）
//   · 史莱姆一段最多两只，而且隔开摆
// 房子贴图放大 1.4 倍后一段（460 宽）只塞得下三件左右，摆位都是按这个算的
const HARBOR_BLOCKS: Record<
  'dock' | 'street' | 'suburb' | 'terrace',
  { decor: HarborPiece[]; front: HarborPiece[]; water?: boolean; railing?: boolean }[]
> = {
  // ── 码头 ──────────────────────────────────────────────────
  dock: [
    {
      // 第一版：水面 + 护栏；后景是房子 + 卖鱼肉的正面摊位，岸边摆一个背面摊位，水里停一条小船
      // 正 / 背向摊位不同框：正面摊位在 230，背面摊位在左边的 95
      water: true,
      railing: true,
      decor: [
        { dx: 75, key: 'harbor-house-c' },
        { dx: 230, key: 'harbor-stall', dy: -2 },
        { dx: 385, key: 'harbor-house-a' },
        { dx: 155, key: 'harbor-slime-a', depth: -4, randomScale: 0.12 },
        { dx: 300, key: 'harbor-slime-c', depth: -4, randomScale: 0.12 },
      ],
      front: [
        { dx: 95, key: 'harbor-stall-back' },
        { dx: 400, key: 'harbor-boat-a', scale: 1.1, dy: 30 },
      ],
    },
    {
      // 第二版：左边两栋楼房底部相连（屋檐相接），灯笼串正好牵在它们的屋檐下 ——
      // 绳子两头分别落在这两栋的屋檐里，才挂得住；右边立一座牌楼
      //（左两根柱子在后层、右两根在前层，史莱姆能从底下穿过去）
      water: true,
      railing: true,
      decor: [
        { dx: 73, key: 'harbor-house-a' },
        { dx: 219, key: 'harbor-house-a' },                              // 和上一栋底部相连
        { dx: 362, key: 'harbor-paifang' },
        // 灯笼：dx 卡在两栋的接缝上、高度卡在它们的屋檐下（绳子两头都在屋檐里）
        { dx: 146, key: 'harbor-lanterns', dy: -83, depth: -4 },
        { dx: 250, key: 'harbor-slime-a', scale: 0.85, depth: -4, randomScale: 0.12 },
        { dx: 400, key: 'harbor-slime-b', depth: -4, randomScale: 0.12 },
      ],
      front: [
        { dx: 362, key: 'harbor-paifang-front' },                        // 牌楼的前两根柱子
        { dx: 30, key: 'harbor-boat-a', scale: 1.1, dy: 30 },
      ],
    },
    {
      // 第三版：宽厅 + 小屋，岸边停一条高帆渔船；摊位只有岸边那个背向的
      water: true,
      railing: true,
      decor: [
        { dx: 140, key: 'harbor-house-b' },
        { dx: 370, key: 'harbor-house-c' },
        { dx: 60, key: 'harbor-slime-c', depth: -4, randomScale: 0.12 },
        { dx: 290, key: 'harbor-slime-d', depth: -4, randomScale: 0.12 },
      ],
      front: [
        { dx: 100, key: 'harbor-stall-back' },
        { dx: 250, key: 'harbor-boat-b', scale: 0.9, dy: 45 },
      ],
    },
  ],
  // ── 街市 ──────────────────────────────────────────────────
  street: [
    {
      // 第一版：后景房子 + 街上摊位（青菜 / 果子 / 蒸笼）；背向房子单独摆在右边空当里
      decor: [
        { dx: 80, key: 'harbor-house-a' },
        { dx: 245, key: 'harbor-stall-street', dy: -2 },
        { dx: 170, key: 'harbor-slime-d', depth: -4, randomScale: 0.12 },
        { dx: 285, key: 'harbor-slime-b', depth: -4, randomScale: 0.12 },
      ],
      front: [{ dx: 385, key: 'harbor-house-back' }],
    },
    {
      // 第二版：高铺 + 小屋挤在一起（屋檐叠、主体相连），摊位挪到右边；
      // 背面摊位改摆在左边的房子前面，和正面摊位隔着 80 像素
      decor: [
        { dx: 90, key: 'harbor-house-d' },
        { dx: 215, key: 'harbor-house-c' },
        { dx: 340, key: 'harbor-stall-street', dy: -2 },
        { dx: 240, key: 'harbor-slime-a', scale: 0.85, depth: -4, randomScale: 0.12 },
        { dx: 430, key: 'harbor-slime-b', depth: -4, randomScale: 0.12 },
      ],
      front: [{ dx: 150, key: 'harbor-stall-back' }],
    },
    {
      // 第三版：两栋房子 + 右边一个背向摊位（这一段里没有正面摊位，不存在同框问题）
      decor: [
        { dx: 90, key: 'harbor-house-c' },
        { dx: 280, key: 'harbor-house-a' },
        { dx: 180, key: 'harbor-slime-d', depth: -4, randomScale: 0.12 },
        { dx: 390, key: 'harbor-slime-b', depth: -4, randomScale: 0.12 },
      ],
      front: [{ dx: 430, key: 'harbor-stall-back' }],
    },
  ],
  // ── 郊区 ──────────────────────────────────────────────────
  // 房子稀疏、没有水和护栏，中间留大片空地给远景
  suburb: [
    {
      decor: [
        { dx: 100, key: 'harbor-house-c' },
        { dx: 420, key: 'harbor-house-c', scale: 0.92 },
        { dx: 180, key: 'harbor-slime-a', scale: 0.85, depth: -4, randomScale: 0.12 },
        { dx: 350, key: 'harbor-slime-b', depth: -4, randomScale: 0.12 },
      ],
      front: [{ dx: 265, key: 'harbor-stall-back', scale: 0.95 }],
    },
    {
      // 第二版：左边一栋单层大厅、右边一个小屋，路边摊摆在前景左边
      decor: [
        { dx: 90, key: 'harbor-house-b' },
        { dx: 390, key: 'harbor-house-c' },
        { dx: 250, key: 'harbor-slime-d', depth: -4, randomScale: 0.12 },
        { dx: 415, key: 'harbor-slime-a', scale: 0.85, depth: -4, randomScale: 0.12 },
      ],
      front: [{ dx: 150, key: 'harbor-stall-back' }],
    },
    {
      // 第三版：最空的一版 —— 一栋两层楼房 + 一个小屋，中间大片空地，前景什么都不摆
      decor: [
        { dx: 120, key: 'harbor-house-a' },
        { dx: 380, key: 'harbor-house-c' },
        { dx: 60, key: 'harbor-slime-c', depth: -4, randomScale: 0.12 },
        { dx: 250, key: 'harbor-slime-a', scale: 0.85, depth: -4, randomScale: 0.12 },
      ],
      front: [],
    },
  ],

  // ── 玉京台（请仙典仪那一层）─────────────────────────────────
  // 站在台面（880）上的两座巨型房子：一段打包一栋，底边贴在台面上。
  // 玉京台不用港口那套"水面 / 护栏"，所以这两样都不写；后景 depth -5，
  // 屋脊比台面上的史莱姆高、但整座屋顶都在镜头里（高 ~190）
  terrace: [
    {
      // 第一版：请仙典仪的大殿 —— **站在上底的远边上**（z = 500，和连廊同一条线）：
      //   y(500) = 815.7、大小 0.643。以前放 z=900 会让它的脚底浮在远边上方 26 像素，
      //   底下那截空着；现在脚底就落在远边上，前面对着后沿矮围栏，不会再有悬空
      decor: [{ dx: 575, key: 'terrace-hall', scale: 0.643, dy: -64, alpha: 0.94, tint: 0xd8e2e8, depth: -7 }],
      front: [],
    },
    {
      // 第二版：逃跑那一片的连廊（575 一段，一段接一段拼成一条长廊；
      // dx 287 = 摆在段中间，所以一段正好盖住 at ~ at+575）。
      // 连廊站在**台面上底的远边**（z = 500 → y(500) = 815.7、大小 0.643），
      // 也就是它和台面共用同一条远边；两段的间距同样要跟着缩（575 → 370）——
      // 见 levels.ts 里的 at（3205 / 3575，渲染中心 3492 / 3862，正好铺满右半边的远边）
      decor: [{ dx: 287, key: 'terrace-wing', scale: 0.643, dy: -64, tint: 0xe4ecf0 }],
      front: [],
    },
  ],
}

// ─────────────────────────────────────────────────────────────
// 测试关卡（只有 DEV_MODE + ?dev=1 进得来）：大厅 + 分类展示间
//
// 用户的新设计（2026-10-08）：进关卡先落在一个大厅里，一排传送门各自写着名字；
// 走进一扇门就换到一间「只放这一类东西」的展示间，展品之间隔着一段距离，方便逐个看。
// 传送门的机制（画门 / 按 F / 切房间）在 GameScene 里，房间的内容就是下面这张表。
// **只影响 ?dev=1 的测试关卡，正式关卡一个字都不动**
// ─────────────────────────────────────────────────────────────
const DEV_GROUND_TOP = 860

// 台阶高度实验台（能力测试厅最右边那一排）：从"走上去的上限"一路排到"跳起来挤上去的上限"，
// 用来量三个阈值 —— 玩家正常走上台阶 ≤14（AUTO_STEP），干净起跳能上去 ≤ 约 56（跳高 260²/(2×600)），
// 再高就得靠"跳起来顶住侧面往右挤"那条缝隙了
const STEP_LAB = [16, 24, 40, 51, 54, 58, 62, 66, 70]

// 矮通道实验台（「矮通道」厅）：一排"平台底面离地多高"的通道，用来量**净空**那条边界 ——
// 史莱姆碰撞盒高 26，净空小于 26 时正常走不进去，但跳到空中同时往右挤，可能会被
// 引擎按"最浅方向"往下压、从而钻过去。这里的数字都是**净空**（不含平台板厚）
const GAP_LAB = [12, 16, 20, 22, 24, 26, 30]
const GAP_TINT = 0x8a4a6a

// 展品：展示间里「同一类东西」中的一个。
// statue 是已经画好的神像（没做过贴图的元素会自动退回一块灰牌），slot 是纯预留位
type DevExhibit =
  // playable：这尊能站面前按 F 看「元素授予」那套演出（展厅里只看动画，不给元素）
  | { kind: 'statue'; x: number; element: ElementKey; label: string; playable?: boolean }
  | { kind: 'slot'; x: number; label: string }
  // prop：随便摆一张贴图当展品（新美术先摆出来给用户审外观用）
  | { kind: 'prop'; x: number; label: string; key: string; scale?: number; depth?: number; sway?: boolean }

type DevLevelDef = LevelDef & { devExhibits?: DevExhibit[]; guards?: GuardDef[] }

type DevRoomDef = { label: string; level: DevLevelDef }

type DevPortalRef = { x: number; label: string; room: number; groundY: number }

// 展示间的公共壳：一条地面 + 七种元素全解锁 + 不设终点（宝箱摆在世界外面，够不着）
function devRoomShell(name: string, intro: string, width: number): DevLevelDef {
  return {
    name,
    intro,
    width,
    height: 900,
    startElement: 'none',
    unlocks: [...ELEMENT_ORDER],
    spawn: { x: 150, y: 820 },
    bg: 'field',
    music: 'music-field',
    goal: { x: -600, y: DEV_GROUND_TOP - 14, kind: 'chest', prompt: '打开' },
    platforms: [{ x: width / 2, y: DEV_GROUND_TOP + 20, width, height: 40 }],
    stairs: [],
    pickups: [],
    repairs: [],
    orbs: [],
    gems: [],
    blessings: [],
    hazards: [],
    monuments: [],
    notes: [],
    hints: [],
  }
}

// ① 七天神像：风 / 岩是成品，站面前按 F 能看「元素授予」那套动画 ——
// 展厅里只放动画、不真的给元素（用户要求：测试关的神像保留动画，不保留功能），另外五种先立灰牌
function devStatueRoom(): DevLevelDef {
  const level = devRoomShell(
    '测试 · 七天神像',
    '七天神像展厅：\n七尊展品间距 230。\n风、岩能站面前看动画，\n只看演出、不给元素；\n其余五种还是预留位。',
    1900
  )

  // 注意：标签里别出现「按 F」三个字 —— makeHint 会把它当成操作提示，
  // 一旦这一类提示过了就不再显示，标签会整块消失
  level.devExhibits = [
    { kind: 'statue', x: 290, element: 'wind', label: '风神像 · 可看演出', playable: true },
    { kind: 'statue', x: 520, element: 'rock', label: '岩神像 · 可看演出', playable: true },
    { kind: 'slot', x: 750, label: '雷神像（预留）' },
    { kind: 'slot', x: 980, label: '草神像（预留）' },
    { kind: 'slot', x: 1210, label: '水神像（预留）' },
    { kind: 'slot', x: 1440, label: '火神像（预留）' },
    { kind: 'slot', x: 1670, label: '冰神像（预留）' },
  ]

  level.hints = [{ x: 180, y: 752, text: '展厅：神像只演动画，不给元素' }]

  return level
}

// ② 元素方碑：未点亮 / 已点亮各摆一对（风、岩都是真能点亮的），再往右是预留位
function devMonumentRoom(): DevLevelDef {
  const level = devRoomShell(
    '测试 · 元素方碑',
    '元素方碑展厅：\n前四块是风 / 岩的\n未点亮与已点亮对照，\n再往右是预留位。',
    2100
  )

  level.monuments = [
    { x: 300, y: 838, element: 'wind', id: 'vm1' },
    { x: 520, y: 838, element: 'rock', id: 'vm2' },
    { x: 740, y: 838, element: 'wind', id: 'vm3', startLit: true },
    { x: 960, y: 838, element: 'rock', id: 'vm4', startLit: true },
    // 雷方碑：走近了用雷元素碰，或者站在左边用雷鸣劈
    { x: 1200, y: 838, element: 'thunder', id: 'vm5' },
  ]

  level.devExhibits = [
    { kind: 'slot', x: 1420, label: '草方碑（预留）' },
    { kind: 'slot', x: 1640, label: '水方碑（预留）' },
    { kind: 'slot', x: 1860, label: '火方碑（预留）' },
  ]

  level.hints = [
    { x: 300, y: 690, text: '未点亮' },
    { x: 740, y: 690, text: '已点亮' },
    { x: 130, y: 780, text: '风 / 岩 / 雷都能真的点亮' },
  ]

  return level
}

// ③ 造物机关：石门、天花板岩刺、横向岩刺、压力板 + 铁栅栏，一样隔一段摆一处
function devTrapRoom(): DevLevelDef {
  const level = devRoomShell(
    '测试 · 造物机关',
    '造物机关展厅：\n石门（要两块方碑）、\n天花板岩刺、横向岩刺、\n压力板 + 铁栅栏。',
    2400
  )

  level.platforms = [
    { x: 1200, y: DEV_GROUND_TOP + 20, width: 2400, height: 40 },
    // 岩刺区头顶那块天花板：四个发射器贴在它底面往下打
    { x: 1300, y: 240, width: 620, height: 30 },
    // 横向岩刺：两段矮墙隔开一段空档，机关装在右边那段的左面，横着打过来。
    // 矮墙刚好一人多高（能跳过去，走过去会被挡住），岩刺在中间飞，玩家得用岩柱（C）挡
    { x: 1660, y: 840, width: 18, height: 40 },
    { x: 1900, y: 840, width: 18, height: 40 },
  ]

  level.monuments = [
    { x: 380, y: 838, element: 'wind', id: 'tm1' },
    { x: 860, y: 838, element: 'rock', id: 'tm2' },
  ]

  level.doors = [
    { x: 620, y: 840, width: 70, height: 40, needs: ['tm1', 'tm2'] },
    { x: 2200, y: 810, width: 80, height: 100, needs: ['p1', 'p2'], texture: 'iron-gate' },
  ]

  level.plates = [
    { x: 1950, y: 856, id: 'p1' },
    { x: 2030, y: 856, id: 'p2' },
  ]

  level.launchers = [
    { x: 1100, y: 262, interval: 2.2 },
    { x: 1250, y: 262, interval: 2.2 },
    { x: 1400, y: 262, interval: 2.2 },
    { x: 1550, y: 262, interval: 2.2 },
    { x: 1886, y: 845, dir: 'left', interval: 2 },
  ]

  level.hints = [
    { x: 380, y: 780, text: '方碑 ①' },
    { x: 860, y: 780, text: '方碑 ② → 石门' },
    { x: 1300, y: 180, text: '天花板岩刺 ×4' },
    { x: 1780, y: 780, text: '横向岩刺：两段矮墙中间，岩柱能挡' },
    { x: 1990, y: 790, text: '压力板 ×2（岩柱 / 岩化触发）→ 铁栅栏' },
  ]

  return level
}

// ④ 能力测试：岩柱 / 岩化、楼梯、电梯、单向平台、碎裂平台都在这儿
function devAbilityRoom(): DevLevelDef {
  const level = devRoomShell(
    '测试 · 能力测试',
    '能力测试：\n岩柱压板开铁栅栏、楼梯、\n水利电梯、单向平台、\n碎裂平台、雷闪的墙\n都在这儿。',
    4200
  )

  level.platforms = [
    { x: 2100, y: DEV_GROUND_TOP + 20, width: 4200, height: 40 },
    // 楼梯顶端接的那层楼板（顶面 700），一直连到电梯井口
    { x: 1465, y: 703, width: 430, height: 6, plank: true },
    // 电梯的两站：地面（860）和这层（660）
    { x: 1800, y: 663, width: 240, height: 6, plank: true },
    { x: 2000, y: 800, width: 120, height: 6, oneWay: true },
    { x: 2150, y: 740, width: 100, height: 6, crumble: true, tint: 0xa4583a },
    // 雷闪测试：一道 200 高的墙，跳不过去也绕不过去，只能闪过去；
    // 墙顶那块雷方碑够不着，只能站在左边用雷鸣劈
    { x: 2320, y: 760, width: 24, height: 200 },
    // 台阶高度实验台：一排不同高度的台子，专门用来量「走上去 / 跳上去 / 跳起来挤上去」
    // 三个阈值到底卡在哪 —— 每级 40 宽、间距 150，顶面高度写在标签上
    ...STEP_LAB.map((height, index) => ({
      x: 2650 + index * 150,
      y: DEV_GROUND_TOP - height / 2,
      width: 40,
      height,
      tint: 0x8a6a4a,
    })),
  ]

  level.monuments = [{ x: 2320, y: 638, element: 'thunder', id: 'ah1' }]
  // 墙那头放一只魔物：碰一下就死，站远点用雷鸣劈晕了再走过去
  level.monsters = [{ x: 2500, y: DEV_GROUND_TOP, range: 60 }]

  level.stairs = [
    { from: { x: 1050, y: DEV_GROUND_TOP }, to: { x: 1250, y: 700 }, layer: 'front' },
  ]

  level.lift = { x: 1800, width: 80, stops: [660, 860] }

  level.plates = [{ x: 600, y: 856, id: 'a1' }]
  level.doors = [
    { x: 820, y: 810, width: 80, height: 100, needs: ['a1'], texture: 'iron-gate' },
  ]

  level.hints = [
    { x: 600, y: 800, text: '压力板：只有岩柱 / 岩化能压住' },
    { x: 1150, y: 780, text: '楼梯（走上去自动抬脚）' },
    { x: 1800, y: 600, text: '水利电梯：右半边上行、左半边下行' },
    { x: 2000, y: 760, text: '单向平台' },
    { x: 2150, y: 700, text: '碎裂平台' },
    { x: 2180, y: 780, text: '雷闪：X 键长按瞄准，松开闪出' },
    { x: 2320, y: 592, text: '雷方碑（够不着，用雷鸣劈）' },
    { x: 2500, y: 760, text: '魔物：碰到即死，雷鸣劈中晕 3 秒' },
    ...STEP_LAB.map((height, index) => ({
      x: 2650 + index * 150,
      y: DEV_GROUND_TOP - height - 16,
      text: '台阶 ' + height,
    })),
  ]

  return level
}

// ⑤ 地形与建材：六块矮台依次是 草 / 浅水 / 砖 / 木 / 单向 / 碎裂，右边是背景静物
function devTerrainRoom(): DevLevelDef {
  const level = devRoomShell(
    '测试 · 地形与建材',
    '地形与建材展厅：\n六块矮台依次是草、浅水、\n砖、木、单向、碎裂，\n右边是背景静物。',
    1800
  )

  level.platforms = [
    { x: 900, y: DEV_GROUND_TOP + 20, width: 1800, height: 40 },
    { x: 320, y: 822, width: 110, height: 6, grass: true },
    { x: 470, y: 822, width: 110, height: 6, water: true },
    { x: 620, y: 822, width: 110, height: 6, brick: true },
    { x: 770, y: 822, width: 110, height: 6, plank: true },
    { x: 920, y: 822, width: 110, height: 6, oneWay: true },
    { x: 1070, y: 822, width: 110, height: 6, crumble: true, tint: 0xa4583a },
    // 第七关楼板那两样：护栏 + 楼板下面的立柱
    { x: 1350, y: 700, width: 220, height: 8, plank: true, rail: true, pillars: 2 },
  ]

  level.decor = [
    { x: 1460, y: DEV_GROUND_TOP, key: 'mine-hill' },
    { x: 1680, y: DEV_GROUND_TOP, key: 'ruin-house', scale: 0.85 },
  ]
  level.windmill = { x: 1780, y: DEV_GROUND_TOP }

  level.hints = [
    { x: 320, y: 770, text: '草 grass' },
    { x: 470, y: 770, text: '浅水 water' },
    { x: 620, y: 770, text: '砖 brick' },
    { x: 770, y: 770, text: '木 plank' },
    { x: 920, y: 770, text: '单向 oneWay' },
    { x: 1070, y: 770, text: '碎裂 crumble' },
    { x: 1350, y: 640, text: '护栏 rail + 立柱 pillars' },
  ]

  return level
}

// ⑥ 矮通道：量"平台底下多矮还能钻过去"（净空），第八关可以用它做暗道 / 藏东西
function devGapRoom(): DevLevelDef {
  const level = devRoomShell(
    '测试 · 矮通道',
    '矮通道实验台：\n每块平台底面离地多少写在牌子上。\n站在左边只按右会被挡住，\n跳起来同时按右挤，就能看出哪几档钻得过去。',
    2600
  )

  level.platforms = [
    { x: 1300, y: DEV_GROUND_TOP + 20, width: 2600, height: 40 },
    // 每块板底面离地 = gap（板本身 20 厚），间距 300，板宽 200
    ...GAP_LAB.map((gap, index) => ({
      x: 500 + index * 300,
      y: DEV_GROUND_TOP - gap - 10,
      width: 200,
      height: 20,
      tint: GAP_TINT,
    })),
  ]

  level.hints = GAP_LAB.map((gap, index) => ({
    x: 500 + index * 300,
    y: DEV_GROUND_TOP - gap - 36,
    text: '净空 ' + gap + ' 像素',
  }))

  return level
}

// ⑦ 潜行：千岩军巡逻 + 几摞木箱当掩体 —— 第八关「可疑人员」的核心玩法先在这儿试
function devStealthRoom(): DevLevelDef {
  const level = devRoomShell(
    '测试 · 潜行',
    '潜行测试：\n千岩军的视野是一个扇形。\n躲在木箱后面他看不见你，\n被看见 1.2 秒他就会追过来。',
    1900
  )

  level.platforms = [
    { x: 950, y: DEV_GROUND_TOP + 20, width: 1900, height: 40 },
    // 掩体：三摞木箱。48 高 —— 站着能挡住视线，跳一下又能翻过去
    { x: 420, y: 836, width: 76, height: 48, plank: true },
    { x: 980, y: 836, width: 76, height: 48, plank: true },
    { x: 1500, y: 836, width: 76, height: 48, plank: true },
  ]

  // 巡逻范围特意错开那三摞木箱（382~458 / 942~1018 / 1462~1538）——
  // 现在巡逻不再因为障碍掉头了，范围要是不错开，他会从箱子里穿过去
  level.guards = [
    { x: 700, y: DEV_GROUND_TOP, range: 120 },
    { x: 1250, y: DEV_GROUND_TOP, range: 150, facing: -1 },
    { x: 1700, y: DEV_GROUND_TOP, range: 110 },
  ]

  level.hints = [
    { x: 160, y: 780, text: '走到右边去：别走进扇形视野' },
    { x: 420, y: 770, text: '木箱后面看不见你' },
    { x: 980, y: 770, text: '掩体' },
    { x: 1500, y: 770, text: '掩体' },
  ]

  return level
}

// ⑧ 追击：走过触发点先放一段"被发现了"的演出，然后一道封锁线从后面压上来，
// 剩下那一整段是不同高度的跑酷（一级一级往上爬再跳下来），掉进水里不会死、
// 但大概率会被追上 —— 第八关"逃出璃月港"那段的手感先在这儿试
function devChaseRoom(): DevLevelDef {
  const level = devRoomShell(
    '测试 · 追击',
    '追击测试：\n往右跑，走过 x=380 会触发追击。\n剩下全是不同高度的跑酷，\n掉进水里不会死，但会被追上。',
    2600
  )

  // 高一点的关卡：下面要留出水面
  level.height = 960

  level.platforms = [
    // 出发点：一小段实地
    { x: 250, y: 880, width: 500, height: 40 },
    // 底下那片水：掉下来浮在水面上不会死。水面只比出发点低 12 像素 ——
    // 这样从水里能跳回最矮的那几级（跳高 56，最矮的台子顶面 821 离水面 51），
    // 落水是"掉一段节奏"而不是死路
    { x: 1600, y: 892, width: 2600, height: 40, water: true },

    // 跑酷路线：一级比一级高一点点（每级不超过 48，跳得上去）
    { x: 600, y: 838, width: 120, height: 34, plank: true },
    { x: 760, y: 806, width: 120, height: 34, plank: true },
    { x: 920, y: 782, width: 140, height: 34, plank: true },
    // 屋顶那一段可以一直跑
    { x: 1150, y: 782, width: 300, height: 34, plank: true },
    { x: 1440, y: 830, width: 120, height: 34, plank: true },
    { x: 1620, y: 800, width: 100, height: 34, plank: true },
    // 最后跳上一条船，再上岸
    { x: 1810, y: 790, width: 220, height: 30, plank: true },
    { x: 2060, y: 812, width: 140, height: 34, plank: true },
    { x: 2350, y: 838, width: 400, height: 40, plank: true },
    // 落水之后的救援台阶：贴着水面，能一级一级爬回路线
    { x: 2280, y: 880, width: 100, height: 30, plank: true },
  ]

  const tuning = level as DevLevelDef & ChaseTuning

  // 没有红色判定线了：走过 380 就演出一下、原地生成三个千岩军自己追
  tuning.chaseAt = 380
  tuning.squadCount = 3
  tuning.squadSpeed = 92
  tuning.squadSpawnGap = 240
  tuning.squadStop = 2480
  tuning.chaseCause = 'guard'

  level.hints = [
    { x: 200, y: 780, text: '往右跑 —— 走过 x=380 会被千岩军盯上' },
    { x: 900, y: 690, text: '一级一级往上跳' },
    { x: 1500, y: 830, text: '掉进水里不会死，但他们会追上来' },
    { x: 2350, y: 760, text: '跑到尽头（x=2480）就甩掉他们了' },
  ]

  return level
}

// 大厅里那一排门。x 是门中心，间距 230；最后一扇通向原来那个「一关走完全部机关」的旧沙盒
// ⑩ 港口打包预览：三类打包各摆三段（第一 / 二 / 三版，用户要求先在测试关里看效果，再拿去第八关铺）
function devHarborBlockRoom(): DevLevelDef {
  const level = devRoomShell(
    '测试 · 港口打包',
    '港口打包预览：\n每一段单独放，中间留空。\n从左到右：港口 ①②③、街道 ①②③、郊区 ①②③。\n每段 460 宽。',
    6300
  )

  // 用港口主题，水面 / 护栏 / 白天天空和随机远山才会出来
  level.bg = 'harbor'

  level.hints = [
    { x: 300, y: 700, text: '港口 第一版：一正一背两个摊位 + 小船' },
    { x: 1000, y: 700, text: '港口 第二版：两栋相连的楼房 + 灯笼串 + 牌楼' },
    { x: 1700, y: 700, text: '港口 第三版：宽厅 + 小屋 + 高帆渔船' },
    { x: 2400, y: 700, text: '街道 第一版：房子 + 街上摊位，右边是背向的房子' },
    { x: 3100, y: 700, text: '街道 第二版：高铺 + 小屋 + 左侧背向摊位' },
    { x: 3800, y: 700, text: '街道 第三版：两栋房子 + 右边背向摊位' },
    { x: 4500, y: 700, text: '郊区 第一版：两栋小屋、人少' },
    { x: 5200, y: 700, text: '郊区 第二版：大厅 + 小屋、路边摊' },
    { x: 5900, y: 700, text: '郊区 第三版：最空的一版，前景不摆东西' },
  ]

  const tuning = level as DevLevelDef & {
    harborBlocks?: { at: number; kind: 'dock' | 'street' | 'suburb'; variant?: number }[]
  }

  tuning.harborBlocks = [
    // 每段之间空 240（段宽 460），这样一眼能看出"一段到哪儿结束"
    { at: 70, kind: 'dock' },
    { at: 770, kind: 'dock', variant: 2 },
    { at: 1470, kind: 'dock', variant: 3 },
    { at: 2170, kind: 'street' },
    { at: 2870, kind: 'street', variant: 2 },
    { at: 3570, kind: 'street', variant: 3 },
    { at: 4270, kind: 'suburb' },
    { at: 4970, kind: 'suburb', variant: 2 },
    { at: 5670, kind: 'suburb', variant: 3 },
  ]

  return level
}

// ⑪ 人物：专门用来审角色的样子 —— 新画的 NPC 先摆这儿看，定稿了再挪进正式关卡。
//    别人的展厅是一类机制一间，这间只放"人"
function devCharacterRoom(): DevLevelDef {
  const level = devRoomShell(
    '测试 · 人物',
    '人物展厅：\n新画的人物先摆在这儿看，\n定稿了再挪进正式关卡。',
    1400
  )

  level.devExhibits = [
    { kind: 'prop', x: 420, label: '留云借风真君 · 鸟兽形态', key: 'npc-cloud-retainer-crane' },
  ]

  return level
}

// ⑫ 拱形土坡：走线本身是一条**真的弧**（`slopes`），不是台阶拼的 —— 给第九关的"爬山"试路。
//    两座拱：左边缓的（拱高 100、跨 700），右边陡的（拱高 300、跨 460）。
//    两座的两端都落在同一水平线上（DEV_GROUND_TOP），所以走到哪一段都是连着的地面
function devSlopeRoom(): DevLevelDef {
  const level = devRoomShell(
    '测试 · 拱形土坡',
    '拱形土坡实验台：\n走线是一条真的弧，不是台阶。\n左右走走、顶上跳一下，\n看脚底跟不跟得上弧面。',
    // 宽度要盖住掉头平台（一直铺到 2980）：关卡边界就是这里的宽度，写小了人会被挡在平台前面
    3400
  )

  level.platforms = [
    { x: 1700, y: DEV_GROUND_TOP + 20, width: 3400, height: 40, grass: true },
    // 盘山道的转角平台：**左端必须正好落在下跑收平的那一点（x 2500、顶面 720）**，
    // 多伸出去一截就是一道坎，人爬坡上来会被它挡住（第一版伸到 2440，实测卡在 x 2424）
    { x: 2560, y: 723, width: 120, height: 6, grass: true, depth: 3 },
    // 上跑尽头的上层平台（372 这一层，在后层）
    { x: 1900, y: 375, width: 120, height: 6, grass: true, depth: 1.9 },
    // 缓坡顶上的平台（600）：上楼走到这儿翻层再往左上，下楼顺着上跑下来落在这儿。
    // 右端一直顶到关卡边（3400 宽、边界在 3384），免得往右走过头掉下去
    { x: 3242, y: 603, width: 284, height: 6, grass: true, depth: 3 },
  ]

  level.slopes = [
    // 缓坡：拱顶 760、两端落到 860（＝地面线），跨度 700
    { x: 700, y: 760, width: 700, rise: 100, grass: true },
    // 陡坡：拱顶 560、两端同样落在 860，跨度 460（两端坡度接近 69°）
    { x: 1500, y: 560, width: 460, rise: 300, grass: true },
    // ── 叠两层：盘山道 ────────────────────────────────────────────────
    // 一笔写清楚这一层的走向：地面 860 →（下跑）→ 720 转角 →（引道）→ 640 →（上跑）→ 360 上层平台。
    // 关键是**四条坡在接缝处的斜率都对上了**（都等于 2·rise ÷ half），所以走上去是光滑的：
    //   下跑端点斜率 0（收平）→ 转角平台是平的 ✓
    //   引道上端斜率 0 → 上跑 a 起点斜率 0 ✓
    //   上跑 a 在 x=2300 处的斜率 +0.636 → 上跑 b 同一点也是 +0.636 ✓（b 的 rise 就是照这个反推的）
    // 下跑：地面 860（x 1900）升到 720（x 2500），越走越平
    { x: 2500, y: 720, width: 1200, rise: 140, tStart: -1, tEnd: 0, grass: true, depthTo: DEV_GROUND_TOP, depth: 2.3 },
    // 引道（转角那一下）：从转角平台右边（x 2620、720）抬到 640（x 2860）。
    // **底必须够缓**（2·rise ÷ half ≤ 0.7 左右）：贴地"开始骑"只认脚底离弧面 2 像素以内的，
    // 底太陡的话，人从平台边上迈出去的第一步就已经掉到弧面下面十几像素，直接被判成"在弧底下"进不去
    // （第一版 240 宽、底 53°，实测就在这儿掉回地面）
    { x: 2860, y: 640, width: 480, rise: 80, tStart: -1, tEnd: 0, grass: true, depthTo: DEV_GROUND_TOP, depth: 2.2 },
    // 缓坡：掉头平台（2860、640）走到缓坡顶（3100、600）—— **一条能直接走上去的坡**，
    // 不用跳。坡顶是平的，和上面那条上跑的起点同高，翻层之后接着就往左上
    { x: 3100, y: 600, width: 480, rise: 40, tStart: -1, tEnd: 0, grass: true, depthTo: DEV_GROUND_TOP, depth: 2.2 },
    // 上跑 a（**后层**）：起点 x 3100、600（就在缓坡顶上），往左升到 460（x 2400）。
    // 它和缓坡在下头这一段是重叠的 —— 靠 layer 分开，贴地只认当前那一层
    { x: 3100, y: 600, width: 1400, rise: -140, tStart: -1, tEnd: 0, grass: true, depthTo: DEV_GROUND_TOP, layer: 'back', depth: 1.8 },
    // 上跑 b（后层）：从 460（x 2400）继续往左升到 372（x 1960），到顶收平
    { x: 1960, y: 372, width: 880, rise: 88, tStart: 0, tEnd: 1, grass: true, depthTo: DEV_GROUND_TOP, layer: 'back', depth: 1.8 },
  ]

  level.hints = [
    { x: 300, y: 740, text: '拱形土坡 · 缓（拱高 100 / 跨 700）' },
    { x: 1500, y: 470, text: '拱形土坡 · 陡（拱高 300 / 跨 460）' },
    { x: 2150, y: 680, text: '叠两层 · 下跑（1900→2500，860→720）' },
    { x: 2400, y: 420, text: '叠两层 · 上跑（3100→1960，600→372，后层）' },
    { x: 2950, y: 640, text: '顺这条缓坡走上上跑' },
  ]

  // 拐角的两道翻层判定区（和玉京台折返楼梯一个思路：两条跑 x 重叠，靠层分开）：
  //   站在坡顶往**左**走 → 翻到后层，贴地就认上跑 a 了，一路往上
  //   顺着上跑走到头、往**右**走 → 翻回前层，贴地认缓坡，一路下来
  level.depthGates = [
    // 坡顶平台靠左这一小段：往左走 → 翻到后层（接着就骑上跑 a 往上）
    { x: 3120, y: 587, width: 40, height: 40, dir: -1 },
    // 平台靠右这一小段：往右走 → 翻回前层（再往回走就是缓坡下坡）
    { x: 3300, y: 587, width: 40, height: 40, dir: 1 },
  ]

  return level
}

// ⑬ 悬崖·树·石头：崖上的树 3 种（一种带鸟巢）、桦木 3 种、岩石横截面 3 种、
//    小石子 3 种、石堆。全是 2026/10/17 用户给第九关点的素材，先摆出来看
function devCliffRoom(): DevLevelDef {
  const level = devRoomShell(
    '测试 · 悬崖·树·石头',
    '悬崖素材展厅：\n崖树 / 桦木 / 岩石横截面 /\n小石子 / 石堆，\n排成两排看。',
    1300
  )

  level.devExhibits = [
    { kind: 'prop', x: 120, label: '崖松（斜长）', key: 'tree-cliff-a' },
    { kind: 'prop', x: 260, label: '崖树（带鸟巢）', key: 'tree-cliff-b' },
    { kind: 'prop', x: 400, label: '风歪树', key: 'tree-cliff-c' },
    { kind: 'prop', x: 540, label: '桦木 a', key: 'birch-a' },
    { kind: 'prop', x: 660, label: '桦木 c', key: 'birch-c' },
    { kind: 'prop', x: 880, label: '岩石横截面 a', key: 'rock-strata-a' },
    { kind: 'prop', x: 960, label: '岩石横截面 b', key: 'rock-strata-b' },
    { kind: 'prop', x: 1040, label: '岩石横截面 c', key: 'rock-strata-c' },
    { kind: 'prop', x: 1120, label: '石子 a', key: 'pebble-a' },
    { kind: 'prop', x: 1150, label: '石子 b', key: 'pebble-b' },
    { kind: 'prop', x: 1180, label: '石子 c', key: 'pebble-c' },
    { kind: 'prop', x: 1240, label: '石堆', key: 'stone-pile' },
  ]

  return level
}

const DEV_ROOMS: DevRoomDef[] = [
  { label: '七天神像', level: devStatueRoom() },
  { label: '元素方碑', level: devMonumentRoom() },
  { label: '造物机关', level: devTrapRoom() },
  { label: '能力测试', level: devAbilityRoom() },
  { label: '地形与建材', level: devTerrainRoom() },
  { label: '矮通道', level: devGapRoom() },
  { label: '潜行', level: devStealthRoom() },
  { label: '追击', level: devChaseRoom() },
  { label: '港口打包', level: devHarborBlockRoom() },
  { label: '人物', level: devCharacterRoom() },
  { label: '综合沙盒', level: DEV_LEVEL },
  // 新展厅一律**加在最后**：前面的下标是 `?room=N` 认的，插在中间会把老书签挪位
  { label: '拱形土坡', level: devSlopeRoom() },
  { label: '悬崖·树·石头', level: devCliffRoom() },
]

const DEV_PORTALS: DevPortalRef[] = DEV_ROOMS.map((room, index) => ({
  x: 260 + index * 230,
  label: room.label,
  room: index,
  groundY: DEV_GROUND_TOP,
}))

// 调试某一间展厅时不用先走大厅：地址上带 ?room=3 就直接落进第 3 间（0 起，越界就当大厅）
const DEV_START_ROOM = (() => {
  const raw = new URLSearchParams(location.search).get('room')
  const index = raw === null ? -1 : Number.parseInt(raw, 10)

  return Number.isInteger(index) && index >= 0 && index < DEV_ROOMS.length ? index : -1
})()

// 长房间（造物机关 2400 宽）想直接看中间某一处时：地址上再带 at=1700 就出生在那一列
const DEV_SPAWN_X = (() => {
  const raw = new URLSearchParams(location.search).get('at')
  const x = raw === null ? Number.NaN : Number.parseFloat(raw)

  return Number.isFinite(x) ? x : null
})()

const DEV_HUB: DevLevelDef = {
  ...devRoomShell(
    '测试关卡 · 大厅',
    '测试关卡 · 大厅\n一排门各通一间展厅，\n站到门前按 F 进去。',
    // 12 扇门了：260 + 11 × 230 = 2790，大厅至少要有这么宽
    3100
  ),
  spawn: { x: 90, y: 820 },
  hints: [{ x: 90, y: 740, text: '开发用的测试大厅（正式关卡里没有）' }],
}

type MonumentRef = {
  pillar: Phaser.Physics.Arcade.Sprite
  head: Phaser.GameObjects.Image
  icon: Phaser.GameObjects.Image
  element: ElementKey
  id: string
  after?: string
  lit: boolean
  hidden: boolean
  neighbors: string[]
  aura: Phaser.GameObjects.Image[]
}

type DoorRef = {
  sprite: Phaser.Physics.Arcade.Sprite   // 左半扇
  right: Phaser.Physics.Arcade.Sprite    // 右半扇
  needs: string[]
  ordered: boolean
  progress: string[]
  opened: boolean
}

type NoteRef = {
  sprite: Phaser.GameObjects.Image
  prompt: string
  text: string
}

type PlateRef = {
  sprite: Phaser.Physics.Arcade.Sprite
  art: Phaser.GameObjects.Image
  id: string
  baseY: number
  press: number       // 0 = 完全抬起，1 = 压到底
  pressed: boolean
}

type LauncherRef = {
  sprite: Phaser.GameObjects.Image
  dir: 'down' | 'left' | 'right'
  interval: number
  speed: number
  timer: number
}

export class GameScene extends Phaser.Scene {
  private level!: LevelDef
  private slime!: Phaser.Physics.Arcade.Sprite
  private platforms!: Phaser.Physics.Arcade.StaticGroup
  private blockers!: Phaser.Physics.Arcade.StaticGroup
  private stairs: Phaser.Physics.Arcade.Sprite[] = []
  // 玩家现在是在树前面还是树后面（第七关「绕树而上」用）
  private playerLayer: 'front' | 'back' = 'front'
  private trunkRT: Phaser.GameObjects.RenderTexture | null = null
  private trunkDrawn = { x: -99999, y: -99999, layer: '' as string }
  // 树根也做成 RenderTexture：史莱姆在树后层时同样擦透视洞
  private rootRT: Phaser.GameObjects.RenderTexture | null = null
  private rootDrawn = { x: -99999, y: -99999, layer: '' as string }
  // 楼内那根"短木"（第七关楼内几跑楼梯绕着它上）：和树干一样用 RenderTexture，
  // 史莱姆走到树后层时在它附近擦一个透视洞
  private spindleRT: Phaser.GameObjects.RenderTexture | null = null
  private spindleDrawn = { x: -99999, y: -99999, layer: '' as string }
  // 玉京台那种「画在玩家前面的栏杆」：整片栏杆画在一张 RenderTexture 上，
  // 玩家走到栏杆后面时在身上擦一个透视洞（和树桩同一套做法），
  // 于是史莱姆不会被栏杆挡死
  private revealRailRT: Phaser.GameObjects.RenderTexture | null = null
  private revealRailBox = { left: 0, top: 0, width: 0, height: 0 }
  private revealRailDrawn = { x: -99999, y: -99999 }
  // 玉京台券门"门上方那块墙"：盖在玩家前面那一层，每帧在史莱姆身上擦一个透视洞
  private wallRT: Phaser.GameObjects.RenderTexture | null = null
  private wallBox = { left: 0, top: 0, width: 0, height: 0 }
  private wallDrawn = { x: -99999, y: -99999 }
  // 「史莱姆这一层前面」那些**背面朝向**的摊位 / 房子（港口打包 front 里 depth 13 的那几个）：
  // 做成 RenderTexture，每帧在史莱姆身上和还没捡的原石身上擦一个透视洞，
  // 不然人一走到它们后面就被整个盖住、原石也看不见了
  private harborFrontRTs: {
    rt: Phaser.GameObjects.RenderTexture
    key: string
    left: number
    top: number
    width: number
    height: number
    scale: number
    drawn: string
  }[] = []
  // 玉京台那种折返楼梯：踩上去翻层的半层小平台（`PlatformDef.layerFlip`），
  // 以及"上一次站在哪一跑楼梯上"—— 靠它区分上楼还是下楼
  private flipPads: { left: number; right: number; top: number }[] = []
  private lastFlightLayer: 'front' | 'back' = 'front'
  private onFlipPad = false
  // 正在"穿过去"的那一跑下跑（-1 = 没有）。沿着它下来落地后先把它的碰撞关掉，
  // 等身体整个穿过它再打开（见 updateStairLayers 里那段注释）
  private passUnderFlight = -1
  // "这一趟穿过去"的效果拿到手了没 —— 用户定的获得条件：踏上"比身高高 2 像素"
  // 的那一级楼梯（走上这一跑，脚底高出下端 height + 2 就算拿到）；一趟用一次，用完清掉
  private passUnderGranted = false
  private cameraLiftNow = -1
  private gateFired: boolean[] = []
  // 只在「树前」或「树后」某一层存在的楼板补片（第七关整层楼板中间那块"活板"）。
  // 贴图搬在 RenderTexture 上，跟树干同一套做法：楼板**一直画着**，史莱姆在另一层时
  // 在它附近擦一个椭圆"透视"洞 —— 于是能看见自己从楼板中间穿过去，而不是楼板整块消失。
  // 碰撞由 collider 的过滤函数按 layer 决定（不属于玩家那一层就不挡人）
  private layerPieces: {
    layer: 'front' | 'back'
    rt: Phaser.GameObjects.RenderTexture
    left: number
    top: number
    width: number
    height: number
    plank: boolean
    tint: number
    drawn: { x: number; y: number; layer: string }
  }[] = []
  // 木制水利电梯（第七关）：井道里一台轿厢，在每层楼板处停靠。
  // 数据是 LevelDef.lift（可选）：{ x: 井道中心, width: 井道宽, stops: [每层楼板顶面 y, 从高到低] }
  private liftCar: Phaser.Physics.Arcade.Sprite | null = null
  private liftCarArt: Phaser.GameObjects.Image | null = null
  private liftRope: Phaser.GameObjects.Rectangle | null = null
  private liftWheel: Phaser.GameObjects.Image | null = null
  private liftIndex = 0
  private liftMoving = false
  private liftState = { y: 0 }
  // 上车的那一趟就一路"栓"在轿厢上：中途不再看距离，免得下行太快把人留在空中
  private liftRider = false
  // 楼梯护栏单独一张 Graphics，depth 按「这一跑属于哪一层」定：
  // 前台层的护栏给 12（压在史莱姆 10/11 上面 —— 栏杆在台阶外侧，人从栏杆后面走过），
  // 后台层的护栏给 1.4（在树干 2 之前，走到树后面时仍然被树挡住）
  private stairRails: (Phaser.GameObjects.Graphics | undefined)[] = []
  private pillars!: Phaser.Physics.Arcade.StaticGroup
  private orbs!: Phaser.Physics.Arcade.StaticGroup

  private gems!: Phaser.Physics.Arcade.StaticGroup
  private gemIcons: Phaser.GameObjects.Image[] = []
  private collectedIndices: number[] = []

  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys
  private prevKey!: Phaser.Input.Keyboard.Key
  private nextKey!: Phaser.Input.Keyboard.Key
  private staminaBar!: Phaser.GameObjects.Rectangle
  private elementIcons: Phaser.GameObjects.Image[] = []
  private elementMarks: Phaser.GameObjects.Rectangle[] = []
  private elementHint!: Phaser.GameObjects.Text
  private keyLegend: Phaser.GameObjects.Text | null = null
  private perfText: Phaser.GameObjects.Text | null = null
  private perfTimer = 0
  private armorBarBack!: Phaser.GameObjects.Rectangle
  private armorBar!: Phaser.GameObjects.Rectangle

  private slimeArt!: Phaser.GameObjects.Image
  // 脚下的接地影（跟着人走，落在最近一次踩到的那条线上）
  private slimeShadow!: Phaser.GameObjects.Image
  private lastGroundY = 0
  private eyes: Phaser.GameObjects.Image[] = []
  private blinkTimer = 0
  private blinkScale = 1
  private landSquash = 0
  private stepTimer = 0
  private wasOnGround = false
  private stepRise = 0
  private stepTop = 0
  // 拱形土坡（走线是弧的那种地面）：这一帧脚底是不是被弧面接管着。
  // 和 stepRise 一个用法 —— onGround 认它，跳跃、体力回复、落地音才都正常
  private slopeGrip = false
  private slopeGravityOff = false
  // 这一帧骑的是第几条坡（−1 ＝ 没骑）。**判断"要不要开始骑"和"要不要继续骑"是两套标准**：
  // 开始骑只认"人站在弧面上、或者从上面落下来"；已经在骑的那条只要还在脚下附近就继续骑。
  // 不分开的话，顺着一条坡下来、另一条弧正好从头顶横过时，人会被那条弧**从底下捞起来**，
  // 一路倒着爬回去（2026/10/16 实测：下坡变成上坡，见「踩过的坑」）
  private slopeIndex = -1
  // 上一帧的脚底 y：判断"这一帧是不是从弧面上方跨到了下方"要用它 ——
  // 掉得快的时候一帧就跨过整条吸附带，只看当前这一帧会当成"人在弧底下"而漏接（见「踩过的坑」）
  private slopePrevFeet = 0
  // 柱脚常驻的那一圈泥（跟着柱子一起消失）
  private pillarFoot: Phaser.GameObjects.Graphics | null = null
  // ── 琥珀 + 岩共鸣（2026/10/17）────────────────────────────────────
  // 琥珀摆在转角平台上，里头冻着原石 / 野猪 / 人；**只有岩柱的岩共鸣震得开**。
  // 岩柱站着的时候，脚下每隔一会儿就往外扩一圈金色光圈，光圈扫到谁就算"共鸣到"谁。
  private ambers: { sprite: Phaser.GameObjects.Image; def: AmberDef; broken: boolean }[] = []
  private resonanceGfx: Phaser.GameObjects.Graphics | null = null
  private resonanceTimer = 0
  private resonanceRings: { x: number; y: number; r: number }[] = []
  private stairCamTime = 0

  private element: ElementKey = 'none'
  private jumpPower = -260
  private stamina = STAMINA_MAX

  private bgFar: Phaser.GameObjects.TileSprite | null = null
  private bgMid: Phaser.GameObjects.TileSprite | null = null
  private bgNear: Phaser.GameObjects.TileSprite | null = null
  // 很高的户外关卡（第七关）：三层背景不用平铺，改成"整幅图 + 相对地面的位移"——
  // 平铺贴图一偏移就会绕回开头（远山下面又冒出天空），整幅图不会
  private bgTall: { image: Phaser.GameObjects.Image; k: number }[] = []
  private groundScrollY = 0
  // 客栈家具（柜台/柜子/灶台/柴堆/吊锅/挂灯/酒桶）：跟着"树前/树后"换深度 ——
  // 树前层时摆在史莱姆后面（2.8 左右），树后层时整组沉到史莱姆（1.2）后面
  private innDecor: { image: Phaser.GameObjects.Image; front: number; back: number }[] = []

  // 顶楼那位仙人的"气息"：一圈画面上的风环 + 一道看不见的挡人墙 + 提醒过没有。
  // 杏仁豆腐那条线做完之后整组散掉（xiaoCalm()）
  private xiaoAura: Phaser.GameObjects.Graphics | null = null
  private xiaoWall: Phaser.Physics.Arcade.Sprite | null = null
  private xiaoSprite: Phaser.GameObjects.Image | null = null
  private xiaoAuraSeen = false
  // 支线进度（四个标记，比单一个 stage 好读）：
  //   stairsDone —— 两处楼梯都修好了（老板娘"太感谢了"那段要它）
  //   metXiao    —— 上顶楼撞到过那股气息（没修楼梯也能撞上，两条路都能推进这条线）
  //   dishMade   —— 杏仁豆腐做好了（端着它才能靠近仙人）
  //   xiaoGone   —— 仙人已经走了（这条线走完，宝箱也出来了）
  // 另外 ingredientHintSeen：老板娘已经把"三样食材在哪"说完过一遍了，之后只重复最后一句
  private stairsDone = false
  private metXiao = false
  private dishMade = false
  private xiaoGone = false
  private ingredientHintSeen = false
  // 这一局是不是"支线已经做完过"的档（存档里记着）：两处楼梯直接算修好、仙人已经走了
  private innRestored = false
  // 第五关同理：存档里记着"小龙已经救出来了"
  private towerRestored = false
  // 这一局跑的是不是测试沙盒（?dev=1）：是的话原石和通关记录都不进存档
  private devLevel = false
  // 隐藏的仙家试炼秘境：不是 LEVELS 里的关卡，只从第九关山顶的仙人进入
  private startData: GameSceneStartData = {}
  private domainMode = false
  private domainHearts = 3
  private domainHeartText: Phaser.GameObjects.Text | null = null
  private domainLeaving = false
  private craneNpc: Phaser.GameObjects.Image | null = null
  // 第一重试炼：浮石 / 安全台 / 仙家符箓
  private trialStoneGroup!: Phaser.Physics.Arcade.StaticGroup
  private trialStones: {
    sprite: Phaser.Physics.Arcade.Sprite
    section: number
    triggered: boolean
    hideAt?: number
  }[] = []
  private trialCheckpoints: { x: number; y: number; index: number }[] = []
  private trialSection = 0
  private trialArmed = false
  private trialResetLock = 0
  private trialArtifact: Phaser.GameObjects.Image | null = null
  private trialOneDone = false
  // 测试关卡现在待在哪一间：-1 = 大厅，0 起 = 大厅里那排传送门的下标。
  // 初值来自地址上的 ?room=N（见 DEV_START_ROOM），用来直接打开某一间
  private devRoom = DEV_START_ROOM
  // 从展厅回大厅时站的位置（进门前那扇门的右边一点，不站正门上）
  private devReturnX = 0
  // 这一局里能用的传送门：大厅是七扇，展厅里只有一扇「回大厅」
  private devPortals: DevPortalRef[] = []
  // 展厅里「能看演出」的神像：站面前按 F，只放动画、不授予元素。
  // groundY 用来算「人站得够不够近」，figure 是造像本体 —— 元素力从它身上冒出来
  private devStatues: {
    x: number
    groundY: number
    element: ElementKey
    figure: Phaser.GameObjects.Image
  }[] = []
  // 已经看过开场的房间（大厅记 -1），免得来回换房间每次都被黑屏文字挡一下
  private devIntroSeen: number[] = []
  private innkeeper: Phaser.GameObjects.Image | null = null

  // 对话板（老板娘 / 仙人说话用）：一次显示一句，"按 F / 点屏幕"翻到下一句
  private dialogueShowing = false
  private dialogueLayer: Phaser.GameObjects.Container | null = null
  private dialogueText: Phaser.GameObjects.Text | null = null
  private dialogueName: Phaser.GameObjects.Text | null = null
  private dialogueTip: Phaser.GameObjects.Text | null = null
  private dialogueSpeaker = ''
  // 对话框的"页"：一句太长会按字数折行、再切成几页，玩家按 F 一页页翻
  private dialoguePages: { text: string; mine: boolean }[] = []
  private dialogueIndex = 0
  private dialogueDone: (() => void) | null = null
  // 支线的三样原料（第七关专用，位置是照着客栈地图定的，所以直接写在这儿，不动 levels.ts）
  private ingredients: {
    sprite: Phaser.GameObjects.Image
    label: string
    taken: boolean
  }[] = []
  // 做好的那盘杏仁豆腐：端在史莱姆头上，一直跟着他走
  private carriedDish: Phaser.GameObjects.Image | null = null
  private bgFarY = 0.2
  private bgMidY = 0.45
  private bgNearY = 0.75
  private bgSpin = 0
  private windmillBlades: Phaser.GameObjects.Image | null = null

  private blessings!: Phaser.Physics.Arcade.StaticGroup
  private staminaGlowOuter!: Phaser.GameObjects.Rectangle
  private staminaGlow!: Phaser.GameObjects.Rectangle
  private blessed = false

  private finished = false

  private hazards!: Phaser.Physics.Arcade.StaticGroup
  private dying = false
  private armored = false
  private armoredTimer = 0
  private armorCooldown = 0
  private invulnTimer = 0
  private rockPillar: Phaser.Physics.Arcade.Sprite | null = null
  private pillarGhost: Phaser.GameObjects.Image | null = null
  private pillarMark: Phaser.GameObjects.Rectangle | null = null
  private pillarCharging = false
  private pillarPressed = false
  private pillarHold = 0

  // 雷闪：电荷 + 瞄准状态
  private blinkCharges = BLINK_CHARGE_MAX
  private blinkChargeTimer = 0
  private blinkLockout = 0
  private blinkHeld = false
  private blinkHold = 0
  private blinkAiming = false
  private blinkDir = { x: 1, y: 0 }
  private blinkGhost: Phaser.GameObjects.Image | null = null
  private blinkGfx: Phaser.GameObjects.Graphics | null = null
  // 雷闪的电能格：左上角一块小电池，三格，正在充的那格从左边慢慢涨
  private chargeBattery!: Phaser.GameObjects.Image
  private chargeCells: Phaser.GameObjects.Image[] = []
  // 手机端雷闪键下面那三个充能点（沿按键下缘的弧线摆）
  private blinkDots: Phaser.GameObjects.Image[] = []

  // 雷鸣的冷却
  private thunderCooldown = 0
  // 手机上按着雷闪键的那根手指（-1 = 没有）
  private blinkPointerId = -1
  // 雷史莱姆头顶那两根雷晶（和岩脊一个位置、一个挂法）
  // 雷史莱姆头顶那根雷极（和岩脊一个挂法：单独一张贴图，能长得比身体高）
  private thunderRod!: Phaser.GameObjects.Image
  // 身上的电：雷鸣好了是闪电、冷却中是静电；雷极尖端时不时闪一下极性符号
  private thunderFx!: Phaser.GameObjects.Graphics
  private thunderFxTimer = 0
  private polarityMark!: Phaser.GameObjects.Image
  private polarityTimer = 0.8
  // 关卡里的魔物
  private monsterList: MonsterRef[] = []
  // 关卡里的千岩军（潜行用）+ 所有人的视野扇形（画在同一张 Graphics 上）
  private guardList: GuardRef[] = []
  private guardVisionGfx!: Phaser.GameObjects.Graphics
  // 疑惑度的圆圈进度条（画在头顶问号外面那一圈）
  private guardAlertGfx!: Phaser.GameObjects.Graphics
  private armorKey!: Phaser.Input.Keyboard.Key
  private rockKey!: Phaser.Input.Keyboard.Key

  private introShowing = false
  private introLayer: Phaser.GameObjects.Container | null = null

  private chase!: Phaser.Physics.Arcade.Image
  private chased = false
  // 这一次追击的参数（第三关用默认值，第八关可以按关卡给）
  private chaseDef: { triggerX: number; stopX: number; speed: number; cause: string } | null = null
  // 追击小队：真的会追人的千岩军（有物理、会跳、会找路）
  private chaserGroup!: Phaser.Physics.Arcade.Group
  private chaserList: ChaserRef[] = []
  private squadDef: { at: number; count: number; speed: number; gap: number; stop: number; cause: string } | null =
    null

  private interactKey!: Phaser.Input.Keyboard.Key
  private goalSprite!: Phaser.Physics.Arcade.Sprite
  private statueSprite: Phaser.GameObjects.Image | null = null
  private statueUsed = false
  // 请仙典仪（第八关）：上楼走到广场前面按 F 观的这一场戏，只演一次。
  // 演完帝君遇刺、千岩军封锁玉京台，右半边那段"躲千岩军"才算真正开始
  private riteDone = false
  private ritePlaying = false
  // 存档里记过"这场戏看过了"：祭坛直接就是撞毁的、龙还趴在上面
  private riteSeen = false
  // 存档里记过"追击演过一场"：不再放镜头演出，但千岩军照旧会追上来
  private terraceChased = false
  // 广场上的人（围观的 + 两个仆从 + 凝光）：戏里要在他们头顶冒感叹号
  private plazaCrowd: Phaser.GameObjects.Image[] = []
  private plazaNing: Phaser.GameObjects.Image | null = null
  // 祭坛那两件（完好版） + 撞毁之后摆上去的龙身
  private plazaAltar: Phaser.GameObjects.Image | null = null
  private plazaOffering: Phaser.GameObjects.Image | null = null
  private plazaDragonWreck: Phaser.GameObjects.Image | null = null
  // 观礼之前把券门整堵封上的那块实体（演完就拆，只剩门楣挡人）
  private terraceSeal: Phaser.Physics.Arcade.Sprite | null = null
  // 配套的画面：这道墙在台体上一直画到地面的那一截（演完一起拆）
  private terraceSealArt: Phaser.GameObjects.Graphics | null = null
  // 那道墙的世界 x（封着的时候走到跟前给一句提示）
  private plazaWallX: number | null = null
  private sealHintTimer = 0
  // 砸烂祭坛要用的几个数（祭坛在屏幕上的位置 / 大小 / 层数）
  private plazaBreak: { x: number; y: number; scale: number; depth: number } | null = null
  // 戏里临时加的东西：风旋、云、头顶那串感叹号
  private riteVortex: Phaser.GameObjects.Image | null = null
  private riteClouds: Phaser.GameObjects.Image[] = []
  private riteMarks: Phaser.GameObjects.Image[] = []
  private lockedElement: ElementKey | null = null
  // 神像演出期间把操作全锁住：移动、跳跃、技能、交互
  private inputLocked = false

  // 触屏按键的状态（和键盘是两套，最后在 update 里合并；Just 结尾的是本帧刚按下/刚抬起）
  private touchMode = false
  private touchLeft = false
  private touchRight = false
  private touchJump = false
  private touchJumpJust = false
  private touchArmorJust = false
  private touchArmorUp = false
  private touchPillarJust = false
  private touchPillarUp = false
  // 触屏按键的引用：跟着「有没有岩元素」显示/隐藏，并随岩化冷却做回充
  private rockAvailable = false
  private touchButtons: Array<{
    image: Phaser.GameObjects.Image
    x: number
    y: number
    r: number
    base: number
  }> = []
  private touchPillarButton: Phaser.GameObjects.Image | null = null
  private touchArmorDim: Phaser.GameObjects.Image | null = null
  private touchArmorFill: Phaser.GameObjects.Image | null = null
  private stickBase: Phaser.GameObjects.Image | null = null
  private stickKnob: Phaser.GameObjects.Image | null = null
  private stickPointer = -1
  private stickOrigin = { x: 0, y: 0 }
  // 摇杆当前的"基准"透明度（待机 / 按住各一套），「靠近变淡」在它上面再打折扣
  private stickAlpha = { base: STICK_ALPHA.base, knob: STICK_ALPHA.knob }
  private moveImages: Phaser.GameObjects.Image[] = []
  private stickHandlers: Array<{ event: string; fn: (pointer: Phaser.Input.Pointer) => void }> = []
  private promptBox!: Phaser.GameObjects.Rectangle
  private promptText!: Phaser.GameObjects.Text
  private promptAction: (() => void) | null = null

  private monuments!: Phaser.Physics.Arcade.StaticGroup
  private monumentList: MonumentRef[] = []

  private gates!: Phaser.Physics.Arcade.StaticGroup
  private doorList: DoorRef[] = []
  private plates!: Phaser.Physics.Arcade.StaticGroup
  private plateList: PlateRef[] = []
  // 飘花：踩住过一次花树压力板以后就一直下花瓣（松手也不停）。
  // petals 是正在飘的，petalIdle 是回收下来重复利用的贴图（不在更新里 new 对象）
  private petalsOn = false
  private petalTimer = 0
  // 隐藏成就「邀诸位共赏」：先踩过花树那块压力板（petalsOn），再到金桂树底下站够 5 秒
  private blossomWatch = 0
  private blossomGot = false
  private petals: {
    image: Phaser.GameObjects.Image
    vx: number
    vy: number
    phase: number
    sway: number
    speed: number
    spin: number
    life: number
    groundY: number
  }[] = []
  private petalIdle: Phaser.GameObjects.Image[] = []
  private spikes!: Phaser.Physics.Arcade.Group
  private launchers: LauncherRef[] = []
  private noteList: NoteRef[] = []
  private pickupList: (PickupDef & { parts: Phaser.GameObjects.Image[]; taken: boolean })[] = []
  private speedItems: { sprite: Phaser.GameObjects.Image; def: SpeedItemDef; taken: boolean }[] = []
  private speedBoostTimer = 0
  private speedBoostMultiplier = 1
  private speedBoostText: Phaser.GameObjects.Text | null = null
  private repairList: { mark: Phaser.GameObjects.Image; def: RepairDef; done: boolean }[] = []
  private stairGfx: Phaser.GameObjects.Graphics[] = []
  private repaired: string[] = []
  private woods = 0

  private paperShowing = false
  private paperLayer: Phaser.GameObjects.Container | null = null
  
  private cageSprite: Phaser.GameObjects.Image | null = null
  private eggSprite: Phaser.GameObjects.Image | null = null
  private dragonling: Phaser.GameObjects.Image | null = null
  private cageScene = false
  private cageOpened = false
  private goalReady = true

  private wingLeft!: Phaser.GameObjects.Image
  private rockCrown!: Phaser.GameObjects.Image
  private armorPlate!: Phaser.GameObjects.Image
  private wingRight!: Phaser.GameObjects.Image
  private wingOffset = 0

  private windTrails: Phaser.GameObjects.Image[] = []
  private trailFade = 0

  constructor() {
    super('game')
  }

  init(data: GameSceneStartData = {}) {
    this.startData = data ?? {}
  }

  create() {
    // 测试沙盒（src/data/devLevel.ts）：只在 DEV_MODE 开着 + 地址带 ?dev=1 时进得来。
    // **这里绝对不要动 progress.levelIndex** —— 死亡界面 DeadScene 会拿它去查
    // `LEVELS[progress.levelIndex].name`，之前图省事塞了个越界下标（LEVELS.length），
    // 结果死亡界面在 create() 里就抛错了、三个按钮根本没建出来（表现就是"死了没法复活"）。
    // 沙盒自己的原石 / 通关记录改用下面这个 devLevel 开关挡住，不碰存档
    this.domainMode = this.startData.domain === true
    this.domainHearts = 3
    this.domainHeartText = null
    this.domainLeaving = false
    this.craneNpc = null
    this.trialStones = []
    this.trialCheckpoints = []
    this.trialSection = 0
    this.trialArmed = false
    this.trialResetLock = 0
    this.trialArtifact = null
    this.trialOneDone = false
    this.devLevel = !this.domainMode && DEV_LEVEL_MODE
    // 测试关卡是「大厅 + 展厅」：devRoom < 0 在大厅，其余去对应那间展厅。
    // 换房间走 scene.restart()，所以 devRoom 是在上一帧就定好的
    this.level = this.domainMode
      ? DOMAIN_LEVEL
      : this.devLevel
        ? this.devRoom >= 0
          ? (DEV_ROOMS[this.devRoom]?.level ?? DEV_HUB)
          : DEV_HUB
        : LEVELS[progress.levelIndex]

    // 出生点：正常用关卡自己写的；测试关卡从展厅回大厅时站回刚才那扇门的右边一点
    // （不站门上，起身就不会又提示按 F）；地址上带 ?at=1700 时直接出生在那一列
    let spawnPoint = this.level.spawn

    if (this.startData.checkpoint) {
      spawnPoint = { x: this.startData.checkpoint.x, y: this.startData.checkpoint.y }
    } else if (this.devLevel && DEV_SPAWN_X !== null) {
      spawnPoint = { x: DEV_SPAWN_X, y: 820 }
    } else if (!this.devLevel && DEV_SPAWN_X !== null) {
      // 正式关卡也认 ?at=：调试时想直接站到某一列就用它（出生高度沿用关卡自己的）
      spawnPoint = { x: DEV_SPAWN_X, y: this.level.spawn.y }
    } else if (this.devLevel && this.devRoom < 0 && this.devReturnX > 0) {
      spawnPoint = { x: this.devReturnX + 48, y: 820 }
    }

    this.touchMode = touchMode()
    this.finished = false
    this.stamina = STAMINA_MAX
    this.blinkScale = 1
    this.blinkTimer = 1200
    this.landSquash = 0
    this.stepTimer = 0
    this.wasOnGround = false
    this.stepRise = 0
    this.stepTop = 0
    this.stairCamTime = 0
    this.playerLayer = 'front'
    this.trunkRT = null
    this.trunkDrawn = { x: -99999, y: -99999, layer: '' }
    this.rootRT = null
    this.rootDrawn = { x: -99999, y: -99999, layer: '' }
    this.spindleRT = null
    this.spindleDrawn = { x: -99999, y: -99999, layer: '' }
    this.gateFired = []
    this.innDecor = []
    this.xiaoAura = null
    this.xiaoWall = null
    this.xiaoSprite = null
    this.xiaoAuraSeen = false
    this.stairsDone = false
    this.metXiao = false
    this.dishMade = false
    this.xiaoGone = false
    this.ingredientHintSeen = false
    this.innkeeper = null
    this.dialogueShowing = false
    this.dialogueLayer = null
    this.dialogueText = null
    this.dialogueName = null
    this.dialogueSpeaker = ''
    this.dialogueTip = null
    this.dialoguePages = []
    this.dialogueIndex = 0
    this.dialogueDone = null
    this.ingredients = []
    this.carriedDish = null
    this.petalsOn = false
    this.petalTimer = 0
    this.blossomWatch = 0
    this.blossomGot = false
    this.petals = []
    this.petalIdle = []
    this.layerPieces = []
    // 存档只记「永久成果」（元素 / 原石 / 成就 / 关卡推进）。
    // 木材和修好的楼梯属于关卡内的机关，每进一次关卡都从头来（见开发笔记「开发约定」）。
    // **唯一的例外是第七关**：那条杏仁豆腐支线做完之后，这一关的机关也跟着记进存档
    this.innRestored = !!this.level.trunk && hasSeenHint(INN_RESTORED_FLAG)
    this.towerRestored = !!this.level.cage && hasSeenHint(TOWER_RESTORED_FLAG)
    this.woods = 0
    this.repaired = []

    // 支线做过的档：两处楼梯直接算修好（断口、断茬、木材堆都不会再出现），仙人已经走了
    if (this.innRestored) {
      this.stairsDone = true
      this.xiaoGone = true
      ;(this.level.repairs ?? []).forEach((repair) => {
        repair.steps.forEach((step) => {
          this.repaired.push(`${repair.stair}:${step}`)
        })
      })
    }
    this.collectedIndices = []
    this.blessed = false
    this.dying = false

    this.trailFade = 0
    this.introShowing = false
    this.introLayer = null
    this.paperShowing = false
    this.paperLayer = null

    this.cageSprite = null
    this.eggSprite = null
    this.dragonling = null
    this.cageScene = false
    this.cageOpened = false

    // 场景实例是复用的：上一局留下的「锁操作」和暂停的物理世界必须清干净，
    // 不然开完箱（win 里会锁上）之后再进任何一关，人都会原地动不了
    this.inputLocked = false
    this.pillarPressed = false
    this.pillarCharging = false
    this.blinkHeld = false
    this.blinkAiming = false
    this.blinkLockout = 0
    this.blinkCharges = BLINK_CHARGE_MAX
    this.blinkChargeTimer = 0
    this.thunderCooldown = 0

    // 触屏按键的状态也一并复位（场景实例复用）
    this.clearTouchInput()

    // 暂停期间手指抬起是收不到 pointerup 的，恢复时再清一遍，
    // 否则回来之后角色会一直往一个方向跑、技能也会被那一下误触发
    this.events.off(Phaser.Scenes.Events.RESUME)
    this.events.on(Phaser.Scenes.Events.RESUME, () => {
      this.clearTouchInput()
      // 设置菜单里可能刚切了「移动方式」，回到关卡立刻按新模式重建控件
      this.applyMoveMode()
    })

    this.pillarGhost = null
    this.pillarMark = null
    this.blinkGhost = null
    this.blinkGfx = null
    this.physics.world.resume()

    this.cameras.main.setZoom(1)

    this.chased = false
    this.chaseDef = null
    this.chaserList = []
    this.squadDef = null
    // 第八关：存档里记过"请仙典仪看过了"，这一关就从撞毁的祭坛开始（不再演那场戏）
    this.riteSeen = !!this.level.plaza && hasSeenHint(RITE_SEEN_FLAG)
    this.terraceChased = !!this.level.plaza && hasSeenHint(TERRACE_CHASE_FLAG)
    this.riteDone = this.riteSeen
    this.ritePlaying = false
    this.plazaCrowd = []
    this.plazaNing = null
    this.plazaAltar = null
    this.plazaOffering = null
    this.plazaDragonWreck = null
    this.terraceSeal = null
    this.terraceSealArt = null
    this.plazaWallX = null
    this.sealHintTimer = 0
    this.plazaBreak = null
    this.riteVortex = null
    this.riteClouds = []
    this.riteMarks = []
    // 这两张 RenderTexture 是关卡里现造的，而**场景实例是复用的**：上一局的那张已经跟着
    // 场景一起销毁了，这里必须把引用清成 null。不清的话，下一关每帧的 updateWall /
    // updateRevealRails 还会拿着那张**已经销毁的**贴图去 render，Phaser 内部会在一个
    // matrix 为 null 的相机上赋值，直接抛 "Cannot set properties of null"（2026/10/14 踩到：
    // 第八关里清档 → 开新游戏 → 点一下屏幕就炸）
    this.wallRT = null
    this.wallDrawn = { x: -99999, y: -99999 }
    this.revealRailRT = null
    this.revealRailDrawn = { x: -99999, y: -99999 }
    // 同理：这些 RenderTexture 是建关卡时现造的，场景实例复用，引用必须清干净
    this.harborFrontRTs = []
    this.platforms = this.physics.add.staticGroup()
    this.blockers = this.physics.add.staticGroup()
    this.pillars = this.physics.add.staticGroup()
    this.orbs = this.physics.add.staticGroup()

    const theme = this.level.bg ?? 'field'
    // 兜底：主题名要是还没登记进 THEME_COLORS（比如新关卡的主题先在测试关里试），
    // 就拿 field 的配色顶上，别整个崩掉
    const palette = THEME_COLORS[theme] ?? THEME_COLORS.field

    // 纵向视差：户外的天空/远山/湖面/芦苇是「远景」，纵向一律不跟着相机走，
    // 所以跳起来的时候整片背景不会上下滑动（横向的视差保留）。
    // 塔内的墙反过来，要跟世界 1:1 地往上走，每层的窗户才对得上楼层。
    // 很高的户外关卡（第七关爬树，2200 高）用「分层视差」：2D 游戏的通行做法 ——
    // 天空几乎不动（0.06）、远山/湖面很慢（0.14）、岸边的芦苇最快（0.6，爬高时最先退出画面）。
    // 这样爬到高层仍然看得见远处的山和湖，而脚边的芦苇早就沉到画面外了
    const worldLocked = theme === 'tower'
    // 只有"很高的**户外**关卡"才用整幅图那套（第七关爬树，2200 高）。
    // 塔内（tower）是室内：墙面必须跟世界 1:1 地往上走 —— 第五关高 1600，也过了 800 这条线，
    // 但它得照旧走下面的"平铺 + 分层视差"，所以这里要把 worldLocked 排除掉
    const tallOutdoor = this.level.height > 800 && !worldLocked

    this.bgFarY = worldLocked ? 1 : tallOutdoor ? 0.06 : 0
    this.bgMidY = worldLocked ? 1 : tallOutdoor ? 0.14 : 0
    this.bgNearY = worldLocked ? 1 : tallOutdoor ? 0.6 : 0

    // 很高的户外关卡：地面那一屏就是设计好的构图，往上爬时三层各自按系数往下沉。
    // 用整幅 Image（不平铺），所以不会出现"远山下面又是天空"的绕回
    if (tallOutdoor) {
      this.groundScrollY = this.level.height - 270
      // 高山是白天，露出来的底色也用天空蓝；其他高关卡仍用黄昏底色
      const tallBackdrop = theme === 'mountain' ? 0xa9d2e3 : 0xf3b072

      this.add
        .rectangle(0, 0, 480, 270, tallBackdrop)
        .setOrigin(0, 0)
        .setScrollFactor(0)
        .setDepth(-40)

      this.bgTall = [
        { key: 'bg-' + theme + '-far', k: 0.03, depth: -30 },
        { key: 'bg-' + theme + '-mid', k: 0.05, depth: -20 },
        { key: 'bg-' + theme + '-near', k: 0.5, depth: -10 },
      ]
        .filter((def) => this.textures.exists(def.key))
        .map((def) => ({
          image: this.add
            .image(0, 0, def.key)
            .setOrigin(0, 0)
            .setScrollFactor(0)
            .setDepth(def.depth),
          k: def.k,
        }))
    }
    // 「环树」系数：这关往上爬的时候，背景横向也一起流，做出绕着树转的感觉
    this.bgSpin = this.level.bgSpin ?? 0

    // 港口的三层前景/中景（用户定的构图：镜头往外 —— 护栏 → 近处的水 → 岸边(关卡地面) →
    // 建筑物 → 高山 → 天空）：
    //   · 远处的城市直接用我前面设计的 harbor-house-a/b/c/d 摆出来（有视差，比地面慢）
    //   · 近处的水 = harbor-water 平铺，图层 11
    //   · 最前面的护栏 = harbor-railing 平铺，图层 12，高度 24（比史莱姆矮）
    if (theme === 'harbor') {
      // 港口"背景打包"：数据里写 harborBlocks: [{ at, kind }]（kind = dock / street / suburb），
      // 引擎按打包把这一段的装饰一段一段盖上去 —— 栅栏、水面只在 dock 那类里出现
      const harborBlocks = (
        this.level as LevelDef & {
          harborBlocks?: { at: number; kind: 'dock' | 'street' | 'suburb' | 'terrace'; variant?: number }[]
        }
      ).harborBlocks ?? []

      harborBlocks.forEach((block) => {
        // 第一版 / 第二版：数据里不写 variant 就当第一版
        const variants = HARBOR_BLOCKS[block.kind]
        const pack = variants?.[Math.max(0, (block.variant ?? 1) - 1)] ?? variants?.[0]

        if (!pack) {
          return
        }

        // 这一段的落脚线：取段中间那一列脚下最高的那块平台顶面，
        // 所以同一套打包在码头（1160）、石阶（1112 / 1064）、玉京台（1016）都能用
        const blockGround = this.harborGroundAt(block.at + HARBOR_BLOCK_WIDTH / 2)

        // 后景：在史莱姆后面
        pack.decor.forEach((piece) => {
          const ground = this.harborGroundAt(block.at + piece.dx)
          const jitter = piece.randomScale ? 1 + (Math.random() * 2 - 1) * piece.randomScale : 1

          this.add
            .image(
              block.at + piece.dx,
              ground + (piece.dy ?? 0) + harborBottomPad(this, piece.key),
              piece.key
            )
            .setOrigin(0.5, 1)
            .setScale((piece.scale ?? 1) * jitter)
            .setTint(piece.tint ?? 0xffffff)
            .setAlpha(piece.alpha ?? 1)
            .setDepth(piece.depth ?? -5)
        })

        // 前景：水面（只有码头有）
        if (pack.water) {
          this.add
            .tileSprite(block.at, blockGround + 12, HARBOR_BLOCK_WIDTH + 30, 60, 'harbor-water')
            .setOrigin(0, 0)
            .setAlpha(0.9)
            .setDepth(11)
        }

        pack.front.forEach((piece) => {
          const ground = this.harborGroundAt(block.at + piece.dx)
          const px = block.at + piece.dx
          const py = ground + (piece.dy ?? 0) + harborBottomPad(this, piece.key)
          const scale = piece.scale ?? 1

          // 背面朝向的摊位 / 房子：做成 RenderTexture，好在史莱姆和原石身上擦透视洞
          // （往 RT 里 draw Game Object 在这版 Phaser 上不可靠，所以用 stamp + 贴图键）
          if (piece.key === 'harbor-stall-back' || piece.key === 'harbor-house-back') {
            const source = this.textures.get(piece.key).getSourceImage() as unknown as HTMLCanvasElement
            const width = Math.round(source.width * scale)
            const height = Math.round(source.height * scale)
            const left = px - width / 2
            const top = py - height
            const rt = this.add
              .renderTexture(left, top, width, height)
              .setOrigin(0, 0)
              .setAlpha(piece.alpha ?? 1)
              .setDepth(13)

            this.harborFrontRTs.push({ rt, key: piece.key, left, top, width, height, scale, drawn: '' })
            return
          }

          this.add
            .image(px, py, piece.key)
            .setOrigin(0.5, 1)
            .setScale(scale)
            .setAlpha(piece.alpha ?? 1)
            .setDepth(13)
        })

        // 最前面的护栏：只有码头那一类有（上街以后就没有了），底边压到地面线下面 8 像素
        if (pack.railing) {
          this.add
            .tileSprite(block.at, blockGround - 8, HARBOR_BLOCK_WIDTH + 30, 24, 'harbor-railing')
            .setOrigin(0, 0)
            .setAlpha(0.95)
            .setDepth(12)
        }
      })
    }

    // 画在玩家前面的摆件（港口的牌楼前层、停在近景水里的船之类）：
    // 数据字段 `foreground` 还在用户手里，这里按同名可选字段读
    const foreground = (
      this.level as LevelDef & {
        foreground?: { x: number; y: number; key: string; scale?: number; alpha?: number }[]
      }
    ).foreground

    ;(foreground ?? []).forEach((item) => {
      const snap = item.key.startsWith('harbor-') ? harborBottomPad(this, item.key) : 0

      this.add
        .image(item.x, item.y + snap, item.key)
        .setOrigin(0.5, 1)
        .setScale(item.scale ?? 1)
        .setAlpha(item.alpha ?? 1)
        .setDepth(13)
    })

    // 矮的关卡照旧用平铺（有限的高度里不会绕回）；高的关卡上面已经用整幅图铺好了
    if (!tallOutdoor) {
      this.bgFar = this.add
        .tileSprite(0, 0, 480, 270, 'bg-' + theme + '-far')
        .setOrigin(0, 0)
        .setScrollFactor(0)
        .setDepth(-30)

      this.bgMid = this.add
        .tileSprite(0, 0, 480, 270, 'bg-' + theme + '-mid')
        .setOrigin(0, 0)
        .setScrollFactor(0)
        .setDepth(-20)

      // 近景层（岸边芦苇）：只有画了这张贴图的主题才建
      const nearKey = 'bg-' + theme + '-near'

      this.bgNear = this.textures.exists(nearKey)
        ? this.add
            .tileSprite(0, 0, 480, 270, nearKey)
            .setOrigin(0, 0)
            .setScrollFactor(0)
            .setDepth(-10)
        : null
    }

    // 第二关的风车：塔身固定在世界坐标里，扇叶用另一张贴图负责转
    this.windmillBlades = null

    if (this.level.windmill) {
      const windmill = this.level.windmill

      // 背景静物 / 地标统一放 -5：要压在近景那一层（`bg-<主题>-near`，堤岸 + 芦苇，depth -10）
      // 的前面，否则第六关的芦苇会盖在破屋上（2026/10/08 修）
      this.add.image(windmill.x, windmill.y - 32, 'windmill').setDepth(-5)

      this.windmillBlades = this.add
        .image(windmill.x, windmill.y - 54, 'windmill-blades')
        .setDepth(-4)
        .setScale(0.8)
    }

    // 望舒客栈：背景里的地标，贴着地面立着
    if (this.level.inn) {
      this.add.image(this.level.inn.x, this.level.inn.y - 80, 'inn').setDepth(-5)
    }

    // 玉京台左半边：请仙典仪的广场（圆形广场 + 祭坛 + 围观的 + 凝光和两个仆从）
    if (this.level.plaza) {
      this.buildTerracePlaza(this.level.plaza.x, this.level.plaza.y)
    }

    // 背景静物：破屋、矿山剪影，底边贴在地面线上，不参与碰撞
    ;(this.level.decor ?? []).forEach((def) => {
      // 港口那批贴图底下有透明留白，摆的时候要按实际画到的那一行贴地
      const snap = def.key.startsWith('harbor-') ? harborBottomPad(this, def.key) : 0

      this.add
        .image(def.x, def.y + snap, def.key)
        .setOrigin(0.5, 1)
        .setScale(def.scale ?? 1)
        .setFlipX(def.flip ?? false)
        .setDepth(def.depth ?? -5)

      // 热气（2026/10/17）：三缕茶汽各自往上飘、边飘边淡，循环
      if (def.key === 'tea-steam') {
        const wisp = this.children.list[this.children.list.length - 1] as Phaser.GameObjects.Image
        const baseY = def.y + snap

        this.tweens.add({
          targets: wisp,
          y: baseY - 16,
          alpha: { from: 0.75, to: 0 },
          duration: 2200 + (def.x % 7) * 160,
          delay: (def.x % 5) * 260,
          repeat: -1,
          ease: 'Sine.easeOut',
          onRepeat: () => {
            wisp.setY(baseY)
            wisp.setAlpha(0.75)
          },
        })
      }
    })

    this.buildMistBands()
    this.buildSummitLake()

    // 山顶的仙人：白鹤形态的留云借风真君，靠近后进入仙家试炼
    if (this.level.crane) {
      this.craneNpc = this.add
        .image(this.level.crane.x, this.level.crane.y, 'npc-cloud-retainer-crane')
        .setOrigin(0.5, 1)
        .setDepth(1.2)
    }

    // 古树主干：一条竖着平铺的树皮带，画在前后两层楼梯中间（默认 depth 2）
    if (this.level.trunk) {
      const trunk = this.level.trunk
      const width = trunk.width
      const height = trunk.height
      const left = trunk.x - width / 2
      const top = trunk.y - height / 2

      // 树干画在一张 RenderTexture 上：每帧重新平铺一遍树皮，再在玩家位置擦出一个圆。
      // 于是只有史莱姆周围和树重叠的那一块是透的，别处树还是实的。
      // 用 repeat() 平铺贴图、erase() 擦洞，全程不碰 Game Object
      // （往 RT 里 draw 一个 Game Object 在这版 Phaser 4 上不可靠：隐身的画不进去、
      //   可见的会把渲染搞黑）
      this.trunkRT = this.add
        .renderTexture(left, top, width, height)
        .setOrigin(0, 0)
        .setDepth(trunk.depth ?? 2)

      // 树根：接在主干底端，底边压在地面线（最低那块平台的顶面）上。
      // 和树干、短木一样画在 RenderTexture 上：史莱姆走到树后层时，在它上面也擦一个透视洞
      const groundTop = this.level.platforms.reduce(
        (lowest, item) => Math.max(lowest, item.y - item.height / 2),
        Number.NEGATIVE_INFINITY
      )

      const rootTexture = this.textures.get('tree-root').getSourceImage()

      this.rootRT = this.add
        .renderTexture(
          trunk.x - rootTexture.width / 2,
          groundTop - rootTexture.height,
          rootTexture.width,
          rootTexture.height
        )
        .setOrigin(0, 0)
        .setDepth(trunk.depth ?? 2)
        // 树根贴图顶端 220 宽，按主杆宽度等比缩放，接口才对得上
        .setScale(width / 220, 1)

      // 7 条斜枝：粗头插在树干里（贴图左端是粗头，左边那条翻过来用），
      // 四种形状混着摆，高低和角度都错开
      const branchDefs = [
        { key: 'tree-branch', side: 1, at: 0.12, tilt: -14, gap: 52 },
        { key: 'tree-branch-short', side: -1, at: 0.22, tilt: 18, gap: 32 },
        { key: 'tree-branch-fork', side: 1, at: 0.36, tilt: -20, gap: 48 },
        { key: 'tree-branch-twig', side: -1, at: 0.46, tilt: 12, gap: 40 },
        { key: 'tree-branch', side: -1, at: 0.57, tilt: 16, gap: 50 },
        { key: 'tree-branch-fork', side: 1, at: 0.7, tilt: -22, gap: 46 },
        { key: 'tree-branch-short', side: 1, at: 0.82, tilt: -10, gap: 32 },
      ]

      branchDefs.forEach((branch) => {
        this.add
          .image(
            trunk.x + branch.side * (width / 2 + branch.gap),
            top + height * branch.at,
            branch.key
          )
          .setFlipX(branch.side < 0)
          .setAngle(branch.tilt)
          .setDepth(trunk.depth ?? 2)
      })
    }

    // 楼内那根短木（第七关）：楼内几跑楼梯就是绕着它上楼的。
    // 和树干同一套：一张 RenderTexture，走到树后层时在史莱姆附近擦透视洞
    const spindle = this.spindleDef

    if (spindle) {
      this.spindleRT = this.add
        .renderTexture(
          spindle.x - spindle.width / 2,
          spindle.y - spindle.height / 2,
          spindle.width,
          spindle.height
        )
        .setOrigin(0, 0)
        .setDepth(spindle.depth ?? 2)
    }

    this.buildLift()

    // 望舒客栈 1110 层（进楼第一层）的前台：柜台摆在楼板左段上，旁边放个酒桶。
    // 纯画面、不挡人 —— 深度 2.8 让史莱姆从它前面走过
    if (theme === 'liyue' && this.level.trunk) {
      // 第 4 个参数：贴地家具（originY=1）还是吊起来的（originY=0，挂灯/吊锅）
      const put = (key: string, x: number, y: number, hanging = false) => {
        const image = this.add
          .image(x, y, key)
          .setOrigin(0.5, hanging ? 0 : 1)
          .setDepth(2.8)

        this.innDecor.push({ image, front: hanging ? 2.9 : 2.8, back: hanging ? 1.08 : 1.05 })

        return image
      }

      // 1110 层：前台（柜台 + 木格柜 + 酒桶 + 檐下挂灯）
      put('inn-front', 150, 1110)
      // 老板娘站到柜台"里面"：位置就在柜台中线（150），抬高到 1096 让上半身露在柜台
      // 上沿之上，深度压到柜台（2.8）下面 —— 于是柜台把她下半身挡住，看着就是站在柜台后头。
      // 注意别往右摆：200~280 是电梯井道，站在那儿会挡住下楼的路
      const keeper = this.add
        .image(150, 1096, 'npc-innkeeper')
        .setOrigin(0.5, 1)
        .setDepth(2.75)

      this.innDecor.push({ image: keeper, front: 2.75, back: 1.02 })
      this.innkeeper = keeper
      put('barrel', 60, 1110)
      put('inn-cabinet', 28, 1110)
      put('lantern', 150, 906, true)

      // 1110 层大堂右半边（井口 200~280、楼梯口 430~534 之外的 534~960）：
      // 招待客人吃饭的两张方桌 + 从 900 层楼板垂下来的挂灯
      put('inn-table', 600, 1110)
      put('inn-stool', 578, 1110)
      put('inn-stool', 622, 1110)
      put('inn-table', 790, 1110)
      put('inn-stool', 768, 1110)
      put('inn-stool', 812, 1110)
      put('lantern', 695, 906, true)
      put('lantern', 880, 906, true)

      // 900 层：厨房（砖灶 + 吊锅 + 柴堆）
      put('inn-stove', 64, 900)
      put('inn-pot', 64, 898, true)
      put('inn-wood', 150, 900)

      // 900 层厨房右半边：水缸 + 案板 + 一摞备用的柴
      put('barrel', 600, 900)
      put('inn-table', 700, 900)
      put('inn-wood', 800, 900)
      put('inn-stool', 660, 900)

      // 一楼地面：楼下乘凉吃饭的地方（两桌四凳）。
      // 放在楼梯左边 —— 第一跑楼梯的起点（x=362）贴在地面上，右边只能从 1/2 平台跳下去，
      // 摆到右边玩家平时走不过去
      // 0~90 和 300~350 这两段是空的（中间被水车 94~190、井道 200~280 占着）
      put('inn-table', 42, 2160)
      put('inn-stool', 20, 2160)
      put('inn-stool', 64, 2160)

      put('inn-table', 318, 2160)
      put('inn-stool', 296, 2160)
      put('inn-stool', 340, 2160)

      // 650 层：客房（床 + 木格柜当衣箱）
      put('inn-bed', 60, 650)
      put('inn-cabinet', 140, 650)

      // 650 层右边是第二间客房：另一张床 + 床头柜 + 一扇屏风挡在门口一侧
      put('inn-bed', 620, 650)
      put('inn-cabinet', 705, 650)
      put('inn-screen', 800, 650)
      put('inn-stool', 560, 650)

      // 一楼户外用餐区：两张桌子各撑一个棚子，棚下各挂一盏灯
      put('inn-awning', 50, 2160)
      put('inn-awning', 325, 2160)
      put('lantern', 50, 2122, true)
      put('lantern', 325, 2122, true)

      // 进楼门口旁边挂一盏门灯
      put('lantern', 404, 1030, true)

      // 支线的主角：仙人「魈」站在顶楼（400 那层）靠阳台的位置。
      // 顶楼楼板是 510~960，阳台 750~960，宝箱在 880 —— 他正好挡在玩家和阳台之间
      this.xiaoSprite = put('npc-xiao-slime', 650, 400)

      // 他身上的气息：一圈淡青的风环 + 里面一层压暗的底 + 几缕往上飘的风丝，慢速呼吸。
      // 深度 8.5：在客栈家具（2.8）之后、玩家（9/10）之前，所以是"笼罩"在人身上
      const auraX = 650
      const auraY = 396
      const aura = this.add.graphics().setDepth(8.5)

      this.xiaoAura = aura

      aura.fillStyle(0x0a2320, 0.22)
      aura.fillEllipse(auraX, auraY, 150, 34)
      aura.lineStyle(2, 0x8fe0c2, 0.5)
      aura.strokeEllipse(auraX, auraY, 136, 30)
      aura.lineStyle(1, 0x74d0b0, 0.35)
      aura.strokeEllipse(auraX, auraY, 108, 22)
      aura.lineStyle(1, 0x9fe8cc, 0.45)

      for (const [dx, len] of [[-46, 26], [-26, 38], [24, 34], [46, 22]]) {
        aura.beginPath()
        aura.moveTo(auraX + dx, auraY - 3)
        aura.lineTo(auraX + dx * 0.78, auraY - 3 - len)
        aura.strokePath()
      }

      // 挡人的那道看不见的墙：从楼板顶面往上 170（顶楼净高只有 70，跳也跳不过去），
      // 加在 platforms 组里，所以玩家自己撞上去就停住了，不用另外注册 collider
      const auraWall = this.platforms.create(578, 320, 'pixel') as Phaser.Physics.Arcade.Sprite

      auraWall.setDisplaySize(10, 170)
      auraWall.setVisible(false)
      auraWall.refreshBody()

      this.xiaoWall = auraWall

      // 三样原料（老板娘说的那三处）：糖在一楼外头那张桌上、杏仁在金桂树下、
      // 豆腐在 900 层厨房水缸（酒桶）旁边。depth 3.5：压在地面/楼板（0~3）和家具（2.8）之上，
      // 又在玩家（9/10）之下
      const items: { key: string; label: string; x: number; y: number }[] = [
        { key: 'item-sugar', label: '糖', x: 318, y: 2138 },
        { key: 'item-almond', label: '杏仁', x: 690, y: 2160 },
        { key: 'item-tofu', label: '豆腐', x: 630, y: 900 },
      ]

      items.forEach((item) => {
        this.ingredients.push({
          sprite: this.add
            .image(item.x, item.y, item.key)
            .setOrigin(0.5, 1)
            .setDepth(3.5),
          label: item.label,
          taken: false,
        })
      })

      // 支线已经做完过的档：仙人走了、气息散了、三样原料也用掉了 —— 顶楼只剩那个宝箱。
      // 这里放在最后"拆"掉，而不是把上面整段包进 if 里：改动小，也不会漏掉哪一项
      if (this.innRestored) {
        this.xiaoGone = true
        this.xiaoSprite?.destroy()
        this.xiaoSprite = null
        this.xiaoWall?.destroy()
        this.xiaoWall = null
        this.xiaoAura?.destroy()
        this.xiaoAura = null
        this.ingredients.forEach((item) => item.sprite.destroy())
        this.ingredients = []
      }

      // 顶楼阳台：一张小桌 + 一个蒲团（蒲团直接用圆凳代替）
      put('inn-table', 820, 400)
      put('inn-stool', 850, 400)

      // 一楼楼梯右侧（只能从 1/2 平台跳下来的那块）：一棵金桂（220×250，约一层楼高）。
      // 根盘摆在 x=770：树冠横跨 660~880，把右边那块空地盖掉大半个，
      // 左边缘离压力板（x=620）还有 40 像素，不会把板子压在树底下
      put('osmanthus-tree', 770, 2160)

      // 后墙：平铺木墙 + 格子窗。
      // 以前只铺了"走不到的那半截"，三层还是三个范围（458 / 534 / 534 起）——
      // 站到那些楼板上往背后看是空的，像在外面。现在三层都铺满整幅宽度，
      // 每层才是一个完整的房间；顶楼只铺内侧那 750 宽，阳台那半边留着露天。
      // 深度 0.5 —— 比树后层的楼梯（1）还低：所以"往左走的那几跑楼梯"是画在房间里的，
      // 墙面只是它背后的背景板；树后层史莱姆（1.1/1.2）、树干（2）、树前层楼梯（3）也都在它前面
      const wall = (x: number, y: number, w: number, h: number) =>
        this.add.tileSprite(x, y, w, h, 'inn-wall').setDepth(0.5)

      wall(480, 1005, 960, 210)     // 1110 层房间：y 900~1110
      wall(480, 775, 960, 250)      // 900 层房间：y 650~900
      wall(480, 525, 960, 250)      // 650 层房间：y 400~650
      wall(375, 365, 750, 70)       // 顶楼内侧：y 330~400（330 就是屋檐底面）

      // 进楼门口：室外楼梯最后一跑的落点是 (362, 1110)，门就开在那儿。
      // 走 put 走的是家具那套深度（树前 2.8 / 树后 1.05），玩家从前层进楼不会被门挡住
      put('inn-door', 362, 1110)

      // 招牌：钉在门楣上方那面墙上（再往下挪了 32）。牌面是贴图，四个字用 Text 打
      this.add.image(362, 998, 'inn-sign').setDepth(0.6)
      this.add
        .text(362, 998, '望舒客栈', {
          fontFamily: 'sans-serif',
          fontSize: '15px',
          color: '#33220f',
        })
        .setOrigin(0.5)
        .setDepth(0.7)

      // 屋顶：正脊 + 两坡瓦面 + 出檐檐板 + 两头上翘的飞檐，屋脊两头一对金色鸱吻。
      // 只有站在顶楼 / 阳台上才看得到；纯画面、没有碰撞。
      // 深度 12 是故意的：在玩家（9/10）前面，跳起来顶到屋檐时人是"在屋顶下面"，不会穿出去
      const eaveY = 330
      const ridgeY = 262
      const eaveLeft = -30
      const eaveRight = 990
      const ridgeLeft = 150
      const ridgeRight = 810
      const roof = this.add.graphics().setDepth(12)
      const slopeTop = (x: number) => {
        if (x <= ridgeLeft) {
          return ridgeY + ((ridgeLeft - x) * (eaveY - ridgeY)) / (ridgeLeft - eaveLeft)
        }

        if (x >= ridgeRight) {
          return ridgeY + ((x - ridgeRight) * (eaveY - ridgeY)) / (eaveRight - ridgeRight)
        }

        return ridgeY
      }

      roof.fillStyle(0x3d4a63, 1)             // 屋面
      roof.fillPoints(
        [
          new Phaser.Math.Vector2(eaveLeft, eaveY),
          new Phaser.Math.Vector2(eaveRight, eaveY),
          new Phaser.Math.Vector2(ridgeRight, ridgeY),
          new Phaser.Math.Vector2(ridgeLeft, ridgeY),
        ],
        true
      )

      roof.fillStyle(0x4b5975, 1)             // 瓦垄

      for (let x = eaveLeft; x <= eaveRight; x += 16) {
        const top = slopeTop(x)

        if (top < eaveY) {
          roof.fillRect(x, top, 2, eaveY - top)
        }
      }

      roof.fillStyle(0x5a6a86, 1)             // 正脊
      roof.fillRect(ridgeLeft - 4, ridgeY - 4, ridgeRight - ridgeLeft + 8, 5)

      roof.fillStyle(0x2b3446, 1)             // 檐板
      roof.fillRect(eaveLeft, eaveY, eaveRight - eaveLeft, 8)
      roof.fillStyle(0xc9a227, 1)             // 檐口一线金边
      roof.fillRect(eaveLeft, eaveY + 8, eaveRight - eaveLeft, 2)

      roof.fillStyle(0x2b3446, 1)             // 两头上翘的飞檐角
      roof.fillTriangle(eaveLeft, eaveY, eaveLeft - 22, eaveY - 18, eaveLeft + 10, eaveY + 8)
      roof.fillTriangle(eaveRight, eaveY, eaveRight + 22, eaveY - 18, eaveRight - 10, eaveY + 8)

      roof.fillStyle(0xc9a227, 1)
      roof.fillTriangle(eaveLeft - 20, eaveY - 16, eaveLeft - 22, eaveY - 18, eaveLeft - 8, eaveY - 6)
      roof.fillTriangle(eaveRight + 20, eaveY - 16, eaveRight + 22, eaveY - 18, eaveRight + 8, eaveY - 6)

      roof.fillStyle(0xe0b03c, 1)             // 正脊两头的鸱吻
      roof.fillRect(ridgeLeft - 9, ridgeY - 12, 9, 12)
      roof.fillRect(ridgeRight, ridgeY - 12, 9, 12)
      roof.fillRect(ridgeLeft - 4, ridgeY - 16, 4, 4)
      roof.fillRect(ridgeRight, ridgeY - 16, 4, 4)
    }

    this.gems = this.physics.add.staticGroup()
    this.blessings = this.physics.add.staticGroup()
    this.hazards = this.physics.add.staticGroup()

    this.monuments = this.physics.add.staticGroup()

    this.plates = this.physics.add.staticGroup()
    this.plateList = []

    ;(this.level.plates ?? []).forEach((def) => {
      const plate = this.plates.create(def.x, def.y, 'plate') as Phaser.Physics.Arcade.Sprite

      // 判定条：贴地那一条，位置和以前一模一样，只是看不见
      plate.setVisible(false)
      plate.setDisplaySize(def.width ?? PLATE_BODY.width, PLATE_BODY.height)
      plate.refreshBody()

      // 画面上的板子：46×20，底边压在判定条的下沿（也就是地面）上，比判定条宽一圈。
      // 深度见 PLATE_DEPTH：以前是 0（跟地面同层又比地面先建），第七关那半块板子
      // 一直被地面和树根盖着，所以在地面上几乎看不见
      const art = this.add
        .image(def.x, def.y + PLATE_BODY.height / 2, 'plate')
        .setOrigin(0.5, 1)
        .setDepth(PLATE_DEPTH.front)
        .setTint(0x8a7f6a)

      this.plateList.push({
        sprite: plate,
        art,
        id: def.id,
        baseY: def.y,
        press: 0,
        pressed: false,
      })
    })

    // 岩刺造物：贴在建筑上的发射器 + 它吐出来的岩刺。
    // 注意：和史莱姆的判定要等史莱姆创建之后再注册（见下面 slime 那一段），
    // 这里 this.slime 还不存在，注册了会变成一句空操作
    this.spikes = this.physics.add.group({ allowGravity: false })
    this.launchers = []

    ;(this.level.launchers ?? []).forEach((def) => {
      const dir = def.dir ?? 'down'
      const sprite = this.add.image(def.x, def.y, 'spike-launcher').setDepth(4)

      // 贴图是朝下的：朝左的口就把图转 90°，朝右的转 -90°
      sprite.setAngle(dir === 'left' ? 90 : dir === 'right' ? -90 : 0)

      this.launchers.push({
        sprite,
        dir,
        interval: def.interval ?? 2,
        speed: def.speed ?? 220,
        timer: 0.8,
      })
    })

    const platformDefs = [...this.level.platforms]

    if (this.level.dome) {
      platformDefs.push(...this.buildDome(this.level.dome))
    }

    platformDefs.forEach((def) => {
      const platform = this.platforms.create(def.x, def.y, 'pixel') as Phaser.Physics.Arcade.Sprite
      platform.setDisplaySize(def.width, def.height)
      platform.setTint(
        def.tint ?? (def.crumble ? palette.crumble : def.oneWay ? palette.oneWay : palette.ground)
      )
      platform.refreshBody()
      // 分层：古树的后层楼梯给 1（会被树干挡住），前层给 3；不写就是原来的 0
      platform.setDepth(def.depth ?? 0)

      // 只碰撞不画的台面（秘境云台）：碰撞体照旧，画面交给下面的云朵
      if (def.hidden) {
        platform.setVisible(false)
      }

      // 只画不挡人的台体（玉京台下面那道墙）：不参与碰撞，人从它前面走过去
      if (def.solid === false) {
        const ghostBody = platform.body as Phaser.Physics.Arcade.StaticBody

        ghostBody.enable = false
      }

      // 踩上去翻层的半层小平台（玉京台那种）：记下它的范围，每帧判断人站没站在上面
      if (def.layerFlip) {
        this.flipPads.push({
          left: def.x - def.width / 2,
          right: def.x + def.width / 2,
          top: def.y - def.height / 2,
        })
      }

      // 只在某一层存在的楼板补片：视觉交给下面的 RenderTexture（一直画、只擦透视洞），
      // 自带的矩形就不画了；碰撞仍然靠 collider 的过滤函数按 layer 决定
      if (def.layer) {
        platform.setData('layer', def.layer)
        platform.setVisible(false)
      }

      if (def.oneWay) {
        const body = platform.body as Phaser.Physics.Arcade.StaticBody
        body.checkCollision.down = false
        body.checkCollision.left = false
        body.checkCollision.right = false
      }

      if (def.crumble) {
        platform.setData('crumble', true)
      }

      // 浅水 / 草地只是叠在地形顶面上的一层贴图，不参与碰撞，也不改地形本身的颜色
      const top = def.y - def.height / 2

      if (def.water && !def.layer) {
        this.add
          .tileSprite(def.x, top + 5, def.width, 10, 'water-top')
          .setDepth((def.depth ?? 0) + 0.1)
          .setAlpha(0.85)
      }

      if (def.grass && !def.layer) {
        this.add
          .tileSprite(def.x, top - 2, def.width, 7, 'grass-top')
          .setDepth((def.depth ?? 0) + 0.1)
      }

      if (def.brick && !def.layer) {
        this.add
          .tileSprite(def.x, def.y, def.width, def.height, 'ruin-brick')
          .setDepth((def.depth ?? 0) + 0.1)
      }

      if (def.plank && !def.layer) {
        this.add
          .tileSprite(def.x, def.y, def.width, def.height, 'wood-plank')
          .setDepth((def.depth ?? 0) + 0.1)
      }

      // 平台护栏：高度和楼梯护栏一样是「踏面往上 26」，所以平台边上这一头正好接上
      // 那一跑楼梯护栏的收尾。护栏横木只做画面；**悬空那一端**再加一块实体挡板，
      // 防止玩家不小心走掉下去（接楼梯那头必须留出来走人）
      const railLeftEdge = def.x - def.width / 2
      const railRightEdge = def.x + def.width / 2
      let stairAtLeft = false
      let stairAtRight = false

      ;(this.level.stairs ?? []).forEach((stair) => {
        if (
          Math.abs(stair.from.x - railLeftEdge) < 2 ||
          Math.abs(stair.to.x - railLeftEdge) < 2
        ) {
          stairAtLeft = true
        }

        if (
          Math.abs(stair.from.x - railRightEdge) < 2 ||
          Math.abs(stair.to.x - railRightEdge) < 2
        ) {
          stairAtRight = true
        }
      })

      // 自动补护栏只认「窄平台」（1/2 层平台、阳台这类 width ≤ 220 的）。
      // 整层楼板（430 / 466 / 960 宽）不算：它的楼梯口在板子中间，
      // 照这套逻辑会在屋里横一道栏杆，看着像凭空多了排栅栏
      const narrowLanding = def.width <= 220

      // 井口两边的楼板：这是进出电梯的门，端头那道实体挡板必须去掉，否则一出电梯就被卡住
      const lift = this.liftDef
      const liftLeftEdge = lift ? lift.x - lift.width / 2 : 0
      const liftRightEdge = lift ? lift.x + lift.width / 2 : 0
      const atLiftShaft =
        lift !== undefined &&
        (Math.abs(railRightEdge - liftLeftEdge) < 2 ||
          Math.abs(railLeftEdge - liftRightEdge) < 2)

      // 层补片（整层楼板上的活板）也不补护栏：它本身宽不到 220，会被当成"窄平台"
      // 在中间横一道栏杆、还会加一块实体挡板挡住下楼的路
      if (
        !def.layer &&
        (def.rail || (!atLiftShaft && narrowLanding && (stairAtLeft || stairAtRight)))
      ) {
        const railY = top - 26
        const railLeft = railLeftEdge
        // 木护栏 / 挑檐 / 灯笼 / 木桶这一套是「客栈那种楼」的装饰。
        // 玉京台的平台写了 rail: false —— 那些装饰全不画（用户的"护栏装饰忘记删掉"就是这个），
        // 只保留下面那块防走掉下去的实体挡板
        if (def.rail !== false) {
          // 平台护栏也画在人前面：它和楼梯护栏是接在一起的，depth 要一致
          const railGfx = this.add.graphics().setDepth(12)

          railGfx.fillStyle(0x7a4c28, 1)
          railGfx.fillRect(railLeft, railY, def.width, 4)

          railGfx.fillStyle(0x6f4423, 1)

          for (let postX = railLeft + 2; postX <= railLeft + def.width - 3; postX += 40) {
            railGfx.fillRect(postX, railY, 3, 26)
          }

          railGfx.fillRect(railLeft + def.width - 5, railY, 3, 26)
        }

        // 护栏的端头挡板（实体）：1/2 层平台的外端是悬空的，没东西挡着人会一头栽下去。
        // 挡板只有 26 高（和护栏一样），走不过去但跳得过去 —— 只防"不小心走掉下去"，
        // 不封死路线。它不进 this.stairs，所以不会被自动上台阶抬上去
        // 井口那一侧不加：那是进出电梯的门（护栏横木留着，只去掉这块实体挡板）
        // railBar: false 也不要（玉京台台面中间那块要能走进楼梯井）
        if (!atLiftShaft && def.railBar !== false) {
          const endBar = this.platforms.create(
            stairAtRight ? railLeftEdge + 2 : railRightEdge - 2,
            railY + 13,
            'pixel'
          ) as Phaser.Physics.Arcade.Sprite

          endBar.setDisplaySize(4, 26)
          endBar.setVisible(false)
          endBar.refreshBody()
        }

        // 挑檐：在**没有楼梯那一端**往外挑一小块斜面瓦片，外缘略起翘 ——
        // 一眼看出这是「楼」而不是一块平台。深 3.2，压在楼板上、盖不住玩家
        // （rail: false 的平台连挑檐/灯笼/木桶也不画）
        if (def.rail !== false) {
          const eaveSide = stairAtRight ? -1 : 1
          const eaveX = eaveSide > 0 ? railRightEdge : railLeftEdge
          const eaveGfx = this.add.graphics().setDepth((def.depth ?? 0) + 0.2)

          eaveGfx.fillStyle(0x4a5568, 1)
          eaveGfx.fillTriangle(
            eaveX,
            railY - 2,
            eaveX + eaveSide * 16,
            railY + 4,
            eaveX,
            top
          )

          // 檐口线：贴着楼板面那道暖木色
          eaveGfx.fillStyle(0x6f4423, 1)
          eaveGfx.fillRect(Math.min(eaveX, eaveX + eaveSide * 16), top - 2, 16, 2)

          // 灯笼：挂在挑檐下沿，每块楼板一盏（纯画面，不参与碰撞）
          this.add
            .image(eaveX + eaveSide * 8, railY + 12, 'lantern')
            .setDepth((def.depth ?? 0) + 0.3)

          // 木桶：只摆在树左边那几块比较宽的楼层平台上（楼梯在右端的那种），
          // 底边贴住楼板面，避开楼梯口和换层判定区
          if (stairAtRight) {
            this.add
              .image(railLeftEdge + 26, top, 'barrel')
              .setOrigin(0.5, 1)
              .setDepth((def.depth ?? 0) + 0.3)

            this.add
              .image(railLeftEdge + 118, top, 'barrel')
              .setOrigin(0.5, 1)
              .setDepth((def.depth ?? 0) + 0.35)
          }
        }
      }

      // 楼板下面的立柱：从楼板底面往下撑到「下一块 x 范围有重叠的楼板」的顶面，
      // 找不到就往下伸 60 像素。柱子放在树干(2)之前、楼板和楼梯(3)之后，
      // 所以楼梯会挡在柱子前面 —— 看起来就是「楼梯在外侧、柱子在楼里侧」
      if (def.pillars) {
        const postLeft = def.x - def.width / 2
        const postTop = def.y + def.height / 2
        const postGfx = this.add.graphics().setDepth(2.6)

        postGfx.fillStyle(0x5a3c22, 1)

        for (let i = 0; i < def.pillars; i++) {
          const postX = postLeft + (def.width * (i + 1)) / (def.pillars + 1)
          let footY = postTop + 60
          let nearest = Number.POSITIVE_INFINITY

          for (const other of this.level.platforms) {
            if (other === def) {
              continue
            }

            const otherTop = other.y - other.height / 2
            const otherLeft = other.x - other.width / 2
            const otherRight = other.x + other.width / 2

            if (otherTop <= postTop + 1 || postX < otherLeft || postX > otherRight) {
              continue
            }

            if (otherTop < nearest) {
              nearest = otherTop
              footY = otherTop
            }
          }

          postGfx.fillRect(postX - 2, postTop, 4, Math.max(6, footY - postTop))
        }
      }

      // 层补片：建一张 RenderTexture 当它的视觉（照树干那套每帧重铺 + 擦透视洞）
      if (def.layer) {
        const pieceLeft = def.x - def.width / 2

        this.layerPieces.push({
          layer: def.layer,
          rt: this.add
            .renderTexture(pieceLeft, top, def.width, def.height)
            .setOrigin(0, 0)
            .setDepth((def.depth ?? 0) + 0.1),
          left: pieceLeft,
          top,
          width: def.width,
          height: def.height,
          plank: def.plank === true,
          tint: def.tint ?? palette.ground,
          drawn: { x: -99999, y: -99999, layer: '' },
        })
      }
    })

    // 纯碰撞边缘：画面由 decor 的山峰/树/大石头负责，这里只放看不见的实体
    ;(this.level.blockers ?? []).forEach((def) => {
      const blocker = this.blockers.create(def.x, def.y, 'pixel') as Phaser.Physics.Arcade.Sprite

      blocker.setVisible(false)
      blocker.setDisplaySize(def.width, def.height)
      blocker.refreshBody()
    })

    this.buildStairs()
    // 拱形土坡（走线是弧的那段地面）：只画 + 每帧贴地，不做碰撞体
    this.buildSlopes(
      palette.ground,
      // 关卡里最低那块平台的顶面＝地面线：坡的土体默认就填到这条线
      this.level.platforms.reduce(
        (lowest, item) => Math.max(lowest, item.y - item.height / 2),
        Number.NEGATIVE_INFINITY
      )
    )
    this.buildAmbers()
    this.buildSpeedItems()
    this.buildRevealRails()
    this.buildStairPadBodies()

    if (this.level.dome) {
      const dome = this.level.dome
      const holeBottom = Math.round(this.domeY(dome, dome.holeX))

      this.add
        .rectangle(
          dome.holeX,
          holeBottom - dome.thickness / 2,
          dome.holeWidth,
          dome.thickness,
          0x9adcf0,
          0.22
        )
        .setDepth(-1)
    }

    if (this.level.dome && this.level.spire) {
      this.add
        .image(this.level.spire.x, this.domeY(this.level.dome, this.level.spire.x) - 19, 'spire')
        .setDepth(1)
    }

    if (this.level.cage) {
      this.cageSprite = this.add.image(this.level.cage.x, this.level.cage.y, 'cage')
      this.eggSprite = this.add.image(this.level.cage.x, this.level.cage.y + 8, 'egg')

      this.eggSprite.setDepth(1)
      this.cageSprite.setDepth(2)
    }

    this.level.hints.forEach((hint) => {
      this.makeHint(hint.x, hint.y, hint.text)
    })

    // 测试沙盒不看存档里"捡过没"：每次都当全新的一关
    const savedGems = this.devLevel ? [] : (progress.levelGems[progress.levelIndex] ?? [])

    this.level.gems.forEach((spot, index) => {
      if (savedGems.includes(index)) {
        return
      }

    const gem = this.gems.create(spot.x, spot.y, 'gem') as Phaser.Physics.Arcade.Sprite
      gem.setTint(0x6ec6ff)
      gem.setData('index', index)
      // 属于「树后层」的原石画在树干（depth 2）后面：站树前层看不见，走到树后那一跑、
      // 透视洞把它露出来的时候才能拿（拾取那边也会再按 layer 卡一次）
      gem.setData('layer', spot.layer ?? null)
      gem.setDepth(spot.layer === 'back' ? 1.5 : 5)
    })

    this.level.blessings.forEach((spot) => {
      const item = this.blessings.create(spot.x, spot.y, 'blessing') as Phaser.Physics.Arcade.Sprite
      item.setTint(0xffe9a8)
    })

    this.level.orbs.forEach((def) => {
      const orb = this.orbs.create(def.x, def.y, 'orb') as Phaser.Physics.Arcade.Sprite
      orb.setTint(ELEMENTS[def.element].color)
      orb.setData('element', def.element)
    })

    this.buildMonsters()
    this.buildGuards()

    const goal = this.level.goal
    const goalColor = goal.grants ? ELEMENTS[goal.grants].color : 0xffffff
    this.goalSprite = this.physics.add.staticSprite(goal.x, goal.y, goal.kind)
    this.goalSprite.setTint(goalColor)

    this.goalReady = goal.after === undefined && !this.level.goalDisabled

    if (this.level.goalDisabled) {
      this.goalSprite.setVisible(false)
    }

    if (!this.goalReady) {
      this.goalSprite.setVisible(false).setScale(0)
    }

    // 支线做过的档：宝箱一开始就摆在阳台上（第七关的 goal.after 是 'xiao'，
    // 正常流程要等仙人走了才调 revealGoal）
    if (this.innRestored && !this.goalReady) {
      this.revealGoal()
    }

    // 路边的神像：点了给元素，但不再是终点（真正过关的是随后出现的宝箱）
    this.statueSprite = null
    this.statueUsed = false

    if (this.level.statue) {
      const statue = this.level.statue
      // statue.y 是「底座底面所在的那条线」，也就是脚下的地面顶面
      this.statueSprite = this.placeStatue(statue.x, statue.y, statue.grants)
    }

    this.slime = this.physics.add.sprite(spawnPoint.x, spawnPoint.y, 'slime-none')
    this.slime.setBounce(0.2)
    this.slime.setCollideWorldBounds(true)
    this.slime.setVisible(false)

    this.slimeArt = this.add.image(spawnPoint.x, spawnPoint.y, 'slime-none')
    this.slimeShadow = this.add.image(spawnPoint.x, spawnPoint.y + 14, 'slime-shadow').setDepth(8.6)
    this.lastGroundY = spawnPoint.y + 13

    this.wingLeft = this.add.image(0, 0, 'wing')
    this.wingRight = this.add.image(0, 0, 'wing')
    this.rockCrown = this.add.image(0, 0, 'rock-crown').setDepth(9).setVisible(false)
    this.armorPlate = this.add.image(0, 0, 'armor-plate').setDepth(9).setVisible(false)
    this.thunderRod = this.add.image(0, 0, 'thunder-rod').setDepth(9).setVisible(false)
    // 身上的电弧 / 静电画在身体上面一层（身体 10）
    this.thunderFx = this.add.graphics().setDepth(10.5)
    this.polarityMark = this.add.image(0, 0, 'polarity-plus').setDepth(11).setVisible(false)
    // 视野扇形画在地面和人物之间（3.5），压在掩体下面、人上面看不到遮挡关系
    this.guardVisionGfx = this.add.graphics().setDepth(3.5)
    // 头顶的疑惑环画在人和提示标之上
    this.guardAlertGfx = this.add.graphics().setDepth(6)
    
    this.windTrails = [0, 1, 2].map((index) =>
      this.add
        .image(0, 0, 'pixel')
        .setDisplaySize(12 + index * 5, 2)
        .setTint(0xa8e8d4)
        .setVisible(false)
    )

    this.eyes = [this.add.image(0, 0, 'eye'), this.add.image(0, 0, 'eye')]
    
    this.slimeArt.setDepth(10)
    this.wingLeft.setDepth(9)
    this.wingRight.setDepth(9)
    this.eyes.forEach((eye) => eye.setDepth(11))


    this.physics.world.setBounds(0, 0, this.level.width, this.level.height + 200)
    this.cameras.main.setBounds(0, 0, this.level.width, this.level.height)
    this.cameras.main.startFollow(this.slime, true, 0.12, 0.12)

    // 岩刺的判定：撞地形就碎，撞到史莱姆就按危险物算（岩化能挡、其它情况死亡结算）
    this.physics.add.collider(this.spikes, this.platforms, (spike) => {
      this.breakSpike(spike as Phaser.Physics.Arcade.Sprite)
    })

    // 岩柱挡得住岩刺，但不在 platforms 组里：玩家可以穿过去，压力板也照样认它
    this.physics.add.collider(this.spikes, this.pillars, (spike) => {
      this.breakSpike(spike as Phaser.Physics.Arcade.Sprite)
    })

    this.physics.add.overlap(this.spikes, this.slime, (_slime, spike) => {
      const shot = spike as Phaser.Physics.Arcade.Sprite

      this.die('spike')
      this.breakSpike(shot)
    })

    this.physics.add.collider(this.slime, this.platforms, (_slime, platform) => {
      const sprite = platform as Phaser.Physics.Arcade.Sprite

      if (!sprite.getData('crumble') || sprite.getData('crumbling')) {
        return
      }

      sprite.setData('crumbling', true)
      sprite.setTint(0x8a5a5a)

      this.time.delayedCall(CRUMBLE_DELAY, () => {
        sprite.destroy()
      })
    }, (_slime, platform) => {
      const sprite = platform as Phaser.Physics.Arcade.Sprite

      const layer = sprite.getData('layer') as 'front' | 'back' | undefined

      // 打了 layer 的东西（楼梯踏步、只在某一层存在的楼板补片）只跟同层碰撞：
      // 另一层藏在树后面，不参与碰撞。
      // 楼梯那边非这么写不可 —— 不然从 1/2 层平台往折返方向走，会正面撞上那一跑的第 3 级
      //（高 37 像素），超过自动上台阶的 14，人就被钉在平台上了。
      // 楼板补片则让它做到「树前层是完整楼板，树后层才露出楼梯井」
      return layer === undefined || layer === this.playerLayer
    })

    this.physics.add.collider(this.slime, this.blockers)

    if (this.domainMode) {
      this.buildTrialOne()
    }

    this.physics.add.overlap(this.slime, this.orbs, (_slime, orb) => {
      const orbSprite = orb as Phaser.Physics.Arcade.Sprite
      this.absorb(orbSprite.getData('element') as ElementKey)
      orbSprite.destroy()
    })

    this.physics.add.overlap(this.slime, this.gems, (_slime, gem) => {
    const gemSprite = gem as Phaser.Physics.Arcade.Sprite

      // 带层数的原石只有玩家也在同一层时才拿得到（树后层那两颗站在树前层碰不到）
      const gemLayer = gemSprite.getData('layer') as 'front' | 'back' | null

      if (gemLayer && gemLayer !== this.playerLayer) {
        return
      }

    this.collectedIndices.push(gemSprite.getData('index') as number)
    gemSprite.destroy()
    this.refreshGemHud()
    playSfx(this, 'sfx-gem', 0.5)

      if (!progress.gemStorySeen) {
        progress.gemStorySeen = true
        saveProgress()
        this.showMessage('透过这颗天蓝色的四角晶石，我仿佛看到了家乡的影子……')
      }

      queueAchievementToast('first-gem')
    })

    this.physics.add.overlap(this.slime, this.blessings, (_slime, item) => {
      const sprite = item as Phaser.Physics.Arcade.Sprite
      sprite.destroy()
      this.grantBlessing()
    })

    this.monumentList = []

    this.level.monuments.forEach((def) => {
      const pillar = this.monuments.create(def.x, def.y, 'monument') as Phaser.Physics.Arcade.Sprite
      // 底座是烤好的砖瓦色，没点亮时压暗一点，点亮就恢复本色
      pillar.setTint(0x9a9a9a)

      const head = this.add.image(def.x, def.y, 'monument-head')
      head.setTint(0x3a3a46)

      const icon = this.add.image(def.x, def.y - 16, 'icon-' + def.element).setScale(0.5)
      icon.setTint(0x7c8299)

      const hidden = def.after !== undefined

      if (hidden) {
        pillar.setVisible(false)
        head.setVisible(false)
        icon.setVisible(false)
      }

      const startLit = def.startLit === true

      if (startLit) {
        pillar.setTint(0xffffff)
        head.setTint(ELEMENTS[def.element].color)
        icon.setTint(0xffffff)
      }

      const monument: MonumentRef = {
        pillar,
        head,
        icon,
        element: def.element,
        id: def.id ?? '',
        after: def.after,
        lit: startLit,
        hidden,
        neighbors: def.neighbors ?? [],
        aura: [],
      }

      this.monumentList.push(monument)

      if (startLit) {
        this.makeMonumentAura(monument)
      }
    })

    this.gates = this.physics.add.staticGroup()
    this.doorList = []

    ;(this.level.doors ?? []).forEach((def) => {
      const texture = def.texture ?? 'gate'

      // 一扇门拆成左右两半扇，开门时各往一边滑开
      const left = this.gates.create(def.x - def.width / 4, def.y, texture) as Phaser.Physics.Arcade.Sprite
      left.setDisplaySize(def.width / 2, def.height)
      left.setTint(def.tint ?? 0xffffff)
      left.refreshBody()

      const right = this.gates.create(def.x + def.width / 4, def.y, texture) as Phaser.Physics.Arcade.Sprite
      right.setDisplaySize(def.width / 2, def.height)
      right.setTint(def.tint ?? 0xffffff)
      right.refreshBody()

      this.doorList.push({
        sprite: left,
        right,
        needs: def.needs,
        ordered: def.ordered === true,
        progress: [],
        opened: false,
      })
    })

    this.physics.add.collider(this.slime, this.gates)

    // 关着的门也挡岩刺（门开的时候 body.enable 被关掉，岩刺就能飞过去了）
    this.physics.add.collider(this.spikes, this.gates, (spike) => {
      this.breakSpike(spike as Phaser.Physics.Arcade.Sprite)
    })

    this.noteList = []
    this.pickupList = []
    this.repairList = []
    this.stairGfx = []

    ;(this.level.notes ?? []).forEach((def) => {
      const sprite = this.add.image(def.x, def.y, 'paper').setDepth(5)

      this.noteList.push({ sprite, prompt: def.prompt, text: def.text })
    })

    ;(this.level.pickups ?? []).forEach((def) => {
      // 支线做过的档：两处楼梯早修好了，木材堆摆出来也没用，干脆不摆
      if (this.innRestored) {
        return
      }

      // 木材堆：两块木板。def.y 是「它下面那条线」（也就是平台顶面），
      // 用 origin(0.5, 1) 让木板的**底边**落在 def.y 上，所以是躺在地上的，不会浮空；
      // 上面那块压在下面前半段上，看起来就是一摞
      const lower = this.add
        .image(def.x, def.y, def.key ?? 'wood-plank')
        .setDisplaySize(22, 6)
        .setOrigin(0.5, 1)
        .setDepth(5)

      const upper = this.add
        .image(def.x + 3, def.y - 5, def.key ?? 'wood-plank')
        .setDisplaySize(18, 5)
        .setOrigin(0.5, 1)
        .setDepth(5.1)

      this.pickupList.push({ ...def, parts: [lower, upper], taken: false })
    })

    ;(this.level.repairs ?? []).forEach((def) => {
      if (this.isRepaired(def)) {
        return                      // 存档里已经修好了：断茬也不画
      }

      // 断茬：两块斜的碎木板，修好之后销毁
      const mark = this.add.image(def.x, def.y, 'wood-plank').setDepth(6).setAngle(-30)

      this.repairList.push({ mark, def, done: false })
    })

    this.level.hazards.forEach((def) => {
    const gapTop = def.gapY - HAZARD.gapHeight / 2
    const gapBottom = def.gapY + HAZARD.gapHeight / 2
    const bottomHeight = this.level.height - gapBottom

    const upper = this.hazards.create(def.x, gapTop / 2, 'pixel') as Phaser.Physics.Arcade.Sprite
    upper.setDisplaySize(HAZARD.width, gapTop)
    upper.setTint(palette.hazard)
    upper.refreshBody()

    // 手机上不跑呼吸动画：只是视觉点缀，但要在手机端省掉 20 个无限 tween
    const upperSpark = this.add
      .tileSprite(def.x, gapTop / 2, 10, gapTop, 'hazard-spark')
      .setAlpha(this.touchMode ? 0.22 : 0.3)

    if (!this.touchMode) {
      this.tweens.add({
        targets: upperSpark,
        alpha: 0.12,
        duration: 420,
        yoyo: true,
        repeat: -1,
      })
    }

    const lower = this.hazards.create(
        def.x,
        gapBottom + bottomHeight / 2,
        'pixel'
      ) as Phaser.Physics.Arcade.Sprite
      lower.setDisplaySize(HAZARD.width, bottomHeight)
      lower.setTint(palette.hazard)
      lower.refreshBody()

      const lowerSpark = this.add
        .tileSprite(def.x, gapBottom + bottomHeight / 2, 10, bottomHeight, 'hazard-spark')
        .setAlpha(this.touchMode ? 0.22 : 0.3)

      if (!this.touchMode) {
        this.tweens.add({
          targets: lowerSpark,
          alpha: 0.12,
          duration: 420,
          yoyo: true,
          repeat: -1,
        })
      }
    })

    this.physics.add.overlap(this.slime, this.hazards, () => {
      this.die('hazard')
    })


    // 左上角从上到下：设置齿轮、元素图标、体力条
    const settingsIcon = this.add
      .image(18, 16, 'gear')
      .setScrollFactor(0)
      .setDepth(HUD_DEPTH)
      .setTint(0x8fa3b8)
      .setInteractive({ useHandCursor: true })

    settingsIcon.on('pointerdown', () => {
      this.clearTouchInput()
      this.scene.pause()
      this.scene.launch('pause')
    })

    // 元素图标一横排：先铺底框再放图标，否则底框会盖住图标
    this.elementMarks = ELEMENT_ORDER.map((_key, index) =>
      this.add
        .rectangle(18 + index * 20, 40, 18, 18, 0x1e1e30, 0.9)
        .setStrokeStyle(1, 0xffd54f)
        .setScrollFactor(0)
        .setDepth(HUD_DEPTH)
        .setVisible(false)
    )

    // 图标可以点：手机上直接点元素图标就切过去（等于按 Q / E），
    // 没解锁的位置是隐藏的，Phaser 不会给隐藏对象派发点击，所以点不到
    this.elementIcons = ELEMENT_ORDER.map((_key, index) => {
      const icon = this.add
        .image(18 + index * 20, 40, 'icon-none')
        .setScrollFactor(0)
        .setDepth(HUD_DEPTH)
        .setVisible(false)

      icon.setInteractive(
        new Phaser.Geom.Rectangle(-2, -2, 20, 20),
        Phaser.Geom.Rectangle.Contains
      )

      icon.on('pointerdown', () => {
        const key = this.availableElements()[index]

        if (key) {
          this.switchElement(key)
        }
      })

      return icon
    })

    this.elementHint = this.add
      .text(34, 40, this.touchMode ? '切换元素' : 'Q / E 切换元素', {
        fontFamily: 'sans-serif',
        fontSize: '10px',
        color: '#8fa3b8',
      })
      .setOrigin(0, 0.5)
      .setScrollFactor(0)
      .setDepth(HUD_DEPTH)

    // 雷闪的电能：元素图标下面一块小电池（三格）。
    // 电池贴图 36x14，外壳里面那口井在 (2,2)-(30,12)，三格各 8 宽、隔板 2 宽
    this.chargeBattery = this.add
      .image(10, 52, 'charge-battery')
      .setOrigin(0, 0)
      .setScrollFactor(0)
      .setDepth(HUD_DEPTH)
      .setVisible(false)

    this.chargeCells = [0, 1, 2].map((_value, index) =>
      this.add
        .image(12 + index * 10, 59, 'pixel')
        .setOrigin(0, 0.5)
        .setScrollFactor(0)
        .setDepth(HUD_DEPTH + 1)
        .setVisible(false)
    )

    // 电脑端：左下角常驻一份键位说明（那一块在手机上是虚拟按键，两边各显示各的）
    this.keyLegend = this.touchMode
      ? null
      : this.add
          .text(10, 250, '', {
            fontFamily: 'sans-serif',
            fontSize: '10px',
            color: '#8fa3b8',
            lineSpacing: 4,
          })
          .setOrigin(0, 1)
          .setScrollFactor(0)
          .setDepth(HUD_DEPTH)
          .setAlpha(0.7)

    // 网址后面加 ?fps=1 就在左上角显示帧率、帧时、对象数和 tween 数（排查卡顿用）
    if (new URLSearchParams(location.search).has('fps')) {
      this.perfText = this.add
        .text(6, 6, '', {
          fontFamily: 'monospace',
          fontSize: '10px',
          color: '#7bff9a',
        })
        .setScrollFactor(0)
        .setDepth(300)
    }

        this.promptBox = this.add
      .rectangle(0, 0, 80, 18, 0x1e1e30)
      .setStrokeStyle(2, 0xffd54f)
      .setDepth(20)
      .setVisible(false)

    this.promptText = this.add
      .text(0, 0, '', {
        fontFamily: 'sans-serif',
        fontSize: '12px',
        color: '#ffffff',
      })
      .setOrigin(0.5)
      .setDepth(21)
      .setVisible(false)

    // 提示条本身可点：触屏设备上等于按 F（提示条不可见时 Phaser 不会派发点击）
    this.promptBox.setInteractive({ useHandCursor: true })

    this.promptBox.on('pointerdown', () => {
      if (this.inputLocked || !this.promptAction) {
        return
      }

      playSfx(this, 'sfx-interact', 0.3)
      this.promptAction()
    })

    this.staminaGlowOuter = this.add
      .rectangle(10, 60, 70, 16, 0x6b5210)
      .setOrigin(0, 0.5)
      .setScrollFactor(0)
      .setDepth(HUD_DEPTH)
      .setVisible(false)

    this.staminaGlow = this.add
      .rectangle(10, 60, 68, 14, 0xffd54f)
      .setOrigin(0, 0.5)
      .setScrollFactor(0)
      .setDepth(HUD_DEPTH)
      .setVisible(false)

    this.staminaBar = this.add
      .rectangle(10, 60, 60, 6, 0x74d0b0)
      .setOrigin(0, 0.5)
      .setScrollFactor(0)
      .setDepth(HUD_DEPTH)

    this.armorBarBack = this.add
      .rectangle(10, 51, 70, 5, 0x2a2118)
      .setOrigin(0, 0.5)
      .setScrollFactor(0)
      .setDepth(HUD_DEPTH)
      .setVisible(false)

    this.armorBar = this.add
      .rectangle(10, 51, 70, 3, 0xd9a441)
      .setOrigin(0, 0.5)
      .setScrollFactor(0)
      .setDepth(HUD_DEPTH)
      .setVisible(false)

    // 原石总数 = 关卡里摆着的 + **冻在琥珀里的**（用户 2026/10/17：琥珀里那颗也算一颗）
    const gemTotal = this.gemTotalCount()
    const gemStartX = 480 - 20 - (gemTotal - 1) * 18

    this.gemIcons = Array.from({ length: gemTotal }, (_unused, index) =>
      this.add
        .image(gemStartX + index * 18, 18, 'gem')
        .setScrollFactor(0)
        .setDepth(HUD_DEPTH)
        .setTint(0x33333f)
    )

    // 右上角：原石左边标一下这是第几关（关卡名取「第一关 · 你好，提瓦特」的前半段）
    this.add
      .text(gemStartX - 12, 18, this.level.name.split(' · ')[0], {
        fontFamily: 'sans-serif',
        fontSize: '10px',
        color: '#8fa3b8',
      })
      .setOrigin(1, 0.5)
      .setScrollFactor(0)
      .setDepth(HUD_DEPTH)

    this.cursors = this.input.keyboard!.createCursorKeys()
    this.prevKey = this.input.keyboard!.addKey('Q')
    this.nextKey = this.input.keyboard!.addKey('E')
    this.interactKey = this.input.keyboard!.addKey('F')
    this.armorKey = this.input.keyboard!.addKey('X')
    this.rockKey = this.input.keyboard!.addKey('C')

    // 触屏设备（或 ?touch=1）才铺虚拟按键，桌面浏览器上不占画面
    if (this.touchMode) {
      this.makeTouchControls()
    }

    this.armored = false
    this.armoredTimer = 0
    this.armorCooldown = 0
    this.invulnTimer = 0
    this.rockPillar = null

    // 关卡自带的元素也要登记进解锁表：不然它不在表里，Q/E 一转就把它丢了
    unlockElement(this.level.startElement)

    // 没有神像、但本关想开局就给的元素（例如第七关想给风，好让玩家能飞上去看观感）
    ;(this.level.unlocks ?? []).forEach((key) => unlockElement(key))

    // 注意：unlockElement() 会把「当前元素」也改成刚解锁的那个，
    // 所以带了 unlocks 的关卡要把开局元素拨回 startElement（第七关：给风，但仍以岩开局）
    if (this.level.unlocks) {
      progress.current = this.level.startElement
    }

    // 本关神像授予的元素，在摸到神像之前先锁着：存档里解锁过也不算数，
    // 只锁这一关，不动存档，别的关照样能用。锁的是本关自己出场的元素
    this.lockedElement =
      this.level.statue && this.level.statue.grants !== this.level.startElement
        ? this.level.statue.grants
        : null

    if (this.domainMode) {
      progress.current = 'rock'
    } else if (this.startData.checkpoint?.element) {
      progress.current = this.startData.checkpoint.element
    }

    this.applyElement(progress.current)
    this.refreshGemHud()

    if (this.domainMode) {
      this.buildDomainHud()
    }

    // 存档里"小龙已经救出来了"：方碑全亮、四道门全开、笼子空了、宝箱已经在塔中央。
    // 统一放在这儿补，而不是去各个创建处加分支 —— 这时候方碑 / 门 / 笼子 / 宝箱都已经建好了
    if (this.towerRestored) {
      // 按数据里的顺序点亮（f2b 那种"跟进碑"要靠前面那块把自己带出来）
      this.monumentList.forEach((monument) => this.lightMonument(monument))
      this.doorList.forEach((door) => this.openDoor(door, true))

      if (this.cageSprite && this.eggSprite) {
        this.cageSprite.setTexture('cage-open')
        this.eggSprite.setVisible(false)
        this.cageOpened = true
      }

      this.revealGoal()
    }

    // 测试关卡：同一间展厅只看一次开场，来回换房间不会被黑屏文字反复挡
    if (this.devLevel) {
      this.buildDevExhibits()
      this.buildDevPortals()

      if (!this.devIntroSeen.includes(this.devRoom)) {
        this.devIntroSeen.push(this.devRoom)
        this.showIntro(this.level.intro)
      }
    } else {
      this.showIntro(this.level.intro)
    }

    playMusic(this, this.level.music ?? 'music-field')

    if (this.level.chase) {
      const tuning = this.level as LevelDef & ChaseTuning

      this.chaseDef = {
        triggerX: tuning.wallAt ?? CHASE.triggerX,
        stopX: tuning.chaseStop ?? CHASE.stopX,
        speed: tuning.chaseSpeed ?? CHASE.speed,
        cause: tuning.chaseCause ?? 'crush',
      }

      this.chase = this.physics.add.image(-40, this.level.height / 2, 'pixel')
      this.chase.setDisplaySize(60, this.level.height)
      this.chase.setTint(tuning.chaseTint ?? palette.crumble)

      const chaseBody = this.chase.body as Phaser.Physics.Arcade.Body
      chaseBody.setAllowGravity(false)

      this.physics.add.overlap(this.slime, this.chase, () => {
        this.die(this.chaseDef!.cause)
      })
    }

    // 追击小队（第八关那套）：参数按关卡给，走过触发点才生成
    const squadTuning = this.level as LevelDef & ChaseTuning

    if (squadTuning.chaseAt !== undefined) {
      this.chaserGroup = this.physics.add.group()
      this.squadDef = {
        at: squadTuning.chaseAt,
        count: squadTuning.squadCount ?? SQUAD.count,
        speed: squadTuning.squadSpeed ?? SQUAD.speed,
        gap: squadTuning.squadSpawnGap ?? SQUAD.gap,
        stop: squadTuning.squadStop ?? Number.POSITIVE_INFINITY,
        cause: squadTuning.chaseCause ?? 'guard',
      }

      this.physics.add.collider(this.chaserGroup, this.platforms)
      this.physics.add.collider(this.chaserGroup, this.gates)
      this.physics.add.collider(this.chaserGroup, this.pillars)
      this.physics.add.overlap(this.slime, this.chaserGroup, () => this.die(this.squadDef!.cause))
    }
    this.input.keyboard!.on('keydown-ESC', () => {
      this.scene.pause()
      this.scene.launch('pause')
    })

    this.events.once('shutdown', () => {
      stopAllLoops()
    })
    
  }

  // 关卡提示统一长这样：一块深色底 + 一行浅字，和交互提示、独白是同一套配色
  // 操作类提示按类别只出现一次：「按空格可跳跃」这类教操作的，同一类之后的关卡不再显示；
  // 「前面有座神像」这种纯地标提示不归类，永远都在
  // 交互提示：电脑端一直标着要按的键；触屏没有 F 键，点提示条本身就是交互，所以不带键名
  private interactPrefix() {
    return this.touchMode ? '' : '[F] '
  }

  private hintCategory(text: string): string | null {
    if (/长按空格/.test(text)) {
      return 'hover'
    }

    if (/松开空格/.test(text)) {
      return 'glide'
    }

    if (/空格/.test(text)) {
      return 'jump'
    }

    if (/按 X/.test(text)) {
      return 'armor'
    }

    if (/按 C/.test(text)) {
      return 'pillar'
    }

    if (/按 F|\[F\]/.test(text)) {
      return 'interact'
    }

    if (/← →/.test(text)) {
      return 'move'
    }

    return null
  }

  private makeHint(x: number, y: number, text: string) {
    const category = this.hintCategory(text)

    // 这一类操作已经提示过了，就不再出现
    if (category && hasSeenHint(category)) {
      return
    }

    if (category) {
      markHintSeen(category)
    }

    const label = this.add
      .text(x, y, touchText(text), {
        fontFamily: 'sans-serif',
        fontSize: '12px',
        color: '#a8b6c8',
      })
      .setOrigin(0.5)
      .setDepth(4)

    // 底框按文字实测宽度来，不会出现空边或者字被切掉
    const panel = this.add
      .rectangle(x, y, Math.max(48, label.width + 16), 20, 0x14181f)
      .setStrokeStyle(1, 0x3a4a5e)
      .setAlpha(0.82)
      .setDepth(3)

    return { panel, label }
  }

  private domeY(dome: DomeDef, x: number) {
    const half = this.level.width / 2
    const rise = dome.springY - dome.apexY
    const centerY =
      (half * half + dome.springY * dome.springY - dome.apexY * dome.apexY) / (2 * rise)
    const radius = centerY - dome.apexY

    return centerY - Math.sqrt(radius * radius - (x - half) * (x - half))
  }

  private buildDome(dome: DomeDef): PlatformDef[] {
    const blocks: PlatformDef[] = []
    const step = 20

    for (let cx = step / 2; cx < this.level.width; cx += step) {
      if (Math.abs(cx - dome.holeX) < dome.holeWidth / 2 + step / 2) {
        continue
      }

      const bottom = Math.round(this.domeY(dome, cx))

      blocks.push({ x: cx, y: bottom - dome.thickness / 2, width: step, height: dome.thickness })
    }

    return blocks
  }

  // 这一关能用的元素：从第一关走到本关，途中真正会拿到的那些——
  // 各关自带元素 + 前面各关神像授予的元素（本关神像要摸到才算），
  // 最后再和存档里的解锁表取交集。所以哪怕存档里已经有岩元素，
  // 回到第一关也切不出来，得按关卡顺序重新把神像摸一遍
  private switchElement(key: ElementKey) {
    if (this.domainMode) {
      return
    }

    if (this.inputLocked || key === this.element || !this.availableElements().includes(key)) {
      return
    }

    progress.current = key
    this.applyElement(key)
    playSfx(this, 'sfx-interact', 0.25)
  }

  private availableElements(): ElementKey[] {
    if (this.domainMode) {
      return ELEMENT_ORDER.slice()
    }

    // 测试关卡：不按关卡进度卡元素，解锁过什么就能切什么。
    // 不这么写的话，?dev=1 进来时 progress.levelIndex 还在第一关，
    // 上面那圈只认"前十关发过的元素"，沙盒里就只剩一个"无"能用了
    if (this.devLevel) {
      return ELEMENT_ORDER.filter((key) => progress.unlocked.includes(key))
    }

    const list: ElementKey[] = []

    const add = (key: ElementKey) => {
      if (!list.includes(key)) {
        list.push(key)
      }
    }

    LEVELS.forEach((level, index) => {
      if (index > progress.levelIndex) {
        return
      }

      add(level.startElement)

      // 本关神像还没摸到就先不给
      if (level.statue && !(index === progress.levelIndex && this.lockedElement !== null)) {
        add(level.statue.grants)
      }
    })

    return ELEMENT_ORDER.filter((key) => list.includes(key) && progress.unlocked.includes(key))
  }

  // 触屏按键：左下角是左右移动（箭头 + 中圈），右下角是跳跃 + 岩柱 + 岩化。
  // 位置直接按逻辑分辨率 480x270 写，缩放交给 Phaser 的 Scale.FIT
  private clearTouchInput() {
    this.touchLeft = false
    this.touchRight = false
    this.touchJump = false
    this.touchJumpJust = false
    this.touchArmorJust = false
    this.touchArmorUp = false
    this.touchPillarJust = false
    this.touchPillarUp = false
    this.blinkPointerId = -1

    // 摇杆也要松手：暂停/恢复时手指的 pointerup 收不到，不归位会一直往一个方向跑
    this.stickPointer = -1
    this.stickAlpha.base = STICK_ALPHA.base
    this.stickAlpha.knob = STICK_ALPHA.knob

    if (this.stickBase && this.stickKnob) {
      this.stickBase.setPosition(STICK.idleX, STICK.idleY).setAlpha(STICK_ALPHA.base)
      this.stickKnob.setPosition(STICK.idleX, STICK.idleY).setAlpha(STICK_ALPHA.knob)
    }
  }

  private makeTouchControls() {
    // 允许三指同时按：左手压方向、右手点跳跃和技能
    this.input.addPointer(2)

    this.touchButtons = []

    // 按键贴图已经按放大后的尺寸画好了（40/72/42/50），这里不再做缩放——
    // 之前用 setScale(1.4) 拉 1 像素的环线，会被重采样成 1~2 像素，看着发糊
    const TOUCH_SCALE = 1

    const button = (
      x: number,
      y: number,
      key: string,
      onDown: () => void,
      onUp?: () => void,
      flip = false
    ) => {
      const image = this.add
        .image(x, y, key)
        .setScrollFactor(0)
        .setDepth(100)
        .setAlpha(0.75)
        .setScale(TOUCH_SCALE)
        .setFlipX(flip)
        .setInteractive({ useHandCursor: true })

      const release = () => {
        image.setScale(TOUCH_SCALE)
        onUp?.()
      }

      image.on('pointerdown', () => {
        // 按下只缩小，透明度交给「别遮住史莱姆」那套统一控制
        image.setScale(TOUCH_SCALE * 0.92)
        onDown()
      })

      image.on('pointerup', release)
      image.on('pointerout', release)

      this.touchButtons.push({
        image,
        x,
        y,
        r: (image.width * TOUCH_SCALE) / 2,
        base: 0.75,
      })

      return image
    }

    // 左下角两种操作方式二选一：左右箭头键，或者浮动摇杆（设置里切）
    this.buildMoveControls()

    // 右下：最大的跳跃键
    button(
      424,
      204,
      'touch-jump',
      () => {
        this.touchJump = true
        this.touchJumpJust = true
      },
      () => {
        this.touchJump = false
      }
    )

    // 跳跃键左下角：岩柱（小一号）。没解锁岩元素时整个藏起来
    this.touchPillarButton = button(
      358,
      236,
      'touch-pillar',
      () => {
        this.touchPillarJust = true
      },
      () => {
        this.touchPillarUp = true
      }
    )

    // 岩柱左边：岩化（图标更大一点）。
    // 底下压一张灰版，亮的那张用 setCrop 从下往上露出，就是冷却回充的样子
    const armorX = 304
    const armorY = 236

    const armorDim = this.add
      .image(armorX, armorY, 'touch-armor-dim')
      .setScrollFactor(0)
      .setDepth(100)
      .setAlpha(0.75)
      .setScale(TOUCH_SCALE)

    const armorFill = this.add
      .image(armorX, armorY, 'touch-armor')
      .setScrollFactor(0)
      .setDepth(101)
      .setAlpha(0.75)
      .setScale(TOUCH_SCALE)

    this.touchArmorDim = armorDim
    this.touchArmorFill = armorFill

    armorDim.setInteractive({ useHandCursor: true })

    const armorRelease = () => {
      armorDim.setScale(TOUCH_SCALE)
      armorFill.setScale(TOUCH_SCALE)
    }

    armorDim.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      armorDim.setScale(TOUCH_SCALE * 0.92)
      armorFill.setScale(TOUCH_SCALE * 0.92)
      this.touchArmorJust = true
      // 记下是哪根手指按的：雷闪要按住拖动选方向，得等这根手指真的抬起来才算松手
      this.blinkPointerId = pointer.id
    })

    armorDim.on('pointerup', armorRelease)
    armorDim.on('pointerout', armorRelease)

    // 手指拖到按钮外面再抬起来时收不到 pointerup，这里兜一道：
    // 哪根手指按的就在全局的 pointerup 里配对，配对上了才算松手。
    // 先 off 再 on：场景实例是复用的，直接 on 会一次一次叠上去
    this.input.off('pointerup', this.onGlobalPointerUp, this)
    this.input.on('pointerup', this.onGlobalPointerUp, this)

    this.touchButtons.push({
      image: armorDim,
      x: armorX,
      y: armorY,
      r: (armorDim.width * TOUCH_SCALE) / 2,
      base: 0.75,
    })

    this.touchButtons.push({
      image: armorFill,
      x: armorX,
      y: armorY,
      r: (armorFill.width * TOUCH_SCALE) / 2,
      base: 0.75,
    })

    // 雷闪键下缘的三个充能点：135° / 90° / 45°（屏幕坐标 y 朝下，所以这是下缘的
    // 左下、正下、右下），亮着几颗就代表还有几格电
    this.blinkDots = [135, 90, 45].map((degree) => {
      const rad = (degree * Math.PI) / 180
      const dot = this.add
        .image(armorX + Math.cos(rad) * 19, armorY + Math.sin(rad) * 19, 'charge-dot')
        .setScrollFactor(0)
        .setDepth(102)
        .setVisible(false)

      this.touchButtons.push({ image: dot, x: dot.x, y: dot.y, r: 3.5, base: 0.95 })

      return dot
    })
  }

  // 按当前的「移动方式」铺控件：左右箭头键 / 浮动摇杆
  private buildMoveControls() {
    if (getMoveMode() === 'stick') {
      this.makeMoveStick()
      return
    }

    const arrow = (x: number, flip: boolean, on: () => void, off: () => void) => {
      const image = this.add
        .image(x, 236, 'touch-arrow')
        .setScrollFactor(0)
        .setDepth(100)
        .setAlpha(0.75)
        .setFlipX(flip)
        .setInteractive({ useHandCursor: true })

      image.on('pointerdown', () => {
        image.setScale(0.92)
        on()
      })

      const release = () => {
        image.setScale(1)
        off()
      }

      image.on('pointerup', release)
      image.on('pointerout', release)

      this.moveImages.push(image)
      this.touchButtons.push({ image, x, y: 236, r: image.width / 2, base: 0.75 })
    }

    // 左箭头（贴图朝右，靠翻转）往左、右箭头往右
    arrow(30, true, () => { this.touchLeft = true }, () => { this.touchLeft = false })
    arrow(98, false, () => { this.touchRight = true }, () => { this.touchRight = false })
  }

  // 把当前这套移动控件整个收掉（切模式、或者退到别的场景之前）
  private clearMoveControls() {
    const removed = new Set(this.moveImages)

    this.moveImages.forEach((image) => image.destroy())
    this.moveImages = []

    // touchButtons 里还留着箭头键的条目，不清掉的话「靠近变淡」那套会去操作已销毁的对象
    this.touchButtons = this.touchButtons.filter((item) => !removed.has(item.image))

    // 摇杆的监听挂在 scene 的 input 上，切走之前必须摘干净，不然每切一次就多挂一层
    this.stickHandlers.forEach(({ event, fn }) => this.input.off(event, fn))
    this.stickHandlers = []

    this.stickBase?.destroy()
    this.stickKnob?.destroy()
    this.stickBase = null
    this.stickKnob = null
    this.stickPointer = -1
  }

  // 设置里切换移动方式后立刻生效：收掉旧的，按新的重建（不用重进关卡）
  private applyMoveMode() {
    this.clearMoveControls()
    this.touchLeft = false
    this.touchRight = false

    if (!this.touchMode) {
      return
    }

    this.buildMoveControls()
  }

  // 浮动摇杆：手指按到哪，底盘就出现在哪（限制在左下区域、且留在屏幕里），
  // 拖动时摇杆头跟着手指走，横向超过死区就当作按了左/右
  private makeMoveStick() {
    const base = this.add
      .image(STICK.idleX, STICK.idleY, 'touch-stick-base')
      .setScrollFactor(0)
      .setDepth(100)
      .setAlpha(STICK_ALPHA.base)

    const knob = this.add
      .image(STICK.idleX, STICK.idleY, 'touch-stick-knob')
      .setScrollFactor(0)
      .setDepth(101)
      .setAlpha(STICK_ALPHA.knob)

    this.stickBase = base
    this.stickKnob = knob

    const onDown = (pointer: Phaser.Input.Pointer) => {
      // 已经有手指在操控摇杆了，或者按的地方不在这块区域，就不管
      if (this.stickPointer >= 0 || pointer.x > STICK.zoneRight || pointer.y < STICK.zoneTop) {
        return
      }

      this.stickPointer = pointer.id
      this.stickOrigin.x = Phaser.Math.Clamp(pointer.x, 40, STICK.zoneRight)
      this.stickOrigin.y = Phaser.Math.Clamp(pointer.y, STICK.zoneTop + 40, 236)

      this.stickAlpha.base = STICK_ALPHA.baseActive
      this.stickAlpha.knob = STICK_ALPHA.knobActive
      base.setPosition(this.stickOrigin.x, this.stickOrigin.y).setAlpha(STICK_ALPHA.baseActive)
      knob.setPosition(this.stickOrigin.x, this.stickOrigin.y).setAlpha(STICK_ALPHA.knobActive)
    }

    const onMove = (pointer: Phaser.Input.Pointer) => {
      if (pointer.id !== this.stickPointer) {
        return
      }

      const dx = Phaser.Math.Clamp(pointer.x - this.stickOrigin.x, -STICK.radius, STICK.radius)
      const dy = Phaser.Math.Clamp(pointer.y - this.stickOrigin.y, -STICK.radius, STICK.radius)

      knob.setPosition(this.stickOrigin.x + dx, this.stickOrigin.y + dy)
      this.touchLeft = dx < -STICK.deadZone
      this.touchRight = dx > STICK.deadZone
    }

    const release = (pointer: Phaser.Input.Pointer) => {
      if (pointer.id !== this.stickPointer) {
        return
      }

      this.stickPointer = -1
      this.touchLeft = false
      this.touchRight = false

      this.stickAlpha.base = STICK_ALPHA.base
      this.stickAlpha.knob = STICK_ALPHA.knob
      base.setPosition(STICK.idleX, STICK.idleY).setAlpha(STICK_ALPHA.base)
      knob.setPosition(STICK.idleX, STICK.idleY).setAlpha(STICK_ALPHA.knob)
    }

    this.input.on('pointerdown', onDown)
    this.input.on('pointermove', onMove)
    this.input.on('pointerup', release)
    this.input.on('pointerupoutside', release)

    this.stickHandlers.push(
      { event: 'pointerdown', fn: onDown },
      { event: 'pointermove', fn: onMove },
      { event: 'pointerup', fn: release },
      { event: 'pointerupoutside', fn: release }
    )
  }

  // 秘境的特殊三心 HUD：不用常规死亡界面，三颗心归零就直接清场回山顶
  private buildDomainHud() {
    this.domainHeartText = this.add
      .text(240, 8, this.domainHeartString(), {
        fontFamily: 'sans-serif',
        fontSize: '15px',
        color: '#e05a5a',
      })
      .setOrigin(0.5, 0)
      .setScrollFactor(0)
      .setDepth(HUD_DEPTH)

    this.add
      .text(240, 27, '仙家试炼', {
        fontFamily: 'sans-serif',
        fontSize: '10px',
        color: '#ffd54f',
      })
      .setOrigin(0.5, 0)
      .setScrollFactor(0)
      .setDepth(HUD_DEPTH)
  }

  private domainHeartString() {
    return this.domainHearts > 0 ? '♥ '.repeat(this.domainHearts).trim() : '♡'
  }

  private refreshDomainHearts() {
    this.domainHeartText?.setText(this.domainHeartString())
  }

  damageDomain(amount = 1) {
    if (!this.domainMode || this.domainLeaving) {
      return
    }

    this.domainHearts = Math.max(0, this.domainHearts - amount)
    this.refreshDomainHearts()
    this.cameras.main.shake(120, 0.005)

    if (this.domainHearts <= 0) {
      this.failDomain()
      return
    }

    this.invulnTimer = 1.2
    this.showMessage(`仙家试炼：还剩 ${this.domainHearts} 颗心`)
  }

  private failDomain() {
    if (this.domainLeaving) {
      return
    }

    this.domainLeaving = true
    this.inputLocked = true
    this.clearTouchInput()

    const fade = this.add
      .rectangle(0, 0, 480, 270, 0x0a0a14)
      .setOrigin(0, 0)
      .setScrollFactor(0)
      .setDepth(210)
      .setAlpha(0)

    this.tweens.add({
      targets: fade,
      alpha: 1,
      duration: 280,
      onComplete: () => {
        const point = this.startData.returnPoint ?? { x: 1960, y: 446, element: 'rock' as ElementKey }
        this.scene.restart({ checkpoint: point })
      },
    })
  }

  private enterDomain() {
    this.scene.restart({
      domain: true,
      returnPoint: { x: 1960, y: 446, element: this.element },
    })
  }

  private talkToCrane() {
    this.showDialogue(
      '留云借风真君',
      [
        '凡人，你爬上来了。',
        '想让我下山帮忙，先过三重仙家试炼。',
        '秘境之门，开。',
      ],
      () => this.enterDomain()
    )
  }

  private refreshHud() {
    const unlocked = this.domainMode ? ELEMENT_ORDER.slice() : this.availableElements()

    // 岩元素解锁了、而且「当前就是岩史莱姆」，才显示岩柱 / 岩化两个键
    // （键盘的 C / X 本来也只在岩形态下才响应，按钮跟着一致）
    this.rockAvailable = unlocked.includes('rock')

    const showRockSkills = this.rockAvailable && this.element === 'rock'

    // 雷元素解锁了、而且「当前就是雷史莱姆」，两个键换成雷闪 / 雷鸣。
    // 用的是同一个键位、同一块按钮，只换贴图 —— 手机上不用再学一套位置
    const showThunderSkills = unlocked.includes('thunder') && this.element === 'thunder'

    if (showThunderSkills) {
      this.touchPillarButton?.setTexture('touch-thunder')
      // 底下那张永远是灰版，亮的那张（亮版）按充能进度从下往上露出来
      this.touchArmorDim?.setTexture('touch-blink-dim')
      this.touchArmorFill?.setTexture('touch-blink')
    } else {
      this.touchPillarButton?.setTexture('touch-pillar')
      this.touchArmorDim?.setTexture('touch-armor-dim')
      this.touchArmorFill?.setTexture('touch-armor')
    }

    this.touchPillarButton?.setVisible(showRockSkills || showThunderSkills)
    this.touchArmorDim?.setVisible(showRockSkills || showThunderSkills)
    // 灰底 + 亮底那一对两边都用：岩化看冷却，雷闪看充能
    this.touchArmorFill?.setVisible(showRockSkills || showThunderSkills)

    // 雷闪的电能电池
    this.chargeBattery.setVisible(showThunderSkills)
    this.chargeCells.forEach((cell) => cell.setVisible(showThunderSkills))
    this.updateChargeHud()

    unlocked.forEach((key, index) => {
      const icon = this.elementIcons[index]
      const active = key === this.element
      const iconKey = 'icon-' + key

      icon.setVisible(true)
      icon.setPosition(18 + index * 20, 40)
      icon.setTexture(this.textures.exists(iconKey) ? iconKey : 'icon-none')

      if (this.domainMode && key !== 'rock') {
        // 仙家封印：图标保留，灰掉；点击和 Q/E 都在 switchElement 里挡住
        icon.setTint(0x555566)
        icon.setAlpha(0.2)
        this.elementMarks[index].setVisible(false)
      } else {
        icon.setTint(ELEMENTS[key].color)
        icon.setAlpha(active ? 1 : 0.4)
        this.elementMarks[index].setPosition(icon.x, icon.y).setVisible(active)
      }
    })

    // 没解锁的位置全部收起来
    for (let index = unlocked.length; index < this.elementIcons.length; index++) {
      this.elementIcons[index].setVisible(false)
      this.elementMarks[index].setVisible(false)
    }

    this.elementHint.setPosition(14 + unlocked.length * 20, 40)
    this.elementHint.setText(this.domainMode ? '能力被封印' : this.touchMode ? '切换元素' : 'Q / E 切换元素')

    // 键位说明跟着当前能力走：当自己是岩史莱姆时才写 X / C，场上有风系才写长按空格
    if (this.keyLegend) {
      const rows = ['← → 移动　空格 跳跃　F 交互　Esc 设置']
      const skills: string[] = []

      if (showRockSkills) {
        skills.push('X 岩化　C 岩柱')
      }

      if (showThunderSkills) {
        skills.push('X 雷闪　C 雷鸣')
      }

      // 长按空格也跟着「当前是什么史莱姆」走，和上面岩 / 雷两条一个规矩：
      // 光解锁了风还不行，得现在就穿着风史莱姆这层皮，否则提示了一按没反应
      if (ELEMENTS[this.element].canHover) {
        // 悬浮和缓降都吃体力，键位说明里要写出来，不然玩家以为能无限飘
        skills.push('长按空格 悬浮／缓降（耗体力）')
      }

      if (skills.length > 0) {
        rows.push(skills.join('　'))
      }

      this.keyLegend.setText(rows.join('\n'))
    }

    const element = ELEMENTS[this.element]

    this.staminaBar.setVisible(element.canHover)
    this.staminaBar.setFillStyle(element.color)
  }

  private applyElement(key: ElementKey) {
    const element = ELEMENTS[key]

    // 换元素会退出岩化：走同一条收尾流程，所以也会进冷却（不能切走再切回来白嫖）
    this.setArmored(false)
    // 预览也一起收掉
    this.pillarPressed = false
    this.stopPillarPreview()
    // 雷闪的瞄准同理：换元素的瞬间一定不在瞄准里
    this.blinkHeld = false
    this.blinkHold = 0
    this.stopBlinkAim()

    this.wingLeft.setTint(element.color)
    this.wingRight.setTint(element.color)
    this.element = key
    this.jumpPower = element.jump
    this.slimeArt.setTexture('slime-' + key)
    // 雷史莱姆按「雷鸣攒好没」换皮：充满了是黄紫、冷却中是全紫
    this.refreshThunderLook()
    this.refreshEyeTint()
    this.refreshHud()
  }

  private absorb(key: ElementKey) {
    unlockElement(key)
    this.applyElement(key)
  }

  private win() {
    if (this.finished) {
      return
    }

    this.finished = true

    // 开箱之后也锁住操作：物理世界暂停 + 清速度 + 收掉岩柱预览，
    // 等 900 毫秒后结算界面接手，玩家不会带着惯性滑出去
    this.inputLocked = true
    this.physics.world.pause()
    this.slime.setVelocity(0, 0)
    this.pillarPressed = false
    this.stopPillarPreview()

    // 测试沙盒的通关不进存档（不然会把"最后一关"的进度和原石记乱）
    if (!this.devLevel) {
      recordClear(progress.levelIndex, this.collectedIndices)
    }

    // 第八关：开箱之后把那两处动画记进存档（用户要求）——
    // 下次进来祭坛就是撞毁的、龙还趴在上面，追击的镜头演出也不再放一遍
    if (this.level.plaza) {
      markHintSeen(RITE_SEEN_FLAG)
      markHintSeen(TERRACE_CHASE_FLAG)
    }

    stopAllLoops()
    playSfx(this, 'sfx-win', 0.55)

    if (this.level.goal.kind === 'chest') {
      this.goalSprite.setTexture('chest-open')
    }

    this.time.delayedCall(900, () => {
      this.scene.start('result')
    })
  }

  // 元素力从神像手里的东西里冒出来：风是水晶球（贴图里在正中间偏上），
  // 岩是右手举在胸前的立方体（偏左）。偏移 = 持物中心 − 本体中心
  private statueHeldOffset(granted: ElementKey) {
    return granted === 'rock' ? { x: -13, y: -3 } : { x: 0, y: -3 }
  }

  // 摆一尊神像：底座 + 造像（风神像再加一对大翅膀），返回造像本体。
  // baseLine 是「底座底面所在的那条线」，也就是脚下的地面顶面。
  // 关卡里的真神像和测试展厅里的展品都走这一个函数，样子才不会走样
  private placeStatue(x: number, baseLine: number, element: ElementKey) {
    const wanted = 'statue-' + element
    const figureKey = this.textures.exists(wanted) ? wanted : 'statue-wind'
    const tint = ELEMENTS[element].color

    const base = this.add.image(x, baseLine, 'statue-base').setDepth(-1)
    // 底座：底面对齐地面线 → 中心 = 地面线 − 半高，顶面 = 地面线 − 全高
    const baseTop = baseLine - base.displayHeight

    base.setY(baseLine - base.displayHeight / 2)

    // 风神像的翅膀直接用风史莱姆那张 wing 贴图放大来摆，
    // 形状、羽线、角度和史莱姆完全一致，只是大号版
    if (element === 'wind') {
      const wings = [
        { offset: -7, originX: 1, angle: -45, flip: true },
        { offset: 7, originX: 0, angle: 45, flip: false },
      ]

      wings.forEach((wing) => {
        this.add
          .image(x + wing.offset, baseTop + STATUE_SEAT - 38, 'wing')
          .setOrigin(wing.originX, 0.5)
          .setFlipX(wing.flip)
          .setAngle(wing.angle)
          .setScale(1.2)
          .setTint(tint)
          .setDepth(-2)
      })
    }

    // 本体站在底座上（底座在后面，所以台面会从袍子/裙摆两侧露出来）
    const figure = this.add.image(x, baseLine, figureKey).setTint(tint)
    // 造像：底面压在底座顶面下面一点（压 5 像素），做出"下托上"的坐实感
    figure.setY(baseTop + STATUE_SEAT - figure.displayHeight / 2)

    return figure
  }

  // grant = false 时只放动画：不解锁元素、不变身、也不结算
  // （测试关卡的展厅要的就是这个：保留动画，不保留功能）。
  // from 是演出以哪尊神像为中心；展厅里的神像不是 level.statue，得由调用方指过来
  private playStatueScene(granted: ElementKey, grant = true, from?: { x: number; y: number }) {
    if (grant) {
      unlockElement(granted)
    }

    // 演出期间锁操作：物理世界暂停 + 清速度 + 收掉岩柱预览
    this.inputLocked = true
    this.physics.world.pause()
    this.slime.setVelocity(0, 0)
    this.pillarPressed = false
    this.stopPillarPreview()

    // 本关的锁解开了：元素图标那一排会多出一个，Q/E 也能切到它了
    if (grant && this.lockedElement === granted) {
      this.lockedElement = null
    }

    // 演出以神像为中心：没有独立神像时（旧数据）退回用终点
    const source = from ?? this.statueSprite ?? this.goalSprite
    const held = this.statueHeldOffset(granted)
    const heldX = source.x + held.x
    const heldY = source.y + held.y

    this.cameras.main.stopFollow()
    this.cameras.main.pan(
      (this.slime.x + source.x) / 2,
      (this.slime.y + source.y) / 2,
      600,
      'Sine.easeInOut'
    )
    this.cameras.main.zoomTo(1.8, 600, 'Sine.easeInOut')

    const orb = this.add
      .image(heldX, heldY, 'icon-' + granted)
      .setTint(ELEMENTS[granted].color)
      .setDepth(30)
      .setScale(0)

    this.tweens.add({
      targets: orb,
      scale: 1,
      duration: 300,
      onComplete: () => {
        this.tweens.add({
          targets: orb,
          x: this.slime.x,
          y: this.slime.y,
          scale: 1.4,
          duration: 900,
          ease: 'Sine.easeInOut',
          onComplete: () => {
            orb.destroy()
            this.playTransformFlash(granted, grant)
          },
        })
      },
    })
  }

  private playTransformFlash(granted: ElementKey, grant = true) {
    const flash = this.add
      .rectangle(0, 0, 480, 270, 0xffffff)
      .setOrigin(0, 0)
      .setScrollFactor(0)
      .setDepth(60)
      .setAlpha(0)

    this.tweens.add({
      targets: flash,
      alpha: 1,
      duration: 260,
      hold: 80,
      yoyo: true,
      onYoyo: () => {
        if (grant) {
          this.applyElement(granted)
        }
      },
      onComplete: () => {
        flash.destroy()

        // 演出结束，解锁操作、恢复物理世界，再恢复镜头
        this.inputLocked = false
        this.physics.world.resume()

        // 演出结束，镜头恢复到正常跟随和 1 倍缩放
        this.cameras.main.zoomTo(1, 300)
        this.cameras.main.startFollow(this.slime, true, 0.12, 0.12)

        // 只是看演出（测试展厅）：没有宝箱要放、也不进结算界面
        if (!grant) {
          return
        }

        // 神像不是终点：演出结束后，如果这一关的宝箱在等神像，就把宝箱放出来
        if (this.level.goal.after === 'statue') {
          this.time.delayedCall(600, () => {
            this.revealGoal()
          })

          return
        }

        this.time.delayedCall(400, () => {
          this.scene.start('result')
        })
      },
    })
  }

  // 眼睛：颜色用元素的眼珠色；带黑描边的只有岩史莱姆，所以贴图也在这里一起换
  private refreshEyeTint() {
    const eyeKey = this.element === 'rock' ? 'eye-rock' : 'eye'

    this.eyes.forEach((eye) => {
      eye.setTexture(eyeKey)
      eye.setTint(ELEMENTS[this.element].eyeColor)
    })
  }

  // 岩化：换成结晶态，能挡一次造物伤害，到时间或者被打碎才解除。
  // 按 X 只能开、不能关；开完这一轮就进 ARMOR_COOLDOWN 秒冷却
  private setArmored(on: boolean) {
    if (this.armored === on) {
      return
    }

    this.armored = on
    this.armoredTimer = on ? ARMOR_TIME : 0

    if (!on) {
      // 时间到、被打碎、换元素打断，都从这一刻开始算冷却
      this.armorCooldown = ARMOR_COOLDOWN
    }

    this.slimeArt.setTexture(on ? 'slime-rock-armored' : 'slime-' + this.element)
    this.refreshEyeTint()
    this.playArmorShift(on)

    playSfx(this, 'sfx-interact', 0.35)
  }

  // 两种状态切换那一下的动画：白光一闪 + 一圈扩散 + 左右各崩一块石屑
  private playArmorShift(on: boolean) {
    const flash = this.add
      .image(this.slime.x, this.slime.y, 'pixel')
      .setDisplaySize(36, 30)
      .setTint(on ? 0xffd54f : 0xffffff)
      .setAlpha(0.55)
      .setDepth(12)

    this.tweens.add({
      targets: flash,
      displayWidth: 46,
      displayHeight: 38,
      alpha: 0,
      duration: 200,
      onComplete: () => flash.destroy(),
    })

    const ring = this.add
      .image(this.slime.x, this.slime.y, 'blessing')
      .setTint(on ? 0xffd54f : 0x8a7f6a)
      .setAlpha(0.7)
      .setScale(0.2)
      .setDepth(12)

    this.tweens.add({
      targets: ring,
      scale: 1.7,
      alpha: 0,
      duration: on ? 280 : 220,
      onComplete: () => ring.destroy(),
    })

    ;[-1, 1].forEach((dir) => {
      const chip = this.add
        .image(this.slime.x + dir * 10, this.slime.y, 'pixel')
        .setDisplaySize(3, 3)
        .setTint(on ? 0x8a7f6a : 0x4a3f2c)
        .setDepth(12)

      this.tweens.add({
        targets: chip,
        x: chip.x + dir * 24,
        y: chip.y - (on ? 16 : 6),
        alpha: 0,
        duration: 320,
        ease: 'Quad.easeOut',
        onComplete: () => chip.destroy(),
      })
    })
  }

  // 岩造物落点：就是正前方脚下那块地形。从脚底开始往下找，不往上找，
  // 所以头顶有建筑也不会跑到上面去；找不到合适的高度、或者柱身会跟地形撞上，就算不能放
  // 落点：从 PILLAR_OFFSETS 里挑第一个放得下的距离，前面的位置放不下就往人身边挪
  private pillarTarget(): PillarTarget {
    const dir = this.slime.flipX ? -1 : 1
    let last: PillarTarget | null = null

    for (const offset of PILLAR_OFFSETS) {
      const target = this.pillarSpotAt(this.slime.x + dir * offset, this.slime.y)

      if (target.valid) {
        return target
      }

      last = target
    }

    return last ?? this.pillarSpotAt(this.slime.x, this.slime.y)
  }

  // 某一个 x 上能不能立柱子：从脚底往下找地形，不许穿模
  private pillarSpotAt(x: number, slimeY: number): PillarTarget {
    const feet = slimeY + 13
    const landTop = this.pillarLandingY(x, PILLAR_SIZE.width / 2, feet)

    if (landTop === null || landTop - feet > PILLAR_REACH) {
      return { x, landTop: feet, spawnBottom: feet - PILLAR_DROP, valid: false }
    }

    // 柱身这一段不许和别的地形/关着的门重叠，不然会穿模
    const box = {
      left: x - PILLAR_SIZE.width / 2,
      right: x + PILLAR_SIZE.width / 2,
      top: landTop - PILLAR_SIZE.height,
      bottom: landTop,
    }
    let blocked = false
    // 头顶最近的障碍物底边：下落就从它下面开始，免得掉下来的过程从楼板里穿过去
    let ceilingBottom: number | null = null

    const scan = (child: Phaser.GameObjects.GameObject) => {
      const body = (child as Phaser.Physics.Arcade.Sprite).body as Phaser.Physics.Arcade.StaticBody

      if (!body || !body.enable) {
        return
      }

      if (
        box.left < body.right &&
        box.right > body.left &&
        box.top < body.bottom &&
        box.bottom > body.top
      ) {
        blocked = true
      }

      if (body.bottom <= box.top && body.right > box.left && body.left < box.right) {
        ceilingBottom = ceilingBottom === null ? body.bottom : Math.max(ceilingBottom, body.bottom)
      }
    }

    this.platforms.getChildren().forEach(scan)
    this.gates.getChildren().forEach(scan)

    const lowest = ceilingBottom === null ? -Infinity : ceilingBottom + PILLAR_SIZE.height

    return {
      x,
      landTop,
      spawnBottom: Math.min(landTop, Math.max(landTop - PILLAR_DROP, lowest)),
      valid: !blocked,
    }
  }

  // 长按 C：进入预览，正前方立一根半透明的柱子 + 脚下的落点线，松手才真的落柱
  private startPillarPreview() {
    this.pillarCharging = true

    this.pillarGhost?.destroy()
    this.pillarGhost = this.add.image(0, 0, 'rock-pillar').setAlpha(0.45).setDepth(8)

    this.pillarMark?.destroy()
    this.pillarMark = this.add
      .rectangle(0, 0, PILLAR_SIZE.width + 6, 3, 0x74d0b0)
      .setOrigin(0.5)
      .setDepth(8)

    this.pillarGhost.setScale(1, 0.6)

    this.tweens.add({
      targets: this.pillarGhost,
      scaleY: 1,
      duration: 140,
      ease: 'Quad.easeOut',
    })
  }

  private stopPillarPreview() {
    this.pillarCharging = false
    this.pillarGhost?.destroy()
    this.pillarMark?.destroy()
    this.pillarGhost = null
    this.pillarMark = null
  }

  // 预览每帧更新：位置跟着史莱姆走，合法是绿线、放不下整根变红
  private updatePillarPreview() {
    if (!this.pillarCharging || !this.pillarGhost || !this.pillarMark) {
      return
    }

    const target = this.pillarTarget()

    this.pillarGhost.setPosition(target.x, target.landTop - PILLAR_SIZE.height / 2)
    this.pillarGhost.setTint(target.valid ? 0xffffff : 0xff6b6b)

    this.pillarMark.setPosition(target.x, target.landTop)
    this.pillarMark.setFillStyle(target.valid ? 0x74d0b0 : 0xff6b6b)
  }

  // 落柱：合法就砸下来并返回 true，不合法就提示一声
  private castPillar(): boolean {
    const target = this.pillarTarget()

    if (!target.valid) {
      this.showMessage('这里放不下石柱')
      return false
    }

    this.spawnRockPillar(target.x, target.landTop, target.spawnBottom)

    return true
  }

  // ── 雷闪（X）───────────────────────────────────────────────
  // 手机上按着按钮的那根手指抬起来（哪怕拖到按钮外面）
  private onGlobalPointerUp(pointer: Phaser.Input.Pointer) {
    if (this.blinkPointerId >= 0 && pointer.id === this.blinkPointerId) {
      this.blinkPointerId = -1
      this.touchArmorUp = true
    }
  }

  private cancelBlinkHold() {
    this.blinkHeld = false
    this.blinkHold = 0
    this.stopBlinkAim()
  }

  // 进入瞄准：人缩成一颗雷球定在原地，前面画一条虚线指到落点
  private startBlinkAim() {
    if (this.blinkAiming) {
      return
    }

    this.blinkAiming = true
    this.blinkDir = { x: this.slime.flipX ? -1 : 1, y: 0 }

    // 长按期间人不动：连重力一起关掉，空中长按也悬在那儿，方便瞄准
    const body = this.slime.body as Phaser.Physics.Arcade.Body

    body.setAllowGravity(false)
    this.slime.setVelocity(0, 0)

    this.slimeArt.setTexture('thunder-ball')
    this.eyes.forEach((eye) => eye.setVisible(false))
    this.rockCrown.setVisible(false)
    this.thunderRod.setVisible(false)
    this.polarityMark.setVisible(false)
    this.thunderFx.clear()

    this.blinkGhost?.destroy()
    this.blinkGhost = this.add.image(0, 0, 'thunder-ball').setAlpha(0.45).setDepth(8)

    this.blinkGfx?.destroy()
    this.blinkGfx = this.add.graphics().setDepth(8)
  }

  private stopBlinkAim() {
    if (!this.blinkAiming) {
      return
    }

    this.blinkAiming = false

    const body = this.slime.body as Phaser.Physics.Arcade.Body

    body.setAllowGravity(true)

    this.slimeArt.setTexture('slime-' + this.element)
    this.eyes.forEach((eye) => eye.setVisible(true))
    this.refreshThunderLook()

    this.blinkGhost?.destroy()
    this.blinkGhost = null
    this.blinkGfx?.destroy()
    this.blinkGfx = null
  }

  // 瞄准每帧更新：方向 = 从史莱姆指向鼠标 / 手指按着的地方，吸到八个方向之一
  private updateBlinkAim() {
    if (!this.blinkAiming || !this.blinkGhost || !this.blinkGfx) {
      return
    }

    const world = this.input.activePointer.positionToCamera(
      this.cameras.main
    ) as Phaser.Math.Vector2
    const dx = world.x - this.slime.x
    const dy = world.y - this.slime.y

    if (Math.hypot(dx, dy) > BLINK_AIM_DEAD) {
      const oct = Math.round(Math.atan2(dy, dx) / (Math.PI / 4))
      const angle = oct * (Math.PI / 4)

      this.blinkDir = { x: Math.round(Math.cos(angle)), y: Math.round(Math.sin(angle)) }
    }

    const landing = this.blinkLanding(this.blinkDir.x, this.blinkDir.y)

    this.blinkGhost.setPosition(landing.x, landing.y)
    this.blinkGhost.setTint(landing.ok ? 0xd9c9ff : 0xff6b6b)

    // 从人指到落点的一串点
    this.blinkGfx.clear()
    this.blinkGfx.fillStyle(landing.ok ? 0xb388ff : 0xff6b6b, 0.85)

    const steps = 7

    for (let i = 1; i < steps; i++) {
      const t = i / steps

      this.blinkGfx.fillCircle(
        Phaser.Math.Linear(this.slime.x, landing.x, t),
        Phaser.Math.Linear(this.slime.y, landing.y, t),
        2
      )
    }
  }

  // 落点：先按指定方向算 90 像素，压进实心块里就往旁边挤；
  // 整堵墙都塞不下（落点在厚墙里面）就顺着方向再往前探一段，从墙那头穿出来
  private blinkLanding(dirX: number, dirY: number) {
    const body = this.slime.body as Phaser.Physics.Arcade.Body
    const halfW = body.halfWidth
    const halfH = body.halfHeight

    const nudges: Array<[number, number]> = [
      [0, 0],
      [0, -8],
      [0, -16],
      [0, -24],
      [0, -32],
      [0, -40],
      [0, 8],
      [0, 16],
      [0, 24],
      [-8, 0],
      [8, 0],
      [-16, 0],
      [16, 0],
      [-24, 0],
      [24, 0],
    ]

    for (let step = 1; step <= 4; step++) {
      const x = Phaser.Math.Clamp(
        this.slime.x + dirX * BLINK_DIST * step,
        halfW + 2,
        this.level.width - halfW - 2
      )
      const y = Phaser.Math.Clamp(
        this.slime.y + dirY * BLINK_DIST * step,
        halfH + 2,
        this.level.height - halfH - 2
      )

      for (const [ox, oy] of nudges) {
        const cx = Phaser.Math.Clamp(x + ox, halfW + 2, this.level.width - halfW - 2)
        const cy = Phaser.Math.Clamp(y + oy, halfH + 2, this.level.height - halfH - 2)

        if (this.blinkSpotFree(cx, cy, halfW, halfH)) {
          // 方向是斜的：只承认第一次试探，不做"越撞越远"那套
          return { x: cx, y: cy, ok: true }
        }
      }

      if (dirX !== 0 && dirY !== 0) {
        break
      }
    }

    return { x: this.slime.x, y: this.slime.y, ok: false }
  }

  // 这个位置能不能站人：和地形、关着的门、岩柱都不许重叠
  private blinkSpotFree(cx: number, cy: number, halfW: number, halfH: number) {
    const box = {
      left: cx - halfW,
      right: cx + halfW,
      top: cy - halfH,
      bottom: cy + halfH,
    }
    let hit = false

    const scan = (child: Phaser.GameObjects.GameObject) => {
      const body = (child as Phaser.Physics.Arcade.Sprite).body as Phaser.Physics.Arcade.StaticBody

      if (!body || !body.enable) {
        return
      }

      if (
        box.left < body.right &&
        box.right > body.left &&
        box.top < body.bottom &&
        box.bottom > body.top
      ) {
        hit = true
      }
    }

    this.platforms.getChildren().forEach(scan)
    this.gates.getChildren().forEach(scan)
    this.pillars.getChildren().forEach(scan)

    // 拱形土坡**也相当于地面**：落点压在弧面以下（＝钻进土里）就不算空位，
    // 不然雷史莱姆一格闪就穿到山体里去了（用户 2026/10/16 定）
    ;(this.level.slopes ?? []).forEach((def) => {
      const surface = this.slopeSurfaceAt(def, cx)

      if (surface !== null && box.bottom > surface + 2) {
        hit = true
      }
    })

    return !hit
  }

  // 观礼之前封着的那道墙：雷闪平时能穿障碍，唯独这一道不许穿过去 ——
  // 沿着闪的轨迹一米一米地比一下，只要中途和封门那块实体碰上就算穿不过去
  private blinkSealedBlocked(dirX: number, dirY: number) {
    const seal = this.terraceSeal

    if (!seal) {
      return false
    }

    const sealBody = seal.body as Phaser.Physics.Arcade.StaticBody
    const body = this.slime.body as Phaser.Physics.Arcade.Body
    const halfW = body.halfWidth
    const halfH = body.halfHeight

    for (let t = 0.15; t <= 1.001; t += 0.05) {
      const cx = this.slime.x + dirX * BLINK_DIST * t
      const cy = this.slime.y + dirY * BLINK_DIST * t

      if (
        cx - halfW < sealBody.right &&
        cx + halfW > sealBody.left &&
        cy - halfH < sealBody.bottom &&
        cy + halfH > sealBody.top
      ) {
        return true
      }
    }

    return false
  }

  private castBlink(dirX: number, dirY: number) {
    if (this.blinkLockout > 0) {
      return
    }

    if (this.blinkCharges <= 0) {
      this.showMessage('雷闪还没充好')
      return
    }

    if (this.blinkSealedBlocked(dirX, dirY)) {
      this.showMessage('券门还没开，闪不过去')
      return
    }

    const landing = this.blinkLanding(dirX, dirY)

    if (!landing.ok) {
      this.showMessage('那边闪不过去')
      return
    }

    this.blinkCharges -= 1
    this.blinkLockout = BLINK_LOCKOUT
    // 位移期间免疫一切伤害（撞岩刺、掉进危险区、被崩塌追上都不算）
    this.invulnTimer = Math.max(this.invulnTimer, BLINK_INVULN)

    const fromX = this.slime.x
    const fromY = this.slime.y
    const body = this.slime.body as Phaser.Physics.Arcade.Body

    // 闪现 = 直接挪过去，中间那些墙一概不参与碰撞，所以"穿过障碍"是白送的
    body.reset(landing.x, landing.y)
    this.slimeArt.setPosition(landing.x, landing.y)

    this.spawnBlinkTrail(fromX, fromY, landing.x, landing.y)
    // 还没有专属音效文件，先拿交互音提一档顶上（等挑了电击音再换）
    playSfx(this, 'sfx-interact', 0.35, 1.6)
    this.refreshHud()
  }

  // 身后拖几道残影
  private spawnBlinkTrail(fromX: number, fromY: number, toX: number, toY: number) {
    for (let i = 1; i <= 4; i++) {
      const t = i / 5
      const ghost = this.add
        .image(
          Phaser.Math.Linear(fromX, toX, t),
          Phaser.Math.Linear(fromY, toY, t),
          'slime-' + this.element
        )
        .setScale(this.slimeArt.scaleX, this.slimeArt.scaleY)
        .setTint(0xb388ff)
        .setAlpha(0.55)
        .setDepth(9)

      this.tweens.add({
        targets: ghost,
        alpha: 0,
        scaleX: ghost.scaleX * 0.75,
        scaleY: ghost.scaleY * 0.75,
        duration: 240,
        onComplete: () => ghost.destroy(),
      })
    }
  }

  // 电荷：只有「横向在动」才充（地上跑、空中横着走都算），站着不动一点电都攒不到
  // （用户设定）。不动的时候只是暂停计时，跑来跑去攒的进度保留着
  private updateBlinkCharges(dt: number) {
    if (this.blinkLockout > 0) {
      this.blinkLockout -= dt
    }

    // 满了就不用再攒；瞄准时人是被冻住的，也不算在移动
    if (this.blinkCharges >= BLINK_CHARGE_MAX || this.blinkAiming) {
      this.blinkChargeTimer = 0
      return
    }

    // 判「在移动」只看横向速度：跳起来在空中横着走 / 飘着也算，
    // 原地不动（哪怕在空中垂直下落）就不充
    const speed = Math.abs((this.slime.body as Phaser.Physics.Arcade.Body).velocity.x)

    if (speed < 10) {
      return
    }

    this.blinkChargeTimer += dt

    if (this.blinkChargeTimer >= BLINK_CHARGE_TIME) {
      this.blinkChargeTimer = 0
      this.addBlinkCharge()
    }
  }

  private addBlinkCharge() {
    if (this.blinkCharges >= BLINK_CHARGE_MAX) {
      return
    }

    this.blinkCharges += 1
    this.refreshHud()
  }

  // 电能格：满的那几格是满的，正在充的那格按进度从左边慢慢涨 ——
  // 不是"啪"地亮一格，所以每帧都要刷一次
  private updateChargeHud() {
    const progress = this.chargeFraction()

    this.chargeCells.forEach((cell, index) => {
      const full = index < this.blinkCharges
      const amount = full ? 1 : index === this.blinkCharges ? progress : 0

      if (amount <= 0 || !this.chargeBattery.visible) {
        cell.setVisible(false)
        return
      }

      cell.setVisible(true)
      cell.setDisplaySize(Math.max(1, 8 * amount), 10)
      cell.setTint(full ? 0xd9c9ff : 0xa07bff)
    })
  }

  // 正在充的那一格充到哪儿了（满电时算 0：没有"正在充的那一格"）
  private chargeFraction() {
    if (this.blinkCharges >= BLINK_CHARGE_MAX) {
      return 0
    }

    return Phaser.Math.Clamp(this.blinkChargeTimer / BLINK_CHARGE_TIME, 0, 1)
  }

  // ── 雷鸣（C）───────────────────────────────────────────────
  // 雷鸣攒好了没有：好了头上的雷极是黄紫的、身上也是黄紫渐变；
  // 刚放完（冷却中）整套只剩紫色，远远一眼就能看出能不能放
  private thunderReady() {
    return this.thunderCooldown <= 0
  }

  private refreshThunderLook() {
    if (this.element !== 'thunder' || this.blinkAiming) {
      return
    }

    const ready = this.thunderReady()

    this.slimeArt.setTexture(ready ? 'slime-thunder' : 'slime-thunder-cd')
    this.thunderRod.setTexture(ready ? 'thunder-rod' : 'thunder-rod-cd')
  }

  // 身上的电：雷鸣攒好了是几道小闪电，冷却中是噼啪的静电点；
  // 雷极尖端每隔一会儿闪一下正极 / 负极
  private updateThunderFx(dt: number) {
    if (this.element !== 'thunder' || this.blinkAiming) {
      this.thunderFx.clear()
      this.polarityMark.setVisible(false)
      return
    }

    this.thunderFxTimer -= dt

    if (this.thunderFxTimer <= 0) {
      this.thunderFxTimer = 0.09
      this.thunderFx.clear()

      const cx = this.slime.x
      const cy = this.slime.y

      if (this.thunderReady()) {
        // 闪电：从头顶往身体两侧劈几道短短的折线
        for (let i = 0; i < 3; i++) {
          const fromX = cx + Phaser.Math.Between(-10, 10)
          const fromY = cy - Phaser.Math.Between(12, 18)
          const toX = fromX + Phaser.Math.Between(-16, 16)
          const toY = fromY + Phaser.Math.Between(10, 20)
          const midX = (fromX + toX) / 2 + Phaser.Math.Between(-4, 4)
          const midY = (fromY + toY) / 2
          const trace = () => {
            this.thunderFx.beginPath()
            this.thunderFx.moveTo(fromX, fromY)
            this.thunderFx.lineTo(midX, midY)
            this.thunderFx.lineTo(toX, toY)
            this.thunderFx.strokePath()
          }

          this.thunderFx.lineStyle(3, 0xf2c14e, 0.3)
          trace()
          this.thunderFx.lineStyle(1.4, 0xfff3d0, 0.9)
          trace()
        }
      } else {
        // 静电：身体边上跳几粒小点
        for (let i = 0; i < 6; i++) {
          const angle = Phaser.Math.FloatBetween(0, Math.PI * 2)

          this.thunderFx.fillStyle(0xd9c9ff, Phaser.Math.FloatBetween(0.4, 0.95))
          this.thunderFx.fillCircle(
            cx + 16 * Math.cos(angle),
            cy + 12 * Math.sin(angle),
            Phaser.Math.Between(1, 2)
          )
        }
      }
    }

    this.polarityTimer -= dt

    if (this.polarityTimer <= 0) {
      if (this.polarityMark.visible) {
        this.polarityMark.setVisible(false)
        this.polarityTimer = Phaser.Math.FloatBetween(0.7, 1.4)
      } else {
        const plus = Math.random() < 0.5

        this.polarityMark
          .setTexture(plus ? 'polarity-plus' : 'polarity-minus')
          .setTint(plus ? 0xffe066 : 0xd9c9ff)
          .setVisible(true)
        this.polarityTimer = 0.45
      }
    }
  }

  private castThunder() {
    if (this.thunderCooldown > 0) {
      this.showMessage('雷鸣还在充能')
      return
    }

    this.thunderCooldown = THUNDER_COOLDOWN
    this.refreshThunderLook()

    const dirX = this.slime.flipX ? -1 : 1
    const originX = this.slime.x
    const originY = this.slime.y

    THUNDER_STEPS.forEach((step, index) => {
      this.time.delayedCall(index * THUNDER_GAP * 1000, () => {
        if (this.dying || this.finished) {
          return
        }

        this.strikeThunder(originX + dirX * step, originY)
      })
    })
  }

  // 一道雷：从天上一路折线劈到地面，命中的雷元素物件按"用雷元素碰了一下"算
  private strikeThunder(x: number, baseY: number) {
    // 落点往最近的目标（方碑 / 魔物）吸一点：差几个像素不该判空
    let targetX = x
    let best = THUNDER_SNAP

    this.monumentList.forEach((monument) => {
      const distance = Math.abs(monument.pillar.x - x)

      if (distance < best) {
        best = distance
        targetX = monument.pillar.x
      }
    })

    this.monsterList.forEach((monster) => {
      const distance = Math.abs(monster.sprite.x - x)

      if (distance < best) {
        best = distance
        targetX = monster.sprite.x
      }
    })

    const top = baseY - 230
    const bottom = baseY + 32
    const points: Array<[number, number]> = [[targetX, top]]
    let y = top

    while (y < bottom) {
      y = Math.min(bottom, y + 18)
      points.push([targetX + Phaser.Math.Between(-7, 7), y])
    }

    const bolt = this.add.graphics().setDepth(7)
    const stroke = (width: number, color: number, alpha: number) => {
      bolt.lineStyle(width, color, alpha)
      bolt.beginPath()
      bolt.moveTo(points[0][0], points[0][1])

      for (let i = 1; i < points.length; i++) {
        bolt.lineTo(points[i][0], points[i][1])
      }

      bolt.strokePath()
    }

    // 外面那圈别太扎眼：淡紫、细一点、透明度低一点，像一层晕开的光
    stroke(4, 0xb388ff, 0.2)
    stroke(2, 0xe6dcff, 0.9)

    const flash = this.add
      // 光柱的宽度就是判定宽度：一眼能看出这一片都在雷里
      .rectangle(targetX, (top + bottom) / 2, THUNDER_HIT_W * 2, bottom - top, 0xd9c9ff, 0.12)
      .setDepth(7)

    this.tweens.add({
      targets: [bolt, flash],
      alpha: 0,
      duration: 260,
      onComplete: () => {
        bolt.destroy()
        flash.destroy()
      },
    })

    // 先借落地音当"轰"的一声，等挑了雷电音效再换
    playSfx(this, 'sfx-land', 0.3, 1.4)

    // 命中：只有"要雷元素的"东西才吃这一下（方碑点亮 / 翻邻居那套完全复用触碰逻辑）
    this.monumentList.forEach((monument) => {
      if (monument.hidden || monument.lit || monument.element !== 'thunder') {
        return
      }

      if (Math.abs(monument.pillar.x - targetX) <= THUNDER_HIT_W) {
        this.touchMonument(monument)
      }
    })

    // 魔物：雷劈不死，只眩晕（晕的这几秒它不动，玩家碰到它也不会死）
    this.monsterList.forEach((monster) => {
      if (Math.abs(monster.sprite.x - targetX) > THUNDER_HIT_W) {
        return
      }

      if (monster.stun <= 0) {
        playSfx(this, 'sfx-interact', 0.3, 0.8)
      }

      monster.stun = THUNDER_STUN
      monster.sprite.setTint(0xc8b4ff)
      monster.stunMark.setVisible(true).setPosition(monster.sprite.x, monster.sprite.y - 50)
    })
  }

  // ── 魔物 ──────────────────────────────────────────────────
  private buildMonsters() {
    this.monsterList = []

    ;(this.level.monsters ?? []).forEach((def) => {
      const sprite = this.add.image(def.x, def.y, 'monster-brute').setOrigin(0.5, 1).setDepth(4)
      const stunMark = this.add
        .image(def.x, def.y - 50, 'monster-stun')
        .setDepth(5)
        .setVisible(false)

      this.monsterList.push({ def, sprite, stunMark, dir: 1, stun: 0 })
    })
  }

  // ── 千岩军与潜行 ────────────────────────────────────────────
  // 港口打包用：某一列脚下最高的那块平台顶面（那一列没有平台就退回关卡底部往上 40）
  private harborGroundAt(x: number) {
    let best = Number.POSITIVE_INFINITY

    this.level.platforms.forEach((item) => {
      // 叠在地形上的道具（屋檐 / 木箱 / 断桥）不算"落脚线"，
      // 不然背景里挂着的房子会跟着它们往上飘
      if (item.overlay) {
        return
      }

      const top = item.y - item.height / 2

      if (x >= item.x - item.width / 2 && x <= item.x + item.width / 2 && top < best) {
        best = top
      }
    })

    return Number.isFinite(best) ? best : this.level.height - 40
  }

  // ── 玉京台左半边：请仙典仪的广场 ──────────────────────────────
  // 近处这一层全在这里：广场地面（斜着看是个圆）、后沿矮围栏、长方形祭坛 +
  // 坛上的金银珠宝水果、主事的凝光（站在祭坛前面）、左右两个仆从，
  // 还有围一圈看热闹的史莱姆。层数安排：
  //   **关键**：这一关的史莱姆会换层（树前层 9~11、树后层 1.05~1.3），
  //   所以台面上的静物一律要落在 **0.1~0.9** 这一档（平台本体 0 之上、后层玩家 1.05 之下），
  //   这样玩家不管在哪一层都站在它们前面 —— 否则后层玩家(1.2)会被广场压在下面。
  //   **走线＝平台前沿**（前几关一样，护栏也压在这条线上）。
  //   走线往上：顶面那一小节 0.12 → 翻边 0.16 → 广场圆 0.3 → 围栏 0.31 →
  //   背景里的围观 0.37~0.49 → 靠走线的两只/祭坛 0.63 → 坛上的东西 0.64 →
  //   仆从 0.64 → 凝光 0.67 → 拱门背面 0.75（全部 < 1.05，玩家站在它们前面）；
  //   再往里是背景景：连廊 -5、大殿 -7
  private buildTerracePlaza(cx: number, top: number) {
    // ── 台面按「一个立方的上底」画 ────────────────────────────────
    // 全局规则：走线＝平台前沿（护栏、沿口都压在这条线上）。
    // 玉京台是个长方体：**上底是梯形** —— 远边比近边窄、两条棱线朝消失点收；
    // 上底靠人这条棱就是下面立面的上沿（等宽、两侧竖直，也就是台体那面砖墙）；
    // 贴着地面的**下底看不见**，所以这里只画上底和正立面。
    //
    // 三个数定死这套透视：
    //   视平线＝走线上方 180；相机到台面前沿 900；台面前沿宽 2300（2300~4600）
    //   s(z)    = 900 ÷ (z + 900)                     越深越小
    //   y(z)    = 视平线 + 180 × s(z)                 越深越往上
    //   x(x0,z) = 消失点 + (x0 − 消失点) × s(z)        横向也朝消失点收
    // 消失点取广场中线（局部消失点）：横向卷轴里画面要跟着镜头走，用全局消失点
    // 地面会"游"；按每块地自己的中线收，看着才是"这块地往远处去"。
    const horizonY = top - 180
    const camDist = 900
    const sOf = (z: number) => camDist / (z + camDist)
    const yOf = (z: number) => horizonY + (top - horizonY) * sOf(z)
    const zOf = (y: number) => camDist * ((top - horizonY) / (y - horizonY) - 1)
    const xAt = (x0: number, z: number) => cx + (x0 - cx) * sOf(z)
    const depthAt = (z: number) => 0.3 + sOf(z) * 0.45

    const nearL = 2300
    const nearR = 4600
    const farZ = 500
    const farY = yOf(farZ)

    const surf = this.add.graphics().setDepth(0.12)

    // ① 上底：梯形（近边压在走线上，远边收窄）
    surf.fillStyle(0xb8ae98, 1)
    surf.fillPoints(
      [
        new Phaser.Math.Vector2(nearL, top),
        new Phaser.Math.Vector2(nearR, top),
        new Phaser.Math.Vector2(xAt(nearR, farZ), farY),
        new Phaser.Math.Vector2(xAt(nearL, farZ), farY),
      ],
      true
    )
    // 远处压淡一档（空气透视）
    const midZ = 280
    const midY = yOf(midZ)
    surf.fillStyle(0xc6bda9, 1)
    surf.fillPoints(
      [
        new Phaser.Math.Vector2(xAt(nearL, midZ), midY),
        new Phaser.Math.Vector2(xAt(nearR, midZ), midY),
        new Phaser.Math.Vector2(xAt(nearR, farZ), farY),
        new Phaser.Math.Vector2(xAt(nearL, farZ), farY),
      ],
      true
    )

    // ② 石板缝：横向几条（等深一圈）+ 纵向棱线向消失点收
    for (const z of [100, 200, 300, 400]) {
      surf.lineStyle(2, 0x9a907c, 1)
      surf.lineBetween(xAt(nearL, z), yOf(z), xAt(nearR, z), yOf(z))
    }
    surf.lineStyle(2, 0x9a907c, 1)
    for (let x = nearL; x <= nearR; x += 50) {
      surf.lineBetween(x, top, xAt(x, farZ), farY)
    }

    // ③ 广场圆：直径 500、圆心在深度 250 —— 近边正好压在走线上。
    //    逐行算半宽：圆的深处被压扁、横向也被 s 收，所以它是"透镜形"，
    //    不是正椭圆 —— 硬币平放在地上、斜着看就是这个样子
    const plazaX = cx
    const plazaZ = 250
    const plazaR = 250

    const halfAt = (z: number, r: number) => {
      const dz = z - plazaZ
      const v = r * r - dz * dz
      return v > 0 ? Math.sqrt(v) : 0
    }

    const band = (z: number, y: number, rOut: number, rIn: number, color: number) => {
      const o = halfAt(z, rOut)

      if (o <= 0) {
        return
      }

      const i = halfAt(z, rIn)
      const s = sOf(z)
      const rowX = xAt(plazaX, z)

      surf.fillStyle(color, 1)

      if (i <= 0) {
        surf.fillRect(rowX - o * s, y, o * 2 * s, 1)
      } else {
        surf.fillRect(rowX - o * s, y, (o - i) * s, 1)
        surf.fillRect(rowX + i * s, y, (o - i) * s, 1)
      }
    }

    for (let y = Math.ceil(farY); y <= top; y++) {
      const z = zOf(y)

      if (halfAt(z, plazaR) <= 0) {
        continue
      }

      band(z, y, plazaR, plazaR * 0.9, 0x8f8570)          // 外圈石沿
      band(z, y, plazaR * 0.9, plazaR * 0.86, 0xd3cbb8)   // 亮石
      band(z, y, plazaR * 0.86, plazaR * 0.82, 0x4fae95)  // 玉纹圈
      band(z, y, plazaR * 0.62, plazaR * 0.6, 0xd9a441)   // 金圈
      band(z, y, plazaR * 0.16, 0, 0x4fae95)              // 中心玉盘
    }

    // ④ 台面前沿那道翻边（上底靠人这条棱，也是立面的上沿）
    for (let x = 2850; x <= 4050; x += 400) {
      this.add.image(x, top, 'terrace-paving').setOrigin(0.5, 0).setDepth(0.16)
    }

    // ⑤ 隔断墙：立在 x=3450 的平面上、从走线一直铺满整个进深，把左右两半隔开，
    //    靠人这一头开着拱门（门就是墙上的洞，人从洞里过去）。墙的远近同样按投影收：
    //    近端 3450、远端 xAt(3450, 500)=3307，顶边也跟着降（210 → 135）
    const wallX = 3450
    this.plazaWallX = wallX
    const doorZ = 130          // 券门的洞宽（沿着墙的进深方向）
    // 门洞净高：**从地面往上量**。史莱姆体型 26，这里给 32 ——
    // 门楣正好擦着头顶过去，跳起来就被"门上方那块墙"挡住
    const springH = 32
    const archR = doorZ / 2    // 券的半径（半圆券，半径=洞宽的一半）
    const apexH = springH + archR  // 券顶（68 + 65 = 133）
    const wallTopH = 250       // 墙高（券顶上面还留一截，放门额）
    const wallT = 40           // 墙厚（改回之前的值）
    // 只有"门上方那块墙"最后要变成一张贴图（盖进 RenderTexture、擦透视洞），
    // 所以它需要"画框内的局部坐标"；墙上其余部分直接画在场景里，用世界坐标。
    // 画框要能装下整面墙：x 3270~3530、y 600~930
    const wallL = 3270
    const wallTp = 600
    const wall = this.add.graphics()
    // 只有"门上方那块墙"要挡人（而且是挡史莱姆当前图层里的那个人），所以它单独画一张图，
    // 盖到玩家前面去；墙上其余的部分（往远处退的墙面、压顶、墙裙、线脚、门额、洞里的暗色）
    // 都只是背景画面，直接画在场景里就行
    const gateTop = this.add.graphics()

    // 墙面上任一点：**离地高度 h**、深度 z → 屏幕。
    // 基准就是地面：yOf(z) 是"台面上底在这个深度上的那条线"，和广场上的人群、祭坛、
    // 围栏用的是同一个函数 —— 墙就站在那条线上，不许自己往下沉。
    // 所有贴着墙面的东西都画在**近面**（wallX − 墙厚/2）上，端面、券石圈再各自按近/远两面算
    const wpX = (x0: number, h: number, z: number) =>
      new Phaser.Math.Vector2(xAt(x0, z), yOf(z) - h * sOf(z))
    const wp = (h: number, z: number) => wpX(wallX - wallT / 2, h, z)
    // 门楣那块用的局部坐标（画框内）
    const gpX = (x0: number, h: number, z: number) => {
      const p = wpX(x0, h, z)

      return new Phaser.Math.Vector2(p.x - wallL, p.y - wallTp)
    }
    const quad = (h0: number, h1: number, z0: number, z1: number, color: number) => {
      wall.fillStyle(color, 1)
      wall.fillPoints([wp(h0, z0), wp(h0, z1), wp(h1, z1), wp(h1, z0)], true)
    }

    // 券线：t 从 0 走到 1 —— 从一侧起券点绕过券顶到另一侧
    const arcPt = (t: number, r: number) => {
      const a = Math.PI * t
      return { z: archR - Math.cos(a) * archR, h: springH + Math.sin(a) * r }
    }

    // 主墙（券门往里那一段）
    quad(0, wallTopH, doorZ, farZ, 0xb8ae98)
    // 券门上方那一段墙：下边界就是券线本身
    const above: Phaser.Math.Vector2[] = []
    for (let i = 0; i <= 16; i++) {
      const p = arcPt(i / 16, archR)
      above.push(wp(p.h, p.z))
    }
    wall.fillStyle(0xb8ae98, 1)
    wall.fillPoints([...above, wp(wallTopH, doorZ), wp(wallTopH, 0)], true)

    // ── 立体：墙有厚度（40），所以要看得到顶面、靠人这一头的端面、以及券的厚度 ──
    // 券石圈：同一圈画两遍 —— 靠人这一面（wallX−20）亮一点、里面那一面（wallX+20）暗一点，
    // 两圈错开的就是券的厚度
    const ringAt = (x0: number, rOut: number, rIn: number) => {
      const pts: Phaser.Math.Vector2[] = []
      for (let i = 0; i <= 16; i++) {
        const p = arcPt(i / 16, rOut)
        pts.push(wpX(x0, p.h, p.z))
      }
      for (let i = 16; i >= 0; i--) {
        const p = arcPt(i / 16, rIn)
        pts.push(wpX(x0, p.h, p.z))
      }
      return pts
    }
    // 只画**靠人这一面**的券石圈：里面那一面在墙的另一边，按透视根本看不见，不画
    wall.fillStyle(0xd3cbb8, 1)
    wall.fillPoints(ringAt(wallX - wallT / 2, archR + 12, archR), true)
    wall.lineStyle(2, 0x8f8776, 1)
    wall.strokePoints(ringAt(wallX - wallT / 2, archR + 12, archR), true)

    // 洞口那一段**地面**（隧道的地板）：近边就是玩家走的那条线（880），
    // 远边落在 z=doorZ 处 = 拱门远离镜头那一面和地面的**交线**（856）。
    // 有这两条线，门洞的厚度才看得出来
    wall.fillStyle(0xa89f8a, 1)
    wall.fillPoints(
      [
        wpX(wallX - wallT / 2, 0, 0),
        wpX(wallX + wallT / 2, 0, 0),
        wpX(wallX + wallT / 2, 0, doorZ),
        wpX(wallX - wallT / 2, 0, doorZ),
      ],
      true
    )
    // 远边那条交线单独描深一点
    wall.lineStyle(3, 0x6f6857, 1)
    wall.lineBetween(
      wpX(wallX - wallT / 2, 0, doorZ).x,
      wpX(wallX - wallT / 2, 0, doorZ).y,
      wpX(wallX + wallT / 2, 0, doorZ).x,
      wpX(wallX + wallT / 2, 0, doorZ).y
    )
    // ── 隧道的**内壁**：两端各一条券线，中间填内壁色 ──
    // 近端券线在 x=3430（靠人这一面）、远端券线在 x=3470（另一头，也就是"另一端"）。
    // 两条之间的那一壳就是拱顶内壁；再加上远端那面竖壁（z=doorZ 那个截面），
    // 门洞的厚度和内壁颜色就都出来了
    const nearArc: Phaser.Math.Vector2[] = []
    const farArc: Phaser.Math.Vector2[] = []

    for (let i = 0; i <= 16; i++) {
      const p = arcPt(i / 16, archR)
      nearArc.push(wpX(wallX - wallT / 2, p.h, p.z))
      farArc.push(wpX(wallX + wallT / 2, p.h, p.z))
    }

    // 拱顶内壁（两条券线之间的壳）
    wall.fillStyle(0x8a8272, 1)
    wall.fillPoints([...nearArc, ...farArc.slice().reverse()], true)
    // 券线以下、两块竖壁之间那一块（门洞的"里面"）：先整块填上内墙色 ——
    // 就是近端拱形洞口那一圈轮廓（券线 + 两侧直墙 + 地面），不留没填到的角落
    wall.fillStyle(0x938b7a, 1)
    wall.fillPoints(
      [
        ...nearArc,
        wpX(wallX - wallT / 2, 0, doorZ),
        wpX(wallX - wallT / 2, 0, 0),
      ],
      true
    )
    // 远端那面竖壁（z=doorZ，x 3430~3470，高 0~springH）—— 门洞里边正对镜头的那面墙
    wall.fillStyle(0x7d7666, 1)
    wall.fillPoints(
      [
        wpX(wallX - wallT / 2, 0, doorZ),
        wpX(wallX + wallT / 2, 0, doorZ),
        wpX(wallX + wallT / 2, springH, doorZ),
        wpX(wallX - wallT / 2, springH, doorZ),
      ],
      true
    )
    // 两端券线各描一道：近端深、远端浅（浅的那条就是"另一端的弧线"）
    wall.lineStyle(3, 0x6f6857, 1)
    wall.strokePoints(nearArc, false)
    wall.lineStyle(3, 0x9a907c, 1)
    wall.strokePoints(farArc, false)

    // ── 要挡人的那块：**墙靠人这一头的端面**（z=0 那个截面）──
    // 整块从**地面**（离地 0）画到墙顶（离地 250），所以它的墙脚正好踩在 880 那条线上；
    // 门洞那一段（离地 springH 以下）画成半透明的暗色（看着是门洞，人从里面过能透出影子），
    // 再沿洞口描一圈门框。这块单独盖到玩家前面去，并且擦一个透视洞
    const frameL = gpX(wallX - wallT / 2, 0, 0)
    const frameR = gpX(wallX + wallT / 2, 0, 0)
    const frameT = gpX(wallX, wallTopH, 0)
    const frameDoor = gpX(wallX, springH, 0)

    // 墙靠人这一面用更亮的石色：台面是 0xb8ae98，太接近就分不出"墙"和"地"了
    gateTop.fillStyle(0xd3cbb8, 1)
    gateTop.fillRect(frameL.x, frameT.y, frameR.x - frameL.x, frameR.y - frameT.y)
    // 门洞**不填黑**：只画线条 —— 外框（洞口一圈）+ 内框（往里收一圈）+ 四条角线，
    // 这样门洞里能看见洞的进深，门框和洞壁都是用线描出来的，人也透得过去
    // 门框只画**靠人这一面**：洞口三边（左、右、上）描一圈石框，线压在洞沿**外面**，
    // 因为洞里那一块要被擦成透明的（RT 里静态擦掉），人从洞里过能看见背景和自己。
    // 墙另一边的那个框按透视根本看不见，不画
    const boxW = 3

    gateTop.fillStyle(0xa89f8a, 1)
    gateTop.fillRect(frameL.x - boxW, frameDoor.y - boxW, frameR.x - frameL.x + boxW * 2, boxW) // 上框
    gateTop.fillRect(frameL.x - boxW, frameDoor.y - boxW, boxW, frameR.y - frameDoor.y + boxW)   // 左框
    gateTop.fillRect(frameR.x, frameDoor.y - boxW, boxW, frameR.y - frameDoor.y + boxW)          // 右框
    // 洞口下沿（贴地那一条）也描一道，免得洞口和地面糊在一起
    gateTop.fillStyle(0x8f8776, 1)
    gateTop.fillRect(frameL.x - boxW, frameR.y - 3, frameR.x - frameL.x + boxW * 2, 3)
    // 墙的顶面（40 宽的一条，从近端铺到远端）—— 这一条最能让墙"站"起来
    wall.fillStyle(0xe6dfcd, 1)
    wall.fillPoints(
      [
        wpX(wallX - wallT / 2, wallTopH, 0),
        wpX(wallX + wallT / 2, wallTopH, 0),
        wpX(wallX + wallT / 2, wallTopH, farZ),
        wpX(wallX - wallT / 2, wallTopH, farZ),
      ],
      true
    )
    // 玉瓦压顶 + 墙裙（从券门往里才铺，门洞底下不留门槛）+ 两道线脚（都在门洞之外）
    quad(wallTopH, wallTopH + 16, 0, farZ, 0x2f7f6a)
    quad(0, 22, doorZ, farZ, 0x8f8570)
    quad(130, 136, doorZ, farZ, 0xc6bda9)
    quad(60, 66, doorZ, farZ, 0xc6bda9)
    // 门额：券顶上面一块匾
    quad(apexH + 18, apexH + 52, 24, doorZ - 24, 0xd9a441)

    // 墙脚：沿墙的底边（墙脚踩在台面上的那一条）往镜头这一侧压一道接地影，
    // 再描一条深线 —— 不然墙和台面一个色，看不出墙是从哪儿立起来的
    wall.fillStyle(0x4a3f33, 0.42)
    wall.fillPoints(
      [
        wp(0, 0),
        wp(0, farZ),
        new Phaser.Math.Vector2(wp(0, farZ).x, wp(0, farZ).y + 9),
        new Phaser.Math.Vector2(wp(0, 0).x, wp(0, 0).y + 9),
      ],
      true
    )
    wall.lineStyle(2.5, 0x3a3228, 0.85)
    wall.lineBetween(wp(0, 0).x, wp(0, 0).y, wp(0, farZ).x, wp(0, farZ).y)

    // 墙身上其余的部分：就这样当背景画着（玩家走在它前面）
    wall.setDepth(0.55)

    // "门上方那块墙"生成一张贴图，盖到玩家前面那一层，并在史莱姆身上擦一个透视洞
    gateTop.generateTexture('terrace-gatetop-art', 260, 330)
    gateTop.destroy()

    this.wallBox = { left: wallL, top: wallTp, width: 260, height: 330 }
    // 门洞那块要静态擦成透明的：用一张 40x32 的白块贴图当"橡皮"
    const doorHole = this.make.graphics({ x: 0, y: 0 }, false)

    doorHole.fillStyle(0xffffff, 1)
    doorHole.fillRect(0, 0, wallT, springH)
    doorHole.generateTexture('terrace-doorhole', wallT, springH)
    doorHole.destroy()
    this.wallRT = this.add
      .renderTexture(this.wallBox.left, this.wallBox.top, this.wallBox.width, this.wallBox.height)
      .setOrigin(0, 0)
      .setDepth(12.5)
    this.wallDrawn = { x: -99999, y: -99999 }

    // ④ 门楣的**实体**：只有"门上方那块墙"有碰撞 ——
    //    底边落在门洞净高上（屏幕 848），史莱姆头顶在 854，所以正常走过去能过（头上有 6 像素余量）；
    //    跳起来就会被它顶住，于是只能从券门底下过去。墙身其余部分仍然只是画面，不挡人
    const gateBody = this.platforms.create(
      wallX,
      (top - wallTopH + (top - springH)) / 2,
      'pixel'
    ) as Phaser.Physics.Arcade.Sprite

    gateBody.setDisplaySize(wallT, wallTopH - springH)
    gateBody.setVisible(false)
    gateBody.refreshBody()

    // ⑤ 观礼之前的**封门**：请仙典仪还没演，券门就是不通的 ——
    //    台面上（880）和台面下那条地面通道（1160）一起封，一直堵到墙顶上面一大截（240）：
    //    跳、风元素滑翔、摞岩柱都翻不过去，从底下绕也绕不过去
    //    （墙上头那截是看不见的，纯保险）；
    //    雷闪那套"能穿障碍"也在 blinkSealedBlocked 里单独挡了。
    //    看完那场戏（endRite）把这块拆掉，只剩门楣那块挡人，券门才真正通
    if (!this.riteSeen) {
      const sealTop = top - 640
      const sealBottom = top + 280      // 台体底边 = 地面那条线（1160）
      const sealed = this.platforms.create(
        wallX,
        (sealTop + sealBottom) / 2,
        'pixel'
      ) as Phaser.Physics.Arcade.Sprite

      sealed.setDisplaySize(wallT, sealBottom - sealTop)
      sealed.setVisible(false)
      sealed.refreshBody()
      this.terraceSeal = sealed

      // 光有碰撞看不见：在台体上把这道墙"接"到地面，让人一眼看出这里过不去。
      // 观礼演完和实体一起拆掉
      const sealArt = this.add.graphics().setDepth(0.56)

      sealArt.fillStyle(0xb8ae98, 1)
      sealArt.fillRect(wallX - wallT / 2, top, wallT, sealBottom - top)
      sealArt.fillStyle(0xd3cbb8, 1)
      sealArt.fillRect(wallX - wallT / 2, top, 4, sealBottom - top)
      sealArt.fillStyle(0x6f6857, 1)
      sealArt.fillRect(wallX + wallT / 2 - 4, top, 4, sealBottom - top)

      for (let y = top + 32; y < sealBottom - 12; y += 32) {
        sealArt.fillStyle(0x9a907c, 1)
        sealArt.fillRect(wallX - wallT / 2 + 4, y, wallT - 8, 2)
      }

      this.terraceSealArt = sealArt
    }

    // ⑥ 站在台面上的东西：只写"世界 x + 深度 z"，屏幕位置/大小/层数全由上面三个函数给
    const seat = (x0: number, z: number, key: string, flip = false, lift = 0) => {
      const s = sOf(z)

      return this.add
        .image(xAt(x0, z), yOf(z) - lift, key)
        .setOrigin(0.5, 1)
        .setScale(s)
        .setFlipX(flip)
        .setDepth(depthAt(z))
    }

    // 后沿矮围栏：站在**上底的远边**（深度 500）。两段 370 宽正好铺满左半边的远边
    //（近边 2300~3450 在 z=500 处收到 2568~3307；这里写的是**世界 x**，
    // 两段世界中心 2587 / 3163 首尾相接，投影会把它们摆到 2753 / 3122）
    seat(2587, farZ, 'terrace-pwall')
    seat(3163, farZ, 'terrace-pwall')

    // 围观的：一圈人（世界坐标写在广场圆里面，越深越小、层数越低）
    this.plazaCrowd.push(
      seat(plazaX - 160, 90, 'harbor-slime-a'),
      seat(plazaX - 100, 180, 'harbor-slime-c'),
      seat(plazaX - 60, 270, 'harbor-slime-b'),
      seat(plazaX + 60, 270, 'harbor-slime-d'),
      seat(plazaX + 100, 180, 'harbor-slime-a'),
      seat(plazaX + 160, 90, 'harbor-slime-c'),
      // 最靠人这一侧的两只（最大，仍在人后面）
      seat(plazaX - 130, 40, 'harbor-slime-d'),
      seat(plazaX + 130, 40, 'harbor-slime-b')
    )

    // 祭坛 + 坛上的供品 + 两个仆从 + 主事的凝光（都在靠人这一侧）
    const altar = seat(plazaX, 60, 'terrace-altar')
    const altarScale = sOf(60)

    this.plazaAltar = altar
    this.plazaOffering = this.add
      .image(altar.x, altar.y - 60 * altarScale, 'terrace-offerings')
      .setOrigin(0.5, 1)
      .setScale(altarScale)
      .setDepth(depthAt(60) + 0.01)
    // 龙身摆上去时只比祭坛高 0.001 层 —— 它盖得住祭坛，但必须**还在凝光和仆从后面**
    //（他们站得更靠前，层数是 depthAt(40) / depthAt(50)，都比 depthAt(60) 大）
    this.plazaBreak = { x: altar.x, y: altar.y, scale: altarScale, depth: depthAt(60) }

    this.plazaCrowd.push(
      seat(plazaX - 70, 50, 'npc-attendant'),
      seat(plazaX + 70, 50, 'npc-attendant', true)
    )

    // 祭坛两边各摆一个香炉（用户要的）：三足鼎 + 一缕往上飘的青烟。
    // 摆在 z=45（比祭坛的 z=60 靠前一点），层数自然压在祭坛前面、人后面
    ;[-120, 120].forEach((dx) => {
      const censer = seat(plazaX + dx, 45, 'terrace-censer')

      for (let i = 0; i < 3; i++) {
        const puff = this.add
          .image(censer.x, censer.y - 30 * sOf(45), 'pixel')
          .setDisplaySize(3, 3)
          .setTint(0xe8e2d0)
          .setAlpha(0)
          .setDepth(depthAt(45) + 0.01)

        this.tweens.add({
          targets: puff,
          y: puff.y - 24,
          scale: 2.4,
          alpha: { from: 0.4, to: 0 },
          duration: 2600,
          delay: i * 860,
          repeat: -1,
        })
      }
    })

    this.plazaNing = seat(plazaX, 40, 'npc-ningguang')
    this.plazaCrowd.push(this.plazaNing)

    // 存档里记过"请仙典仪看过了"：这一关直接就是撞毁之后的模样 ——
    // 祭坛换上撞毁的贴图、供品收掉、龙身摆上去（重进不用再看一遍那场戏）
    if (this.riteSeen) {
      this.breakAltar()
    }

    // ⑦ 右半边：池塘 + 水上桥（用户定的"逃跑时潜伏的地方，有池塘和水上桥"）
    //    池塘 = 台面上的一块水面：水面比台面低 pondDrop（离地 −pondDrop），
    //    用和广场圆一样的逐行投影画（远窄近宽）；岸边一圈浅石、水面两道水纹。
    //    桥 = 走线上一条木桥，横跨池塘，人从桥上走过去
    const pondCX = 3980
    const pondCZ = 200
    const pondR = 230
    const pondDrop = 26

    const pond = this.add.graphics().setDepth(0.13)
    const pondHalf = (z: number, r: number) => {
      const dz = z - pondCZ
      const v = r * r - dz * dz

      return v > 0 ? Math.sqrt(v) : 0
    }

    for (let y = Math.ceil(yOf(pondCZ + pondR) + pondDrop * sOf(pondCZ + pondR)); y <= yOf(0) + pondDrop; y++) {
      // 先反解这一行对应的深度 z（水面比台面低 pondDrop，所以用 yOf(z)+pondDrop×s(z) 反解）
      let z = -1

      for (let t = 0; t <= 60; t++) {
        const zz = (t / 60) * (pondCZ + pondR + 20)
        const yy = yOf(zz) + pondDrop * sOf(zz)

        if (yy <= y) {
          z = zz
          break
        }
      }

      if (z < 0) {
        continue
      }

      const s = sOf(z)
      const shore = pondHalf(z, pondR)

      if (shore <= 0) {
        continue
      }

      const cxRow = xAt(pondCX, z)

      // 岸边（浅石）→ 水面
      pond.fillStyle(0xd3cbb8, 1)
      pond.fillRect(cxRow - shore * s, y, shore * 2 * s, 1)
      pond.fillStyle(0x4a7f96, 0.92)
      pond.fillRect(cxRow - shore * s * 0.94, y, shore * 2 * s * 0.94, 1)
      // 两道水纹（按行错开，看着有波光）
      if (y % 9 === 0) {
        pond.fillStyle(0xbfe0e8, 0.5)
        pond.fillRect(cxRow - shore * s * 0.5, y, shore * s * 0.5, 1)
      }
    }

    // 水面最里面那一道岸（远处那一头），补一条深色岸线
    pond.lineStyle(3, 0x8f8776, 1)
    pond.strokePoints(
      (() => {
        const pts: Phaser.Math.Vector2[] = []

        for (let i = 0; i <= 24; i++) {
          const z = pondCZ + pondR * Math.cos((i / 24) * Math.PI - Math.PI / 2)
          const half = Math.abs(pondR * Math.sin((i / 24) * Math.PI - Math.PI / 2))
          const s = sOf(z)

          pts.push(new Phaser.Math.Vector2(xAt(pondCX, z) - half * s, yOf(z) + pondDrop * s))
        }

        return pts
      })(),
      false
    )

    // 水上桥：走线上一条**砖石桥**（和玉京台同一套材质），
    // 两端各砌一块桥台落到岸上（这就是"连接"），桥面压石板缝，靠里一侧一道矮石栏
    const bridgeZ = 40
    const bridgeL = 3700
    const bridgeR = 4260
    const deck = this.add.graphics().setDepth(0.2)

    // 桥面（石板）
    deck.fillStyle(0xb8ae98, 1)
    deck.fillPoints(
      [
        wpX(bridgeL, 0, bridgeZ - 30),
        wpX(bridgeR, 0, bridgeZ - 30),
        wpX(bridgeR, 0, bridgeZ + 30),
        wpX(bridgeL, 0, bridgeZ + 30),
      ],
      true
    )
    // 桥面的石板缝（横着几道 + 顺着走线一条中线）
    for (let i = 0; i <= 8; i++) {
      const x = bridgeL + ((bridgeR - bridgeL) * i) / 8

      deck.fillStyle(0x9a907c, 1)
      deck.fillPoints(
        [
          wpX(x, 0.8, bridgeZ - 30),
          wpX(x + 3, 0.8, bridgeZ - 30),
          wpX(x + 3, 0.8, bridgeZ + 30),
          wpX(x, 0.8, bridgeZ + 30),
        ],
        true
      )
    }
    deck.fillStyle(0xa89f8a, 1)
    deck.fillPoints(
      [
        wpX(bridgeL, 0.8, bridgeZ),
        wpX(bridgeR, 0.8, bridgeZ),
        wpX(bridgeR, 0.8, bridgeZ + 4),
        wpX(bridgeL, 0.8, bridgeZ + 4),
      ],
      true
    )
    // 两端桥台（落到岸上的那一块，把桥和台面"接"起来）
    ;[bridgeL, bridgeR].forEach((x, index) => {
      const dir = index === 0 ? -1 : 1

      deck.fillStyle(0x8f8570, 1)
      deck.fillPoints(
        [
          wpX(x, 0, bridgeZ - 40),
          wpX(x + dir * 60, 0, bridgeZ - 40),
          wpX(x + dir * 60, 0, bridgeZ + 40),
          wpX(x, 0, bridgeZ + 40),
        ],
        true
      )
      deck.fillStyle(0xd3cbb8, 1)
      deck.fillPoints(
        [
          wpX(x, 6, bridgeZ - 40),
          wpX(x + dir * 60, 3, bridgeZ - 40),
          wpX(x + dir * 60, 3, bridgeZ + 40),
          wpX(x, 6, bridgeZ + 40),
        ],
        true
      )
    })
    // 靠里那侧一道矮石栏：立柱 + 横杆（高度砍到 14）
    deck.fillStyle(0x8f8570, 1)
    for (let i = 0; i <= 5; i++) {
      const x = bridgeL + ((bridgeR - bridgeL) * i) / 5

      deck.fillPoints(
        [
          wpX(x - 3, 0, bridgeZ + 26),
          wpX(x + 3, 0, bridgeZ + 26),
          wpX(x + 3, 14, bridgeZ + 26),
          wpX(x - 3, 14, bridgeZ + 26),
        ],
        true
      )
    }
    deck.fillStyle(0xd3cbb8, 1)
    deck.fillPoints(
      [
        wpX(bridgeL, 12, bridgeZ + 26),
        wpX(bridgeR, 12, bridgeZ + 26),
        wpX(bridgeR, 16, bridgeZ + 26),
        wpX(bridgeL, 16, bridgeZ + 26),
      ],
      true
    )

    // ⑧ 台基：台体（台子下面那道墙）和地面用的是**同一套 ruin-brick 贴图**，
    //    不划线完全分不出来、看着就是从上到下的一整块。这里在台体脚下压一条石台基，
    //    再往下在台面上铺几层越远越淡的接地影 —— 台子这才"立"在地面上
    const baseY = top + 280          // 台体底边 = 地面那条线（1160）
    const baseL = nearL - 18
    const baseR = nearR + 18
    const baseW = baseR - baseL

    surf.fillStyle(0x8f8570, 1)                                  // 台基面
    surf.fillRect(baseL, baseY - 30, baseW, 30)
    surf.fillStyle(0xd3cbb8, 1)                                  // 上沿一道亮线
    surf.fillRect(baseL, baseY - 30, baseW, 4)
    surf.fillStyle(0x6f6857, 1)                                  // 下沿一道暗线
    surf.fillRect(baseL, baseY - 6, baseW, 6)
    surf.fillStyle(0x3a3228, 1)                                  // 接地那条最重的线
    surf.fillRect(baseL, baseY - 3, baseW, 3)

    for (let i = 0; i < 6; i++) {                                // 台子投在地上的影子
      surf.fillStyle(0x3a3228, 0.28 - i * 0.042)
      surf.fillRect(baseL, baseY + i * 3, baseW, 3)
    }

    // ⑨ 玉京台的匾额：进、出各一座，立在台面走线上 ——
    //    进 = 左楼梯爬上来的地方（2700），出 = 右楼梯下去的地方（4230）。
    //    匾额是可以穿过去的（不挡人），所以**靠镜头这一侧的右柱单独盖到玩家前面**
    //    （用户定的规矩，和港口的牌楼一样）；「玉京台」三个字是 Text 叠上去的
    const gateScale = 0.8
    const gatePlaqueY = 91                  // 匾心在贴图里离底边多高

    ;[2700, 4230].forEach((gateX) => {
      this.add.image(gateX, top, 'terrace-gate').setOrigin(0.5, 1).setScale(gateScale).setDepth(0.6)
      this.add.image(gateX, top, 'terrace-gate-front').setOrigin(0.5, 1).setScale(gateScale).setDepth(12)

      this.add
        .text(gateX, top - gatePlaqueY * gateScale, '玉京台', {
          fontFamily: 'sans-serif',
          fontSize: '13px',
          color: '#ffe9a8',
        })
        .setOrigin(0.5)
        .setScale(gateScale)
        .setDepth(0.61)
    })
  }

  private buildGuards() {
    this.guardList = []

    const defs = (this.level as LevelDef & { guards?: GuardDef[] }).guards ?? []

    defs.forEach((def) => {
      const sprite = this.add.image(def.x, def.y, 'guard-millelith').setOrigin(0.5, 1).setDepth(4)
      const mark = this.add.image(def.x, def.y - 56, 'alert-mark').setDepth(5).setVisible(false)
      const dir = def.facing ?? 1

      sprite.setFlipX(dir < 0)

      this.guardList.push({ def, sprite, mark, dir, awareness: 0, state: 'patrol', loseTimer: 0 })
    })
  }

  private updateGuards(dt: number) {
    this.guardVisionGfx.clear()
    this.guardAlertGfx.clear()

    // 岩化 + 站着不动 = 一颗石头：他不认，也就不算看见（但已经在追的时候这招没用）
    const body = this.slime.body as Phaser.Physics.Arcade.Body
    const disguised = this.armored && Math.abs(body.velocity.x) < 10

    this.guardList.forEach((guard) => {
      // 岩化静止能骗过巡逻 / 疑惑中的他，但骗不过正在追你的他
      const sees = disguised && guard.state !== 'chase' ? false : this.guardSees(guard)
      const speed = guard.def.speed ?? 26
      const left = guard.def.x - guard.def.range
      const right = guard.def.x + guard.def.range

      if (sees) {
        guard.awareness = Math.min(1, guard.awareness + GUARD_AWARENESS_UP * dt)
        guard.loseTimer = 0
      } else {
        guard.awareness = Math.max(0, guard.awareness - GUARD_AWARENESS_DOWN * dt)
      }

      // 疑惑攒满 = 发现：不管当时在干嘛（巡逻 / 疑惑 / 回程）都转成追击
      if (guard.awareness >= 1 && guard.state !== 'chase') {
        guard.state = 'chase'
        guard.loseTimer = 0
        playSfx(this, 'sfx-interact', 0.5, 0.7)
        this.showMessage('被千岩军发现了！')
      }

      if (guard.state === 'patrol') {
        if (sees) {
          // 一被看见就停下开始疑惑（疑惑期间呆在原地不动）
          guard.state = 'suspicious'
        } else {
          // 巡逻就是巡逻：只在自己那段范围的两头掉头，路上有什么一概不管
          guard.sprite.x += guard.dir * speed * dt

          if (guard.sprite.x <= left) {
            guard.sprite.x = left
            guard.dir = 1
          }

          if (guard.sprite.x >= right) {
            guard.sprite.x = right
            guard.dir = -1
          }
        }
      } else if (guard.state === 'suspicious' || guard.state === 'recover') {
        // 站着不动：疑惑掉到 0 就算完事（疑惑态回巡逻，被挡下来的先回原路线）
        if (guard.awareness <= 0) {
          guard.state = guard.state === 'recover' ? 'return' : 'patrol'
        }
      } else if (guard.state === 'chase') {
        if (sees) {
          guard.loseTimer = 0
        } else {
          guard.loseTimer += dt

          if (guard.loseTimer >= GUARD_LOSE_TIME) {
            guard.loseTimer = 0
            guard.state = 'recover'
          }
        }

        // 前面撞上箱子 / 岩柱就放弃追击：停在原地消疑惑，消完自己回巡逻路线
        if (guard.state === 'chase' && this.guardBlocked(guard)) {
          guard.loseTimer = 0
          guard.state = 'recover'
        } else if (guard.state === 'chase') {
          guard.dir = this.slime.x < guard.sprite.x ? -1 : 1
          guard.sprite.x += guard.dir * GUARD_CHASE_SPEED * dt
        }
      } else {
        // return：走回原巡逻路线上离自己最近的那一点（无视障碍，从图层下方过）
        const homeX = Phaser.Math.Clamp(guard.sprite.x, left, right)

        if (Math.abs(homeX - guard.sprite.x) < 2) {
          guard.sprite.x = homeX
          guard.state = 'patrol'
        } else {
          guard.dir = homeX < guard.sprite.x ? -1 : 1
          guard.sprite.x += guard.dir * GUARD_RETURN_SPEED * dt
        }
      }

      guard.sprite.setFlipX(guard.dir < 0)
      // 回程的时候从图层下方走：压在道具下面，看着像从建筑背后绕回去
      guard.sprite.setDepth(guard.state === 'return' ? 1.5 : 4)

      // 头顶的提示：警觉中一个问号、发现了感叹号
      const showMark = guard.awareness > 0.08

      guard.mark.setVisible(showMark)

      if (showMark) {
        guard.mark
          .setTexture(guard.state === 'chase' ? 'alert-exclaim' : 'alert-mark')
          .setTint(guard.state === 'chase' ? 0xff6b6b : 0xffe066)
          .setPosition(guard.sprite.x, guard.sprite.y - 56)
      }

      this.drawGuardVision(guard)
      this.drawGuardAlert(guard)

      // 正在追你的时候碰到即死（雷闪的无敌能挡，岩壳挡不了）
      if (guard.state !== 'chase' || this.dying || this.finished) {
        return
      }

      const dx = Math.abs(this.slime.x - guard.sprite.x)
      const dy = Math.abs(this.slime.y - (guard.sprite.y - 22))

      if (dx < GUARD_TOUCH && dy < GUARD_TOUCH) {
        this.die('guard')
      }
    })
  }

  // 眼睛的锚点：贴图 46 高，眼睛大致在底边往上 34
  private guardEyeY(guard: GuardRef) {
    return guard.sprite.y - GUARD_EYE_LIFT
  }

  // 视野扇形的中心方向：朝斜下方。dir=1（朝右）是 +50°，dir=-1（朝左）是 180°-50°
  private guardLookAngle(guard: GuardRef) {
    const center = (GUARD_VISION.center * Math.PI) / 180

    return guard.dir > 0 ? center : Math.PI - center
  }

  // 前面一步远的地方有没有实心东西（箱子、岩柱、关着的门都算）
  private guardBlocked(guard: GuardRef) {
    const ahead = guard.sprite.x + guard.dir * 22

    return this.solidAt(ahead, guard.sprite.y - 24) || this.solidAt(ahead, guard.sprite.y - 6)
  }

  private guardSees(guard: GuardRef) {
    // 离太远直接不算（省得每帧给每个守卫做一遍连线判定）
    if (Math.abs(this.slime.x - guard.sprite.x) > GUARD_VISION.range + 60) {
      return false
    }

    const range = guard.def.vision ?? GUARD_VISION.range
    const eyeY = this.guardEyeY(guard)
    const dx = this.slime.x - guard.sprite.x
    const dy = this.slime.y - eyeY
    const distance = Math.hypot(dx, dy)

    if (distance > range) {
      return false
    }

    const diff = Math.abs(Phaser.Math.Angle.Wrap(Math.atan2(dy, dx) - this.guardLookAngle(guard)))

    if (diff > (GUARD_VISION.halfAngle * Math.PI) / 180) {
      return false
    }

    return this.sightClear(guard.sprite.x, eyeY, this.slime.x, this.slime.y)
  }

  // 眼睛到史莱姆之间有没有实心东西挡着：箱子、墙、关着的门都能当掩体
  private sightClear(fromX: number, fromY: number, toX: number, toY: number) {
    const dx = toX - fromX
    const dy = toY - fromY
    const length = Math.hypot(dx, dy)
    const steps = Math.max(2, Math.floor(length / 8))

    for (let index = 1; index < steps; index++) {
      const t = index / steps
      const distance = t * length

      // 贴着两头的那几段跳过：不然掩体紧挨着人时会被判成"挡住了"（人其实露在外面）
      if (distance < 14 || length - distance < 16) {
        continue
      }

      if (this.solidAt(fromX + dx * t, fromY + dy * t)) {
        return false
      }
    }

    return true
  }

  private solidAt(x: number, y: number) {
    let hit = false

    const scan = (child: Phaser.GameObjects.GameObject) => {
      const body = (child as Phaser.Physics.Arcade.Sprite).body as Phaser.Physics.Arcade.StaticBody

      if (!body || !body.enable) {
        return
      }

      if (x > body.left && x < body.right && y > body.top && y < body.bottom) {
        hit = true
      }
    }

    this.platforms.getChildren().forEach(scan)
    this.gates.getChildren().forEach(scan)
    this.pillars.getChildren().forEach(scan)

    return hit
  }

  // 视野扇形：边界射线撞到掩体就停在那儿，所以"躲箱子后面"看得出来
  private drawGuardVision(guard: GuardRef) {
    if (Math.abs(this.slime.x - guard.sprite.x) > 460) {
      return
    }

    const gfx = this.guardVisionGfx
    const range = guard.def.vision ?? GUARD_VISION.range
    const eyeY = this.guardEyeY(guard)
    const base = this.guardLookAngle(guard)
    const half = (GUARD_VISION.halfAngle * Math.PI) / 180
    const rays = 13
    const points: Phaser.Math.Vector2[] = [new Phaser.Math.Vector2(guard.sprite.x, eyeY)]

    for (let index = 0; index <= rays; index++) {
      const angle = base - half + (half * 2 * index) / rays
      const dirX = Math.cos(angle)
      const dirY = Math.sin(angle)
      let reach = range

      for (let step = 10; step <= range; step += 10) {
        if (this.solidAt(guard.sprite.x + dirX * step, eyeY + dirY * step)) {
          reach = step - 10
          break
        }
      }

      points.push(new Phaser.Math.Vector2(guard.sprite.x + dirX * reach, eyeY + dirY * reach))
    }

    const alert = guard.state === 'chase'
    const tint = alert ? 0xff6b6b : guard.awareness > 0.08 ? 0xffd54f : 0xdfe8f4
    const alpha = alert ? 0.24 : 0.1 + guard.awareness * 0.14

    gfx.fillStyle(tint, alpha)
    gfx.fillPoints(points, true)
  }

  // 头顶的疑惑环：在问号外面套一圈，长满一整圈就是"发现"，开始追
  private drawGuardAlert(guard: GuardRef) {
    if (guard.awareness <= 0.02) {
      return
    }

    const gfx = this.guardAlertGfx
    const cx = guard.sprite.x
    const cy = guard.sprite.y - 56
    const radius = 12
    const from = -Math.PI / 2

    // 底圈：让进度看得出来
    gfx.lineStyle(3, 0x1a1a22, 0.5)
    gfx.beginPath()
    gfx.arc(cx, cy, radius, 0, Math.PI * 2)
    gfx.strokePath()

    gfx.lineStyle(2.4, guard.state === 'chase' ? 0xff6b6b : 0xffe066, 0.95)
    gfx.beginPath()
    gfx.arc(cx, cy, radius, from, from + Math.PI * 2 * guard.awareness)
    gfx.strokePath()
  }

  private updateMonsters(dt: number) {
    this.monsterList.forEach((monster) => {
      if (monster.stun > 0) {
        monster.stun -= dt

        if (monster.stun <= 0) {
          monster.stun = 0
          monster.sprite.clearTint()
          monster.stunMark.setVisible(false)
        } else {
          // 头上那三个小点转圈
          monster.stunMark.setAngle(monster.stunMark.angle + dt * 420)
        }
      } else {
        const speed = monster.def.speed ?? 30
        const left = monster.def.x - monster.def.range
        const right = monster.def.x + monster.def.range

        monster.sprite.x += monster.dir * speed * dt

        if (monster.sprite.x <= left) {
          monster.sprite.x = left
          monster.dir = 1
        }

        if (monster.sprite.x >= right) {
          monster.sprite.x = right
          monster.dir = -1
        }

        monster.sprite.setFlipX(monster.dir < 0)
      }

      monster.stunMark.setX(monster.sprite.x)

      // 碰到即死。眩晕里碰到不算；雷闪的无敌 / 岩壳也照样能挡（都走 die 的判定）
      if (monster.stun > 0 || this.dying || this.finished) {
        return
      }

      const dx = Math.abs(this.slime.x - monster.sprite.x)
      const dy = Math.abs(this.slime.y - (monster.def.y - 20))

      // 魔物 42 高（约 1.5 个史莱姆），判定盒跟着放大
      if (dx < 26 && dy < 26) {
        this.die('monster')
      }
    })
  }

  // 真正生成：从落点上方掉下来，动画期间不参与碰撞，落点就是预览里那一个
  private spawnRockPillar(x: number, landTop: number, spawnBottom: number) {
    this.rockPillar?.destroy()
    this.pillarFoot?.destroy()
    this.pillarFoot = null

    // 只进 pillars 组：柱子不进 platforms，玩家就能直接穿过去，只有岩刺会被它挡住
    const pillar = this.pillars.create(x, 0, 'rock-pillar') as Phaser.Physics.Arcade.Sprite
    pillar.setDepth(3)
    const restY = landTop - pillar.displayHeight / 2
    const spawnY = spawnBottom - pillar.displayHeight / 2
    const fall = Math.abs(restY - spawnY)

    pillar.setY(spawnY)
    pillar.disableBody()
    pillar.refreshBody()

    this.rockPillar = pillar

    this.tweens.add({
      targets: pillar,
      y: restY,
      // 重力 600，自由落体的时间是 sqrt(2h/g)；Quad.easeIn 的位移正好是 t²，配起来像真掉下来
      duration: Phaser.Math.Clamp(Math.sqrt((2 * fall) / 600) * 1000, 180, 900),
      ease: 'Quad.easeIn',
      onComplete: () => {
        pillar.enableBody()
        pillar.refreshBody()
        playSfx(this, 'sfx-land', 0.4)
        this.cameras.main.shake(160, 0.005)
        this.spawnPillarDust(x, landTop)
        this.pillarFoot = this.makePillarFoot(x, landTop)
      },
    })

    this.time.delayedCall(PILLAR_TIME * 1000, () => {
      if (this.rockPillar === pillar) {
        this.rockPillar = null
      }

      pillar.destroy()
      this.pillarFoot?.destroy()
      this.pillarFoot = null
    })
  }

  // 柱脚常驻的一圈泥：柱子压在弧面上时（就相当于地面是斜的），底边总有一侧会露出缝，
  // 用一堆土疙瘩把接缝盖住 —— 顺便让"这根柱子是砸进地里的"看着更实（用户 2026/10/16 要）
  private makePillarFoot(x: number, groundY: number) {
    const gfx = this.add.graphics().setDepth(3.2)
    // 每粒土一个小方块，左右铺开、高低不一，底下压一层暗色当阴影
    const clods: Array<[number, number, number]> = [
      [-16, 1, 4],
      [-11, -2, 5],
      [-5, 0, 6],
      [2, -3, 5],
      [8, 1, 4],
      [14, -1, 4],
    ]

    gfx.fillStyle(0x4a3a26, 0.45)
    gfx.fillEllipse(x, groundY + 2, 40, 7)
    gfx.fillStyle(0x6b5a3a, 1)
    clods.forEach(([dx, dy, size]) => gfx.fillRect(x + dx, groundY + dy - size / 2, size, size))
    gfx.fillStyle(0x8a7f6a, 1)
    clods.forEach(([dx, dy, size]) => gfx.fillRect(x + dx, groundY + dy - size / 2, size, 1))

    return gfx
  }

  // 柱脚正下方最高的那块地形顶面；底下是空的（悬崖、洞口）就返回 null
  private pillarLandingY(x: number, halfWidth: number, fromY: number): number | null {
    let landTop: number | null = null

    this.platforms.getChildren().forEach((child) => {
      const body = (child as Phaser.Physics.Arcade.Sprite).body as Phaser.Physics.Arcade.StaticBody

      // 只管还开着的、在柱脚下面的地形（柱子自己这会儿是关着的，会自动跳过）
      if (!body || !body.enable || body.top < fromY) {
        return
      }

      // 柱脚这条横带得真的压在这块地形上
      if (x - halfWidth > body.right || x + halfWidth < body.left) {
        return
      }

      if (landTop === null || body.top < landTop) {
        landTop = body.top
      }
    })

    // 拱形土坡也算地形：柱脚这条横带压在哪条弧上，就落在那条弧**最低的那一点**上 ——
    // 柱子的底是平的，压在斜面上如果按最高点落，低的那一侧会悬空；按最低点落，
    // 高的那一侧埋进土里一点，正好被常驻的泥土盖住（用户 2026/10/16 要的）
    ;(this.level.slopes ?? []).forEach((def) => {
      let deepest: number | null = null

      for (let step = 0; step <= 4; step++) {
        const sx = x - halfWidth + ((halfWidth * 2) / 4) * step
        const surface = this.slopeSurfaceAt(def, sx)

        if (surface !== null && surface >= fromY && (deepest === null || surface > deepest)) {
          deepest = surface
        }
      }

      if (deepest !== null && (landTop === null || deepest < landTop)) {
        landTop = deepest
      }

      // 弧面在柱脚下面、但柱脚这条带上只有一部分压着弧（另一部分悬空）时，
      // 也按压着的那部分落地 —— 上面那个循环已经把这个情况圈进来了
      if (deepest === null) {
        {
          const surface = this.slopeSurfaceAt(def, x)

          if (surface !== null && surface >= fromY && (landTop === null || surface < landTop)) {
            landTop = surface
          }
        }
      }
    })

    return landTop
  }

  // 石柱落地那一下溅起的几粒土：左右各三粒，斜着抛出去，再掉回地面、边掉边淡出
  private spawnPillarDust(x: number, groundY: number) {
    ;[-1, 1].forEach((dir) => {
      for (let index = 0; index < 3; index++) {
        const size = index === 0 ? 3 : 2
        const dust = this.add
          .image(x + dir * 8, groundY - 2, 'pixel')
          .setDisplaySize(size, size)
          .setTint(index % 2 === 0 ? 0x8a7f6a : 0x6b5a3a)
          .setDepth(8)

        this.tweens.add({
          targets: dust,
          x: x + dir * (16 + index * 9),
          y: groundY - 12 - index * 4,
          duration: 180,
          ease: 'Quad.easeOut',
          onComplete: () => {
            this.tweens.add({
              targets: dust,
              y: groundY - 1,
              alpha: 0,
              duration: 220,
              onComplete: () => dust.destroy(),
            })
          },
        })
      }
    })
  }
 
  // 压力板：只有岩柱和「岩化状态」的史莱姆压得动，而且是慢慢压下去的
  private updatePlates(dt: number) {
    this.plateList.forEach((plate) => {
      const weight =
        (this.armored && this.physics.overlap(plate.sprite, this.slime)) ||
        (this.rockPillar !== null && this.physics.overlap(plate.sprite, this.rockPillar))
      const step = dt / PLATE_PRESS_TIME

      // 有重量就往下沉，重量一走就慢慢弹回来
      plate.press = Phaser.Math.Clamp(plate.press + (weight ? step : -step), 0, 1)
      // 只动画面、不动刚体：判定范围固定在抬起时的位置，不会跟着往下跑
      plate.sprite.setY(plate.baseY + plate.press * PLATE_SINK)
      plate.art.setY(plate.baseY + PLATE_BODY.height / 2 + plate.press * PLATE_SINK)

      // 压到底才算数：跑过去踩一下（不到 0.45 秒）是压不动的
      const pressed = plate.press >= 1

      if (pressed === plate.pressed) {
        return
      }

      plate.pressed = pressed
      plate.art.setTint(pressed ? 0xffd54f : 0x8a7f6a)
      playSfx(this, pressed ? 'sfx-interact' : 'sfx-step', 0.3)

      // 花树那块板（id=blossom）压住一次就把飘花打开，之后一直飘，松手也不停
      if (pressed && plate.id === 'blossom') {
        this.petalsOn = true
      }

      this.doorList.forEach((door) => {
        if (
          !door.opened &&
          door.needs.includes(plate.id) &&
          door.needs.every((id) => this.idReady(id))
        ) {
          this.openDoor(door)
        }
      })
    })
  }

  // 门点名到的东西算不算数：方碑看亮没亮，压力板看上面压没压着东西
  private idReady(id: string) {
    const monument = this.monumentById(id)

    if (monument) {
      return monument.lit
    }

    return this.plateList.some((plate) => plate.id === id && plate.pressed)
  }

  // 金桂飘花：树冠上一直有花瓣被风卷下来，往左飘、左右摆、边飘边转，
  // 落到地面（y=2160 上下）就淡出回收。开了以后不关，压力板松掉照样飘。
  // 深度分两层撒：0.9 的落在树干后面（depth 2），11 的落在史莱姆前面，做出层次
  private updatePetals(dt: number) {
    for (let index = this.petals.length - 1; index >= 0; index--) {
      const petal = this.petals[index]

      petal.life += dt
      petal.image.x += (petal.vx + Math.sin(petal.life * petal.speed + petal.phase) * petal.sway) * dt
      petal.image.y += petal.vy * dt
      petal.image.angle += petal.spin * dt

      // 快贴地的时候淡出，免得"啪"一下消失
      const above = petal.groundY - petal.image.y
      petal.image.setAlpha(above < 16 ? Math.max(0, above / 16) : 1)

      if (petal.image.y < petal.groundY) {
        continue
      }

      petal.image.setVisible(false)
      this.petalIdle.push(petal.image)
      this.petals.splice(index, 1)
    }

    if (!this.petalsOn) {
      return
    }

    this.petalTimer -= dt

    // 同屏最多 28 片，飘得慢的时候不至于一直往上堆
    if (this.petalTimer > 0 || this.petals.length > 28) {
      return
    }

    this.petalTimer = PETAL_INTERVAL
    this.spawnPetal()
  }

  private spawnPetal() {
    const image = this.petalIdle.pop() ?? this.add.image(0, 0, 'petal')
    // 大部分飘在树前面，少部分飘在树干后面
    const near = Math.random() < 0.65

    image
      .setVisible(true)
      .setAlpha(1)
      .setDepth(near ? 11 : 0.9)
      .setScale(near ? 1 : 0.8)
      .setAngle(Phaser.Math.Between(0, 359))
      .setTint(PETAL_COLORS[Math.floor(Math.random() * PETAL_COLORS.length)])

    // 从树冠里冒出来（金桂贴在 x=770、贴地 2160，树冠大概 x 660~880 / y 1914~2030）
    image.x = 770 + Phaser.Math.FloatBetween(-104, 104)
    image.y = 1922 + Phaser.Math.FloatBetween(0, 78)

    this.petals.push({
      image,
      vx: Phaser.Math.FloatBetween(-18, -6),          // 风往左吹
      vy: Phaser.Math.FloatBetween(45, 72),           // 树高了，落得也比原来快
      phase: Math.random() * Math.PI * 2,
      sway: Phaser.Math.FloatBetween(8, 20),
      speed: Phaser.Math.FloatBetween(1.6, 3.2),
      spin: Phaser.Math.FloatBetween(-80, 80),
      life: 0,
      groundY: 2160 - Phaser.Math.FloatBetween(0, 4),
    })
  }

  // 岩刺造物：到点先抖一下当预警，0.15 秒后真的吐出一根
  private updateLaunchers(dt: number) {
    this.launchers.forEach((launcher) => {
      launcher.timer -= dt

      if (launcher.timer > 0) {
        return
      }

      launcher.timer = launcher.interval

      this.tweens.add({
        targets: launcher.sprite,
        scaleX: 1.15,
        scaleY: 0.85,
        duration: 120,
        yoyo: true,
      })

      this.time.delayedCall(150, () => {
        this.fireSpike(launcher)
      })
    })

    this.spikes.getChildren().forEach((child) => {
      const spike = child as Phaser.Physics.Arcade.Sprite

      // 飞出关卡就收掉，别越攒越多
      if (
        spike.x < -40 ||
        spike.x > this.level.width + 40 ||
        spike.y < -40 ||
        spike.y > this.level.height + 60
      ) {
        this.breakSpike(spike)
        return
      }

    })
  }

  private fireSpike(launcher: LauncherRef) {
    const dirX = launcher.dir === 'left' ? -1 : launcher.dir === 'right' ? 1 : 0
    const dirY = launcher.dir === 'down' ? 1 : 0
    // 锥口离贴图中心 6 像素，岩刺半长 7，再往里压 2 像素就是出生点
    const muzzle = 11
    const spike = this.spikes.create(
      launcher.sprite.x + dirX * muzzle,
      launcher.sprite.y + dirY * muzzle,
      'rock-spike'
    ) as Phaser.Physics.Arcade.Sprite

    spike.setAngle(launcher.dir === 'left' ? 90 : launcher.dir === 'right' ? -90 : 0)
    spike.setDepth(6)
    spike.setVelocity(dirX * launcher.speed, dirY * launcher.speed)

    // 横着飞的那根要把判定盒也横过来，不然会和画面错开
    if (dirX !== 0) {
      const body = spike.body as Phaser.Physics.Arcade.Body

      body.setSize(14, 8)
    }
  }

  private breakSpike(spike: Phaser.Physics.Arcade.Sprite) {
    if (!spike.active) {
      return
    }

    spike.destroy()
  }

  // 山腰雾带（第九关）：世界坐标里放几条很淡的横雾，慢慢左右飘。
  // 深度默认 1.16：压在坡体（1.05~1.15）上面，在崖壁（1.17）和人物下面。
  private buildMistBands() {
    ;(this.level.mistBands ?? []).forEach((def, index) => {
      const mist = this.add
        .image(def.x, def.y, 'mountain-mist')
        .setDepth(def.depth ?? 1.16)
        .setAlpha(def.alpha ?? 0.5)

      if (def.width) {
        mist.setScale(def.width / mist.width, 1)
      }

      const drift = def.drift ?? 30

      this.tweens.add({
        targets: mist,
        x: def.x + drift,
        duration: def.duration ?? 26000,
        delay: index * 1800,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
      })
    })
  }

  // 山顶湖 + 瀑布（第九关）：湖画成透视椭圆，放在山顶背景里；
  // 瀑布从湖心一路落到地面，遇到走线就断一小段，看起来像从路后面穿过去。
  private buildSummitLake() {
    const lake = this.level.summitLake

    if (!lake) {
      return
    }

    this.add
      .image(lake.x, lake.y, 'summit-lake')
      .setOrigin(0.5, 0.5)
      .setDepth(0.86)
      .setScale((lake.width ?? 1000) / 1000, (lake.height ?? 180) / 180)

    const fall = this.level.waterfall

    if (fall) {
      fall.segments.forEach((segment) => {
        this.add
          .image(fall.x, segment.y, 'waterfall')
          .setOrigin(0.5, 0)
          .setDepth(1.16)
          .setScale((fall.width ?? 42) / 42, segment.height / 180)
      })
    }
  }

  // ── 拱形土坡（2026/10/16）：**走线是一条真的弧** ─────────────────────────────
  // 关卡数据里写 `slopes: [{ x, y, width, rise }]`，顶面高度 y(x) = y + rise × t²
  // （t = (x − 中心) ÷ (跨度 ÷ 2)），中拱最高、两端最低，是一条连续的曲线 —— 不是台阶拼的。
  //
  // Arcade 物理只有轴对齐矩形，做不了斜面，所以这类地面**只用"贴地"接管**：
  //   · 画面：这里按曲线采样铺一块土体 + 顶面亮边（可选草带），只画不挡人；
  //   · 物理：updateSlopes() 每帧把脚底按到曲线上、临时关掉重力，onGround 认它，
  //           所以跳跃、体力回复、落地音效都跟站在平地上一样。
  // 曲线是一条抛物线而不是正圆弧，是为了每帧算高度只要一次乘法（几万个石头方块都省下来了）。
  private buildSlopes(groundColor: number, groundTop: number) {
    const lighten = (color: number, amount: number) => {
      const r = Math.min(255, ((color >> 16) & 0xff) + amount)
      const g = Math.min(255, ((color >> 8) & 0xff) + amount)
      const b = Math.min(255, (color & 0xff) + amount)

      return (r << 16) | (g << 8) | b
    }

    ;(this.level.slopes ?? []).forEach((def) => {
      const half = def.width / 2
      const earth = def.tint ?? groundColor
      // 土体默认一路填到地面线：坡"也相当于地面"，底下不能是空的（用户 2026/10/16 定）
      const bottom = def.depthTo ?? groundTop
      // 后层的坡默认画在前层后面（前层盖后层），和平台的 depth 约定一致
      const depth = def.depth ?? (def.layer === 'back' ? 1.8 : 2.3)
      // 只画这条拱的一段（默认整条）—— 盘山道的每一跑就是半条拱
      const t0 = def.tStart ?? -1
      const t1 = def.tEnd ?? 1
      const x0 = def.x + half * t0
      const x1 = def.x + half * t1
      // 每 12 像素采一个点：480×270 的像素画里已经看不出折线，
      // 但顶点数直接少一半 —— 第九关三段长坡，这是最省的一块。
      const steps = Math.max(8, Math.round(Math.abs(x1 - x0) / 12))
      const surface: Phaser.Math.Vector2[] = []

      for (let i = 0; i <= steps; i++) {
        const x = x0 + ((x1 - x0) * i) / steps

        surface.push(new Phaser.Math.Vector2(x, this.slopeSurfaceAt(def, x) ?? def.y))
      }

      const gfx = this.add.graphics().setDepth(depth)

      // ① 坡体分两层（2026/10/17 用户定）：**走的地方留一条泥土**，再往下一律是岩石
      //    —— 上下爬坡的背景不能还是一片土黄，得是裸露的石头
      const SOIL = 26
      const rock = 0x6a5e52

      gfx.fillStyle(rock, 1)
      gfx.fillPoints(
        [
          ...surface.map((p) => new Phaser.Math.Vector2(p.x, p.y + SOIL)),
          new Phaser.Math.Vector2(x1, bottom),
          new Phaser.Math.Vector2(x0, bottom),
        ],
        true
      )

      // ①·b 山体正面（2026/10/17 第二版）：**横向岩层 + 直冲沟**。
      // 第一版是沿着坡面采样的一条条弧带，每条几百个顶点，Graphics 每帧重画太吃性能；
      // 现在按世界 y 画几条横带，每条只是一个矩形，坡面以上/以下的部分自然被坡体挡住。
      if (def.frontFace) {
        let minSurfaceY = Number.POSITIVE_INFINITY

        for (const p of surface) {
          minSurfaceY = Math.min(minSurfaceY, p.y)
        }

        const bands = [
          { off: 80, th: 10, color: 0x8a7c69, alpha: 0.42 },
          { off: 170, th: 13, color: 0x4a4037, alpha: 0.45 },
          { off: 270, th: 10, color: 0x8a7c69, alpha: 0.38 },
          { off: 380, th: 12, color: 0x4a4037, alpha: 0.4 },
          { off: 500, th: 10, color: 0x8a7c69, alpha: 0.3 },
        ]

        for (const band of bands) {
          const bandY = minSurfaceY + band.off

          if (bandY + band.th > bottom - 2) {
            continue
          }

          let left = Number.POSITIVE_INFINITY
          let right = Number.NEGATIVE_INFINITY

          // 只在「坡面 + 泥土层」以下的那一段画，不会碰到草带
          for (const p of surface) {
            if (p.y + SOIL + 10 <= bandY) {
              left = Math.min(left, p.x)
              right = Math.max(right, p.x)
            }
          }

          if (right - left < 20) {
            continue
          }

          gfx.fillStyle(band.color, band.alpha)
          gfx.fillRect(left, bandY, right - left, band.th)
          gfx.fillStyle(0x453d34, 0.38)
          gfx.fillRect(left, bandY + band.th - 1, right - left, 1)
        }

        // 两道直裂缝，也是矩形，不再采样曲线
        for (let k = 0; k < 2; k++) {
          const crackX = x0 + (x1 - x0) * (0.3 + k * 0.4)
          const surfaceY = this.slopeSurfaceAt(def, crackX)

          if (surfaceY === null) {
            continue
          }

          const topY = surfaceY + SOIL + 18

          if (topY + 40 > bottom) {
            continue
          }

          gfx.fillStyle(0x4f453b, 0.3)
          gfx.fillRect(crackX, topY, 3, bottom - topY)
        }

        const gullyX = def.frontFace.gully

        if (gullyX !== undefined && gullyX > x0 + 20 && gullyX < x1 - 20) {
          const surfaceY = this.slopeSurfaceAt(def, gullyX)

          if (surfaceY !== null) {
            const topY = surfaceY + SOIL + 10

            if (topY + 30 < bottom) {
              // 冲沟：上窄下宽的直梯形，沟口是平的
              gfx.fillStyle(0x4f453b, 0.6)
              gfx.fillPoints(
                [
                  new Phaser.Math.Vector2(gullyX - 18, topY),
                  new Phaser.Math.Vector2(gullyX + 18, topY),
                  new Phaser.Math.Vector2(gullyX + 32, bottom),
                  new Phaser.Math.Vector2(gullyX - 32, bottom),
                ],
                true
              )

              // 靠右一侧给一道受光的岩棱
              gfx.fillStyle(0x7d6f5f, 0.4)
              gfx.fillPoints(
                [
                  new Phaser.Math.Vector2(gullyX + 10, topY),
                  new Phaser.Math.Vector2(gullyX + 18, topY),
                  new Phaser.Math.Vector2(gullyX + 32, bottom),
                  new Phaser.Math.Vector2(gullyX + 23, bottom),
                ],
                true
              )

              // 两道横向石梁，把直沟打断
              for (let k = 1; k <= 2; k++) {
                const ry = topY + k * 110

                if (ry > bottom - 20) {
                  break
                }

                gfx.fillStyle(0x5e5348, 0.5)
                gfx.fillRect(gullyX - 14, ry, 28, 4)
              }
            }
          }
        }
      }

      gfx.fillStyle(earth, 1)
      gfx.fillPoints(
        [...surface, ...surface.map((p) => new Phaser.Math.Vector2(p.x, p.y + SOIL)).reverse()],
        true
      )

      // ② 顶面压一条 4 像素的亮边（光从上来），弧面才有厚度、不像一块贴纸
      gfx.fillStyle(lighten(earth, 0x1c), 1)
      gfx.fillPoints(
        [...surface, ...surface.map((p) => new Phaser.Math.Vector2(p.x, p.y + 4)).reverse()],
        true
      )

      // ③ 草带：**一整条**沿着弧面铺（不是一段一段的贴图 —— 那样弧一缓一陡就看出接缝了）。
      //    配色照抄 grass-top 那张贴图：底下 5 像素深绿、上面 2 像素亮绿
      if (def.grass) {
        // 沿弧面的一条带子：从「弧面上方 topOffset」铺到「下方 bottomOffset」
        const band = (topOffset: number, bottomOffset: number, color: number) => {
          gfx.fillStyle(color, 1)
          gfx.fillPoints(
            [
              ...surface.map((p) => new Phaser.Math.Vector2(p.x, p.y + topOffset)),
              ...surface.map((p) => new Phaser.Math.Vector2(p.x, p.y + bottomOffset)).reverse(),
            ],
            true
          )
        }

        band(-2, 3, 0x5f8a3a)
        band(-2, 0, 0x7fb04a)
      }
    })
  }

  // 拱形土坡的弧面高度：**所有地方都走这一个函数**（画面取样、贴地、岩柱落点、雷闪判定），
  // 换形状只改这里。t 是"从 tStart 到 tEnd"的参数，tEnd 那一端最高（y 最小）。
  //   arch —— 抛物线，中段平、两头陡（山头 / 土包）
  //   ramp —— smoothstep，两头平、中段陡（盘山道的每一跑）
  private slopeSurfaceAt(def: SlopeDef, x: number): number | null {
    const half = def.width / 2
    const t = (x - def.x) / half
    const t0 = def.tStart ?? -1
    const t1 = def.tEnd ?? 1

    // 注意 tStart 可以比 tEnd 大（＝这一跑是**往左升**的，比如盘山道的中跑），
    // 所以区间要按大小两头比，不能写成 t < t0 || t > t1
    if (t1 === t0 || t < Math.min(t0, t1) || t > Math.max(t0, t1)) {
      return null
    }

    if (def.mode === 'ramp') {
      // u 从 0（起点，低）走到 1（终点，高）
      const u = (t - t0) / (t1 - t0)
      const s = u * u * (3 - 2 * u)

      return def.y + def.rise * (1 - s)
    }

    return def.y + def.rise * t * t
  }

  // ── 琥珀 ──────────────────────────────────────────────────────────
  // 摆在转角平台上，**岩共鸣或跳砸都能打开**。里头的原石 / 野猪 / 人，
  // 敲开之前谁都不知道是什么 —— 这是用户 2026/10/17 设计的互动造物。
  private buildAmbers() {
    this.ambers = []

    ;(this.level.ambers ?? []).forEach((def) => {
      // 坐台先摆（砸碎了也留着），琥珀坐在它上面
      this.add.image(def.x, def.y, 'amber-stand').setOrigin(0.5, 1).setDepth(4)

      const sprite = this.add
        // 贴近地面（用户 2026/10/17 定）：底边只离地 4 像素，埋在土堆里
        .image(def.x, def.y - 4, 'amber')
        .setDepth(5)
        .setOrigin(0.5, 1)
      // 用户 2026/10/17 定：**琥珀不要做动态**，就静静凝在那儿

      this.ambers.push({ sprite, def, broken: false })
    })
  }

  // 疾风符：山路上的一次性加速道具，拾取后 10 秒移动速度 ×1.6
  private buildSpeedItems() {
    this.speedItems = []
    this.speedBoostTimer = 0
    this.speedBoostMultiplier = 1
    this.speedBoostText?.destroy()
    this.speedBoostText = null

    const defs = this.level.speedItems ?? []

    if (defs.length === 0) {
      return
    }

    this.speedBoostText = this.add
      .text(10, 72, '', {
        fontFamily: 'sans-serif',
        fontSize: '10px',
        color: '#8fe0c2',
      })
      .setScrollFactor(0)
      .setDepth(HUD_DEPTH)
      .setVisible(false)

    defs.forEach((def) => {
      const sprite = this.add
        .image(def.x, def.y - 10, def.key ?? 'speed-charm')
        .setOrigin(0.5, 1)
        .setDepth(6)

      const baseY = sprite.y

      this.tweens.add({
        targets: sprite,
        y: baseY - 4,
        duration: 700,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
      })

      this.speedItems.push({ sprite, def, taken: false })
    })
  }

  private updateSpeedItems(dt: number) {
    if (this.speedBoostTimer > 0) {
      this.speedBoostTimer = Math.max(0, this.speedBoostTimer - dt)
      this.speedBoostText?.setText(`疾风加速 ${Math.ceil(this.speedBoostTimer)}s`).setVisible(true)
    } else {
      this.speedBoostText?.setVisible(false)
    }

    for (const item of this.speedItems) {
      if (item.taken) {
        continue
      }

      const distance = Phaser.Math.Distance.Between(
        this.slime.x,
        this.slime.y,
        item.sprite.x,
        item.sprite.y
      )

      if (distance > 30) {
        continue
      }

      item.taken = true
      item.sprite.destroy()
      this.speedBoostTimer = item.def.duration ?? 10
      this.speedBoostMultiplier = item.def.multiplier ?? 1.6
      playSfx(this, 'sfx-gem', 0.5)
      this.showMessage(`拾取疾风符：移动速度提升 ${this.speedBoostTimer} 秒`)
      this.speedBoostText
        ?.setText(`疾风加速 ${Math.ceil(this.speedBoostTimer)}s`)
        .setVisible(true)
      break
    }
  }

  // 第一重试炼：浮石、分段安全台、顶部仙家符箓
  private buildTrialOne() {
    const def = this.level.trialOne

    if (!def) {
      return
    }

    this.trialStoneGroup = this.physics.add.staticGroup()
    this.trialCheckpoints = []
    this.trialStones = []

    def.checkpoints.forEach((cp, index) => {
      const platform = this.platforms.create(cp.x, cp.y + 3, 'pixel') as Phaser.Physics.Arcade.Sprite

      platform.setDisplaySize(120, 6)
      platform.setTint(0x8a7c69)
      platform.refreshBody()
      platform.setDepth(3)

      this.trialCheckpoints.push({ x: cp.x, y: cp.y, index: index + 1 })
      this.add
        .image(cp.x, cp.y + 8, 'cloud-puff')
        .setScale(0.55)
        .setAlpha(0.55)
        .setDepth(2.9)
    })

    def.stones.forEach((st) => {
      const sprite = this.trialStoneGroup.create(st.x, st.y + 4, 'pixel') as Phaser.Physics.Arcade.Sprite

      sprite.setDisplaySize(46, 8)
      sprite.setTint(0x8a7c69)
      sprite.refreshBody()
      sprite.setDepth(3)

      const body = sprite.body as Phaser.Physics.Arcade.StaticBody
      body.checkCollision.down = false
      body.checkCollision.left = false
      body.checkCollision.right = false

      this.trialStones.push({ sprite, section: st.section, triggered: false })
      this.add
        .image(st.x, st.y + 9, 'cloud-puff')
        .setScale(0.38)
        .setAlpha(0.45)
        .setDepth(2.8)
    })

    this.physics.add.collider(this.slime, this.trialStoneGroup, (_slime, stone) => {
      const record = this.trialStones.find((item) => item.sprite === stone)

      if (record) {
        this.trialArmed = true
        this.triggerTrialStone(record)
      }
    })

    this.trialArtifact = this.add
      .image(def.artifact.x, def.artifact.y, 'trial-talisman')
      .setOrigin(0.5, 1)
      .setDepth(6)

    const baseY = this.trialArtifact.y

    this.tweens.add({
      targets: this.trialArtifact,
      y: baseY - 4,
      duration: 800,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    })

    const glow = this.add
      .image(def.artifact.x, baseY - 14, 'pixel')
      .setDisplaySize(26, 26)
      .setTint(0xffd54f)
      .setAlpha(0.18)
      .setDepth(5.9)

    this.tweens.add({
      targets: glow,
      alpha: 0.35,
      scaleX: 1.3,
      scaleY: 1.3,
      duration: 900,
      yoyo: true,
      repeat: -1,
    })
  }

  private triggerTrialStone(record: {
    sprite: Phaser.Physics.Arcade.Sprite
    triggered: boolean
    hideAt?: number
  }) {
    if (record.triggered) {
      return
    }

    record.triggered = true
    record.hideAt = this.time.now + 900

    this.tweens.add({
      targets: record.sprite,
      alpha: 0.45,
      duration: 160,
      yoyo: true,
      repeat: 2,
    })
  }

  private resetTrialStones() {
    this.trialStones.forEach((record) => {
      record.triggered = false
      record.hideAt = undefined
      record.sprite.setVisible(true).setAlpha(1)
      ;(record.sprite.body as Phaser.Physics.Arcade.StaticBody).enable = true
    })
  }

  private updateTrialStones() {
    this.trialStones.forEach((record) => {
      if (!record.triggered || record.hideAt === undefined || this.time.now < record.hideAt) {
        return
      }

      record.hideAt = undefined
      record.sprite.setVisible(false).setAlpha(1)
      ;(record.sprite.body as Phaser.Physics.Arcade.StaticBody).enable = false
    })
  }

  private failTrialSection() {
    if (this.trialResetLock > 0 || this.domainLeaving) {
      return
    }

    const starts = [
      { x: 320, y: 800 },
      { x: 600, y: 620 },
      { x: 360, y: 440 },
    ]
    const start = starts[this.trialSection] ?? starts[0]

    this.trialResetLock = 0.9
    this.damageDomain(1)

    if (this.domainLeaving) {
      return
    }

    this.resetTrialStones()

    const body = this.slime.body as Phaser.Physics.Arcade.Body
    body.reset(start.x, start.y - body.height / 2)
    this.slime.setVelocity(0, 0)
    this.trialArmed = false
    this.cameras.main.flash(160, 180, 220, 255)
  }

  private updateTrialOne(dt: number) {
    if (!this.domainMode || !this.level.trialOne || this.trialOneDone) {
      return
    }

    const body = this.slime.body as Phaser.Physics.Arcade.Body

    if (this.trialResetLock > 0) {
      this.trialResetLock = Math.max(0, this.trialResetLock - dt)
    }

    if (body.blocked.down) {
      for (const cp of this.trialCheckpoints) {
        if (Math.abs(body.bottom - cp.y) < 4 && Math.abs(this.slime.x - cp.x) < 80 && cp.index > this.trialSection) {
          this.trialSection = cp.index
          this.trialArmed = false
        }
      }
    }

    if (this.trialArtifact) {
      const distance = Phaser.Math.Distance.Between(
        this.slime.x,
        this.slime.y,
        this.trialArtifact.x,
        this.trialArtifact.y - 16
      )

      if (distance < 36) {
        this.trialOneDone = true
        this.trialArtifact.destroy()
        this.trialArtifact = null
        playSfx(this, 'sfx-gem', 0.6)
        this.cameras.main.flash(220, 255, 230, 150)
        this.showMessage('第一重试炼通过：获得仙家符箓')
        return
      }
    }

    if (this.trialResetLock > 0) {
      return
    }

    if (this.trialSection < 3 && !this.trialArmed) {
      // 站在段首安全台上不算失败；真正跳离段首之后才开始判掉落
      const startsY = [800, 620, 440]

      if (body.bottom < startsY[this.trialSection] - 20) {
        this.trialArmed = true
      } else {
        return
      }
    }

    const startsY = [800, 620, 440]

    if (
      this.trialSection < 3 &&
      this.trialArmed &&
      body.blocked.down &&
      body.bottom >= startsY[this.trialSection] - 2
    ) {
      this.failTrialSection()
    }
  }

  // 敲开琥珀：碎几片琥珀、把里面的东西放出来
  private breakAmber(amber: { sprite: Phaser.GameObjects.Image; def: AmberDef; broken: boolean }) {
    if (amber.broken) {
      return
    }

    amber.broken = true
    const { x, y } = amber.sprite

    // 碎屑：几片琥珀往两边飞、边飞边淡
    for (let index = 0; index < 6; index++) {
      const dir = index % 2 === 0 ? 1 : -1
      const shard = this.add
        .image(x + dir * 4, y, 'pixel')
        .setDisplaySize(3 + (index % 3), 3)
        .setTint(index % 2 === 0 ? 0xf0a83c : 0xc9741c)
        .setDepth(9)

      this.tweens.add({
        targets: shard,
        x: x + dir * (14 + index * 4),
        y: y - 16 - index * 3,
        angle: dir * 180,
        alpha: 0,
        duration: 420,
        ease: 'Quad.easeOut',
        onComplete: () => shard.destroy(),
      })
    }

    playSfx(this, 'sfx-interact', 0.4, 0.8)
    amber.sprite.destroy()

    const loot = amber.def.loot ?? 'gem'

    if (loot === 'gem') {
      // 一颗"额外的"原石：index 用一个空位，捡了会亮 HUD、也算进这一关的收集
      const gem = this.gems.create(x, y + 2, 'gem') as Phaser.Physics.Arcade.Sprite
      gem.setTint(0x6ec6ff)
      // **原石总数就三颗**（用户 2026/10/17 定的）：琥珀里这颗算的是关卡里预留的那一颗，
      // 不是额外多给的。gemIndex 由关卡数据指定（对着 gems 数组里少掉的那一个下标）
      gem.setData('index', amber.def.gemIndex ?? 0)
      gem.setData('layer', null)
      gem.setDepth(5)
      this.showMessage('琥珀里冻着一颗原石！')
      return
    }

    if (loot === 'boar') {
      const boar = this.add.image(x, y + 8, 'amber-boar').setDepth(6)
      this.showMessage('琥珀里居然冻着一头野猪……它醒了，跑了。')
      this.tweens.add({
        targets: boar,
        x: x + 140,
        y: y - 6,
        duration: 1100,
        ease: 'Quad.easeOut',
        onUpdate: (tween) => boar.setY(y + 8 - Math.abs(Math.sin(tween.progress * Math.PI * 3)) * 10),
        onComplete: () => boar.destroy(),
      })
      return
    }

    // 人影：戴草帽、披蓑衣的史莱姆。出来说两句，再自己走掉
    const npc = this.add
      .image(x, y - 2, 'npc-straw-slime')
      .setOrigin(0.5, 1)
      .setDepth(6)
      .setScale(0.25)
      .setAlpha(0.35)

    // 出场 1 秒：先从琥珀里弹出来、放大，再落回地面；落地后才开始对话
    this.tweens.add({
      targets: npc,
      y: y - 16,
      scaleX: 1,
      scaleY: 1,
      alpha: 1,
      duration: 550,
      ease: 'Back.easeOut',
      onComplete: () => {
        this.tweens.add({
          targets: npc,
          y,
          duration: 450,
          ease: 'Bounce.easeOut',
        })
      },
    })

    this.time.delayedCall(1000, () => {
      this.showDialogue(
        '戴草帽的史莱姆',
        ['……多谢。山里雾大，我还以为要一直困在琥珀里了。', '有缘再见。'],
        () => {
          const dir = this.slime.x <= npc.x ? 1 : -1
          const startX = npc.x
          const startY = npc.y

          npc.setFlipX(dir < 0)

          this.tweens.add({
            targets: npc,
            x: startX + dir * 170,
            duration: 1200,
            ease: 'Linear',
            onUpdate: (tween) => {
              npc.setY(startY - Math.abs(Math.sin(tween.progress * Math.PI * 4)) * 3)
              npc.setAlpha(1 - Math.max(0, (tween.progress - 0.55) / 0.45))
            },
            onComplete: () => npc.destroy(),
          })
        }
      )
    })
  }

  // ── 岩共鸣 ────────────────────────────────────────────────────────
  // 岩柱还站着的时候，脚下每隔 0.55 秒往外扩一圈金色光圈（画成压扁的椭圆，像贴在地上），
  // 光圈扫到琥珀就把它震开、扫到**岩**方碑就把碑点亮。半径 170，和岩柱的落点距离同一个量级。
  private updateResonance(dt: number) {
    if (!this.resonanceGfx) {
      this.resonanceGfx = this.add.graphics().setDepth(7.5)
    }

    const pillar = this.rockPillar
    // **只有柱子落了地才出共鸣**：落下来那一段柱子的刚体是关着的（disableBody），
    // 所以拿 body.enable 当"已经砸实了"的判据
    const body = pillar?.body as Phaser.Physics.Arcade.StaticBody | undefined
    const alive = pillar !== null && pillar.active && body !== undefined && body.enable

    if (alive) {
      this.resonanceTimer -= dt

      if (this.resonanceTimer <= 0) {
        // 频率（2026/10/17 用户砍半）：原来 0.55 秒一圈，现在 1.1 秒一圈
        this.resonanceTimer = 1.1
        this.resonanceRings.push({ x: pillar.x, y: body.bottom, r: 0 })
      }
    }

    // 光圈往外扩，扩到 REACH 就消失（范围是 2026/10/17 用户砍下来的一半）
    const REACH = 96

    this.resonanceRings = this.resonanceRings.filter((ring) => {
      ring.r += 250 * dt
      return ring.r < REACH
    })

    const gfx = this.resonanceGfx
    gfx.clear()

    this.resonanceRings.forEach((ring) => {
      const alpha = Phaser.Math.Clamp(1 - ring.r / REACH, 0, 1)
      const rx = ring.r
      const ry = ring.r * 0.3

      // **立体一点**：同一个椭圆画三道 —— 底下那道暗的当影子、中间那道是本体、
      // 再往上抬 1.5 像素补一道亮的当"高光边"，看起来像地面上凿出来的一圈金色沟槽
      gfx.lineStyle(4, 0x8a6a1c, alpha * 0.35)
      gfx.strokeEllipse(ring.x, ring.y + 1, rx * 2, ry * 2)
      gfx.lineStyle(3, 0xf0c24a, alpha * 0.9)
      gfx.strokeEllipse(ring.x, ring.y - 1, rx * 2, ry * 2)
      gfx.lineStyle(1, 0xffe9a8, alpha * 0.85)
      gfx.strokeEllipse(ring.x, ring.y - 2.5, rx * 2, ry * 2)

      // **每一帧都要判**：光圈是从 0 一点点扩出去的，东西在哪个距离上，就得等那一圈扫到它。
      // 只看出生那一帧的话，光圈半径还不到 5 像素，什么都扫不到
      const outer = ring.r + 12
      const inner = ring.r - 250 * dt - 12

      // 琥珀：距离落在这一帧扫过的那一段里就震开
      this.ambers.forEach((amber) => {
        if (amber.broken) {
          return
        }

        const distance = Math.hypot(amber.sprite.x - ring.x, amber.sprite.y - ring.y)

        if (distance <= outer && distance >= inner) {
          this.breakAmber(amber)
        }
      })

      // 岩方碑：扫到就点亮（只认岩属性的碑，别的元素留给别的玩法）
      this.monumentList.forEach((monument) => {
        if (monument.lit || monument.element !== 'rock') {
          return
        }

        const distance = Math.hypot(monument.pillar.x - ring.x, monument.pillar.y - ring.y)

        if (distance <= outer && distance >= inner) {
          this.lightMonument(monument)
          playSfx(this, 'sfx-interact', 0.35, 1.1)
        }
      })
    })
  }

  // 跳到琥珀上 / 岩化后跳砸：不靠岩共鸣也能把琥珀踩碎。
  // 只认下落中的脚底，防止站在旁边也被判成踩到。
  private updateAmberStomp() {
    const body = this.slime.body as Phaser.Physics.Arcade.Body

    if (body.velocity.y <= 20) {
      return
    }

    const feet = body.bottom

    for (const amber of this.ambers) {
      if (amber.broken) {
        continue
      }

      // 琥珀贴图 64x52，底边在 def.y - 4，所以顶边是 def.y - 56
      const top = amber.def.y - 56

      if (feet < top - 6 || feet > top + 26) {
        continue
      }

      // 岩化跳砸的范围大一点；普通跳要落在琥珀正上方
      const reach = this.armored ? 56 : 40

      if (Math.abs(this.slime.x - amber.def.x) > reach) {
        continue
      }

      this.cameras.main.shake(this.armored ? 160 : 100, this.armored ? 0.006 : 0.004)
      this.slime.setVelocityY(this.armored ? -190 : -135)

      if (this.armored) {
        const ring = this.add
          .image(amber.def.x, amber.def.y - 8, 'shock-ring')
          .setDepth(8)
          .setScale(0.3)
          .setAlpha(0.8)

        this.tweens.add({
          targets: ring,
          scaleX: 2.2,
          scaleY: 1.1,
          alpha: 0,
          duration: 340,
          onComplete: () => ring.destroy(),
        })
      }

      this.breakAmber(amber)
      break
    }
  }

  // 每帧的贴地：人在弧的 x 范围内、脚底贴着弧面，就把脚底按到曲线上。
  // 三种情况不接管 —— 正在往上飞（起跳 / 被顶）、脚底离面太远（比如从高处掉下来）、
  // 输入被锁（演出 / 雷闪瞄准，那两种自己管重力）。
  private updateSlopes(body: Phaser.Physics.Arcade.Body) {
    const defs = this.level.slopes
    let grip = false

    if (defs && defs.length > 0 && !this.inputLocked && !this.blinkAiming) {
      const x = body.center.x
      // 盘山道的好几跑会在 x 上重叠，**脚下最近的那条弧面才算数** ——
      // 按数组顺序取第一条的话，走到拐角处会被下面那一跑抢走（见「踩过的坑」）
      let best: number | null = null
      let bestIndex = -1
      let bestOff = Number.POSITIVE_INFINITY

      defs.forEach((def, index) => {
        // 盘山道的上下两跑在拐角处 x 重叠、必然碰头，所以按层分开：
        // 只认**当前这一层**的坡（翻层靠 depthGates，和玉京台折返楼梯一个思路）
        if ((def.layer ?? 'front') !== this.playerLayer) {
          return
        }

        // 范围判断交给 slopeSurfaceAt（它认得 tStart > tEnd 的往左升的坡）
        const surface = this.slopeSurfaceAt(def, x)

        if (surface === null) {
          return
        }

        const feet = body.bottom

        // 脚底比弧面高太多（在弧上方飞过去）或低太多（在弧底下）都不算踩着
        if (body.velocity.y < -8 || feet < surface - 6 || feet > surface + 20) {
          return
        }

        const off = Math.abs(feet - surface)

        // **不是正在骑的这一条**时，只有"站在它上面、或者从上面落下来"才接管。
        // 脚底比弧面**低 2 像素以上**（＝人在这条弧底下，比如正顺着另一条坡往下走、
        // 这条弧从头顶横过）就不理它 —— 不然后者会把人从底下捞起来、倒着爬回去
        // （2026/10/16 实测：下楼变成上楼）
        // 例外：**上一帧还在弧面之上**（正往下掉穿过来）—— 那是落在这条弧上，要接住
        const fallingOnto = this.slopePrevFeet <= surface + 2

        if (index !== this.slopeIndex && feet > surface + 2 && !fallingOnto) {
          return
        }

        if (off >= bestOff) {
          return
        }

        bestOff = off
        best = surface
        bestIndex = index
      })

      if (best !== null) {
        grip = true
        this.slime.setVelocityY(0)
        // 脚底比弧面**高 1 像素**：弧的尽头要是接上一块平台（顶面高度正好等于弧面），
        // 只差零点几像素也会被 Arcade 按"最浅方向"往横里推，人就卡在接缝上了 ——
        // 抬 1 像素谁也不会看出来，但接缝从此不咬人（见「踩过的坑」）
        this.slime.setY(best - body.height / 2 - 1)
        body.setAllowGravity(false)
        this.slopeGravityOff = true
      }

      this.slopeIndex = grip ? bestIndex : -1
    }

    this.slopeGrip = grip
    this.slopePrevFeet = body.bottom

    // 松开弧面就把重力还回去（只有"是我关的"才还，别把雷闪瞄准那种关掉的又打开）
    if (!grip && this.slopeGravityOff) {
      body.setAllowGravity(true)
      this.slopeGravityOff = false
    }
  }

  // 木楼梯：一级一级木踏板（三角形切面）+ 底下斜撑的木梁 + 斜扶栏和立柱。
  // 画面全都画在 Graphics 上；挡人的只有每级踏面顶上那条 run×rise 的碰撞盒。
  // 碰撞盒收进 this.stairs，往前走的时候 tryAutoStep() 会把人一级级抬上去，不用跳。
  //
  // 砖石楼梯 / 斜坡（玉京台那种）：底下是**一整块实心台体**（三角楔形，坐在地面或下层平台上），
  // 上头按级画出踏面和踢面；ramp 只是把面画平、每一级切得更细，走上去不会一格一格地跳。
  // 栏杆另外算：rail: 'none' 就不画（改用 revealRails 里那种带透视的石栏杆）
  private buildStoneStair(
    gfx: Phaser.GameObjects.Graphics,
    def: StairDef,
    stairIndex: number,
    layer: 'front' | 'back',
    style: 'brick' | 'ramp'
  ) {
    const from = def.from
    const to = def.to
    const dir = to.x >= from.x ? 1 : -1
    // 踏步切细一点：台阶看着更细致，人走上去也更顺
    // （斜坡还要更细，不然一级一级地弹）
    const tread = style === 'ramp' ? STAIR_TREAD / 3 : 12
    const count = Math.max(1, Math.round(Math.abs(to.x - from.x) / tread))
    const run = Math.abs(to.x - from.x) / count
    const rise = (from.y - to.y) / count
    // 楼梯下面的图要一直延到地面：底边取「这一跑的下端」和「整关最低那块平台的顶面」里更低的一个
    const groundTop = this.level.platforms.reduce(
      (lowest, item) => Math.max(lowest, item.y - item.height / 2),
      Number.NEGATIVE_INFINITY
    )
    const baseY = Math.max(from.y, to.y, groundTop)

    // 这一列往下画到哪儿就**再也看不见了**：前面（depth 更大）那些跑里，离它最近的那条踏面线。
    // 那条线以下全被前面那一跑自己的实心台体盖住，画了也是白发。
    // 第七关那种"一跑一跑往上叠"的盘山道必须这么截：九关第一版每列都一路画到地面，
    // 七跑堆出 34 万条绘制指令，整关掉到十几帧（见「踩过的坑」）
    const allRuns = this.level.stairs ?? []
    const ownDepth = def.depth ?? (layer === 'back' ? 1 : 3)

    const coverAt = (x: number) => {
      let cover = baseY

      for (const other of allRuns) {
        if (other === def || other.to.x === other.from.x) {
          continue
        }

        // 不比这一跑靠前的，盖不住它
        if ((other.depth ?? ((other.layer ?? 'front') === 'back' ? 1 : 3)) <= ownDepth) {
          continue
        }

        if (x < Math.min(other.from.x, other.to.x) || x > Math.max(other.from.x, other.to.x)) {
          continue
        }

        const t = (x - other.from.x) / (other.to.x - other.from.x)
        const y = other.from.y + (other.to.y - other.from.y) * t

        if (y < cover) {
          cover = y
        }
      }

      return cover
    }

    // 一列的下沿：两端都量一遍取更深的那条，宁可多画一点也别露出缝
    const columnBottom = (left: number, top: number) =>
      Math.max(top, Math.min(baseY, Math.max(coverAt(left + 1), coverAt(left + run - 1))))

    const stoneFace = 0x6a5a48
    const stoneLight = 0x7c6a56
    const stoneTop = 0x8a765f
    const stoneDark = 0x4a3f33

    // ① 实心台体：每一级踏面**一直填到这一跑的底边**，一级挨一级，中间不留缝
    //    （台阶就是一块块垒起来的砖石，不是空架子；斜坡则是一整块梯形）
    gfx.fillStyle(stoneFace, 1)

    if (style === 'brick') {
      for (let i = 0; i < count; i++) {
        const near = from.x + dir * run * i
        const top = from.y - rise * (i + 1)
        const left = dir > 0 ? near : near - run
        const bottom = columnBottom(left, top)

        gfx.fillRect(left, top, run, bottom - top)
      }
    } else {
      gfx.fillPoints(
        [
          new Phaser.Math.Vector2(from.x, from.y),
          new Phaser.Math.Vector2(to.x, to.y),
          new Phaser.Math.Vector2(to.x, baseY),
          new Phaser.Math.Vector2(from.x, baseY),
        ],
        true
      )
    }

    // ② 砖缝：每一级的柱子自己砌自己的（横缝 + 错开的竖缝），踏面下沿压一道暗边
    for (let i = 0; i < count; i++) {
      const near = from.x + dir * run * i
      const top = from.y - rise * (i + 1)
      const left = dir > 0 ? near : near - run
      const course = Math.max(6, Math.round(run / 2))
      const bottom = columnBottom(left, top)

      gfx.fillStyle(stoneDark, 0.3)

      for (let y = top + course; y < bottom - 1; y += course) {
        gfx.fillRect(left + 1, y, run - 2, 1)
      }

      gfx.fillStyle(stoneDark, 0.22)

      for (let y = top + course, k = 0; y < bottom - 1; y += course, k++) {
        gfx.fillRect(left + (k % 2 === 0 ? 1 : run - 2), y - course, 1, course)
      }
    }

    // ③ 踏面 / 坡面
    if (style === 'brick') {
      for (let i = 0; i < count; i++) {
        const near = from.x + dir * run * i
        const top = from.y - rise * (i + 1)
        const left = dir > 0 ? near : near - run

        // 踢面压暗、踏面挑亮，砖石台阶才有立体感
        gfx.fillStyle(stoneLight, 1)
        gfx.fillRect(dir > 0 ? near + run - 2 : near, top, 2, rise)
        gfx.fillStyle(stoneTop, 1)
        gfx.fillRect(left, top, run, 2)
        gfx.fillStyle(stoneDark, 1)
        gfx.fillRect(left, top + 2, run, 1)
      }
    } else {
      // 斜坡：沿着坡面压一条亮边（竖直厚度 3，看着就是一条顺下来的石棱）
      gfx.fillStyle(stoneTop, 1)
      gfx.fillPoints(
        [
          new Phaser.Math.Vector2(from.x, from.y - 3),
          new Phaser.Math.Vector2(to.x, to.y - 3),
          new Phaser.Math.Vector2(to.x, to.y),
          new Phaser.Math.Vector2(from.x, from.y),
        ],
        true
      )
    }

    // ④ 碰撞：每级一个 run×rise 的小盒子，进 this.stairs 给 tryAutoStep 抬人
    for (let i = 0; i < count; i++) {
      const near = from.x + dir * run * i
      const top = from.y - rise * (i + 1)
      const step = this.platforms.create(
        near + (dir * run) / 2,
        top + rise / 2,
        'pixel'
      ) as Phaser.Physics.Arcade.Sprite

      step.setDisplaySize(run, rise)
      step.setVisible(false)
      step.refreshBody()
      step.setData('stair', true)
      step.setData('layer', layer)
      step.setData('flight', stairIndex)

      const stepBody = step.body as Phaser.Physics.Arcade.StaticBody

      stepBody.checkCollision.down = false

      if (dir > 0) {
        stepBody.checkCollision.right = false
      } else {
        stepBody.checkCollision.left = false
      }

      this.stairs.push(step)
    }

    // ⑤ 石栏杆：默认沿着坡面往上 26 画一道横杆；rail: 'none' 就留给 revealRails
    if (def.rail === 'none') {
      return
    }

    const railGfx = this.add
      .graphics()
      .setDepth(def.railDepth ?? (layer === 'back' ? 1.4 : 12))

    this.stairRails[stairIndex] = railGfx
    railGfx.fillStyle(stoneLight, 1)
    railGfx.fillPoints(
      [
        new Phaser.Math.Vector2(from.x, from.y - 26),
        new Phaser.Math.Vector2(to.x, to.y - 26),
        new Phaser.Math.Vector2(to.x, to.y - 22),
        new Phaser.Math.Vector2(from.x, from.y - 22),
      ],
      true
    )
    railGfx.fillStyle(stoneDark, 1)
    railGfx.fillPoints(
      [
        new Phaser.Math.Vector2(from.x, from.y - 22),
        new Phaser.Math.Vector2(to.x, to.y - 22),
        new Phaser.Math.Vector2(to.x, to.y - 21),
        new Phaser.Math.Vector2(from.x, from.y - 21),
      ],
      true
    )
  }

  private buildStairs(only?: number) {
    const woodFace = 0x8a6034
    const woodTop = 0xa8794a
    const woodDark = 0x5f4224
    const beamWood = 0x6f4423
    const railWood = 0x7a4c28
    const railHeight = 26

    if (only === undefined) {
      this.stairs = []
      this.stairGfx = []
      this.stairRails = []
    }

    ;(this.level.stairs ?? []).forEach((def, stairIndex) => {
      // 修复某一跑时只重建那一跑（only 有值就跳过别的）
      if (only !== undefined && only !== stairIndex) {
        return
      }

      // 重建这一跑时先把旧的护栏丢掉（startRepair 那边也会 destroy 旧的 stairGfx）
      this.stairRails[stairIndex]?.destroy()
      this.stairRails[stairIndex] = undefined

      const from = def.from
      const to = def.to
      const dir = to.x >= from.x ? 1 : -1
      const count = Math.max(1, Math.round(Math.abs(to.x - from.x) / STAIR_TREAD))
      const run = Math.abs(to.x - from.x) / count
      const rise = (from.y - to.y) / count

      const layer = def.layer ?? 'front'
      // 树后面的那一跑画在树干（depth 2）之后，玩家走上去时会被树挡住
      const gfx = this.add.graphics().setDepth(def.depth ?? (layer === 'back' ? 1 : 3))
      this.stairGfx[stairIndex] = gfx

      // 砖石楼梯 / 斜坡（玉京台那种）走另一套画法：实心台体 + 砖缝 + 石栏杆
      if (def.style === 'brick' || def.style === 'ramp') {
        this.buildStoneStair(gfx, def, stairIndex, layer, def.style)
        return
      }

      // 这一跑是不是"站在地面上起步"的（起点就在最低那块楼板的顶面上）
      const groundTop = this.level.platforms.reduce(
        (lowest, item) => Math.max(lowest, item.y - item.height / 2),
        Number.NEGATIVE_INFINITY
      )
      const flatFoot = Math.abs(from.y - groundTop) < 2

      // 楼梯走向的单位向量；法线取「朝下」的那一侧，木梁和扶栏都往这边长出厚度
      const length = Phaser.Math.Distance.Between(from.x, from.y, to.x, to.y)
      const ux = (to.x - from.x) / length
      const uy = (to.y - from.y) / length
      const flip = ux >= 0 ? 1 : -1
      const nx = -uy * flip
      const ny = ux * flip

      // 底下的斜梁：默认是平行四边形（下端贴着下层地面、上端接上层地面）。
      // 但如果这一跑是"站在地面上起步"的，梁的底边要削平、直接贴在地面上 ——
      // 那种情况画成三角形（斜边 = 楼梯底面，底边水平，右端竖直），
      // 不然梁的下沿会一路翘到右端，看着像楼梯悬在半空
      const beamThickness = 10

      // 这一跑上断了几级：repairs 里点名的那些（数据里都是一段连续的）。
      // 缺口盖住的台阶线区间是 [gapFrom, gapTo]
      const broken: number[] = []

      for (let i = 0; i < count; i++) {
        if (this.isBrokenStep(stairIndex, i)) {
          broken.push(i)
        }
      }

      const gapFrom = broken.length > 0 ? broken[0] : -1
      const gapTo = broken.length > 0 ? broken[broken.length - 1] + 1 : -1

      // 台阶线上第 i 个点（第 i 级"靠下那一头"的角点）
      const pointAt = (i: number) => ({ x: from.x + dir * run * i, y: from.y - rise * i })

      // 斜梁的一截：沿着台阶线走，往法线方向长出 beamThickness。
      // 整段画的时候和原来一模一样（地面上起步的那种仍然是水平底边的三角梁）
      const beamPiece = (i0: number, i1: number) => {
        gfx.fillStyle(beamWood, 1)

        if (flatFoot && i0 === 0 && i1 === count) {
          gfx.fillTriangle(from.x, from.y, to.x, to.y, to.x, from.y)
          return
        }

        const a = pointAt(i0)
        const b = pointAt(i1)

        gfx.fillPoints(
          [
            new Phaser.Math.Vector2(a.x, a.y),
            new Phaser.Math.Vector2(b.x, b.y),
            new Phaser.Math.Vector2(b.x + nx * beamThickness, b.y + ny * beamThickness),
            new Phaser.Math.Vector2(a.x + nx * beamThickness, a.y + ny * beamThickness),
          ],
          true
        )
      }

      if (gapFrom < 0) {
        beamPiece(0, count)
      } else {
        // 断口的梁断成两截，不再一通到底
        beamPiece(0, gapFrom)
        beamPiece(gapTo, count)

        // 断头往缺口里炸开的木刺：贴着梁的厚度方向排三片，长短不一
        const fray = (i: number, sign: number) => {
          const p = pointAt(i)

          for (let k = 0; k < 3; k++) {
            const off = 1 + k * 3.4

            gfx.fillStyle(k === 1 ? woodTop : woodFace, 1)
            gfx.fillTriangle(
              p.x + nx * off,
              p.y + ny * off,
              p.x + nx * off + sign * (7 + (k % 2) * 5),
              p.y + ny * off + 2,
              p.x + nx * off + sign * 2,
              p.y + ny * off + 3.6
            )
          }
        }

        fray(gapFrom, dir)
        fray(gapTo, -dir)

        // 上头那截梁的断口垂一片断板下来：一端还挂在梁上，一端朝下甩开
        const hang = pointAt(gapTo)
        const hx = hang.x + nx * 2
        const hy = hang.y + ny * 2

        gfx.fillStyle(beamWood, 1)
        gfx.fillPoints(
          [
            new Phaser.Math.Vector2(hx, hy),
            new Phaser.Math.Vector2(hx - dir * 8, hy + 24),
            new Phaser.Math.Vector2(hx - dir * 8 + 5, hy + 26.5),
            new Phaser.Math.Vector2(hx + 5, hy + 2.5),
          ],
          true
        )
        gfx.fillStyle(woodDark, 1)             // 甩开的那头是断口，压暗
        gfx.fillTriangle(
          hx - dir * 8,
          hy + 24,
          hx - dir * 8 + 5,
          hy + 26.5,
          hx - dir * 5,
          hy + 25
        )
      }

      for (let i = 0; i < count; i++) {
        // 断口：这一级的图形和碰撞都不生成
        if (this.isBrokenStep(stairIndex, i)) {
          continue
        }

        const near = from.x + dir * run * i          // 这一级靠下的一头
        const top = from.y - rise * (i + 1)          // 这一级踏面的高度
        const left = dir > 0 ? near : near - run

        gfx.fillStyle(woodFace, 1)
        gfx.fillTriangle(near, top, near + dir * run, top, near, top + rise)

        gfx.fillStyle(woodTop, 1)
        gfx.fillRect(left, top, run, 2)
        gfx.fillStyle(woodDark, 1)
        gfx.fillRect(left, top + 2, run, 1)

        const step = this.platforms.create(
          near + (dir * run) / 2,
          top + rise / 2,
          'pixel'
        ) as Phaser.Physics.Arcade.Sprite

        step.setDisplaySize(run, rise)
        step.setVisible(false)
        step.refreshBody()
        step.setData('stair', true)
        step.setData('layer', layer)
        step.setData('flight', stairIndex)

        // 踏板只留两个面：顶面（能踩、能当自动上台阶的目标）+
        // "上楼那一侧"的面（往上走时靠它挡住并把人抬上去）。
        // 另外两个面（下面、以及背着楼梯那一侧）关掉 ——
        // 这样人从楼梯背面贴着楼板/地面走，或者从 1/2 平台跳下来落到楼梯背面时，
        // 能穿到楼梯底下再往上爬，不会卡在楼梯下面
        const stepBody = step.body as Phaser.Physics.Arcade.StaticBody

        stepBody.checkCollision.down = false

        if (dir > 0) {
          stepBody.checkCollision.right = false
        } else {
          stepBody.checkCollision.left = false
        }

        this.stairs.push(step)
      }

      // 斜扶栏：和台阶平行，架在踏面上方 railHeight 那么高
      // 单独画一张 Graphics：depth 压在人上面（人从前台走过时，栏杆在台阶外侧）
      const railGfx = this.add
        .graphics()
        .setDepth(def.railDepth ?? (layer === 'back' ? 1.4 : 12))
      this.stairRails[stairIndex] = railGfx

      const railThickness = 4
      // 扶栏跟斜梁一样断：断口处断成两截，上头再垂一截断栏下来
      const railPointAt = (i: number) => {
        const p = pointAt(i)

        return { x: p.x, y: p.y - railHeight }
      }

      const railPiece = (i0: number, i1: number) => {
        const a = railPointAt(i0)
        const b = railPointAt(i1)

        railGfx.fillStyle(railWood, 1)
        railGfx.fillPoints(
          [
            new Phaser.Math.Vector2(a.x, a.y),
            new Phaser.Math.Vector2(b.x, b.y),
            new Phaser.Math.Vector2(b.x + nx * railThickness, b.y + ny * railThickness),
            new Phaser.Math.Vector2(a.x + nx * railThickness, a.y + ny * railThickness),
          ],
          true
        )
      }

      if (gapFrom < 0) {
        railPiece(0, count)
      } else {
        railPiece(0, gapFrom)
        railPiece(gapTo, count)

        const hang = railPointAt(gapTo)

        railGfx.fillStyle(railWood, 1)
        railGfx.fillPoints(
          [
            new Phaser.Math.Vector2(hang.x, hang.y),
            new Phaser.Math.Vector2(hang.x - dir * 6, hang.y + 20),
            new Phaser.Math.Vector2(hang.x - dir * 6 + 4, hang.y + 21),
            new Phaser.Math.Vector2(hang.x + 4, hang.y),
          ],
          true
        )
      }

      // 立柱：每 4 级一根，把扶栏和底下的斜梁连起来
      railGfx.fillStyle(beamWood, 1)

      for (let i = 0; i <= count; i += 4) {
        // 断口里的立柱不存在（否则会悬在缺口里）
        if (gapFrom >= 0 && i > gapFrom && i < gapTo) {
          continue
        }

        const postX = from.x + dir * run * i
        const t = (postX - from.x) / (to.x - from.x)

        railGfx.fillRect(postX - 1.5, from.y - railHeight + (to.y - from.y) * t, 3, railHeight)
      }
    })
  }

  // 走进/走出树的图层：踩到判定区就把人切到那一层
  // 这一跑的这级是不是断的（repairs 里点了名、而且还没修）
  private isBrokenStep(stairIndex: number, step: number) {
    if (this.repaired.includes(`${stairIndex}:${step}`)) {
      return false
    }

    return (this.level.repairs ?? []).some(
      (repair) => repair.stair === stairIndex && repair.steps.includes(step)
    )
  }

  // 这处断口是不是已经在存档里修好了
  private isRepaired(def: RepairDef) {
    return def.steps.every((step) => this.repaired.includes(`${def.stair}:${step}`))
  }

  private updateDepthGates(body: Phaser.Physics.Arcade.Body) {
    // 玉京台那种「按高度切层」：脚底过了这条线就是后层，回来就切回前层。
    // 比判定区稳 —— 上跑下跑来回走都不会翻错
    const layerLine = this.level.layerLine

    if (layerLine) {
      const want: 'front' | 'back' = body.bottom < layerLine.y ? 'back' : 'front'

      if (want !== this.playerLayer) {
        this.setPlayerLayer(want)
      }
    }

    const gates = this.level.depthGates

    if (!gates) {
      return
    }

    for (let index = 0; index < gates.length; index++) {
      const gate = gates[index]
      const inside =
        body.right > gate.x - gate.width / 2 &&
        body.left < gate.x + gate.width / 2 &&
        body.bottom > gate.y - gate.height / 2 &&
        body.top < gate.y + gate.height / 2

      // 一次停留只翻一层：在判定区里朝 dir 方向走一下就换层，走出去再进来才会再翻
      if (inside && Math.sign(body.velocity.x) === (gate.dir ?? 1) && !this.gateFired[index]) {
        this.gateFired[index] = true
        this.setPlayerLayer(this.playerLayer === 'back' ? 'front' : 'back')
      } else if (!inside) {
        this.gateFired[index] = false
      }
    }
  }

  // 切换「树前面 / 树后面」：画面层级跟着换。
  // 走到树后面时整个人画在树干（depth 2）之后，同时把树干调淡 —— 透视，能看见人和楼梯
  private setPlayerLayer(layer: 'front' | 'back') {
    if (this.playerLayer === layer) {
      return
    }

    this.playerLayer = layer

    const back = layer === 'back'

    this.slimeArt.setDepth(back ? 1.2 : 10)
    this.wingLeft.setDepth(back ? 1.1 : 9)
    this.wingRight.setDepth(back ? 1.1 : 9)
    this.rockCrown.setDepth(back ? 1.1 : 9)
    this.armorPlate.setDepth(back ? 1.15 : 9)
    this.thunderRod.setDepth(back ? 1.1 : 9)
    this.windTrails.forEach((trail) => trail.setDepth(back ? 1.1 : 9))
    this.eyes.forEach((eye) => eye.setDepth(back ? 1.3 : 11))
    // 接地影永远压在史莱姆底下（换到树后层时也要跟着沉下去）
    this.slimeShadow?.setDepth(back ? 1.05 : 8.6)

    // 客栈家具跟着换：树后层整组沉到史莱姆后面
    this.innDecor.forEach((item) => item.image.setDepth(back ? item.back : item.front))

    // 头顶那盘菜跟着人换层，不然走到树后面它还飘在树前
    this.carriedDish?.setDepth(back ? 1.35 : 11.5)
    // 券门上方那块墙也跟着换层：它挡的必须是"史莱姆当前图层"里的那个人
    this.wallRT?.setDepth(back ? 1.35 : 12.5)

    // 压力板也换：树后层要把板子沉到史莱姆后面，否则人站在板子上会被板子盖住脚
    this.plateList.forEach((item) =>
      item.art.setDepth(back ? PLATE_DEPTH.back : PLATE_DEPTH.front)
    )

    this.updateTrunk()
    this.updateRoot()
    this.updateSpindle()
    this.updateRevealRails()
  }

  // 层补片（活板）的透视：楼板照常画着，只在史莱姆附近擦掉一个椭圆。
  // 史莱姆在「另一层」时才擦（这时这截楼板挡在它前面）；在自己那一层时楼板是完整的。
  // 跟 updateTrunk 一样：图层没变、人也没动就跳过，省性能
  private updateLayerReveals() {
    if (this.layerPieces.length === 0) {
      return
    }

    const px = this.slime.x
    const py = this.slime.y

    this.layerPieces.forEach((piece) => {
      const last = piece.drawn

      if (
        last.layer === this.playerLayer &&
        Math.abs(px - last.x) < 1 &&
        Math.abs(py - last.y) < 1
      ) {
        return
      }

      const rt = piece.rt

      rt.clear()

      if (piece.plank) {
        rt.repeat('wood-plank', undefined, 0, 0, piece.width, piece.height)
      } else {
        rt.fill(piece.tint, 1, 0, 0, piece.width, piece.height)
      }

      if (piece.layer !== this.playerLayer) {
        rt.erase('reveal-blob', px - piece.left, py - piece.top)
      }

      // RenderTexture 是先往缓冲里记命令，必须再 render() 一次才会真正画进去
      rt.render()
      piece.drawn = { x: px, y: py, layer: this.playerLayer }
    })
  }

  // 楼内那根短木的数据（可选字段，没写就不画）
  private get spindleDef() {
    return (
      this.level as {
        spindle?: { x: number; y: number; width: number; height: number; depth?: number }
      }
    ).spindle
  }

  // 水利电梯的数据（可选字段，没写就不建）
  private get liftDef() {
    return (
      this.level as {
        lift?: { x: number; width: number; stops: number[] }
      }
    ).lift
  }

  // 建井道、轿厢、每层井口的挡板。轿厢初始停在第 0 站（stops[0]）
  private buildLift() {
    const lift = this.liftDef

    this.liftCar = null
    this.liftCarArt = null
    this.liftRope = null
    this.liftIndex = 0
    this.liftMoving = false
    this.liftRider = false

    if (!lift || lift.stops.length < 2) {
      return
    }

    const half = lift.width / 2
    const topStop = Math.min(...lift.stops)
    const bottomStop = Math.max(...lift.stops)
    const carH = 8

    // 轿厢一开始就停在地面那一站（用户要求：进关卡不用再等它从顶上下来）。
    // stops 是从高到低排的，但这里不依赖顺序 —— 直接找 y 最大的那一站
    this.liftIndex = lift.stops.indexOf(bottomStop)

    // 井道两侧的立柱（画在楼板之后、树干之前）：加深加粗一点，从地面一直到顶层都看得见
    const railHeight = bottomStop - topStop + 30
    const railY = (topStop + bottomStop) / 2

    ;[lift.x - half - 3, lift.x + half + 1].forEach((railX) => {
      this.add.rectangle(railX, railY, 4, railHeight, 0x4a3320).setDepth(2.4)
      this.add.rectangle(railX + 2, railY, 1, railHeight, 0x7a5a38).setDepth(2.41)
    })

    // 轿厢：挡住玩家的那块（静态体，靠 refreshBody 跟着走）
    const car = this.platforms.create(
      lift.x,
      lift.stops[this.liftIndex] + carH / 2,
      'pixel'
    ) as Phaser.Physics.Arcade.Sprite

    car.setDisplaySize(lift.width, carH)
    car.setVisible(false)
    car.refreshBody()
    car.setData('liftCar', true)
    this.liftCar = car

    // 轿厢的样子（专用的轿厢贴图，比普通木板更容易认）+ 上面吊着的绳子
    this.liftCarArt = this.add
      .image(lift.x, lift.stops[this.liftIndex] + carH / 2, 'lift-car')
      .setDepth(2.5)

    this.liftRope = this.add
      .rectangle(lift.x, topStop - 12, 2, 10, 0x6f4423)
      .setOrigin(0.5, 0)
      .setDepth(2.45)

    // 轿厢一开始就停在地面那一站（用户要求：进关卡不用再等它从顶上慢慢下来）。
    // **真正管用的是 this.liftState.y** —— updateLift() 每帧都拿它去摆轿厢和吊绳，
    // 光改上面刚体/贴图的初始位置没用（会被下一帧覆盖回去）
    this.liftState.y = bottomStop

    // 每层井口：只在两侧画一对短立柱（纯画面，不挡人）。
    // 不做挡板/横杆了 —— 那是实体，人还能跳上去，也会把轿厢里的人卡住
    lift.stops.forEach((stop) => {
      ;[-1, 1].forEach((side) => {
        const portX = lift.x + side * (half + 4)

        this.add.rectangle(portX, stop - 9, 5, 18, 0x6f4423).setDepth(2.6)      // 门柱
        this.add.rectangle(portX, stop - 19, 7, 3, 0x5f4224).setDepth(2.61)    // 柱头
        this.add.rectangle(portX, stop - 2, 9, 4, 0x8a6034).setDepth(2.62)     // 门槛
      })
    })

    // 井道底部的立式水车 + 水槽：既是"水利"的表现，也让地面的电梯口一眼看得出来
    this.liftWheel = this.add
      .image(lift.x - half - 58, bottomStop - 44, 'water-wheel')
      // 深度给负：水车底座那几像素落在地面线以下，画在地面后面才是"扎在地里"
      .setDepth(-5)

    this.add
      .rectangle(lift.x - half - 58, bottomStop - 5, 104, 12, 0x2f6f8f)
      .setAlpha(0.5)
      .setDepth(-4.9)
  }

  // 每帧：把轿厢、吊绳挪到当前高度；玩家站在轿厢上就跟着一起走
  private updateLift() {
    const lift = this.liftDef
    const car = this.liftCar

    if (!lift || !car) {
      return
    }

    const y = this.liftState.y
    const topStop = Math.min(...lift.stops)

    car.setPosition(lift.x, y + 4)
    car.refreshBody()
    this.liftCarArt?.setPosition(lift.x, y + 4)

    if (this.liftRope) {
      this.liftRope.setPosition(lift.x, topStop - 12)
      this.liftRope.setSize(2, Math.max(4, y - topStop + 12))
    }

    const body = this.slime.body as Phaser.Physics.Arcade.Body

    // 上车那一趟一路栓住（不再逐帧比距离，速度再快也不会把人落下）
    if (this.liftMoving && this.liftRider) {
      body.reset(body.center.x, y - body.height / 2)
    }
  }

  // 站在轿厢上按 F：站在中线左边 = 下行、右边 = 上行；站在楼口按 F = 把轿厢叫到这一层
  private useLift() {
    const lift = this.liftDef

    if (!lift || !this.liftCar || this.liftMoving) {
      return
    }

    const body = this.slime.body as Phaser.Physics.Arcade.Body
    const onCar =
      Math.abs(body.bottom - this.liftState.y) < 5 &&
      Math.abs(this.slime.x - lift.x) < lift.width / 2 + 4

    if (!onCar) {
      const stopIndex = lift.stops.findIndex((stop) => Math.abs(body.bottom - stop) < 8)

      if (stopIndex < 0 || stopIndex === this.liftIndex) {
        return
      }

      this.liftRider = false
      this.moveLiftTo(stopIndex)
      return
    }

    const wantUp = this.slime.x > lift.x
    const next = wantUp ? this.liftIndex - 1 : this.liftIndex + 1

    if (next < 0 || next >= lift.stops.length) {
      this.showMessage('水利电梯已经到头了。')
      return
    }

    this.liftRider = true
    this.moveLiftTo(next)
  }

  private moveLiftTo(index: number) {
    const lift = this.liftDef

    if (!lift) {
      return
    }

    const from = this.liftState.y
    const to = lift.stops[index]
    const distance = Math.abs(to - from)
    // 水利电梯慢得像水车：约 110 像素/秒
    // （跨一层约 2.3 秒；从一层直接到地面 1050 像素，约 9.5 秒）
    const duration = Math.max(900, (distance / 110) * 1000)

    this.liftMoving = true
    this.inputLocked = true
    playSfx(this, 'sfx-interact', 0.25)

    // 水车跟着转：上行顺时针、下行逆时针，转速和行程成正比。
    // 分母是"推进多少像素转 1/4 圈"——数字越大水车转得越慢（40 ≈ 每秒 0.7 圈，像真水车）
    if (this.liftWheel) {
      const turn = (distance / 40) * (Math.PI / 2) * (to < from ? -1 : 1)

      this.tweens.add({
        targets: this.liftWheel,
        rotation: this.liftWheel.rotation + turn,
        duration,
        ease: 'Linear',
      })
    }

    this.tweens.add({
      targets: this.liftState,
      y: to,
      duration,
      ease: 'Sine.easeInOut',
      onComplete: () => {
        this.liftIndex = index
        this.liftMoving = false
        this.liftRider = false
        this.inputLocked = false
        playSfx(this, 'sfx-land', 0.22)
      },
    })
  }

  // 重画短木：树皮平铺一层（只取贴图中间那片），玩家在树后层时擦透视洞
  private updateRoot() {
    const rt = this.rootRT

    if (!rt) {
      return
    }

    const px = this.slime.x
    const py = this.slime.y
    const last = this.rootDrawn

    if (last.layer === this.playerLayer && Math.abs(px - last.x) < 1 && Math.abs(py - last.y) < 1) {
      return
    }

    rt.clear()
    // stamp 的 originX/originY 默认是 0.5（贴图中心），这里要按左上角贴，得显式指定
    rt.stamp('tree-root', undefined, 0, 0, { originX: 0, originY: 0 })

    if (this.playerLayer === 'back') {
      // 贴图是按 scaleX 横向缩放画的，擦洞的坐标要先除回去
      rt.erase('reveal-blob', (px - rt.x) / rt.scaleX, py - rt.y)
    }

    // RenderTexture 是先往缓冲里记命令，必须再 render() 一次才会真正画进去
    rt.render()

    this.rootDrawn = { x: px, y: py, layer: this.playerLayer }
  }

  private updateSpindle() {
    const rt = this.spindleRT
    const spindle = this.spindleDef

    if (!rt || !spindle) {
      return
    }

    const px = this.slime.x
    const py = this.slime.y
    const last = this.spindleDrawn

    if (last.layer === this.playerLayer && Math.abs(px - last.x) < 1 && Math.abs(py - last.y) < 1) {
      return
    }

    const left = spindle.x - spindle.width / 2
    const top = spindle.y - spindle.height / 2

    rt.clear()

    // 树皮贴图中间亮、两边暗：往左挪一点，只留中间那一片当短木
    const bark = this.textures.get('tree-trunk').getSourceImage()

    for (let y = 0; y < spindle.height; y += bark.height) {
      // 同上：显式按左上角贴，横向挪到树皮中间那一条，只留中间偏亮的部分
      rt.stamp('tree-trunk', undefined, -(bark.width - spindle.width) / 2, y, {
        originX: 0,
        originY: 0,
      })
    }

    if (this.playerLayer === 'back') {
      rt.erase('reveal-blob', px - left, py - top)
    }

    // RenderTexture 是先往缓冲里记命令，必须再 render() 一次才会真正画进去
    rt.render()

    this.spindleDrawn = { x: px, y: py, layer: this.playerLayer }
  }

  // ── 带透视的栏杆（玉京台） ──────────────────────────────────
  // 半层小平台下面也要铺成「楼梯那种砖石」（用户要求：小平台下方的图换成楼梯下面那种）：
  // 从平台底面一直砌到地面，横缝竖缝和楼梯本体一个做法、一个配色
  private buildStairPadBodies() {
    if (this.flipPads.length === 0) {
      return
    }

    const stoneFace = 0x6a5a48
    const stoneDark = 0x4a3f33
    const groundTop = this.level.platforms.reduce(
      (lowest, item) => Math.max(lowest, item.y - item.height / 2),
      Number.NEGATIVE_INFINITY
    )

    this.flipPads.forEach((pad) => {
      const height = groundTop - pad.top

      if (height <= 2) {
        return
      }

      // 压在台体那道砖墙（0.1）前面、楼梯本体（1~3）后面
      const gfx = this.add.graphics().setDepth(0.6)
      const width = pad.right - pad.left

      gfx.fillStyle(stoneFace, 1)
      gfx.fillRect(pad.left, pad.top, width, height)

      for (let y = pad.top + 12, k = 0; y < pad.top + height - 1; y += 12, k++) {
        gfx.fillStyle(stoneDark, 0.3)
        gfx.fillRect(pad.left + 1, y, width - 2, 1)
        gfx.fillStyle(stoneDark, 0.22)
        gfx.fillRect(pad.left + (k % 2 === 0 ? 1 : width - 2), y, 1, 12)
      }
    })
  }

  // 折返楼梯的换层（玉京台）：**站在哪一跑楼梯上就属于哪一层**；
  // 站在 layerFlip 小平台上则翻一层 —— 上楼过来切后层（好上上跑），
  // 下楼过来切回前层（好下下跑）。上和下共用同一个 x 时，只有靠"你是踩着哪一跑上来的"
  // 才能区分（见「踩过的坑」四十二）。
  private updateStairLayers(body: Phaser.Physics.Arcade.Body) {
    // 换层那部分（flipPads）只有玉京台那种折返楼梯用得上 —— 但下面「下跑穿过去」
    // 是通用机制（第七关地面的那一跑也用了），所以这里不能整体提前 return
    const hasFlipPads = this.flipPads.length > 0
    const defs = this.level.stairs ?? []
    let standingFlight = -1

    for (const step of this.stairs) {
      const stepBody = step.body as Phaser.Physics.Arcade.StaticBody

      if (!stepBody.enable) {
        continue
      }

      const onIt =
        body.right > stepBody.left &&
        body.left < stepBody.right &&
        body.bottom >= stepBody.top - 1 &&
        body.bottom <= stepBody.top + 4

      if (!onIt) {
        continue
      }

      const layer = step.getData('layer') as 'front' | 'back'

      standingFlight = step.getData('flight') as number

      if (hasFlipPads) {
        this.lastFlightLayer = layer

        if (this.playerLayer !== layer) {
          this.setPlayerLayer(layer)
        }
      }

      break
    }

    // ── 下跑"穿过去"（用户 2026/10/11 定的三条）─────────────────
    // 沿着带 passUnder 的下跑一路下到地面之后，要是往外（离开玉京台的方向）走，
    // 会被这条下跑的最低几级抬上楼。做法：先把这一跑的碰撞关掉（画面本来就画在
    // 人后面），人从它下面走过去，等身体穿过「楼梯和身体一样高」那一处再恢复。
    //   获得条件 = 上到「比身高高 2 像素」的那一级楼梯上（踩着这一跑走到
    //              脚底比下端高 body.height + 2 以上，才算拿到这一趟）
    //   接触条件 = 人在地面上、走到这一跑口子外 30 像素以内（往东走进口子）
    //              —— 用户原话是"落地之后往右走 20 像素"，见下面那句注释为什么提前
    //   解除条件 = 身体穿过「楼梯和身体一样高」那一处（再往外楼梯都比人高，
    //              恢复碰撞也挡不住人），或者踩上别的楼梯
    // 自己在上面走的时候当然得开着，所以只在"人不在它上面"时才关。
    if (standingFlight >= 0 && defs[standingFlight]?.passUnder) {
      const granted = defs[standingFlight]

      // 获得条件：脚底已经比这一跑的下端高出「身高 + 2」—— 也就是真的踏上了
      // 比人还高两像素的那一级（用户 2026/10/11 定的，原来是"上到半层小平台"）
      if (granted.from.y - body.bottom >= body.height + 2) {
        this.passUnderGranted = true
      }

      if (this.passUnderGranted) {
        this.passUnderFlight = standingFlight
      }
    }

    if (this.passUnderFlight >= 0) {
      const def = defs[this.passUnderFlight]

      if (!def) {
        this.passUnderFlight = -1
      } else {
        // 站在这一跑上（正在下楼）时，碰撞必须开着，不然人会从半截楼梯掉下去
        const onThisFlight = standingFlight === this.passUnderFlight
        const lowX = def.from.x
        const highX = def.to.x
        const toHigh = Math.sign(highX - lowX) || 1
        // 「楼梯和身体一样高」的那一处：这一跑从 from.y 升到 to.y（高差 rise），
        // 踏板高出地面正好等于史莱姆身高（body.height）的那个 x
        const rise = def.from.y - def.to.y
        const heightX = lowX + ((highX - lowX) * body.height) / rise
        // 接触条件：人在地面上、已经走到这一跑口子外 30 像素以内（也就是往东走进口子）。
        // 用户原话是"落地之后往右走 20 像素"——但自动上台阶在人走到口子前 18 像素
        // （身体前沿碰到第一级踏面）就会把人抬上去，只等 20 像素就已经在楼梯上了，
        // 所以点火点往前挪到"脚踩地面、刚够着口子外面"这一点
        const atMouth = toHigh > 0 ? this.slime.x > lowX - 30 : this.slime.x < lowX + 30
        const passedHeight =
          toHigh > 0 ? this.slime.x > heightX : this.slime.x < heightX
        const movedOn = standingFlight >= 0 && !onThisFlight

        // 解除要在**地面上**走过那一处才算：从台面上下楼的时候，人会先从半层小平台
        // 掉到这一跑的上端（腾空一两帧、x 已经在小平台上，远在那一处之外），
        // 不加"已经落地"就会当场把效果用掉（下楼还没走到地面就没了）
        const grounded = !onThisFlight && body.blocked.down

        if (grounded && (passedHeight || movedOn)) {
          this.setFlightEnabled(this.passUnderFlight, true)
          this.passUnderFlight = -1
          // 一趟用一次：清掉"获得"，要再穿一次得重新走上这一跑
          //（脚底再次高过下端「身高 + 2」就算重新拿到）
          this.passUnderGranted = false
        } else if (grounded && atMouth) {
          // 必须**已经踩在地面上**才关：沿着下跑往下走的时候，一级到下一级之间
          // 会有一两帧腾空，那一瞬间"脚下没有踏面"，要是就此关掉，
          // 人会直接从半截楼梯掉到地面（用户报过这条）
          this.setFlightEnabled(this.passUnderFlight, false)
        }
      }
    }

    if (standingFlight >= 0) {
      this.onFlipPad = false
      return
    }

    this.onFlipPad = false

    const onPad = this.flipPads.some(
      (pad) =>
        body.right > pad.left &&
        body.left < pad.right &&
        Math.abs(body.bottom - pad.top) < 4
    )

    if (!onPad) {
      return
    }

    if (!this.onFlipPad) {
      this.onFlipPad = true
      this.setPlayerLayer(this.lastFlightLayer === 'back' ? 'front' : 'back')
    }
  }

  // 把某一跑的踏面碰撞整体开关掉（"下跑穿过去"用）
  private setFlightEnabled(flight: number, enabled: boolean) {
    this.stairs.forEach((step) => {
      if (step.getData('flight') !== flight) {
        return
      }

      const stepBody = step.body as Phaser.Physics.Arcade.StaticBody

      stepBody.enable = enabled
    })
  }

  // 数据里的 revealRails 每段是一条直线栏杆。整片栏杆先画在一张 RenderTexture 上，
  // 每帧在玩家位置擦一个洞 —— 和第七关那棵树完全同一套做法
  private buildRevealRails() {
    const rails = this.level.revealRails ?? []

    if (rails.length === 0) {
      return
    }

    let left = Number.POSITIVE_INFINITY
    let top = Number.POSITIVE_INFINITY
    let right = Number.NEGATIVE_INFINITY
    let bottom = Number.NEGATIVE_INFINITY

    rails.forEach((rail) => {
      const key = rail.key ?? 'rail-stone'
      const texture = this.textures.get(key).getSourceImage()
      const height = rail.height ?? texture.height

      ;[rail.from, rail.to].forEach((point) => {
        left = Math.min(left, point.x - 16)
        right = Math.max(right, point.x + 16)
        top = Math.min(top, point.y - height - 4)
        bottom = Math.max(bottom, point.y + 4)
      })
    })

    this.revealRailBox = { left, top, width: right - left, height: bottom - top }
    this.revealRailRT = this.add
      .renderTexture(left, top, this.revealRailBox.width, this.revealRailBox.height)
      .setOrigin(0, 0)
      .setDepth(12)
  }

  // 门上方那块墙：盖到玩家前面，再在史莱姆身上擦一个透视洞
  private updateWall() {
    const wallRT = this.wallRT

    // `active` 也要看：场景实例复用，上一局销毁掉的贴图引用可能还在（保险起见再挡一道）
    if (!wallRT || !wallRT.active) {
      return
    }

    const px = this.slime.x
    const py = this.slime.y
    const last = this.wallDrawn

    if (Math.abs(px - last.x) < 1 && Math.abs(py - last.y) < 1) {
      return
    }

    const { left, top } = this.wallBox

    wallRT.clear()
    wallRT.stamp('terrace-gatetop-art', undefined, 0, 0, { originX: 0, originY: 0 })
    // 门洞那一块**静态擦掉**（洞是透的：能看见背景、也能看见走过去的史莱姆）。
    // 坐标是"画框内"的：x = 3430-3270 = 160、y = 848-600 = 248
    wallRT.erase('terrace-doorhole', 160, 248)
    wallRT.erase('reveal-blob', px - left, py - top)
    wallRT.render()

    this.wallDrawn = { x: px, y: py }
  }

  // 背面朝向的摊位 / 房子上擦透视洞（和树干 / 栏杆 / 券门墙同一套做法）：
  // 只有"洞"真的压到这块范围内才重画一次，平时整块贴图就那样放着，别每帧白跑
  private updateHarborFronts() {
    if (this.harborFrontRTs.length === 0) {
      return
    }

    const targets = [{ x: this.slime.x, y: this.slime.y }]

    ;(this.gems.getChildren() as Phaser.Physics.Arcade.Sprite[]).forEach((gem) => {
      if (gem.active) {
        targets.push({ x: gem.x, y: gem.y })
      }
    })

    this.harborFrontRTs.forEach((piece) => {
      // 透视洞本身是 200x168 的一块软椭圆，中心离这块多远才算压上去
      const near = targets.filter(
        (t) =>
          t.x > piece.left - 100 &&
          t.x < piece.left + piece.width + 100 &&
          t.y > piece.top - 84 &&
          t.y < piece.top + piece.height + 84
      )
      const stamp = near.map((t) => Math.round(t.x) + ',' + Math.round(t.y)).join('|')

      if (stamp === piece.drawn) {
        return
      }

      piece.drawn = stamp
      piece.rt.clear()
      piece.rt.stamp(piece.key, undefined, piece.width / 2, piece.height, {
        originX: 0.5,
        originY: 1,
        scale: piece.scale,
      })
      near.forEach((t) => piece.rt.erase('reveal-blob', t.x - piece.left, t.y - piece.top))
      piece.rt.render()
    })
  }

  private updateRevealRails() {
    const rt = this.revealRailRT
    const rails = this.level.revealRails ?? []

    // 同上：场景实例复用，上一局那张贴图可能已经销毁了
    if (!rt || !rt.active || rails.length === 0) {
      return
    }

    const px = this.slime.x
    const py = this.slime.y
    const last = this.revealRailDrawn

    if (Math.abs(px - last.x) < 1 && Math.abs(py - last.y) < 1) {
      return
    }

    const { left, top } = this.revealRailBox

    rt.clear()

    rails.forEach((rail) => {
      const key = rail.key ?? 'rail-stone'
      const dx = rail.to.x - rail.from.x
      const dy = rail.to.y - rail.from.y
      const length = Math.hypot(dx, dy)

      if (length < 1) {
        return
      }

      const angle = Phaser.Math.RadToDeg(Math.atan2(dy, dx))
      // 每 20 像素戳一片，桩距正好接上（贴图本身 24 宽）
      const step = 20

      for (let d = 0; d <= length + 0.5; d += step) {
        const t = Math.min(1, d / length)
        const x = rail.from.x + dx * t
        const y = rail.from.y + dy * t

        rt.stamp(key, undefined, x - left, y - top, {
          originX: 0.5,
          originY: 1,
          angle,
        })
      }
    })

    // 玩家贴到栏杆后面时，在他身上擦一个洞（和树桩一模一样的做法）
    rt.erase('reveal-blob', px - left, py - top)

    // RenderTexture 是先记命令，最后必须 render() 一次才真正画进去
    rt.render()

    this.revealRailDrawn = { x: px, y: py }
  }

  private updateTrunk() {
    const rt = this.trunkRT
    const trunk = this.level.trunk

    if (!rt || !trunk) {
      return
    }

    const back = this.playerLayer === 'back'
    const px = this.slime.x
    const py = this.slime.y
    const last = this.trunkDrawn

    if (last.layer === this.playerLayer && Math.abs(px - last.x) < 1 && Math.abs(py - last.y) < 1) {
      return
    }

    const width = trunk.width
    const height = trunk.height

    rt.clear()
    rt.repeat('tree-trunk', undefined, 0, 0, width, height)

    if (back) {
      rt.erase('reveal-blob', px - (trunk.x - width / 2), py - (trunk.y - height / 2))
    }

    // RenderTexture 是先往缓冲里记命令，必须再 render() 一次才会真正画进去
    rt.render()

    this.trunkDrawn = { x: px, y: py, layer: this.playerLayer }
  }

  // 楼梯的自动上台阶：往楼梯里走的时候，前面那一级只高出一点点（不超过 AUTO_STEP），
  // 就把整个人抬上去，不用跳。只认打了 stair 标记的踏板，其它地方照旧挡人。
  private tryAutoStep(onGround: boolean, dt: number) {
    if (this.inputLocked) {
      return
    }

    // 还没抬完：把剩下这一小段匀成几帧抬完。
    // 一次瞬移到位的话，镜头慢半拍，人在屏幕上会「先弹上去、再被镜头拉回来」，看着就是抖
    if (this.stepRise > 0) {
      const body = this.slime.body as Phaser.Physics.Arcade.Body
      const nextY = Math.max(this.stepTop, body.center.y - STAIR_CLIMB_SPEED * dt)

      // 用 reset 直接把人放到新高度：它会把物理体和位置记录一起同步好，
      // 物理不会再把这一帧的位移重复叠加；同时也绕开碰撞，
      // 头顶不会顶到上面的楼板被卡住（楼梯是从楼板底下钻上去的）
      body.reset(body.center.x, nextY)

      if (nextY <= this.stepTop) {
        this.stepRise = 0
      }

      return
    }

    if (!onGround || this.stairs.length === 0) {
      return
    }

    const body = this.slime.body as Phaser.Physics.Arcade.Body
    const walkingLeft = this.cursors.left.isDown || this.touchLeft
    const walkingRight = this.cursors.right.isDown || this.touchRight

    if (walkingLeft === walkingRight) {
      return
    }

    const dir = walkingLeft ? -1 : 1

    if (dir < 0 ? !body.blocked.left : !body.blocked.right) {
      return
    }

    const footY = body.bottom
    const probeX = this.slime.x + dir * (body.halfWidth + 2)
    let best = 0
    let target = 0

    for (const step of this.stairs) {
      // 自动上台阶也只认玩家所在那一层的台阶
      if (step.getData('layer') !== this.playerLayer) {
        continue
      }

      const stepBody = step.body as Phaser.Physics.Arcade.StaticBody

      // 碰撞被临时关掉的踏面（"下跑穿过去"那一段）不参与抬人
      if (!stepBody.enable) {
        continue
      }

      if (probeX < stepBody.left || probeX > stepBody.right) {
        continue
      }

      const gap = footY - stepBody.top

      if (gap > 0.5 && gap <= AUTO_STEP && gap > best) {
        best = gap
        // 目标高度直接按踏面算，不从当前脚底推：脚底可能差了一帧，推出来会多抬一点点
        target = stepBody.top - body.height / 2
      }
    }

    if (best > 0) {
      this.stepRise = best
      this.stepTop = target
      this.stairCamTime = STAIR_CAM_HOLD
    }
  }

  private syncVisual(sx: number, sy: number) {
    // 岩化时整体放大一圈，像个石墩。放大是绕贴图中心做的，所以贴图要往上提一点，
    // 脚底才不会陷进地面
    const grow = this.armored ? ARMOR_GROW : 1
    const scaleX = sx * grow
    const scaleY = sy * grow
    const growLift = 14.5 * (grow - 1)

    this.slimeArt.setPosition(this.slime.x, this.slime.y - growLift)
    this.slimeArt.setFlipX(this.slime.flipX)
    this.slimeArt.setScale(scaleX, scaleY)

    // 护甲层：贴图中心就是身体圆心，所以挂在身体圆心、和身体同一个缩放
    this.armorPlate.setVisible(this.armored)

    if (this.armored) {
      this.armorPlate.setScale(scaleX, scaleY)
      this.armorPlate.setPosition(this.slime.x, this.slime.y - growLift + 2 * scaleY)
    }

    const look = this.slime.flipX ? -2 : 2

    this.eyes[0].setPosition(
      this.slime.x + (-5 + look) * scaleX,
      this.slime.y - growLift - 2 * scaleY
    )
    this.eyes[1].setPosition(
      this.slime.x + (5 + look) * scaleX,
      this.slime.y - growLift - 2 * scaleY
    )
    this.eyes.forEach((eye) => eye.setScale(1, this.blinkScale))

    const hasWing = ELEMENTS[this.element].wing

    this.wingLeft.setVisible(hasWing)
    this.wingRight.setVisible(hasWing)

    // 岩史莱姆的岩脊：单独一张贴图挂在头顶，所以能明显高过身体
    const isRock = this.element === 'rock'

    this.rockCrown.setVisible(isRock)

    if (isRock) {
      // 岩化态的岩脊贴图更高（32x36），贴图里身体圆心离贴图中心也更远，所以少提上来一点
      const lift = this.armored ? 11 : 8

      this.rockCrown.setTexture(this.armored ? 'rock-crown-armored' : 'rock-crown')
      // 岩脊跟着本体一起放大、形变，所以任何姿势下底座都压在本体顶部
      this.rockCrown.setScale(scaleX, scaleY)
      this.rockCrown.setFlipX(this.slime.flipX)
      this.rockCrown.setPosition(this.slime.x, this.slime.y - growLift - lift * scaleY)
    }

    // 雷史莱姆的雷极：和岩脊一个挂法（贴图 26x44，身体圆心在贴图 (13,33)，
    // 往上提 9 像素，尾端那颗雷球就正好坐在头顶）
    const isThunder = this.element === 'thunder'

    const showRod = isThunder && !this.blinkAiming

    this.thunderRod.setVisible(showRod)

    if (showRod) {
      this.thunderRod.setScale(scaleX, scaleY)
      this.thunderRod.setFlipX(this.slime.flipX)
      this.thunderRod.setPosition(this.slime.x, this.slime.y - growLift - 9 * scaleY)

      // 极性符号严格闪在顶上那颗雷球里（贴图里球心在 (19,5)，相对贴图中心 (13,22) 是 (+6,-17)；
      // 符号本身 7x7，正好落在球的芯里）
      const side = this.slime.flipX ? -1 : 1

      this.polarityMark.setPosition(
        this.thunderRod.x + 6 * side * scaleX,
        this.thunderRod.y - 17 * scaleY
      )
    }

    if (hasWing) {
      this.wingLeft.setScale(0.75)
      this.wingRight.setScale(0.75)
      this.wingLeft.setOrigin(1, 0.5)
      this.wingRight.setOrigin(0, 0.5)
      this.wingLeft.setPosition(
        this.slime.x - 16 * sx,
        this.slime.y - 6 * sy + this.wingOffset
      )
      this.wingRight.setPosition(
        this.slime.x + 16 * sx,
        this.slime.y - 6 * sy + this.wingOffset
      )
      this.wingLeft.setFlipX(true)
      this.wingLeft.setAngle(-45)
      this.wingRight.setAngle(45)
    }

    const body = this.slime.body as Phaser.Physics.Arcade.Body
    const target = this.blessed && Math.abs(body.velocity.x) > 10 ? 1 : 0

    // 接地影：踩到地面时把"脚下那条线"记下来，跳起来就变小变淡。
    // **坡面也要算地面**：走坡时脚底是 updateSlopes 接管的，body.blocked.down 是 false，
    // 只看 blocked.down 的话影子会一直停在上一块平台上（2026/10/17 用户发现）。
    let shadowGroundY = this.lastGroundY
    let shadowOverSlope = this.slopeGrip

    if (body.blocked.down || this.slopeGrip) {
      this.lastGroundY = body.bottom
      shadowGroundY = body.bottom
    } else if (this.level.slopes && this.level.slopes.length > 0) {
      // 空中：如果脚下还有一条当前层的坡，让影子贴着那条坡走，
      // 而不是停在起跳那一点 —— 在坡上跳起来时差别很明显。
      let nearest: number | null = null

      for (const def of this.level.slopes) {
        if ((def.layer ?? 'front') !== this.playerLayer) {
          continue
        }

        const surface = this.slopeSurfaceAt(def, this.slime.x)

        if (surface === null || surface < body.bottom - 2) {
          continue
        }

        if (nearest === null || surface < nearest) {
          nearest = surface
        }
      }

      if (nearest !== null) {
        shadowGroundY = nearest
        shadowOverSlope = true
      }
    }

    const air = Math.max(0, shadowGroundY - body.bottom)

    // 后层的坡画在 1.1：影子如果还按后层的 1.05 摆，会被坡面盖掉一半。
    // 在坡上（或坡上方）时把它抬到坡面之上、人物（1.2）之下。
    if (this.playerLayer === 'back') {
      this.slimeShadow.setDepth(shadowOverSlope ? 1.19 : 1.05)
    }

    this.slimeShadow.setPosition(this.slime.x, shadowGroundY - 1)
    this.slimeShadow.setAlpha(Phaser.Math.Clamp(0.6 - air / 240, 0.12, 0.6))
    this.slimeShadow.setScale(Phaser.Math.Clamp(1 - air / 420, 0.55, 1))

    this.trailFade = Phaser.Math.Linear(this.trailFade, target, 0.1)

    const dir = this.slime.flipX ? 1 : -1
    const shimmer = 0.7 + 0.3 * Math.sin(this.time.now / 180)

    this.windTrails.forEach((trail, index) => {
      trail.setVisible(this.trailFade > 0.02)

      if (this.trailFade > 0.02) {
        trail.setAlpha(this.trailFade * (0.5 - index * 0.14) * (shimmer - index * 0.15))
        trail.setPosition(this.slime.x + dir * (24 + index * 9), this.slime.y + 9 + index * 2)
      }
    })
  }

  // 这一关一共几颗原石：摆在关卡里的 + 冻在琥珀里的（不写 loot 的琥珀默认就是原石）
  private gemTotalCount() {
    const inAmber = (this.level.ambers ?? []).filter((amber) => (amber.loot ?? 'gem') === 'gem').length

    return this.level.gems.length + inAmber
  }

  private refreshGemHud() {
    const collected = new Set([
      ...(this.devLevel ? [] : (progress.levelGems[progress.levelIndex] ?? [])),
      ...this.collectedIndices,
    ])

    this.gemIcons.forEach((icon, index) => {
      // 按「已经收集到的数量」从左往右依次点亮：跳着捡也不会出现"第 1 个灭、第 2 个亮"
      icon.setTint(index < collected.size ? 0x6ec6ff : 0x33333f)
    })
  }

  private grantBlessing() {
    this.blessed = true
    this.stamina = STAMINA_MAX
    this.staminaGlowOuter.setVisible(true)
    this.staminaGlow.setVisible(true)
    this.showMessage('别怕，借你一点风的力量——去吧。')
  }

  private endBlessing() {
    this.blessed = false
    this.staminaGlowOuter.setVisible(false)
    this.staminaGlow.setVisible(false)
    this.showMessage('愿风神护佑你')
  }

  // 捡木材：一趟一根，数量进存档
  private takePickup(pickup: (typeof this.pickupList)[number]) {
    pickup.taken = true
    pickup.parts.forEach((part) => part.destroy())

    this.woods += 1

    playSfx(this, 'sfx-gem', 0.5)
    this.showMessage('拿到木材 ×1（拿去修楼梯）')
  }

  // 修楼梯：木板飞入 + 落地音 + 震屏，动画结束把这一跑重建（断口就补回来了）
  private startRepair(repair: (typeof this.repairList)[number]) {
    if (this.woods <= 0 || repair.done) {
      return
    }

    const def = repair.def

    this.woods -= 1

    // 动画期间锁操作（和神像那段一个做法）
    this.inputLocked = true

    // 三块木板依次从上面飞进来：两块补回缺掉的踏面（落点在缺口里），
    // 一块补回上面断掉的扶栏（落得高 26 像素）。每落一块扬一次尘
    const landings = [
      { dx: 4, dy: 0, delay: 0, angle: -6 },
      { dx: 20, dy: 0, delay: 90, angle: 7 },
      { dx: 12, dy: -26, delay: 170, angle: -4 },
    ]

    landings.forEach(({ dx, dy, delay, angle }) => {
      this.time.delayedCall(delay, () => {
        const plank = this.add
          .image(def.x + dx * 3, def.y - 96 + dy, 'wood-plank')
          .setDepth(7)

        this.tweens.add({
          targets: plank,
          x: def.x + dx,
          y: def.y + dy,
          angle,
          duration: 320,
          ease: 'Quad.easeIn',
          onComplete: () => {
            playSfx(this, 'sfx-land', 0.18)
            this.cameras.main.shake(160, 0.004)
            this.dustPuff(def.x + dx, def.y + dy)
            plank.destroy()
          },
        })
      })
    })

    this.time.delayedCall(580, () => {
      repair.done = true
      repair.mark.destroy()

      for (const step of def.steps) {
        this.repaired.push(`${def.stair}:${step}`)
      }

      // 这一跑整段重建：断掉的踏步长回来
      this.stairGfx[def.stair]?.destroy()
      this.stairs
        .filter((s) => s.getData('flight') === def.stair)
        .forEach((s) => s.destroy())
      this.stairs = this.stairs.filter((s) => s.getData('flight') !== def.stair)
      this.buildStairs(def.stair)

      this.inputLocked = false

      // 「修好了几处」要看存档里的状态，不能数这一局修过几处 ——
      // 上一局已经修好的那处在重开后不会再进 repairList（被 isRepaired 跳过了）
      const allRepairs = this.level.repairs ?? []
      const done = allRepairs.filter((item) => this.isRepaired(item)).length

      if (done >= allRepairs.length) {
        this.stairsDone = true
        this.showMessage('上楼看看')
      } else {
        this.showMessage(`楼梯修好了（${done}/${allRepairs.length}）`)
      }

      // 注意：宝箱不再"修完楼梯就出现"了 —— 第七关的收口改成"把杏仁豆腐端给顶楼那位仙人"，
      // revealGoal() 现在在 xiaoLeaves() 里调（见那句注释）
    })
  }

  // 木板落地扬起的土屑：几粒小点往两边散开、边升边淡掉
  private dustPuff(x: number, y: number) {
    for (let i = 0; i < 6; i++) {
      const dust = this.add
        .image(x, y, 'pixel')
        .setDisplaySize(3, 3)
        .setTint(0xc9b48a)
        .setDepth(7)

      this.tweens.add({
        targets: dust,
        x: x + Phaser.Math.Between(-16, 16),
        y: y - Phaser.Math.Between(1, 9),
        alpha: 0,
        scale: 0.4,
        duration: Phaser.Math.Between(220, 380),
        onComplete: () => dust.destroy(),
      })
    }
  }

  private showMessage(text: string) {
    const message = this.add
      .text(240, 232, this.wrapCjk(text, 24).join('\n'), {
        fontFamily: 'sans-serif',
        fontSize: '16px',
        color: '#ffe9a8',
        backgroundColor: '#000000aa',
        padding: { x: 10, y: 5 },
      })
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(HUD_MESSAGE_DEPTH)
      .setAlpha(0)

    this.tweens.add({
      targets: message,
      alpha: 1,
      duration: 250,
      hold: 2000,
      yoyo: true,
      onComplete: () => {
        message.destroy()
      },
    })
  }

  // ── 请仙典仪（第八关）──────────────────────────────────────────
  // 上楼走到左半边广场前面按 F 观的这一场，只演一次，**全程不用玩家操作**：
  //   天空里起一小片风旋 + 几朵云 → 一条东方龙从风旋里坠下来、砸在祭坛上 →
  //   在场所有人头顶冒感叹号 → 凝光头上冒一个气泡说「帝君遇刺，封锁全场」→
  //   镜头归位、把操作还给玩家，提示往右跑。
  // 台词不走对话框，改成挂在凝光头上的气泡（见 speakBubbles）
  private watchRite() {
    const spot = this.level.plaza

    if (!spot || this.riteDone || this.ritePlaying) {
      return
    }

    this.ritePlaying = true
    this.inputLocked = true
    stopAllLoops()
    this.physics.world.pause()

    // 镜头抬到"天空 ↔ 祭坛"之间：上面留出风旋，下面是祭坛和广场上的人。
    // 视野正好是一屏（zoom 1）：上边 601 是屋檐上的天空、下边 871 是祭坛脚，
    // 风旋和"砸下来"的落点都在这一屏里
    const camera = this.cameras.main
    const skyX = spot.x
    const skyY = spot.y - 228       // 风旋在天空里那一点（880 → 652），正好在屋檐上方
    const crashY = spot.y - 74      // 龙砸下去、落在祭坛台面上那一线

    camera.stopFollow()
    camera.pan(spot.x, spot.y - 144, 620, 'Sine.easeInOut')

    playSfx(this, 'sfx-interact', 0.35)

    // ① 风旋 + 云：风旋一边转一边撑大，云从左边慢慢飘过去
    this.time.delayedCall(560, () => {
      const vortex = this.add
        .image(skyX, skyY, 'wind-vortex')
        .setDepth(9.2)
        .setScale(0.18)
        .setAlpha(0)

      this.riteVortex = vortex

      // 放大到 0.8（128 的贴图 → 屏幕上 102 像素），转得慢一点才看得出是一团在旋
      this.tweens.add({ targets: vortex, alpha: 0.95, scale: 0.8, duration: 520, ease: 'Sine.easeOut' })
      this.tweens.add({ targets: vortex, angle: 360, duration: 3000, repeat: -1 })

      // 三朵云互相压着（间距 44，比云本身窄），从风旋左边一起慢慢飘过去
      for (let i = 0; i < 3; i++) {
        const cloud = this.add
          .image(skyX - 104 + i * 44, skyY - 20 + i * 16, 'cloud-puff')
          .setDepth(9.1)
          .setScale(0.62 + i * 0.14)
          .setAlpha(0)

        this.riteClouds.push(cloud)

        this.tweens.add({ targets: cloud, alpha: 0.8, duration: 520, delay: i * 110 })
        this.tweens.add({
          targets: cloud,
          x: cloud.x + 240,
          duration: 3000 + i * 260,
          delay: i * 110,
          ease: 'Sine.easeOut',
        })
      }
    })

    // ② 东方龙从风旋里坠下来：不是直挺挺地掉下来 —— 越掉越大（像朝镜头扑过来）、
    //    身子一路翻、身侧拖几道风痕，最后重重砸在祭坛上
    this.time.delayedCall(1480, () => {
      playSfx(this, 'sfx-fly', 0.45)

      const dragon = this.add
        .image(skyX + 44, skyY + 26, 'dragon-dive')
        .setDepth(9.3)
        .setScale(0.46)
        .setAngle(205)
        .setAlpha(0)

      const trails: Phaser.GameObjects.Image[] = []

      for (let i = 0; i < 3; i++) {
        trails.push(
          this.add
            .image(skyX + 44, skyY + 26, 'pixel')
            .setDisplaySize(2, 24 + i * 10)
            .setTint(0xeaf7ff)
            .setDepth(9.25)
            .setAlpha(0)
        )
      }

      this.tweens.add({ targets: trails, alpha: 0.5, duration: 110 })

      // 风痕贴在龙身后（上面那一侧），每帧把人拖出来的轨迹补上
      this.time.addEvent({
        delay: 16,
        repeat: 38,
        callback: () => {
          trails.forEach((trail, index) => {
            trail.setPosition(dragon.x + (index - 1) * 8, dragon.y - 10 - index * 5)
          })
        },
      })

      this.tweens.add({ targets: dragon, alpha: 1, scale: 1.02, duration: 620, ease: 'Sine.easeIn' })
      // 横向单独走一条弧、纵向加速往下：两条合起来才是"扑下来"的弧线，不是一根直线
      this.tweens.add({ targets: dragon, x: spot.x, duration: 620, ease: 'Sine.easeInOut' })
      this.tweens.add({
        targets: dragon,
        y: crashY,
        angle: 28,
        duration: 620,
        ease: 'Cubic.easeIn',
        onComplete: () => {
          trails.forEach((trail) => trail.destroy())
          dragon.destroy()
          this.riteCrash(spot.x, crashY)
        },
      })
    })
  }

  // ③ 砸上祭坛那一下：镜头抖、白光，灰尘和砖屑炸开，祭坛换成撞毁的那版 + 龙身趴上去；
  //    然后在场所有人头顶冒感叹号，最后凝光头上的气泡说话
  private riteCrash(x: number, y: number) {
    // 砸下来那一下：短促的重抖，紧接着一段余震 —— 别软绵绵地晃一下就完事
    playSfx(this, 'sfx-die', 0.42, 0.72)
    this.cameras.main.shake(120, 0.014)
    this.time.delayedCall(120, () => this.cameras.main.shake(260, 0.005))

    const flash = this.add
      .rectangle(0, 0, 480, 270, 0xfff6d0, 1)
      .setOrigin(0, 0)
      .setScrollFactor(0)
      .setDepth(90)
      .setAlpha(0)

    this.tweens.add({
      targets: flash,
      alpha: 0.9,
      duration: 90,
      yoyo: true,
      hold: 60,
      onComplete: () => flash.destroy(),
    })

    // 落点那一圈冲击波：一下子横着铺开、很快淡掉
    const shock = this.add.image(x, y + 10, 'shock-ring').setDepth(9.35).setScale(0.3).setAlpha(0.95)

    this.tweens.add({
      targets: shock,
      scaleX: 3.4,
      scaleY: 1.6,
      alpha: 0,
      duration: 440,
      ease: 'Quad.easeOut',
      onComplete: () => shock.destroy(),
    })

    // 尘土：贴着地面往两边滚
    for (let i = 0; i < 12; i++) {
      const dust = this.add
        .image(x + Phaser.Math.Between(-26, 26), y + Phaser.Math.Between(0, 10), 'pixel')
        .setDisplaySize(Phaser.Math.Between(8, 16), Phaser.Math.Between(6, 12))
        .setTint(0xb8ae98)
        .setAlpha(0.55)
        .setDepth(9.34)

      this.tweens.add({
        targets: dust,
        x: dust.x + (i % 2 === 0 ? 1 : -1) * Phaser.Math.Between(40, 110),
        y: dust.y - Phaser.Math.Between(6, 26),
        scaleX: 1.9,
        alpha: 0,
        duration: Phaser.Math.Between(520, 820),
        ease: 'Quad.easeOut',
        onComplete: () => dust.destroy(),
      })
    }

    // 砖屑：先被抛起来、再落回地上（分两段 tween 才有抛物线的手感）
    for (let i = 0; i < 12; i++) {
      this.time.delayedCall(i * 22, () => {
        const chip = this.add
          .image(x + Phaser.Math.Between(-24, 24), y + Phaser.Math.Between(-6, 8), 'pixel')
          .setDisplaySize(Phaser.Math.Between(3, 6), Phaser.Math.Between(3, 6))
          .setTint(i % 3 === 0 ? 0x8f8570 : 0xe6dfcd)
          .setDepth(9.4)

        this.tweens.add({
          targets: chip,
          x: chip.x + Phaser.Math.Between(-90, 90),
          y: chip.y - Phaser.Math.Between(18, 52),
          angle: Phaser.Math.Between(-220, 220),
          duration: 240,
          ease: 'Quad.easeOut',
          onComplete: () => {
            this.tweens.add({
              targets: chip,
              y: y + 16,
              duration: 360,
              ease: 'Quad.easeIn',
              onComplete: () => chip.destroy(),
            })
          },
        })
      })
    }

    // 祭坛换版 + 龙身砸上去（落定的时候带一点回弹，不是硬摆上去）
    this.breakAltar(true)

    // ④ 在场所有人头顶冒感叹号（一个一个弹出来）
    this.plazaCrowd.forEach((person, index) => {
      this.time.delayedCall(420 + index * 70, () => {
        if (!person.active) {
          return
        }

        const mark = this.add
          .image(person.x, person.y - person.displayHeight - 8, 'alert-exclaim')
          .setDepth(9.5)
          .setScale(0.4)

        this.riteMarks.push(mark)
        this.tweens.add({ targets: mark, scale: 2, y: mark.y - 6, duration: 240, ease: 'Back.easeOut' })
      })
    })

    // ⑤ 凝光头上的气泡（自动翻页，不用玩家操作）
    this.time.delayedCall(1500, () => {
      const ning = this.plazaNing

      if (!ning) {
        this.endRite()
        return
      }

      this.speakBubbles(
        ning.x,
        ning.y - ning.displayHeight - 14,
        ['帝君遇刺，封锁全场'],
        () => this.endRite()
      )
    })
  }

  // 气泡说话：一句一个气泡 —— 弹出来、停一会儿、淡掉、接下一句。
  // 全程自动，不需要玩家按键（用户要求：这场戏别用对话框）
  private speakBubbles(x: number, y: number, lines: string[], onDone?: () => void) {
    const step = (index: number) => {
      if (index >= lines.length) {
        onDone?.()
        return
      }

      const line = lines[index]
      const bubble = this.add.container(x, y).setDepth(150).setAlpha(0).setScale(0.5)

      const padX = 9
      const padY = 7
      // 文字往上抬 padY：气泡框是 -h ~ 0，字底下留的那点空和上面一样宽，
      // 字才落在气泡正中间（写 0 的话字是贴着框底的）
      const body = this.add
        .text(0, -padY, this.wrapCjk(line, 12).join('\n'), {
          fontFamily: 'sans-serif',
          fontSize: '12px',
          color: '#ffe9a8',
          align: 'center',
          lineSpacing: 4,
        })
        .setOrigin(0.5, 1)

      const w = body.width + padX * 2
      const h = body.height + padY * 2
      const tail = 8
      const panel = this.add.graphics()

      panel.fillStyle(0x14181f, 0.95)
      panel.fillRoundedRect(-w / 2, -h, w, h, 6)
      panel.lineStyle(2, 0xffd54f, 1)
      panel.strokeRoundedRect(-w / 2, -h, w, h, 6)
      // 底下的尖角：先填再描两侧，把面板底边那道线盖掉
      panel.fillStyle(0x14181f, 0.95)
      panel.fillTriangle(-7, -6, 7, -6, 0, tail)
      panel.lineBetween(-7, -6, 0, tail)
      panel.lineBetween(7, -6, 0, tail)

      bubble.add([panel, body])

      this.tweens.add({ targets: bubble, alpha: 1, scale: 1, duration: 180, ease: 'Back.easeOut' })

      const hold = 900 + line.length * 120

      this.time.delayedCall(hold, () => {
        this.tweens.add({
          targets: bubble,
          alpha: 0,
          scale: 0.85,
          duration: 200,
          onComplete: () => {
            bubble.destroy()
            step(index + 1)
          },
        })
      })
    }

    step(0)
  }

  // 祭坛被砸烂：换上撞毁的贴图、收掉坛上的供品、把龙身摆上去。
  // 第一次玩是戏里砸的那一下调的；存档里记过的档一进关卡就调
  private breakAltar(settle = false) {
    const info = this.plazaBreak

    if (!info || this.plazaDragonWreck) {
      return
    }

    this.plazaAltar?.setTexture('terrace-altar-broken')
    this.plazaOffering?.setVisible(false)

    // 层数只比祭坛高一丝：龙身会伸到凝光那个位置，所以它必须还在凝光后面
    const wreck = this.add
      .image(info.x, info.y + 4, 'dragon-wreck')
      .setOrigin(0.5, 1)
      .setScale(info.scale)
      .setDepth(info.depth + 0.001)

    this.plazaDragonWreck = wreck

    // 砸上去的那一版：先压扁、抬高一点，再用回弹落定 —— 有分量，不是啪一下摆在地上
    if (settle) {
      wreck.setScale(info.scale * 1.1, info.scale * 0.88)
      wreck.y -= 12

      this.tweens.add({
        targets: wreck,
        y: info.y + 4,
        scaleX: info.scale,
        scaleY: info.scale,
        duration: 460,
        ease: 'Back.easeOut',
      })
    }
  }

  // 收场：风旋和云散掉、感叹号淡掉、镜头回到正常，把操作还给玩家
  private endRite() {
    const camera = this.cameras.main
    const lift = this.level.cameraLift

    this.riteMarks.forEach((mark) => {
      this.tweens.add({ targets: mark, alpha: 0, duration: 300, onComplete: () => mark.destroy() })
    })
    this.riteMarks = []

    if (this.riteVortex) {
      const vortex = this.riteVortex

      this.riteVortex = null
      this.tweens.add({ targets: vortex, alpha: 0, scale: 0.2, duration: 420, onComplete: () => vortex.destroy() })
    }

    this.riteClouds.forEach((cloud) => {
      this.tweens.add({ targets: cloud, alpha: 0, duration: 500, onComplete: () => cloud.destroy() })
    })
    this.riteClouds = []

    // 券门开了：把封门那块实体和那截画到地面的墙一起拆掉（门楣那块还留着，跳起来照样被顶住）
    if (this.terraceSeal) {
      this.platforms.remove(this.terraceSeal, true, true)
      this.terraceSeal = null
    }

    this.terraceSealArt?.destroy()
    this.terraceSealArt = null

    camera.zoomTo(1, 380, 'Sine.easeInOut')
    camera.startFollow(this.slime, true, 0.12, 0.12)
    // startFollow 会把跟随偏移清成 0，这里按台面高度把镜头抬回去
    camera.setFollowOffset(0, lift && this.cameraLiftNow === lift.offset ? lift.offset : 0)

    this.riteDone = true
    this.ritePlaying = false
    this.inputLocked = false
    this.physics.world.resume()
    this.showMessage('向右跑出玉京台，注意躲避千岩军')
  }

  // 追击开场：镜头往回拉一点看封锁线一眼、闪一下红、喊一声，然后把控制交回玩家
  private startChase() {
    this.chased = true
    this.inputLocked = true
    this.physics.world.pause()

    const camera = this.cameras.main

    // 先把千岩军放到场上，再把镜头推过去看他们 —— 之前是"先看空地方、看完才生成"，
    // 用户反馈镜头放大的地方正好是生成点，看着很怪
    this.spawnChaseSquad()

    const squadX =
      this.chaserList.length > 0
        ? this.chaserList.reduce((sum, chaser) => sum + chaser.sprite.x, 0) / this.chaserList.length
        : this.slime.x - 200

    camera.stopFollow()
    camera.zoomTo(1.35, 450, 'Sine.easeInOut')
    camera.pan((this.slime.x + squadX) / 2, this.slime.y - 30, 600, 'Sine.easeInOut')

    const flash = this.add
      .rectangle(0, 0, 480, 270, 0xc0392b, 1)
      .setOrigin(0, 0)
      .setScrollFactor(0)
      .setDepth(60)
      .setAlpha(0)

    this.tweens.add({
      targets: flash,
      alpha: 0.32,
      duration: 200,
      yoyo: true,
      hold: 140,
      onComplete: () => flash.destroy(),
    })

    this.showMessage('被发现了！往回一看全是千岩军，快跑！')

    this.time.delayedCall(1500, () => {
      camera.zoomTo(1, 400, 'Sine.easeInOut')
      camera.startFollow(this.slime, true, 0.12, 0.12)
      this.physics.world.resume()
      this.inputLocked = false
      playSfx(this, 'sfx-die', 0.35, 1.2)
    })
  }

  // 在玩家身后生成几个千岩军，让它们自己追
  private spawnChaseSquad() {
    const def = this.squadDef

    if (!def) {
      return
    }

    for (let index = 0; index < def.count; index++) {
      const x = this.slime.x - def.gap - index * 28
      const sprite = this.chaserGroup.create(
        x,
        this.slime.y - 40,
        'guard-millelith'
      ) as Phaser.Physics.Arcade.Sprite

      sprite.setOrigin(0.5, 1).setDepth(4)
      sprite.setCollideWorldBounds(true)

      const body = sprite.body as Phaser.Physics.Arcade.Body

      body.setSize(26, 44)

      this.chaserList.push({ sprite, jumpCooldown: 0, stuck: 0, detour: 0 })
    }
  }

  // 追人的 AI：朝玩家走；前面有矮障碍 / 玩家在上方 / 前面是沟就跳；
  // 卡住超过 1.2 秒就往反方向挪一下找路（跳不过去的就真的过不去 ——
  // 高墙、岩柱能挡住它们）
  private updateChasers(dt: number) {
    const def = this.squadDef

    if (!def || this.chaserList.length === 0) {
      return
    }

    // 跑过终点线就安全了：它们收队
    if (this.slime.x > def.stop) {
      if (this.chaserList.length > 0) {
        this.chaserList.forEach((chaser) => chaser.sprite.destroy())
        this.chaserList = []
        this.showMessage('甩掉他们了')
      }

      return
    }

    this.chaserList.forEach((chaser) => {
      const sprite = chaser.sprite

      if (!sprite.active) {
        return
      }

      const body = sprite.body as Phaser.Physics.Arcade.Body
      const dir = this.slime.x < sprite.x ? -1 : 1
      const onGround = body.blocked.down
      const ahead = sprite.x + dir * 20
      const blockedAhead = this.solidAt(ahead, sprite.y - 22) || this.solidAt(ahead, sprite.y - 6)
      const gapAhead = !this.solidAt(ahead, sprite.y + 6)
      const playerAbove = this.slime.y < sprite.y - 26
      const far = Math.abs(this.slime.x - sprite.x) > 90

      if (chaser.jumpCooldown > 0) {
        chaser.jumpCooldown -= dt
      }

      if (chaser.detour > 0) {
        chaser.detour -= dt
      }

      // 卡住的时候先往反方向挪一段（等于"换条路"），挪完继续追
      const moveDir = chaser.detour > 0 ? -dir : dir

      sprite.setVelocityX(moveDir * def.speed)
      sprite.setFlipX(moveDir < 0)

      if (onGround && chaser.jumpCooldown <= 0) {
        if (blockedAhead || (playerAbove && far) || (gapAhead && far)) {
          sprite.setVelocityY(SQUAD.jump)
          chaser.jumpCooldown = SQUAD.jumpCooldown
        }
      }

      // 想往玩家那边走却没在前进 = 卡住了
      if (onGround && Math.abs(body.velocity.x) < 8) {
        chaser.stuck += dt
      } else {
        chaser.stuck = Math.max(0, chaser.stuck - dt * 2)
      }

      if (chaser.stuck > 1.2 && chaser.detour <= 0) {
        chaser.stuck = 0
        chaser.detour = 0.9
      }
    })
  }

  private die(cause: string) {
    // 无敌帧不挡「摔出世界」：雷闪能穿过障碍、能顶掉岩刺，但救不了掉下去
    if (this.dying || (this.invulnTimer > 0 && cause !== 'fall')) {
      return
    }

    // 岩化能挡一次"造物伤害"（红闸门、崩塌的墙）—— 摔落不算，千岩军抓人也不算
    if (this.armored && cause !== 'fall' && cause !== 'guard') {
      this.setArmored(false)
      this.invulnTimer = 1.2
      this.showMessage('岩壳替你挡下了一击')

      return
    }

    this.dying = true
    stopAllLoops()
    playSfx(this, 'sfx-die', 0.45)
    this.scene.pause()
    // 关卡名一起带过去：死亡界面显示的是"死在哪一关"，
    // 而测试关卡不在 LEVELS 里，它自己查存档下标只会查出别人家的名字
    this.scene.launch('dead', { cause, name: this.level.name })
  }

  private showIntro(text: string) {
    this.introShowing = true
    this.physics.world.pause()
    stopAllLoops()

    const layer = this.add.container(0, 0).setDepth(200).setScrollFactor(0)

    const shade = this.add.rectangle(0, 0, 480, 270, 0x0a0a14).setOrigin(0, 0)
    const body = this.add
      .text(240, 118, this.wrapCjk(text, 26).join('\n'), {
        fontFamily: 'sans-serif',
        fontSize: '16px',
        color: '#ffffff',
        align: 'center',
        lineSpacing: 8,
      })
      .setOrigin(0.5)
    const tip = this.add
      .text(240, 232, this.touchMode ? '轻点屏幕继续' : '按 空格 继续', {
        fontFamily: 'sans-serif',
        fontSize: '12px',
        color: '#8fa3b8',
      })
      .setOrigin(0.5)

    layer.add([shade, body, tip])

    this.introLayer = layer

    // 手机上没有空格键，点一下屏幕也能继续（同样延迟一帧再挂，避免被同一次点击吃掉）
    this.time.delayedCall(0, () => {
      this.input.once('pointerdown', () => this.closeIntro())
    })
  }

  private closeIntro() {
    if (!this.introShowing) {
      return
    }

    this.introLayer?.destroy()
    this.introLayer = null
    this.introShowing = false
    this.physics.world.resume()

    // 第七关开局：黑屏文字收掉之后提示一句该往哪走 —— 还没修楼梯、也还没上过顶楼的时候才提示
    if (this.innkeeper && !this.stairsDone && !this.metXiao) {
      this.time.delayedCall(600, () => {
        this.showMessage('乘电梯上楼，找老板娘问问')
      })
    }
  }

  // ── 测试关卡：大厅 + 分类展厅 ──────────────────────────────────
  // 展厅里的展品：神像摆真的，没做过贴图的元素退回一块灰牌
  private buildDevExhibits() {
    const def = this.level as DevLevelDef

    this.devStatues = []

    ;(def.devExhibits ?? []).forEach((exhibit) => {
      if (exhibit.kind === 'prop') {
        const prop = this.add
          .image(exhibit.x, DEV_GROUND_TOP, exhibit.key)
          .setOrigin(0.5, 1)
          .setScale(exhibit.scale ?? 1)
          .setDepth(exhibit.depth ?? 4)

        // 灯笼串那种挂着的，给它一点轻轻晃
        if (exhibit.sway) {
          this.tweens.add({
            targets: prop,
            y: DEV_GROUND_TOP + 2,
            duration: 1600,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut',
          })
        }

        this.makeHint(
          exhibit.x,
          DEV_GROUND_TOP - prop.displayHeight - 14,
          exhibit.label
        )
        return
      }

      if (exhibit.kind === 'statue' && this.textures.exists('statue-' + exhibit.element)) {
        const figure = this.placeStatue(exhibit.x, DEV_GROUND_TOP, exhibit.element)

        // 挂了 playable 的才登记成「能按 F 看演出」的；演出只走动画，不给元素
        if (exhibit.playable) {
          this.devStatues.push({
            x: exhibit.x,
            groundY: DEV_GROUND_TOP,
            element: exhibit.element,
            figure,
          })
        }

        this.makeHint(exhibit.x, DEV_GROUND_TOP - 148, exhibit.label)

        return
      }

      this.addDevSlot(exhibit.x, exhibit.label)
    })
  }

  // 预留位：一块灰牌，写清以后这里要放什么
  private addDevSlot(x: number, label: string) {
    this.add
      .rectangle(x, DEV_GROUND_TOP - 44, 44, 88, 0x232833, 0.7)
      .setStrokeStyle(1, 0x5a6272)
      .setDepth(1)

    this.makeHint(x, DEV_GROUND_TOP - 100, label)
  }

  // 传送门：大厅里一排七扇（每扇写着那间展厅的名字），展厅里只有一扇「回大厅」
  private buildDevPortals() {
    this.devPortals = []

    if (this.devRoom >= 0) {
      const back: DevPortalRef = { x: 70, label: '回大厅', room: -1, groundY: DEV_GROUND_TOP }

      this.drawDevPortal(back.x, back.label, 0xffd27a)
      this.devPortals.push(back)

      return
    }

    DEV_PORTALS.forEach((portal) => {
      this.drawDevPortal(portal.x, portal.label, 0x6ec6ff)
      this.devPortals.push(portal)
    })
  }

  private drawDevPortal(x: number, label: string, tint: number) {
    const midY = DEV_GROUND_TOP - 32

    // 门里那层光：外圈淡、内芯亮，外圈慢慢呼吸
    const glow = this.add.rectangle(x, midY, 38, 66, tint, 0.3).setDepth(1)
    this.add.rectangle(x, midY, 20, 54, 0xdff2ff, 0.85).setDepth(1.2)

    // 门框：两根立柱 + 一根门楣
    this.add.rectangle(x - 19, midY, 6, 70, 0x39435a).setDepth(1.4)
    this.add.rectangle(x + 19, midY, 6, 70, 0x39435a).setDepth(1.4)
    this.add.rectangle(x, midY - 38, 44, 6, 0x39435a).setDepth(1.4)

    this.tweens.add({
      targets: glow,
      alpha: { from: 0.12, to: 0.45 },
      duration: 900,
      yoyo: true,
      repeat: -1,
    })

    this.makeHint(x, DEV_GROUND_TOP - 92, label)
  }

  // 站到门前按 F 换房间：进厅里的门先记下位置，回来时站回它右边
  private useDevPortal(portal: DevPortalRef) {
    if (portal.room >= 0) {
      this.devReturnX = portal.x
    }

    this.devRoom = portal.room
    this.scene.restart()
  }

  private lightMonument(monument: MonumentRef) {
    monument.lit = true
    // 点亮：底座恢复砖瓦本色，碑头整段染成元素色，元素标记留白当发光刻印
    monument.pillar.setTint(0xffffff)
    monument.head.setTint(ELEMENTS[monument.element].color)
    monument.icon.setTint(0xffffff)

    this.makeMonumentAura(monument)
    this.revealFollowers(monument.id)
  }

  private monumentById(id: string) {
    return this.monumentList.find((monument) => monument.id === id) ?? null
  }

  private extinguishMonument(monument: MonumentRef) {
    monument.lit = false
    monument.pillar.setTint(0x9a9a9a)
    monument.head.setTint(0x3a3a46)
    monument.icon.setTint(0x7c8299)

    this.clearMonumentAura(monument)
  }

  // 点亮后的竖线光圈：几条元素色的细竖线紧贴方碑轮廓，持续明暗呼吸
  private makeMonumentAura(monument: MonumentRef) {
    if (monument.aura.length > 0) {
      return
    }

    const color = ELEMENTS[monument.element].color
    const x = monument.pillar.x
    const y = monument.pillar.y

    // [横向偏移, 纵向偏移, 线高]
    const lines: Array<[number, number, number]> = [
      [-17, -4, 16],
      [-17, -20, 10],
      [17, -4, 16],
      [17, -20, 10],
      [-11, -30, 6],
      [11, -30, 6],
      [0, -38, 5],
    ]

    lines.forEach(([dx, dy, height], index) => {
      const line = this.add
        .image(x + dx, y + dy, 'pixel')
        .setDisplaySize(2, height)
        .setTint(color)
        .setDepth(4)
        .setAlpha(0.45)

      this.tweens.add({
        targets: line,
        alpha: 0.95,
        duration: 900,
        yoyo: true,
        repeat: -1,
        delay: index * 90,
      })

      monument.aura.push(line)
    })
  }

  private clearMonumentAura(monument: MonumentRef) {
    monument.aura.forEach((line) => {
      this.tweens.killTweensOf(line)
      line.destroy()
    })

    monument.aura = []
  }

  private revealFollowers(id: string) {
    if (id === '') {
      return
    }

    this.monumentList.forEach((monument) => {
      if (!monument.hidden || monument.after !== id) {
        return
      }

      monument.hidden = false
      monument.pillar.setVisible(true).setAlpha(0)
      monument.head.setVisible(true).setAlpha(0)
      monument.icon.setVisible(true).setAlpha(0)

      this.tweens.add({
        targets: [monument.pillar, monument.head, monument.icon],
        alpha: 1,
        duration: 400,
      })
    })
  }

  private touchMonument(monument: MonumentRef) {
    const door = this.doorList.find(
      (item) => !item.opened && monument.id !== '' && item.needs.includes(monument.id)
    )

    if (monument.neighbors.length > 0) {
      this.lightMonument(monument)

      monument.neighbors.forEach((id) => {
        const neighbor = this.monumentById(id)

        if (!neighbor) {
          return
        }

        if (neighbor.lit) {
          this.extinguishMonument(neighbor)
        } else {
          this.lightMonument(neighbor)
        }
      })

      if (door && door.needs.every((id) => this.idReady(id))) {
        this.openDoor(door)
      }

      return
    }

    if (!door) {
      this.lightMonument(monument)
      return
    }

    if (!door.ordered) {
      this.lightMonument(monument)

      if (door.needs.every((id) => this.idReady(id))) {
        this.openDoor(door)
      }

      return
    }

    if (monument.id !== door.needs[door.progress.length]) {
      this.extinguishAll(door)
      return
    }

    this.lightMonument(monument)
    door.progress.push(monument.id)

    if (door.progress.length === door.needs.length) {
      this.openDoor(door)
    }
  }

  private extinguishAll(door: DoorRef) {
    door.progress = []

    door.needs.forEach((id) => {
      const monument = this.monumentById(id)

      if (monument) {
        this.extinguishMonument(monument)
      }
    })

    this.cameras.main.shake(240, 0.01)
    this.showMessage('五碑俱灭……顺序错了。')
  }

  private openDoor(door: DoorRef, quiet = false) {
    if (door.opened) {
      return
    }

    door.opened = true

    // 两半扇都不再挡人、也不再挡岩刺
    ;(door.sprite.body as Phaser.Physics.Arcade.StaticBody).enable = false
    ;(door.right.body as Phaser.Physics.Arcade.StaticBody).enable = false

    // 各往左右滑开半扇的宽度，滑完停在两边——门口的位置就留在那儿
    const slide = door.sprite.displayWidth / 2 + 2

    // quiet：存档继承过来的时候"门本来就是开着的"，直接摆到打开的位置，
    // 不弹"门开了。"、也不播滑开的动画
    if (quiet) {
      door.sprite.setX(door.sprite.x - slide)
      door.right.setX(door.right.x + slide)
      return
    }

    this.showMessage('门开了。')

    const tween = (target: Phaser.Physics.Arcade.Sprite, x: number) =>
      this.tweens.add({
        targets: target,
        x,
        duration: 420,
        ease: 'Sine.easeOut',
      })

    tween(door.sprite, door.sprite.x - slide)
    tween(door.right, door.right.x + slide)
  }
  
  private showPaper(text: string) {
    if (this.paperShowing) {
      return
    }

    this.paperShowing = true
    this.physics.world.pause()
    stopAllLoops()

    const layer = this.add.container(0, 0).setDepth(220).setScrollFactor(0)

    const shade = this.add.rectangle(0, 0, 480, 270, 0x0a0a14, 0.88).setOrigin(0, 0)
    const panel = this.add.rectangle(240, 128, 400, 188, 0x1b1b2a).setStrokeStyle(2, 0xffd54f)
    const title = this.add
      .text(240, 56, '残卷', {
        fontFamily: 'sans-serif',
        fontSize: '16px',
        color: '#ffd54f',
      })
      .setOrigin(0.5)
    const body = this.add
      .text(240, 130, this.wrapCjk(text, 22).join('\n'), {
        fontFamily: 'sans-serif',
        fontSize: '14px',
        color: '#e8e2d0',
        align: 'center',
        lineSpacing: 10,
        wordWrap: { width: 340 },
      })
      .setOrigin(0.5)
    const tip = this.add
      .text(240, 244, this.touchMode ? '轻点屏幕收起' : '按 F 收起', {
        fontFamily: 'sans-serif',
        fontSize: '12px',
        color: '#8fa3b8',
      })
      .setOrigin(0.5)

    layer.add([shade, panel, title, body, tip])

    this.paperLayer = layer

    // 手机上没有 F 键，点一下屏幕就收起。
    // 延迟一帧再挂监听：这一次点击正是"点提示条打开纸条"的那一下，
    // 同一帧里挂上去会被这次点击立刻关掉（就是之前点了没反应的原因）
    this.time.delayedCall(0, () => {
      this.input.once('pointerdown', () => this.closePaper())
    })
  }

  private closePaper() {
    if (!this.paperShowing) {
      return
    }

    this.paperLayer?.destroy()
    this.paperLayer = null
    this.paperShowing = false
    this.physics.world.resume()
  }

  private updatePaper() {
    if (Phaser.Input.Keyboard.JustDown(this.interactKey)) {
      this.closePaper()
    }
  }

  // 老板娘 / 仙人说话的对话板：黑底金框的一条，一句一句翻
  // 一段中文按"每行最多 max 个字"折行。
  // Phaser 自带的 wordWrap 是按空格断的，中文整句没有空格，根本不会断 —— 所以自己按字数断，
  // 顺带不让句读跑到行首（「，。、！？；：）」」这些宁可留在上一行末尾）
  private wrapCjk(text: string, max: number): string[] {
    const tailPunctuation = '，。、！？；：）”』…'
    const lines: string[] = []
    let line = ''

    for (const char of text) {
      if (char === '\n') {
        lines.push(line)
        line = ''
        continue
      }

      if (line.length >= max && !tailPunctuation.includes(char)) {
        lines.push(line)
        line = ''
      }

      line += char
    }

    if (line.length > 0) {
      lines.push(line)
    }

    return lines
  }

  // 对话框一屏最多 3 行、每行最多 26 个字。一整句放不下就切成两页（用户要的"分两次说"）
  private paginateDialogue(lines: string[]): { text: string; mine: boolean }[] {
    const pages: { text: string; mine: boolean }[] = []

    lines.forEach((line) => {
      // 以「（」开头的是玩家自己的回话：名字牌换成"我"、去掉外层括号
      const mine = line.startsWith('（')
      const raw = mine ? line.replace(/^（|）$/g, '') : line
      const wrapped = this.wrapCjk(raw, 26)

      for (let start = 0; start < wrapped.length; start += 3) {
        pages.push({ text: wrapped.slice(start, start + 3).join('\n'), mine })
      }
    })

    return pages
  }

  private showDialogue(speaker: string, lines: string[], onDone?: () => void) {
    if (this.dialogueShowing || lines.length === 0) {
      return
    }

    const pages = this.paginateDialogue(lines)

    if (pages.length === 0) {
      return
    }

    this.dialogueShowing = true
    this.dialoguePages = pages
    this.dialogueIndex = 0
    this.dialogueDone = onDone ?? null
    this.dialogueSpeaker = speaker
    this.physics.world.pause()
    stopAllLoops()

    const layer = this.add.container(0, 0).setDepth(220).setScrollFactor(0)
    const shade = this.add.rectangle(0, 0, 480, 270, 0x0a0a14, 0.42).setOrigin(0, 0)
    const panel = this.add
      .rectangle(240, 196, 448, 96, 0x14181f)
      .setStrokeStyle(2, 0xffd54f)
      .setAlpha(0.95)
    const tag = this.add.rectangle(74, 160, 104, 22, 0x1b1b2a).setStrokeStyle(1, 0xffd54f)
    const name = this.add
      .text(74, 160, speaker, {
        fontFamily: 'sans-serif',
        fontSize: '14px',
        color: '#ffd54f',
      })
      .setOrigin(0.5)
    const body = this.add
      .text(240, 198, '', {
        fontFamily: 'sans-serif',
        fontSize: '14px',
        color: '#e8e2d0',
        align: 'center',
        lineSpacing: 8,
        wordWrap: { width: 408 },
      })
      .setOrigin(0.5)
    const tip = this.add
      .text(452, 234, this.touchMode ? '轻点继续 ▶' : '按 F 继续 ▶', {
        fontFamily: 'sans-serif',
        fontSize: '12px',
        color: '#8fa3b8',
      })
      .setOrigin(1, 0.5)

    layer.add([shade, panel, tag, name, body, tip])

    this.dialogueLayer = layer
    this.dialogueText = body
    this.dialogueName = name
    this.dialogueTip = tip
    this.refreshDialogueLine()
    this.bindDialogueTap()
  }

  // 刷新当前这一页：玩家自己的回话名字牌换成"我"
  private refreshDialogueLine() {
    const page = this.dialoguePages[this.dialogueIndex]
    const last = this.dialogueIndex >= this.dialoguePages.length - 1

    this.dialogueName?.setText(page?.mine ? '我' : this.dialogueSpeaker)
    this.dialogueText?.setText(page?.text ?? '')
    this.dialogueTip?.setText(
      this.touchMode ? (last ? '轻点收起 ▶' : '轻点继续 ▶') : last ? '按 F 收起 ▶' : '按 F 继续 ▶'
    )
  }

  // 手机上点一下屏幕就翻页。延迟一帧再挂：那一次点击正是"按提示打开对话"的那一下
  private bindDialogueTap() {
    this.time.delayedCall(0, () => {
      this.input.once('pointerdown', () => this.advanceDialogue())
    })
  }

  private advanceDialogue() {
    if (!this.dialogueShowing) {
      return
    }

    this.dialogueIndex += 1

    if (this.dialogueIndex >= this.dialoguePages.length) {
      this.closeDialogue()
      return
    }

    this.refreshDialogueLine()
    this.bindDialogueTap()
  }

  private closeDialogue() {
    if (!this.dialogueShowing) {
      return
    }

    this.dialogueLayer?.destroy()
    this.dialogueLayer = null
    this.dialogueText = null
    this.dialogueTip = null
    this.dialogueShowing = false
    this.physics.world.resume()

    const done = this.dialogueDone

    this.dialogueDone = null
    done?.()
  }

  private updateDialogue() {
    if (Phaser.Input.Keyboard.JustDown(this.interactKey)) {
      this.advanceDialogue()
    }
  }

  // 气息散开：撤掉挡人的墙、让风环淡掉（端着菜走近时发生）
  private xiaoCalm() {
    if (this.xiaoWall) {
      this.xiaoWall.destroy()
      this.xiaoWall = null
    }

    const aura = this.xiaoAura

    this.xiaoAura = null

    if (aura) {
      this.tweens.add({
        targets: aura,
        alpha: 0,
        duration: 700,
        onComplete: () => aura.destroy(),
      })
    }
  }

  // 支线收尾：把杏仁豆腐端给魈。菜先飘过去，他吃完留一句回家的提示，再化风离开 ——
  // 宝箱要等他走了才出现
  private playXiaoScene() {
    if (!this.dishMade || this.xiaoGone) {
      return
    }

    this.xiaoGone = true
    this.inputLocked = true
    stopAllLoops()

    const dish = this.carriedDish

    this.carriedDish = null

    if (!dish) {
      this.xiaoThanks()
      return
    }

    this.tweens.add({
      targets: dish,
      x: 632,
      y: 374,
      duration: 640,
      ease: 'Sine.easeInOut',
      onComplete: () => {
        playSfx(this, 'sfx-interact', 0.35)
        dish.destroy()
        this.xiaoThanks()
      },
    })
  }

  // 他吃的这几口用热气表示一下，然后说台词
  private xiaoThanks() {
    for (let i = 0; i < 5; i++) {
      this.time.delayedCall(i * 130, () => {
        const puff = this.add
          .image(640 + Phaser.Math.Between(-6, 6), 374, 'pixel')
          .setDisplaySize(4, 4)
          .setTint(0xf0f4f6)
          .setAlpha(0.6)
          .setDepth(11)

        this.tweens.add({
          targets: puff,
          y: puff.y - Phaser.Math.Between(12, 22),
          alpha: 0,
          scale: 1.8,
          duration: 620,
          onComplete: () => puff.destroy(),
        })
      })
    }

    this.time.delayedCall(780, () => {
      this.showDialogue(
        '魈',
        [
          '……杏仁豆腐。',
          '很久没人给我做这个了。多谢。',
          '你要问怎么回去？',
          '往南走，到璃月港去。',
          '那里每年有一场「请仙典仪」——岩王帝君会现身为璃月降下神谕。',
          '那一位，或许知道你为什么会落在这片土地上。',
          '……去吧。',
        ],
        () => this.xiaoLeaves()
      )
    })
  }

  // 化风离开：一阵青色的风屑把他带走，然后宝箱出现
  private xiaoLeaves() {
    for (let i = 0; i < 10; i++) {
      this.time.delayedCall(i * 60, () => {
        const speck = this.add
          .image(650 + Phaser.Math.Between(-14, 14), 396 - Phaser.Math.Between(0, 40), 'pixel')
          .setDisplaySize(3, 3)
          .setTint(0xbdf0d8)
          .setDepth(11)

        this.tweens.add({
          targets: speck,
          x: speck.x + Phaser.Math.Between(30, 70),
          y: speck.y - Phaser.Math.Between(10, 30),
          alpha: 0,
          scale: 0.4,
          duration: Phaser.Math.Between(400, 700),
          onComplete: () => speck.destroy(),
        })
      })
    }

    playSfx(this, 'sfx-interact', 0.35)

    const xiao = this.xiaoSprite

    this.xiaoSprite = null

    if (xiao) {
      this.tweens.add({
        targets: xiao,
        alpha: 0,
        x: xiao.x + 26,
        y: xiao.y - 16,
        duration: 760,
        onComplete: () => xiao.destroy(),
      })
    }

    this.time.delayedCall(840, () => {
      this.revealGoal()
      this.inputLocked = false
      this.showMessage('仙人走了 —— 阳台上有什么东西亮了起来')

      // 支线做完 → 把"这一关的机关"也记进存档：下次进来楼梯是修好的、仙人不在、宝箱已经在
      if (!this.innRestored) {
        this.innRestored = true
        markHintSeen(INN_RESTORED_FLAG)
        saveProgress()
      }
    })
  }

  // 灶上冒的白汽：几团往上飘、边飘边淡，给"做菜"这件事一个动静
  private stoveSteam(x: number, topY: number) {
    for (let i = 0; i < 6; i++) {
      this.time.delayedCall(i * 70, () => {
        const puff = this.add
          .image(x + Phaser.Math.Between(-8, 8), topY - i * 2, 'pixel')
          .setDisplaySize(6, 6)
          .setTint(0xf0f4f6)
          .setAlpha(0.65)
          .setDepth(4)

        this.tweens.add({
          targets: puff,
          y: puff.y - Phaser.Math.Between(18, 30),
          x: puff.x + Phaser.Math.Between(-9, 10),
          alpha: 0,
          scale: 2.2,
          duration: 720,
          onComplete: () => puff.destroy(),
        })
      })
    }
  }

  // 在灶台做杏仁豆腐：三样原料缺一不可。做好了那盘菜就端在史莱姆头上
  private cookAlmondTofu(stoveX: number, stoveTop: number) {
    if (this.dishMade) {
      this.showMessage('杏仁豆腐已经做好了')
      return
    }

    const missing = this.ingredients.filter((one) => !one.taken).map((one) => one.label)

    if (missing.length > 0) {
      this.showMessage(`还差：${missing.join('、')}`)
      return
    }

    this.dishMade = true
    this.stoveSteam(stoveX, stoveTop)
    playSfx(this, 'sfx-interact', 0.4)

    this.time.delayedCall(520, () => {
      this.carriedDish = this.add
        .image(this.slime.x, this.slime.y - 30, 'item-almond-tofu')
        .setDepth(11.5)

      this.showMessage('杏仁豆腐做好了 —— 端到顶楼去吧')
    })
  }

  // 拾取一样原料：拿掉贴图、报一下进度，三样齐了就提醒去厨房
  private takeIngredient(item: (typeof this.ingredients)[number]) {
    item.taken = true
    item.sprite.destroy()
    playSfx(this, 'sfx-interact', 0.3)

    const got = this.ingredients.filter((one) => one.taken).length

    this.showMessage(
      got >= this.ingredients.length
        ? `拿到${item.label}（${got}/${this.ingredients.length}）—— 三样齐了，去厨房的灶台`
        : `拿到${item.label}（${got}/${this.ingredients.length}）`
    )
  }

  // 老板娘：按支线进度说不同的话。她的话就是整条支线的"指引"。
  // 对话里以「」括号包着的是玩家自己的回话（名字牌会换成"我"）
  private talkToInnkeeper() {
    const allTaken = this.ingredients.every((one) => one.taken)
    const last = '糖放在下面的桌子上了，杏仁在那棵桂花树下还有些许存货，豆腐在厨房的水缸里。祝你好运。'

    // ① 仙人已经走了
    if (this.xiaoGone) {
      this.showDialogue('老板娘', ['请仙典仪在三天后开始，希望你早日回家。'])
      return
    }

    // ② 菜做好了：催你端上去
    if (this.dishMade) {
      this.showDialogue('老板娘', ['手艺不错，快去顶楼找那位仙人吧。'])
      return
    }

    // ③ 三样材料齐了：催你去做
    if (allTaken) {
      this.showDialogue('老板娘', ['看来你都找齐了，厨房就在楼上，快去做吧。'])
      return
    }

    // ④ 中间那段（带玩家回话）：**要修完两处楼梯**才开 —— 修楼梯是这条线的必经之路。
    //    跟有没有见过魈无关：先跑上顶楼碰了气息、却没修楼梯的，她只会先催你去修
    if (this.stairsDone) {
      if (this.ingredientHintSeen) {
        this.showDialogue('老板娘', [last])
        return
      }

      this.ingredientHintSeen = true
      this.showDialogue('老板娘', [
        '太感谢了。',
        '（没事，小菜一碟。）',
        '对了，我听说你在找回家的方法。不瞒您说，咱客栈顶楼住着一位仙人，唤名「魈」。',
        '你可以找他打听打听——只不过他一般不见人。',
        '除非你做一盘他最喜欢吃的杏仁豆腐，兴许他会告诉你。',
        '（那这些食材我要去哪里找？）',
        last,
      ])
      return
    }

    // ⑤ 还没修楼梯：交代情况 + 优惠，说完提示下楼（两处断裂都在下面那几跑楼梯上）
    this.showDialogue(
      '老板娘',
      [
        '可不是嘛，后山那窝魔物闹得凶，把楼梯掀断了两处。',
        '客官要是肯帮我把楼梯修好，食宿就免了。',
      ],
      () => this.showMessage('下楼看看')
    )
  }

  private playCageScene() {
    if (this.cageScene || !this.cageSprite || !this.eggSprite) {
      return
    }

    this.cageScene = true
    this.cageOpened = true
    this.physics.world.pause()
    stopAllLoops()

    const cageX = this.cageSprite.x
    const cageY = this.cageSprite.y

    this.cageSprite.setTexture('cage-open')

    // 一、主角体内突然爆出一圈力量
    this.cameras.main.shake(240, 0.006)

    const ringDelays = [0, 130, 260]

    ringDelays.forEach((delay, index) => {
      this.time.delayedCall(delay, () => {
        const ring = this.add
          .image(this.slime.x, this.slime.y, 'blessing')
          .setTint(0xa8e8d4)
          .setDepth(8)
          .setScale(0.6)

        this.tweens.add({
          targets: ring,
          scale: 3.2 + index * 0.6,
          alpha: 0,
          duration: 640,
          onComplete: () => {
            ring.destroy()
          },
        })
      })
    })

    // 二、蛋开始晃
    this.time.delayedCall(620, () => {
      this.tweens.add({
        targets: this.eggSprite,
        x: cageX + 2,
        duration: 80,
        yoyo: true,
        repeat: 5,
      })
    })

    // 三、白光一闪，趁白屏把蛋换成小龙
    this.time.delayedCall(1200, () => {
      const flash = this.add
        .rectangle(0, 0, 480, 270, 0xffffff)
        .setOrigin(0, 0)
        .setScrollFactor(0)
        .setDepth(60)
        .setAlpha(0)

      this.tweens.add({
        targets: flash,
        alpha: 1,
        duration: 220,
        hold: 90,
        yoyo: true,
        onYoyo: () => {
          this.eggSprite?.destroy()
          this.eggSprite = null

          this.spawnDragonling(cageX, cageY + 6)
        },
        onComplete: () => {
          flash.destroy()
        },
      })
    })

    // 四、小龙被风托起，从穹顶的孔洞飞出去
    this.time.delayedCall(2500, () => {
      this.flyDragonlingOut()
    })
  }

  private spawnDragonling(x: number, y: number) {
    const dragon = this.add.image(x, y, 'dragonling').setDepth(1).setScale(0)

    this.dragonling = dragon

    this.tweens.add({
      targets: dragon,
      scale: 1,
      duration: 420,
      ease: 'Back.easeOut',
    })

    this.time.delayedCall(440, () => {
      this.tweens.add({
        targets: dragon,
        y: y - 14,
        duration: 320,
        yoyo: true,
      })
    })
  }

  private flyDragonlingOut() {
    const dragon = this.dragonling

    if (!dragon) {
      this.endCageScene()
      return
    }

    const holeX = this.level.dome ? this.level.dome.holeX : dragon.x

    // 飞离笼子的这一刻才提到最前面
    dragon.setDepth(8)

    const glow = this.add
      .image(dragon.x, dragon.y + 8, 'blessing')
      .setTint(0xa8e8d4)
      .setDepth(7)
      .setScale(1.6)

    this.cameras.main.stopFollow()
    this.cameras.main.pan(240, 200, 600, 'Sine.easeInOut')

    this.tweens.add({
      targets: dragon,
      x: holeX,
      y: 18,
      duration: 1200,
      ease: 'Sine.easeInOut',
      onUpdate: () => {
        glow.setPosition(dragon.x, dragon.y + 8)
      },
      onComplete: () => {
        glow.destroy()

        this.tweens.add({
          targets: dragon,
          alpha: 0,
          duration: 280,
          onComplete: () => {
            dragon.destroy()
            this.dragonling = null
          },
        })
      },
    })

    this.time.delayedCall(1900, () => {
      this.showMessage('风神：「谢谢你……去飞吧，替我看看更远的地方。」')
    })

    this.time.delayedCall(2600, () => {
      this.endCageScene()
    })
  }

  private endCageScene() {
    this.cameras.main.startFollow(this.slime, true, 0.12, 0.12)
    this.physics.world.resume()
    this.cageScene = false

    if (this.level.goal.after === 'cage') {
      this.time.delayedCall(1200, () => {
        this.revealGoal()

        // 小龙救出来了 → 把这一关的机关也记进存档：下次进来方碑全亮、门全开、笼子空的、
        // 宝箱已经在塔中央，不用再重新解一遍
        if (!this.towerRestored) {
          this.towerRestored = true
          markHintSeen(TOWER_RESTORED_FLAG)
          saveProgress()
        }
      })
    }
  }

  private revealGoal() {
    if (this.goalReady) {
      return
    }

    this.goalReady = true
    this.goalSprite.setVisible(true).setScale(0)

    const ring = this.add
      .image(this.goalSprite.x, this.goalSprite.y + 10, 'blessing')
      .setTint(0xffd54f)
      .setDepth(6)
      .setScale(0.8)

    this.tweens.add({
      targets: ring,
      scale: 3,
      alpha: 0,
      duration: 640,
      onComplete: () => {
        ring.destroy()
      },
    })

    this.tweens.add({
      targets: this.goalSprite,
      scale: 1,
      duration: 420,
      ease: 'Back.easeOut',
    })
  }

  private updateIntro() {
    if (Phaser.Input.Keyboard.JustDown(this.cursors.space)) {
      this.closeIntro()
    }
  }

  update(time: number, delta: number) {
    if (this.introShowing) {
      this.updateIntro()
      return
    }

    if (this.paperShowing) {
      this.updatePaper()
      return
    }

    if (this.dialogueShowing) {
      this.updateDialogue()
      return
    }

    if (this.cageScene) {
      return
    }

    const camera = this.cameras.main

    if (this.bgTall.length > 0) {
      // 高关卡：相对地面往下沉（地面那一屏就是设计好的构图），各层系数不同
      const drift = this.groundScrollY - camera.scrollY

      this.bgTall.forEach((layer) => layer.image.setY(drift * layer.k))
    } else if (this.bgFar && this.bgMid) {
      // 横向视差：除了相机 x，再加上"爬得越高背景转得越多"（环树感，bgSpin 由关卡数据给）
      this.bgFar.setTilePosition(
        Math.floor(camera.scrollX * 0.15 + camera.scrollY * this.bgSpin),
        Math.floor(camera.scrollY * this.bgFarY)
      )
      this.bgMid.setTilePosition(
        Math.floor(camera.scrollX * 0.35 + camera.scrollY * this.bgSpin * 1.6),
        Math.floor(camera.scrollY * this.bgMidY)
      )

      if (this.bgNear) {
        this.bgNear.setTilePosition(
          Math.floor(camera.scrollX * 0.55 + camera.scrollY * this.bgSpin * 2.2),
          Math.floor(camera.scrollY * this.bgNearY)
        )
      }
    }

    if (this.windmillBlades) {
      // 正角度在屏幕坐标里就是顺时针
      this.windmillBlades.rotation += (delta / 1000) * 1.2
    }

    const body = this.slime.body as Phaser.Physics.Arcade.Body
    const dt = delta / 1000

    this.updateSpeedItems(dt)

    const speed =
      ELEMENTS[this.element].speed * (this.speedBoostTimer > 0 ? this.speedBoostMultiplier : 1)

    // 第七关「绕树而上」：踩到判定区就在树前/树后之间切换
    this.updateDepthGates(body)

    // 保险：站在**一楼地面**上就强制回到前台 —— 从顶层跳下来会带着「树后面」那一层，
    // 落回一楼后如果还是 back，往右走会穿过前台的楼梯爬不上去。一楼地面上没有任何
    // 「树后那一跑」的落点（它们的底端都在 1/2 层平台上），所以站在地上一定是前台。
    // 一楼 = 所有楼板里「顶面最低」的那一块
    const groundTop = this.level.platforms.reduce(
      (lowest, item) => Math.max(lowest, item.y - item.height / 2),
      Number.NEGATIVE_INFINITY
    )

    if (body.blocked.down && Math.abs(body.bottom - groundTop) < 2) {
      this.setPlayerLayer('front')
    }
    // 树干上的透视圈跟着玩家走
    this.updateTrunk()
    // 树根上的透视圈
    this.updateRoot()
    // 楼内短木上的透视圈
    this.updateSpindle()
    // 活板（层补片）上的透视圈：楼板一直画着，只擦史莱姆附近那一块
    this.updateLayerReveals()
    // 玉京台那种画在玩家前面的栏杆：也在玩家身上擦透视洞
    this.updateRevealRails()
    // 背面朝向的摊位 / 房子：史莱姆和原石走到后面时也透出来
    this.updateHarborFronts()
    // 玉京台那道隔断墙（连券门）：同一套做法
    this.updateWall()
    // 折返楼梯的换层（站在哪一跑上 / 踩到半层小平台）
    this.updateStairLayers(body)

    // 高台关卡：上楼之后镜头往上偏一点，把史莱姆放到画面下半部分。
    // 用回差（band）判断：脚底高过 y 才抬起、落回 y+band 以下才放下 ——
    // 不然人站在半层平台那一带、脚底在临界高度上下晃时，镜头会跟着一抬一放地抖
    const lift = this.level.cameraLift

    if (lift) {
      const lifted = this.cameraLiftNow === lift.offset
      const want = lifted
        ? body.bottom < lift.y + lift.band
          ? lift.offset
          : 0
        : body.bottom < lift.y
          ? lift.offset
          : 0

      if (want !== this.cameraLiftNow) {
        this.cameraLiftNow = want
        this.cameras.main.setFollowOffset(0, want)
      }
    }

    // 爬山关：`cameraBias` 是**恒定**的跟随偏移 —— 镜头一直往上抬那么多，史莱姆就落在
    // 画面下半部分，往上爬时先看见的是"接下来要爬的那一段"。（和上面 cameraLift 不共存；
    // 这里每帧写一次，是因为 startFollow / 复活 / 重进关卡都会把跟随偏移清成 0）
    if (!lift && this.level.cameraBias) {
      camera.setFollowOffset(0, this.level.cameraBias)
    }

    // 水利电梯：轿厢跟到当前高度，站在上面的人跟着走
    this.updateLift()

    if (this.perfText) {
      this.perfTimer -= dt

      if (this.perfTimer <= 0) {
        this.perfTimer = 0.5
        this.perfText.setText(
          'FPS ' +
            Math.round(this.game.loop.actualFps) +
            '  帧 ' +
            this.game.loop.delta.toFixed(1) +
            'ms' +
            '  对象 ' +
            this.children.list.length +
            '  tween ' +
            this.tweens.getTweens().length
        )
      }
    }

    // 键盘 + 触屏的输入边沿都在这里各读一次（JustDown/JustUp 读一次就把标记清掉，
    // 所以不能在别处再读第二遍），触屏那几个 Just 标记读完立刻清零
    const prevJust = Phaser.Input.Keyboard.JustDown(this.prevKey)
    const nextJust = Phaser.Input.Keyboard.JustDown(this.nextKey)
    const armorJust = Phaser.Input.Keyboard.JustDown(this.armorKey) || this.touchArmorJust
    const armorUp = Phaser.Input.Keyboard.JustUp(this.armorKey) || this.touchArmorUp
    const rockJustDown = Phaser.Input.Keyboard.JustDown(this.rockKey) || this.touchPillarJust
    const rockJustUp = Phaser.Input.Keyboard.JustUp(this.rockKey) || this.touchPillarUp
    const jumpJust = Phaser.Input.Keyboard.JustDown(this.cursors.space) || this.touchJumpJust

    this.touchArmorJust = false
    this.touchArmorUp = false
    this.touchPillarJust = false
    this.touchPillarUp = false
    this.touchJumpJust = false

    if (!this.inputLocked && !this.domainMode) {
      if (prevJust) {
        cycleElement(-1, this.availableElements())
        this.applyElement(progress.current)
      }

      if (nextJust) {
        cycleElement(1, this.availableElements())
        this.applyElement(progress.current)
      }
    }

    if (this.invulnTimer > 0) {
      this.invulnTimer -= dt
    }

    if (this.armorCooldown > 0) {
      this.armorCooldown -= dt
    }

    if (this.armored) {
      this.armoredTimer -= dt

      if (this.armoredTimer <= 0) {
        this.setArmored(false)
      }
    }

    if (!this.inputLocked && armorJust && this.element === 'rock') {
      // 只能开：岩化中按不掉，冷却中按不了
      if (!this.armored && this.armorCooldown <= 0) {
        this.setArmored(true)
      }
    }

    // 雷闪（X）：点按朝面朝方向闪；按住进瞄准（这段时间人变成一颗雷球、定住），松开闪出去
    if (this.inputLocked || this.element !== 'thunder') {
      if (this.blinkHeld || this.blinkAiming) {
        this.cancelBlinkHold()
      }
    } else {
      if (armorJust) {
        this.blinkHeld = true
        this.blinkHold = 0
      }

      if (this.blinkHeld) {
        this.blinkHold += dt

        if (this.blinkHold >= BLINK_HOLD) {
          this.startBlinkAim()
        }
      }

      if (armorUp && this.blinkHeld) {
        const aiming = this.blinkAiming

        this.blinkHeld = false
        this.blinkHold = 0

        if (aiming) {
          // 松手前再取一次方向：手指 / 鼠标最后停在哪儿就往哪儿闪
          this.updateBlinkAim()
          this.stopBlinkAim()
          this.castBlink(this.blinkDir.x, this.blinkDir.y)
        } else {
          this.castBlink(this.slime.flipX ? -1 : 1, 0)
        }
      }
    }

    // C：短按直接在身前落柱（前面放不下会自动往人身边挪）；
    // 长按进入预览状态（松手也不退出），再点一次 C 才落柱
    if (this.inputLocked) {
      this.pillarPressed = false
    } else if (this.element === 'rock') {
      if (rockJustDown) {
        if (this.pillarCharging) {
          // 预览状态里再点一次 = 放置；放不下就留在预览里继续找位置
          if (this.castPillar()) {
            this.stopPillarPreview()
          }
        } else {
          this.pillarPressed = true
          this.pillarHold = 0
        }
      }

      if (this.pillarPressed) {
        this.pillarHold += dt

        if (this.pillarHold >= PILLAR_HOLD) {
          // 长按：进预览状态，之后松手也不会退出去
          this.pillarPressed = false
          this.startPillarPreview()
        }
      }

      if (rockJustUp && this.pillarPressed) {
        // 短按：直接放
        this.pillarPressed = false
        this.castPillar()
      }
    } else if (this.pillarPressed || this.pillarCharging) {
      // 换元素时把预览收干净
      this.pillarPressed = false
      this.stopPillarPreview()
    }

    // 雷鸣（C）：雷史莱姆时 C 是三道雷
    if (!this.inputLocked && this.element === 'thunder' && rockJustDown) {
      this.castThunder()
    }

    if (this.thunderCooldown > 0) {
      this.thunderCooldown -= dt
      // 冷却一归零就换回「黄紫」那套：雷极和身上一起变
      if (this.thunderCooldown <= 0) {
        this.thunderCooldown = 0
        this.refreshThunderLook()
      }
    }

    if (!this.inputLocked) {
      this.updatePlates(dt)
      this.updateLaunchers(dt)
      this.updatePillarPreview()
      this.updateBlinkCharges(dt)
      this.updateChargeHud()
      this.updateBlinkAim()
      this.updateMonsters(dt)
      this.updateGuards(dt)
      this.updateThunderFx(dt)
    }

    // 飘花不吃输入锁：过场动画里也照飘
    this.updatePetals(dt)

    // 隐藏成就「邀诸位共赏」：踩过花树那块压力板（花瓣飘起来了）之后，
    // 再到金桂树底下（x 675~865 的地面）站够 5 秒 —— 走开就重新数
    if (this.petalsOn && !this.blossomGot) {
      const underTree = Math.abs(this.slime.x - 770) < 95 && this.slime.y > 2100

      this.blossomWatch = underTree ? this.blossomWatch + dt : 0

      if (this.blossomWatch >= 5) {
        this.blossomGot = true
        queueAchievementToast('blossom-view')
      }
    }

    // 顶楼的支线：气息的表现 → 端着菜走近时让路 → 端到跟前触发出场
    if (this.xiaoAura || this.metXiao || this.dishMade) {
      const onTop = this.slime.x > 470 && this.slime.y < 450
      const away = Phaser.Math.Distance.Between(this.slime.x, this.slime.y, 650, 396)

      // 气息慢速呼吸，玩家越靠近越亮
      if (this.xiaoAura) {
        const breath = 0.72 + Math.sin(this.time.now / 620) * 0.16
        const near = Phaser.Math.Clamp(1 - (away - 70) / 140, 0, 1)

        this.xiaoAura.setAlpha(breath * (0.62 + near * 0.38))
      }

      // 第一次上顶楼：不管手上有没有那盘菜，都先让玩家撞一次那股气息（支线的起点）
      if (onTop && !this.xiaoAuraSeen) {
        this.xiaoAuraSeen = true
        this.metXiao = true
        this.showMessage('他身上有一股让人不敢靠近的气息')

        if (this.dishMade) {
          // 端着菜第一次上来：先站住看两秒那股气息，然后它自己散开
          this.time.delayedCall(2700, () => {
            if (!this.xiaoWall) {
              return
            }

            this.xiaoCalm()
            this.showMessage('那股气息……让开了一条路')
          })
        } else {
          // 手上没菜：等第一句淡掉再补一句"该去哪儿"（支线的第一环是回前台问老板娘）
          this.time.delayedCall(2600, () => {
            this.showMessage('……不如回楼下找老板娘问问')
          })
        }
      } else if (
        onTop &&
        this.dishMade &&
        this.metXiao &&
        this.xiaoWall &&
        away < 120 &&
        !this.inputLocked
      ) {
        // 先撞过气息、后来才端着菜回来的：走近它就让路
        this.xiaoCalm()
        this.showMessage('那股气息……让开了一条路')
      }

      // 端着菜走到他跟前 → 演出一段（前提是那股气息已经让开了）
      if (
        onTop &&
        this.dishMade &&
        !this.xiaoGone &&
        !this.xiaoWall &&
        !this.inputLocked &&
        away < 62
      ) {
        this.playXiaoScene()
      }
    }

    // 端在头上的那盘菜跟着走，还轻轻晃
    if (this.carriedDish) {
      this.carriedDish.setPosition(
        this.slime.x,
        this.slime.y - 30 + Math.sin(this.time.now / 380) * 1.5
      )
    }

    if (this.finished) {
      this.syncVisual(1, 1)
      return
    }

    if (this.slime.y > this.level.height + 50) {
      this.die('fall')
      return
    }

    if (this.level.spire) {
      const spireDistance = Phaser.Math.Distance.Between(
        this.slime.x,
        this.slime.y,
        this.level.spire.x,
        this.level.spire.y
      )

      if (spireDistance < this.level.spire.radius) {
        queueAchievementToast('tower-top')
      }
    }

    if (this.inputLocked || this.blinkAiming) {
      // 神像演出期间原地不动；雷闪瞄准时也要定住（长按期间史莱姆是一颗不动的雷球）
      this.slime.setVelocityX(0)
    } else if (this.cursors.left.isDown || this.touchLeft) {
      this.slime.setVelocityX(-speed)
      this.slime.setFlipX(true)
    } else if (this.cursors.right.isDown || this.touchRight) {
      this.slime.setVelocityX(speed)
      this.slime.setFlipX(false)
    } else {
      this.slime.setVelocityX(0)
    }

    const element = ELEMENTS[this.element]
    // 拱形土坡：这一段走线是弧，先按曲线把脚底接管掉，再算"算不算站在地上"
    this.updateSlopes(body)
    // 岩共鸣：岩柱还在的时候，脚下一直往外散金色光圈，扫到琥珀 / 岩方碑就算激活
    this.updateResonance(dt)
    // 跳砸琥珀：普通跳 / 岩化跳砸都能震碎，不依赖岩柱
    this.updateAmberStomp()
    // 秘境第一重试炼：分段安全台、浮石消失、掉段扣心
    if (this.domainMode) {
      this.updateTrialStones()
      this.updateTrialOne(dt)
    }
    // 自动上台阶的那几帧人在空中，但动画和音效要按「还在走路」算，
    // 不然每上一级都会当成一次落地：压缩一下、放一声落地音，比抖还难看
    const onGround = body.blocked.down || this.stepRise > 0 || this.slopeGrip

    this.tryAutoStep(onGround, dt)
    // 正在自动上台阶：把镜头的纵向跟随临时调紧，人就不会在屏幕上弹一下再沉回来。
    // 抬完还多保持 STAIR_CAM_HOLD 秒，把剩下那点偏差收干净
    if (this.stairCamTime > 0) {
      this.stairCamTime -= dt
    }

    camera.setLerp(0.12, this.stairCamTime > 0 ? STAIR_CAM_LERP : CAM_LERP_Y)

    let prompt: string | null = null
    let action: (() => void) | null = null

    // 测试关卡的传送门：放在整条交互链最前面。
    // 后面那些交互（方碑 / 老板娘）都是按距离算的，不抢先的话大厅里会串味
    if (this.devPortals.length > 0) {
      for (const portal of this.devPortals) {
        if (
          Math.abs(this.slime.x - portal.x) < 40 &&
          Math.abs(this.slime.y - portal.groundY) < 70
        ) {
          prompt = this.interactPrefix() + (portal.room < 0 ? '回大厅' : '进入 ' + portal.label)
          action = () => this.useDevPortal(portal)
          break
        }
      }
    }

    // 展厅里能看演出的神像：只放「元素授予」那套动画，不给元素、不结算，可以反复看
    if (!prompt && this.devStatues.length > 0) {
      for (const statue of this.devStatues) {
        const distance = Phaser.Math.Distance.Between(
          this.slime.x,
          this.slime.y,
          statue.x,
          statue.groundY
        )

        if (distance < 70) {
          prompt = this.interactPrefix() + '看演出'
          action = () => this.playStatueScene(statue.element, false, statue.figure)
          break
        }
      }
    }

    let target: MonumentRef | null = null
    let nearest = 56

    for (const monument of this.monumentList) {
      if (monument.lit || monument.hidden) {
        continue
      }

      const distance = Phaser.Math.Distance.Between(
        this.slime.x,
        this.slime.y,
        monument.pillar.x,
        monument.pillar.y
      )

      if (distance > 56 || distance > nearest) {
        continue
      }

      nearest = distance
      target = monument
    }

    if (!prompt && target) {
      const monument = target

      if (this.element === monument.element) {
        prompt = this.interactPrefix() + '点亮'
        action = () => this.touchMonument(monument)
      } else {
        prompt = '需要' + ELEMENTS[monument.element].label + '元素'
      }
    }

    if (!prompt && this.noteList.length > 0) {
      for (const note of this.noteList) {
        const distance = Phaser.Math.Distance.Between(
          this.slime.x,
          this.slime.y,
          note.sprite.x,
          note.sprite.y
        )

        if (distance < 52) {
          const text = note.text

          prompt = this.interactPrefix() + note.prompt
          action = () => this.showPaper(text)
          break
        }
      }
    }

    if (!prompt && this.level.cage && !this.cageOpened) {
      const cageDistance = Phaser.Math.Distance.Between(
        this.slime.x,
        this.slime.y,
        this.level.cage.x,
        this.level.cage.y
      )

      if (cageDistance < 56) {
        prompt = this.interactPrefix() + this.level.cage.prompt
        action = () => this.playCageScene()
      }
    }

    // 请仙典仪（第八关）：左半边广场前面按 F 观礼，只演一次
    if (!prompt && this.level.plaza && !this.riteDone) {
      const spot = this.level.plaza
      const distance = Phaser.Math.Distance.Between(this.slime.x, this.slime.y, spot.x, spot.y)

      if (distance < 70) {
        prompt = this.interactPrefix() + '观礼'
        action = () => this.watchRite()
      }
    }

    if (!prompt && this.level.statue && this.statueSprite && !this.statueUsed) {
      const statue = this.level.statue
      const statueDistance = Phaser.Math.Distance.Between(
        this.slime.x,
        this.slime.y,
        statue.x,
        statue.y
      )

      if (statueDistance < 64) {
        prompt = this.interactPrefix() + statue.prompt
        action = () => {
          this.statueUsed = true
          this.playStatueScene(statue.grants)
        }
      }
    }

    // 山顶的仙人：靠近后对话，进入仙家试炼
    if (!prompt && this.craneNpc && !this.domainMode) {
      const distance = Phaser.Math.Distance.Between(
        this.slime.x,
        this.slime.y,
        this.craneNpc.x,
        this.craneNpc.y
      )

      if (distance < 76) {
        prompt = this.interactPrefix() + '对话'
        action = () => this.talkToCrane()
      }
    }

    // 老板娘：站在 1110 层柜台右边，是整条支线的"问讯处"
    if (!prompt && this.innkeeper) {
      const distance = Phaser.Math.Distance.Between(
        this.slime.x,
        this.slime.y,
        this.innkeeper.x,
        this.innkeeper.y
      )

      if (distance < 60) {
        prompt = this.interactPrefix() + '对话'
        action = () => this.talkToInnkeeper()
      }
    }

    // 厨房灶台：靠近就能做菜（缺原料的话按 F 会告诉你还差哪样）
    if (!prompt && this.level.trunk) {
      const stoveX = 64
      const stoveTop = 870
      const distance = Phaser.Math.Distance.Between(this.slime.x, this.slime.y, stoveX, 900)

      if (distance < 52) {
        prompt = this.interactPrefix() + '做杏仁豆腐'
        action = () => this.cookAlmondTofu(stoveX, stoveTop)
      }
    }

    // 支线原料：糖 / 杏仁 / 豆腐，各一处，拾完就没了
    if (!prompt) {
      for (const item of this.ingredients) {
        if (item.taken) {
          continue
        }

        const distance = Phaser.Math.Distance.Between(
          this.slime.x,
          this.slime.y,
          item.sprite.x,
          item.sprite.y
        )

        if (distance < 46) {
          prompt = this.interactPrefix() + '拾取' + item.label
          action = () => this.takeIngredient(item)
          break
        }
      }
    }

    // 木材堆：一堆只能拿一根（拿完这一堆就没了），手里空着才能拿 —— 一趟一根
    if (!prompt && this.woods === 0) {
      for (const pickup of this.pickupList) {
        if (pickup.taken) {
          continue
        }

        if (
          Phaser.Math.Distance.Between(
            this.slime.x, this.slime.y,
            pickup.x, pickup.y
          ) < 44
        ) {
          prompt = this.interactPrefix() + pickup.prompt
          action = () => this.takePickup(pickup)
          break
        }
      }
    }

    if (!prompt && this.woods > 0) {
      for (const repair of this.repairList) {
        if (repair.done) {
          continue
        }

        if (
          Phaser.Math.Distance.Between(
            this.slime.x, this.slime.y,
            repair.def.x, repair.def.y
          ) < 64
        ) {
          prompt = this.interactPrefix() + repair.def.prompt
          action = () => this.startRepair(repair)
          break
        }
      }
    }

    if (!prompt) {
      const nearGoal =
        this.goalReady &&
        Phaser.Math.Distance.Between(
          this.slime.x,
          this.slime.y,
          this.goalSprite.x,
          this.goalSprite.y
        ) < 48

      if (nearGoal) {
        prompt = this.interactPrefix() + this.level.goal.prompt
        action = () => this.win()
      }
    }

    // 水利电梯：站在轿厢上（左半边下行、右半边上行），或站在楼口叫轿厢
    if (!prompt && this.liftCar && !this.liftMoving) {
      const lift = this.liftDef!
      const liftBody = this.slime.body as Phaser.Physics.Arcade.Body
      const onCar =
        Math.abs(liftBody.bottom - this.liftState.y) < 5 &&
        Math.abs(this.slime.x - lift.x) < lift.width / 2 + 4

      if (onCar) {
        const wantUp = this.slime.x > lift.x
        const next = wantUp ? this.liftIndex - 1 : this.liftIndex + 1

        if (next >= 0 && next < lift.stops.length) {
          prompt = this.interactPrefix() + (wantUp ? '上行' : '下行')
          action = () => this.useLift()
        }
      } else {
        const stopIndex = lift.stops.findIndex(
          (stop) => Math.abs(liftBody.bottom - stop) < 8
        )

        // 只在井口附近才提示：地面整条都是 2160，光比高度的话站在哪儿都会冒出来
        const nearShaft = Math.abs(this.slime.x - lift.x) < lift.width / 2 + 40

        if (stopIndex >= 0 && stopIndex !== this.liftIndex && nearShaft) {
          prompt = this.interactPrefix() + '呼叫电梯'
          action = () => this.useLift()
        }
      }
    }

    this.promptBox.setVisible(prompt !== null)
    this.promptText.setVisible(prompt !== null)

    // 手机上没有 F 键：当前这条提示能做的话，点提示条本身就等于按 F
    this.promptAction = this.inputLocked ? null : action

    if (prompt) {
      this.promptBox.setPosition(this.slime.x, this.slime.y - 34)
      this.promptText.setPosition(this.slime.x, this.slime.y - 34)
      // 触屏下把「[F] 阅读」这类提示里的按键字样去掉
      this.promptText.setText(touchText(prompt))

      // 提示框跟着文字宽度走。原来是固定 80 宽，「拾取杏仁」「修理楼梯」这种就顶出去了；
      // 顺带把点得到的地方（hitArea）也改成一样宽，手机上点框才算点得到
      const boxWidth = this.promptText.width + 16

      this.promptBox.setSize(boxWidth, 18)
      this.promptBox.input?.hitArea.setSize(boxWidth, 18)

      // 第一次显示带 [F] 的交互提示之后，后面的提示就不再带前缀了
      if (action) {
        markHintSeen('interact')
      }

      if (!this.inputLocked && action && Phaser.Input.Keyboard.JustDown(this.interactKey)) {
        playSfx(this, 'sfx-interact', 0.3)
        action()
      }
    }

    if (this.chaseDef) {
      // 第三关那套：走过触发点，墙就开始压过来（和以前一模一样，没加演出）
      if (!this.chased && this.slime.x > this.chaseDef.triggerX) {
        this.chased = true
      }

      if (this.chased) {
        const chaseBody = this.chase.body as Phaser.Physics.Arcade.Body

        if (this.chase.x >= this.chaseDef.stopX) {
          chaseBody.setVelocityX(0)
        } else {
          chaseBody.setVelocityX(this.chaseDef.speed)
        }
      }
    }

    // 券门还封着的时候，走到墙跟前就提醒一句 —— 别让人对着一堵看不见的墙发懵
    if (this.sealHintTimer > 0) {
      this.sealHintTimer -= dt
    }

    if (
      !this.riteDone &&
      this.plazaWallX !== null &&
      !this.inputLocked &&
      this.sealHintTimer <= 0 &&
      this.slime.x > this.plazaWallX - 78 &&
      this.slime.x < this.plazaWallX
    ) {
      this.sealHintTimer = 6
      this.showMessage('券门还封着 —— 先去左边的广场观礼')
    }

    // 追击小队：走过触发线就演出一段、然后原地生成千岩军。
    // chaseOnLand（第八关）：光走过线不算，还得脚落到地面 —— 出了玉京台跳下来那一下
    if (this.squadDef) {
      const ready =
        !this.chased &&
        this.slime.x > this.squadDef.at &&
        (!this.level.chaseOnLand || body.blocked.down)

      if (ready) {
        if (this.terraceChased) {
          // 存档里记过这场追击演过了：镜头演出不放，千岩军照样追上来
          this.chased = true
          this.spawnChaseSquad()
        } else {
          this.startChase()
        }
      }

      if (this.chased) {
        this.updateChasers(dt)
      }
    }

    if (
      this.blessed &&
      this.level.blessingEndX !== undefined &&
      this.slime.x > this.level.blessingEndX
    ) {
      this.endBlessing()
    }

    if (onGround) {
      this.stamina = Math.min(STAMINA_MAX, this.stamina + HOVER.regenPerSecond * dt)
    }

    if (!this.inputLocked && !this.blinkAiming && jumpJust && onGround) {
      // 岩化时身体更结实，跳得也略高一点
      this.slime.setVelocityY(this.jumpPower * (this.armored ? ARMOR_JUMP : 1))
      playSfx(this, 'sfx-jump', 0.16)
    }

    const wantHover =
      !this.inputLocked &&
      element.canHover &&
      (this.cursors.space.isDown || this.touchJump) &&
      !onGround &&
      this.stamina > 0

    // 滑翔：风元素、没按着上升、人还在空中、而且还有体力
    const gliding = !wantHover && element.canHover && !onGround && this.stamina > 0

    if (wantHover) {
      if (body.velocity.y > -HOVER.riseSpeed) {
        this.slime.setVelocityY(-HOVER.riseSpeed)
      }

      this.stamina = this.blessed
        ? STAMINA_MAX
        : Math.max(0, this.stamina - HOVER.drainPerSecond * dt)
    } else if (gliding) {
      if (body.velocity.y > HOVER.fallSpeed) {
        this.slime.setVelocityY(HOVER.fallSpeed)
      }

      this.stamina = this.blessed
        ? STAMINA_MAX
        : Math.max(0, this.stamina - HOVER.glideDrainPerSecond * dt)
    }

    setLoop(this, 'sfx-fly', wantHover, 0.12)
    setLoop(this, 'sfx-glide', gliding && body.velocity.y > 0, 0.1)

    if (onGround && !this.wasOnGround) {
      this.landSquash = 1
      playSfx(this, 'sfx-land', 0.15)
    }

    if (onGround && Math.abs(body.velocity.x) > 10) {
      this.stepTimer -= dt

      if (this.stepTimer <= 0) {
        this.stepTimer = 0.3
        playSfx(this, 'sfx-step', 0.16, Phaser.Math.FloatBetween(0.92, 1.08))
      }
    } else {
      this.stepTimer = 0.06
    }

    this.wasOnGround = onGround
    let flapSpeed = 420
    let flapRange = 0.12

    if (!onGround) {
      if (wantHover || body.velocity.y < 0) {
        flapSpeed = 110
        flapRange = 0.5
      } else {
        flapSpeed = 260
        flapRange = 0.3
      }
    } else if (Math.abs(body.velocity.x) > 10) {
      flapRange = 0
    }

    const wave = Math.sin(this.time.now / flapSpeed)
    this.wingOffset = Math.round(wave * flapRange * 8)

    this.landSquash = Math.max(0, this.landSquash - dt * 4)

    let sx = 1
    let sy = 1

    if (!onGround) {
      if (wantHover) {
        const wave = Math.sin(time / 140)
        sx = 0.95 + wave * 0.02
        sy = 1.06 - wave * 0.02
      } else if (element.canHover && this.stamina <= 0 && body.velocity.y > 0) {
        sx = 1.16
        sy = 0.86
      } else if (body.velocity.y < 0) {
        sx = 0.9
        sy = 1.12
      } else {
        sx = 1.1
        sy = 0.92
      }
    } else {
      const moving = Math.abs(body.velocity.x) > 10
      // 岩化后体型放大，形变幅度按倍数收回来：绝对位移、节奏都和普通态一致
      const amount =
        ((moving ? 0.05 : 0.03) * element.squash) / (this.armored ? ARMOR_GROW : 1)
      const period = moving ? 120 : 340
      const wave = Math.sin((time / period) * Math.PI * 2)

      sx = 1 + wave * amount
      sy = 1 - wave * amount
    }

    sx += this.landSquash * 0.22
    sy -= this.landSquash * 0.22

    this.blinkTimer -= delta

    if (this.blinkTimer <= 0) {
      this.blinkTimer = 1800 + Math.random() * 2200
      this.blinkScale = 0.15

      this.time.delayedCall(110, () => {
        this.blinkScale = 1
      })
    }

    this.syncVisual(sx, sy)
    this.staminaBar.setScale(this.stamina / STAMINA_MAX, 1)

    // 岩化条：岩化时是剩余时间（金色，越用越短），冷却时是回充进度（土色，长满就能再按 X）
    const showArmor = this.element === 'rock' && (this.armored || this.armorCooldown > 0)

    this.armorBarBack.setVisible(showArmor)
    this.armorBar.setVisible(showArmor)

    if (this.armored) {
      this.armorBar.setFillStyle(0xd9a441)
      this.armorBar.setScale(Math.max(0, this.armoredTimer / ARMOR_TIME), 1)
    } else {
      this.armorBar.setFillStyle(0x6b5a3a)
      this.armorBar.setScale(Math.max(0, 1 - this.armorCooldown / ARMOR_COOLDOWN), 1)
    }

    this.updateTouchVisuals()
  }

  // 触屏按键的显示：岩化冷却时灰版打底、亮版从下往上长回来；
  // 史莱姆跑到按键底下时整体淡下去，保证不挡视野
  private updateTouchVisuals() {
    if (this.touchButtons.length === 0) {
      return
    }

    if (this.touchArmorFill) {
      const showRock = this.rockAvailable && this.element === 'rock'
      // 雷闪那套：充能进度 = （已有格数 + 正在充的那一格）÷ 总格数
      const showThunder = this.chargeBattery.visible
      const ratio = showRock
        ? this.armorCooldown <= 0
          ? 1
          : Math.max(0, 1 - this.armorCooldown / ARMOR_COOLDOWN)
        : showThunder
          ? (this.blinkCharges + this.chargeFraction()) / BLINK_CHARGE_MAX
          : 0
      const show = (showRock || showThunder) && ratio > 0.002

      if (show) {
        // setCrop 的原点在贴图左上角：裁出下面这一块，就是自下而上回充。
        // 尺寸直接读贴图本身，别再写死数字——贴图从 36 加大到 50 的时候这里漏改过一次
        const size = this.touchArmorFill.height

        this.touchArmorFill.setCrop(0, size * (1 - ratio), size, size * ratio)
      }

      this.touchArmorFill.setVisible(show)
    }

    // 雷闪键下缘那三个点：亮着的就是还剩的格数
    const showDots = this.chargeBattery.visible

    this.blinkDots.forEach((dot, index) => {
      dot.setVisible(showDots)

      if (showDots) {
        dot.setTint(index < this.blinkCharges ? 0xffd54f : 0x3a3a4a)
      }
    })

    const camera = this.cameras.main
    const screenX = this.slime.x - camera.scrollX
    const screenY = this.slime.y - camera.scrollY

    // 摇杆也吃这套「靠近变淡」：它的位置会跟着手指跑，所以按它当前位置算，
    // 倍率乘在"待机/按住"那套基准透明度上，两边不会互相盖掉
    if (this.stickBase && this.stickKnob) {
      const nearStick =
        Math.abs(screenX - this.stickBase.x) < STICK.hitRadius + 22 &&
        Math.abs(screenY - this.stickBase.y) < STICK.hitRadius + 22
      const factor = nearStick ? STICK_ALPHA.fade : 1

      this.stickBase.setAlpha(this.stickAlpha.base * factor)
      this.stickKnob.setAlpha(this.stickAlpha.knob * factor)
    }

    this.touchButtons.forEach((button) => {
      if (button.image === this.touchArmorFill) {
        return
      }

      const near =
        Math.abs(screenX - button.x) < button.r + 22 &&
        Math.abs(screenY - button.y) < button.r + 22

      // 靠近史莱姆时淡一点，但别淡到看不见（原来 ×0.3 太虚了）
      let alpha = near ? button.base * 0.45 : button.base

      // 雷闪键的底色：还有电的时候只是"变浅"（0.4），一格都没有才是那种灰（0.72）
      if (button.image === this.touchArmorDim && this.chargeBattery.visible) {
        alpha = near ? 0.3 : this.blinkCharges > 0 ? 0.4 : 0.72
      }

      button.image.setAlpha(alpha)
    })

    if (this.touchArmorFill) {
      this.touchArmorFill.setAlpha(this.touchArmorDim?.alpha ?? 0.62)
    }
  }
}
