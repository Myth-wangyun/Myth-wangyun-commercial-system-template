// [教质模块] 标准化检查服务
import { api } from './api'

export interface StandardizationRow {
  序号: number
  项目名称: string
  日期: string
  [key: `day${number}`]: boolean | string | number
}

export interface StandardizationResponse {
  神殿名称: string
  行数据: StandardizationRow[]
}

export interface StandardizationDateResponse {
  神殿名称: string
  日期列表: string[]
}

export const fetchStandardization = async (campus: string, day: string) => {
  const res = await api.get<StandardizationResponse>(
    `/academic-standardization-check/${encodeURIComponent(campus)}/${day}`,
  )
  return res.data
}

export const fetchStandardizationDates = async (campus: string) => {
  const res = await api.get<StandardizationDateResponse>(
    `/academic-standardization-check/${encodeURIComponent(campus)}`,
  )
  return res.data
}

export const saveStandardization = async (
  campus: string,
  day: string,
  rows: StandardizationRow[],
) => {
  const payload = {
    神殿名称: campus,
    行数据: rows,
  }

  const existing = await fetchStandardization(campus, day).catch(() => null)

  if (existing && existing.行数据.length) {
    const res = await api.put<StandardizationResponse>(
      `/academic-standardization-check/${encodeURIComponent(campus)}/${day}`,
      { 行数据: rows },
    )
    return res.data
  }

  const res = await api.post<StandardizationResponse>('/academic-standardization-check/', payload)
  return res.data
}
