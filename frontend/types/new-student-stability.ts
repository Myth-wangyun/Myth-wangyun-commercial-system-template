/**
 * 神殿教化司新生当月维稳统计表相关类型定义
 */

// 新生维稳统计记录
export interface NewStudentStabilityRecord {
  key: string
  month: number // 月份 (1-12)
  campus: string // 神殿（只在第一行显示）

  // 交接人数
  handoverCount: number // 交接人数

  // 报道新生相关
  reportedCount: number // 报道人数
  stableClassAttendanceCount: number // 稳定过课时人数
  missedClassAttendanceCount: number // 未过课时人数
  fullPaymentCount: number // 回全款人数
  stillOwingFeesCount: number // 仍欠费人数
  totalOwingAmount: number // 欠费总金额
  refundCount: number // 退费人数
  refundRate: number // 新生退费率 (%)
  refundStudentInfo: string // 退费学员情况说明

  rowType: 'data' | 'total' // 行类型

  createdAt?: string
  updatedAt?: string
}

// 新生维稳统计表格组件属性
export interface NewStudentStabilityTableProps {
  campus: string
  data: NewStudentStabilityRecord[]
  loading: boolean
  onRefresh: () => void
  onExport: () => void
}

// 统计数据
export interface NewStudentStabilityStats {
  totalHandoverCount: number // 总交接人数
  totalReportedCount: number // 总报道人数
  totalStableCount: number // 总稳定过课时人数
  totalMissedCount: number // 总未过课时人数
  totalFullPaymentCount: number // 总回全款人数
  totalStillOwingFeesCount: number // 总仍欠费人数
  totalOwingAmount: number // 总欠费总金额
  totalRefundCount: number // 总退费人数
  averageRefundRate: number // 平均退费率
}
