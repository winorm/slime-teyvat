import Phaser from 'phaser'
import { ELEMENTS, ELEMENT_ORDER, type ElementKey } from '../data/elements'
import {
  LEVELS,
  THEME_COLORS,
  type LevelDef,
  type DomeDef,
  type PlatformDef,
  type PickupDef,
  type RepairDef,
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

// 岩柱：贴图多大、从落点上方多高开始掉、蓄力多久、落点最远能低于脚底多少
const PILLAR_SIZE = { width: 20, height: 72 }
const PILLAR_DROP = 140
const PILLAR_REACH = 170
// 按住多久算「长按」（秒）：短按直接放，长按进预览、再点一次 C 才落柱
const PILLAR_HOLD = 0.22
// 依次尝试的生成距离：前面放不下就往人身边挪
const PILLAR_OFFSETS = [30, 22, 14, 6, 0]

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
  private eyes: Phaser.GameObjects.Image[] = []
  private blinkTimer = 0
  private blinkScale = 1
  private landSquash = 0
  private stepTimer = 0
  private wasOnGround = false
  private stepRise = 0
  private stepTop = 0
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
  private armorKey!: Phaser.Input.Keyboard.Key
  private rockKey!: Phaser.Input.Keyboard.Key

  private introShowing = false
  private introLayer: Phaser.GameObjects.Container | null = null

  private chase!: Phaser.Physics.Arcade.Image
  private chased = false

  private interactKey!: Phaser.Input.Keyboard.Key
  private goalSprite!: Phaser.Physics.Arcade.Sprite
  private statueSprite: Phaser.GameObjects.Image | null = null
  private statueUsed = false
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

  create() {
    this.level = LEVELS[progress.levelIndex]

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
    this.physics.world.resume()

    this.cameras.main.setZoom(1)

    this.chased = false
    this.platforms = this.physics.add.staticGroup()
    this.pillars = this.physics.add.staticGroup()
    this.orbs = this.physics.add.staticGroup()

    const theme = this.level.bg ?? 'field'
    const palette = THEME_COLORS[theme]

    // 纵向视差：户外的天空/远山/湖面/芦苇是「远景」，纵向一律不跟着相机走，
    // 所以跳起来的时候整片背景不会上下滑动（横向的视差保留）。
    // 塔内的墙反过来，要跟世界 1:1 地往上走，每层的窗户才对得上楼层。
    // 很高的户外关卡（第七关爬树，2200 高）用「分层视差」：2D 游戏的通行做法 ——
    // 天空几乎不动（0.06）、远山/湖面很慢（0.14）、岸边的芦苇最快（0.6，爬高时最先退出画面）。
    // 这样爬到高层仍然看得见远处的山和湖，而脚边的芦苇早就沉到画面外了
    const tallOutdoor = this.level.height > 800
    const worldLocked = theme === 'tower'

    this.bgFarY = worldLocked ? 1 : tallOutdoor ? 0.06 : 0
    this.bgMidY = worldLocked ? 1 : tallOutdoor ? 0.14 : 0
    this.bgNearY = worldLocked ? 1 : tallOutdoor ? 0.6 : 0

    // 很高的户外关卡：地面那一屏就是设计好的构图，往上爬时三层各自按系数往下沉。
    // 用整幅 Image（不平铺），所以不会出现"远山下面又是天空"的绕回
    if (tallOutdoor) {
      this.groundScrollY = this.level.height - 270
      this.add
        .rectangle(0, 0, 480, 270, 0xf3b072)
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

      this.add.image(windmill.x, windmill.y - 32, 'windmill').setDepth(-15)

      this.windmillBlades = this.add
        .image(windmill.x, windmill.y - 54, 'windmill-blades')
        .setDepth(-14)
        .setScale(0.8)
    }

    // 望舒客栈：背景里的地标，贴着地面立着
    if (this.level.inn) {
      this.add.image(this.level.inn.x, this.level.inn.y - 80, 'inn').setDepth(-15)
    }

    // 背景静物：破屋、矿山剪影，底边贴在地面线上，不参与碰撞
    ;(this.level.decor ?? []).forEach((def) => {
      this.add
        .image(def.x, def.y, def.key)
        .setOrigin(0.5, 1)
        .setScale(def.scale ?? 1)
        .setDepth(-15)
    })

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
        // 平台护栏也画在人前面：它和楼梯护栏是接在一起的，depth 要一致
        const railGfx = this.add.graphics().setDepth(12)

        railGfx.fillStyle(0x7a4c28, 1)
        railGfx.fillRect(railLeft, railY, def.width, 4)

        railGfx.fillStyle(0x6f4423, 1)

        for (let postX = railLeft + 2; postX <= railLeft + def.width - 3; postX += 40) {
          railGfx.fillRect(postX, railY, 3, 26)
        }

        railGfx.fillRect(railLeft + def.width - 5, railY, 3, 26)

        // 护栏的端头挡板（实体）：1/2 层平台的外端是悬空的，没东西挡着人会一头栽下去。
        // 挡板只有 26 高（和护栏一样），走不过去但跳得过去 —— 只防"不小心走掉下去"，
        // 不封死路线。它不进 this.stairs，所以不会被自动上台阶抬上去
        // 井口那一侧不加：那是进出电梯的门（护栏横木留着，只去掉这块实体挡板）
        if (!atLiftShaft) {
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

    this.buildStairs()

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

    const savedGems = progress.levelGems[progress.levelIndex] ?? []

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

    const goal = this.level.goal
    const goalColor = goal.grants ? ELEMENTS[goal.grants].color : 0xffffff
    this.goalSprite = this.physics.add.staticSprite(goal.x, goal.y, goal.kind)
    this.goalSprite.setTint(goalColor)

    this.goalReady = goal.after === undefined

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
      const wanted = 'statue-' + statue.grants
      const figureKey = this.textures.exists(wanted) ? wanted : 'statue-wind'
      const tint = ELEMENTS[statue.grants].color

      // statue.y 是「底座底面所在的那条线」，也就是脚下的地面顶面
      const base = this.add.image(statue.x, statue.y, 'statue-base').setDepth(-1)
      // 底座：底面对齐地面线 → 中心 = 地面线 − 半高，顶面 = 地面线 − 全高
      const baseTop = statue.y - base.displayHeight

      base.setY(statue.y - base.displayHeight / 2)

      // 风神像的翅膀直接用风史莱姆那张 wing 贴图放大来摆，
      // 形状、羽线、角度和史莱姆完全一致，只是大号版
      if (statue.grants === 'wind') {
        const wings = [
          { offset: -7, originX: 1, angle: -45, flip: true },
          { offset: 7, originX: 0, angle: 45, flip: false },
        ]

        wings.forEach((wing) => {
          this.add
            .image(statue.x + wing.offset, baseTop + STATUE_SEAT - 38, 'wing')
            .setOrigin(wing.originX, 0.5)
            .setFlipX(wing.flip)
            .setAngle(wing.angle)
            .setScale(1.2)
            .setTint(tint)
            .setDepth(-2)
        })
      }

      // 本体站在底座上（底座在后面，所以台面会从袍子/裙摆两侧露出来）
      this.statueSprite = this.add.image(statue.x, statue.y, figureKey).setTint(tint)
      // 造像：底面压在底座顶面下面一点（压 5 像素），做出"下托上"的坐实感
      this.statueSprite.setY(
        baseTop + STATUE_SEAT - this.statueSprite.displayHeight / 2
      )
    }

    this.slime = this.physics.add.sprite(this.level.spawn.x, this.level.spawn.y, 'slime-none')
    this.slime.setBounce(0.2)
    this.slime.setCollideWorldBounds(true)
    this.slime.setVisible(false)

    this.slimeArt = this.add.image(this.level.spawn.x, this.level.spawn.y, 'slime-none')

    this.wingLeft = this.add.image(0, 0, 'wing')
    this.wingRight = this.add.image(0, 0, 'wing')
    this.rockCrown = this.add.image(0, 0, 'rock-crown').setDepth(9).setVisible(false)
    this.armorPlate = this.add.image(0, 0, 'armor-plate').setDepth(9).setVisible(false)
    
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

    const gemTotal = this.level.gems.length
    const gemStartX = 480 - 20 - (gemTotal - 1) * 18

    this.gemIcons = this.level.gems.map((_spot, index) =>
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

    this.applyElement(progress.current)
    this.refreshGemHud()

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

    this.showIntro(this.level.intro)
    playMusic(this, this.level.music ?? 'music-field')

    if (this.level.chase) {
      this.chase = this.physics.add.image(-40, this.level.height / 2, 'pixel')
      this.chase.setDisplaySize(60, this.level.height)
      this.chase.setTint(palette.crumble)

      const chaseBody = this.chase.body as Phaser.Physics.Arcade.Body
      chaseBody.setAllowGravity(false)

      this.physics.add.overlap(this.slime, this.chase, () => {
        this.die('crush')
      })
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
    if (this.inputLocked || key === this.element || !this.availableElements().includes(key)) {
      return
    }

    progress.current = key
    this.applyElement(key)
    playSfx(this, 'sfx-interact', 0.25)
  }

  private availableElements(): ElementKey[] {
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
    this.touchPillarJust = false
    this.touchPillarUp = false

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

    armorDim.on('pointerdown', () => {
      armorDim.setScale(TOUCH_SCALE * 0.92)
      armorFill.setScale(TOUCH_SCALE * 0.92)
      this.touchArmorJust = true
    })

    armorDim.on('pointerup', armorRelease)
    armorDim.on('pointerout', armorRelease)

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

  private refreshHud() {
    const unlocked = this.availableElements()

    // 岩元素解锁了、而且「当前就是岩史莱姆」，才显示岩柱 / 岩化两个键
    // （键盘的 C / X 本来也只在岩形态下才响应，按钮跟着一致）
    this.rockAvailable = unlocked.includes('rock')

    const showRockSkills = this.rockAvailable && this.element === 'rock'

    this.touchPillarButton?.setVisible(showRockSkills)
    this.touchArmorDim?.setVisible(showRockSkills)
    this.touchArmorFill?.setVisible(showRockSkills)

    unlocked.forEach((key, index) => {
      const icon = this.elementIcons[index]
      const active = key === this.element
      const iconKey = 'icon-' + key

      icon.setVisible(true)
      icon.setPosition(18 + index * 20, 40)
      icon.setTexture(this.textures.exists(iconKey) ? iconKey : 'icon-none')
      icon.setTint(ELEMENTS[key].color)
      icon.setAlpha(active ? 1 : 0.4)

      this.elementMarks[index].setPosition(icon.x, icon.y).setVisible(active)
    })

    // 没解锁的位置全部收起来
    for (let index = unlocked.length; index < this.elementIcons.length; index++) {
      this.elementIcons[index].setVisible(false)
      this.elementMarks[index].setVisible(false)
    }

    this.elementHint.setPosition(14 + unlocked.length * 20, 40)

    // 键位说明跟着当前能力走：当自己是岩史莱姆时才写 X / C，场上有风系才写长按空格
    if (this.keyLegend) {
      const rows = ['← → 移动　空格 跳跃　F 交互　Esc 设置']
      const skills: string[] = []

      if (showRockSkills) {
        skills.push('X 岩化　C 岩柱')
      }

      if (unlocked.some((key) => ELEMENTS[key].canHover)) {
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

    this.wingLeft.setTint(element.color)
    this.wingRight.setTint(element.color)
    this.element = key
    this.jumpPower = element.jump
    this.slimeArt.setTexture('slime-' + key)
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

    recordClear(progress.levelIndex, this.collectedIndices)
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

  private playStatueScene(granted: ElementKey) {
    unlockElement(granted)

    // 演出期间锁操作：物理世界暂停 + 清速度 + 收掉岩柱预览
    this.inputLocked = true
    this.physics.world.pause()
    this.slime.setVelocity(0, 0)
    this.pillarPressed = false
    this.stopPillarPreview()

    // 本关的锁解开了：元素图标那一排会多出一个，Q/E 也能切到它了
    if (this.lockedElement === granted) {
      this.lockedElement = null
    }

    // 演出以神像为中心：没有独立神像时（旧数据）退回用终点
    const source = this.statueSprite ?? this.goalSprite
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
            this.playTransformFlash(granted)
          },
        })
      },
    })
  }

  private playTransformFlash(granted: ElementKey) {
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
        this.applyElement(granted)
      },
      onComplete: () => {
        flash.destroy()

        // 演出结束，解锁操作、恢复物理世界，再恢复镜头
        this.inputLocked = false
        this.physics.world.resume()

        // 演出结束，镜头恢复到正常跟随和 1 倍缩放
        this.cameras.main.zoomTo(1, 300)
        this.cameras.main.startFollow(this.slime, true, 0.12, 0.12)

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

  // 真正生成：从落点上方掉下来，动画期间不参与碰撞，落点就是预览里那一个
  private spawnRockPillar(x: number, landTop: number, spawnBottom: number) {
    this.rockPillar?.destroy()

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
      },
    })

    this.time.delayedCall(PILLAR_TIME * 1000, () => {
      if (this.rockPillar === pillar) {
        this.rockPillar = null
      }

      pillar.destroy()
    })
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

  // 木楼梯：一级一级木踏板（三角形切面）+ 底下斜撑的木梁 + 斜扶栏和立柱。
  // 画面全都画在 Graphics 上；挡人的只有每级踏面顶上那条 run×rise 的碰撞盒。
  // 碰撞盒收进 this.stairs，往前走的时候 tryAutoStep() 会把人一级级抬上去，不用跳。
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
      const railGfx = this.add.graphics().setDepth(layer === 'back' ? 1.4 : 12)
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
    this.windTrails.forEach((trail) => trail.setDepth(back ? 1.1 : 9))
    this.eyes.forEach((eye) => eye.setDepth(back ? 1.3 : 11))

    // 客栈家具跟着换：树后层整组沉到史莱姆后面
    this.innDecor.forEach((item) => item.image.setDepth(back ? item.back : item.front))

    // 头顶那盘菜跟着人换层，不然走到树后面它还飘在树前
    this.carriedDish?.setDepth(back ? 1.35 : 11.5)

    // 压力板也换：树后层要把板子沉到史莱姆后面，否则人站在板子上会被板子盖住脚
    this.plateList.forEach((item) =>
      item.art.setDepth(back ? PLATE_DEPTH.back : PLATE_DEPTH.front)
    )

    this.updateTrunk()
    this.updateRoot()
    this.updateSpindle()
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

    // 井道两侧的立柱（画在楼板之后、树干之前）：加深加粗一点，从地面一直到顶层都看得见
    const railHeight = bottomStop - topStop + 30
    const railY = (topStop + bottomStop) / 2

    ;[lift.x - half - 3, lift.x + half + 1].forEach((railX) => {
      this.add.rectangle(railX, railY, 4, railHeight, 0x4a3320).setDepth(2.4)
      this.add.rectangle(railX + 2, railY, 1, railHeight, 0x7a5a38).setDepth(2.41)
    })

    // 轿厢：挡住玩家的那块（静态体，靠 refreshBody 跟着走）
    const car = this.platforms.create(lift.x, lift.stops[0] + carH / 2, 'pixel') as Phaser.Physics.Arcade.Sprite

    car.setDisplaySize(lift.width, carH)
    car.setVisible(false)
    car.refreshBody()
    car.setData('liftCar', true)
    this.liftCar = car

    // 轿厢的样子（专用的轿厢贴图，比普通木板更容易认）+ 上面吊着的绳子
    this.liftCarArt = this.add
      .image(lift.x, lift.stops[0] + carH / 2, 'lift-car')
      .setDepth(2.5)

    this.liftRope = this.add
      .rectangle(lift.x, topStop - 12, 2, 10, 0x6f4423)
      .setOrigin(0.5, 0)
      .setDepth(2.45)

    this.liftState.y = lift.stops[0]

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

  private refreshGemHud() {
    const collected = new Set([
      ...(progress.levelGems[progress.levelIndex] ?? []),
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

  private die(cause: string) {
    if (this.dying || this.invulnTimer > 0) {
      return
    }

    // 岩化能挡一次"造物伤害"（红闸门、崩塌的墙），摔落不算
    if (this.armored && cause !== 'fall') {
      this.setArmored(false)
      this.invulnTimer = 1.2
      this.showMessage('岩壳替你挡下了一击')

      return
    }

    this.dying = true
    stopAllLoops()
    playSfx(this, 'sfx-die', 0.45)
    this.scene.pause()
    this.scene.launch('dead', { cause })
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
    const speed = ELEMENTS[this.element].speed
    const dt = delta / 1000

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
    const rockJustDown = Phaser.Input.Keyboard.JustDown(this.rockKey) || this.touchPillarJust
    const rockJustUp = Phaser.Input.Keyboard.JustUp(this.rockKey) || this.touchPillarUp
    const jumpJust = Phaser.Input.Keyboard.JustDown(this.cursors.space) || this.touchJumpJust

    this.touchArmorJust = false
    this.touchPillarJust = false
    this.touchPillarUp = false
    this.touchJumpJust = false

    if (!this.inputLocked) {
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

    if (!this.inputLocked) {
      this.updatePlates(dt)
      this.updateLaunchers(dt)
      this.updatePillarPreview()
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

    if (this.inputLocked) {
      // 神像演出期间原地不动
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
    // 自动上台阶的那几帧人在空中，但动画和音效要按「还在走路」算，
    // 不然每上一级都会当成一次落地：压缩一下、放一声落地音，比抖还难看
    const onGround = body.blocked.down || this.stepRise > 0

    this.tryAutoStep(onGround, dt)
    // 正在自动上台阶：把镜头的纵向跟随临时调紧，人就不会在屏幕上弹一下再沉回来。
    // 抬完还多保持 STAIR_CAM_HOLD 秒，把剩下那点偏差收干净
    if (this.stairCamTime > 0) {
      this.stairCamTime -= dt
    }

    camera.setLerp(0.12, this.stairCamTime > 0 ? STAIR_CAM_LERP : CAM_LERP_Y)

    let prompt: string | null = null
    let action: (() => void) | null = null

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

    if (target) {
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

    if (this.level.chase) {
      if (!this.chased && this.slime.x > CHASE.triggerX) {
        this.chased = true
      }

      if (this.chased) {
        const chaseBody = this.chase.body as Phaser.Physics.Arcade.Body

        if (this.chase.x >= CHASE.stopX) {
          chaseBody.setVelocityX(0)
        } else {
          chaseBody.setVelocityX(CHASE.speed)
        }
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

    if (!this.inputLocked && jumpJust && onGround) {
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
      const ready = this.armorCooldown <= 0
      const ratio = ready ? 1 : Math.max(0, 1 - this.armorCooldown / ARMOR_COOLDOWN)
      // 只有当前是岩史莱姆时，才在按键上画冷却回充
      const show = this.rockAvailable && this.element === 'rock' && ratio > 0.002

      if (show) {
        // setCrop 的原点在贴图左上角：裁出下面这一块，就是自下而上回充。
        // 尺寸直接读贴图本身，别再写死数字——贴图从 36 加大到 50 的时候这里漏改过一次
        const size = this.touchArmorFill.height

        this.touchArmorFill.setCrop(0, size * (1 - ratio), size, size * ratio)
      }

      this.touchArmorFill.setVisible(show)
    }

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
      button.image.setAlpha(near ? button.base * 0.45 : button.base)
    })

    if (this.touchArmorFill) {
      this.touchArmorFill.setAlpha(this.touchArmorDim?.alpha ?? 0.62)
    }
  }
}
