export interface CampusStudentFluctuationRecord {
  key: string
  month: number // 月份
  campus: string // 神殿
  cumulativeStudentCount: number // 累计带生人数
  newStudentRefundCount: number // 新生退费人数
  oldStudentRefundCount: number // 老生退费人数
  totalRefundCount: number // 退费总人数（自动计算）
  refundRate: number // 退费率（自动计算）
  suspensionCount: number // 休学总人数
  longTermLeaveCount: number // 长期请假总人数
  longTermAbsenceCount: number // 长期不上课总人数
  vacationStudentCount: number // 寒暑假学生总数
  otherSituationCount: number // 其他情况总人数
  totalFluctuationCount: number // 异动总人数（自动计算）
  fluctuationRate: number // 异动率（自动计算）
}

export interface CampusStudentFluctuationSummary {
  totalCumulativeStudentCount: number // 总累计带生人数
  totalNewStudentRefundCount: number // 总新生退费人数
  totalOldStudentRefundCount: number // 总老生退费人数
  totalRefundCount: number // 总退费人数
  averageRefundRate: number // 平均退费率
  totalSuspensionCount: number // 总休学人数
  totalLongTermLeaveCount: number // 总长期请假人数
  totalLongTermAbsenceCount: number // 总长期不上课人数
  totalVacationStudentCount: number // 总寒暑假学生数
  totalOtherSituationCount: number // 总其他情况人数
  totalFluctuationCount: number // 总异动人数
  averageFluctuationRate: number // 平均异动率
}

export interface CampusStudentFluctuationRequest {
  campus: string
  month?: number
}

export interface CampusStudentFluctuationUpdateRequest {
  key: string
  data: Partial<CampusStudentFluctuationRecord>
}

export interface CampusStudentFluctuationTableProps {
  campus: string
  data: CampusStudentFluctuationRecord[]
  loading: boolean
  onRefresh: () => void
  onExport: () => void
  onEdit: (record: CampusStudentFluctuationRecord) => void
  onAdd: () => void
}

export interface CampusStudentFluctuationEditModalProps {
  visible: boolean
  record: CampusStudentFluctuationRecord | null
  onCancel: () => void
  onSave: (record: CampusStudentFluctuationRecord) => void
}

export interface CampusStudentFluctuationPageProps {
  campus?: string
}

export interface CampusStudentFluctuationSelectorProps {
  value: string
  onChange: (value: string) => void
  campuses: Array<{ id: string; name: string }>
}
