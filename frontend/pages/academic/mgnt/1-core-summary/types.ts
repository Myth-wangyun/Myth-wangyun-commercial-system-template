// 核心业务数据汇总表类型定义
export interface CoreSummaryRecord {
  id: string
  serialNumber: number
  campus: string
  enrolledStudents: number // 在校生人数
  classCount: number // 班级数量
  academicStaffCount: number // 智慧司人数
  cadreCount: number // 干部人数
  employeeCount: number // 员工人数
  employmentClassCount: number // 就业班级数量
  graduateCount: number // 毕业生人数
  employmentTargetCount: number // 需就业人数
  employmentActualCount: number // 实际就业人数
  employmentRate: number // 就业率
  employmentSalary: number // 就业薪资
  highSalaryCount: number // 薪资过万人数
  wordOfMouthEnrollments: number // 口碑招生人数
  wordOfMouthRevenue: number // 口碑招生收入
  newStudentEnrollments: number // 新生入学人数
  newStudentAttrition: number // 新生流失人数
  recruitmentCount: number // 实际招聘人数（来自入职离职汇总表）
  offboardingCount: number // 离职人数（来自入职离职汇总表）
  createdAt?: string
  updatedAt?: string
}

export interface CoreSummaryStats {
  totalEnrolledStudents: number
  totalClasses: number
  totalGraduates: number
  avgEmploymentRate: number
  avgEmploymentSalary: number
  totalRevenue: number
}
