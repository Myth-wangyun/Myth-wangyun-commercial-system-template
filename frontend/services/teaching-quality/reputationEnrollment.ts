/**
 * 神殿教化司口碑招生目标与结果汇总表数据服务
 */

import type {
  ReputationEnrollmentRecord,
  ReputationEnrollmentStats,
} from '@/types/reputation-enrollment'

// 生成口碑招生汇总数据
const generateReputationEnrollmentData = (campus: string): ReputationEnrollmentRecord[] => {
  const records: ReputationEnrollmentRecord[] = []

  // 生成1-12月的数据
  for (let month = 1; month <= 12; month++) {
    // 随机生成数据
    const targetReputationVolume = Math.floor(Math.random() * 30) + 20 // 20-50
    const actualReputationVolume = targetReputationVolume + Math.floor(Math.random() * 10) - 5 // 浮动

    const targetWalkInVolume = Math.floor(Math.random() * 20) + 15 // 15-35
    const actualWalkInVolume = targetWalkInVolume + Math.floor(Math.random() * 8) - 4 // 浮动

    const targetEnrollmentCount = Math.floor(Math.random() * 15) + 10 // 10-25
    const actualEnrollmentCount = targetEnrollmentCount + Math.floor(Math.random() * 6) - 3 // 浮动

    const targetRevenue = Math.floor(Math.random() * 100000) + 50000 // 50000-150000
    const actualRevenue = targetRevenue + Math.floor(Math.random() * 50000) - 25000 // 浮动

    records.push({
      key: `month-${month}`,
      month,
      campus: month === 1 ? campus : '', // 只在第一个月显示神殿
      targetReputationVolume,
      actualReputationVolume: Math.max(0, actualReputationVolume),
      targetWalkInVolume,
      actualWalkInVolume: Math.max(0, actualWalkInVolume),
      targetEnrollmentCount,
      actualEnrollmentCount: Math.max(0, actualEnrollmentCount),
      targetRevenue,
      actualRevenue: Math.max(0, actualRevenue),
      rowType: 'data',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    })
  }

  // 添加合计行
  const dataRows = records.filter((r) => r.rowType === 'data')
  const totalTargetReputationVolume = dataRows.reduce((sum, r) => sum + r.targetReputationVolume, 0)
  const totalActualReputationVolume = dataRows.reduce((sum, r) => sum + r.actualReputationVolume, 0)
  const totalTargetWalkInVolume = dataRows.reduce((sum, r) => sum + r.targetWalkInVolume, 0)
  const totalActualWalkInVolume = dataRows.reduce((sum, r) => sum + r.actualWalkInVolume, 0)
  const totalTargetEnrollmentCount = dataRows.reduce((sum, r) => sum + r.targetEnrollmentCount, 0)
  const totalActualEnrollmentCount = dataRows.reduce((sum, r) => sum + r.actualEnrollmentCount, 0)
  const totalTargetRevenue = dataRows.reduce((sum, r) => sum + r.targetRevenue, 0)
  const totalActualRevenue = dataRows.reduce((sum, r) => sum + r.actualRevenue, 0)

  records.push({
    key: 'total',
    month: 0, // 合计行月份为0
    campus: '', // 合计行不显示神殿
    targetReputationVolume: totalTargetReputationVolume,
    actualReputationVolume: totalActualReputationVolume,
    targetWalkInVolume: totalTargetWalkInVolume,
    actualWalkInVolume: totalActualWalkInVolume,
    targetEnrollmentCount: totalTargetEnrollmentCount,
    actualEnrollmentCount: totalActualEnrollmentCount,
    targetRevenue: totalTargetRevenue,
    actualRevenue: totalActualRevenue,
    rowType: 'total',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  })

  return records
}

export const reputationEnrollmentService = {
  /**
   * 获取口碑招生汇总数据
   * @param campus 神殿名称
   * @returns Promise<ReputationEnrollmentRecord[]>
   */
  getReputationEnrollmentData: async (campus: string): Promise<ReputationEnrollmentRecord[]> => {
    // 模拟API延迟
    await new Promise((resolve) => setTimeout(resolve, 500))

    if (!campus) {
      throw new Error('神殿名称不能为空')
    }

    return generateReputationEnrollmentData(campus)
  },

  /**
   * 获取口碑招生汇总统计数据
   * @param campus 神殿名称
   * @returns Promise<ReputationEnrollmentStats>
   */
  getReputationEnrollmentStats: async (campus: string): Promise<ReputationEnrollmentStats> => {
    const data = await reputationEnrollmentService.getReputationEnrollmentData(campus)

    const dataRows = data.filter((r) => r.rowType === 'data')

    const totalTargetReputationVolume = dataRows.reduce(
      (sum, r) => sum + r.targetReputationVolume,
      0,
    )
    const totalActualReputationVolume = dataRows.reduce(
      (sum, r) => sum + r.actualReputationVolume,
      0,
    )
    const totalTargetWalkInVolume = dataRows.reduce((sum, r) => sum + r.targetWalkInVolume, 0)
    const totalActualWalkInVolume = dataRows.reduce((sum, r) => sum + r.actualWalkInVolume, 0)
    const totalTargetEnrollmentCount = dataRows.reduce((sum, r) => sum + r.targetEnrollmentCount, 0)
    const totalActualEnrollmentCount = dataRows.reduce((sum, r) => sum + r.actualEnrollmentCount, 0)
    const totalTargetRevenue = dataRows.reduce((sum, r) => sum + r.targetRevenue, 0)
    const totalActualRevenue = dataRows.reduce((sum, r) => sum + r.actualRevenue, 0)

    const reputationAchievementRate =
      totalTargetReputationVolume > 0
        ? Math.floor((totalActualReputationVolume / totalTargetReputationVolume) * 100)
        : 0
    const walkInAchievementRate =
      totalTargetWalkInVolume > 0
        ? Math.floor((totalActualWalkInVolume / totalTargetWalkInVolume) * 100)
        : 0
    const enrollmentAchievementRate =
      totalTargetEnrollmentCount > 0
        ? Math.floor((totalActualEnrollmentCount / totalTargetEnrollmentCount) * 100)
        : 0
    const revenueAchievementRate =
      totalTargetRevenue > 0 ? Math.floor((totalActualRevenue / totalTargetRevenue) * 100) : 0

    return {
      totalTargetReputationVolume,
      totalActualReputationVolume,
      totalTargetWalkInVolume,
      totalActualWalkInVolume,
      totalTargetEnrollmentCount,
      totalActualEnrollmentCount,
      totalTargetRevenue,
      totalActualRevenue,
      reputationAchievementRate,
      walkInAchievementRate,
      enrollmentAchievementRate,
      revenueAchievementRate,
    }
  },

  /**
   * 导出口碑招生汇总数据
   * @param campus 神殿名称
   * @returns Promise<Blob>
   */
  exportReputationEnrollmentData: async (campus: string): Promise<Blob> => {
    const data = await reputationEnrollmentService.getReputationEnrollmentData(campus)

    const csvContent = [
      '月份,神殿,目标口碑量,实际口碑量,目标上门量,实际上门量,目标招生人数,实际招生人数,目标收入,实际收入',
      ...data.map(
        (item) =>
          `${item.month === 0 ? '合计' : item.month},${item.campus},${item.targetReputationVolume},${item.actualReputationVolume},${item.targetWalkInVolume},${item.actualWalkInVolume},${item.targetEnrollmentCount},${item.actualEnrollmentCount},${item.targetRevenue},${item.actualRevenue}`,
      ),
    ].join('\n')

    return new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  },
}
