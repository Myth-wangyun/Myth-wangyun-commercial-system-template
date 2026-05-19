// [教质模块] 神殿教化司个人企业签约目标与结果汇总表数据服务
/**
 * 神殿教化司个人企业签约目标与结果汇总表数据服务
 */

import type {
  PersonalContractSigningRecord,
  PersonalContractSigningStats,
} from '../types/personal-contract-signing'

// 教员姓名列表
const teacherNames = ['马晴', '郭彩兰', '姜楠', '李晓平']

// 生成个人签约汇总数据
const generatePersonalContractSigningData = (): PersonalContractSigningRecord[] => {
  const records: PersonalContractSigningRecord[] = []

  // 生成每个教员的数据
  teacherNames.forEach((name, index) => {
    const targetCount = name === '马晴' ? 12 : 0 // 只有马晴有数据
    const actualCount = name === '马晴' ? 12 : 0

    records.push({
      key: `person-${index + 1}`,
      serialNumber: index + 1,
      name,
      targetCount,
      actualCount,
      rowType: 'data',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    })
  })

  // 添加合计行
  const totalTargetCount = records.reduce((sum, r) => sum + r.targetCount, 0)
  const totalActualCount = records.reduce((sum, r) => sum + r.actualCount, 0)

  records.push({
    key: 'total',
    serialNumber: 0, // 合计行序号为0
    name: '合计',
    targetCount: totalTargetCount,
    actualCount: totalActualCount,
    rowType: 'total',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  })

  return records
}

export const personalContractSigningService = {
  /**
   * 获取个人签约汇总数据
   * @param personName 个人姓名（筛选条件）
   * @returns Promise<PersonalContractSigningRecord[]>
   */
  getPersonalContractSigningData: async (
    personName?: string,
  ): Promise<PersonalContractSigningRecord[]> => {
    // 模拟API延迟
    await new Promise((resolve) => setTimeout(resolve, 500))

    let data = generatePersonalContractSigningData()

    // 如果指定了个人姓名，进行筛选
    if (personName && personName !== 'all') {
      data = data.filter((r) => r.rowType === 'total' || r.name === personName)
    }

    return data
  },

  /**
   * 获取个人签约汇总统计数据
   * @param personName 个人姓名（筛选条件）
   * @returns Promise<PersonalContractSigningStats>
   */
  getPersonalContractSigningStats: async (
    personName?: string,
  ): Promise<PersonalContractSigningStats> => {
    const data = await personalContractSigningService.getPersonalContractSigningData(personName)

    const dataRows = data.filter((r) => r.rowType === 'data')
    const totalRow = data.find((r) => r.rowType === 'total')

    const totalTargetCount = totalRow?.targetCount || 0
    const totalActualCount = totalRow?.actualCount || 0
    const achievementRate =
      totalTargetCount > 0 ? Math.floor((totalActualCount / totalTargetCount) * 100) : 0
    const averagePerPerson =
      dataRows.length > 0 ? Math.floor(totalActualCount / dataRows.length) : 0

    return {
      totalPeople: dataRows.length,
      totalTargetCount,
      totalActualCount,
      achievementRate,
      averagePerPerson,
    }
  },

  /**
   * 更新个人签约数据
   * @param name 姓名
   * @param targetCount 目标数量
   * @param actualCount 实际数量
   * @returns Promise<PersonalContractSigningRecord>
   */
  updatePersonalContractSigningData: async (
    name: string,
    targetCount: number,
    actualCount: number,
  ): Promise<PersonalContractSigningRecord> => {
    // 模拟API延迟
    await new Promise((resolve) => setTimeout(resolve, 300))

    const existingData = generatePersonalContractSigningData()
    const existingRecord = existingData.find((r) => r.name === name && r.rowType === 'data')

    return {
      key: existingRecord?.key || `person-${name}`,
      serialNumber: existingRecord?.serialNumber || 1,
      name,
      targetCount,
      actualCount,
      rowType: 'data',
      createdAt: existingRecord?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
  },

  /**
   * 获取所有可选的个人姓名列表
   * @returns Promise<string[]>
   */
  getAvailablePersonNames: async (): Promise<string[]> => {
    await new Promise((resolve) => setTimeout(resolve, 100))
    return teacherNames
  },

  /**
   * 导出个人签约汇总数据
   * @param personName 个人姓名（筛选条件）
   * @returns Promise<Blob>
   */
  exportPersonalContractSigningData: async (personName?: string): Promise<Blob> => {
    const data = await personalContractSigningService.getPersonalContractSigningData(personName)

    const csvContent = [
      '序号,姓名,签约目标数量,实际签约数量',
      ...data.map(
        (item) =>
          `${item.serialNumber === 0 ? '合计' : item.serialNumber},${item.name},${item.targetCount},${item.actualCount}`,
      ),
    ].join('\n')

    return new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  },
}
