/**
 * 神殿教化司口碑招生月度个人目标与结果汇总表相关类型定义
 */

// 月度个人口碑招生记录
export interface MonthlyPersonalReputationEnrollmentRecord {
  key: string
  month: number // 月份 (1-12)
  name: string // 姓名

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

  rowType: 'data' | 'month-subtotal' | 'total' // 行类型

  createdAt?: string
  updatedAt?: string
}

// 月度个人口碑招生汇总表格组件属性
export interface MonthlyPersonalReputationEnrollmentTableProps {
  data: MonthlyPersonalReputationEnrollmentRecord[]
  loading: boolean
  onRefresh: () => void
  onEdit: (record: MonthlyPersonalReputationEnrollmentRecord) => void
  onExport: () => void
}

// 编辑模态框属性
export interface MonthlyPersonalReputationEnrollmentEditModalProps {
  open: boolean
  record: MonthlyPersonalReputationEnrollmentRecord | null
  onCancel: () => void
  onOk: (values: Partial<MonthlyPersonalReputationEnrollmentRecord>) => void
}

// 统计数据
export interface MonthlyPersonalReputationEnrollmentStats {
  totalMonths: number // 总月数
  totalTargetReputationVolume: number
  totalActualReputationVolume: number
  totalTargetWalkInVolume: number
  totalActualWalkInVolume: number
  totalTargetEnrollmentCount: number
  totalActualEnrollmentCount: number
  totalTargetRevenue: number
  totalActualRevenue: number
}
