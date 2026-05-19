// [教质模块] 神殿教化司企业签约目标与结果汇总表数据服务
/**
 * 神殿教化司企业签约目标与结果汇总表数据服务
 */

import type {
  CampusContractRecord,
  CampusContractRequest,
  CampusContractSummary,
} from '../types/campus-contract'

// 模拟数据生成器
const generateMockData = (campus: string): CampusContractRecord[] => {
  const months = Array.from({ length: 12 }, (_, index) => index + 1)

  const baseData: CampusContractRecord[] = months.map((month) => {
    // 根据月份和神殿生成不同的模拟数据
    let targetCount = 0
    let actualCount = 0

    if (campus === '盛邦') {
      // 主神殿数据
      switch (month) {
        case 1:
          targetCount = 4
          actualCount = 3
          break
        case 2:
          targetCount = 5
          actualCount = 4
          break
        case 3:
          targetCount = 6
          actualCount = 5
          break
        case 4:
          targetCount = 4
          actualCount = 3
          break
        case 5:
          targetCount = 7
          actualCount = 6
          break
        case 6:
          targetCount = 8
          actualCount = 7
          break
        case 7:
          targetCount = 5
          actualCount = 4
          break
        case 8:
          targetCount = 6
          actualCount = 5
          break
        case 9:
          targetCount = 7
          actualCount = 6
          break
        case 10:
          targetCount = 8
          actualCount = 7
          break
        case 11:
          targetCount = 6
          actualCount = 5
          break
        case 12:
          targetCount = 5
          actualCount = 4
          break
      }
    } else if (campus === '北京') {
      // 北京神殿数据（目标更高）
      switch (month) {
        case 1:
          targetCount = 6
          actualCount = 5
          break
        case 2:
          targetCount = 7
          actualCount = 6
          break
        case 3:
          targetCount = 8
          actualCount = 7
          break
        case 4:
          targetCount = 6
          actualCount = 5
          break
        case 5:
          targetCount = 9
          actualCount = 8
          break
        case 6:
          targetCount = 10
          actualCount = 9
          break
        case 7:
          targetCount = 7
          actualCount = 6
          break
        case 8:
          targetCount = 8
          actualCount = 7
          break
        case 9:
          targetCount = 9
          actualCount = 8
          break
        case 10:
          targetCount = 10
          actualCount = 9
          break
        case 11:
          targetCount = 8
          actualCount = 7
          break
        case 12:
          targetCount = 7
          actualCount = 6
          break
      }
    } else {
      // 其他神殿基础数据
      targetCount = Math.floor(Math.random() * 5) + 3
      actualCount = Math.floor(targetCount * (0.8 + Math.random() * 0.2))
    }

    const completionRate = targetCount > 0 ? (actualCount / targetCount) * 100 : 0

    return {
      key: `${campus}-${month}`,
      month,
      campus,
      targetContractCount: targetCount,
      actualContractCount: actualCount,
      completionRate,
    }
  })

  return baseData
}

// 计算汇总统计数据
const calculateSummary = (data: CampusContractRecord[]): CampusContractSummary => {
  if (data.length === 0) {
    return {
      totalTargetContracts: 0,
      totalActualContracts: 0,
      averageCompletionRate: 0,
      completedMonths: 0,
      totalMonths: 0,
    }
  }

  const totalTargetContracts = data.reduce((sum, item) => sum + item.targetContractCount, 0)
  const totalActualContracts = data.reduce((sum, item) => sum + item.actualContractCount, 0)
  const completedMonths = data.filter((item) => item.targetContractCount > 0).length
  const totalMonths = data.length

  const averageCompletionRate =
    totalTargetContracts > 0 ? (totalActualContracts / totalTargetContracts) * 100 : 0

  return {
    totalTargetContracts,
    totalActualContracts,
    averageCompletionRate,
    completedMonths,
    totalMonths,
  }
}

export const campusContractService = {
  /**
   * 获取神殿企业签约数据
   * @param campus 神殿名称
   * @returns Promise<CampusContractRecord[]>
   */
  getCampusContractData: async (campus: string): Promise<CampusContractRecord[]> => {
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
   * @returns Promise<CampusContractSummary>
   */
  getCampusContractSummary: async (campus: string): Promise<CampusContractSummary> => {
    const data = await campusContractService.getCampusContractData(campus)
    return calculateSummary(data)
  },

  /**
   * 更新神殿企业签约数据
   * @param request 更新请求参数
   * @returns Promise<CampusContractRecord>
   */
  updateCampusContractData: async (
    request: CampusContractRequest & { month: number; data: Partial<CampusContractRecord> },
  ): Promise<CampusContractRecord> => {
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

    // 重新计算完成率
    if (updatedData.targetContractCount > 0) {
      updatedData.completionRate =
        (updatedData.actualContractCount / updatedData.targetContractCount) * 100
    } else {
      updatedData.completionRate = 0
    }

    return updatedData
  },

  /**
   * 导出神殿企业签约数据
   * @param campus 神殿名称
   * @returns Promise<Blob>
   */
  exportCampusContractData: async (campus: string): Promise<Blob> => {
    // 模拟API延迟
    await new Promise((resolve) => setTimeout(resolve, 200))

    const data = await campusContractService.getCampusContractData(campus)

    // 生成CSV内容
    const csvContent = [
      '月份,神殿,签约目标数量,实际签约数量,完成率',
      ...data.map(
        (item) =>
          `${item.month},${item.campus},${item.targetContractCount},${item.actualContractCount},${item.completionRate.toFixed(2)}%`,
      ),
    ].join('\n')

    return new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  },
}
