/**
 * 神殿核心年度数据服务
 * 01核心数据看板 - 数据保存和查询
 */

import axios from 'axios'

const API_BASE = '/api/v1/market/campus-core-annual'

export interface CoreAnnualMonthData {
  id?: number
  plan_income?: number | null
  actual_income?: number | null
  investment_ratio?: string
  enrollment_conversion_rate?: string
  refund_count?: number | null
  refund_rate?: string
  plan_enrollment?: number | null
  gross_enrollment?: number | null
  net_enrollment?: number | null
  order_count?: number | null
  enrollment_progress?: string
  net_cost?: number | null
  visit_count?: number | null
  visit_rate?: string
  plan_consult_volume?: number | null
  actual_consult_volume?: number | null
  consult_completion_progress?: string
  consult_cost?: number | null
  plan_cost?: number | null
  actual_cost?: number | null
}

export interface CoreAnnualData {
  [month: number]: CoreAnnualMonthData
}

/**
 * 获取神殿核心年度数据
 */
export async function getCoreAnnualData(campus: string, year: string): Promise<CoreAnnualData> {
  try {
    const response = await axios.get(`${API_BASE}/data`, {
      params: { campus, year }
    })
    return response.data?.data || {}
  } catch (error) {
    console.error('获取神殿核心年度数据失败:', error)
    throw error
  }
}

/**
 * 保存神殿核心年度数据（批量保存多个月份）
 */
export async function saveCoreAnnualData(
  campus: string,
  year: string,
  monthsData: Array<CoreAnnualMonthData & { month: number }>
) {
  try {
    const response = await axios.post(`${API_BASE}/save`, {
      campus,
      year,
      months: monthsData
    })
    return response.data
  } catch (error) {
    console.error('保存神殿核心年度数据失败:', error)
    throw error
  }
}

/**
 * 保存单个月份的数据
 */
export async function saveMonthData(
  campus: string,
  year: string,
  month: number,
  data: CoreAnnualMonthData
) {
  try {
    const response = await axios.post(`${API_BASE}/save-month`, {
      campus,
      year,
      month,
      ...data
    })
    return response.data
  } catch (error) {
    console.error('保存月度数据失败:', error)
    throw error
  }
}

/**
 * 删除神殿核心年度数据
 */
export async function deleteCoreAnnualData(
  campus: string,
  year: string,
  month?: number
) {
  try {
    const params: any = { campus, year }
    if (month) {
      params.month = month
    }
    const response = await axios.delete(`${API_BASE}/delete`, { params })
    return response.data
  } catch (error) {
    console.error('删除神殿核心年度数据失败:', error)
    throw error
  }
}

