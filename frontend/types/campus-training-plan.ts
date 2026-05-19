/**
 * 神殿教化司培训计划与成绩汇总表相关类型定义
 */

// 神殿教化司培训计划与成绩汇总记录
export interface CampusTrainingPlanRecord {
  key: string
  month: number // 月份
  campus: string // 神殿
  trainingObjective: string // 培训目标
  mainContent: string // 主要内容
  trainingMethod: string // 培训方式
  personInCharge: string // 负责人
  trainingCount: number // 培训人数
  qualifiedCount: number // 合格人数

  // 计算字段
  passRate: number // 考试合格率（自动计算）
  averageScore: number // 平均成绩
}

// 神殿选择器组件属性
export interface CampusTrainingPlanSelectorProps {
  value: string
  onChange: (value: string) => void
  campuses: Array<{ id: string; name: string }>
}

// 培训计划与成绩汇总数据表格组件属性
export interface CampusTrainingPlanTableProps {
  campus: string
  data: CampusTrainingPlanRecord[]
  loading: boolean
  onRefresh: () => void
  onExport: () => void
  onEdit: (record: CampusTrainingPlanRecord) => void
}

// 培训计划与成绩汇总编辑模态框属性
export interface CampusTrainingPlanEditModalProps {
  visible: boolean
  record: CampusTrainingPlanRecord | null
  onCancel: () => void
  onSave: (record: CampusTrainingPlanRecord) => void
}

// 数据请求参数
export interface CampusTrainingPlanRequest {
  campus: string
}

// 数据更新参数
export interface CampusTrainingPlanUpdate {
  campus: string
  month: number
  data: Partial<CampusTrainingPlanRecord>
}

// 汇总统计数据
export interface CampusTrainingPlanSummary {
  totalTrainingCount: number // 总培训人数
  totalQualifiedCount: number // 总合格人数
  overallPassRate: number // 总体合格率
  overallAverageScore: number // 总体平均成绩
  completedRecords: number // 已完成记录数
  totalRecords: number // 总记录数
  highestScore: number // 最高成绩
  lowestScore: number // 最低成绩
  mostEffectiveMethod: string // 最有效培训方式
  mostActivePerson: string // 最活跃负责人
}
