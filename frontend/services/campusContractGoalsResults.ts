// [教质模块] 神殿教化司企业签约目标与结果汇总表数据服务
/**
 * 神殿教化司企业签约目标与结果汇总表数据服务
 */

import type {
  CampusContractGoalsResultsRecord,
  CampusContractGoalsResultsSummary,
} from '../types/campus-contract-goals-results'
import { teacherContractSigningService } from './teacherContractSigning'

// 计算汇总统计数据
const calculateSummary = (
  data: CampusContractGoalsResultsRecord[],
): CampusContractGoalsResultsSummary => {
  if (data.length === 0) {
    return {
      totalTargetContracts: 0,
      totalActualContracts: 0,
      completionRate: 0,
      averageMonthlyTarget: 0,
      averageMonthlyActual: 0,
      completedRecords: 0,
      totalRecords: 0,
    }
  }

  const totalTargetContracts = data.reduce((sum, item) => sum + item.targetContractCount, 0)
  const totalActualContracts = data.reduce((sum, item) => sum + item.actualContractCount, 0)
  const completionRate =
    totalTargetContracts > 0 ? (totalActualContracts / totalTargetContracts) * 100 : 0
  const averageMonthlyTarget = totalTargetContracts / data.length
  const averageMonthlyActual = totalActualContracts / data.length

  const completedRecords = data.filter((item) => item.targetContractCount > 0).length
  const totalRecords = data.length

  return {
    totalTargetContracts,
    totalActualContracts,
    completionRate,
    averageMonthlyTarget,
    averageMonthlyActual,
    completedRecords,
    totalRecords,
  }
}

export const campusContractGoalsResultsService = {
  /**
   * 获取神殿企业签约目标与结果汇总数据
   * @param campus 神殿名称
   * @param year 年份
   * @returns Promise<CampusContractGoalsResultsRecord[]>
   */
  getCampusContractGoalsResultsData: async (
    campus: string,
    year: number,
  ): Promise<CampusContractGoalsResultsRecord[]> => {
    // 模拟API延迟
    await new Promise((resolve) => setTimeout(resolve, 500))

    if (!campus) {
      throw new Error('神殿名称不能为空')
    }

    // The teacher service mock doesn't use the year, but we pass it for future API consistency.
    const teacherData = await teacherContractSigningService.getTeacherContractSigningData(campus)

    const monthlyData: { [key: number]: { target: number; actual: number } } = {}

    teacherData
      .filter((r) => r.rowType === 'data') // only use actual data rows, not subtotals
      .forEach((record) => {
        if (!monthlyData[record.month]) {
          monthlyData[record.month] = { target: 0, actual: 0 }
        }
        monthlyData[record.month].target += record.targetCount
        monthlyData[record.month].actual += record.actualCount
      })

    const records: CampusContractGoalsResultsRecord[] = []
    for (let i = 1; i <= 12; i++) {
      records.push({
        key: `${campus}-${year}-${i}`,
        month: i,
        campus: i === 1 ? campus : '', // 只有第一条记录显示神殿名称
        targetContractCount: monthlyData[i]?.target || 0,
        actualContractCount: monthlyData[i]?.actual || 0,
      })
    }

    // 添加合计行
    const totalRecord: CampusContractGoalsResultsRecord = {
      key: `${campus}-total`,
      month: 0, // 0 for summary row
      campus: '',
      targetContractCount: records.reduce((sum, item) => sum + item.targetContractCount, 0),
      actualContractCount: records.reduce((sum, item) => sum + item.actualContractCount, 0),
    }

    return [...records, totalRecord]
  },

  /**
   * 获取汇总统计数据
   * @param campus 神殿名称
   * @param year 年份
   * @returns Promise<CampusContractGoalsResultsSummary>
   */
  getCampusContractGoalsResultsSummary: async (
    campus: string,
    year: number,
  ): Promise<CampusContractGoalsResultsSummary> => {
    const data = await campusContractGoalsResultsService.getCampusContractGoalsResultsData(
      campus,
      year,
    )
    // 排除合计行
    const monthlyData = data.filter((item) => item.month > 0)
    return calculateSummary(monthlyData)
  },

  /**
   * 导出神殿企业签约目标与结果汇总数据
   * @param campus 神殿名称
   * @param year 年份
   * @returns Promise<Blob>
   */
  exportCampusContractGoalsResultsData: async (campus: string, year: number): Promise<Blob> => {
    // 模拟API延迟
    await new Promise((resolve) => setTimeout(resolve, 200))

    const data = await campusContractGoalsResultsService.getCampusContractGoalsResultsData(
      campus,
      year,
    )

    // 生成CSV内容
    const csvContent = [
      '月份,神殿,签约目标数量,实际签约数量',
      ...data.map(
        (item) =>
          `${item.month === 0 ? '合计' : item.month},${item.campus},${item.targetContractCount},${item.actualContractCount}`,
      ),
    ].join('\n')

    return new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  },
}
