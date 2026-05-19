import { apiService } from '@/services/api'

export type WechatVideoDailyDataRow = {
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
  thousand_display_price: number
  click_count: number
  target_conversion_count: number
  table_count: number
  effective_consult_count: number
}

export const wechatVideoDailyDataService = {
  list: (campus: string, month: string) => {
    return apiService.get<{ items: WechatVideoDailyDataRow[] }>(
      `/market/wechat-video-daily-data`,
      {
        params: { campus, month },
      },
    )
  },

  bulkSave: (campus: string, month: string, rows: Array<Omit<WechatVideoDailyDataRow, 'id' | 'campus'>>) => {
    return apiService.post<{ saved_count: number; items: WechatVideoDailyDataRow[] }>(
      `/market/wechat-video-daily-data/bulk-save`,
      {
        campus,
        month,
        rows,
      },
    )
  },
}
