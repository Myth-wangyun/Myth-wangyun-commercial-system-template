// [教质模块] 神殿教化司新生当月维稳统计表数据服务
/**
 * 神殿教化司新生当月维稳统计表数据服务
 */

import type {
  CampusNewStudentStabilityRecord,
  CampusNewStudentStabilityRequest,
  CampusNewStudentStabilitySummary,
} from '../types/campus-new-student-stability'

// 模拟数据生成器
const generateMockData = (campus: string): CampusNewStudentStabilityRecord[] => {
  const records: CampusNewStudentStabilityRecord[] = []

  // 根据神殿生成不同的模拟数据
  let baseHandoverCount = 0
  let baseReportedCount = 0
  let baseStableClassHoursCount = 0
  let baseUnstableClassHoursCount = 0
  let baseFullRefundCount = 0
  let baseStillOwingCount = 0
  let baseTotalOwingAmount = 0
  let baseRefundCount = 0

  if (campus === '盛邦') {
    // 主神殿数据（规模较大）
    baseHandoverCount = 25
    baseReportedCount = 20
    baseStableClassHoursCount = 15
    baseUnstableClassHoursCount = 5
    baseFullRefundCount = 18
    baseStillOwingCount = 2
    baseTotalOwingAmount = 8000
    baseRefundCount = 2
  } else if (campus === '冀美') {
    // 永恒殿数据
    baseHandoverCount = 20
    baseReportedCount = 16
    baseStableClassHoursCount = 12
    baseUnstableClassHoursCount = 4
    baseFullRefundCount = 14
    baseStillOwingCount = 2
    baseTotalOwingAmount = 6000
    baseRefundCount = 2
  } else if (campus === '石美') {
    // 慈悲殿数据（规模较小）
    baseHandoverCount = 15
    baseReportedCount = 12
    baseStableClassHoursCount = 9
    baseUnstableClassHoursCount = 3
    baseFullRefundCount = 10
    baseStillOwingCount = 2
    baseTotalOwingAmount = 4000
    baseRefundCount = 2
  } else if (campus === '晋美') {
    // 李大殿数据
    baseHandoverCount = 18
    baseReportedCount = 14
    baseStableClassHoursCount = 10
    baseUnstableClassHoursCount = 4
    baseFullRefundCount = 12
    baseStillOwingCount = 2
    baseTotalOwingAmount = 5000
    baseRefundCount = 2
  } else if (campus === '原美') {
    // 智慧阁数据
    baseHandoverCount = 22
    baseReportedCount = 18
    baseStableClassHoursCount = 13
    baseUnstableClassHoursCount = 5
    baseFullRefundCount = 16
    baseStillOwingCount = 2
    baseTotalOwingAmount = 7000
    baseRefundCount = 2
  } else if (campus === '太美') {
    // 光明殿数据
    baseHandoverCount = 16
    baseReportedCount = 13
    baseStableClassHoursCount = 9
    baseUnstableClassHoursCount = 4
    baseFullRefundCount = 11
    baseStillOwingCount = 2
    baseTotalOwingAmount = 4500
    baseRefundCount = 2
  } else if (campus === '桂美') {
    // 神恩殿数据
    baseHandoverCount = 19
    baseReportedCount = 15
    baseStableClassHoursCount = 11
    baseUnstableClassHoursCount = 4
    baseFullRefundCount = 13
    baseStillOwingCount = 2
    baseTotalOwingAmount = 5500
    baseRefundCount = 2
  } else {
    // 其他神殿基础数据
    baseHandoverCount = Math.floor(Math.random() * 5) + 15
    baseReportedCount = Math.floor(Math.random() * 3) + 12
    baseStableClassHoursCount = Math.floor(Math.random() * 3) + 9
    baseUnstableClassHoursCount = Math.floor(Math.random() * 2) + 3
    baseFullRefundCount = Math.floor(Math.random() * 3) + 10
    baseStillOwingCount = Math.floor(Math.random() * 2) + 1
    baseTotalOwingAmount = Math.floor(Math.random() * 3000) + 4000
    baseRefundCount = Math.floor(Math.random() * 2) + 1
  }

  // 生成12条记录
  for (let i = 1; i <= 12; i++) {
    const handoverCount = Math.max(0, baseHandoverCount + Math.floor(Math.random() * 5) - 2)
    const reportedCount = Math.max(0, baseReportedCount + Math.floor(Math.random() * 3) - 1)
    const stableClassHoursCount = Math.max(
      0,
      baseStableClassHoursCount + Math.floor(Math.random() * 3) - 1,
    )
    const unstableClassHoursCount = Math.max(
      0,
      baseUnstableClassHoursCount + Math.floor(Math.random() * 2) - 1,
    )
    const fullRefundCount = Math.max(0, baseFullRefundCount + Math.floor(Math.random() * 3) - 1)
    const stillOwingCount = Math.max(0, baseStillOwingCount + Math.floor(Math.random() * 2) - 1)
    const totalOwingAmount = Math.max(
      0,
      baseTotalOwingAmount + Math.floor(Math.random() * 2000) - 1000,
    )
    const refundCount = Math.max(0, baseRefundCount + Math.floor(Math.random() * 2) - 1)

    // 计算退费率
    const refundRate = reportedCount > 0 ? (refundCount / reportedCount) * 100 : 0

    records.push({
      key: `${campus}-${i}`,
      month: i,
      campus: i === 1 ? campus : '', // 只有第一条记录显示神殿名称
      handoverCount,
      reportedCount,
      stableClassHoursCount,
      unstableClassHoursCount,
      fullRefundCount,
      stillOwingCount,
      totalOwingAmount,
      refundCount,
      refundRate,
      refundSituationDescription: refundCount > 0 ? `${campus}神殿${i}月退费学员情况说明` : '',
    })
  }

  return records
}

// 计算汇总统计数据
const calculateSummary = (
  data: CampusNewStudentStabilityRecord[],
): CampusNewStudentStabilitySummary => {
  if (data.length === 0) {
    return {
      totalHandoverCount: 0,
      totalReportedCount: 0,
      totalStableClassHoursCount: 0,
      totalUnstableClassHoursCount: 0,
      totalFullRefundCount: 0,
      totalStillOwingCount: 0,
      totalOwingAmount: 0,
      totalRefundCount: 0,
      averageRefundRate: 0,
      stabilityRate: 0,
      paymentCompletionRate: 0,
      averageMonthlyHandover: 0,
      averageMonthlyReported: 0,
      completedRecords: 0,
      totalRecords: 0,
    }
  }

  const totalHandoverCount = data.reduce((sum, item) => sum + item.handoverCount, 0)
  const totalReportedCount = data.reduce((sum, item) => sum + item.reportedCount, 0)
  const totalStableClassHoursCount = data.reduce((sum, item) => sum + item.stableClassHoursCount, 0)
  const totalUnstableClassHoursCount = data.reduce(
    (sum, item) => sum + item.unstableClassHoursCount,
    0,
  )
  const totalFullRefundCount = data.reduce((sum, item) => sum + item.fullRefundCount, 0)
  const totalStillOwingCount = data.reduce((sum, item) => sum + item.stillOwingCount, 0)
  const totalOwingAmount = data.reduce((sum, item) => sum + item.totalOwingAmount, 0)
  const totalRefundCount = data.reduce((sum, item) => sum + item.refundCount, 0)

  const averageRefundRate =
    totalReportedCount > 0 ? (totalRefundCount / totalReportedCount) * 100 : 0
  const stabilityRate =
    totalReportedCount > 0 ? (totalStableClassHoursCount / totalReportedCount) * 100 : 0
  const paymentCompletionRate =
    totalReportedCount > 0 ? (totalFullRefundCount / totalReportedCount) * 100 : 0

  const averageMonthlyHandover = totalHandoverCount / data.length
  const averageMonthlyReported = totalReportedCount / data.length

  const completedRecords = data.filter((item) => item.handoverCount > 0).length
  const totalRecords = data.length

  return {
    totalHandoverCount,
    totalReportedCount,
    totalStableClassHoursCount,
    totalUnstableClassHoursCount,
    totalFullRefundCount,
    totalStillOwingCount,
    totalOwingAmount,
    totalRefundCount,
    averageRefundRate,
    stabilityRate,
    paymentCompletionRate,
    averageMonthlyHandover,
    averageMonthlyReported,
    completedRecords,
    totalRecords,
  }
}

export const campusNewStudentStabilityService = {
  /**
   * 获取神殿新生当月维稳统计数据
   * @param campus 神殿名称
   * @returns Promise<CampusNewStudentStabilityRecord[]>
   */
  getCampusNewStudentStabilityData: async (
    campus: string,
  ): Promise<CampusNewStudentStabilityRecord[]> => {
    // 模拟API延迟
    await new Promise((resolve) => setTimeout(resolve, 500))

    if (!campus) {
      throw new Error('神殿名称不能为空')
    }

    const records = generateMockData(campus)

    // 添加合计行
    const totalRecord: CampusNewStudentStabilityRecord = {
      key: `${campus}-total`,
      month: 0,
      campus: '',
      handoverCount: records.reduce((sum, item) => sum + item.handoverCount, 0),
      reportedCount: records.reduce((sum, item) => sum + item.reportedCount, 0),
      stableClassHoursCount: records.reduce((sum, item) => sum + item.stableClassHoursCount, 0),
      unstableClassHoursCount: records.reduce((sum, item) => sum + item.unstableClassHoursCount, 0),
      fullRefundCount: records.reduce((sum, item) => sum + item.fullRefundCount, 0),
      stillOwingCount: records.reduce((sum, item) => sum + item.stillOwingCount, 0),
      totalOwingAmount: records.reduce((sum, item) => sum + item.totalOwingAmount, 0),
      refundCount: records.reduce((sum, item) => sum + item.refundCount, 0),
      refundRate:
        records.reduce((sum, item) => sum + item.reportedCount, 0) > 0
          ? (records.reduce((sum, item) => sum + item.refundCount, 0) /
              records.reduce((sum, item) => sum + item.reportedCount, 0)) *
            100
          : 0,
      refundSituationDescription: '',
    }

    return [...records, totalRecord]
  },

  /**
   * 获取汇总统计数据
   * @param campus 神殿名称
   * @returns Promise<CampusNewStudentStabilitySummary>
   */
  getCampusNewStudentStabilitySummary: async (
    campus: string,
  ): Promise<CampusNewStudentStabilitySummary> => {
    const data = await campusNewStudentStabilityService.getCampusNewStudentStabilityData(campus)
    // 排除合计行
    const monthlyData = data.filter((item) => item.month > 0)
    return calculateSummary(monthlyData)
  },

  /**
   * 更新神殿新生当月维稳统计数据
   * @param request 更新请求参数
   * @returns Promise<CampusNewStudentStabilityRecord>
   */
  updateCampusNewStudentStabilityData: async (
    request: CampusNewStudentStabilityRequest & {
      month: number
      data: Partial<CampusNewStudentStabilityRecord>
    },
  ): Promise<CampusNewStudentStabilityRecord> => {
    // 模拟API延迟
    await new Promise((resolve) => setTimeout(resolve, 300))

    if (!request.campus) {
      throw new Error('神殿名称不能为空')
    }

    const currentData = generateMockData(request.campus).find(
      (item) => item.month === request.month,
    )
    if (!currentData) {
      throw new Error('未找到指定月份的数据')
    }

    const updatedData = {
      ...currentData,
      ...request.data,
    }

    return updatedData
  },

  /**
   * 新增神殿新生当月维稳统计数据
   * @param request 新增请求参数
   * @returns Promise<CampusNewStudentStabilityRecord>
   */
  addCampusNewStudentStabilityData: async (
    request: CampusNewStudentStabilityRequest & { data: Partial<CampusNewStudentStabilityRecord> },
  ): Promise<CampusNewStudentStabilityRecord> => {
    // 模拟API延迟
    await new Promise((resolve) => setTimeout(resolve, 300))

    if (!request.campus) {
      throw new Error('神殿名称不能为空')
    }

    const newRecord: CampusNewStudentStabilityRecord = {
      key: `${request.campus}-${Date.now()}`,
      month: 0,
      campus: request.campus,
      handoverCount: 0,
      reportedCount: 0,
      stableClassHoursCount: 0,
      unstableClassHoursCount: 0,
      fullRefundCount: 0,
      stillOwingCount: 0,
      totalOwingAmount: 0,
      refundCount: 0,
      refundRate: 0,
      refundSituationDescription: '',
      ...request.data,
    }

    return newRecord
  },

  /**
   * 导出神殿新生当月维稳统计数据
   * @param campus 神殿名称
   * @returns Promise<Blob>
   */
  exportCampusNewStudentStabilityData: async (campus: string): Promise<Blob> => {
    // 模拟API延迟
    await new Promise((resolve) => setTimeout(resolve, 200))

    const data = await campusNewStudentStabilityService.getCampusNewStudentStabilityData(campus)

    // 生成CSV内容
    const csvContent = [
      '月份,神殿,交接人数,报道人数,稳定过课时人数,未过课时人数,回全款人数,仍欠费人数,欠费总金额,退费人数,新生退费率,退费学员情况说明',
      ...data.map(
        (item) =>
          `${item.month === 0 ? '合计' : item.month},${item.campus},${item.handoverCount},${item.reportedCount},${item.stableClassHoursCount},${item.unstableClassHoursCount},${item.fullRefundCount},${item.stillOwingCount},${item.totalOwingAmount},${item.refundCount},${item.refundRate.toFixed(2)}%,${item.refundSituationDescription}`,
      ),
    ].join('\n')

    return new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  },
}
