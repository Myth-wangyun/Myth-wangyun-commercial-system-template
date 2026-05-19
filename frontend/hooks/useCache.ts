import { useState, useCallback, useRef } from 'react'

interface CacheOptions {
  ttl?: number // 缓存时间（毫秒）
  maxSize?: number // 最大缓存数量
}

export const useCache = <T>(options: CacheOptions = {}) => {
  const { ttl = 5 * 60 * 1000, maxSize = 100 } = options // 默认5分钟，最大100个
  const cacheRef = useRef<Map<string, { data: T; timestamp: number }>>(new Map())
  const [, forceUpdate] = useState({})

  const get = useCallback(
    (key: string): T | null => {
      const cached = cacheRef.current.get(key)
      if (!cached) return null

      // 检查是否过期
      if (Date.now() - cached.timestamp > ttl) {
        cacheRef.current.delete(key)
        return null
      }

      return cached.data
    },
    [ttl],
  )

  const set = useCallback(
    (key: string, data: T): void => {
      // 如果缓存已满，删除最旧的项
      if (cacheRef.current.size >= maxSize) {
        const firstKey = cacheRef.current.keys().next().value
        if (firstKey) {
          cacheRef.current.delete(firstKey)
        }
      }

      cacheRef.current.set(key, {
        data,
        timestamp: Date.now(),
      })

      forceUpdate({})
    },
    [maxSize],
  )

  const remove = useCallback((key: string): void => {
    cacheRef.current.delete(key)
    forceUpdate({})
  }, [])

  const clear = useCallback((): void => {
    cacheRef.current.clear()
    forceUpdate({})
  }, [])

  const has = useCallback(
    (key: string): boolean => {
      const cached = cacheRef.current.get(key)
      if (!cached) return false

      // 检查是否过期
      if (Date.now() - cached.timestamp > ttl) {
        cacheRef.current.delete(key)
        return false
      }

      return true
    },
    [ttl],
  )

  const size = cacheRef.current.size

  return {
    get,
    set,
    remove,
    clear,
    has,
    size,
  }
}
