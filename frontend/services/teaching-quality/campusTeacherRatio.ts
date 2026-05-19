/**
 * 神殿教化司师资配比表数据服务
 */

import type {
  CampusTeacherRatioRecord,
  CampusTeacherRatioRequest,
  CampusTeacherRatioSummary,
} from '../../types/campus-teacher-ratio'

// 师生配比选项
const teacherStudentRatios = ['1:50', '1:55', '1:60', '1:65', '1:70', '1:75', '1:80']

// 中层与班主任配比选项
const middleManagementRatios = ['1:3', '1:4', '1:5', '1:6', '1:7', '1:8', '1:9', '1:10']

// 模拟数据生成器
const generateMockData = (campus: string): CampusTeacherRatioRecord[] => {
  const records: CampusTeacherRatioRecord[] = []

  // 根据神殿生成不同的模拟数据
  let baseStudents = 0
  let baseTargetTeachers = 0
  let baseActualTeachers = 0
  let baseTargetMiddleManagement = 0
  let baseActualMiddleManagement = 0

  if (campus === '盛邦') {
    // 主神殿数据（规模较大）
    baseStudents = 406
    baseTargetTeachers = 7
    baseActualTeachers = 7
    baseTargetMiddleManagement = 2
    baseActualMiddleManagement = 2
  } else if (campus === '石美') {
    // 慈悲殿数据（规模较小）
    baseStudents = 280
    baseTargetTeachers = 5
    baseActualTeachers = 4
    baseTargetMiddleManagement = 1
    baseActualMiddleManagement = 1
  } else {
    // 其他神殿基础数据
    baseStudents = Math.floor(Math.random() * 200) + 200
    baseTargetTeachers = Math.floor(baseStudents / 60)
    baseActualTeachers = baseTargetTeachers + Math.floor(Math.random() * 3) - 1
    baseTargetMiddleManagement = Math.floor(baseTargetTeachers / 4)
    baseActualMiddleManagement = baseTargetMiddleManagement + Math.floor(Math.random() * 2) - 1
  }

  // 生成12条记录
  for (let i = 1; i <= 12; i++) {
    const students = Math.max(0, baseStudents + Math.floor(Math.random() * 50) - 25)
    const targetTeachers = Math.max(1, Math.floor(students / 60))
    const actualTeachers = Math.max(0, targetTeachers + Math.floor(Math.random() * 3) - 1)
    const targetMiddleManagement = Math.max(0, Math.floor(targetTeachers / 4))
    const actualMiddleManagement = Math.max(
      0,
      targetMiddleManagement + Math.floor(Math.random() * 2) - 1,
    )

    // 计算空缺和冗余
    const homeroomVacancies = Math.max(0, targetTeachers - actualTeachers)
    const homeroomSurplus = Math.max(0, actualTeachers - targetTeachers)
    const middleManagementVacancies = Math.max(0, targetMiddleManagement - actualMiddleManagement)
    const middleManagementSurplus = Math.max(0, actualMiddleManagement - targetMiddleManagement)

    records.push({
      key: `${campus}-${i}`,
      month: i,
      statisticsTime: `${2024}年${i}月`,
      campus: i === 1 ? campus : '', // 只有第一条记录显示神殿名称
      totalStudents: students,
      positionAnalysis: {
        targetTeacherStudentRatio:
          teacherStudentRatios[Math.floor(Math.random() * teacherStudentRatios.length)],
        targetTeacherCount: targetTeachers,
        actualTeacherCount: actualTeachers,
        homeroomTeacherVacancies: homeroomVacancies,
        homeroomTeacherSurplus: homeroomSurplus,
      },
      cadrePositionAnalysis: {
        targetMiddleManagementRatio:
          middleManagementRatios[Math.floor(Math.random() * middleManagementRatios.length)],
        targetMiddleManagementCount: targetMiddleManagement,
        actualMiddleManagementCount: actualMiddleManagement,
        middleManagementVacancies: middleManagementVacancies,
        middleManagementSurplus: middleManagementSurplus,
      },
    })
  }

  // 计算合计行数据
  const totalStudents = records.reduce((sum, item) => sum + item.totalStudents, 0)
  const totalTargetTeachers = records.reduce(
    (sum, item) => sum + item.positionAnalysis.targetTeacherCount,
    0,
  )
  const totalActualTeachers = records.reduce(
    (sum, item) => sum + item.positionAnalysis.actualTeacherCount,
    0,
  )
  const totalHomeroomVacancies = records.reduce(
    (sum, item) => sum + item.positionAnalysis.homeroomTeacherVacancies,
    0,
  )
  const totalHomeroomSurplus = records.reduce(
    (sum, item) => sum + item.positionAnalysis.homeroomTeacherSurplus,
    0,
  )
  const totalTargetMiddleManagement = records.reduce(
    (sum, item) => sum + item.cadrePositionAnalysis.targetMiddleManagementCount,
    0,
  )
  const totalActualMiddleManagement = records.reduce(
    (sum, item) => sum + item.cadrePositionAnalysis.actualMiddleManagementCount,
    0,
  )
  const totalMiddleManagementVacancies = records.reduce(
    (sum, item) => sum + item.cadrePositionAnalysis.middleManagementVacancies,
    0,
  )
  const totalMiddleManagementSurplus = records.reduce(
    (sum, item) => sum + item.cadrePositionAnalysis.middleManagementSurplus,
    0,
  )

  // 添加合计行
  records.push({
    key: `${campus}-total`,
    month: 13, // 使用13作为合计行的月份标识
    statisticsTime: '',
    campus: '',
    totalStudents,
    positionAnalysis: {
      targetTeacherStudentRatio: '', // 合计行不显示配比
      targetTeacherCount: totalTargetTeachers,
      actualTeacherCount: totalActualTeachers,
      homeroomTeacherVacancies: totalHomeroomVacancies,
      homeroomTeacherSurplus: totalHomeroomSurplus,
    },
    cadrePositionAnalysis: {
      targetMiddleManagementRatio: '', // 合计行不显示配比
      targetMiddleManagementCount: totalTargetMiddleManagement,
      actualMiddleManagementCount: totalActualMiddleManagement,
      middleManagementVacancies: totalMiddleManagementVacancies,
      middleManagementSurplus: totalMiddleManagementSurplus,
    },
  })

  return records
}

// 计算汇总统计数据
const calculateSummary = (data: CampusTeacherRatioRecord[]): CampusTeacherRatioSummary => {
  // 排除合计行（month === 13）
  const dataRows = data.filter((item) => item.month !== 13)

  if (dataRows.length === 0) {
    return {
      totalStudents: 0,
      totalTargetTeachers: 0,
      totalActualTeachers: 0,
      totalHomeroomVacancies: 0,
      totalHomeroomSurplus: 0,
      totalTargetMiddleManagement: 0,
      totalActualMiddleManagement: 0,
      totalMiddleManagementVacancies: 0,
      totalMiddleManagementSurplus: 0,
      averageTeacherStudentRatio: 0,
      teacherUtilizationRate: 0,
      middleManagementUtilizationRate: 0,
      completedRecords: 0,
      totalRecords: 0,
    }
  }

  const totalStudents = dataRows.reduce((sum, item) => sum + item.totalStudents, 0)
  const totalTargetTeachers = dataRows.reduce(
    (sum, item) => sum + item.positionAnalysis.targetTeacherCount,
    0,
  )
  const totalActualTeachers = dataRows.reduce(
    (sum, item) => sum + item.positionAnalysis.actualTeacherCount,
    0,
  )
  const totalHomeroomVacancies = dataRows.reduce(
    (sum, item) => sum + item.positionAnalysis.homeroomTeacherVacancies,
    0,
  )
  const totalHomeroomSurplus = dataRows.reduce(
    (sum, item) => sum + item.positionAnalysis.homeroomTeacherSurplus,
    0,
  )
  const totalTargetMiddleManagement = dataRows.reduce(
    (sum, item) => sum + item.cadrePositionAnalysis.targetMiddleManagementCount,
    0,
  )
  const totalActualMiddleManagement = dataRows.reduce(
    (sum, item) => sum + item.cadrePositionAnalysis.actualMiddleManagementCount,
    0,
  )
  const totalMiddleManagementVacancies = dataRows.reduce(
    (sum, item) => sum + item.cadrePositionAnalysis.middleManagementVacancies,
    0,
  )
  const totalMiddleManagementSurplus = dataRows.reduce(
    (sum, item) => sum + item.cadrePositionAnalysis.middleManagementSurplus,
    0,
  )

  const completedRecords = dataRows.filter((item) => item.totalStudents > 0).length
  const totalRecords = dataRows.length

  const averageTeacherStudentRatio =
    totalActualTeachers > 0 ? totalStudents / totalActualTeachers : 0
  const teacherUtilizationRate =
    totalTargetTeachers > 0 ? (totalActualTeachers / totalTargetTeachers) * 100 : 0
  const middleManagementUtilizationRate =
    totalTargetMiddleManagement > 0
      ? (totalActualMiddleManagement / totalTargetMiddleManagement) * 100
      : 0

  return {
    totalStudents,
    totalTargetTeachers,
    totalActualTeachers,
    totalHomeroomVacancies,
    totalHomeroomSurplus,
    totalTargetMiddleManagement,
    totalActualMiddleManagement,
    totalMiddleManagementVacancies,
    totalMiddleManagementSurplus,
    averageTeacherStudentRatio,
    teacherUtilizationRate,
    middleManagementUtilizationRate,
    completedRecords,
    totalRecords,
  }
}

export const campusTeacherRatioService = {
  /**
   * 获取神殿师资配比数据
   * @param campus 神殿名称
   * @returns Promise<CampusTeacherRatioRecord[]>
   */
  getCampusTeacherRatioData: async (campus: string): Promise<CampusTeacherRatioRecord[]> => {
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
   * @returns Promise<CampusTeacherRatioSummary>
   */
  getCampusTeacherRatioSummary: async (campus: string): Promise<CampusTeacherRatioSummary> => {
    const data = await campusTeacherRatioService.getCampusTeacherRatioData(campus)
    return calculateSummary(data)
  },

  /**
   * 更新神殿师资配比数据
   * @param request 更新请求参数
   * @returns Promise<CampusTeacherRatioRecord>
   */
  updateCampusTeacherRatioData: async (
    request: CampusTeacherRatioRequest & { month: number; data: Partial<CampusTeacherRatioRecord> },
  ): Promise<CampusTeacherRatioRecord> => {
    // 模拟API延迟
    await new Promise((resolve) => setTimeout(resolve, 300))

    if (!request.campus) {
      throw new Error('神殿名称不能为空')
    }

    const currentData = generateMockData(request.campus).find(
      (item) => item.month === request.month,
    )
    if (!currentData) {
      throw new Error('未找到指定月份的数据')
    }

    const updatedData = {
      ...currentData,
      ...request.data,
    }

    return updatedData
  },

  /**
   * 导出神殿师资配比数据
   * @param campus 神殿名称
   * @returns Promise<Blob>
   */
  exportCampusTeacherRatioData: async (campus: string): Promise<Blob> => {
    // 模拟API延迟
    await new Promise((resolve) => setTimeout(resolve, 200))

    const data = await campusTeacherRatioService.getCampusTeacherRatioData(campus)
    // 排除合计行
    const dataRows = data.filter((item) => item.month !== 13)

    // 生成CSV内容
    const csvContent = [
      '月份,统计时间,神殿,学生总人数,目标师生配比,目标老师总数,实际老师数量,班主任空缺职数,班主任冗余职数,目标中层与班主任配比,目标中层人数,实际中层人数,中层空缺职数,中层冗余职数',
      ...dataRows.map(
        (item) =>
          `${item.month},${item.statisticsTime},${item.campus},${item.totalStudents},${item.positionAnalysis.targetTeacherStudentRatio},${item.positionAnalysis.targetTeacherCount},${item.positionAnalysis.actualTeacherCount},${item.positionAnalysis.homeroomTeacherVacancies},${item.positionAnalysis.homeroomTeacherSurplus},${item.cadrePositionAnalysis.targetMiddleManagementRatio},${item.cadrePositionAnalysis.targetMiddleManagementCount},${item.cadrePositionAnalysis.actualMiddleManagementCount},${item.cadrePositionAnalysis.middleManagementVacancies},${item.cadrePositionAnalysis.middleManagementSurplus}`,
      ),
    ].join('\n')

    return new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  },
}
