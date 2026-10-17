import type { LevelDef } from './levels'

// 仙家试炼秘境（第九关的隐藏子关卡，不放进 LEVELS，选关界面看不到）。
// 这里先搭功能骨架：一块平地 + 三心 HUD + 元素封印；三项试炼的造物后面再往里面加。
export const DOMAIN_LEVEL: LevelDef = {
  name: '秘境 · 仙家试炼',
  intro:
    '仙人袖袍一挥，脚下的山路忽然变成一片云雾。\n这里看不清是天在山间，还是山浮在天上。\n三重试炼，从脚下开始。',
  width: 1600,
  height: 900,
  startElement: 'rock',
  unlocks: [],
  spawn: { x: 80, y: 787 },
  bg: 'mountain',
  cameraBias: 0,
  crane: { x: 800, y: 800 },
  goal: { x: 1520, y: 786, kind: 'chest', prompt: '打开' },
  goalDisabled: true,
  platforms: [
    // 秘境底层：隐形碰撞箱，画面由下面的云团铺出来
    { x: 800, y: 820, width: 1600, height: 40, tint: 0x6a5e52, hidden: true },
  ],
  // 第一重试炼：四块浮石一段，踩上约 0.9 秒后消失；掉下安全台就扣 1 心回段首
  trialOne: {
    stones: [
      { x: 320, y: 760, section: 0 },
      { x: 380, y: 720, section: 0 },
      { x: 440, y: 680, section: 0 },
      { x: 500, y: 640, section: 0 },
      { x: 600, y: 580, section: 1 },
      { x: 540, y: 540, section: 1 },
      { x: 480, y: 500, section: 1 },
      { x: 420, y: 460, section: 1 },
      { x: 380, y: 400, section: 2 },
      { x: 440, y: 360, section: 2 },
      { x: 500, y: 320, section: 2 },
      { x: 560, y: 280, section: 2 },
    ],
    checkpoints: [
      { x: 600, y: 620 },
      { x: 360, y: 440 },
      { x: 660, y: 260 },
    ],
    artifact: { x: 680, y: 240 },
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
  ],
  orbs: [],
  gems: [],
  blessings: [],
  hazards: [],
  monuments: [],
  hints: [
    { x: 800, y: 735, text: '与仙人对话，开始第一重试炼' },
    { x: 350, y: 735, text: '跳上浮石，取得仙家符箓' },
  ],
}
