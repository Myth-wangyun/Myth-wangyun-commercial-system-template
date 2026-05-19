/**
 * 神殿教化司新生仍欠费明细表相关类型定义
 */

// 新生仍欠费明细记录
export interface OutstandingFeesDetailRecord {
  key: string
  serialNumber: number // 序号
  teacherName: string // 班主任姓名
  studentName: string // 新生姓名
  registrationTime: string // 报名时间
  reportingTime: string // 报道时间
  major: string // 报名专业
  academicSystem: string // 报名学制
  receivableTuition: number // 应收学费
  registrationPayment: number // 报名交费金额
  supplementaryPayment: number // 补款金额
  outstandingAmount: number // 仍欠费金额
  isFullPayment: string // 是否全款（是/否）
  isLoan: string // 是否贷款（是/否）
  exceededClassHours: string // 是否过课时（是/否）
  trialPeriod: string // 试学周期
  isRefunded: string // 是否退费（是/否）
  refundExplanation: string // 退费情况说明
  consultant: string // 咨询师
  isAccommodation: string // 是否住宿（是/否）
  dormitoryName: string // 宿舍名称
  remarks: string // 备注

  rowType: 'data' | 'total' // 行类型

  createdAt?: string
  updatedAt?: string
}

// 新生仍欠费明细表格组件属性
export interface OutstandingFeesDetailTableProps {
  data: OutstandingFeesDetailRecord[]
  loading: boolean
  onRefresh: () => void
  onEdit: (record: OutstandingFeesDetailRecord) => void
  onDelete: (record: OutstandingFeesDetailRecord) => void
  onExport: () => void
}

// 编辑模态框属性
export interface OutstandingFeesDetailEditModalProps {
  open: boolean
  record: OutstandingFeesDetailRecord | null
  onCancel: () => void
  onOk: (values: Partial<OutstandingFeesDetailRecord>) => void
}

// 统计数据
export interface OutstandingFeesDetailStats {
  totalRecords: number // 总记录数
  totalReceivableTuition: number // 总应收学费
  totalRegistrationPayment: number // 总报名交费金额
  totalSupplementaryPayment: number // 总补款金额
  totalOutstandingAmount: number // 总仍欠费金额
}
