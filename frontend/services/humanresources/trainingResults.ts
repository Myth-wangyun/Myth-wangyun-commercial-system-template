import dayjs from 'dayjs'

import { api, HR_HEAVY_WRITE_TIMEOUT_MS, parsePaginationHeaders, type PagedResult } from '../api'

interface ApiTrainingResultTraineeRecord {
  name: string
  theory_score: number
  practice_score: number
  composite_score: number
  rank: number
  remark?: string | null
}

interface ApiTrainingResultRecord {
  id: number
  campus: string
  department: string
  training_date: string
  training_hours: number
  expected_count: number
  actual_count: number
  pass_count: number
  fail_count: number
  average_score: number
  total_cost: number
  average_cost: number
  pass_rate: number
  trainees: ApiTrainingResultTraineeRecord[]
  year: string
  remark?: string | null
  created_by_user_id?: number | null
  created_by_name?: string | null
  created_at: string
  updated_at: string
}

export interface TrainingResultTraineeRecord {
  name: string
  theoryScore: number
  practiceScore: number
  compositeScore: number
  rank: number
  remark: string
}

export interface TrainingResultRecord {
  id: number
  campus: string
  department: string
  trainingDate: string
  trainingHours: number
  expectedCount: number
  actualCount: number
  passCount: number
  failCount: number
  averageScore: number
  totalCost: number
  averageCost: number
  passRate: number
  trainees: TrainingResultTraineeRecord[]
  year: string
  remark: string
  createdByUserId?: number | null
  createdByName?: string | null
  createdAt: string
  updatedAt: string
}

export interface TrainingResultTraineePayload {
  name: string
  theoryScore: number
  practiceScore: number
  remark?: string
}

export interface TrainingResultPayload {
  campus: string
  department: string
  trainingDate: string
  trainingHours: number
  expectedCount: number
  totalCost: number
  trainees: TrainingResultTraineePayload[]
  remark?: string
}

const normalizeString = (value?: string | null) => value || ''
const normalizeDate = (value: string) => dayjs(value).format('YYYY-MM-DD')

const mapTrainee = (trainee: ApiTrainingResultTraineeRecord): TrainingResultTraineeRecord => ({
  name: trainee.name,
  theoryScore: trainee.theory_score,
  practiceScore: trainee.practice_score,
  compositeScore: trainee.composite_score,
  rank: trainee.rank,
  remark: normalizeString(trainee.remark),
})

const mapRecord = (record: ApiTrainingResultRecord): TrainingResultRecord => ({
  id: record.id,
  campus: record.campus,
  department: record.department,
  trainingDate: record.training_date,
  trainingHours: record.training_hours,
  expectedCount: record.expected_count,
  actualCount: record.actual_count,
  passCount: record.pass_count,
  failCount: record.fail_count,
  averageScore: record.average_score,
  totalCost: record.total_cost,
  averageCost: record.average_cost,
  passRate: record.pass_rate,
  trainees: (record.trainees || []).map(mapTrainee),
  year: record.year,
  remark: normalizeString(record.remark),
  createdByUserId: record.created_by_user_id,
  createdByName: record.created_by_name,
  createdAt: record.created_at,
  updatedAt: record.updated_at,
})

const mapPayload = (payload: TrainingResultPayload) => ({
  campus: payload.campus,
  department: payload.department,
  training_date: normalizeDate(payload.trainingDate),
  training_hours: payload.trainingHours,
  expected_count: payload.expectedCount,
  total_cost: payload.totalCost,
  trainees: payload.trainees.map((trainee) => ({
    name: trainee.name,
    theory_score: trainee.theoryScore,
    practice_score: trainee.practiceScore,
    remark: trainee.remark || undefined,
  })),
  remark: payload.remark || undefined,
})

export async function listTrainingResults(params?: {
  year?: string
  campus?: string
  department?: string
  search?: string
}) {
  const response = await api.get<ApiTrainingResultRecord[]>('/human-resources/training-results', {
    params: {
      year: params?.year,
      campus: params?.campus,
      department: params?.department,
      search: params?.search,
    },
  })
  return response.data.map(mapRecord)
}

export async function listTrainingResultsPaged(params?: {
  year?: string
  campus?: string
  department?: string
  search?: string
  page?: number
  pageSize?: number
}): Promise<PagedResult<TrainingResultRecord>> {
  const page = params?.page ?? 1
  const pageSize = params?.pageSize ?? 10
  const response = await api.get<ApiTrainingResultRecord[]>('/human-resources/training-results', {
    params: {
      year: params?.year,
      campus: params?.campus,
      department: params?.department,
      search: params?.search,
      page,
      page_size: pageSize,
    },
  })
  const meta = parsePaginationHeaders(response.headers, page, pageSize)
  return {
    items: response.data.map(mapRecord),
    total: meta.total,
    page: meta.page,
    pageSize: meta.pageSize,
  }
}

export async function getTrainingResult(id: number) {
  const response = await api.get<ApiTrainingResultRecord>(`/human-resources/training-results/${id}`)
  return mapRecord(response.data)
}

export async function createTrainingResult(payload: TrainingResultPayload) {
  const response = await api.post<ApiTrainingResultRecord>(
    '/human-resources/training-results',
    mapPayload(payload),
    { timeout: HR_HEAVY_WRITE_TIMEOUT_MS },
  )
  return mapRecord(response.data)
}

export async function updateTrainingResult(id: number, payload: TrainingResultPayload) {
  const response = await api.put<ApiTrainingResultRecord>(
    `/human-resources/training-results/${id}`,
    mapPayload(payload),
    { timeout: HR_HEAVY_WRITE_TIMEOUT_MS },
  )
  return mapRecord(response.data)
}

export async function deleteTrainingResult(id: number) {
  await api.delete(`/human-resources/training-results/${id}`, {
    timeout: HR_HEAVY_WRITE_TIMEOUT_MS,
  })
}
