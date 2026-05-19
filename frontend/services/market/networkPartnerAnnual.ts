import { apiService } from '@/services/api'

export type NetworkPartnerAnnualMonthlyData = {
  actual_income: number
  refund_count: number
  net_enrollment: number
  gross_enrollment: number
  order_count: number
  visit_count: number
  actual_consult_volume: number
  actual_cost: number
}

export type NetworkPartnerAnnualDetailData = {
  partner_actual_income: number
  refund_count: number
  net_enrollment: number
  gross_enrollment: number
  order_count: number
  visit_count: number
  actual_consult_volume: number
  actual_cost: number
}

export const networkPartnerAnnualService = {
  /**
   * 获取年度数据看板 - 按月聚合
   */
  getDashboard: (campus: string, year: string) => {
    return apiService.get<{ data: Record<number, NetworkPartnerAnnualMonthlyData> }>(
      `/market/network-partner-annual/dashboard`,
      {
        params: { campus, year },
      },
    )
  },

  /**
   * 获取年度数据看板明细 - 按月和合作伙伴聚合
   */
  getDashboardDetail: (campus: string, year: string) => {
    return apiService.get<{ data: Record<number, Record<string, NetworkPartnerAnnualDetailData>> }>(
      `/market/network-partner-annual/dashboard-detail`,
      {
        params: { campus, year },
      },
    )
  },
}
