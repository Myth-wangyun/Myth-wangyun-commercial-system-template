import { apiService } from '@/services/api'

export type KuaishouDailyDataRow = {
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
  seal_cover_count: number
  seal_click_count: number
  material_display_count: number
  action_count: number
  material_action_rate: number
  conversion_count: number
  table_count: number
  effective_consult_count: number
}

export const kuaishouDailyDataService = {
  list: (campus: string, month: string) => {
    return apiService.get<{ items: KuaishouDailyDataRow[] }>(
      `/market/kuaishou-daily-data`,
      {
        params: { campus, month },
      },
    )
  },

  bulkSave: (campus: string, month: string, rows: Array<Omit<KuaishouDailyDataRow, 'id' | 'campus'>>) => {
    return apiService.post<{ saved_count: number; items: KuaishouDailyDataRow[] }>(
      `/market/kuaishou-daily-data/bulk-save`,
      {
        campus,
        month,
        rows,
      },
    )
  },
}

