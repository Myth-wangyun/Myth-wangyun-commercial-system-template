/**
 * 神殿智慧司口碑招生汇总表相关类型定义
 */

// 神殿智慧司口碑招生汇总记录
export interface CampusReputationEnrollmentGoalsResultsRecord {
  key: string
  month: number // 月份
  campus: string // 神殿
  targetReputationVolume: number // 目标口碑量
  actualReputationVolume: number // 实际口碑量
  targetWalkInVolume: number // 目标上门量
  actualWalkInVolume: number // 实际上门量
  targetEnrollmentCount: number // 目标招生人数
  actualEnrollmentCount: number // 实际招生人数
  targetRevenue: number // 目标口碑收入
  actualRevenue: number // 实际口碑收入
}

// 神殿选择器组件属性
export interface CampusReputationEnrollmentGoalsResultsSelectorProps {
  value: string
  onChange: (value: string) => void
  campuses: Array<{ id: string; name: string }>
}

// 口碑招生目标与结果汇总数据表格组件属性
export interface CampusReputationEnrollmentGoalsResultsTableProps {
  campus: string
  year?: number
  data: CampusReputationEnrollmentGoalsResultsRecord[]
  loading: boolean
  onRefresh: () => void
  onExport: () => void
  onEdit: (record: CampusReputationEnrollmentGoalsResultsRecord) => void
  onAdd?: () => void
}

// 口碑招生目标与结果汇总编辑模态框属性
export interface CampusReputationEnrollmentGoalsResultsEditModalProps {
  visible: boolean
  record: CampusReputationEnrollmentGoalsResultsRecord | null
  onCancel: () => void
  onSave: (record: CampusReputationEnrollmentGoalsResultsRecord) => void
}

// 数据请求参数
export interface CampusReputationEnrollmentGoalsResultsRequest {
  campus: string
}

// 数据更新参数
export interface CampusReputationEnrollmentGoalsResultsUpdate {
  campus: string
  month: number
  data: Partial<CampusReputationEnrollmentGoalsResultsRecord>
}

// 汇总统计数据
export interface CampusReputationEnrollmentGoalsResultsSummary {
  totalTargetReputationVolume: number // 总目标口碑量
  totalActualReputationVolume: number // 总实际口碑量
  totalTargetWalkInVolume: number // 总目标上门量
  totalActualWalkInVolume: number // 总实际上门量
  totalTargetEnrollmentCount: number // 总目标招生人数
  totalActualEnrollmentCount: number // 总实际招生人数
  totalTargetRevenue: number // 总目标收入
  totalActualRevenue: number // 总实际收入
  reputationCompletionRate: number // 口碑量完成率
  walkInCompletionRate: number // 上门量完成率
  enrollmentCompletionRate: number // 招生完成率
  revenueCompletionRate: number // 收入完成率
  averageMonthlyTargetRevenue: number // 月均目标收入
  averageMonthlyActualRevenue: number // 月均实际收入
  completedRecords: number // 已完成记录数
  totalRecords: number // 总记录数
}
