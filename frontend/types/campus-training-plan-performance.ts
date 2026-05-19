/**
 * 神殿教化司培训计划与成绩汇总表相关类型定义
 */

// 神殿教化司培训计划与成绩汇总记录
export interface CampusTrainingPlanPerformanceRecord {
  key: string
  month: number // 月份
  campus: string // 神殿
  targetTrainingPlanCount: number // 目标培训计划数
  actualTrainingPlanCount: number // 实际培训计划数
  targetCompletionCount: number // 目标完成数
  actualCompletionCount: number // 实际完成数
  targetAverageScore: number // 目标平均成绩
  actualAverageScore: number // 实际平均成绩
  targetParticipantCount: number // 目标参与人数
  actualParticipantCount: number // 实际参与人数
  targetPassRate: number // 目标合格率
  actualPassRate: number // 实际合格率
}

// 神殿选择器组件属性
export interface CampusTrainingPlanPerformanceSelectorProps {
  value: string
  onChange: (value: string) => void
  campuses: Array<{ id: string; name: string }>
}

// 培训计划与成绩汇总数据表格组件属性
export interface CampusTrainingPlanPerformanceTableProps {
  campus: string
  data: CampusTrainingPlanPerformanceRecord[]
  loading: boolean
  onRefresh: () => void
  onExport: () => void
  onEdit: (record: CampusTrainingPlanPerformanceRecord) => void
  onAdd: () => void
  onSave: (record: CampusTrainingPlanPerformanceRecord) => Promise<void>
}

// 培训计划与成绩汇总编辑模态框属性
export interface CampusTrainingPlanPerformanceEditModalProps {
  visible: boolean
  record: CampusTrainingPlanPerformanceRecord | null
  onCancel: () => void
  onSave: (record: CampusTrainingPlanPerformanceRecord) => Promise<void>
}

// 数据请求参数
export interface CampusTrainingPlanPerformanceRequest {
  campus: string
}

// 数据更新参数
export interface CampusTrainingPlanPerformanceUpdate {
  campus: string
  month: number
  data: Partial<CampusTrainingPlanPerformanceRecord>
}

// 汇总统计数据
export interface CampusTrainingPlanPerformanceSummary {
  totalTargetTrainingPlanCount: number // 总目标培训计划数
  totalActualTrainingPlanCount: number // 总实际培训计划数
  totalTargetCompletionCount: number // 总目标完成数
  totalActualCompletionCount: number // 总实际完成数
  averageTargetScore: number // 平均目标成绩
  averageActualScore: number // 平均实际成绩
  totalTargetParticipantCount: number // 总目标参与人数
  totalActualParticipantCount: number // 总实际参与人数
  averageTargetPassRate: number // 平均目标合格率
  averageActualPassRate: number // 平均实际合格率
  completionRate: number // 完成率
  passRateCompletionRate: number // 合格率完成率
  completedRecords: number // 已完成记录数
  totalRecords: number // 总记录数
}

