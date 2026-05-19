/**
 * 市场投入成本数据服务
 * 用于获取各媒体来源的市场投入和咨询量成本
 */

import api from '@/services/api'

// ==================== 类型定义 ====================

export interface MonthlyPlanData {
  month: number
  plan_income: number
  plan_enrollment: number
  plan_consult_volume: number
  plan_cost: number
  actual_expense?: number
}

export interface MarketCostData {
  month: number
  campus: string
  // 市场投入 = 咨询量成本 × 咨询量
  咨询量成本: number | null  // 单价
  咨询量: number | null
  市场投入: number | null  // 总成本
  // 招生成本 = 市场投入 / 招生人数
  招生人数: number | null
  招生成本: number | null
}

export interface SEMCostSummary {
  campus: string
  year: number
  month: number
  sem_consumption: number  // SEM消费（百度+其他）
  consult_count: number    // SEM咨询量
  consult_cost: number     // 咨询量成本 = 消费/咨询量
}

// ==================== API 函数 ====================

/**
 * 获取SEM月度成本汇总
 * @param campus 神殿
 * @param year 年份
 */
export async function getSEMCostSummary(campus: string, year: number): Promise<Record<number, SEMCostSummary>> {
  try {
    const response = await api.get('/market/sem-daily/monthly-summary', {
      params: { campus, year }
    })
    if (response.data?.success && response.data?.data) {
      const result: Record<number, SEMCostSummary> = {}
      response.data.data.forEach((item: any) => {
        result[item.month] = {
          campus,
          year,
          month: item.month,
          sem_consumption: item.sem_consumption || 0,
          consult_count: item.consult_count || 0,
          consult_cost: item.consult_cost || 0,
        }
      })
      return result
    }
    return {}
  } catch {
    return {}
  }
}

/**
 * 获取新媒体月度成本数据
 * 使用 newmedia-monthly-summary 接口，计算咨询量成本
 */
export async function getNewMediaCostSummary(campus: string, year: number): Promise<Record<number, MarketCostData>> {
  try {
    const response = await api.get('/market/newmedia-monthly-summary', {
      params: { campus, year: year.toString() }
    })
    if (response.data?.success && response.data?.data) {
      const result: Record<number, MarketCostData> = {}
      response.data.data.forEach((item: any) => {
        const actualConsultVolume = item.actual_consult_volume || 0
        const actualCost = item.actual_cost || 0
        // 咨询量成本 = 实际消费 / 实际咨询量
        const consultCost = actualConsultVolume > 0 ? actualCost / actualConsultVolume : 0
        result[item.month] = {
          month: item.month,
          campus,
          咨询量成本: Math.round(consultCost * 100) / 100,
          咨询量: actualConsultVolume,
          市场投入: actualCost,
          招生人数: null,
          招生成本: null,
        }
      })
      return result
    }
    return {}
  } catch {
    return {}
  }
}

/**
 * 获取网络计划数据（含SEM计划消费）
 */
export async function getNetworkPlanCost(campus: string, year: number): Promise<Record<number, MonthlyPlanData>> {
  try {
    const response = await api.get('/market/monthly-plan/network-partner/list', {
      params: { campus, year: year.toString() }
    })
    if (response.data?.code === 0 && response.data?.data) {
      const result: Record<number, MonthlyPlanData> = {}
      Object.entries(response.data.data).forEach(([month, data]: [string, any]) => {
        result[parseInt(month)] = {
          month: parseInt(month),
          plan_income: data.plan_income || 0,
          plan_enrollment: data.plan_enrollment || 0,
          plan_consult_volume: data.plan_consult_volume || 0,
          plan_cost: data.plan_cost || 0,
          actual_expense: data.actual_expense || 0,
        }
      })
      return result
    }
    return {}
  } catch {
    return {}
  }
}

/**
 * 获取口碑计划数据
 */
export async function getReputationPlanCost(campus: string, year: number): Promise<Record<number, MonthlyPlanData>> {
  try {
    const response = await api.get('/market/monthly-plan/reputation/list', {
      params: { campus, year: year.toString() }
    })
    if (response.data?.code === 0 && response.data?.data) {
      const result: Record<number, MonthlyPlanData> = {}
      Object.entries(response.data.data).forEach(([month, data]: [string, any]) => {
        result[parseInt(month)] = {
          month: parseInt(month),
          plan_income: data.plan_income || 0,
          plan_enrollment: data.plan_enrollment || 0,
          plan_consult_volume: data.plan_consult_volume || 0,
          plan_cost: data.plan_cost || 0,
          actual_expense: data.actual_expense || 0,
        }
      })
      return result
    }
    return {}
  } catch {
    return {}
  }
}

/**
 * 获取免费推广计划数据
 */
export async function getFreePromotionPlanCost(campus: string, year: number): Promise<Record<number, MonthlyPlanData>> {
  try {
    const response = await api.get('/market/monthly-plan/free-promotion/list', {
      params: { campus, year: year.toString() }
    })
    if (response.data?.code === 0 && response.data?.data) {
      const result: Record<number, MonthlyPlanData> = {}
      Object.entries(response.data.data).forEach(([month, data]: [string, any]) => {
        result[parseInt(month)] = {
          month: parseInt(month),
          plan_income: data.plan_income || 0,
          plan_enrollment: data.plan_enrollment || 0,
          plan_consult_volume: data.plan_consult_volume || 0,
          plan_cost: data.plan_cost || 0,
          actual_expense: data.actual_expense || 0,
        }
      })
      return result
    }
    return {}
  } catch {
    return {}
  }
}

/**
 * 获取合作伙伴月度成本数据
 * 使用 network-partner-annual/dashboard 接口，计算咨询量成本
 */
export async function getPartnerCostSummary(campus: string, year: number): Promise<Record<number, SEMCostSummary>> {
  try {
    const response = await api.get('/market/network-partner-annual/dashboard', {
      params: { campus, year: year.toString() }
    })
    if (response.data?.data) {
      const result: Record<number, SEMCostSummary> = {}
      Object.entries(response.data.data).forEach(([month, data]: [string, any]) => {
        const monthNum = parseInt(month)
        const actualCost = data.actual_cost || 0
        const actualConsultVolume = data.actual_consult_volume || 0
        // 咨询量成本 = 实际消费 / 实际咨询量
        const consultCost = actualConsultVolume > 0 ? actualCost / actualConsultVolume : 0
        result[monthNum] = {
          campus,
          year,
          month: monthNum,
          sem_consumption: actualCost,
          consult_count: actualConsultVolume,
          consult_cost: Math.round(consultCost * 100) / 100,
        }
      })
      return result
    }
    return {}
  } catch {
    return {}
  }
}

/**
 * 计算市场投入和招生成本
 * @param consultCost 咨询量成本（单价）
 * @param consultCount 咨询量（个数）
 * @param enrollmentCount 招生人数
 */
export function calculateMarketCost(
  consultCost: number | null,
  consultCount: number | null,
  enrollmentCount: number | null
): { 市场投入: number | null; 招生成本: number | null } {
  // 市场投入 = 咨询量成本 × 咨询量
  let 市场投入: number | null = null
  if (consultCost !== null && consultCount !== null && consultCount > 0) {
    市场投入 = consultCost * consultCount
  }
  
  // 招生成本 = 市场投入 / 招生人数
  let 招生成本: number | null = null
  if (市场投入 !== null && enrollmentCount !== null && enrollmentCount > 0) {
    招生成本 = 市场投入 / enrollmentCount
  }
  
  return { 市场投入, 招生成本 }
}
