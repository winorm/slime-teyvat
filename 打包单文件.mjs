// 把 dist 文件夹里的整个游戏，压进一个单独的 HTML 文件。
// 用法：先 npm run build，再 node 打包单文件.mjs
// 生成 game.html，直接发给朋友、双击就能玩。
// 音效和 BGM 会一起转成 base64 的 data URI 塞进去，所以单文件版也有声音
// （代价是体积从 1.4MB 涨到 3.5MB 左右）。

import { readFileSync, writeFileSync, readdirSync, existsSync } from 'node:fs'
import { join, extname } from 'node:path'

const distDir = 'dist'
const outputFile = 'game.html'

const AUDIO_DIRS = ['sfx', 'bgm']
const MIME = {
  '.ogg': 'audio/ogg',
  '.wav': 'audio/wav',
  '.mp3': 'audio/mpeg',
}

let html = readFileSync(join(distDir, 'index.html'), 'utf8')

const assetsDir = join(distDir, 'assets')
const jsFiles = readdirSync(assetsDir).filter((name) => name.endsWith('.js'))

for (const jsFile of jsFiles) {
  const code = readFileSync(join(assetsDir, jsFile), 'utf8')
  const tagPattern = new RegExp(`<script[^>]*src="[^"]*${jsFile}"[^>]*></script>`)

  html = html.replace(tagPattern, `<script type="module">\n${code}\n</script>`)
}

// 音频内联：代码里写的是 "sfx/jump.ogg" 这种相对路径，直接换成 data URI。
// 不做这一步的话，单文件版双击打开是没声音的（音频还留在 dist 里）
let inlined = 0

for (const dir of AUDIO_DIRS) {
  const full = join(distDir, dir)

  if (!existsSync(full)) {
    continue
  }

  for (const name of readdirSync(full)) {
    const mime = MIME[extname(name).toLowerCase()]

    if (!mime) {
      continue
    }

    const path = dir + '/' + name

    if (!html.includes(path)) {
      continue
    }

    const uri = 'data:' + mime + ';base64,' + readFileSync(join(full, name)).toString('base64')

    html = html.split(path).join(uri)
    inlined += 1
  }
}

writeFileSync(outputFile, html, 'utf8')

console.log('已生成 ' + outputFile + '（内联音频 ' + inlined + ' 个）')
