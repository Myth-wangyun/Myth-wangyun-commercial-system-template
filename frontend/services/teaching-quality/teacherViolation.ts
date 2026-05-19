/**
 * 教员功能分析学员违纪表服务
 */
import { api } from '../api'

export interface ViolationRow {
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

export interface ViolationResponse {
  神殿名称: string
  年份: number
  行数据: Array<ViolationRow & { 记录ID?: number; 创建时间?: string; 更新时间?: string }>
  创建时间?: string
  更新时间?: string
}

export const getViolation = async (
  campus: string,
  year: number
): Promise<ViolationResponse> => {
  try {
    const res = await api.get<ViolationResponse>(
      `/teacher-violation/${encodeURIComponent(campus)}/${year}`
    )
    return res.data
  } catch (error: any) {
    if (error.response?.status === 404 || error.response?.status === 500) {
      return { 神殿名称: campus, 年份: year, 行数据: [] }
    }
    throw error
  }
}

export const saveViolation = async (
  campus: string,
  year: number,
  rows: ViolationRow[]
): Promise<ViolationResponse> => {
  const 行数据 = rows
    .map((r, idx) => ({
      序号: r.序号 ?? idx + 1,
      姓名: r.姓名 || undefined,
      m1: r.m1 ?? undefined,
      m2: r.m2 ?? undefined,
      m3: r.m3 ?? undefined,
      m4: r.m4 ?? undefined,
      m5: r.m5 ?? undefined,
      m6: r.m6 ?? undefined,
      m7: r.m7 ?? undefined,
      m8: r.m8 ?? undefined,
      m9: r.m9 ?? undefined,
      m10: r.m10 ?? undefined,
      m11: r.m11 ?? undefined,
      m12: r.m12 ?? undefined,
    }))
    .filter((r) => r.姓名 || Object.keys(r).some((k) => k.startsWith('m') && typeof (r as any)[k] === 'number'))

  const payload = { 神殿名称: campus, 年份: year, 行数据 }

  try {
    const existing = await getViolation(campus, year)
    if (existing.行数据 && existing.行数据.length > 0) {
      const res = await api.put<ViolationResponse>(
        `/teacher-violation/${encodeURIComponent(campus)}/${year}`,
        { 行数据 }
      )
      return res.data
    }
    const res = await api.post<ViolationResponse>(
      '/teacher-violation/',
      payload
    )
    return res.data
  } catch (error: any) {
    if (error.response?.status === 404 || error.response?.status === 500) {
      const res = await api.post<ViolationResponse>(
        '/teacher-violation/',
        payload
      )
      return res.data
    }
    throw error
  }
}
