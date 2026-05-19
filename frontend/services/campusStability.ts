// [教质模块] 神殿教化司新生当月维稳统计表数据服务
/**
 * 神殿教化司新生当月维稳统计表数据服务
 */

import type {
  CampusStabilityRecord,
  CampusStabilityRequest,
  CampusStabilitySummary,
} from '../types/campus-stability'

// 模拟数据生成器
const generateMockData = (campus: string): CampusStabilityRecord[] => {
  const months = Array.from({ length: 12 }, (_, index) => index + 1)

  const baseData: CampusStabilityRecord[] = months.map((month) => {
    // 根据月份和神殿生成不同的模拟数据
    let handoverCount = 0
    let reportedCount = 0
    let stableCourseCount = 0
    let unstableCourseCount = 0
    let fullRefundCount = 0
    let outstandingFeeCount = 0
    let outstandingFeeAmount = 0
    let refundCount = 0

    if (campus === '盛邦') {
      // 主神殿数据
      switch (month) {
        case 1:
          handoverCount = 25
          reportedCount = 22
          stableCourseCount = 18
          unstableCourseCount = 4
          fullRefundCount = 2
          outstandingFeeCount = 1
          outstandingFeeAmount = 5000
          refundCount = 3
          break
        case 2:
          handoverCount = 30
          reportedCount = 28
          stableCourseCount = 24
          unstableCourseCount = 4
          fullRefundCount = 3
          outstandingFeeCount = 2
          outstandingFeeAmount = 10000
          refundCount = 5
          break
        case 3:
          handoverCount = 35
          reportedCount = 32
          stableCourseCount = 28
          unstableCourseCount = 4
          fullRefundCount = 2
          outstandingFeeCount = 1
          outstandingFeeAmount = 8000
          refundCount = 3
          break
        case 4:
          handoverCount = 28
          reportedCount = 25
          stableCourseCount = 21
          unstableCourseCount = 4
          fullRefundCount = 3
          outstandingFeeCount = 2
          outstandingFeeAmount = 12000
          refundCount = 5
          break
        case 5:
          handoverCount = 40
          reportedCount = 38
          stableCourseCount = 32
          unstableCourseCount = 6
          fullRefundCount = 4
          outstandingFeeCount = 3
          outstandingFeeAmount = 15000
          refundCount = 7
          break
        case 6:
          handoverCount = 45
          reportedCount = 42
          stableCourseCount = 36
          unstableCourseCount = 6
          fullRefundCount = 3
          outstandingFeeCount = 2
          outstandingFeeAmount = 10000
          refundCount = 5
          break
        case 7:
          handoverCount = 32
          reportedCount = 30
          stableCourseCount = 25
          unstableCourseCount = 5
          fullRefundCount = 4
          outstandingFeeCount = 3
          outstandingFeeAmount = 18000
          refundCount = 7
          break
        case 8:
          handoverCount = 38
          reportedCount = 35
          stableCourseCount = 30
          unstableCourseCount = 5
          fullRefundCount = 2
          outstandingFeeCount = 1
          outstandingFeeAmount = 6000
          refundCount = 3
          break
        case 9:
          handoverCount = 42
          reportedCount = 40
          stableCourseCount = 34
          unstableCourseCount = 6
          fullRefundCount = 3
          outstandingFeeCount = 2
          outstandingFeeAmount = 12000
          refundCount = 5
          break
        case 10:
          handoverCount = 48
          reportedCount = 45
          stableCourseCount = 38
          unstableCourseCount = 7
          fullRefundCount = 4
          outstandingFeeCount = 3
          outstandingFeeAmount = 20000
          refundCount = 7
          break
        case 11:
          handoverCount = 35
          reportedCount = 33
          stableCourseCount = 28
          unstableCourseCount = 5
          fullRefundCount = 3
          outstandingFeeCount = 2
          outstandingFeeAmount = 10000
          refundCount = 5
          break
        case 12:
          handoverCount = 30
          reportedCount = 28
          stableCourseCount = 24
          unstableCourseCount = 4
          fullRefundCount = 2
          outstandingFeeCount = 1
          outstandingFeeAmount = 8000
          refundCount = 3
          break
      }
    } else if (campus === '北京') {
      // 北京神殿数据（规模更大）
      switch (month) {
        case 1:
          handoverCount = 35
          reportedCount = 32
          stableCourseCount = 28
          unstableCourseCount = 4
          fullRefundCount = 3
          outstandingFeeCount = 2
          outstandingFeeAmount = 8000
          refundCount = 5
          break
        case 2:
          handoverCount = 40
          reportedCount = 38
          stableCourseCount = 34
          unstableCourseCount = 4
          fullRefundCount = 4
          outstandingFeeCount = 3
          outstandingFeeAmount = 15000
          refundCount = 7
          break
        case 3:
          handoverCount = 45
          reportedCount = 42
          stableCourseCount = 38
          unstableCourseCount = 4
          fullRefundCount = 3
          outstandingFeeCount = 2
          outstandingFeeAmount = 12000
          refundCount = 5
          break
        case 4:
          handoverCount = 38
          reportedCount = 35
          stableCourseCount = 31
          unstableCourseCount = 4
          fullRefundCount = 4
          outstandingFeeCount = 3
          outstandingFeeAmount = 18000
          refundCount = 7
          break
        case 5:
          handoverCount = 50
          reportedCount = 48
          stableCourseCount = 42
          unstableCourseCount = 6
          fullRefundCount = 5
          outstandingFeeCount = 4
          outstandingFeeAmount = 25000
          refundCount = 9
          break
        case 6:
          handoverCount = 55
          reportedCount = 52
          stableCourseCount = 46
          unstableCourseCount = 6
          fullRefundCount = 4
          outstandingFeeCount = 3
          outstandingFeeAmount = 15000
          refundCount = 7
          break
        case 7:
          handoverCount = 42
          reportedCount = 40
          stableCourseCount = 35
          unstableCourseCount = 5
          fullRefundCount = 5
          outstandingFeeCount = 4
          outstandingFeeAmount = 25000
          refundCount = 9
          break
        case 8:
          handoverCount = 48
          reportedCount = 45
          stableCourseCount = 40
          unstableCourseCount = 5
          fullRefundCount = 3
          outstandingFeeCount = 2
          outstandingFeeAmount = 10000
          refundCount = 5
          break
        case 9:
          handoverCount = 52
          reportedCount = 50
          stableCourseCount = 44
          unstableCourseCount = 6
          fullRefundCount = 4
          outstandingFeeCount = 3
          outstandingFeeAmount = 18000
          refundCount = 7
          break
        case 10:
          handoverCount = 58
          reportedCount = 55
          stableCourseCount = 48
          unstableCourseCount = 7
          fullRefundCount = 5
          outstandingFeeCount = 4
          outstandingFeeAmount = 30000
          refundCount = 9
          break
        case 11:
          handoverCount = 45
          reportedCount = 43
          stableCourseCount = 38
          unstableCourseCount = 5
          fullRefundCount = 4
          outstandingFeeCount = 3
          outstandingFeeAmount = 15000
          refundCount = 7
          break
        case 12:
          handoverCount = 40
          reportedCount = 38
          stableCourseCount = 34
          unstableCourseCount = 4
          fullRefundCount = 3
          outstandingFeeCount = 2
          outstandingFeeAmount = 12000
          refundCount = 5
          break
      }
    } else {
      // 其他神殿基础数据
      handoverCount = Math.floor(Math.random() * 20) + 20
      reportedCount = Math.floor(handoverCount * (0.85 + Math.random() * 0.15))
      stableCourseCount = Math.floor(reportedCount * (0.8 + Math.random() * 0.15))
      unstableCourseCount = reportedCount - stableCourseCount
      fullRefundCount = Math.floor(Math.random() * 5) + 1
      outstandingFeeCount = Math.floor(Math.random() * 3) + 1
      outstandingFeeAmount = outstandingFeeCount * (Math.floor(Math.random() * 10000) + 5000)
      refundCount = fullRefundCount + Math.floor(Math.random() * 3)
    }

    // 计算退费率
    const refundRate = reportedCount > 0 ? (refundCount / reportedCount) * 100 : 0

    // 生成退费学员情况说明
    const refundSituationDescription =
      refundCount > 0
        ? `本月退费${refundCount}人，其中全款退费${fullRefundCount}人，部分退费${refundCount - fullRefundCount}人。主要原因为：个人原因、家庭因素、课程不适应等。`
        : '本月无退费情况'

    return {
      key: `${campus}-${month}`,
      month,
      campus,
      handoverCount,
      reportedCount,
      stableCourseCount,
      unstableCourseCount,
      fullRefundCount,
      outstandingFeeCount,
      outstandingFeeAmount,
      refundCount,
      refundRate,
      refundSituationDescription,
    }
  })

  return baseData
}

// 计算汇总统计数据
const calculateSummary = (data: CampusStabilityRecord[]): CampusStabilitySummary => {
  if (data.length === 0) {
    return {
      totalHandoverCount: 0,
      totalReportedCount: 0,
      totalStableCourseCount: 0,
      totalUnstableCourseCount: 0,
      totalFullRefundCount: 0,
      totalOutstandingFeeCount: 0,
      totalOutstandingFeeAmount: 0,
      totalRefundCount: 0,
      averageRefundRate: 0,
      stabilityRate: 0,
      completedMonths: 0,
      totalMonths: 0,
    }
  }

  const totalHandoverCount = data.reduce((sum, item) => sum + item.handoverCount, 0)
  const totalReportedCount = data.reduce((sum, item) => sum + item.reportedCount, 0)
  const totalStableCourseCount = data.reduce((sum, item) => sum + item.stableCourseCount, 0)
  const totalUnstableCourseCount = data.reduce((sum, item) => sum + item.unstableCourseCount, 0)
  const totalFullRefundCount = data.reduce((sum, item) => sum + item.fullRefundCount, 0)
  const totalOutstandingFeeCount = data.reduce((sum, item) => sum + item.outstandingFeeCount, 0)
  const totalOutstandingFeeAmount = data.reduce((sum, item) => sum + item.outstandingFeeAmount, 0)
  const totalRefundCount = data.reduce((sum, item) => sum + item.refundCount, 0)

  const completedMonths = data.filter((item) => item.reportedCount > 0).length
  const totalMonths = data.length

  const averageRefundRate =
    totalReportedCount > 0 ? (totalRefundCount / totalReportedCount) * 100 : 0
  const stabilityRate =
    totalReportedCount > 0 ? (totalStableCourseCount / totalReportedCount) * 100 : 0

  return {
    totalHandoverCount,
    totalReportedCount,
    totalStableCourseCount,
    totalUnstableCourseCount,
    totalFullRefundCount,
    totalOutstandingFeeCount,
    totalOutstandingFeeAmount,
    totalRefundCount,
    averageRefundRate,
    stabilityRate,
    completedMonths,
    totalMonths,
  }
}

export const campusStabilityService = {
  /**
   * 获取神殿新生维稳数据
   * @param campus 神殿名称
   * @returns Promise<CampusStabilityRecord[]>
   */
  getCampusStabilityData: async (campus: string): Promise<CampusStabilityRecord[]> => {
    // 模拟API延迟
    await new Promise((resolve) => setTimeout(resolve, 500))

    if (!campus) {
      throw new Error('神殿名称不能为空')
    }

    return generateMockData(campus)
  },

  /**
   * 获取汇总统计数据
   * @param campus 神殿名称
   * @returns Promise<CampusStabilitySummary>
   */
  getCampusStabilitySummary: async (campus: string): Promise<CampusStabilitySummary> => {
    const data = await campusStabilityService.getCampusStabilityData(campus)
    return calculateSummary(data)
  },

  /**
   * 更新神殿新生维稳数据
   * @param request 更新请求参数
   * @returns Promise<CampusStabilityRecord>
   */
  updateCampusStabilityData: async (
    request: CampusStabilityRequest & { month: number; data: Partial<CampusStabilityRecord> },
  ): Promise<CampusStabilityRecord> => {
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

    // 重新计算退费率
    updatedData.refundRate =
      updatedData.reportedCount > 0
        ? (updatedData.refundCount / updatedData.reportedCount) * 100
        : 0

    return updatedData
  },

  /**
   * 导出神殿新生维稳数据
   * @param campus 神殿名称
   * @returns Promise<Blob>
   */
  exportCampusStabilityData: async (campus: string): Promise<Blob> => {
    // 模拟API延迟
    await new Promise((resolve) => setTimeout(resolve, 200))

    const data = await campusStabilityService.getCampusStabilityData(campus)

    // 生成CSV内容
    const csvContent = [
      '月份,神殿,交接人数,报道人数,稳定过课时人数,未过课时人数,回全款人数,仍欠费人数,欠费总金额,退费人数,新生退费率,退费学员情况说明',
      ...data.map(
        (item) =>
          `${item.month},${item.campus},${item.handoverCount},${item.reportedCount},${item.stableCourseCount},${item.unstableCourseCount},${item.fullRefundCount},${item.outstandingFeeCount},¥${item.outstandingFeeAmount},${item.refundCount},${item.refundRate.toFixed(2)}%,${item.refundSituationDescription}`,
      ),
    ].join('\n')

    return new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  },
}
