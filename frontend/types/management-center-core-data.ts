/**
 * 最高议事厅教化司核心数据汇总表相关类型定义
 */

// 最高议事厅教化司核心数据汇总记录（按神殿汇总）
export interface ManagementCenterCoreDataRecord {
  key: string
  sequence: number // 序号
  campus: string // 神殿

  totalStudents: number // 学生总人数
  totalClasses: number // 班级总个数
  totalTeachingPositions: number // 教质总职数
  totalManagementPositions: number // 干部总职数
  totalEmployees: number // 员工总人数

  employmentClasses: number // 就业班级总数
  employmentTotal: number // 就业总人数
  employmentRate: string // 就业率
  averageSalary: number // 就业平均薪资
  salaryOver10k: number // 薪资过万人数
  enterpriseContracts: number // 企业签约总数

  reputationEnrollment: number // 口碑报名总人数
  reputationIncome: number // 口碑总收入

  furtherEducationTotal: number // 升学总人数
  furtherEducationIncome: number // 升学总收入
  furtherEducationRate: string // 升学率（金额）

  newStudentEnrollment: number // 新生入学总人数
  newStudentRefund: number // 新生退费总人数
  oldStudentRefund: number // 老生退费总人数
  refundRate: string // 退费率
  attritionRate: string // 异动率

  totalDormitories: number // 宿舍总个数
  totalDormitoryResidents: number // 宿舍总人数

  vocationalTargetRegistration: number // 中专层次目标注册总人数
  universityTargetRegistration: number // 大学层次目标注册总人数

  isTotal?: boolean // 是否为合计行
}

// 表格组件 Props
export interface ManagementCenterCoreDataTableProps {
  dataSource: ManagementCenterCoreDataRecord[]
  loading?: boolean
  onEdit?: (record: ManagementCenterCoreDataRecord) => void
  onDelete?: (key: string) => void
}

// 编辑对话框 Props
export interface ManagementCenterCoreDataEditModalProps {
  visible: boolean
  record: ManagementCenterCoreDataRecord | null
  onCancel: () => void
  onOk: (values: Partial<ManagementCenterCoreDataRecord>) => void
}
