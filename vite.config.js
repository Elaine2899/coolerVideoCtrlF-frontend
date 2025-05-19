// 引入 Node.js 的 URL 模組，用於解析文件路徑
import { fileURLToPath, URL } from 'node:url'

// 引入 Vite 的配置函數
import { defineConfig } from 'vite'
// 引入 Vue 插件，提供 Vue 單文件組件支援
import vue from '@vitejs/plugin-vue'
// 引入 Vue DevTools 插件，提供開發調試工具
import vueDevTools from 'vite-plugin-vue-devtools'

// https://vite.dev/config/
// Vite 配置
export default defineConfig({
  // 配置 Vite 插件
  plugins: [
    vue(),          // 啟用 Vue 支援
    vueDevTools(),  // 啟用 Vue DevTools
  ],
  
  // 配置模組解析
  resolve: {
    alias: {
      // 設定 @ 符號指向 src 目錄，方便引入模組
      '@': fileURLToPath(new URL('./src', import.meta.url))
    },
  },

  // 開發服務器配置
  server: {
    proxy: {
      // 配置 API 請求代理
      '/api': {
        target: process.env.VITE_API_URL,    // API 目標地址，從環境變數讀取
        changeOrigin: true,                  // 支援跨域請求
        rewrite: (path) => path.replace(/^\/api/, '')  // 重寫 API 路徑
      }
    }
  }
})
