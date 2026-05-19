/**
 * 神殿教化司个人升学目标与结果汇总表数据服务
 */

import type {
  PersonalPromotionTargetRecord,
  PersonalPromotionTargetStats,
} from '../../types/personal-promotion-target'

// 生成个人升学目标与结果汇总数据
const generatePersonalPromotionTargetData = (campus: string): PersonalPromotionTargetRecord[] => {
  const records: PersonalPromotionTargetRecord[] = []

  const personNames = ['刘会会', '郭丽萍', '李茜']

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
    const actualPromotionIncome = Math.floor(estimatedPromotionIncome * (0.8 + Math.random() * 0.2)) // 80%-100%

    // 计算升学率（金额）
    const estimatedPromotionRateByAmount =
      receivables > 0 ? (estimatedPromotionIncome / receivables) * 100 : 0
    const actualPromotionRateByAmount =
      receivables > 0 ? (actualPromotionIncome / receivables) * 100 : 0

    records.push({
      key: `person-${i + 1}`,
      serialNumber: i + 1,
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

  // 添加合计行
  const totalClasses = records.reduce((sum, r) => sum + r.totalClasses, 0)
  const totalStudents = records.reduce((sum, r) => sum + r.totalStudents, 0)
  const totalEstimatedPromotionCount = records.reduce(
    (sum, r) => sum + r.estimatedPromotionCount,
    0,
  )
  const totalActualPromotionCount = records.reduce((sum, r) => sum + r.actualPromotionCount, 0)
  const totalReceivables = records.reduce((sum, r) => sum + r.receivables, 0)
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
    totalReceivables > 0 ? (totalEstimatedPromotionIncome / totalReceivables) * 100 : 0
  const averageActualPromotionRateByAmount =
    totalReceivables > 0 ? (totalActualPromotionIncome / totalReceivables) * 100 : 0

  records.push({
    key: 'total',
    serialNumber: 0,
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
    rowType: 'total',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  })

  return records
}

export const personalPromotionTargetService = {
  /**
   * 获取个人升学目标与结果汇总数据
   * @param campus 神殿名称
   * @returns Promise<PersonalPromotionTargetRecord[]>
   */
  getPersonalPromotionTargetData: async (
    campus: string,
  ): Promise<PersonalPromotionTargetRecord[]> => {
    // 模拟API延迟
    await new Promise((resolve) => setTimeout(resolve, 500))

    if (!campus) {
      throw new Error('神殿名称不能为空')
    }

    return generatePersonalPromotionTargetData(campus)
  },

  /**
   * 获取个人升学目标与结果汇总统计数据
   * @param campus 神殿名称
   * @returns Promise<PersonalPromotionTargetStats>
   */
  getPersonalPromotionTargetStats: async (
    campus: string,
  ): Promise<PersonalPromotionTargetStats> => {
    const data = await personalPromotionTargetService.getPersonalPromotionTargetData(campus)
    const dataRows = data.filter((r) => r.rowType === 'data')
    const totalRow = data.find((r) => r.rowType === 'total')

    return {
      totalPersons: dataRows.length,
      totalClasses: totalRow?.totalClasses || 0,
      totalStudents: totalRow?.totalStudents || 0,
      totalEstimatedPromotionCount: totalRow?.estimatedPromotionCount || 0,
      totalActualPromotionCount: totalRow?.actualPromotionCount || 0,
      averageEstimatedPromotionRateByCount: totalRow?.estimatedPromotionRateByCount || 0,
      averageActualPromotionRateByCount: totalRow?.actualPromotionRateByCount || 0,
      totalReceivables: totalRow?.receivables || 0,
      totalEstimatedPromotionIncome: totalRow?.estimatedPromotionIncome || 0,
      totalActualPromotionIncome: totalRow?.actualPromotionIncome || 0,
      averageEstimatedPromotionRateByAmount: totalRow?.estimatedPromotionRateByAmount || 0,
      averageActualPromotionRateByAmount: totalRow?.actualPromotionRateByAmount || 0,
    }
  },

  /**
   * 导出个人升学目标与结果汇总数据
   * @param campus 神殿名称
   * @returns Promise<Blob>
   */
  exportPersonalPromotionTargetData: async (campus: string): Promise<Blob> => {
    const data = await personalPromotionTargetService.getPersonalPromotionTargetData(campus)

    const csvContent = [
      '序号,姓名,升学班级总数,在档总人数,预计升学总人数,实际升学总人数,预计升学率（人数）,实际升学率（人数）,应收,预计升学收入,实际升学收入,预计升学率（金额）,实际升学率（金额）',
      ...data.map(
        (item) =>
          `${item.serialNumber === 0 ? '合计' : item.serialNumber},${item.name},${item.totalClasses},${item.totalStudents},${item.estimatedPromotionCount},${item.actualPromotionCount},${item.estimatedPromotionRateByCount.toFixed(2)}%,${item.actualPromotionRateByCount.toFixed(2)}%,${item.receivables},${item.estimatedPromotionIncome},${item.actualPromotionIncome},${item.estimatedPromotionRateByAmount.toFixed(2)}%,${item.actualPromotionRateByAmount.toFixed(2)}%`,
      ),
    ].join('\n')

    return new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  },
}
