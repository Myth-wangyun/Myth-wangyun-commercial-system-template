/**
 * 教化司培训计划与成绩汇总表数据服务
 * 从后端API读取真实数据，不再生成随机数据
 */

import type {
  TrainingPlanPerformanceRecord,
  TrainingPlanPerformanceSummary,
} from '../../types/training-plan-performance'
import { apiService } from '../api'
import dayjs from 'dayjs'
import { trainingPlanScoreDetailService } from './trainingPlanScoreDetail'

// normalizeCampus 已不再用于读取汇总数据（汇总改为从明细表聚合），保留给保存接口使用
const normalizeCampus = (s: string) => s.replace(/神殿$/, '').trim()
const thisYear = () => new Date().getFullYear()

// 计算汇总统计数据
const calculateSummary = (
  data: TrainingPlanPerformanceRecord[],
): TrainingPlanPerformanceSummary => {
  if (data.length === 0) {
    return {
      totalTrainees: 0,
      totalQualified: 0,
      overallPassRate: 0,
      overallAverageScore: 0,
      completedRecords: 0,
      totalRecords: 0,
    }
  }

  const totalTrainees = data.reduce((sum, item) => sum + (item.numberOfTrainees || 0), 0)
  const totalQualified = data.reduce((sum, item) => sum + (item.numberOfQualified || 0), 0)

  // 平均考试合格率：按“月”取平均（每个月权重相同），且只统计当月确实有培训场次的月份
  const validMonths = (data as any[]).filter((r) => Number(r.__sessionCount || 0) > 0)
  const overallPassRate =
    validMonths.length > 0
      ? validMonths.reduce((sum, r) => sum + Number(r.examPassRate || 0), 0) / validMonths.length
      : 0

  // 平均成绩：按“月”取平均（每个月权重相同），且只统计当月确实有培训场次的月份
  const overallAverageScore =
    validMonths.length > 0
      ? validMonths.reduce((sum, r) => sum + Number(r.averageScore || 0), 0) / validMonths.length
      : 0

  const completedRecords = data.filter((item) => Number((item as any).__sessionCount || 0) > 0).length
  const totalRecords = 12

  return {
    totalTrainees,
    totalQualified,
    overallPassRate,
    overallAverageScore,
    completedRecords,
    totalRecords,
  }
}

export const trainingPlanPerformanceService = { 
  /**
   * 获取培训计划与成绩数据（从后端API读取）
   * @param campus 神殿名称
   * @param year 年份
   * @returns Promise<TrainingPlanPerformanceRecord[]>
   */
  getTrainingPlanPerformanceData: async (
    campus: string,
    year?: number,
  ): Promise<TrainingPlanPerformanceRecord[]> => {
    if (!campus) {
      throw new Error('神殿名称不能为空')
    }

    const y = year ?? thisYear()
    try {
      // 以“培训计划与成绩明细表”的数据为准：先取场次列表，再逐场次拉明细，最后按月份汇总
      // 明细表接口使用完整神殿名（如："测试神殿"），这里做一次兼容
      const campusNameForScoreDetail = /神殿$/.test(campus) ? campus : `${campus}神殿`
      const sessionsAll = await trainingPlanScoreDetailService.getTrainingSessions(campusNameForScoreDetail)
      // 后端场次列表接口目前不支持 year 参数，这里前端按开始日期过滤年份
      const sessions = (sessionsAll || []).filter((s) => {
        const dt = dayjs(s.开始日期)
        return dt.isValid() && dt.year() === y
      })

      // 预置12个月
      const monthly = Array.from({ length: 12 }, (_, i) => ({
        month: i + 1,
        records: [] as Awaited<ReturnType<typeof trainingPlanScoreDetailService.getTrainingPlanScoreDetail>>[],
      }))

      // 逐场次取明细，并按开始日期归入月份
      for (const s of sessions || []) {
        try {
          const detail = await trainingPlanScoreDetailService.getTrainingPlanScoreDetail(
            campusNameForScoreDetail,
            s.场次名称,
          )
          const m = dayjs(detail.开始日期 || s.开始日期).month() + 1
          if (m >= 1 && m <= 12) {
            monthly[m - 1].records.push(detail)
          }
        } catch (e) {
          console.error('[trainingPlanPerformance] 拉取场次明细失败:', s, e)
        }
      }

      // 汇总成管理端表格所需结构：每月取“最新一场”的培训信息 + 汇总统计
      return monthly.map((mm) => {
        const details = mm.records
          .slice()
          .sort((a, b) => String(b.开始日期 || '').localeCompare(String(a.开始日期 || '')))

        const latest = details[0]

        // 统计：培训人次按“去重”口径（同月同人只算 1 次）
        // 合格人数：去重后，若该人员在当月任一场次成绩>=60，则算合格
        // 培训人次按“去重”口径（同月同人只算 1 次）：只要当月出现在任一场次“成绩明细”里就计入
        // 培训人次：按去重口径（同月同人只算 1 次）：只要当月出现在任一场次“成绩明细”里就计入
        const personSet = new Set<string>()

        // 合格人次：按“人次”口径（不去重）。
        // 说明：这里统计的是当月所有场次中，成绩>=60 的条数之和（同一人多场会被算多次）
        let qualifiedTimes = 0

        // 平均成绩：先求“每次培训（场次）的平均分”，再对这些场次平均分做平均
        //（仅统计该场次内有成绩的人员；没有任何成绩则该场次不参与平均）
        let sessionAvgSum = 0
        let sessionAvgCount = 0

        // 平均考试合格率：按场次合格率求平均（每个场次权重相同）
        let sessionPassRateSum = 0
        let sessionPassRateCount = 0

        for (const d of details) {
          let sSum = 0
          let sCnt = 0
          let sPass = 0

          for (const item of d.成绩明细 || []) {
            const name = (item.培训人 || '').trim()
            if (name) personSet.add(name)

            const score = item.成绩
            if (typeof score === 'number' && Number.isFinite(score)) {
              sSum += score
              sCnt += 1
              if (score >= 60) {
                sPass += 1
                qualifiedTimes += 1
              }
            }
          }

          if (sCnt > 0) {
            sessionAvgSum += sSum / sCnt
            sessionAvgCount += 1

            sessionPassRateSum += (sPass / sCnt) * 100
            sessionPassRateCount += 1
          }
        }

        const totalTrainees = personSet.size
        const averageScore = sessionAvgCount > 0 ? sessionAvgSum / sessionAvgCount : 0
        const avgExamPassRate = sessionPassRateCount > 0 ? sessionPassRateSum / sessionPassRateCount : 0

        return {
          key: `${campus}-${mm.month}`,
          month: mm.month,
          campus: mm.month === 1 ? campus : '',
          // 表格“培训场次”用于显示当月培训次数
          __sessionCount: details.length,
          trainingObjective: latest?.培训目标 ?? '',
          mainContent: latest?.主要内容 ?? '',
          trainingMethod: latest?.培训方式 ?? '',
          personInCharge: latest?.负责人 ?? '',
          numberOfTrainees: totalTrainees,
          numberOfQualified: qualifiedTimes,
          examPassRate: avgExamPassRate,
          averageScore,
        }
      })
    } catch (e) {
      console.error('[trainingPlanPerformance] 获取数据失败:', e)
      // 返回空的12个月数据，允许用户手动填写
      return Array.from({ length: 12 }, (_, i) => ({
        key: `${campus}-${i + 1}`,
        month: i + 1,
        campus: i === 0 ? campus : '',
        trainingObjective: '',
        mainContent: '',
        trainingMethod: '',
        personInCharge: '',
        numberOfTrainees: 0,
        numberOfQualified: 0,
        examPassRate: 0,
        averageScore: 0,
      }))
    }
  },

  /**
   * 获取汇总统计数据
   * @param campus 神殿名称
   * @returns Promise<TrainingPlanPerformanceSummary>
   */
  getTrainingPlanPerformanceSummary: async (
    campus: string,
  ): Promise<TrainingPlanPerformanceSummary> => {
    const data = await trainingPlanPerformanceService.getTrainingPlanPerformanceData(campus)
    return calculateSummary(data)
  },

  /**
   * 保存（写库）：管理端月度明细一条
   */
  saveTrainingPlanPerformanceItem: async (
    campus: string,
    year: number,
    month: number,
    data: Partial<TrainingPlanPerformanceRecord>,
  ): Promise<void> => {
    await apiService.post('/teaching-quality/training-plan-performance-mgnt', {
      campus: normalizeCampus(campus),
      year,
      month,
      data,
    })
  },

  /**
   * 导出培训计划与成绩数据
   * @param campus 神殿名称
   * @returns Promise<Blob>
   */
  exportTrainingPlanPerformanceData: async (campus: string): Promise<Blob> => {
    const data = await trainingPlanPerformanceService.getTrainingPlanPerformanceData(campus)

    // 生成CSV内容
    const csvContent = [
      '月份,神殿,培训目标,主要内容,培训方式,负责人,培训人数,合格人数,考试合格率,平均成绩',
      ...data.map(
        (item) =>
          `${item.month},${item.campus || ''},${item.trainingObjective || ''},${item.mainContent || ''},${item.trainingMethod || ''},${item.personInCharge || ''},${item.numberOfTrainees || 0},${item.numberOfQualified || 0},${(item.examPassRate || 0).toFixed(2)}%,${item.averageScore || 0}`,
      ),
    ].join('\n')

    return new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  },
}

