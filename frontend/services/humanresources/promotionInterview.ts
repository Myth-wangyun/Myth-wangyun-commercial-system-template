import { api } from '../api'

export type PromotionInterviewPerformanceType = 'p1' | 'p2' | 'p3'
export type PromotionInterviewStatus = 'draft' | 'submitted' | 'approved' | 'rejected'

interface ApiPromotionInterviewRecord {
  id: number
  name: string
  department: string
  position: string
  campus: string
  interview_date: string
  interviewer?: string | null
  performance_type: PromotionInterviewPerformanceType
  scores: Record<string, number>
  total_score: number
  is_qualified: boolean
  status: PromotionInterviewStatus
  created_by_user_id?: number | null
  created_by_name?: string | null
  created_at: string
  updated_at: string
}

export interface PromotionInterviewRecord {
  id: number
  name: string
  department: string
  position: string
  campus: string
  interviewDate: string
  interviewer: string
  performanceType: PromotionInterviewPerformanceType
  scores: Record<string, number>
  totalScore: number
  isQualified: boolean
  status: PromotionInterviewStatus
  createdByUserId?: number | null
  createdByName?: string | null
  createdAt: string
  updatedAt: string
}

export interface PromotionInterviewPayload {
  name: string
  department: string
  position: string
  campus: string
  interviewDate: string
  interviewer?: string
  performanceType: PromotionInterviewPerformanceType
  scores: Record<string, number>
  status?: PromotionInterviewStatus
}

const normalizeString = (value?: string | null) => value || ''

const mapRecord = (record: ApiPromotionInterviewRecord): PromotionInterviewRecord => ({
  id: record.id,
  name: record.name,
  department: record.department,
  position: record.position,
  campus: record.campus,
  interviewDate: record.interview_date,
  interviewer: normalizeString(record.interviewer),
  performanceType: record.performance_type,
  scores: record.scores || {},
  totalScore: record.total_score,
  isQualified: record.is_qualified,
  status: record.status,
  createdByUserId: record.created_by_user_id,
  createdByName: record.created_by_name,
  createdAt: record.created_at,
  updatedAt: record.updated_at,
})

const mapPayload = (payload: PromotionInterviewPayload) => ({
  name: payload.name,
  department: payload.department,
  position: payload.position,
  campus: payload.campus,
  interview_date: payload.interviewDate,
  interviewer: payload.interviewer || undefined,
  performance_type: payload.performanceType,
  scores: payload.scores,
  status: payload.status || 'draft',
})

export async function listPromotionInterviews(params?: {
  campus?: string
  department?: string
  status?: PromotionInterviewStatus
  search?: string
}) {
  const response = await api.get<ApiPromotionInterviewRecord[]>('/human-resources/promotion-interviews', {
    params: {
      campus: params?.campus,
      department: params?.department,
      status: params?.status,
      search: params?.search,
    },
  })
  return response.data.map(mapRecord)
}

export async function getPromotionInterview(id: number) {
  const response = await api.get<ApiPromotionInterviewRecord>(`/human-resources/promotion-interviews/${id}`)
  return mapRecord(response.data)
}

export async function createPromotionInterview(payload: PromotionInterviewPayload) {
  const response = await api.post<ApiPromotionInterviewRecord>(
    '/human-resources/promotion-interviews',
    mapPayload(payload),
  )
  return mapRecord(response.data)
}

export async function updatePromotionInterview(id: number, payload: PromotionInterviewPayload) {
  const response = await api.put<ApiPromotionInterviewRecord>(
    `/human-resources/promotion-interviews/${id}`,
    mapPayload(payload),
  )
  return mapRecord(response.data)
}

export async function deletePromotionInterview(id: number) {
  await api.delete(`/human-resources/promotion-interviews/${id}`)
}
