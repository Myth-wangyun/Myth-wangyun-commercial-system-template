import { apiService } from '@/services/api'

export type MarketOnlinePartnerDailyRow = {
  id: number
  campus: string
  partner: string
  date: string
  partner_actual_income: number
  partner_signup_conversion_rate: string
  refund_count: number
  net_signup: number
  gross_total: number
  order_count: number
  visit_count: number
  actual_consult_count: number
  consult_cost: string
  partner_cost: number
}

export const marketOnlinePartnerDailyService = {
  list: (campus: string, partner: string, month: string) => {
    return apiService.get<{ items: MarketOnlinePartnerDailyRow[] }>(
      `/market/online-partner-daily`,
      {
        params: { campus, partner, month },
      },
    )
  },

  bulkSave: (
    campus: string,
    partner: string,
    month: string,
    rows: Array<Omit<MarketOnlinePartnerDailyRow, 'id' | 'campus' | 'partner'>>,
  ) => {
    return apiService.post<{ saved_count: number; items: MarketOnlinePartnerDailyRow[] }>(
      `/market/online-partner-daily/bulk-save`,
      {
        campus,
        partner,
        month,
        rows,
      },
    )
  },
}

