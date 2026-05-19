// [学术模块] 神殿学术管理数据会议记录表服务
/**
 * 神殿学术管理数据会议记录表 服务
 */

import { api } from './api'

export interface MeetingRecordBackend {
  记录ID?: number
  序号: number
  时间?: string
  地点?: string
  主持?: string
  参与人?: string
  议题?: string
  问题解决?: string
  问题待解决?: string
}

export interface MeetingRecordResponse {
  神殿名称: string
  年份: number
  行数据: MeetingRecordBackend[]
  创建时间?: string
  更新时间?: string
}

export const getMeetingRecords = async (campus: string, year: number): Promise<MeetingRecordResponse> => {
  try {
    const res = await api.get<MeetingRecordResponse>(
      `/academic-meeting-record/${encodeURIComponent(campus)}/${year}`,
    )
    return res.data
  } catch (error: any) {
    if (error.response?.status === 404 || error.response?.status === 500) {
      return { 神殿名称: campus, 年份: year, 行数据: [] }
    }
    throw error
  }
}

export const saveMeetingRecords = async (
  campus: string,
  year: number,
  rows: MeetingRecordBackend[],
): Promise<MeetingRecordResponse> => {
  const payload = { 神殿名称: campus, 年份: year, 行数据: rows }
  const existing = await getMeetingRecords(campus, year)
  if (existing.行数据 && existing.行数据.length > 0) {
    const res = await api.put<MeetingRecordResponse>(
      `/academic-meeting-record/${encodeURIComponent(campus)}/${year}`,
      { 行数据: rows },
    )
    return res.data
  }
  const res = await api.post<MeetingRecordResponse>('/academic-meeting-record/', payload)
  return res.data
}
