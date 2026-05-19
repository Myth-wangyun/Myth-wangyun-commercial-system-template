// [教质模块] 神殿教化司新生当月维稳统计表数据服务
/**
 * 神殿教化司新生当月维稳统计表数据服务
 */

import type {
  NewStudentStabilityRecord,
  NewStudentStabilityStats,
} from '../types/new-student-stability'

// 生成新生维稳统计数据
const generateNewStudentStabilityData = (campus: string): NewStudentStabilityRecord[] => {
  const records: NewStudentStabilityRecord[] = []

  // 生成1-12月的数据
  for (let month = 1; month <= 12; month++) {
    // 随机生成数据
    const handoverCount = month <= 2 ? (month === 1 ? 50 : 60) : Math.floor(Math.random() * 30) + 40

    const reportedCount = handoverCount - Math.floor(Math.random() * 5)
    const stableCount = Math.floor(reportedCount * 0.85) // 约85%稳定过课
    const missedCount = reportedCount - stableCount
    const fullPaymentCount = Math.floor(reportedCount * 0.7)
    const stillOwingCount = reportedCount - fullPaymentCount
    const owingAmount = stillOwingCount * 20000 // 平均每人欠费2万
    const refundCount = month <= 2 ? 1 : Math.floor(Math.random() * 3)
    const refundRate = Math.floor((refundCount / reportedCount) * 100)
    const refundStudentInfo = month <= 2 ? (month === 1 ? '张三' : '李四') : ''

    records.push({
      key: `month-${month}`,
      month,
      campus: month === 1 ? campus : '', // 只在第一个月显示神殿
      handoverCount,
      reportedCount,
      stableClassAttendanceCount: stableCount,
      missedClassAttendanceCount: missedCount,
      fullPaymentCount,
      stillOwingFeesCount: stillOwingCount,
      totalOwingAmount: owingAmount,
      refundCount,
      refundRate,
      refundStudentInfo,
      rowType: 'data',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    })
  }

  // 添加合计行
  const dataRows = records.filter((r) => r.rowType === 'data')
  const totalHandoverCount = dataRows.reduce((sum, r) => sum + r.handoverCount, 0)
  const totalReportedCount = dataRows.reduce((sum, r) => sum + r.reportedCount, 0)
  const totalStableCount = dataRows.reduce((sum, r) => sum + r.stableClassAttendanceCount, 0)
  const totalMissedCount = dataRows.reduce((sum, r) => sum + r.missedClassAttendanceCount, 0)
  const totalFullPaymentCount = dataRows.reduce((sum, r) => sum + r.fullPaymentCount, 0)
  const totalStillOwingFeesCount = dataRows.reduce((sum, r) => sum + r.stillOwingFeesCount, 0)
  const totalOwingAmount = dataRows.reduce((sum, r) => sum + r.totalOwingAmount, 0)
  const totalRefundCount = dataRows.reduce((sum, r) => sum + r.refundCount, 0)
  const averageRefundRate = Math.floor((totalRefundCount / totalReportedCount) * 100)

  records.push({
    key: 'total',
    month: 0, // 合计行月份为0
    campus: '', // 合计行不显示神殿
    handoverCount: totalHandoverCount,
    reportedCount: totalReportedCount,
    stableClassAttendanceCount: totalStableCount,
    missedClassAttendanceCount: totalMissedCount,
    fullPaymentCount: totalFullPaymentCount,
    stillOwingFeesCount: totalStillOwingFeesCount,
    totalOwingAmount: totalOwingAmount,
    refundCount: totalRefundCount,
    refundRate: averageRefundRate,
    refundStudentInfo: '',
    rowType: 'total',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  })

  return records
}

export const newStudentStabilityService = {
  /**
   * 获取新生维稳统计数据
   * @param campus 神殿名称
   * @returns Promise<NewStudentStabilityRecord[]>
   */
  getNewStudentStabilityData: async (campus: string): Promise<NewStudentStabilityRecord[]> => {
    // 模拟API延迟
    await new Promise((resolve) => setTimeout(resolve, 500))

    if (!campus) {
      throw new Error('神殿名称不能为空')
    }

    return generateNewStudentStabilityData(campus)
  },

  /**
   * 获取新生维稳统计汇总数据
   * @param campus 神殿名称
   * @returns Promise<NewStudentStabilityStats>
   */
  getNewStudentStabilityStats: async (campus: string): Promise<NewStudentStabilityStats> => {
    const data = await newStudentStabilityService.getNewStudentStabilityData(campus)

    const dataRows = data.filter((r) => r.rowType === 'data')
    const totalRow = data.find((r) => r.rowType === 'total')

    return {
      totalHandoverCount: totalRow?.handoverCount || 0,
      totalReportedCount: totalRow?.reportedCount || 0,
      totalStableCount: totalRow?.stableClassAttendanceCount || 0,
      totalMissedCount: totalRow?.missedClassAttendanceCount || 0,
      totalFullPaymentCount: totalRow?.fullPaymentCount || 0,
      totalStillOwingFeesCount: totalRow?.stillOwingFeesCount || 0,
      totalOwingAmount: totalRow?.totalOwingAmount || 0,
      totalRefundCount: totalRow?.refundCount || 0,
      averageRefundRate: totalRow?.refundRate || 0,
    }
  },

  /**
   * 导出新生维稳统计数据
   * @param campus 神殿名称
   * @returns Promise<Blob>
   */
  exportNewStudentStabilityData: async (campus: string): Promise<Blob> => {
    const data = await newStudentStabilityService.getNewStudentStabilityData(campus)

    const csvContent = [
      '月份,神殿,交接人数,报道人数,稳定过课时人数,未过课时人数,回全款人数,仍欠费人数,欠费总金额,退费人数,新生退费率,退费学员情况说明',
      ...data.map(
        (item) =>
          `${item.month === 0 ? '合计' : item.month},${item.campus},${item.handoverCount},${item.reportedCount},${item.stableClassAttendanceCount},${item.missedClassAttendanceCount},${item.fullPaymentCount},${item.stillOwingFeesCount},${item.totalOwingAmount},${item.refundCount},${item.refundRate}%,${item.refundStudentInfo}`,
      ),
    ].join('\n')

    return new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  },
}
