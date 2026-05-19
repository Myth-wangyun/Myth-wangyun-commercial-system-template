// [教质模块] 口碑招生关键点服务
import { api } from './api'

export interface ReputationKeyPointDetail {
  id?: number
  campus_name: string
  year: number
  month: number
  teacher_name: string
  wechat_moments_count: number
  douyin_count: number
  kuaishou_count: number
  xiaohongshu_count: number
  current_student_interview_count: number
  graduate_interview_count: number
  online_total?: number
  interview_total?: number
}

export interface ReputationKeyPointResponse {
  campus_name: string
  year: number
  records: ReputationKeyPointDetail[]
}

export const fetchReputationKeyPoints = async (params: {
  campus: string
  year: number
  class_code?: string
}) => {
  const res = await api.get<ReputationKeyPointResponse>('/reputation-key-points', {
    params,
  })
  return res.data
}

export const saveReputationKeyPoints = async (payload: {
  campus_name: string
  year: number
  class_code?: string
  records: ReputationKeyPointDetail[]
}) => {
  const res = await api.post<ReputationKeyPointResponse>('/reputation-key-points', payload)
  return res.data
}
