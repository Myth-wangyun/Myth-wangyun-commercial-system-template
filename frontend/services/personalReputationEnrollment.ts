// [教质模块] 神殿教化司口碑招生个人目标与结果汇总表数据服务
/**
 * 神殿教化司口碑招生个人目标与结果汇总表数据服务
 */

import type {
  PersonalReputationEnrollmentRecord,
  PersonalReputationEnrollmentStats,
} from '../types/personal-reputation-enrollment'

const staffNames = ['马晴', '郭彩兰', '姜楠', '李晓平']

// 生成个人口碑招生数据
const generatePersonalReputationEnrollmentData = (): PersonalReputationEnrollmentRecord[] => {
  const records: PersonalReputationEnrollmentRecord[] = []

  // 生成每个员工的数据
  staffNames.forEach((name, index) => {
    records.push({
      key: `person-${index + 1}`,
      serialNumber: index + 1,
      name,
      targetReputationVolume: 0,
      actualReputationVolume: 0,
      targetWalkInVolume: 0,
      actualWalkInVolume: 0,
      targetEnrollmentCount: 0,
      actualEnrollmentCount: 0,
      targetRevenue: 0,
      actualRevenue: 0,
      rowType: 'data',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    })
  })

  // 添加合计行
  records.push({
    key: 'total',
    serialNumber: 0,
    name: '合计',
    targetReputationVolume: 0,
    actualReputationVolume: 0,
    targetWalkInVolume: 0,
    actualWalkInVolume: 0,
    targetEnrollmentCount: 0,
    actualEnrollmentCount: 0,
    targetRevenue: 0,
    actualRevenue: 0,
    rowType: 'total',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  })

  return records
}

export const personalReputationEnrollmentService = {
  /**
   * 获取个人口碑招生汇总数据
   * @returns Promise<PersonalReputationEnrollmentRecord[]>
   */
  getPersonalReputationEnrollmentData: async (): Promise<PersonalReputationEnrollmentRecord[]> => {
    // 模拟API延迟
    await new Promise((resolve) => setTimeout(resolve, 500))

    return generatePersonalReputationEnrollmentData()
  },

  /**
   * 更新个人口碑招生数据
   * @param key 记录key
   * @param data 更新数据
   * @returns Promise<PersonalReputationEnrollmentRecord>
   */
  updatePersonalReputationEnrollmentData: async (
    key: string,
    data: Partial<PersonalReputationEnrollmentRecord>,
  ): Promise<PersonalReputationEnrollmentRecord> => {
    // 模拟API延迟
    await new Promise((resolve) => setTimeout(resolve, 300))

    return {
      ...generatePersonalReputationEnrollmentData().find((r) => r.key === key)!,
      ...data,
      updatedAt: new Date().toISOString(),
    } as PersonalReputationEnrollmentRecord
  },

  /**
   * 获取个人口碑招生汇总统计数据
   * @returns Promise<PersonalReputationEnrollmentStats>
   */
  getPersonalReputationEnrollmentStats: async (): Promise<PersonalReputationEnrollmentStats> => {
    const data = await personalReputationEnrollmentService.getPersonalReputationEnrollmentData()

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

    return {
      totalPeople: dataRows.length,
      totalTargetReputationVolume,
      totalActualReputationVolume,
      totalTargetWalkInVolume,
      totalActualWalkInVolume,
      totalTargetEnrollmentCount,
      totalActualEnrollmentCount,
      totalTargetRevenue,
      totalActualRevenue,
    }
  },

  /**
   * 导出口碑招生个人数据
   * @returns Promise<Blob>
   */
  exportPersonalReputationEnrollmentData: async (): Promise<Blob> => {
    const data = await personalReputationEnrollmentService.getPersonalReputationEnrollmentData()

    const csvContent = [
      '序号,姓名,目标口碑量,实际口碑量,目标上门量,实际上门量,目标人数,实际人数,目标收入,实际收入',
      ...data.map(
        (item) =>
          `${item.serialNumber === 0 ? '合计' : item.serialNumber},${item.name},${item.targetReputationVolume},${item.actualReputationVolume},${item.targetWalkInVolume},${item.actualWalkInVolume},${item.targetEnrollmentCount},${item.actualEnrollmentCount},${item.targetRevenue},${item.actualRevenue}`,
      ),
    ].join('\n')

    return new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  },
}
