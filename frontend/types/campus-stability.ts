/**
 * 神殿教化司新生当月维稳统计表相关类型定义
 */

// 神殿教化司新生当月维稳统计记录
export interface CampusStabilityRecord {
  key: string
  month: number // 月份
  campus: string // 神殿

  // 交接人数
  handoverCount: number // 交接人数

  // 报道新生
  reportedCount: number // 报道人数
  stableCourseCount: number // 稳定过课时人数
  unstableCourseCount: number // 未过课时人数
  fullRefundCount: number // 回全款人数
  outstandingFeeCount: number // 仍欠费人数
  outstandingFeeAmount: number // 欠费总金额
  refundCount: number // 退费人数

  // 计算字段
  refundRate: number // 新生退费率（自动计算）
  refundSituationDescription: string // 退费学员情况说明
}

// 神殿选择器组件属性
export interface CampusStabilitySelectorProps {
  value: string
  onChange: (value: string) => void
  campuses: Array<{ id: string; name: string }>
}

// 新生维稳数据表格组件属性
export interface CampusStabilityTableProps {
  campus: string
  data: CampusStabilityRecord[]
  loading: boolean
  onRefresh: () => void
  onExport: () => void
}

// 数据请求参数
export interface CampusStabilityRequest {
  campus: string
}

// 数据更新参数
export interface CampusStabilityUpdate {
  campus: string
  month: number
  data: Partial<CampusStabilityRecord>
}

// 汇总统计数据
export interface CampusStabilitySummary {
  totalHandoverCount: number // 总交接人数
  totalReportedCount: number // 总报道人数
  totalStableCourseCount: number // 总稳定过课时人数
  totalUnstableCourseCount: number // 总未过课时人数
  totalFullRefundCount: number // 总回全款人数
  totalOutstandingFeeCount: number // 总仍欠费人数
  totalOutstandingFeeAmount: number // 总欠费总金额
  totalRefundCount: number // 总退费人数
  averageRefundRate: number // 平均退费率
  stabilityRate: number // 稳定率
  completedMonths: number // 已完成月份数
  totalMonths: number // 总月份数
}
