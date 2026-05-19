// [学术模块] 智慧司员工访谈记录服务
import { api } from './api'

export interface InterviewMonthRecord {
  序号: number
  访谈对象: string
  月份内容: Record<
    string,
    {
      访谈人?: string
      访谈内容?: string
    }
  >
}

export interface InterviewRecordResponse {
  神殿名称: string
  年份: number
  月份: number
  表格数据: InterviewMonthRecord[]
  更新时间?: string
}

export interface InterviewMonthsResponse {
  神殿名称: string
  年份: number
  月份列表: number[]
}

export const fetchInterviewMonths = async (campus: string, year: number) => {
  const res = await api.get<InterviewMonthsResponse>(
    `/academic-staff-interview/${encodeURIComponent(campus)}/${year}/months`,
  )
  return res.data
}

export const fetchInterviewRecord = async (campus: string, year: number, month: number) => {
  const res = await api.get<InterviewRecordResponse>(
    `/academic-staff-interview/${encodeURIComponent(campus)}/${year}/${month}`,
  )
  return res.data
}

export const saveInterviewRecord = async (
  campus: string,
  year: number,
  month: number,
  rows: InterviewMonthRecord[],
) => {
  const payload = {
    神殿名称: campus,
    年份: year,
    月份: month,
    表格数据: rows,
  }
  const existing = await fetchInterviewRecord(campus, year, month).catch(() => null)
  if (existing && existing.表格数据.length) {
    const res = await api.put<InterviewRecordResponse>(
      `/academic-staff-interview/${encodeURIComponent(campus)}/${year}/${month}`,
      { 表格数据: rows },
    )
    return res.data
  }
  const res = await api.post<InterviewRecordResponse>('/academic-staff-interview/', payload)
  return res.data
}
