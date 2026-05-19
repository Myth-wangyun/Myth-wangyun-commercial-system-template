/**
 * 神殿教化司学员异动表数据服务（真实数据版）
 * 数据来源：/api/v1/teaching-quality/campus-stu-movement-summary
 */

import type {
  CampusFluctuationRecord,
  CampusFluctuationRequest,
  CampusFluctuationSummary,
} from '../../types/campus-fluctuation'
import { apiService } from '../api'

const normalizeCampus = (s: string) => s.replace(/神殿$/, '').trim()
const thisYear = () => new Date().getFullYear()
const num = (v: any) => (Number.isFinite(Number(v)) ? Number(v) : 0)

const pct = (top: number, bottom: number) => {
  if (!bottom || bottom === 0) return 0
  return (top / bottom) * 100
}

export const campusFluctuationService = {
  /** 从数据库读取（默认当前年） */
  async getCampusFluctuationData(campus: string, year?: number): Promise<CampusFluctuationRecord[]> {
    if (!campus) throw new Error('神殿名称不能为空')
    const y = year ?? thisYear()

    const res = await apiService.get<any>('/teaching-quality/campus-stu-movement-summary', {
      params: { campus: normalizeCampus(campus), year: y },
    })

    const raw = (res as any)?.data ?? res
    const list: any[] = Array.isArray(raw?.行列表) ? raw.行列表 : Array.isArray(raw) ? raw : []

    const rows: CampusFluctuationRecord[] = (list || []).map((r: any, idx: number) => {
      const month = num(r.month ?? r.月份 ?? idx + 1) || idx + 1
      const cumulative = num(r.totalStudents ?? r.累计带生人数)
      const newRefund = num(r.newRefundCount ?? r.新生退费人数)
      const oldRefund = num(r.oldRefundCount ?? r.老生退费人数)
      const totalRefund = num(r.totalRefundCount ?? r.退费总人数)
      const leave = num(r.suspensionCount ?? r.休学人数)
      const longLeave = num(r.longLeaveCount ?? r.长期请假人数)
      const longAbsent = num(r.longNoClassCount ?? r.长期不上课人数)
      const holiday = num(r.holidayCount ?? r.寒暑假人数)
      const other = num(r.otherCount ?? r.其他情况人数)
      const totalMovement = num(r.totalMovementCount ?? r.异动总人数)

      return {
        key: `${campus}-${month}`,
        month,
        campus: month === 1 ? normalizeCampus(campus) : '',
        cumulativeStudentCount: cumulative,
        newStudentRefundCount: newRefund,
        oldStudentRefundCount: oldRefund,
        totalRefundCount: totalRefund,
        refundRate: pct(totalRefund, cumulative),
        totalLeaveCount: leave,
        longTermLeaveCount: longLeave,
        longTermAbsentCount: longAbsent,
        holidayStudentCount: holiday,
        otherSituationCount: other,
        totalFluctuationCount: totalMovement,
        fluctuationRate: pct(totalMovement, cumulative),
      }
    })

    // 合计行由表格内部处理或另算；如需要返回可在此追加
    return rows
  },

  /** 汇总统计（数据库数据） */
  async getCampusFluctuationSummary(campus: string, year?: number): Promise<CampusFluctuationSummary> {
    const y = year ?? thisYear()
    const rows = await this.getCampusFluctuationData(campus, y)

    if (rows.length === 0) {
      return {
        totalCumulativeStudentCount: 0,
        totalNewStudentRefundCount: 0,
        totalOldStudentRefundCount: 0,
        totalRefundCount: 0,
        averageRefundRate: 0,
        totalLeaveCount: 0,
        totalLongTermLeaveCount: 0,
        totalLongTermAbsentCount: 0,
        totalHolidayStudentCount: 0,
        totalOtherSituationCount: 0,
        totalFluctuationCount: 0,
        averageFluctuationRate: 0,
        completedMonths: 0,
        totalMonths: 0,
      }
    }

    const totalCumulativeStudentCount = rows.reduce((s, r) => s + (r.cumulativeStudentCount || 0), 0)
    const totalNewStudentRefundCount = rows.reduce((s, r) => s + (r.newStudentRefundCount || 0), 0)
    const totalOldStudentRefundCount = rows.reduce((s, r) => s + (r.oldStudentRefundCount || 0), 0)
    const totalRefundCount = rows.reduce((s, r) => s + (r.totalRefundCount || 0), 0)
    const totalLeaveCount = rows.reduce((s, r) => s + (r.totalLeaveCount || 0), 0)
    const totalLongTermLeaveCount = rows.reduce((s, r) => s + (r.longTermLeaveCount || 0), 0)
    const totalLongTermAbsentCount = rows.reduce((s, r) => s + (r.longTermAbsentCount || 0), 0)
    const totalHolidayStudentCount = rows.reduce((s, r) => s + (r.holidayStudentCount || 0), 0)
    const totalOtherSituationCount = rows.reduce((s, r) => s + (r.otherSituationCount || 0), 0)
    const totalFluctuationCount = rows.reduce((s, r) => s + (r.totalFluctuationCount || 0), 0)

    const averageRefundRate = pct(totalRefundCount, totalCumulativeStudentCount)
    const averageFluctuationRate = pct(totalFluctuationCount, totalCumulativeStudentCount)

    return {
      totalCumulativeStudentCount,
      totalNewStudentRefundCount,
      totalOldStudentRefundCount,
      totalRefundCount,
      averageRefundRate,
      totalLeaveCount,
      totalLongTermLeaveCount,
      totalLongTermAbsentCount,
      totalHolidayStudentCount,
      totalOtherSituationCount,
      totalFluctuationCount,
      averageFluctuationRate,
      completedMonths: rows.filter((r) => (r.cumulativeStudentCount || 0) > 0).length,
      totalMonths: rows.length,
    }
  },

  /** 导出（数据库数据） */
  async exportCampusFluctuationData(campus: string, year?: number): Promise<Blob> {
    const y = year ?? thisYear()
    const data = await this.getCampusFluctuationData(campus, y)

    const csvContent = [
      '月份,神殿,累计带生人数,新生退费人数,老生退费人数,退费总人数,退费率,休学总人数,长期请假总人数,长期不上课总人数,寒暑假学生总数,其他情况总人数,异动总人数,异动率',
      ...data.map((item) =>
        `${item.month},${item.campus},${item.cumulativeStudentCount},${item.newStudentRefundCount},${item.oldStudentRefundCount},${item.totalRefundCount},${item.refundRate.toFixed(2)}%,${item.totalLeaveCount},${item.longTermLeaveCount},${item.longTermAbsentCount},${item.holidayStudentCount},${item.otherSituationCount},${item.totalFluctuationCount},${item.fluctuationRate.toFixed(2)}%`,
      ),
    ].join('\n')

    const BOM = '\uFEFF'
    return new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' })
  },
}
