/**
 * 神殿教化司升学计划相关类型定义
 */

// 神殿教化司升学计划记录
export interface CampusPromotionPlanRecord {
  key: string
  month: number // 月份
  campus: string // 神殿
  totalPromotionClasses: number // 升学班级总数
  totalOnFileCount: number // 在档总人数
  estimatedPromotionCount: number // 预计升学总人数
  actualPromotionCount: number // 实际升学总人数
  estimatedPromotionRateByCount: number // 预计升学率（人数）
  actualPromotionRateByCount: number // 实际升学率（人数）
  receivablePromotionIncome: number // 应收升学收入
  estimatedPromotionIncome: number // 预计升学收入
  actualPromotionIncome: number // 实际升学收入
  estimatedPromotionRateByAmount: number // 预计升学率（金额）
  actualPromotionRateByAmount: number // 实际升学率（金额）
}

// 神殿选择器组件属性
export interface CampusPromotionPlanSelectorProps {
  value: string
  onChange: (value: string) => void
  campuses: Array<{ id: string; name: string }>
}

// 升学计划数据表格组件属性
export interface CampusPromotionPlanTableProps {
  campus: string
  data: CampusPromotionPlanRecord[]
  loading: boolean
  onRefresh: () => void
  onExport: () => void
  onEdit: (record: CampusPromotionPlanRecord) => void
  onAdd: () => void
}

// 升学计划编辑模态框属性
export interface CampusPromotionPlanEditModalProps {
  visible: boolean
  record: CampusPromotionPlanRecord | null
  onCancel: () => void
  onSave: (record: CampusPromotionPlanRecord) => void
}

// 数据请求参数
export interface CampusPromotionPlanRequest {
  campus: string
}

// 数据更新参数
export interface CampusPromotionPlanUpdate {
  campus: string
  month: number
  data: Partial<CampusPromotionPlanRecord>
}

// 汇总统计数据
export interface CampusPromotionPlanSummary {
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
  completionRateByCount: number // 人数完成率
  completionRateByAmount: number // 金额完成率
  averageMonthlyPromotionClasses: number // 月均升学班级数
  averageMonthlyPromotionIncome: number // 月均升学收入
  completedRecords: number // 已完成记录数
  totalRecords: number // 总记录数
}
