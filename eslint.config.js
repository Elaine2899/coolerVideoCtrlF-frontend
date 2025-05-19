// 引入必要的 ESLint 配置工具
import { defineConfig } from 'eslint/config'
import js from '@eslint/js'
import pluginVue from 'eslint-plugin-vue'
import skipFormatting from '@vue/eslint-config-prettier/skip-formatting'

// ESLint 主要配置
export default defineConfig([
  // 設定需要檢查的文件類型
  {
    files: ['**/*.{js,vue}'],
  },

  // 忽略打包後的文件
  { ignores: ['dist/**'] },

  // 使用推薦的 JavaScript 和 Vue 規則
  js.configs.recommended,
  ...pluginVue.configs['flat/essential'],
  skipFormatting,
])
