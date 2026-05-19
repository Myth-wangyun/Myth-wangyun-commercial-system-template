// [教质模块] 员工月度绩效服务
import {
  type StaffMonthlyPerformanceData,
  type MonthlySummaryData,
  type YearlySummaryData,
} from '../types/staffMonthlyPerformance'

// 模拟数据
const mockData: StaffMonthlyPerformanceData[] = [
  // 1月数据
  {
    id: '1-1',
    month: 1,
    instructorName: '张三',
    homeworkSubmissionRate: 95,
    homeworkPassRate: 88,
    examPassRate: 92,
    projectPassRate: 90,
    studentSatisfaction: 4.5,
    studentViolations: 2,
    employmentRate: 85,
    employmentSalary: 8500,
    reputationEnrollment: 15,
    reputationIncome: 45000,
    newStudentCount: 25,
    refundCount: 1,
    campus: '主神殿',
  },
  {
    id: '1-2',
    month: 1,
    instructorName: '李四',
    homeworkSubmissionRate: 92,
    homeworkPassRate: 85,
    examPassRate: 88,
    projectPassRate: 87,
    studentSatisfaction: 4.3,
    studentViolations: 1,
    employmentRate: 82,
    employmentSalary: 8200,
    reputationEnrollment: 12,
    reputationIncome: 36000,
    newStudentCount: 22,
    refundCount: 0,
    campus: '主神殿',
  },
  {
    id: '1-3',
    month: 1,
    instructorName: '王五',
    homeworkSubmissionRate: 98,
    homeworkPassRate: 92,
    examPassRate: 95,
    projectPassRate: 93,
    studentSatisfaction: 4.7,
    studentViolations: 0,
    employmentRate: 90,
    employmentSalary: 9200,
    reputationEnrollment: 18,
    reputationIncome: 54000,
    newStudentCount: 28,
    refundCount: 0,
    campus: '主神殿',
  },
  {
    id: '1-4',
    month: 1,
    instructorName: '赵六',
    homeworkSubmissionRate: 90,
    homeworkPassRate: 82,
    examPassRate: 85,
    projectPassRate: 83,
    studentSatisfaction: 4.1,
    studentViolations: 3,
    employmentRate: 78,
    employmentSalary: 7800,
    reputationEnrollment: 10,
    reputationIncome: 30000,
    newStudentCount: 20,
    refundCount: 2,
    campus: '主神殿',
  },

  // 2月数据
  {
    id: '2-1',
    month: 2,
    instructorName: '张三',
    homeworkSubmissionRate: 96,
    homeworkPassRate: 89,
    examPassRate: 93,
    projectPassRate: 91,
    studentSatisfaction: 4.6,
    studentViolations: 1,
    employmentRate: 87,
    employmentSalary: 8700,
    reputationEnrollment: 16,
    reputationIncome: 48000,
    newStudentCount: 26,
    refundCount: 0,
    campus: '主神殿',
  },
  {
    id: '2-2',
    month: 2,
    instructorName: '李四',
    homeworkSubmissionRate: 93,
    homeworkPassRate: 86,
    examPassRate: 89,
    projectPassRate: 88,
    studentSatisfaction: 4.4,
    studentViolations: 2,
    employmentRate: 84,
    employmentSalary: 8400,
    reputationEnrollment: 13,
    reputationIncome: 39000,
    newStudentCount: 23,
    refundCount: 1,
    campus: '主神殿',
  },
  {
    id: '2-3',
    month: 2,
    instructorName: '王五',
    homeworkSubmissionRate: 99,
    homeworkPassRate: 93,
    examPassRate: 96,
    projectPassRate: 94,
    studentSatisfaction: 4.8,
    studentViolations: 0,
    employmentRate: 92,
    employmentSalary: 9400,
    reputationEnrollment: 19,
    reputationIncome: 57000,
    newStudentCount: 29,
    refundCount: 0,
    campus: '主神殿',
  },
  {
    id: '2-4',
    month: 2,
    instructorName: '赵六',
    homeworkSubmissionRate: 91,
    homeworkPassRate: 83,
    examPassRate: 86,
    projectPassRate: 84,
    studentSatisfaction: 4.2,
    studentViolations: 2,
    employmentRate: 80,
    employmentSalary: 8000,
    reputationEnrollment: 11,
    reputationIncome: 33000,
    newStudentCount: 21,
    refundCount: 1,
    campus: '主神殿',
  },

  // 3月数据
  {
    id: '3-1',
    month: 3,
    instructorName: '张三',
    homeworkSubmissionRate: 97,
    homeworkPassRate: 90,
    examPassRate: 94,
    projectPassRate: 92,
    studentSatisfaction: 4.7,
    studentViolations: 0,
    employmentRate: 89,
    employmentSalary: 8900,
    reputationEnrollment: 17,
    reputationIncome: 51000,
    newStudentCount: 27,
    refundCount: 0,
    campus: '主神殿',
  },
  {
    id: '3-2',
    month: 3,
    instructorName: '李四',
    homeworkSubmissionRate: 94,
    homeworkPassRate: 87,
    examPassRate: 90,
    projectPassRate: 89,
    studentSatisfaction: 4.5,
    studentViolations: 1,
    employmentRate: 86,
    employmentSalary: 8600,
    reputationEnrollment: 14,
    reputationIncome: 42000,
    newStudentCount: 24,
    refundCount: 0,
    campus: '主神殿',
  },
  {
    id: '3-3',
    month: 3,
    instructorName: '王五',
    homeworkSubmissionRate: 100,
    homeworkPassRate: 94,
    examPassRate: 97,
    projectPassRate: 95,
    studentSatisfaction: 4.9,
    studentViolations: 0,
    employmentRate: 94,
    employmentSalary: 9600,
    reputationEnrollment: 20,
    reputationIncome: 60000,
    newStudentCount: 30,
    refundCount: 0,
    campus: '主神殿',
  },
  {
    id: '3-4',
    month: 3,
    instructorName: '赵六',
    homeworkSubmissionRate: 92,
    homeworkPassRate: 84,
    examPassRate: 87,
    projectPassRate: 85,
    studentSatisfaction: 4.3,
    studentViolations: 1,
    employmentRate: 82,
    employmentSalary: 8200,
    reputationEnrollment: 12,
    reputationIncome: 36000,
    newStudentCount: 22,
    refundCount: 1,
    campus: '主神殿',
  },

  // 其他月份数据（4-12月）
  ...Array.from({ length: 9 }, (_, monthIndex) => {
    const month = monthIndex + 4
    return [
      {
        id: `${month}-1`,
        month,
        instructorName: '张三',
        homeworkSubmissionRate: 95 + Math.floor(Math.random() * 5),
        homeworkPassRate: 88 + Math.floor(Math.random() * 5),
        examPassRate: 92 + Math.floor(Math.random() * 5),
        projectPassRate: 90 + Math.floor(Math.random() * 5),
        studentSatisfaction: 4.5 + Math.random() * 0.4,
        studentViolations: Math.floor(Math.random() * 3),
        employmentRate: 85 + Math.floor(Math.random() * 10),
        employmentSalary: 8500 + Math.floor(Math.random() * 1000),
        reputationEnrollment: 15 + Math.floor(Math.random() * 5),
        reputationIncome: 45000 + Math.floor(Math.random() * 10000),
        newStudentCount: 25 + Math.floor(Math.random() * 5),
        refundCount: Math.floor(Math.random() * 2),
        campus: '主神殿',
      },
      {
        id: `${month}-2`,
        month,
        instructorName: '李四',
        homeworkSubmissionRate: 92 + Math.floor(Math.random() * 5),
        homeworkPassRate: 85 + Math.floor(Math.random() * 5),
        examPassRate: 88 + Math.floor(Math.random() * 5),
        projectPassRate: 87 + Math.floor(Math.random() * 5),
        studentSatisfaction: 4.3 + Math.random() * 0.4,
        studentViolations: Math.floor(Math.random() * 3),
        employmentRate: 82 + Math.floor(Math.random() * 10),
        employmentSalary: 8200 + Math.floor(Math.random() * 1000),
        reputationEnrollment: 12 + Math.floor(Math.random() * 5),
        reputationIncome: 36000 + Math.floor(Math.random() * 10000),
        newStudentCount: 22 + Math.floor(Math.random() * 5),
        refundCount: Math.floor(Math.random() * 2),
        campus: '主神殿',
      },
      {
        id: `${month}-3`,
        month,
        instructorName: '王五',
        homeworkSubmissionRate: 98 + Math.floor(Math.random() * 2),
        homeworkPassRate: 92 + Math.floor(Math.random() * 3),
        examPassRate: 95 + Math.floor(Math.random() * 3),
        projectPassRate: 93 + Math.floor(Math.random() * 3),
        studentSatisfaction: 4.7 + Math.random() * 0.2,
        studentViolations: Math.floor(Math.random() * 2),
        employmentRate: 90 + Math.floor(Math.random() * 8),
        employmentSalary: 9200 + Math.floor(Math.random() * 1000),
        reputationEnrollment: 18 + Math.floor(Math.random() * 5),
        reputationIncome: 54000 + Math.floor(Math.random() * 10000),
        newStudentCount: 28 + Math.floor(Math.random() * 5),
        refundCount: Math.floor(Math.random() * 2),
        campus: '主神殿',
      },
      {
        id: `${month}-4`,
        month,
        instructorName: '赵六',
        homeworkSubmissionRate: 90 + Math.floor(Math.random() * 5),
        homeworkPassRate: 82 + Math.floor(Math.random() * 5),
        examPassRate: 85 + Math.floor(Math.random() * 5),
        projectPassRate: 83 + Math.floor(Math.random() * 5),
        studentSatisfaction: 4.1 + Math.random() * 0.4,
        studentViolations: Math.floor(Math.random() * 4),
        employmentRate: 78 + Math.floor(Math.random() * 10),
        employmentSalary: 7800 + Math.floor(Math.random() * 1000),
        reputationEnrollment: 10 + Math.floor(Math.random() * 5),
        reputationIncome: 30000 + Math.floor(Math.random() * 10000),
        newStudentCount: 20 + Math.floor(Math.random() * 5),
        refundCount: Math.floor(Math.random() * 3),
        campus: '主神殿',
      },
    ]
  }).flat(),
]

// 获取员工业绩逐月统计数据
export const getStaffMonthlyPerformanceData = (campus?: string): StaffMonthlyPerformanceData[] => {
  if (campus) {
    return mockData.filter((item) => item.campus === campus)
  }
  return mockData
}

// 获取月度汇总数据
export const getMonthlySummaryData = (month: number, campus?: string): MonthlySummaryData => {
  const monthData = mockData.filter(
    (item) => item.month === month && (!campus || item.campus === campus),
  )

  if (monthData.length === 0) {
    return {
      month,
      averageHomeworkSubmissionRate: 0,
      averageHomeworkPassRate: 0,
      averageExamPassRate: 0,
      averageProjectPassRate: 0,
      averageStudentSatisfaction: 0,
      totalStudentViolations: 0,
      averageEmploymentRate: 0,
      averageEmploymentSalary: 0,
      totalReputationEnrollment: 0,
      totalReputationIncome: 0,
      totalNewStudentCount: 0,
      totalRefundCount: 0,
    }
  }

  return {
    month,
    averageHomeworkSubmissionRate:
      monthData.reduce((sum, item) => sum + item.homeworkSubmissionRate, 0) / monthData.length,
    averageHomeworkPassRate:
      monthData.reduce((sum, item) => sum + item.homeworkPassRate, 0) / monthData.length,
    averageExamPassRate:
      monthData.reduce((sum, item) => sum + item.examPassRate, 0) / monthData.length,
    averageProjectPassRate:
      monthData.reduce((sum, item) => sum + item.projectPassRate, 0) / monthData.length,
    averageStudentSatisfaction:
      monthData.reduce((sum, item) => sum + item.studentSatisfaction, 0) / monthData.length,
    totalStudentViolations: monthData.reduce((sum, item) => sum + item.studentViolations, 0),
    averageEmploymentRate:
      monthData.reduce((sum, item) => sum + item.employmentRate, 0) / monthData.length,
    averageEmploymentSalary:
      monthData.reduce((sum, item) => sum + item.employmentSalary, 0) / monthData.length,
    totalReputationEnrollment: monthData.reduce((sum, item) => sum + item.reputationEnrollment, 0),
    totalReputationIncome: monthData.reduce((sum, item) => sum + item.reputationIncome, 0),
    totalNewStudentCount: monthData.reduce((sum, item) => sum + item.newStudentCount, 0),
    totalRefundCount: monthData.reduce((sum, item) => sum + item.refundCount, 0),
  }
}

// 获取年度汇总数据
export const getYearlySummaryData = (campus?: string): YearlySummaryData => {
  const allData = campus ? mockData.filter((item) => item.campus === campus) : mockData

  if (allData.length === 0) {
    return {
      averageHomeworkSubmissionRate: 0,
      averageHomeworkPassRate: 0,
      averageExamPassRate: 0,
      averageProjectPassRate: 0,
      averageStudentSatisfaction: 0,
      totalStudentViolations: 0,
      averageEmploymentRate: 0,
      averageEmploymentSalary: 0,
      totalReputationEnrollment: 0,
      totalReputationIncome: 0,
      totalNewStudentCount: 0,
      totalRefundCount: 0,
    }
  }

  return {
    averageHomeworkSubmissionRate:
      allData.reduce((sum, item) => sum + item.homeworkSubmissionRate, 0) / allData.length,
    averageHomeworkPassRate:
      allData.reduce((sum, item) => sum + item.homeworkPassRate, 0) / allData.length,
    averageExamPassRate: allData.reduce((sum, item) => sum + item.examPassRate, 0) / allData.length,
    averageProjectPassRate:
      allData.reduce((sum, item) => sum + item.projectPassRate, 0) / allData.length,
    averageStudentSatisfaction:
      allData.reduce((sum, item) => sum + item.studentSatisfaction, 0) / allData.length,
    totalStudentViolations: allData.reduce((sum, item) => sum + item.studentViolations, 0),
    averageEmploymentRate:
      allData.reduce((sum, item) => sum + item.employmentRate, 0) / allData.length,
    averageEmploymentSalary:
      allData.reduce((sum, item) => sum + item.employmentSalary, 0) / allData.length,
    totalReputationEnrollment: allData.reduce((sum, item) => sum + item.reputationEnrollment, 0),
    totalReputationIncome: allData.reduce((sum, item) => sum + item.reputationIncome, 0),
    totalNewStudentCount: allData.reduce((sum, item) => sum + item.newStudentCount, 0),
    totalRefundCount: allData.reduce((sum, item) => sum + item.refundCount, 0),
  }
}

// 添加或更新员工业绩数据
export const addOrUpdateStaffMonthlyPerformance = (
  data: Omit<StaffMonthlyPerformanceData, 'id'>,
): StaffMonthlyPerformanceData => {
  const newData: StaffMonthlyPerformanceData = {
    ...data,
    id: `${data.month}-${data.instructorName}-${Date.now()}`,
  }

  // 在实际应用中，这里会调用API
  console.log('添加或更新员工业绩数据:', newData)

  return newData
}

// 删除员工业绩数据
export const deleteStaffMonthlyPerformance = (id: string): void => {
  // 在实际应用中，这里会调用API
  console.log('删除员工业绩数据:', id)
}
