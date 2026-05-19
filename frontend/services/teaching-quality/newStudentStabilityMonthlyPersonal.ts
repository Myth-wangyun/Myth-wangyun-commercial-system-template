/**
 * 神殿教化司新生维稳月度个人统计表数据服务
 */

import type {
  NewStudentStabilityMonthlyPersonalRecord,
  NewStudentStabilityMonthlyPersonalStats,
} from '../../types/new-student-stability-monthly-personal'

// 生成新生维稳月度个人统计数据
const generateNewStudentStabilityMonthlyPersonalData = (
  campus: string,
): NewStudentStabilityMonthlyPersonalRecord[] => {
  const records: NewStudentStabilityMonthlyPersonalRecord[] = []

  const teacherNames = ['马晴', '郭彩兰', '姜楠', '李晓平']

  // 生成1-12月的数据
  for (let month = 1; month <= 12; month++) {
    // 为每个月生成4个班主任的数据
    for (let i = 0; i < teacherNames.length; i++) {
      const handoverCount = Math.floor(Math.random() * 15) + 5 // 5-20
      const reportedCount = Math.floor(handoverCount * (0.8 + Math.random() * 0.2)) // 80%-100%
      const stableClassHoursCount = Math.floor(reportedCount * (0.7 + Math.random() * 0.2)) // 70%-90%
      const unstableClassHoursCount = reportedCount - stableClassHoursCount
      const fullPaymentCount = Math.floor(stableClassHoursCount * (0.8 + Math.random() * 0.2)) // 80%-100%
      const outstandingFeesCount = stableClassHoursCount - fullPaymentCount
      const outstandingFeesAmount =
        outstandingFeesCount * (Math.floor(Math.random() * 20000) + 10000) // 10000-30000 per person
      const refundCount = Math.floor(Math.random() * 3) // 0-3
      const refundRate = reportedCount > 0 ? (refundCount / reportedCount) * 100 : 0

      records.push({
        key: `month-${month}-teacher-${i + 1}`,
        month,
        teacherName: teacherNames[i],
        handoverCount,
        reportedCount,
        stableClassHoursCount,
        unstableClassHoursCount,
        fullPaymentCount,
        outstandingFeesCount,
        outstandingFeesAmount,
        refundCount,
        refundRate,
        refundExplanation: refundCount > 0 ? `退费原因：个人原因${i + 1}` : '',
        rowType: 'data',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      })
    }

    // 添加月合计行
    const monthRecords = records.filter((r) => r.month === month && r.rowType === 'data')
    const monthHandoverCount = monthRecords.reduce((sum, r) => sum + r.handoverCount, 0)
    const monthReportedCount = monthRecords.reduce((sum, r) => sum + r.reportedCount, 0)
    const monthStableClassHoursCount = monthRecords.reduce(
      (sum, r) => sum + r.stableClassHoursCount,
      0,
    )
    const monthUnstableClassHoursCount = monthRecords.reduce(
      (sum, r) => sum + r.unstableClassHoursCount,
      0,
    )
    const monthFullPaymentCount = monthRecords.reduce((sum, r) => sum + r.fullPaymentCount, 0)
    const monthOutstandingFeesCount = monthRecords.reduce(
      (sum, r) => sum + r.outstandingFeesCount,
      0,
    )
    const monthOutstandingFeesAmount = monthRecords.reduce(
      (sum, r) => sum + r.outstandingFeesAmount,
      0,
    )
    const monthRefundCount = monthRecords.reduce((sum, r) => sum + r.refundCount, 0)
    const monthRefundRate =
      monthReportedCount > 0 ? (monthRefundCount / monthReportedCount) * 100 : 0

    records.push({
      key: `month-${month}-total`,
      month,
      teacherName: '合计',
      handoverCount: monthHandoverCount,
      reportedCount: monthReportedCount,
      stableClassHoursCount: monthStableClassHoursCount,
      unstableClassHoursCount: monthUnstableClassHoursCount,
      fullPaymentCount: monthFullPaymentCount,
      outstandingFeesCount: monthOutstandingFeesCount,
      outstandingFeesAmount: monthOutstandingFeesAmount,
      refundCount: monthRefundCount,
      refundRate: monthRefundRate,
      refundExplanation: '',
      rowType: 'monthly-total',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    })
  }

  // 添加总合计行
  const allDataRecords = records.filter((r) => r.rowType === 'data')
  const totalHandoverCount = allDataRecords.reduce((sum, r) => sum + r.handoverCount, 0)
  const totalReportedCount = allDataRecords.reduce((sum, r) => sum + r.reportedCount, 0)
  const totalStableClassHoursCount = allDataRecords.reduce(
    (sum, r) => sum + r.stableClassHoursCount,
    0,
  )
  const totalUnstableClassHoursCount = allDataRecords.reduce(
    (sum, r) => sum + r.unstableClassHoursCount,
    0,
  )
  const totalFullPaymentCount = allDataRecords.reduce((sum, r) => sum + r.fullPaymentCount, 0)
  const totalOutstandingFeesCount = allDataRecords.reduce(
    (sum, r) => sum + r.outstandingFeesCount,
    0,
  )
  const totalOutstandingFeesAmount = allDataRecords.reduce(
    (sum, r) => sum + r.outstandingFeesAmount,
    0,
  )
  const totalRefundCount = allDataRecords.reduce((sum, r) => sum + r.refundCount, 0)
  const totalRefundRate = totalReportedCount > 0 ? (totalRefundCount / totalReportedCount) * 100 : 0

  records.push({
    key: 'grand-total',
    month: 0,
    teacherName: '合计',
    handoverCount: totalHandoverCount,
    reportedCount: totalReportedCount,
    stableClassHoursCount: totalStableClassHoursCount,
    unstableClassHoursCount: totalUnstableClassHoursCount,
    fullPaymentCount: totalFullPaymentCount,
    outstandingFeesCount: totalOutstandingFeesCount,
    outstandingFeesAmount: totalOutstandingFeesAmount,
    refundCount: totalRefundCount,
    refundRate: totalRefundRate,
    refundExplanation: '',
    rowType: 'grand-total',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  })

  return records
}

export const newStudentStabilityMonthlyPersonalService = {
  /**
   * 获取新生维稳月度个人统计数据
   * @param campus 神殿名称
   * @returns Promise<NewStudentStabilityMonthlyPersonalRecord[]>
   */
  getNewStudentStabilityMonthlyPersonalData: async (
    campus: string,
  ): Promise<NewStudentStabilityMonthlyPersonalRecord[]> => {
    // 模拟API延迟
    await new Promise((resolve) => setTimeout(resolve, 500))

    if (!campus) {
      throw new Error('神殿名称不能为空')
    }

    return generateNewStudentStabilityMonthlyPersonalData(campus)
  },

  /**
   * 获取新生维稳月度个人统计数据
   * @param campus 神殿名称
   * @returns Promise<NewStudentStabilityMonthlyPersonalStats>
   */
  getNewStudentStabilityMonthlyPersonalStats: async (
    campus: string,
  ): Promise<NewStudentStabilityMonthlyPersonalStats> => {
    const data =
      await newStudentStabilityMonthlyPersonalService.getNewStudentStabilityMonthlyPersonalData(
        campus,
      )
    const dataRows = data.filter((r) => r.rowType === 'data')
    const grandTotalRow = data.find((r) => r.rowType === 'grand-total')

    return {
      totalMonths: 12,
      totalTeachers: dataRows.length / 12, // 每月4个班主任
      totalHandoverCount: grandTotalRow?.handoverCount || 0,
      totalReportedCount: grandTotalRow?.reportedCount || 0,
      totalStableClassHoursCount: grandTotalRow?.stableClassHoursCount || 0,
      totalUnstableClassHoursCount: grandTotalRow?.unstableClassHoursCount || 0,
      totalFullPaymentCount: grandTotalRow?.fullPaymentCount || 0,
      totalOutstandingFeesCount: grandTotalRow?.outstandingFeesCount || 0,
      totalOutstandingFeesAmount: grandTotalRow?.outstandingFeesAmount || 0,
      totalRefundCount: grandTotalRow?.refundCount || 0,
      averageRefundRate: grandTotalRow?.refundRate || 0,
    }
  },

  /**
   * 导出新生维稳月度个人统计数据
   * @param campus 神殿名称
   * @returns Promise<Blob>
   */
  exportNewStudentStabilityMonthlyPersonalData: async (campus: string): Promise<Blob> => {
    const data =
      await newStudentStabilityMonthlyPersonalService.getNewStudentStabilityMonthlyPersonalData(
        campus,
      )

    const csvContent = [
      '月份,班主任姓名,交接人数,报道人数,稳定过课时人数,未过课时人数,回全款人数,仍欠费人数,欠费总金额,退费人数,新生退费率,退费学员情况说明',
      ...data.map(
        (item) =>
          `${item.month === 0 ? '合计' : item.month},${item.teacherName},${item.handoverCount},${item.reportedCount},${item.stableClassHoursCount},${item.unstableClassHoursCount},${item.fullPaymentCount},${item.outstandingFeesCount},${item.outstandingFeesAmount},${item.refundCount},${item.refundRate.toFixed(2)}%,${item.refundExplanation}`,
      ),
    ].join('\n')

    return new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  },
}
