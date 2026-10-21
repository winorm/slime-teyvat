import type { LevelDef } from './levels'

// 仙家试炼秘境（第九关的隐藏子关卡，不放进 LEVELS，选关界面看不到）。
// 这里先搭功能骨架：一块平地 + 三心 HUD + 元素封印；三项试炼的造物后面再往里面加。
export const DOMAIN_LEVEL: LevelDef = {
  name: '秘境 · 仙家试炼',
  intro:
    '仙人袖袍一挥，脚下的山路忽然变成一片云雾。\n这里看不清是天在山间，还是山浮在天上。\n三重试炼，从脚下开始。',
  width: 2280,
  height: 900,
  startElement: 'rock',
  unlocks: [],
  spawn: { x: 80, y: 787 },
  bg: 'mountain',
  music: 'music-trial',
  cameraBias: 0,
  crane: { x: 800, y: 800 },
  goal: { x: 1520, y: 786, kind: 'chest', prompt: '打开' },
  goalDisabled: true,
  gemTotalBonus: 3,
  platforms: [
    // 秘境底层：隐形碰撞箱，画面由下面的云团铺出来
    { x: 1140, y: 820, width: 2280, height: 40, tint: 0x6a5e52, hidden: true },
  ],
  // 第一重试炼：四块浮石一段，踩上约 0.9 秒后消失；掉下安全台就扣 1 心回段首
  trialOne: {
    stones: [
      { x: 320, y: 760, section: 0 },
      { x: 400, y: 720, section: 0 },
      { x: 480, y: 680, section: 0 },
      { x: 560, y: 640, section: 0 },
      { x: 820, y: 580, section: 1 },
      { x: 760, y: 540, section: 1 },
      { x: 680, y: 500, section: 1 },
      { x: 600, y: 460, section: 1 },
      { x: 340, y: 400, section: 2 },
      { x: 440, y: 360, section: 2 },
      { x: 500, y: 320, section: 2 },
      { x: 560, y: 280, section: 2 },
    ],
    checkpoints: [
      { x: 700, y: 620 },
      { x: 460, y: 440 },
      { x: 620, y: 260 },
    ],
    artifact: { x: 640, y: 240 },
  },
  // 第二重试炼：右半边另起一块云上擂台。岩脊从落脚处窜出，
  // 先亮 0.8 秒预警圈，再破土；五轮依次 3→7 道。
  trialTwo: {
    arena: { left: 1660, right: 2200, groundY: 800 },
    rounds: [3, 4, 5, 6, 7],
    roundTime: 8,
    warnTime: 0.8,
    // 低空横扫的岩刺：第一轮一条，第三轮起两条；离地 42 像素，
    // 站着能从头顶擦过去，一跳就会撞上。速度 520 px/s，横穿 540 宽的擂台约 1 秒。
    sideSpikes: {
      counts: [1, 1, 2, 2, 2],
      firstAt: 2600,
      lastAt: 6400,
      speed: 520,
      height: 42,
    },
  },
  // 第三重试炼：三口仙家机关锅摆在第一重和第二重之间的空地上。
  // 每轮先抬锅露出苹果，再按 4 / 5 / 6 次换位，最后由玩家走近按 F 选锅。
  trialThree: {
    area: { left: 1040, right: 1460, groundY: 800 },
    slots: [1120, 1250, 1380],
    rounds: 3,
    swaps: [4, 5, 6],
    showTime: 900,
    swapTime: 380,
  },
  // 云台：两排交错的 cloud-puff，顶面刚好托住隐形平台的 y=800
  decor: [
    { x: -40, y: 850, key: 'cloud-puff', scale: 1.45, depth: 0.74 },
    { x: 140, y: 850, key: 'cloud-puff', scale: 1.2, depth: 0.74 },
    { x: 320, y: 852, key: 'cloud-puff', scale: 1.35, depth: 0.74 },
    { x: 500, y: 849, key: 'cloud-puff', scale: 1.15, depth: 0.74 },
    { x: 680, y: 852, key: 'cloud-puff', scale: 1.4, depth: 0.74 },
    { x: 860, y: 850, key: 'cloud-puff', scale: 1.2, depth: 0.74 },
    { x: 1040, y: 852, key: 'cloud-puff', scale: 1.35, depth: 0.74 },
    { x: 1220, y: 849, key: 'cloud-puff', scale: 1.15, depth: 0.74 },
    { x: 1400, y: 851, key: 'cloud-puff', scale: 1.4, depth: 0.74 },
    { x: 1580, y: 850, key: 'cloud-puff', scale: 1.3, depth: 0.74 },
    // 前排小云，把顶面边缘打碎
    { x: 40, y: 842, key: 'cloud-puff', scale: 1.05, depth: 0.84 },
    { x: 240, y: 844, key: 'cloud-puff', scale: 0.95, depth: 0.84 },
    { x: 430, y: 842, key: 'cloud-puff', scale: 1.1, depth: 0.84 },
    { x: 620, y: 844, key: 'cloud-puff', scale: 0.95, depth: 0.84 },
    { x: 810, y: 842, key: 'cloud-puff', scale: 1.05, depth: 0.84 },
    { x: 1000, y: 844, key: 'cloud-puff', scale: 0.95, depth: 0.84 },
    { x: 1190, y: 842, key: 'cloud-puff', scale: 1.1, depth: 0.84 },
    { x: 1380, y: 844, key: 'cloud-puff', scale: 0.95, depth: 0.84 },
    { x: 1550, y: 842, key: 'cloud-puff', scale: 1.05, depth: 0.84 },
    { x: 1700, y: 850, key: 'cloud-puff', scale: 1.4, depth: 0.74 },
    { x: 1880, y: 851, key: 'cloud-puff', scale: 1.2, depth: 0.74 },
    { x: 2060, y: 849, key: 'cloud-puff', scale: 1.45, depth: 0.74 },
    { x: 2240, y: 850, key: 'cloud-puff', scale: 1.25, depth: 0.74 },
    { x: 1780, y: 843, key: 'cloud-puff', scale: 1.0, depth: 0.84 },
    { x: 1970, y: 842, key: 'cloud-puff', scale: 1.1, depth: 0.84 },
    { x: 2160, y: 844, key: 'cloud-puff', scale: 0.95, depth: 0.84 },
  ],
  orbs: [],
  gems: [],
  blessings: [],
  hazards: [],
  monuments: [],
  // 秘境背景上不摆任何标语牌；引导全部交给仙人的对话和 HUD
  hints: [],
}
