/**
 * 神殿教化司新生维稳个人统计表数据服务
 */

import type {
  NewStudentStabilityPersonalRecord,
  NewStudentStabilityPersonalStats,
} from '../../types/new-student-stability-personal'

// 生成新生维稳个人统计数据
const generateNewStudentStabilityPersonalData = (
  campus: string,
): NewStudentStabilityPersonalRecord[] => {
  const records: NewStudentStabilityPersonalRecord[] = []

  const teacherNames = ['马晴', '郭彩兰', '姜楠', '李晓平']

  for (let i = 0; i < teacherNames.length; i++) {
    const handoverCount = Math.floor(Math.random() * 20) + 10 // 10-30
    const reportedCount = Math.floor(handoverCount * (0.8 + Math.random() * 0.2)) // 80%-100%
    const stableClassHoursCount = Math.floor(reportedCount * (0.7 + Math.random() * 0.2)) // 70%-90%
    const unstableClassHoursCount = reportedCount - stableClassHoursCount
    const fullPaymentCount = Math.floor(stableClassHoursCount * (0.8 + Math.random() * 0.2)) // 80%-100%
    const outstandingFeesCount = stableClassHoursCount - fullPaymentCount
    const outstandingFeesAmount = outstandingFeesCount * (Math.floor(Math.random() * 20000) + 10000) // 10000-30000 per person
    const refundCount = Math.floor(Math.random() * 3) // 0-3
    const refundRate = reportedCount > 0 ? (refundCount / reportedCount) * 100 : 0

    records.push({
      key: `teacher-${i + 1}`,
      serialNumber: i + 1,
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

  // 添加合计行
  const totalHandoverCount = records.reduce((sum, r) => sum + r.handoverCount, 0)
  const totalReportedCount = records.reduce((sum, r) => sum + r.reportedCount, 0)
  const totalStableClassHoursCount = records.reduce((sum, r) => sum + r.stableClassHoursCount, 0)
  const totalUnstableClassHoursCount = records.reduce(
    (sum, r) => sum + r.unstableClassHoursCount,
    0,
  )
  const totalFullPaymentCount = records.reduce((sum, r) => sum + r.fullPaymentCount, 0)
  const totalOutstandingFeesCount = records.reduce((sum, r) => sum + r.outstandingFeesCount, 0)
  const totalOutstandingFeesAmount = records.reduce((sum, r) => sum + r.outstandingFeesAmount, 0)
  const totalRefundCount = records.reduce((sum, r) => sum + r.refundCount, 0)
  const totalRefundRate = totalReportedCount > 0 ? (totalRefundCount / totalReportedCount) * 100 : 0

  records.push({
    key: 'total',
    serialNumber: 0,
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
    rowType: 'total',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  })

  return records
}

export const newStudentStabilityPersonalService = {
  /**
   * 获取新生维稳个人统计数据
   * @param campus 神殿名称
   * @returns Promise<NewStudentStabilityPersonalRecord[]>
   */
  getNewStudentStabilityPersonalData: async (
    campus: string,
  ): Promise<NewStudentStabilityPersonalRecord[]> => {
    // 模拟API延迟
    await new Promise((resolve) => setTimeout(resolve, 500))

    if (!campus) {
      throw new Error('神殿名称不能为空')
    }

    return generateNewStudentStabilityPersonalData(campus)
  },

  /**
   * 获取新生维稳个人统计数据
   * @param campus 神殿名称
   * @returns Promise<NewStudentStabilityPersonalStats>
   */
  getNewStudentStabilityPersonalStats: async (
    campus: string,
  ): Promise<NewStudentStabilityPersonalStats> => {
    const data = await newStudentStabilityPersonalService.getNewStudentStabilityPersonalData(campus)
    const dataRows = data.filter((r) => r.rowType === 'data')
    const totalRow = data.find((r) => r.rowType === 'total')

    return {
      totalTeachers: dataRows.length,
      totalHandoverCount: totalRow?.handoverCount || 0,
      totalReportedCount: totalRow?.reportedCount || 0,
      totalStableClassHoursCount: totalRow?.stableClassHoursCount || 0,
      totalUnstableClassHoursCount: totalRow?.unstableClassHoursCount || 0,
      totalFullPaymentCount: totalRow?.fullPaymentCount || 0,
      totalOutstandingFeesCount: totalRow?.outstandingFeesCount || 0,
      totalOutstandingFeesAmount: totalRow?.outstandingFeesAmount || 0,
      totalRefundCount: totalRow?.refundCount || 0,
      averageRefundRate: totalRow?.refundRate || 0,
    }
  },

  /**
   * 导出新生维稳个人统计数据
   * @param campus 神殿名称
   * @returns Promise<Blob>
   */
  exportNewStudentStabilityPersonalData: async (campus: string): Promise<Blob> => {
    const data = await newStudentStabilityPersonalService.getNewStudentStabilityPersonalData(campus)

    const csvContent = [
      '序号,班主任姓名,交接人数,报道人数,稳定过课时人数,未过课时人数,回全款人数,仍欠费人数,欠费总金额,退费人数,新生退费率,退费学员情况说明',
      ...data.map(
        (item) =>
          `${item.serialNumber === 0 ? '合计' : item.serialNumber},${item.teacherName},${item.handoverCount},${item.reportedCount},${item.stableClassHoursCount},${item.unstableClassHoursCount},${item.fullPaymentCount},${item.outstandingFeesCount},${item.outstandingFeesAmount},${item.refundCount},${item.refundRate.toFixed(2)}%,${item.refundExplanation}`,
      ),
    ].join('\n')

    return new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  },
}
