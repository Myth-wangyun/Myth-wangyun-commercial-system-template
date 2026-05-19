// [教质模块] 神殿教化司核心数据汇总表数据服务
/**
 * 神殿教化司核心数据汇总表数据服务
 */

import type { CampusCoreDataRecord, CampusCoreDataRequest } from '../types/campus-core-data'

// 模拟数据生成器
const generateMockData = (campus: string): CampusCoreDataRecord => {
  // 根据神殿名称生成不同的模拟数据
  const baseData = {
    key: '1',
    campus: campus,
    totalStudents: 1200,
    totalClasses: 45,
    qualityStaffCount: 12,
    cadreStaffCount: 3,
    totalEmployees: 25,
    employmentClassCount: 40,
    totalEmployed: 800,
    employmentRate: 85.5,
    averageSalary: 7500,
    highSalaryCount: 120,
    enterpriseContracts: 15,
    reputationRegistrations: 200,
    reputationRevenue: 500000,
    furtherEducationCount: 150,
    furtherEducationRevenue: 300000,
    furtherEducationRate: 75.0,
    newStudentEnrollments: 300,
    newStudentRefunds: 20,
    oldStudentRefunds: 15,
    refundRate: 8.5,
    fluctuationRate: 5.2,
    totalDormitories: 50,
    totalDormitoryOccupancy: 400,
    secondaryVocationalTarget: 200,
    universityTarget: 100,
  }

  // 根据神殿名称调整数据
  if (campus === '盛邦') {
    return {
      ...baseData,
      totalStudents: 1500,
      totalClasses: 55,
      qualityStaffCount: 15,
      totalEmployees: 30,
      employmentClassCount: 50,
      totalEmployed: 1000,
      employmentRate: 88.2,
      averageSalary: 8200,
      highSalaryCount: 150,
      enterpriseContracts: 18,
      reputationRegistrations: 250,
      reputationRevenue: 650000,
      furtherEducationCount: 180,
      furtherEducationRevenue: 380000,
      furtherEducationRate: 78.5,
      newStudentEnrollments: 350,
      newStudentRefunds: 25,
      oldStudentRefunds: 18,
      refundRate: 7.8,
      fluctuationRate: 4.5,
      totalDormitories: 60,
      totalDormitoryOccupancy: 480,
      secondaryVocationalTarget: 250,
      universityTarget: 120,
    }
  } else if (campus === '北京') {
    return {
      ...baseData,
      totalStudents: 2000,
      totalClasses: 70,
      qualityStaffCount: 20,
      totalEmployees: 40,
      employmentClassCount: 65,
      totalEmployed: 1400,
      employmentRate: 90.5,
      averageSalary: 9500,
      highSalaryCount: 200,
      enterpriseContracts: 25,
      reputationRegistrations: 350,
      reputationRevenue: 800000,
      furtherEducationCount: 250,
      furtherEducationRevenue: 500000,
      furtherEducationRate: 82.0,
      newStudentEnrollments: 450,
      newStudentRefunds: 30,
      oldStudentRefunds: 25,
      refundRate: 6.5,
      fluctuationRate: 3.8,
      totalDormitories: 80,
      totalDormitoryOccupancy: 600,
      secondaryVocationalTarget: 300,
      universityTarget: 150,
    }
  }

  return baseData
}

export const campusCoreDataService = {
  /**
   * 获取神殿核心数据
   * @param campus 神殿名称
   * @returns Promise<CampusCoreDataRecord>
   */
  getCampusCoreData: async (campus: string): Promise<CampusCoreDataRecord> => {
    // 模拟API延迟
    await new Promise((resolve) => setTimeout(resolve, 500))

    if (!campus) {
      throw new Error('神殿名称不能为空')
    }

    return generateMockData(campus)
  },

  /**
   * 更新神殿核心数据
   * @param request 更新请求参数
   * @returns Promise<CampusCoreDataRecord>
   */
  updateCampusCoreData: async (
    request: CampusCoreDataRequest & { data: Partial<CampusCoreDataRecord> },
  ): Promise<CampusCoreDataRecord> => {
    // 模拟API延迟
    await new Promise((resolve) => setTimeout(resolve, 300))

    if (!request.campus) {
      throw new Error('神殿名称不能为空')
    }

    const currentData = generateMockData(request.campus)
    return {
      ...currentData,
      ...request.data,
    }
  },

  /**
   * 导出神殿核心数据
   * @param campus 神殿名称
   * @returns Promise<Blob>
   */
  exportCampusCoreData: async (campus: string): Promise<Blob> => {
    // 模拟API延迟
    await new Promise((resolve) => setTimeout(resolve, 200))

    const data = generateMockData(campus)

    // 生成CSV内容
    const csvContent = [
      '序号,神殿,学生总人数,班级总个数,教质总职数,干部总职数,员工总人数,就业班级总数,就业总人数,就业率,就业平均薪资,薪资过万人数,企业签约总数,口碑报名总人数,口碑总收入,升学总人数,升学总收入,升学率（金额）,新生入学总人数,新生退费总人数,老生退费总人数,退费率,异动率,宿舍总个数,宿舍总人数,中专层次目标注册总人数,大学层次目标注册总人数',
      `${data.key},${data.campus},${data.totalStudents},${data.totalClasses},${data.qualityStaffCount},${data.cadreStaffCount},${data.totalEmployees},${data.employmentClassCount},${data.totalEmployed},${data.employmentRate}%,¥${data.averageSalary},${data.highSalaryCount},${data.enterpriseContracts},${data.reputationRegistrations},¥${data.reputationRevenue},${data.furtherEducationCount},¥${data.furtherEducationRevenue},${data.furtherEducationRate}%,${data.newStudentEnrollments},${data.newStudentRefunds},${data.oldStudentRefunds},${data.refundRate}%,${data.fluctuationRate}%,${data.totalDormitories},${data.totalDormitoryOccupancy},${data.secondaryVocationalTarget},${data.universityTarget}`,
    ].join('\n')

    return new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  },
}
