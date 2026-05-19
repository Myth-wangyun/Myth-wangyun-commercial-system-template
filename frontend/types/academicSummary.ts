// 智慧司核心数据汇总表接口
export interface AcademicSummaryData {
  id: string
  serialNumber: number
  campusId: string
  campusName: string
  enrolledStudents: number // 在校生人数
  classCount: number // 班级数量
  academicStaffCount: number // 智慧司人数
  cadreCount: number // 干部人数
  employeeCount: number // 员工人数
  employmentClassCount: number // 就业班级数量
  graduateCount: number // 毕业生人数
  employmentRate: number // 就业率 (百分比)
  employmentSalary: number // 就业薪资 (平均薪资)
  highSalaryCount: number // 薪资过万人数
  wordOfMouthAdmissions: number // 口碑招生人数
  wordOfMouthRevenue: number // 口碑招生收入
  newStudentEnrollments: number // 新生入学人数
  newStudentAttrition: number // 新生流失人数
  createdAt: string
  updatedAt: string
}

// 查询参数接口
export interface AcademicSummaryQueryParams {
  campusId?: string
  startDate?: string
  endDate?: string
  page?: number
  pageSize?: number
}

// 统计数据接口
export interface AcademicSummaryStats {
  totalCampuses: number
  totalEnrolledStudents: number
  totalClasses: number
  totalAcademicStaff: number
  totalGraduates: number
  averageEmploymentRate: number
  averageSalary: number
  totalRevenue: number
}

// 创建请求接口
export interface CreateAcademicSummaryRequest {
  campusId: string
  enrolledStudents: number
  classCount: number
  academicStaffCount: number
  cadreCount: number
  employeeCount: number
  employmentClassCount: number
  graduateCount: number
  employmentRate: number
  employmentSalary: number
  highSalaryCount: number
  wordOfMouthAdmissions: number
  wordOfMouthRevenue: number
  newStudentEnrollments: number
  newStudentAttrition: number
}

// 更新请求接口
export interface UpdateAcademicSummaryRequest extends Partial<CreateAcademicSummaryRequest> {
  id: string
}

// 默认数据
export const DEFAULT_ACADEMIC_SUMMARY: CreateAcademicSummaryRequest = {
  campusId: '',
  enrolledStudents: 0,
  classCount: 0,
  academicStaffCount: 0,
  cadreCount: 0,
  employeeCount: 0,
  employmentClassCount: 0,
  graduateCount: 0,
  employmentRate: 0,
  employmentSalary: 0,
  highSalaryCount: 0,
  wordOfMouthAdmissions: 0,
  newStudentEnrollments: 0,
  newStudentAttrition: 0,
  wordOfMouthRevenue: 0,
}
