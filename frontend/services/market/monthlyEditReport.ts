import { apiService } from '@/services/api'

/**
 * 市场部剪辑月度汇报表数据类型
 */
export interface MonthlyEditReportData {
  id?: number
  key?: string // 唯一标识，格式如 "1-合计", "1-测试"
  rowType: string // 'summary' | 'data'
  period: string // 'all-year' | '1' | '2' | ... | '12'
  periodLabel?: string // '全年度' | '1月' | '2月' | ...
  campus: string // 神殿名称，合计行为"合计"
  
  // 文案类
  audienceTypeCount?: string // 人群类别
  plannedArticles?: number // 计划文案数
  actualArticles?: number // 实际文案数
  
  // 拍摄类
  plannedEditDemand?: number // 计划拍摄次数
  completedEditDemand?: number // 截止昨日应完成拍摄次数
  actualShootVideos?: number // 实际拍摄次数
  shootCompletionProgress?: string // 拍摄完成进度
  
  // 剪辑类
  monthlyEditPlans?: number // 本月计划剪辑数
  completedEarlyPlans?: number // 截止昨日应完成剪辑次数
  actualEditedVideos?: number // 实际完成剪辑数
  editProgressRate?: string // 剪辑完成进度
  
  // 结果类
  auditPassVideoCount?: number // 审核通过数
  auditPassRate?: string // 审核通过率
  
  // 集团活动
  groupActivity?: string
  
  createdAt?: string
  updatedAt?: string
}

/**
 * 保存请求数据类型
 */
export interface MonthlyEditReportSaveRequest {
  year: number
  data: MonthlyEditReportData[]
}

/**
 * 市场部剪辑月度汇报表服务
 */
export const monthlyEditReportService = {
  /**
   * 获取剪辑月度汇报列表
   * @param year 年份
   */
  getList: async (year: number): Promise<MonthlyEditReportData[]> => {
    const response = await apiService.get<{ data: MonthlyEditReportData[] }>(
      '/market/monthly-edit-report',
      {
        params: { year },
      }
    )
    return (response as any).data || []
  },

  /**
   * 从周度表刷新剪辑月度汇报数据
   * @param year 年份
   */
  refreshFromWeekly: async (year: number): Promise<MonthlyEditReportData[]> => {
    const response = await apiService.get<{ data: MonthlyEditReportData[] }>(
      '/market/monthly-edit-report/refresh',
      {
        params: { year },
      }
    )
    return (response as any).data || []
  },

  /**
   * 保存剪辑月度汇报
   * @param request 保存请求数据
   */
  save: async (request: MonthlyEditReportSaveRequest): Promise<void> => {
    await apiService.post('/market/monthly-edit-report/save', request)
  },
}

