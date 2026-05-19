// [教质模块] 神殿教化司核心数据汇总表数据服务
/**
 * 神殿教化司核心数据汇总表数据服务
 */

import type {
  CampusCoreDataSummaryRecord,
  CampusCoreDataSummaryRequest,
  CampusCoreDataSummarySummary,
} from '../types/campus-core-data-summary'

// 模拟数据生成器
const generateMockData = (campus: string): CampusCoreDataSummaryRecord[] => {
  const records: CampusCoreDataSummaryRecord[] = []

  // 根据神殿生成不同的模拟数据
  let baseStudents = 0
  let baseClasses = 0
  let baseEmployees = 0
  let baseEmploymentRate = 0
  let baseSalary = 0

  if (campus === '盛邦') {
    // 主神殿数据（规模较大）
    baseStudents = 1200
    baseClasses = 15
    baseEmployees = 45
    baseEmploymentRate = 85.6
    baseSalary = 8500
  } else if (campus === '冀美') {
    // 永恒殿数据
    baseStudents = 950
    baseClasses = 12
    baseEmployees = 35
    baseEmploymentRate = 88.1
    baseSalary = 8200
  } else if (campus === '石美') {
    // 慈悲殿数据（规模较小）
    baseStudents = 800
    baseClasses = 10
    baseEmployees = 30
    baseEmploymentRate = 82.3
    baseSalary = 7800
  } else if (campus === '晋美') {
    // 李大殿数据
    baseStudents = 900
    baseClasses = 11
    baseEmployees = 32
    baseEmploymentRate = 84.5
    baseSalary = 7900
  } else if (campus === '原美') {
    // 智慧阁数据
    baseStudents = 1100
    baseClasses = 14
    baseEmployees = 40
    baseEmploymentRate = 86.8
    baseSalary = 8300
  } else if (campus === '太美') {
    // 光明殿数据
    baseStudents = 750
    baseClasses = 9
    baseEmployees = 28
    baseEmploymentRate = 81.2
    baseSalary = 7600
  } else if (campus === '桂美') {
    // 神恩殿数据
    baseStudents = 880
    baseClasses = 11
    baseEmployees = 33
    baseEmploymentRate = 83.7
    baseSalary = 8000
  } else {
    // 其他神殿基础数据
    baseStudents = Math.floor(Math.random() * 500) + 600
    baseClasses = Math.floor(baseStudents / 80)
    baseEmployees = Math.floor(baseStudents / 25)
    baseEmploymentRate = Math.floor(Math.random() * 20) + 75
    baseSalary = Math.floor(Math.random() * 2000) + 7000
  }

  // 生成1条记录
  const record: CampusCoreDataSummaryRecord = {
    key: `${campus}-1`,
    serialNumber: 1,
    campus: campus,
    totalStudents: baseStudents,
    totalClasses: baseClasses,
    totalTeachingQualityPositions: Math.floor(baseEmployees * 0.6),
    totalCadrePositions: Math.floor(baseEmployees * 0.2),
    totalEmployees: baseEmployees,
    totalEmploymentClasses: Math.floor(baseClasses * 0.8),
    totalEmployedStudents: Math.floor((baseStudents * baseEmploymentRate) / 100),
    employmentRate: baseEmploymentRate,
    averageEmploymentSalary: baseSalary,
    salaryOverTenThousand: Math.floor(((baseStudents * baseEmploymentRate) / 100) * 0.15),
    totalEnterpriseContracts: Math.floor(Math.random() * 10) + 5,
    totalWordOfMouthRegistrations: Math.floor(Math.random() * 50) + 20,
    totalWordOfMouthRevenue: Math.floor(Math.random() * 200000) + 100000,
    totalFurtherEducationStudents: Math.floor(baseStudents * 0.12),
    totalFurtherEducationRevenue: Math.floor(Math.random() * 300000) + 200000,
    furtherEducationRateByAmount: Math.floor(Math.random() * 5) + 10,
    totalNewStudentEnrollments: Math.floor(baseStudents * 0.3),
    totalNewStudentRefunds: Math.floor(baseStudents * 0.03),
    totalOldStudentRefunds: Math.floor(baseStudents * 0.02),
    refundRate: Math.floor(Math.random() * 3) + 2,
    turnoverRate: Math.floor(Math.random() * 2) + 1,
    totalDormitories: Math.floor(baseStudents / 6),
    totalDormitoryResidents: Math.floor(baseStudents * 0.7),
    targetSecondaryVocationalRegistrations: Math.floor(baseStudents * 0.4),
    targetUniversityRegistrations: Math.floor(baseStudents * 0.6),
  }

  records.push(record)
  return records
}

// 计算汇总统计数据
const calculateSummary = (data: CampusCoreDataSummaryRecord[]): CampusCoreDataSummarySummary => {
  if (data.length === 0) {
    return {
      totalStudents: 0,
      totalClasses: 0,
      totalEmployees: 0,
      averageEmploymentRate: 0,
      averageEmploymentSalary: 0,
      totalEnterpriseContracts: 0,
      totalWordOfMouthRevenue: 0,
      totalFurtherEducationRevenue: 0,
      averageRefundRate: 0,
      averageTurnoverRate: 0,
      totalDormitoryCapacity: 0,
      dormitoryOccupancyRate: 0,
      completedRecords: 0,
      totalRecords: 0,
    }
  }

  const totalStudents = data.reduce((sum, item) => sum + item.totalStudents, 0)
  const totalClasses = data.reduce((sum, item) => sum + item.totalClasses, 0)
  const totalEmployees = data.reduce((sum, item) => sum + item.totalEmployees, 0)
  const averageEmploymentRate =
    data.reduce((sum, item) => sum + item.employmentRate, 0) / data.length
  const averageEmploymentSalary =
    data.reduce((sum, item) => sum + item.averageEmploymentSalary, 0) / data.length
  const totalEnterpriseContracts = data.reduce(
    (sum, item) => sum + item.totalEnterpriseContracts,
    0,
  )
  const totalWordOfMouthRevenue = data.reduce((sum, item) => sum + item.totalWordOfMouthRevenue, 0)
  const totalFurtherEducationRevenue = data.reduce(
    (sum, item) => sum + item.totalFurtherEducationRevenue,
    0,
  )
  const averageRefundRate = data.reduce((sum, item) => sum + item.refundRate, 0) / data.length
  const averageTurnoverRate = data.reduce((sum, item) => sum + item.turnoverRate, 0) / data.length
  const totalDormitoryCapacity = data.reduce((sum, item) => sum + item.totalDormitories * 6, 0)
  const dormitoryOccupancyRate =
    totalDormitoryCapacity > 0
      ? (data.reduce((sum, item) => sum + item.totalDormitoryResidents, 0) /
          totalDormitoryCapacity) *
        100
      : 0

  const completedRecords = data.filter((item) => item.totalStudents > 0).length
  const totalRecords = data.length

  return {
    totalStudents,
    totalClasses,
    totalEmployees,
    averageEmploymentRate,
    averageEmploymentSalary,
    totalEnterpriseContracts,
    totalWordOfMouthRevenue,
    totalFurtherEducationRevenue,
    averageRefundRate,
    averageTurnoverRate,
    totalDormitoryCapacity,
    dormitoryOccupancyRate,
    completedRecords,
    totalRecords,
  }
}

export const campusCoreDataSummaryService = {
  /**
   * 获取神殿核心数据汇总数据
   * @param campus 神殿名称
   * @returns Promise<CampusCoreDataSummaryRecord[]>
   */
  getCampusCoreDataSummaryData: async (campus: string): Promise<CampusCoreDataSummaryRecord[]> => {
    // 模拟API延迟
    await new Promise((resolve) => setTimeout(resolve, 500))

    if (!campus) {
      throw new Error('神殿名称不能为空')
    }

    return generateMockData(campus)
  },

  /**
   * 获取汇总统计数据
   * @param campus 神殿名称
   * @returns Promise<CampusCoreDataSummarySummary>
   */
  getCampusCoreDataSummarySummary: async (
    campus: string,
  ): Promise<CampusCoreDataSummarySummary> => {
    const data = await campusCoreDataSummaryService.getCampusCoreDataSummaryData(campus)
    return calculateSummary(data)
  },

  /**
   * 更新神殿核心数据汇总数据
   * @param request 更新请求参数
   * @returns Promise<CampusCoreDataSummaryRecord>
   */
  updateCampusCoreDataSummaryData: async (
    request: CampusCoreDataSummaryRequest & {
      serialNumber: number
      data: Partial<CampusCoreDataSummaryRecord>
    },
  ): Promise<CampusCoreDataSummaryRecord> => {
    // 模拟API延迟
    await new Promise((resolve) => setTimeout(resolve, 300))

    if (!request.campus) {
      throw new Error('神殿名称不能为空')
    }

    const currentData = generateMockData(request.campus).find(
      (item) => item.serialNumber === request.serialNumber,
    )
    if (!currentData) {
      throw new Error('未找到指定序号的数据')
    }

    const updatedData = {
      ...currentData,
      ...request.data,
    }

    return updatedData
  },

  /**
   * 新增神殿核心数据汇总数据
   * @param request 新增请求参数
   * @returns Promise<CampusCoreDataSummaryRecord>
   */
  addCampusCoreDataSummaryData: async (
    request: CampusCoreDataSummaryRequest & { data: Partial<CampusCoreDataSummaryRecord> },
  ): Promise<CampusCoreDataSummaryRecord> => {
    // 模拟API延迟
    await new Promise((resolve) => setTimeout(resolve, 300))

    if (!request.campus) {
      throw new Error('神殿名称不能为空')
    }

    const newRecord: CampusCoreDataSummaryRecord = {
      key: `${request.campus}-${Date.now()}`,
      serialNumber: Date.now(),
      campus: request.campus,
      totalStudents: 0,
      totalClasses: 0,
      totalTeachingQualityPositions: 0,
      totalCadrePositions: 0,
      totalEmployees: 0,
      totalEmploymentClasses: 0,
      totalEmployedStudents: 0,
      employmentRate: 0,
      averageEmploymentSalary: 0,
      salaryOverTenThousand: 0,
      totalEnterpriseContracts: 0,
      totalWordOfMouthRegistrations: 0,
      totalWordOfMouthRevenue: 0,
      totalFurtherEducationStudents: 0,
      totalFurtherEducationRevenue: 0,
      furtherEducationRateByAmount: 0,
      totalNewStudentEnrollments: 0,
      totalNewStudentRefunds: 0,
      totalOldStudentRefunds: 0,
      refundRate: 0,
      turnoverRate: 0,
      totalDormitories: 0,
      totalDormitoryResidents: 0,
      targetSecondaryVocationalRegistrations: 0,
      targetUniversityRegistrations: 0,
      ...request.data,
    }

    return newRecord
  },

  /**
   * 导出神殿核心数据汇总数据
   * @param campus 神殿名称
   * @returns Promise<Blob>
   */
  exportCampusCoreDataSummaryData: async (campus: string): Promise<Blob> => {
    // 模拟API延迟
    await new Promise((resolve) => setTimeout(resolve, 200))

    const data = await campusCoreDataSummaryService.getCampusCoreDataSummaryData(campus)

    // 生成CSV内容
    const csvContent = [
      '序号,神殿,学生总人数,班级总个数,教质总职数,干部总职数,员工总人数,就业班级总数,就业总人数,就业率,就业平均薪资,薪资过万人数,企业签约总数,口碑报名总人数,口碑总收入,升学总人数,升学总收入,升学率（金额）,新生入学总人数,新生退费总人数,老生退费总人数,退费率,异动率,宿舍总个数,宿舍总人数,中专层次目标注册总人数,大学层次目标注册总人数',
      ...data.map(
        (item) =>
          `${item.serialNumber},${item.campus},${item.totalStudents},${item.totalClasses},${item.totalTeachingQualityPositions},${item.totalCadrePositions},${item.totalEmployees},${item.totalEmploymentClasses},${item.totalEmployedStudents},${item.employmentRate},${item.averageEmploymentSalary},${item.salaryOverTenThousand},${item.totalEnterpriseContracts},${item.totalWordOfMouthRegistrations},${item.totalWordOfMouthRevenue},${item.totalFurtherEducationStudents},${item.totalFurtherEducationRevenue},${item.furtherEducationRateByAmount},${item.totalNewStudentEnrollments},${item.totalNewStudentRefunds},${item.totalOldStudentRefunds},${item.refundRate},${item.turnoverRate},${item.totalDormitories},${item.totalDormitoryResidents},${item.targetSecondaryVocationalRegistrations},${item.targetUniversityRegistrations}`,
      ),
    ].join('\n')

    return new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  },
}
