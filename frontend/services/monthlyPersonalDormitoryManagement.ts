// [教质模块] 神殿教化司每月个人宿舍管理统计表数据服务
/**
 * 神殿教化司每月个人宿舍管理统计表数据服务
 */

import type {
  MonthlyPersonalDormitoryManagementRecord,
  MonthlyPersonalDormitoryManagementStats,
} from '../types/monthly-personal-dormitory-management'

// 生成每月个人宿舍管理统计数据
const generateMonthlyPersonalDormitoryManagementData = (
  campus: string,
): MonthlyPersonalDormitoryManagementRecord[] => {
  const records: MonthlyPersonalDormitoryManagementRecord[] = []

  const teacherNames = ['郭彩兰', '姜楠', '李晓萍']

  // 生成1-12月的数据
  for (let month = 1; month <= 12; month++) {
    // 为每个月生成3个班主任的数据
    for (let i = 0; i < teacherNames.length; i++) {
      const studentCount = Math.floor(Math.random() * 40) + 50 // 50-90
      const totalDormitories = Math.floor(Math.random() * 5) + 2 // 2-7
      const totalOccupants = Math.floor(Math.random() * 80) + 30 // 30-110

      // 计算住宿率
      const occupancyRate = totalDormitories > 0 ? (totalOccupants / totalDormitories) * 100 : 0

      const maleDormitoryCount = Math.floor(Math.random() * 3) + 1 // 1-4
      const maleOccupants = Math.floor(Math.random() * 50) + 30 // 30-80
      const maleEmptyBeds = Math.max(0, maleDormitoryCount * 8 - maleOccupants)
      const maleNewStudentBeds = Math.max(0, maleEmptyBeds - Math.floor(Math.random() * 3))

      const femaleDormitoryCount = Math.floor(Math.random() * 3) + 1 // 1-4
      const femaleOccupants = Math.floor(Math.random() * 50) + 30 // 30-80
      const femaleEmptyBeds = Math.max(0, femaleDormitoryCount * 8 - femaleOccupants)
      const femaleNewStudentBeds = Math.max(0, femaleEmptyBeds - Math.floor(Math.random() * 3))

      const plannedRentedDormitories = Math.floor(Math.random() * 2) // 0-2
      const actualRentedDormitories = Math.floor(Math.random() * 2)
      const plannedVacatedDormitories = Math.floor(Math.random() * 2) // 0-2
      const actualVacatedDormitories = Math.floor(Math.random() * 2)

      records.push({
        key: `month-${month}-teacher-${i + 1}`,
        month,
        name: teacherNames[i],
        studentCount,
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

    // 添加月合计行
    const monthRecords = records.filter((r) => r.month === month && r.rowType === 'data')
    const monthStudentCount = monthRecords.reduce((sum, r) => sum + r.studentCount, 0)
    const monthTotalDormitories = monthRecords.reduce((sum, r) => sum + r.totalDormitories, 0)
    const monthTotalOccupants = monthRecords.reduce((sum, r) => sum + r.totalOccupants, 0)
    const monthOccupancyRate =
      monthTotalDormitories > 0 ? (monthTotalOccupants / monthTotalDormitories) * 100 : 0
    const monthMaleDormitories = monthRecords.reduce((sum, r) => sum + r.maleDormitoryCount, 0)
    const monthMaleOccupants = monthRecords.reduce((sum, r) => sum + r.maleOccupants, 0)
    const monthMaleEmptyBeds = monthRecords.reduce((sum, r) => sum + r.maleEmptyBeds, 0)
    const monthMaleNewStudentBeds = monthRecords.reduce((sum, r) => sum + r.maleNewStudentBeds, 0)
    const monthFemaleDormitories = monthRecords.reduce((sum, r) => sum + r.femaleDormitoryCount, 0)
    const monthFemaleOccupants = monthRecords.reduce((sum, r) => sum + r.femaleOccupants, 0)
    const monthFemaleEmptyBeds = monthRecords.reduce((sum, r) => sum + r.femaleEmptyBeds, 0)
    const monthFemaleNewStudentBeds = monthRecords.reduce(
      (sum, r) => sum + r.femaleNewStudentBeds,
      0,
    )
    const monthPlannedRentedDormitories = monthRecords.reduce(
      (sum, r) => sum + r.plannedRentedDormitories,
      0,
    )
    const monthActualRentedDormitories = monthRecords.reduce(
      (sum, r) => sum + r.actualRentedDormitories,
      0,
    )
    const monthPlannedVacatedDormitories = monthRecords.reduce(
      (sum, r) => sum + r.plannedVacatedDormitories,
      0,
    )
    const monthActualVacatedDormitories = monthRecords.reduce(
      (sum, r) => sum + r.actualVacatedDormitories,
      0,
    )

    records.push({
      key: `month-${month}-total`,
      month,
      name: '合计/平均',
      studentCount: monthStudentCount,
      totalDormitories: monthTotalDormitories,
      totalOccupants: monthTotalOccupants,
      occupancyRate: monthOccupancyRate,
      maleDormitoryCount: monthMaleDormitories,
      maleOccupants: monthMaleOccupants,
      maleEmptyBeds: monthMaleEmptyBeds,
      maleNewStudentBeds: monthMaleNewStudentBeds,
      femaleDormitoryCount: monthFemaleDormitories,
      femaleOccupants: monthFemaleOccupants,
      femaleEmptyBeds: monthFemaleEmptyBeds,
      femaleNewStudentBeds: monthFemaleNewStudentBeds,
      plannedRentedDormitories: monthPlannedRentedDormitories,
      actualRentedDormitories: monthActualRentedDormitories,
      plannedVacatedDormitories: monthPlannedVacatedDormitories,
      actualVacatedDormitories: monthActualVacatedDormitories,
      remarks: '',
      rowType: 'monthly-total',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    })
  }

  // 添加总合计行
  const allDataRecords = records.filter((r) => r.rowType === 'data')
  const totalStudentCount = allDataRecords.reduce((sum, r) => sum + r.studentCount, 0)
  const totalDormitories = allDataRecords.reduce((sum, r) => sum + r.totalDormitories, 0)
  const totalOccupants = allDataRecords.reduce((sum, r) => sum + r.totalOccupants, 0)
  const averageOccupancyRate = totalDormitories > 0 ? (totalOccupants / totalDormitories) * 100 : 0
  const totalMaleDormitories = allDataRecords.reduce((sum, r) => sum + r.maleDormitoryCount, 0)
  const totalMaleOccupants = allDataRecords.reduce((sum, r) => sum + r.maleOccupants, 0)
  const totalMaleEmptyBeds = allDataRecords.reduce((sum, r) => sum + r.maleEmptyBeds, 0)
  const totalMaleNewStudentBeds = allDataRecords.reduce((sum, r) => sum + r.maleNewStudentBeds, 0)
  const totalFemaleDormitories = allDataRecords.reduce((sum, r) => sum + r.femaleDormitoryCount, 0)
  const totalFemaleOccupants = allDataRecords.reduce((sum, r) => sum + r.femaleOccupants, 0)
  const totalFemaleEmptyBeds = allDataRecords.reduce((sum, r) => sum + r.femaleEmptyBeds, 0)
  const totalFemaleNewStudentBeds = allDataRecords.reduce(
    (sum, r) => sum + r.femaleNewStudentBeds,
    0,
  )
  const totalPlannedRentedDormitories = allDataRecords.reduce(
    (sum, r) => sum + r.plannedRentedDormitories,
    0,
  )
  const totalActualRentedDormitories = allDataRecords.reduce(
    (sum, r) => sum + r.actualRentedDormitories,
    0,
  )
  const totalPlannedVacatedDormitories = allDataRecords.reduce(
    (sum, r) => sum + r.plannedVacatedDormitories,
    0,
  )
  const totalActualVacatedDormitories = allDataRecords.reduce(
    (sum, r) => sum + r.actualVacatedDormitories,
    0,
  )

  records.push({
    key: 'grand-total',
    month: 0,
    name: '合计/平均',
    studentCount: totalStudentCount,
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
    rowType: 'grand-total',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  })

  return records
}

export const monthlyPersonalDormitoryManagementService = {
  /**
   * 获取每月个人宿舍管理统计数据
   * @param campus 神殿名称
   * @returns Promise<MonthlyPersonalDormitoryManagementRecord[]>
   */
  getMonthlyPersonalDormitoryManagementData: async (
    campus: string,
  ): Promise<MonthlyPersonalDormitoryManagementRecord[]> => {
    // 模拟API延迟
    await new Promise((resolve) => setTimeout(resolve, 500))

    if (!campus) {
      throw new Error('神殿名称不能为空')
    }

    return generateMonthlyPersonalDormitoryManagementData(campus)
  },

  /**
   * 获取每月个人宿舍管理统计数据
   * @param campus 神殿名称
   * @returns Promise<MonthlyPersonalDormitoryManagementStats>
   */
  getMonthlyPersonalDormitoryManagementStats: async (
    campus: string,
  ): Promise<MonthlyPersonalDormitoryManagementStats> => {
    const data =
      await monthlyPersonalDormitoryManagementService.getMonthlyPersonalDormitoryManagementData(
        campus,
      )
    const dataRows = data.filter((r) => r.rowType === 'data')
    const grandTotalRow = data.find((r) => r.rowType === 'grand-total')

    return {
      totalMonths: 12,
      totalTeachers: dataRows.length / 12,
      totalStudentCount: grandTotalRow?.studentCount || 0,
      totalDormitories: grandTotalRow?.totalDormitories || 0,
      totalOccupants: grandTotalRow?.totalOccupants || 0,
      averageOccupancyRate: grandTotalRow?.occupancyRate || 0,
      totalMaleDormitories: grandTotalRow?.maleDormitoryCount || 0,
      totalMaleOccupants: grandTotalRow?.maleOccupants || 0,
      totalFemaleDormitories: grandTotalRow?.femaleDormitoryCount || 0,
      totalFemaleOccupants: grandTotalRow?.femaleOccupants || 0,
      totalRentedDormitories: grandTotalRow?.actualRentedDormitories || 0,
      totalVacatedDormitories: grandTotalRow?.actualVacatedDormitories || 0,
    }
  },

  /**
   * 导出每月个人宿舍管理统计数据
   * @param campus 神殿名称
   * @returns Promise<Blob>
   */
  exportMonthlyPersonalDormitoryManagementData: async (campus: string): Promise<Blob> => {
    const data =
      await monthlyPersonalDormitoryManagementService.getMonthlyPersonalDormitoryManagementData(
        campus,
      )

    const csvContent = [
      '月份,姓名,带班人数,宿舍管理总数量,住宿总人数,住宿率,男宿总数量,男宿总人数,男宿空床位总数量,适合男新生床位数,女宿总数量,女宿总人数,女宿空床位总数量,适合女新生住宿床位,计划租宿舍数量,实际租宿舍数量,计划退宿舍数量,实际退宿舍数量,备注',
      ...data.map(
        (item) =>
          `${item.month === 0 ? '合计/平均' : item.month},${item.name},${item.studentCount},${item.totalDormitories},${item.totalOccupants},${item.occupancyRate.toFixed(2)}%,${item.maleDormitoryCount},${item.maleOccupants},${item.maleEmptyBeds},${item.maleNewStudentBeds},${item.femaleDormitoryCount},${item.femaleOccupants},${item.femaleEmptyBeds},${item.femaleNewStudentBeds},${item.plannedRentedDormitories},${item.actualRentedDormitories},${item.plannedVacatedDormitories},${item.actualVacatedDormitories},${item.remarks}`,
      ),
    ].join('\n')

    return new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  },
}
