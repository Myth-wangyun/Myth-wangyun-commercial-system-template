/**
 * 神殿教化司月度个人升学目标与结果汇总表数据服务
 */

import type {
  MonthlyPersonalPromotionTargetRecord,
  MonthlyPersonalPromotionTargetStats,
} from '../../types/monthly-personal-promotion-target'

// 生成月度个人升学目标与结果汇总数据
const generateMonthlyPersonalPromotionTargetData = (
  campus: string,
): MonthlyPersonalPromotionTargetRecord[] => {
  const records: MonthlyPersonalPromotionTargetRecord[] = []

  const personNames = ['刘会会', '郭丽萍', '李茜']

  // 生成1-12月的数据
  for (let month = 1; month <= 12; month++) {
    // 为每个月生成3个人的数据
    for (let i = 0; i < personNames.length; i++) {
      const totalClasses = Math.floor(Math.random() * 8) + 2 // 2-10
      const totalStudents = Math.floor(Math.random() * 150) + 50 // 50-200
      const estimatedPromotionCount = Math.floor(totalStudents * (0.6 + Math.random() * 0.3)) // 60%-90%
      const actualPromotionCount = Math.floor(estimatedPromotionCount * (0.8 + Math.random() * 0.2)) // 80%-100%

      // 计算升学率（人数）
      const estimatedPromotionRateByCount =
        totalStudents > 0 ? (estimatedPromotionCount / totalStudents) * 100 : 0
      const actualPromotionRateByCount =
        totalStudents > 0 ? (actualPromotionCount / totalStudents) * 100 : 0

      const receivables = Math.floor(Math.random() * 400000) + 100000 // 100000-500000
      const estimatedPromotionIncome = Math.floor(receivables * (0.8 + Math.random() * 0.2)) // 80%-100%
      const actualPromotionIncome = Math.floor(
        estimatedPromotionIncome * (0.8 + Math.random() * 0.2),
      ) // 80%-100%

      // 计算升学率（金额）
      const estimatedPromotionRateByAmount =
        receivables > 0 ? (estimatedPromotionIncome / receivables) * 100 : 0
      const actualPromotionRateByAmount =
        receivables > 0 ? (actualPromotionIncome / receivables) * 100 : 0

      records.push({
        key: `month-${month}-person-${i + 1}`,
        month,
        name: personNames[i],
        totalClasses,
        totalStudents,
        estimatedPromotionCount,
        actualPromotionCount,
        estimatedPromotionRateByCount,
        actualPromotionRateByCount,
        receivables,
        estimatedPromotionIncome,
        actualPromotionIncome,
        estimatedPromotionRateByAmount,
        actualPromotionRateByAmount,
        rowType: 'data',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      })
    }

    // 添加月合计行
    const monthRecords = records.filter((r) => r.month === month && r.rowType === 'data')
    const monthTotalClasses = monthRecords.reduce((sum, r) => sum + r.totalClasses, 0)
    const monthTotalStudents = monthRecords.reduce((sum, r) => sum + r.totalStudents, 0)
    const monthEstimatedPromotionCount = monthRecords.reduce(
      (sum, r) => sum + r.estimatedPromotionCount,
      0,
    )
    const monthActualPromotionCount = monthRecords.reduce(
      (sum, r) => sum + r.actualPromotionCount,
      0,
    )
    const monthReceivables = monthRecords.reduce((sum, r) => sum + r.receivables, 0)
    const monthEstimatedPromotionIncome = monthRecords.reduce(
      (sum, r) => sum + r.estimatedPromotionIncome,
      0,
    )
    const monthActualPromotionIncome = monthRecords.reduce(
      (sum, r) => sum + r.actualPromotionIncome,
      0,
    )

    // 计算月平均升学率
    const monthEstimatedPromotionRateByCount =
      monthTotalStudents > 0 ? (monthEstimatedPromotionCount / monthTotalStudents) * 100 : 0
    const monthActualPromotionRateByCount =
      monthTotalStudents > 0 ? (monthActualPromotionCount / monthTotalStudents) * 100 : 0
    const monthEstimatedPromotionRateByAmount =
      monthReceivables > 0 ? (monthEstimatedPromotionIncome / monthReceivables) * 100 : 0
    const monthActualPromotionRateByAmount =
      monthReceivables > 0 ? (monthActualPromotionIncome / monthReceivables) * 100 : 0

    records.push({
      key: `month-${month}-total`,
      month,
      name: '合计',
      totalClasses: monthTotalClasses,
      totalStudents: monthTotalStudents,
      estimatedPromotionCount: monthEstimatedPromotionCount,
      actualPromotionCount: monthActualPromotionCount,
      estimatedPromotionRateByCount: monthEstimatedPromotionRateByCount,
      actualPromotionRateByCount: monthActualPromotionRateByCount,
      receivables: monthReceivables,
      estimatedPromotionIncome: monthEstimatedPromotionIncome,
      actualPromotionIncome: monthActualPromotionIncome,
      estimatedPromotionRateByAmount: monthEstimatedPromotionRateByAmount,
      actualPromotionRateByAmount: monthActualPromotionRateByAmount,
      rowType: 'monthly-total',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    })
  }

  // 添加总合计行
  const allDataRecords = records.filter((r) => r.rowType === 'data')
  const totalClasses = allDataRecords.reduce((sum, r) => sum + r.totalClasses, 0)
  const totalStudents = allDataRecords.reduce((sum, r) => sum + r.totalStudents, 0)
  const totalEstimatedPromotionCount = allDataRecords.reduce(
    (sum, r) => sum + r.estimatedPromotionCount,
    0,
  )
  const totalActualPromotionCount = allDataRecords.reduce(
    (sum, r) => sum + r.actualPromotionCount,
    0,
  )
  const totalReceivables = allDataRecords.reduce((sum, r) => sum + r.receivables, 0)
  const totalEstimatedPromotionIncome = allDataRecords.reduce(
    (sum, r) => sum + r.estimatedPromotionIncome,
    0,
  )
  const totalActualPromotionIncome = allDataRecords.reduce(
    (sum, r) => sum + r.actualPromotionIncome,
    0,
  )

  // 计算总平均升学率
  const averageEstimatedPromotionRateByCount =
    totalStudents > 0 ? (totalEstimatedPromotionCount / totalStudents) * 100 : 0
  const averageActualPromotionRateByCount =
    totalStudents > 0 ? (totalActualPromotionCount / totalStudents) * 100 : 0
  const averageEstimatedPromotionRateByAmount =
    totalReceivables > 0 ? (totalEstimatedPromotionIncome / totalReceivables) * 100 : 0
  const averageActualPromotionRateByAmount =
    totalReceivables > 0 ? (totalActualPromotionIncome / totalReceivables) * 100 : 0

  records.push({
    key: 'grand-total',
    month: 0,
    name: '合计',
    totalClasses,
    totalStudents,
    estimatedPromotionCount: totalEstimatedPromotionCount,
    actualPromotionCount: totalActualPromotionCount,
    estimatedPromotionRateByCount: averageEstimatedPromotionRateByCount,
    actualPromotionRateByCount: averageActualPromotionRateByCount,
    receivables: totalReceivables,
    estimatedPromotionIncome: totalEstimatedPromotionIncome,
    actualPromotionIncome: totalActualPromotionIncome,
    estimatedPromotionRateByAmount: averageEstimatedPromotionRateByAmount,
    actualPromotionRateByAmount: averageActualPromotionRateByAmount,
    rowType: 'grand-total',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  })

  return records
}

export const monthlyPersonalPromotionTargetService = {
  /**
   * 获取月度个人升学目标与结果汇总数据
   * @param campus 神殿名称
   * @returns Promise<MonthlyPersonalPromotionTargetRecord[]>
   */
  getMonthlyPersonalPromotionTargetData: async (
    campus: string,
  ): Promise<MonthlyPersonalPromotionTargetRecord[]> => {
    // 模拟API延迟
    await new Promise((resolve) => setTimeout(resolve, 500))

    if (!campus) {
      throw new Error('神殿名称不能为空')
    }

    return generateMonthlyPersonalPromotionTargetData(campus)
  },

  /**
   * 获取月度个人升学目标与结果汇总统计数据
   * @param campus 神殿名称
   * @returns Promise<MonthlyPersonalPromotionTargetStats>
   */
  getMonthlyPersonalPromotionTargetStats: async (
    campus: string,
  ): Promise<MonthlyPersonalPromotionTargetStats> => {
    const data =
      await monthlyPersonalPromotionTargetService.getMonthlyPersonalPromotionTargetData(campus)
    const dataRows = data.filter((r) => r.rowType === 'data')
    const grandTotalRow = data.find((r) => r.rowType === 'grand-total')

    return {
      totalMonths: 12,
      totalPersons: dataRows.length / 12, // 每月3人
      totalClasses: grandTotalRow?.totalClasses || 0,
      totalStudents: grandTotalRow?.totalStudents || 0,
      totalEstimatedPromotionCount: grandTotalRow?.estimatedPromotionCount || 0,
      totalActualPromotionCount: grandTotalRow?.actualPromotionCount || 0,
      averageEstimatedPromotionRateByCount: grandTotalRow?.estimatedPromotionRateByCount || 0,
      averageActualPromotionRateByCount: grandTotalRow?.actualPromotionRateByCount || 0,
      totalReceivables: grandTotalRow?.receivables || 0,
      totalEstimatedPromotionIncome: grandTotalRow?.estimatedPromotionIncome || 0,
      totalActualPromotionIncome: grandTotalRow?.actualPromotionIncome || 0,
      averageEstimatedPromotionRateByAmount: grandTotalRow?.estimatedPromotionRateByAmount || 0,
      averageActualPromotionRateByAmount: grandTotalRow?.actualPromotionRateByAmount || 0,
    }
  },

  /**
   * 导出月度个人升学目标与结果汇总数据
   * @param campus 神殿名称
   * @returns Promise<Blob>
   */
  exportMonthlyPersonalPromotionTargetData: async (campus: string): Promise<Blob> => {
    const data =
      await monthlyPersonalPromotionTargetService.getMonthlyPersonalPromotionTargetData(campus)

    const csvContent = [
      '月份,姓名,升学班级总数,在档总人数,预计升学总人数,实际升学总人数,预计升学率（人数）,实际升学率（人数）,应收,预计升学收入,实际升学收入,预计升学率（金额）,实际升学率（金额）',
      ...data.map(
        (item) =>
          `${item.month === 0 ? '合计' : item.month},${item.name},${item.totalClasses},${item.totalStudents},${item.estimatedPromotionCount},${item.actualPromotionCount},${item.estimatedPromotionRateByCount.toFixed(2)}%,${item.actualPromotionRateByCount.toFixed(2)}%,${item.receivables},${item.estimatedPromotionIncome},${item.actualPromotionIncome},${item.estimatedPromotionRateByAmount.toFixed(2)}%,${item.actualPromotionRateByAmount.toFixed(2)}%`,
      ),
    ].join('\n')

    return new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  },
}
