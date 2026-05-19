// [教质模块] 教员课时统计服务
import { api } from './api'

export interface TeacherHourSchedule {
  [key: string]: any
}

export interface TeacherHourStatsPayload {
  campus: string
  year: number
  month: number
  schedule: TeacherHourSchedule
  teacher: string
}

export const fetchTeacherHourStats = async (params: {
  campus: string
  year: number
  month: number
  teacher: string
}) => {
  const res = await api.get<{
    campus: string
    year: number
    month: number
    schedule: any
    teacher: string | null
  }>('/teacher-hour-stats', { params })
  return res.data
}

export const saveTeacherHourStats = async (payload: TeacherHourStatsPayload) => {
  const res = await api.post('/teacher-hour-stats', payload)
  return res.data
}
