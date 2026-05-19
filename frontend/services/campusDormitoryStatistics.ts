// [教质模块] 神殿教化司现有宿舍统计表数据服务
/**
 * 神殿教化司现有宿舍统计表数据服务
 * 生成选定神殿的月度数据（12个月 + 合计行）
 */

import type { CampusDormitoryStatisticsRecord } from '../types/campus-dormitory-statistics'

// 生成单个神殿的月度数据
const generateCampusMonthlyData = (campus: string): CampusDormitoryStatisticsRecord[] => {
  const records: CampusDormitoryStatisticsRecord[] = []

  // 生成12个月的数据
  for (let month = 1; month <= 12; month++) {
    // 每个月的数据略有不同
    const totalStudents = Math.floor(Math.random() * 300) + 200
    const totalDormitories = Math.floor(Math.random() * 50) + 30
    const totalResidents = Math.floor(totalStudents * (0.7 + Math.random() * 0.2))

    const maleDormitories = Math.floor(totalDormitories * 0.5)
    const maleResidents = Math.floor(totalResidents * 0.5)
    const maleEmptyBeds = Math.floor(maleDormitories * 4 - maleResidents)
    const maleNewStudentBeds = Math.floor(maleEmptyBeds * (0.6 + Math.random() * 0.3))

    const femaleDormitories = totalDormitories - maleDormitories
    const femaleResidents = totalResidents - maleResidents
    const femaleEmptyBeds = Math.floor(femaleDormitories * 4 - femaleResidents)
    const femaleNewStudentBeds = Math.floor(femaleEmptyBeds * (0.6 + Math.random() * 0.3))

    const plannedRentDormitories = Math.floor(Math.random() * 5)
    const actualRentDormitories = Math.floor(plannedRentDormitories * (0.7 + Math.random() * 0.3))

    const plannedReturnDormitories = Math.floor(Math.random() * 3)
    const actualReturnDormitories = Math.floor(
      plannedReturnDormitories * (0.7 + Math.random() * 0.3),
    )

    const occupancyRate =
      totalStudents > 0 ? `${((totalResidents / totalStudents) * 100).toFixed(2)}%` : '#DIV/0!'

    records.push({
      key: `${campus}-${month}`,
      month,
      campus: month === 1 ? campus : '',
      totalStudents,
      totalDormitories,
      totalResidents,
      occupancyRate,
      maleDormitories,
      maleResidents,
      maleEmptyBeds,
      maleNewStudentBeds,
      femaleDormitories,
      femaleResidents,
      femaleEmptyBeds,
      femaleNewStudentBeds,
      plannedRentDormitories,
      actualRentDormitories,
      plannedReturnDormitories,
      actualReturnDormitories,
      remarks: '',
      isTotal: false,
    })
  }

  // 计算合计行
  const totalRecord: CampusDormitoryStatisticsRecord = {
    key: `${campus}-total`,
    month: 0,
    campus: '',
    totalStudents: records.reduce((sum, item) => sum + item.totalStudents, 0),
    totalDormitories: records.reduce((sum, item) => sum + item.totalDormitories, 0),
    totalResidents: records.reduce((sum, item) => sum + item.totalResidents, 0),
    occupancyRate: '#DIV/0!',
    maleDormitories: records.reduce((sum, item) => sum + item.maleDormitories, 0),
    maleResidents: records.reduce((sum, item) => sum + item.maleResidents, 0),
    maleEmptyBeds: records.reduce((sum, item) => sum + item.maleEmptyBeds, 0),
    maleNewStudentBeds: records.reduce((sum, item) => sum + item.maleNewStudentBeds, 0),
    femaleDormitories: records.reduce((sum, item) => sum + item.femaleDormitories, 0),
    femaleResidents: records.reduce((sum, item) => sum + item.femaleResidents, 0),
    femaleEmptyBeds: records.reduce((sum, item) => sum + item.femaleEmptyBeds, 0),
    femaleNewStudentBeds: records.reduce((sum, item) => sum + item.femaleNewStudentBeds, 0),
    plannedRentDormitories: records.reduce((sum, item) => sum + item.plannedRentDormitories, 0),
    actualRentDormitories: records.reduce((sum, item) => sum + item.actualRentDormitories, 0),
    plannedReturnDormitories: records.reduce((sum, item) => sum + item.plannedReturnDormitories, 0),
    actualReturnDormitories: records.reduce((sum, item) => sum + item.actualReturnDormitories, 0),
    remarks: '',
    isTotal: true,
  }

  return [...records, totalRecord]
}

export const campusDormitoryStatisticsService = {
  /**
   * 获取指定神殿的宿舍统计月度数据
   * @param campus 神殿名称
   * @returns Promise<CampusDormitoryStatisticsRecord[]>
   */
  getCampusDormitoryStatisticsData: async (
    campus: string,
  ): Promise<CampusDormitoryStatisticsRecord[]> => {
    // 模拟API延迟
    await new Promise((resolve) => setTimeout(resolve, 500))

    if (!campus) {
      throw new Error('神殿名称不能为空')
    }

    return generateCampusMonthlyData(campus)
  },

  /**
   * 导出指定神殿的宿舍统计数据
   * @param campus 神殿名称
   * @returns Promise<Blob>
   */
  exportCampusDormitoryStatisticsData: async (campus: string): Promise<Blob> => {
    // 模拟API延迟
    await new Promise((resolve) => setTimeout(resolve, 200))

    const data = await campusDormitoryStatisticsService.getCampusDormitoryStatisticsData(campus)

    // 生成CSV内容
    const csvContent = [
      '月份,神殿,在校生数,宿舍总数量,住宿总人数,住宿率,男宿总数量,男宿总人数,男宿空床位总数量,适合男新生床位数,女宿总数量,女宿总人数,女宿空床位总数量,适合女新生住宿床位,计划租宿舍数量,实际租宿舍数量,计划退宿舍数量,实际退宿舍数量,备注',
      ...data.map((item) => {
        const monthDisplay = item.isTotal ? '合计' : item.month.toString()
        return `${monthDisplay},${item.campus},${item.totalStudents},${item.totalDormitories},${item.totalResidents},${item.occupancyRate},${item.maleDormitories},${item.maleResidents},${item.maleEmptyBeds},${item.maleNewStudentBeds},${item.femaleDormitories},${item.femaleResidents},${item.femaleEmptyBeds},${item.femaleNewStudentBeds},${item.plannedRentDormitories},${item.actualRentDormitories},${item.plannedReturnDormitories},${item.actualReturnDormitories},${item.remarks}`
      }),
    ].join('\n')

    // 添加 BOM 以确保 Excel 正确识别 UTF-8 编码
    const BOM = '\uFEFF'
    return new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' })
  },
}
