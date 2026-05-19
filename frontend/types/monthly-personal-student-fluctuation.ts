/**
 * 神殿教化司月度个人统计学员异动表相关类型定义
 */

// 月度个人统计学员异动记录
export interface MonthlyPersonalStudentFluctuationRecord {
  key: string
  month: number // 月份
  teacherName: string // 班主任姓名
  cumulativeStudentCount: number // 累计带生人数
  newStudentRefundCount: number // 新生退费人数
  oldStudentRefundCount: number // 老生退费人数
  totalRefundCount: number // 退费总人数
  refundRate: number // 退费率
  totalSuspensionCount: number // 休学总人数
  totalLongTermLeaveCount: number // 长期请假总人数
  totalLongTermAbsenteeCount: number // 长期不上课总人数
  winterSummerBreakCount: number // 寒暑假学生总数
  otherSituationsCount: number // 其他情况总人数
  totalFluctuationCount: number // 异动总人数
  fluctuationRate: number // 异动率

  rowType: 'data' | 'monthly-total' | 'grand-total' // 行类型

  createdAt?: string
  updatedAt?: string
}

// 月度个人统计学员异动表格组件属性
export interface MonthlyPersonalStudentFluctuationTableProps {
  data: MonthlyPersonalStudentFluctuationRecord[]
  loading: boolean
  onRefresh: () => void
  onEdit: (record: MonthlyPersonalStudentFluctuationRecord) => void
  onDelete: (record: MonthlyPersonalStudentFluctuationRecord) => void
  onExport: () => void
}

// 编辑模态框属性
export interface MonthlyPersonalStudentFluctuationEditModalProps {
  open: boolean
  record: MonthlyPersonalStudentFluctuationRecord | null
  onCancel: () => void
  onOk: (values: Partial<MonthlyPersonalStudentFluctuationRecord>) => void
}

// 统计数据
export interface MonthlyPersonalStudentFluctuationStats {
  totalMonths: number // 总月数
  totalTeachers: number // 总班主任数
  totalCumulativeStudentCount: number // 总累计带生人数
  totalNewStudentRefundCount: number // 总新生退费人数
  totalOldStudentRefundCount: number // 总老生退费人数
  totalRefundCount: number // 总退费人数
  averageRefundRate: number // 平均退费率
  totalSuspensionCount: number // 总休学人数
  totalLongTermLeaveCount: number // 总长期请假人数
  totalLongTermAbsenteeCount: number // 总长期不上课人数
  totalWinterSummerBreakCount: number // 总寒暑假学生数
  totalOtherSituationsCount: number // 总其他情况人数
  totalFluctuationCount: number // 总异动人数
  averageFluctuationRate: number // 平均异动率
}
