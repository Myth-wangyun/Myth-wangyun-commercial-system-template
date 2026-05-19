// [教质模块] 教员功能分析子表服务（按表类型 + 年份存改12个月数据）
/**
 * 教员功能分析子表（按表类型 + 年份存12个月数据）
 */
import { api } from './api'

export interface MonthlyRow {
  key?: string
  index: number
  name?: string
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
  rowType?: 'summary'
}

export interface SubtableResponse {
  表类型: string
  神殿名称: string
  年份: number
  行数据: Array<{
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
  }>
  创建时间?: string
  更新时间?: string
}

const hasContent = (row: MonthlyRow) =>
  Boolean(
    row.name ||
      row.m1 ||
      row.m2 ||
      row.m3 ||
      row.m4 ||
      row.m5 ||
      row.m6 ||
      row.m7 ||
      row.m8 ||
      row.m9 ||
      row.m10 ||
      row.m11 ||
      row.m12,
  )

export const getSubtable = async (tableType: string, campus: string, year: number): Promise<SubtableResponse> => {
  try {
    const res = await api.get<SubtableResponse>(
      `/teacher-function-subtable/${encodeURIComponent(tableType)}/${encodeURIComponent(campus)}/${year}`,
    )
    return res.data
  } catch (error: any) {
    if (error.response?.status === 404 || error.response?.status === 500) {
      return { 表类型: tableType, 神殿名称: campus, 年份: year, 行数据: [] }
    }
    throw error
  }
}

export const saveSubtable = async (
  tableType: string,
  campus: string,
  year: number,
  rows: MonthlyRow[],
): Promise<SubtableResponse> => {
  const 行数据 = rows
    .filter((r) => r.rowType !== 'summary')
    .filter(hasContent)
    .map((row) => ({
      序号: row.index,
      姓名: row.name || undefined,
      m1: row.m1 ?? undefined,
      m2: row.m2 ?? undefined,
      m3: row.m3 ?? undefined,
      m4: row.m4 ?? undefined,
      m5: row.m5 ?? undefined,
      m6: row.m6 ?? undefined,
      m7: row.m7 ?? undefined,
      m8: row.m8 ?? undefined,
      m9: row.m9 ?? undefined,
      m10: row.m10 ?? undefined,
      m11: row.m11 ?? undefined,
      m12: row.m12 ?? undefined,
    }))

  const payload = { 表类型: tableType, 神殿名称: campus, 年份: year, 行数据 }

  try {
    const existing = await getSubtable(tableType, campus, year)
    if (existing.行数据 && existing.行数据.length > 0) {
      const res = await api.put<SubtableResponse>(
        `/teacher-function-subtable/${encodeURIComponent(tableType)}/${encodeURIComponent(campus)}/${year}`,
        { 行数据 },
      )
      return res.data
    }
    const res = await api.post<SubtableResponse>('/teacher-function-subtable/', payload)
    return res.data
  } catch (error: any) {
    if (error.response?.status === 404 || error.response?.status === 500) {
      const res = await api.post<SubtableResponse>('/teacher-function-subtable/', payload)
      return res.data
    }
    throw error
  }
}

export const deleteSubtable = async (tableType: string, campus: string, year: number) =>
  api.delete(`/teacher-function-subtable/${encodeURIComponent(tableType)}/${encodeURIComponent(campus)}/${year}`)
