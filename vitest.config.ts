import { configDefaults, defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  test: {
    // 默认用 node，只有真正需要 DOM 的测试再切到 jsdom。
    environment: 'node',
    environmentMatchGlobs: [['frontend/hooks/**', 'jsdom']],
    globals: true,
    setupFiles: ['./frontend/test/setup.ts'],
    exclude: [
      ...configDefaults.exclude,
      'frontend/test/*.integration.test.ts',
      'backend/test/**',
      'tests/**',
    ],
    pool: 'threads',
    fileParallelism: false,
    maxWorkers: 1,
    minWorkers: 1,
    // 设置环境变量
    env: {
      VITE_API_BASE_URL: process.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1',
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './frontend'),
    },
  },
  define: {
    // 在测试环境中设置 API 地址
    'import.meta.env.VITE_API_BASE_URL': JSON.stringify(
      process.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1'
    ),
  },
})
