export type ElementKey =
  | 'none'
  | 'wind'
  | 'rock'
  | 'thunder'
  | 'grass'
  | 'water'
  | 'fire'
  | 'ice'

export type ElementDef = {
  label: string
  color: number
  eyeColor: number
  jump: number
  speed: number
  wing: boolean
  canHover: boolean
  // 走动时身体形变的幅度系数：越重越小（岩史莱姆最重，晃动最轻）
  squash: number
}

export const ELEMENTS: Record<ElementKey, ElementDef> = {
  none: { label: '无', color: 0x55556a, eyeColor: 0x20202a, jump: -260, speed: 100, wing: false, canHover: false, squash: 1 },
  wind: { label: '风', color: 0x74d0b0, eyeColor: 0x1f4a3e, jump: -260, speed: 120, wing: true, canHover: true, squash: 1 },
  rock: { label: '岩', color: 0xd9a441, eyeColor: 0x5a3d12, jump: -240, speed: 90, wing: false, canHover: false, squash: 0.45 },
  thunder: { label: '雷', color: 0xb388ff, eyeColor: 0x3c2266, jump: -260, speed: 100, wing: false, canHover: false, squash: 1 },
  grass: { label: '草', color: 0x7bc86c, eyeColor: 0x28461f, jump: -260, speed: 100, wing: false, canHover: false, squash: 1 },
  water: { label: '水', color: 0x4fa8e8, eyeColor: 0x14395c, jump: -260, speed: 100, wing: false, canHover: false, squash: 1 },
  fire: { label: '火', color: 0xff7043, eyeColor: 0x5c1f0c, jump: -260, speed: 100, wing: false, canHover: false, squash: 1 },
  ice: { label: '冰', color: 0x81d4fa, eyeColor: 0x1d4a63, jump: -260, speed: 100, wing: false, canHover: false, squash: 1 },
}

export const ELEMENT_ORDER: ElementKey[] = [
  'none',
  'wind',
  'rock',
  'thunder',
  'grass',
  'water',
  'fire',
  'ice',
]
