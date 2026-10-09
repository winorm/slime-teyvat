import { defineConfig } from 'vite'

export default defineConfig({
  base: './',
  server: {
    // 手机测试要用：绑到局域网网卡上。
    // 不写这一行时 vite 只监听 localhost，手机会连不上（终端里会写 "use --host to expose"）
    host: true,
    open: true,
  },
})
