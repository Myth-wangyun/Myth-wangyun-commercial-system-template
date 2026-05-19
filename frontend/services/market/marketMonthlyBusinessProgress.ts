import { apiService } from '@/services/api'

// 各渠道汇总数据类型
export type ChannelSummaryData = {
  gross_total: number // 毛报总数
  net_signup: number // 净报名
  order_count: number // 订座数
  visit_count: number // 上门人数
  actual_consult_count: number // 实际咨询量
  consumption: number // 消费
  refund_count?: number // 退费数
}

// 新媒体汇总数据
export type NewMediaSummaryData = ChannelSummaryData & {
  consult_total: number // 新媒体咨询总量
}

// 月度业务推进汇总数据
export type MonthlyBusinessProgressData = {
  campus: string
  // 来自012-市场部年度网络计划表的计划数据
  plan_income: number // 计划收入（network_plan_income）
  plan_enrollment: number // 计划报名（network_plan_signup）
  plan_consult_volume: number // 计划咨询量（network_plan_total）
  monthly_consult_cost: number // 月计划消费（network_plan_cost）
  
  // 实际收入（待从其他系统获取）
  actual_income: number
  
  // 各渠道汇总数据（从日度数据表汇总）
  reputation_data: ChannelSummaryData // 口碑数据
  partner_data: ChannelSummaryData // 合作伙伴数据
  sem_data: ChannelSummaryData // SEM数据
  newmedia_data: NewMediaSummaryData // 新媒体数据
}

export const marketMonthlyBusinessProgressService = {
  /**
   * 获取指定神殿、年月、日期范围的业务推进汇总数据
   * @param campus 神殿名称
   * @param year 年份
   * @param month 月份（01-12）
   * @param startDate 开始日期 YYYY-MM-DD
   * @param endDate 结束日期 YYYY-MM-DD
   */
  getCampusSummary: async (
    campus: string,
    year: string,
    month: string,
    startDate: string,
    endDate: string
  ): Promise<MonthlyBusinessProgressData> => {
    const response = await apiService.get<MonthlyBusinessProgressData>(
      '/market/monthly-business-progress/campus-summary',
      {
        params: { campus, year, month, startDate, endDate },
      }
    )
    return response as any
  },

  /**
   * 获取所有神殿的业务推进汇总数据
   * @param year 年份
   * @param month 月份（01-12）
   * @param startDate 开始日期 YYYY-MM-DD
   * @param endDate 结束日期 YYYY-MM-DD
   */
  getAllCampusSummary: async (
    year: string,
    month: string,
    startDate: string,
    endDate: string
  ): Promise<MonthlyBusinessProgressData[]> => {
    const response = await apiService.get<{ items: MonthlyBusinessProgressData[] }>(
      '/market/monthly-business-progress/all-campus-summary',
      {
        params: { year, month, startDate, endDate },
      }
    )
    return (response as any).items || []
  },
}

