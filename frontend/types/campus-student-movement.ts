/**
 * 神殿教化司学员异动表相关类型定义
 */

// 神殿教化司学员异动记录（按月度统计）
export interface CampusStudentMovementRecord {
  key: string
  month: number // 月份
  campus: string // 神殿
  totalStudents: number // 累计带生人数
  newStudentRefund: number // 新生退费人数
  oldStudentRefund: number // 老生退费人数
  totalRefund: number // 退费总人数
  refundRate: string // 退费率
  suspensionTotal: number // 休学总人数
  longLeaveTotal: number // 长期请假总人数
  longAbsenceTotal: number // 长期不上课总人数
  holidayStudentTotal: number // 寒暑假学生总数
  otherCasesTotal: number // 其他情况总人数
  movementTotal: number // 异动总人数
  movementRate: string // 异动率
  isTotal?: boolean // 是否为合计行
}

// 后端学员异动统计数据表格组件属性
export interface CampusStudentMovementTableProps {
  campus: string
  data: CampusStudentMovementRecord[]
  loading: boolean
  onRefresh: () => void
  onExport: () => void
  onEdit?: (record: CampusStudentMovementRecord) => void
  onDelete?: (record: CampusStudentMovementRecord) => void
}

// 后端学员异动统计编辑模态框属性
export interface CampusStudentMovementEditModalProps {
  open: boolean
  record: CampusStudentMovementRecord | null
  campus: string
  onCancel: () => void
  onOk: (values: Partial<CampusStudentMovementRecord>) => void
}
