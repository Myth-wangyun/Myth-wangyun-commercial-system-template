/**
 * 祈福司培训月度表 API
 */
import api from '@/services/api'

const API_BASE = '/consult'

export interface MonthlyTrainingData {
  trainingSessions: number | null
  trainedPeople: number | null
  qualifiedPeople: number | null
  passRate: string
}

export interface MonthlyRow {
  month: string
  preJobTraining: MonthlyTrainingData
  specialTraining1: MonthlyTrainingData
  specialTraining2: MonthlyTrainingData
  externalConsulting: MonthlyTrainingData
  otherTypes: MonthlyTrainingData
  remarks: string
}

export interface TrainingMonthlyRecord {
  记录ID?: number
  年份: number
  岗位: string
  月度数据: Record<string, MonthlyRow>
  神殿?: string
  创建人ID?: number
  创建人姓名?: string
  创建时间?: string
  更新时间?: string
}

export interface TrainingMonthlyListResponse {
  total: number
  items: TrainingMonthlyRecord[]
}

/**
 * 创建培训月度记录
 */
export function createTrainingMonthly(data: TrainingMonthlyRecord) {
  return api.request({
    url: `${API_BASE}/training-monthly`,
    method: 'post',
    data,
  })
}

/**
 * 获取培训月度记录详情
 */
export function getTrainingMonthly(recordId: number) {
  return api.request({
    url: `${API_BASE}/training-monthly/${recordId}`,
    method: 'get',
  })
}

/**
 * 按年份获取培训月度记录列表
 */
export function getTrainingMonthlyByYear(year: number) {
  return api.request<TrainingMonthlyListResponse>({
    url: `${API_BASE}/training-monthly/by-year/${year}`,
    method: 'get',
  })
}

/**
 * 按年份和岗位获取培训月度记录
 */
export function getTrainingMonthlyByYearPosition(params: {
  year: number
  position: string
}) {
  return api.request<TrainingMonthlyRecord>({
    url: `${API_BASE}/training-monthly/by-year-position`,
    method: 'get',
    params,
  })
}

/**
 * 更新培训月度记录
 */
export function updateTrainingMonthly(recordId: number, data: Partial<TrainingMonthlyRecord>) {
  return api.request({
    url: `${API_BASE}/training-monthly/${recordId}`,
    method: 'put',
    data: {
      记录ID: recordId,
      ...data,
    },
  })
}

/**
 * 保存培训月度记录（创建或更新）
 */
export function saveTrainingMonthly(data: {
  年份: number
  岗位: string
  月度数据: TrainingMonthlyRecord['月度数据']
}) {
  return api.request({
    url: `${API_BASE}/training-monthly/save`,
    method: 'post',
    data,
  })
}

/**
 * 删除培训月度记录
 */
export function deleteTrainingMonthly(recordId: number) {
  return api.request({
    url: `${API_BASE}/training-monthly/${recordId}`,
    method: 'delete',
  })
}
