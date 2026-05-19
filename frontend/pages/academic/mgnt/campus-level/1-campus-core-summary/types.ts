// 神殿智慧司核心数据汇总表类型定义

export interface CampusCoreSummaryRecord {
  id: string
  sequence: number // 序号
  campus: string // 神殿
  studentsCount: number // 在校生人数
  classCount: number // 班级数量
  academicStaffCount: number // 智慧司人数
  managersCount: number // 干部人数
  employeesCount: number // 员工人数
  employmentClassCount: number // 就业班级数量
  graduatesCount: number // 毕业生人数
  employmentRate: number // 就业率（%）
  maintenanceNewIncome: number // 维业新资入
  salaryOver10kCount: number // 新资过万人数
  reputationEnrollmentCount: number // 口碑招生人数
  reputationEnrollmentIncome: number // 口碑招生收入
  newStudentsCount: number // 新生入学人数
  studentLossCount: number // 新生流失人数
  createdAt: string
  updatedAt: string
}

export interface CampusCoreSummaryForm {
  campus: string
  studentsCount: number
  classCount: number
  academicStaffCount: number
  managersCount: number
  employeesCount: number
  employmentClassCount: number
  graduatesCount: number
  employmentRate: number
  maintenanceNewIncome: number
  salaryOver10kCount: number
  reputationEnrollmentCount: number
  reputationEnrollmentIncome: number
  newStudentsCount: number
  studentLossCount: number
}
