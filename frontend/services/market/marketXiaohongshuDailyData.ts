import { apiService } from '@/services/api'

export type XiaohongshuDailyDataRow = {
  id: number
  campus: string
  date: string
  actual_income: number
  refund_count: number
  net_signup: number
  gross_total: number
  order_count: number
  visit_count: number
  consult_count: number
  consumption: number
  display_count: number
  click_count: number
  table_count: number
  private_message_count: number
  effective_consult_count: number
}

export const xiaohongshuDailyDataService = {
  list: (campus: string, month: string) => {
    return apiService.get<{ items: XiaohongshuDailyDataRow[] }>(
      `/market/xiaohongshu-daily-data`,
      {
        params: { campus, month },
      },
    )
  },

  bulkSave: (campus: string, month: string, rows: Array<Omit<XiaohongshuDailyDataRow, 'id' | 'campus'>>) => {
    return apiService.post<{ saved_count: number; items: XiaohongshuDailyDataRow[] }>(
      `/market/xiaohongshu-daily-data/bulk-save`,
      {
        campus,
        month,
        rows,
      },
    )
  },
}

