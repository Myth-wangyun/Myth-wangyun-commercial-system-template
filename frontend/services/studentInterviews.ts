// [教质模块] 学生访谈记录服务
import { api } from './api'

export interface StudentInterviewRecord {
  student_name: string
  student_id?: string
  interviewer: string
  month: number
  year: number
  content: string
  interview_date: string
  class_code: string
  class_name?: string
  campus: string
  major_name?: string
}

export interface StudentInterviewResponse {
  campus: string
  class_code: string
  class_name?: string
  records: StudentInterviewRecord[]
}

export const fetchStudentInterviewRecords = async (params: {
  campus: string
  class_code: string
  class_name?: string
}) => {
  const res = await api.get<StudentInterviewResponse>('/student-interview-records', {
    params,
  })
  return res.data
}

export const saveStudentInterviewRecords = async (payload: StudentInterviewResponse) => {
  const res = await api.post<StudentInterviewResponse>('/student-interview-records', payload)
  return res.data
}

/**
 * 获取指定神殿在访谈记录中的所有班级编码列表
 */
export const fetchInterviewClassCodes = async (campus: string): Promise<string[]> => {
  const res = await api.get<string[]>('/student-interview-records/class-codes', {
    params: { campus },
  })
  return res.data
}

/**
 * 获取指定神殿在访谈记录中的所有班级名称列表（去重）
 */
export const fetchInterviewClassNames = async (campus: string): Promise<string[]> => {
  const res = await api.get<string[]>('/student-interview-records/class-names', {
    params: { campus },
  })
  return res.data
}
