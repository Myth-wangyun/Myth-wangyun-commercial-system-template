/**
 * 神殿教化司新生维稳月度个人统计表相关类型定义
 */

// 新生维稳月度个人统计记录
export interface NewStudentStabilityMonthlyPersonalRecord {
  key: string
  month: number // 月份
  teacherName: string // 班主任姓名
  handoverCount: number // 交接人数
  reportedCount: number // 报道人数
  stableClassHoursCount: number // 稳定过课时人数
  unstableClassHoursCount: number // 未过课时人数
  fullPaymentCount: number // 回全款人数
  outstandingFeesCount: number // 仍欠费人数
  outstandingFeesAmount: number // 欠费总金额
  refundCount: number // 退费人数
  refundRate: number // 新生退费率
  refundExplanation: string // 退费学员情况说明

  rowType: 'data' | 'monthly-total' | 'grand-total' // 行类型

  createdAt?: string
  updatedAt?: string
}

// 新生维稳月度个人统计表格组件属性
export interface NewStudentStabilityMonthlyPersonalTableProps {
  data: NewStudentStabilityMonthlyPersonalRecord[]
  loading: boolean
  onRefresh: () => void
  onEdit: (record: NewStudentStabilityMonthlyPersonalRecord) => void
  onDelete: (record: NewStudentStabilityMonthlyPersonalRecord) => void
  onExport: () => void
}

// 编辑模态框属性
export interface NewStudentStabilityMonthlyPersonalEditModalProps {
  open: boolean
  record: NewStudentStabilityMonthlyPersonalRecord | null
  onCancel: () => void
  onOk: (values: Partial<NewStudentStabilityMonthlyPersonalRecord>) => void
}

// 统计数据
export interface NewStudentStabilityMonthlyPersonalStats {
  totalMonths: number // 总月数
  totalTeachers: number // 总班主任数
  totalHandoverCount: number // 总交接人数
  totalReportedCount: number // 总报道人数
  totalStableClassHoursCount: number // 总稳定过课时人数
  totalUnstableClassHoursCount: number // 总未过课时人数
  totalFullPaymentCount: number // 总回全款人数
  totalOutstandingFeesCount: number // 总仍欠费人数
  totalOutstandingFeesAmount: number // 总欠费金额
  totalRefundCount: number // 总退费人数
  averageRefundRate: number // 平均退费率
}
