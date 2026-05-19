// 学术模块类型定义

// 教员考试合格率相关类型
export interface InstructorPerformance {
  id: string
  name: string // 姓名
  employmentRate: number // 就业率(%)
  employmentSalary: number // 就业薪资(元)
  reputationCount: number // 口碑人数(人)
  reputationIncome: number // 口碑收入(元)
  newStudentCount: number // 带新生人数(人)
  newStudentLossCount: number // 新生流失人数(人)
  homeworkSubmissionRate: number // 作业提交率(%)
  homeworkPassRate: number // 作业合格率(%)
  examPassRate: number // 考试合格率(%)
  projectSubmissionRate: number // 项目提交率(%)
  projectPassRate: number // 项目合格率(%)
  studentSatisfaction: number // 学员满意度(%)
  studentViolationCount: number // 学员违纪(次)
  supervisorObservationCount: number // 上级听课(次)
  averageScore: number // 教员平均(%)
  createdAt?: string
  updatedAt?: string
}

// 教员考试合格率创建请求
export interface CreateInstructorPerformanceRequest {
  name: string
  employmentRate: number
  employmentSalary: number
  reputationCount: number
  reputationIncome: number
  newStudentCount: number
  newStudentLossCount: number
  homeworkSubmissionRate: number
  homeworkPassRate: number
  examPassRate: number
  projectSubmissionRate: number
  projectPassRate: number
  studentSatisfaction: number
  studentViolationCount: number
  supervisorObservationCount: number
}

// 教员考试合格率更新请求
export interface UpdateInstructorPerformanceRequest {
  id: string
  name?: string
  employmentRate?: number
  employmentSalary?: number
  reputationCount?: number
  reputationIncome?: number
  newStudentCount?: number
  newStudentLossCount?: number
  homeworkSubmissionRate?: number
  homeworkPassRate?: number
  examPassRate?: number
  projectSubmissionRate?: number
  projectPassRate?: number
  studentSatisfaction?: number
  studentViolationCount?: number
  supervisorObservationCount?: number
}

// 教员考试合格率查询参数
export interface InstructorPerformanceQueryParams {
  page?: number
  pageSize?: number
  search?: string
  sortBy?: keyof InstructorPerformance
  sortOrder?: 'asc' | 'desc'
}

// 教员考试合格率分页响应
export interface InstructorPerformancePageResponse<T> {
  list: T[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

// 教员考试合格率统计
export interface InstructorPerformanceStats {
  totalInstructors: number
  averageExamPassRate: number
  averageEmploymentRate: number
  averageStudentSatisfaction: number
  averageScore: number
}

// 作业提交率相关类型
export interface HomeworkSubmission {
  id: string
  name: string // 姓名
  january: number // 1月
  february: number // 2月
  march: number // 3月
  april: number // 4月
  may: number // 5月
  june: number // 6月
  july: number // 7月
  august: number // 8月
  september: number // 9月
  october: number // 10月
  november: number // 11月
  december: number // 12月
  average: number // 教员平均
  year: number // 年份
  createdAt?: string
  updatedAt?: string
}

// 作业提交率创建请求
export interface CreateHomeworkSubmissionRequest {
  name: string
  january: number
  february: number
  march: number
  april: number
  may: number
  june: number
  july: number
  august: number
  september: number
  october: number
  november: number
  december: number
  year: number
}

// 作业提交率更新请求
export interface UpdateHomeworkSubmissionRequest {
  id: string
  name?: string
  january?: number
  february?: number
  march?: number
  april?: number
  may?: number
  june?: number
  july?: number
  august?: number
  september?: number
  october?: number
  november?: number
  december?: number
  year?: number
}

// 作业提交率查询参数
export interface HomeworkSubmissionQueryParams {
  page?: number
  pageSize?: number
  search?: string
  year?: number
  sortBy?: keyof HomeworkSubmission
  sortOrder?: 'asc' | 'desc'
}

// 作业提交率分页响应
export interface HomeworkSubmissionPageResponse<T> {
  list: T[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

// 作业提交率统计
export interface HomeworkSubmissionStats {
  totalInstructors: number
  averageSubmissionRate: number
  year: number
  monthlyAverages: {
    january: number
    february: number
    march: number
    april: number
    may: number
    june: number
    july: number
    august: number
    september: number
    october: number
    november: number
    december: number
  }
}

// 作业合格率相关类型
export interface HomeworkPassRate {
  id: string
  name: string // 姓名
  january: number // 1月
  february: number // 2月
  march: number // 3月
  april: number // 4月
  may: number // 5月
  june: number // 6月
  july: number // 7月
  august: number // 8月
  september: number // 9月
  october: number // 10月
  november: number // 11月
  december: number // 12月
  average: number // 教员平均
  year: number // 年份
  createdAt?: string
  updatedAt?: string
}

// 作业合格率创建请求
export interface CreateHomeworkPassRateRequest {
  name: string
  january: number
  february: number
  march: number
  april: number
  may: number
  june: number
  july: number
  august: number
  september: number
  october: number
  november: number
  december: number
  year: number
}

// 作业合格率更新请求
export interface UpdateHomeworkPassRateRequest {
  id: string
  name?: string
  january?: number
  february?: number
  march?: number
  april?: number
  may?: number
  june?: number
  july?: number
  august?: number
  september?: number
  october?: number
  november?: number
  december?: number
  year?: number
}

// 作业合格率查询参数
export interface HomeworkPassRateQueryParams {
  page?: number
  pageSize?: number
  search?: string
  year?: number
  sortBy?: keyof HomeworkPassRate
  sortOrder?: 'asc' | 'desc'
}

// 作业合格率分页响应
export interface HomeworkPassRatePageResponse<T> {
  list: T[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

// 作业合格率统计
export interface HomeworkPassRateStats {
  totalInstructors: number
  averagePassRate: number
  year: number
  monthlyAverages: {
    january: number
    february: number
    march: number
    april: number
    may: number
    june: number
    july: number
    august: number
    september: number
    october: number
    november: number
    december: number
  }
}

// 默认教员考试合格率数据
export const DEFAULT_INSTRUCTOR_PERFORMANCE: CreateInstructorPerformanceRequest = {
  name: '',
  employmentRate: 0,
  employmentSalary: 0,
  reputationCount: 0,
  reputationIncome: 0,
  newStudentCount: 0,
  newStudentLossCount: 0,
  homeworkSubmissionRate: 0,
  homeworkPassRate: 0,
  examPassRate: 0,
  projectSubmissionRate: 0,
  projectPassRate: 0,
  studentSatisfaction: 0,
  studentViolationCount: 0,
  supervisorObservationCount: 0,
}

// 默认作业提交率数据
export const DEFAULT_HOMEWORK_SUBMISSION: CreateHomeworkSubmissionRequest = {
  name: '',
  january: 0,
  february: 0,
  march: 0,
  april: 0,
  may: 0,
  june: 0,
  july: 0,
  august: 0,
  september: 0,
  october: 0,
  november: 0,
  december: 0,
  year: new Date().getFullYear(),
}

// 默认作业合格率数据
export const DEFAULT_HOMEWORK_PASS_RATE: CreateHomeworkPassRateRequest = {
  name: '',
  january: 0,
  february: 0,
  march: 0,
  april: 0,
  may: 0,
  june: 0,
  july: 0,
  august: 0,
  september: 0,
  october: 0,
  november: 0,
  december: 0,
  year: new Date().getFullYear(),
}

// 月份选项
export const MONTH_OPTIONS = [
  { value: 1, label: '1月' },
  { value: 2, label: '2月' },
  { value: 3, label: '3月' },
  { value: 4, label: '4月' },
  { value: 5, label: '5月' },
  { value: 6, label: '6月' },
  { value: 7, label: '7月' },
  { value: 8, label: '8月' },
  { value: 9, label: '9月' },
  { value: 10, label: '10月' },
  { value: 11, label: '11月' },
  { value: 12, label: '12月' },
]

// 月份字段映射
export const MONTH_FIELD_MAP: Record<number, keyof HomeworkSubmission> = {
  1: 'january',
  2: 'february',
  3: 'march',
  4: 'april',
  5: 'may',
  6: 'june',
  7: 'july',
  8: 'august',
  9: 'september',
  10: 'october',
  11: 'november',
  12: 'december',
}
