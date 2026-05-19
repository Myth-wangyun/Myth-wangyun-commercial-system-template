/**
 * 市场部月度计划数据API
 */
import request from '@/services/api'

const BASE_URL = '/market/monthly-plan'

/** 月度计划数据项 */
interface MonthlyPlanItem {
  month: number
  plan_income: number
  plan_enrollment: number
  plan_consult_volume: number
  plan_cost: number
}

/** 网络合作伙伴月度计划响应 */
interface NetworkPartnerPlanResponse {
  code: number
  message: string
  data: Record<number, MonthlyPlanItem>
}

/**
 * 获取网络合作伙伴月度计划汇总数据（按月份汇总）
 */
export async function getNetworkPartnerPlanList(params: {
  campus: string
  year: string
}): Promise<NetworkPartnerPlanResponse> {
  return request.get(`${BASE_URL}/network-partner/list`, { params })
}

