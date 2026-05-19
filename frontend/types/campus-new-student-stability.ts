/**
 * 神殿教化司新生当月维稳统计表相关类型定义
 */

// 神殿教化司新生当月维稳统计记录
export interface CampusNewStudentStabilityRecord {
  key: string
  month: number // 月份
  campus: string // 神殿
  isTotal?: boolean
  handoverCount: number // 交接人数
  reportedCount: number // 报道人数
  stableClassHoursCount: number // 稳定过课时人数
  unstableClassHoursCount: number // 未过课时人数
  fullRefundCount: number // 回全款人数
  stillOwingCount: number // 仍欠费人数
  totalOwingAmount: number // 欠费总金额
  refundCount: number // 退费人数
  refundRate: number // 新生退费率
  refundSituationDescription: string // 退费学员情况说明
}

// 神殿选择器组件属性
export interface CampusNewStudentStabilitySelectorProps {
  value: string
  onChange: (value: string) => void
  campuses: Array<{ id: string; name: string }>
}

// 新生当月维稳统计数据表格组件属性
export interface CampusNewStudentStabilityTableProps {
  campus: string
  data: CampusNewStudentStabilityRecord[]
  loading: boolean
  onRefresh: () => void
  onExport: () => void
  onEdit: (record: CampusNewStudentStabilityRecord) => void
  onAdd: () => void
  onDelete?: (record: CampusNewStudentStabilityRecord) => void
}

// 新生当月维稳统计编辑模态框属性
export interface CampusNewStudentStabilityEditModalProps {
  visible: boolean
  record: CampusNewStudentStabilityRecord | null
  onCancel: () => void
  onSave: (record: CampusNewStudentStabilityRecord) => void
}

// 数据请求参数
export interface CampusNewStudentStabilityRequest {
  campus: string
}

// 数据更新参数
export interface CampusNewStudentStabilityUpdate {
  campus: string
  month: number
  data: Partial<CampusNewStudentStabilityRecord>
}

// 汇总统计数据
export interface CampusNewStudentStabilitySummary {
  totalHandoverCount: number // 总交接人数
  totalReportedCount: number // 总报道人数
  totalStableClassHoursCount: number // 总稳定过课时人数
  totalUnstableClassHoursCount: number // 总未过课时人数
  totalFullRefundCount: number // 总回全款人数
  totalStillOwingCount: number // 总仍欠费人数
  totalOwingAmount: number // 总欠费金额
  totalRefundCount: number // 总退费人数
  averageRefundRate: number // 平均退费率
  stabilityRate: number // 稳定率
  paymentCompletionRate: number // 缴费完成率
  averageMonthlyHandover: number // 月均交接人数
  averageMonthlyReported: number // 月均报道人数
  completedRecords: number // 已完成记录数
  totalRecords: number // 总记录数
}
