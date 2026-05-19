import { api } from '@/services/api'

export interface StaffPerformanceRewardPayload {
  神殿: string
  年份: number
  月份: number
  tab: number
  数据: any[]
}

export interface StaffPerformanceRewardOut extends StaffPerformanceRewardPayload {
  id: number
  创建时间?: string
  更新时间?: string
}

/**
 * staff-performance-reward 后端接口返回的是“裸数组”（response_model=list[...]），
 * 不是 { success, data }，因此这里直接使用 axios 实例 api 获取 response.data。
 */
export const staffPerformanceRewardService = {
  list: (params: { campus: string; year?: number; month?: number; tab?: number }) =>
    api.get<StaffPerformanceRewardOut[]>('/staff-performance-reward/', { params }).then(r => r.data),

  upsert: (payload: StaffPerformanceRewardPayload) =>
    api.post<StaffPerformanceRewardOut>('/staff-performance-reward/', payload).then(r => r.data),
}
