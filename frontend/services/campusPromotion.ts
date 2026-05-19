// [教质模块] 神殿教化司升学计划数据服务
/**
 * 神殿教化司升学计划数据服务
 */

import type {
  CampusPromotionRecord,
  CampusPromotionRequest,
  CampusPromotionSummary,
} from '../types/campus-promotion'

// 模拟数据生成器
const generateMockData = (campus: string): CampusPromotionRecord[] => {
  const months = Array.from({ length: 12 }, (_, index) => index + 1)

  const baseData: CampusPromotionRecord[] = months.map((month) => {
    // 根据月份和神殿生成不同的模拟数据
    let totalPromotionClasses = 0
    let totalOnFileCount = 0
    let estimatedPromotionCount = 0
    let actualPromotionCount = 0
    let receivablePromotionIncome = 0
    let estimatedPromotionIncome = 0
    let actualPromotionIncome = 0

    if (campus === '石美') {
      // 慈悲殿数据
      switch (month) {
        case 1:
          totalPromotionClasses = 3
          totalOnFileCount = 120
          estimatedPromotionCount = 45
          actualPromotionCount = 42
          receivablePromotionIncome = 450000
          estimatedPromotionIncome = 450000
          actualPromotionIncome = 420000
          break
        case 2:
          totalPromotionClasses = 4
          totalOnFileCount = 150
          estimatedPromotionCount = 60
          actualPromotionCount = 58
          receivablePromotionIncome = 600000
          estimatedPromotionIncome = 600000
          actualPromotionIncome = 580000
          break
        case 3:
          totalPromotionClasses = 5
          totalOnFileCount = 180
          estimatedPromotionCount = 72
          actualPromotionCount = 70
          receivablePromotionIncome = 720000
          estimatedPromotionIncome = 720000
          actualPromotionIncome = 700000
          break
        case 4:
          totalPromotionClasses = 3
          totalOnFileCount = 110
          estimatedPromotionCount = 44
          actualPromotionCount = 42
          receivablePromotionIncome = 440000
          estimatedPromotionIncome = 440000
          actualPromotionIncome = 420000
          break
        case 5:
          totalPromotionClasses = 6
          totalOnFileCount = 200
          estimatedPromotionCount = 80
          actualPromotionCount = 78
          receivablePromotionIncome = 800000
          estimatedPromotionIncome = 800000
          actualPromotionIncome = 780000
          break
        case 6:
          totalPromotionClasses = 7
          totalOnFileCount = 220
          estimatedPromotionCount = 88
          actualPromotionCount = 85
          receivablePromotionIncome = 880000
          estimatedPromotionIncome = 880000
          actualPromotionIncome = 850000
          break
        case 7:
          totalPromotionClasses = 4
          totalOnFileCount = 130
          estimatedPromotionCount = 52
          actualPromotionCount = 50
          receivablePromotionIncome = 520000
          estimatedPromotionIncome = 520000
          actualPromotionIncome = 500000
          break
        case 8:
          totalPromotionClasses = 5
          totalOnFileCount = 160
          estimatedPromotionCount = 64
          actualPromotionCount = 62
          receivablePromotionIncome = 640000
          estimatedPromotionIncome = 640000
          actualPromotionIncome = 620000
          break
        case 9:
          totalPromotionClasses = 6
          totalOnFileCount = 190
          estimatedPromotionCount = 76
          actualPromotionCount = 74
          receivablePromotionIncome = 760000
          estimatedPromotionIncome = 760000
          actualPromotionIncome = 740000
          break
        case 10:
          totalPromotionClasses = 8
          totalOnFileCount = 250
          estimatedPromotionCount = 100
          actualPromotionCount = 98
          receivablePromotionIncome = 1000000
          estimatedPromotionIncome = 1000000
          actualPromotionIncome = 980000
          break
        case 11:
          totalPromotionClasses = 5
          totalOnFileCount = 170
          estimatedPromotionCount = 68
          actualPromotionCount = 66
          receivablePromotionIncome = 680000
          estimatedPromotionIncome = 680000
          actualPromotionIncome = 660000
          break
        case 12:
          totalPromotionClasses = 4
          totalOnFileCount = 140
          estimatedPromotionCount = 56
          actualPromotionCount = 54
          receivablePromotionIncome = 560000
          estimatedPromotionIncome = 560000
          actualPromotionIncome = 540000
          break
      }
    } else if (campus === '盛邦') {
      // 主神殿数据（规模更大）
      switch (month) {
        case 1:
          totalPromotionClasses = 5
          totalOnFileCount = 200
          estimatedPromotionCount = 80
          actualPromotionCount = 78
          receivablePromotionIncome = 800000
          estimatedPromotionIncome = 800000
          actualPromotionIncome = 780000
          break
        case 2:
          totalPromotionClasses = 6
          totalOnFileCount = 240
          estimatedPromotionCount = 96
          actualPromotionCount = 94
          receivablePromotionIncome = 960000
          estimatedPromotionIncome = 960000
          actualPromotionIncome = 940000
          break
        case 3:
          totalPromotionClasses = 7
          totalOnFileCount = 280
          estimatedPromotionCount = 112
          actualPromotionCount = 110
          receivablePromotionIncome = 1120000
          estimatedPromotionIncome = 1120000
          actualPromotionIncome = 1100000
          break
        case 4:
          totalPromotionClasses = 5
          totalOnFileCount = 180
          estimatedPromotionCount = 72
          actualPromotionCount = 70
          receivablePromotionIncome = 720000
          estimatedPromotionIncome = 720000
          actualPromotionIncome = 700000
          break
        case 5:
          totalPromotionClasses = 8
          totalOnFileCount = 320
          estimatedPromotionCount = 128
          actualPromotionCount = 126
          receivablePromotionIncome = 1280000
          estimatedPromotionIncome = 1280000
          actualPromotionIncome = 1260000
          break
        case 6:
          totalPromotionClasses = 9
          totalOnFileCount = 360
          estimatedPromotionCount = 144
          actualPromotionCount = 142
          receivablePromotionIncome = 1440000
          estimatedPromotionIncome = 1440000
          actualPromotionIncome = 1420000
          break
        case 7:
          totalPromotionClasses = 6
          totalOnFileCount = 220
          estimatedPromotionCount = 88
          actualPromotionCount = 86
          receivablePromotionIncome = 880000
          estimatedPromotionIncome = 880000
          actualPromotionIncome = 860000
          break
        case 8:
          totalPromotionClasses = 7
          totalOnFileCount = 260
          estimatedPromotionCount = 104
          actualPromotionCount = 102
          receivablePromotionIncome = 1040000
          estimatedPromotionIncome = 1040000
          actualPromotionIncome = 1020000
          break
        case 9:
          totalPromotionClasses = 8
          totalOnFileCount = 300
          estimatedPromotionCount = 120
          actualPromotionCount = 118
          receivablePromotionIncome = 1200000
          estimatedPromotionIncome = 1200000
          actualPromotionIncome = 1180000
          break
        case 10:
          totalPromotionClasses = 10
          totalOnFileCount = 400
          estimatedPromotionCount = 160
          actualPromotionCount = 158
          receivablePromotionIncome = 1600000
          estimatedPromotionIncome = 1600000
          actualPromotionIncome = 1580000
          break
        case 11:
          totalPromotionClasses = 7
          totalOnFileCount = 270
          estimatedPromotionCount = 108
          actualPromotionCount = 106
          receivablePromotionIncome = 1080000
          estimatedPromotionIncome = 1080000
          actualPromotionIncome = 1060000
          break
        case 12:
          totalPromotionClasses = 6
          totalOnFileCount = 230
          estimatedPromotionCount = 92
          actualPromotionCount = 90
          receivablePromotionIncome = 920000
          estimatedPromotionIncome = 920000
          actualPromotionIncome = 900000
          break
      }
    } else {
      // 其他神殿基础数据
      totalPromotionClasses = Math.floor(Math.random() * 5) + 3
      totalOnFileCount = Math.floor(Math.random() * 100) + 100
      estimatedPromotionCount = Math.floor(totalOnFileCount * (0.35 + Math.random() * 0.1))
      actualPromotionCount = Math.floor(estimatedPromotionCount * (0.95 + Math.random() * 0.05))
      receivablePromotionIncome = estimatedPromotionCount * 10000
      estimatedPromotionIncome = receivablePromotionIncome
      actualPromotionIncome = actualPromotionCount * 10000
    }

    // 计算升学率（人数）
    const estimatedPromotionRateByCount =
      totalOnFileCount > 0 ? (estimatedPromotionCount / totalOnFileCount) * 100 : 0
    const actualPromotionRateByCount =
      totalOnFileCount > 0 ? (actualPromotionCount / totalOnFileCount) * 100 : 0

    // 计算升学率（金额）
    const estimatedPromotionRateByAmount =
      receivablePromotionIncome > 0
        ? (estimatedPromotionIncome / receivablePromotionIncome) * 100
        : 0
    const actualPromotionRateByAmount =
      receivablePromotionIncome > 0 ? (actualPromotionIncome / receivablePromotionIncome) * 100 : 0

    return {
      key: `${campus}-${month}`,
      month,
      campus,
      totalPromotionClasses,
      totalOnFileCount,
      estimatedPromotionCount,
      actualPromotionCount,
      estimatedPromotionRateByCount,
      actualPromotionRateByCount,
      receivablePromotionIncome,
      estimatedPromotionIncome,
      actualPromotionIncome,
      estimatedPromotionRateByAmount,
      actualPromotionRateByAmount,
    }
  })

  return baseData
}

// 计算汇总统计数据
const calculateSummary = (data: CampusPromotionRecord[]): CampusPromotionSummary => {
  if (data.length === 0) {
    return {
      totalPromotionClasses: 0,
      totalOnFileCount: 0,
      totalEstimatedPromotionCount: 0,
      totalActualPromotionCount: 0,
      averageEstimatedPromotionRateByCount: 0,
      averageActualPromotionRateByCount: 0,
      totalReceivablePromotionIncome: 0,
      totalEstimatedPromotionIncome: 0,
      totalActualPromotionIncome: 0,
      averageEstimatedPromotionRateByAmount: 0,
      averageActualPromotionRateByAmount: 0,
      completedMonths: 0,
      totalMonths: 0,
    }
  }

  const totalPromotionClasses = data.reduce((sum, item) => sum + item.totalPromotionClasses, 0)
  const totalOnFileCount = data.reduce((sum, item) => sum + item.totalOnFileCount, 0)
  const totalEstimatedPromotionCount = data.reduce(
    (sum, item) => sum + item.estimatedPromotionCount,
    0,
  )
  const totalActualPromotionCount = data.reduce((sum, item) => sum + item.actualPromotionCount, 0)
  const totalReceivablePromotionIncome = data.reduce(
    (sum, item) => sum + item.receivablePromotionIncome,
    0,
  )
  const totalEstimatedPromotionIncome = data.reduce(
    (sum, item) => sum + item.estimatedPromotionIncome,
    0,
  )
  const totalActualPromotionIncome = data.reduce((sum, item) => sum + item.actualPromotionIncome, 0)

  const completedMonths = data.filter((item) => item.totalOnFileCount > 0).length
  const totalMonths = data.length

  const averageEstimatedPromotionRateByCount =
    totalOnFileCount > 0 ? (totalEstimatedPromotionCount / totalOnFileCount) * 100 : 0
  const averageActualPromotionRateByCount =
    totalOnFileCount > 0 ? (totalActualPromotionCount / totalOnFileCount) * 100 : 0
  const averageEstimatedPromotionRateByAmount =
    totalReceivablePromotionIncome > 0
      ? (totalEstimatedPromotionIncome / totalReceivablePromotionIncome) * 100
      : 0
  const averageActualPromotionRateByAmount =
    totalReceivablePromotionIncome > 0
      ? (totalActualPromotionIncome / totalReceivablePromotionIncome) * 100
      : 0

  return {
    totalPromotionClasses,
    totalOnFileCount,
    totalEstimatedPromotionCount,
    totalActualPromotionCount,
    averageEstimatedPromotionRateByCount,
    averageActualPromotionRateByCount,
    totalReceivablePromotionIncome,
    totalEstimatedPromotionIncome,
    totalActualPromotionIncome,
    averageEstimatedPromotionRateByAmount,
    averageActualPromotionRateByAmount,
    completedMonths,
    totalMonths,
  }
}

export const campusPromotionService = {
  /**
   * 获取神殿升学计划数据
   * @param campus 神殿名称
   * @returns Promise<CampusPromotionRecord[]>
   */
  getCampusPromotionData: async (campus: string): Promise<CampusPromotionRecord[]> => {
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
   * @returns Promise<CampusPromotionSummary>
   */
  getCampusPromotionSummary: async (campus: string): Promise<CampusPromotionSummary> => {
    const data = await campusPromotionService.getCampusPromotionData(campus)
    return calculateSummary(data)
  },

  /**
   * 更新神殿升学计划数据
   * @param request 更新请求参数
   * @returns Promise<CampusPromotionRecord>
   */
  updateCampusPromotionData: async (
    request: CampusPromotionRequest & { month: number; data: Partial<CampusPromotionRecord> },
  ): Promise<CampusPromotionRecord> => {
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

    // 重新计算升学率
    updatedData.estimatedPromotionRateByCount =
      updatedData.totalOnFileCount > 0
        ? (updatedData.estimatedPromotionCount / updatedData.totalOnFileCount) * 100
        : 0
    updatedData.actualPromotionRateByCount =
      updatedData.totalOnFileCount > 0
        ? (updatedData.actualPromotionCount / updatedData.totalOnFileCount) * 100
        : 0
    updatedData.estimatedPromotionRateByAmount =
      updatedData.receivablePromotionIncome > 0
        ? (updatedData.estimatedPromotionIncome / updatedData.receivablePromotionIncome) * 100
        : 0
    updatedData.actualPromotionRateByAmount =
      updatedData.receivablePromotionIncome > 0
        ? (updatedData.actualPromotionIncome / updatedData.receivablePromotionIncome) * 100
        : 0

    return updatedData
  },

  /**
   * 导出神殿升学计划数据
   * @param campus 神殿名称
   * @returns Promise<Blob>
   */
  exportCampusPromotionData: async (campus: string): Promise<Blob> => {
    // 模拟API延迟
    await new Promise((resolve) => setTimeout(resolve, 200))

    const data = await campusPromotionService.getCampusPromotionData(campus)

    // 生成CSV内容
    const csvContent = [
      '月份,神殿,升学班级总数,在档总人数,预计升学总人数,实际升学总人数,预计升学率（人数）,实际升学率（人数）,应收升学收入,预计升学收入,实际升学收入,预计升学率（金额）,实际升学率（金额）',
      ...data.map(
        (item) =>
          `${item.month},${item.campus},${item.totalPromotionClasses},${item.totalOnFileCount},${item.estimatedPromotionCount},${item.actualPromotionCount},${item.estimatedPromotionRateByCount.toFixed(2)}%,${item.actualPromotionRateByCount.toFixed(2)}%,¥${item.receivablePromotionIncome},¥${item.estimatedPromotionIncome},¥${item.actualPromotionIncome},${item.estimatedPromotionRateByAmount.toFixed(2)}%,${item.actualPromotionRateByAmount.toFixed(2)}%`,
      ),
    ].join('\n')

    return new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  },
}
