import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  // 配置 GitHub Pages 的 base 路径
  base: '/PNGcut/',
  // 开发时固定监听本机 IPv4，减少「localhost 无法访问」的解析问题
  server: {
    host: '127.0.0.1',
    port: 5173,
    // 避免静默改端口导致仍访问 5173 却打不开
    strictPort: true,
  },
})

