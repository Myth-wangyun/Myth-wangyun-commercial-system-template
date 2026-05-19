/**
 * 神殿教化司新生当月维稳统计表数据服务（真实数据版）
 * 数据来源：/api/v1/teaching-quality/campus-monthly-new-stu-stability-summary
 */

import type {
  CampusNewStudentStabilityRecord,
  CampusNewStudentStabilityRequest,
  CampusNewStudentStabilitySummary,
} from '../../types/campus-new-student-stability'
import { apiService } from '../api'

const normalizeCampus = (s: string) => s.replace(/神殿$/, '').trim()
const thisYear = () => new Date().getFullYear()
const num = (v: any) => (Number.isFinite(Number(v)) ? Number(v) : 0)

// 汇总统计（基于数据库数据）
const calculateSummary = (
  data: CampusNewStudentStabilityRecord[],
): CampusNewStudentStabilitySummary => {
  const rows = data.filter((d) => d.month > 0)
  if (rows.length === 0) {
    return {
      totalHandoverCount: 0,
      totalReportedCount: 0,
      totalStableClassHoursCount: 0,
      totalUnstableClassHoursCount: 0,
      totalFullRefundCount: 0,
      totalStillOwingCount: 0,
      totalOwingAmount: 0,
      totalRefundCount: 0,
      averageRefundRate: 0,
      stabilityRate: 0,
      paymentCompletionRate: 0,
      averageMonthlyHandover: 0,
      averageMonthlyReported: 0,
      completedRecords: 0,
      totalRecords: 0,
    }
  }

  const totalHandoverCount = rows.reduce((s, r) => s + (r.handoverCount || 0), 0)
  const totalReportedCount = rows.reduce((s, r) => s + (r.reportedCount || 0), 0)
  const totalStableClassHoursCount = rows.reduce((s, r) => s + (r.stableClassHoursCount || 0), 0)
  const totalUnstableClassHoursCount = rows.reduce((s, r) => s + (r.unstableClassHoursCount || 0), 0)
  const totalFullRefundCount = rows.reduce((s, r) => s + (r.fullRefundCount || 0), 0)
  const totalStillOwingCount = rows.reduce((s, r) => s + (r.stillOwingCount || 0), 0)
  const totalOwingAmount = rows.reduce((s, r) => s + (r.totalOwingAmount || 0), 0)
  const totalRefundCount = rows.reduce((s, r) => s + (r.refundCount || 0), 0)

  const averageRefundRate = totalReportedCount > 0 ? (totalRefundCount / totalReportedCount) * 100 : 0
  const stabilityRate = totalReportedCount > 0 ? (totalStableClassHoursCount / totalReportedCount) * 100 : 0
  const paymentCompletionRate = totalReportedCount > 0 ? (totalFullRefundCount / totalReportedCount) * 100 : 0
  const averageMonthlyHandover = totalHandoverCount / rows.length
  const averageMonthlyReported = totalReportedCount / rows.length

  return {
    totalHandoverCount,
    totalReportedCount,
    totalStableClassHoursCount,
    totalUnstableClassHoursCount,
    totalFullRefundCount,
    totalStillOwingCount,
    totalOwingAmount,
    totalRefundCount,
    averageRefundRate,
    stabilityRate,
    paymentCompletionRate,
    averageMonthlyHandover,
    averageMonthlyReported,
    completedRecords: rows.filter((r) => (r.handoverCount || 0) > 0).length,
    totalRecords: rows.length,
  }
}

export const campusNewStudentStabilityService = {
  /** 从数据库读取（默认当前年） */
  async getCampusNewStudentStabilityData(
    campus: string,
    year?: number,
  ): Promise<CampusNewStudentStabilityRecord[]> {
    if (!campus) throw new Error('神殿名称不能为空')
    const y = year ?? thisYear()

    const res = await apiService.get<any>(
      '/teaching-quality/campus-monthly-new-stu-stability-summary',
      { params: { campus: normalizeCampus(campus), year: y } },
    )
    const raw = (res as any)?.data ?? res
    const list: any[] = Array.isArray(raw?.行列表) ? raw.行列表 : Array.isArray(raw) ? raw : []

    const rows: CampusNewStudentStabilityRecord[] = list.map((r: any, idx: number) => {
      const reported = num(r.reportedCount ?? r.报到人数)
      const refund = num(r.refundCount ?? r.退费人数)
      const refundRate = reported > 0 ? (refund / reported) * 100 : 0
      return {
        key: `${campus}-${idx + 1}`,
        month: num(r.month ?? r.月份 ?? idx + 1) || idx + 1,
        campus: idx === 0 ? normalizeCampus(campus) : '',
        handoverCount: num(r.transferCount ?? r.交接人数),
        reportedCount: reported,
        stableClassHoursCount: num(r.stableCount ?? r.稳定过课时人数),
        unstableClassHoursCount: num(r.unstableCount ?? r.未过课时人数),
        fullRefundCount: num(r.fullRefundCount ?? r.回全款人数),
        stillOwingCount: num(r.arrearsCount ?? r.仍欠费人数),
        totalOwingAmount: num(r.arrearsAmount ?? r.欠费总金额),
        refundCount: refund,
        refundRate,
        refundSituationDescription: String(r.refundNote ?? r.退费情况说明 ?? ''),
      }
    })

    // 合计行
    const total: CampusNewStudentStabilityRecord = {
      key: `${campus}-${y}-total`,
      month: 0,
      campus: '',
      handoverCount: rows.reduce((s, r) => s + (r.handoverCount || 0), 0),
      reportedCount: rows.reduce((s, r) => s + (r.reportedCount || 0), 0),
      stableClassHoursCount: rows.reduce((s, r) => s + (r.stableClassHoursCount || 0), 0),
      unstableClassHoursCount: rows.reduce((s, r) => s + (r.unstableClassHoursCount || 0), 0),
      fullRefundCount: rows.reduce((s, r) => s + (r.fullRefundCount || 0), 0),
      stillOwingCount: rows.reduce((s, r) => s + (r.stillOwingCount || 0), 0),
      totalOwingAmount: rows.reduce((s, r) => s + (r.totalOwingAmount || 0), 0),
      refundCount: rows.reduce((s, r) => s + (r.refundCount || 0), 0),
      refundRate: 0,
      refundSituationDescription: '',
    }

    return [...rows, total]
  },

  /** 汇总统计（数据库数据） */
  async getCampusNewStudentStabilitySummary(
    campus: string,
    year?: number,
  ): Promise<CampusNewStudentStabilitySummary> {
    const data = await this.getCampusNewStudentStabilityData(campus, year)
    return calculateSummary(data)
  },

  /** 以下写入接口暂不提供，避免与源数据冲突 */
  async updateCampusNewStudentStabilityData(
    _request: CampusNewStudentStabilityRequest & { data: Partial<CampusNewStudentStabilityRecord> },
  ): Promise<CampusNewStudentStabilityRecord> {
    throw new Error('请在新生维稳业务页面维护数据，汇总表不支持直接编辑')
  },

  async addCampusNewStudentStabilityData(
    _request: CampusNewStudentStabilityRequest & { data: Partial<CampusNewStudentStabilityRecord> },
  ): Promise<CampusNewStudentStabilityRecord> {
    throw new Error('请在新生维稳业务页面维护数据，汇总表不支持新增')
  },

  async exportCampusNewStudentStabilityData(campus: string, year?: number): Promise<Blob> {
    const y = year ?? thisYear()
    const data = await this.getCampusNewStudentStabilityData(campus, y)

    const csvContent = [
      '月份,神殿,交接人数,报道人数,稳定过课时人数,未过课时人数,回全款人数,仍欠费人数,欠费总金额,退费人数,新生退费率,退费学员情况说明',
      ...data.map(
        (item) =>
          `${item.month === 0 ? '合计' : item.month},${item.campus},${item.handoverCount},${item.reportedCount},${item.stableClassHoursCount},${item.unstableClassHoursCount},${item.fullRefundCount},${item.stillOwingCount},${item.totalOwingAmount},${item.refundCount},${(item.refundRate || 0).toFixed(2)}%,${item.refundSituationDescription}`,
      ),
    ].join('\n')

    return new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  },
}
