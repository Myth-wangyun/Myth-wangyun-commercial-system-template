// [教质模块] 教化司培训计划与成绩汇总表数据服务
/**
 * 教化司培训计划与成绩汇总表数据服务
 * 从后端API读取真实数据，不再生成随机数据
 */

import type {
  TrainingPlanPerformanceRecord,
  TrainingPlanPerformanceRequest,
  TrainingPlanPerformanceSummary,
} from '../../types/training-plan-performance'
import { apiService } from '../api'

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
  const totalScores = data.reduce((sum, item) => sum + (item.averageScore || 0) * (item.numberOfTrainees || 0), 0)

  const overallPassRate = totalTrainees > 0 ? (totalQualified / totalTrainees) * 100 : 0
  const overallAverageScore = totalTrainees > 0 ? totalScores / totalTrainees : 0

  const completedRecords = data.filter((item) => (item.numberOfTrainees || 0) > 0).length
  const totalRecords = data.length

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
      const res = await apiService.get<any>('/teaching-quality/training-plan-performance-mgnt', {
        params: { campus: normalizeCampus(campus), year: y },
      })
      const raw = (res as any)?.data ?? res
      const list: any[] = Array.isArray(raw?.行列表) ? raw.行列表 : Array.isArray(raw) ? raw : []

      return list.map((r, idx) => ({
        key: `${campus}-${r.month ?? idx + 1}`,
        month: r.month ?? idx + 1,
        campus: (r.month ?? idx + 1) === 1 ? campus : '',
        trainingObjective: r.trainingObjective ?? '',
        mainContent: r.mainContent ?? '',
        trainingMethod: r.trainingMethod ?? '',
        personInCharge: r.personInCharge ?? '',
        numberOfTrainees: Number(r.numberOfTrainees || 0),
        numberOfQualified: Number(r.numberOfQualified || 0),
        examPassRate: Number(r.examPassRate || 0),
        averageScore: Number(r.averageScore || 0),
      }))
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

