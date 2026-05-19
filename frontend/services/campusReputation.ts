// [教质模块] 神殿教化司口碑招生目标与结果汇总表数据服务
/**
 * 神殿教化司口碑招生目标与结果汇总表数据服务
 */

import type {
  CampusReputationRecord,
  CampusReputationRequest,
  CampusReputationSummary,
} from '../types/campus-reputation'

// 模拟数据生成器
const generateMockData = (campus: string): CampusReputationRecord[] => {
  const months = Array.from({ length: 12 }, (_, index) => index + 1)

  const baseData: CampusReputationRecord[] = months.map((month) => {
    // 根据月份和神殿生成不同的模拟数据
    let targetReputation = 0
    let actualReputation = 0
    let targetWalkIn = 0
    let actualWalkIn = 0
    let targetEnrollment = 0
    let actualEnrollment = 0
    let targetRevenue = 0
    let actualRevenue = 0

    if (campus === '盛邦') {
      // 主神殿数据
      switch (month) {
        case 1:
          targetReputation = 25
          actualReputation = 22
          targetWalkIn = 15
          actualWalkIn = 13
          targetEnrollment = 8
          actualEnrollment = 7
          targetRevenue = 120000
          actualRevenue = 105000
          break
        case 2:
          targetReputation = 30
          actualReputation = 28
          targetWalkIn = 18
          actualWalkIn = 16
          targetEnrollment = 10
          actualEnrollment = 9
          targetRevenue = 150000
          actualRevenue = 135000
          break
        case 3:
          targetReputation = 35
          actualReputation = 32
          targetWalkIn = 20
          actualWalkIn = 18
          targetEnrollment = 12
          actualEnrollment = 11
          targetRevenue = 180000
          actualRevenue = 165000
          break
        case 4:
          targetReputation = 28
          actualReputation = 25
          targetWalkIn = 16
          actualWalkIn = 14
          targetEnrollment = 9
          actualEnrollment = 8
          targetRevenue = 135000
          actualRevenue = 120000
          break
        case 5:
          targetReputation = 40
          actualReputation = 38
          targetWalkIn = 25
          actualWalkIn = 23
          targetEnrollment = 15
          actualEnrollment = 14
          targetRevenue = 225000
          actualRevenue = 210000
          break
        case 6:
          targetReputation = 45
          actualReputation = 42
          targetWalkIn = 28
          actualWalkIn = 26
          targetEnrollment = 18
          actualEnrollment = 17
          targetRevenue = 270000
          actualRevenue = 255000
          break
        case 7:
          targetReputation = 32
          actualReputation = 30
          targetWalkIn = 19
          actualWalkIn = 17
          targetEnrollment = 11
          actualEnrollment = 10
          targetRevenue = 165000
          actualRevenue = 150000
          break
        case 8:
          targetReputation = 38
          actualReputation = 35
          targetWalkIn = 22
          actualWalkIn = 20
          targetEnrollment = 13
          actualEnrollment = 12
          targetRevenue = 195000
          actualRevenue = 180000
          break
        case 9:
          targetReputation = 42
          actualReputation = 40
          targetWalkIn = 26
          actualWalkIn = 24
          targetEnrollment = 16
          actualEnrollment = 15
          targetRevenue = 240000
          actualRevenue = 225000
          break
        case 10:
          targetReputation = 48
          actualReputation = 45
          targetWalkIn = 30
          actualWalkIn = 28
          targetEnrollment = 20
          actualEnrollment = 19
          targetRevenue = 300000
          actualRevenue = 285000
          break
        case 11:
          targetReputation = 35
          actualReputation = 33
          targetWalkIn = 21
          actualWalkIn = 19
          targetEnrollment = 12
          actualEnrollment = 11
          targetRevenue = 180000
          actualRevenue = 165000
          break
        case 12:
          targetReputation = 30
          actualReputation = 28
          targetWalkIn = 18
          actualWalkIn = 16
          targetEnrollment = 10
          actualEnrollment = 9
          targetRevenue = 150000
          actualRevenue = 135000
          break
      }
    } else if (campus === '北京') {
      // 北京神殿数据（目标更高）
      switch (month) {
        case 1:
          targetReputation = 35
          actualReputation = 32
          targetWalkIn = 20
          actualWalkIn = 18
          targetEnrollment = 12
          actualEnrollment = 11
          targetRevenue = 180000
          actualRevenue = 165000
          break
        case 2:
          targetReputation = 40
          actualReputation = 38
          targetWalkIn = 25
          actualWalkIn = 23
          targetEnrollment = 15
          actualEnrollment = 14
          targetRevenue = 225000
          actualRevenue = 210000
          break
        case 3:
          targetReputation = 45
          actualReputation = 42
          targetWalkIn = 28
          actualWalkIn = 26
          targetEnrollment = 18
          actualEnrollment = 17
          targetRevenue = 270000
          actualRevenue = 255000
          break
        case 4:
          targetReputation = 38
          actualReputation = 35
          targetWalkIn = 22
          actualWalkIn = 20
          targetEnrollment = 13
          actualEnrollment = 12
          targetRevenue = 195000
          actualRevenue = 180000
          break
        case 5:
          targetReputation = 50
          actualReputation = 48
          targetWalkIn = 32
          actualWalkIn = 30
          targetEnrollment = 20
          actualEnrollment = 19
          targetRevenue = 300000
          actualRevenue = 285000
          break
        case 6:
          targetReputation = 55
          actualReputation = 52
          targetWalkIn = 35
          actualWalkIn = 33
          targetEnrollment = 25
          actualEnrollment = 24
          targetRevenue = 375000
          actualRevenue = 360000
          break
        case 7:
          targetReputation = 42
          actualReputation = 40
          targetWalkIn = 26
          actualWalkIn = 24
          targetEnrollment = 16
          actualEnrollment = 15
          targetRevenue = 240000
          actualRevenue = 225000
          break
        case 8:
          targetReputation = 48
          actualReputation = 45
          targetWalkIn = 30
          actualWalkIn = 28
          targetEnrollment = 20
          actualEnrollment = 19
          targetRevenue = 300000
          actualRevenue = 285000
          break
        case 9:
          targetReputation = 52
          actualReputation = 50
          targetWalkIn = 34
          actualWalkIn = 32
          targetEnrollment = 22
          actualEnrollment = 21
          targetRevenue = 330000
          actualRevenue = 315000
          break
        case 10:
          targetReputation = 58
          actualReputation = 55
          targetWalkIn = 38
          actualWalkIn = 36
          targetEnrollment = 28
          actualEnrollment = 27
          targetRevenue = 420000
          actualRevenue = 405000
          break
        case 11:
          targetReputation = 45
          actualReputation = 43
          targetWalkIn = 28
          actualWalkIn = 26
          targetEnrollment = 18
          actualEnrollment = 17
          targetRevenue = 270000
          actualRevenue = 255000
          break
        case 12:
          targetReputation = 40
          actualReputation = 38
          targetWalkIn = 25
          actualWalkIn = 23
          targetEnrollment = 15
          actualEnrollment = 14
          targetRevenue = 225000
          actualRevenue = 210000
          break
      }
    } else {
      // 其他神殿基础数据
      targetReputation = Math.floor(Math.random() * 20) + 20
      actualReputation = Math.floor(targetReputation * (0.85 + Math.random() * 0.15))
      targetWalkIn = Math.floor(targetReputation * 0.6)
      actualWalkIn = Math.floor(targetWalkIn * (0.85 + Math.random() * 0.15))
      targetEnrollment = Math.floor(targetWalkIn * 0.5)
      actualEnrollment = Math.floor(targetEnrollment * (0.85 + Math.random() * 0.15))
      targetRevenue = targetEnrollment * 15000
      actualRevenue = Math.floor(targetRevenue * (0.85 + Math.random() * 0.15))
    }

    // 计算完成率
    const reputationCompletionRate =
      targetReputation > 0 ? (actualReputation / targetReputation) * 100 : 0
    const walkInCompletionRate = targetWalkIn > 0 ? (actualWalkIn / targetWalkIn) * 100 : 0
    const enrollmentCompletionRate =
      targetEnrollment > 0 ? (actualEnrollment / targetEnrollment) * 100 : 0
    const revenueCompletionRate = targetRevenue > 0 ? (actualRevenue / targetRevenue) * 100 : 0

    return {
      key: `${campus}-${month}`,
      month,
      campus,
      targetReputationCount: targetReputation,
      actualReputationCount: actualReputation,
      reputationCompletionRate,
      targetWalkInCount: targetWalkIn,
      actualWalkInCount: actualWalkIn,
      walkInCompletionRate,
      targetEnrollmentCount: targetEnrollment,
      actualEnrollmentCount: actualEnrollment,
      enrollmentCompletionRate,
      targetRevenue: targetRevenue,
      actualRevenue: actualRevenue,
      revenueCompletionRate,
    }
  })

  return baseData
}

// 计算汇总统计数据
const calculateSummary = (data: CampusReputationRecord[]): CampusReputationSummary => {
  if (data.length === 0) {
    return {
      totalTargetReputation: 0,
      totalActualReputation: 0,
      averageReputationRate: 0,
      totalTargetWalkIn: 0,
      totalActualWalkIn: 0,
      averageWalkInRate: 0,
      totalTargetEnrollment: 0,
      totalActualEnrollment: 0,
      averageEnrollmentRate: 0,
      totalTargetRevenue: 0,
      totalActualRevenue: 0,
      averageRevenueRate: 0,
      completedMonths: 0,
      totalMonths: 0,
    }
  }

  const totalTargetReputation = data.reduce((sum, item) => sum + item.targetReputationCount, 0)
  const totalActualReputation = data.reduce((sum, item) => sum + item.actualReputationCount, 0)
  const totalTargetWalkIn = data.reduce((sum, item) => sum + item.targetWalkInCount, 0)
  const totalActualWalkIn = data.reduce((sum, item) => sum + item.actualWalkInCount, 0)
  const totalTargetEnrollment = data.reduce((sum, item) => sum + item.targetEnrollmentCount, 0)
  const totalActualEnrollment = data.reduce((sum, item) => sum + item.actualEnrollmentCount, 0)
  const totalTargetRevenue = data.reduce((sum, item) => sum + item.targetRevenue, 0)
  const totalActualRevenue = data.reduce((sum, item) => sum + item.actualRevenue, 0)

  const completedMonths = data.filter((item) => item.targetReputationCount > 0).length
  const totalMonths = data.length

  const averageReputationRate =
    totalTargetReputation > 0 ? (totalActualReputation / totalTargetReputation) * 100 : 0
  const averageWalkInRate =
    totalTargetWalkIn > 0 ? (totalActualWalkIn / totalTargetWalkIn) * 100 : 0
  const averageEnrollmentRate =
    totalTargetEnrollment > 0 ? (totalActualEnrollment / totalTargetEnrollment) * 100 : 0
  const averageRevenueRate =
    totalTargetRevenue > 0 ? (totalActualRevenue / totalTargetRevenue) * 100 : 0

  return {
    totalTargetReputation,
    totalActualReputation,
    averageReputationRate,
    totalTargetWalkIn,
    totalActualWalkIn,
    averageWalkInRate,
    totalTargetEnrollment,
    totalActualEnrollment,
    averageEnrollmentRate,
    totalTargetRevenue,
    totalActualRevenue,
    averageRevenueRate,
    completedMonths,
    totalMonths,
  }
}

export const campusReputationService = {
  /**
   * 获取神殿口碑招生数据
   * @param campus 神殿名称
   * @returns Promise<CampusReputationRecord[]>
   */
  getCampusReputationData: async (campus: string): Promise<CampusReputationRecord[]> => {
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
   * @returns Promise<CampusReputationSummary>
   */
  getCampusReputationSummary: async (campus: string): Promise<CampusReputationSummary> => {
    const data = await campusReputationService.getCampusReputationData(campus)
    return calculateSummary(data)
  },

  /**
   * 更新神殿口碑招生数据
   * @param request 更新请求参数
   * @returns Promise<CampusReputationRecord>
   */
  updateCampusReputationData: async (
    request: CampusReputationRequest & { month: number; data: Partial<CampusReputationRecord> },
  ): Promise<CampusReputationRecord> => {
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
    updatedData.reputationCompletionRate =
      updatedData.targetReputationCount > 0
        ? (updatedData.actualReputationCount / updatedData.targetReputationCount) * 100
        : 0
    updatedData.walkInCompletionRate =
      updatedData.targetWalkInCount > 0
        ? (updatedData.actualWalkInCount / updatedData.targetWalkInCount) * 100
        : 0
    updatedData.enrollmentCompletionRate =
      updatedData.targetEnrollmentCount > 0
        ? (updatedData.actualEnrollmentCount / updatedData.targetEnrollmentCount) * 100
        : 0
    updatedData.revenueCompletionRate =
      updatedData.targetRevenue > 0
        ? (updatedData.actualRevenue / updatedData.targetRevenue) * 100
        : 0

    return updatedData
  },

  /**
   * 导出神殿口碑招生数据
   * @param campus 神殿名称
   * @returns Promise<Blob>
   */
  exportCampusReputationData: async (campus: string): Promise<Blob> => {
    // 模拟API延迟
    await new Promise((resolve) => setTimeout(resolve, 200))

    const data = await campusReputationService.getCampusReputationData(campus)

    // 生成CSV内容
    const csvContent = [
      '月份,神殿,目标口碑量,实际口碑量,目标上门量,实际上门量,目标人数,实际人数,目标收入,实际收入',
      ...data.map(
        (item) =>
          `${item.month},${item.campus},${item.targetReputationCount},${item.actualReputationCount},${item.targetWalkInCount},${item.actualWalkInCount},${item.targetEnrollmentCount},${item.actualEnrollmentCount},¥${item.targetRevenue},¥${item.actualRevenue}`,
      ),
    ].join('\n')

    return new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  },
}
