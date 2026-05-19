/**
 * 移动端自动跳转组件
 *
 * 放在桌面端 MainLayout 的外层：
 * 当检测到移动设备 UA / 窄屏时，自动 redirect 到 /m 路径。
 * 同理在移动端 Layout 外层，如果检测到桌面端就跳回桌面。
 */
import React from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useIsMobile } from '@/hooks/useIsMobile'

/**
 * 桌面端路由映射到移动端路由
 */
const DESKTOP_TO_MOBILE: Record<string, string> = {
  '/': '/m',
  // 咨询量录入系统
  '/consult/type-count-system': '/m/consult',
  // 数据统计
  '/campus/core-data-summary': '/m/stats',
  '/campus/core-data': '/m/stats',
  // 人员管理
  '/system/permission-management': '/m/staff',
  '/human-resources': '/m/staff',
}

/**
 * 移动端路由映射回桌面端路由
 */
const MOBILE_TO_DESKTOP: Record<string, string> = {
  '/m': '/',
  '/m/consult': '/consult/type-count-system',
  '/m/consult/list': '/consult/type-count-system',
  '/m/stats': '/campus/core-data-summary',
  '/m/staff': '/system/permission-management',
  '/m/notifications': '/',
  '/m/approvals': '/',
  '/m/me': '/',
}

/**
 * 包裹桌面端 Layout：若为移动端则跳转到 /m 路径
 */
export const DesktopGuard: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const isMobile = useIsMobile()
  const location = useLocation()

  if (isMobile) {
    // 查找精确匹配
    const mobilePath = DESKTOP_TO_MOBILE[location.pathname]
    if (mobilePath) {
      return <Navigate to={mobilePath} replace />
    }
    // 默认跳转到移动端首页
    return <Navigate to="/m" replace />
  }

  return <>{children}</>
}

/**
 * 包裹移动端 Layout：若为桌面端则跳转回桌面路径
 */
export const MobileGuard: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const isMobile = useIsMobile()
  const location = useLocation()

  if (!isMobile) {
    const desktopPath = MOBILE_TO_DESKTOP[location.pathname]
    if (desktopPath) {
      return <Navigate to={desktopPath} replace />
    }
    return <Navigate to="/" replace />
  }

  return <>{children}</>
}
