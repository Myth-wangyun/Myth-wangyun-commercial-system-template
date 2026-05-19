// [教质模块] 神殿教化司月度个人统计学员异动表数据服务
/**
 * 神殿教化司月度个人统计学员异动表数据服务
 */

import type {
  MonthlyPersonalStudentFluctuationRecord,
  MonthlyPersonalStudentFluctuationStats,
} from '../types/monthly-personal-student-fluctuation'

// 生成月度个人统计学员异动数据
const generateMonthlyPersonalStudentFluctuationData = (
  campus: string,
): MonthlyPersonalStudentFluctuationRecord[] => {
  const records: MonthlyPersonalStudentFluctuationRecord[] = []

  const teacherNames = ['马晴', '郭彩兰', '李晓平']

  // 生成1-12月的数据
  for (let month = 1; month <= 12; month++) {
    // 为每个月生成3个班主任的数据
    for (let i = 0; i < teacherNames.length; i++) {
      const cumulativeStudentCount = Math.floor(Math.random() * 80) + 20 // 20-100
      const newStudentRefundCount = Math.floor(Math.random() * 2) // 0-2
      const oldStudentRefundCount = Math.floor(Math.random() * 2) // 0-2
      const totalRefundCount = newStudentRefundCount + oldStudentRefundCount

      // 计算退费率
      const refundRate =
        cumulativeStudentCount > 0 ? (totalRefundCount / cumulativeStudentCount) * 100 : 0

      const totalSuspensionCount = Math.floor(Math.random() * 3) // 0-3
      const totalLongTermLeaveCount = Math.floor(Math.random() * 4) // 0-4
      const totalLongTermAbsenteeCount = Math.floor(Math.random() * 3) // 0-3
      const winterSummerBreakCount = Math.floor(Math.random() * 8) // 0-8
      const otherSituationsCount = Math.floor(Math.random() * 2) // 0-2

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
        key: `month-${month}-teacher-${i + 1}`,
        month,
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

    // 添加月合计行
    const monthRecords = records.filter((r) => r.month === month && r.rowType === 'data')
    const monthCumulativeStudentCount = monthRecords.reduce(
      (sum, r) => sum + r.cumulativeStudentCount,
      0,
    )
    const monthNewStudentRefundCount = monthRecords.reduce(
      (sum, r) => sum + r.newStudentRefundCount,
      0,
    )
    const monthOldStudentRefundCount = monthRecords.reduce(
      (sum, r) => sum + r.oldStudentRefundCount,
      0,
    )
    const monthTotalRefundCount = monthRecords.reduce((sum, r) => sum + r.totalRefundCount, 0)
    const monthTotalSuspensionCount = monthRecords.reduce(
      (sum, r) => sum + r.totalSuspensionCount,
      0,
    )
    const monthTotalLongTermLeaveCount = monthRecords.reduce(
      (sum, r) => sum + r.totalLongTermLeaveCount,
      0,
    )
    const monthTotalLongTermAbsenteeCount = monthRecords.reduce(
      (sum, r) => sum + r.totalLongTermAbsenteeCount,
      0,
    )
    const monthWinterSummerBreakCount = monthRecords.reduce(
      (sum, r) => sum + r.winterSummerBreakCount,
      0,
    )
    const monthOtherSituationsCount = monthRecords.reduce(
      (sum, r) => sum + r.otherSituationsCount,
      0,
    )
    const monthTotalFluctuationCount = monthRecords.reduce(
      (sum, r) => sum + r.totalFluctuationCount,
      0,
    )

    // 计算月平均退费率和异动率
    const monthRefundRate =
      monthCumulativeStudentCount > 0
        ? (monthTotalRefundCount / monthCumulativeStudentCount) * 100
        : 0
    const monthFluctuationRate =
      monthCumulativeStudentCount > 0
        ? (monthTotalFluctuationCount / monthCumulativeStudentCount) * 100
        : 0

    records.push({
      key: `month-${month}-total`,
      month,
      teacherName: '合计/平均',
      cumulativeStudentCount: monthCumulativeStudentCount,
      newStudentRefundCount: monthNewStudentRefundCount,
      oldStudentRefundCount: monthOldStudentRefundCount,
      totalRefundCount: monthTotalRefundCount,
      refundRate: monthRefundRate,
      totalSuspensionCount: monthTotalSuspensionCount,
      totalLongTermLeaveCount: monthTotalLongTermLeaveCount,
      totalLongTermAbsenteeCount: monthTotalLongTermAbsenteeCount,
      winterSummerBreakCount: monthWinterSummerBreakCount,
      otherSituationsCount: monthOtherSituationsCount,
      totalFluctuationCount: monthTotalFluctuationCount,
      fluctuationRate: monthFluctuationRate,
      rowType: 'monthly-total',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    })
  }

  // 添加总合计行
  const allDataRecords = records.filter((r) => r.rowType === 'data')
  const totalCumulativeStudentCount = allDataRecords.reduce(
    (sum, r) => sum + r.cumulativeStudentCount,
    0,
  )
  const totalNewStudentRefundCount = allDataRecords.reduce(
    (sum, r) => sum + r.newStudentRefundCount,
    0,
  )
  const totalOldStudentRefundCount = allDataRecords.reduce(
    (sum, r) => sum + r.oldStudentRefundCount,
    0,
  )
  const totalRefundCount = allDataRecords.reduce((sum, r) => sum + r.totalRefundCount, 0)
  const totalSuspensionCount = allDataRecords.reduce((sum, r) => sum + r.totalSuspensionCount, 0)
  const totalLongTermLeaveCount = allDataRecords.reduce(
    (sum, r) => sum + r.totalLongTermLeaveCount,
    0,
  )
  const totalLongTermAbsenteeCount = allDataRecords.reduce(
    (sum, r) => sum + r.totalLongTermAbsenteeCount,
    0,
  )
  const totalWinterSummerBreakCount = allDataRecords.reduce(
    (sum, r) => sum + r.winterSummerBreakCount,
    0,
  )
  const totalOtherSituationsCount = allDataRecords.reduce(
    (sum, r) => sum + r.otherSituationsCount,
    0,
  )
  const totalFluctuationCount = allDataRecords.reduce((sum, r) => sum + r.totalFluctuationCount, 0)

  // 计算总平均退费率和异动率
  const averageRefundRate =
    totalCumulativeStudentCount > 0 ? (totalRefundCount / totalCumulativeStudentCount) * 100 : 0
  const averageFluctuationRate =
    totalCumulativeStudentCount > 0
      ? (totalFluctuationCount / totalCumulativeStudentCount) * 100
      : 0

  records.push({
    key: 'grand-total',
    month: 0,
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
    rowType: 'grand-total',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  })

  return records
}

export const monthlyPersonalStudentFluctuationService = {
  /**
   * 获取月度个人统计学员异动数据
   * @param campus 神殿名称
   * @returns Promise<MonthlyPersonalStudentFluctuationRecord[]>
   */
  getMonthlyPersonalStudentFluctuationData: async (
    campus: string,
  ): Promise<MonthlyPersonalStudentFluctuationRecord[]> => {
    // 模拟API延迟
    await new Promise((resolve) => setTimeout(resolve, 500))

    if (!campus) {
      throw new Error('神殿名称不能为空')
    }

    return generateMonthlyPersonalStudentFluctuationData(campus)
  },

  /**
   * 获取月度个人统计学员异动统计数据
   * @param campus 神殿名称
   * @returns Promise<MonthlyPersonalStudentFluctuationStats>
   */
  getMonthlyPersonalStudentFluctuationStats: async (
    campus: string,
  ): Promise<MonthlyPersonalStudentFluctuationStats> => {
    const data =
      await monthlyPersonalStudentFluctuationService.getMonthlyPersonalStudentFluctuationData(
        campus,
      )
    const dataRows = data.filter((r) => r.rowType === 'data')
    const grandTotalRow = data.find((r) => r.rowType === 'grand-total')

    return {
      totalMonths: 12,
      totalTeachers: dataRows.length / 12, // 每月3个班主任
      totalCumulativeStudentCount: grandTotalRow?.cumulativeStudentCount || 0,
      totalNewStudentRefundCount: grandTotalRow?.newStudentRefundCount || 0,
      totalOldStudentRefundCount: grandTotalRow?.oldStudentRefundCount || 0,
      totalRefundCount: grandTotalRow?.totalRefundCount || 0,
      averageRefundRate: grandTotalRow?.refundRate || 0,
      totalSuspensionCount: grandTotalRow?.totalSuspensionCount || 0,
      totalLongTermLeaveCount: grandTotalRow?.totalLongTermLeaveCount || 0,
      totalLongTermAbsenteeCount: grandTotalRow?.totalLongTermAbsenteeCount || 0,
      totalWinterSummerBreakCount: grandTotalRow?.winterSummerBreakCount || 0,
      totalOtherSituationsCount: grandTotalRow?.otherSituationsCount || 0,
      totalFluctuationCount: grandTotalRow?.totalFluctuationCount || 0,
      averageFluctuationRate: grandTotalRow?.fluctuationRate || 0,
    }
  },

  /**
   * 导出月度个人统计学员异动数据
   * @param campus 神殿名称
   * @returns Promise<Blob>
   */
  exportMonthlyPersonalStudentFluctuationData: async (campus: string): Promise<Blob> => {
    const data =
      await monthlyPersonalStudentFluctuationService.getMonthlyPersonalStudentFluctuationData(
        campus,
      )

    const csvContent = [
      '月份,班主任姓名,累计带生人数,新生退费人数,老生退费人数,退费总人数,退费率,休学总人数,长期请假总人数,长期不上课总人数,寒暑假学生总数,其他情况总人数,异动总人数,异动率',
      ...data.map(
        (item) =>
          `${item.month === 0 ? '合计/平均' : item.month},${item.teacherName},${item.cumulativeStudentCount},${item.newStudentRefundCount},${item.oldStudentRefundCount},${item.totalRefundCount},${item.refundRate.toFixed(2)}%,${item.totalSuspensionCount},${item.totalLongTermLeaveCount},${item.totalLongTermAbsenteeCount},${item.winterSummerBreakCount},${item.otherSituationsCount},${item.totalFluctuationCount},${item.fluctuationRate.toFixed(2)}%`,
      ),
    ].join('\n')

    return new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  },
}
