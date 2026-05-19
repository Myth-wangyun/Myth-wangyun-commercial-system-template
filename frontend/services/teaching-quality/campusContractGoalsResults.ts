/**
 * 神殿教化司企业签约目标与结果汇总表数据服务（真实数据版）
 * 数据来源：教学质量模块后端接口 /teaching-quality/campus-contracts-summary
 */

import type {
  CampusContractGoalsResultsRecord,
  CampusContractGoalsResultsRequest,
  CampusContractGoalsResultsSummary,
} from '../../types/campus-contract-goals-results'
import { apiService } from '../api'

// 注意：数据库里存的神殿名称有时包含“神殿”后缀（如：测试神殿），有时不包含。
// 为避免前端擅自裁剪导致查不到数据，这里仅做 trim，不再去掉“神殿”二字。
const normalizeCampus = (s: string) => {
  const trimmed = (s || '').trim()
  // 如果神殿名称不以"神殿"结尾，自动添加
  return trimmed.endsWith('神殿') ? trimmed : trimmed + '神殿'
}
const thisYear = () => new Date().getFullYear()

// 读取某年某月的数据
async function fetchMonth(campus: string, year: number, month: number) {
  const res = await apiService.get<any>('/teaching-quality/campus-contracts-summary', {
    params: { campus: normalizeCampus(campus), year, month },
  })
  const data: any = (res as any)?.data ?? res
  return {
    target: Number(data?.目标签约数) || 0,
    actual: Number(data?.实际签约数) || 0,
  }
}

// 计算汇总统计数据（不含合计行）
function calcSummary(rows: CampusContractGoalsResultsRecord[]): CampusContractGoalsResultsSummary {
  const monthly = rows.filter((r) => r.month > 0)
  if (monthly.length === 0) {
    return {
      totalTargetContracts: 0,
      totalActualContracts: 0,
      completionRate: 0,
      averageMonthlyTarget: 0,
      averageMonthlyActual: 0,
      completedRecords: 0,
      totalRecords: 0,
    }
  }
  const totalTargetContracts = monthly.reduce((s, r) => s + (r.targetContractCount || 0), 0)
  const totalActualContracts = monthly.reduce((s, r) => s + (r.actualContractCount || 0), 0)
  const completionRate = totalTargetContracts > 0 ? (totalActualContracts / totalTargetContracts) * 100 : 0
  const averageMonthlyTarget = totalTargetContracts / monthly.length
  const averageMonthlyActual = totalActualContracts / monthly.length
  const completedRecords = monthly.filter((r) => (r.targetContractCount || 0) > 0).length
  const totalRecords = monthly.length

  return {
    totalTargetContracts,
    totalActualContracts,
    completionRate,
    averageMonthlyTarget,
    averageMonthlyActual,
    completedRecords,
    totalRecords,
  }
}

export const campusContractGoalsResultsService = {
  /**
   * 获取神殿企业签约目标与结果汇总数据（读取数据库）
   * 若未传入年份，默认使用当前年份。
   */
  getCampusContractGoalsResultsData: async (
    campus: string,
    year?: number,
  ): Promise<CampusContractGoalsResultsRecord[]> => {
    if (!campus) throw new Error('神殿名称不能为空')
    const y = year ?? thisYear()

    // 依次读取 1-12 月
    const list: CampusContractGoalsResultsRecord[] = []
    for (let m = 1; m <= 12; m += 1) {
      const { target, actual } = await fetchMonth(campus, y, m)
      list.push({
        key: `${campus}-${y}-${m}`,
        month: m,
        campus: m === 1 ? campus : '',
        targetContractCount: target,
        actualContractCount: actual,
      })
    }

    // 合计行
    const total: CampusContractGoalsResultsRecord = {
      key: `${campus}-${y}-total`,
      month: 0,
      campus: '',
      targetContractCount: list.reduce((s, r) => s + (r.targetContractCount || 0), 0),
      actualContractCount: list.reduce((s, r) => s + (r.actualContractCount || 0), 0),
    }

    return [...list, total]
  },

  /** 获取汇总统计数据（数据库数据汇总） */
  getCampusContractGoalsResultsSummary: async (
    campus: string,
    year?: number,
  ): Promise<CampusContractGoalsResultsSummary> => {
    const rows = await campusContractGoalsResultsService.getCampusContractGoalsResultsData(campus, year)
    return calcSummary(rows)
  },

  /**
   * 更新/新增：交由业务专表维护，此处不提供写接口以避免和源数据冲突
   */
  updateCampusContractGoalsResultsData: async (
    _request: CampusContractGoalsResultsRequest & { month: number; data: Partial<CampusContractGoalsResultsRecord> },
  ): Promise<CampusContractGoalsResultsRecord> => {
    throw new Error('请到企业签约专表维护数据，当前汇总表不支持直接编辑')
  },

  addCampusContractGoalsResultsData: async (
    _request: CampusContractGoalsResultsRequest & { data: Partial<CampusContractGoalsResultsRecord> },
  ): Promise<CampusContractGoalsResultsRecord> => {
    throw new Error('请到企业签约专表维护数据，当前汇总表不支持新增')
  },

  /** 导出（基于真实数据） */
  exportCampusContractGoalsResultsData: async (campus: string, year?: number): Promise<Blob> => {
    const y = year ?? thisYear()
    const data = await campusContractGoalsResultsService.getCampusContractGoalsResultsData(campus, y)

    const csvContent = [
      '月份,神殿,签约目标数量,实际签约数量',
      ...data.map((item) => `${item.month === 0 ? '合计' : item.month},${item.campus},${item.targetContractCount},${item.actualContractCount}`),
    ].join('\n')

    return new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  },
}
