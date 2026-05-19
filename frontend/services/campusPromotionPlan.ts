// [教质模块] 神殿教化司升学计划数据服务
/**
 * 神殿教化司升学计划数据服务
 */

import type {
  CampusPromotionPlanRecord,
  CampusPromotionPlanRequest,
  CampusPromotionPlanSummary,
} from '../types/campus-promotion-plan'

// 模拟数据生成器
const generateMockData = (campus: string): CampusPromotionPlanRecord[] => {
  const records: CampusPromotionPlanRecord[] = []

  // 根据神殿生成不同的模拟数据
  let baseTotalPromotionClasses = 0
  let baseTotalOnFileCount = 0
  let baseEstimatedPromotionCount = 0
  let baseActualPromotionCount = 0
  let baseReceivablePromotionIncome = 0
  let baseEstimatedPromotionIncome = 0
  let baseActualPromotionIncome = 0

  if (campus === '盛邦') {
    // 主神殿数据（规模较大）
    baseTotalPromotionClasses = 8
    baseTotalOnFileCount = 120
    baseEstimatedPromotionCount = 80
    baseActualPromotionCount = 75
    baseReceivablePromotionIncome = 240000
    baseEstimatedPromotionIncome = 200000
    baseActualPromotionIncome = 180000
  } else if (campus === '冀美') {
    // 永恒殿数据
    baseTotalPromotionClasses = 6
    baseTotalOnFileCount = 90
    baseEstimatedPromotionCount = 60
    baseActualPromotionCount = 55
    baseReceivablePromotionIncome = 180000
    baseEstimatedPromotionIncome = 150000
    baseActualPromotionIncome = 135000
  } else if (campus === '石美') {
    // 慈悲殿数据（规模较小）
    baseTotalPromotionClasses = 4
    baseTotalOnFileCount = 60
    baseEstimatedPromotionCount = 40
    baseActualPromotionCount = 35
    baseReceivablePromotionIncome = 120000
    baseEstimatedPromotionIncome = 100000
    baseActualPromotionIncome = 90000
  } else if (campus === '晋美') {
    // 李大殿数据
    baseTotalPromotionClasses = 5
    baseTotalOnFileCount = 75
    baseEstimatedPromotionCount = 50
    baseActualPromotionCount = 45
    baseReceivablePromotionIncome = 150000
    baseEstimatedPromotionIncome = 125000
    baseActualPromotionIncome = 112500
  } else if (campus === '原美') {
    // 智慧阁数据
    baseTotalPromotionClasses = 7
    baseTotalOnFileCount = 105
    baseEstimatedPromotionCount = 70
    baseActualPromotionCount = 65
    baseReceivablePromotionIncome = 210000
    baseEstimatedPromotionIncome = 175000
    baseActualPromotionIncome = 157500
  } else if (campus === '太美') {
    // 光明殿数据
    baseTotalPromotionClasses = 4
    baseTotalOnFileCount = 60
    baseEstimatedPromotionCount = 40
    baseActualPromotionCount = 35
    baseReceivablePromotionIncome = 120000
    baseEstimatedPromotionIncome = 100000
    baseActualPromotionIncome = 90000
  } else if (campus === '桂美') {
    // 神恩殿数据
    baseTotalPromotionClasses = 5
    baseTotalOnFileCount = 75
    baseEstimatedPromotionCount = 50
    baseActualPromotionCount = 45
    baseReceivablePromotionIncome = 150000
    baseEstimatedPromotionIncome = 125000
    baseActualPromotionIncome = 112500
  } else {
    // 其他神殿基础数据
    baseTotalPromotionClasses = Math.floor(Math.random() * 3) + 4
    baseTotalOnFileCount = Math.floor(Math.random() * 30) + 60
    baseEstimatedPromotionCount = Math.floor(Math.random() * 20) + 40
    baseActualPromotionCount = Math.floor(Math.random() * 15) + 35
    baseReceivablePromotionIncome = Math.floor(Math.random() * 50000) + 120000
    baseEstimatedPromotionIncome = Math.floor(Math.random() * 40000) + 100000
    baseActualPromotionIncome = Math.floor(Math.random() * 30000) + 90000
  }

  // 生成12条记录
  for (let i = 1; i <= 12; i++) {
    const totalPromotionClasses = Math.max(
      0,
      baseTotalPromotionClasses + Math.floor(Math.random() * 3) - 1,
    )
    const totalOnFileCount = Math.max(0, baseTotalOnFileCount + Math.floor(Math.random() * 10) - 5)
    const estimatedPromotionCount = Math.max(
      0,
      baseEstimatedPromotionCount + Math.floor(Math.random() * 8) - 4,
    )
    const actualPromotionCount = Math.max(
      0,
      baseActualPromotionCount + Math.floor(Math.random() * 6) - 3,
    )
    const receivablePromotionIncome = Math.max(
      0,
      baseReceivablePromotionIncome + Math.floor(Math.random() * 10000) - 5000,
    )
    const estimatedPromotionIncome = Math.max(
      0,
      baseEstimatedPromotionIncome + Math.floor(Math.random() * 8000) - 4000,
    )
    const actualPromotionIncome = Math.max(
      0,
      baseActualPromotionIncome + Math.floor(Math.random() * 6000) - 3000,
    )

    // 计算升学率
    const estimatedPromotionRateByCount =
      totalOnFileCount > 0 ? (estimatedPromotionCount / totalOnFileCount) * 100 : 0
    const actualPromotionRateByCount =
      totalOnFileCount > 0 ? (actualPromotionCount / totalOnFileCount) * 100 : 0
    const estimatedPromotionRateByAmount =
      receivablePromotionIncome > 0
        ? (estimatedPromotionIncome / receivablePromotionIncome) * 100
        : 0
    const actualPromotionRateByAmount =
      receivablePromotionIncome > 0 ? (actualPromotionIncome / receivablePromotionIncome) * 100 : 0

    records.push({
      key: `${campus}-${i}`,
      month: i,
      campus: i === 1 ? campus : '', // 只有第一条记录显示神殿名称
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
    })
  }

  return records
}

// 计算汇总统计数据
const calculateSummary = (data: CampusPromotionPlanRecord[]): CampusPromotionPlanSummary => {
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
      completionRateByCount: 0,
      completionRateByAmount: 0,
      averageMonthlyPromotionClasses: 0,
      averageMonthlyPromotionIncome: 0,
      completedRecords: 0,
      totalRecords: 0,
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

  const completionRateByCount =
    totalEstimatedPromotionCount > 0
      ? (totalActualPromotionCount / totalEstimatedPromotionCount) * 100
      : 0
  const completionRateByAmount =
    totalEstimatedPromotionIncome > 0
      ? (totalActualPromotionIncome / totalEstimatedPromotionIncome) * 100
      : 0

  const averageMonthlyPromotionClasses = totalPromotionClasses / data.length
  const averageMonthlyPromotionIncome = totalActualPromotionIncome / data.length

  const completedRecords = data.filter((item) => item.totalPromotionClasses > 0).length
  const totalRecords = data.length

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
    completionRateByCount,
    completionRateByAmount,
    averageMonthlyPromotionClasses,
    averageMonthlyPromotionIncome,
    completedRecords,
    totalRecords,
  }
}

export const campusPromotionPlanService = {
  /**
   * 获取神殿升学计划数据
   * @param campus 神殿名称
   * @returns Promise<CampusPromotionPlanRecord[]>
   */
  getCampusPromotionPlanData: async (campus: string): Promise<CampusPromotionPlanRecord[]> => {
    // 模拟API延迟
    await new Promise((resolve) => setTimeout(resolve, 500))

    if (!campus) {
      throw new Error('神殿名称不能为空')
    }

    const records = generateMockData(campus)

    // 添加合计行
    const totalRecord: CampusPromotionPlanRecord = {
      key: `${campus}-total`,
      month: 0,
      campus: '',
      totalPromotionClasses: records.reduce((sum, item) => sum + item.totalPromotionClasses, 0),
      totalOnFileCount: records.reduce((sum, item) => sum + item.totalOnFileCount, 0),
      estimatedPromotionCount: records.reduce((sum, item) => sum + item.estimatedPromotionCount, 0),
      actualPromotionCount: records.reduce((sum, item) => sum + item.actualPromotionCount, 0),
      estimatedPromotionRateByCount:
        records.reduce((sum, item) => sum + item.totalOnFileCount, 0) > 0
          ? (records.reduce((sum, item) => sum + item.estimatedPromotionCount, 0) /
              records.reduce((sum, item) => sum + item.totalOnFileCount, 0)) *
            100
          : 0,
      actualPromotionRateByCount:
        records.reduce((sum, item) => sum + item.totalOnFileCount, 0) > 0
          ? (records.reduce((sum, item) => sum + item.actualPromotionCount, 0) /
              records.reduce((sum, item) => sum + item.totalOnFileCount, 0)) *
            100
          : 0,
      receivablePromotionIncome: records.reduce(
        (sum, item) => sum + item.receivablePromotionIncome,
        0,
      ),
      estimatedPromotionIncome: records.reduce(
        (sum, item) => sum + item.estimatedPromotionIncome,
        0,
      ),
      actualPromotionIncome: records.reduce((sum, item) => sum + item.actualPromotionIncome, 0),
      estimatedPromotionRateByAmount:
        records.reduce((sum, item) => sum + item.receivablePromotionIncome, 0) > 0
          ? (records.reduce((sum, item) => sum + item.estimatedPromotionIncome, 0) /
              records.reduce((sum, item) => sum + item.receivablePromotionIncome, 0)) *
            100
          : 0,
      actualPromotionRateByAmount:
        records.reduce((sum, item) => sum + item.receivablePromotionIncome, 0) > 0
          ? (records.reduce((sum, item) => sum + item.actualPromotionIncome, 0) /
              records.reduce((sum, item) => sum + item.receivablePromotionIncome, 0)) *
            100
          : 0,
    }

    return [...records, totalRecord]
  },

  /**
   * 获取汇总统计数据
   * @param campus 神殿名称
   * @returns Promise<CampusPromotionPlanSummary>
   */
  getCampusPromotionPlanSummary: async (campus: string): Promise<CampusPromotionPlanSummary> => {
    const data = await campusPromotionPlanService.getCampusPromotionPlanData(campus)
    // 排除合计行
    const monthlyData = data.filter((item) => item.month > 0)
    return calculateSummary(monthlyData)
  },

  /**
   * 更新神殿升学计划数据
   * @param request 更新请求参数
   * @returns Promise<CampusPromotionPlanRecord>
   */
  updateCampusPromotionPlanData: async (
    request: CampusPromotionPlanRequest & {
      month: number
      data: Partial<CampusPromotionPlanRecord>
    },
  ): Promise<CampusPromotionPlanRecord> => {
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
   * 新增神殿升学计划数据
   * @param request 新增请求参数
   * @returns Promise<CampusPromotionPlanRecord>
   */
  addCampusPromotionPlanData: async (
    request: CampusPromotionPlanRequest & { data: Partial<CampusPromotionPlanRecord> },
  ): Promise<CampusPromotionPlanRecord> => {
    // 模拟API延迟
    await new Promise((resolve) => setTimeout(resolve, 300))

    if (!request.campus) {
      throw new Error('神殿名称不能为空')
    }

    const newRecord: CampusPromotionPlanRecord = {
      key: `${request.campus}-${Date.now()}`,
      month: 0,
      campus: request.campus,
      totalPromotionClasses: 0,
      totalOnFileCount: 0,
      estimatedPromotionCount: 0,
      actualPromotionCount: 0,
      estimatedPromotionRateByCount: 0,
      actualPromotionRateByCount: 0,
      receivablePromotionIncome: 0,
      estimatedPromotionIncome: 0,
      actualPromotionIncome: 0,
      estimatedPromotionRateByAmount: 0,
      actualPromotionRateByAmount: 0,
      ...request.data,
    }

    return newRecord
  },

  /**
   * 导出神殿升学计划数据
   * @param campus 神殿名称
   * @returns Promise<Blob>
   */
  exportCampusPromotionPlanData: async (campus: string): Promise<Blob> => {
    // 模拟API延迟
    await new Promise((resolve) => setTimeout(resolve, 200))

    const data = await campusPromotionPlanService.getCampusPromotionPlanData(campus)

    // 生成CSV内容
    const csvContent = [
      '月份,神殿,升学班级总数,在档总人数,预计升学总人数,实际升学总人数,预计升学率（人数）,实际升学率（人数）,应收升学收入,预计升学收入,实际升学收入,预计升学率（金额）,实际升学率（金额）',
      ...data.map(
        (item) =>
          `${item.month === 0 ? '合计/平均' : item.month},${item.campus},${item.totalPromotionClasses},${item.totalOnFileCount},${item.estimatedPromotionCount},${item.actualPromotionCount},${item.estimatedPromotionRateByCount.toFixed(2)}%,${item.actualPromotionRateByCount.toFixed(2)}%,${item.receivablePromotionIncome},${item.estimatedPromotionIncome},${item.actualPromotionIncome},${item.estimatedPromotionRateByAmount.toFixed(2)}%,${item.actualPromotionRateByAmount.toFixed(2)}%`,
      ),
    ].join('\n')

    return new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  },
}
