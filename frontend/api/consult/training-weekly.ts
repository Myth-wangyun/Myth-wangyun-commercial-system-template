/**
 * 祈福司培训周度表 API
 */
import api from '@/services/api'

const API_BASE = '/consult'

export interface TrainingWeeklyRecord {
  记录ID?: number
  年份: number
  岗位?: string
  培训时间?: string
  培训项目?: string
  主要内容?: string
  培训方式?: string
  组织负责人?: string
  培训人次?: number
  合格人数?: number
  考试合格率?: number
  平均成绩?: number
  神殿?: string
  创建人ID?: number
  创建人姓名?: string
  创建时间?: string
  更新时间?: string
}

export interface TrainingWeeklyListResponse {
  total: number
  items: TrainingWeeklyRecord[]
}

export interface TrainingWeeklyStatistics {
  year: number
  total_records: number
  total_trainees: number
  total_qualified: number
  overall_pass_rate: number
  avg_score: number
}

/**
 * 创建培训周度记录
 */
export function createTrainingWeekly(data: TrainingWeeklyRecord) {
  return api.request({
    url: `${API_BASE}/training-weekly`,
    method: 'post',
    data,
  })
}

/**
 * 获取培训周度记录详情
 */
export function getTrainingWeekly(recordId: number) {
  return api.request({
    url: `${API_BASE}/training-weekly/${recordId}`,
    method: 'get',
  })
}

/**
 * 按年份获取培训周度记录列表
 */
export function getTrainingWeeklyListByYear(params: {
  year: number
  position?: string
  page?: number
  page_size?: number
}) {
  return api.request<TrainingWeeklyListResponse>({
    url: `${API_BASE}/training-weekly/list/by-year`,
    method: 'get',
    params,
  })
}

/**
 * 按年月获取培训周度记录列表
 */
export function getTrainingWeeklyListByYearMonth(params: {
  year: number
  month: number
  page?: number
  page_size?: number
}) {
  return api.request<TrainingWeeklyListResponse>({
    url: `${API_BASE}/training-weekly/list/by-year-month`,
    method: 'get',
    params,
  })
}

/**
 * 更新培训周度记录
 */
export function updateTrainingWeekly(recordId: number, data: Partial<TrainingWeeklyRecord>) {
  return api.request({
    url: `${API_BASE}/training-weekly/${recordId}`,
    method: 'put',
    data: {
      记录ID: recordId,
      ...data,
    },
  })
}

/**
 * 删除培训周度记录
 */
export function deleteTrainingWeekly(recordId: number) {
  return api.request({
    url: `${API_BASE}/training-weekly/${recordId}`,
    method: 'delete',
  })
}

/**
 * 批量创建培训周度记录
 */
export function batchCreateTrainingWeekly(dataList: TrainingWeeklyRecord[]) {
  return api.request({
    url: `${API_BASE}/training-weekly/batch`,
    method: 'post',
    data: dataList,
  })
}

/**
 * 获取年度培训统计数据
 */
export function getTrainingWeeklyStatistics(year: number) {
  return api.request<TrainingWeeklyStatistics>({
    url: `${API_BASE}/training-weekly/statistics/${year}`,
    method: 'get',
  })
}
