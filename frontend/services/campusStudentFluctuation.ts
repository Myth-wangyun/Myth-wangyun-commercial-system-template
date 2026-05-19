import type {
  CampusStudentFluctuationRecord,
  CampusStudentFluctuationRequest,
} from '../types/campus-student-fluctuation'
import { apiService } from './api'

const normalizeCampus = (s: string) => {
  // 如果已经是"神殿"结尾的完整名称，直接返回
  if (s.endsWith('神殿')) {
    return s
  }
  // 否则添加"神殿"后缀
  return `${s}神殿`
}
const thisYear = () => new Date().getFullYear()
const num = (v: any) => (Number.isFinite(Number(v)) ? Number(v) : 0)

// 计算百分比（保留两位）
const pct = (top: number, bottom: number) => {
  if (!bottom || bottom === 0) return 0
  return (top / bottom) * 100
}

export const campusStudentFluctuationService = {
  // 从数据库读取（默认当前年）
  async getCampusStudentFluctuationData(
    campus: string,
    year?: number,
  ): Promise<CampusStudentFluctuationRecord[]> {
    if (!campus) throw new Error('神殿名称不能为空')
    const y = year ?? thisYear()

    const res = await apiService.get<any>('/teaching-quality/campus-stu-movement-summary', {
      params: { campus: normalizeCampus(campus), year: y },
    })

    const raw = (res as any)?.data ?? res
    const list: any[] = Array.isArray(raw?.行列表) ? raw.行列表 : Array.isArray(raw) ? raw : []

    const rows: CampusStudentFluctuationRecord[] = (list || []).map((r: any, idx: number) => {
      const month = num(r.month ?? r.月份 ?? idx + 1) || idx + 1
      const totalStudents = num(r.totalStudents ?? r.累计带生人数)
      const newRefund = num(r.newRefundCount ?? r.新生退费人数)
      const oldRefund = num(r.oldRefundCount ?? r.老生退费人数)
      const totalRefund = num(r.totalRefundCount ?? r.退费总人数)
      const suspension = num(r.suspensionCount ?? r.休学人数)
      const longLeave = num(r.longLeaveCount ?? r.长期请假人数)
      const longAbsence = num(r.longNoClassCount ?? r.长期不上课人数)
      const holiday = num(r.holidayCount ?? r.寒暑假人数)
      const other = num(r.otherCount ?? r.其他情况人数)
      const movement = num(r.totalMovementCount ?? r.异动总人数)

      return {
        key: `${campus}-${month}`,
        month,
        campus: month === 1 ? normalizeCampus(campus) : '',
        cumulativeStudentCount: totalStudents,
        newStudentRefundCount: newRefund,
        oldStudentRefundCount: oldRefund,
        totalRefundCount: totalRefund,
        refundRate: pct(totalRefund, totalStudents),
        suspensionCount: suspension,
        longTermLeaveCount: longLeave,
        longTermAbsenceCount: longAbsence,
        vacationStudentCount: holiday,
        otherSituationCount: other,
        totalFluctuationCount: movement,
        fluctuationRate: pct(movement, totalStudents),
      }
    })

    // 合计行
    const total: CampusStudentFluctuationRecord = {
      key: `${campus}-${y}-total`,
      month: 0,
      campus: '',
      cumulativeStudentCount: rows.reduce((s, r) => s + (r.cumulativeStudentCount || 0), 0),
      newStudentRefundCount: rows.reduce((s, r) => s + (r.newStudentRefundCount || 0), 0),
      oldStudentRefundCount: rows.reduce((s, r) => s + (r.oldStudentRefundCount || 0), 0),
      totalRefundCount: rows.reduce((s, r) => s + (r.totalRefundCount || 0), 0),
      refundRate: 0,
      suspensionCount: rows.reduce((s, r) => s + (r.suspensionCount || 0), 0),
      longTermLeaveCount: rows.reduce((s, r) => s + (r.longTermLeaveCount || 0), 0),
      longTermAbsenceCount: rows.reduce((s, r) => s + (r.longTermAbsenceCount || 0), 0),
      vacationStudentCount: rows.reduce((s, r) => s + (r.vacationStudentCount || 0), 0),
      otherSituationCount: rows.reduce((s, r) => s + (r.otherSituationCount || 0), 0),
      totalFluctuationCount: rows.reduce((s, r) => s + (r.totalFluctuationCount || 0), 0),
      fluctuationRate: 0,
    }

    return [...rows, total]
  },

  // 不支持直编：汇总数据来源于统计视图
  async updateCampusStudentFluctuationRecord(
    _key: string,
    _data: Partial<CampusStudentFluctuationRecord>,
  ): Promise<CampusStudentFluctuationRecord> {
    throw new Error('当前汇总表从数据库统计视图读取，不支持直接编辑')
  },

  async createCampusStudentFluctuationRecord(
    _data: Omit<CampusStudentFluctuationRecord, 'key'>,
  ): Promise<CampusStudentFluctuationRecord> {
    throw new Error('当前汇总表从数据库统计视图读取，不支持新增')
  },

  async deleteCampusStudentFluctuationRecord(_key: string): Promise<void> {
    throw new Error('当前汇总表从数据库统计视图读取，不支持删除')
  },
}
