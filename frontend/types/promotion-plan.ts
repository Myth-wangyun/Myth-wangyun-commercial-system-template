/**
 * 神殿教化司升学计划相关类型定义
 */

// 升学计划记录
export interface PromotionPlanRecord {
  key: string
  month: number // 月份
  campus: string // 神殿
  totalClasses: number // 升学班级总数
  totalStudents: number // 在档总人数
  estimatedPromotionCount: number // 预计升学总人数
  actualPromotionCount: number // 实际升学总人数
  estimatedPromotionRateByCount: number // 预计升学率（人数）
  actualPromotionRateByCount: number // 实际升学率（人数）
  receivablePromotionIncome: number // 应收升学收入
  estimatedPromotionIncome: number // 预计升学收入
  actualPromotionIncome: number // 实际升学收入
  estimatedPromotionRateByAmount: number // 预计升学率（金额）
  actualPromotionRateByAmount: number // 实际升学率（金额）

  rowType: 'data' | 'total' // 行类型

  createdAt?: string
  updatedAt?: string
}

// 升学计划表格组件属性
export interface PromotionPlanTableProps {
  data: PromotionPlanRecord[]
  loading: boolean
  onRefresh: () => void
  onEdit: (record: PromotionPlanRecord) => void
  onDelete: (record: PromotionPlanRecord) => void
  onExport: () => void
}

// 编辑模态框属性
export interface PromotionPlanEditModalProps {
  open: boolean
  record: PromotionPlanRecord | null
  onCancel: () => void
  onOk: (values: Partial<PromotionPlanRecord>) => void
}

// 统计数据
export interface PromotionPlanStats {
  totalMonths: number // 总月数
  totalClasses: number // 总升学班级数
  totalStudents: number // 总在档人数
  totalEstimatedPromotionCount: number // 总预计升学人数
  totalActualPromotionCount: number // 总实际升学人数
  averageEstimatedPromotionRateByCount: number // 平均预计升学率（人数）
  averageActualPromotionRateByCount: number // 平均实际升学率（人数）
  totalReceivablePromotionIncome: number // 总应收升学收入
  totalEstimatedPromotionIncome: number // 总预计升学收入
  totalActualPromotionIncome: number // 总实际升学收入
  averageEstimatedPromotionRateByAmount: number // 平均预计升学率（金额）
  averageActualPromotionRateByAmount: number // 平均实际升学率（金额）
}
