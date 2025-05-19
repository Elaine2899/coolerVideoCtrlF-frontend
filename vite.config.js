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
    }
  },

  // 建置配置
  build: {
    rollupOptions: {
      external: [],  // 空陣列表示不排除任何相依套件
    }
  }
})
