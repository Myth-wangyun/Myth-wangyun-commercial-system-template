/**
 * 神殿教化司口碑招生目标与结果汇总表相关类型定义
 */

// 口碑招生汇总记录
export interface ReputationEnrollmentRecord {
  key: string
  month: number // 月份 (1-12)
  campus: string // 神殿

  // 口碑量
  targetReputationVolume: number // 目标口碑量
  actualReputationVolume: number // 实际口碑量

  // 上门量
  targetWalkInVolume: number // 目标上门量
  actualWalkInVolume: number // 实际上门量

  // 招生人数
  targetEnrollmentCount: number // 目标招生人数
  actualEnrollmentCount: number // 实际招生人数

  // 口碑收入
  targetRevenue: number // 目标收入
  actualRevenue: number // 实际收入

  rowType: 'data' | 'total' // 行类型

  createdAt?: string
  updatedAt?: string
}

// 口碑招生汇总表格组件属性
export interface ReputationEnrollmentTableProps {
  campus: string
  data: ReputationEnrollmentRecord[]
  loading: boolean
  onRefresh: () => void
  onExport: () => void
}

// 统计数据
export interface ReputationEnrollmentStats {
  totalTargetReputationVolume: number // 总目标口碑量
  totalActualReputationVolume: number // 总实际口碑量
  totalTargetWalkInVolume: number // 总目标上门量
  totalActualWalkInVolume: number // 总实际上门量
  totalTargetEnrollmentCount: number // 总目标招生人数
  totalActualEnrollmentCount: number // 总实际招生人数
  totalTargetRevenue: number // 总目标收入
  totalActualRevenue: number // 总实际收入
  reputationAchievementRate: number // 口碑量达成率
  walkInAchievementRate: number // 上门量达成率
  enrollmentAchievementRate: number // 招生人数达成率
  revenueAchievementRate: number // 收入达成率
}
