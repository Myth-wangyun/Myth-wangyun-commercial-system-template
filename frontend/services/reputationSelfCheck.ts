// [教质模块] 口碑招生自查服务
import { api } from './api'

export interface SelfCheckDayData {
  newStudentCount?: number
  newStudentNames?: string
  newStudentRecordFilled?: boolean
  newStudentOnlineWorks?: boolean
  oldStudentCount?: number
  oldStudentClass?: string
  oldStudentNames?: string
  oldStudentRecordFilled?: boolean
  graduateCount?: number
  graduateNames?: string
  graduateRecordFilled?: boolean
  wechatMoments?: number
  douyin?: number
  kuaishou?: number
  xiaohongshu?: number
  dailyTotal?: number
}

export interface SelfCheckRecord {
  id?: string
  campus: string
  teacherName: string
  year: number
  month: number
  dailyData: Record<string, SelfCheckDayData>
  monthlyTotals?: {
    newStudentTotal: number
    oldStudentTotal: number
    graduateTotal: number
    wechatMomentsTotal: number
    douyinTotal: number
    kuaishouTotal: number
    xiaohongshuTotal: number
    grandTotal: number
  }
}

interface SelfCheckResponse {
  records: Array<{
    id: number
    campus_name: string
    teacher_name: string
    year: number
    month: number
    daily_data: Record<string, SelfCheckDayData>
    monthlyTotals: SelfCheckRecord['monthlyTotals']
  }>
}

export const fetchSelfCheckRecords = async (params: {
  campus: string
  year: number
  month?: number
}): Promise<SelfCheckRecord[]> => {
  const res = await api.get<SelfCheckResponse>('/reputation-self-check', { params })
  return res.data.records.map((item) => ({
    id: item.id?.toString(),
    campus: item.campus_name,
    teacherName: item.teacher_name,
    year: item.year,
    month: item.month,
    dailyData: item.daily_data || {},
    monthlyTotals: item.monthlyTotals || {
      newStudentTotal: 0,
      oldStudentTotal: 0,
      graduateTotal: 0,
      wechatMomentsTotal: 0,
      douyinTotal: 0,
      kuaishouTotal: 0,
      xiaohongshuTotal: 0,
      grandTotal: 0,
    },
  }))
}

export const saveSelfCheckRecord = async (payload: SelfCheckRecord) => {
  const body = {
    id: payload.id ? Number(payload.id) : undefined,
    campus_name: payload.campus,
    teacher_name: payload.teacherName,
    year: payload.year,
    month: payload.month,
    daily_data: payload.dailyData,
  }
  const res = await api.post('/reputation-self-check', body)
  return res.data
}
