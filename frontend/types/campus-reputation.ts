/**
 * 神殿教化司口碑招生目标与结果汇总表相关类型定义
 */

// 神殿教化司口碑招生目标与结果记录
export interface CampusReputationRecord {
  key: string
  month: number // 月份
  campus: string // 神殿

  // 口碑量
  targetReputationCount: number // 目标口碑量
  actualReputationCount: number // 实际口碑量
  reputationCompletionRate: number // 口碑量完成率（自动计算）

  // 上门量
  targetWalkInCount: number // 目标上门量
  actualWalkInCount: number // 实际上门量
  walkInCompletionRate: number // 上门量完成率（自动计算）

  // 招生人数
  targetEnrollmentCount: number // 目标人数
  actualEnrollmentCount: number // 实际人数
  enrollmentCompletionRate: number // 招生完成率（自动计算）

  // 口碑收入
  targetRevenue: number // 目标收入
  actualRevenue: number // 实际收入
  revenueCompletionRate: number // 收入完成率（自动计算）
}

// 神殿选择器组件属性
export interface CampusReputationSelectorProps {
  value: string
  onChange: (value: string) => void
  campuses: Array<{ id: string; name: string }>
}

// 口碑招生数据表格组件属性
export interface CampusReputationTableProps {
  campus: string
  data: CampusReputationRecord[]
  loading: boolean
  onRefresh: () => void
  onExport: () => void
}

// 数据请求参数
export interface CampusReputationRequest {
  campus: string
}

// 数据更新参数
export interface CampusReputationUpdate {
  campus: string
  month: number
  data: Partial<CampusReputationRecord>
}

// 汇总统计数据
export interface CampusReputationSummary {
  totalTargetReputation: number // 总目标口碑量
  totalActualReputation: number // 总实际口碑量
  averageReputationRate: number // 平均口碑量完成率

  totalTargetWalkIn: number // 总目标上门量
  totalActualWalkIn: number // 总实际上门量
  averageWalkInRate: number // 平均上门量完成率

  totalTargetEnrollment: number // 总目标招生人数
  totalActualEnrollment: number // 总实际招生人数
  averageEnrollmentRate: number // 平均招生完成率

  totalTargetRevenue: number // 总目标收入
  totalActualRevenue: number // 总实际收入
  averageRevenueRate: number // 平均收入完成率

  completedMonths: number // 已完成月份数
  totalMonths: number // 总月份数
}
