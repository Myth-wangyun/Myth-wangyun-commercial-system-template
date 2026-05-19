/**
 * lazyWithRetry — 带自动刷新的 React.lazy 包装器（生产环境部署适配）
 *
 * 问题场景（生产环境）：
 *   部署新版本后，dist 目录中的旧 chunk 文件（带 hash）被新文件替换。
 *   但用户浏览器中仍然运行着旧的 index.html，其中引用的 import() URL 指向
 *   已不存在的旧 chunk 文件。此时用户点击菜单触发懒加载，nginx 对 .js 文件
 *   返回 404，React Router 的 errorElement 渲染出错误页面。
 *
 * 解决方式：
 *   1. 动态 import 失败后，直接 reload 整个页面（不做无意义的重试，因为旧 hash
 *      的 chunk 文件已经不存在，重试同样的 URL 必然还是 404）。
 *   2. reload 会让浏览器重新获取最新 index.html（nginx 已配置 no-cache），
 *      新的 index.html 引用最新 chunk hash，问题自动解决。
 *   3. 为了避免"无限刷新"，使用 sessionStorage 记录上次刷新时间戳，
 *      15 秒内不会重复刷新，改为展示 AppRouteError 让用户手动操作。
 */
import { lazy, type ComponentType } from 'react'

type LazyFactory<T extends ComponentType> = () => Promise<{ default: T }>

const RELOAD_KEY = 'lazy_chunk_reload_ts'

/**
 * 替代 React.lazy，chunk 加载失败时自动刷新页面获取最新版本
 *
 * @param factory  动态 import 工厂，例如 () => import('./MyPage')
 */
export function lazyWithRetry<T extends ComponentType>(
  factory: LazyFactory<T>,
) {
  return lazy<T>(() =>
    factory().catch((error: Error) => {
      // 判断是否为 chunk 加载失败（而非模块内部语法错误等）
      const isChunkError =
        error.message?.includes('Failed to fetch dynamically imported module') ||
        error.message?.includes('Loading chunk') ||
        error.message?.includes('Loading CSS chunk') ||
        error.message?.includes('error loading dynamically imported module') ||
        error.message?.includes('Importing a module script failed') ||
        // Vite 特有的错误消息
        error.name === 'TypeError'

      if (!isChunkError) {
        // 非 chunk 加载错误（如模块内部语法错误），直接抛出
        throw error
      }

      // chunk 加载失败 —— 尝试自动刷新页面
      const lastReload = sessionStorage.getItem(RELOAD_KEY)
      const now = Date.now()

      if (!lastReload || now - parseInt(lastReload, 10) > 15_000) {
        // 距上次刷新超过 15 秒，允许刷新
        console.warn('[lazyWithRetry] chunk 加载失败，自动刷新页面获取最新版本...', error.message)
        sessionStorage.setItem(RELOAD_KEY, String(now))
        window.location.reload()
        // 返回一个永远不会 resolve 的 promise，防止在 reload 过程中渲染旧内容
        return new Promise<{ default: T }>(() => {})
      }

      // 15 秒内已经刷新过 —— 放弃自动刷新，交给 AppRouteError 展示
      console.error('[lazyWithRetry] 自动刷新后仍然失败，请检查网络或手动清除缓存', error)
      throw error
    }),
  )
}
