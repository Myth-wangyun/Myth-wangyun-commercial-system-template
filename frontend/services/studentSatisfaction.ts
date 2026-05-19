// [教质模块] 学员满意度汇总表服务
/**
 * 学员满意度汇总表服务
 */

import { api } from './api'

export interface SatisfactionBackendRow {
  记录ID?: number
  序号: number
  姓名?: string
  m1?: number
  m2?: number
  m3?: number
  m4?: number
  m5?: number
  m6?: number
  m7?: number
  m8?: number
  m9?: number
  m10?: number
  m11?: number
  m12?: number
}

export interface SatisfactionPayload {
  神殿名称: string
  年份: number
  行数据: SatisfactionBackendRow[]
}

export interface SatisfactionResponse {
  神殿名称: string
  年份: number
  行数据: SatisfactionBackendRow[]
  创建时间?: string
  更新时间?: string
}

export const getSatisfaction = async (campus: string, year: number): Promise<SatisfactionResponse> => {
  try {
    const res = await api.get<SatisfactionResponse>(
      `/student-satisfaction-summary/${encodeURIComponent(campus)}/${year}`,
    )
    return res.data
  } catch (error: any) {
    if (error.response?.status === 404 || error.response?.status === 500) {
      return { 神殿名称: campus, 年份: year, 行数据: [] }
    }
    throw error
  }
}

export const saveSatisfaction = async (
  campus: string,
  year: number,
  rows: SatisfactionBackendRow[],
): Promise<SatisfactionResponse> => {
  const payload: SatisfactionPayload = {
    神殿名称: campus,
    年份: year,
    行数据: rows,
  }

  const existing = await getSatisfaction(campus, year)
  if (existing.行数据 && existing.行数据.length > 0) {
    const res = await api.put<SatisfactionResponse>(
      `/student-satisfaction-summary/${encodeURIComponent(campus)}/${year}`,
      { 行数据: rows },
    )
    return res.data
  }
  const res = await api.post<SatisfactionResponse>('/student-satisfaction-summary/', payload)
  return res.data
}
