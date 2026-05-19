/**
 * 神殿教化司升学计划相关类型定义
 */

// 神殿教化司升学计划记录
export interface CampusPromotionRecord {
  key: string
  month: number // 月份
  campus: string // 神殿

  // 基础数据
  totalPromotionClasses: number // 升学班级总数
  totalOnFileCount: number // 在档总人数
  estimatedPromotionCount: number // 预计升学总人数
  actualPromotionCount: number // 实际升学总人数

  // 计算字段
  estimatedPromotionRateByCount: number // 预计升学率（人数）
  actualPromotionRateByCount: number // 实际升学率（人数）

  // 收入数据
  receivablePromotionIncome: number // 应收升学收入
  estimatedPromotionIncome: number // 预计升学收入
  actualPromotionIncome: number // 实际升学收入

  // 计算字段
  estimatedPromotionRateByAmount: number // 预计升学率（金额）
  actualPromotionRateByAmount: number // 实际升学率（金额）
}

// 神殿选择器组件属性
export interface CampusPromotionSelectorProps {
  value: string
  onChange: (value: string) => void
  campuses: Array<{ id: string; name: string }>
}

// 升学计划数据表格组件属性
export interface CampusPromotionTableProps {
  campus: string
  data: CampusPromotionRecord[]
  loading: boolean
  onRefresh: () => void
  onExport: () => void
}

// 数据请求参数
export interface CampusPromotionRequest {
  campus: string
}

// 数据更新参数
export interface CampusPromotionUpdate {
  campus: string
  month: number
  data: Partial<CampusPromotionRecord>
}

// 汇总统计数据
export interface CampusPromotionSummary {
  totalPromotionClasses: number // 总升学班级数
  totalOnFileCount: number // 总在档人数
  totalEstimatedPromotionCount: number // 总预计升学人数
  totalActualPromotionCount: number // 总实际升学人数
  averageEstimatedPromotionRateByCount: number // 平均预计升学率（人数）
  averageActualPromotionRateByCount: number // 平均实际升学率（人数）
  totalReceivablePromotionIncome: number // 总应收升学收入
  totalEstimatedPromotionIncome: number // 总预计升学收入
  totalActualPromotionIncome: number // 总实际升学收入
  averageEstimatedPromotionRateByAmount: number // 平均预计升学率（金额）
  averageActualPromotionRateByAmount: number // 平均实际升学率（金额）
  completedMonths: number // 已完成月份数
  totalMonths: number // 总月份数
}
