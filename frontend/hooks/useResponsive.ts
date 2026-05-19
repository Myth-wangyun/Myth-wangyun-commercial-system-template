import { useState, useEffect } from 'react'
import { breakpoints } from '../styles/responsive'

interface ResponsiveState {
  isMobile: boolean
  isTablet: boolean
  isDesktop: boolean
  isXs: boolean
  isSm: boolean
  isMd: boolean
  isLg: boolean
  isXl: boolean
  isXxl: boolean
  width: number
  height: number
}

export const useResponsive = (): ResponsiveState => {
  const [state, setState] = useState<ResponsiveState>({
    isMobile: false,
    isTablet: false,
    isDesktop: false,
    isXs: false,
    isSm: false,
    isMd: false,
    isLg: false,
    isXl: false,
    isXxl: false,
    width: 0,
    height: 0,
  })

  useEffect(() => {
    const updateResponsive = () => {
      const width = window.innerWidth
      const height = window.innerHeight

      setState({
        isMobile: width < breakpoints.md,
        isTablet: width >= breakpoints.md && width < breakpoints.lg,
        isDesktop: width >= breakpoints.lg,
        isXs: width < breakpoints.xs,
        isSm: width >= breakpoints.sm && width < breakpoints.md,
        isMd: width >= breakpoints.md && width < breakpoints.lg,
        isLg: width >= breakpoints.lg && width < breakpoints.xl,
        isXl: width >= breakpoints.xl && width < breakpoints.xxl,
        isXxl: width >= breakpoints.xxl,
        width,
        height,
      })
    }

    // 初始化
    updateResponsive()

    // 监听窗口大小变化
    window.addEventListener('resize', updateResponsive)

    return () => {
      window.removeEventListener('resize', updateResponsive)
    }
  }, [])

  return state
}
