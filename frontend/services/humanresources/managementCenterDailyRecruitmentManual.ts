import { api, HR_HEAVY_WRITE_TIMEOUT_MS } from '../api'

interface ApiManagementCenterDailyRecruitmentManualEntry {
  id: number
  stat_date: string
  department: string
  authorized_posts: number
  current_posts: number
  planned_optimize_count: number
  actual_optimize_count: number
  transfer_names: string[]
  optimize_names: string[]
  resign_names: string[]
  updated_by_user_id?: number | null
  updated_by_name?: string | null
  created_at: string
  updated_at: string
}

export interface ManagementCenterDailyRecruitmentManualEntry {
  id: number
  statDate: string
  department: string
  authorizedPosts: number
  currentPosts: number
  plannedOptimizeCount: number
  actualOptimizeCount: number
  transferNames: string[]
  optimizeNames: string[]
  resignNames: string[]
  updatedByUserId?: number | null
  updatedByName?: string | null
  createdAt: string
  updatedAt: string
}

export interface ManagementCenterDailyRecruitmentManualPayload {
  statDate: string
  department: string
  authorizedPosts: number
  currentPosts: number
  plannedOptimizeCount: number
  actualOptimizeCount: number
  transferNames: string[]
  optimizeNames: string[]
  resignNames: string[]
}

const mapRecord = (
  record: ApiManagementCenterDailyRecruitmentManualEntry,
): ManagementCenterDailyRecruitmentManualEntry => ({
  id: record.id,
  statDate: record.stat_date,
  department: record.department,
  authorizedPosts: record.authorized_posts || 0,
  currentPosts: record.current_posts || 0,
  plannedOptimizeCount: record.planned_optimize_count || 0,
  actualOptimizeCount: record.actual_optimize_count || 0,
  transferNames: record.transfer_names || [],
  optimizeNames: record.optimize_names || [],
  resignNames: record.resign_names || [],
  updatedByUserId: record.updated_by_user_id,
  updatedByName: record.updated_by_name,
  createdAt: record.created_at,
  updatedAt: record.updated_at,
})

const mapPayload = (payload: ManagementCenterDailyRecruitmentManualPayload) => ({
  stat_date: payload.statDate,
  department: payload.department,
  authorized_posts: payload.authorizedPosts,
  current_posts: payload.currentPosts,
  planned_optimize_count: payload.plannedOptimizeCount,
  actual_optimize_count: payload.actualOptimizeCount,
  transfer_names: payload.transferNames,
  optimize_names: payload.optimizeNames,
  resign_names: payload.resignNames,
})

export async function listManagementCenterDailyRecruitmentManualEntries(month: string) {
  const response = await api.get<ApiManagementCenterDailyRecruitmentManualEntry[]>(
    '/human-resources/management-center-daily-recruitment-manuals',
    {
      params: { month },
    },
  )
  return response.data.map(mapRecord)
}

export async function upsertManagementCenterDailyRecruitmentManualEntry(
  payload: ManagementCenterDailyRecruitmentManualPayload,
) {
  const response = await api.put<ApiManagementCenterDailyRecruitmentManualEntry>(
    '/human-resources/management-center-daily-recruitment-manuals',
    mapPayload(payload),
    {
      timeout: HR_HEAVY_WRITE_TIMEOUT_MS,
    },
  )
  return mapRecord(response.data)
}
