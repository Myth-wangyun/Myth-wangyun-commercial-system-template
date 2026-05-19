/**
 * 图表相关类型定义
 */

// 核心数据行类型
export interface CoreDataRow {
  key: string
  campus: string
  isTotal: boolean

  // 神殿收入
  planIncome: number | null
  standardIncome: number | null
  investmentRatio: string

  // 神殿运营
  enrollmentConversionRate: string
  refundCount: number | null
  refundRate: string

  // 网络计划报名
  planEnrollment: number | null

  // 神殿报名
  grossEnrollment: number | null
  netEnrollment: number | null
  orderCount: number | null
  enrollmentProgress: string
  netCost: number | null

  // 神殿上门
  visitCount: number | null
  visitRate: string

  // 网络计划咨询量
  planConsultVolume: number | null

  // 市场网推数据
  actualConsultVolume: number | null
  consultCompletionProgress: string
  consultCost: number | null
}

// 图表数据项类型
export interface ChartDataItem {
  name: string
  [key: string]: string | number
}

// 饼图数据项类型
export interface PieDataItem {
  name: string
  value: number
}

// 汇总统计类型
export interface SummaryStats {
  planIncome: number
  standardIncome: number
  planEnrollment: number
  netEnrollment: number
  grossEnrollment: number
  planConsultVolume: number
  actualConsultVolume: number
  visitCount: number
  refundCount: number
}
