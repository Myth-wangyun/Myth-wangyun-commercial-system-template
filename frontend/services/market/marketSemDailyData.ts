import { apiService } from '@/services/api'

export type BaiduDailyRow = {
  id: number
  campus: string
  date: string
  baidu_income: number
  refund_count: number
  net_signup: number
  gross_total: number
  order_count: number
  visit_count: number
  baidu_consult_count: number
  baidu_consumption: number
  baidu_form: number
  center_come_in: number
  baidu_chat_out: number
  total_consult_count: number
  valid_consult_count: number
  baidu_total_dialogue: number
  valid_dialogue: number
  impression_count: number
  click_count: number
  consumption: number
}

export type OtherPlatformDailyRow = {
  id: number
  campus: string
  date: string
  other_income: number
  refund_count: number
  net_signup: number
  gross_total: number
  order_count: number
  visit_count: number
  other_consult_count: number
  other_consumption: number
  campus_website_visit: number
  geo: number
}

export type SummaryDailyRow = {
  date: string
  sem_actual_income: number
  refund_count: number
  net_signup: number
  gross_total: number
  order_count: number
  visit_count: number
  actual_consult_count: number
  sem_consumption: number
}

// 年度汇总数据类型 - 用于SEM推广看板
export type SourceData = {
  actual_income: number
  refund_count: number
  net_signup: number
  gross_total: number
  order_count: number
  visit_count: number
  consult_count: number
  consumption: number
}

// 计划数据类型 - 来自市场部年度网络计划表
export type PlanData = {
  plan_income: number
  plan_signup: number
  plan_consult: number
  plan_cost: number
}

export type YearlySummaryItem = {
  month: number
  plan: PlanData  // 计划数据（来自市场部年度网络计划表）
  total: SourceData
  baidu: SourceData
  campus_website: SourceData
  geo: SourceData
}

export const marketSemDailyDataService = {
  // 百度推广
  getBaiduList: (campus: string, month: string): Promise<{ items: BaiduDailyRow[] }> => {
    return apiService.get<{ items: BaiduDailyRow[] }>(`/market/sem-daily/baidu`, {
      params: { campus, month },
    }) as any
  },

  bulkSaveBaidu: (
    campus: string,
    month: string,
    rows: Array<Omit<BaiduDailyRow, 'id' | 'campus'>>,
  ): Promise<{ saved_count: number; items: BaiduDailyRow[] }> => {
    return apiService.post<{ saved_count: number; items: BaiduDailyRow[] }>(
      `/market/sem-daily/baidu/bulk-save`,
      {
        campus,
        month,
        rows,
      },
    ) as any
  },

  // 其他平台
  getOtherList: (campus: string, month: string): Promise<{ items: OtherPlatformDailyRow[] }> => {
    return apiService.get<{ items: OtherPlatformDailyRow[] }>(`/market/sem-daily/other`, {
      params: { campus, month },
    }) as any
  },

  bulkSaveOther: (
    campus: string,
    month: string,
    rows: Array<Omit<OtherPlatformDailyRow, 'id' | 'campus'>>,
  ): Promise<{ saved_count: number; items: OtherPlatformDailyRow[] }> => {
    return apiService.post<{ saved_count: number; items: OtherPlatformDailyRow[] }>(
      `/market/sem-daily/other/bulk-save`,
      {
        campus,
        month,
        rows,
      },
    ) as any
  },

  // 汇总（只读，从百度和其他平台自动汇总）
  getSummaryList: (campus: string, month: string): Promise<{ items: SummaryDailyRow[] }> => {
    return apiService.get<{ items: SummaryDailyRow[] }>(`/market/sem-daily/summary`, {
      params: { campus, month },
    }) as any
  },

  // 年度汇总（按月汇总，用于SEM推广看板）
  getYearlySummary: (campus: string, year: number): Promise<{ items: YearlySummaryItem[] }> => {
    return apiService.get<{ items: YearlySummaryItem[] }>(`/market/sem-daily/yearly-summary`, {
      params: { campus, year },
    }) as any
  },
}

