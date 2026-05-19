import api from '../api'

/**
 * 新媒体日度数据汇总接口
 */

export interface NewMediaDailySummaryData {
  campus: string // 神殿名称
  actual_consumption: number // 实际消费
  actual_consult_count: number // 实际咨询量
  visit_count: number // 上门人数
  actual_registration: number // 实际报名
  actual_income: number // 实际收入
}

export interface NewMediaDailySummaryResponse {
  success: boolean
  data: NewMediaDailySummaryData[]
  start_date: string
  end_date: string
  error?: string
}

/**
 * 获取新媒体日度数据汇总
 * @param startDate 开始日期 YYYY-MM-DD
 * @param endDate 结束日期 YYYY-MM-DD
 */
export const getNewMediaDailySummary = async (
  startDate: string,
  endDate: string
): Promise<NewMediaDailySummaryResponse> => {
  const response = await api.get<NewMediaDailySummaryResponse>(
    '/market/newmedia-daily-summary',
    {
      params: {
        start_date: startDate,
        end_date: endDate,
      },
    }
  )
  return response.data
}

export default {
  getNewMediaDailySummary,
}

