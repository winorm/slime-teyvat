import type { ElementKey } from '../data/elements'
import { ELEMENT_ORDER } from '../data/elements'

// 开发者模式：改成 true 就能解锁全部关卡，用于测试
// 这个值在打包时会被写死，发布版本必须是 false
export const DEV_MODE = true

// 开发用开关：改成 true 就是「每次启动都清档」，测试时不受旧存档干扰
export const DEV_RESET_SAVE = false

const SAVE_KEY = 'slime-teyvat'
const SAVE_VERSION = 1

// 存档槽数量，主菜单的选档界面按这个数显示
export const SLOT_COUNT = 3

// 一份存档里存什么。以后加字段，记得把 SAVE_VERSION 加一
export type SaveData = {
  version: number
  unlocked: ElementKey[]
  current: ElementKey
  levelIndex: number
  maxLevel: number
  levelGems: number[][]
  gemStorySeen: boolean
  achievements: string[]
}

function emptySave(): SaveData {
  return {
    version: SAVE_VERSION,
    unlocked: ['none'],
    current: 'none',
    levelIndex: 0,
    maxLevel: 0,
    levelGems: [],
    gemStorySeen: false,
    achievements: [],
  }
}

// 复制一份，避免「存档槽」和「当前进度」共用同一个数组
function cloneSlot(data: SaveData): SaveData {
  return {
    ...data,
    unlocked: [...data.unlocked],
    levelGems: data.levelGems.map((list) => [...list]),
    achievements: [...data.achievements],
  }
}

// 存档是从浏览器里读回来的，一律不可信：缺字段、类型不对、被手改过，都退回默认值
function readSlot(raw: unknown): SaveData {
  const save = emptySave()

  if (typeof raw !== 'object' || raw === null) {
    return save
  }

  const data = raw as Partial<SaveData>

  if (Array.isArray(data.unlocked)) {
    save.unlocked = data.unlocked.filter((key) => ELEMENT_ORDER.includes(key))

    if (!save.unlocked.includes('none')) {
      save.unlocked.unshift('none')
    }
  }

  if (typeof data.current === 'string' && ELEMENT_ORDER.includes(data.current as ElementKey)) {
    save.current = data.current as ElementKey
  }

  if (typeof data.levelIndex === 'number') {
    save.levelIndex = Math.max(0, Math.floor(data.levelIndex))
  }

  if (typeof data.maxLevel === 'number') {
    save.maxLevel = Math.max(0, Math.floor(data.maxLevel))
  }

  if (Array.isArray(data.levelGems)) {
    save.levelGems = data.levelGems.map((list) =>
      Array.isArray(list) ? list.filter((item) => typeof item === 'number') : []
    )
  }

  if (Array.isArray(data.achievements)) {
    save.achievements = data.achievements.filter((key) => typeof key === 'string')
  }

  save.gemStorySeen = data.gemStorySeen === true

  return save
}

function readSlots(): SaveData[] {
  const slots = Array.from({ length: SLOT_COUNT }, () => emptySave())

  try {
    const text = localStorage.getItem(SAVE_KEY)

    if (!text) {
      return slots
    }

    const raw = JSON.parse(text) as { version?: number; slots?: unknown[] }

    // 版本对不上就整份丢掉、当作新档（以后要迁移旧存档，就在这里写）
    if (raw.version !== SAVE_VERSION || !Array.isArray(raw.slots)) {
      return slots
    }

    raw.slots.slice(0, SLOT_COUNT).forEach((item, index) => {
      slots[index] = readSlot(item)
    })
  } catch {
    // 隐私模式、存储被禁用、存档被改坏——当新档处理，绝不因为存档崩掉游戏
  }

  return slots
}

function clearStorage() {
  try {
    localStorage.removeItem(SAVE_KEY)
  } catch {
    // 删不掉就算了
  }
}

function writeSlots(list: SaveData[]) {
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify({ version: SAVE_VERSION, slots: list }))
  } catch {
    // 写不进去（隐私模式／配额满）就算了，游戏照常玩
  }
}

// ?reset=1 清一次档；?fresh=1 这次既不读也不写（干净试玩，不动真存档）
const query = new URLSearchParams(location.search)
const freshSession = query.has('fresh')

if (query.has('reset') || DEV_RESET_SAVE) {
  clearStorage()
}

const slots = readSlots()

let activeSlot = 0

// 当前正在玩的那一份。其它文件照旧读 progress.xxx，用法一点没变
export const progress: SaveData = emptySave()

function copySlotToProgress(slot: SaveData) {
  Object.assign(progress, cloneSlot(slot))
}

if (!freshSession) {
  copySlotToProgress(slots[activeSlot])
}

// 选档界面以后调它切槽；现在默认用 0 号槽
export function loadSlot(index: number) {
  activeSlot = Math.max(0, Math.min(SLOT_COUNT - 1, Math.floor(index)))
  copySlotToProgress(slots[activeSlot])
}

export function saveProgress() {
  if (freshSession) {
    return
  }

  slots[activeSlot] = cloneSlot(progress)
  writeSlots(slots)
}

// 清除存档（暂停菜单里的按钮以后会调它），清完当前进度回到新档状态
export function clearSave() {
  clearStorage()

  for (let index = 0; index < SLOT_COUNT; index++) {
    slots[index] = emptySave()
  }

  Object.assign(progress, emptySave())
}

export function unlockElement(key: ElementKey) {
  if (!progress.unlocked.includes(key)) {
    progress.unlocked.push(key)
    progress.unlocked.sort((a, b) => ELEMENT_ORDER.indexOf(a) - ELEMENT_ORDER.indexOf(b))
  }

  progress.current = key
  saveProgress()
}

export function cycleElement(step: number) {
  const list = progress.unlocked
  const index = list.indexOf(progress.current)
  const next = (index + step + list.length) % list.length

  progress.current = list[next]
}

export function recordClear(levelIndex: number, indices: number[]) {
  const saved = progress.levelGems[levelIndex] ?? []

  progress.levelGems[levelIndex] = Array.from(new Set([...saved, ...indices]))
  progress.maxLevel = Math.max(progress.maxLevel, levelIndex + 1)
  saveProgress()
}