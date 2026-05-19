// [教质模块] 教员功能分析 - 项目提交率/项目合格率服务
/**
 * 教员功能分析 - 项目提交率 / 项目合格率 服务
 */

import { api } from './api'

export type ProjectTableKind = 'submission' | 'pass'

export interface ProjectRowBackend {
  记录ID?: number
  序号: number
  姓名?: string
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

export interface ProjectPayload {
  神殿名称: string
  年份: number
  行数据: ProjectRowBackend[]
}

export interface ProjectResponse {
  神殿名称: string
  年份: number
  行数据: ProjectRowBackend[]
  创建时间?: string
  更新时间?: string
}

const prefixByKind: Record<ProjectTableKind, string> = {
  submission: '/teacher-project-submission',
  pass: '/teacher-project-pass',
}

export const getProjectTable = async (
  kind: ProjectTableKind,
  campus: string,
  year: number,
): Promise<ProjectResponse> => {
  try {
    const res = await api.get<ProjectResponse>(
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

export const saveProjectTable = async (
  kind: ProjectTableKind,
  campus: string,
  year: number,
  rows: ProjectRowBackend[],
): Promise<ProjectResponse> => {
  const payload: ProjectPayload = {
    神殿名称: campus,
    年份: year,
    行数据: rows,
  }
  const existing = await getProjectTable(kind, campus, year)
  if (existing.行数据 && existing.行数据.length > 0) {
    const res = await api.put<ProjectResponse>(
      `${prefixByKind[kind]}/${encodeURIComponent(campus)}/${year}`,
      { 行数据: rows },
    )
    return res.data
  }
  const res = await api.post<ProjectResponse>(`${prefixByKind[kind]}/`, payload)
  return res.data
}
