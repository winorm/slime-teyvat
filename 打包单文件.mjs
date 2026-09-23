// 把 dist 文件夹里的整个游戏，压进一个单独的 HTML 文件。
// 用法：先 npm run build，再 node 打包单文件.mjs
// 生成 game.html，直接发给朋友、双击就能玩。

import { readFileSync, writeFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'

const distDir = 'dist'
const outputFile = 'game.html'

let html = readFileSync(join(distDir, 'index.html'), 'utf8')

const assetsDir = join(distDir, 'assets')
const jsFiles = readdirSync(assetsDir).filter((name) => name.endsWith('.js'))

for (const jsFile of jsFiles) {
  const code = readFileSync(join(assetsDir, jsFile), 'utf8')
  const tagPattern = new RegExp(`<script[^>]*src="[^"]*${jsFile}"[^>]*></script>`)

  html = html.replace(tagPattern, `<script type="module">\n${code}\n</script>`)
}

writeFileSync(outputFile, html, 'utf8')

console.log('已生成 ' + outputFile)
