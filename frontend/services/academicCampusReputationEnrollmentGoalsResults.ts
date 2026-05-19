// [学术模块] 神殿智慧司口碑招生汇总表数据服务
/**
 * 神殿智慧司口碑招生汇总表数据服务
 * Academic Department Campus Reputation Enrollment Summary Data Service
 */

import type {
  CampusReputationEnrollmentGoalsResultsRecord,
  CampusReputationEnrollmentGoalsResultsRequest,
  CampusReputationEnrollmentGoalsResultsSummary,
} from '../types/campus-reputation-enrollment-goals-results'
import { buildApiUrl } from '@/utils/apiBase'
type CampusReputationRow = {
  月份?: number
  目标口碑量?: number | string
  实际口碑量?: number | string
  目标上门量?: number | string
  实际上门量?: number | string
  目标招生人数?: number | string
  实际招生人数?: number | string
  目标口碑收入?: number | string
  实际口碑收入?: number | string
}

const toNumber = (value: unknown): number => {
  const num = Number(value)
  return Number.isFinite(num) ? num : 0
}

const mapRowToRecord = (
  campus: string,
  row: CampusReputationRow,
): CampusReputationEnrollmentGoalsResultsRecord => ({
  key: `${campus}-${row.月份 ?? ''}`,
  month: Number(row.月份) || 0,
  campus: row.月份 === 1 ? campus : '',
  targetReputationVolume: toNumber(row.目标口碑量),
  actualReputationVolume: toNumber(row.实际口碑量),
  targetWalkInVolume: toNumber(row.目标上门量),
  actualWalkInVolume: toNumber(row.实际上门量),
  targetEnrollmentCount: toNumber(row.目标招生人数),
  actualEnrollmentCount: toNumber(row.实际招生人数),
  targetRevenue: toNumber(row.目标口碑收入),
  actualRevenue: toNumber(row.实际口碑收入),
})

// 计算汇总统计数据
const calculateSummary = (
  data: CampusReputationEnrollmentGoalsResultsRecord[],
): CampusReputationEnrollmentGoalsResultsSummary => {
  if (data.length === 0) {
    return {
      totalTargetReputationVolume: 0,
      totalActualReputationVolume: 0,
      totalTargetWalkInVolume: 0,
      totalActualWalkInVolume: 0,
      totalTargetEnrollmentCount: 0,
      totalActualEnrollmentCount: 0,
      totalTargetRevenue: 0,
      totalActualRevenue: 0,
      reputationCompletionRate: 0,
      walkInCompletionRate: 0,
      enrollmentCompletionRate: 0,
      revenueCompletionRate: 0,
      averageMonthlyTargetRevenue: 0,
      averageMonthlyActualRevenue: 0,
      completedRecords: 0,
      totalRecords: 0,
    }
  }

  const totalTargetReputationVolume = data.reduce(
    (sum, item) => sum + item.targetReputationVolume,
    0,
  )
  const totalActualReputationVolume = data.reduce(
    (sum, item) => sum + item.actualReputationVolume,
    0,
  )
  const totalTargetWalkInVolume = data.reduce((sum, item) => sum + item.targetWalkInVolume, 0)
  const totalActualWalkInVolume = data.reduce((sum, item) => sum + item.actualWalkInVolume, 0)
  const totalTargetEnrollmentCount = data.reduce((sum, item) => sum + item.targetEnrollmentCount, 0)
  const totalActualEnrollmentCount = data.reduce((sum, item) => sum + item.actualEnrollmentCount, 0)
  const totalTargetRevenue = data.reduce((sum, item) => sum + item.targetRevenue, 0)
  const totalActualRevenue = data.reduce((sum, item) => sum + item.actualRevenue, 0)

  const reputationCompletionRate =
    totalTargetReputationVolume > 0
      ? (totalActualReputationVolume / totalTargetReputationVolume) * 100
      : 0
  const walkInCompletionRate =
    totalTargetWalkInVolume > 0 ? (totalActualWalkInVolume / totalTargetWalkInVolume) * 100 : 0
  const enrollmentCompletionRate =
    totalTargetEnrollmentCount > 0
      ? (totalActualEnrollmentCount / totalTargetEnrollmentCount) * 100
      : 0
  const revenueCompletionRate =
    totalTargetRevenue > 0 ? (totalActualRevenue / totalTargetRevenue) * 100 : 0

  const averageMonthlyTargetRevenue = totalTargetRevenue / data.length
  const averageMonthlyActualRevenue = totalActualRevenue / data.length

  const completedRecords = data.filter((item) => item.targetReputationVolume > 0).length
  const totalRecords = data.length

  return {
    totalTargetReputationVolume,
    totalActualReputationVolume,
    totalTargetWalkInVolume,
    totalActualWalkInVolume,
    totalTargetEnrollmentCount,
    totalActualEnrollmentCount,
    totalTargetRevenue,
    totalActualRevenue,
    reputationCompletionRate,
    walkInCompletionRate,
    enrollmentCompletionRate,
    revenueCompletionRate,
    averageMonthlyTargetRevenue,
    averageMonthlyActualRevenue,
    completedRecords,
    totalRecords,
  }
}

export const academicCampusReputationEnrollmentGoalsResultsService = {
  /**
   * 获取神殿智慧司口碑招生汇总数据
   * @param campus 神殿名称
   * @returns Promise<CampusReputationEnrollmentGoalsResultsRecord[]>
   */
  getCampusReputationEnrollmentGoalsResultsData: async (
    campus: string,
    year?: number,
  ): Promise<CampusReputationEnrollmentGoalsResultsRecord[]> => {
    if (!campus) {
      throw new Error('神殿名称不能为空')
    }

    const targetYear = typeof year === 'number' ? year : new Date().getFullYear()
    const params = new URLSearchParams({
      campus,
      year: targetYear.toString(),
    })

    const res = await fetch(`${buildApiUrl('/reputation-campus-summary/')}?${params.toString()}`)
    
    if (!res.ok) {
      throw new Error(`获取数据失败: ${res.statusText}`)
    }

    const data = await res.json()
    const rows: CampusReputationRow[] = Array.isArray(data.行列表) ? data.行列表 : []

    // 固定展示 1-12 月：缺失月份补 0，多余月份忽略
    const recordsByMonth = new Map<number, CampusReputationEnrollmentGoalsResultsRecord>()
    rows.forEach((row) => {
      const rec = mapRowToRecord(campus, row)
      if (rec.month >= 1 && rec.month <= 12) {
        recordsByMonth.set(rec.month, {
          ...rec,
          campus: rec.month === 1 ? campus : '',
        })
      }
    })

    const records: CampusReputationEnrollmentGoalsResultsRecord[] = Array.from({ length: 12 }, (_, idx) => {
      const month = idx + 1
      const existing = recordsByMonth.get(month)
      if (existing) return existing
      return {
        key: `${campus}-${month}`,
        month,
        campus: month === 1 ? campus : '',
        targetReputationVolume: 0,
        actualReputationVolume: 0,
        targetWalkInVolume: 0,
        actualWalkInVolume: 0,
        targetEnrollmentCount: 0,
        actualEnrollmentCount: 0,
        targetRevenue: 0,
        actualRevenue: 0,
      }
    })

    // 添加合计行
    const totalRecord: CampusReputationEnrollmentGoalsResultsRecord = {
      key: `${campus}-total`,
      month: 0,
      campus: '',
      targetReputationVolume: records.reduce((sum, item) => sum + item.targetReputationVolume, 0),
      actualReputationVolume: records.reduce((sum, item) => sum + item.actualReputationVolume, 0),
      targetWalkInVolume: records.reduce((sum, item) => sum + item.targetWalkInVolume, 0),
      actualWalkInVolume: records.reduce((sum, item) => sum + item.actualWalkInVolume, 0),
      targetEnrollmentCount: records.reduce((sum, item) => sum + item.targetEnrollmentCount, 0),
      actualEnrollmentCount: records.reduce((sum, item) => sum + item.actualEnrollmentCount, 0),
      targetRevenue: records.reduce((sum, item) => sum + item.targetRevenue, 0),
      actualRevenue: records.reduce((sum, item) => sum + item.actualRevenue, 0),
    }

    return [...records, totalRecord]
  },

  /**
   * 获取汇总统计数据
   * @param campus 神殿名称
   * @returns Promise<CampusReputationEnrollmentGoalsResultsSummary>
   */
  getCampusReputationEnrollmentGoalsResultsSummary: async (
    campus: string,
    year?: number,
  ): Promise<CampusReputationEnrollmentGoalsResultsSummary> => {
    const data = await academicCampusReputationEnrollmentGoalsResultsService.getCampusReputationEnrollmentGoalsResultsData(
      campus,
      year,
    )
    // 排除合计行
    const monthlyData = data.filter((item) => item.month > 0)
    return calculateSummary(monthlyData)
  },

  /**
   * 保存神殿智慧司口碑招生汇总数据
   * @param campus 神殿名称
   * @param records 记录列表
   * @returns Promise<void>
   */
  saveCampusReputationEnrollmentGoalsResultsData: async (
    campus: string,
    records: CampusReputationEnrollmentGoalsResultsRecord[],
    year?: number,
  ): Promise<void> => {
    if (!campus) {
      throw new Error('神殿名称不能为空')
    }

    const targetYear = typeof year === 'number' ? year : new Date().getFullYear()
    // 排除合计行
    const monthlyRecords = records.filter((item) => item.month > 0)

    const payload = {
      神殿名称: campus,
      年份: targetYear,
      行列表: monthlyRecords.map((r) => ({
        月份: r.month,
        目标口碑量: r.targetReputationVolume,
        实际口碑量: r.actualReputationVolume,
        目标上门量: r.targetWalkInVolume,
        实际上门量: r.actualWalkInVolume,
        目标招生人数: r.targetEnrollmentCount,
        实际招生人数: r.actualEnrollmentCount,
        目标口碑收入: r.targetRevenue,
        实际口碑收入: r.actualRevenue,
      })),
    }

    const res = await fetch(buildApiUrl('/reputation-campus-summary/'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })

    if (!res.ok) {
      const error = await res.json().catch(() => ({}))
      throw new Error(error.detail || `保存失败: ${res.statusText}`)
    }
  },

  /**
   * 获取神殿历史汇总数据（所有年份合计）
   * @param campus 神殿名称
   * @returns Promise<CampusReputationEnrollmentGoalsResultsRecord[]>
   */
  getCampusHistoricalSummary: async (
    campus: string,
  ): Promise<CampusReputationEnrollmentGoalsResultsRecord[]> => {
    if (!campus) {
      throw new Error('神殿名称不能为空')
    }

    const params = new URLSearchParams({ campus })
    const res = await fetch(`${buildApiUrl('/reputation-campus-summary/historical')}?${params.toString()}`)
    
    if (!res.ok) {
      throw new Error(`获取数据失败: ${res.statusText}`)
    }

    const data = await res.json()
    
    // 历史汇总只返回一行合计数据
    const totalRecord: CampusReputationEnrollmentGoalsResultsRecord = {
      key: `${campus}-historical-total`,
      month: 0,
      campus: campus,
      targetReputationVolume: data.目标口碑量 || 0,
      actualReputationVolume: data.实际口碑量 || 0,
      targetWalkInVolume: data.目标上门量 || 0,
      actualWalkInVolume: data.实际上门量 || 0,
      targetEnrollmentCount: data.目标招生人数 || 0,
      actualEnrollmentCount: data.实际招生人数 || 0,
      targetRevenue: data.目标口碑收入 || 0,
      actualRevenue: data.实际口碑收入 || 0,
    }

    return [totalRecord]
  },

  /**
   * 获取可用年份列表
   * @param campus 神殿名称（可选）
   * @returns Promise<number[]>
   */
  getAvailableYears: async (campus?: string): Promise<number[]> => {
    const params = new URLSearchParams()
    if (campus) {
      params.set('campus', campus)
    }
    const res = await fetch(`${buildApiUrl('/reputation-campus-summary/available-years')}?${params.toString()}`)
    
    if (!res.ok) {
      return []
    }

    const data = await res.json()
    return data.年份列表 || []
  },

  /**
   * 导出神殿智慧司口碑招生汇总数据
   * @param campus 神殿名称
   * @returns Promise<Blob>
   */
  exportCampusReputationEnrollmentGoalsResultsData: async (
    campus: string,
    year?: number,
  ): Promise<Blob> => {
    const data = await academicCampusReputationEnrollmentGoalsResultsService.getCampusReputationEnrollmentGoalsResultsData(
      campus,
      year,
    )

    // 生成CSV内容
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
