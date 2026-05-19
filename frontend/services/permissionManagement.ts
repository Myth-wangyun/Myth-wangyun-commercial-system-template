/**
 * 权限划分管理 - 前端服务层
 */
import { api } from './api'

const BASE = '/permission-management'

// ==================== Types ====================

export interface PermissionNode {
  key: string
  title: string
  children?: PermissionNode[]
}

export interface UserWithPermissions {
  user_id: number
  username: string
  real_name: string
  department: string | null
  position: string | null
  campus: string | null
  status: string | null
  permissions: string[]
}

export interface FilterOptions {
  campuses: string[]
  departments: string[]
  positions: string[]
}

export interface BatchSetRequest {
  user_ids: number[]
  permissions: string[]
}

// ==================== API Calls ====================

/** 获取权限树 */
export async function fetchPermissionTree(): Promise<PermissionNode[]> {
  const res = await api.get(`${BASE}/permission-tree`)
  return res.data
}

/** 获取筛选选项（神殿/部门/岗位） */
export async function fetchFilterOptions(): Promise<FilterOptions> {
  const res = await api.get(`${BASE}/filter-options`)
  return res.data
}

/** 获取用户列表（含权限） */
export async function fetchUsersWithPermissions(params?: {
  campus?: string
  department?: string
  position?: string
  name?: string
}): Promise<UserWithPermissions[]> {
  const res = await api.get(`${BASE}/users`, { params })
  return res.data
}

/** 获取单个用户权限 */
export async function fetchUserPermissions(userId: number): Promise<string[]> {
  const res = await api.get(`${BASE}/users/${userId}/permissions`)
  return res.data
}

/** 设置单个用户权限（全量覆盖） */
export async function setUserPermissions(userId: number, permissions: string[]): Promise<void> {
  await api.put(`${BASE}/users/${userId}/permissions`, { user_id: userId, permissions })
}

/** 批量设置权限（全量覆盖） */
export async function batchSetPermissions(userIds: number[], permissions: string[]): Promise<void> {
  await api.post(`${BASE}/batch-set-permissions`, { user_ids: userIds, permissions })
}

/** 批量追加权限 */
export async function batchAddPermissions(userIds: number[], permissions: string[]): Promise<void> {
  await api.post(`${BASE}/batch-add-permissions`, { user_ids: userIds, permissions })
}

/** 批量移除权限 */
export async function batchRemovePermissions(
  userIds: number[],
  permissions: string[],
): Promise<void> {
  await api.post(`${BASE}/batch-remove-permissions`, { user_ids: userIds, permissions })
}
