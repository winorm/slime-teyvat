import type { ElementKey } from '../data/elements'
import { ELEMENT_ORDER } from '../data/elements'

// 开发者模式：改成 true 就能解锁全部关卡，用于测试
// 这个值在打包时会被写死，发布版本必须是 false
export const DEV_MODE = true

// 开发用开关：改成 true 就是「每次启动都清档」，测试时不受旧存档干扰
export const DEV_RESET_SAVE = false

const SAVE_KEY = 'slime-teyvat'
const SAVE_VERSION = 2

// 存档槽数量，主菜单的选档界面按这个数显示
export const SLOT_COUNT = 3

// 一份存档里存什么。以后加字段，记得把 SAVE_VERSION 加一
export type SaveData = {
  version: number
  name: string
  savedAt: number
  unlocked: ElementKey[]
  current: ElementKey
  levelIndex: number
  maxLevel: number
  levelGems: number[][]
  gemStorySeen: boolean
  achievements: string[]
  // 已经提示过的「操作说明」类别：同一类只在第一次遇到时出现
  seenHints: string[]
}

function emptySave(slotIndex: number): SaveData {
  return {
    version: SAVE_VERSION,
    name: '存档 ' + (slotIndex + 1),
    savedAt: 0,
    unlocked: ['none'],
    current: 'none',
    levelIndex: 0,
    maxLevel: 0,
    levelGems: [],
    gemStorySeen: false,
    achievements: [],
    seenHints: [],
  }
}

// 复制一份，避免「存档槽」和「当前进度」共用同一个数组
function cloneSlot(data: SaveData): SaveData {
  return {
    ...data,
    unlocked: [...data.unlocked],
    levelGems: data.levelGems.map((list) => [...list]),
    achievements: [...data.achievements],
    seenHints: [...data.seenHints],
  }
}

// 存档是从浏览器里读回来的，一律不可信：缺字段、类型不对、被手改过，都退回默认值
function readSlot(raw: unknown, slotIndex: number): SaveData {
  const save = emptySave(slotIndex)

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

  if (Array.isArray(data.seenHints)) {
    save.seenHints = data.seenHints.filter((key) => typeof key === 'string')
  }

  save.gemStorySeen = data.gemStorySeen === true

  if (typeof data.name === 'string' && data.name.length > 0) {
    save.name = data.name.slice(0, 12)
  }

  if (typeof data.savedAt === 'number') {
    save.savedAt = data.savedAt
  }

  return save
}

function readSlots(): SaveData[] {
  const slots = Array.from({ length: SLOT_COUNT }, (_item, index) => emptySave(index))

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
    slots[index] = readSlot(item, index)
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
export const progress: SaveData = emptySave(activeSlot)

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
  progress.savedAt = Date.now()
  slots[activeSlot] = cloneSlot(progress)
  writeSlots(slots)
}

// 清除存档（暂停菜单里的按钮以后会调它），清完当前进度回到新档状态
export function clearSave() {
  clearStorage()

  for (let index = 0; index < SLOT_COUNT; index++) {
    slots[index] = emptySave(index)
  }

  Object.assign(progress, emptySave(activeSlot))
}

export function unlockElement(key: ElementKey) {
  if (!progress.unlocked.includes(key)) {
    progress.unlocked.push(key)
    progress.unlocked.sort((a, b) => ELEMENT_ORDER.indexOf(a) - ELEMENT_ORDER.indexOf(b))
  }

  progress.current = key
  saveProgress()
}

export function cycleElement(step: number, allowed?: ElementKey[]) {
  // 老存档、或者从选关直接跳进来时，当前元素可能不在解锁表里：先补进去。
  // 不补的话 indexOf 是 -1，转来转去只会停在表里第一个元素上，看着像「之前的元素全没了」
  if (!progress.unlocked.includes(progress.current)) {
    unlockElement(progress.current)
  }

  // allowed 是这一关实际能用的元素（比如神像还没摸到，那个元素就先被锁着）
  const list = allowed
    ? progress.unlocked.filter((key) => allowed.includes(key))
    : progress.unlocked

  if (list.length === 0) {
    return
  }

  const index = list.indexOf(progress.current)
  const next = index < 0 ? 0 : (index + step + list.length) % list.length

  progress.current = list[next]
}

// 操作提示只提示一次：记下哪些类别已经提示过了（存在存档里，换关、重开都算）
export function hasSeenHint(key: string) {
  return progress.seenHints.includes(key)
}

export function markHintSeen(key: string) {
  if (progress.seenHints.includes(key)) {
    return
  }

  progress.seenHints.push(key)
  saveProgress()
}

export function recordClear(levelIndex: number, indices: number[]) {
  const saved = progress.levelGems[levelIndex] ?? []

  progress.levelGems[levelIndex] = Array.from(new Set([...saved, ...indices]))
  progress.maxLevel = Math.max(progress.maxLevel, levelIndex + 1)
  saveProgress()
}

export type SlotSummary = {
  index: number
  name: string
  savedAt: number
  maxLevel: number
  gems: number
  achievements: number
  empty: boolean
}

function slotIsEmpty(slot: SaveData) {
  return slot.maxLevel === 0 && slot.levelGems.length === 0 && slot.achievements.length === 0
}

// 存档界面用：只读一份摘要，不切换当前存档
export function getSlotSummary(index: number): SlotSummary {
  const safeIndex = Math.max(0, Math.min(SLOT_COUNT - 1, Math.floor(index)))
  const slot = slots[safeIndex]

  return {
    index: safeIndex,
    name: slot.name,
    savedAt: slot.savedAt,
    maxLevel: slot.maxLevel,
    gems: slot.levelGems.reduce((total, list) => total + list.length, 0),
    achievements: slot.achievements.length,
    empty: slotIsEmpty(slot),
  }
}

// 开新档：不指定槽位就挑一个空档，全满就覆盖最久没玩的那个。返回用掉的槽号
export function newGame(slotIndex?: number) {
  let index = slotIndex === undefined ? slots.findIndex(slotIsEmpty) : Math.floor(slotIndex)

  if (index < 0) {
    index = 0

    slots.forEach((slot, candidate) => {
      if (slot.savedAt < slots[index].savedAt) {
        index = candidate
      }
    })
  }

  index = Math.max(0, Math.min(SLOT_COUNT - 1, index))

  slots[index] = emptySave(index)
  loadSlot(index)
  saveProgress()

  return index
}

// 删掉某一格（不传就是当前正在玩的这格）。注意这里直接写盘，
// 不能调 saveProgress()，否则会把刚清掉的进度又写回去
export function deleteSlot(index: number = activeSlot) {
  const safeIndex = Math.max(0, Math.min(SLOT_COUNT - 1, Math.floor(index)))

  slots[safeIndex] = emptySave(safeIndex)

  if (safeIndex === activeSlot) {
    Object.assign(progress, emptySave(activeSlot))
  }

  writeSlots(slots)
}

export const SAVE_HINT = '↑ ↓ 选择 · 空格 确认 · Delete 删除 · Esc 返回'
