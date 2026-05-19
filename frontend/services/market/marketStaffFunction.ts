// [市场模块] 员工功能分析服务
import { api } from '../api'

// ============================================================
// 类型定义
// ============================================================

// 中层员工数据
export interface MiddleManagementEmployeeData {
  employee_key: string
  employee_name: string
  position: string
  ratings: Record<number, number> // {row_id: rating}
}

// 中层功能分析数据响应
export interface MiddleManagementDataResponse {
  year: string
  employees: MiddleManagementEmployeeData[]
  weights: Record<number, number> // {row_id: weight}
}

// 中层功能分析保存请求
export interface MiddleManagementSaveRequest {
  year: string
  employees: MiddleManagementEmployeeData[]
  weights: Record<number, number>
}

// 员工数据（网推/网聊/AI研发通用）
export interface StaffEmployeeData {
  employee_key: string
  employee_name: string
  scores: Record<number, number> // {row_id: score}
}

// 员工功能分析数据响应（网推/网聊/AI研发通用）
export interface StaffFunctionDataResponse {
  year: string
  employees: StaffEmployeeData[]
}

// 员工功能分析保存请求（网推/网聊/AI研发通用）
export interface StaffFunctionSaveRequest {
  year: string
  employees: StaffEmployeeData[]
}

// 保存响应
export interface SaveResponse {
  success: boolean
  message: string
  saved_count: number
}

// ============================================================
// API 服务
// ============================================================

export const marketStaffFunctionService = {
  // ============================================================
  // 中层功能分析
  // ============================================================
  middleManagement: {
    // 获取中层功能分析数据
    getData: async (year: string): Promise<MiddleManagementDataResponse> => {
      const response = await api.get<MiddleManagementDataResponse>(
        '/market/staff-function/middle-management',
        { params: { year } }
      )
      return response.data
    },

    // 保存中层功能分析数据
    save: async (data: MiddleManagementSaveRequest): Promise<SaveResponse> => {
      const response = await api.post<SaveResponse>(
        '/market/staff-function/middle-management/save',
        data
      )
      return response.data
    },
  },

  // ============================================================
  // 网推功能分析
  // ============================================================
  webPromotion: {
    // 获取网推功能分析数据
    getData: async (year: string): Promise<StaffFunctionDataResponse> => {
      const response = await api.get<StaffFunctionDataResponse>(
        '/market/staff-function/web-promotion',
        { params: { year } }
      )
      return response.data
    },

    // 保存网推功能分析数据
    save: async (data: StaffFunctionSaveRequest): Promise<SaveResponse> => {
      const response = await api.post<SaveResponse>(
        '/market/staff-function/web-promotion/save',
        data
      )
      return response.data
    },
  },

  // ============================================================
  // 网聊功能分析
  // ============================================================
  webChat: {
    // 获取网聊功能分析数据
    getData: async (year: string): Promise<StaffFunctionDataResponse> => {
      const response = await api.get<StaffFunctionDataResponse>(
        '/market/staff-function/web-chat',
        { params: { year } }
      )
      return response.data
    },

    // 保存网聊功能分析数据
    save: async (data: StaffFunctionSaveRequest): Promise<SaveResponse> => {
      const response = await api.post<SaveResponse>(
        '/market/staff-function/web-chat/save',
        data
      )
      return response.data
    },
  },

  // ============================================================
  // AI研发功能分析
  // ============================================================
  aiResearch: {
    // 获取AI研发功能分析数据
    getData: async (year: string): Promise<StaffFunctionDataResponse> => {
      const response = await api.get<StaffFunctionDataResponse>(
        '/market/staff-function/ai-research',
        { params: { year } }
      )
      return response.data
    },

    // 保存AI研发功能分析数据
    save: async (data: StaffFunctionSaveRequest): Promise<SaveResponse> => {
      const response = await api.post<SaveResponse>(
        '/market/staff-function/ai-research/save',
        data
      )
      return response.data
    },
  },
}

export default marketStaffFunctionService

