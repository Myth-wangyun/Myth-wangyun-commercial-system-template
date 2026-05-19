import { apiService } from '@/services/api'

export type MarketDailyReputationRow = {
  id: number
  campus: string
  date: string
  partner_income: number
  refund_count: number
  net_signup: number
  gross_count: number
  order_count: number
  visit_count: number
  actual_consult_count: number
}

export type MonthlySummaryData = {
  month: number
  partner_income: number
  refund_count: number
  net_signup: number
  gross_count: number
  order_count: number
  visit_count: number
  actual_consult_count: number
}

export type YearlySummaryResponse = {
  campus: string
  year: number
  months: MonthlySummaryData[]
}

export const marketDailyReputationDataService = {
  list: (campus: string, month: string) => {
    return apiService.get<{ items: MarketDailyReputationRow[] }>(
      `/market/daily-reputation-data`,
      {
        params: { campus, month },
      },
    )
  },

  bulkSave: (campus: string, month: string, rows: Array<Omit<MarketDailyReputationRow, 'id' | 'campus'>>) => {
    return apiService.post<{ saved_count: number; items: MarketDailyReputationRow[] }>(
      `/market/daily-reputation-data/bulk-save`,
      {
        campus,
        month,
        rows,
      },
    )
  },

  /**
   * 获取某神殿某年度的日度数据按月汇总
   * 用于市场口碑月度汇总表从日度数据自动获取
   */
  getYearlySummary: (campus: string, year: number) => {
    return apiService.get<YearlySummaryResponse>(
      `/market/daily-reputation-data/yearly-summary`,
      {
        params: { campus, year },
      },
    )
  },
}

