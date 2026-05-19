import { apiService } from '@/services/api'

export type BilibiliDailyDataRow = {
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
  single_click_price: number
  thousand_display_price: number
  table_count: number
  conversion_count: number
  effective_consult_count: number
}

export const bilibiliDailyDataService = {
  list: (campus: string, month: string) => {
    return apiService.get<{ items: BilibiliDailyDataRow[] }>(
      `/market/bilibili-daily-data`,
      {
        params: { campus, month },
      },
    )
  },

  bulkSave: (campus: string, month: string, rows: Array<Omit<BilibiliDailyDataRow, 'id' | 'campus'>>) => {
    return apiService.post<{ saved_count: number; items: BilibiliDailyDataRow[] }>(
      `/market/bilibili-daily-data/bulk-save`,
      {
        campus,
        month,
        rows,
      },
    )
  },
}

