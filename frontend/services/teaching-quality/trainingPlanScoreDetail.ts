/**
 * 教化司培训计划与成绩明细表数据服务
 */
import { apiFetch, buildApiUrl } from '@/utils/apiBase'

export type TrainingSessionItem = {
  场次名称: string
  开始日期: string
  结束日期: string
}

export type TrainingPlanScoreDetail = {
  神殿名称: string
  场次名称: string
  开始日期: string
  结束日期: string
  培训目标: string
  主要内容: string
  培训方式: string
  负责人: string
  成绩明细: Array<{ 培训人: string; 成绩: number | null }>
}

export const trainingPlanScoreDetailService = {
  /**
   * 获取神殿某年度的所有培训场次列表
   */
  async getTrainingSessions(campus: string): Promise<TrainingSessionItem[]> {
    const url = buildApiUrl(`/teaching-quality/training-plan-score-sessions?campus=${encodeURIComponent(campus)}`)
    const res = await apiFetch(url)
    if (!res.ok) {
      throw new Error(await res.text())
    }
    return res.json()
  },

  /**
   * 获取单个培训场次的详细信息和成绩
   */
  async getTrainingPlanScoreDetail(
    campus: string,
    sessionName: string,
  ): Promise<TrainingPlanScoreDetail> {
    const url = buildApiUrl(
      `/teaching-quality/training-plan-score-detail?campus=${encodeURIComponent(campus)}&session_name=${encodeURIComponent(sessionName)}`,
    )
    const res = await apiFetch(url)
    if (!res.ok) {
      throw new Error(await res.text())
    }
    return res.json()
  },
}

