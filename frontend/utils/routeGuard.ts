/**
 * 路由守卫
 * 用于在路由跳转前检查权限
 */

import { hasPermission, hasAnyRole } from '@/utils/permission'

/**
 * 用户权限信息接口
 */
export interface UserPermissions {
  permissions: string[]
  roles: string[]
}

/**
 * 路由元信息接口
 */
export interface RouteMeta {
  title?: string
  requiresAuth?: boolean
  permission?: string
  roles?: string[]
}

/**
 * 检查路由权限
 * @param meta 路由元信息
 * @param userPermissions 用户权限信息
 * @returns 是否有权限访问
 */
export function checkRoutePermission(
  meta: RouteMeta,
  userPermissions: UserPermissions
): { allowed: boolean; reason?: string } {
  // 不需要认证的路由直接放行
  if (!meta.requiresAuth) {
    return { allowed: true }
  }

  // 检查是否需要特定权限
  if (meta.permission) {
    if (!hasPermission(userPermissions.permissions, meta.permission)) {
      return {
        allowed: false,
        reason: `需要权限：${meta.permission}`,
      }
    }
  }

  // 检查是否需要特定角色
  if (meta.roles && meta.roles.length > 0) {
    if (!hasAnyRole(userPermissions.roles, ...meta.roles)) {
      return {
        allowed: false,
        reason: `需要以下任一角色：${meta.roles.join(', ')}`,
      }
    }
  }

  return { allowed: true }
}

/**
 * 路由守卫函数
 * 可以在 router 配置中使用
 */
export function createRouteGuard(getUserPermissions: () => UserPermissions | null) {
  return (to: { meta?: RouteMeta }) => {
    const meta = to.meta || {}

    // 不需要认证的路由直接放行
    if (!meta.requiresAuth) {
      return true
    }

    // 获取用户权限
    const userPermissions = getUserPermissions()
    if (!userPermissions) {
      // 未登录，跳转到登录页
      return {
        path: '/login',
        query: { redirect: window.location.pathname },
      }
    }

    // 检查权限
    const { allowed, reason } = checkRoutePermission(meta, userPermissions)

    if (!allowed) {
      console.warn('路由权限检查失败:', reason)
      // 权限不足，跳转到403页面
      return {
        path: '/403',
        state: { reason },
      }
    }

    return true
  }
}
