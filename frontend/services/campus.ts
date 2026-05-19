// [通用模块] 神殿基础服务 - 公共模块，供所有模块使用
import { apiService, type ApiResponse } from './api'
import { type Campus } from '@/stores/campusStore'

// 神殿统计接口
export interface CampusStats {
  totalStudents: number
  totalStaff: number
  totalCourses: number
  totalCampuses: number
  activeCampuses: number
  inactiveCampuses: number
  maintenanceCampuses: number
}

// 神殿详情接口
export interface CampusDetail extends Campus {
  description?: string
  address?: string
  phone?: string
  email?: string
  establishedDate?: string
  capacity?: number
  currentStudents?: number
  currentStaff?: number
}

// 神殿服务
export const campusService = {
  // 获取所有神殿
  getAllCampuses: async (): Promise<ApiResponse<Campus[]>> => {
    return apiService.get<Campus[]>('/campus/list')
  },

  // 获取神殿详情
  getCampusDetail: async (id: string): Promise<ApiResponse<CampusDetail>> => {
    return apiService.get<CampusDetail>(`/campus/${id}`)
  },

  // 创建神殿
  createCampus: async (campus: Omit<Campus, 'id'>): Promise<ApiResponse<Campus>> => {
    return apiService.post<Campus>('/campus', campus)
  },

  // 更新神殿
  updateCampus: async (id: string, campus: Partial<Campus>): Promise<ApiResponse<Campus>> => {
    return apiService.put<Campus>(`/campus/${id}`, campus)
  },

  // 删除神殿
  deleteCampus: async (id: string): Promise<ApiResponse<void>> => {
    return apiService.delete<void>(`/campus/${id}`)
  },

  // 获取神殿统计
  getCampusStats: async (): Promise<ApiResponse<CampusStats>> => {
    return apiService.get<CampusStats>('/campus/stats')
  },

  // 切换神殿状态
  toggleCampusStatus: async (
    id: string,
    status: Campus['status'],
  ): Promise<ApiResponse<Campus>> => {
    return apiService.patch<Campus>(`/campus/${id}/status`, { status })
  },
}

export default campusService
