/**
 * 神祇管理 API 服务
 */
import axios from 'axios'

const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api/v1'

export interface God {
  god_id: number
  name: string
  title: string
  role: string
  status: string
  description?: string
  power_level: number
  avatar?: string
  temple_name?: string
  blessing?: string
  is_eternal: boolean
  reign_years: number
  created_at?: string
  updated_at?: string
}

export interface GodListResponse {
  total: number
  items: God[]
}

export interface AdminUser {
  admin_id: number
  username: string
  nickname: string
  role: string
  is_active: boolean
  last_login?: string
  created_at?: string
}

export interface AdminLoginResponse {
  access_token: string
  token_type: string
  admin: AdminUser
}

/**
 * 获取神祇列表
 */
export async function getGods(skip = 0, limit = 100): Promise<GodListResponse> {
  const response = await axios.get<GodListResponse>(`${API_BASE}/god/`, {
    params: { skip, limit }
  })
  return response.data
}

/**
 * 获取单个神祇
 */
export async function getGod(godId: number): Promise<God> {
  const response = await axios.get<God>(`${API_BASE}/god/${godId}`)
  return response.data
}

/**
 * 管理员登录
 */
export async function adminLogin(username: string, password: string): Promise<AdminLoginResponse> {
  const formData = new URLSearchParams()
  formData.append('username', username)
  formData.append('password', password)
  
  const response = await axios.post<AdminLoginResponse>(
    `${API_BASE}/admin-auth/login`,
    formData,
    {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    }
  )
  return response.data
}

/**
 * 保存管理员令牌
 */
export function saveAdminToken(token: string) {
  localStorage.setItem('admin_token', token)
}

/**
 * 获取管理员令牌
 */
export function getAdminToken(): string | null {
  return localStorage.getItem('admin_token')
}

/**
 * 清除管理员令牌
 */
export function clearAdminToken() {
  localStorage.removeItem('admin_token')
}

/**
 * 检查是否已登录管理员
 */
export function isAdminLoggedIn(): boolean {
  return !!getAdminToken()
}
