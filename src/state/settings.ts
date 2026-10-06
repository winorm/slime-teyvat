// 跟设备有关的全局设置（不跟存档走）：目前只有「移动方式」。
// 存档是每个槽一份，这种偏好是每台设备一份，所以单独存一个 key。

const KEY = 'slime-teyvat-settings'

// buttons = 左下角左右两个箭头键；stick = 浮动摇杆
export type MoveMode = 'buttons' | 'stick'

type Settings = {
  moveMode: MoveMode
}

const defaults: Settings = { moveMode: 'buttons' }

function read(): Settings {
  const result: Settings = { ...defaults }

  try {
    const text = localStorage.getItem(KEY)

    if (text) {
      const raw = JSON.parse(text) as Partial<Settings>

      if (raw.moveMode === 'stick' || raw.moveMode === 'buttons') {
        result.moveMode = raw.moveMode
      }
    }
  } catch {
    // 隐私模式、存的东西坏了：退回默认值，绝不让设置把游戏搞崩
  }

  // 网址上带 ?move=stick / ?move=buttons 可以临时覆盖，方便试手感
  try {
    const forced = new URLSearchParams(location.search).get('move')

    if (forced === 'stick' || forced === 'buttons') {
      result.moveMode = forced
    }
  } catch {
    // 拿不到网址就算了
  }

  return result
}

const settings = read()

export function getMoveMode(): MoveMode {
  return settings.moveMode
}

export function setMoveMode(mode: MoveMode) {
  settings.moveMode = mode

  try {
    localStorage.setItem(KEY, JSON.stringify(settings))
  } catch {
    // 存不下就只在这次会话里生效
  }
}

export function toggleMoveMode(): MoveMode {
  setMoveMode(settings.moveMode === 'stick' ? 'buttons' : 'stick')

  return settings.moveMode
}
