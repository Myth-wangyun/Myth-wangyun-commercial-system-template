/**
 * 移动端检测 Hook
 * 根据 UA + 屏幕宽度自动判断是否为手机端
 */
import { useState, useEffect } from 'react'

const MOBILE_BREAKPOINT = 768

/** 通过 User-Agent 判断是否为移动设备 */
function checkUA(): boolean {
  if (typeof navigator === 'undefined') return false
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini|Mobile|mobile/i.test(
    navigator.userAgent,
  )
}

/** 通过屏幕宽度判断 */
function checkWidth(): boolean {
  if (typeof window === 'undefined') return false
  return window.innerWidth <= MOBILE_BREAKPOINT
}

/**
 * 综合判断当前是否为移动端
 * - UA 命中移动设备 → true
 * - 屏幕宽度 ≤ 768px → true
 * - 否则 → false
 *
 * 会监听 resize 事件实时更新
 */
export function useIsMobile(): boolean {
  const [isMobile, setIsMobile] = useState(() => checkUA() || checkWidth())

  useEffect(() => {
    const handler = () => {
      setIsMobile(checkUA() || checkWidth())
    }
    window.addEventListener('resize', handler)
    return () => window.removeEventListener('resize', handler)
  }, [])

  return isMobile
}

/** 静态函数，可在非组件上下文中使用 */
export function isMobileDevice(): boolean {
  return checkUA() || checkWidth()
}

export default useIsMobile
