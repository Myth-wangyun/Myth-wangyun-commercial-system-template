/**
 * Vitest 测试环境设置文件
 * 
 * 这个文件会在每个测试文件运行前执行
 * 用于设置测试环境，mock 全局依赖等
 */

/**
 * Vitest 测试环境设置文件
 * 
 * 这个文件会在每个测试文件运行前执行
 * 用于设置测试环境，mock 全局依赖等
 */

import { vi } from 'vitest'

// Mock antd 的 message 组件，避免在测试环境中需要 DOM
// 这样即使没有 DOM 环境，也不会报错
vi.mock('antd', async () => {
  const actual = await vi.importActual('antd')
  return {
    ...actual,
    message: {
      success: vi.fn(),
      error: vi.fn(),
      warning: vi.fn(),
      info: vi.fn(),
      loading: vi.fn(),
    },
  }
})

