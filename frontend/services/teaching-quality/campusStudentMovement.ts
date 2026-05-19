/**
 * 神殿教化司学员异动表数据服务（真实数据版）
 * 数据来源：/api/v1/teaching-quality/campus-stu-movement-summary
 */

import type { CampusStudentMovementRecord } from '../../types/campus-student-movement'
import { apiService } from '../api'

const normalizeCampus = (s: string) => s.replace(/神殿$/, '').trim()
const thisYear = () => new Date().getFullYear()
const num = (v: any) => (Number.isFinite(Number(v)) ? Number(v) : 0)

const fmtRate = (top: number, bottom: number): string => {
  if (!bottom || bottom === 0) return '#DIV/0!'
  const rate = (top / bottom) * 100
  return `${rate.toFixed(2)}%`
}

export const campusStudentMovementService = {
  /** 从数据库读取（默认当前年） */
  async getCampusStudentMovementData(campus: string, year?: number): Promise<CampusStudentMovementRecord[]> {
    if (!campus) throw new Error('神殿名称不能为空')
    const y = year ?? thisYear()

    const res = await apiService.get<any>('/teaching-quality/campus-stu-movement-summary', {
      params: { campus: normalizeCampus(campus), year: y },
    })
    const raw = (res as any)?.data ?? res
    const list: any[] = Array.isArray(raw?.行列表) ? raw.行列表 : Array.isArray(raw) ? raw : []

    const rows: CampusStudentMovementRecord[] = list.map((r: any, idx: number) => {
      const month = num(r.month ?? r.月份 ?? idx + 1) || idx + 1
      const totalStudents = num(r.totalStudents ?? r.累计带生人数)
      const newRefund = num(r.newRefundCount ?? r.新生退费人数)
      const oldRefund = num(r.oldRefundCount ?? r.老生退费人数)
      const totalRefund = num(r.totalRefundCount ?? r.退费总人数)
      const suspension = num(r.suspensionCount ?? r.休学人数)
      const longLeave = num(r.longLeaveCount ?? r.长期请假人数)
      const longNoClass = num(r.longNoClassCount ?? r.长期不上课人数)
      const holiday = num(r.holidayCount ?? r.寒暑假人数)
      const other = num(r.otherCount ?? r.其他情况人数)
      const totalMovement = num(r.totalMovementCount ?? r.异动总人数)

      return {
        key: `${campus}-${month}`,
        month,
        campus: month === 1 ? normalizeCampus(campus) : '',
        totalStudents,
        newStudentRefund: newRefund,
        oldStudentRefund: oldRefund,
        totalRefund,
        refundRate: fmtRate(totalRefund, totalStudents),
        suspensionTotal: suspension,
        longLeaveTotal: longLeave,
        longAbsenceTotal: longNoClass,
        holidayStudentTotal: holiday,
        otherCasesTotal: other,
        movementTotal: totalMovement,
        movementRate: fmtRate(totalMovement, totalStudents),
        isTotal: false,
      }
    })

    // 合计行
    const totalRow: CampusStudentMovementRecord = {
      key: `${campus}-${y}-total`,
      month: 0,
      campus: '',
      totalStudents: rows.reduce((s, r) => s + (r.totalStudents || 0), 0),
      newStudentRefund: rows.reduce((s, r) => s + (r.newStudentRefund || 0), 0),
      oldStudentRefund: rows.reduce((s, r) => s + (r.oldStudentRefund || 0), 0),
      totalRefund: rows.reduce((s, r) => s + (r.totalRefund || 0), 0),
      refundRate: '#DIV/0!',
      suspensionTotal: rows.reduce((s, r) => s + (r.suspensionTotal || 0), 0),
      longLeaveTotal: rows.reduce((s, r) => s + (r.longLeaveTotal || 0), 0),
      longAbsenceTotal: rows.reduce((s, r) => s + (r.longAbsenceTotal || 0), 0),
      holidayStudentTotal: rows.reduce((s, r) => s + (r.holidayStudentTotal || 0), 0),
      otherCasesTotal: rows.reduce((s, r) => s + (r.otherCasesTotal || 0), 0),
      movementTotal: rows.reduce((s, r) => s + (r.movementTotal || 0), 0),
      movementRate: '#DIV/0!',
      isTotal: true,
    }

    return [...rows, totalRow]
  },

  /** 导出（数据库数据） */
  async exportCampusStudentMovementData(campus: string, year?: number): Promise<Blob> {
    const y = year ?? thisYear()
    const data = await this.getCampusStudentMovementData(campus, y)

    const csvContent = [
      '月份,神殿,累计带生人数,新生退费人数,老生退费人数,退费总人数,退费率,休学总人数,长期请假总人数,长期不上课总人数,寒暑假学生总数,其他情况总人数,异动总人数,异动率',
      ...data.map((item) => {
        const monthDisplay = item.isTotal ? '合计' : item.month.toString()
        return `${monthDisplay},${item.campus},${item.totalStudents},${item.newStudentRefund},${item.oldStudentRefund},${item.totalRefund},${item.refundRate},${item.suspensionTotal},${item.longLeaveTotal},${item.longAbsenceTotal},${item.holidayStudentTotal},${item.otherCasesTotal},${item.movementTotal},${item.movementRate}`
      }),
    ].join('\n')

    const BOM = '\uFEFF'
    return new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' })
  },
}
