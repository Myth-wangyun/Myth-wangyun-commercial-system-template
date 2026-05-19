/**
 * 神殿教化司培训计划与成绩汇总表数据服务
 * 与核心业务数据汇总页同源，统一走教学质量模块接口：
 *   GET /teaching-quality/campus-training-plan-performance?campus=..&year=..
 *   POST /teaching-quality/campus-training-plan-performance
 */

import type {
  CampusTrainingPlanPerformanceRecord,
  CampusTrainingPlanPerformanceRequest,
  CampusTrainingPlanPerformanceSummary,
} from '../../types/campus-training-plan-performance'
import { apiService } from '../api'

const normalizeCampus = (s: string) => s.replace(/神殿$/, '').trim()
const thisYear = () => new Date().getFullYear()

const toNum = (v: any) => (Number.isFinite(Number(v)) ? Number(v) : 0)
const toFloat = (v: any) => (Number.isFinite(Number(v)) ? Number(v) : 0)

function mapRow(campus: string, r: any, idx: number): CampusTrainingPlanPerformanceRecord {
  const month = toNum(r.month ?? r.月份 ?? idx + 1) || idx + 1
  return {
    key: `${campus}-${month}`,
    month,
    campus: month === 1 ? campus : '',
    targetTrainingPlanCount: toNum(r.targetTrainingPlanCount ?? r.目标培训计划数),
    actualTrainingPlanCount: toNum(r.actualTrainingPlanCount ?? r.实际培训计划数),
    targetCompletionCount: toNum(r.targetCompletionCount ?? r.目标完成数),
    actualCompletionCount: toNum(r.actualCompletionCount ?? r.实际完成数),
    targetAverageScore: toFloat(r.targetAverageScore ?? r.目标平均成绩),
    actualAverageScore: toFloat(r.actualAverageScore ?? r.实际平均成绩),
    targetParticipantCount: toNum(r.targetParticipantCount ?? r.目标参与人数),
    actualParticipantCount: toNum(r.actualParticipantCount ?? r.实际参与人数),
    targetPassRate: toFloat(r.targetPassRate ?? r.目标合格率),
    actualPassRate: toFloat(r.actualPassRate ?? r.实际合格率),
  }
}

function calcSummary(rows: CampusTrainingPlanPerformanceRecord[]): CampusTrainingPlanPerformanceSummary {
  const monthly = rows.filter((r) => r.month > 0)
  if (monthly.length === 0) {
    return {
      totalTargetTrainingPlanCount: 0,
      totalActualTrainingPlanCount: 0,
      totalTargetCompletionCount: 0,
      totalActualCompletionCount: 0,
      averageTargetScore: 0,
      averageActualScore: 0,
      totalTargetParticipantCount: 0,
      totalActualParticipantCount: 0,
      averageTargetPassRate: 0,
      averageActualPassRate: 0,
      completionRate: 0,
      passRateCompletionRate: 0,
      completedRecords: 0,
      totalRecords: 0,
    }
  }

  const totalTargetTrainingPlanCount = monthly.reduce((s, r) => s + (r.targetTrainingPlanCount || 0), 0)
  const totalActualTrainingPlanCount = monthly.reduce((s, r) => s + (r.actualTrainingPlanCount || 0), 0)
  const totalTargetCompletionCount = monthly.reduce((s, r) => s + (r.targetCompletionCount || 0), 0)
  const totalActualCompletionCount = monthly.reduce((s, r) => s + (r.actualCompletionCount || 0), 0)
  const totalTargetParticipantCount = monthly.reduce((s, r) => s + (r.targetParticipantCount || 0), 0)
  const totalActualParticipantCount = monthly.reduce((s, r) => s + (r.actualParticipantCount || 0), 0)

  const averageTargetScore = monthly.length > 0 ? monthly.reduce((s, r) => s + (r.targetAverageScore || 0), 0) / monthly.length : 0
  const averageActualScore = monthly.length > 0 ? monthly.reduce((s, r) => s + (r.actualAverageScore || 0), 0) / monthly.length : 0
  const averageTargetPassRate = monthly.length > 0 ? monthly.reduce((s, r) => s + (r.targetPassRate || 0), 0) / monthly.length : 0
  const averageActualPassRate = monthly.length > 0 ? monthly.reduce((s, r) => s + (r.actualPassRate || 0), 0) / monthly.length : 0

  const completionRate = totalTargetCompletionCount > 0 ? (totalActualCompletionCount / totalTargetCompletionCount) * 100 : 0
  const passRateCompletionRate = averageTargetPassRate > 0 ? (averageActualPassRate / averageTargetPassRate) * 100 : 0

  const completedRecords = monthly.filter((r) => (r.targetTrainingPlanCount || 0) > 0).length
  const totalRecords = monthly.length

  return {
    totalTargetTrainingPlanCount,
    totalActualTrainingPlanCount,
    totalTargetCompletionCount,
    totalActualCompletionCount,
    averageTargetScore,
    averageActualScore,
    totalTargetParticipantCount,
    totalActualParticipantCount,
    averageTargetPassRate,
    averageActualPassRate,
    completionRate,
    passRateCompletionRate,
    completedRecords,
    totalRecords,
  }
}

export const campusTrainingPlanPerformanceService = {
  /** 从数据库读取（默认当前年） */
  async getCampusTrainingPlanPerformanceData(
    campus: string,
    year?: number,
  ): Promise<CampusTrainingPlanPerformanceRecord[]> {
    if (!campus) throw new Error('神殿名称不能为空')
    const y = year ?? thisYear()
    const res = await apiService.get<any>('/teaching-quality/campus-training-plan-performance', {
      params: { campus: normalizeCampus(campus), year: y },
    })
    const raw = (res as any)?.data ?? res
    const list: any[] = Array.isArray(raw?.行列表) ? raw.行列表 : Array.isArray(raw) ? raw : []
    const rows = list.map((r, idx) => mapRow(normalizeCampus(campus), r, idx))

    const total: CampusTrainingPlanPerformanceRecord = {
      key: `${campus}-${y}-total`,
      month: 0,
      campus: '',
      targetTrainingPlanCount: rows.reduce((s, r) => s + (r.targetTrainingPlanCount || 0), 0),
      actualTrainingPlanCount: rows.reduce((s, r) => s + (r.actualTrainingPlanCount || 0), 0),
      targetCompletionCount: rows.reduce((s, r) => s + (r.targetCompletionCount || 0), 0),
      actualCompletionCount: rows.reduce((s, r) => s + (r.actualCompletionCount || 0), 0),
      targetAverageScore: rows.length > 0 ? rows.reduce((s, r) => s + (r.targetAverageScore || 0), 0) / rows.length : 0,
      actualAverageScore: rows.length > 0 ? rows.reduce((s, r) => s + (r.actualAverageScore || 0), 0) / rows.length : 0,
      targetParticipantCount: rows.reduce((s, r) => s + (r.targetParticipantCount || 0), 0),
      actualParticipantCount: rows.reduce((s, r) => s + (r.actualParticipantCount || 0), 0),
      targetPassRate: rows.length > 0 ? rows.reduce((s, r) => s + (r.targetPassRate || 0), 0) / rows.length : 0,
      actualPassRate: rows.length > 0 ? rows.reduce((s, r) => s + (r.actualPassRate || 0), 0) / rows.length : 0,
    }

    return [...rows, total]
  },

  /** 汇总统计（数据库数据） */
  async getCampusTrainingPlanPerformanceSummary(
    campus: string,
    year?: number,
  ): Promise<CampusTrainingPlanPerformanceSummary> {
    const rows = await this.getCampusTrainingPlanPerformanceData(campus, year)
    return calcSummary(rows)
  },

  /** 保存单条记录 */
  async saveCampusTrainingPlanPerformanceData(
    campus: string,
    year: number,
    month: number,
    data: Partial<CampusTrainingPlanPerformanceRecord>,
  ): Promise<void> {
    await apiService.post('/teaching-quality/campus-training-plan-performance', {
      campus: normalizeCampus(campus),
      year,
      month,
      data,
    })
  },

  /** 导出（数据库数据） */
  async exportCampusTrainingPlanPerformanceData(campus: string, year?: number): Promise<Blob> {
    const y = year ?? thisYear()
    const data = await this.getCampusTrainingPlanPerformanceData(campus, y)
    const csvContent = [
      '月份,神殿,目标培训计划数,实际培训计划数,目标完成数,实际完成数,目标平均成绩,实际平均成绩,目标参与人数,实际参与人数,目标合格率,实际合格率',
      ...data.map((item) => `${item.month === 0 ? '合计' : item.month},${item.campus},${item.targetTrainingPlanCount},${item.actualTrainingPlanCount},${item.targetCompletionCount},${item.actualCompletionCount},${item.targetAverageScore.toFixed(2)},${item.actualAverageScore.toFixed(2)},${item.targetParticipantCount},${item.actualParticipantCount},${(item.targetPassRate * 100).toFixed(2)}%,${(item.actualPassRate * 100).toFixed(2)}%`),
    ].join('\n')
    return new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  },
}

