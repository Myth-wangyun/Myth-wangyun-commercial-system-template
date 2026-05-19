/**
 * 神殿教化司口碑招生目标与结果汇总表数据服务（真实数据版）
 * 数据来源：教学质量模块后端接口 /teaching-quality/campus-reputation-enrollment-goals-results
 */

import type {
  CampusReputationRecord,
  CampusReputationRequest,
  CampusReputationSummary,
} from '../../types/campus-reputation'
import { apiService } from '../api'

const normalizeCampus = (s: string) => s.replace(/神殿$/, '').trim()
const thisYear = () => new Date().getFullYear()

// 将后端行映射为前端行（接口返回英文字段）
// 兼容：若返回中文字段则做降级映射
function mapRow(campus: string, r: any, index: number): CampusReputationRecord {
  const month = Number(r.month ?? r.月份 ?? index + 1) || index + 1
  const targetReputation = Number(r.targetReputation ?? r.目标口碑量 ?? 0) || 0
  const actualReputation = Number(r.actualReputation ?? r.实际口碑量 ?? 0) || 0
  const targetWalkIn = Number(r.targetVisits ?? r.目标上门量 ?? 0) || 0
  const actualWalkIn = Number(r.actualVisits ?? r.实际上门量 ?? 0) || 0
  const targetEnroll = Number(r.targetStudents ?? r.目标招生人数 ?? 0) || 0
  const actualEnroll = Number(r.actualStudents ?? r.实际招生人数 ?? 0) || 0
  const targetRevenue = Number(r.targetRevenue ?? r.目标口碑收入 ?? 0) || 0
  const actualRevenue = Number(r.actualRevenue ?? r.实际口碑收入 ?? 0) || 0

  const reputationCompletionRate = targetReputation > 0 ? (actualReputation / targetReputation) * 100 : 0
  const walkInCompletionRate = targetWalkIn > 0 ? (actualWalkIn / targetWalkIn) * 100 : 0
  const enrollmentCompletionRate = targetEnroll > 0 ? (actualEnroll / targetEnroll) * 100 : 0
  const revenueCompletionRate = targetRevenue > 0 ? (actualRevenue / targetRevenue) * 100 : 0

  return {
    key: `${campus}-${month}`,
    month,
    campus: month === 1 ? campus : '',
    targetReputationCount: targetReputation,
    actualReputationCount: actualReputation,
    reputationCompletionRate,
    targetWalkInCount: targetWalkIn,
    actualWalkInCount: actualWalkIn,
    walkInCompletionRate,
    targetEnrollmentCount: targetEnroll,
    actualEnrollmentCount: actualEnroll,
    enrollmentCompletionRate,
    targetRevenue,
    actualRevenue,
    revenueCompletionRate,
  }
}

function calcSummary(rows: CampusReputationRecord[]): CampusReputationSummary {
  const monthly = rows.filter((r) => r.month > 0)
  if (monthly.length === 0) {
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

  const totalTargetReputation = monthly.reduce((s, r) => s + (r.targetReputationCount || 0), 0)
  const totalActualReputation = monthly.reduce((s, r) => s + (r.actualReputationCount || 0), 0)
  const totalTargetWalkIn = monthly.reduce((s, r) => s + (r.targetWalkInCount || 0), 0)
  const totalActualWalkIn = monthly.reduce((s, r) => s + (r.actualWalkInCount || 0), 0)
  const totalTargetEnrollment = monthly.reduce((s, r) => s + (r.targetEnrollmentCount || 0), 0)
  const totalActualEnrollment = monthly.reduce((s, r) => s + (r.actualEnrollmentCount || 0), 0)
  const totalTargetRevenue = monthly.reduce((s, r) => s + (r.targetRevenue || 0), 0)
  const totalActualRevenue = monthly.reduce((s, r) => s + (r.actualRevenue || 0), 0)

  const completedMonths = monthly.filter((r) => (r.targetReputationCount || 0) > 0).length
  const totalMonths = monthly.length

  const averageReputationRate = totalTargetReputation > 0 ? (totalActualReputation / totalTargetReputation) * 100 : 0
  const averageWalkInRate = totalTargetWalkIn > 0 ? (totalActualWalkIn / totalTargetWalkIn) * 100 : 0
  const averageEnrollmentRate = totalTargetEnrollment > 0 ? (totalActualEnrollment / totalTargetEnrollment) * 100 : 0
  const averageRevenueRate = totalTargetRevenue > 0 ? (totalActualRevenue / totalTargetRevenue) * 100 : 0

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
  /** 从数据库读取神殿口碑招生数据（默认当前年） */
  getCampusReputationData: async (campus: string, year?: number): Promise<CampusReputationRecord[]> => {
    if (!campus) throw new Error('神殿名称不能为空')
    const y = year ?? thisYear()

    // 统一使用教学质量接口（核心业务页同源）
    const res = await apiService.get<any>('/teaching-quality/campus-reputation-enrollment-goals-results', {
      params: { campus, year: y },
    })
    const raw = (res as any)?.data ?? res
    const list: any[] = Array.isArray(raw?.行列表) ? raw.行列表 : Array.isArray(raw) ? raw : []
    const rows = list.map((r, idx) => mapRow(normalizeCampus(campus), r, idx))

    // 合计行
    const total: CampusReputationRecord = {
      key: `${campus}-${y}-total`,
      month: 0,
      campus: '',
      targetReputationCount: rows.reduce((s, r) => s + (r.targetReputationCount || 0), 0),
      actualReputationCount: rows.reduce((s, r) => s + (r.actualReputationCount || 0), 0),
      reputationCompletionRate: 0,
      targetWalkInCount: rows.reduce((s, r) => s + (r.targetWalkInCount || 0), 0),
      actualWalkInCount: rows.reduce((s, r) => s + (r.actualWalkInCount || 0), 0),
      walkInCompletionRate: 0,
      targetEnrollmentCount: rows.reduce((s, r) => s + (r.targetEnrollmentCount || 0), 0),
      actualEnrollmentCount: rows.reduce((s, r) => s + (r.actualEnrollmentCount || 0), 0),
      enrollmentCompletionRate: 0,
      targetRevenue: rows.reduce((s, r) => s + (r.targetRevenue || 0), 0),
      actualRevenue: rows.reduce((s, r) => s + (r.actualRevenue || 0), 0),
      revenueCompletionRate: 0,
    }

    return [...rows, total]
  },

  /** 汇总统计（数据库数据） */
  getCampusReputationSummary: async (campus: string, year?: number): Promise<CampusReputationSummary> => {
    const rows = await campusReputationService.getCampusReputationData(campus, year)
    return calcSummary(rows)
  },

  /** 更新：当前汇总不提供直编，请在对应业务页面维护 */
  updateCampusReputationData: async (
    _request: CampusReputationRequest & { month: number; data: Partial<CampusReputationRecord> },
  ): Promise<CampusReputationRecord> => {
    throw new Error('请在口碑招生业务页面维护数据，汇总表不支持直接编辑')
  },

  /** 导出（基于数据库数据） */
  exportCampusReputationData: async (campus: string, year?: number): Promise<Blob> => {
    const y = year ?? thisYear()
    const data = await campusReputationService.getCampusReputationData(campus, y)

    const csvContent = [
      '月份,神殿,目标口碑量,实际口碑量,目标上门量,实际上门量,目标招生人数,实际招生人数,目标收入,实际收入',
      ...data.map((item) =>
        `${item.month === 0 ? '合计' : item.month},${item.campus},${item.targetReputationCount},${item.actualReputationCount},${item.targetWalkInCount},${item.actualWalkInCount},${item.targetEnrollmentCount},${item.actualEnrollmentCount},${item.targetRevenue},${item.actualRevenue}`,
      ),
    ].join('\n')

    return new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  },
}
