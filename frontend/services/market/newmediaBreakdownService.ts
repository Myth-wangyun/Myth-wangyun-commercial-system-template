import api from '../api'

/**
 * 新媒体分解看板数据服务
 * 用于01和02新媒体看板的数据获取
 */

// 月度汇总数据类型（01看板使用）
export interface NewMediaMonthlySummaryData {
  month: number
  actual_income: number
  refund_count: number
  gross_enrollment: number
  net_enrollment: number
  order_count: number
  visit_count: number
  actual_consult_volume: number
  actual_cost: number
}

export interface NewMediaMonthlySummaryResponse {
  success: boolean
  data: NewMediaMonthlySummaryData[]
  year: string
  campus: string
  error?: string
}

// 月度平台分组数据类型（02看板使用）
export interface NewMediaMonthlyPlatformData {
  month: number
  platform: string  // 抖音/快手/B站/小红书/微信视频号
  actual_income: number
  refund_count: number
  gross_enrollment: number
  net_enrollment: number
  order_count: number
  visit_count: number
  actual_consult_volume: number
  actual_cost: number
}

export interface NewMediaMonthlyPlatformResponse {
  success: boolean
  data: NewMediaMonthlyPlatformData[]
  year: string
  campus: string
  error?: string
}

// 年度网络计划数据类型
export interface NetworkPlanData {
  id: number
  year: string
  month: number  // 0=总计, 1-12=月份
  campus: string
  // 网络中心计划（总计）
  network_plan_income: number
  network_plan_signup: number
  network_plan_total: number
  network_plan_cost: number
  // 新媒体计划
  newmedia_plan_income: number
  newmedia_plan_signup: number
  newmedia_plan_consult: number
  newmedia_plan_cost: number
  // SEM计划
  sem_plan_income: number
  sem_plan_signup: number
  sem_plan_consult: number
  sem_plan_cost: number
}

export interface NetworkPlanResponse {
  success: boolean
  data: NetworkPlanData[]
  error?: string
}

/**
 * 获取新媒体月度汇总数据（用于01看板）
 * @param year 年份 YYYY
 * @param campus 神殿名称
 */
export const getNewMediaMonthlySummary = async (
  year: string,
  campus: string
): Promise<NewMediaMonthlySummaryResponse> => {
  try {
    const response = await api.get('/market/newmedia-monthly-summary', {
      params: { year, campus }
    })
    return response.data as NewMediaMonthlySummaryResponse
  } catch (error: any) {
    return {
      success: false,
      data: [],
      year,
      campus,
      error: error.message || '获取新媒体月度汇总数据失败'
    }
  }
}

/**
 * 获取新媒体月度平台分组数据（用于02看板）
 * @param year 年份 YYYY
 * @param campus 神殿名称
 */
export const getNewMediaMonthlyPlatformSummary = async (
  year: string,
  campus: string
): Promise<NewMediaMonthlyPlatformResponse> => {
  try {
    const response = await api.get('/market/newmedia-monthly-platform-summary', {
      params: { year, campus }
    })
    return response.data as NewMediaMonthlyPlatformResponse
  } catch (error: any) {
    return {
      success: false,
      data: [],
      year,
      campus,
      error: error.message || '获取新媒体月度平台分组数据失败'
    }
  }
}

/**
 * 获取年度网络计划数据
 * @param year 年份 YYYY
 * @param campus 神殿名称
 */
export const getNetworkPlanData = async (
  year: string,
  campus: string
): Promise<NetworkPlanData[]> => {
  try {
    const response = await api.get('/market/network-plan', {
      params: { year, campus }
    })
    return response.data as NetworkPlanData[]
  } catch (error: any) {
    console.error('获取年度网络计划数据失败:', error)
    return []
  }
}

export default {
  getNewMediaMonthlySummary,
  getNewMediaMonthlyPlatformSummary,
  getNetworkPlanData,
}
