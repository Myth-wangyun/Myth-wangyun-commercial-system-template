/**
 * 权限守卫组件
 * 检查用户是否有权限访问当前路由
 */
import React from 'react'
import { Navigate } from 'react-router-dom'
import { Result, Button } from 'antd'
import { useAuthStore } from '@/stores/authStore'
import { hasPermission } from '@/utils/permission'

interface PermissionGuardProps {
  /** 所需权限代码 */
  permission: string
  /** 路由 key（用于配置驱动权限放行） */
  routeKey?: string
  /** 子组件 */
  children: React.ReactNode
}

/**
 * 权限守卫
 * 用于保护需要特定权限才能访问的路由
 */
const PermissionGuard: React.FC<PermissionGuardProps> = ({ permission, routeKey, children }) => {
  const { user, permissions } = useAuthStore()

  // 如果用户未登录，重定向到登录页
  if (!user) {
    return <Navigate to="/login" replace />
  }

  // 检查权限（超级用户自动拥有所有权限）
  const allowed =
    user.is_superuser ||
    hasPermission(permissions || [], permission) ||
    (routeKey ? (permissions || []).includes(routeKey) : false)

  // 如果没有权限，显示无权限页面
  if (!allowed) {
    return (
      <Result
        status="403"
        title="403"
        subTitle="抱歉，您没有权限访问此页面"
        extra={
          <Button type="primary" onClick={() => window.history.back()}>
            返回
          </Button>
        }
      />
    )
  }

  // 有权限，渲染子组件
  return <>{children}</>
}

export default PermissionGuard
