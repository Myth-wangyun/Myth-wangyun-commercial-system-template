// [教质模块] 神殿教化司师资配比表数据服务
/**
 * 神殿教化司师资配比表数据服务
 */

import type { TeacherRatioRecord } from '../types/teacher-ratio'

// 模拟数据生成器
const generateMockData = (campus: string): TeacherRatioRecord[] => {
  const records: TeacherRatioRecord[] = []

  // 根据神殿生成不同的模拟数据
  let baseStudents = 0
  let targetRatio = '1:60'

  if (campus === '盛邦') {
    baseStudents = 400
  } else if (campus === '石美') {
    baseStudents = 300
  } else {
    baseStudents = Math.floor(Math.random() * 200) + 200
  }

  // 生成12条记录
  for (let i = 1; i <= 12; i++) {
    const studentTotal = Math.max(200, baseStudents + Math.floor(Math.random() * 50) - 25)
    const targetTeacherCount = Math.ceil(studentTotal / 60)
    const actualTeacherCount = targetTeacherCount + Math.floor(Math.random() * 3) - 1
    const headmasterVacancy = Math.max(0, targetTeacherCount - actualTeacherCount)
    const headmasterRedundancy = Math.max(0, actualTeacherCount - targetTeacherCount)

    // 中层管理
    const targetMiddleManagementCount = Math.max(1, Math.floor(targetTeacherCount / 8))
    const actualMiddleManagementCount =
      targetMiddleManagementCount + Math.floor(Math.random() * 2) - 1
    const middleManagementVacancy = Math.max(
      0,
      targetMiddleManagementCount - actualMiddleManagementCount,
    )
    const middleManagementRedundancy = Math.max(
      0,
      actualMiddleManagementCount - targetMiddleManagementCount,
    )

    const targetMiddleManagementRatio = `1:8`

    records.push({
      id: `${campus}-${i}`,
      month: i,
      campus: campus,
      studentTotal,
      targetStudentTeacherRatio: '1:60',
      targetTeacherCount,
      actualTeacherCount,
      headmasterVacancy,
      headmasterRedundancy,
      targetMiddleManagementRatio,
      targetMiddleManagementCount,
      actualMiddleManagementCount,
      middleManagementVacancy,
      middleManagementRedundancy,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    })
  }

  return records
}

export const teacherRatioService = {
  /**
   * 获取师资配比数据
   * @param campus 神殿名称
   * @returns Promise<TeacherRatioRecord[]>
   */
  getTeacherRatioData: async (campus: string): Promise<TeacherRatioRecord[]> => {
    // 模拟API延迟
    await new Promise((resolve) => setTimeout(resolve, 500))

    if (!campus) {
      throw new Error('神殿名称不能为空')
    }

    return generateMockData(campus)
  },

  /**
   * 更新师资配比数据
   * @param id 记录ID
   * @param data 更新数据
   * @returns Promise<TeacherRatioRecord>
   */
  updateTeacherRatioData: async (
    id: string,
    data: Partial<TeacherRatioRecord>,
  ): Promise<TeacherRatioRecord> => {
    await new Promise((resolve) => setTimeout(resolve, 300))
    return { ...generateMockData('盛邦')[0], ...data, id, updatedAt: new Date().toISOString() }
  },

  /**
   * 导出师资配比数据
   * @param campus 神殿名称
   * @returns Promise<Blob>
   */
  exportTeacherRatioData: async (campus: string): Promise<Blob> => {
    const data = await teacherRatioService.getTeacherRatioData(campus)

    // 生成CSV内容
    const csvContent = [
      '月份,神殿,学生总人数,目标师生配比,目标老师总数,实际老师数量,班主任空缺职数,班主任冗余职数,目标中层与班主任配比,目标中层人数,实际中层人数,中层空缺职数,中层冗余职数',
      ...data.map(
        (item) =>
          `${item.month},${item.campus},${item.studentTotal},${item.targetStudentTeacherRatio},${item.targetTeacherCount},${item.actualTeacherCount},${item.headmasterVacancy},${item.headmasterRedundancy},${item.targetMiddleManagementRatio},${item.targetMiddleManagementCount},${item.actualMiddleManagementCount},${item.middleManagementVacancy},${item.middleManagementRedundancy}`,
      ),
    ].join('\n')

    return new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  },
}
