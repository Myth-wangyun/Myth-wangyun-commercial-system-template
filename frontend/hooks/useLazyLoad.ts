import { useState, useEffect, useRef, useCallback } from 'react'

interface LazyLoadOptions {
  rootMargin?: string
  threshold?: number
  triggerOnce?: boolean
}

export const useLazyLoad = (options: LazyLoadOptions = {}) => {
  const { rootMargin = '50px', threshold = 0.1, triggerOnce = true } = options

  const [isIntersecting, setIsIntersecting] = useState(false)
  const [hasIntersected, setHasIntersected] = useState(false)
  const elementRef = useRef<HTMLElement>(null)

  const handleIntersection = useCallback(
    (entries: IntersectionObserverEntry[]) => {
      const [entry] = entries
      const isVisible = entry.isIntersecting

      setIsIntersecting(isVisible)

      if (isVisible && !hasIntersected) {
        setHasIntersected(true)
      }
    },
    [hasIntersected],
  )

  useEffect(() => {
    const element = elementRef.current
    if (!element) return

    const observer = new IntersectionObserver(handleIntersection, {
      rootMargin,
      threshold,
    })

    observer.observe(element)

    return () => {
      observer.unobserve(element)
    }
  }, [handleIntersection, rootMargin, threshold])

  const shouldLoad = triggerOnce ? hasIntersected : isIntersecting

  return {
    elementRef,
    isIntersecting,
    hasIntersected,
    shouldLoad,
  }
}
