import { api } from '../api'

export type TrainingGoalLevel =
  | '新员工岗前培训'
  | '基层员工脱产培训'
  | '中层脱产培训'
  | '高层脱产培训'

export type TrainingGoalParentCategory =
  | '价值观正'
  | '责任心强'
  | '执行力高'
  | '业务能力'
  | '职业化充分'
  | '梯队建设'

interface ApiTrainingGoalRecord {
  id: number
  parent_category: TrainingGoalParentCategory
  sub_category: string
  level: TrainingGoalLevel
  objectives: string[]
  year: string
  remark?: string | null
  created_by_user_id?: number | null
  created_by_name?: string | null
  created_at: string
  updated_at: string
}

export interface TrainingGoalRecord {
  id: number
  parentCategory: TrainingGoalParentCategory
  subCategory: string
  level: TrainingGoalLevel
  objectives: string[]
  year: string
  remark: string
  createdByUserId?: number | null
  createdByName?: string | null
  createdAt: string
  updatedAt: string
}

export interface TrainingGoalPayload {
  parentCategory: TrainingGoalParentCategory
  subCategory: string
  level: TrainingGoalLevel
  objectives: string[]
  year: string
  remark?: string
}

const normalizeString = (value?: string | null) => value || ''

const mapRecord = (record: ApiTrainingGoalRecord): TrainingGoalRecord => ({
  id: record.id,
  parentCategory: record.parent_category,
  subCategory: record.sub_category,
  level: record.level,
  objectives: Array.isArray(record.objectives) ? record.objectives.filter(Boolean) : [],
  year: record.year,
  remark: normalizeString(record.remark),
  createdByUserId: record.created_by_user_id,
  createdByName: record.created_by_name,
  createdAt: record.created_at,
  updatedAt: record.updated_at,
})

const mapPayload = (payload: TrainingGoalPayload) => ({
  parent_category: payload.parentCategory,
  sub_category: payload.subCategory,
  level: payload.level,
  objectives: payload.objectives,
  year: payload.year,
  remark: payload.remark !== undefined ? payload.remark : undefined,
})

export async function listTrainingGoals(params?: {
  year?: string
  parentCategory?: TrainingGoalParentCategory
  level?: TrainingGoalLevel
  search?: string
}) {
  const response = await api.get<ApiTrainingGoalRecord[]>('/human-resources/training-goals', {
    params: {
      year: params?.year,
      parent_category: params?.parentCategory,
      level: params?.level,
      search: params?.search,
    },
  })
  return response.data.map(mapRecord)
}

export async function getTrainingGoal(id: number) {
  const response = await api.get<ApiTrainingGoalRecord>(`/human-resources/training-goals/${id}`)
  return mapRecord(response.data)
}

export async function createTrainingGoal(payload: TrainingGoalPayload) {
  const response = await api.post<ApiTrainingGoalRecord>(
    '/human-resources/training-goals',
    mapPayload(payload),
  )
  return mapRecord(response.data)
}

export async function updateTrainingGoal(id: number, payload: TrainingGoalPayload) {
  const response = await api.put<ApiTrainingGoalRecord>(
    `/human-resources/training-goals/${id}`,
    mapPayload(payload),
  )
  return mapRecord(response.data)
}

export async function deleteTrainingGoal(id: number) {
  await api.delete(`/human-resources/training-goals/${id}`)
}
