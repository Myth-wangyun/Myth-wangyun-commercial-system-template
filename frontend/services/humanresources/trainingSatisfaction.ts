import { api, HR_HEAVY_WRITE_TIMEOUT_MS, parsePaginationHeaders, type PagedResult } from '../api'
import dayjs from 'dayjs'

export type TrainingSatisfactionScoreLevel = 5 | 4 | 3 | 2 | 1 | 0

interface ApiTrainingSatisfactionRecord {
  id: number
  department: string
  training_date: string
  training_location: string
  course_content: string
  trainer: string
  scores: Record<string, number>
  section_totals: {
    course_content: number
    trainer: number
    training_method: number
  }
  total_score: number
  open_q4?: string | null
  open_q5?: string | null
  open_q6?: string | null
  year: string
  remark?: string | null
  created_by_user_id?: number | null
  created_by_name?: string | null
  created_at: string
  updated_at: string
}

export interface TrainingSatisfactionRecord {
  id: number
  department: string
  trainingDate: string
  trainingLocation: string
  courseContent: string
  trainer: string
  scores: Record<string, TrainingSatisfactionScoreLevel>
  sectionTotals: {
    courseContent: number
    trainer: number
    trainingMethod: number
  }
  totalScore: number
  openQ4: string
  openQ5: string
  openQ6: string
  year: string
  remark: string
  createdByUserId?: number | null
  createdByName?: string | null
  createdAt: string
  updatedAt: string
}

export interface TrainingSatisfactionPayload {
  department: string
  trainingDate: string
  trainingLocation: string
  courseContent: string
  trainer: string
  scores: Record<string, TrainingSatisfactionScoreLevel>
  openQ4?: string
  openQ5?: string
  openQ6?: string
  remark?: string
}

const normalizeString = (value?: string | null) => value || ''

const normalizeDate = (value: string) => dayjs(value).format('YYYY-MM-DD')

const mapScores = (scores: Record<string, number>) =>
  Object.fromEntries(
    Object.entries(scores || {}).map(([key, value]) => [
      key,
      value as TrainingSatisfactionScoreLevel,
    ]),
  ) as Record<string, TrainingSatisfactionScoreLevel>

const mapRecord = (record: ApiTrainingSatisfactionRecord): TrainingSatisfactionRecord => ({
  id: record.id,
  department: record.department,
  trainingDate: record.training_date,
  trainingLocation: record.training_location,
  courseContent: record.course_content,
  trainer: record.trainer,
  scores: mapScores(record.scores),
  sectionTotals: {
    courseContent: record.section_totals.course_content,
    trainer: record.section_totals.trainer,
    trainingMethod: record.section_totals.training_method,
  },
  totalScore: record.total_score,
  openQ4: normalizeString(record.open_q4),
  openQ5: normalizeString(record.open_q5),
  openQ6: normalizeString(record.open_q6),
  year: record.year,
  remark: normalizeString(record.remark),
  createdByUserId: record.created_by_user_id,
  createdByName: record.created_by_name,
  createdAt: record.created_at,
  updatedAt: record.updated_at,
})

const mapPayload = (payload: TrainingSatisfactionPayload) => ({
  department: payload.department,
  training_date: normalizeDate(payload.trainingDate),
  training_location: payload.trainingLocation,
  course_content: payload.courseContent,
  trainer: payload.trainer,
  scores: payload.scores,
  open_q4: payload.openQ4 || undefined,
  open_q5: payload.openQ5 || undefined,
  open_q6: payload.openQ6 || undefined,
  remark: payload.remark || undefined,
})

export async function listTrainingSatisfactionSurveys(params?: {
  year?: string
  department?: string
  search?: string
}) {
  const response = await api.get<ApiTrainingSatisfactionRecord[]>(
    '/human-resources/training-satisfaction-surveys',
    {
      params: {
        year: params?.year,
        department: params?.department,
        search: params?.search,
      },
    },
  )
  return response.data.map(mapRecord)
}

export async function listTrainingSatisfactionSurveysPaged(params?: {
  year?: string
  department?: string
  search?: string
  page?: number
  pageSize?: number
}): Promise<PagedResult<TrainingSatisfactionRecord>> {
  const page = params?.page ?? 1
  const pageSize = params?.pageSize ?? 10
  const response = await api.get<ApiTrainingSatisfactionRecord[]>(
    '/human-resources/training-satisfaction-surveys',
    {
      params: {
        year: params?.year,
        department: params?.department,
        search: params?.search,
        page,
        page_size: pageSize,
      },
    },
  )
  const meta = parsePaginationHeaders(response.headers, page, pageSize)
  return {
    items: response.data.map(mapRecord),
    total: meta.total,
    page: meta.page,
    pageSize: meta.pageSize,
  }
}

export async function getTrainingSatisfactionSurvey(id: number) {
  const response = await api.get<ApiTrainingSatisfactionRecord>(
    `/human-resources/training-satisfaction-surveys/${id}`,
  )
  return mapRecord(response.data)
}

export async function createTrainingSatisfactionSurvey(payload: TrainingSatisfactionPayload) {
  const response = await api.post<ApiTrainingSatisfactionRecord>(
    '/human-resources/training-satisfaction-surveys',
    mapPayload(payload),
    { timeout: HR_HEAVY_WRITE_TIMEOUT_MS },
  )
  return mapRecord(response.data)
}

export async function updateTrainingSatisfactionSurvey(
  id: number,
  payload: TrainingSatisfactionPayload,
) {
  const response = await api.put<ApiTrainingSatisfactionRecord>(
    `/human-resources/training-satisfaction-surveys/${id}`,
    mapPayload(payload),
    { timeout: HR_HEAVY_WRITE_TIMEOUT_MS },
  )
  return mapRecord(response.data)
}

export async function deleteTrainingSatisfactionSurvey(id: number) {
  await api.delete(`/human-resources/training-satisfaction-surveys/${id}`)
}
