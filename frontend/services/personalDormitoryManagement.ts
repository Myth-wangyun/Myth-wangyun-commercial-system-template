// [教质模块] 神殿教化司个人宿舍管理统计表数据服务
/**
 * 神殿教化司个人宿舍管理统计表数据服务
 */

import type {
  PersonalDormitoryManagementRecord,
  PersonalDormitoryManagementStats,
} from '../types/personal-dormitory-management'

// 生成个人宿舍管理统计数据
const generatePersonalDormitoryManagementData = (
  campus: string,
): PersonalDormitoryManagementRecord[] => {
  const records: PersonalDormitoryManagementRecord[] = []

  const teacherNames = ['李晓', '姜楠', '周晓森', '张老师', '李老师', '王老师', '赵老师']

  for (let i = 0; i < teacherNames.length; i++) {
    const studentCount = Math.floor(Math.random() * 50) + 50 // 50-100
    const totalDormitories = Math.floor(Math.random() * 8) + 2 // 2-10
    const totalOccupants = Math.floor(Math.random() * 80) + 20 // 20-100

    // 计算住宿率
    const occupancyRate = totalDormitories > 0 ? (totalOccupants / totalDormitories) * 100 : 0

    const maleDormitoryCount = Math.floor(Math.random() * 5) + 1 // 1-6
    const maleOccupants = Math.floor(Math.random() * 50) + 10 // 10-60
    const maleEmptyBeds = Math.max(0, maleDormitoryCount * 8 - maleOccupants) // 假设每宿舍8个床位
    const maleNewStudentBeds = Math.max(0, maleEmptyBeds - Math.floor(Math.random() * 3)) // 空闲床位减去一些

    const femaleDormitoryCount = Math.floor(Math.random() * 5) + 1 // 1-6
    const femaleOccupants = Math.floor(Math.random() * 50) + 10 // 10-60
    const femaleEmptyBeds = Math.max(0, femaleDormitoryCount * 8 - femaleOccupants)
    const femaleNewStudentBeds = Math.max(0, femaleEmptyBeds - Math.floor(Math.random() * 3))

    const plannedRentedDormitories = Math.floor(Math.random() * 3) // 0-3
    const actualRentedDormitories = Math.floor(Math.random() * 3)
    const plannedVacatedDormitories = Math.floor(Math.random() * 2) // 0-2
    const actualVacatedDormitories = Math.floor(Math.random() * 2)

    records.push({
      key: `teacher-${i + 1}`,
      serialNumber: i + 1,
      teacherName: teacherNames[i],
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

  // 添加合计/平均行
  const totalStudentCount = records.reduce((sum, r) => sum + r.studentCount, 0)
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
    serialNumber: 0,
    teacherName: '合计/平均',
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
    rowType: 'total',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  })

  return records
}

export const personalDormitoryManagementService = {
  /**
   * 获取个人宿舍管理统计数据
   * @param campus 神殿名称
   * @returns Promise<PersonalDormitoryManagementRecord[]>
   */
  getPersonalDormitoryManagementData: async (
    campus: string,
  ): Promise<PersonalDormitoryManagementRecord[]> => {
    // 模拟API延迟
    await new Promise((resolve) => setTimeout(resolve, 500))

    if (!campus) {
      throw new Error('神殿名称不能为空')
    }

    return generatePersonalDormitoryManagementData(campus)
  },

  /**
   * 获取个人宿舍管理统计数据
   * @param campus 神殿名称
   * @returns Promise<PersonalDormitoryManagementStats>
   */
  getPersonalDormitoryManagementStats: async (
    campus: string,
  ): Promise<PersonalDormitoryManagementStats> => {
    const data = await personalDormitoryManagementService.getPersonalDormitoryManagementData(campus)
    const dataRows = data.filter((r) => r.rowType === 'data')
    const totalRow = data.find((r) => r.rowType === 'total')

    return {
      totalTeachers: dataRows.length,
      totalStudentCount: totalRow?.studentCount || 0,
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
   * 导出个人宿舍管理统计数据
   * @param campus 神殿名称
   * @returns Promise<Blob>
   */
  exportPersonalDormitoryManagementData: async (campus: string): Promise<Blob> => {
    const data = await personalDormitoryManagementService.getPersonalDormitoryManagementData(campus)

    const csvContent = [
      '序号,班主任姓名,带班人数,宿舍管理总数量,住宿总人数,住宿率,男宿总数量,男宿总人数,男宿空床位总数量,适合男新生床位数,女宿总数量,女宿总人数,女宿空床位总数量,适合女新生住宿床位,计划租宿舍数量,实际租宿舍数量,计划退宿舍数量,实际退宿舍数量,备注',
      ...data.map(
        (item) =>
          `${item.serialNumber === 0 ? '合计/平均' : item.serialNumber},${item.teacherName},${item.studentCount},${item.totalDormitories},${item.totalOccupants},${item.occupancyRate.toFixed(2)}%,${item.maleDormitoryCount},${item.maleOccupants},${item.maleEmptyBeds},${item.maleNewStudentBeds},${item.femaleDormitoryCount},${item.femaleOccupants},${item.femaleEmptyBeds},${item.femaleNewStudentBeds},${item.plannedRentedDormitories},${item.actualRentedDormitories},${item.plannedVacatedDormitories},${item.actualVacatedDormitories},${item.remarks}`,
      ),
    ].join('\n')

    return new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  },
}
