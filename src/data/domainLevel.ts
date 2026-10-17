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
  goal: { x: 1520, y: 786, kind: 'chest', prompt: '打开' },
  goalDisabled: true,
  platforms: [
    // 秘境底层：一整块浮在云雾里的石台
    { x: 800, y: 820, width: 1600, height: 40, tint: 0x6a5e52 },
    // 三块低矮的试炼标记台（只画不挡人），后面分别放三项试炼
    { x: 330, y: 794, width: 120, height: 12, tint: 0x73665a, solid: false },
    { x: 800, y: 794, width: 120, height: 12, tint: 0x73665a, solid: false },
    { x: 1270, y: 794, width: 120, height: 12, tint: 0x73665a, solid: false },
  ],
  orbs: [],
  gems: [],
  blessings: [],
  hazards: [],
  monuments: [],
  hints: [{ x: 800, y: 735, text: '仙家试炼 · 三重考验' }],
}
