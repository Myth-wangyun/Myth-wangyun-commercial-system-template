import { api, HR_HEAVY_WRITE_TIMEOUT_MS } from '../api'

export interface PerformanceFactRecord {
  id?: number
  scope: string
  orgKind: string
  orgName: string
  statMonth: string
  userId?: number | null
  personName?: string
  positionCategory?: string | null
  averageScore: number
  leaderAverageScore: number
  staffAverageScore: number
  remark?: string | null
}

interface ApiPerformanceFactRecord {
  id?: number
  scope: string
  org_kind: string
  org_name: string
  stat_month: string
  user_id?: number | null
  person_name?: string
  position_category?: string | null
  average_score: number
  leader_average_score: number
  staff_average_score: number
  remark?: string | null
}

const mapRecord = (item: ApiPerformanceFactRecord): PerformanceFactRecord => ({
  id: item.id,
  scope: item.scope,
  orgKind: item.org_kind,
  orgName: item.org_name,
  statMonth: item.stat_month,
  userId: item.user_id,
  personName: item.person_name,
  positionCategory: item.position_category,
  averageScore: item.average_score,
  leaderAverageScore: item.leader_average_score,
  staffAverageScore: item.staff_average_score,
  remark: item.remark,
})

export const listPerformanceFacts = async (params: {
  scope: 'hq' | 'offline' | 'online'
  startMonth?: string
  endMonth?: string
  orgName?: string
}) => {
  const response = await api.get<ApiPerformanceFactRecord[]>('/human-resources/performance-facts', {
    params: {
      scope: params.scope,
      start_month: params.startMonth,
      end_month: params.endMonth,
      org_name: params.orgName,
    },
  })
  return response.data.map(mapRecord)
}

export const createPerformanceFact = async (payload: PerformanceFactRecord) => {
  const response = await api.post<ApiPerformanceFactRecord>(
    '/human-resources/performance-facts',
    {
      scope: payload.scope,
      org_kind: payload.orgKind,
      org_name: payload.orgName,
      stat_month: payload.statMonth,
      user_id: payload.userId ?? null,
      person_name: payload.personName ?? '',
      position_category: payload.positionCategory ?? null,
      average_score: payload.averageScore,
      leader_average_score: payload.leaderAverageScore,
      staff_average_score: payload.staffAverageScore,
      remark: payload.remark ?? null,
    },
    {
      timeout: HR_HEAVY_WRITE_TIMEOUT_MS,
    },
  )
  return mapRecord(response.data)
}

export const updatePerformanceFact = async (recordId: number, payload: Partial<PerformanceFactRecord>) => {
  const response = await api.put<ApiPerformanceFactRecord>(
    `/human-resources/performance-facts/${recordId}`,
    {
      org_kind: payload.orgKind,
      org_name: payload.orgName,
      stat_month: payload.statMonth,
      user_id: payload.userId,
      person_name: payload.personName,
      position_category: payload.positionCategory,
      average_score: payload.averageScore,
      leader_average_score: payload.leaderAverageScore,
      staff_average_score: payload.staffAverageScore,
      remark: payload.remark,
    },
    {
      timeout: HR_HEAVY_WRITE_TIMEOUT_MS,
    },
  )
  return mapRecord(response.data)
}
