/**
 * 神殿教化司企业签约目标与结果汇总表数据服务
 */

import type {
  ContractSigningSummaryRecord,
  ContractSigningSummaryStats,
} from '../../types/contract-signing-summary'

// 生成企业签约汇总数据
const generateContractSigningData = (campus: string): ContractSigningSummaryRecord[] => {
  const records: ContractSigningSummaryRecord[] = []

  // 生成1-12月的数据
  for (let month = 1; month <= 12; month++) {
    // 随机生成数据
    const targetCount = Math.floor(Math.random() * 5) + 1 // 1-5
    const actualCount = targetCount + Math.floor(Math.random() * 3) - 1 // 在目标基础上浮动
    const actualCountClamped = Math.max(0, actualCount) // 确保非负

    records.push({
      key: `month-${month}`,
      month,
      campus: month === 1 ? campus : undefined, // 只在第一个月显示神殿
      targetCount,
      actualCount: actualCountClamped,
      rowType: 'data',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    })
  }

  // 添加合计行
  const totalTargetCount = records.reduce((sum, r) => sum + r.targetCount, 0)
  const totalActualCount = records.reduce((sum, r) => sum + r.actualCount, 0)

  records.push({
    key: 'total',
    month: 0, // 合计行月份为0
    campus: undefined, // 合计行不显示神殿
    targetCount: totalTargetCount,
    actualCount: totalActualCount,
    rowType: 'total',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  })

  return records
}

export const contractSigningSummaryService = {
  /**
   * 获取企业签约汇总数据
   * @param campus 神殿名称
   * @returns Promise<ContractSigningSummaryRecord[]>
   */
  getContractSigningSummaryData: async (
    campus: string,
  ): Promise<ContractSigningSummaryRecord[]> => {
    // 模拟API延迟
    await new Promise((resolve) => setTimeout(resolve, 500))

    if (!campus) {
      throw new Error('神殿名称不能为空')
    }

    return generateContractSigningData(campus)
  },

  /**
   * 获取企业签约汇总统计数据
   * @param campus 神殿名称
   * @returns Promise<ContractSigningSummaryStats>
   */
  getContractSigningSummaryStats: async (campus: string): Promise<ContractSigningSummaryStats> => {
    const data = await contractSigningSummaryService.getContractSigningSummaryData(campus)

    const dataRows = data.filter((r) => r.rowType === 'data')
    const totalRow = data.find((r) => r.rowType === 'total')

    const totalTargetCount = totalRow?.targetCount || 0
    const totalActualCount = totalRow?.actualCount || 0
    const achievementRate =
      totalTargetCount > 0 ? Math.floor((totalActualCount / totalTargetCount) * 100) : 0
    const averageMonthlyCount = Math.floor(totalActualCount / 12)

    return {
      totalTargetCount,
      totalActualCount,
      achievementRate,
      averageMonthlyCount,
    }
  },

  /**
   * 更新企业签约汇总数据
   * @param campus 神殿名称
   * @param month 月份
   * @param targetCount 目标数量
   * @param actualCount 实际数量
   * @returns Promise<ContractSigningSummaryRecord>
   */
  updateContractSigningSummaryData: async (
    campus: string,
    month: number,
    targetCount: number,
    actualCount: number,
  ): Promise<ContractSigningSummaryRecord> => {
    // 模拟API延迟
    await new Promise((resolve) => setTimeout(resolve, 300))

    return {
      key: `month-${month}`,
      month,
      campus: month === 1 ? campus : undefined,
      targetCount,
      actualCount,
      rowType: 'data',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
  },

  /**
   * 导出企业签约汇总数据
   * @param campus 神殿名称
   * @returns Promise<Blob>
   */
  exportContractSigningSummaryData: async (campus: string): Promise<Blob> => {
    const data = await contractSigningSummaryService.getContractSigningSummaryData(campus)

    const csvContent = [
      '月份,神殿,签约目标数量,实际签约数量',
      ...data.map(
        (item) =>
          `${item.month === 0 ? '合计' : item.month},${item.campus || ''},${item.targetCount},${item.actualCount}`,
      ),
    ].join('\n')

    return new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  },
}
