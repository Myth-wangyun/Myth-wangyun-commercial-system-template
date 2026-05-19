import { api, HR_HEAVY_WRITE_TIMEOUT_MS } from '../api'

export interface DashboardSection<T = Record<string, any>> {
  rows: T[]
  warnings: Record<string, any>
}

export interface DashboardDailyResponse {
  scope: string
  month: string
  sections: Record<string, DashboardSection>
}

export interface DashboardManualRecruitmentDailyEntry {
  id?: number
  scope: string
  statDate: string
  orgName: string
  authorizedPosts: number
  currentPosts: number
  bossInviteCount: number
  zhilianInviteCount: number
  otherPlatformInviteCount: number
  plannedOptimizeCount: number
  actualOptimizeCount: number
  transferNames: string[]
  optimizeNames: string[]
  resignNames: string[]
  updatedByUserId?: number | null
  updatedByName?: string | null
  createdAt?: string
  updatedAt?: string
}

interface ApiDashboardDailyResponse {
  scope: string
  month: string
  sections: Record<string, DashboardSection>
}

interface ApiDashboardManualRecruitmentDailyEntry {
  id?: number
  scope: string
  stat_date: string
  org_name: string
  authorized_posts: number
  current_posts: number
  boss_invite_count: number
  zhilian_invite_count: number
  other_platform_invite_count: number
  planned_optimize_count: number
  actual_optimize_count: number
  transfer_names: string[]
  optimize_names: string[]
  resign_names: string[]
  updated_by_user_id?: number | null
  updated_by_name?: string | null
  created_at?: string
  updated_at?: string
}

const mapManualEntry = (
  item: ApiDashboardManualRecruitmentDailyEntry,
): DashboardManualRecruitmentDailyEntry => ({
  id: item.id,
  scope: item.scope,
  statDate: item.stat_date,
  orgName: item.org_name,
  authorizedPosts: item.authorized_posts,
  currentPosts: item.current_posts,
  bossInviteCount: item.boss_invite_count,
  zhilianInviteCount: item.zhilian_invite_count,
  otherPlatformInviteCount: item.other_platform_invite_count,
  plannedOptimizeCount: item.planned_optimize_count,
  actualOptimizeCount: item.actual_optimize_count,
  transferNames: item.transfer_names || [],
  optimizeNames: item.optimize_names || [],
  resignNames: item.resign_names || [],
  updatedByUserId: item.updated_by_user_id,
  updatedByName: item.updated_by_name,
  createdAt: item.created_at,
  updatedAt: item.updated_at,
})

export const getDashboardDaily = async (
  scope: 'hq' | 'offline' | 'online',
  month: string,
): Promise<DashboardDailyResponse> => {
  const response = await api.get<ApiDashboardDailyResponse>('/human-resources/dashboard/daily', {
    params: { scope, month },
    timeout: HR_HEAVY_WRITE_TIMEOUT_MS,
  })
  return response.data
}

export const listDashboardManualRecruitmentDaily = async (
  scope: 'hq' | 'offline' | 'online',
  month: string,
): Promise<DashboardManualRecruitmentDailyEntry[]> => {
  const response = await api.get<ApiDashboardManualRecruitmentDailyEntry[]>(
    '/human-resources/dashboard/manual/recruitment-daily',
    { params: { scope, month } },
  )
  return response.data.map(mapManualEntry)
}

export const upsertDashboardManualRecruitmentDaily = async (
  payload: DashboardManualRecruitmentDailyEntry,
): Promise<DashboardManualRecruitmentDailyEntry> => {
  const response = await api.post<ApiDashboardManualRecruitmentDailyEntry>(
    '/human-resources/dashboard/manual/recruitment-daily',
    {
      scope: payload.scope,
      stat_date: payload.statDate,
      org_name: payload.orgName,
      authorized_posts: payload.authorizedPosts,
      current_posts: payload.currentPosts,
      boss_invite_count: payload.bossInviteCount,
      zhilian_invite_count: payload.zhilianInviteCount,
      other_platform_invite_count: payload.otherPlatformInviteCount,
      planned_optimize_count: payload.plannedOptimizeCount,
      actual_optimize_count: payload.actualOptimizeCount,
      transfer_names: payload.transferNames,
      optimize_names: payload.optimizeNames,
      resign_names: payload.resignNames,
    },
    {
      timeout: HR_HEAVY_WRITE_TIMEOUT_MS,
    },
  )
  return mapManualEntry(response.data)
}
