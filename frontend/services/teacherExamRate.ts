// [教质模块] 教员功能分析 - 班级/教员考试合格率服务
/**
 * 教员功能分析 - 班级/教员考试合格率 服务
 */

import { api } from './api'

export type ExamRateKind = 'class' | 'teacher'

export interface ExamRateRowBackend {
  记录ID?: number
  序号: number
  名称?: string
  m1?: number
  m2?: number
  m3?: number
  m4?: number
  m5?: number
  m6?: number
  m7?: number
  m8?: number
  m9?: number
  m10?: number
  m11?: number
  m12?: number
}

export interface ExamRatePayload {
  神殿名称: string
  年份: number
  行数据: ExamRateRowBackend[]
}

export interface ExamRateResponse {
  神殿名称: string
  年份: number
  行数据: ExamRateRowBackend[]
  创建时间?: string
  更新时间?: string
}

const prefixByKind: Record<ExamRateKind, string> = {
  class: '/teacher-class-exam-pass',
  teacher: '/teacher-teacher-exam-pass',
}

export const getExamRateTable = async (
  kind: ExamRateKind,
  campus: string,
  year: number,
): Promise<ExamRateResponse> => {
  try {
    const res = await api.get<ExamRateResponse>(
      `${prefixByKind[kind]}/${encodeURIComponent(campus)}/${year}`,
    )
    return res.data
  } catch (error: any) {
    if (error.response?.status === 404 || error.response?.status === 500) {
      return { 神殿名称: campus, 年份: year, 行数据: [] }
    }
    throw error
  }
}

export const saveExamRateTable = async (
  kind: ExamRateKind,
  campus: string,
  year: number,
  rows: ExamRateRowBackend[],
): Promise<ExamRateResponse> => {
  const payload: ExamRatePayload = { 神殿名称: campus, 年份: year, 行数据: rows }
  const existing = await getExamRateTable(kind, campus, year)
  if (existing.行数据 && existing.行数据.length > 0) {
    const res = await api.put<ExamRateResponse>(
      `${prefixByKind[kind]}/${encodeURIComponent(campus)}/${year}`,
      { 行数据: rows },
    )
    return res.data
  }
  const res = await api.post<ExamRateResponse>(`${prefixByKind[kind]}/`, payload)
  return res.data
}
