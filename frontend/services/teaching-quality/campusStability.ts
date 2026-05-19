/**
 * 神殿教化司新生当月维稳统计表数据服务（真实数据版）
 * 数据来源：教学质量模块接口 /teaching-quality/campus-monthly-new-stu-stability-summary
 */

import type {
  CampusStabilityRecord,
  CampusStabilityRequest,
  CampusStabilitySummary,
} from '../../types/campus-stability'
import { apiService } from '../api'

const normalizeCampus = (s: string) => s.replace(/神殿$/, '').trim()
const thisYear = () => new Date().getFullYear()
const num = (v: any) => (Number.isFinite(Number(v)) ? Number(v) : 0)

function mapRow(campus: string, r: any, idx: number): CampusStabilityRecord {
  const month = num(r.month ?? r.月份 ?? idx + 1) || idx + 1
  return {
    key: `${campus}-${month}`,
    month,
    campus: month === 1 ? campus : '',
    handoverCount: num(r.transferCount ?? r.交接人数),
    reportedCount: num(r.reportedCount ?? r.报到人数),
    stableCourseCount: num(r.stableCount ?? r.稳定过课时人数),
    unstableCourseCount: num(r.unstableCount ?? r.未过课时人数),
    fullRefundCount: num(r.fullRefundCount ?? r.回全款人数),
    outstandingFeeCount: num(r.arrearsCount ?? r.仍欠费人数),
    outstandingFeeAmount: num(r.arrearsAmount ?? r.欠费总金额),
    refundCount: num(r.refundCount ?? r.退费人数),
    refundRate: 0, // 前端按列渲染时动态计算显示
    refundSituationDescription: String(r.refundNote ?? r.退费情况说明 ?? ''),
  }
}

function calcSummary(rows: CampusStabilityRecord[]): CampusStabilitySummary {
  const monthly = rows.filter((r) => r.month > 0)
  if (monthly.length === 0) {
    return {
      totalHandoverCount: 0,
      totalReportedCount: 0,
      totalStableCourseCount: 0,
      totalUnstableCourseCount: 0,
      totalFullRefundCount: 0,
      totalOutstandingFeeCount: 0,
      totalOutstandingFeeAmount: 0,
      totalRefundCount: 0,
      averageRefundRate: 0,
      stabilityRate: 0,
      completedMonths: 0,
      totalMonths: 0,
    }
  }

  const totalHandoverCount = monthly.reduce((s, r) => s + (r.handoverCount || 0), 0)
  const totalReportedCount = monthly.reduce((s, r) => s + (r.reportedCount || 0), 0)
  const totalStableCourseCount = monthly.reduce((s, r) => s + (r.stableCourseCount || 0), 0)
  const totalUnstableCourseCount = monthly.reduce((s, r) => s + (r.unstableCourseCount || 0), 0)
  const totalFullRefundCount = monthly.reduce((s, r) => s + (r.fullRefundCount || 0), 0)
  const totalOutstandingFeeCount = monthly.reduce((s, r) => s + (r.outstandingFeeCount || 0), 0)
  const totalOutstandingFeeAmount = monthly.reduce((s, r) => s + (r.outstandingFeeAmount || 0), 0)
  const totalRefundCount = monthly.reduce((s, r) => s + (r.refundCount || 0), 0)

  const averageRefundRate = totalReportedCount > 0 ? (totalRefundCount / totalReportedCount) * 100 : 0
  const stabilityRate = totalReportedCount > 0 ? (totalStableCourseCount / totalReportedCount) * 100 : 0

  return {
    totalHandoverCount,
    totalReportedCount,
    totalStableCourseCount,
    totalUnstableCourseCount,
    totalFullRefundCount,
    totalOutstandingFeeCount,
    totalOutstandingFeeAmount,
    totalRefundCount,
    averageRefundRate,
    stabilityRate,
    completedMonths: monthly.filter((r) => (r.reportedCount || 0) > 0).length,
    totalMonths: monthly.length,
  }
}

export const campusStabilityService = {
  /** 从数据库读取（默认当前年） */
  async getCampusStabilityData(campus: string, year?: number): Promise<CampusStabilityRecord[]> {
    if (!campus) throw new Error('神殿名称不能为空')
    const y = year ?? thisYear()
    const res = await apiService.get<any>('/teaching-quality/campus-monthly-new-stu-stability-summary', {
      params: { campus: normalizeCampus(campus), year: y },
    })
    const raw = (res as any)?.data ?? res
    const list: any[] = Array.isArray(raw?.行列表) ? raw.行列表 : Array.isArray(raw) ? raw : []
    const rows = list.map((r, idx) => mapRow(normalizeCampus(campus), r, idx))

    // 追加合计行（表格有时需要）
    const total: CampusStabilityRecord = {
      key: `${campus}-${y}-total`,
      month: 0,
      campus: '',
      handoverCount: rows.reduce((s, r) => s + (r.handoverCount || 0), 0),
      reportedCount: rows.reduce((s, r) => s + (r.reportedCount || 0), 0),
      stableCourseCount: rows.reduce((s, r) => s + (r.stableCourseCount || 0), 0),
      unstableCourseCount: rows.reduce((s, r) => s + (r.unstableCourseCount || 0), 0),
      fullRefundCount: rows.reduce((s, r) => s + (r.fullRefundCount || 0), 0),
      outstandingFeeCount: rows.reduce((s, r) => s + (r.outstandingFeeCount || 0), 0),
      outstandingFeeAmount: rows.reduce((s, r) => s + (r.outstandingFeeAmount || 0), 0),
      refundCount: rows.reduce((s, r) => s + (r.refundCount || 0), 0),
      refundRate: 0,
      refundSituationDescription: '',
    }

    return [...rows, total]
  },

  /** 汇总统计（数据库数据） */
  async getCampusStabilitySummary(campus: string, year?: number): Promise<CampusStabilitySummary> {
    const rows = await this.getCampusStabilityData(campus, year)
    return calcSummary(rows)
  },

  /** 更新/导出：汇总表不提供直编，导出走数据库 */
  async updateCampusStabilityData(
    _request: CampusStabilityRequest & { month: number; data: Partial<CampusStabilityRecord> },
  ): Promise<CampusStabilityRecord> {
    throw new Error('请在新生维稳业务页面维护数据，汇总表不支持直接编辑')
  },

  async exportCampusStabilityData(campus: string, year?: number): Promise<Blob> {
    const y = year ?? thisYear()
    const data = await this.getCampusStabilityData(campus, y)

    const csvContent = [
      '月份,神殿,交接人数,报到人数,稳定过课时人数,未过课时人数,回全款人数,仍欠费人数,欠费总金额,退费人数,新生退费率,退费学员情况说明',
      ...data.map((item) =>
        `${item.month === 0 ? '合计' : item.month},${item.campus},${item.handoverCount},${item.reportedCount},${item.stableCourseCount},${item.unstableCourseCount},${item.fullRefundCount},${item.outstandingFeeCount},${item.outstandingFeeAmount},${item.refundCount},${item.refundRate || 0}%,${item.refundSituationDescription}`,
      ),
    ].join('\n')

    return new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  },
}
