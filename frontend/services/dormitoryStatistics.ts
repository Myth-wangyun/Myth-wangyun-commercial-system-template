// [教质模块] 神殿教化司现有宿舍统计表数据服务
/**
 * 神殿教化司现有宿舍统计表数据服务
 */

import type {
  DormitoryStatisticsRecord,
  DormitoryStatisticsStats,
} from '../types/dormitory-statistics'

// 生成宿舍统计数据
const generateDormitoryStatisticsData = (campus: string): DormitoryStatisticsRecord[] => {
  const records: DormitoryStatisticsRecord[] = []

  // 生成1-12月的数据
  for (let month = 1; month <= 12; month++) {
    const enrolledStudents = Math.floor(Math.random() * 200) + 100 // 100-300
    const totalDormitories = Math.floor(Math.random() * 50) + 50 // 50-100
    const totalOccupants = Math.floor(Math.random() * 200) + 80 // 80-280

    // 计算住宿率
    const occupancyRate = totalDormitories > 0 ? (totalOccupants / totalDormitories) * 100 : 0

    const maleDormitoryCount = Math.floor(Math.random() * 30) + 20 // 20-50
    const maleOccupants = Math.floor(Math.random() * 150) + 50 // 50-200
    const maleEmptyBeds = Math.max(0, maleDormitoryCount * 8 - maleOccupants) // 假设每宿舍8个床位
    const maleNewStudentBeds = Math.max(0, maleEmptyBeds - Math.floor(Math.random() * 5)) // 空闲床位减去一些

    const femaleDormitoryCount = Math.floor(Math.random() * 30) + 20 // 20-50
    const femaleOccupants = Math.floor(Math.random() * 150) + 50 // 50-200
    const femaleEmptyBeds = Math.max(0, femaleDormitoryCount * 8 - femaleOccupants)
    const femaleNewStudentBeds = Math.max(0, femaleEmptyBeds - Math.floor(Math.random() * 5))

    const plannedRentedDormitories = Math.floor(Math.random() * 10) // 0-10
    const actualRentedDormitories = Math.floor(Math.random() * 10)
    const plannedVacatedDormitories = Math.floor(Math.random() * 5) // 0-5
    const actualVacatedDormitories = Math.floor(Math.random() * 5)

    records.push({
      key: `month-${month}`,
      month,
      campus,
      enrolledStudents,
      totalDormitories,
      totalOccupants,
      occupancyRate,
      maleDormitoryCount,
      maleOccupants,
      maleEmptyBeds,
      maleNewStudentBeds,
      femaleDormitoryCount,
      femaleOccupants,
      femaleEmptyBeds,
      femaleNewStudentBeds,
      plannedRentedDormitories,
      actualRentedDormitories,
      plannedVacatedDormitories,
      actualVacatedDormitories,
      remarks: '',
      rowType: 'data',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    })
  }

  // 添加合计行
  const totalEnrolledStudents = records.reduce((sum, r) => sum + r.enrolledStudents, 0)
  const totalDormitories = records.reduce((sum, r) => sum + r.totalDormitories, 0)
  const totalOccupants = records.reduce((sum, r) => sum + r.totalOccupants, 0)
  const averageOccupancyRate = totalDormitories > 0 ? (totalOccupants / totalDormitories) * 100 : 0
  const totalMaleDormitories = records.reduce((sum, r) => sum + r.maleDormitoryCount, 0)
  const totalMaleOccupants = records.reduce((sum, r) => sum + r.maleOccupants, 0)
  const totalMaleEmptyBeds = records.reduce((sum, r) => sum + r.maleEmptyBeds, 0)
  const totalMaleNewStudentBeds = records.reduce((sum, r) => sum + r.maleNewStudentBeds, 0)
  const totalFemaleDormitories = records.reduce((sum, r) => sum + r.femaleDormitoryCount, 0)
  const totalFemaleOccupants = records.reduce((sum, r) => sum + r.femaleOccupants, 0)
  const totalFemaleEmptyBeds = records.reduce((sum, r) => sum + r.femaleEmptyBeds, 0)
  const totalFemaleNewStudentBeds = records.reduce((sum, r) => sum + r.femaleNewStudentBeds, 0)
  const totalPlannedRentedDormitories = records.reduce(
    (sum, r) => sum + r.plannedRentedDormitories,
    0,
  )
  const totalActualRentedDormitories = records.reduce(
    (sum, r) => sum + r.actualRentedDormitories,
    0,
  )
  const totalPlannedVacatedDormitories = records.reduce(
    (sum, r) => sum + r.plannedVacatedDormitories,
    0,
  )
  const totalActualVacatedDormitories = records.reduce(
    (sum, r) => sum + r.actualVacatedDormitories,
    0,
  )

  records.push({
    key: 'total',
    month: 0,
    campus,
    enrolledStudents: totalEnrolledStudents,
    totalDormitories,
    totalOccupants,
    occupancyRate: averageOccupancyRate,
    maleDormitoryCount: totalMaleDormitories,
    maleOccupants: totalMaleOccupants,
    maleEmptyBeds: totalMaleEmptyBeds,
    maleNewStudentBeds: totalMaleNewStudentBeds,
    femaleDormitoryCount: totalFemaleDormitories,
    femaleOccupants: totalFemaleOccupants,
    femaleEmptyBeds: totalFemaleEmptyBeds,
    femaleNewStudentBeds: totalFemaleNewStudentBeds,
    plannedRentedDormitories: totalPlannedRentedDormitories,
    actualRentedDormitories: totalActualRentedDormitories,
    plannedVacatedDormitories: totalPlannedVacatedDormitories,
    actualVacatedDormitories: totalActualVacatedDormitories,
    remarks: '',
    rowType: 'total',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  })

  return records
}

export const dormitoryStatisticsService = {
  /**
   * 获取宿舍统计数据
   * @param campus 神殿名称
   * @returns Promise<DormitoryStatisticsRecord[]>
   */
  getDormitoryStatisticsData: async (campus: string): Promise<DormitoryStatisticsRecord[]> => {
    // 模拟API延迟
    await new Promise((resolve) => setTimeout(resolve, 500))

    if (!campus) {
      throw new Error('神殿名称不能为空')
    }

    return generateDormitoryStatisticsData(campus)
  },

  /**
   * 获取宿舍统计数据
   * @param campus 神殿名称
   * @returns Promise<DormitoryStatisticsStats>
   */
  getDormitoryStatisticsStats: async (campus: string): Promise<DormitoryStatisticsStats> => {
    const data = await dormitoryStatisticsService.getDormitoryStatisticsData(campus)
    const dataRows = data.filter((r) => r.rowType === 'data')
    const totalRow = data.find((r) => r.rowType === 'total')

    return {
      totalMonths: 12,
      totalEnrolledStudents: totalRow?.enrolledStudents || 0,
      totalDormitories: totalRow?.totalDormitories || 0,
      totalOccupants: totalRow?.totalOccupants || 0,
      averageOccupancyRate: totalRow?.occupancyRate || 0,
      totalMaleDormitories: totalRow?.maleDormitoryCount || 0,
      totalMaleOccupants: totalRow?.maleOccupants || 0,
      totalFemaleDormitories: totalRow?.femaleDormitoryCount || 0,
      totalFemaleOccupants: totalRow?.femaleOccupants || 0,
      totalRentedDormitories: totalRow?.actualRentedDormitories || 0,
      totalVacatedDormitories: totalRow?.actualVacatedDormitories || 0,
    }
  },

  /**
   * 导出宿舍统计数据
   * @param campus 神殿名称
   * @returns Promise<Blob>
   */
  exportDormitoryStatisticsData: async (campus: string): Promise<Blob> => {
    const data = await dormitoryStatisticsService.getDormitoryStatisticsData(campus)

    const csvContent = [
      '月份,神殿,在校生数,宿舍总数量,住宿总人数,住宿率,男宿总数量,男宿总人数,男宿空床位总数量,适合男新生床位数,女宿总数量,女宿总人数,女宿空床位总数量,适合女新生住宿床位,计划租宿舍数量,实际租宿舍数量,计划退宿舍数量,实际退宿舍数量,备注',
      ...data.map(
        (item) =>
          `${item.month === 0 ? '合计' : item.month},${item.campus},${item.enrolledStudents},${item.totalDormitories},${item.totalOccupants},${item.occupancyRate.toFixed(2)}%,${item.maleDormitoryCount},${item.maleOccupants},${item.maleEmptyBeds},${item.maleNewStudentBeds},${item.femaleDormitoryCount},${item.femaleOccupants},${item.femaleEmptyBeds},${item.femaleNewStudentBeds},${item.plannedRentedDormitories},${item.actualRentedDormitories},${item.plannedVacatedDormitories},${item.actualVacatedDormitories},${item.remarks}`,
      ),
    ].join('\n')

    return new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  },
}
