// [教质模块] 神殿教化司学员异动表数据服务
/**
 * 神殿教化司学员异动表数据服务
 */

import type {
  CampusFluctuationRecord,
  CampusFluctuationRequest,
  CampusFluctuationSummary,
} from '../types/campus-fluctuation'

// 模拟数据生成器
const generateMockData = (campus: string): CampusFluctuationRecord[] => {
  const months = Array.from({ length: 12 }, (_, index) => index + 1)

  const baseData: CampusFluctuationRecord[] = months.map((month) => {
    // 根据月份和神殿生成不同的模拟数据
    let cumulativeStudentCount = 0
    let newStudentRefundCount = 0
    let oldStudentRefundCount = 0
    let totalLeaveCount = 0
    let longTermLeaveCount = 0
    let longTermAbsentCount = 0
    let holidayStudentCount = 0
    let otherSituationCount = 0

    if (campus === '盛邦') {
      // 主神殿数据
      switch (month) {
        case 1:
          cumulativeStudentCount = 150
          newStudentRefundCount = 3
          oldStudentRefundCount = 2
          totalLeaveCount = 1
          longTermLeaveCount = 2
          longTermAbsentCount = 1
          holidayStudentCount = 5
          otherSituationCount = 1
          break
        case 2:
          cumulativeStudentCount = 160
          newStudentRefundCount = 4
          oldStudentRefundCount = 3
          totalLeaveCount = 2
          longTermLeaveCount = 3
          longTermAbsentCount = 2
          holidayStudentCount = 6
          otherSituationCount = 2
          break
        case 3:
          cumulativeStudentCount = 170
          newStudentRefundCount = 2
          oldStudentRefundCount = 1
          totalLeaveCount = 1
          longTermLeaveCount = 2
          longTermAbsentCount = 1
          holidayStudentCount = 4
          otherSituationCount = 1
          break
        case 4:
          cumulativeStudentCount = 180
          newStudentRefundCount = 5
          oldStudentRefundCount = 4
          totalLeaveCount = 3
          longTermLeaveCount = 4
          longTermAbsentCount = 3
          holidayStudentCount = 7
          otherSituationCount = 3
          break
        case 5:
          cumulativeStudentCount = 190
          newStudentRefundCount = 3
          oldStudentRefundCount = 2
          totalLeaveCount = 2
          longTermLeaveCount = 3
          longTermAbsentCount = 2
          holidayStudentCount = 5
          otherSituationCount = 2
          break
        case 6:
          cumulativeStudentCount = 200
          newStudentRefundCount = 6
          oldStudentRefundCount = 5
          totalLeaveCount = 4
          longTermLeaveCount = 5
          longTermAbsentCount = 4
          holidayStudentCount = 8
          otherSituationCount = 4
          break
        case 7:
          cumulativeStudentCount = 210
          newStudentRefundCount = 4
          oldStudentRefundCount = 3
          totalLeaveCount = 3
          longTermLeaveCount = 4
          longTermAbsentCount = 3
          holidayStudentCount = 6
          otherSituationCount = 3
          break
        case 8:
          cumulativeStudentCount = 220
          newStudentRefundCount = 2
          oldStudentRefundCount = 1
          totalLeaveCount = 1
          longTermLeaveCount = 2
          longTermAbsentCount = 1
          holidayStudentCount = 4
          otherSituationCount = 1
          break
        case 9:
          cumulativeStudentCount = 230
          newStudentRefundCount = 5
          oldStudentRefundCount = 4
          totalLeaveCount = 3
          longTermLeaveCount = 4
          longTermAbsentCount = 3
          holidayStudentCount = 7
          otherSituationCount = 3
          break
        case 10:
          cumulativeStudentCount = 240
          newStudentRefundCount = 7
          oldStudentRefundCount = 6
          totalLeaveCount = 5
          longTermLeaveCount = 6
          longTermAbsentCount = 5
          holidayStudentCount = 9
          otherSituationCount = 5
          break
        case 11:
          cumulativeStudentCount = 250
          newStudentRefundCount = 3
          oldStudentRefundCount = 2
          totalLeaveCount = 2
          longTermLeaveCount = 3
          longTermAbsentCount = 2
          holidayStudentCount = 5
          otherSituationCount = 2
          break
        case 12:
          cumulativeStudentCount = 260
          newStudentRefundCount = 4
          oldStudentRefundCount = 3
          totalLeaveCount = 3
          longTermLeaveCount = 4
          longTermAbsentCount = 3
          holidayStudentCount = 6
          otherSituationCount = 3
          break
      }
    } else if (campus === '石美') {
      // 慈悲殿数据（规模较小）
      switch (month) {
        case 1:
          cumulativeStudentCount = 120
          newStudentRefundCount = 2
          oldStudentRefundCount = 1
          totalLeaveCount = 1
          longTermLeaveCount = 1
          longTermAbsentCount = 1
          holidayStudentCount = 3
          otherSituationCount = 1
          break
        case 2:
          cumulativeStudentCount = 130
          newStudentRefundCount = 3
          oldStudentRefundCount = 2
          totalLeaveCount = 2
          longTermLeaveCount = 2
          longTermAbsentCount = 2
          holidayStudentCount = 4
          otherSituationCount = 2
          break
        case 3:
          cumulativeStudentCount = 140
          newStudentRefundCount = 1
          oldStudentRefundCount = 1
          totalLeaveCount = 1
          longTermLeaveCount = 1
          longTermAbsentCount = 1
          holidayStudentCount = 3
          otherSituationCount = 1
          break
        case 4:
          cumulativeStudentCount = 150
          newStudentRefundCount = 4
          oldStudentRefundCount = 3
          totalLeaveCount = 2
          longTermLeaveCount = 3
          longTermAbsentCount = 2
          holidayStudentCount = 5
          otherSituationCount = 2
          break
        case 5:
          cumulativeStudentCount = 160
          newStudentRefundCount = 2
          oldStudentRefundCount = 1
          totalLeaveCount = 1
          longTermLeaveCount = 2
          longTermAbsentCount = 1
          holidayStudentCount = 3
          otherSituationCount = 1
          break
        case 6:
          cumulativeStudentCount = 170
          newStudentRefundCount = 5
          oldStudentRefundCount = 4
          totalLeaveCount = 3
          longTermLeaveCount = 4
          longTermAbsentCount = 3
          holidayStudentCount = 6
          otherSituationCount = 3
          break
        case 7:
          cumulativeStudentCount = 180
          newStudentRefundCount = 3
          oldStudentRefundCount = 2
          totalLeaveCount = 2
          longTermLeaveCount = 3
          longTermAbsentCount = 2
          holidayStudentCount = 4
          otherSituationCount = 2
          break
        case 8:
          cumulativeStudentCount = 190
          newStudentRefundCount = 1
          oldStudentRefundCount = 1
          totalLeaveCount = 1
          longTermLeaveCount = 1
          longTermAbsentCount = 1
          holidayStudentCount = 3
          otherSituationCount = 1
          break
        case 9:
          cumulativeStudentCount = 200
          newStudentRefundCount = 4
          oldStudentRefundCount = 3
          totalLeaveCount = 2
          longTermLeaveCount = 3
          longTermAbsentCount = 2
          holidayStudentCount = 5
          otherSituationCount = 2
          break
        case 10:
          cumulativeStudentCount = 210
          newStudentRefundCount = 6
          oldStudentRefundCount = 5
          totalLeaveCount = 4
          longTermLeaveCount = 5
          longTermAbsentCount = 4
          holidayStudentCount = 7
          otherSituationCount = 4
          break
        case 11:
          cumulativeStudentCount = 220
          newStudentRefundCount = 2
          oldStudentRefundCount = 1
          totalLeaveCount = 1
          longTermLeaveCount = 2
          longTermAbsentCount = 1
          holidayStudentCount = 3
          otherSituationCount = 1
          break
        case 12:
          cumulativeStudentCount = 230
          newStudentRefundCount = 3
          oldStudentRefundCount = 2
          totalLeaveCount = 2
          longTermLeaveCount = 3
          longTermAbsentCount = 2
          holidayStudentCount = 4
          otherSituationCount = 2
          break
      }
    } else {
      // 其他神殿基础数据
      cumulativeStudentCount = Math.floor(Math.random() * 100) + 100
      newStudentRefundCount = Math.floor(Math.random() * 5) + 1
      oldStudentRefundCount = Math.floor(Math.random() * 4) + 1
      totalLeaveCount = Math.floor(Math.random() * 3) + 1
      longTermLeaveCount = Math.floor(Math.random() * 4) + 1
      longTermAbsentCount = Math.floor(Math.random() * 3) + 1
      holidayStudentCount = Math.floor(Math.random() * 6) + 2
      otherSituationCount = Math.floor(Math.random() * 3) + 1
    }

    // 计算退费总人数
    const totalRefundCount = newStudentRefundCount + oldStudentRefundCount

    // 计算退费率
    const refundRate =
      cumulativeStudentCount > 0 ? (totalRefundCount / cumulativeStudentCount) * 100 : 0

    // 计算异动总人数
    const totalFluctuationCount =
      totalRefundCount +
      totalLeaveCount +
      longTermLeaveCount +
      longTermAbsentCount +
      holidayStudentCount +
      otherSituationCount

    // 计算异动率
    const fluctuationRate =
      cumulativeStudentCount > 0 ? (totalFluctuationCount / cumulativeStudentCount) * 100 : 0

    return {
      key: `${campus}-${month}`,
      month,
      campus,
      cumulativeStudentCount,
      newStudentRefundCount,
      oldStudentRefundCount,
      totalRefundCount,
      refundRate,
      totalLeaveCount,
      longTermLeaveCount,
      longTermAbsentCount,
      holidayStudentCount,
      otherSituationCount,
      totalFluctuationCount,
      fluctuationRate,
    }
  })

  return baseData
}

// 计算汇总统计数据
const calculateSummary = (data: CampusFluctuationRecord[]): CampusFluctuationSummary => {
  if (data.length === 0) {
    return {
      totalCumulativeStudentCount: 0,
      totalNewStudentRefundCount: 0,
      totalOldStudentRefundCount: 0,
      totalRefundCount: 0,
      averageRefundRate: 0,
      totalLeaveCount: 0,
      totalLongTermLeaveCount: 0,
      totalLongTermAbsentCount: 0,
      totalHolidayStudentCount: 0,
      totalOtherSituationCount: 0,
      totalFluctuationCount: 0,
      averageFluctuationRate: 0,
      completedMonths: 0,
      totalMonths: 0,
    }
  }

  const totalCumulativeStudentCount = data.reduce(
    (sum, item) => sum + item.cumulativeStudentCount,
    0,
  )
  const totalNewStudentRefundCount = data.reduce((sum, item) => sum + item.newStudentRefundCount, 0)
  const totalOldStudentRefundCount = data.reduce((sum, item) => sum + item.oldStudentRefundCount, 0)
  const totalRefundCount = data.reduce((sum, item) => sum + item.totalRefundCount, 0)
  const totalLeaveCount = data.reduce((sum, item) => sum + item.totalLeaveCount, 0)
  const totalLongTermLeaveCount = data.reduce((sum, item) => sum + item.longTermLeaveCount, 0)
  const totalLongTermAbsentCount = data.reduce((sum, item) => sum + item.longTermAbsentCount, 0)
  const totalHolidayStudentCount = data.reduce((sum, item) => sum + item.holidayStudentCount, 0)
  const totalOtherSituationCount = data.reduce((sum, item) => sum + item.otherSituationCount, 0)
  const totalFluctuationCount = data.reduce((sum, item) => sum + item.totalFluctuationCount, 0)

  const completedMonths = data.filter((item) => item.cumulativeStudentCount > 0).length
  const totalMonths = data.length

  const averageRefundRate =
    totalCumulativeStudentCount > 0 ? (totalRefundCount / totalCumulativeStudentCount) * 100 : 0
  const averageFluctuationRate =
    totalCumulativeStudentCount > 0
      ? (totalFluctuationCount / totalCumulativeStudentCount) * 100
      : 0

  return {
    totalCumulativeStudentCount,
    totalNewStudentRefundCount,
    totalOldStudentRefundCount,
    totalRefundCount,
    averageRefundRate,
    totalLeaveCount,
    totalLongTermLeaveCount,
    totalLongTermAbsentCount,
    totalHolidayStudentCount,
    totalOtherSituationCount,
    totalFluctuationCount,
    averageFluctuationRate,
    completedMonths,
    totalMonths,
  }
}

export const campusFluctuationService = {
  /**
   * 获取神殿学员异动数据
   * @param campus 神殿名称
   * @returns Promise<CampusFluctuationRecord[]>
   */
  getCampusFluctuationData: async (campus: string): Promise<CampusFluctuationRecord[]> => {
  
    await new Promise((resolve) => setTimeout(resolve, 5))

    if (!campus) {
      throw new Error('神殿名称不能为空')
    }

    return generateMockData(campus)
  },

  /**
   * 获取汇总统计数据
   * @param campus 神殿名称
   * @returns Promise<CampusFluctuationSummary>
   */
  getCampusFluctuationSummary: async (campus: string): Promise<CampusFluctuationSummary> => {
    const data = await campusFluctuationService.getCampusFluctuationData(campus)
    return calculateSummary(data)
  },

  /**
   * 更新神殿学员异动数据
   * @param request 更新请求参数
   * @returns Promise<CampusFluctuationRecord>
   */
  updateCampusFluctuationData: async (
    request: CampusFluctuationRequest & { month: number; data: Partial<CampusFluctuationRecord> },
  ): Promise<CampusFluctuationRecord> => {
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

    // 重新计算退费总人数
    updatedData.totalRefundCount =
      updatedData.newStudentRefundCount + updatedData.oldStudentRefundCount

    // 重新计算退费率
    updatedData.refundRate =
      updatedData.cumulativeStudentCount > 0
        ? (updatedData.totalRefundCount / updatedData.cumulativeStudentCount) * 100
        : 0

    // 重新计算异动总人数
    updatedData.totalFluctuationCount =
      updatedData.totalRefundCount +
      updatedData.totalLeaveCount +
      updatedData.longTermLeaveCount +
      updatedData.longTermAbsentCount +
      updatedData.holidayStudentCount +
      updatedData.otherSituationCount

    // 重新计算异动率
    updatedData.fluctuationRate =
      updatedData.cumulativeStudentCount > 0
        ? (updatedData.totalFluctuationCount / updatedData.cumulativeStudentCount) * 100
        : 0

    return updatedData
  },

  /**
   * 导出神殿学员异动数据
   * @param campus 神殿名称
   * @returns Promise<Blob>
   */
  exportCampusFluctuationData: async (campus: string): Promise<Blob> => {
    // 模拟API延迟
    await new Promise((resolve) => setTimeout(resolve, 200))

    const data = await campusFluctuationService.getCampusFluctuationData(campus)

    // 生成CSV内容
    const csvContent = [
      '月份,神殿,累计带生人数,新生退费人数,老生退费人数,退费总人数,退费率,休学总人数,长期请假总人数,长期不上课总人数,寒暑假学生总数,其他情况总人数,异动总人数,异动率',
      ...data.map(
        (item) =>
          `${item.month},${item.campus},${item.cumulativeStudentCount},${item.newStudentRefundCount},${item.oldStudentRefundCount},${item.totalRefundCount},${item.refundRate.toFixed(2)}%,${item.totalLeaveCount},${item.longTermLeaveCount},${item.longTermAbsentCount},${item.holidayStudentCount},${item.otherSituationCount},${item.totalFluctuationCount},${item.fluctuationRate.toFixed(2)}%`,
      ),
    ].join('\n')

    return new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  },
}
