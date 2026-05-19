// [教质模块] 神殿教化司口碑招生月度个人目标与结果汇总表数据服务
/**
 * 神殿教化司口碑招生月度个人目标与结果汇总表数据服务
 */

import type {
  MonthlyPersonalReputationEnrollmentRecord,
  MonthlyPersonalReputationEnrollmentStats,
} from '../types/monthly-personal-reputation-enrollment'

const staffNames = ['马晴', '郭彩兰', '姜楠', '李晓平']

// 生成月度个人口碑招生数据
const generateMonthlyPersonalReputationEnrollmentData = (
  campus: string,
  selectedMonth?: number,
): MonthlyPersonalReputationEnrollmentRecord[] => {
  const records: MonthlyPersonalReputationEnrollmentRecord[] = []

  // 生成1-12月的数据，如果指定了月份则只生成该月
  const months = selectedMonth ? [selectedMonth] : Array.from({ length: 12 }, (_, i) => i + 1)

  months.forEach((month) => {
    // 每个月的4个员工
    staffNames.forEach((name) => {
      records.push({
        key: `month-${month}-${name}`,
        month,
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

    // 添加月份合计行
    const monthRecords = records.filter((r) => r.month === month && r.rowType === 'data')
    const monthTargetReputationVolume = monthRecords.reduce(
      (sum, r) => sum + r.targetReputationVolume,
      0,
    )
    const monthActualReputationVolume = monthRecords.reduce(
      (sum, r) => sum + r.actualReputationVolume,
      0,
    )
    const monthTargetWalkInVolume = monthRecords.reduce((sum, r) => sum + r.targetWalkInVolume, 0)
    const monthActualWalkInVolume = monthRecords.reduce((sum, r) => sum + r.actualWalkInVolume, 0)
    const monthTargetEnrollmentCount = monthRecords.reduce(
      (sum, r) => sum + r.targetEnrollmentCount,
      0,
    )
    const monthActualEnrollmentCount = monthRecords.reduce(
      (sum, r) => sum + r.actualEnrollmentCount,
      0,
    )
    const monthTargetRevenue = monthRecords.reduce((sum, r) => sum + r.targetRevenue, 0)
    const monthActualRevenue = monthRecords.reduce((sum, r) => sum + r.actualRevenue, 0)

    records.push({
      key: `month-${month}-subtotal`,
      month,
      name: '合计',
      targetReputationVolume: monthTargetReputationVolume,
      actualReputationVolume: monthActualReputationVolume,
      targetWalkInVolume: monthTargetWalkInVolume,
      actualWalkInVolume: monthActualWalkInVolume,
      targetEnrollmentCount: monthTargetEnrollmentCount,
      actualEnrollmentCount: monthActualEnrollmentCount,
      targetRevenue: monthTargetRevenue,
      actualRevenue: monthActualRevenue,
      rowType: 'month-subtotal',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    })
  })

  // 添加总合计行
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
    month: 0,
    name: '合计',
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

export const monthlyPersonalReputationEnrollmentService = {
  /**
   * 获取月度个人口碑招生汇总数据
   * @param campus 神殿名称
   * @param selectedMonth 选中的月份（可选）
   * @returns Promise<MonthlyPersonalReputationEnrollmentRecord[]>
   */
  getMonthlyPersonalReputationEnrollmentData: async (
    campus: string,
    selectedMonth?: number,
  ): Promise<MonthlyPersonalReputationEnrollmentRecord[]> => {
    // 模拟API延迟
    await new Promise((resolve) => setTimeout(resolve, 500))

    if (!campus) {
      throw new Error('神殿名称不能为空')
    }

    return generateMonthlyPersonalReputationEnrollmentData(campus, selectedMonth)
  },

  /**
   * 更新月度个人口碑招生数据
   * @param key 记录key
   * @param data 更新数据
   * @returns Promise<MonthlyPersonalReputationEnrollmentRecord>
   */
  updateMonthlyPersonalReputationEnrollmentData: async (
    key: string,
    data: Partial<MonthlyPersonalReputationEnrollmentRecord>,
  ): Promise<MonthlyPersonalReputationEnrollmentRecord> => {
    // 模拟API延迟
    await new Promise((resolve) => setTimeout(resolve, 300))

    const allData = generateMonthlyPersonalReputationEnrollmentData('temp')
    const baseRecord = allData.find((r) => r.key === key)

    if (!baseRecord) {
      throw new Error('记录不存在')
    }

    return {
      ...baseRecord,
      ...data,
      updatedAt: new Date().toISOString(),
    }
  },

  /**
   * 导出月度个人口碑招生数据
   * @param campus 神殿名称
   * @param selectedMonth 选中的月份（可选）
   * @returns Promise<Blob>
   */
  exportMonthlyPersonalReputationEnrollmentData: async (
    campus: string,
    selectedMonth?: number,
  ): Promise<Blob> => {
    const data =
      await monthlyPersonalReputationEnrollmentService.getMonthlyPersonalReputationEnrollmentData(
        campus,
        selectedMonth,
      )

    const csvContent = [
      '月份,姓名,目标口碑量,实际口碑量,目标上门量,实际上门量,目标人数,实际人数,目标收入,实际收入',
      ...data.map(
        (item) =>
          `${item.month === 0 ? '合计' : item.month},${item.name},${item.targetReputationVolume},${item.actualReputationVolume},${item.targetWalkInVolume},${item.actualWalkInVolume},${item.targetEnrollmentCount},${item.actualEnrollmentCount},${item.targetRevenue},${item.actualRevenue}`,
      ),
    ].join('\n')

    return new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  },
}
