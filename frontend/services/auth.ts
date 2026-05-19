// [通用模块] 认证服务 - 公共模块，供所有模块使用
import api from './api'

export interface BackendUser {
  user_id: number
  username: string
  real_name: string
  email?: string
  phone?: string
  department?: string
  position?: string
  campus?: string
  campus_access_list?: string[]
  role: string
  status: string
  is_superuser: boolean
  created_at?: string | null
  updated_at?: string | null
  last_login?: string | null
  gender?: string | null
  entry_date?: string | null
  notes?: string | null
}

export interface LoginSuccessResponse {
  access_token: string
  token_type: string
  expires_in: number
  user: BackendUser
}

export interface TokenRefreshResponse {
  access_token: string
  token_type: string
  expires_in: number
}

const toFormData = (data: Record<string, string>): URLSearchParams => {
  const formData = new URLSearchParams()
  Object.entries(data).forEach(([key, value]) => formData.append(key, value))
  return formData
}

export interface ChangePasswordRequest {
  current_password: string
  new_password: string
}

export interface ChangePasswordResponse {
  message: string
}

export interface UserPermissionsResponse {
  user_id: number
  username: string
  permissions: string[]
  roles: Array<{ code: string; name: string; description?: string }>
  is_superuser: boolean
  user_info: {
    user_id: number
    username: string
    real_name: string
    department?: string
    position?: string
  }
}

export interface AccessibleCampusesResponse {
  campuses: string[]
  restricted: boolean
  user_campus?: string | null
  user_campuses?: string[]
  user_department?: string | null
  user_position?: string | null
}

export const authService = {
  async login(username: string, password: string): Promise<LoginSuccessResponse> {
    const form = toFormData({
      username,
      password,
      grant_type: 'password',
    })

    const response = await api.post<LoginSuccessResponse>('/auth/login', form, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    })

    return response.data
  },

  async refresh(): Promise<TokenRefreshResponse> {
    const response = await api.post<TokenRefreshResponse>('/auth/refresh', {})
    return response.data
  },

  async getMe(): Promise<BackendUser> {
    const response = await api.get<BackendUser>('/auth/me')
    return response.data
  },

  async changePassword(data: ChangePasswordRequest): Promise<ChangePasswordResponse> {
    const response = await api.put<ChangePasswordResponse>('/auth/me/password', data)
    return response.data
  },

  async getMyPermissions(): Promise<UserPermissionsResponse> {
    const response = await api.get<UserPermissionsResponse>('/auth/me/permissions')
    return response.data
  },

  async getMyAccessibleCampuses(): Promise<AccessibleCampusesResponse> {
    const response = await api.get<AccessibleCampusesResponse>('/auth/me/accessible-campuses')
    return response.data
  },

  async logout(): Promise<void> {
    try {
      await api.post('/auth/logout')
    } catch {
      // 即使后端调用失败也继续（可能已过期或网络问题）
      console.warn('[认证] 后端登出调用失败，继续清除本地状态')
    }
  },
}

export default authService
