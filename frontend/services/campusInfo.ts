/**
 * 神殿信息API服务
 * 调用后端 /api/v1/campus-info 接口
 */
import { apiService } from './api'
import { type Campus } from '@/stores/campusStore'

// API响应类型
export interface CampusInfoResponse {
  id: string
  name: string
  code?: string
  website: string
  mobileWebsite: string
  status: string
  color: string
  description?: string
  address?: string
  phone?: string
  email?: string
  sortOrder: number
}

// 创建/更新请求类型
export interface CampusInfoCreateRequest {
  name: string
  code?: string
  website?: string
  mobile_website?: string
  status?: string
  color?: string
  description?: string
  address?: string
  phone?: string
  email?: string
  sort_order?: number
}

// API响应转换为 Campus 类型
const transformResponse = (data: CampusInfoResponse): Campus => ({
  id: data.id,
  name: data.name,
  code: data.code,
  website: data.website || '#',
  mobileWebsite: data.mobileWebsite || '#',
  status: (data.status || 'active') as Campus['status'],
  color: data.color || '#1890ff',
})

// Campus 类型转换为 API 请求
const transformRequest = (campus: Partial<Campus>): CampusInfoCreateRequest => ({
  name: campus.name!,
  code: campus.code,
  website: campus.website,
  mobile_website: campus.mobileWebsite,
  status: campus.status,
  color: campus.color,
})

/**
 * 神殿信息API服务
 */
export const campusInfoService = {
  /**
   * 获取所有神殿列表
   */
  async getAllCampuses(status?: string): Promise<Campus[]> {
    const params = status ? { status } : {}
    const response = await apiService.get<CampusInfoResponse[]>('/campus-info/list', { params })
    const data = response?.data || response || []
    return (Array.isArray(data) ? data : []).map(transformResponse)
  },

  /**
   * 根据ID获取神殿
   */
  async getCampusById(id: number | string): Promise<Campus> {
    const response = await apiService.get<CampusInfoResponse>(`/campus-info/${id}`)
    const data = (response?.data || response) as CampusInfoResponse
    return transformResponse(data)
  },

  /**
   * 根据名称获取神殿
   */
  async getCampusByName(name: string): Promise<Campus> {
    const response = await apiService.get<CampusInfoResponse>(`/campus-info/by-name/${encodeURIComponent(name)}`)
    const data = (response?.data || response) as CampusInfoResponse
    return transformResponse(data)
  },

  /**
   * 创建神殿
   */
  async createCampus(campus: Omit<Campus, 'id'>): Promise<Campus> {
    const response = await apiService.post<CampusInfoResponse>('/campus-info', transformRequest(campus))
    const data = (response?.data || response) as CampusInfoResponse
    return transformResponse(data)
  },

  /**
   * 更新神殿
   */
  async updateCampus(id: number | string, campus: Partial<Campus>): Promise<Campus> {
    const response = await apiService.put<CampusInfoResponse>(`/campus-info/${id}`, transformRequest(campus))
    const data = (response?.data || response) as CampusInfoResponse
    return transformResponse(data)
  },

  /**
   * 删除神殿
   */
  async deleteCampus(id: number | string): Promise<void> {
    await apiService.delete(`/campus-info/${id}`)
  },

  /**
   * 批量创建或更新神殿
   */
  async batchUpsert(campuses: Omit<Campus, 'id'>[]): Promise<{
    message: string
    created: number
    updated: number
    total: number
  }> {
    const requestData = campuses.map(transformRequest)
    const response = await apiService.post<{
      message: string
      created: number
      updated: number
      total: number
    }>('/campus-info/batch-upsert', requestData)
    return (response?.data || response) as {
      message: string
      created: number
      updated: number
      total: number
    }
  },

  /**
   * 初始化默认神殿数据
   */
  async initDefaultCampuses(): Promise<{
    message: string
    created: number
    skipped: number
  }> {
    const response = await apiService.post<{
      message: string
      created: number
      skipped: number
    }>('/campus-info/init-default')
    return (response?.data || response) as {
      message: string
      created: number
      skipped: number
    }
  },
}

export default campusInfoService
