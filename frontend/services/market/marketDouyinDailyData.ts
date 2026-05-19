import { apiService } from '@/services/api'

export type DouyinDailyDataRow = {
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
  avg_display_price: number
  conversion_count: number
  form_submit_count: number
  private_message_count: number
  phone_call_count: number
  online_consult_count: number
  coupon_receive_count: number
  smart_phone_count: number
  effective_consult_count: number
}

export const douyinDailyDataService = {
  list: (campus: string, month: string) => {
    return apiService.get<{ items: DouyinDailyDataRow[] }>(
      `/market/douyin-daily-data`,
      {
        params: { campus, month },
      },
    )
  },

  bulkSave: (campus: string, month: string, rows: Array<Omit<DouyinDailyDataRow, 'id' | 'campus'>>) => {
    return apiService.post<{ saved_count: number; items: DouyinDailyDataRow[] }>(
      `/market/douyin-daily-data/bulk-save`,
      {
        campus,
        month,
        rows,
      },
    )
  },
}

