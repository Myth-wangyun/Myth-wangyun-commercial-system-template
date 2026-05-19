/**
 * 教化司培训计划与成绩汇总表相关类型定义
 */

// 培训计划与成绩记录
export interface TrainingPlanPerformanceRecord {
  key: string
  month: number // 月份
  campus: string // 神殿（用于数据存储，不在表格显示）

  // 培训信息
  trainingObjective: string // 培训目标
  mainContent: string // 主要内容
  trainingMethod: string // 培训方式
  personInCharge: string // 负责人

  // 成绩统计
  numberOfTrainees: number // 培训人数
  numberOfQualified: number // 合格人数
  examPassRate: number // 考试合格率（自动计算）
  averageScore: number // 平均成绩
}

// 培训计划与成绩表格组件属性
export interface TrainingPlanPerformanceTableProps {
  campus: string
  data: TrainingPlanPerformanceRecord[]
  loading: boolean
  onRefresh: () => void
  onExport: () => void
  onEdit: (record: TrainingPlanPerformanceRecord) => void
}

// 培训计划与成绩编辑模态框属性
export interface TrainingPlanPerformanceEditModalProps {
  visible: boolean
  record: TrainingPlanPerformanceRecord | null
  onCancel: () => void
  onSave: (record: TrainingPlanPerformanceRecord) => void
}

// 数据请求参数
export interface TrainingPlanPerformanceRequest {
  campus: string
}

// 数据更新参数
export interface TrainingPlanPerformanceUpdate {
  campus: string
  month: number
  data: Partial<TrainingPlanPerformanceRecord>
}

// 汇总统计数据
export interface TrainingPlanPerformanceSummary {
  totalTrainees: number // 总培训人数
  totalQualified: number // 总合格人数
  overallPassRate: number // 总合格率
  overallAverageScore: number // 总平均成绩
  completedRecords: number // 已完成记录数
  totalRecords: number // 总记录数
}
