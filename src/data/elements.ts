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
  canHover: boolean
}

export const ELEMENTS: Record<ElementKey, ElementDef> = {
  none: { label: '无', color: 0x55556a, eyeColor: 0x20202a, jump: -260, canHover: false },
  wind: { label: '风', color: 0x74d0b0, eyeColor: 0x1f4a3e, jump: -260, canHover: true },
  rock: { label: '岩', color: 0xd9a441, eyeColor: 0x5a3d12, jump: -240, canHover: false },
  thunder: { label: '雷', color: 0xb388ff, eyeColor: 0x3c2266, jump: -260, canHover: false },
  grass: { label: '草', color: 0x7bc86c, eyeColor: 0x28461f, jump: -260, canHover: false },
  water: { label: '水', color: 0x4fa8e8, eyeColor: 0x14395c, jump: -260, canHover: false },
  fire: { label: '火', color: 0xff7043, eyeColor: 0x5c1f0c, jump: -260, canHover: false },
  ice: { label: '冰', color: 0x81d4fa, eyeColor: 0x1d4a63, jump: -260, canHover: false },
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
