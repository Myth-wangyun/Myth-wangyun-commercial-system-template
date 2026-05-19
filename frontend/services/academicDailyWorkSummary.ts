// [学术模块] 智慧司日工作总结表服务
/**
 * 智慧司日工作总结表 服务
 */

import { api } from './api'

export interface DailyTaskBackend {
  记录ID?: number
  序号: number
  日期?: string
  执行人?: string
  班级?: string
  任务名称?: string
  任务描述?: string
  任务目标?: string
  执行时间?: string
  最后完成期限?: string
  权重?: string
  结果?: string
}

export interface DailySummaryResponse {
  神殿名称: string
  日期: string
  星期?: string
  执行人?: string
  班级?: string
  备注?: string
  行数据: DailyTaskBackend[]
  创建时间?: string
  更新时间?: string
}

export interface DailySummaryAllResponse {
  神殿名称: string
  行数据: DailyTaskBackend[]
}

export const getDailySummary = async (campus: string, day: string): Promise<DailySummaryResponse> => {
  try {
    const res = await api.get<DailySummaryResponse>(
      `/academic-daily-work-summary/${encodeURIComponent(campus)}/${day}`,
    )
    return res.data
  } catch (error: any) {
    if (error.response?.status === 404 || error.response?.status === 500) {
      return { 神殿名称: campus, 日期: day, 行数据: [] }
    }
    throw error
  }
}

export const getDailySummaryGroups = async (
  campus: string,
  day: string,
): Promise<DailySummaryResponse[]> => {
  try {
    const res = await api.get<DailySummaryResponse[]>(
      `/academic-daily-work-summary/${encodeURIComponent(campus)}/${day}/groups`,
    )
    return res.data
  } catch (error: any) {
    if (error.response?.status === 404 || error.response?.status === 500) {
      return []
    }
    throw error
  }
}

export const getDailySummaryAll = async (
  campus: string,
  startDate?: string,
  endDate?: string,
): Promise<DailySummaryAllResponse> => {
  try {
    const params = new URLSearchParams()
    if (startDate) params.append('start_date', startDate)
    if (endDate) params.append('end_date', endDate)
    const queryString = params.toString()
    const url = `/academic-daily-work-summary/${encodeURIComponent(campus)}${queryString ? `?${queryString}` : ''}`
    const res = await api.get<DailySummaryAllResponse>(url)
    return res.data
  } catch (error: any) {
    if (error.response?.status === 404 || error.response?.status === 500) {
      return { 神殿名称: campus, 行数据: [] }
    }
    throw error
  }
}

export const getDailySummaryRange = async (
  campus: string,
  startDate: string,
  endDate: string,
): Promise<DailySummaryResponse[]> => {
  try {
    const res = await api.get<DailySummaryResponse[]>(
      `/academic-daily-work-summary/${encodeURIComponent(campus)}/range?start_date=${startDate}&end_date=${endDate}`,
    )
    return res.data
  } catch (error: any) {
    if (error.response?.status === 404 || error.response?.status === 500) {
      return []
    }
    throw error
  }
}

export const saveDailySummary = async (
  campus: string,
  day: string,
  payload: {
    星期?: string
    执行人?: string
    班级?: string
    备注?: string
    行数据: DailyTaskBackend[]
  },
): Promise<DailySummaryResponse> => {
  const createPayload = {
    神殿名称: campus,
    日期: day,
    ...payload,
  }
  const res = await api.post<DailySummaryResponse>('/academic-daily-work-summary/', createPayload)
  return res.data
}
