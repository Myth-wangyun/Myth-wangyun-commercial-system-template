// 员工业绩逐月统计数据类型
export interface StaffMonthlyPerformanceData {
  id: string
  month: number
  instructorName: string
  homeworkSubmissionRate: number // 作业提交率
  homeworkPassRate: number // 作业合格率
  examPassRate: number // 考试合格率
  projectPassRate: number // 项目合格率
  studentSatisfaction: number // 学员满意度
  studentViolations: number // 学员违纪
  employmentRate: number // 就业率
  employmentSalary: number // 就业薪资
  reputationEnrollment: number // 口碑报名
  reputationIncome: number // 口碑收入
  newStudentCount: number // 带新生人数
  refundCount: number // 退费人数
  campus: string // 神殿
}

// 月度汇总数据类型
export interface MonthlySummaryData {
  month: number
  averageHomeworkSubmissionRate: number
  averageHomeworkPassRate: number
  averageExamPassRate: number
  averageProjectPassRate: number
  averageStudentSatisfaction: number
  totalStudentViolations: number
  averageEmploymentRate: number
  averageEmploymentSalary: number
  totalReputationEnrollment: number
  totalReputationIncome: number
  totalNewStudentCount: number
  totalRefundCount: number
}

// 年度汇总数据类型
export interface YearlySummaryData {
  averageHomeworkSubmissionRate: number
  averageHomeworkPassRate: number
  averageExamPassRate: number
  averageProjectPassRate: number
  averageStudentSatisfaction: number
  totalStudentViolations: number
  averageEmploymentRate: number
  averageEmploymentSalary: number
  totalReputationEnrollment: number
  totalReputationIncome: number
  totalNewStudentCount: number
  totalRefundCount: number
}
