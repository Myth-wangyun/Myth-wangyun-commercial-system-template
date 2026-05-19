import { useRef, useCallback } from 'react'

export const useThrottle = <T extends (...args: unknown[]) => unknown>(func: T, delay: number): T => {
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const lastExecTime = useRef<number>(0)

  return useCallback(
    ((...args: Parameters<T>) => {
      const now = Date.now()

      if (now - lastExecTime.current >= delay) {
        lastExecTime.current = now
        return func(...args)
      } else {
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current)
        }
        timeoutRef.current = setTimeout(
          () => {
            lastExecTime.current = Date.now()
            func(...args)
          },
          delay - (now - lastExecTime.current),
        )
      }
    }) as T,
    [func, delay],
  )
}
