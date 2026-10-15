import type { LevelDef } from './levels'
import { DEV_MODE } from '../state/progress'

// 仅供开发测试的沙盒关卡。
//
// **怎么才算"只给我用"**：
//   ① 它不在 `LEVELS` 数组里 —— 所以选关界面永远看不到它（那 15 个格子是按 LEVELS 下标画的）；
//   ② 要进它必须同时满足两个条件：`DEV_MODE === true`（`src/state/progress.ts` 里那个开关）
//      而且地址上带 `?dev=1`。发布版 DEV_MODE 改成 false 之后，**哪怕别人知道 ?dev=1 也进不去**。
//
// 用法：`npm run dev` → 浏览器打开 http://localhost:5173/?dev=1
// 想每次都是干净状态（不读也不写真存档、不影响你现有的元素解锁和原石）就再加一个参数：
//   http://localhost:5173/?dev=1&fresh=1
// 退出：Esc 打开暂停菜单 → 回主菜单。
//
// 布局（宽 4600 / 高 900，地面顶面 860）：
//   ① 0~400    起点（元素切换）
//   ② 400~900  元素方碑 ×2 → 石门
//   ③ 900~1400 压力板 ×2 → 铁栅栏
//   ④ 1400~1800 岩刺（天花板往下打）
//   ⑤ 1800~2200 岩刺（左右横打，岩柱可挡）
//   ⑥ 2200~2700 楼梯 + 断口（木材修复）
//   ⑦ 2700~3100 水利电梯（地面 / 660 / 460 三站）
//   ⑧ 3100~3700 地形材质（草 / 浅水 / 砖 / 木 / 单向 / 碎裂）
//   ⑨ 3700~4600 预留空地 + 宝箱
export const DEV_LEVEL_MODE =
  DEV_MODE && new URLSearchParams(location.search).has('dev')

export const DEV_LEVEL: LevelDef = {
  name: '测试关卡 · 沙盒',
  intro:
    '测试关卡：只有 DEV_MODE 打开、\n并且地址带 ?dev=1 时才进得来。\n左边是各个机制区，右边一大片\n是留给以后新设计的空地。',
  width: 4600,
  height: 900,
  // 开局就是"无元素"，其余七种直接解锁，方便一格一格试
  startElement: 'none',
  unlocks: ['wind', 'rock', 'thunder', 'grass', 'water', 'fire', 'ice'],
  spawn: { x: 60, y: 820 },
  bg: 'field',
  music: 'music-field',
  goal: { x: 4520, y: 846, kind: 'chest', prompt: '打开' },

  platforms: [
    // 整条地面（顶面 860）
    { x: 2300, y: 880, width: 4600, height: 40 },

    // ④ 岩刺区：头顶一块天花板，发射器贴在它下面往下打
    { x: 1600, y: 660, width: 420, height: 40 },

    // ⑤ 横打区：左边立一道墙，墙里伸出朝右的发射器（岩柱可以挡住岩刺）。
    // 右边那道墙要从地面一直立上去（只写到 780 的话底下 80 像素是通的，人能从底下钻过去）
    { x: 1810, y: 780, width: 40, height: 160, tint: 0x6b5836 },
    { x: 2200, y: 710, width: 40, height: 340, tint: 0x6b5836 },

    // ⑥ 楼梯顶端要接的那块平台（顶面 700）：楼梯收在 x=2450，所以平台从 2450 起
    { x: 2550, y: 703, width: 200, height: 6, plank: true },
    // 从这块平台下到电梯那一层的过桥（顶面 687，右端正好接到电梯楼板的 2740）
    { x: 2690, y: 690, width: 100, height: 6, oneWay: true },

    // ⑦ 电梯的三层楼板（顶面 660 / 460）
    { x: 2900, y: 663, width: 320, height: 6, plank: true },
    { x: 2900, y: 463, width: 320, height: 6, plank: true },

    // ⑧ 地形材质台：六块矮台，依次试草 / 浅水 / 砖 / 木 / 单向 / 碎裂。
    // 顶面 819（比地面高 41），普通史莱姆不用岩化也跳得上去
    { x: 3160, y: 822, width: 100, height: 6, grass: true },
    { x: 3270, y: 822, width: 100, height: 6, water: true },
    { x: 3380, y: 822, width: 100, height: 6, brick: true },
    { x: 3490, y: 822, width: 100, height: 6, plank: true },
    { x: 3600, y: 822, width: 100, height: 6, oneWay: true },
    { x: 3710, y: 822, width: 100, height: 6, crumble: true, tint: 0xa4583a },
  ],

  stairs: [
    // ⑥ 一跑楼梯：从地面走到顶面 700 那块平台
    { from: { x: 2250, y: 860 }, to: { x: 2450, y: 700 }, layer: 'front' },
  ],
  pickups: [
    // 断口旁边放一根木材（一趟一根）
    { x: 2200, y: 860, prompt: '拾取木材' },
  ],
  repairs: [
    // 断这跑的第 5、6 级：光看断口、修完再走一遍
    { stair: 0, steps: [5, 6], x: 2330, y: 800, prompt: '修理楼梯' },
  ],

  lift: { x: 2900, width: 80, stops: [460, 660, 860] },
  windmill: { x: 700, y: 860 },

  monuments: [
    // ② 风、岩两块碑（其余元素还没有专属图标，等设计好再加一行就行）
    { x: 520, y: 838, element: 'wind', id: 'd1' },
    { x: 720, y: 838, element: 'rock', id: 'd2' },
  ],
  doors: [
    // 两种门都摆出来：石门（要两块碑）挡在方碑区后面
    { x: 860, y: 840, width: 70, height: 40, needs: ['d1', 'd2'] },
    // 铁栅栏（要两块压力板）
    { x: 1400, y: 810, width: 80, height: 100, needs: ['p1', 'p2'], texture: 'iron-gate' },
  ],
  plates: [
    { x: 1150, y: 856, id: 'p1' },
    { x: 1230, y: 856, id: 'p2' },
  ],
  launchers: [
    // ④ 天花板往下打：三档间隔，试试岩化硬吃和岩柱挡
    { x: 1540, y: 687, interval: 2.6 },
    { x: 1660, y: 687, interval: 2.6 },
    { x: 1780, y: 687, interval: 1.2 },
    // ⑤ 左右横打
    { x: 1870, y: 760, dir: 'right', interval: 1.8 },
  ],

  notes: [
    {
      x: 620,
      y: 844,
      prompt: '阅读',
      text:
        '测试关卡。\n左边的方碑要按对应元素点亮，\n两块都亮了石门才开。\n再往右是压力板、岩刺、\n断楼梯、电梯和地形材质。',
    },
  ],
  gems: [
    { x: 300, y: 810 },
    { x: 1660, y: 780 },
    { x: 4300, y: 800 },
  ],
  decor: [
    { x: 1900, y: 860, key: 'mine-hill' },
    { x: 2600, y: 860, key: 'ruin-house', scale: 0.85 },
  ],
  hints: [
    { x: 200, y: 812, text: '① 起点：Q / E 或点图标切元素' },
    { x: 640, y: 770, text: '② 方碑 ×2（风 / 岩）→ 石门' },
    { x: 1190, y: 812, text: '③ 压力板 ×2（岩柱 + 岩化）→ 铁栅栏' },
    { x: 1660, y: 596, text: '④ 岩刺：天花板往下打' },
    { x: 2050, y: 596, text: '⑤ 岩刺：左右横打，岩柱能挡' },
    { x: 2340, y: 770, text: '⑥ 楼梯断口：先捡木材再修' },
    { x: 2900, y: 812, text: '⑦ 电梯：站右半边往上、左半边往下' },
    { x: 3430, y: 740, text: '⑧ 地形材质：草 / 浅水 / 砖 / 木 / 单向 / 碎裂' },
    { x: 4000, y: 812, text: '⑨ 预留区：以后新元素、新机关放这儿' },
  ],
  orbs: [],
  blessings: [],
  hazards: [],
}
