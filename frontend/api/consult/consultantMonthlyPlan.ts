/**
 * 咨询师月度计划数据API
 */
import request from '@/services/api'

const BASE_URL = '/consult/consultant-plan'

/** 咨询师月度计划数据项 */
export interface ConsultantMonthlyPlanItem {
  记录ID: number
  神殿: string
  年份: number
  月份: number
  咨询师: string
  数据类型: string
  计划收入: number
  计划招生: number
  费用投入?: number
  创建时间?: string
  更新时间?: string
}

/** 咨询师月度计划列表响应 */
export interface ConsultantMonthlyPlanListResponse {
  数据列表: ConsultantMonthlyPlanItem[]
  总数: number
}

/**
 * 获取咨询师月度计划数据列表
 */
export async function getConsultantPlanList(params: {
  year: number
  campus?: string
  month?: number
  consultant?: string
  data_type?: string
}): Promise<ConsultantMonthlyPlanListResponse> {
  const response = await request.get(`${BASE_URL}/list`, { params })
  return response.data || { 数据列表: [], 总数: 0 }
}

/**
 * 获取神殿月度计划汇总（从咨询师维度聚合）
 */
export async function getCampusMonthlyPlanTotals(params: {
  year: number
  campus?: string
  data_type?: string
}): Promise<{
  data: Array<{
    神殿: string
    月份: number
    数据类型: string
    计划收入: number
    计划招生: number
    费用投入: number
  }>
  total: number
}> {
  const response = await request.get(`${BASE_URL}/campus-monthly-totals`, { params })
  return response.data || { data: [], total: 0 }
}

