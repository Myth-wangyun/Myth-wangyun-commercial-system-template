import { useState, useEffect, useRef, useCallback } from 'react'

interface VirtualScrollOptions {
  itemHeight: number
  containerHeight: number
  overscan?: number
}

interface VirtualScrollState {
  startIndex: number
  endIndex: number
  totalHeight: number
  offsetY: number
}

export const useVirtualScroll = (
  totalItems: number,
  options: VirtualScrollOptions,
): VirtualScrollState => {
  const { itemHeight, containerHeight, overscan = 5 } = options
  const [scrollTop, setScrollTop] = useState(0)
  const containerRef = useRef<HTMLDivElement>(null)

  const handleScroll = useCallback((e: Event) => {
    const target = e.target as HTMLDivElement
    setScrollTop(target.scrollTop)
  }, [])

  useEffect(() => {
    const container = containerRef.current
    if (container) {
      container.addEventListener('scroll', handleScroll)
      return () => container.removeEventListener('scroll', handleScroll)
    }
  }, [handleScroll])

  const visibleItemsCount = Math.ceil(containerHeight / itemHeight)
  const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan)
  const endIndex = Math.min(totalItems - 1, startIndex + visibleItemsCount + overscan * 2)

  const totalHeight = totalItems * itemHeight
  const offsetY = startIndex * itemHeight

  return {
    startIndex,
    endIndex,
    totalHeight,
    offsetY,
  }
}
