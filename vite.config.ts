import { defineConfig } from 'vite'

export default defineConfig({
  base: './',
  server: {
    // 手机测试要用：绑到局域网网卡上。
    // 不写这一行时 vite 只监听 localhost，手机会连不上（终端里会写 "use --host to expose"）
    host: true,
    // 不要自动弹浏览器窗口：原来这里是 true，每次启动 dev server 都会新开一个窗口
    //（我为了验证会反复启动，所以看着像"每次都开新窗口"）。想让它自己开就改回 true
    open: false,
  },
})
