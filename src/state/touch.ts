// 触屏相关的小工具：判断是不是触屏操作、把提示里的按键说法换成手指说法。
// 判定方式：真触摸设备，或者地址里带了 ?touch=1（方便在没有触摸的电脑上试）

export function touchMode() {
  if (typeof navigator === 'undefined' || typeof window === 'undefined') {
    return false
  }

  return (
    new URLSearchParams(window.location.search).get('touch') === '1' ||
    navigator.maxTouchPoints > 0 ||
    'ontouchstart' in window
  )
}

// 关卡提示、交互提示里凡是键盘按键的字样，触屏下都直接删掉——
// 只留「是什么东西 / 什么动作」，玩家自己会去点。
// 例：「按 F 读一读残卷」→「读一读残卷」，「[F] 打开」→「打开」
export function touchText(text: string) {
  if (!touchMode()) {
    return text
  }

  return text
    .replace(/长按空格/g, '按住')
    .replace(/松开空格/g, '松开')
    .replace(/按空格/g, '')
    .replace(/按 X /g, '')
    .replace(/按 C /g, '')
    .replace(/按 F /g, '')
    .replace(/\[F\] /g, '')
    .replace(/← → /g, '左右')
    .trim()
}
