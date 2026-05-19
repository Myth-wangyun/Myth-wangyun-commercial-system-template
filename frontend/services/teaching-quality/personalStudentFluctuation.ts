/**
 * 神殿教化司个人统计学员异动表数据服务
 */

import type {
  PersonalStudentFluctuationRecord,
  PersonalStudentFluctuationStats,
} from '../../types/personal-student-fluctuation'

// 生成个人统计学员异动数据
const generatePersonalStudentFluctuationData = (
  campus: string,
): PersonalStudentFluctuationRecord[] => {
  const records: PersonalStudentFluctuationRecord[] = []

  const teacherNames = ['马晴', '郭彩兰', '李晓平', '张老师', '李老师', '王老师', '赵老师']

  for (let i = 0; i < teacherNames.length; i++) {
    const cumulativeStudentCount = Math.floor(Math.random() * 100) + 50 // 50-150
    const newStudentRefundCount = Math.floor(Math.random() * 3) // 0-3
    const oldStudentRefundCount = Math.floor(Math.random() * 2) // 0-2
    const totalRefundCount = newStudentRefundCount + oldStudentRefundCount

    // 计算退费率
    const refundRate =
      cumulativeStudentCount > 0 ? (totalRefundCount / cumulativeStudentCount) * 100 : 0

    const totalSuspensionCount = Math.floor(Math.random() * 5) // 0-5
    const totalLongTermLeaveCount = Math.floor(Math.random() * 6) // 0-6
    const totalLongTermAbsenteeCount = Math.floor(Math.random() * 4) // 0-4
    const winterSummerBreakCount = Math.floor(Math.random() * 10) // 0-10
    const otherSituationsCount = Math.floor(Math.random() * 3) // 0-3

    // 计算异动总人数和异动率
    const totalFluctuationCount =
      totalRefundCount +
      totalSuspensionCount +
      totalLongTermLeaveCount +
      totalLongTermAbsenteeCount +
      winterSummerBreakCount +
      otherSituationsCount
    const fluctuationRate =
      cumulativeStudentCount > 0 ? (totalFluctuationCount / cumulativeStudentCount) * 100 : 0

    records.push({
      key: `teacher-${i + 1}`,
      serialNumber: i + 1,
      teacherName: teacherNames[i],
      cumulativeStudentCount,
      newStudentRefundCount,
      oldStudentRefundCount,
      totalRefundCount,
      refundRate,
      totalSuspensionCount,
      totalLongTermLeaveCount,
      totalLongTermAbsenteeCount,
      winterSummerBreakCount,
      otherSituationsCount,
      totalFluctuationCount,
      fluctuationRate,
      rowType: 'data',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    })
  }

  // 添加合计/平均行
  const totalCumulativeStudentCount = records.reduce((sum, r) => sum + r.cumulativeStudentCount, 0)
  const totalNewStudentRefundCount = records.reduce((sum, r) => sum + r.newStudentRefundCount, 0)
  const totalOldStudentRefundCount = records.reduce((sum, r) => sum + r.oldStudentRefundCount, 0)
  const totalRefundCount = records.reduce((sum, r) => sum + r.totalRefundCount, 0)
  const totalSuspensionCount = records.reduce((sum, r) => sum + r.totalSuspensionCount, 0)
  const totalLongTermLeaveCount = records.reduce((sum, r) => sum + r.totalLongTermLeaveCount, 0)
  const totalLongTermAbsenteeCount = records.reduce(
    (sum, r) => sum + r.totalLongTermAbsenteeCount,
    0,
  )
  const totalWinterSummerBreakCount = records.reduce((sum, r) => sum + r.winterSummerBreakCount, 0)
  const totalOtherSituationsCount = records.reduce((sum, r) => sum + r.otherSituationsCount, 0)
  const totalFluctuationCount = records.reduce((sum, r) => sum + r.totalFluctuationCount, 0)

  // 计算平均退费率和异动率
  const averageRefundRate =
    totalCumulativeStudentCount > 0 ? (totalRefundCount / totalCumulativeStudentCount) * 100 : 0
  const averageFluctuationRate =
    totalCumulativeStudentCount > 0
      ? (totalFluctuationCount / totalCumulativeStudentCount) * 100
      : 0

  records.push({
    key: 'total',
    serialNumber: 0,
    teacherName: '合计/平均',
    cumulativeStudentCount: totalCumulativeStudentCount,
    newStudentRefundCount: totalNewStudentRefundCount,
    oldStudentRefundCount: totalOldStudentRefundCount,
    totalRefundCount,
    refundRate: averageRefundRate,
    totalSuspensionCount,
    totalLongTermLeaveCount,
    totalLongTermAbsenteeCount,
    winterSummerBreakCount: totalWinterSummerBreakCount,
    otherSituationsCount: totalOtherSituationsCount,
    totalFluctuationCount,
    fluctuationRate: averageFluctuationRate,
    rowType: 'total',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  })

  return records
}

export const personalStudentFluctuationService = {
  /**
   * 获取个人统计学员异动数据
   * @param campus 神殿名称
   * @returns Promise<PersonalStudentFluctuationRecord[]>
   */
  getPersonalStudentFluctuationData: async (
    campus: string,
  ): Promise<PersonalStudentFluctuationRecord[]> => {
    // 模拟API延迟
    await new Promise((resolve) => setTimeout(resolve, 500))

    if (!campus) {
      throw new Error('神殿名称不能为空')
    }

    return generatePersonalStudentFluctuationData(campus)
  },

  /**
   * 获取个人统计学员异动统计数据
   * @param campus 神殿名称
   * @returns Promise<PersonalStudentFluctuationStats>
   */
  getPersonalStudentFluctuationStats: async (
    campus: string,
  ): Promise<PersonalStudentFluctuationStats> => {
    const data = await personalStudentFluctuationService.getPersonalStudentFluctuationData(campus)
    const dataRows = data.filter((r) => r.rowType === 'data')
    const totalRow = data.find((r) => r.rowType === 'total')

    return {
      totalTeachers: dataRows.length,
      totalCumulativeStudentCount: totalRow?.cumulativeStudentCount || 0,
      totalNewStudentRefundCount: totalRow?.newStudentRefundCount || 0,
      totalOldStudentRefundCount: totalRow?.oldStudentRefundCount || 0,
      totalRefundCount: totalRow?.totalRefundCount || 0,
      averageRefundRate: totalRow?.refundRate || 0,
      totalSuspensionCount: totalRow?.totalSuspensionCount || 0,
      totalLongTermLeaveCount: totalRow?.totalLongTermLeaveCount || 0,
      totalLongTermAbsenteeCount: totalRow?.totalLongTermAbsenteeCount || 0,
      totalWinterSummerBreakCount: totalRow?.winterSummerBreakCount || 0,
      totalOtherSituationsCount: totalRow?.otherSituationsCount || 0,
      totalFluctuationCount: totalRow?.totalFluctuationCount || 0,
      averageFluctuationRate: totalRow?.fluctuationRate || 0,
    }
  },

  /**
   * 导出个人统计学员异动数据
   * @param campus 神殿名称
   * @returns Promise<Blob>
   */
  exportPersonalStudentFluctuationData: async (campus: string): Promise<Blob> => {
    const data = await personalStudentFluctuationService.getPersonalStudentFluctuationData(campus)

    const csvContent = [
      '序号,班主任姓名,累计带生人数,新生退费人数,老生退费人数,退费总人数,退费率,休学总人数(累计),长期请假总人数(累计),长期不上课总人数(累计),寒暑假学生总数(累计),其他情况总人数(累计),异动总人数(累计),异动率',
      ...data.map(
        (item) =>
          `${item.serialNumber === 0 ? '合计/平均' : item.serialNumber},${item.teacherName},${item.cumulativeStudentCount},${item.newStudentRefundCount},${item.oldStudentRefundCount},${item.totalRefundCount},${item.refundRate.toFixed(2)}%,${item.totalSuspensionCount},${item.totalLongTermLeaveCount},${item.totalLongTermAbsenteeCount},${item.winterSummerBreakCount},${item.otherSituationsCount},${item.totalFluctuationCount},${item.fluctuationRate.toFixed(2)}%`,
      ),
    ].join('\n')

    return new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  },
}
