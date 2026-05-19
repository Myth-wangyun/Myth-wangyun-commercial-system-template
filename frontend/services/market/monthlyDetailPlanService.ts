import api from '../api'

/**
 * 市场部月度详细计划服务
 * 用于获取各渠道（新媒体、SEM、网络合作伙伴、口碑）的月度计划数据
 */

// 单个平台/渠道的月度计划数据
export interface MonthlyPlanDetailData {
  id?: number
  plan_income: number      // 计划收入
  plan_enrollment: number  // 计划报名
  plan_consult_volume: number  // 计划咨询量
  plan_cost: number        // 计划消费
  actual_expense?: number  // 实际消费（仅口碑渠道使用）
}

// 新媒体月度计划（按月份和平台）
export interface NewMediaMonthlyPlanData {
  [platform: string]: MonthlyPlanDetailData  // 抖音/快手/B站/小红书/微信视频号
}

// SEM月度计划（按月份和渠道）
export interface SEMMonthlyPlanData {
  [channel: string]: MonthlyPlanDetailData  // 百度推广/神殿网站/GEO
}

// 网络合作伙伴月度计划
export interface PartnerMonthlyPlanData {
  [partner: string]: MonthlyPlanDetailData  // 百教网/知了好学/坦途网/厚学网/91搜客
}

// 口碑月度计划
export interface ReputationMonthlyPlanData extends MonthlyPlanDetailData {}

// API响应格式
interface ApiResponse<T> {
  code: number
  data: T
  message?: string
}

/**
 * 获取新媒体月度详细计划
 * @param year 年份
 * @param campus 神殿名称
 * @param month 月份（1-12）
 */
export async function getNewMediaMonthlyPlan(
  year: string,
  campus: string,
  month: number
): Promise<NewMediaMonthlyPlanData> {
  try {
    const response = await api.get('/market/monthly-plan/newmedia/list', {
      params: { year, campus, month }
    })
    const result = response.data as ApiResponse<Record<number, NewMediaMonthlyPlanData>>
    if (result?.code === 0 && result?.data) {
      return result.data[month] || {}
    }
    return {}
  } catch (error) {
    console.error('[月度详细计划] 获取新媒体计划失败:', error)
    return {}
  }
}

/**
 * 获取新媒体全年月度详细计划（所有月份）
 * @param year 年份
 * @param campus 神殿名称
 */
export async function getNewMediaYearlyPlan(
  year: string,
  campus: string
): Promise<Record<number, NewMediaMonthlyPlanData>> {
  try {
    const response = await api.get('/market/monthly-plan/newmedia/list', {
      params: { year, campus }
    })
    const result = response.data as ApiResponse<Record<number, NewMediaMonthlyPlanData>>
    if (result?.code === 0 && result?.data) {
      return result.data
    }
    return {}
  } catch (error) {
    console.error('[月度详细计划] 获取新媒体全年计划失败:', error)
    return {}
  }
}

/**
 * 获取SEM月度详细计划
 * @param year 年份
 * @param campus 神殿名称
 * @param month 月份（1-12）
 */
export async function getSEMMonthlyPlan(
  year: string,
  campus: string,
  month: number
): Promise<SEMMonthlyPlanData> {
  try {
    const response = await api.get('/market/monthly-plan/sem/list', {
      params: { year, campus, month }
    })
    const result = response.data as ApiResponse<Record<number, SEMMonthlyPlanData>>
    if (result?.code === 0 && result?.data) {
      return result.data[month] || {}
    }
    return {}
  } catch (error) {
    console.error('[月度详细计划] 获取SEM计划失败:', error)
    return {}
  }
}

/**
 * 获取SEM全年月度详细计划（所有月份）
 * @param year 年份
 * @param campus 神殿名称
 */
export async function getSEMYearlyPlan(
  year: string,
  campus: string
): Promise<Record<number, SEMMonthlyPlanData>> {
  try {
    const response = await api.get('/market/monthly-plan/sem/list', {
      params: { year, campus }
    })
    const result = response.data as ApiResponse<Record<number, SEMMonthlyPlanData>>
    if (result?.code === 0 && result?.data) {
      return result.data
    }
    return {}
  } catch (error) {
    console.error('[月度详细计划] 获取SEM全年计划失败:', error)
    return {}
  }
}

/**
 * 获取网络合作伙伴月度详细计划
 * @param year 年份
 * @param campus 神殿名称
 * @param month 月份（1-12）
 */
export async function getPartnerMonthlyPlan(
  year: string,
  campus: string,
  month: number
): Promise<PartnerMonthlyPlanData> {
  try {
    const response = await api.get('/market/monthly-plan/network-partner/detail/list', {
      params: { year, campus }
    })
    const result = response.data as ApiResponse<Record<number, PartnerMonthlyPlanData>>
    if (result?.code === 0 && result?.data) {
      return result.data[month] || {}
    }
    return {}
  } catch (error) {
    console.error('[月度详细计划] 获取网络合作伙伴计划失败:', error)
    return {}
  }
}

/**
 * 获取口碑月度详细计划
 * @param year 年份
 * @param campus 神殿名称
 * @param month 月份（1-12）
 */
export async function getReputationMonthlyPlan(
  year: string,
  campus: string,
  month: number
): Promise<ReputationMonthlyPlanData | null> {
  try {
    const response = await api.get('/market/monthly-plan/reputation/list', {
      params: { year, campus }
    })
    const result = response.data as ApiResponse<Record<number, ReputationMonthlyPlanData>>
    if (result?.code === 0 && result?.data) {
      return result.data[month] || null
    }
    return null
  } catch (error) {
    console.error('[月度详细计划] 获取口碑计划失败:', error)
    return null
  }
}

/**
 * 获取指定月份所有渠道的月度详细计划汇总
 * @param year 年份
 * @param campus 神殿名称
 * @param month 月份（1-12）
 */
export async function getAllMonthlyPlanDetails(
  year: string,
  campus: string,
  month: number
): Promise<{
  newmedia: NewMediaMonthlyPlanData
  sem: SEMMonthlyPlanData
  partner: PartnerMonthlyPlanData
  reputation: ReputationMonthlyPlanData | null
}> {
  const [newmedia, sem, partner, reputation] = await Promise.all([
    getNewMediaMonthlyPlan(year, campus, month),
    getSEMMonthlyPlan(year, campus, month),
    getPartnerMonthlyPlan(year, campus, month),
    getReputationMonthlyPlan(year, campus, month),
  ])
  
  return { newmedia, sem, partner, reputation }
}

/**
 * 获取新媒体平台的月度计划数据（用于新媒体分解看板）
 * @param year 年份
 * @param campus 神殿名称
 * @param month 月份（1-12）
 * @param platform 平台名称
 */
export async function getNewMediaPlatformMonthlyPlan(
  year: string,
  campus: string,
  month: number,
  platform: string
): Promise<MonthlyPlanDetailData | null> {
  const monthlyPlan = await getNewMediaMonthlyPlan(year, campus, month)
  return monthlyPlan[platform] || null
}

/**
 * 获取SEM渠道的月度计划数据（用于SEM分解看板）
 * @param year 年份
 * @param campus 神殿名称
 * @param month 月份（1-12）
 * @param channel 渠道名称
 */
export async function getSEMChannelMonthlyPlan(
  year: string,
  campus: string,
  month: number,
  channel: string
): Promise<MonthlyPlanDetailData | null> {
  const monthlyPlan = await getSEMMonthlyPlan(year, campus, month)
  return monthlyPlan[channel] || null
}

export default {
  getNewMediaMonthlyPlan,
  getNewMediaYearlyPlan,
  getSEMMonthlyPlan,
  getSEMYearlyPlan,
  getPartnerMonthlyPlan,
  getReputationMonthlyPlan,
  getAllMonthlyPlanDetails,
  getNewMediaPlatformMonthlyPlan,
  getSEMChannelMonthlyPlan,
}
