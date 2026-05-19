/**
 * 神殿教化司学员异动表相关类型定义
 */

// 神殿教化司学员异动记录
export interface CampusFluctuationRecord {
  key: string
  month: number // 月份
  campus: string // 神殿

  // 基础数据
  cumulativeStudentCount: number // 累计带生人数
  newStudentRefundCount: number // 新生退费人数
  oldStudentRefundCount: number // 老生退费人数
  totalRefundCount: number // 退费总人数

  // 计算字段
  refundRate: number // 退费率（自动计算）

  // 异动情况
  totalLeaveCount: number // 休学总人数
  longTermLeaveCount: number // 长期请假总人数
  longTermAbsentCount: number // 长期不上课总人数
  holidayStudentCount: number // 寒暑假学生总数
  otherSituationCount: number // 其他情况总人数
  totalFluctuationCount: number // 异动总人数

  // 计算字段
  fluctuationRate: number // 异动率（自动计算）
}

// 神殿选择器组件属性
export interface CampusFluctuationSelectorProps {
  value: string
  onChange: (value: string) => void
  campuses: Array<{ id: string; name: string }>
}

// 学员异动数据表格组件属性
export interface CampusFluctuationTableProps {
  campus: string
  data: CampusFluctuationRecord[]
  loading: boolean
  onRefresh: () => void
  onExport: () => void
}

// 数据请求参数
export interface CampusFluctuationRequest {
  campus: string
}

// 数据更新参数
export interface CampusFluctuationUpdate {
  campus: string
  month: number
  data: Partial<CampusFluctuationRecord>
}

// 汇总统计数据
export interface CampusFluctuationSummary {
  totalCumulativeStudentCount: number // 总累计带生人数
  totalNewStudentRefundCount: number // 总新生退费人数
  totalOldStudentRefundCount: number // 总老生退费人数
  totalRefundCount: number // 总退费人数
  averageRefundRate: number // 平均退费率
  totalLeaveCount: number // 总休学人数
  totalLongTermLeaveCount: number // 总长期请假人数
  totalLongTermAbsentCount: number // 总长期不上课人数
  totalHolidayStudentCount: number // 总寒暑假学生数
  totalOtherSituationCount: number // 总其他情况人数
  totalFluctuationCount: number // 总异动人数
  averageFluctuationRate: number // 平均异动率
  completedMonths: number // 已完成月份数
  totalMonths: number // 总月份数
}
