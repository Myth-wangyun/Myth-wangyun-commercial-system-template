// [教质模块] 神殿教化司口碑招生目标与结果汇总表数据服务
/**
 * 神殿教化司口碑招生目标与结果汇总表数据服务
 * Teaching Quality Department Campus Reputation Enrollment Goals and Results Data Service
 */

import { api } from './api'
import type {
  ReputationEnrollmentRecord,
  ReputationEnrollmentStats,
} from '@/types/reputation-enrollment'

export const teachingQualityCampusReputationEnrollmentGoalsResultsService = {
  /**
   * 获取口碑招生汇总数据
   * @param campus 神殿名称
   * @returns Promise<ReputationEnrollmentRecord[]>
   */
  getReputationEnrollmentData: async (campus: string): Promise<ReputationEnrollmentRecord[]> => {
    if (!campus) {
      throw new Error('神殿名称不能为空')
    }
    const response = await api.get<ReputationEnrollmentRecord[]>('/teaching-quality/reputation-enrollment-goals-results', {
      params: { campus },
    })
    return response.data
  },

  /**
   * 获取口碑招生汇总统计数据
   * @param campus 神殿名称
   * @returns Promise<ReputationEnrollmentStats>
   */
  getReputationEnrollmentStats: async (campus: string): Promise<ReputationEnrollmentStats> => {
    const data =
      await teachingQualityCampusReputationEnrollmentGoalsResultsService.getReputationEnrollmentData(
        campus,
      )

    const dataRows = data.filter((r) => r.rowType === 'data')

    const totalTargetReputationVolume = dataRows.reduce(
      (sum, r) => sum + r.targetReputationVolume,
      0,
    )
    const totalActualReputationVolume = dataRows.reduce(
      (sum, r) => sum + r.actualReputationVolume,
      0,
    )
    const totalTargetWalkInVolume = dataRows.reduce((sum, r) => sum + r.targetWalkInVolume, 0)
    const totalActualWalkInVolume = dataRows.reduce((sum, r) => sum + r.actualWalkInVolume, 0)
    const totalTargetEnrollmentCount = dataRows.reduce((sum, r) => sum + r.targetEnrollmentCount, 0)
    const totalActualEnrollmentCount = dataRows.reduce((sum, r) => sum + r.actualEnrollmentCount, 0)
    const totalTargetRevenue = dataRows.reduce((sum, r) => sum + r.targetRevenue, 0)
    const totalActualRevenue = dataRows.reduce((sum, r) => sum + r.actualRevenue, 0)

    const reputationAchievementRate =
      totalTargetReputationVolume > 0
        ? Math.floor((totalActualReputationVolume / totalTargetReputationVolume) * 100)
        : 0
    const walkInAchievementRate =
      totalTargetWalkInVolume > 0
        ? Math.floor((totalActualWalkInVolume / totalTargetWalkInVolume) * 100)
        : 0
    const enrollmentAchievementRate =
      totalTargetEnrollmentCount > 0
        ? Math.floor((totalActualEnrollmentCount / totalTargetEnrollmentCount) * 100)
        : 0
    const revenueAchievementRate =
      totalTargetRevenue > 0 ? Math.floor((totalActualRevenue / totalTargetRevenue) * 100) : 0

    return {
      totalTargetReputationVolume,
      totalActualReputationVolume,
      totalTargetWalkInVolume,
      totalActualWalkInVolume,
      totalTargetEnrollmentCount,
      totalActualEnrollmentCount,
      totalTargetRevenue,
      totalActualRevenue,
      reputationAchievementRate,
      walkInAchievementRate,
      enrollmentAchievementRate,
      revenueAchievementRate,
    }
  },

  exportReputationEnrollmentData: async (campus: string): Promise<Blob> => {
    const response = await api.get('/teaching-quality/reputation-enrollment-goals-results/export', {
      params: { campus },
      responseType: 'blob',
    })
    return response.data
  },

}

