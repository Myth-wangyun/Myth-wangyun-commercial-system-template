/**
 * 神殿教化司月度班级升学目标与结果汇总表相关类型定义
 */

// 月度班级升学目标与结果汇总记录
export interface MonthlyClassPromotionTargetRecord {
  key: string
  serialNumber: number // 序号
  teacherName: string // 班主任
  className: string // 升学班级名称
  promotionPeriod: string // 升学周期
  totalStudents: number // 在档总人数
  estimatedPromotionCount: number // 预计升学总人数
  actualPromotionCount: number // 实际升学总人数
  estimatedPromotionRateByCount: number // 预计升学率（人数）
  actualPromotionRateByCount: number // 实际升学率（人数）
  receivables: number // 应收
  estimatedPromotionIncome: number // 预计升学收入
  actualPromotionIncome: number // 实际升学收入
  estimatedPromotionRateByAmount: number // 预计升学率（金额）
  actualPromotionRateByAmount: number // 实际升学率（金额）

  rowType: 'data' | 'total' // 行类型

  createdAt?: string
  updatedAt?: string
}

// 月度班级升学目标与结果汇总表格组件属性
export interface MonthlyClassPromotionTargetTableProps {
  data: MonthlyClassPromotionTargetRecord[]
  loading: boolean
  onRefresh: () => void
  onEdit: (record: MonthlyClassPromotionTargetRecord) => void
  onDelete: (record: MonthlyClassPromotionTargetRecord) => void
  onExport: () => void
}

// 编辑模态框属性
export interface MonthlyClassPromotionTargetEditModalProps {
  open: boolean
  record: MonthlyClassPromotionTargetRecord | null
  onCancel: () => void
  onOk: (values: Partial<MonthlyClassPromotionTargetRecord>) => void
}

// 统计数据
export interface MonthlyClassPromotionTargetStats {
  totalClasses: number // 总班级数
  totalStudents: number // 总在档人数
  totalEstimatedPromotionCount: number // 总预计升学人数
  totalActualPromotionCount: number // 总实际升学人数
  averageEstimatedPromotionRateByCount: number // 平均预计升学率（人数）
  averageActualPromotionRateByCount: number // 平均实际升学率（人数）
  totalReceivables: number // 总应收
  totalEstimatedPromotionIncome: number // 总预计升学收入
  totalActualPromotionIncome: number // 总实际升学收入
  averageEstimatedPromotionRateByAmount: number // 平均预计升学率（金额）
  averageActualPromotionRateByAmount: number // 平均实际升学率（金额）
}
