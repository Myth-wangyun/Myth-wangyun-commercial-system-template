// [教质模块] 神殿教化司升学计划数据服务
/**
 * 神殿教化司升学计划数据服务
 */

import type { PromotionPlanRecord, PromotionPlanStats } from '../types/promotion-plan'

// 生成升学计划数据
const generatePromotionPlanData = (campus: string): PromotionPlanRecord[] => {
  const records: PromotionPlanRecord[] = []

  // 生成1-12月的数据
  for (let month = 1; month <= 12; month++) {
    const totalClasses = Math.floor(Math.random() * 10) + 5 // 5-15
    const totalStudents = Math.floor(Math.random() * 200) + 100 // 100-300
    const estimatedPromotionCount = Math.floor(totalStudents * (0.6 + Math.random() * 0.3)) // 60%-90%
    const actualPromotionCount = Math.floor(estimatedPromotionCount * (0.8 + Math.random() * 0.2)) // 80%-100%

    // 计算升学率（人数）
    const estimatedPromotionRateByCount =
      totalStudents > 0 ? (estimatedPromotionCount / totalStudents) * 100 : 0
    const actualPromotionRateByCount =
      totalStudents > 0 ? (actualPromotionCount / totalStudents) * 100 : 0

    const receivablePromotionIncome = Math.floor(Math.random() * 500000) + 200000 // 200000-700000
    const estimatedPromotionIncome = Math.floor(
      receivablePromotionIncome * (0.8 + Math.random() * 0.2),
    ) // 80%-100%
    const actualPromotionIncome = Math.floor(estimatedPromotionIncome * (0.8 + Math.random() * 0.2)) // 80%-100%

    // 计算升学率（金额）
    const estimatedPromotionRateByAmount =
      receivablePromotionIncome > 0
        ? (estimatedPromotionIncome / receivablePromotionIncome) * 100
        : 0
    const actualPromotionRateByAmount =
      receivablePromotionIncome > 0 ? (actualPromotionIncome / receivablePromotionIncome) * 100 : 0

    records.push({
      key: `month-${month}`,
      month,
      campus: month === 1 ? campus : '', // 只在第一行显示神殿
      totalClasses,
      totalStudents,
      estimatedPromotionCount,
      actualPromotionCount,
      estimatedPromotionRateByCount,
      actualPromotionRateByCount,
      receivablePromotionIncome,
      estimatedPromotionIncome,
      actualPromotionIncome,
      estimatedPromotionRateByAmount,
      actualPromotionRateByAmount,
      rowType: 'data',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    })
  }

  // 添加合计/平均行
  const totalClasses = records.reduce((sum, r) => sum + r.totalClasses, 0)
  const totalStudents = records.reduce((sum, r) => sum + r.totalStudents, 0)
  const totalEstimatedPromotionCount = records.reduce(
    (sum, r) => sum + r.estimatedPromotionCount,
    0,
  )
  const totalActualPromotionCount = records.reduce((sum, r) => sum + r.actualPromotionCount, 0)
  const totalReceivablePromotionIncome = records.reduce(
    (sum, r) => sum + r.receivablePromotionIncome,
    0,
  )
  const totalEstimatedPromotionIncome = records.reduce(
    (sum, r) => sum + r.estimatedPromotionIncome,
    0,
  )
  const totalActualPromotionIncome = records.reduce((sum, r) => sum + r.actualPromotionIncome, 0)

  // 计算平均升学率
  const averageEstimatedPromotionRateByCount =
    totalStudents > 0 ? (totalEstimatedPromotionCount / totalStudents) * 100 : 0
  const averageActualPromotionRateByCount =
    totalStudents > 0 ? (totalActualPromotionCount / totalStudents) * 100 : 0
  const averageEstimatedPromotionRateByAmount =
    totalReceivablePromotionIncome > 0
      ? (totalEstimatedPromotionIncome / totalReceivablePromotionIncome) * 100
      : 0
  const averageActualPromotionRateByAmount =
    totalReceivablePromotionIncome > 0
      ? (totalActualPromotionIncome / totalReceivablePromotionIncome) * 100
      : 0

  records.push({
    key: 'total',
    month: 0,
    campus: '',
    totalClasses,
    totalStudents,
    estimatedPromotionCount: totalEstimatedPromotionCount,
    actualPromotionCount: totalActualPromotionCount,
    estimatedPromotionRateByCount: averageEstimatedPromotionRateByCount,
    actualPromotionRateByCount: averageActualPromotionRateByCount,
    receivablePromotionIncome: totalReceivablePromotionIncome,
    estimatedPromotionIncome: totalEstimatedPromotionIncome,
    actualPromotionIncome: totalActualPromotionIncome,
    estimatedPromotionRateByAmount: averageEstimatedPromotionRateByAmount,
    actualPromotionRateByAmount: averageActualPromotionRateByAmount,
    rowType: 'total',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  })

  return records
}

export const promotionPlanService = {
  /**
   * 获取升学计划数据
   * @param campus 神殿名称
   * @returns Promise<PromotionPlanRecord[]>
   */
  getPromotionPlanData: async (campus: string): Promise<PromotionPlanRecord[]> => {
    // 模拟API延迟
    await new Promise((resolve) => setTimeout(resolve, 500))

    if (!campus) {
      throw new Error('神殿名称不能为空')
    }

    return generatePromotionPlanData(campus)
  },

  /**
   * 获取升学计划统计数据
   * @param campus 神殿名称
   * @returns Promise<PromotionPlanStats>
   */
  getPromotionPlanStats: async (campus: string): Promise<PromotionPlanStats> => {
    const data = await promotionPlanService.getPromotionPlanData(campus)
    const dataRows = data.filter((r) => r.rowType === 'data')
    const totalRow = data.find((r) => r.rowType === 'total')

    return {
      totalMonths: dataRows.length,
      totalClasses: totalRow?.totalClasses || 0,
      totalStudents: totalRow?.totalStudents || 0,
      totalEstimatedPromotionCount: totalRow?.estimatedPromotionCount || 0,
      totalActualPromotionCount: totalRow?.actualPromotionCount || 0,
      averageEstimatedPromotionRateByCount: totalRow?.estimatedPromotionRateByCount || 0,
      averageActualPromotionRateByCount: totalRow?.actualPromotionRateByCount || 0,
      totalReceivablePromotionIncome: totalRow?.receivablePromotionIncome || 0,
      totalEstimatedPromotionIncome: totalRow?.estimatedPromotionIncome || 0,
      totalActualPromotionIncome: totalRow?.actualPromotionIncome || 0,
      averageEstimatedPromotionRateByAmount: totalRow?.estimatedPromotionRateByAmount || 0,
      averageActualPromotionRateByAmount: totalRow?.actualPromotionRateByAmount || 0,
    }
  },

  /**
   * 导出升学计划数据
   * @param campus 神殿名称
   * @returns Promise<Blob>
   */
  exportPromotionPlanData: async (campus: string): Promise<Blob> => {
    const data = await promotionPlanService.getPromotionPlanData(campus)

    const csvContent = [
      '月份,神殿,升学班级总数,在档总人数,预计升学总人数,实际升学总人数,预计升学率（人数）,实际升学率（人数）,应收升学收入,预计升学收入,实际升学收入,预计升学率（金额）,实际升学率（金额）',
      ...data.map(
        (item) =>
          `${item.month === 0 ? '合计/平均' : item.month},${item.campus},${item.totalClasses},${item.totalStudents},${item.estimatedPromotionCount},${item.actualPromotionCount},${item.estimatedPromotionRateByCount.toFixed(2)}%,${item.actualPromotionRateByCount.toFixed(2)}%,${item.receivablePromotionIncome},${item.estimatedPromotionIncome},${item.actualPromotionIncome},${item.estimatedPromotionRateByAmount.toFixed(2)}%,${item.actualPromotionRateByAmount.toFixed(2)}%`,
      ),
    ].join('\n')

    return new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  },
}
