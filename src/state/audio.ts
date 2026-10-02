import Phaser from 'phaser'

const MUTE_KEY = 'slime-teyvat-muted'

// 音量分三层（用户定的）：背景乐 ≤ 移动类 < 原石/通关
// 背景乐 0.1，行走 0.16、跳跃 0.16、落地 0.15、飞行 0.12、缓降 0.10，
// 原石 0.5、通关 0.55。具体数值写在各自的 playSfx / setLoop 调用处。
const MUSIC_VOLUME = 0.1

export const audio = {
  muted: false,
}

try {
  audio.muted = localStorage.getItem(MUTE_KEY) === '1'
} catch {
  audio.muted = false
}

// 正在播的循环音（飞行、缓降），key -> 实例
const loops = new Map<string, Phaser.Sound.BaseSound>()

// 背景音乐的状态
let musicScene: Phaser.Scene | null = null
let musicKey: string | null = null
let musicSound: Phaser.Sound.BaseSound | null = null

// 静音开关，返回切换后的状态
export function toggleMute() {
  audio.muted = !audio.muted

  try {
    localStorage.setItem(MUTE_KEY, audio.muted ? '1' : '0')
  } catch {
    // 存不进去就算了
  }

  if (audio.muted) {
    stopAllLoops()
    stopMusic()
  } else if (musicScene && musicKey) {
    // 取消静音时，把原本该放的那首接着放上
    const key = musicKey

    musicSound = null
    musicKey = null
    playMusic(musicScene, key)
  }

  return audio.muted
}

// 一次性音效
export function playSfx(scene: Phaser.Scene, key: string, volume = 0.5, rate = 1) {
  if (audio.muted) {
    return
  }

  // 文件没加载到（比如单文件版还没内嵌音效）就安静跳过，不要报错
  if (!scene.cache.audio.exists(key)) {
    return
  }

  scene.sound.play(key, { volume, rate })
}

// 循环音：on 为真就播（已经在播就不动），为假就停
export function setLoop(scene: Phaser.Scene, key: string, on: boolean, volume = 0.3) {
  const current = loops.get(key)

  if (!on) {
    if (current) {
      current.stop()
      current.destroy()
      loops.delete(key)
    }

    return
  }

  if (current && current.isPlaying) {
    return
  }

  if (audio.muted || !scene.cache.audio.exists(key)) {
    return
  }

  const sound = scene.sound.add(key, { loop: true, volume })

  sound.play()
  loops.set(key, sound)
}

// 暂停、死亡、切场景时记得把循环音掐掉，不然会一直在响
export function stopAllLoops() {
  loops.forEach((sound) => {
    sound.stop()
    sound.destroy()
  })

  loops.clear()
}

// 切背景音乐：同一首就让它继续放（菜单之间来回切不会重头开始）
export function playMusic(scene: Phaser.Scene, key: string, volume = MUSIC_VOLUME) {
  musicScene = scene

  if (musicKey === key && musicSound && musicSound.isPlaying) {
    return
  }

  stopMusic()

  if (audio.muted) {
    // 静音时只记着该放哪一首，取消静音时再补上
    musicKey = key
    return
  }

  if (!scene.cache.audio.exists(key)) {
    return
  }

  const sound = scene.sound.add(key, { loop: true, volume })

  sound.play()
  musicKey = key
  musicSound = sound
}

export function stopMusic() {
  if (!musicSound) {
    return
  }

  musicSound.stop()
  musicSound.destroy()

  musicSound = null
  musicKey = null
}
