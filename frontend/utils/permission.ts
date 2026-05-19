/**
 * 权限管理工具函数
 * 用于前端权限检查和控制
 */

/**
 * 检查用户是否拥有指定权限
 * @param userPermissions 用户权限集合
 * @param requiredPermission 需要的权限代码
 * @returns 是否拥有权限
 */
export function hasPermission(
  userPermissions: string[],
  requiredPermission: string
): boolean {
  if (!userPermissions || userPermissions.length === 0) {
    return false;
  }

  // 超级用户权限（通配符）
  if (userPermissions.includes('*')) {
    return true;
  }

  // 完全匹配
  if (userPermissions.includes(requiredPermission)) {
    return true;
  }

  // 通配符匹配，如：academic.* 可以匹配 academic.enterprise_culture.view
  const parts = requiredPermission.split('.');
  for (let i = 0; i < parts.length; i++) {
    const wildcard = parts.slice(0, i + 1).join('.') + '.*';
    if (userPermissions.includes(wildcard)) {
      return true;
    }
  }

  return false;
}

/**
 * 检查用户是否拥有任一指定权限
 * @param userPermissions 用户权限集合
 * @param requiredPermissions 需要的权限代码列表
 * @returns 是否拥有任一权限
 */
export function hasAnyPermission(
  userPermissions: string[],
  ...requiredPermissions: string[]
): boolean {
  return requiredPermissions.some(perm => hasPermission(userPermissions, perm));
}

/**
 * 检查用户是否拥有所有指定权限
 * @param userPermissions 用户权限集合
 * @param requiredPermissions 需要的权限代码列表
 * @returns 是否拥有所有权限
 */
export function hasAllPermissions(
  userPermissions: string[],
  ...requiredPermissions: string[]
): boolean {
  return requiredPermissions.every(perm => hasPermission(userPermissions, perm));
}

/**
 * 检查用户是否拥有指定角色
 * @param userRoles 用户角色集合
 * @param requiredRole 需要的角色代码
 * @returns 是否拥有角色
 */
export function hasRole(userRoles: string[], requiredRole: string): boolean {
  if (!userRoles || userRoles.length === 0) {
    return false;
  }
  return userRoles.includes(requiredRole);
}

/**
 * 检查用户是否拥有任一指定角色
 * @param userRoles 用户角色集合
 * @param requiredRoles 需要的角色代码列表
 * @returns 是否拥有任一角色
 */
export function hasAnyRole(
  userRoles: string[],
  ...requiredRoles: string[]
): boolean {
  return requiredRoles.some(role => hasRole(userRoles, role));
}

/**
 * 权限代码常量
 * 便于在代码中引用和避免拼写错误
 */
export const PermissionCodes = {
  // 智慧司 - 企业文化
  ACADEMIC: {
    ENTERPRISE_CULTURE: {
      PRESENTATION: {
        VIEW: 'academic.enterprise_culture.presentation.view',
        EDIT: 'academic.enterprise_culture.presentation.edit',
        DELETE: 'academic.enterprise_culture.presentation.delete',
        EXPORT: 'academic.enterprise_culture.presentation.export',
      },
      EXAM: {
        VIEW: 'academic.enterprise_culture.exam.view',
        EDIT: 'academic.enterprise_culture.exam.edit',
        DELETE: 'academic.enterprise_culture.exam.delete',
        EXPORT: 'academic.enterprise_culture.exam.export',
      },
    },
    // 通配符：可以访问智慧司所有资源
    ALL: 'academic.*',
  },
  // 最高议事厅
  MANAGEMENT: {
    ALL: 'management.*',
  },
  // 教学质量
  TEACHING_QUALITY: {
    ALL: 'teaching_quality.*',
  },
  // 祈福司
  CONSULTING: {
    ALL: 'consulting.*',
  },
  // 市场部
  MARKETING: {
    ALL: 'marketing.*',
  },
  // 人力资源
  HR: {
    ALL: 'hr.*',
  },
  // 超级用户
  SUPER: '*',
} as const;

/**
 * 角色代码常量
 */
export const RoleCodes = {
  CHAIRMAN: 'chairman',              // 董事长
  ACADEMIC_DIRECTOR: 'academic_director', // 学术总监
  TEACHING_DIRECTOR: 'teaching_director', // 教质总监
  CONSULTING_DIRECTOR: 'consulting_director', // 咨询总监
  MARKETING_DIRECTOR: 'marketing_director', // 市场总监
  HR_DIRECTOR: 'hr_director',        // 人资总监
  MANAGER: 'manager',                // 部门经理
  STAFF: 'staff',                    // 普通员工
} as const;
